import { randomBytes } from "node:crypto";

import { defineConfig, devices } from "@playwright/test";

// 移动端没有可用设备时的替代验收：在 Expo Web（react-native-web）上跑同一套组件。
// 端口用 3001：服务端 CORS_ORIGIN 只放行这个地址，所以不能和 apps/web 的 E2E 同时跑（根目录用 --concurrency=1）
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
	// 单条用例的总时长上限要盖过首包等待（auth.e2e.ts 的 FIRST_RENDER_TIMEOUT = 90s），默认 30s 会先超时
	timeout: 120_000,
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
			command: "pnpm exec expo start --web --port 3001",
			env: { BROWSER: "none", CI: "1" },
			reuseExistingServer: !process.env.CI,
			timeout: 180_000,
			// 用 Metro 独有的 /status 判断就绪：3001 上若是 apps/web 的 Next 服务，这里返回 404，
			// Playwright 不会把它当成已就绪的 Expo 服务去复用（否则测的就是 Web 端而不是移动端）
			url: `${WEB_URL}/status`,
		},
	],
	// Metro 按需打包，多个 worker 同时请求会互相拖慢首包
	workers: 1,
});
