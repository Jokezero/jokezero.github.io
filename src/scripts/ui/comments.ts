/**
 * giscus 评论：滚动到附近才加载第三方脚本。
 *
 * 由 app.ts 在首次加载与每次 SPA 换页后调用；
 * 元素都从当前 DOM 里现查，所以换页后能直接复用同一份逻辑。
 */
export function initComments(): (() => void) | void {
  const container = document.getElementById("giscus-container");
  let observer: IntersectionObserver | null = null;

  // 没有容器 = 评论被关闭或未配置 → 不加载任何第三方脚本。
  if (container) {
    const mount = () => {
      const script = document.createElement("script");
      script.src = "https://giscus.app/client.js";
      script.async = true;
      script.crossOrigin = "anonymous";

      const map: Record<string, string> = {
        "data-repo": "data-repo",
        "data-repo-id": "data-repo-id",
        "data-category": "data-category",
        "data-category-id": "data-category-id",
        "data-mapping": "data-mapping",
        "data-reactions": "data-reactions",
        "data-input-position": "data-input-position",
        "data-lang": "data-lang",
      };

      for (const key of Object.keys(map)) {
        const value = container.getAttribute(key);
        if (value) script.setAttribute(key, value);
      }

      script.setAttribute("data-theme", "transparent_dark");
      script.setAttribute("data-loading", "lazy");
      container.append(script);
    };

    // 滚动到评论区附近（提前 300px）才开始请求 giscus。
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            io.disconnect();
            mount();
          }
        },
        { rootMargin: "300px 0px" },
      );
      observer = io;
      io.observe(container);
    } else {
      mount();
    }

    // 换页时断开观察，避免残留的观察器一直盯着已被替换掉的容器
    return () => observer?.disconnect();
  }
}
