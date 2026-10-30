"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

import SignInForm from "@/components/sign-in-form";

// 注册已拆到 /register；本页的完整改造（用户名登录、记住我、redirect）在 T-03
export default function LoginPage() {
	const router = useRouter();
	const goToRegister = useCallback(() => router.push("/register"), [router]);

	return <SignInForm onSwitchToSignUp={goToRegister} />;
}
