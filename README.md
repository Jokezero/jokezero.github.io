# zeroweb

个人网站：介于自我介绍与个人博客之间，纯静态、部署在 GitHub Pages。

> 完整的设计规范与施工手册在 [`docs/`](./docs/README.md)。
> 本文件是入口速查版，P5 阶段会补齐维护细则。

## 当前阶段

P0（打通"提交 → 上线"链路）已就绪，等待首次推送与开启 Pages。

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
