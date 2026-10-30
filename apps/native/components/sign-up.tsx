import {
	getAuthErrorMessage,
	signUpSchema,
	toPlaceholderEmail,
} from "@gsw-ai-admin/auth/schemas";
import { useForm } from "@tanstack/react-form";
import { useRouter } from "expo-router";
import {
	Button,
	FieldError,
	Input,
	type InputRef,
	Label,
	Spinner,
	Surface,
	TextField,
	useToast,
} from "heroui-native";
import { type RefObject, useCallback, useRef } from "react";
import { Text, View } from "react-native";

import { authClient } from "@/lib/auth-client";

const SIGN_UP_FAILED = "注册失败，请稍后重试";

const selectIsSubmitting = (state: { isSubmitting: boolean }) =>
	state.isSubmitting;

// zod 校验器给出的是 issue 对象，其他来源可能是字符串，统一取第一条可读文案
function getFirstErrorMessage(errors: readonly unknown[]): string | null {
	for (const error of errors) {
		if (typeof error === "string" && error) {
			return error;
		}
		if (typeof error === "object" && error !== null) {
			const { message } = error as { message?: unknown };
			if (typeof message === "string" && message) {
				return message;
			}
		}
	}
	return null;
}

// 输入框挂载前 ref 为 null
function focusInput(ref: RefObject<InputRef | null>) {
	const input: InputRef | null = ref.current;
	if (input !== null) {
		input.focus();
	}
}

export function SignUp() {
	const router = useRouter();
	const { toast } = useToast();
	const passwordInputRef = useRef<InputRef>(null);
	const confirmPasswordInputRef = useRef<InputRef>(null);
	const emailInputRef = useRef<InputRef>(null);

	const form = useForm({
		defaultValues: {
			confirmPassword: "",
			email: "",
			password: "",
			username: "",
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
					toast.show({
						label: getAuthErrorMessage(error.code, SIGN_UP_FAILED),
						variant: "danger",
					});
					return;
				}
			} catch {
				toast.show({ label: SIGN_UP_FAILED, variant: "danger" });
				return;
			}

			// 走到这里账户已经建好。注册接口默认顺带登录，而需求是注册后回登录屏幕手动登录，所以先登出。
			// 原生端 expoClient 在发出 sign-out 请求前就清空了本地 cookie 和会话缓存，请求失败也不影响本机已是未登录；
			// 服务端残留的会话没有 cookie 再引用它，到期自动失效。所以登出结果不影响后续流程，
			// 只需要单独 try，避免它的网络异常被当成「注册失败」（用户重试只会得到「用户名已被使用」）
			try {
				await authClient.signOut();
			} catch {
				// 本地会话已清空，忽略
			}
			toast.show({ label: "注册成功，请登录", variant: "success" });
			// dismissTo：从登录页点「立即注册」过来时退回原登录屏幕，栈里不会留下两个登录屏幕
			router.dismissTo("/login");
		},
		// 只在提交时校验：onBlur 校验器的错误会过期，点「注册」时输入框先失焦、错误变化、按钮位移，点击就落空了
		validators: {
			onSubmit: signUpSchema,
		},
	});

	const handleSubmit = useCallback(() => {
		// 按钮在提交中会禁用，但键盘的「前往」键不会，这里拦住重复提交
		if (form.state.isSubmitting) {
			return;
		}
		form.handleSubmit();
	}, [form]);

	const focusPassword = useCallback(() => {
		focusInput(passwordInputRef);
	}, []);

	const focusConfirmPassword = useCallback(() => {
		focusInput(confirmPasswordInputRef);
	}, []);

	const focusEmail = useCallback(() => {
		focusInput(emailInputRef);
	}, []);

	return (
		<Surface className="rounded-lg p-4" variant="secondary">
			<Text className="mb-4 font-medium text-foreground">注册账户</Text>

			<View className="gap-3">
				{/* 校验只在提交时跑，所以字段上有错误就意味着已经提交过 */}
				<form.Field name="username">
					{(field) => {
						const errorMessage = getFirstErrorMessage(field.state.meta.errors);
						return (
							<TextField isInvalid={!!errorMessage}>
								<Label>用户名</Label>
								<Input
									autoCapitalize="none"
									autoComplete="username-new"
									autoCorrect={false}
									blurOnSubmit={false}
									onBlur={field.handleBlur}
									onChangeText={field.handleChange}
									onSubmitEditing={focusPassword}
									placeholder="字母、数字或下划线"
									returnKeyType="next"
									textContentType="username"
									value={field.state.value}
								/>
								<FieldError isInvalid={!!errorMessage}>
									{errorMessage}
								</FieldError>
							</TextField>
						);
					}}
				</form.Field>

				<form.Field name="password">
					{(field) => {
						const errorMessage = getFirstErrorMessage(field.state.meta.errors);
						return (
							<TextField isInvalid={!!errorMessage}>
								<Label>密码</Label>
								<Input
									autoCapitalize="none"
									autoComplete="new-password"
									blurOnSubmit={false}
									onBlur={field.handleBlur}
									onChangeText={field.handleChange}
									onSubmitEditing={focusConfirmPassword}
									placeholder="••••••"
									ref={passwordInputRef}
									returnKeyType="next"
									secureTextEntry
									textContentType="newPassword"
									value={field.state.value}
								/>
								<FieldError isInvalid={!!errorMessage}>
									{errorMessage}
								</FieldError>
							</TextField>
						);
					}}
				</form.Field>

				<form.Field name="confirmPassword">
					{(field) => {
						const errorMessage = getFirstErrorMessage(field.state.meta.errors);
						return (
							<TextField isInvalid={!!errorMessage}>
								<Label>确认密码</Label>
								<Input
									autoCapitalize="none"
									autoComplete="new-password"
									blurOnSubmit={false}
									onBlur={field.handleBlur}
									onChangeText={field.handleChange}
									onSubmitEditing={focusEmail}
									placeholder="••••••"
									ref={confirmPasswordInputRef}
									returnKeyType="next"
									secureTextEntry
									textContentType="newPassword"
									value={field.state.value}
								/>
								<FieldError isInvalid={!!errorMessage}>
									{errorMessage}
								</FieldError>
							</TextField>
						);
					}}
				</form.Field>

				<form.Field name="email">
					{(field) => {
						const errorMessage = getFirstErrorMessage(field.state.meta.errors);
						return (
							<TextField isInvalid={!!errorMessage}>
								<Label>邮箱（选填）</Label>
								<Input
									autoCapitalize="none"
									autoComplete="email"
									keyboardType="email-address"
									onBlur={field.handleBlur}
									onChangeText={field.handleChange}
									onSubmitEditing={handleSubmit}
									placeholder="email@example.com"
									ref={emailInputRef}
									returnKeyType="go"
									textContentType="emailAddress"
									value={field.state.value}
								/>
								<FieldError isInvalid={!!errorMessage}>
									{errorMessage}
								</FieldError>
							</TextField>
						);
					}}
				</form.Field>

				<form.Subscribe selector={selectIsSubmitting}>
					{(isSubmitting) => (
						<Button
							className="mt-1"
							isDisabled={isSubmitting}
							onPress={handleSubmit}
						>
							{isSubmitting ? (
								<Spinner color="default" size="sm" />
							) : (
								<Button.Label>注册</Button.Label>
							)}
						</Button>
					)}
				</form.Subscribe>
			</View>
		</Surface>
	);
}
