/**
 * 内容集合定义（Astro 5 Content Layer）。
 *
 * 字段规范见 docs/01-design-spec.md §3.2 与 docs/06-content-model.md。
 * 所有 frontmatter 都经 zod 校验：写错字段会在构建期直接报错，而不是线上白屏。
 */
// 注意：zod 要从 "astro/zod" 单独导入。从 "astro:content" 取 z 在 Astro 5+ 已标记废弃。
import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

/** 博客文章：src/content/posts/**\/*.{md,mdx} */
const posts = defineCollection({
  loader: glob({ base: "./src/content/posts", pattern: "**/*.{md,mdx}" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      tags: z.array(z.string()).default([]),
      series: z.string().optional(),
      /** 草稿只在本地构建可见。 */
      draft: z.boolean().default(false),
      /** 封面图：交给 astro:assets 在构建期生成响应式多尺寸。 */
      cover: image().optional(),
      /** 预留多语言字段。 */
      lang: z.string().default("zh"),
      /** 是否进入首页精选。 */
      featured: z.boolean().default(false),
      /** 单篇可关闭评论（P2 接入 giscus 后生效）。 */
      comments: z.boolean().default(true),
    }),
});

/** 项目条目：src/content/projects\/*.md */
const projects = defineCollection({
  loader: glob({ base: "./src/content/projects", pattern: "**/*.{md,mdx}" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      /** 技术栈：项目页左侧控制栏据此生成筛选按钮。 */
      stack: z.array(z.string()).default([]),
      year: z.coerce.number().optional(),
      /** 展示顺序，数字越小越靠前。 */
      order: z.number().default(999),
      // zod 4 起用 z.url()，z.string().url() 已废弃。
      repo: z.url().optional(),
      demo: z.url().optional(),
      cover: image().optional(),
      draft: z.boolean().default(false),
    }),
});

/** 单页内容（about / now / uses…）：src/content/pages\/*.{md,mdx} */
const pages = defineCollection({
  loader: glob({ base: "./src/content/pages", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    title: z.string(),
    description: z.string().default(""),
    updatedDate: z.coerce.date().optional(),
  }),
});

export const collections = { posts, projects, pages };
