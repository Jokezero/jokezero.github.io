# 参考站动效研究 · 页面切换与进场

> 研究对象：用户提供的三个动效参考站。方法：用浏览器直接打开站点，读取运行时的 DOM 结构、计算样式与同源样式表规则（不是凭印象描述）。
> 研究日期：2026-09-29。结论直接决定了本项目的 **E9 页面切换动效** 与进场遮罩的设计。

---

## 1. 站点技术画像（实测）

| 站点 | 技术栈（实测证据） | 平滑滚动 | 转场载体 |
| --- | --- | --- | --- |
| **jiejoe.com** | Vue SPA（`chunk-vendors.*.js` + `app.*.js`），rem 缩放体系（`--scale_nums`），主题用 CSS 变量 | 有（提示语 `SCROLL CAREFULLY, IT'S SMOOTH`） | 常驻 DOM 的整屏 `.loading` 遮罩 + 分离的菜单面板 |
| **wodniack.dev** | **Astro**（样式带 `astro-*` 作用域哈希）；`<html>` 上挂着 `lenis is-loaded has-scrollbar` | **Lenis**（`lenis` 类名） | `is-transitioning` 根类 + 停在画面外的整屏色块 + 逐字飞出动画 |
| **cosmicbroth.com** | Vue 3 SFC（`data-v-*` 作用域属性），像素字体 `zpix` | 有（滚动进度用 CSS 变量 `--l` 驱动） | 常驻 DOM 的整屏 `.loading`（z-index 10000000） |

三站都**没有**使用浏览器原生的 View Transitions API（实测 `astro-view-transitions-enabled` 与 `document.startViewTransition` 均不存在），全部是自建的整屏遮罩方案。

---

## 2. 逐个拆解

### 2.1 jiejoe.com —— "整屏遮罩 + 圆角面板升起"

**进场 / 转场遮罩**（常驻 DOM，每次路由切换复用）

```css
.loading      { position: fixed; top:0; left:0; width:100%; height:100%; z-index: 2147483647; }
.loading_blackblock, .loading_greenblock { position: absolute; width: 100%; height: 100%; }
.loading_blackblock { background-color: var(--theme_black); }
.loading_animation_tip { font-family: eng; font-size: 1.5rem; color: var(--theme_green); letter-spacing: .3rem; }
```

- 结构：整屏固定层 → **黑色块 + 绿色块两层**（两块都在同一位置叠放，绿色块负责"擦除式"揭示）→ 居中的旋转图形 + 等宽 `LOADING` 文案。
- 要点：**遮罩不是动画元素，而是常驻节点**；每次切换只改变类名。`.loading` 的 z-index 用到了 `2147483647`（int 上限），确保盖住一切。
- 文案用主题强调色（荧光绿）+ 宽字距，本身就是品牌感的一部分。

**菜单 / 页面切换面板**

```css
.menubox_menu  { position: fixed; top:0; left:0; width:100%; height:100%;
                 background-color: var(--theme_white);
                 transform: translateY(100%);            /* 停在屏幕下方 */
                 border-top-left-radius: 10rem; }        /* 掀起时的圆角 */
.menubox_menu_backg img { transform: translateY(100%); }
.mmc_selections_selection { transform: translateX(-100%); }  /* 条目从左侧滑入 */
```

- 一整块**白底大圆角面板从下往上推起**；面板内的条目从左侧逐条滑入；文字 `writing-mode: vertical`（竖排）。
- 装饰性关键帧（`move_line`、`draglines_up/down/left/right`、`pictures_wave`、`arm_rotate`…）都服务于滚动叙事，不参与页面切换。

### 2.2 wodniack.dev —— "逐字飞出 + 停靠色块 + clip-path 擦除"

这是三者里**最值得抄**的一套，因为它的转场是"内容级"的，不只是盖一块布。

**① 根状态类**（转场期间的状态开关）

```css
html: "is-linux is-chrome lenis has-scrollbar is-loaded"     /* is-loaded：首屏动画的门闸 */
.is-transitioning .site-scrollbar__thumb { scale: 0 1; }     /* 转场时把滚动条收起 */
```

