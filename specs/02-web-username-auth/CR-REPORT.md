# 02-web-username-auth Code Review 报告

> 评审工具：codex 插件 1.0.6 的 `/codex:review`（`codex-companion.mjs review --wait --scope working-tree`），每个批次只送审 1 轮。

## 批次 T-01 · Codex 意见（2026-10-30）

范围：`apps/web/package.json`、`pnpm-lock.yaml`、`apps/web/src/lib/auth-client.ts`、`apps/web/src/lib/safe-redirect.ts`、`apps/web/src/components/password-input.tsx`（另有 `specs/INDEX.md` 状态改动）

P0 x0 / P1 x0 / P2 x1

- [P2] safe-redirect 没有拒绝控制字符 — `apps/web/src/lib/safe-redirect.ts:8-11`
  - 问题：`/\n/evil.com`、`/\t/evil.com` 能通过前缀检查。浏览器解析时会去掉换行和 Tab，最后跳到 `https://evil.com/`
  - 分类：**可修复**。虽然标为 P2，但这个 helper 的目的就是防开放重定向（R-03 / AC-11），这是真实的绕过路径，所以修复
  - 修复：不再只比字符串前缀，改为用 `new URL(value, "http://redirect.invalid")` 解析，只有解析后 origin 仍是这个哨兵域名时，才返回 `pathname + search + hash`。换行、Tab、反斜杠的规范化都交给 URL 解析器，与浏览器的处理方式一致
  - 自检：用 15 个输入验证全部符合预期，包括 `/\n/evil.com`、`/\t/evil.com`、`/\r\n/evil.com`、`/\evil.com`、`/\/evil.com`、`//evil.com`、`https://evil.com`、`javascript:alert(1)`、空值，以及带 query 和 hash 的站内路径。`tsc`、`biome` 通过

## 结论（批次 T-01）

P0/P1 已全部修复（本批次无 P0/P1；P2 x1 已修复）
