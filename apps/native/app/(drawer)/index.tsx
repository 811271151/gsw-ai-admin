import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Redirect } from "expo-router";
import { Card, Chip, Spinner, useThemeColor } from "heroui-native";
import { useCallback } from "react";
import { Pressable, Text, View } from "react-native";

import { Container } from "@/components/container";
import { authClient } from "@/lib/auth-client";
import { getDisplayName } from "@/lib/display-name";
import { queryClient, trpc } from "@/utils/trpc";

type ConnectionState = "checking" | "connected" | "disconnected";

const CONNECTION_STATUS = {
	checking: { icon: "hourglass-outline", label: "Checking connection..." },
	connected: { icon: "checkmark-circle", label: "Connected to API" },
	disconnected: { icon: "close-circle", label: "API Disconnected" },
} as const satisfies Record<ConnectionState, { icon: string; label: string }>;

const getConnectionState = (
	isLoading: boolean,
	isConnected: boolean
): ConnectionState => {
	if (isLoading) {
		return "checking";
	}
	return isConnected ? "connected" : "disconnected";
};

export default function Home() {
	const { data: session, isPending } = authClient.useSession();
	const isSignedIn = Boolean(session?.user);
	const healthCheck = useQuery(trpc.healthCheck.queryOptions());
	// 未登录时这个接口必然 401，等确认登录后再请求
	const privateData = useQuery({
		...trpc.privateData.queryOptions(),
		enabled: isSignedIn,
	});
	const isConnected = healthCheck.data === "OK";
	const connection = getConnectionState(healthCheck.isLoading, isConnected);
	const status = CONNECTION_STATUS[connection];

	const statusColors: Record<ConnectionState, string> = {
		checking: useThemeColor("muted"),
		connected: useThemeColor("success"),
		disconnected: useThemeColor("danger"),
	};

	const handleSignOut = useCallback(async () => {
		try {
			await authClient.signOut();
		} catch {
			// 原生端 expoClient 发请求前就清空了本地会话，请求失败也已是未登录
		}
		// 清掉上一个用户的接口缓存，避免换账户登录后看到旧数据
		queryClient.clear();
		// 不手动跳转：会话变为 null 后本页重新渲染，由下面的 <Redirect> 回到登录屏幕
	}, []);

	if (isPending) {
		return (
			<Container className="items-center justify-center" isScrollable={false}>
				<Spinner />
			</Container>
		);
	}

	if (!session?.user) {
		return <Redirect href="/login" />;
	}

	return (
		<Container className="p-6">
			<View className="mb-6 py-4">
				<Text className="mb-2 font-bold text-4xl text-foreground">
					BETTER T STACK
				</Text>
			</View>

			<Card className="mb-6 p-4" variant="secondary">
				<Text className="mb-4 text-base text-foreground">
					欢迎，
					<Text className="font-medium">{getDisplayName(session.user)}</Text>
				</Text>
				<Pressable
					className="self-start rounded-lg bg-danger px-4 py-3 active:opacity-70"
					onPress={handleSignOut}
				>
					<Text className="font-medium text-foreground">退出登录</Text>
				</Pressable>
			</Card>

			<Card className="p-6" variant="secondary">
				<View className="mb-4 flex-row items-center justify-between">
					<Card.Title>System Status</Card.Title>
					<Chip
						color={isConnected ? "success" : "danger"}
						size="sm"
						variant="secondary"
					>
						<Chip.Label>{isConnected ? "LIVE" : "OFFLINE"}</Chip.Label>
					</Chip>
				</View>

				<Card className="p-4">
					<View className="flex-row items-center">
						<View
							className={`mr-3 h-3 w-3 rounded-full ${isConnected ? "bg-success" : "bg-muted"}`}
						/>
						<View className="flex-1">
							<Text className="mb-1 font-medium text-foreground">
								TRPC Backend
							</Text>
							<Card.Description>{status.label}</Card.Description>
						</View>
						<Ionicons
							color={statusColors[connection]}
							name={status.icon}
							size={20}
						/>
					</View>
				</Card>
			</Card>

			<Card className="mt-6 p-4" variant="secondary">
				<Card.Title className="mb-3">Private Data</Card.Title>
				<Card.Description>{privateData.data?.message}</Card.Description>
			</Card>
		</Container>
	);
}
