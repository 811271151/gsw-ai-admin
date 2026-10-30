import { expo } from "@better-auth/expo";
import type { Database } from "@gsw-ai-admin/db";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { username } from "better-auth/plugins";

import {
	isValidUsername,
	PASSWORD_MIN_LENGTH,
	USERNAME_MAX_LENGTH,
	USERNAME_MIN_LENGTH,
} from "./schemas";

const SESSION_EXPIRES_IN_SECONDS = 60 * 60 * 24 * 30;

export interface AuthConfig {
	BETTER_AUTH_SECRET: string;
	BETTER_AUTH_URL: string;
	CORS_ORIGIN: string;
}

export function createAuth(
	env: AuthConfig,
	database: Database,
	desktopOrigins: readonly string[] = []
) {
	return betterAuth({
		advanced: {
			defaultCookieAttributes: {
				httpOnly: true,
				sameSite: "none",
				secure: true,
			},
		},
		baseURL: env.BETTER_AUTH_URL,
		database: prismaAdapter(database, {
			provider: "postgresql",
		}),
		emailAndPassword: { enabled: true, minPasswordLength: PASSWORD_MIN_LENGTH },
		plugins: [
			expo(),
			username({
				maxUsernameLength: USERNAME_MAX_LENGTH,
				minUsernameLength: USERNAME_MIN_LENGTH,
				// 插件默认允许点号，需求只允许字母、数字、下划线
				usernameValidator: isValidUsername,
			}),
		],
		secret: env.BETTER_AUTH_SECRET,
		// rememberMe=false 时 Better Auth 发会话 cookie（关浏览器失效），这里只决定勾选后的时长
		session: { expiresIn: SESSION_EXPIRES_IN_SECONDS },
		trustedOrigins: [
			env.CORS_ORIGIN,
			...desktopOrigins,
			"gsw-ai-admin://",
			"exp://",
			"http://localhost:8081",
		],
	});
}

export type Session = ReturnType<typeof createAuth>["$Infer"]["Session"];
