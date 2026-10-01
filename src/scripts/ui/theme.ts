/**
 * 主题切换按钮：切换 data-theme、写入 localStorage、同步无障碍标签。
 *
 * 由 app.ts 在首次加载与每次 SPA 换页后调用；
 * 元素都从当前 DOM 里现查，所以换页后能直接复用同一份逻辑。
 */
export function initTheme(): void {
  // 这段脚本会被 Astro 打包；体积很小，且只在页面存在按钮时运行。
  const storageKey = "zeroweb-theme"; // 与 src/config/site.ts 的 themeStorageKey 一致
  const root = document.documentElement;
  const button = document.getElementById("theme-toggle");

  function syncLabel() {
    if (!button) return;
    const isLight = root.dataset.theme === "light";
    button.setAttribute("aria-label", isLight ? "切换到深色主题" : "切换到浅色主题");
    button.setAttribute("title", isLight ? "切换到深色主题" : "切换到浅色主题");
  }

  button?.addEventListener("click", () => {
    const next = root.dataset.theme === "light" ? "dark" : "light";
    root.dataset.theme = next;
    try {
      localStorage.setItem(storageKey, next);
    } catch {
      // 隐私模式下 localStorage 可能不可写：忽略即可，主题在当前页面仍然切换成功。
    }
    syncLabel();
  });

  syncLabel();
}
