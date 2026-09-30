#!/usr/bin/env node
/**
 * 构建期抓取 GitHub 动态数据：pnpm data:github
 *
 * 抓什么：本站仓库 + 每个项目条目里 `repo:` 指向的仓库 → star 数、最近推送时间。
 * 存哪里：src/data/github.json（进仓库，本地构建也能读到上一次的结果）。
 *
 * 三条硬规则：
 *   1. **没有 GITHUB_TOKEN 就什么都不做**：本地开发与离线构建不会因为网络失败而中断，
 *      页面读不到数据就自动不显示（不是显示 0，而是整块隐藏）。
 *   2. **只调用 GitHub REST API**，不引入任何 SDK；失败时保留上一次的数据，绝不写空。
 *   3. **不在浏览器里调用 GitHub API**：访客不承担限流风险（设计规范 §5.4 的约定）。
 */
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const SITE_REPO = "Jokezero/jokezero.github.io";
const PROJECTS_DIR = path.join("src", "content", "projects");
const OUT_FILE = path.join("src", "data", "github.json");

/** 从项目的 frontmatter 里取出 repo 地址（不引 YAML 解析器，只认这一行） */
function reposFromFrontmatter(text) {
  const match = text.match(/^repo:\s*(\S+)\s*$/m);
  if (!match) return [];
  const url = match[1].replace(/^["']|["']$/g, "");
  const slug = url.match(/github\.com[/:]([^/]+)\/([^/#?]+)/i);
  if (!slug) return [];
  return [`${slug[1]}/${slug[2].replace(/\.git$/, "")}`];
}

async function collectRepos() {
  const repos = new Set([SITE_REPO]);
  try {
    const files = await readdir(PROJECTS_DIR);
    for (const file of files) {
      if (!/\.mdx?$/.test(file)) continue;
      const text = await readFile(path.join(PROJECTS_DIR, file), "utf8");
      for (const repo of reposFromFrontmatter(text)) repos.add(repo);
    }
  } catch {
    // 没有项目目录也没关系，只抓本站仓库
  }
  return [...repos];
}

async function readExisting() {
  try {
    return JSON.parse(await readFile(OUT_FILE, "utf8"));
  } catch {
    return { fetchedAt: null, repos: {} };
  }
}

const token = process.env.GITHUB_TOKEN;
const existing = await readExisting();

if (!token) {
  console.log("· 未设置 GITHUB_TOKEN：跳过抓取，沿用仓库里已有的数据（这是预期行为）");
  console.log(
    `  已有数据：${Object.keys(existing.repos ?? {}).length} 个仓库，抓取时间 ${existing.fetchedAt ?? "从未"}`,
  );
  process.exit(0);
}

const repos = await collectRepos();
const result = { ...(existing.repos ?? {}) };
let ok = 0;

for (const full of repos) {
  try {
    const response = await fetch(`https://api.github.com/repos/${full}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "zeroweb-build",
      },
    });
    if (!response.ok) {
      console.warn(`· ${full} 抓取失败（HTTP ${response.status}），保留旧数据`);
      continue;
    }
    const data = await response.json();
    result[full] = {
      stars: data.stargazers_count ?? 0,
      pushedAt: (data.pushed_at ?? "").slice(0, 10) || null,
    };
    ok += 1;
  } catch (error) {
    console.warn(`· ${full} 抓取异常：${error}，保留旧数据`);
  }
}

const payload = {
  fetchedAt: new Date().toISOString().slice(0, 10),
  repos: result,
};

await mkdir(path.dirname(OUT_FILE), { recursive: true });
await writeFile(OUT_FILE, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(`✓ 已更新 ${OUT_FILE}：成功 ${ok}/${repos.length} 个仓库`);
