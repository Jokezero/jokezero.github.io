/**
 * RSS 订阅源。
 *
 * 约定见 docs/02-build-and-deploy.md §0：输出全文、界面不放入口，
 * 但保留 <head> 里的自动发现链接（BaseLayout 已接）。
 * P0 阶段内容集合为空，这里先保证端点存在且可订阅；
 * 全文渲染与 OG 图在 P2 与内容系统一起补齐。
 */
import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import type { APIContext } from "astro";
import { SITE } from "../config/site";

export async function GET(context: APIContext) {
  const now = new Date();

  // 草稿与"计划发布"（pubDate 在未来）都不出现在订阅源里。
  const posts = (await getCollection("posts"))
    .filter((post) => !post.data.draft && post.data.pubDate <= now)
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  return rss({
    title: SITE.name,
    description: SITE.description,
    site: context.site ?? SITE.url,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/blog/${post.id}/`,
      categories: post.data.tags,
    })),
    customData: `<language>${SITE.lang}</language>`,
  });
}
