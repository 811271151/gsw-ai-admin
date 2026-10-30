import { randomBytes } from "node:crypto";

import { defineConfig, devices } from "@playwright/test";

// 主进程生成一次，worker 进程通过环境变量继承，保证同一轮测试的账号前缀一致，收尾时按前缀清理
process.env.E2E_RUN_PREFIX ??= `e2e_${randomBytes(3).toString("hex")}_`;

const WEB_URL = "http://localhost:3001";
const API_URL = "http://localhost:3000";

export default defineConfig({
	forbidOnly: Boolean(process.env.CI),
	globalTeardown: "./e2e/global-teardown.ts",
	projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
	reporter: "list",
	retries: 0,
	testDir: "./e2e",
	testMatch: "**/*.e2e.ts",
	use: {
		baseURL: WEB_URL,
		trace: "retain-on-failure",
	},
	webServer: [
		{
			command: "pnpm exec tsx src/index.ts",
			cwd: "../server",
			reuseExistingServer: !process.env.CI,
			timeout: 60_000,
			url: `${API_URL}/`,
		},
		{
			command: "pnpm run build && pnpm exec next start -p 3001",
			reuseExistingServer: !process.env.CI,
			timeout: 300_000,
			url: `${WEB_URL}/login`,
		},
	],
});
