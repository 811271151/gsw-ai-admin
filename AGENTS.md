# gsw-ai-admin 项目文档

## 项目概览

**gsw-ai-admin** 是一个全栈 TypeScript monorepo 项目，包含跨平台应用（web + mobile）和统一的后端 API。使用现代化工具构建，注重类型安全、性能和开发体验。

---

## 项目结构

```
gsw-ai-admin/
├── apps/
│   ├── web/           # Next.js Web 应用 (端口 3001)
│   │   ├── src/
│   │   │   ├── app/          # Next.js App Router 页面
│   │   │   ├── components/   # Web 专用组件
│   │   │   ├── lib/          # 客户端工具函数
│   │   │   └── utils/        # 辅助函数
│   │   └── env.ts            # 环境配置 (Varlock)
│   │
│   ├── native/        # React Native + Expo 移动应用
│   │   ├── app/              # Expo Router 文件路由
│   │   │   ├── (drawer)/     # 抽屉导航组
│   │   │   ├── _layout.tsx   # 根布局
│   │   │   └── modal.tsx     # 模态页面
│   │   ├── components/       # 移动端专用组件
│   │   ├── contexts/         # React contexts
│   │   ├── lib/              # 客户端工具函数
│   │   └── utils/            # 辅助函数
│   │
│   ├── server/        # Hono + tRPC 后端 API (端口 3000)
│   │   └── src/
│   │       ├── index.ts      # 服务器入口
│   │       ├── context.ts    # tRPC 上下文
│   │       └── services.ts   # Better Auth 配置
│   │
│   └── fumadocs/      # 文档站点 (可选)
│
├── packages/
│   ├── ui/            # 共享 shadcn/ui 组件库
│   │   ├── src/
│   │   │   ├── components/   # 可复用 UI 组件
│   │   │   └── styles/       # 全局 CSS 和设计 tokens
│   │   └── components.json   # shadcn 配置
│   │
│   ├── api/           # tRPC API 定义和业务逻辑
│   │   └── src/
│   │       ├── index.ts      # API 根入口
│   │       ├── context.ts    # 共享上下文类型
│   │       └── routers/      # tRPC 路由
│   │
│   ├── auth/          # Better Auth 配置包
│   │   └── src/
│   │       ├── index.ts      # createAuth()（含 username 插件）
│   │       └── schemas.ts    # 用户名/密码规则常量，服务端与客户端共用
│   │
│   ├── db/            # Prisma 数据库包
│   │   ├── prisma/
│   │   │   └── schema/
│   │   │       ├── schema.prisma  # 数据库模型
│   │   │       └── auth.prisma    # Better Auth 表
│   │   └── src/
│   │       └── index.ts      # 数据库客户端导出
│   │
│   └── config/        # 共享 TypeScript 和 ESLint 配置
│
├── .agents/           # Agent 技能 (与 .claude/ 重复)
├── .claude/           # Claude Code 配置
│   ├── settings.json         # Hooks 配置 (ultracite fix)
│   └── skills/               # Claude Code 技能
│
├── turbo.json         # Turborepo 流水线配置
├── pnpm-workspace.yaml        # PNPM 工作区配置
├── biome.json         # Biome 代码检查/格式化配置
└── AGENTS.md          # 本文件 - AI agent 指南
```

---

## 技术栈

### 核心框架与运行时
- **TypeScript 6.0.3** - 类型安全开发
- **Node.js** - 服务器运行时
- **pnpm 10.34.4** - 快速、节省磁盘的包管理器
- **Turborepo 2.11.7** - 优化的 monorepo 构建编排

### 前端 (Web)
- **Next.js 16.3.4** - React 框架，使用 App Router
- **React 19.2.8** - UI 库
- **TailwindCSS 4.3.3** - 实用优先的 CSS
- **shadcn/ui** - 可访问的组件原语（通过 `@gsw-ai-admin/ui` 共享）
- **next-themes** - 暗色模式支持
- **Babel React Compiler** - 自动 React 优化

### 移动端 (Native)
- **React Native 0.88.0** - 跨平台移动框架
- **Expo 58.0.12** - 开发工具和 SDK
- **Expo Router 58.0.21** - 文件路由导航
- **heroui-native** - 原生 UI 组件库
- **react-native-reanimated 4.7.1** - 流畅动画
- **react-native-gesture-handler** - 触摸交互
- **uniwind** - React Native 统一 Tailwind 样式

