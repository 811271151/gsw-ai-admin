"use client";

import { getAuthErrorMessage, signInSchema } from "@gsw-ai-admin/auth/schemas";
import { Button } from "@gsw-ai-admin/ui/components/button";
import { useForm } from "@tanstack/react-form";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";

import FormField from "./form-field";

const SIGN_IN_FAILED = "登录失败，请稍后重试";

const selectIsSubmitting = (state: { isSubmitting: boolean }) =>
	state.isSubmitting;

export default function SignInForm({
	onSwitchToSignUp,
}: {
	onSwitchToSignUp: () => void;
}) {
	const router = useRouter();

	const form = useForm({
		defaultValues: {
			password: "",
			username: "",
		},
		onSubmit: async ({ value }) => {
			try {
				const { error } = await authClient.signIn.username({
					password: value.password,
					username: value.username.trim(),
				});
				if (error) {
					toast.error(getAuthErrorMessage(error.code, SIGN_IN_FAILED));
					return;
				}
				toast.success("登录成功");
				router.push("/dashboard");
			} catch {
				toast.error(SIGN_IN_FAILED);
			}
		},
		validators: {
			onSubmit: signInSchema,
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

			<div className="mt-4 text-center">
				<Button onClick={onSwitchToSignUp} variant="link">
					还没有账户？立即注册
				</Button>
			</div>
		</div>
	);
}
