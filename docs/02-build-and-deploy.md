# 个人网站 · 搭建与部署执行手册

## 0. 项目参数（已冻结 2026-09-29）

| 项 | 值 |
| --- | --- |
| 站点名 | **zeroweb** |
| GitHub 用户名 | **Jokezero** |
| 仓库名 / 站点地址 | `jokezero.github.io` → `https://jokezero.github.io/` |
| 自定义域名 | **不用**（保持 GitHub 默认地址） |
| 路线 | **A：纯静态**（无后端、无数据库） |
| 首版页面 | 首页、文章列表、文章详情、项目列表、项目详情、关于、404 |
| 内容 | Markdown + Content Collections；图片直接进仓库，构建期转 AVIF/WebP |
| 评论 | giscus，**文章详情页与项目详情页都放**，滚动到评论区才加载 |
| 搜索 / 统计 | Pagefind ／ Umami Cloud（支持外链点击事件；可随时更换） |
| 代码高亮 | Shiki，暗色 `dark-plus`、亮色 `light-plus`（＝ VS Code 默认） |
| 图片点击 | 全屏灯箱（原生脚本，左右切换 + Esc） |
| RSS | 输出**全文**，界面不放入口 |
| 部署操作 | **由站点主人亲自完成**（见 §7.5） |

---


> 读者：执行搭建的会话（人或 AI）。
> 配套文档：[01-design-spec.md](./01-design-spec.md)（设计与架构）、[03-open-questions.md](./03-open-questions.md)（待确认项）。
> 前置要求：`03-open-questions.md` 中的**必答项（B 组视觉方向 + A 组基础信息）**已确认。若尚未确认，先用推荐默认值推进 P0–P2，视觉相关工作在 P3 前必须确认。

---

## 0. 开工前检查清单

- [ ] 已确认站点名称、GitHub 用户名、仓库名、是否有自定义域名
- [ ] 已确认视觉方向（A/B/C/D 或其组合）与主色调
- [ ] 已确认首版页面范围（默认按 §2.3 的 P0 集合）
- [ ] 已确认是否启用：评论（giscus）、搜索（Pagefind）、统计（三选一）
- [ ] 已拿到所需账号权限：GitHub 仓库创建权、域名 DNS 管理权（如有）
- [ ] 本地环境可用（见 §1）

---

## 0.5 施工单（zeroweb 专用 · 最终版）

> 本节是**执行依据**；后面的 §1–§10 是通用背景资料与命令细节，冲突时以本节为准。
> 每阶段结束必须逐条勾完验收项，再做下一阶段。

### P0 · 打通"提交 → 上线"链路

**任务**：初始化 Astro 项目（TypeScript strict、Tailwind v4、内容集合、图片优化、RSS、Sitemap）；创建 `deploy.yml`（Actions 构建 → Pages 部署）；配置 `astro.config.mjs` 的 `site: "https://jokezero.github.io"`。

- [ ] 本地 `pnpm build` 能产出 `dist/`
- [ ] 推送后 Actions 变绿，线上能打开首页
- [ ] 控制台无 404 资源，页面标题为 `zeroweb`

### P1 · 设计系统与骨架

**任务**：把 `01-design-spec.md` §4.2 的令牌写成 `tokens.css` + Tailwind `@theme`；实现顶栏（含左上角标记可点回首页）、页脚（含版本戳）、主题切换、404；接入 `dark-plus` / `light-plus` 代码主题；落地字体策略（中文系统字体栈 + 拉丁等宽子集）。

- [ ] 所有页面共用同一骨架；键盘可遍历、焦点可见
- [ ] 暗/亮主题切换无闪烁且被记忆
- [ ] 正文对比度 ≥ 4.5:1；320px 宽无横向滚动

### P2 · 内容系统（"能发文章"的最小闭环）

**任务**：按 `06-content-model.md` 定义 `posts` / `projects` / `pages` 三套 schema（zod 校验）；实现文章列表（无标题列表 + 左侧索引栏：搜索 + **多选 OR 标签 + 命中数排序**）、文章详情（`07-layout-post-project.md` §1：TOC、代码块、引用、表格、图片灯箱、文末 giscus）、项目列表（网格 + 左侧控制栏：搜索 / 技术栈多选 / 页码 / 每页数量）、项目详情（§2 两栏 + 外链面板 + 图集灯箱）、关于（一屏一节 + 原生滚动吸附 + 分节导航）；Pagefind 搜索；RSS **全文**输出（界面不放入口，保留 `<head>` 自动发现）；`pnpm new:post` 模板脚本。

