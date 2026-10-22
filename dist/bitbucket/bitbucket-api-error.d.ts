export declare class BitbucketApiError extends Error {
    readonly status: number;
    constructor(status: number, body: string);
}
