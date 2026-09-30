/**
 * 文章与项目的取数工具。
 *
 * 约定：草稿（draft: true）只在本地开发时可见，构建产物里不出现。
 * 排序：文章按发布日期倒序；并列时按 id，保证每次构建顺序一致。
 */
import { getCollection, type CollectionEntry } from "astro:content";

export async function getPosts(): Promise<CollectionEntry<"posts">[]> {
  const posts = await getCollection("posts");

  return posts
    .filter((post) => import.meta.env.DEV || !post.data.draft)
    .sort((a, b) => {
      const byDate = b.data.pubDate.valueOf() - a.data.pubDate.valueOf();
      return byDate !== 0 ? byDate : a.id.localeCompare(b.id);
    });
}

export async function getProjects(): Promise<CollectionEntry<"projects">[]> {
  const projects = await getCollection("projects");

  return projects
    .filter((project) => import.meta.env.DEV || !project.data.draft)
    .sort((a, b) => {
      const byDate = b.data.date.localeCompare(a.data.date);
      return byDate !== 0 ? byDate : a.id.localeCompare(b.id);
    });
}
