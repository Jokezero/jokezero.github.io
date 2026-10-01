/**
 * 站点级单一配置源。
 *
 * 约定（见 docs/01-design-spec.md §3.3）：站点名、地址、导航、社交链接、
 * 功能开关只在这里出现一次，其他文件一律从这里读取，不得硬编码。
 */

export const SITE = {
  /** 站点名，同时用作 <title> 后缀与 OG 图署名。 */
  name: "zeroweb",
  /** 站点地址（用户站仓库 → 根路径，不需要 base）。 */
  url: "https://jokezero.github.io",
  /** 本站仓库（owner/name）：用于构建期抓取动态数据。 */
  repo: "Jokezero/jokezero.github.io",
  /** 站点语言。 */
  lang: "zh-CN",
  /**
   * 主题偏好的存储键。BaseLayout 的防闪烁内联脚本与 ThemeToggle 必须用同一个字符串；
   * 内联脚本为了保持极小体积（约 200 字节）写的是字面量，改这里时两处都要改。
   */
  themeStorageKey: "zeroweb-theme",

  /** 站点开始运行的时间：首页状态行的"运行 T+Nd"用它计算，换成你的上线日期即可。 */
  startDate: "2026-09-30",

  /**
   * 首页 Hero 文案。
   * 注意：这一段目前是**设计原型里的占位文案**（对应 03-open-questions.md 的 B12，
   * 还没确认）。改这里一处，首页与分享卡片都会跟着变。
   * `title` 里的 <br> 是换行符，标题会自动按行拆成单字做动效。
   */
  hero: {
    /** 首屏最上面那行小字：全站唯一的自我介绍开场白。 */
    kicker: "The personal website of an ordinary student",
    /** `<br>` 是换行；标题会按行拆成单字做切换动效。 */
    title: "欢迎登陆<br>zeroweb",
    lede: "个人博客？项目技术分享站？还没想好...",
    ctas: [
      { label: "读文章", href: "/blog/" },
      { label: "关于我", href: "/about/" },
    ],
    note: "背景：实时三体引力模拟（混沌解）",
  },
  /** 一句话描述：用于 <meta description>、RSS 与 OG。 */
  description: "个人网站 —— 技术长文、项目记录与长期维护日志。",

  author: {
    name: "Jokezero",
    github: "https://github.com/Jokezero",
    email: "",
  },

  /** 顶栏导航（P1 实现顶栏时读取）。 */
  nav: [
    { label: "首页", href: "/" },
    // 带结尾斜杠：与构建产物的目录式 URL 一致，避免每次点击都吃一次 301 跳转
    { label: "文章", href: "/blog/" },
    { label: "项目", href: "/projects/" },
    { label: "关于", href: "/about/" },
  ],

  /** 页脚 / 关于页的社交链接。 */
  social: [{ label: "GitHub", href: "https://github.com/Jokezero" }],

  /**
   * 页脚工具链接：**只放顶栏没有的入口**。
   * 早期版本把「文章 / 项目」也放了一份，于是每个页面底部都出现第二条导航条，
   * 与顶栏完全重复 —— 2026-09-30 已删除。
   *
   * 说明：RSS **刻意不放**在界面上（06-content-model.md §6 已确认）——
   * 只在 <head> 保留自动发现标记，读者把 /rss.xml 直接丢进阅读器即可。
   */
  footerLinks: [{ label: "全文搜索", href: "/search/" }],

  /**
   * 功能开关（docs/01-design-spec.md §3.3 的"保险丝"）。
   * 关掉某一项 = 对应脚本与第三方请求完全不加载。
   * P2 已落地搜索 / 评论 / 统计；P3 落地动效。
   */
  features: {
    /** P3：四套实时背景（三体 / 原子 / 线框球 / 双摆）已实现；改成 "static" 可一键退回纯黑。 */
    heroEffect: "canvas" as "static" | "canvas",
    /** 页面切换动效（幕布覆盖 + 标题逐字飞出）。 */
    pageTransition: true,
    /** 首次进入的字符绘制遮罩。 */
    introArt: true,
    commandPalette: false, // P3
    /** 评论：要先填好下面的 comments 配置（仓库开启 Discussions 才有 ID），否则不加载任何脚本。 */
    comments: false,
    /** 全文搜索：Pagefind，构建期生成索引，零第三方请求。 */
    search: true,
    /** 统计：要先填好下面的 analytics 配置。 */
    analytics: false,
  },

  /**
   * 评论区（giscus）。取 ID 的步骤：
   * 1. 仓库开启 Discussions：Settings → General → Features → Discussions
   * 2. 用 GitHub 账号登录 https://giscus.app ，填仓库名、选一个 Discussion 分类
   * 3. 把页面生成的 repo / repoId / category / categoryId 四项抄到这里
   * 4. 把 features.comments 改成 true
   * 四项缺任何一项 → 评论区不渲染、也不请求 giscus 的脚本。
   */
  comments: {
    repo: "",
    repoId: "",
    category: "Announcements",
    categoryId: "",
    /** 讨论与页面的映射方式：pathname = 一篇文章一个讨论。 */
    mapping: "pathname",
    reactionsEnabled: "1",
    inputPosition: "top",
  },

  /**
   * 访问统计（Cookie-less）。留空 provider 为 "none" 时不加载任何统计脚本。
   * - cloudflare：填 Cloudflare Web Analytics 的 site token
   * - umami：填 Umami 的 scriptUrl 与 websiteId
   */
  analytics: {
    provider: "none" as "none" | "cloudflare" | "umami",
    token: "",
    umami: {
      scriptUrl: "",
      websiteId: "",
    },
  },
} as const;
