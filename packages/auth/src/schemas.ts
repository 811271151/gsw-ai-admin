import { z } from "zod";

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 20;
export const PASSWORD_MIN_LENGTH = 6;
export const USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/;
export const PLACEHOLDER_EMAIL_DOMAIN = "users.local";

export const isValidUsername = (value: string): boolean =>
	USERNAME_PATTERN.test(value);

// Better Auth 的 user.email 必填且唯一；用户名大小写不敏感唯一，所以占位邮箱也不会冲突
export const toPlaceholderEmail = (username: string): string =>
	`${username.toLowerCase()}@${PLACEHOLDER_EMAIL_DOMAIN}`;

const emailFormat = z.email();

const usernameField = z
	.string()
	.min(USERNAME_MIN_LENGTH, `用户名至少需要 ${USERNAME_MIN_LENGTH} 个字符`)
	.max(USERNAME_MAX_LENGTH, `用户名不能超过 ${USERNAME_MAX_LENGTH} 个字符`)
	.regex(USERNAME_PATTERN, "用户名只能包含字母、数字和下划线");

const optionalEmailField = z
	.string()
	.trim()
	.refine(
		(value) => value === "" || emailFormat.safeParse(value).success,
		"请输入有效的邮箱地址"
	)
	// 手填占位域名会和别人的占位邮箱冲突
	.refine(
		(value) => !value.toLowerCase().endsWith(`@${PLACEHOLDER_EMAIL_DOMAIN}`),
		"该邮箱域名不可用"
	);

export const signUpSchema = z
	.object({
		confirmPassword: z.string().min(1, "请再次输入密码"),
		email: optionalEmailField,
		password: z
			.string()
			.min(PASSWORD_MIN_LENGTH, `密码至少需要 ${PASSWORD_MIN_LENGTH} 个字符`),
		username: usernameField,
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "两次输入的密码不一致",
		path: ["confirmPassword"],
	});

export const signInSchema = z.object({
	password: z.string().min(1, "请输入密码"),
	username: z.string().trim().min(1, "请输入用户名"),
});

export const AUTH_ERROR_MESSAGES: Readonly<Record<string, string>> = {
	INVALID_USERNAME: "用户名只能包含字母、数字和下划线",
	INVALID_USERNAME_OR_PASSWORD: "用户名或密码不正确",
	PASSWORD_TOO_LONG: "密码过长",
	PASSWORD_TOO_SHORT: `密码至少需要 ${PASSWORD_MIN_LENGTH} 个字符`,
	USER_ALREADY_EXISTS: "该邮箱已被注册",
	USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "该邮箱已被注册，请换一个邮箱",
	USERNAME_IS_ALREADY_TAKEN: "该用户名已被使用",
	USERNAME_TOO_LONG: `用户名不能超过 ${USERNAME_MAX_LENGTH} 个字符`,
	USERNAME_TOO_SHORT: `用户名至少需要 ${USERNAME_MIN_LENGTH} 个字符`,
};

export const getAuthErrorMessage = (
	code: string | undefined,
	fallback: string
): string => {
	if (!code) {
		return fallback;
	}
	return AUTH_ERROR_MESSAGES[code] ?? fallback;
};