### 后端
- **Hono 4.13.7** - 轻量、快速的 HTTP 框架
- **tRPC 11.19.0** - 端到端类型安全 API
- **Better Auth 1.7.12** - 认证库，支持 Expo
- **@hono/trpc-server** - Hono 的 tRPC 适配器

### 数据库
- **Prisma 7.10.0** - 类型安全 ORM
- **PostgreSQL** - 关系型数据库
- **@prisma/adapter-pg** - PostgreSQL 驱动适配器

### 状态管理与数据获取
- **@tanstack/react-query 5.104.2** - 异步状态管理
- **@tanstack/react-form 1.33.5** - 类型安全表单处理
- **@trpc/tanstack-react-query** - tRPC + React Query 集成

### 开发体验
- **Vitest 5.0.5** - 单元测试与服务端集成测试（pnpm catalog）
- **Biome 2.5.15** - 快速的代码检查和格式化（通过 Ultracite）
- **Ultracite 8.0.0** - 零配置代码质量预设
- **Varlock 1.23.0** - 类型安全的环境变量与代码生成
- **Zod 4.5.4** - 运行时类型验证

### 构建与部署
- **tsdown** - 服务器的 TypeScript 打包工具
- **tsx** - 开发时 TypeScript 执行
- **turbo** - Monorepo 构建系统

---

## 架构模式

### Monorepo 结构
- **工作区包**: Apps 通过工作区协议消费共享包
- **依赖图**: `apps/* → packages/{api, auth, ui} → packages/db`
- **构建编排**: Turborepo 处理并行构建和缓存

### 数据流
```
客户端 (Web/Native)
  ↓ tRPC client
服务器 (Hono + tRPC)
  ↓ 业务逻辑 (packages/api)
数据库 (Prisma + PostgreSQL)
```

### 认证流程
- **Better Auth** 库提供会话管理
- **@better-auth/expo** 适配器用于 React Native
- 认证配置位于 `packages/auth`
- 会话上下文通过 tRPC 传递

### 共享代码策略
- **UI 组件**: `packages/ui` 导出 shadcn 原语
- **API 层**: `packages/api` 定义 tRPC 路由
- **数据库**: `packages/db` 导出 Prisma 客户端
- **认证**: `packages/auth` 导出认证实例
- **类型安全**: 完整的端到端 TypeScript

### 环境管理
- **Varlock** 从 `.env.schema` 生成类型安全的 `env.ts`
- 每个应用拥有自己的环境 schema
- Schema 修改后运行 `pnpm run env:generate`
- `postinstall` 时自动代码生成

---

## 开发工作流

### 快速开始
```bash
pnpm install              # 安装依赖
pnpm run db:generate      # 生成 Prisma 客户端
pnpm run db:push          # 同步数据库 schema
pnpm run dev              # 启动所有应用
```

### 独立应用
```bash
pnpm run dev:web          # 仅 Web (localhost:3001)
pnpm run dev:server       # 仅服务器 (localhost:3000)
pnpm run dev:native       # 仅移动端 (Expo)
```

### 数据库命令
```bash
pnpm run db:push          # 推送 schema 到数据库
pnpm run db:generate      # 生成 Prisma 客户端
pnpm run db:migrate       # 创建迁移
pnpm run db:studio        # 打开 Prisma Studio
```

### 代码质量
```bash
pnpm run check            # 运行 Biome 检查
pnpm run fix              # 自动修复问题
pnpm run check-types      # TypeScript 类型检查
pnpm test                 # 运行全部测试（Vitest，经 turbo）
```

### Auth Schema 同步
```bash
pnpm run auth:generate    # 生成 Better Auth Prisma schema
```

---

## Ultracite 代码标准

此项目使用 **Ultracite**，这是一个零配置预设，通过自动化格式化和代码检查强制执行严格的代码质量标准。

### 快速参考

- **格式化代码**: `pnpm exec ultracite fix`
- **检查问题**: `pnpm exec ultracite check`
- **诊断设置**: `pnpm exec ultracite doctor`

Biome（底层引擎）提供强大的代码检查和格式化。大多数问题可自动修复。

**文件写入后 hook**: Ultracite 在 Write/Edit 操作时自动运行（配置在 `.claude/settings.json`）

---

## 核心原则

编写**可访问、高性能、类型安全、可维护**的代码。专注于清晰和明确的意图，而不是简洁性。

### 类型安全与显式性