**② 标题逐字朝四个方向飞出**

```css
@keyframes s-hero-move-to-top    { from { transform: translateZ(0); }      to { transform: translate3d(0,-100%,0); } }
@keyframes s-hero-move-to-bottom { from { transform: translateZ(0); }      to { transform: translate3d(0,100%,0); } }
@keyframes s-hero-move-to-left   { from { transform: translateZ(0); }      to { transform: translate3d(100%,0,0); } }
@keyframes s-hero-move-to-right  { from { transform: translateZ(0); }      to { transform: translate3d(-100%,0,0); } }

.s-hero .s__title .to-top .char__inner { animation: 1s cubic-bezier(0.86,0,0.07,1) forwards s-hero-move-to-top; }
/* to-right / to-bottom / to-left 同理 */
```

- 标题被拆成**单个字符**，出页时每个字符朝自己分配到的方向飞出一整屏，`1s` + **`cubic-bezier(0.86, 0, 0.07, 1)`**（接近 expo-in-out 的强缓动）。
- 这是三站里唯一"离开页有内容级动画"的做法，也是它看起来最贵的原因。

**③ 停在画面外的整屏色块**

```css
.site-contrast-mask { position: fixed; top:0; left:0; width:100%; height:100%;
                      z-index: 20; background: rgb(244,12,63);
                      border-right: 1rem solid rgb(22,0,0);
                      /* 实测 transform: matrix(1,0,0,1,-1280,0) → 正好是自己的 -100% */ }
```

- 色块**预先停靠在画面外一个身位**（`translateX(-100%)`），需要时整体滑过。转场因此只有一次 `transform` 动画，成本极低。

**④ clip-path 多边形擦除**

```css
.s__award__mask { clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
                  transition: clip-path 0.8s cubic-bezier(0.86,0,0.07,1); }
.is-revealed .s__award__mask { clip-path: polygon(100% 0, 100% 0, 100% 100%, 100% 100%); }
```

- 多边形直接塌缩到右边缘 —— 一次**从左到右的擦除式揭示**。改四个顶点即可换成任意方向的擦除，是最省的遮罩动画。

**⑤ 精灵图掩膜"消散"**（彩蛋级细节）

```css
.a-object.is-vanishing .a__inner {
  mask: url("/images/sprite-vanish.png") left center / 3000% 100%;
  animation: 0.75s steps(29) forwards vanish;
}
@keyframes vanish { from { mask-position: left 0; } to { mask-position: right 0; } }
```

- 把 30 帧的消散图案拼成一张精灵图，用 `steps(29)` 逐帧播放掩膜位置 —— **一张图实现逐帧溶解**，比写 30 段 CSS 便宜得多。

### 2.3 cosmicbroth.com —— "系统式遮罩"

```css
.loading            { position: fixed; width:100%; height:100dvh; z-index: 10000000; }
.loading_codewall   { font-family: zpix; font-size: 2rem; letter-spacing: 1rem; height: 120%; }   /* 满屏 0/1 字符墙 */
.loading_middle_wavebox div { mask-image: linear-gradient(90deg, transparent, #000, transparent);
                              overflow: hidden; position: absolute; width: 10rem; }               /* 波形在窗口里穿行 */
.mask               { position: fixed; width:100%; height:100dvh; pointer-events:none;
                      background-color: rgba(214,12,12,.19);
                      animation: mask-*. 2s var(--ease_inout) infinite; }                            /* 周期性红色警示閃爍 */
._clip_cross        { clip-path: polygon(0 var(--gap_h), var(--gap_w) var(--gap_h), ... ); }        /* 四角缺口 HUD 边框 */
```

- 遮罩 = **代码字符墙 + 居中的图形 + 系统式文案**（`[LOADING] → ACCESS SYSTEM…`），整个切换过程被包装成"终端在启动"。
- 波形不是画出来的形状，而是**用 mask-image 做窗口 + 一条线在里面平移**。
- 红色警示闪层是**环境层**（`infinite` 循环、`pointer-events: none`），不是转场，但确立了"系统在运行"的气质。
- 滚动进度用 CSS 变量（`--l`、`--scroll-progress`）由 JS 灌入，样式侧只做插值。

