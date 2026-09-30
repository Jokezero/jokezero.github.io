/**
 * E12 双摆 —— 关于页的整页背景。
 *
 * 两个质点由刚性杆相连，末端轨迹是经典的混沌花瓣。
 * 积分器：四阶龙格-库塔（RK4），dt = 1/600 —— 双摆对积分器很敏感，
 * RK4 才能让能量长期不漂；轨迹缓存 700 点。
 */
import { LINE_WIDTH, type Scene } from "./core";

const DT = 1 / 600;
const G = 9.81;

export function createPendulum(): Scene {
  let a1 = 1.7;
  let a2 = -0.5;
  let w1 = 0;
  let w2 = 0;
  let trail: [number, number][] = [];
  let accum = 0;
  let last = 0;
  let inited = false;

  function deriv(s: number[]): number[] {
    const [t1, t2, o1, o2] = s;
    const d = t1 - t2;
    const den = 3 - Math.cos(2 * d);
    return [
      o1,
      o2,
      (-G * 3 * Math.sin(t1) -
        G * Math.sin(t1 - 2 * t2) -
        2 * Math.sin(d) * (o2 * o2 + o1 * o1 * Math.cos(d))) /
        den,
      (2 * Math.sin(d) * (2 * o1 * o1 + 2 * G * Math.cos(t1) + o2 * o2 * Math.cos(d))) /
        den,
    ];
  }

  function step(dt: number): void {
    const s = [a1, a2, w1, w2];
    const k1 = deriv(s);
    const k2 = deriv(s.map((v, i) => v + (k1[i] * dt) / 2));
    const k3 = deriv(s.map((v, i) => v + (k2[i] * dt) / 2));
    const k4 = deriv(s.map((v, i) => v + k3[i] * dt));
    for (let i = 0; i < 4; i += 1) {
      s[i] += (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
    }
    a1 = s[0];
    a2 = s[1];
    w1 = s[2];
    w2 = s[3];
  }

  function advance(t: number): void {
    if (!inited) {
      inited = true;
      last = t;
      trail = [];
      return;
    }
    if (t < last) last = t;
    const real = Math.min(0.1, t - last);
    last = t;
    accum += real * 1.1;
    let guard = 0;
    while (accum >= DT && guard < 260) {
      step(DT);
      accum -= DT;
      guard += 1;
    }
    if (guard >= 260) accum = 0;
    trail.push([Math.sin(a1) + Math.sin(a2), Math.cos(a1) + Math.cos(a2)]);
    if (trail.length > 700) trail.splice(0, 100);
  }

  return {
    frame(api, t, dim) {
      advance(t);
      const { ctx } = api;
      const [dx, dy] = api.drift();
      const cx = api.width * 0.5 + dx;
      const cy = api.height * 0.34 + dy;
      const scale = Math.min(api.height * 0.26, api.width * 0.14);
      const k = dim * 0.9;
      const n = trail.length;
      const chunks = 12;

      for (let i = 0; i < chunks; i += 1) {
        const from = Math.floor((n - 1) * (i / chunks));
        const to = Math.floor((n - 1) * ((i + 1) / chunks));
        if (to - from < 1) continue;
        ctx.beginPath();
        for (let j = from; j <= to; j += 1) {
          const x = cx + trail[j][0] * scale;
          const y = cy + trail[j][1] * scale;
          if (j === from) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        const fade = (i + 1) / chunks;
        ctx.strokeStyle = `rgba(255,255,255,${(0.26 * k * fade * fade).toFixed(3)})`;
        ctx.lineWidth = LINE_WIDTH;
        ctx.stroke();
      }

      const p1x = cx + Math.sin(a1) * scale;
      const p1y = cy + Math.cos(a1) * scale;
      const p2x = cx + (Math.sin(a1) + Math.sin(a2)) * scale;
      const p2y = cy + (Math.cos(a1) + Math.cos(a2)) * scale;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(p1x, p1y);
      ctx.lineTo(p2x, p2y);
      ctx.strokeStyle = `rgba(255,255,255,${(0.5 * k).toFixed(3)})`;
      ctx.lineWidth = LINE_WIDTH;
      ctx.stroke();

      api.dot(cx, cy, 2, 0.5 * k);
      api.dot(p1x, p1y, 3, 0.78 * k);
      api.dot(p2x, p2y, 3.6, 0.95 * k);
    },
  };
}
