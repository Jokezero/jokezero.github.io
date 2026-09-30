# zeroweb

个人网站：介于自我介绍与个人博客之间。纯静态、零后端、部署在 GitHub Pages。

**线上地址**：[https://jokezero.github.io/](https://jokezero.github.io/)

---

## 这个站由什么组成

| 层   | 选型                              | 说明                                                      |
| ---- | --------------------------------- | --------------------------------------------------------- |
| 框架 | Astro（全静态预渲染）+ TypeScript | 构建产物是纯 HTML/CSS/JS，没有服务端                      |
| 样式 | Tailwind v4 + 设计令牌            | 颜色/字号/间距集中在 `src/styles/tokens.css`              |
| 内容 | Markdown + 内容集合（zod 校验）   | 发文章 = 加一个 `.md` 文件，不碰代码                      |
| 视觉 | Canvas 2D 实时模拟                | 首页三体、文章页原子、项目页线框球、关于页双摆            |
| 搜索 | Pagefind                          | 构建期生成索引，零第三方请求                              |
| 评论 | giscus（默认关闭）                | 需要时填四个 ID 即可开启                                  |
| 门禁 | GitHub Actions                    | 部署 + 质量检查（类型 / 格式 / 体积 / 死链 / Lighthouse） |

**三条不可动摇的约束**：部署在 GitHub（无后端）、尽最大可能轻量、硬核科技感但不牺牲
可读性与性能。完整说明见 [`docs/`](./docs/README.md)。

---

## 快速开始

```bash
pnpm install     # 装依赖
pnpm dev         # 本地开发：http://localhost:4321
pnpm build       # 构建（含搜索索引）到 dist/
pnpm preview     # 预览构建结果
```

> 机器上还没有 Node 时：`nvm install --lts && nvm use --lts && corepack enable`。

## 日常四种任务

| 我想…             | 怎么做                                                                       |
| ----------------- | ---------------------------------------------------------------------------- |
| 发一篇文章        | `pnpm new:post 标题` → 写正文 → 把 `draft` 改成 `false` → `git push`         |
| 改文案 / 站点信息 | 改 `src/config/site.ts`（站点名、导航、首页 Hero、功能开关都在这里）         |
| 改视觉            | 改 `src/styles/tokens.css`（颜色/字号/间距）或对应组件；改完跑 `pnpm verify` |
| 上线              | `git push` 即可；Actions 自动构建并部署到 GitHub Pages                       |

**每一步的详细路径（含首次建仓库的点击位置）都在 [docs/README.md 的维护手册](./docs/README.md#维护手册四件事) 里。**

## 全部命令

```bash
pnpm dev          # 开发服务器
pnpm build        # 抓取 GitHub 数据 → 构建 → 生成搜索索引
pnpm preview      # 预览 dist/
pnpm check        # TypeScript / Astro 类型与内容校验
pnpm format       # 用 Prettier 格式化（docs/ 与 src/content/ 不动）
pnpm lint         # ESLint
pnpm size         # 体积预算（超出即失败）
pnpm links        # 内部死链检查
pnpm lhci         # Lighthouse CI（需要本机有 Chrome）
pnpm verify       # 一次跑完上面除 lhci 以外的全部门禁
pnpm new:post     # 新建一篇文章
pnpm data:github  # 手动刷新 src/data/github.json（需要 GITHUB_TOKEN）
```

## 目录说明

| 路径                 | 作用                                                                                                        |
| -------------------- | ----------------------------------------------------------------------------------------------------------- |
| `docs/`              | 设计与施工文档，**唯一事实来源**；`docs/adr/` 是技术决策记录                                                |
| `src/config/site.ts` | 站点级单一配置源：名称、地址、导航、Hero 文案、功能开关                                                     |
| `src/content/`       | 全部内容：`posts/`（文章）、`projects/`（项目）、`pages/`（关于页）                                         |
| `src/layouts/`       | 页面骨架：`BaseLayout`、`PostLayout`、`ProjectLayout`                                                       |
| `src/components/`    | `layout/`（顶栏页脚）、`ui/`（基础件）、`blog/`、`projects/`、`effects/`（动效）、`comments/`、`analytics/` |
| `src/pages/`         | 文件即路由                                                                                                  |
| `src/scripts/`       | 客户端脚本：`scene/`（四套背景模拟）、转场、进场、滚动特效                                                  |
| `src/styles/`        | `tokens.css`（设计令牌）、`global.css`、`motion.css`、`print.css`                                           |
| `public/`            | 原样拷贝到站点根目录的资源（字体、favicon）                                                                 |
| `scripts/`           | 构建辅助脚本：新建文章、抓取 GitHub 数据、死链检查                                                          |
| `.github/workflows/` | `deploy.yml`（部署 + 每日重建）、`quality.yml`（质量门禁）                                                  |

## 还需要站点主人做的事

1. **建仓库并推送**（`jokezero.github.io`，Pages Source 选 GitHub Actions）——
   六步见 [docs/02-build-and-deploy.md](./docs/02-build-and-deploy.md) §7.5。
2. **改写真实内容**：`src/content/pages/about.md` 与 `src/config/site.ts` 的 `hero`
   目前是占位文案。
3. **想要评论 / 统计**时再按 `src/config/site.ts` 里的注释填 ID。

## 页脚那串版本号怎么读

```
v2026.09.3.5 · Build 2026-09-30
 │   │  │ └── 当月第 5 次修复与维护
 │   │  └──── 当月第 3 次功能更新（feat 提交）
 │   └─────── 月份
 └─────────── 年份
```

由 git 历史自动算出，不需要手工维护；每月归零。规则与理由见
[docs/adr/0018](./docs/adr/0018-version-number-scheme.md)。

## 许可

个人站点，代码供参考；文章与图片版权归作者所有。