---

## 3. 三个站共同的做法（提炼）

1. **一块常驻 DOM 的整屏遮罩**，而不是每次动态创建。切换时只改类名，浏览器不用新建节点，动画不会掉帧。
2. **遮罩预先停在画面外**（`translateY/X(±100%)`）或用一个可变的 `clip-path` 多边形，动画本身只有一次 `transform` / `clip-path` 变化。
3. **动画完全交给 CSS**，JS 只负责"什么时候加哪个类"。三站都是这个分工。
4. **统一一条强缓动**：`cubic-bezier(0.86, 0, 0.07, 1)`（wodniack 全站复用），时长 0.6–1s。
5. **遮罩上必有元素**：等宽文案（LOADING / ACCESS SYSTEM）、图形或字符墙 —— 否则纯黑遮罩会显得廉价。
6. **内容级动画**（只有 wodniack 做了）：进入/离开时标题逐字位移。这是"贵"的来源，也是最值得借鉴的一条。
7. **根状态类**管理全局：`is-loaded`（首屏门闸）、`is-transitioning`（转场中禁用交互、收起滚动条）。

---

## 4. 落到本项目的方案（E9 定稿）

结合本站"纯黑 + 细线 + 等宽微标签"的语言，采用如下组合：

| 借鉴来源 | 本项目的做法 |
| --- | --- |
| wodniack 的停靠色块 | 一块 `#curtain` 整屏幕布，平时停在 `translate3d(0,-100%,0)`；切换时向下扫过，再继续向下离开。**只有一个元素、只有一次 transform** |
| wodniack 的逐字飞出 | 首页标题拆成单字，每字按 `index % 4` 分配上/右/下/左四个方向，离开时朝各自方向飞出，归位时从反方向回来；`640ms cubic-bezier(.86,0,.07,1)` + 每字 `16ms` 级联 |
| jiejoe 的遮罩质感 | 幕布不是纯黑：用 `repeating-linear-gradient` 铺 44px 间隔的 1px 横线，下边缘压一条 `0.42` 透明度的发丝线作为"刀刃" |
| cosmicbroth 的系统文案 | 幕布中央显示等宽大写文案，且**随目标页变化**：`LOADING · HOME` / `LOADING · ARCHIVE` / `LOADING · WORK` / `LOADING · ABOUT` |
| wodniack 的根状态类 | `<html>` 上挂 `is-transitioning`：转场期间标题区 `pointer-events: none`、光标变为 `progress` |
| jiejoe 的常驻遮罩 | 幕布与文案都是**静态 DOM**，JS 只切 `is-cover` / `is-pass` / `no-anim` 三个类 |

**时序**（总计约 1.7s，介于 wodniack 的 1s 与 jiejoe 的整段加载之间）

| 时刻 | 动作 |
| --- | --- |
| 0ms | 标题逐字飞出；幕布开始自上而下扫过（620ms） |
| 700ms | 幕布完全覆盖 → 换页（文案、按钮、导航高亮、**背景图形**同时替换） |
| 800ms | 幕布继续向下离开（620ms） |
| 1600ms | 幕布复位到画面外、解锁交互；新页标题已从反方向逐字归位 |

**首次进入**：幕布以 `no-anim` 直接盖住整屏 → 向下离开，同时标题逐字归位（对应三站的进场遮罩）。

**减少动态效果**（`prefers-reduced-motion: reduce`）：幕布与逐字动画全部降为 1ms，退化成瞬时切换。

---

## 5. 明确不借鉴的部分

- **彩色遮罩**（jiejoe 的荧光绿块、wodniack 的洋红块）：与本站"纯黑白灰"的既定方向冲突。
- **逐帧精灵图消散**：效果很好，但需要额外制作精灵图资产；在只有线条的项目里性价比低。
- **红色警示闪层**：属于"发光色块"，已在 §4.5 的排除清单里。
- **Lenis 平滑滚动**：会接管原生滚动，与既定的可访问性红线冲突（不劫持滚动）。
