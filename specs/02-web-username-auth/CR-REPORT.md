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

---

## 批次 T-03 · Codex 意见（2026-10-31）

说明：W5 送审前，T-03 的 4 个代码文件已经被提交 `30c8067 update`（作者 阿耿，不是工作流生成的提交）带进了历史。工作区因此是干净的，没法按 working tree 送审，改用 `review --base ed483b5 --scope branch` 审查这一个提交的改动。范围与本批次完全一致，没有改写这个提交。

范围：`app/login/page.tsx`、`components/sign-in-form.tsx`、`components/form-field.tsx`（新增 `CheckboxField`）、`lib/safe-redirect.ts`（返回类型改为 `Route`）

P0 x0 / P1 x1 / P2 x0

- [P1] 点段归一化后变成协议相对地址，造成开放重定向 — `app/login/page.tsx:13-15`
  - 问题：`redirect=/a/..//evil.com` 解析后 origin 仍是哨兵域名，能通过检查，但 `pathname` 是 `//evil.com`。服务端 `redirect()` 和登录后的 `router.push` 都会把它当作外站地址
  - 分类：**可修复**（真实的安全绕过，AC-11）
  - 修复：`getSafeRedirect` 拼出最终的 `pathname + search + hash` 后，用同一个哨兵域名把它**再解析一次**，确认 origin 没变才返回。返回值会被浏览器或 Next 再解析一次，所以对返回值本身也要校验
  - 自检：27 个输入全部符合预期。21 个恶意输入都被拦截，包括 `/a/..//evil.com`、`/a/%2e%2e//evil.com`、`/a/.%2E//evil.com`、`/a/..\\evil.com`、`/a/b/../..//evil.com`、`/..//evil.com`，以及 T-01 已经覆盖的控制字符和反斜杠；6 个站内路径原样保留（包括 `/a/../dashboard` → `/dashboard`）。构建后用真实 HTTP 请求测试，已登录用户访问 `/login?redirect=/a/..//evil.com` 返回 307，跳到 `/dashboard`

## 结论（批次 T-03）

P0/P1 已全部修复（P1 x1 已修复）

---

## 批次 T-04 · Codex 意见（2026-10-31）

范围：working tree，包括 `app/dashboard/page.tsx`、`app/dashboard/dashboard.tsx`、`components/user-menu.tsx`、`lib/display-name.ts`（新增）

P0 x0 / P1 x0 / P2 x0。Codex 结论：未发现可修复的回归问题。

送审前 Claude 自查发现并修复了一个安全问题（不是 Codex 提的）：
- 原来的 `<Dashboard session={session} />` 把整个 session 对象从 Server Component 传给了客户端组件。这个 prop 会被序列化进 HTML 的 RSC payload，里面有 **httpOnly 的会话 token** 和占位邮箱。这等于把 token 暴露给页面脚本，一旦出现 XSS 就能被直接偷走。AC-14 冒烟测试失败时发现了这个问题
- `Dashboard` 根本没用这个 prop，所以直接删掉了。修复后验证：HTML 里找不到会话 token，也找不到 `users.local`

## 结论（批次 T-04）

P0/P1 已全部修复（本批次 Codex 无 P0/P1；另修复 1 个会话 token 泄露问题）

---

## 批次 T-05 · Codex 意见（2026-10-31）

范围：working tree，包括 Vitest 和 Playwright 依赖、`playwright.config.ts`、`e2e/`、`safe-redirect.test.ts`、`apps/server/scripts/delete-test-users.ts`，以及 `sign-up-form.tsx` 的校验时机修复。送审耗时超过 10 分钟，转到后台完成。

E2E 在送审前发现并修复了一个产品 bug（W4a 自查，不是 Codex 提的）：注册页填完确认密码后，第一次点「注册」没有反应。原因是 `onBlur` 校验留下的过期错误。点击按钮时输入框先失焦，过期错误消失，按钮往上移，鼠标松开时已经不在按钮上，这次点击就落空了。修复方式是改用 `onChange` 校验，并且只在字段失焦或提交过之后才显示错误。

P0 x0 / P1 x0 / P2 x2

- [P2] 去掉 `onBlur` 校验后，没输入过的空字段失焦不会提示 — `components/sign-up-form.tsx:65-66`
  - 问题：TanStack Form 的 `blur` 事件只会执行 `onBlur` 校验器。用户在空字段里点一下再离开，没有任何错误提示，不符合 R-01「失焦即校验」
  - 分类：**可修复**
  - 修复：**没有**照 Codex 的建议把 `onBlur: signUpSchema` 加回来。加回来后，错误会存进单独的 `errorMap.onBlur`，而这份错误只在失焦时才刷新，用户输入改正后它仍然留着，前面那个点击落空的 bug 又会出现。改为使用表单级 `listeners.onBlur`，在失焦时执行 `fieldApi.validate("change")`。这样错误始终只在 `onChange` 这一处，失焦时也会刷新
  - 新增 E2E「R-01 没输入过的空字段失焦也提示」覆盖这个场景
- [P2] 干净环境下 `pnpm test:e2e` 缺浏览器，测试直接失败 — `apps/web/package.json`
  - 分类：**可修复**
  - 修复：`test:e2e` 改为 `playwright install --only-shell chromium && playwright test`。已经装过浏览器时，这一步不下载、0.7 秒就结束

Codex 在沙箱里跑测试时遇到 node_modules 的 EPERM，没跑成。Claude 在本机执行：单元测试 51/51，E2E 15/15，连续两轮。

## 结论（批次 T-05）

P0/P1 已全部修复（本批次无 P0/P1；P2 x2 已修复；另修复点击落空 bug x1）
