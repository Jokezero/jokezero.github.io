# zeroweb

个人网站：介于自我介绍与个人博客之间，纯静态、部署在 GitHub Pages。

> 完整的设计规范与施工手册在 [`docs/`](./docs/README.md)。
> 本文件是入口速查版，P5 阶段会补齐维护细则。

## 当前阶段

P0（部署链路）、P1（设计系统与骨架）、P2（内容系统）、P3（招牌视觉）已就绪，
等待首次推送与开启 Pages。

## 写一篇新文章

```bash
pnpm new:post 文章标题      # 生成 src/content/posts/日期-标题.md，默认是草稿
```

写完把 frontmatter 里的 `draft: true` 改成 `false`，提交推送即可上线。
字段定义见 `src/content.config.ts`，字段语义见 `docs/06-content-model.md`。
项目条目同理：在 `src/content/projects/` 里加一个 `.md`。

## 本地命令

```bash
pnpm install      # 安装依赖
pnpm dev          # 本地开发服务器 http://localhost:4321
pnpm build        # 产出静态站点到 dist/
pnpm preview      # 预览 dist/ 的构建结果
pnpm check        # TypeScript / Astro 类型检查
```

## 目录说明

| 路径 | 作用 |
| --- | --- |
| `docs/` | 设计与施工文档（唯一事实来源），`docs/adr/` 是技术决策记录 |
| `src/config/site.ts` | 站点级单一配置源：站点名、地址、导航、功能开关 |
| `src/content/` | 全部内容（posts / projects / pages），新增内容只加文件 |
| `src/layouts/` | 页面骨架 |
| `src/pages/` | 文件即路由 |
| `src/styles/` | 全局样式与设计令牌 |
| `public/` | 原样拷贝到站点根目录的静态资源 |
| `.github/workflows/` | 部署与质量门禁 |
