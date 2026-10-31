import { execFileSync } from "node:child_process";
import path from "node:path";

import type { FullConfig } from "@playwright/test";

// 删除本轮测试注册的账号；脚本放在 server 包里，用它的 env 和 Prisma 客户端
export default function globalTeardown(config: FullConfig) {
	const prefix = process.env.E2E_RUN_PREFIX;
	if (!prefix) {
		return;
	}
	const nativeDir = config.configFile
		? path.dirname(config.configFile)
		: process.cwd();
	execFileSync(
		"pnpm",
		["exec", "tsx", "scripts/delete-test-users.ts", prefix],
		{
			cwd: path.resolve(nativeDir, "../server"),
			shell: process.platform === "win32",
			stdio: "inherit",
		}
	);
}
