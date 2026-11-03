export interface BitbucketMember {
    uuid: string;
    account_id?: string;
    nickname?: string;
    display_name?: string;
}
export type BitbucketReviewer = {
    uuid: string;
} | {
    account_id: string;
};
export declare function isUserId(name: string): boolean;
export declare function resolveReviewers(names: string[], members: BitbucketMember[], author: {
    uuid: string;
    account_id?: string;
} | undefined): {
    reviewers: BitbucketReviewer[];
    skipped: string[];
};
