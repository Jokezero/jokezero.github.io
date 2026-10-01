/**
 * 站内导航路由：**不换文档的 SPA 式切换**。
 *
 * 为什么这么做（背景见 docs/adr/0019）：
 * 多页站点每次跳转都要更换文档，浏览器在"旧文档已丢弃、新文档还没画出来"的
 * 那一瞬间会铺自己的底色 —— Firefox 默认是白色，于是就是用户反复看到的"闪一下"。
 * 幕布再厚也盖不住这一帧，因为它根本不在文档里。改成不换文档之后，
 * 这个空档从结构上就不存在了：幕布永远待在同一份文档里。
 *
 * 时序：点击 → 幕布下扫（520ms，同时并行预取新页面）→ 换内容 → 揭开幕布（560ms）。
 * 因为内容替换发生在幕布完全覆盖期间，所以不再依赖"新页面加载多快"。
 */

/** 离开页写入、整页跳转到达页读取的一次性标记（只在 SPA 失败退回时用） */
export const ARRIVE_KEY = "zw-arriving";

/** 跨页面必须存活的元素：幕布、开机遮罩、滚动进度线 */
const PERSISTENT_IDS = ["curtain", "boot", "scroll-progress"];

const COVER_MS = 520;
const REVEAL_MS = 560;

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

/** 目标路径 → 幕布上的系统式文案 */
export function labelFor(pathname: string): string {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/") return "LOADING · HOME";
  if (path === "/blog") return "LOADING · ARCHIVE";
  if (path.startsWith("/blog/")) return "LOADING · ARTICLE";
  if (path === "/projects") return "LOADING · WORK";
  if (path.startsWith("/projects/")) return "LOADING · PROJECT";
  if (path === "/about") return "LOADING · ABOUT";
  if (path === "/search") return "LOADING · SEARCH";
  if (path.startsWith("/tags/")) return "LOADING · ARCHIVE";
  return "LOADING · SITE";
}

/** 把标题拆成单字，每个字按 index % 4 分配上/右/下/左四个飞出方向 */
function splitTitle(el: HTMLElement): void {
  if (el.dataset.split === "1") return;
  const lines = el.innerHTML.split(/<br\s*\/?>/i);
  const dirs: [number, number][] = [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ];
  let n = 0;

  el.innerHTML = lines
    .map((line) => {
      let buf = "";
      for (const ch of line.replace(/<[^>]*>/g, "")) {
        const [dx, dy] = dirs[n % 4];
        buf += `<span class="ch" style="--n:${n % 12};--dx:${dx};--dy:${dy}">${
          ch === " " ? "&nbsp;" : ch
        }</span>`;
        n += 1;
      }
      return buf;
    })
    .join("<br>");

  el.dataset.split = "1";
}

/** head 里需要跟着页面走的元信息 */
const HEAD_SELECTORS = [
  'meta[name="description"]',
  'link[rel="canonical"]',
  'meta[property="og:type"]',
  'meta[property="og:title"]',
  'meta[property="og:description"]',
  'meta[property="og:url"]',
  'meta[name="twitter:card"]',
];

export interface RouterHooks {
  /** 换页后重新挂载当前页面的全部行为 */
  remount: () => void;
}

