# 0007 · 主题切换与"防闪烁"策略

状态：已采纳（2026-09-30，P1）

## 背景

规范要求：默认纯黑；亮色主题可选（`data-theme` + `localStorage` 记忆 +
跟随 `prefers-color-scheme`）；切换不得闪烁。同时站点必须"无 JS 也能完整阅读"。

## 决策

1. 主题状态只有一个来源：`<html data-theme="dark" | "light">`。
   没有该属性时按深色渲染，因此**无 JS 时页面依然完整**。
2. 首帧由 `BaseLayout.astro` 里的一段**内联脚本**决定（约 200 字节，同步执行）：
   先读 `localStorage["zeroweb-theme"]` → 没有就跟随 `prefers-color-scheme` → 兜底深色。
   脚本排在样式表之前，所以不会出现"先白后黑"的闪烁。
3. 点击切换由 `ThemeToggle.astro` 负责：改属性 + 写 `localStorage` + 同步 `aria-label`。
4. 亮色**不是颜色反转**：同一套变量名（`--color-bg-*`、`--color-fg-*`、`--color-line-*`）
   在 `html[data-theme="light"]` 下重新校准。其中 `--color-fg-2` 在白底上从 `0.52`
   提到 `0.6`，因为 0.52 在白底只有 4.27:1，达不到正文 4.5:1 的红线。
5. **不做三态切换**（深 / 浅 / 跟随系统）：两态对用户更可预测、代码更少。
   想恢复"跟随系统"只需清掉浏览器里 `zeroweb-theme` 这个键。

## 影响

- 存储键 `zeroweb-theme` 在**两个**地方以字面量出现（内联脚本为了体积不引入模块）：
  `BaseLayout.astro` 与 `ThemeToggle.astro`；`src/config/site.ts` 里的
  `themeStorageKey` 是它们的书面约定。改键名时三处一起改。
- 实测（2026-09-30，本地浏览器）：深色 → 点击 → 亮色（白底黑字、图标切换）→
  刷新后仍为亮色；控制台无报错与警告。
