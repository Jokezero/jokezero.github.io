# 技术决策记录（ADR）

这里记录**文档没写死、但必须做选择**的地方：为什么这样选、代价是什么、以后怎么改。

格式：`NNNN-短标题.md`，内容包含 状态 / 背景 / 决策 / 影响。

| 编号 | 标题 | 状态 |
| --- | --- | --- |
| [0001](./0001-handwritten-scaffold.md) | 工程骨架手写，不用交互式脚手架 | 已采纳 |
| [0002](./0002-pin-toolchain.md) | 锁定 Node 与 pnpm 版本 | 已采纳 |
| [0003](./0003-astro-major-version.md) | 依赖取当前最新（Astro 7.x），不锁文档写作时的 5.x | 已采纳 |
| [0004](./0004-pnpm-build-script-allowlist.md) | 依赖构建脚本白名单写在 `pnpm-workspace.yaml` | 已采纳 |
| [0005](./0005-p0-scope-and-placeholders.md) | P0 的交付边界、占位内容与功能开关默认值 | 已采纳 |
| [0006](./0006-self-hosted-font.md) | 自托管等宽字体（JetBrains Mono 拉丁子集） | 已采纳 |
| [0007](./0007-theme-switching.md) | 主题切换与"防闪烁"策略 | 已采纳 |
| [0008](./0008-p1-visual-defaults.md) | P1 的视觉默认值与待办取舍 | 已采纳 |

新增记录时直接续号，**不要修改历史记录**——改主意就新写一条并标注"取代 00XX"。
