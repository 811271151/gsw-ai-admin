import {
	type APIRequestContext,
	expect,
	type Page,
	test,
} from "@playwright/test";

// 覆盖 specs/03-native-username-auth/requirement.md 的 AC-01 ~ AC-10，在 Expo Web 上跑（无可用设备时的替代验收）。
// AC-04（键盘「下一项」）、AC-07（杀掉 App 后保持登录）、AC-10 的「重启」部分依赖原生行为，这里只做 Web 近似验证
const API_URL = "http://localhost:3000";
const WEB_ORIGIN = "http://localhost:3001";
const PASSWORD = "123456";
const RUN_PREFIX = process.env.E2E_RUN_PREFIX ?? "e2e_local_";
// Metro 按需打包，第一次打开页面可能要等首包
const FIRST_RENDER_TIMEOUT = 90_000;

const LOGIN_URL = /\/login$/;
const HOME_URL = /:3001\/$/;

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

// react-native-web 不会把 Label 关联到输入框，按 placeholder 定位
const open = async (page: Page, url: string) => {
	await page.goto(url);
	await page
		.getByRole("textbox")
		.first()
		.waitFor({ timeout: FIRST_RENDER_TIMEOUT });
};

const fillSignIn = async (
	page: Page,
	username: string,
	password = PASSWORD
) => {
	await page.getByPlaceholder("请输入用户名").fill(username);
	await page.getByPlaceholder("请输入密码").fill(password);
	await page.getByRole("button", { exact: true, name: "登录" }).click();
};

const fillSignUp = async (page: Page, username: string) => {
	const passwords = page.getByPlaceholder("••••••");
	await page.getByPlaceholder("字母、数字或下划线").fill(username);
	await passwords.nth(0).fill(PASSWORD);
	await passwords.nth(1).fill(PASSWORD);
	await page.getByRole("button", { exact: true, name: "注册" }).click();
};

const signIn = async (page: Page, username: string) => {
	await open(page, "/login");
	await fillSignIn(page, username);
	await expect(page.getByText(`欢迎，${username}`)).toBeVisible();
};

test("AC-01 用户名含非法字符，提交后提示", async ({ page }) => {
	await open(page, "/register");
	await fillSignUp(page, "a-b");

	await expect(
		page.getByText("用户名只能包含字母、数字和下划线")
	).toBeVisible();
});

test("AC-02 不填邮箱注册成功，提示后进入登录屏幕", async ({ page }) => {
	await open(page, "/register");
	await fillSignUp(page, usernameFor("reg"));

	await expect(page.getByText("注册成功，请登录").first()).toBeVisible();
	await expect(page).toHaveURL(LOGIN_URL);
});

test("AC-03 用户名已存在时提示", async ({ page, request }) => {
	const username = usernameFor("dup");
	await createUser(request, username);

	await open(page, "/register");
	await fillSignUp(page, username);

	await expect(page.getByText("该用户名已被使用").first()).toBeVisible();
});

test("AC-04（Web 近似）用户名框按回车，焦点移到密码框", async ({ page }) => {
	await open(page, "/register");
	await page.getByPlaceholder("字母、数字或下划线").fill("alice");
	await page.getByPlaceholder("字母、数字或下划线").press("Enter");

	await expect(page.getByPlaceholder("••••••").nth(0)).toBeFocused();
});

test("AC-05 正确用户名密码登录，进入首页并显示用户名", async ({
	page,
	request,
}) => {
	const username = usernameFor("Ok");
	await createUser(request, username);

	await open(page, "/login");
	await fillSignIn(page, username.toLowerCase());

	await expect(page).toHaveURL(HOME_URL);
	await expect(page.getByText(`欢迎，${username}`)).toBeVisible();
});

test("AC-06 错误密码与不存在的用户名提示相同", async ({ page, request }) => {
	const username = usernameFor("pwd");
	await createUser(request, username);

	await open(page, "/login");
	await fillSignIn(page, username, "wrong1");
	await expect(page.getByText("用户名或密码不正确").first()).toBeVisible();

	await open(page, "/login");
	await fillSignIn(page, usernameFor("nobody"));
	await expect(page.getByText("用户名或密码不正确").first()).toBeVisible();
});

test("AC-07（Web 近似）登录后刷新页面仍为登录状态", async ({
	page,
	request,
}) => {
	const username = usernameFor("keep");
	await createUser(request, username);
	await signIn(page, username);

	await page.reload();

	await expect(page.getByText(`欢迎，${username}`)).toBeVisible({
		timeout: FIRST_RENDER_TIMEOUT,
	});
});

test("登录屏幕「立即注册」进入注册屏幕", async ({ page }) => {
	await open(page, "/login");
	await page.getByRole("button", { name: "还没有账户？立即注册" }).click();

	await expect(page.getByPlaceholder("字母、数字或下划线")).toBeVisible();
});

test("AC-08 未登录打开首页跳到登录屏幕", async ({ page }) => {
	await page.goto("/");

	await expect(page).toHaveURL(LOGIN_URL, { timeout: FIRST_RENDER_TIMEOUT });
	await expect(page.getByPlaceholder("请输入用户名")).toBeVisible();
});

test("AC-09 首页不出现占位邮箱", async ({ page, request }) => {
	const username = usernameFor("mail");
	await createUser(request, username);
	await signIn(page, username);

	await expect(page.getByText("users.local")).toHaveCount(0);
});

test("AC-10（Web 近似）退出登录回到登录屏幕，刷新后仍未登录", async ({
	page,
	request,
}) => {
	const username = usernameFor("out");
	await createUser(request, username);
	await signIn(page, username);

	await page.getByText("退出登录").click();
	await expect(page).toHaveURL(LOGIN_URL);

	// 登录屏幕对已登录用户也会照常渲染，停在 /login 不能证明已登出。
	// 重新打开受保护的首页：只有会话真的没了，登录守卫才会把人送回 /login
	await page.goto("/");
	await expect(page).toHaveURL(LOGIN_URL, { timeout: FIRST_RENDER_TIMEOUT });
	await expect(page.getByPlaceholder("请输入用户名")).toBeVisible();
	await expect(page.getByText(`欢迎，${username}`)).toHaveCount(0);
});
