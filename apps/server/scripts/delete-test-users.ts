import { db } from "../src/services";

// E2E 收尾用：按用户名前缀删除测试账号。只接受 e2e_ 开头的前缀，防止误删真实用户
const TEST_PREFIX_PATTERN = /^e2e_[a-z0-9]+_$/;

const prefix = process.argv[2] ?? "";
if (!TEST_PREFIX_PATTERN.test(prefix)) {
	throw new Error(
		`refusing to delete users: prefix must match ${TEST_PREFIX_PATTERN}`
	);
}

const { count } = await db.user.deleteMany({
	where: { username: { startsWith: prefix } },
});
process.stdout.write(`deleted ${count} test users with prefix ${prefix}\n`);
await db.$disconnect();
