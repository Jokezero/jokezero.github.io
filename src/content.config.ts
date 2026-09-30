/**
 * 内容集合定义（Astro Content Layer）。
 *
 * 字段规范以 docs/06-content-model.md 为准（内容模型的最新结论），
 * 视觉呈现见 docs/01-design-spec.md §4.5.2 / §4.5.3 与 docs/07-layout-post-project.md。
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
      /** 一句话简介：出现在列表行、RSS 与页面 meta 里。必填、1 行。 */
      summary: z.string(),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      /** 标签：必填、可多个；列表页的多选筛选与排序都基于它。 */
      tags: z.array(z.string()).min(1),
      /** 草稿只在本地构建可见。 */
      draft: z.boolean().default(false),
      /** 封面图：交给 astro:assets 在构建期生成响应式多尺寸。 */
      cover: image().optional(),
      /** 是否进入首页精选。 */
      featured: z.boolean().default(false),
      /** 单篇可关闭评论。 */
      comments: z.boolean().default(true),
    }),
});

/** 项目条目：src/content/projects\/*.md */
const projects = defineCollection({
  loader: glob({ base: "./src/content/projects", pattern: "**/*.{md,mdx}" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      summary: z.string(),
      /** 技术栈：项目页左侧控制栏据此生成筛选按钮。 */
      tags: z.array(z.string()).min(1),
      /** 日期用 "2025.10" 这样的字符串，只用于展示与排序。 */
      date: z.string(),
      cover: image().optional(),
      // zod 4 起用 z.url()，z.string().url() 已废弃。
      repo: z.url().optional(),
      /** 视频链接（B 站等）：卡片上只标 VIDEO，不嵌播放器，点出去看。 */
      video: z.url().optional(),
      /** 其他任意链接，例如在线演示、文档。 */
      links: z.array(z.object({ label: z.string(), url: z.url() })).default([]),
      featured: z.boolean().default(false),
      draft: z.boolean().default(false),
    }),
});

/**
 * 单页内容（about / now / uses…）：src/content/pages\/*.{md,mdx}
 *
 * about 用结构化字段（简介段落 / 经历时间线 / 技能分组 / 联系方式），
 * 因为它要做成"一屏一节"的分节页面，靠 Markdown 正文表达不了这种结构。
 */
const pages = defineCollection({
  loader: glob({ base: "./src/content/pages", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    title: z.string(),
    summary: z.string().default(""),
    updatedDate: z.coerce.date().optional(),
    /** 01 简介：每段一条 */
    intro: z.array(z.string()).default([]),
    /** 02 经历：年份 + 事由 */
    experience: z.array(z.object({ year: z.string(), text: z.string() })).default([]),
    /** 03 技能：分组名 + 该项清单 */
    skills: z
      .array(z.object({ group: z.string(), items: z.array(z.string()) }))
      .default([]),
    /** 04 联系：显示文字 + 可选链接 */
    contacts: z
      .array(
        z.object({
          label: z.string(),
          value: z.string(),
          url: z.url().optional(),
        }),
      )
      .default([]),
  }),
});

export const collections = { posts, projects, pages };
