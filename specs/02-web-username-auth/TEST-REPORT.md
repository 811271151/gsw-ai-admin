# 02-web-username-auth 测试报告

## 批次 1：T-01（2026-10-30）

T-01 是基础任务，只做三件事：auth-client 接入 `usernameClient`、新增 `PasswordInput` 组件、新增 `getSafeRedirect`。requirement.md 里没有只靠 T-01 就能验收的 AC：AC-05（密码显示切换）在 T-02 接入页面后验收，AC-11（外站 redirect）在 T-03 接入登录流程后验收，T-05 再用 Playwright 做端到端覆盖。

### 套件结果

- 单元测试：web 还没有接入 Vitest（T-05 引入）
- 构建验证：✅ `pnpm --filter web build`（Next.js 16.4.2 / Turbopack）编译成功，4 个路由全部生成；`apps/web` 的 `tsc --noEmit` 通过；`biome check` 0 错误
- `getSafeRedirect` 自检：15/15 个输入符合预期（明细见 CR-REPORT.md）

说明：修复 CR P2 后只改了 `safe-redirect.ts`，目前还没有页面引用这个文件，所以只重跑了 `tsc` 和 `biome`，没有重新 build。

### 结论

通过（构建验证 + helper 自检；AC 在 T-02 / T-03 / T-05 验收）

---

## 批次 2：T-02（2026-10-30）

### 套件结果

- 构建验证：✅ `next build`（生成 `/register` 动态路由）、`tsc --noEmit` 通过；本批次 6 个文件 `biome check` 0 错误
- 运行验证：用 `next start -p 3001` 加 API 服务做 HTTP 冒烟测试，5/5 通过；之后停掉 API 再验证一次，1/1 通过（明细见下表）。测试账号已删除
- 单元测试 / E2E：web 还没有接入 Vitest 和 Playwright（T-05 引入）

### 运行验证明细

| 检查项 | 结果 |
|--------|------|
| 未登录访问 `/register` → 200，显示「注册账户」和「邮箱（选填）」 | ✅ |
| 已登录（带注册接口返回的 cookie）访问 `/register` → 307 跳到 `/dashboard` | ✅ |
| 登出后带旧 cookie 访问 `/register` → 200 正常渲染 | ✅ |
| 注册接口默认会同时登录（表单因此要主动登出） | ✅ 已确认 |
| API 停掉时访问 `/register` → 仍是 200 并正常渲染（`getServerSession` 捕获了异常） | ✅ |
| `/login` 改为用户名表单（CR P1 修复后）：显示「用户名」和「还没有账户？立即注册」，没有邮箱字段 | ✅ |

### AC 对账

| AC | 结果 | 依据 |
|----|------|------|
| AC-01 用户名 `ab` 失焦提示 | 🟡 逻辑层 ✅ / UI 待 E2E | 提示文案来自 `signUpSchema`（01 单元测试已覆盖）；表单设置了 `onBlur` 校验，并且只显示已经碰过的字段的错误。页面上的实际显示要等 T-05 Playwright 验证 |
| AC-02 两次密码不一致，不发请求 | 🟡 逻辑层 ✅ / UI 待 E2E | `signUpSchema` 把错误挂在 `confirmPassword` 上（01 单元测试）；TanStack Form 的 `onSubmit` 校验不通过时不会执行 `onSubmit` |
| AC-03 不填邮箱注册成功 → toast → `/login` | 🟡 接口层 ✅ / UI 待 E2E | 占位邮箱注册成功（01 集成测试）；本批次确认注册后登出、再访问 `/register` 不再被重定向 |
| AC-04 用户名已存在 → toast | 🟡 接口层 ✅ / UI 待 E2E | 服务端返回 `USERNAME_IS_ALREADY_TAKEN`（01 集成测试），`getAuthErrorMessage` 把它转成「该用户名已被使用」（01 单元测试） |
| AC-05 密码显示切换 | 🟡 待 E2E | `PasswordInput` 根据 `visible` 在 `password` 和 `text` 之间切换；需要浏览器才能验证 |

说明：这几条 AC 剩下没验证的部分都是浏览器里的交互（失焦提示、toast、跳转、点击切换）。tasks.md 已经把它们安排给 T-05 的 Playwright E2E（「E2E 覆盖 AC-01~AC-15」）。本批次已经验证了能在浏览器之外验证的部分：构建、服务端渲染、重定向、接口和校验逻辑。**T-05 不过 E2E，就不勾选。**

