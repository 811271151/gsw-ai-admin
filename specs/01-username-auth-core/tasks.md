# 用户名认证服务端与共享校验 任务清单

> 完成任务且 CR、测试都过后，才把 `- [ ]` 改成 `- [x]`（由 W7 统一勾选）

## 批次建议

| 批次 | 任务 | 方式 | 理由 |
|------|------|------|------|
| 1 | T-01 | 串行 | 先加插件，auth:generate 才能生成 schema |
| 2 | T-02, T-03 | 并行 | 数据库迁移与共享 schema 文件不重叠 |
| 3 | T-04 | 串行 | 测试基础设施先于测试用例 |
| 4 | T-05 | 串行 | 依赖前面全部 |

## 任务

- [x] T-01: [后端] `createAuth` 加入 username 插件（3-20 位、`USERNAME_PATTERN` 校验）与 `minPasswordLength: 6`，`session.expiresIn` 设为 30 天（~1h）
- [x] T-02: [数据] 执行 `pnpm run auth:generate` 更新 auth.prisma，`db:generate` + `db:push` 同步开发库（~1h）
- [x] T-03: [契约] 新增 `packages/auth/src/schemas.ts`：`USERNAME_PATTERN`、`signUpSchema`、`signInSchema`、`toPlaceholderEmail`、`AUTH_ERROR_MESSAGES`（错误码 → 中文文案），中文错误文案（~1.5h）
- [ ] T-04: [配置] 引入 Vitest，配置根 `test` 脚本与 turbo `test` 任务（~1h）
- [ ] T-05: [测试] schema 单元测试覆盖 AC-15~AC-17；服务端集成测试（`auth.api.*` 直调测试库）覆盖 AC-01~AC-14（~3h）
