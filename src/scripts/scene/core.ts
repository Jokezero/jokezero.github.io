/**
 * 背景模拟的公共运行时。
 *
 * 只负责"怎么跑"，不负责"画什么"：
 *   · 画布尺寸与 devicePixelRatio（上限 2，粗指针设备 1.5）
 *   · 指针视差（E13：横向 ±27px / 纵向 ±12px，离开后约 1 秒归零）
 *   · 主循环 + 页面不可见时暂停 + 持续低帧率时降级为静态帧
 *   · 能力检测（减少动态效果 / 省流量 / 2G·3G / 无 Canvas 2D）
 *
 * 所有模拟都是"算出来的"：没有视频、没有图片、没有第三方图形库。
 */

export interface SceneApi {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  /** 减少动态效果：只画一帧 */
  reduced: boolean;
  /** 粗指针（触屏）：减少线数、限制 DPR */
  coarse: boolean;
  /** 清成纯黑 */
  clear(): void;
  /** 画一个白点 */
  dot(x: number, y: number, r: number, alpha: number): void;
  /** 文字一侧压暗，保证文案始终可读（仅首屏需要） */
  edgeScrim(): void;
  /** 指针视差位移，单位 px */
  drift(): [number, number];
  /** 滚动带来的向下视差（首屏用 5%） */
  parallax(): number;
}

export interface Scene {
  /** 首帧之前调用一次 */
  init?(api: SceneApi): void;
  /** 每帧调用；t 单位为秒，dim 是滚动带来的全局亮度系数 */
  frame(api: SceneApi, t: number, dim: number): void;
}

export interface MountOptions {
  /** hero = 首屏内画布（随滚动压暗）；page = 整页固定画布（常亮） */
  mode?: "hero" | "page";
  /** 是否跟随指针做视差（E13），默认 true */
  parallax?: boolean;
}

/** 持续低于这个帧率就退回静态帧，避免低端设备一直掉帧。 */
const MIN_FPS = 26;
/** 指针位移上限（§4.5 的 E13 参数） */
const DRIFT_X = 27;
const DRIFT_Y = 12;

/**
 * 所有模拟的线条宽度（单位：CSS 像素）。
 * 想让背景线条更粗或更细，改这一个数字即可 —— 四个模拟共用它。
 */
export const LINE_WIDTH = 1.5;

function prefersReduced(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** 省流量模式或 2G/3G：不跑动画，只留一帧静态画面。 */
function isDataSaver(): boolean {
  const connection = (
    navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }
  ).connection;
  if (!connection) return false;
  if (connection.saveData) return true;
  const type = connection.effectiveType ?? "";
  return type === "slow-2g" || type === "2g" || type === "3g";
}

