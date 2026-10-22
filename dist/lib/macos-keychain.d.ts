export declare function saveSecret(service: string, account: string, value: string): Promise<void>;
export declare function loadSecret(service: string, account: string): Promise<string | null>;
export declare function loadRawSecret(service: string, account: string): Promise<string | null>;
export declare function findAccount(service: string): Promise<string | null>;
export declare function deleteSecret(service: string, account: string): Promise<boolean>;
