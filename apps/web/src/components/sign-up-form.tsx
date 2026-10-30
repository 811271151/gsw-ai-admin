"use client";

import {
	getAuthErrorMessage,
	signUpSchema,
	toPlaceholderEmail,
} from "@gsw-ai-admin/auth/schemas";
import { Button } from "@gsw-ai-admin/ui/components/button";
import { useForm } from "@tanstack/react-form";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";

import FormField from "./form-field";

const SIGN_UP_FAILED = "注册失败，请稍后重试";

const selectIsSubmitting = (state: { isSubmitting: boolean }) =>
	state.isSubmitting;

export default function SignUpForm() {
	const router = useRouter();

	const form = useForm({
		defaultValues: {
			confirmPassword: "",
			email: "",
			password: "",
			username: "",
		},
		// 错误只放在 onChange 一个来源里：输入时校验，失焦时（包括没输入过的空字段）再跑一次同样的校验，
		// 只在字段失焦或提交过之后显示。不用 onBlur 校验器：它的错误要等下次失焦才刷新，会过期，
		// 点「注册」时输入框先失焦、过期错误消失、按钮上移，这次点击就落空了
		listeners: {
			onBlur: ({ fieldApi }) => {
				fieldApi.validate("change");
			},
		},
		onSubmit: async ({ value }) => {
			try {
				const { error } = await authClient.signUp.email({
					displayUsername: value.username,
					email: value.email.trim() || toPlaceholderEmail(value.username),
					name: value.username,
					password: value.password,
					username: value.username,
				});
				if (error) {
					toast.error(getAuthErrorMessage(error.code, SIGN_UP_FAILED));
					return;
				}
				// 注册接口默认顺带登录，而需求是注册后回登录页手动登录，所以先登出
				const { error: signOutError } = await authClient.signOut();
				if (signOutError) {
					// 账户已建好但会话没清掉，按已登录处理，避免提示「请登录」却仍在登录态
					toast.success("注册成功");
					router.push("/dashboard");
					return;
				}
				toast.success("注册成功，请登录");
				router.push("/login");
			} catch {
				toast.error(SIGN_UP_FAILED);
			}
		},
		validators: {
			onChange: signUpSchema,
			onSubmit: signUpSchema,
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
			<h1 className="mb-6 text-center font-bold text-3xl">注册账户</h1>

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
							showErrors={
								field.state.meta.isBlurred || form.state.submissionAttempts > 0
							}
							value={field.state.value}
						/>
					)}
				</form.Field>

				<form.Field name="password">
					{(field) => (
						<FormField
							autoComplete="new-password"
							errors={field.state.meta.errors}
							label="密码"
							name={field.name}
							onBlur={field.handleBlur}
							onChange={field.handleChange}
							showErrors={
								field.state.meta.isBlurred || form.state.submissionAttempts > 0
							}
							type="password"
							value={field.state.value}
						/>
					)}
				</form.Field>

				<form.Field name="confirmPassword">
					{(field) => (
						<FormField
							autoComplete="new-password"
							errors={field.state.meta.errors}
							label="确认密码"
							name={field.name}
							onBlur={field.handleBlur}
							onChange={field.handleChange}
							showErrors={
								field.state.meta.isBlurred || form.state.submissionAttempts > 0
							}
							type="password"
							value={field.state.value}
						/>
					)}
				</form.Field>

				<form.Field name="email">
					{(field) => (
						<FormField
							autoComplete="email"
							errors={field.state.meta.errors}
							label="邮箱（选填）"
							name={field.name}
							onBlur={field.handleBlur}
							onChange={field.handleChange}
							showErrors={
								field.state.meta.isBlurred || form.state.submissionAttempts > 0
							}
							type="email"
							value={field.state.value}
						/>
					)}
				</form.Field>

				<form.Subscribe selector={selectIsSubmitting}>
					{(isSubmitting) => (
						<Button className="w-full" disabled={isSubmitting} type="submit">
							{isSubmitting ? (
								<>
									<Loader2 className="animate-spin" />
									注册中...
								</>
							) : (
								"注册"
							)}
						</Button>
					)}
				</form.Subscribe>
			</form>

			<p className="mt-4 text-center text-sm">
				已有账户？
				<Link className="underline underline-offset-4" href="/login">
					登录
				</Link>
			</p>
		</div>
	);
}
