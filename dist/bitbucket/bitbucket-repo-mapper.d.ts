import type { Repo } from "../repo-provider.ts";
export interface BitbucketRawRepo {
    slug: string;
    full_name: string;
    description?: string;
    language?: string;
    is_private: boolean;
    updated_on: string;
    mainbranch?: {
        name: string;
    } | null;
}
export declare function toRepo(workspace: string, raw: BitbucketRawRepo): Repo;
export declare function bitbucketCloneUrl(fullName: string): string;
