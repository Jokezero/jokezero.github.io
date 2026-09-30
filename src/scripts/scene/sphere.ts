/**
 * E11 线框球 —— 项目列表页的整页背景。
 *
 * 经纬网格球体绕倾斜轴自转，按深度分段着色形成体积感，
 * 球面上有 7 个缓慢呼吸的数据点。整页、常亮。
 */
import { LINE_WIDTH, type Scene } from "./core";

export function createSphere(): Scene {
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
      const R = Math.min(api.width * 0.24, api.height * 0.4);
      const k = dim * 0.95;
      const spin = t * 0.2;
      const tilt = 0.45;
      const cosS = Math.cos(spin);
      const sinS = Math.sin(spin);
      const cosT = Math.cos(tilt);
      const sinT = Math.sin(tilt);

      // 中心柔光：先画，避免冲淡线条
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.7);
      glow.addColorStop(0, `rgba(255,255,255,${(0.05 * k).toFixed(3)})`);
      glow.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(cx - R * 1.7, cy - R * 1.7, R * 3.4, R * 3.4);

      const project = (px: number, py: number, pz: number): [number, number, number] => {
        const x1 = px * cosS - pz * sinS;
        const z1 = px * sinS + pz * cosS;
        const y1 = py * cosT - z1 * sinT;
        const z2 = py * sinT + z1 * cosT;
        const s = 1.9 / (1.9 + z2);
        return [cx + x1 * R * s, cy + y1 * R * s, z2];
      };

      // 一条闭合折线按深度切成 8 段分别着色，形成球体积感
      const drawRing = (pts: [number, number, number][], base: number): void => {
        const segs = coarse ? 6 : 8;
        for (let c = 0; c < segs; c += 1) {
          const from = Math.floor((pts.length - 1) * (c / segs));
          const to = Math.floor((pts.length - 1) * ((c + 1) / segs));
          if (to - from < 1) continue;
          let zSum = 0;
          ctx.beginPath();
          for (let j = from; j <= to; j += 1) {
            if (j === from) ctx.moveTo(pts[j][0], pts[j][1]);
            else ctx.lineTo(pts[j][0], pts[j][1]);
            zSum += pts[j][2];
          }
          const zAvg = (zSum / (to - from + 1) + 1) / 2;
          ctx.strokeStyle = `rgba(255,255,255,${(base * (0.3 + 0.9 * zAvg) * k).toFixed(3)})`;
          ctx.lineWidth = LINE_WIDTH;
          ctx.stroke();
        }
      };

      // 纬线
      const latCount = coarse ? 6 : 8;
      const lonCount = coarse ? 8 : 12;
      const latSteps = coarse ? 48 : 64;
      const lonSteps = coarse ? 36 : 48;

      for (let i = 1; i < latCount + 1; i += 1) {
        const phi = (i / (latCount + 1)) * Math.PI;
        const py = Math.cos(phi);
        const pr = Math.sin(phi);
        const pts: [number, number, number][] = [];
        for (let j = 0; j <= latSteps; j += 1) {
          const a = (j / latSteps) * Math.PI * 2;
          pts.push(project(Math.cos(a) * pr, py, Math.sin(a) * pr));
        }
        drawRing(pts, 0.15);
      }

      // 经线
      for (let i = 0; i < lonCount; i += 1) {
        const lon = (i / lonCount) * Math.PI * 2;
        const cl = Math.cos(lon);
        const sl = Math.sin(lon);
        const pts: [number, number, number][] = [];
        for (let j = 0; j <= lonSteps; j += 1) {
          const th = (j / lonSteps) * Math.PI;
          pts.push(project(Math.sin(th) * cl, Math.cos(th), Math.sin(th) * sl));
        }
        drawRing(pts, 0.12);
      }

      // 赤道略亮
      const equator: [number, number, number][] = [];
      for (let j = 0; j <= lonSteps + 8; j += 1) {
        const e = (j / (lonSteps + 8)) * Math.PI * 2;
        equator.push(project(Math.cos(e), 0, Math.sin(e)));
      }
      drawRing(equator, 0.26);

      // 球面上的数据点（缓慢呼吸）
      for (let i = 0; i < 7; i += 1) {
        const la = i * 2.399 + t * 0.05;
        const ph = Math.acos(1 - 2 * ((i + 0.5) / 7));
        const sp = project(
          Math.sin(ph) * Math.cos(la),
          Math.cos(ph),
          Math.sin(ph) * Math.sin(la),
        );
        const pulse = 0.55 + 0.45 * Math.sin(t * 1.4 + i);
        api.dot(sp[0], sp[1], 2.2, (0.3 + 0.5 * pulse) * k);
      }
    },
  };
}