- [ ] 新增一个 `.md` → 推送 → 线上列表出现、可被搜索命中、RSS 可订阅
- [ ] 多标签筛选为 OR，且命中标签多的排前面（文章页与项目页一致）
- [ ] 项目页外链为 `target="_blank"` + `rel="noopener noreferrer"`
- [ ] 空列表显示"暂无文章喵～正在努力学习""暂无项目喵～正在努力学习"
- [ ] 关掉 `features.comments` 后，评论区不加载任何第三方脚本

### P3 · 招牌视觉

**任务**：按 `01-design-spec.md` §4.4/§4.5 实现 Tier A 全套；四套背景（三体 / 原子 / 线框球 / 双摆）——**同页只放一个主体、低亮度、可降级**；页面切换（幕布连续下扫 + 标题逐字飞出，换页时重置滚动、切换期间屏蔽页内翻页）；滚动特效（进度线 / 文案淡出 / 背景视差）；鼠标视差；首次加载的字符绘制（独立遮罩，**不用幕布**）。

- [ ] 低端机/省流量/`prefers-reduced-motion` 下自动降级，无控制台报错
- [ ] 首屏 JS ≤ 40 KB（不含懒加载 chunk）；Lighthouse 首页性能 ≥ 90
- [ ] 无 JS 时全站仍可完整阅读

### P4 · 质量门禁

**任务**：`quality.yml`（`astro check` + Lint + `size-limit` + Lighthouse CI + 内链死链 + axe）；按 `01-design-spec.md` §4.6.3 的尺寸矩阵逐页走查（320/360/390/768/834/1024/1280/1440/1920）。

- [ ] CI 全绿；故意超出体积预算会让构建失败
- [ ] 尺寸矩阵全部通过：无横向滚动、文字不裁切、背景铺满、导航可达
- [ ] 文章页打印样式可用

### P5 · 维护机制

**任务**：补齐 `docs/` 与 `adr/`；写 `README.md`（本地开发 / 发文流程 / 部署方式 / 目录说明）；每日定时重建（刷新 GitHub 动态数据）；开启 Dependabot。

- [ ] 一个不熟悉项目的人只读 `docs/README.md`，就能完成"本地启动 / 发一篇文章 / 改一次视觉 / 部署一次"

---

## 1. 本地环境

当前机器**没有全局安装 Node**。两种方式任选：

