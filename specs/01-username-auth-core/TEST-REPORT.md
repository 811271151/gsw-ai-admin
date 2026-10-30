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

---

## 批次 2：T-03（2026-10-30）

### 套件结果

- 单元测试：项目尚未配置测试脚本（Vitest 由 T-04 引入，T-05 补正式用例）
- 构建验证：✅ `packages/auth`、`apps/server` 的 `tsc --noEmit` 通过；`biome check packages/auth/src` 0 错误

### AC 对账

验证方式：用 `tsx` 临时脚本导入 `packages/auth/src/schemas.ts`，调用 `safeParse` 检查结果，脚本运行后已删除。

| AC | 描述 | 结果 | 依据 |
|----|------|------|------|
| AC-15 | 两次密码不一致 | ✅ | issue path=`confirmPassword`，message=「两次输入的密码不一致」 |
| AC-16 | 邮箱选填与格式 | ✅ | `""` 通过；`abc` →「请输入有效的邮箱地址」；`x@USERS.local` →「该邮箱域名不可用」；`bob@x.com` 通过 |
| AC-17 | 占位邮箱 | ✅ | `toPlaceholderEmail("Alice")` = `alice@users.local` |

附加检查：用户名 `a-b` →「用户名只能包含字母、数字和下划线」；`signInSchema` 空用户名、空密码分别报「请输入用户名」「请输入密码」；`getAuthErrorMessage` 对已知错误码返回中文提示，对未知错误码或空错误码返回调用方传入的默认文案。

### 结论

通过（3/3）

---

## 批次 3：T-04（2026-10-30）

T-04 只配置测试基础设施，requirement.md 里没有对应的 AC。本批次只验证配置本身能用。

### 套件结果

- `pnpm install --frozen-lockfile --offline`：✅ lockfile 与各 package.json 一致
- `pnpm test`（`turbo run test`）：✅ 退出码 0，2/2 个任务成功（`@gsw-ai-admin/auth`、`server`）。两个包都还没有测试文件，`--passWithNoTests` 让它们正常退出
- `vitest --version`：5.0.5

### 结论

通过（配置验证 3/3）
