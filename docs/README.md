# 个人网站 · 项目文档

这是一个长期维护的个人网站项目（介于自我介绍与个人博客之间），部署在 GitHub Pages，主打**轻量、快速、硬核科技感**。

本目录是设计与施工的唯一事实来源。任何接手这个项目的会话（人或 AI），都请**按顺序阅读**。

---

## 文档索引

> **只想知道怎么干活？** 跳到 [维护手册（四件事）](#维护手册四件事) —— 那里有四条可复制的
> 操作路径：本地启动、发一篇文章、改一次视觉、部署一次。下面的索引是"遇到具体问题该翻哪一份"。

| 文档 | 内容 | 读者 | 何时读 |
| --- | --- | --- | --- |
| [01-design-spec.md](./01-design-spec.md) | 定位、目标、信息架构、内容模型、视觉与交互语言、技术架构、性能预算、可访问性、SEO、维护机制、风险、里程碑 | 所有参与者 | 开工前通读 |
| [02-build-and-deploy.md](./02-build-and-deploy.md) | 分阶段施工单（P0→P5）、命令、配置要点、部署流程、域名、上线检查、常见坑 | 执行搭建的会话 | 每做一个阶段前 |
| [03-open-questions.md](./03-open-questions.md) | 待确认决策清单，每项附推荐默认值 | 站点主人 | 修改方向前 |
| [04-reference-motion-study.md](./04-reference-motion-study.md) | 三个参考站的动效实测报告：jiejoe / wodniack / cosmicbroth 的转场与进场实现细节、共同规律，以及本站 **E9 页面切换动效** 的定稿依据 | 执行搭建的会话 | 实现转场前必读 |
| [05-backend-plan.md](./05-backend-plan.md) | **后端 / 数据层设计**：三条路线（纯静态 / 静态+云函数 / 自建服务）、每项能力的落地方案、安全与密钥规则、11 条待确认决策 | 确认数据层方向时 | 开始后端设计时先读 |
| [07-layout-post-project.md](./07-layout-post-project.md) | **正文页与项目详情页的排版规范**：版式、字体层级、代码块/图片/引用/表格处理、TOC 与文末结构，以及 8 条待确认技术细节 | 实现详情页时 | 写这两页前必读 |
| [06-content-model.md](./06-content-model.md) | **内容模型**：安全模型与评论方案、文章与项目的字段规范、图片与外链处理、**多标签筛选语义** | 写内容或实现内容管道时 | 定义字段前必读 |
| [preview/prototype.html](./preview/prototype.html) | **当前视觉基准原型（最终形态）**：**首页背景 = 三体运动**（混沌引力模拟）、**文章页 = 原子结构**、**项目页 = 线框球**、**关于页 = 双摆**——均为整页背景，共用同一套单色细线规范。**文章页**：无标题竖直列表 + 左侧索引栏（搜索 + 标签）。**项目页**：无按钮、左侧控制栏（搜索 / 技术栈 / 页码 / 每页数量）+ 分页网格，**滚轮在页内任意位置翻页**。**关于页**：无按钮、**一屏一节**（首屏＝标题，之后简介/经历/技能/联系各占一屏），切换交给浏览器原生滚动吸附，顶部分节导航 + 右下角 `NN / 04` 计数（标题屏隐藏）；空状态为"暂无文章喵～正在努力学习""暂无项目喵～正在努力学习" | 所有参与者 | 讨论视觉与排版时以此为准 |
| [preview/archive/line-animation-preview.html](./preview/archive/line-animation-preview.html) | 早先的动效探索版：五种线条动画形态对比（自绘几何线 / 波动线场 / 连线网络 / 流动线束 / 三维线框） | 需要挑选其他动效形态时 | 选型参考 |
| [adr/](./adr/README.md) | **技术决策记录**：文档没写死但必须做选择的地方（脚手架方式、工具链锁版本、依赖选版、P0 边界等） | 所有参与者 | 改动方向或升级依赖前 |

`adr/` 自 P0 起已开始记录。

打开方式：用浏览器直接打开 `docs/preview/prototype.html`（纯本地文件，不联网、无依赖）。点击顶部导航或左侧按钮即可看到页面切换动效。这些预览是设计讨论的参照物，**不是最终实现**——搭建时按 `01-design-spec.md` §4.5 选定的形态，重写为可维护的 Astro 组件。

---

## 当前状态

| 阶段 | 状态 |
| --- | --- |
| **前端设计** | ✅ **已结束（2026-09-29）**，成果见 `preview/prototype.html`，规范见 `01-design-spec.md` §4 |
| 后端 / 数据层设计 | 🟡 进行中，见 [05-backend-plan.md](./05-backend-plan.md)，等待 G1 路线决策 |
| P0 部署链路打通 | 🟡 代码与配置已就绪（本地 `pnpm build` 通过、资源全部 200），等待站点主人建仓库、推送、开启 Pages |
| P1 设计系统与骨架 | ✅ 已完成（设计令牌、顶栏 / 页脚、主题切换、404、字体策略），本地实测通过 |
| P2 内容系统 | 🟡 代码与配置已就绪（文章 / 项目 / 标签 / 关于 / 搜索 / RSS 全文 / new:post 脚本），用示例内容实测通过；评论与统计等拿到 ID 后开启 |
| P3 招牌视觉 | 🟡 代码与配置已就绪（四套实时背景、页面切换幕布 + 逐字、滚动特效、鼠标视差、进场字符绘制、完整降级链路），本地实测通过；`prefers-reduced-motion` 与省流量两条降级待真机确认 |
| P4 质量门禁 | 🟡 已就绪（quality.yml：astro check / Prettier / ESLint / size-limit / 死链 / Lighthouse CI；打印样式；63 项尺寸矩阵走查通过），Lighthouse 跑分与真机抽查需在 CI 与真机上完成 |
| P5 维护机制 | 🟡 已就绪（README + 本文件的维护手册与维护日历、每日定时重建、Dependabot） |

### 还需要站点主人完成的事

| 事项 | 怎么做 | 什么时候 |
| --- | --- | --- |
| 建仓库并推送 | 见 [02-build-and-deploy.md](./02-build-and-deploy.md) §7.5 的六步 | 越早越好，推送后部署链路才算真的跑通 |
| 开启评论 | 仓库开 Discussions → 去 giscus.app 取四个 ID → 填进 `src/config/site.ts` → `features.comments: true` | 想要评论时 |
| 开启统计 | 填 `analytics` 的 provider 与 token | 想统计时 |
| 改写真实内容 | `src/content/pages/about.md`（关于页）与 `src/config/site.ts` 的 `hero`（首页文案） | 上线前 |
| 真机抽查 | iOS Safari / Firefox / 中端 Android 各走一遍（转场流畅度、背景帧率、打印预览） | 上线后一周内 |

---

## 三条不可动摇的约束

1. **部署在 GitHub**（静态托管，无后端服务）。
2. **尽最大可能轻量**，首屏要快；动效必须能降级，绝不能拖慢加载。
3. **硬核科技感、有炫技成分**，但不得以牺牲可读性、可访问性与性能为代价。

外加一条长期约束：**必须能被长期维护**——依赖尽量少、内容与代码分离、关键决策有记录、质量有自动化门禁。

---

## 维护手册（四件事）

> 这一节就是"一个人只读 `docs/README.md` 也能把站维护下去"的那部分。每一步都可以照着复制。
> 想知道某一步背后的原因，再翻上面索引里的具体文档。

### 1. 本地启动

```bash
# 第一次（机器上还没有 Node 时）：装 Node LTS 与 pnpm
nvm install --lts && nvm use --lts && corepack enable && corepack prepare pnpm@latest --activate

# 每次开工
cd ~/桌面/web/weblog
pnpm install          # 装依赖（第一次要一两分钟）
pnpm dev              # 打开 http://localhost:4321
```

本地开发时搜索页不可用是正常的：全文搜索索引只在 `pnpm build` 时生成。

### 2. 发一篇文章

```bash
pnpm new:post 我的文章标题        # 生成 src/content/posts/2026-09-30-我的文章标题.md
```

打开这个文件写正文，并确认开头的 frontmatter：

```yaml
---
title: "我的文章标题"
summary: "一句话简介：出现在列表行、RSS 与分享卡片上。"
pubDate: 2026-09-30
tags: [astro, 性能]        # 至少一个；列表页的标签筛选就靠它
draft: false               # 写完了改成 false，否则线上不出现
---
```

```bash
pnpm build                 # 本地先确认能构建（会顺带生成搜索索引）
git add -A && git commit -m "post: 我的文章标题" && git push
```

推送后约一分钟线上就能看到。文章图片放在 `src/content/posts/images/` 下，用
`![说明](./images/xxx.png)` 引用；**alt 必填**，构建期会自动压缩成多尺寸。
项目条目同理：在 `src/content/projects/` 加一个 `.md`（字段见 `src/content.config.ts`）。

### 3. 改一次视觉

| 想改什么 | 改哪里 |
| --- | --- |
| 颜色、灰度、字号阶梯、间距、动效时长 | `src/styles/tokens.css`（对照 `01-design-spec.md` §4.2 的令牌表） |
| 首页文案（kicker / 大标题 / 说明 / 按钮 / 背景说明） | `src/config/site.ts` 的 `hero` |
| 站点名、描述、导航、社交链接、功能开关 | `src/config/site.ts` |
| 顶栏、页脚 | `src/components/layout/` |
| 列表页 / 关于页 / 详情页版式 | `src/components/blog/`、`src/components/projects/`、`src/layouts/` |
| 背景动效本身（每个模拟一个文件） | `src/scripts/scene/*.ts` |

三个"保险丝"——改一个值就回退，不用动逻辑：

```ts
features.heroEffect = "static";   // 关掉四套实时背景，回到纯黑
features.pageTransition = false;  // 关掉页面切换幕布
features.introArt = false;        // 关掉首次进入的字符绘制
```

改完先过一遍门禁再推：

```bash
pnpm verify        # 类型 + 格式 + Lint + 构建 + 体积预算 + 死链
```

**不要引入**：玻璃拟态、彩色渐变、投影、发光边框、等宽 0/1 字符场、横贯画面的波动线、
跟随光标的制图十字（都在 §4.5 的排除清单里，试过并被否决）。

### 4. 部署一次

- **日常**：`git push` 就够了 —— `deploy.yml` 自动构建并部署，不需要任何手工操作。
- **手动重跑**：仓库 → Actions → 选 `Deploy to GitHub Pages` → Run workflow。
- **首次上线（六步，照着做即可）**：
  1. 打开 <https://github.com/new>，Owner 选 `Jokezero`，Repository name 填
     `jokezero.github.io`（一字不差），选 **Public**；
     README / .gitignore / license **三个都不要勾**，否则第一次推送会冲突 → Create repository
  2. 新仓库 → **Settings** → 左侧 **Pages** → **Build and deployment** 的 Source
     选 **GitHub Actions**（不要选 Deploy from a branch）
  3. 本地执行：`git remote add origin https://github.com/Jokezero/jokezero.github.io.git`
  4. `git push -u origin main`（要密码时用 Personal Access Token，或用 SSH 地址）
  5. 仓库 → **Actions**：看到 `Deploy to GitHub Pages` 变绿即部署完成
  6. 打开 <https://jokezero.github.io/> 确认首页能打开、控制台无 404

  更细的字段说明见 [02-build-and-deploy.md](./02-build-and-deploy.md) §7.5。
- **回滚**：Actions 页找到上一次成功的运行 → Re-run all jobs；或本地 `git revert` 后推送。
- **每日自动重建**：`deploy.yml` 里带一条定时任务（北京时间 11:10），用于刷新构建期抓取的
  GitHub 数据（star 数、最近提交）与页脚构建戳。

### 维护日历

| 频率 | 做什么 |
| --- | --- |
| 每次改完 | `pnpm verify`（或等 PR 上的 `quality.yml` 变绿）再合并 |
| 每周一 | 处理 Dependabot 的依赖 / Actions 更新 PR：**确认 quality 全绿**再合并 |
| 每周 | 至少写一篇文章或做一次小的视觉微调 —— 让"长期维护中"这条信号保持真实 |
| 每月 | 扫一眼 CI 里的 Lighthouse 报告与体积数据（基线记在 `docs/adr/0016`） |
| 每季度 | 本地完整跑一次 `pnpm verify`；升级依赖时**先本地跑通再推**，并补一条 ADR |
| 每年 | 检查域名与 HTTPS、清理不再使用的依赖、把文档改成与实现一致 |

### 页脚的版本号（不用管，但知道怎么读）

`v2026.09.3.5 · Build 2026-09-30` = 2026 年 9 月的第 3 次功能更新、第 5 次修复与维护
（当月计数、每月归零）。它由 git 历史自动算出，**你什么都不用做**；
只有 `Build` 日期会随每日定时重建变化。规则见 [adr/0018](./adr/0018-version-number-scheme.md)。

### 遇到文档没写到的取舍

先按 `03-open-questions.md` 里的**推荐默认值**做，然后**补一条 ADR**（`docs/adr/` 续号），
写清背景、决策与影响。改主意时不要修改历史记录，新写一条并标注"取代 00XX"。

---

## 一句话技术画像

> Astro 5（全静态预渲染）+ TypeScript + Tailwind v4 + Markdown/MDX 内容集合 + 纯黑极简视觉 + Canvas 2D 代码绘制的线条动画（延迟加载、可降级）+ Pagefind 搜索 + giscus 评论 + GitHub Actions 部署到 GitHub Pages。

更细的取舍理由见 [01-design-spec.md](./01-design-spec.md) §5。

---

## 如何启动搭建会话

新开一个会话，把下面这段原样发给它（只需替换仓库地址）：

```text
请按仓库里的文档，从 P0 阶段开始搭建这个个人网站。

先读这三个文件，读完再动手：
- docs/README.md          （索引与当前状态）
- docs/02-build-and-deploy.md §0 与 §0.5（已冻结的项目参数 + 分阶段施工单与验收标准）
- docs/01-design-spec.md  §4（视觉与交互规范）

约束：
1. 站点名 zeroweb，GitHub 用户名 Jokezero，仓库 jokezero.github.io，
   站点地址 https://jokezero.github.io/，暂不使用自定义域名。
2. 只做 P0，做完停下来把验收清单逐条报给我，等我说继续再做 P1。
3. 部署操作由我自己完成；你只负责把仓库和配置准备好、在本地跑通。
   需要我操作时（建仓库、推送、开 Pages）请单独给我一份步骤说明。
4. 遇到文档没写到的取舍，先按文档里的"推荐默认值"做，并把决定记进 docs/adr/。
```

> 视觉参照物：`docs/preview/prototype.html`（四页俱全的原型）与 `docs/preview/pages-preview.html`（正文页 / 项目详情页排版样张）。
> 注意 §4.5.4 里标注为"遗留规则"的样式**不要移植**。
