import assert from "node:assert/strict";
import { test } from "node:test";
import { BitbucketApiClient } from "./bitbucket-api-client.ts";
import { BitbucketApiError } from "./bitbucket-api-error.ts";

const API = "https://api.bitbucket.org/2.0";
const credentials = { email: "me@example.com", token: "secret" };

// 주소별로 정해 둔 응답을 돌려주는 가짜 fetch, 받은 요청은 seen 에 쌓는다
function fakeFetch(routes: Record<string, { status?: number; body: unknown }>, seen: Request[] = []): typeof fetch {
  return (async (url: string | URL | Request, init?: RequestInit) => {
    const request = new Request(url, init);
    seen.push(request);
    const route = routes[request.url];
    if (!route) return new Response("not found", { status: 404 });
    return new Response(JSON.stringify(route.body), { status: route.status ?? 200 });
  }) as typeof fetch;
}

test("API 요청에 이메일과 토큰으로 Basic 인증 헤더를 붙인다", async () => {
  const seen: Request[] = [];
  const client = new BitbucketApiClient(
    credentials,
    fakeFetch({ [`${API}/user`]: { body: { display_name: "나" } } }, seen),
  );

  assert.equal(await client.currentUserName(), "나");
  const expected = "Basic " + Buffer.from("me@example.com:secret").toString("base64");
  assert.equal(seen[0]!.headers.get("authorization"), expected);
});

test("워크스페이스 목록은 next 링크를 따라 모든 페이지를 모아 가나다순으로 준다", async () => {
  const first = `${API}/user/workspaces?pagelen=100`;
  const second = `${API}/user/workspaces?pagelen=100&page=2`;
  const client = new BitbucketApiClient(
    credentials,
    fakeFetch({
      [first]: { body: { values: [{ workspace: { slug: "zeta" } }], next: second } },
      [second]: { body: { values: [{ workspace: { slug: "alpha" } }] } },
    }),
  );

  assert.deepEqual(await client.listOwners(), ["alpha", "zeta"]);
});

test("레포 목록은 최근에 고친 순서로 요청한다", async () => {
  const url = `${API}/repositories/team?role=member&sort=-updated_on&pagelen=100`;
  const raw = { slug: "app", full_name: "team/app", is_private: true, updated_on: "2026-10-01T00:00:00Z" };
  const client = new BitbucketApiClient(credentials, fakeFetch({ [url]: { body: { values: [raw] } } }));

  const repos = await client.listRepos("team");
  assert.equal(repos.length, 1);
  assert.equal(repos[0]!.owner, "team");
});

test("401 응답은 상태 코드를 담은 BitbucketApiError 로 던진다", async () => {
  const client = new BitbucketApiClient(credentials, fakeFetch({ [`${API}/user`]: { status: 401, body: {} } }));

  await assert.rejects(client.currentUserName(), (err) => err instanceof BitbucketApiError && err.status === 401);
});

// MARK: - PR

const PRS = `${API}/repositories/team/docs/pullrequests`;
const openQuery = `${PRS}?q=${encodeURIComponent('source.branch.name="docs/update" AND state="OPEN"')}`;
const members = {
  values: [
    { user: { uuid: "{me}", nickname: "me" } },
    { user: { uuid: "{kim}", nickname: "kim", display_name: "김리뷰" } },
  ],
};
const prRequest = {
  repo: "team/docs",
  source: "docs/update",
  destination: "main",
  title: "제목",
  description: "본문",
  reviewers: ["kim", "me"],
};

// 같은 주소라도 메서드마다 다른 응답을 주는 가짜 fetch, 키는 `메서드 주소`
// 값이 숫자면 그 상태 코드로 실패 응답을 준다
function methodFetch(routes: Record<string, unknown>, seen: Request[]): typeof fetch {
  return (async (url: string | URL | Request, init?: RequestInit) => {
    const request = new Request(url, init);
    seen.push(request);
    const body = routes[`${request.method} ${request.url}`];
    if (body === undefined) return new Response("not found", { status: 404 });
    if (typeof body === "number") return new Response("denied", { status: body });
    return new Response(JSON.stringify(body), { status: 200 });
  }) as typeof fetch;
}

