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

---

## 批次 4：T-05（2026-10-30）· 正式自动化测试

### 套件结果

- 单元测试 `packages/auth/src/schemas.test.ts`：15/15 ✅
- 集成测试 `apps/server/src/auth.integration.test.ts`：13/13 ✅。测试直接调用 `auth.handler`，配置与线上一致，连的是本地 PostgreSQL 18，耗时约 0.9s
- 命令：根目录 `pnpm test`，退出码 0
- 构建验证：✅ 两个包的 `tsc --noEmit` 通过，`biome check` 0 错误
- 数据清理：测试用户名带随机后缀，`afterAll` 中删除。跑完后查库，残留测试用户为 0

### AC 对账（自动化，取代批次 1~2 的手工对账）

| AC | 结果 | 依据 |
|----|------|------|
| AC-01 | ✅ | 集成测试「AC-01 用户名少于 3 位被拒」 |
| AC-02 | ✅ | 集成测试「AC-02」 |
| AC-03 | ✅ | 集成测试「AC-03」 |
| AC-04 | ✅ | 集成测试「AC-04 用户名大小写不敏感唯一」 |
| AC-05 | ✅ | 集成测试「AC-05」 |
| AC-06 | ✅ | 集成测试「AC-06」 |
| AC-07 | ✅ | 集成测试「AC-07」 |
| AC-08 | ✅ | 集成测试「AC-08」 |
| AC-09 | ✅ | 集成测试「AC-09 / AC-10」：401 INVALID_USERNAME_OR_PASSWORD |
| AC-10 | ✅ | 同上：用户不存在时的响应体与密码错误时完全相同 |
| AC-11 | ✅ | 集成测试「AC-11」 |
| AC-12 | ✅ | 集成测试「AC-12」 |
| AC-13 | ✅ | 集成测试「AC-13」：勾选记住我时 Max-Age=2592000；不勾选时没有 Max-Age |
| AC-14 | ✅ | 集成测试「AC-14」：登出前能取到会话，登出后 get-session 返回 null |
| AC-15 | ✅ | 单元测试「AC-15」 |
| AC-16 | ✅ | 单元测试「AC-16」×4 |
| AC-17 | ✅ | 单元测试「AC-17」 |

与 design.md 的差异：design.md 的风险表写的是「缺 DATABASE_URL 时跳过集成测试」。实际上 varlock 把 `DATABASE_URL` 定义为必填，缺了这个变量，导入 env 时就直接报错，测试会失败而不是被跳过。我认为直接失败比悄悄跳过更容易发现问题，所以没有再加跳过逻辑。

### 结论

通过（单元 15/15，集成 13/13，AC 17/17）
