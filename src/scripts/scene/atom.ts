/**
 * E7 原子结构 —— 文章列表页的整页背景。
 *
 * 三条互成 60° 的椭圆轨道（经典原子图标）+ 每圈一个带短拖尾的电子 + 中心原子核。
 * 常亮、铺满视口，靠低透明度保证不抢正文。
 */
import { LINE_WIDTH, type Scene } from "./core";

export function createAtom(): Scene {
  let coarse = false;

  return {
    init(api) {
      coarse = api.coarse;
    },
    frame(api, t, dim) {
      const { ctx } = api;
      const [dx, dy] = api.drift();
      const cx = api.width * 0.5 + dx;
      const cy = api.height * 0.5 + dy;
      const R = Math.min(api.width * 0.19, api.height * 0.3);
      const k = dim * 0.85;
      const spin = t * 0.16;
      const rx = R * 1.5;
      const ry = R * 0.58;
      const steps = coarse ? 64 : 96;

      for (let i = 0; i < 3; i += 1) {
        const rot = spin + (i * Math.PI) / 3;
        const co = Math.cos(rot);
        const si = Math.sin(rot);

        // 轨道
        ctx.beginPath();
        for (let j = 0; j <= steps; j += 1) {
          const a = (j / steps) * Math.PI * 2;
          const px = Math.cos(a) * rx;
          const py = Math.sin(a) * ry;
          const X = cx + px * co - py * si;
          const Y = cy + px * si + py * co;
          if (j === 0) ctx.moveTo(X, Y);
          else ctx.lineTo(X, Y);
        }
        ctx.strokeStyle = `rgba(255,255,255,${(0.17 * k).toFixed(3)})`;
        ctx.lineWidth = LINE_WIDTH;
        ctx.stroke();

        // 电子 + 短拖尾
        const ea = t * 0.85 + i * ((Math.PI * 2) / 3);
        for (let j = 0; j < 8; j += 1) {
          const q1 = ea - j * 0.05;
          const q2 = ea - (j + 1) * 0.05;
          const q1x = Math.cos(q1) * rx;
          const q1y = Math.sin(q1) * ry;
          const q2x = Math.cos(q2) * rx;
          const q2y = Math.sin(q2) * ry;
          ctx.beginPath();
          ctx.moveTo(cx + q1x * co - q1y * si, cy + q1x * si + q1y * co);
          ctx.lineTo(cx + q2x * co - q2y * si, cy + q2x * si + q2y * co);
          ctx.strokeStyle = `rgba(255,255,255,${((1 - j / 8) * 0.3 * k).toFixed(3)})`;
          ctx.lineWidth = LINE_WIDTH;
          ctx.stroke();
        }

        const hx = cx + Math.cos(ea) * rx * co - Math.sin(ea) * ry * si;
        const hy = cy + Math.cos(ea) * rx * si + Math.sin(ea) * ry * co;
        api.dot(hx, hy, 2.4, 0.85 * k);
      }

      // 原子核
      api.dot(cx, cy, 3.6, 0.9 * k);
      ctx.beginPath();
      ctx.arc(cx, cy, 11, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,255,255,${(0.14 * k).toFixed(3)})`;
      ctx.lineWidth = LINE_WIDTH;
      ctx.stroke();
    },
  };
}
