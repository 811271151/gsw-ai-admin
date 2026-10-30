# 01-username-auth-core 测试报告

## 批次 1：T-01 + T-02（2026-10-30）

> T-02（数据库字段）因 CR 轮次 1 的 P1 提前合入本批次。

### 套件结果

- 单元测试：项目尚未配置测试脚本（Vitest 由本 feature 的 T-04 引入）
- 集成测试：同上；本批次改为启动服务后手工调用认证接口对账
- 构建验证：✅ `packages/auth`、`apps/server` 的 `tsc --noEmit` 通过；`biome check packages/auth/src` 0 错误；`pnpm run dev`（apps/server）正常启动，`GET /` 返回 OK

### AC 对账

验证方式：本地 PostgreSQL 18 + `apps/server` dev 服务，用 Node `fetch` 直调 `/api/auth/*`（带 `Origin: http://localhost:3001`），测试账号带随机后缀，验证后已从数据库删除。

| AC | 描述 | 结果 | 依据 |
|----|------|------|------|
| AC-01 | 用户名 `ab` 被拒 | ✅ | 400 USERNAME_TOO_SHORT |
| AC-02 | 21 位用户名被拒 | ✅ | 400 USERNAME_TOO_LONG |
| AC-03 | `a-b!` 被拒 | ✅ | 400 INVALID_USERNAME |
| AC-04 | 大写重复用户名被拒 | ✅ | 400 USERNAME_IS_ALREADY_TAKEN |
| AC-05 | 占位邮箱注册成功 | ✅ | 200，email = `{username}@users.local`（占位邮箱由测试代客户端生成，客户端函数在 T-03） |
| AC-06 | 真实邮箱注册成功 | ✅ | 200，email 原样保存 |
| AC-07 | 5 位密码被拒 | ✅ | 400 PASSWORD_TOO_SHORT |
| AC-08 | 正确用户名密码登录 | ✅ | 200，带 session_token cookie |
| AC-09 | 错误密码 | ✅ | 401 INVALID_USERNAME_OR_PASSWORD |
| AC-10 | 不存在的用户名 | ✅ | 401，错误码和 message 与 AC-09 完全相同 |
| AC-11 | 大写用户名登录 | ✅ | 200 |
| AC-12 | 会话含 username | ✅ | get-session 返回 user.username |
| AC-13 | 记住我 cookie 行为 | ✅ | rememberMe=false 无 Max-Age；rememberMe=true Max-Age=2592000 |
| AC-14 | 登出后会话失效 | ✅ | sign-out 后 get-session 返回 null |
| AC-15~17 | 共享 schema | ⏭ 不属于本批次 | T-03 实现，T-05 测试 |

说明：需求里 AC-01~AC-04、AC-07 只要求错误码，未规定 HTTP 状态码；实测为 400。

### 结论

通过（14/14，AC-15~17 待后续批次）
