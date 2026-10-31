import { getAuthErrorMessage, signInSchema } from "@gsw-ai-admin/auth/schemas";
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
import { useCallback, useRef } from "react";
import { Text, View } from "react-native";

import { authClient } from "@/lib/auth-client";
import { queryClient } from "@/utils/trpc";

const SIGN_IN_FAILED = "登录失败，请稍后重试";

const selectIsSubmitting = (state: { isSubmitting: boolean }) =>
	state.isSubmitting;

// 只配置了 onSubmit 校验器，所以字段上有错误就说明已经尝试过提交
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

function SignIn() {
	const router = useRouter();
	const passwordInputRef = useRef<InputRef | null>(null);
	const { toast } = useToast();
	const { refetch: refetchSession } = authClient.useSession();

	const form = useForm({
		defaultValues: {
			password: "",
			username: "",
		},
		onSubmit: async ({ value }) => {
			try {
				// 移动端不传 rememberMe：会话由 expoClient 持久化在 SecureStore
				const { error } = await authClient.signIn.username({
					password: value.password,
					username: value.username.trim(),
				});
				if (error) {
					toast.show({
						label: getAuthErrorMessage(error.code, SIGN_IN_FAILED),
						variant: "danger",
					});
					return;
				}
				// 先把新会话拉进 useSession 再跳转：登录接口返回后会话原子里还是 null，
				// 直接跳首页会被首页的登录守卫当成未登录，立刻跳回登录屏幕
				await refetchSession();
				toast.show({ label: "登录成功", variant: "success" });
				// 缓存里可能是未登录时拿到的数据，换了会话后要作废
				queryClient.invalidateQueries();
				// dismissTo：栈里已有首页就退回到它（顺带移除之上的登录、注册屏幕），没有则替换当前屏幕。
				// 只用 replace 会在「首页→登录→注册→登录」后留下旧的登录屏幕，返回键能退回去
				router.dismissTo("/");
			} catch {
				toast.show({ label: SIGN_IN_FAILED, variant: "danger" });
			}
		},
		validators: {
			onSubmit: signInSchema,
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
		passwordInputRef.current?.focus();
	}, []);

	const goToRegister = useCallback(() => {
		router.push("/register");
	}, [router]);

	return (
		<Surface className="rounded-lg p-4" variant="secondary">
			<Text className="mb-4 font-medium text-foreground">登录</Text>

			<View className="gap-3">
				<form.Field name="username">
					{(field) => {
						const errorMessage = getFirstErrorMessage(field.state.meta.errors);
						return (
							<TextField isInvalid={!!errorMessage}>
								<Label>用户名</Label>
								<Input
									autoCapitalize="none"
									autoComplete="username"
									autoCorrect={false}
									blurOnSubmit={false}
									onBlur={field.handleBlur}
									onChangeText={field.handleChange}
									onSubmitEditing={focusPassword}
									placeholder="请输入用户名"
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
									autoComplete="current-password"
									onBlur={field.handleBlur}
									onChangeText={field.handleChange}
									onSubmitEditing={handleSubmit}
									placeholder="请输入密码"
									ref={passwordInputRef}
									returnKeyType="go"
									secureTextEntry
									textContentType="password"
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
								<Button.Label>登录</Button.Label>
							)}
						</Button>
					)}
				</form.Subscribe>

				<Button onPress={goToRegister} size="sm" variant="ghost">
					<Button.Label>还没有账户？立即注册</Button.Label>
				</Button>
			</View>
		</Surface>
	);
}

export { SignIn };
