export type RepoProviderId = "bitbucket" | "github";
export interface Repo {
    owner: string;
    slug: string;
    fullName: string;
    description: string;
    language: string;
    mainBranch: string | null;
    updatedOn: string;
    isPrivate: boolean;
    cloneUrl: string;
}
export interface RepoProvider {
    readonly id: RepoProviderId;
    currentUserName(): Promise<string>;
    listOwners(): Promise<string[]>;
    listRepos(owner: string): Promise<Repo[]>;
    listBranches(repo: Repo): Promise<string[]>;
    gitAuthEnv(): NodeJS.ProcessEnv;
    openPullRequest(request: PullRequestRequest): Promise<PullRequestResult>;
}
export interface PullRequestRequest {
    repo: string;
    source: string;
    destination: string;
    title: string;
    description: string;
    reviewers: string[];
}
export interface PullRequestResult {
    id: number;
    url: string;
    created: boolean;
    skippedReviewers: string[];
}
