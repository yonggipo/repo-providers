import assert from "node:assert/strict";
import { test } from "node:test";
import { buildBitbucketGitAuthEnv } from "./bitbucket-git-auth.ts";

test("고정 사용자 이름과 토큰을 bitbucket.org 전용 헤더로 넘긴다", () => {
  const env = buildBitbucketGitAuthEnv("secret");
  const basic = Buffer.from("x-bitbucket-api-token-auth:secret").toString("base64");

  assert.equal(env.GIT_CONFIG_KEY_0, "http.https://bitbucket.org/.extraHeader");
  assert.equal(env.GIT_CONFIG_VALUE_0, `Authorization: Basic ${basic}`);
  assert.equal(env.GIT_TERMINAL_PROMPT, "0");
});
