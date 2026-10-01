/**
 * 关于页：分节导航高亮、右下角计数、标题屏隐藏控件。
 *
 * 由 app.ts 在首次加载与每次 SPA 换页后调用；
 * 元素都从当前 DOM 里现查，所以换页后能直接复用同一份逻辑。
 */
export function initAbout(): () => void {
  // 换页到别的页面时，这个初始化也会被调用 —— 先确认本页确实是关于页，
  // 否则会把滚动吸附（html.is-about）误加到首页、文章页上。
  const hasAboutPage =
    Boolean(document.getElementById("about-nav")) &&
    document.querySelectorAll(".asection").length > 0;
  if (!hasAboutPage) return () => {};

  // 只在关于页打开滚动吸附（html.is-about），避免影响其他页面。
  document.documentElement.classList.add("is-about");

  const nav = document.getElementById("about-nav");
  const counter = document.getElementById("about-count");
  const topScreen = document.getElementById("about-top");
  const sections = Array.from(document.querySelectorAll<HTMLElement>(".asection"));
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>(".about-nav-link"));

  // 标题屏：隐藏分节导航与计数
  const toggleChrome = (visible: boolean) => {
    nav?.style.setProperty("opacity", visible ? "1" : "0");
    nav?.style.setProperty("pointer-events", visible ? "auto" : "none");
    counter?.style.setProperty("opacity", visible ? "1" : "0");
  };

  // 当前屏：高亮分节导航 + 更新 01 / 04 计数
  const syncActive = () => {
    const middle = window.scrollY + window.innerHeight / 2;
    let currentIndex = -1;

    sections.forEach((section, index) => {
      const start = section.offsetTop;
      const end = start + section.offsetHeight;
      if (middle >= start && middle < end) currentIndex = index;
    });

    const onTitleScreen = currentIndex <= 0;
    toggleChrome(!onTitleScreen);

    if (currentIndex > 0 && counter) {
      const label = sections[currentIndex].id;
      const position = links.findIndex((link) => link.dataset.section === label) + 1;
      counter.textContent = `${String(position).padStart(2, "0")} / ${String(sections.length - 1).padStart(2, "0")}`;
    }

    for (const link of links) {
      const isActive = link.dataset.section === sections[currentIndex]?.id;
      link.setAttribute("aria-current", isActive ? "true" : "false");
    }
  };

  let frame = 0;
  const schedule = () => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      syncActive();
    });
  };

  addEventListener("scroll", schedule, { passive: true });
  addEventListener("resize", schedule, { passive: true });
  if (topScreen) syncActive();

  // 换到别的页面前必须收摊：摘掉全局监听、并关掉滚动吸附
  return () => {
    removeEventListener("scroll", schedule);
    removeEventListener("resize", schedule);
    if (frame) cancelAnimationFrame(frame);
    document.documentElement.classList.remove("is-about");
  };
}
