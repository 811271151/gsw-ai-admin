# 交付报告

生成时间: 2026-10-31
项目: E:\2025\myselfs\37期\5\lessonSync\gsw-ai-admin
形态: 混合（web + app + backend）
需求来源: docs/需求.md（P0 范围）

## 概览

| 项 | 值 |
|----|-----|
| feature | 3/3 |
| 任务 | 15/15 |
| CR 修复 | 22 个（P1 x6，P2 x13，另有 E2E 或自查发现的产品 bug x3） |
| 新增依赖 | 5 个（均为开发依赖或 workspace 依赖） |
| 本工作流提交 | 17 个（`71c49c7` ~ `6c6bddf`） |

## 全局验收（W8）

| 项 | 命令 | 结果 |
|----|------|------|
| 单元 + 集成测试 | `pnpm test` | ✅ 51/51（web 23、auth 15、server 13） |
| Web E2E | `pnpm test:e2e` | ✅ 15/15 |
| 移动端 Web E2E | `pnpm test:e2e` | ✅ 11/11（与 Web E2E 依次执行） |
| 构建 | `pnpm run build` | ✅ 3/3（server、web、fumadocs） |
| 类型检查 | `pnpm run check-types` | ✅ 7/7 |
| 移动端打包 | `expo export --platform android` | ✅ 7.7MB Hermes bytecode |
| 任务勾选 | `grep "^- \[ \]" specs/*/tasks.md` | ✅ 无未勾选任务 |
| 测试数据 | E2E 结束后按本轮前缀清理测试账号 | ✅ 无残留 |

## Feature 明细

| 序号 | Feature | 任务 | CR | 测试 | 提交 |
|------|---------|------|----|------|------|
| 01 | 用户名认证服务端与共享校验 | 5/5 | 修复 P1 x1；T-01 批次按旧规则审了 2 轮 | 单元 15 + 集成 13，AC 17/17 | `9842ab5` `574c52b` `0318bc1` `a4eba50` |
| 02 | Web 端用户名注册登录 | 5/5 | 修复 P1 x2、P2 x4；另修会话 token 泄露、点击落空 | 单元 23 + E2E 15，AC 15/15 | `db148ad` `ed483b5` `30c8067` `35567f5` `76c98ec` `75061b1` |
| 03 | 移动端用户名注册登录 | 5/5 | 修复 P1 x1（交叉校验）、P2 x7；另修登录竞态 | Web 版 E2E 11，AC 7/10 ✅，3 条设备部分未执行 | `a87967c` `481f4c0` `52a3969` `6c6bddf` |

另有配置与文档提交：`71c49c7`（修复 Biome 配置）、`44feb22`（需求拆分）、`ed771cf`（纳入工作流说明）。

各 feature 的明细见 `specs/<feature>/CR-REPORT.md` 和 `TEST-REPORT.md`。

### 值得注意的修复

- **开放重定向（Web）**：`getSafeRedirect` 先后堵住了两类绕过：控制字符（`/\n/evil.com`），以及点段归一化后变成协议相对地址的输入（`/a/..//evil.com`）。修复后会对拼好的结果再解析一次，比较 origin
- **会话 token 泄露（Web）**：脚手架把整个 session 作为 prop 传给客户端组件，httpOnly 的会话 token 因此被序列化进了 HTML。现在不再传 session
- **点击落空（Web 注册）**：`onBlur` 校验留下过期的错误提示，提交时错误消失、按钮位移，第一次点击就落空。现在错误只来自 `onChange` 校验，并用失焦监听器刷新
- **登录竞态（移动端）**：登录后会话还没拉到，首页守卫就把人送回了登录页。现在登录后先 refetch 会话再跳转，首页在拉取期间等待

## 新增依赖

| 包 | 位置 | 用途 |
|----|------|------|
| `vitest` ^5.0.5（catalog） | `packages/auth`、`apps/server`、`apps/web` 开发依赖 | 单元 / 集成测试 |
| `@playwright/test` ^1.64.1 | `apps/web`、`apps/native` 开发依赖 | E2E |
| `@gsw-ai-admin/auth`（workspace） | `apps/web`、`apps/native` | 共享校验规则与错误文案 |

## 遗留问题

1. **移动端 3 条 AC 没有在设备上验证**：本机没有 Android system image / AVD，也没有连接设备。经用户确认，改在 Expo Web 上做替代验收，下面 3 条只有 Web 近似验证：
   - AC-04 键盘「下一项」跳到密码框（Web 上用回车键代替）
   - AC-07 杀掉 App 再打开仍是登录状态（Web 上用刷新页面代替；原生用的 SecureStore 持久化没有测到）
   - AC-10 中「重启 App 后仍未登录」的部分
   - 另外，注册屏幕键盘弹出时不挡提交按钮（R-01）也没有在设备上看过，`bottomOffset={96}` 余量较小
2. **与 docs/需求.md 不同的地方（均已和用户确认）**：
   - 「记住我」：需求原文是「勾选 30 天 / 不勾选 7 天」。实际是会话统一 30 天，不勾选时 cookie 不设 Max-Age，关闭浏览器即失效
   - 邮箱改为选填，没填时用占位邮箱 `{username}@users.local`
   - 登录失败统一提示「用户名或密码不正确」，不区分「用户名不存在」和「密码错误」
   - 「账户禁用」「5 次失败锁定 15 分钟」移到 P1，本期没做
   - Web 的「跨标签页登出同步」移到 P1，Better Auth 没有内置
3. **仓库里原有的 lint 问题**：`biome check .` 全仓库还有 396 个错误、74 个警告（开工前是 501 个错误）。都在没有改动过的脚手架文件里，本工作流改动和新增的文件都是 0 错误。PostToolUse hook 修好之后会逐个格式化被编辑的文件，旧文件被改到时会顺带出现格式变化
4. **提交 `30c8067 update`**：这个提交不是工作流生成的，它在 W5 送审之前就把 Web T-03 的 4 个文件带进了历史。没有改写这个提交，补审用的是 `review --base ed483b5`，记在 02 CR-REPORT 里
5. **requirement.md 里的 AC 复选框没有勾**：工作流只勾 tasks.md。每条 AC 的结果见各 feature 的 TEST-REPORT.md
6. **E2E 依赖本地环境**：
   - 需要本地 PostgreSQL（`apps/server/.env` 的 `DATABASE_URL`）
   - 端口 3000 和 3001 必须空闲。服务端 CORS 只放行 3001，所以 Web 和移动端两套 E2E 只能依次跑
   - 还没接入 CI
7. **Codex 沙箱的限制**：每一轮 Codex 都因为沙箱权限没跑成 tsc 和测试，只做了静态审查。类型检查和测试都由 Claude 在本机执行，结果见各份报告

## 建议

1. 建一个 Android 模拟器或接一台真机，补测上面 4 条设备项（AC-04、AC-07、AC-10 的重启部分、键盘遮挡）
2. 接入 CI（带 PostgreSQL service）：先跑 `pnpm test`、`pnpm run check-types`、`pnpm run build`，再跑 `pnpm test:e2e`
3. 单独做一次全仓库 `ultracite fix` 格式化提交，清掉 396 个原有 lint 问题，以后改文件的 diff 就不会混进格式变化
4. P1：修改密码、个人资料编辑、账户禁用 / 登录失败锁定（可用 Better Auth 的 admin 插件和自带 rateLimit）
5. 新增 `.env.example`（或在 README 写明各个 env 变量），方便新成员本地起服务

---
*本报告由 /gsw-workflow W8 生成*
