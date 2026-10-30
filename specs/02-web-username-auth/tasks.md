# Web 端用户名注册登录 任务清单

> 完成任务且 CR、测试都过后，才把 `- [ ]` 改成 `- [x]`（由 W7 统一勾选）

## 批次建议

| 批次 | 任务 | 方式 | 理由 |
|------|------|------|------|
| 1 | T-01 | 串行 | auth-client 与公共组件是后续任务的基础 |
| 2 | T-02, T-03 | 并行 | 注册页与登录页文件不重叠 |
| 3 | T-04 | 串行 | 依赖登录与登出流程 |
| 4 | T-05 | 串行 | 依赖前面全部 |

## 任务

- [ ] T-01: [前端] `auth-client` 加 `usernameClient()`；新增 `password-input.tsx`、`lib/safe-redirect.ts`（~1h）
- [ ] T-02: [前端] 新增 `/register` 页，重写 `sign-up-form`（用户名/密码/确认密码/选填邮箱、错误码映射、成功跳 `/login`），覆盖 AC-01~AC-05（~2h）
- [ ] T-03: [前端] `/login` 改为 Server Component + 重写 `sign-in-form`（用户名/密码/记住我、redirect 回跳、错误码映射），覆盖 AC-06~AC-09、AC-11~AC-12（~2h）
- [ ] T-04: [前端] `dashboard` 未登录带 redirect 跳转、显示用户名；`user-menu` 显示用户名并改登出逻辑，覆盖 AC-10、AC-13~AC-15（~1.5h）
- [ ] T-05: [测试] `getSafeRedirect` Vitest 单元测试；引入 Playwright，E2E 覆盖 AC-01~AC-15（~3h）
