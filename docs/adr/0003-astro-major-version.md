# 0003 · 依赖取当前最新（Astro 7.x），不锁文档写作时的 5.x

状态：已采纳（2026-09-30，P0）

## 背景

`docs/README.md` 的"一句话技术画像"写的是 Astro 5（文档写于 2026-09 之前）。
实际安装时 registry 上的最新稳定版是 **Astro 7.3.5**，配套集成是
`@astrojs/mdx@8`、`@astrojs/sitemap@3`、`@astrojs/rss@4`。

同时 `02-build-and-deploy.md` §2.1 明确要求用 `create astro@latest`——
即文档本身也倾向于"用当时的最新版"。

## 决策

采用 **Astro 7.x + Tailwind 4.3.x + TypeScript 6.x**，并把设计文档里的
"Astro 5"读作"当前 Astro 主线版本"。

内容集合使用 **Content Layer API**（`src/content.config.ts` + `glob()` loader），
这是 Astro 5 引入、7.x 仍推荐的写法，因此升级路径是连续的。

TypeScript 取 6.x 而非最新的 7.x：**`astro check` 目前不支持 TypeScript 7**，
会直接报错要求改用 6。P4 的质量门禁要用 `astro check`，所以这里先降到 6.0.3；
等 Astro 支持 TS 7 后再升（届时要重新跑一次完整构建）。

## 影响

- 拿到的是当下的安全更新与性能改进，不会一开始就背一年多的技术债。
- 文档里"Astro 5"的字样在 P5 整理文档时统一更新。
- 若将来某次升级破坏构建，参照本记录：先本地完整构建，再动版本。
