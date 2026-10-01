/**
 * 滚动特效（E10）：顶部进度线 + 供 CSS 使用的 --sy / --sp 变量。
 *
 * 由 app.ts 在首次加载与每次 SPA 换页后调用；
 * 元素都从当前 DOM 里现查，所以换页后能直接复用同一份逻辑。
 */
export function initScrollEffects(): void {
  const root = document.documentElement;
  const bar = document.getElementById("scroll-progress");
  let queued = false;

  const read = () => {
    queued = false;
    const y = window.scrollY || root.scrollTop || 0;
    // 每次现查首屏元素：SPA 换页后 [data-hero] 是新的节点，
    // 缓存旧引用会拿到高度 0，滚动进度一下子顶到最大值 ——
    // 表现就是"首屏标题一滚就没了"，而不是渐隐。
    const hero = document.querySelector<HTMLElement>("[data-hero]");
    const heroHeight = hero?.offsetHeight ?? window.innerHeight;
    // 首屏文案在约 55% 首屏高度的滚动距离内淡出（§4.5.1 第 5 条）
    const progress = Math.max(0, Math.min(1.4, y / Math.max(1, heroHeight * 0.55)));

    root.style.setProperty("--sy", y.toFixed(1));
    root.style.setProperty("--sp", progress.toFixed(3));

    if (bar) {
      const span = Math.max(1, root.scrollHeight - window.innerHeight);
      bar.style.transform = `scaleX(${Math.min(1, y / span).toFixed(4)})`;
    }
  };

  const schedule = () => {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(read);
  };

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });
  read();
}
