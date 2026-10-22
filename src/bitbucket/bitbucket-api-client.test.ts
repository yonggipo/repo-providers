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
