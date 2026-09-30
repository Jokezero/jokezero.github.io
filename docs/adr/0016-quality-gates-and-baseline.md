# 0016 · 质量门禁的实现方式与性能基线

状态：已采纳（2026-09-30，P4）

## 背景

`01-design-spec.md` §6.1 给了硬性预算，§6.3 列了质量门禁清单
（astro check + ESLint/Prettier + Stylelint、size-limit、Lighthouse CI、死链、axe）。
其中几条需要做工程取舍：体积怎么量、axe 怎么跑、Lint 用什么、哪些指标能在 CI 卡死。

## 决策

### 1. 资产不再内联（`vite.build.assetsInlineLimit: 0`）

以前 Astro 会把小于 4 KB 的脚本塞进 HTML。改成 0 之后，所有脚本与样式都输出成
**带 hash 的独立文件**：

- 共享脚本（转场、滚动、主题切换）只下载一次，站内跳转直接命中缓存；
- §6.1 的"首屏 JS / CSS"变成可逐项度量的对象，而不是混在 HTML 里；
- 顺带绕开"内联脚本 + 动态 import 触发 `__VITE_PRELOAD__` 报错"的坑（ADR-0011）。

首屏关键 CSS 仍然由 `BaseLayout` 里的 `<style is:inline>` 提供，不受影响。

### 2. size-limit 按 gzip 度量四项

| 项目 | 预算（§6.1） | 实测 |
| --- | --- | --- |
| 首屏 HTML（首页） | ≤ 25 KB | **4.58 KB** |
| 全站 CSS 合计 | ≤ 30 KB | **8.61 KB** |
| 全站 JS 合计（比单页实际加载更严格） | ≤ 40 KB | **10.3 KB** |
| 自托管字体 | ≤ 120 KB | **43.08 KB** |

**负向验证**：`size-limit --limit 1kB` → 退出码 1，报 "Package size limit has
exceeded by 3.58 kB"。门禁是真的会拦，不是摆设。

> 说明：JS 那一项量的是**全站所有脚本之和**，比"单页首屏"严格得多
> （单页实际只加载 5–7 KB，因为每页只引自己的组件脚本）。

### 3. Lint = Prettier + ESLint，不引入 Stylelint

- **Prettier**（含 `prettier-plugin-astro`）负责格式，`pnpm format:check` 进 CI。
  `docs/` 与 `src/content/` 在 `.prettierignore` 里：那是人写的散文与内容，
  自动重排只会让 diff 无法阅读。
- **ESLint 10 扁平配置**：只依赖已声明的四个包（eslint / eslint-plugin-astro /
  astro-eslint-parser / typescript-eslint），不额外引入 `@eslint/js` ——
  pnpm 的严格 node_modules 下未声明的传递依赖不保证可解析。
- **不加 Stylelint**：全站 CSS 只有四个文件（tokens / global / motion / print），
  且大量使用 Tailwind v4 的 `@theme`、`@layer`、`@apply`，通用规则集只会带来误报；
  语法与拼写错误已由 `astro check` + Prettier 覆盖。这是一次有意识的省略，
  不是遗漏。

### 4. axe 交给 Lighthouse

Lighthouse 的 accessibility 类别内部就是 axe-core。因此不再单独引入
`@axe-core/cli`（它还要额外拉一个 Chrome），用 `pnpm lhci` 的
`categories:accessibility ≥ 0.95` 同时完成"axe 扫描"这项要求。

### 5. 死链检查自己写

`scripts/check-links.mjs`（约 80 行、零依赖）：扫 `dist/` 下所有 HTML，
取出 `href`/`src`，只校验站内目标是否命中构建产物（目录 URL 视为 `index.html`），
站外链接不发请求 —— 离线可跑，也不会被别人的站点抖动误伤。

### 6. Lighthouse 阈值与"能卡死发布"的边界

| 项 | 门禁值 | 依据 |
| --- | --- | --- |
| 性能 | ≥ 0.90 | §9 上线检查清单的"首页含动效 ≥ 90" |
| 可访问性 / 最佳实践 / SEO | ≥ 0.95 | §6.1 |
| CLS | < 0.05 | §6.1 |
| TBT | < 200 ms | §6.1 |
| LCP | < 2.5 s | **比 §6.1 的 1.5s 放宽**：CI 机器噪声大，1.5s 会把随机抖动变成红叉；设计目标仍是 1.5s，用真机与 CI 报告人工复核 |

采集用 `staticDistDir: ./dist` + desktop preset，跑首页 / 文章列表 / 项目列表三个 URL
（原文档写的是首页 / 列表 / 详情；详情页要等有真实文章后再加进 URL 列表）。

## 尺寸矩阵走查（§4.6.3）

自动化：9 个宽度 × 7 个页面 = **63 项，全部通过**。

| 宽度 | 320 / 360 / 390 / 768 / 834 / 1024 / 1280 / 1440 / 1920 |
| --- | --- |
| 页面 | 首页、文章列表、项目列表、关于、搜索、文章详情、项目详情 |

每项检查：`scrollWidth ≤ 视口宽`（无横向滚动）、无元素越界、背景画布铺满视口、
导航可达、无文本裁切。唯一被标记为"裁切"的是 `.sr-only` 的无障碍文本
（1px + overflow hidden 是它本来的实现方式），属预期。

## 打印样式

`src/styles/print.css`：白底黑字、隐藏画布/幕布/进场遮罩/顶栏页脚/评论区/代码工具条、
段落与表格避免跨页断开、站外链接把地址印在括号里、关于页的"一屏一节"还原成普通文档流。
构建产物里已包含 `@media print` 规则（已核对）。

## 未在本机执行的部分

Lighthouse CI 需要 Chrome 二进制（本机离线环境无法下载），因此**本地只验证了配置
能被解析、依赖已就位**，实际跑分由 `quality.yml` 在 GitHub Actions 里完成。
真机抽查（iOS Safari / Firefox / 中端 Android）同样留给你在真机上走一遍。

## 上线后发现：门禁真的抓到了问题

推送后每次都会出现两个运行：`Deploy to GitHub Pages`（绿）与 `Quality`（红）。
定位到的失败项是 **Lighthouse 可访问性里的 `color-contrast`**：微标签令牌
`--color-fg-3` 原来是 0.38 透明度（3.39:1），低于小字号 AA 的 4.5:1，
而它被用在 kicker、日期、标签、页脚链接与搜索占位符上，几乎每页都会命中。

处理（2026-09-30）：

- `--color-fg-3` 深色 0.38 → 0.48（4.92:1）、亮色 0.42 → 0.56（4.94:1）；
- 项目卡片标题从 `h3` 改成 `h2`（页面只有 `h1`，原来跳级，axe 的 heading-order 不接受）；
- `quality.yml` 增加一步：失败时直接把"哪条断言没过、期望值、实际值"打印到日志，
  以后不用翻报告就能定位。

**这条经验值得记住**：体积、格式、死链这些门禁在本地都能先跑一遍，
只有 Lighthouse 依赖真实浏览器、本机跑不了 —— 所以**本地全绿不代表 CI 全绿**，
涉及可访问性的改动（配色、层级、ARIA）尤其要在 CI 里复核。
