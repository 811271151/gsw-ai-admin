# 02-web-username-auth Code Review 报告

> 评审工具：codex 插件 1.0.6 的 `/codex:review`（`codex-companion.mjs review --wait --scope working-tree`），每个批次只送审 1 轮。

## 批次 T-01 · Codex 意见（2026-10-30）

范围：`apps/web/package.json`、`pnpm-lock.yaml`、`apps/web/src/lib/auth-client.ts`、`apps/web/src/lib/safe-redirect.ts`、`apps/web/src/components/password-input.tsx`（另有 `specs/INDEX.md` 状态改动）

P0 x0 / P1 x0 / P2 x1

- [P2] safe-redirect 没有拒绝控制字符 — `apps/web/src/lib/safe-redirect.ts:8-11`
  - 问题：`/\n/evil.com`、`/\t/evil.com` 能通过前缀检查。浏览器解析时会去掉换行和 Tab，最后跳到 `https://evil.com/`
  - 分类：**可修复**。虽然标为 P2，但这个 helper 的目的就是防开放重定向（R-03 / AC-11），这是真实的绕过路径，所以修复
  - 修复：不再只比字符串前缀，改为用 `new URL(value, "http://redirect.invalid")` 解析，只有解析后 origin 仍是这个哨兵域名时，才返回 `pathname + search + hash`。换行、Tab、反斜杠的规范化都交给 URL 解析器，与浏览器的处理方式一致
  - 自检：用 15 个输入验证全部符合预期，包括 `/\n/evil.com`、`/\t/evil.com`、`/\r\n/evil.com`、`/\evil.com`、`/\/evil.com`、`//evil.com`、`https://evil.com`、`javascript:alert(1)`、空值，以及带 query 和 hash 的站内路径。`tsc`、`biome` 通过

## 结论（批次 T-01）

P0/P1 已全部修复（本批次无 P0/P1；P2 x1 已修复）

---

## 批次 T-02 · Codex 意见（2026-10-30）

范围：`app/register/page.tsx`（新增）、`lib/server-session.ts`（新增）、`components/form-field.tsx`（新增）、`components/sign-up-form.tsx`（重写）、`app/login/page.tsx`（最小改动）

P0 x0 / P1 x1 / P2 x1

- [P1] 注册后跳到的登录页仍是旧的邮箱登录 — `components/sign-up-form.tsx:48-51`
  - 问题：注册允许 6 位密码、不填邮箱，注册成功后跳到 `/login`。但 `/login` 仍是脚手架的邮箱登录表单，要求填邮箱、密码至少 8 位，新注册的用户无法登录，流程断了
  - 分类：**可修复**
  - 修复：把 T-03 中「登录表单改为用户名登录」这一部分提前到本批次，重写 `components/sign-in-form.tsx`：用户名 + 密码、`signInSchema` 校验、调用 `authClient.signIn.username`、错误码转中文、提交时显示 loading，并提供「还没有账户？立即注册」入口
  - **仍留在 T-03**：记住我复选框、`redirect` 回跳、`/login` 改为 Server Component（已登录直接跳 `/dashboard`）。这些在 T-03 单独送审
- [P2] 注册后自动登出，没有检查登出结果 — `components/sign-up-form.tsx:49-51`
  - 问题：Better Auth 客户端登出失败时返回 `error`，不会抛异常。原代码没检查这个结果：会话还在，却提示「注册成功，请登录」
  - 分类：**可修复**
  - 修复：检查 `signOut()` 返回的 `error`。登出失败时提示「注册成功」并跳 `/dashboard`，按已登录处理；登出成功时才提示「注册成功，请登录」并跳 `/login`

设计说明（不属于 Codex 意见）：没有采用在服务端设置 `emailAndPassword.autoSignIn: false` 来避免注册后自动登录。Better Auth 1.7.12 在 `autoSignIn: false` 时，遇到重复邮箱会返回伪造的成功响应（防枚举），用户会看到注册成功却根本没有账户。所以保留服务端默认行为，改为在客户端注册成功后登出。

自检：两个文件 `biome check` 0 错误，`next build`、`tsc` 通过；`/login` 已渲染用户名字段，不再出现邮箱字段。

## 结论（批次 T-02）

P0/P1 已全部修复（P1 x1、P2 x1 均已修复）
