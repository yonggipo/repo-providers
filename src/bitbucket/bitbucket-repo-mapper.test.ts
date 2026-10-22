import assert from "node:assert/strict";
import { test } from "node:test";
import { toRepo } from "./bitbucket-repo-mapper.ts";

test("clone 주소에는 사용자 이름을 넣지 않는다", () => {
  const repo = toRepo("team", {
    slug: "app",
    full_name: "team/app",
    is_private: true,
    updated_on: "2026-10-01T00:00:00Z",
    mainbranch: { name: "develop" },
  });

  assert.equal(repo.cloneUrl, "https://bitbucket.org/team/app.git");
  assert.equal(repo.mainBranch, "develop");
});

test("응답에 없는 설명과 언어는 빈 문자열로 채운다", () => {
  const repo = toRepo("team", { slug: "app", full_name: "team/app", is_private: false, updated_on: "" });

  assert.equal(repo.description, "");
  assert.equal(repo.language, "");
  assert.equal(repo.mainBranch, null);
});
