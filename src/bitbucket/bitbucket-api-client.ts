import type { Repo, RepoProvider } from "../repo-provider.ts";
import { BitbucketApiError } from "./bitbucket-api-error.ts";
import type { BitbucketCredentials } from "./bitbucket-credential-store.ts";
import { buildBitbucketGitAuthEnv } from "./bitbucket-git-auth.ts";
import { type BitbucketRawRepo, toRepo } from "./bitbucket-repo-mapper.ts";

const API = "https://api.bitbucket.org/2.0";

// Bitbucket Cloud API 로 계정, 워크스페이스, 레포를 조회한다
export class BitbucketApiClient implements RepoProvider {
  readonly id = "bitbucket";
  private readonly credentials: BitbucketCredentials;
  private readonly fetchImpl: typeof fetch;

  // 테스트에서는 fetchImpl 에 가짜 fetch 를 넣는다
  constructor(credentials: BitbucketCredentials, fetchImpl: typeof fetch = fetch) {
    this.credentials = credentials;
    this.fetchImpl = fetchImpl;
  }

  // MARK: - 조회

  // 토큰이 살아 있는지 확인할 때도 쓴다
  async currentUserName(): Promise<string> {
    const user = await this.get<{ display_name: string }>(`${API}/user`);
    return user.display_name;
  }

  // 계정이 속한 워크스페이스 이름을 가나다순으로 준다
  async listOwners(): Promise<string[]> {
    const access = await this.getAll<{ workspace: { slug: string } }>(`${API}/user/workspaces?pagelen=100`);
    return access.map((a) => a.workspace.slug).sort();
  }

  // 워크스페이스 안에서 내가 볼 수 있는 레포를 최근에 고친 순서로 준다
  async listRepos(workspace: string): Promise<Repo[]> {
    const raw = await this.getAll<BitbucketRawRepo>(
      `${API}/repositories/${encodeURIComponent(workspace)}?role=member&sort=-updated_on&pagelen=100`,
    );
    return raw.map((r) => toRepo(workspace, r));
  }

  // 레포의 브랜치 이름을 최근에 커밋한 순서로 준다
  async listBranches(repo: Repo): Promise<string[]> {
    const branches = await this.getAll<{ name: string }>(
      `${API}/repositories/${repo.fullName}/refs/branches?sort=-target.date&pagelen=100`,
    );
    return branches.map((b) => b.name);
  }

  // git 은 API 와 다른 사용자 이름을 요구해서 따로 만든다
  gitAuthEnv(): NodeJS.ProcessEnv {
    return buildBitbucketGitAuthEnv(this.credentials.token);
  }

  // MARK: - 요청

  // API 는 Atlassian 계정 이메일과 토큰으로 Basic 인증한다
  private async get<T>(url: string): Promise<T> {
    const { email, token } = this.credentials;
    const res = await this.fetchImpl(url, {
      headers: {
        Authorization: "Basic " + Buffer.from(`${email}:${token}`).toString("base64"),
        Accept: "application/json",
      },
    });
    if (!res.ok) throw new BitbucketApiError(res.status, await res.text());
    return (await res.json()) as T;
  }

  // 응답의 next 링크를 따라 끝 페이지까지 모은다
  private async getAll<T>(firstUrl: string): Promise<T[]> {
    const items: T[] = [];
    let url: string | undefined = firstUrl;
    while (url) {
      const page: { values: T[]; next?: string } = await this.get(url);
      items.push(...page.values);
      url = page.next;
    }
    return items;
  }
}
