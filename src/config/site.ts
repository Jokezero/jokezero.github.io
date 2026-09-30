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
  /** 站点语言。 */
  lang: "zh-CN",
  /**
   * 主题偏好的存储键。BaseLayout 的防闪烁内联脚本与 ThemeToggle 必须用同一个字符串；
   * 内联脚本为了保持极小体积（约 200 字节）写的是字面量，改这里时两处都要改。
   */
  themeStorageKey: "zeroweb-theme",
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
    { label: "文章", href: "/blog" },
    { label: "项目", href: "/projects" },
    { label: "关于", href: "/about" },
  ],

  /** 页脚 / 关于页的社交链接（P1 起使用）。 */
  social: [
    { label: "GitHub", href: "https://github.com/Jokezero" },
    { label: "RSS", href: "/rss.xml" },
  ],

  /**
   * 功能开关（docs/01-design-spec.md §3.3 的"保险丝"）。
   * 关掉某一项 = 对应脚本与第三方请求完全不加载。
   * 这些能力分别在 P2（搜索/评论/统计）与 P3（动效）落地，此处先冻结开关的默认值。
   */
  features: {
    heroEffect: "static", // "static" | "canvas"；P3 实现 canvas 后改为 "canvas"
    commandPalette: false, // P3
    comments: false, // P2 接入 giscus 后改为 true
    search: false, // P2 接入 Pagefind 后改为 true
    analytics: false, // P2 接入统计脚本后改为 true
  },
} as const;
