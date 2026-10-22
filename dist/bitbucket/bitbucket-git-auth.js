// Bitbucket 문서가 API 토큰으로 git 을 쓸 때 쓰라고 정한 고정 사용자 이름
const GIT_USERNAME = "x-bitbucket-api-token-auth";
// git 이 bitbucket.org 에 보낼 인증 헤더를 환경변수로 만든다
// 원격 주소나 명령줄 인자에 토큰을 남기지 않으려고 환경변수를 쓴다
export function buildBitbucketGitAuthEnv(token) {
    const basic = Buffer.from(`${GIT_USERNAME}:${token}`).toString("base64");
    return {
        GIT_CONFIG_COUNT: "1",
        GIT_CONFIG_KEY_0: "http.https://bitbucket.org/.extraHeader",
        GIT_CONFIG_VALUE_0: `Authorization: Basic ${basic}`,
        GIT_TERMINAL_PROMPT: "0",
    };
}
