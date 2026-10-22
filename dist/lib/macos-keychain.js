import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
const run = promisify(execFile);
// 값을 Mac 키체인에 저장한다, 이미 있으면 덮어쓴다
// 명령줄 인자에 실으면 ps 로 보이므로 security -i 에 표준입력으로 넘긴다
export async function saveSecret(service, account, value) {
    // base64 로 감싸 값에 따옴표나 공백이 섞여도 명령이 깨지지 않게 한다
    const encoded = Buffer.from(value, "utf8").toString("base64");
    const command = `add-generic-password -U -s ${service} -a ${account} -w ${encoded}\n`;
    await new Promise((resolve, reject) => {
        const child = spawn("security", ["-i"], { stdio: ["pipe", "ignore", "pipe"] });
        let stderr = "";
        child.stderr.on("data", (chunk) => (stderr += chunk));
        child.on("error", reject);
        child.on("close", (code) => code === 0 && !stderr.trim() ? resolve() : reject(new Error(`키체인 저장 실패: ${stderr.trim()}`)));
        child.stdin.end(command);
    });
}
// saveSecret 으로 저장한 값을 읽는다, 없으면 null
export async function loadSecret(service, account) {
    const raw = await loadRawSecret(service, account);
    return raw === null ? null : Buffer.from(raw, "base64").toString("utf8");
}
// 다른 도구가 저장한 값을 그대로 읽는다, 없으면 null
export async function loadRawSecret(service, account) {
    try {
        const { stdout } = await run("security", ["find-generic-password", "-s", service, "-a", account, "-w"]);
        return stdout.trim();
    }
    catch {
        return null;
    }
}
// 서비스 이름으로 저장된 항목의 계정 이름을 찾는다, 값은 읽지 않는다
export async function findAccount(service) {
    try {
        const { stdout } = await run("security", ["find-generic-password", "-s", service]);
        return stdout.match(/"acct"<blob>="([^"]*)"/)?.[1] ?? null;
    }
    catch {
        return null;
    }
}
// 키체인에서 값을 지운다, 지운 것이 있으면 true
export async function deleteSecret(service, account) {
    try {
        await run("security", ["delete-generic-password", "-s", service, "-a", account]);
        return true;
    }
    catch {
        return false;
    }
}
