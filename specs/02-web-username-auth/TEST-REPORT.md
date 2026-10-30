# 02-web-username-auth 测试报告

## 批次 1：T-01（2026-10-30）

T-01 是基础任务，只做三件事：auth-client 接入 `usernameClient`、新增 `PasswordInput` 组件、新增 `getSafeRedirect`。requirement.md 里没有只靠 T-01 就能验收的 AC：AC-05（密码显示切换）在 T-02 接入页面后验收，AC-11（外站 redirect）在 T-03 接入登录流程后验收，T-05 再用 Playwright 做端到端覆盖。

### 套件结果

- 单元测试：web 还没有接入 Vitest（T-05 引入）
- 构建验证：✅ `pnpm --filter web build`（Next.js 16.4.2 / Turbopack）编译成功，4 个路由全部生成；`apps/web` 的 `tsc --noEmit` 通过；`biome check` 0 错误
- `getSafeRedirect` 自检：15/15 个输入符合预期（明细见 CR-REPORT.md）

说明：修复 CR P2 后只改了 `safe-redirect.ts`，目前还没有页面引用这个文件，所以只重跑了 `tsc` 和 `biome`，没有重新 build。

### 结论

通过（构建验证 + helper 自检；AC 在 T-02 / T-03 / T-05 验收）
