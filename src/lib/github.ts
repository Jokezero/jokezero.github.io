/**
 * 读取构建期抓到的 GitHub 动态数据（src/data/github.json）。
 *
 * 设计原则：**数据缺失时页面不显示，而不是显示 0**。
 * 本地没网、CI 抓取失败、项目还没有关联仓库 —— 这些情况下一切照常渲染，
 * 只是少一行数字。所以这里所有取值都返回 possibly undefined。
 *
 * 用 fs 读而不是 import json：避免依赖 tsconfig 的 resolveJsonModule，
 * 也避免打包器把 JSON 当成模块处理（这份文件只在构建期读取）。
 */
import { readFileSync } from "node:fs";
import path from "node:path";

interface RepoStat {
  stars: number;
  pushedAt: string | null;
}

interface GithubData {
  fetchedAt: string | null;
  repos: Record<string, RepoStat>;
}

function load(): GithubData {
  try {
    const file = path.join(process.cwd(), "src", "data", "github.json");
    const parsed = JSON.parse(readFileSync(file, "utf8")) as Partial<GithubData>;
    return { fetchedAt: parsed.fetchedAt ?? null, repos: parsed.repos ?? {} };
  } catch {
    return { fetchedAt: null, repos: {} };
  }
}

const data = load();

/** 从任意 GitHub 地址里取出 owner/name，用于查表。 */
export function repoSlug(url: string | undefined): string | undefined {
  if (!url) return undefined;
  const match = url.match(/github\.com[/:]([^/]+)\/([^/#?]+)/i);
  if (!match) return undefined;
  return `${match[1]}/${match[2].replace(/\.git$/, "")}`;
}

export function repoStat(url: string | undefined): RepoStat | undefined {
  const slug = repoSlug(url);
  if (!slug) return undefined;
  return data.repos[slug];
}

/** 本站仓库的最近提交日期（yyyy-mm-dd），没有数据时返回 undefined。 */
export function siteLastPush(slug: string): string | undefined {
  return data.repos[slug]?.pushedAt ?? undefined;
}

export const githubDataFetchedAt = data.fetchedAt;
