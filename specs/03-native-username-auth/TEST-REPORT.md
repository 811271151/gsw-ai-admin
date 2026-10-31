# 03-native-username-auth 测试报告

## 测试环境

- 本机有 Android SDK（platforms 34/36、build-tools、platform-tools、emulator），但**没有 system image 和 AVD**，`adb devices` 也是空的，没有连接任何设备
- 因此设备上的 UI 验证暂时无法执行。T-05 的验证方式待用户确认（见交付说明）

## 批次 1：T-01（2026-10-31）

T-01 是基础任务，包括：auth-client 接入 `usernameClient`，根 Stack 注册 `login` / `register` 两个屏幕。requirement.md 里没有只靠 T-01 就能验收的 AC。新屏幕目前还渲染原来的表单，T-02 / T-03 会重写表单，T-04 让首页在未登录时跳转到登录屏幕。

### 套件结果

- `apps/native` `tsc --noEmit`：✅
- `biome check`（本批次 4 个文件）：✅ 0 错误
- 打包：✅ `expo export --platform android` 成功，产出 7.7MB Hermes bytecode。确认 Metro 能解析 `better-auth/client/plugins`、`@gsw-ai-admin/auth` workspace 包以及新增的两个路由文件

### 结论

通过（类型检查 + Android 打包；AC 在 T-02 ~ T-05 验收）

---

## 批次 2：T-02 + T-03（W4b 并行，2026-10-31）

### 套件结果

- `apps/native` `tsc --noEmit`：✅
- `biome check`（`sign-up.tsx`、`sign-in.tsx`、`register.tsx`、`login.tsx`）：✅ 0 错误
- 打包：✅ `expo export --platform android` 成功（7.7MB Hermes bytecode）。交叉校验修复后、Codex 修复后各重新打包一次
- 设备或模拟器 UI 测试：**未执行**（本机没有 AVD 或已连接设备，见上文「测试环境」）

### AC 对账

| AC | 结果 | 依据 |
|----|------|------|
| AC-01 用户名 `a-b` 提交后提示 | 🟡 逻辑层 ✅ / 设备 UI 未执行 | 提示文案来自 `signUpSchema`（01 单元测试已覆盖）；表单用 `validators.onSubmit`，校验结果通过 `field.state.meta.errors` 显示在 `FieldError` 里（Checker 已核对代码路径） |
| AC-02 不填邮箱注册 → toast → 登录屏幕 | 🟡 接口层 ✅ / 设备 UI 未执行 | 占位邮箱注册成功（01 集成测试）；注册后先登出，再提示「注册成功，请登录」，然后 `dismissTo("/login")` |
| AC-03 用户名已存在 → toast | 🟡 接口层 ✅ / 设备 UI 未执行 | 服务端返回 `USERNAME_IS_ALREADY_TAKEN`（01 集成测试），`getAuthErrorMessage` 转成「该用户名已被使用」 |
| AC-04 键盘「下一项」跳到密码框 | 🟡 代码 ✅ / 设备未执行 | 用户名框 `returnKeyType="next"`，`onSubmitEditing` 把焦点移到 `passwordInputRef`；必须在设备上验证 |
| AC-05 登录 → 首页 | 🟡 接口层 ✅ / 设备 UI 未执行 | `signIn.username` 成功（01 集成测试）后 `dismissTo("/")`；「首页显示用户名」属于 T-04 |
| AC-06 错误密码或不存在的用户名 → 统一提示 | 🟡 接口层 ✅ / 设备 UI 未执行 | 两种情况都返回 `INVALID_USERNAME_OR_PASSWORD`（01 集成测试），转成「用户名或密码不正确」 |

说明：requirement.md 和 tasks.md 把移动端所有 AC 的设备验证都放在 T-05。本批次已经验证了不需要设备的部分：类型、lint、Metro 打包、接口与校验逻辑，另有独立 Checker 按代码路径逐条核对。**T-05 的设备验证不通过，就不勾选 T-05。**

### 结论

通过（静态检查 + 打包；AC-01~06 的逻辑层和接口层已验证，设备 UI 由 T-05 验收）

---

## 批次 3：T-04（2026-10-31）

### 套件结果

- `apps/native` `tsc --noEmit`：✅
- `biome check`（`app/(drawer)/index.tsx`、`lib/display-name.ts`）：✅ 0 错误
- 打包：✅ `expo export --platform android` 成功（7.7MB）
- 代码检索：`app/`、`components/` 里只有 `login.tsx` / `register.tsx` 引用登录、注册表单；没有 `session.user.email` 和 `users.local`
- 设备或模拟器 UI 测试：**未执行**（没有 AVD 或设备）

### AC 对账

