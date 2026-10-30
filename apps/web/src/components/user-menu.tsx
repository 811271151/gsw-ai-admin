import { Button } from "@gsw-ai-admin/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@gsw-ai-admin/ui/components/dropdown-menu";
import { Skeleton } from "@gsw-ai-admin/ui/components/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { getDisplayName } from "@/lib/display-name";

const SIGN_OUT_FAILED = "退出登录失败，请稍后重试";

export default function UserMenu() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const { data: session, isPending } = authClient.useSession();

	const handleSignOut = useCallback(async () => {
		try {
			const { error } = await authClient.signOut();
			if (error) {
				toast.error(SIGN_OUT_FAILED);
				return;
			}
			// 清掉上一个用户的接口缓存，避免换账户登录后看到旧数据
			queryClient.clear();
			router.push("/login");
		} catch {
			toast.error(SIGN_OUT_FAILED);
		}
	}, [queryClient, router]);

	if (isPending) {
		return <Skeleton className="h-9 w-24" />;
	}

	if (!session) {
		return (
			<Link href="/login">
				<Button variant="outline">登录</Button>
			</Link>
		);
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger render={<Button variant="outline" />}>
				{getDisplayName(session.user)}
			</DropdownMenuTrigger>
			<DropdownMenuContent className="bg-card">
				<DropdownMenuGroup>
					<DropdownMenuLabel>我的账户</DropdownMenuLabel>
					<DropdownMenuSeparator />
					<DropdownMenuItem onClick={handleSignOut} variant="destructive">
						退出登录
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
