import type { PullRequestRequest, PullRequestResult, Repo, RepoProvider } from "../repo-provider.ts";
import type { BitbucketCredentials } from "./bitbucket-credential-store.ts";
export declare class BitbucketApiClient implements RepoProvider {
    readonly id = "bitbucket";
    private readonly credentials;
    private readonly fetchImpl;
    constructor(credentials: BitbucketCredentials, fetchImpl?: typeof fetch);
    currentUserName(): Promise<string>;
    listOwners(): Promise<string[]>;
    listRepos(workspace: string): Promise<Repo[]>;
    listBranches(repo: Repo): Promise<string[]>;
    gitAuthEnv(): NodeJS.ProcessEnv;
    openPullRequest(request: PullRequestRequest): Promise<PullRequestResult>;
    private listMembers;
    private currentUserIds;
    private get;
    private send;
    private getAll;
}
