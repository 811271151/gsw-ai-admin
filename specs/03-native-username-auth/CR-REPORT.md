# 03-native-username-auth Code Review 报告

> 评审工具：codex 插件 1.0.6 的 `/codex:review`（`codex-companion.mjs review --wait --scope working-tree`），每个批次只送审 1 轮。

## 批次 T-01 · Codex 意见（2026-10-31）

范围：`apps/native/package.json`、`pnpm-lock.yaml`、`lib/auth-client.ts`、`app/_layout.tsx`、`app/login.tsx`（新增）、`app/register.tsx`（新增），另有 `specs/INDEX.md` 的状态改动

P0 x0 / P1 x0 / P2 x0。Codex 结论：未发现本次改动引入的缺陷，认证插件、存储适配和新增路由都在任务范围内。

Codex 提到的 Biome「package.json 字段排序」是原有问题，不属于本批次改动。Codex 在沙箱里跑 tsc 时遇到 EPERM，没跑成；Claude 在本机执行 `apps/native` 的 `tsc --noEmit`，通过。

送审前的自查修改：`import * as SecureStore` 触发了 Biome 的 `noNamespaceImport`，改成具名导入 `getItem`、`getItemAsync`、`setItem`、`setItemAsync`，组成一个 `secureStorage` 对象传给 `expoClient`。这四个方法正好是 `@better-auth/expo` 1.7.12 的 `ExpoClientStorage` 类型要求的。

## 结论（批次 T-01）

P0/P1 已全部修复（本批次无 P0/P1）

---

## 批次 T-02 + T-03（W4b 并行）· 交叉校验 + Codex 意见（2026-10-31）

开发方式：W4b 并行。Worker A 负责 T-02（`components/sign-up.tsx`、`app/register.tsx`），Worker B 负责 T-03（`components/sign-in.tsx`）。两个 Worker 都只改了各自允许的文件，没有越界。

### 交叉校验（Checker subagent）

P0 x0 / P1 x1 / P2 x5

- [P1] 注册成功后，登出步骤如果网络异常，会落进注册的 `catch`，提示「注册失败」 — `sign-up.tsx`
  - 场景：账户已经建好，再次提交只会得到「该用户名已被使用」
  - 分类：可修复。Queen 修复：注册和登出各用一个 `try`
- [P2] 「首页→登录→注册→登录」之后，栈里会留下旧的登录屏幕，登录后按返回键能退回去 — `sign-up.tsx`、`sign-in.tsx`
  - 分类：可修复。Queen 修复：两处 `router.replace` 改为 `router.dismissTo`。已读 expo-router 58 的 `StackRouter` `POP_TO` 源码确认：栈里已有目标就退回到它，没有就替换当前屏幕
- [P2] 按钮在提交中会禁用，但键盘的「前往」键仍会触发第二次提交 — 两个表单
  - 分类：可修复。Queen 修复：`handleSubmit` 先判断 `form.state.isSubmitting`
- [P2] 只有 `onSubmit` 校验器时，字段错误在用户下一次输入或失焦时就消失，不会重新校验
  - 处理：不修。AC-01（提交后显示）满足；Web 端用过 `onBlur` 校验器，导致点击落空，教训已记在 AGENTS.md。只提交时校验对移动端更稳
- [P2] 登录时输入格式不合法、且不存在的用户名（如 `ab`），提示的是格式错误，不是统一文案
  - 处理：不修。与 Web 行为一致；格式错误只说明输入本身不合法，不泄露用户名是否存在
- [P2] 两个文件各有一份 `getFirstErrorMessage` / `selectIsSubmitting`，`blurOnSubmit` 在 RN 0.88 已标记弃用
  - 处理：不修。两份函数都很小，`blurOnSubmit` 沿用原代码的写法，design.md 要求沿用；RN 0.88 仍然支持

### Codex 意见（送审 1 轮）

范围：working tree（上述 3 个文件，含交叉校验后的修复）

P0 x0 / P1 x0 / P2 x1

- [P2] 登出失败时不能当作「仍是登录态」 — `sign-up.tsx:97-100`
  - 问题：原生端 `expoClient` 在发出 sign-out 请求**之前**就清空了本地 cookie 和会话缓存。请求失败时本机其实已经是未登录，原来的兜底却提示「注册成功」并跳到首页
  - 核实：已读 `@better-auth/expo` 1.7.12 `dist/client.js`。`init` 钩子在 `/sign-out` 请求发出前调用 `clearSessionCache()`，它会把 cookie 存储写成 `{}`，并把 session atom 置为 `null`。Codex 说得对
  - 分类：可修复
  - 修复：去掉「登出失败按已登录处理」的分支。登出单独放一个 `try`，只是为了不让它的网络异常被当成「注册失败」。之后一律提示「注册成功，请登录」，并 `dismissTo("/login")`。服务端残留的会话已经没有 cookie 引用它，到期自动失效

