import { describe, expect, test } from "vitest";

import {
	getAuthErrorMessage,
	signInSchema,
	signUpSchema,
	toPlaceholderEmail,
} from "./schemas";

const validSignUp = {
	confirmPassword: "123456",
	email: "",
	password: "123456",
	username: "alice",
};

const signUpIssues = (overrides: Partial<typeof validSignUp>) => {
	const result = signUpSchema.safeParse({ ...validSignUp, ...overrides });
	return result.success ? [] : result.error.issues;
};

describe("signUpSchema", () => {
	test("合法输入通过", () => {
		expect(signUpIssues({})).toEqual([]);
	});

	test("AC-15 两次密码不一致时报错在 confirmPassword", () => {
		const issues = signUpIssues({ confirmPassword: "654321" });

		expect(issues).toHaveLength(1);
		expect(issues[0]?.path).toEqual(["confirmPassword"]);
		expect(issues[0]?.message).toBe("两次输入的密码不一致");
	});

	test("AC-16 邮箱留空通过", () => {
		expect(signUpIssues({ email: "" })).toEqual([]);
	});

	test("AC-16 邮箱格式错误", () => {
		const issues = signUpIssues({ email: "abc" });

		expect(issues.map((issue) => issue.message)).toEqual([
			"请输入有效的邮箱地址",
		]);
	});

	test("AC-16 不允许手填占位邮箱域名（不区分大小写）", () => {
		for (const email of ["x@users.local", "x@USERS.local"]) {
			const issues = signUpIssues({ email });

			expect(issues.map((issue) => issue.message)).toEqual([
				"该邮箱域名不可用",
			]);
		}
	});

	test("AC-16 真实邮箱通过", () => {
		expect(signUpIssues({ email: "bob@example.com" })).toEqual([]);
	});

	test("用户名少于 3 位", () => {
		const issues = signUpIssues({ username: "ab" });

		expect(issues.map((issue) => issue.message)).toContain(
			"用户名至少需要 3 个字符"
		);
	});

	test("用户名超过 20 位", () => {
		const issues = signUpIssues({ username: "a".repeat(21) });

		expect(issues.map((issue) => issue.message)).toContain(
			"用户名不能超过 20 个字符"
		);
	});

	test("用户名含非法字符", () => {
		const issues = signUpIssues({ username: "a-b!" });

		expect(issues.map((issue) => issue.message)).toContain(
			"用户名只能包含字母、数字和下划线"
		);
	});

	test("密码少于 6 位", () => {
		const issues = signUpIssues({
			confirmPassword: "12345",
			password: "12345",
		});

		expect(issues.map((issue) => issue.message)).toContain(
			"密码至少需要 6 个字符"
		);
	});
});

describe("signInSchema", () => {
	test("用户名和密码都为空时分别报错", () => {
		const result = signInSchema.safeParse({ password: "", username: " " });

		expect(result.success).toBe(false);
		expect(result.error?.issues.map((issue) => issue.message).sort()).toEqual(
			["请输入密码", "请输入用户名"].sort()
		);
	});

	test("合法输入通过", () => {
		expect(
			signInSchema.safeParse({ password: "x", username: "alice" }).success
		).toBe(true);
	});
});

test("AC-17 占位邮箱使用小写用户名", () => {
	expect(toPlaceholderEmail("Alice")).toBe("alice@users.local");
});

describe("getAuthErrorMessage", () => {
	test("已知错误码返回中文提示", () => {
		expect(getAuthErrorMessage("INVALID_USERNAME_OR_PASSWORD", "默认")).toBe(
			"用户名或密码不正确"
		);
		expect(getAuthErrorMessage("USERNAME_IS_ALREADY_TAKEN", "默认")).toBe(
			"该用户名已被使用"
		);
	});

	test("未知或缺失的错误码返回默认文案", () => {
		expect(getAuthErrorMessage("SOMETHING_ELSE", "默认")).toBe("默认");
		expect(getAuthErrorMessage(undefined, "默认")).toBe("默认");
	});
});
