/**
 * 客户端唯一入口：把"页面行为"集中成一组可重复挂载的初始化函数。
 *
 * 为什么要有这一层：站内导航改成了不换文档的 SPA 式切换（src/scripts/router.ts），
 * 换页时只替换 <body> 内容 —— 而通过 innerHTML 插入的 <script> 不会执行，
 * 所以每一页的行为都必须由这里在换页后重新挂载一遍。
 *
 * 约定：每个 initX() 从当前 DOM 里现查元素，需要收尾的（全局监听、观察器、动画循环）
 * 返回一个销毁函数，换页前由 mountPage() 统一调用。
 */
import { initRouter } from "./router";
import { initIntro } from "./intro";
import { mountBackgrounds } from "./background";
import { initHeader } from "./ui/header";
import { initTheme } from "./ui/theme";
import { initScrollEffects } from "./ui/scroll-effects";
import { initCodeCopy } from "./ui/code-copy";
import { initComments } from "./ui/comments";
import { initLightbox } from "./ui/lightbox";
import { initBlogIndex } from "./blog-index";
import { initProjectShelf } from "./project-shelf";
import { initAbout } from "./about";
import { initSearch } from "./search";

/** 每次换页都要重来一遍的初始化（顺序：先背景，再交互件） */
const pageInitializers = [
  mountBackgrounds,
  initHeader,
  initTheme,
  initBlogIndex,
  initProjectShelf,
  initLightbox,
  initCodeCopy,
  initComments,
  initAbout,
  initSearch,
];

const teardowns: Array<() => void> = [];

/** 挂载当前页面的全部行为；调用前先执行上一轮的收尾 */
export function mountPage(): void {
  for (const teardown of teardowns.splice(0).reverse()) teardown();
  for (const init of pageInitializers) {
    const teardown = init();
    if (typeof teardown === "function") teardowns.push(teardown);
  }
}

// 常驻层（滚动进度线）只挂一次
initScrollEffects();
// 开机动画只在首次加载播放（是否播放由 <head> 里的门闸决定）
initIntro();
// 首次加载时挂载当前页面
mountPage();
// 之后所有站内跳转都由路由器接管
initRouter({ remount: mountPage });
