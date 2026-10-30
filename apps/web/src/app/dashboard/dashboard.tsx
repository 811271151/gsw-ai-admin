"use client";

import { useQuery } from "@tanstack/react-query";

import { useTRPC } from "@/utils/trpc";

// 不接收 session：Server Component 传给客户端组件的 props 会序列化进 HTML，
// 整个 session 里带着 httpOnly 的会话 token，传过来就等于把 token 暴露给页面脚本
export default function Dashboard() {
	const trpc = useTRPC();
	const privateData = useQuery(trpc.privateData.queryOptions());

	return <p>API: {privateData.data?.message}</p>;
}
