import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { promisify } from "node:util";
const run = promisify(execFile);
// 레포를 로컬에 내려받고 정한 브랜치의 원격 최신 상태로 맞춘다
export async function syncRepo(target, authEnv) {
    const { path, branch } = target;
    const env = { ...process.env, ...authEnv };
    const action = existsSync(join(path, ".git")) ? "updated" : "cloned";
    if (action === "cloned") {
        await mkdir(dirname(path), { recursive: true });
        await run("git", ["clone", "--branch", branch, target.cloneUrl, path], { env });
    }
    else {
        await checkoutRemoteBranch(path, branch, env);
    }
    const { stdout: commit } = await run("git", ["-C", path, "log", "-1", "--format=%h %s"]);
    return { path, action, branch, commit: commit.trim() };
}
// 이 사본은 읽기 전용이라 로컬 변경을 버리고 원격 브랜치에 그대로 맞춘다
async function checkoutRemoteBranch(path, branch, env) {
    await run("git", ["-C", path, "fetch", "--prune", "origin"], { env });
    await run("git", ["-C", path, "checkout", "--force", "-B", branch, `origin/${branch}`]);
}
