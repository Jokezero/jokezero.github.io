/**
 * E9 页面切换动效：幕布连续下扫 + 标题逐字飞出／归位。
 *
 * 本站是**多页静态站**，所以分两半：
 *   离开页：拦下站内链接 → 标题逐字飞出 → 幕布自上而下盖住 → 540ms 后跳转
 *   到达页：<head> 里的内联脚本给 <html> 挂 is-arriving（首帧幕布就在画面里）
 *           → 幕布继续向下离开 → 新页标题从反方向逐字归位
 *
 * 依据见 docs/04-reference-motion-study.md §4 与 docs/02-build-and-deploy.md §10 的坑位清单：
 *   · 覆盖与揭开首尾相接、缓动互补，合成"一次连续下扫"（中间不留停顿）
 *   · 每次切换前把幕布无动画地复位到画面上方，保证方向永远一致
 *   · 换页必须回到顶部，否则首屏文案会停在"淡出"状态
 *
 * 三个已经踩过的坑（2026-09-30 修复，别再改回去）：
 *   1. **首帧覆盖必须由 CSS 保证**：客户端脚本现在是外部文件（P4 起不再内联），
 *      执行时机可能在首次绘制之后。所以 `html.is-arriving #curtain { transform: none }`
 *      写在 motion.css 里，JS 只负责"下一帧释放它"，否则会先闪一下新页面。
 *   2. **到达页也必须注册点击拦截**：早期版本在到达分支里 return，
 *      导致"跳到新页后，从这一页再点导航就不播动效了"，表现为动效时有时无。
 *   3. **收尾时绝不能复位幕布**：幕布离开后要停在视口下方（is-pass 保留）。
 *      一旦在收尾时摘掉 is-pass，它会带着过渡从下方动画回到上方，穿过整个视口 ——
 *      看起来就是"动效结束后幕布又出现了一次"。复位只在下一次切换开始时用 no-anim 做。
 */

/** 离开页写入、到达页读取的一次性标记 */
export const ARRIVE_KEY = "zw-arriving";

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
  const html = el.innerHTML;
  const lines = html.split(/<br\s*\/?>/i);
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

export function initPageTransition(): void {
  const html = document.documentElement;
  const curtain = document.getElementById("curtain");
  const label = curtain?.querySelector("span") ?? null;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const titleEl = document.querySelector<HTMLElement>("[data-title-split]");
  let switching = false;

  /** 把幕布无动画地停到画面上方（视口外），保证下一次永远是同一个方向下扫 */
  const park = () => {
    if (!curtain) return;
    curtain.classList.add("no-anim");
    curtain.classList.remove("is-pass", "is-cover");
    void curtain.offsetWidth;
    curtain.classList.remove("no-anim");
  };

  // ── 到达页：把幕布"接着往下扫完"，新标题从反方向归位 ──
  if (html.classList.contains("is-arriving") && curtain) {
    if (label) label.textContent = labelFor(location.pathname);

    // 换页一律从顶部开始：否则首屏文案会停在"淡出"状态，看起来像标题消失
    window.scrollTo(0, 0);

    // 首帧的"盖满画面"由 CSS（html.is-arriving #curtain）保证，这里不再动它，
    // 只在下一帧释放：去掉 is-arriving、接上 is-pass，幕布就继续向下扫出画面。
    switching = true; // 到达动画期间不接受新的切换

    window.requestAnimationFrame(() => {
      // 先让新页标题停在"反方向、不可见"的位置，再放它归位
      if (titleEl) {
        splitTitle(titleEl);
        titleEl.classList.add("is-in");
        void titleEl.offsetWidth;
      }

      html.classList.remove("is-arriving");
      curtain.classList.add("is-pass");

      window.requestAnimationFrame(() => {
        titleEl?.classList.remove("is-in");
      });

      window.setTimeout(() => {
        // 幕布停在视口下方（is-pass 保留，绝不在这里复位 —— 见文件头的坑位 3）
        html.classList.remove("is-transitioning");
        switching = false;
      }, 660);
    });
  } else if (titleEl) {
    splitTitle(titleEl);
  }

  // 浏览器"后退"可能直接从 bfcache 恢复整页（脚本不会再跑一遍）：
  // 那时页面还带着 is-transitioning、幕布还停在视口外，必须复位，否则这一页再也不播动效。
  window.addEventListener("pageshow", (event) => {
    if (!event.persisted) return;
    switching = false;
    html.classList.remove("is-transitioning");
    park();
  });

  // ── 离开页：拦下站内链接，先播动画再跳转 ──
  document.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (reduced.matches) return;

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
    if (url.href === location.href) {
      // 点的是当前页面自己的链接（例如在首页点"首页"）：不播动效，但回到顶部
      window.scrollTo({ top: 0, behavior: reduced.matches ? "auto" : "smooth" });
      return;
    }
    if (!curtain) return;

    event.preventDefault();
    if (switching) return;
    switching = true;

    html.classList.add("is-transitioning");

    try {
      sessionStorage.setItem(ARRIVE_KEY, "1");
    } catch {
      // 隐私模式下写不进去：退化成普通跳转，不影响可用性
    }

    if (label) label.textContent = labelFor(url.pathname);

    // 标题逐字飞出（只有当前页确实有可见大标题时才播）
    if (titleEl) {
      splitTitle(titleEl);
      void titleEl.offsetWidth;
      titleEl.classList.add("is-out");
    }

    // 无论幕布此前停在哪，先无动画复位到画面上方，保证每次方向一致
    park();
    curtain.classList.add("is-cover");

    // 覆盖 540ms 后跳转；到达页接上"揭开"那一段
    window.setTimeout(() => {
      location.href = url.href;
    }, 540);

    // 兜底：万一跳转没发生（例如链接被拦截、下载弹窗），4 秒后把页面交还给用户
    window.setTimeout(() => {
      if (!switching) return;
      switching = false;
      html.classList.remove("is-transitioning");
      park();
    }, 4000);
  });
}
