export declare const SHARED_TOKEN_SERVICE = "bitbucket-api-token";
export interface BitbucketCredentials {
    email?: string;
    token: string;
}
export declare function loadBitbucketCredentials(appService: string): Promise<BitbucketCredentials | null>;
export declare function saveBitbucketCredentials(appService: string, credentials: BitbucketCredentials): Promise<void>;
export declare function deleteBitbucketCredentials(appService: string): Promise<boolean>;
