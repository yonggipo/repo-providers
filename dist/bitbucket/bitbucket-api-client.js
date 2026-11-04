import { BitbucketApiError } from "./bitbucket-api-error.js";
import { ACCESS_TOKEN_GIT_USERNAME, buildBitbucketGitAuthEnv } from "./bitbucket-git-auth.js";
import { toRepo } from "./bitbucket-repo-mapper.js";
import { isUserId, resolveReviewers } from "./bitbucket-reviewer-resolver.js";
const API = "https://api.bitbucket.org/2.0";
// Bitbucket Cloud API 로 계정, 워크스페이스, 레포를 조회하고 PR 을 연다
export class BitbucketApiClient {
    id = "bitbucket";
    credentials;
    fetchImpl;
    // 테스트에서는 fetchImpl 에 가짜 fetch 를 넣는다
    constructor(credentials, fetchImpl = fetch) {
        this.credentials = credentials;
        this.fetchImpl = fetchImpl;
    }
    // MARK: - 조회
    // 토큰이 살아 있는지 확인할 때도 쓴다
    async currentUserName() {
        const user = await this.get(`${API}/user`);
        return user.display_name;
    }
    // 계정이 속한 워크스페이스 이름을 가나다순으로 준다
    async listOwners() {
        const access = await this.getAll(`${API}/user/workspaces?pagelen=100`);
        return access.map((a) => a.workspace.slug).sort();
    }
    // 워크스페이스 안에서 내가 볼 수 있는 레포를 최근에 고친 순서로 준다
    async listRepos(workspace) {
        const raw = await this.getAll(`${API}/repositories/${encodeURIComponent(workspace)}?role=member&sort=-updated_on&pagelen=100`);
        return raw.map((r) => toRepo(workspace, r));
    }
    // 레포의 브랜치 이름을 최근에 커밋한 순서로 준다
    async listBranches(repo) {
        const branches = await this.getAll(`${API}/repositories/${repo.fullName}/refs/branches?sort=-target.date&pagelen=100`);
        return branches.map((b) => b.name);
    }
    // git 은 API 와 다른 사용자 이름을 요구해서 따로 만든다
    gitAuthEnv() {
        const { email, token } = this.credentials;
        return email ? buildBitbucketGitAuthEnv(token) : buildBitbucketGitAuthEnv(token, ACCESS_TOKEN_GIT_USERNAME);
    }
    // MARK: - PR
    // 리뷰어는 PR 을 보내기 전에 모두 사용자 ID 로 바꿔, 하나라도 못 찾으면 PR 을 건드리지 않는다
    // 리뷰어를 모두 ID 로 적으면 멤버를 조회하지 않으므로 토큰에 read:workspace 권한이 없어도 된다
    async openPullRequest(request) {
        const base = `${API}/repositories/${request.repo}/pullrequests`;
        const workspace = request.repo.split("/")[0];
        const needsLookup = request.reviewers.some((r) => !isUserId(r));
        const [author, members] = await Promise.all([this.currentUserIds(), needsLookup ? this.listMembers(workspace) : []]);
        const { reviewers, skipped } = resolveReviewers(request.reviewers, members, author);
        const body = {
            title: request.title,
            description: request.description,
            source: { branch: { name: request.source } },
            destination: { branch: { name: request.destination } },
            reviewers,
            close_source_branch: true,
        };
        const query = encodeURIComponent(`source.branch.name="${request.source}" AND state="OPEN"`);
        const open = await this.get(`${base}?q=${query}`);
        const existing = open.values[0];
        const pr = existing
            ? await this.send("PUT", `${base}/${existing.id}`, body)
            : await this.send("POST", base, body);
        return { id: pr.id, url: pr.links.html.href, created: !existing, skippedReviewers: skipped };
    }
    async listMembers(workspace) {
        try {
            const members = await this.getAll(`${API}/workspaces/${encodeURIComponent(workspace)}/members?pagelen=100`);
            return members.map((m) => m.user);
        }
        catch (e) {
            if (e instanceof BitbucketApiError && e.status === 403) {
                throw new Error("리뷰어를 이름으로 찾으려면 토큰에 read:workspace 권한이 있어야 합니다, 권한을 더하거나 리뷰어를 {uuid} 나 account_id 로 적습니다");
            }
            throw e;
        }
    }
    // PR 을 여는 계정의 ID, 토큰에 계정 읽기 권한이 없으면 undefined 이고 그때는 리뷰어에서 빼지 못한다
    async currentUserIds() {
        try {
            return await this.get(`${API}/user`);
        }
        catch (e) {
            if (e instanceof BitbucketApiError && e.status === 403)
                return undefined;
            throw e;
        }
    }
    // MARK: - 요청
    async get(url) {
        return this.send("GET", url);
    }
    // 계정 API 토큰은 이메일과 토큰으로 Basic 인증하고, 접근 토큰은 Bearer 로 보낸다
    async send(method, url, body) {
        const { email, token } = this.credentials;
        const headers = {
            Authorization: email ? "Basic " + Buffer.from(`${email}:${token}`).toString("base64") : `Bearer ${token}`,
            Accept: "application/json",
        };
        if (body !== undefined)
            headers["Content-Type"] = "application/json";
        const res = await this.fetchImpl(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
        if (!res.ok)
            throw new BitbucketApiError(res.status, await res.text());
        return (await res.json());
    }
    // 응답의 next 링크를 따라 끝 페이지까지 모은다
    async getAll(firstUrl) {
        const items = [];
        let url = firstUrl;
        while (url) {
            const page = await this.get(url);
            items.push(...page.values);
            url = page.next;
        }
        return items;
    }
}