Codex 在沙箱里跑 tsc 被权限拦截，lint 缺依赖，都没跑成。Claude 在本机执行 `tsc --noEmit`、`biome check`、`expo export --platform android`，全部通过。

## 结论（批次 T-02 + T-03）

P0/P1 已全部修复（交叉校验 P1 x1 已修；P2 共 6 条：修 3 条、不修 3 条并写明理由）

---

## 批次 T-04 · Codex 意见（2026-10-31）

范围：working tree（`app/(drawer)/index.tsx`、`lib/display-name.ts`（新增））

P0 x0 / P1 x0 / P2 x0。Codex 结论：受保护的接口只在登录后请求，未登录会跳到登录屏幕，登出会清空缓存，没有发现回归问题。

送审前的自查修改：脚手架的连接状态卡片有嵌套三元表达式和 Biome 判定为多余的条件判断，这个文件因此过不了 lint。改成一张状态表（`CONNECTION_STATUS`）加一个 `getConnectionState` 函数，页面显示的文案和图标都没变。

## 结论（批次 T-04）

P0/P1 已全部修复（本批次无 P0/P1）

---

## 批次 T-05 · Codex 意见（2026-10-31）

范围：working tree。包括移动端 Web E2E（`apps/native/e2e/`、`playwright.config.ts`）、依赖与脚本，以及 E2E 发现的登录竞态修复（`components/sign-in.tsx`、`app/(drawer)/index.tsx`）

验收方式（用户 2026-10-31 选择）：本机没有可用设备，在 Expo Web 上运行同一套组件替代设备验收。必须依赖原生行为的 AC 只做 Web 近似验证，并列为遗留问题。

E2E 在送审前发现并修复了一个产品 bug（W4a 自查，不是 Codex 提的）：
- 现象：用户名、密码正确，登录后跳到首页，约 20ms 后又被送回登录屏幕
- 原因：登录接口返回后，Better Auth 的会话原子还是旧值 null，它通过 `$sessionSignal` 异步重新拉取。会话加载过一次之后，再次拉取时 `isPending` 不会变成 true，只有 `isRefetching` 为 true。首页的登录守卫看到「没有用户、也不在 pending」就跳回 `/login`。真机上的流程完全一样（expoClient 也是先 notify 再异步拉取），所以这是真 bug，不是 Web 才有的问题
- 修复（两处，互为保险）：
  - `sign-in.tsx`：登录成功后先 `await refetchSession()`（`useSession().refetch`，与信号触发的拉取共用同一次请求），会话到手后再跳转
  - `(drawer)/index.tsx`：`isPending || (isRefetching && !session?.user)` 时显示 Spinner，不把「还没拉到」当成「未登录」

P0 x0 / P1 x0 / P2 x3

- [P2] 复用已有服务前没有确认它是不是 Expo — `playwright.config.ts:33-37`
  - 问题：3001 上如果跑着 `apps/web` 的 Next 开发服务，它的 `/login` 也返回 200。非 CI 环境下 `reuseExistingServer` 会跳过启动 Expo，结果测的是 Web 端
  - 分类：可修复。就绪检查改用 Metro 独有的 `/status`。已实测：Expo 返回 `packager-status:running`；Next 返回 404，不会被当成可复用的服务，Playwright 会尝试自己启动，遇到端口冲突时直接报错
- [P2] 单条用例默认 30s 超时，压不住 90s 的首包等待 — `e2e/auth.e2e.ts:14-15`
  - 分类：可修复。配置里加 `timeout: 120_000`
- [P2] AC-10 刷新后停在 `/login`，不能证明已经登出 — `e2e/auth.e2e.ts:180-184`
  - 问题：登录屏幕对已登录用户也会照常渲染
  - 分类：可修复。登出后改为重新打开受保护的首页 `/`，断言首页的登录守卫把人送回 `/login`，并且页面上没有「欢迎，{用户名}」

Codex 在沙箱里跑 tsc 和 Playwright 被依赖访问权限拦住，没跑成。Claude 在本机执行 tsc、biome，以及根目录 `pnpm test:e2e`（Web 15/15、移动端 Web 11/11），全部通过。

## 结论（批次 T-05）

P0/P1 已全部修复（本批次无 P0/P1；P2 x3 已修复；另修复登录竞态 bug x1）