- 在提升清晰度时，为函数参数和返回值使用显式类型
- 当类型真正未知时，优先使用 `unknown` 而不是 `any`
- 为不可变值和字面量类型使用常量断言 (`as const`)
- 利用 TypeScript 的类型收窄而不是类型断言
- 使用有意义的变量名而不是魔术数字 - 提取具有描述性名称的常量

### 现代 JavaScript/TypeScript

- 在回调和短函数中使用箭头函数
- 优先使用 `for...of` 循环而不是 `.forEach()` 和索引 `for` 循环
- 使用可选链 (`?.`) 和空值合并 (`??`) 进行更安全的属性访问
- 优先使用模板字面量而不是字符串拼接
- 使用解构进行对象和数组赋值
- 默认使用 `const`，只在需要重新赋值时使用 `let`，永远不要使用 `var`

### 异步与 Promises

- 在 async 函数中始终 `await` promises - 不要忘记使用返回值
- 使用 `async/await` 语法而不是 promise 链，以获得更好的可读性
- 使用 try-catch 块在异步代码中适当处理错误
- 不要将 async 函数用作 Promise 执行器

### React 与 JSX

- 使用函数组件而不是类组件
- 只在顶层调用 hooks，永远不要在条件中调用
- 在 hook 依赖数组中正确指定所有依赖项
- 为可迭代元素中的元素使用 `key` prop（优先使用唯一 ID 而不是数组索引）
- 在开始和结束标签之间嵌套子元素，而不是作为 props 传递
- 不要在其他组件内部定义组件
- 使用语义化 HTML 和 ARIA 属性以增强可访问性：
  - 为图像提供有意义的 alt 文本
  - 使用正确的标题层次结构
  - 为表单输入添加标签
  - 在鼠标事件的同时包含键盘事件处理程序
  - 使用语义化元素（`<button>`、`<nav>` 等）而不是带有角色的 divs

### 错误处理与调试

- 从生产代码中移除 `console.log`、`debugger` 和 `alert` 语句
- 抛出带有描述性消息的 `Error` 对象，而不是字符串或其他值
- 有意义地使用 `try-catch` 块 - 不要仅为了重新抛出而捕获错误
- 对于错误情况，优先使用提前返回而不是嵌套条件

### 代码组织

- 保持函数专注并在合理的认知复杂度限制内
- 将复杂条件提取到命名良好的布尔变量中
- 使用提前返回来减少嵌套
- 优先使用简单条件而不是嵌套三元运算符
- 将相关代码组合在一起并分离关注点

### 安全性

- 在链接上使用 `target="_blank"` 时添加 `rel="noopener"`
- 除非绝对必要，否则避免使用 `dangerouslySetInnerHTML`
- 不要使用 `eval()` 或直接赋值给 `document.cookie`
- 验证和清理用户输入

### 性能

- 避免在循环中的累加器中使用展开语法
- 使用顶层正则表达式字面量，而不是在循环中创建它们
- 优先使用特定导入而不是命名空间导入
- 避免桶文件（重新导出所有内容的 index 文件）
- 使用适当的图像组件（例如 Next.js `<Image>`）而不是 `<img>` 标签

### 框架特定指南

**Next.js:**

- 对图像使用 Next.js `<Image>` 组件
- 使用 `next/head` 或 App Router metadata API 处理 head 元素
- 对异步数据获取使用 Server Components，而不是 async Client Components

**React 19+:**

- 使用 ref 作为 prop，而不是 `React.forwardRef`

**Solid/Svelte/Vue/Qwik:**

- 使用 `class` 和 `for` 属性（不是 `className` 或 `htmlFor`）

---

## 测试

- 在 `it()` 或 `test()` 块内编写断言
- 在异步测试中避免使用 done 回调 - 使用 async/await
- 不要在提交的代码中使用 `.only` 或 `.skip`
- 保持测试套件合理扁平 - 避免过度的 `describe` 嵌套

## Biome 无法帮助的地方

Biome 会自动捕获大多数机械问题。将注意力集中在：

1. **业务逻辑正确性** - Biome 无法验证你的算法
2. **有意义的命名** - 为函数、变量和类型使用描述性名称
3. **架构决策** - 组件结构、数据流和 API 设计
4. **边界情况** - 处理边界条件和错误状态
5. **用户体验** - 可访问性、性能和可用性考虑
6. **文档** - 为复杂逻辑添加注释，但优先使用自文档化代码

