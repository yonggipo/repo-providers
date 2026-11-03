// 워크스페이스 멤버 응답 중 리뷰어를 찾는 데 쓰는 칸
export interface BitbucketMember {
  uuid: string;
  account_id?: string;
  nickname?: string;
  display_name?: string;
}

// PR 요청 본문의 리뷰어 하나, 둘 중 하나만 채운다
export type BitbucketReviewer = { uuid: string } | { account_id: string };

// 멤버를 조회하지 않고 그대로 넣을 수 있는 사용자 ID 인지, `{uuid}` 나 account_id 모양이면 ID 로 본다
// account_id 는 24자리 16진수나 `557058:` 같은 숫자 접두어가 붙은 모양이다
export function isUserId(name: string): boolean {
  return /^\{[0-9a-f-]+\}$/i.test(name) || /^[0-9a-f]{24}$/i.test(name) || /^\d+:[0-9a-f-]+$/i.test(name);
}

// 설정에 적은 리뷰어를 PR 요청 본문의 리뷰어로 바꾼다
// Bitbucket API 는 이메일로 사람을 찾지 못하므로 ID 가 아니면 닉네임, 표시 이름 순서로 멤버에서 찾는다
// PR 을 여는 계정을 알면 그 계정은 리뷰어가 될 수 없어 skipped 로 빼고, 찾지 못한 이름이 하나라도 있으면 던진다
export function resolveReviewers(
  names: string[],
  members: BitbucketMember[],
  author: { uuid: string; account_id?: string } | undefined,
): { reviewers: BitbucketReviewer[]; skipped: string[] } {
  const reviewers: BitbucketReviewer[] = [];
  const seen = new Set<string>();
  const skipped: string[] = [];
  const unknown: string[] = [];
  for (const name of names) {
    const id = toReviewer(name, members);
    if (!id) {
      unknown.push(name);
      continue;
    }
    const value = "uuid" in id ? id.uuid : id.account_id;
    if (author && (value === author.uuid || value === author.account_id)) skipped.push(name);
    else if (!seen.has(value)) {
      seen.add(value);
      reviewers.push(id);
    }
  }
  if (unknown.length > 0) {
    throw new Error(`워크스페이스 멤버에서 리뷰어를 찾지 못했습니다: ${unknown.join(", ")}, 닉네임이나 표시 이름, account_id 를 확인합니다`);
  }
  return { reviewers, skipped };
}

function toReviewer(name: string, members: BitbucketMember[]): BitbucketReviewer | undefined {
  if (name.startsWith("{") && isUserId(name)) return { uuid: name };
  if (isUserId(name)) {
    // 멤버 목록이 있으면 uuid 로 바꿔 두어, 같은 사람을 이름으로도 적었을 때 한 번만 넣는다
    const member = members.find((m) => m.account_id === name);
    return member ? { uuid: member.uuid } : { account_id: name };
  }
  const lower = name.toLowerCase();
  const member =
    members.find((m) => m.nickname?.toLowerCase() === lower) ?? members.find((m) => m.display_name?.toLowerCase() === lower);
  return member ? { uuid: member.uuid } : undefined;
}
