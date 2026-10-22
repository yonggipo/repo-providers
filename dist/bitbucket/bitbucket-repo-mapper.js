// Bitbucket 응답을 공통 Repo 모양으로 바꾼다
export function toRepo(workspace, raw) {
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
export function bitbucketCloneUrl(fullName) {
    return `https://bitbucket.org/${fullName}.git`;
}
