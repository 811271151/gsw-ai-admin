"use client";

import { getAuthErrorMessage, signInSchema } from "@gsw-ai-admin/auth/schemas";
import { Button } from "@gsw-ai-admin/ui/components/button";
import { useForm } from "@tanstack/react-form";
import { Loader2 } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { authClient } from "@/lib/auth-client";

import FormField, { CheckboxField } from "./form-field";

const SIGN_IN_FAILED = "登录失败，请稍后重试";

// 记住我只是 Web 端的选项，共享 schema 不带它
const webSignInSchema = signInSchema.extend({ rememberMe: z.boolean() });

const selectIsSubmitting = (state: { isSubmitting: boolean }) =>
	state.isSubmitting;

export default function SignInForm({ redirectTo }: { redirectTo: Route }) {
	const router = useRouter();

	const form = useForm({
		defaultValues: {
			password: "",
			rememberMe: false,
			username: "",
		},
		onSubmit: async ({ value }) => {
			try {
				const { error } = await authClient.signIn.username({
					password: value.password,
					rememberMe: value.rememberMe,
					username: value.username.trim(),
				});
				if (error) {
					toast.error(getAuthErrorMessage(error.code, SIGN_IN_FAILED));
					return;
				}
				toast.success("登录成功");
				// redirectTo 由 /login 页在服务端经 getSafeRedirect 得到，只会是站内路径
				router.push(redirectTo);
				router.refresh();
			} catch {
				toast.error(SIGN_IN_FAILED);
			}
		},
		validators: {
			onSubmit: webSignInSchema,
		},
	});

	const handleSubmit = useCallback(
		(event: React.FormEvent<HTMLFormElement>) => {
			event.preventDefault();
			event.stopPropagation();
			form.handleSubmit();
		},
		[form]
	);

	return (
		<div className="mx-auto mt-10 w-full max-w-md p-6">
			<h1 className="mb-6 text-center font-bold text-3xl">登录</h1>

			<form className="space-y-4" noValidate onSubmit={handleSubmit}>
				<form.Field name="username">
					{(field) => (
						<FormField
							autoComplete="username"
							errors={field.state.meta.errors}
							label="用户名"
							name={field.name}
							onBlur={field.handleBlur}
							onChange={field.handleChange}
							showErrors={field.state.meta.isTouched}
							value={field.state.value}
						/>
					)}
				</form.Field>

				<form.Field name="password">
					{(field) => (
						<FormField
							autoComplete="current-password"
							errors={field.state.meta.errors}
							label="密码"
							name={field.name}
							onBlur={field.handleBlur}
							onChange={field.handleChange}
							showErrors={field.state.meta.isTouched}
							type="password"
							value={field.state.value}
						/>
					)}
				</form.Field>

				<form.Field name="rememberMe">
					{(field) => (
						<CheckboxField
							checked={field.state.value}
							label="记住我"
							name={field.name}
							onChange={field.handleChange}
						/>
					)}
				</form.Field>

				<form.Subscribe selector={selectIsSubmitting}>
					{(isSubmitting) => (
						<Button className="w-full" disabled={isSubmitting} type="submit">
							{isSubmitting ? (
								<>
									<Loader2 className="animate-spin" />
									登录中...
								</>
							) : (
								"登录"
							)}
						</Button>
					)}
				</form.Subscribe>
			</form>

			<p className="mt-4 text-center text-sm">
				还没有账户？
				<Link className="underline underline-offset-4" href="/register">
					立即注册
				</Link>
			</p>
		</div>
	);
}
