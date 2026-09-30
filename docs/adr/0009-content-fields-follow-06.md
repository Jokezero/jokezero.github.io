# 0009 · 内容字段以 `06-content-model.md` 为准

状态：已采纳（2026-09-30，P2）

## 背景

两份文档都写了文章字段，但不完全一致：

- `01-design-spec.md` §3.2 的草案：`description` / `tags` / `series` / `lang` / `featured` / `comments`
- `06-content-model.md` §2、§3 的定稿：`summary` / `tags` / `cover` / `draft`（项目另有 `date` / `repo` / `video` / `links`）

两者都标着 2026-09-29，但 `06` 是专门讲内容模型、且写在后面的那一份。

## 决策

**以 `06-content-model.md` 为准**，`src/content.config.ts` 按它实现：

| 集合 | 字段 |
| --- | --- |
| `posts` | `title`、`summary`、`pubDate`、`updatedDate?`、`tags`（至少 1 个）、`cover?`、`draft`、`featured`、`comments` |
| `projects` | `title`、`summary`、`tags`（至少 1 个）、`date`（`"2025.10"` 形式）、`cover?`、`repo?`、`video?`、`links?`、`featured`、`draft` |
| `pages` | `title`、`summary`、`updatedDate?`，以及 about 用的结构化字段 `intro` / `experience` / `skills` / `contacts` |

补充说明：

- `tags` 在 06 里是**必填**，所以 schema 用 `.min(1)`：漏写标签的文章会在构建期直接失败。
- 06 明确"不做计划发布"，因此**没有**按 `pubDate` 过滤未来日期的逻辑（早期草案里有，已移除）。
- 保留 `featured`（首页精选，P3 用）与 `comments`（单篇关评论）——它们是加法，不影响 06 的语义。
- `projects` 额外加了 `draft`，理由与文章一致：半成品不该被推到线上。
