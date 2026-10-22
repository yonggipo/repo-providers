export interface RepoSyncTarget {
    cloneUrl: string;
    branch: string;
    path: string;
}
export interface RepoSyncResult {
    path: string;
    action: "cloned" | "updated";
    branch: string;
    commit: string;
}
export declare function syncRepo(target: RepoSyncTarget, authEnv: NodeJS.ProcessEnv): Promise<RepoSyncResult>;
