import { deleteSecret, findAccount, loadRawSecret, loadSecret, saveSecret } from "../lib/macos-keychain.js";
const KEYCHAIN_ACCOUNT = "bitbucket";
// 사용자가 다른 도구용으로 저장해 둔 Bitbucket 토큰 항목, 계정 이름이 이메일이다
export const SHARED_TOKEN_SERVICE = "bitbucket-api-token";
// appService 는 앱마다 다른 키체인 서비스 이름이다, 앱이 저장한 연동을 먼저 읽고 없으면 공용 토큰을 읽는다
export async function loadBitbucketCredentials(appService) {
    return (await loadOwnCredentials(appService)) ?? (await loadSharedCredentials());
}
// 키체인에 저장한다, 이미 있으면 덮어쓴다
export async function saveBitbucketCredentials(appService, credentials) {
    await saveSecret(appService, KEYCHAIN_ACCOUNT, JSON.stringify(credentials));
}
// 앱이 저장한 연동만 지운다, 공용 토큰은 다른 도구도 쓰므로 건드리지 않는다
export async function deleteBitbucketCredentials(appService) {
    return deleteSecret(appService, KEYCHAIN_ACCOUNT);
}
// 앱이 저장한 값은 JSON 이다, 깨졌으면 없는 것으로 본다
async function loadOwnCredentials(appService) {
    const raw = await loadSecret(appService, KEYCHAIN_ACCOUNT);
    if (!raw)
        return null;
    try {
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
}
// 공용 토큰 항목은 계정 이름이 이메일이고 값이 토큰 그대로다
async function loadSharedCredentials() {
    const email = await findAccount(SHARED_TOKEN_SERVICE);
    if (!email)
        return null;
    const token = await loadRawSecret(SHARED_TOKEN_SERVICE, email);
    return token ? { email, token } : null;
}
