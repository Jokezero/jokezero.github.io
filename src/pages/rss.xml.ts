/**
 * RSS 订阅源：**输出全文**（docs/06-content-model.md §6 的结论）。
 *
 * 界面不放置任何订阅入口，但 <head> 里保留自动发现标记（BaseLayout 已接），
 * 读者把 https://jokezero.github.io/rss.xml 丢进阅读器即可订阅。
 *
 * 全文渲染用 Astro 的 Container API：把 Markdown 渲染成完整 HTML，
 * 再把站内相对链接改写为绝对地址，否则阅读器里点不开。
 */
import rss from "@astrojs/rss";
import { render } from "astro:content";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import type { APIContext } from "astro";
import { SITE } from "../config/site";
import { getPosts } from "../lib/posts";

export async function GET(context: APIContext) {
  const site = (context.site ?? new URL(SITE.url)).href.replace(/\/$/, "");
  const posts = await getPosts();
  const container = await AstroContainer.create();

  const items = await Promise.all(
    posts.map(async (post) => {
      const { Content } = await render(post);
      const html = await container.renderToString(Content);

      // 站内相对链接 → 绝对链接（只改以单个 / 开头的，不动 // 开头的协议相对地址）
      const absolute = html.replace(
        /(src|href)="\/(?!\/)/g,
        (_match, attr: string) => `${attr}="${site}/`,
      );

      return {
        title: post.data.title,
        description: post.data.summary,
        pubDate: post.data.pubDate,
        link: `/blog/${post.id}/`,
        categories: post.data.tags,
        content: absolute,
      };
    }),
  );

  return rss({
    title: SITE.name,
    description: SITE.description,
    site: context.site ?? SITE.url,
    items,
    customData: `<language>${SITE.lang}</language>`,
  });
}