**方式 A（推荐，长期使用）**：安装 nvm 并装 Node LTS

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
nvm install --lts && nvm use --lts
corepack enable && corepack prepare pnpm@latest --activate
```

**方式 B（无网络安装时）**：使用 Codex 桌面版自带的运行时

```bash
export SITE_NODE="/home/xzero/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin"
export SITE_PNPM="/home/xzero/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback/pnpm"
export PATH="$SITE_NODE:$PATH"     # 注意：不要覆盖或复用 $HOME
node -v && "$SITE_PNPM" -v
```

仓库内建议加 `.nvmrc`（内容 `lts/*`）与 `package.json` 的 `engines.node`，保证半年后回来还能构建。

---

## 2. 阶段 P0：打通"提交 → 上线"链路

**目标**：在写任何设计之前，先证明部署链路是通的。这一步能避免"做完才发现部署不通"的最坏情况。

### 2.1 初始化项目

```bash
cd /home/xzero/桌面/web/weblog
pnpm create astro@latest . --template minimal --typescript strict --install --git --no-commit
```

随后安装核心依赖（按需增减，遵循"依赖最小化"原则）：

```bash
pnpm add -D tailwindcss @tailwindcss/vite @astrojs/check typescript \
  @astrojs/rss @astrojs/sitemap @astrojs/mdx sharp astro-og-canvas \
  pagefind size-limit @size-limit/file @lhci/cli
```

> 若某个包在搭建时不可用或不再需要，**记录一条 ADR 并选择替代方案**，不要静默跳过。

### 2.2 配置 `astro.config.mjs` 关键项

```js
export default defineConfig({
  site: "https://<正式域名或 <user>.github.io>",
  // base: "/<repo>/",   // 仅当使用 project site（非 <user>.github.io 仓库）时才需要
  output: "static",
  integrations: [mdx(), sitemap()],
  vite: { plugins: [tailwindcss()] },
  markdown: { shikiConfig: { theme: "<与设计令牌匹配的暗色主题>", wrap: false } },
  image: { /* 按需 */ },
});
```

**关键陷阱**：如果仓库名不是 `<user>.github.io`，站点会挂在子路径下，所有绝对路径资源都会 404。要么使用用户站仓库，要么全局使用相对路径 + 正确设置 `base`。**强烈建议使用 `<user>.github.io` 仓库或自定义域名**。

### 2.3 GitHub 仓库与 Pages

1. 在 GitHub 创建仓库（用户站：`<user>.github.io`；否则为普通仓库 + 自定义域名）。
2. 仓库 → Settings → Pages → Source 选择 **GitHub Actions**（不要用 `gh-pages` 分支）。
3. 添加 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to GitHub Pages
on:
  push: { branches: [main] }
  workflow_dispatch:
permissions: { contents: read, pages: write, id-token: write }
concurrency: { group: pages, cancel-in-progress: true }
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: { name: github-pages, url: "${{ steps.deployment.outputs.page_url }}" }
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

4. 推送到 `main`，确认线上出现页面。

**P0 验收**：线上能打开站点；浏览器控制台无 404 资源；再次推送会在 Actions 里触发新一轮部署。

---

## 3. 阶段 P1：设计系统与骨架

1. 建立 `src/styles/tokens.css`，把 `01-design-spec.md §4.2` 的令牌表全部实现为 CSS 变量，并通过 Tailwind v4 `@theme` 映射。
2. 在 `src/config/site.ts` 写入站点级配置（名称、描述、URL、导航、社交链接、`features` 开关）。
3. 实现 `BaseLayout.astro`：`<head>` 元信息、关键 CSS 内联、字体 preload、主题初始化脚本（**内联、防闪烁**，约 200 字节）。
4. 实现全局组件：`Header`（含移动端菜单）、`Footer`、`ThemeToggle`、`Container`、`Button`、`Card`、`Tag`、`Prose`。
5. 实现 `404.astro`。
6. 字体：按 §4.3 落地——拉丁等宽字体自托管（子集化 woff2），中文走系统栈。

**P1 验收**：所有页面共用同一骨架；Tab 键可遍历全部交互元素且焦点可见；暗/亮主题切换无闪烁且被记忆；移动端与桌面端无布局破损；正文对比度 ≥ 4.5:1。

---

## 4. 阶段 P2：内容系统

1. 定义 `src/content.config.ts`（Astro 5 风格），为 `posts` / `projects` / `pages` 定义 zod schema（字段见 §3.2）。
2. 实现 `/blog` 列表：卡片、按年分组、标签筛选、分页或"加载更多"（优先静态分页，避免额外 JS）。
3. 实现 `/blog/[slug]`：`PostLayout` + 自动 TOC（构建期生成）+ 阅读时长 + 上下篇 + 相关文章 + 代码块复制按钮（渐进增强，无 JS 也能读）。
4. 实现 `/tags/[tag]`、`/projects`、`/about`。
5. 输出 `rss.xml`、`sitemap`、`robots.txt`。
6. 接入 Pagefind：构建后索引 `dist/`，搜索 UI 作为懒加载岛屿（`client:visible`）。
7. OG 图：为每篇文章构建期生成 1200×630 图片。
8. 写 `scripts/new-post.mjs` + `package.json` 的 `"new:post"` 脚本。
9. 接入 giscus（`client:visible`，主题跟随站点主题）与统计脚本（延迟加载、`features` 开关控制）。

**P2 验收**：新增一个 Markdown → 推送 → 线上列表出现、可被搜索命中、RSS 可订阅、OG 图正确；`features` 里关掉评论后评论区不加载任何第三方脚本。

---

## 5. 阶段 P3：招牌视觉（炫技落点）

按 `01-design-spec.md §4.4` 的 Tier 分级实现，顺序很重要：先做零成本 Tier A，再上 Tier B。

1. **Tier A**：极淡的几何网格背景、发丝分隔线、链接下划线动效、焦点环、悬停时的线条明暗变化。全部纯 CSS，保持纯黑底 + 单色线。
2. **Tier B（Hero）**：
   - `src/scripts/hero-lines.ts`：Canvas 2D 线条动画，纯 JS 计算，**不引入任何图形库**（形态见 `01-design-spec.md` §4.5 的 E1–E5）。
   - 加载时机：首屏内容渲染后 `requestIdleCallback` + 动态 `import()`。
   - 能力检测与降级：`reduced-motion`、`saveData`、2g/3g、无 Canvas 2D、持续低帧率、小屏 → 降低线数/粒子数或渲染静态帧；`visibilitychange` → 暂停循环。
   - 尺寸自适应：用 `ResizeObserver` 监听画布容器，`devicePixelRatio` 上限 2（移动端 1.5）。
   - 画布 `aria-hidden="true"`，并提供 `sr-only` 的等价文字描述；无 JS 时页面为纯黑底 + 完整文字内容，不留空白。
3. **交互层**：命令面板（`⌘K`，避免引入 UI 框架）、极简导航细节、状态栏（构建时间/版本/本地时间）、页面过渡（View Transitions 可用则启用，不可用则普通跳转）。
4. **Tier C 彩蛋**（可选，愿做则做）：另一套线条动画形态作为隐藏页/滚动触发的"技术力爆发"、ASCII 动画、音效（默认静音，需用户显式开启）。

**P3 验收**：低端机/省流量/reduced-motion 下自动使用静态版且无控制台报错；首屏 JS 仍在 40 KB 预算内（不含懒加载 chunk）；首页 Lighthouse 性能 ≥ 90；无 JS 时全站仍可完整阅读。

---

## 6. 阶段 P4：质量门禁

1. 添加 `.github/workflows/quality.yml`：`astro check`、Lint、`size-limit`、Lighthouse CI（首页/列表/详情三个 URL）、内部死链检查、axe 扫描。
2. 添加 `lighthouserc.json` 与 `size-limit` 配置，阈值直接取设计规范 §6.1 的数字。
3. 浏览器与真机抽查：Chrome、Safari（iOS）、Firefox、Edge；至少一台中端 Android 真机。
4. 补打印样式（文章页）。
5. **响应式走查**：按 `01-design-spec.md` §4.6.3 的尺寸矩阵，逐个页面确认无横向滚动、文字不裁切、背景铺满、导航可达；手机端确认"一屏一节"用 `dvh` 而不是 `vh`。

**P4 验收**：CI 全绿；超出性能预算会导致构建失败（可以故意改坏一次验证门禁真的生效）；§4.6.3 尺寸矩阵全部通过。

---

## 7. 阶段 P5：维护机制

1. 补齐 `docs/`：本套文档 + `docs/adr/0001-*.md` 等决策记录。
2. `README.md` 写清：项目简介、本地开发命令、如何发文、部署方式、目录说明。
3. 添加 `scheduled-refresh.yml`（每日定时重建：刷新 GitHub 动态数据 + 发布到期的计划文章）。
4. 开启 Dependabot（npm + GitHub Actions，每周）。
5. 在文档里写好维护日历（§10.4）。

**P5 验收**：一个不熟悉项目的人（或另一个 AI 会话）只读 `docs/README.md` 就能完成：本地启动、发一篇新文章、做一次视觉微调、完成一次部署。

---

## 8. 自定义域名（可选）

## 7.5 部署操作：由你亲自完成

**分工约定**：搭建会话只负责把代码写好、配置好、在本地跑通；**推送与上线由你亲自操作**。届时按下面几步做（交付时会再给一份针对当时状态的实操作业）：

1. 在 GitHub 网页上新建仓库（建议命名 `<你的用户名>.github.io`，这样地址是根路径，不会出现子目录 404）。
2. 仓库 → Settings → Pages → **Source 选 `GitHub Actions`**（不要选 gh-pages 分支）。
3. 本地配置远程并推送：`git remote add origin <仓库地址>` → `git push -u origin main`。
4. 打开仓库 **Actions** 页，看第一次构建是否变绿；绿色即已部署。
5. 访问 `https://<用户名>.github.io/` 验证；若配域名，再到 Settings → Pages 填写域名并开启 HTTPS。
6. 以后更新内容 = 改文件 → 提交 → 推送，**不需要再做任何部署操作**。

