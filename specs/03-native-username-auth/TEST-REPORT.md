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
