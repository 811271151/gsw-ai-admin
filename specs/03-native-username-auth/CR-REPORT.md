# 03-native-username-auth Code Review 报告

> 评审工具：codex 插件 1.0.6 的 `/codex:review`（`codex-companion.mjs review --wait --scope working-tree`），每个批次只送审 1 轮。

## 批次 T-01 · Codex 意见（2026-10-31）

范围：`apps/native/package.json`、`pnpm-lock.yaml`、`lib/auth-client.ts`、`app/_layout.tsx`、`app/login.tsx`（新增）、`app/register.tsx`（新增），另有 `specs/INDEX.md` 的状态改动

P0 x0 / P1 x0 / P2 x0。Codex 结论：未发现本次改动引入的缺陷，认证插件、存储适配和新增路由都在任务范围内。

Codex 提到的 Biome「package.json 字段排序」是原有问题，不属于本批次改动。Codex 在沙箱里跑 tsc 时遇到 EPERM，没跑成；Claude 在本机执行 `apps/native` 的 `tsc --noEmit`，通过。

送审前的自查修改：`import * as SecureStore` 触发了 Biome 的 `noNamespaceImport`，改成具名导入 `getItem`、`getItemAsync`、`setItem`、`setItemAsync`，组成一个 `secureStorage` 对象传给 `expoClient`。这四个方法正好是 `@better-auth/expo` 1.7.12 的 `ExpoClientStorage` 类型要求的。

## 结论（批次 T-01）

P0/P1 已全部修复（本批次无 P0/P1）
