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

  // ── 到达页：把幕布"接着往下扫完"，新标题从反方向归位 ──
  if (html.classList.contains("is-arriving") && curtain) {
    if (label) label.textContent = labelFor(location.pathname);

    // 换页一律从顶部开始：否则首屏文案会停在"淡出"状态，看起来像标题消失
    window.scrollTo(0, 0);

    // 复位到"完全覆盖"的位置，且这一帧不动画
    curtain.classList.add("no-anim", "is-cover");
    void curtain.offsetWidth;
    curtain.classList.remove("no-anim");

    window.requestAnimationFrame(() => {
      // 先让新页标题停在"反方向、不可见"的位置，再放它归位
      if (titleEl) {
        splitTitle(titleEl);
        titleEl.classList.add("is-in");
        void titleEl.offsetWidth;
      }

      curtain.classList.remove("is-cover");
      curtain.classList.add("is-pass");
      html.classList.remove("is-arriving");

      window.requestAnimationFrame(() => {
        titleEl?.classList.remove("is-in");
      });

      window.setTimeout(() => {
        // 幕布停在视口下方（不可见），下一次切换开始时再悄悄复位
        curtain.classList.remove("is-pass");
        html.classList.remove("is-transitioning");
      }, 660);
    });

    return;
  }

  if (titleEl) splitTitle(titleEl);

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
    if (url.href === location.href) return;
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
    curtain.classList.add("no-anim");
    curtain.classList.remove("is-pass", "is-cover");
    void curtain.offsetWidth;
    curtain.classList.remove("no-anim");
    curtain.classList.add("is-cover");

    // 覆盖 540ms 后跳转；到达页接上"揭开"那一段
    window.setTimeout(() => {
      location.href = url.href;
    }, 540);
  });
}
