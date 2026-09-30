/**
 * 首次进入的字符绘制（独立遮罩，不用幕布）。
 *
 * 只在这些情况下播放：不是从站内转场进来的、没有开启"减少动态效果"、
 * 且本次会话还没播过。遮罩是静态 DOM，从首帧就盖住画面，所以不会闪。
 * 依据：docs/02-build-and-deploy.md §0.5 的 P3 施工单。
 */
const INTRO_KEY = "zw-intro";

/** 三角线稿：逐字铺进 <pre>，靠 CSS 变量 --n 做级联显影 */
const ART = ["      /\\", "     /  \\", "    /    \\", "   /      \\", "  /________\\"];

export function initIntro(): void {
  const boot = document.getElementById("boot");
  const art = document.getElementById("boot-art");
  const html = document.documentElement;

  if (!boot || !art) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // 到达页（转场进来的）与本会话已播过的都不播；这个判断在 <head> 里就已定好，
  // 这里只照着执行，避免与转场脚本产生状态竞态（曾经因此闪一帧黑屏）。
  const skip =
    reduced ||
    html.classList.contains("is-arriving") ||
    html.classList.contains("no-intro");

  if (skip) {
    boot.style.display = "none";
    return;
  }

  let n = 0;
  let markup = "";
  for (const line of ART) {
    for (const ch of line) {
      markup += `<span class="la-ch" style="--n:${n}">${ch === " " ? "&nbsp;" : ch}</span>`;
      n += 1;
    }
    markup += "\n";
  }
  art.innerHTML = markup;

  try {
    sessionStorage.setItem(INTRO_KEY, "1");
  } catch {
    // 写不进去也没关系：下次刷新会再播一遍
  }

  const titleEl = document.querySelector<HTMLElement>("[data-title-split]");

  // 遮罩还全黑，此时把滚动位置复位不会被看见
  window.scrollTo(0, 0);

  window.requestAnimationFrame(() => {
    boot.classList.add("is-draw");
  });

  window.setTimeout(() => {
    boot.classList.add("is-gone");
    if (titleEl) {
      titleEl.classList.add("is-in");
      void titleEl.offsetWidth;
      window.requestAnimationFrame(() => titleEl.classList.remove("is-in"));
    }
  }, 980);

  window.setTimeout(() => {
    boot.style.display = "none";
  }, 1760);
}