> 需要你提供的只有三样：**仓库地址、站点名、是否使用自定义域名**。

1. 仓库 Settings → Pages → Custom domain 填入域名，GitHub 会在 `dist/` 期望 `CNAME` 文件——**在 `public/CNAME` 中提交域名**，避免每次部署丢失。
2. DNS：`A` 记录指向 GitHub Pages 的四个 IP，或 `CNAME` 指向 `<user>.github.io`（子域名用 CNAME 更简单）。
3. 开启 Enforce HTTPS。
4. 域名确定后更新 `astro.config.mjs` 的 `site`，否则 sitemap 与 OG 图链接会错。

---

## 9. 上线检查清单

- [ ] `docs/03-open-questions.md` 中的必答项已全部落地
- [ ] 首页、关于、文章列表、文章详情、项目、标签、404 均正常
- [ ] 移动端真机检查通过（导航、代码块横向滚动、字体渲染）
- [ ] 键盘走查通过；屏幕阅读器快速走查通过（标题层级、landmark、图片 alt）
- [ ] Lighthouse 四项 ≥ 95（首页含动效 ≥ 90）且已记录基线截图/数字
- [ ] RSS 可订阅；sitemap 可访问；OG 图在社交平台预览正常
- [ ] 关闭 JS 后仍可阅读全部内容与导航
- [ ] 统计与评论已生效且未产生 Cookie 横幅需求
- [ ] `README.md` 与 `docs/` 已更新到与实现一致
- [ ] 已记录性能与体积基线，供未来对比

