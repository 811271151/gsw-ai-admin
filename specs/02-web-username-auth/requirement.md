# Web 端用户名注册登录

## 背景

Web 端（Next.js，端口 3001）现有 `/login` 页在一个页面里切换邮箱登录/注册表单。本 feature 改为用户名认证，并拆成独立的 `/login` 与 `/register` 页面，加上受保护路由和回跳。

## 需求项

### R-01 注册页 `/register`
表单字段：用户名、密码、确认密码、邮箱（选填）。使用 01 的 `signUpSchema`，失焦即校验。密码框可切换明文。提交中按钮显示 loading 并禁用。

验收标准：
- [ ] AC-01 用户名输入 `ab` 后失焦 → 字段下方显示「用户名至少需要 3 个字符」
- [ ] AC-02 两次密码不一致提交 → 确认密码下方显示「两次输入的密码不一致」，不发请求
- [ ] AC-03 合法输入且不填邮箱 → 注册成功，toast「注册成功，请登录」，跳转 `/login`
- [ ] AC-04 用户名已存在 → toast「该用户名已被使用」，停留在注册页
- [ ] AC-05 点击密码框的显示按钮 → 输入框 type 在 password / text 间切换

### R-02 登录页 `/login`
表单字段：用户名、密码、记住我（复选框，默认不勾选）。底部有「还没有账户？立即注册」链接到 `/register`。

验收标准：
- [ ] AC-06 正确用户名密码 → 跳转 `/dashboard`（或 `redirect` 参数指定的站内路径）
- [ ] AC-07 错误密码或不存在的用户名 → toast「用户名或密码不正确」，两种情况文案相同
- [ ] AC-08 网络不可达 → toast「登录失败，请稍后重试」
- [ ] AC-09 点击「立即注册」→ 进入 `/register`；注册页「已有账户？登录」→ 回到 `/login`

### R-03 受保护路由与回跳
`/dashboard` 未登录访问时跳到 `/login?redirect=/dashboard`。`redirect` 只接受以 `/` 开头且不以 `//` 开头的站内路径。已登录访问 `/login` 或 `/register` 时直接跳 `/dashboard`。

验收标准：
- [ ] AC-10 未登录打开 `/dashboard` → 地址变为 `/login?redirect=%2Fdashboard`，登录后回到 `/dashboard`
- [ ] AC-11 `/login?redirect=https://evil.com` 登录成功 → 跳 `/dashboard`，不跳外站
- [ ] AC-12 已登录打开 `/login` → 跳 `/dashboard`

### R-04 用户信息与登出
Header 的用户菜单与 Dashboard 显示用户名（`displayUsername`，缺省回退 `username`），不显示占位邮箱。点击「退出登录」后清空 React Query 缓存并跳 `/login`。

验收标准：
- [ ] AC-13 登录 `Alice` 后，用户菜单按钮显示 `Alice`
- [ ] AC-14 无邮箱注册的账户，用户菜单不出现 `@users.local`
- [ ] AC-15 点击退出登录 → 跳 `/login`；再访问 `/dashboard` → 被重定向回 `/login`

## 依赖
- 依赖 feature：01-username-auth-core
- 外部依赖：server 运行在 `NEXT_PUBLIC_SERVER_URL`

## 非目标
- 跨标签页登出同步（Better Auth 未内置，需求里的「跨标签页同步」移到 P1）
- 忘记密码链接
