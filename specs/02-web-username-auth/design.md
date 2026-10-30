# Web 端用户名注册登录 - 技术设计方案

> **技术方案基于**: 项目技术架构文档 (AGENTS.md) + 现有脚手架代码

## 架构设计

```
apps/web/src
├─ lib/auth-client.ts          加 usernameClient() 插件
├─ lib/safe-redirect.ts        新增：校验 redirect 参数
├─ app/login/page.tsx          改为 Server Component：已登录 → /dashboard；否则渲染 <SignInForm/>
├─ app/register/page.tsx       新增：同上，渲染 <SignUpForm/>
├─ app/dashboard/page.tsx      未登录 → /login?redirect=/dashboard；显示用户名
├─ components/sign-in-form.tsx 改为用户名 + 记住我
├─ components/sign-up-form.tsx 改为用户名 + 密码 + 确认密码 + 选填邮箱
├─ components/password-input.tsx 新增：带显示/隐藏按钮的密码框
└─ components/user-menu.tsx    显示用户名，登出后清缓存跳 /login
```

### 技术选型

| 层次 | 技术栈 | 理由 |
|------|--------|------|
| 框架 | Next.js 16 App Router | AGENTS.md 指定 |
| 表单 | @tanstack/react-form + 01 的 Zod schema | AGENTS.md 指定；现有表单已用 |
| UI | `@gsw-ai-admin/ui`（Button / Input / Label / Checkbox） | 已有组件优先复用 |
| 提示 | sonner `toast` | 现有表单已用 |
| 认证客户端 | `better-auth/react` + `better-auth/client/plugins` 的 `usernameClient` | 与服务端插件配对 |

## 接口调用

```ts
// 注册
authClient.signUp.email({
  username: value.username,
  displayUsername: value.username,
  name: value.username,
  email: value.email || toPlaceholderEmail(value.username),
  password: value.password,
});

// 登录
authClient.signIn.username({ username, password, rememberMe });

// 登出
authClient.signOut({ fetchOptions: { onSuccess: () => { queryClient.clear(); router.push("/login"); } } });
```

## 关键逻辑

1. **错误码映射**：`error.error.code` → 中文文案，集中在 `sign-in-form` / `sign-up-form` 内的常量表：
   - `USERNAME_IS_ALREADY_TAKEN` → 「该用户名已被使用」
   - `INVALID_USERNAME_OR_PASSWORD` → 「用户名或密码不正确」
   - 无 code（网络异常）→ 「登录失败，请稍后重试」/「注册失败，请稍后重试」
2. **安全回跳**：`getSafeRedirect(value)` 仅当值以 `/` 开头且不以 `//` 开头时返回原值，否则返回 `/dashboard`（防开放重定向）。
3. **页面级鉴权**：沿用 `dashboard/page.tsx` 现有做法，在 Server Component 里用 `authClient.getSession({ fetchOptions: { headers: await headers() } })` 判定。不引入 Next 16 的 `proxy.ts`，保持与现有代码一致。
4. **用户名展示**：`user.displayUsername ?? user.username ?? user.name`，不渲染 `user.email`（可能是占位邮箱）。
5. **typedRoutes**：`next.config` 开启了 `typedRoutes`，新增 `/register` 后 `Link href` 需走类型校验。

## 安全设计

- Cookie 由 Better Auth 设置为 httpOnly，前端不接触 token
- redirect 参数白名单校验（AC-11）
- 表单不在 URL 里携带密码（POST）

## 风险评估

| 风险项 | 等级 | 影响 | 应对方案 |
|--------|------|------|----------|
| E2E 需要 server + web + 数据库同时运行 | 中 | 本地缺库时无法跑 | Playwright `webServer` 拉起两端；缺 `DATABASE_URL` 时在 TEST-REPORT 标注 |

---
*本文档由 gsw-prd-splitter 自动生成于 2026-10-30*
