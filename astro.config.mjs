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

  integrations: [mdx(), sitemap()],

  // Tailwind v4 通过 Vite 插件接入（不再需要 tailwind.config.js）。
  vite: {
    plugins: [tailwindcss()],
  },

  // 代码高亮：Shiki + VS Code 默认主题。亮色主题的切换在 P1 接入。
  markdown: {
    shikiConfig: {
      theme: "dark-plus",
      wrap: false,
    },
  },

  // 图片：astro:assets + sharp（devDependency），构建期输出 AVIF/WebP 多尺寸。
  image: {
    service: { entrypoint: "astro/assets/services/sharp" },
  },
});
