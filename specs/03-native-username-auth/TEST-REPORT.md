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
