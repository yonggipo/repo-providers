import type { Repo } from "../repo-provider.ts";

// Bitbucket API 가 주는 레포 응답 중 쓰는 칸
export interface BitbucketRawRepo {
  slug: string;
  full_name: string;
  description?: string;
  language?: string;
  is_private: boolean;
  updated_on: string;
  mainbranch?: { name: string } | null;
}

// Bitbucket 응답을 공통 Repo 모양으로 바꾼다
export function toRepo(workspace: string, raw: BitbucketRawRepo): Repo {
  return {
    owner: workspace,
    slug: raw.slug,
    fullName: raw.full_name,
    description: raw.description ?? "",
    language: raw.language ?? "",
    mainBranch: raw.mainbranch?.name ?? null,
    updatedOn: raw.updated_on,
    isPrivate: raw.is_private,
    cloneUrl: bitbucketCloneUrl(raw.full_name),
  };
}

// 응답의 clone 주소에는 사용자 이름이 붙어 오므로 직접 만든다, 인증은 헤더로 한다
export function bitbucketCloneUrl(fullName: string): string {
  return `https://bitbucket.org/${fullName}.git`;
}