export function mountScene(
  canvas: HTMLCanvasElement,
  scene: Scene,
  options: MountOptions = {},
): () => void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {}; // 没有 Canvas 2D：保持纯黑，正文照常阅读

  // 换页时要收摊的东西（监听器 / 观察器 / 循环）都登记在这里
  const cleanups: Array<() => void> = [];

  const mode = options.mode ?? "hero";
  const followPointer = options.parallax !== false;
  const coarse = window.matchMedia("(pointer: coarse)").matches;

  // 静态模式：减少动态效果 / 省流量 —— 只画一帧，之后完全不动
  const staticOnly = prefersReduced() || isDataSaver();

  let width = 1;
  let height = 1;
  let ratio = 1;
  let scrollY = 0;
  let frameId = 0;
  let startedAt = 0;
  let lastTime = 0;
  let fpsFrames = 0;
  let fpsSince = 0;
  let downgraded = false;

  // 指针：tx/ty 是事件目标值，x/y 每帧缓动逼近，influence 控制交互强度淡入淡出
  // 相对画布的指针位置（宽高在事件里缓存，避免每帧读取布局）
  const pointer = {
    tx: 0,
    ty: 0,
    x: 0,
    y: 0,
    w: 1,
    h: 1,
    active: false,
    influence: 0,
  };

  const api: SceneApi = {
    ctx,
    width,
    height,
    reduced: staticOnly,
    coarse,
    clear() {
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      // 用 clearRect 而不是填黑：画布保持透明，页面底色（深色主题黑 / 亮色主题白）
      // 自然透出来，省掉一层全屏填充。亮色主题下整块画布再由 CSS 做一次 invert。
      ctx.clearRect(0, 0, width, height);
    },
    dot(x, y, r, alpha) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
      ctx.fill();
    },
    edgeScrim() {
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      const narrow = width < 900;
      if (narrow) {
        const g = ctx.createLinearGradient(0, 0, 0, height * 0.54);
        g.addColorStop(0, "rgba(0,0,0,0.94)");
        g.addColorStop(0.7, "rgba(0,0,0,0.58)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, width, height * 0.54);
      } else {
        const g = ctx.createLinearGradient(0, 0, width * 0.52, 0);
        g.addColorStop(0, "rgba(0,0,0,0.95)");
        g.addColorStop(0.62, "rgba(0,0,0,0.6)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, width * 0.52, height);
      }
    },
    drift() {
      if (!followPointer) return [0, 0];
      const k = pointer.influence;
      const dx = (pointer.x / Math.max(1, pointer.w) - 0.5) * 2;
      const dy = (pointer.y / Math.max(1, pointer.h) - 0.5) * 2;
      return [dx * DRIFT_X * k, dy * DRIFT_Y * k];
    },
    parallax() {
      // 首屏画布随滚动做 5% 的向下视差（在绘制层偏移，不移动画布本身）
      return mode === "hero" ? scrollY * 0.05 : 0;
    },
  };

  function resize(): boolean {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    const r = Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2);
    if (w === width && h === height && r === ratio) return false;
    width = w;
    height = h;
    ratio = r;
    canvas.width = Math.round(w * r);
    canvas.height = Math.round(h * r);
    api.width = w;
    api.height = h;
    return true;
  }

  function stepPointer(): void {
    if (!followPointer) return;
    pointer.x += (pointer.tx - pointer.x) * 0.11;
    pointer.y += (pointer.ty - pointer.y) * 0.11;
    const target = pointer.active ? 1 : 0;
    pointer.influence += (target - pointer.influence) * 0.05;
    if (Math.abs(pointer.influence - target) < 0.002) pointer.influence = target;
  }

  function dimForScroll(): number {
    if (mode !== "hero" || staticOnly) return 1;
    const heroHeight = canvas.parentElement?.offsetHeight ?? window.innerHeight;
    const progress = Math.min(1.4, scrollY / Math.max(1, heroHeight * 0.55));
    return Math.max(0.22, 1 - progress * 0.8);
  }

  function paint(t: number): void {
    api.clear();
    scene.frame(api, t, dimForScroll());
  }

  function loop(now: number): void {
    const t = (now - startedAt) / 1000;
    lastTime = now;
    stepPointer();
    paint(t);

    // 帧率守卫：连续低于阈值就退回静态帧（低端设备的兜底）
    if (!downgraded && now - fpsSince > 2000) {
      fpsFrames += 1;
      const fps = (fpsFrames * 1000) / (now - fpsSince);
      if (fps < MIN_FPS) {
        downgraded = true;
        return; // 保留最后一帧，不再排新的 rAF
      }
      fpsFrames = 0;
      fpsSince = now;
    } else {
      fpsFrames += 1;
    }

    frameId = window.requestAnimationFrame(loop);
  }

  function start(): void {
    if (frameId || downgraded) return;
    startedAt = performance.now();
    fpsSince = startedAt;
    fpsFrames = 0;
    frameId = window.requestAnimationFrame(loop);
  }

  function stop(): void {
    if (frameId) {
      window.cancelAnimationFrame(frameId);
      frameId = 0;
    }
  }

  resize();
  scene.init?.(api);

  if (staticOnly) {
    // 只画一帧静态画面：视觉仍在，CPU 成本为零
    paint(6);
    return () => {};
  }

  // 指针事件：只记录位置，真正的位移在绘制时计算
  if (followPointer) {
    const setPointer = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      pointer.w = rect.width;
      pointer.h = rect.height;
      pointer.tx = clientX - rect.left;
      pointer.ty = clientY - rect.top;
      if (!pointer.active) {
        pointer.x = pointer.tx;
        pointer.y = pointer.ty;
      }
      pointer.active = true;
    };
    const onPointerMove = (event: PointerEvent) => setPointer(event.clientX, event.clientY);
    const onPointerLeave = () => {
      pointer.active = false;
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerMove, { passive: true });
    document.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("blur", onPointerLeave);
    cleanups.push(() => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerMove);
      document.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("blur", onPointerLeave);
    });
  }

  // 滚动量给视差与压暗用，自己监听，和页面的滚动特效解耦
  let scrollQueued = false;
  const readScroll = () => {
    scrollQueued = false;
    scrollY = window.scrollY || document.documentElement.scrollTop || 0;
  };
  const onScroll = () => {
    if (scrollQueued) return;
    scrollQueued = true;
    window.requestAnimationFrame(readScroll);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  cleanups.push(() => window.removeEventListener("scroll", onScroll));
  readScroll();

  // 尺寸变化：ResizeObserver 跟随容器（横竖屏切换也能重新量）
  if (typeof ResizeObserver !== "undefined") {
    const observer = new ResizeObserver(() => {
      if (resize()) {
        if (downgraded) paint(lastTime / 1000);
      }
    });
    observer.observe(canvas);
    cleanups.push(() => observer.disconnect());
  } else {
    const onResize = () => resize();
    window.addEventListener("resize", onResize, { passive: true });
    cleanups.push(() => window.removeEventListener("resize", onResize));
  }

  // 页面不可见时暂停渲染循环，省电
  const onVisibilityChange = () => {
    if (document.hidden) stop();
    else start();
  };
  document.addEventListener("visibilitychange", onVisibilityChange);
  cleanups.push(() => document.removeEventListener("visibilitychange", onVisibilityChange));

  // 用户中途打开"减少动态效果"：停掉循环，保留当前帧
  const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const onReducedChange = (event: MediaQueryListEvent) => {
    if (event.matches) {
      stop();
      downgraded = true;
    }
  };
  reducedQuery.addEventListener("change", onReducedChange);
  cleanups.push(() => reducedQuery.removeEventListener("change", onReducedChange));

  // 等首屏内容渲染完再开始，避免和首屏抢主线程
  const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => number })
    .requestIdleCallback;
  if (typeof idle === "function") idle(() => start());
  else window.setTimeout(() => start(), 120);

  // 换页（SPA 导航）时必须调用：停掉循环、摘掉监听，避免旧画布一直空转
  return () => {
    stop();
    downgraded = true;
    for (const cleanup of cleanups) cleanup();
  };
}