| AC | 结果 | 依据 |
|----|------|------|
| AC-08 未登录启动 App → 登录屏幕 | 🟡 代码 ✅ / 设备未执行 | `useSession()` 加载时显示 Spinner，没有 `session.user` 时 `<Redirect href="/login" />` |
| AC-09 首页不出现 `@users.local` | ✅ | 首页用 `getDisplayName(session.user)` 显示用户名，代码里不再引用 `email`（已检索确认） |
| AC-10 退出登录 → 登录屏幕，重启后仍未登录 | 🟡 代码 ✅ / 设备未执行 | `signOut()` 先清空 SecureStore 里的 cookie 和会话缓存（`@better-auth/expo` 源码已确认），然后 `queryClient.clear()`，会话变为 null 后 `<Redirect>` 跳到 `/login`；「重启后仍未登录」需要设备验证 |

### 结论

通过（静态检查 + 打包 + 代码检索；AC-09 ✅，AC-08/10 的设备部分由 T-05 验收）

---

## 批次 4：T-05（2026-10-31）· 移动端验收（Expo Web 替代）

### 验收方式

本机没有 Android system image / AVD，也没有连接任何设备。**用户 2026-10-31 选择「用 Web 版代替」**：用 Playwright 在 Expo Web（react-native-web）上运行同一套 React Native 组件和 Better Auth 客户端。

- Web 上测不到的部分：SecureStore 持久化、原生软键盘、App 进程被杀后重启。这几条只做 Web 近似验证，在下表标为「设备未执行」，并列入 W8 遗留问题
- 端口用 3001：服务端 `CORS_ORIGIN` 只放行这个地址。所以根目录 `pnpm test:e2e` 用 `turbo --concurrency=1` 让 Web 和移动端两套 E2E 依次跑

### 套件结果

- 移动端 Web E2E（`apps/native`，`pnpm test:e2e`）：**11/11 ✅**。Playwright 的 `webServer` 自动启动 API 和 `expo start --web --port 3001`，单 worker（Metro 按需打包）
- 根目录 `pnpm test:e2e`（两套依次跑）：Web 15/15 ✅、移动端 Web 11/11 ✅
- 单元测试 `pnpm test`：51/51 ✅
- `tsc`、`biome`：✅
- Android 打包：✅（7.7MB）。第一次跑时 Node 在导出完成后以 Segmentation fault 退出（日志里已有「Exported」），重跑一次正常退出。判断是本机 Node 退出阶段的偶发问题，与代码无关
- 数据清理：每轮按前缀删除本轮的测试账号（7 个）

调试过程：第一次跑 4/11 通过，失败分两类。一类是 toast 文本在 DOM 里出现两份（heroui-native 在 Web 上的渲染方式），属于测试选择器问题，改用 `.first()`。另一类是登录后被送回登录屏幕，这是产品 bug（登录竞态），已修复，详见 CR-REPORT.md。修复后全部通过。同一条用例没有连续失败 3 次。

### AC 对账

| AC | 结果 | 依据 |
|----|------|------|
| AC-01 用户名 `a-b` 提交后提示 | ✅ | E2E「AC-01」 |
| AC-02 不填邮箱注册 → toast → 登录屏幕 | ✅ | E2E「AC-02」 |
| AC-03 用户名已存在 → toast | ✅ | E2E「AC-03」 |
| AC-04 键盘「下一项」跳到密码框 | 🟡 Web 近似 ✅ / **设备未执行** | E2E 里按回车，焦点移到密码框（同一个 `onSubmitEditing` 处理函数）；原生软键盘的「下一项」需要设备验证 |
| AC-05 登录 → 首页显示用户名 | ✅ | E2E「AC-05」：URL 为 `/`，显示「欢迎，{用户名}」（保留大小写） |
| AC-06 错误密码或不存在的用户名 → 统一提示 | ✅ | E2E「AC-06」 |
| AC-07 杀掉 App 再打开仍是登录状态 | 🟡 Web 近似 ✅ / **设备未执行** | E2E 刷新页面后仍是登录状态（Web 用 cookie）；原生用的是 SecureStore 持久化，需要设备验证 |
| AC-08 未登录启动 → 登录屏幕 | ✅ | E2E「AC-08」 |
| AC-09 首页不出现 `@users.local` | ✅ | E2E「AC-09」+ 代码检索 |
| AC-10 退出登录 → 登录屏幕，重启后仍未登录 | 🟡 Web 近似 ✅ / **重启部分设备未执行** | E2E：登出后回到 `/login`；重新打开受保护的首页 `/` 仍被送回 `/login`，没有欢迎语；App 重启需要设备验证 |

### 结论

通过（E2E 11/11；AC 7/10 ✅，AC-04/07/10 的 Web 近似验证通过、设备部分未执行，已列为遗留问题）