---

大多数格式化和常见问题都由 Biome 自动修复。在提交前运行 `pnpm exec ultracite fix` 以确保合规。

---

## 开发经验记录（自动生成）

### 01-username-auth-core（批次 T-01、T-02）— 2026-10-30

**踩坑**
- 启用 Better Auth `username` 插件后，User 表没有 `username` / `displayUsername` 列，注册和登录都会失败 → 插件不会改数据库 → 加插件后必须执行 `pnpm run auth:generate`，然后在 `packages/db` 下执行 `prisma db push`（或 `db:migrate`）和 `prisma generate`
- username 插件默认的 validator 允许点号 `.` → 用 `usernameValidator: isValidUsername` 收紧为只允许字母、数字、下划线
- `rememberMe: false` 只把 session cookie 改成会话 cookie（不带 Max-Age），服务端会话有效期仍是全局的 `session.expiresIn`，Better Auth 不支持按「记住我」设置两档有效期
- 新 clone 的仓库没有 `packages/db/prisma/generated` → 所有依赖 `@gsw-ai-admin/db` 的包 `tsc` 都会报找不到模块 → 先执行 `pnpm run db:generate`
- `biome.json` 里的 `nursery.useTailwindSortedClasses` 在 Biome 2.5.15 中已改名为 `useSortedClasses`；`apps/fumadocs/biome.json` 需要加 `"root": false` → 两处不修，`ultracite check/fix` 和 `.claude/settings.json` 里写文件后执行的 hook 都会因配置错误直接退出
- Codex 评审跑在只读沙箱里，执行 `tsc` 时缺依赖访问权限 → 类型检查以本机执行 `tsc --noEmit` 的结果为准

**约定**
- 用户名、密码的长度和 `USERNAME_PATTERN` 只在 `packages/auth/src/schemas.ts` 定义一次，服务端插件配置和客户端表单校验都从这里导入
- 用户名注册走 `POST /api/auth/sign-up/email`（带 `username` 字段，email 必填，用户不填时由客户端生成占位邮箱）；用户名登录走 `POST /api/auth/sign-in/username`
- 会话有效期 30 天（`session.expiresIn`）
- Codex 代码评审：`/codex:review`（codex 插件 1.0.6），等价于执行 `node ~/.claude/plugins/cache/openai-codex/codex/1.0.6/scripts/codex-companion.mjs review --wait --scope working-tree`

**新依赖**
- 无（`better-auth/plugins` 随 better-auth 安装）

### 01-username-auth-core（批次 T-03）— 2026-10-30

**约定**
- 注册、登录表单统一用 `@gsw-ai-admin/auth/schemas` 的 `signUpSchema` / `signInSchema`，Web 和移动端都不要另写校验规则
- 认证接口返回的错误码统一用 `getAuthErrorMessage(error.code, 默认文案)` 转成中文；遇到新的错误码就加进 `AUTH_ERROR_MESSAGES`，不在组件里写死
- 注册请求的 email 取 `value.email.trim() || toPlaceholderEmail(value.username)`；`@users.local` 域名只给占位邮箱用，`signUpSchema` 会拒绝用户手填这个域名

### 01-username-auth-core（批次 T-04）— 2026-10-30

**踩坑**
- `pnpm add` 在 Windows 上一直没有输出、也不结束 → 后台还有 `pnpm run dev`（tsx watch）在跑，占用着 node_modules 里的文件 → 装依赖前先停掉所有 dev 服务；停的时候用 `taskkill /T` 结束整个进程树，只杀监听端口的子进程会被 tsx watch 重新拉起来
- `pnpm add --save-catalog` 会把 `pnpm-workspace.yaml` 的键全部按字母重排 → 提交前改回原来的顺序，只保留新增的那一行
- 本机访问 npm registry 慢，偶尔出现 ECONNRESET → 安装多等一会，pnpm 会自动重试

**约定**
- 测试命令：根目录 `pnpm test`（`turbo run test`，不缓存，因为集成测试依赖数据库状态）；各包的 `test` 脚本是 `vitest run --passWithNoTests`
- 新的包要加测试时，执行 `pnpm add -D vitest --filter <包名>`（版本取 catalog），再加同样的 `test` 脚本

**新依赖**
- `vitest` ^5.0.5（pnpm catalog）— 单元测试和服务端集成测试，目前用在 `packages/auth`、`apps/server`
