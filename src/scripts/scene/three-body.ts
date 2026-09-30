/**
 * E8 三体运动 —— 首页背景。
 *
 * 真实的牛顿引力模拟：质量 3/4/5 的三颗恒星从 3-4-5 直角三角形顶点静止释放，
 * 在自身引力下反复近距离交会、互相甩动，轨道永不重复；有恒星被彻底抛出后
 * 系统崩解、淡出、以 ±3% 扰动重新播种，进入下一轮。
 *
 * 积分器：速度 Verlet，dt = 1/1000，软化长度 0.08，G = 1。
 * 呈现：径向渐变的发光光源点 + 短拖尾，低亮度，不抢文本。
 */
import type { Scene, SceneApi } from "./core";

const STEP = 1 / 1000;
const ESCAPE = 9;
const TRAIL_MAX = 200;
const TRAIL_MOVE = 0.006;
const FADE = 1.1;
/** 3-4-5 直角三角形的三个顶点 */
const BASE: [number, number][] = [
  [1, 3],
  [-2, -1],
  [1, -1],
];

export function createThreeBody(): Scene {
  const mass = [3, 4, 5];
  const soft2 = 0.08 * 0.08;

  let x: number[] = [];
  let y: number[] = [];
  let vx = [0, 0, 0];
  let vy = [0, 0, 0];
  let trail: [number, number][][] = [[], [], []];
  const accX = [0, 0, 0];
  const accY = [0, 0, 0];

  let last = 0;
  let accum = 0;
  let simTime = 0;
  let vis = 0;
  let phase: "birth" | "run" | "collapse" = "birth";
  let escaped = false;
  let inited = false;
  let coarse = false;

  function init(first: boolean): void {
    const jitter = first ? 0 : 0.03;
    x = [];
    y = [];
    vx = [0, 0, 0];
    vy = [0, 0, 0];
    for (let i = 0; i < 3; i += 1) {
      x.push(BASE[i][0] * (1 + (Math.random() - 0.5) * jitter * 2));
      y.push(BASE[i][1] * (1 + (Math.random() - 0.5) * jitter * 2));
    }
    trail = [[], [], []];
    accum = 0;
    last = 0;
    simTime = 0;
    escaped = false;
    vis = 0;
    phase = "birth";
    inited = true;
  }

  function accel(px: number[], py: number[], outX: number[], outY: number[]): void {
    for (let i = 0; i < 3; i += 1) {
      outX[i] = 0;
      outY[i] = 0;
    }
    for (let i = 0; i < 3; i += 1) {
      for (let j = i + 1; j < 3; j += 1) {
        const dx = px[j] - px[i];
        const dy = py[j] - py[i];
        const d2 = dx * dx + dy * dy + soft2;
        const inv = 1 / (d2 * Math.sqrt(d2));
        outX[i] += mass[j] * dx * inv;
        outY[i] += mass[j] * dy * inv;
        outX[j] -= mass[i] * dx * inv;
        outY[j] -= mass[i] * dy * inv;
      }
    }
  }

  function step(dt: number): void {
    accel(x, y, accX, accY);
    for (let i = 0; i < 3; i += 1) {
      x[i] += vx[i] * dt + 0.5 * accX[i] * dt * dt;
      y[i] += vy[i] * dt + 0.5 * accY[i] * dt * dt;
      vx[i] += 0.5 * accX[i] * dt;
      vy[i] += 0.5 * accY[i] * dt;
    }
    accel(x, y, accX, accY);
    for (let i = 0; i < 3; i += 1) {
      vx[i] += 0.5 * accX[i] * dt;
      vy[i] += 0.5 * accY[i] * dt;
    }
  }

  /** 按真实流逝时间做固定步长积分；崩解后淡出并重新播种 */
  function advance(t: number, speed: number): void {
    if (!inited) init(true);
    if (!last || t < last) {
      last = t;
      return;
    }
    const real = Math.min(0.1, t - last);
    last = t;
    simTime += real * speed;

    if (phase === "birth") {
      vis = Math.min(1, vis + real / FADE);
      if (vis >= 1) phase = "run";
    } else if (phase === "collapse") {
      vis = Math.max(0, vis - real / FADE);
      if (vis <= 0) init(false);
    }

    accum += real * speed;
    let guard = 0;
    while (accum >= STEP && guard < 400) {
      step(STEP);
      accum -= STEP;
      guard += 1;
    }
    if (guard >= 400) accum = 0;

    if (phase === "run") {
      let maxR = 0;
      for (let i = 0; i < 3; i += 1) {
        const r = Math.hypot(x[i], y[i]);
        if (r > maxR) maxR = r;
      }
      // 有恒星被彻底甩出 = 系统崩解；超时也强制进入下一轮
      if ((maxR > ESCAPE && !escaped) || simTime > 150) {
        escaped = true;
        phase = "collapse";
      }
    }

    // 轨迹按位移采样：近距离高速掠过时才密，远处飞行时不至于稀疏
    for (let k = 0; k < 3; k += 1) {
      const tr = trail[k];
      const prev = tr.length ? tr[tr.length - 1] : null;
      if (!prev || Math.hypot(x[k] - prev[0], y[k] - prev[1]) > TRAIL_MOVE) {
        tr.push([x[k], y[k]]);
        if (tr.length > TRAIL_MAX) tr.splice(0, 300);
      }
    }
  }

  function drawTrails(
    api: SceneApi,
    scale: number,
    cx: number,
    cy: number,
    alpha: number,
    chunks: number,
  ): void {
    const { ctx } = api;
    for (let i = 0; i < 3; i += 1) {
      const tr = trail[i];
      const n = tr.length;
      if (n < 3) continue;
      for (let seg = 0; seg < chunks; seg += 1) {
        const from = Math.floor((n - 1) * (seg / chunks));
        const to = Math.floor((n - 1) * ((seg + 1) / chunks));
        if (to - from < 1) continue;
        ctx.beginPath();
        for (let k = from; k <= to; k += 1) {
          const px = cx + tr[k][0] * scale;
          const py = cy + tr[k][1] * scale;
          if (k === from) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        const fade = (seg + 1) / chunks;
        ctx.strokeStyle = `rgba(255,255,255,${(alpha * fade * fade).toFixed(3)})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }

  function drawSuns(
    api: SceneApi,
    scale: number,
    cx: number,
    cy: number,
    alpha: number,
  ): void {
    const { ctx } = api;
    const cores: [number, number, number][] = [];
    for (let i = 0; i < 3; i += 1) {
      cores.push([cx + x[i] * scale, cy + y[i] * scale, 1.4 + 1.1 * (mass[i] / 5)]);
    }

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const core of cores) {
      const [px, py, r] = core;
      const g = ctx.createRadialGradient(px, py, 0, px, py, r * 11);
      g.addColorStop(0, `rgba(255,255,255,${(0.55 * alpha).toFixed(3)})`);
      g.addColorStop(0.18, `rgba(255,255,255,${(0.2 * alpha).toFixed(3)})`);
      g.addColorStop(0.5, `rgba(255,255,255,${(0.05 * alpha).toFixed(3)})`);
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(px, py, r * 11, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    for (const [px, py, r] of cores) {
      api.dot(px, py, r, Math.min(1, alpha * 1.15));
    }
  }

  return {
    init(api) {
      coarse = api.coarse;
    },
    frame(api, t, dim) {
      advance(t, 1);
      const visible = api.reduced ? 1 : vis;
      if (visible <= 0.01) return;

      const narrow = api.width < 900;
      const [dx, dy] = api.drift();
      const cx = api.width * 0.5 + dx;
      const cy = api.height * 0.5 + dy + api.parallax();
      const scale = Math.min(
        api.width * (narrow ? 0.1 : 0.075),
        api.height * (narrow ? 0.16 : 0.13),
      );
      const k = visible * dim;

      drawTrails(api, scale, cx, cy, 0.17 * k, coarse ? 8 : 10);
      drawSuns(api, scale, cx, cy, 0.8 * k);
      api.edgeScrim();
    },
  };
}
