#!/usr/bin/env node
/**
 * 新建一篇文章：pnpm new:post 我的文章标题
 *
 * 做三件事：
 *   1. 按 "YYYY-MM-DD-标题.md" 生成文件名（放在 src/content/posts/）
 *   2. 写好 frontmatter 骨架：标题、日期、标签、draft: true
 *   3. 文件已存在时报错退出，不覆盖任何东西
 *
 * draft: true 是刻意的默认值：写作过程中即使推送也不会出现在线上；
 * 写完后把 draft 改成 false 即可发布。
 */
import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const title = process.argv.slice(2).join(" ").trim();

if (!title) {
  console.error("用法：pnpm new:post 文章标题");
  process.exit(1);
}

const POSTS_DIR = path.join("src", "content", "posts");
const today = new Date().toISOString().slice(0, 10);

// 文件名安全的 slug：保留中英文与数字，空格转连字符
const slug =
  title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{Letter}\p{Number}-]/gu, "")
    .slice(0, 60) || "post";

const filename = `${today}-${slug}.md`;
const filePath = path.join(POSTS_DIR, filename);

const template = `---
title: "${title.replace(/"/g, '\\"')}"
summary: "一句话简介：说明这篇文章讲了什么、读者能拿到什么。"
pubDate: ${today}
tags: [未分类]
# draft: true 时只在本地可见；写完后改成 false 再推送即可发布
draft: true
---

正文从这里开始。支持 Markdown：

- 列表、**强调**、\`行内代码\`
- 代码块会自动高亮，右上角有复制按钮
- 图片写 \`![说明](./images/xxx.png)\`，**必须写 alt**，点击可放大

## 小标题

段落之间空一行。
`;

try {
  await access(filePath);
  console.error(`文件已存在，未做任何改动：${filePath}`);
  process.exit(1);
} catch {
  // 文件不存在 —— 正是我们要的情况
}

await mkdir(POSTS_DIR, { recursive: true });
await writeFile(filePath, template, "utf8");

console.log(`已创建 ${filePath}`);
console.log("下一步：写完内容，把 draft 改成 false，然后 git push。");
