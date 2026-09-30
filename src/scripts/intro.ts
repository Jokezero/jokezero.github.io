/**
 * 首次进入的字符绘制（独立遮罩，不用幕布）。
 *
 * 只在这些情况下播放：不是从站内转场进来的、没有开启"减少动态效果"、
 * 且本次会话还没播过。遮罩是静态 DOM，从首帧就盖住画面，所以不会闪。
 * 依据：docs/02-build-and-deploy.md §0.5 的 P3 施工单。
 */
const INTRO_KEY = "zw-intro";

/**
 * 开机动画的字样：`ZERO` 的 ASCII 线稿（等宽字体逐字铺进 <pre>，靠 CSS 变量 --n 级联显影）。
 * 用的是 figlet standard 字形的线条版本 —— 只用 / \ _ | 四种笔画，与站点的"单色细线"一致。
 * 改字样时只要保持每行等宽（等宽字体下对齐才准），其余逻辑不用动。
 */
const ART = [
  " _____ ______ ______ ____  ",
  "|__  /|  ____|  ____/ __ \\ ",
  "  / / | |__  | |__ | |  | |",
  " / /  |  __| |  __|| |  | |",
  "/ /__ | |____| |___| |__| |",
  "/_____|______|______\\____/ ",
];

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
    // 去掉行尾空格：它们看不见，但会白白占用级联时间
    for (const ch of line.replace(/\s+$/, "")) {
      markup += `<span class="la-ch" style="--n:${n}">${ch === " " ? "&nbsp;" : ch}</span>`;
      n += 1;
    }
    markup += "\n";
  }
  art.innerHTML = markup;

  // 级联速度按字符总数自适应：无论字样多长，整幅字都在约 0.7 秒内画完，
  // 留出约 0.3 秒让人看清完整字样，再开始淡出（遮罩停留时间见下面的 980ms）。
  // 写死 13ms/字的老做法只适合 50 字左右的三角；换成整词会拖到 2 秒以上，
  // 结果是"还没画完就开始淡出"。
  const step = Math.max(3, Math.min(13, Math.round(700 / Math.max(1, n))));
  boot.style.setProperty("--intro-step", `${step}ms`);

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
