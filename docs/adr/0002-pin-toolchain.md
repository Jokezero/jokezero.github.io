# 0002 · 锁定 Node 与 pnpm 版本

状态：已采纳（2026-09-30，P0）

## 背景

文档要求"半年后回来还能构建"。本机没有全局 Node，构建走的是 Codex 桌面版自带运行时
（Node 24.19.0 + pnpm 11.25.0）。GitHub Actions 则是干净环境，若版本漂移，
`pnpm install --frozen-lockfile` 可能直接失败。

## 决策

- `.nvmrc` 写 `lts/*`：本地装 Node LTS 即可，不写死小版本。
- `package.json` 的 `engines.node` 写 `>=22`。
- `package.json` 的 `packageManager` 写 `pnpm@11.25.0`，与本地验证过的版本一致；
  CI 里的 `pnpm/action-setup@v4` 不写 version，自动读取该字段。

## 影响

- 本地与 CI 使用同一套工具链，锁文件语义一致。
- 升级 pnpm（例如升到 12.x）时要**先本地跑通再改这一处**，否则 CI 会因读取新格式锁文件失败。
