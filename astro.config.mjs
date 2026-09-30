// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

import { SITE } from "./src/config/site.ts";

// https://astro.build/config
export default defineConfig({
  // 用户站仓库（<user>.github.io）挂在根路径，因此不需要 base。
  // 若将来启用自定义域名，只需改 src/config/site.ts 里的 url 一处。
  site: SITE.url,

  // 全静态预渲染：产物是纯 HTML/CSS/JS，直接交给 GitHub Pages。
  output: "static",

  // 体积小的样式表直接内联进 HTML，减少首屏的往返请求（P1 的"关键 CSS 内联"）。
  build: {
    inlineStylesheets: "auto",
  },

  integrations: [mdx(), sitemap()],

  // Tailwind v4 通过 Vite 插件接入（不再需要 tailwind.config.js）。
  vite: {
    plugins: [tailwindcss()],
    build: {
      // 0 = 所有脚本/样式都输出成带 hash 的独立文件，不往 HTML 里塞。
      // 理由（见 docs/adr/0016）：
      //   1. 共享的交互脚本只下载一次，站内跳转直接命中缓存；
      //   2. 体积预算（§6.1）能对 JS/CSS 逐项度量，而不是混在 HTML 里；
      //   3. 顺带绕开"内联脚本 + 动态 import"会触发 __VITE_PRELOAD__ 报错的坑。
      // 首屏关键 CSS 仍然由 BaseLayout 里的 <style is:inline> 提供，不受影响。
      assetsInlineLimit: 0,
    },
  },

  // 代码高亮：Shiki + VS Code 默认主题（暗 dark-plus / 亮 light-plus，见 06-content-model.md）。
  // 两套主题同时输出，用哪套由 CSS 的 data-theme 决定，切换主题不需要重新构建。
  markdown: {
    shikiConfig: {
      themes: { light: "light-plus", dark: "dark-plus" },
      wrap: false,
    },
  },

  // 图片：astro:assets + sharp（devDependency），构建期输出 AVIF/WebP 多尺寸。
  image: {
    service: { entrypoint: "astro/assets/services/sharp" },
  },
});
