# 0012 · 评论与统计默认关闭，配置留空即不加载

状态：已采纳（2026-09-30，P2）

## 背景

P2 的验收项之一是：**关掉 `features.comments` 后，评论区不加载任何第三方脚本**。
而 giscus 需要四项 ID（repo / repoId / category / categoryId），这些 ID 只有在
GitHub 仓库建好、Discussions 打开之后才能拿到 —— 目前还没有。统计服务同理
（`03-open-questions.md` C 组尚未拍板）。

## 决策

- `features.comments` 与 `features.analytics` **默认 false**；
  `src/config/site.ts` 里 giscus 的四项 ID、统计 token 全部留空。
- 组件采用**双保险**，任何一项缺失都等于"不存在"：
  1. 构建期：开关关闭或 ID 不全 → 组件不渲染容器，页面上连一行 HTML 都没有；
  2. 运行期：脚本先找容器，找不到直接返回；giscus 的 `<script>` 只在
     "容器进入视口前 300px"时才创建（即滚动到评论区才加载）。
- 实测（P2 验收）：文章详情页 HTML 里不存在任何 `<script src="https://…">`。
- 以后要开评论，只改两处：`features.comments: true` + 把四个 ID 抄进 `comments`。

## 影响

- 站点现在完全没有第三方脚本，隐私与体积都是最干净的状态。
- 统计同理：填 `provider` 与 token 后自动生效（Cloudflare 或 Umami 二选一）。
- 代价：在拿到 ID 之前，文章页与项目页没有评论区，这是刻意的。
