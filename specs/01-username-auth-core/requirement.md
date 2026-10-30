# 用户名认证服务端与共享校验

## 背景

脚手架自带的是邮箱 + 密码认证（`emailAndPassword` + `signIn.email`）。需求要求改为用户名 + 密码。本 feature 在服务端启用 Better Auth username 插件、迁移数据库，并在 `packages/auth` 提供 Web 与移动端共用的表单校验 schema，是 02、03 的前置。

## 需求项

### R-01 用户名规则
用户名 3-20 个字符，只允许字母、数字、下划线；大小写不敏感地唯一（`Alice` 与 `alice` 视为同一用户名）。服务端和客户端使用同一套规则。

验收标准：
- [ ] AC-01 注册用户名 `ab` → 服务端拒绝，返回 USERNAME_TOO_SHORT
- [ ] AC-02 注册用户名长度 21 → 服务端拒绝，返回 USERNAME_TOO_LONG
- [ ] AC-03 注册用户名 `a-b!` → 服务端拒绝，返回 INVALID_USERNAME
- [ ] AC-04 已存在 `alice`，再注册 `Alice` → 返回 USERNAME_IS_ALREADY_TAKEN

### R-02 用户名注册
输入用户名、密码（≥ 6 位）、可选邮箱。未填邮箱时使用占位邮箱 `{username 小写}@users.local`。注册成功后 user 表写入 `username`，`name` 默认等于用户名。

验收标准：
- [ ] AC-05 `{username:"alice", password:"123456"}`（无邮箱）→ 注册成功，user.email = `alice@users.local`
- [ ] AC-06 `{username:"bob", password:"123456", email:"bob@x.com"}` → 注册成功，user.email = `bob@x.com`
- [ ] AC-07 密码 `12345`（5 位）→ 服务端拒绝，返回 PASSWORD_TOO_SHORT

### R-03 用户名登录
通过 `POST /api/auth/sign-in/username` 登录。用户名不存在或密码错误时返回同一错误码，客户端统一提示「用户名或密码不正确」。

验收标准：
- [ ] AC-08 正确用户名 + 密码 → 200，响应带 session cookie
- [ ] AC-09 正确用户名 + 错误密码 → 401 INVALID_USERNAME_OR_PASSWORD
- [ ] AC-10 不存在的用户名 → 401 INVALID_USERNAME_OR_PASSWORD（与 AC-09 完全相同）
- [ ] AC-11 用 `ALICE` 登录 `alice` 的账户 → 成功

### R-04 会话与登出
登录后可通过 `GET /api/auth/get-session` 取得会话；`rememberMe: false` 时 session cookie 不设 Max-Age（关闭浏览器失效）。登出后会话失效。

验收标准：
- [ ] AC-12 登录后 get-session 返回的 user 含 `username` 字段
- [ ] AC-13 `rememberMe: false` 登录 → Set-Cookie 的 session_token 无 Max-Age；`rememberMe: true` → Max-Age = 2592000（30 天）
- [ ] AC-14 sign-out 后再调 get-session → 返回 null

### R-05 共享校验 schema
`packages/auth` 导出 `signUpSchema`、`signInSchema`、`toPlaceholderEmail()`，错误文案为中文，供 02、03 复用。

验收标准：
- [ ] AC-15 `signUpSchema` 对密码与确认密码不一致 → 报错「两次输入的密码不一致」，path 为 `confirmPassword`
- [ ] AC-16 `signUpSchema` 邮箱填空字符串 → 通过；填 `abc` → 报错「请输入有效的邮箱地址」；填 `x@users.local` → 报错「该邮箱域名不可用」
- [ ] AC-17 `toPlaceholderEmail("Alice")` → `alice@users.local`

## 依赖
- 依赖 feature：无
- 外部依赖：PostgreSQL（`DATABASE_URL`），Better Auth 1.7.12 username 插件

## 非目标
- 账户禁用、登录失败锁定（P1）
- 邮箱验证、找回密码（P1 以后）
- 7 天 / 30 天两档会话时长（用户确认改为全局 30 天 + 不勾选时关浏览器失效）
