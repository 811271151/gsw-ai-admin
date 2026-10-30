# 用户名认证服务端与共享校验 - 技术设计方案

> **技术方案基于**: 项目技术架构文档 (AGENTS.md) + 现有脚手架代码

## 架构设计

```
apps/server (Hono)
  └─ /api/auth/*  → auth.handler   ← createAuth() 来自 packages/auth
packages/auth
  ├─ index.ts     createAuth()：加 username 插件、minPasswordLength
  └─ schemas.ts   signUpSchema / signInSchema / toPlaceholderEmail（新增）
packages/db
  └─ prisma/schema/auth.prisma  User 加 username / displayUsername
```

路由与 tRPC 不变：认证全部走 Better Auth 自带端点，`protectedProcedure` 继续读 `ctx.session`。

### 技术选型

| 层次 | 技术栈 | 理由 |
|------|--------|------|
| 认证 | Better Auth 1.7.12 + `username` 插件（`better-auth/plugins`） | AGENTS.md 指定；插件已随包安装，无新增依赖 |
| 数据库 | Prisma 7 + PostgreSQL | AGENTS.md 指定 |
| 校验 | Zod 4（catalog） | AGENTS.md 指定，Web/移动端共享 |
| 测试 | Vitest（本 feature）、Playwright（02 的 Web E2E） | 用户 2026-10-30 确认，W7 写入 AGENTS.md |

## 数据模型设计

`pnpm run auth:generate` 重新生成 `auth.prisma`，预期 User 增加：

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| username | String? @unique | N（插件定义为可空） | 规范化后的小写用户名 |
| displayUsername | String? | N | 用户输入的原始大小写 |

email 保持 `String @unique` 必填，由占位邮箱满足。生成后执行 `pnpm run db:push`（开发库）。

## 接口设计

全部是 Better Auth 端点，挂在 `apps/server` 的 `/api/auth/*`：

| 端点 | 请求体 | 说明 |
|------|--------|------|
| `POST /api/auth/sign-up/email` | `{ email, password, name, username, displayUsername? }` | username 插件复用此端点 |
| `POST /api/auth/sign-in/username` | `{ username, password, rememberMe? }` | 失败统一 401 INVALID_USERNAME_OR_PASSWORD |
| `POST /api/auth/sign-out` | — | 销毁会话 |
| `GET /api/auth/get-session` | — | 返回 `{ session, user }` 或 null |

## 核心配置

```ts
// packages/auth/src/index.ts（改动部分）
import { username } from "better-auth/plugins";

emailAndPassword: { enabled: true, minPasswordLength: 6 },
plugins: [
  expo(),
  username({
    minUsernameLength: 3,
    maxUsernameLength: 20,
    // 默认 validator 已是 /^[a-zA-Z0-9_.]+$/，需收紧为不含点号
    usernameValidator: (value) => USERNAME_PATTERN.test(value),
  }),
],
```

```ts
// packages/auth/src/schemas.ts（新增）
export const USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/;
export const PLACEHOLDER_EMAIL_DOMAIN = "users.local";
export const toPlaceholderEmail = (username: string) =>
  `${username.toLowerCase()}@${PLACEHOLDER_EMAIL_DOMAIN}`;
export const signUpSchema = z.object({ username, password, confirmPassword, email: 可空字符串或合法邮箱 })
  .refine(密码一致, { path: ["confirmPassword"], message: "两次输入的密码不一致" });
export const signInSchema = z.object({ username: 非空, password: 非空, rememberMe: z.boolean() });
```

`USERNAME_PATTERN` 同时给服务端 `usernameValidator` 与客户端 schema 用，保证两端规则一致（R-01）。

## 关键决策

1. **占位邮箱在客户端生成**：注册请求里 email 为空时，客户端调用 `toPlaceholderEmail(username)` 填入。不在服务端 hook 里补，因为 `/sign-up/email` 的 body 校验先于 before hook 执行，空 email 会直接被拒。
2. **统一登录错误**：直接沿用插件行为，客户端把 INVALID_USERNAME_OR_PASSWORD 映射为中文提示。
3. **记住我**（用户已确认）：配置 `session.expiresIn = 60 * 60 * 24 * 30`（30 天）。Better Auth 在 `rememberMe: false` 时把 session cookie 设为会话 cookie（不带 Max-Age），关闭浏览器即失效；勾选时 cookie 持久 30 天。不实现需求.md 原写的「不勾选 7 天」。

## 安全设计

- 密码哈希：Better Auth 内置 scrypt
- 限流：Better Auth 内置 rateLimit 在生产环境默认开启，`/sign-in/*` 规则更严；本期不改
- Cookie：沿用现有 `httpOnly + secure + sameSite=none`
- 用户名枚举：登录统一错误；注册时「用户名已被使用」无法避免，属可接受

## 风险评估

| 风险项 | 等级 | 影响 | 应对方案 |
|--------|------|------|----------|
| auth:generate 改写 auth.prisma | 中 | 现有开发库数据 | 本地开发库直接 db:push；生产走 migrate |
| 占位邮箱与真实邮箱冲突 | 低 | 用户填 `x@users.local` | schema 拒绝 `@users.local` 域名的手填邮箱 |
| 集成测试需要数据库 | 中 | 无 DATABASE_URL 时无法跑 | 集成测试读 `DATABASE_URL`，缺失时跳过并在 TEST-REPORT 标注 |

---
*本文档由 gsw-prd-splitter 自动生成于 2026-10-30*
