/**
 * 顶栏的窄屏 MENU 面板展开/收起。
 *
 * 由 app.ts 在首次加载与每次 SPA 换页后调用；
 * 元素都从当前 DOM 里现查，所以换页后能直接复用同一份逻辑。
 */
export function initHeader(): void {
  const toggle = document.getElementById("nav-toggle");
  const panel = document.getElementById("mobile-nav");

  toggle?.addEventListener("click", () => {
    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!isOpen));
    toggle.textContent = isOpen ? "MENU" : "CLOSE";
    if (panel) panel.hidden = isOpen;
  });
}
