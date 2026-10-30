interface NamedUser {
	displayUsername?: string | null;
	name: string;
	username?: string | null;
}

// 不用 email：没填邮箱注册的账户，email 是 {username}@users.local 占位邮箱
export const getDisplayName = (user: NamedUser): string =>
	user.displayUsername || user.username || user.name;