### 结论

通过（构建 + 运行冒烟 6/6；AC-01~05 的逻辑层和接口层已验证，UI 交互由 T-05 E2E 验收）

---

## 批次 3：T-03（2026-10-31）

### 套件结果

- 构建验证：✅ `next build`（`/login` 改为动态路由）、`tsc --noEmit`、`biome check` 通过
- `getSafeRedirect` 自检：27/27（明细见 CR-REPORT.md）
- 运行验证：`next start -p 3001` 加 API 服务，HTTP 冒烟 11/11 通过；修复 CR P1 后重新构建，又验证了 5 个场景，全部通过。测试账号已删除

### AC 对账

| AC | 结果 | 依据 |
|----|------|------|
| AC-06 登录成功跳 `/dashboard` 或 redirect 指定的站内路径 | 🟡 服务端 ✅ / 客户端跳转待 E2E | 已登录访问 `/login?redirect=%2Fdashboard%3Ftab%3D1` 返回 307，跳到 `/dashboard?tab=1`；表单拿到的是同一个 `redirectTo`，登录成功后执行 `router.push(redirectTo)` |
| AC-07 错误密码和不存在的用户名提示相同 | ✅ | 接口两种情况都返回 `INVALID_USERNAME_OR_PASSWORD`（01 集成测试 + 本批次冒烟），`getAuthErrorMessage` 统一转成「用户名或密码不正确」 |
| AC-08 网络不可达时提示「登录失败，请稍后重试」 | 🟡 待 E2E | `catch` 和没有错误码时都返回 `SIGN_IN_FAILED`；要看到 toast 需要浏览器 |
| AC-09 登录页和注册页互相跳转 | ✅ | `/login` 页面里有 `href="/register"`（「立即注册」），`/register` 页面里有 `href="/login"`（T-02 已验证） |
| AC-11 外站 redirect 不跳外站 | ✅ | `https://evil.com`、`//evil.com`、`/%5Cevil.com`、`/%0A/evil.com`、`/%09/evil.com`、`/a/..//evil.com`、`/a/%2e%2e//evil.com` 都返回 307，跳到 `/dashboard` |
| AC-12 已登录访问 `/login` 跳 `/dashboard` | ✅ | 返回 307，跳到 `/dashboard` |

AC-10（未登录访问 `/dashboard` 时带上 redirect）属于 T-04。

### 结论

通过（冒烟 16/16、helper 27/27；AC-07/09/11/12 ✅，AC-06/08 的浏览器部分由 T-05 E2E 验收）

---

## 批次 4：T-04（2026-10-31）

### 套件结果

- 构建验证：✅ `next build`、`tsc --noEmit`、`biome check` 通过
- 运行验证：`next start -p 3001` 加 API 服务做 HTTP 冒烟，6/6 通过（第一次跑时 AC-14 失败，暴露了会话 token 泄露问题，修复后重跑通过）。测试账号已删除

### AC 对账

| AC | 结果 | 依据 |
|----|------|------|
| AC-10 未登录打开 `/dashboard` → `/login?redirect=%2Fdashboard`，登录后回到 `/dashboard` | ✅ | 未登录访问返回 307，跳到 `/login?redirect=%2Fdashboard`；登录后访问同一个地址返回 307，跳到 `/dashboard`（T-03 的回跳逻辑） |
| AC-13 用户菜单显示用户名 | 🟡 服务端 ✅ / 菜单待 E2E | `/dashboard` 用 `getDisplayName` 渲染出 `Web_xxx`（保留注册时的大小写）；用户菜单用同一个函数，但菜单在客户端渲染，要等 T-05 用浏览器验证 |
| AC-14 不显示 `@users.local` | ✅ | 已登录访问 `/dashboard`，HTML 里找不到 `users.local`；用户菜单里原来显示 email 的那一项已经删掉 |
| AC-15 退出登录跳 `/login`，再访问 `/dashboard` 会被重定向 | 🟡 重定向 ✅ / 点击按钮待 E2E | 登出后带着旧 cookie 访问 `/dashboard`，返回 307，跳到 `/login?redirect=%2Fdashboard`；点击菜单「退出登录」后跳转，要等 T-05 验证 |

附加验证：已登录访问 `/dashboard`，HTML 里没有会话 token（token 长度 32，没有在页面里找到）。

### 结论

通过（冒烟 6/6；AC-10/14 ✅，AC-13/15 的浏览器部分由 T-05 E2E 验收）
