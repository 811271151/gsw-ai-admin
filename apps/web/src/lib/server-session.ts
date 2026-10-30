import { headers } from "next/headers";

import { authClient } from "./auth-client";

// 供 Server Component 读取当前会话；认证服务连不上时返回 null，登录/注册页照常渲染
export const getServerSession = async () => {
	try {
		const { data } = await authClient.getSession({
			fetchOptions: { headers: await headers() },
		});
		return data;
	} catch {
		return null;
	}
};