test("열린 PR 이 없으면 리뷰어를 uuid 로 바꿔 새 PR 을 만들고, PR 을 여는 계정은 리뷰어에서 뺀다", async () => {
  const seen: Request[] = [];
  const client = new BitbucketApiClient(
    credentials,
    methodFetch(
      {
        [`GET ${API}/user`]: { uuid: "{me}" },
        [`GET ${API}/workspaces/team/members?pagelen=100`]: members,
        [`GET ${openQuery}`]: { values: [] },
        [`POST ${PRS}`]: { id: 7, links: { html: { href: "https://bitbucket.org/team/docs/pull-requests/7" } } },
      },
      seen,
    ),
  );

  const result = await client.openPullRequest(prRequest);
  assert.deepEqual(result, { id: 7, url: "https://bitbucket.org/team/docs/pull-requests/7", created: true, skippedReviewers: ["me"] });
  const post = seen.find((r) => r.method === "POST")!;
  const sent = await post.json();
  assert.deepEqual(sent.reviewers, [{ uuid: "{kim}" }]);
  assert.equal(sent.close_source_branch, true);
  assert.equal(sent.source.branch.name, "docs/update");
  assert.equal(sent.destination.branch.name, "main");
});

test("같은 브랜치의 열린 PR 이 있으면 새로 만들지 않고 그 PR 을 고친다", async () => {
  const seen: Request[] = [];
  const client = new BitbucketApiClient(
    credentials,
    methodFetch(
      {
        [`GET ${API}/user`]: { uuid: "{me}" },
        [`GET ${API}/workspaces/team/members?pagelen=100`]: members,
        [`GET ${openQuery}`]: { values: [{ id: 3 }] },
        [`PUT ${PRS}/3`]: { id: 3, links: { html: { href: "https://bitbucket.org/team/docs/pull-requests/3" } } },
      },
      seen,
    ),
  );

  const result = await client.openPullRequest(prRequest);
  assert.equal(result.created, false);
  assert.equal(result.id, 3);
  assert.ok(!seen.some((r) => r.method === "POST"));
});

test("찾지 못한 리뷰어가 있으면 PR 을 만들거나 고치지 않고 던진다", async () => {
  const seen: Request[] = [];
  const client = new BitbucketApiClient(
    credentials,
    methodFetch(
      {
        [`GET ${API}/user`]: { uuid: "{me}" },
        [`GET ${API}/workspaces/team/members?pagelen=100`]: members,
      },
      seen,
    ),
  );

  await assert.rejects(client.openPullRequest({ ...prRequest, reviewers: ["park"] }), /park/);
  assert.ok(!seen.some((r) => r.method !== "GET"));
});

test("리뷰어를 사용자 ID 로만 적으면 멤버를 조회하지 않고, 계정 읽기 권한이 없어도 PR 을 연다", async () => {
  const seen: Request[] = [];
  const client = new BitbucketApiClient(
    credentials,
    methodFetch(
      {
        [`GET ${API}/user`]: 403,
        [`GET ${openQuery}`]: { values: [] },
        [`POST ${PRS}`]: { id: 8, links: { html: { href: "https://bitbucket.org/team/docs/pull-requests/8" } } },
      },
      seen,
    ),
  );

  const result = await client.openPullRequest({ ...prRequest, reviewers: ["{0b6c}", "557058:ab12"] });
  assert.equal(result.created, true);
  assert.ok(!seen.some((r) => r.url.includes("/members")));
  const sent = await seen.find((r) => r.method === "POST")!.json();
  assert.deepEqual(sent.reviewers, [{ uuid: "{0b6c}" }, { account_id: "557058:ab12" }]);
});

test("이름으로 적었는데 멤버를 읽을 권한이 없으면 필요한 권한을 알려 주며 멈춘다", async () => {
  const client = new BitbucketApiClient(
    credentials,
    methodFetch({ [`GET ${API}/user`]: 403, [`GET ${API}/workspaces/team/members?pagelen=100`]: 403 }, []),
  );
  await assert.rejects(client.openPullRequest(prRequest), /read:workspace/);
});