---

## 10. 常见坑（前人踩过的）

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| **页面只有静态 HTML，动画、交互、转场全部失效** | 脚本初始化阶段抛异常，导致整个 IIFE 中断：后面的 `resize()` 没执行（画布尺寸为 0）、`requestAnimationFrame` 也没启动。最常见原因是**变量声明顺序**——先执行的代码引用了在后面才赋值的 `var`（`var` 只提升声明、不提升赋值，读到的是 `undefined`） | 打开控制台看第一条报错并修正顺序；**每次改动脚本后都要做一次初始化冒烟测试**（至少覆盖"初始化 + 渲染一帧"）再交付 |
| **顶栏 / 列表 / 页脚被背景盖住** | 背景层用了 `position: fixed; z-index: 0`，而内容容器是普通流（未定位）——按绘制顺序，定位元素高于静态块级内容，于是背景画在了内容之上 | 给内容容器加 `position: relative; z-index: 2`；或让背景画布待在页面容器内部（`position: absolute`），靠容器的层叠上下文隔开 |
| **页面切换后标题/文案像是消失了** | 首屏文案的 `opacity` 由滚动进度变量（`--sp`）驱动。切换页面时不重置滚动位置，从长页面切回短页面时该变量仍是大值，文案就停在淡出状态 | 在幕布完全覆盖的那一帧执行 `window.scrollTo(0, 0)`，并立刻重算滚动变量；页面切换一律从顶部开始 |
| **一次点击却看到切换动效播了两遍** | ① 幕布"覆盖"与"揭开"之间有停顿，两段各自慢起慢停，被看成两次动作；② 触控板惯性滚动在切换途中又触发了一次页内翻页 | ① 两段首尾相接 + 互补缓动（快入慢停 / 慢起快走），中间不留停顿；② 所有滚轮翻页处理函数在切换进行中直接返回 |
| 部署后样式/图片全 404 | project site 子路径 + 绝对路径 | 用用户站仓库或设 `base` + 相对路径 |
| 每次部署自定义域名失效 | 缺少 `public/CNAME` | 提交 `CNAME` 文件 |
| Actions 成功但线上没变化 | Pages Source 未设为 GitHub Actions | 改设置 |
| 首屏字体闪烁或布局跳动 | 字体未 preload / 无 `size-adjust` | preload + `font-display: swap` + 回退字体度量对齐 |
| 中文站点首屏慢 | 自托管全量中文字体 | 中文改系统字体栈 |
| Lighthouse 本地分高、线上分低 | Pages 缓存/CDN、真实网络差异 | 以线上为准，用真机与 CI 数据复核 |
| 动效在 iOS 卡顿 | 动画属性触发重排 / GPU 过载 | 只用 transform/opacity，限制 DPR |
| 半年后 `pnpm build` 失败 | 锁定版本缺失、依赖腐化 | 锁版本 + 每季度本地完整构建一次 |
