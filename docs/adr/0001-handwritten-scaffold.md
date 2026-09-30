# 0001 · 工程骨架手写，不用交互式脚手架

状态：已采纳（2026-09-30，P0）

## 背景

`docs/02-build-and-deploy.md` §2.1 给的初始化命令是
`pnpm create astro@latest . --template minimal --typescript strict --install --git --no-commit`。
该命令是交互式的，会自己生成 `src/pages/index.astro`、`README.md` 等文件，
并且在网络受限、仓库根目录已有 `docs/` 的环境下容易产生来回覆盖。

## 决策

按 `01-design-spec.md` §5.3 的目标目录结构**手写骨架**，只保留真正需要的文件：
`astro.config.mjs`、`tsconfig.json`、`src/{config,content,layouts,pages,styles}`、
`public/`、`.github/workflows/`。

## 影响

- 目录结构与设计规范一一对应，没有脚手架附带的示例文件需要事后删除。
- 依赖仍按 §2.1 的清单安装，安装方式改为显式 `pnpm add`。
- 代价：以后要跟着 Astro 官方模板更新时，需要手动比对（每年一次即可）。
