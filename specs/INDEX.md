# Feature 索引

> 来源：docs/需求.md（P0 范围）
> 生成：2026-10-30 · gsw-prd-splitter

| 序号 | Feature | 目录 | 依赖 | 状态 |
|------|---------|------|------|------|
| 01 | 用户名认证服务端与共享校验 | 01-username-auth-core | — | ✅ 已完成 |
| 02 | Web 端用户名注册登录 | 02-web-username-auth | 01 | 🚧 开发中 |
| 03 | 移动端用户名注册登录 | 03-native-username-auth | 01 | ⏳ 待开发 |

## 拆分口径（已与用户确认）

- 邮箱改为**选填**：未填写时由客户端按 `{username}@users.local` 生成占位邮箱（Better Auth 的 user 表强制要求 email）
- 登录失败**统一提示**「用户名或密码不正确」，不区分用户名不存在与密码错误（与 Better Auth 默认行为一致，防用户名枚举）
- 「账户禁用」「5 次失败锁定 15 分钟」**移到 P1**，本期不做

- 测试框架：Vitest（单元 + 服务端集成）+ Playwright（Web E2E）；移动端用 check-types + 手动对账。`/codex-review` 只负责 W5 代码评审
- 「记住我」：会话有效期全局 30 天；不勾选时 session cookie 不设 Max-Age，关闭浏览器即失效。不实现「7 天 / 30 天」两档
