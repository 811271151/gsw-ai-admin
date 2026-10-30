# 移动端用户名注册登录 - 技术设计方案

> **技术方案基于**: 项目技术架构文档 (AGENTS.md) + 现有脚手架代码

## 架构设计

```
apps/native
├─ lib/auth-client.ts          plugins 加 usernameClient()，保留 expoClient + SecureStore
├─ app/_layout.tsx             Stack 注册 login / register 两个屏幕
├─ app/login.tsx               新增：渲染 <SignIn/>
├─ app/register.tsx            新增：渲染 <SignUp/>
├─ app/(drawer)/index.tsx      未登录 → <Redirect href="/login" />；去掉内嵌表单，显示用户名 + 登出
├─ components/sign-in.tsx      改为用户名登录
└─ components/sign-up.tsx      改为用户名 + 确认密码 + 选填邮箱
```

### 技术选型

| 层次 | 技术栈 | 理由 |
|------|--------|------|
| 框架 | React Native 0.88 + Expo 58 + Expo Router | AGENTS.md 指定 |
| UI | heroui-native（TextField / Input / Button / Spinner / useToast） | 现有表单已用，复用 |
| 表单 | @tanstack/react-form + 01 的 Zod schema | 与 Web 共用规则 |
| 会话存储 | `@better-auth/expo` + expo-secure-store | 现有配置，不变 |
| 键盘 | react-native-keyboard-controller | 已在根布局挂载 KeyboardProvider |

## 接口调用

与 Web 相同：`authClient.signUp.email({...})`、`authClient.signIn.username({ username, password })`、`authClient.signOut()`。移动端不传 `rememberMe`（见 requirement 非目标）。

## 关键逻辑

1. **路由守卫**：首页读取 `authClient.useSession()`，`isPending` 时显示 Spinner，`!session` 时返回 `<Redirect href="/login" />`。登录、注册屏幕在根 Stack，不在 drawer 内，未登录时看不到抽屉菜单。
2. **登录成功**：`router.replace("/")`，避免返回键回到登录屏幕。
3. **登出**：`await authClient.signOut()` → `queryClient.clear()` → `router.replace("/login")`。
4. **错误码映射**：与 Web 同一份映射表。为避免两端各写一份，映射表放进 `packages/auth/src/schemas.ts`（`AUTH_ERROR_MESSAGES`），由 01-T-03 一并提供。
5. **字段跳转**：沿用现有 `InputRef` + `returnKeyType="next"` + `onSubmitEditing` 写法。

## 安全设计

- Token 只存 SecureStore（由 expoClient 处理），不写 AsyncStorage
- 不在日志中打印表单值

## 风险评估

| 风险项 | 等级 | 影响 | 应对方案 |
|--------|------|------|----------|
| 真机无法访问 localhost:3000 | 中 | 无法联调 | `EXPO_PUBLIC_SERVER_URL` 改为局域网 IP |
| 移动端无自动化 UI 测试 | 中 | AC 需手动验证 | W6 以 check-types + 手动对账为准 |

---
*本文档由 gsw-prd-splitter 自动生成于 2026-10-30*