export function initRouter({ remount }: RouterHooks): void {
  const html = document.documentElement;
  const curtain = document.getElementById("curtain");
  const label = curtain?.querySelector("span") ?? null;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const normalize = (path: string) => path.replace(/\/+$/, "") || "/";
  let switching = false;

  /** 把幕布无动画地停到画面上方，保证下一次永远是同一个方向下扫 */
  const park = () => {
    if (!curtain) return;
    curtain.classList.add("no-anim");
    curtain.classList.remove("is-pass", "is-cover");
    void curtain.offsetWidth;
    curtain.classList.remove("no-anim");
  };

  async function fetchPage(url: URL): Promise<Document> {
    const response = await fetch(url.href, {
      credentials: "same-origin",
      headers: { Accept: "text/html" },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const next = new DOMParser().parseFromString(await response.text(), "text/html");
    if (!next.body) throw new Error("无法解析目标页面");
    return next;
  }

  /** 新页面用到的样式表补进来，不再需要的摘掉；补进来的要等加载完再揭幕 */
  async function syncStylesheets(next: Document): Promise<void> {
    const current = [
      ...document.head.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'),
    ];
    const nextHrefs = [
      ...next.head.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'),
    ].map((link) => link.href);
    const currentHrefs = new Set(current.map((link) => link.href));
    const pending: Promise<void>[] = [];

    for (const href of nextHrefs) {
      if (currentHrefs.has(href)) continue;
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      pending.push(
        new Promise<void>((resolve) => {
          link.addEventListener("load", () => resolve(), { once: true });
          link.addEventListener("error", () => resolve(), { once: true });
        }),
      );
      document.head.append(link);
    }

    for (const link of current) {
      if (!nextHrefs.includes(link.href)) link.remove();
    }

    await Promise.all(pending);
  }

  function syncHead(next: Document): void {
    for (const selector of HEAD_SELECTORS) {
      const incoming = next.head.querySelector(selector);
      const current = document.head.querySelector(selector);
      if (!incoming || !current) continue;
      const attr = selector.startsWith("link") ? "href" : "content";
      current.setAttribute(attr, incoming.getAttribute(attr) ?? "");
    }
  }

  /** 把新页面搬进当前文档（脚本不会执行，全部由 remount 负责） */
  async function applyPage(next: Document): Promise<void> {
    /*
     * 常驻层（幕布 / 进场遮罩 / 进度线）**原地不动**。
     * 这一点很关键：早先的写法是把它们摘下来、换完内容再插回去，而"重新插入 DOM"
     * 会让元素身上的 CSS 动画从头再播一遍 —— 表现就是切换动效被触发两次。
     * 现在改成"只换其余节点"：常驻层始终留在原地，动画状态不会被打断。
     */
    const keep = new Set(PERSISTENT_IDS);

    for (const child of [...document.body.children]) {
      if (child.id && keep.has(child.id)) continue;
      child.remove();
    }

    for (const child of [...next.body!.children]) {
      // 新页面里也带着同样的常驻层副本，直接丢掉，保留下正在跑动画的那一份
      if (child.id && keep.has(child.id)) continue;
      document.body.append(child);
    }

    document.body.className = next.body!.className;

    document.title = next.title;
    syncHead(next);
    await syncStylesheets(next);
  }

  async function navigateTo(url: URL, options: { animate?: boolean; push?: boolean } = {}) {
    if (switching) return;
    switching = true;

    const animate = (options.animate ?? true) && !reduced.matches;
    const outgoingTitle = document.querySelector<HTMLElement>("[data-title-split]");

    // 取新页面与幕布下扫并行：幕布盖满时，内容通常已经到手
    const pagePromise = fetchPage(url);

    if (animate && curtain) {
      html.classList.add("is-transitioning");
      if (label) label.textContent = labelFor(url.pathname);
      if (outgoingTitle) {
        splitTitle(outgoingTitle);
        void outgoingTitle.offsetWidth;
        outgoingTitle.classList.add("is-out");
      }
      park();
      curtain.classList.add("is-cover");
      await wait(COVER_MS);
    }

    let next: Document;
    try {
      next = await pagePromise;
    } catch (error) {
      // 取不到就退回整页跳转：至少保证用户能到达目标页面
      console.warn("[router] 取页面失败，退回整页跳转：", error);
      try {
        sessionStorage.setItem(ARRIVE_KEY, "1");
      } catch {
        /* 隐私模式写不进去也不影响 */
      }
      location.assign(url.href);
      return;
    }

    if (options.push !== false) history.pushState({ spa: true }, "", url.href);
    await applyPage(next);

    // 留个可观测的记号：证明这份文档走过 SPA 换页（没有重新加载文档）。
    // 排查问题时很有用，也方便自动化验收。
    html.dataset.spa = "true";

    // 换页后的重新挂载 + 换页收尾
    remount();
    window.scrollTo(0, 0);
    document.getElementById("main")?.focus({ preventScroll: true });

    const incomingTitle = document.querySelector<HTMLElement>("[data-title-split]");
    if (animate && incomingTitle) {
      splitTitle(incomingTitle);
      incomingTitle.classList.add("is-in");
      void incomingTitle.offsetWidth;
      window.requestAnimationFrame(() => incomingTitle.classList.remove("is-in"));
    }

    if (animate && curtain) {
      html.classList.remove("is-transitioning");
      curtain.classList.remove("is-cover");
      curtain.classList.add("is-pass");
      await wait(REVEAL_MS);
    }

    switching = false;
  }

  // ── 整页加载后（例如 SPA 失败退回、或从外部链接进来）的揭幕 ──
  if (html.classList.contains("is-arriving") && curtain) {
    if (label) label.textContent = labelFor(location.pathname);
    window.scrollTo(0, 0);
    switching = true;
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        html.classList.remove("is-arriving");
        curtain.classList.add("is-pass");
        const title = document.querySelector<HTMLElement>("[data-title-split]");
        if (title) {
          splitTitle(title);
          title.classList.add("is-in");
          void title.offsetWidth;
          window.requestAnimationFrame(() => title.classList.remove("is-in"));
        }
        window.setTimeout(() => {
          html.classList.remove("is-transitioning");
          switching = false;
        }, REVEAL_MS + 100);
      });
    });
  }

  // ── 点击拦截：站内链接一律走 SPA 导航 ──
  document.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const anchor = (event.target as Element | null)?.closest?.("a");
    if (!anchor) return;
    if (anchor.target && anchor.target !== "_self") return;
    if (anchor.hasAttribute("download")) return;

    const href = anchor.getAttribute("href");
    if (!href || href.startsWith("#")) return;

    let url: URL;
    try {
      url = new URL(anchor.href, location.href);
    } catch {
      return;
    }
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.hash) return;

    // 忽略结尾斜杠差异（导航写的是 /blog，落地地址是 /blog/）
    if (normalize(url.pathname) === normalize(location.pathname)) {
      window.scrollTo({ top: 0, behavior: reduced.matches ? "auto" : "smooth" });
      return;
    }

    event.preventDefault();
    void navigateTo(url);
  });

  // ── 前进/后退：同样是换内容，不换文档 ──
  window.addEventListener("popstate", () => {
    if (switching) return;
    void navigateTo(new URL(location.href), { animate: false, push: false });
  });
}
