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
