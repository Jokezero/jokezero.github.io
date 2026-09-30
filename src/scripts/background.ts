/**
 * 背景模拟的挂载入口。
 *
 * 画布用 `data-scene` 指定模拟类型、`data-mode` 指定形态：
 *   hero = 首屏内画布（随滚动压暗、做 5% 视差）
 *   page = 整页固定画布（常亮铺满视口）
 *
 * 说明：四个模拟都在这里**静态导入**。原因是 Astro 会把体积小的客户端脚本
 * 内联进 HTML，而内联后经过打包器包装的动态 import 会失效（详见 ADR-0011 的
 * 同款坑）。代价是每页多约 4 KB 的内联脚本，换来实现稳定 —— 仍在 40 KB 预算内。
 */
import { mountScene } from "./scene/core";
import { createThreeBody } from "./scene/three-body";
import { createAtom } from "./scene/atom";
import { createSphere } from "./scene/sphere";
import { createPendulum } from "./scene/pendulum";

export function mountBackgrounds(): void {
  const canvases = document.querySelectorAll<HTMLCanvasElement>("canvas[data-scene]");

  canvases.forEach((canvas) => {
    const kind = canvas.dataset.scene;
    const mode = canvas.dataset.mode === "page" ? "page" : "hero";

    const scene =
      kind === "atom"
        ? createAtom()
        : kind === "sphere"
          ? createSphere()
          : kind === "pendulum"
            ? createPendulum()
            : kind === "three-body"
              ? createThreeBody()
              : null;

    if (!scene) return;
    mountScene(canvas, scene, { mode });
  });
}
