# 01-username-auth-core Code Review 报告

> 评审工具：轮次 1 用 codex-cli 0.164.0（`codex exec -s read-only`）；轮次 2 起用 codex 插件 1.0.6 的 `/codex:review` 内置评审（`codex-companion.mjs review --scope working-tree`）。

## 轮次 1（2026-10-30）· 批次 T-01

范围：`packages/auth/src/index.ts`、`packages/auth/src/schemas.ts`

发现：P0 x0 / P1 x1 / P2 x0

- **可修复 x1**：P1 `index.ts` 启用 username 插件，但 Prisma `User` 模型没有 `username`、`displayUsername` 字段，注册和登录会失败。
  - 处理：提前执行 T-02 的 `pnpm run auth:generate`，`auth.prisma` 已新增 `username String? @@unique` 和 `displayUsername String?`，Prisma Client 已重新生成，`packages/auth` 与 `apps/server` 类型检查通过。
  - **未完成**：`prisma db push` 报 P1001，`localhost:5432` 上没有运行 PostgreSQL，数据库表尚未同步。
- 误报 x0
- 需决策 x0

附带发现（不属于本批次改动）：`biome.json` 的 `nursery.useTailwindSortedClasses` 在 Biome 2.5.15 中是未知键，`ultracite check/fix` 直接报配置错误退出。`.claude/settings.json` 里写文件后自动运行的 `ultracite fix` hook 因此一直没有生效。

## 轮次 1 之后的修复

- 用户在本地装好 PostgreSQL 18 后，更新 `apps/server/.env` 的 `DATABASE_URL` 密码，`prisma db push` 成功，数据库已同步 `username` / `displayUsername` 列
- 修复 `biome.json`：`nursery.useTailwindSortedClasses` 改为 Biome 2.5.15 的规则名 `useSortedClasses`
- 修复 `apps/fumadocs/biome.json`：加 `"root": false`，否则 Biome 2 报「嵌套根配置」并退出
- 按项目 Biome 规则格式化 `packages/auth/src/index.ts`、`schemas.ts`（缩进改 tab、对象键排序、`type AuthConfig` 改 `interface`）

## 轮次 2（复审，2026-10-30）

范围：working tree 全部改动

发现：P0 x0 / P1 x0 / P2 x0。Codex 结论：「No actionable defects」，并对照 Better Auth 1.7.12 源码确认了 username 插件与 cookie 行为。

说明：Codex 在只读沙箱里跑 tsc 时缺依赖访问权限未完成，Claude 在本机独立执行 `packages/auth`、`apps/server` 的 `tsc --noEmit` 均通过，`biome check packages/auth/src` 0 错误。

剩余 P0/P1: 0 ✅

## 最终结论

通过（2 轮）
