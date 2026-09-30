/**
 * robots.txt：允许全站抓取，并指向 sitemap（构建期生成，零维护）。
 */
import type { APIContext } from "astro";
import { SITE } from "../config/site";

export function GET({ site }: APIContext) {
  const base = (site ?? new URL(SITE.url)).href.replace(/\/$/, "");

  const body = [
    "User-agent: *",
    "Allow: /",
    "",
    `Sitemap: ${base}/sitemap-index.xml`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
