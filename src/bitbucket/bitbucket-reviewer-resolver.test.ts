import assert from "node:assert/strict";
import { test } from "node:test";
import { isUserId, resolveReviewers } from "./bitbucket-reviewer-resolver.ts";

const members = [
  { uuid: "{a1}", account_id: "aaaaaaaaaaaaaaaaaaaaaaaa", nickname: "alice", display_name: "앨리스" },
  { uuid: "{b2}", account_id: "557058:b2", nickname: "bob", display_name: "밥" },
];

test("{uuid} 와 account_id 모양은 사용자 ID 로 보고, 닉네임은 ID 로 보지 않는다", () => {
  assert.equal(isUserId("{0b6c-11ef}"), true);
  assert.equal(isUserId("5b10ac8d82e05b22cc7d4ef5"), true);
  assert.equal(isUserId("557058:0b6c-11ef"), true);
  assert.equal(isUserId("alice"), false);
  assert.equal(isUserId("{alice}"), false);
});

test("멤버 목록 없이도 사용자 ID 는 그대로 리뷰어로 넣는다", () => {
  assert.deepEqual(resolveReviewers(["{a1}", "557058:b2"], [], undefined).reviewers, [{ uuid: "{a1}" }, { account_id: "557058:b2" }]);
});

test("닉네임과 표시 이름은 멤버 목록에서 uuid 를 찾는다", () => {
  assert.deepEqual(resolveReviewers(["Alice", "밥"], members, undefined).reviewers, [{ uuid: "{a1}" }, { uuid: "{b2}" }]);
});

test("같은 사람을 이름과 account_id 로 두 번 적어도 한 번만 넣는다", () => {
  assert.deepEqual(resolveReviewers(["alice", "aaaaaaaaaaaaaaaaaaaaaaaa"], members, undefined).reviewers, [{ uuid: "{a1}" }]);
});

test("PR 을 여는 계정을 알면 리뷰어에서 빼고 skipped 로 알려 준다", () => {
  assert.deepEqual(resolveReviewers(["alice", "bob"], members, { uuid: "{a1}" }), { reviewers: [{ uuid: "{b2}" }], skipped: ["alice"] });
});

test("찾지 못한 이름이 있으면 그 이름을 담아 던진다", () => {
  assert.throws(() => resolveReviewers(["alice", "carol"], members, undefined), /carol/);
});
