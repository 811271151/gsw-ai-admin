import {
	type APIRequestContext,
	expect,
	type Page,
	test,
} from "@playwright/test";

// 覆盖 specs/02-web-username-auth/requirement.md 的 AC-01 ~ AC-15，需要本地 PostgreSQL
const API_URL = "http://localhost:3000";
const WEB_ORIGIN = "http://localhost:3001";
const PASSWORD = "123456";
const RUN_PREFIX = process.env.E2E_RUN_PREFIX ?? "e2e_local_";

const DASHBOARD_URL = /\/dashboard$/;
const LOGIN_URL = /\/login$/;
const REGISTER_URL = /\/register$/;
const LOGIN_WITH_REDIRECT_URL = /\/login\?redirect=%2Fdashboard$/;

// 用户名上限 20 位：前缀 11 位 + tag 不超过 8 位
const usernameFor = (tag: string) => `${RUN_PREFIX}${tag}`;

const createUser = async (request: APIRequestContext, username: string) => {
	const response = await request.post(`${API_URL}/api/auth/sign-up/email`, {
		data: {
			displayUsername: username,
			email: `${username.toLowerCase()}@users.local`,
			name: username,
			password: PASSWORD,
			username,
		},
		headers: { origin: WEB_ORIGIN },
	});
	expect(response.ok()).toBe(true);
};

// 等客户端水合完成再操作，否则受控输入框可能被重置
const open = async (page: Page, url: string) => {
	await page.goto(url);
	await page.waitForLoadState("networkidle");
};

const fillSignIn = async (
	page: Page,
	username: string,
	password = PASSWORD
) => {
	await page.getByLabel("用户名").fill(username);
	await page.getByLabel("密码", { exact: true }).fill(password);
	await page.locator("form").getByRole("button", { name: "登录" }).click();
};

test("AC-01 用户名少于 3 位，失焦后提示", async ({ page }) => {
	await open(page, "/register");
	await page.getByLabel("用户名").fill("ab");
	await page.getByLabel("用户名").blur();

	await expect(page.getByText("用户名至少需要 3 个字符")).toBeVisible();
});

test("R-01 没输入过的空字段失焦也提示", async ({ page }) => {
	await open(page, "/register");
	await page.getByLabel("用户名").focus();
	await page.getByLabel("用户名").blur();

	await expect(page.getByText("用户名至少需要 3 个字符")).toBeVisible();
});

test("AC-02 两次密码不一致，提示且不发注册请求", async ({ page }) => {
	let signUpRequests = 0;
	page.on("request", (request) => {
		if (request.url().includes("/api/auth/sign-up")) {
			signUpRequests += 1;
		}
	});

	await open(page, "/register");
	await page.getByLabel("用户名").fill(usernameFor("mis"));
	await page.getByLabel("密码", { exact: true }).fill(PASSWORD);
	await page.getByLabel("确认密码").fill("654321");
	await page.locator("form").getByRole("button", { name: "注册" }).click();

	await expect(page.getByText("两次输入的密码不一致")).toBeVisible();
	expect(signUpRequests).toBe(0);
});

test("AC-03 不填邮箱注册成功，提示后跳 /login", async ({ page }) => {
	await open(page, "/register");
	await page.getByLabel("用户名").fill(usernameFor("reg"));
	await page.getByLabel("密码", { exact: true }).fill(PASSWORD);
	await page.getByLabel("确认密码").fill(PASSWORD);
	await page.locator("form").getByRole("button", { name: "注册" }).click();

	await expect(page.getByText("注册成功，请登录")).toBeVisible();
	await expect(page).toHaveURL(LOGIN_URL);
});

test("AC-04 用户名已存在，提示并停留在注册页", async ({ page, request }) => {
	const username = usernameFor("dup");
	await createUser(request, username);

	await open(page, "/register");
	await page.getByLabel("用户名").fill(username);
	await page.getByLabel("密码", { exact: true }).fill(PASSWORD);
	await page.getByLabel("确认密码").fill(PASSWORD);
	await page.locator("form").getByRole("button", { name: "注册" }).click();

	await expect(page.getByText("该用户名已被使用")).toBeVisible();
	await expect(page).toHaveURL(REGISTER_URL);
});

