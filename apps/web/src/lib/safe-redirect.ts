import type { Route } from "next";

export const DEFAULT_REDIRECT: Route = "/dashboard";

// 保留域名，只用来判断解析结果是否仍在站内
const SENTINEL_ORIGIN = "http://redirect.invalid";

// 不能只比字符串前缀：浏览器解析 URL 时会去掉换行和 Tab，并把 "\" 当成 "/"，
// "/\n/evil.com"、"/\evil.com" 最后都会变成 "//evil.com" 跳到外站。交给 URL 解析器判定 origin
export const getSafeRedirect = (value: string | null | undefined): Route => {
	if (!value?.startsWith("/")) {
		return DEFAULT_REDIRECT;
	}

	let url: URL;
	try {
		url = new URL(value, SENTINEL_ORIGIN);
	} catch {
		return DEFAULT_REDIRECT;
	}

	if (url.origin !== SENTINEL_ORIGIN) {
		return DEFAULT_REDIRECT;
	}

	const destination = `${url.pathname}${url.search}${url.hash}`;
	// 去掉点段后结果可能变成协议相对地址："/a/..//evil.com" 的 pathname 是 "//evil.com"。
	// 输出的字符串会被再次解析，所以对输出本身也要校验一次
	if (new URL(destination, SENTINEL_ORIGIN).origin !== SENTINEL_ORIGIN) {
		return DEFAULT_REDIRECT;
	}
	// 已确认是站内路径；typedRoutes 无法静态校验运行时路径，只能在这里收窄一次
	return destination as Route;
};
