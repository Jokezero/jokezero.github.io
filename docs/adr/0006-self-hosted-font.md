# 0006 · 自托管等宽字体（JetBrains Mono 拉丁子集）

状态：已采纳（2026-09-30，P1）

## 背景

`01-design-spec.md` §4.3 要求：拉丁等宽字体**自托管一款**、只拉丁子集、woff2；
中文走系统字体栈；最多 2 个字体文件、2 个字重，总体积 ≤ 120 KB；
全部 `font-display: swap`，只预加载首屏需要的那一个文件。

## 决策

- 字体：**JetBrains Mono**（工程师审美与站点气质一致，字面清晰）。
- 来源：Fontsource 的 CDN 取 **latin 子集 woff2**，落到仓库 `public/fonts/`：
  `jetbrains-mono-latin-400.woff2`（21 KB）、`jetbrains-mono-latin-600.woff2`（22 KB），
  合计 43 KB，在预算内。
- 用 `unicode-range` 限定拉丁区段；中文根本不会去请求字体文件。
- 只 `preload` 400 字重（首屏必然用到），600 用到才下载。
- 回退栈：`ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`，
  字体加载失败也不会破相。

## 影响

- 首屏不会因为字体产生长时间空白（`swap` + 度量接近的回退栈）。
- 想换字体时只需要：替换 `public/fonts/` 的两个文件 + 改 `tokens.css` 里的
  `@font-face` 与 `--font-mono`，其他文件不用动。
- 字体文件进仓库（而不是构建期下载），保证离线也能构建、半年后也能构建。