test("AC-05 点击显示按钮，密码框在 password / text 间切换", async ({
	page,
}) => {
	await open(page, "/register");
	const password = page.getByLabel("密码", { exact: true });

	await expect(password).toHaveAttribute("type", "password");
	await page.getByRole("button", { name: "显示密码" }).first().click();
	await expect(password).toHaveAttribute("type", "text");
	await page.getByRole("button", { name: "隐藏密码" }).first().click();
	await expect(password).toHaveAttribute("type", "password");
});

test("AC-06 / AC-13 / AC-14 登录后进入 /dashboard，菜单显示用户名且不出现占位邮箱", async ({
	page,
	request,
}) => {
	const username = usernameFor("Ok");
	await createUser(request, username);

	await open(page, "/login");
	await fillSignIn(page, username.toLowerCase());

	await expect(page).toHaveURL(DASHBOARD_URL);
	await expect(page.getByRole("button", { name: username })).toBeVisible();
	await expect(page.getByText("users.local")).toHaveCount(0);
});

test("AC-07 错误密码与不存在的用户名提示相同", async ({ page, request }) => {
	const username = usernameFor("pwd");
	await createUser(request, username);

	await open(page, "/login");
	await fillSignIn(page, username, "wrong1");
	await expect(page.getByText("用户名或密码不正确")).toBeVisible();

	await open(page, "/login");
	await fillSignIn(page, usernameFor("nobody"));
	await expect(page.getByText("用户名或密码不正确")).toBeVisible();
});

test("AC-08 网络不可达时提示稍后重试", async ({ page }) => {
	await page.route("**/api/auth/sign-in/username", (route) =>
		route.abort("internetdisconnected")
	);

	await open(page, "/login");
	await fillSignIn(page, usernameFor("net"));

	await expect(page.getByText("登录失败，请稍后重试")).toBeVisible();
});

test("AC-09 登录页与注册页互相跳转", async ({ page }) => {
	await open(page, "/login");
	await page.getByRole("link", { name: "立即注册" }).click();
	await expect(page).toHaveURL(REGISTER_URL);

	await page
		.getByText("已有账户？")
		.getByRole("link", { name: "登录" })
		.click();
	await expect(page).toHaveURL(LOGIN_URL);
});

test("AC-10 未登录访问 /dashboard 带 redirect 跳登录，登录后回到 /dashboard", async ({
	page,
	request,
}) => {
	const username = usernameFor("back");
	await createUser(request, username);

	await page.goto("/dashboard");
	await expect(page).toHaveURL(LOGIN_WITH_REDIRECT_URL);

	await page.waitForLoadState("networkidle");
	await fillSignIn(page, username);
	await expect(page).toHaveURL(DASHBOARD_URL);
});

test("AC-11 redirect 指向外站时登录后仍跳 /dashboard", async ({
	page,
	request,
}) => {
	const username = usernameFor("evil");
	await createUser(request, username);

	await open(page, "/login?redirect=https://evil.com");
	await fillSignIn(page, username);

	await expect(page).toHaveURL(DASHBOARD_URL);
});

test("AC-11 回归：点段归一化的 redirect 不能跳外站", async ({
	page,
	request,
}) => {
	const username = usernameFor("dot");
	await createUser(request, username);

	await open(page, "/login?redirect=/a/..//evil.com");
	await fillSignIn(page, username);

	await expect(page).toHaveURL(DASHBOARD_URL);
});

test("AC-12 已登录访问 /login 直接跳 /dashboard", async ({ page, request }) => {
	const username = usernameFor("again");
	await createUser(request, username);
	await open(page, "/login");
	await fillSignIn(page, username);
	await expect(page).toHaveURL(DASHBOARD_URL);

	await page.goto("/login");

	await expect(page).toHaveURL(DASHBOARD_URL);
});

test("AC-15 退出登录跳 /login，再访问 /dashboard 被拦截", async ({
	page,
	request,
}) => {
	const username = usernameFor("out");
	await createUser(request, username);
	await open(page, "/login");
	await fillSignIn(page, username);
	await expect(page).toHaveURL(DASHBOARD_URL);

	await page.getByRole("button", { name: username }).click();
	await page.getByRole("menuitem", { name: "退出登录" }).click();
	await expect(page).toHaveURL(LOGIN_URL);

	await page.goto("/dashboard");
	await expect(page).toHaveURL(LOGIN_WITH_REDIRECT_URL);
});
