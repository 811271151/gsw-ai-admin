import { describe, expect, test } from "vitest";

import { DEFAULT_REDIRECT, getSafeRedirect } from "./safe-redirect";

const BACKSLASH = "\\";

describe("getSafeRedirect 拦截外站与非法输入", () => {
	const blocked: [string, string | null | undefined][] = [
		["空值 null", null],
		["空值 undefined", undefined],
		["空字符串", ""],
		["相对路径", "dashboard"],
		["绝对外站地址", "https://evil.com"],
		["javascript 协议", "javascript:alert(1)"],
		["协议相对地址", "//evil.com"],
		["反斜杠", `/${BACKSLASH}evil.com`],
		["换行", "/\n/evil.com"],
		["Tab", "/\t/evil.com"],
		["CRLF", "/\r\n/evil.com"],
		["点段归一化成 //", "/a/..//evil.com"],
		["编码点段", "/a/%2e%2e//evil.com"],
		["混合大小写编码点段", "/a/.%2E//evil.com"],
		["多级点段", "/a/b/../..//evil.com"],
		["根目录点段", "/..//evil.com"],
		["点段加反斜杠", `/a/..${BACKSLASH}${BACKSLASH}evil.com`],
	];

	for (const [name, input] of blocked) {
		test(name, () => {
			expect(getSafeRedirect(input)).toBe(DEFAULT_REDIRECT);
		});
	}
});

describe("getSafeRedirect 放行站内路径", () => {
	const allowed: [string, string][] = [
		["/dashboard", "/dashboard"],
		["/", "/"],
		["/dashboard?tab=1#x", "/dashboard?tab=1#x"],
		["/a/../dashboard", "/dashboard"],
		["/evil.com", "/evil.com"],
		["/%2F/evil.com", "/%2F/evil.com"],
	];

	for (const [input, expected] of allowed) {
		test(`${input} → ${expected}`, () => {
			expect(getSafeRedirect(input)).toBe(expected);
		});
	}
});
