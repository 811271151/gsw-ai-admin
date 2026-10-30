import { afterAll, beforeAll, expect, test } from "vitest";

import { ENV } from "./env.server";
import { auth, db } from "./services";

// 直接调用 auth.handler，跑的是与线上相同的 Better Auth 配置，需要本地 PostgreSQL
const MAX_AGE_PATTERN = /Max-Age=(\d+)/i;
const THIRTY_DAYS_IN_SECONDS = 60 * 60 * 24 * 30;
const PASSWORD = "123456";

const suffix = Math.random().toString(36).slice(2, 8);
const alice = `alice_${suffix}`;
const bob = `bob_${suffix}`;
const createdUsernames = [alice, bob];

interface AuthResponse {
	body: Record<string, unknown> | null;
	setCookie: string[];
	status: number;
}

const callAuth = async (
	path: string,
	options: { body?: unknown; cookie?: string; method?: "GET" | "POST" } = {}
): Promise<AuthResponse> => {
	const method = options.method ?? "POST";
	const headers = new Headers({ origin: ENV.CORS_ORIGIN });
	if (options.cookie) {
		headers.set("cookie", options.cookie);
	}
	if (method === "POST") {
		headers.set("content-type", "application/json");
	}

	const response = await auth.handler(
		new Request(`${ENV.BETTER_AUTH_URL}/api/auth${path}`, {
			body: method === "POST" ? JSON.stringify(options.body ?? {}) : undefined,
			headers,
			method,
		})
	);
	const text = await response.text();

	return {
		body: text ? JSON.parse(text) : null,
		setCookie: response.headers.getSetCookie(),
		status: response.status,
	};
};

const signUp = (username: string, overrides: Record<string, string> = {}) =>
	callAuth("/sign-up/email", {
		body: {
			email: `${username.toLowerCase()}@users.local`,
			name: username,
			password: PASSWORD,
			username,
			...overrides,
		},
	});

const signIn = (username: string, password: string, rememberMe?: boolean) =>
	callAuth("/sign-in/username", { body: { password, rememberMe, username } });

const sessionTokenCookie = (setCookie: string[]) =>
	setCookie.find((cookie) => cookie.includes("session_token="));

const toCookieHeader = (setCookie: string[]) =>
	setCookie.map((cookie) => cookie.split(";")[0]).join("; ");

const getSession = async (cookie: string) =>
	(await callAuth("/get-session", { cookie, method: "GET" })).body;

let aliceSignUp: AuthResponse;

beforeAll(async () => {
	aliceSignUp = await signUp(alice);
});

afterAll(async () => {
	await db.user.deleteMany({ where: { username: { in: createdUsernames } } });
	await db.$disconnect();
});

test("AC-01 用户名少于 3 位被拒", async () => {
	const response = await signUp("ab");

	expect(response.body?.code).toBe("USERNAME_TOO_SHORT");
});

test("AC-02 用户名超过 20 位被拒", async () => {
	const response = await signUp("a".repeat(21));

	expect(response.body?.code).toBe("USERNAME_TOO_LONG");
});

test("AC-03 用户名含非法字符被拒", async () => {
	const response = await signUp("a-b!");

	expect(response.body?.code).toBe("INVALID_USERNAME");
});

test("AC-04 用户名大小写不敏感唯一", async () => {
	const response = await signUp(alice.toUpperCase(), {
		email: `upper_${suffix}@example.com`,
	});

	expect(response.body?.code).toBe("USERNAME_IS_ALREADY_TAKEN");
});

test("AC-05 不填邮箱时使用占位邮箱注册成功", () => {
	const user = aliceSignUp.body?.user as { email?: string } | undefined;

	expect(aliceSignUp.status).toBe(200);
	expect(user?.email).toBe(`${alice}@users.local`);
});

test("AC-06 填写真实邮箱注册成功", async () => {
	const email = `bob_${suffix}@example.com`;
	const response = await signUp(bob, { email });
	const user = response.body?.user as { email?: string } | undefined;

	expect(response.status).toBe(200);
	expect(user?.email).toBe(email);
});

test("AC-07 密码少于 6 位被拒", async () => {
	const response = await signUp(`carl_${suffix}`, { password: "12345" });

	expect(response.body?.code).toBe("PASSWORD_TOO_SHORT");
});

test("AC-08 正确用户名密码登录成功并下发会话 cookie", async () => {
	const response = await signIn(alice, PASSWORD);

	expect(response.status).toBe(200);
	expect(sessionTokenCookie(response.setCookie)).toBeDefined();
});

test("AC-09 / AC-10 密码错误与用户不存在返回相同错误", async () => {
	const wrongPassword = await signIn(alice, "wrong1");
	const unknownUser = await signIn(`nobody_${suffix}`, PASSWORD);

	expect(wrongPassword.status).toBe(401);
	expect(wrongPassword.body?.code).toBe("INVALID_USERNAME_OR_PASSWORD");
	expect(unknownUser.status).toBe(401);
	expect(unknownUser.body).toEqual(wrongPassword.body);
});

test("AC-11 大写用户名可以登录", async () => {
	const response = await signIn(alice.toUpperCase(), PASSWORD);

	expect(response.status).toBe(200);
});

test("AC-12 会话包含 username", async () => {
	const login = await signIn(alice, PASSWORD);
	const session = await getSession(toCookieHeader(login.setCookie));
	const user = session?.user as { username?: string } | undefined;

	expect(user?.username).toBe(alice);
});

test("AC-13 记住我决定 session cookie 是否持久", async () => {
	const remembered = sessionTokenCookie(
		(await signIn(alice, PASSWORD, true)).setCookie
	);
	const notRemembered = sessionTokenCookie(
		(await signIn(alice, PASSWORD, false)).setCookie
	);

	expect(MAX_AGE_PATTERN.exec(remembered ?? "")?.[1]).toBe(
		String(THIRTY_DAYS_IN_SECONDS)
	);
	expect(notRemembered).toBeDefined();
	expect(notRemembered).not.toMatch(MAX_AGE_PATTERN);
});

test("AC-14 登出后会话失效", async () => {
	const cookie = toCookieHeader((await signIn(alice, PASSWORD)).setCookie);

	expect(await getSession(cookie)).not.toBeNull();

	await callAuth("/sign-out", { cookie });

	expect(await getSession(cookie)).toBeNull();
});
