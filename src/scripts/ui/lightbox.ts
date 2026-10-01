/**
 * 全屏图片灯箱：点击放大、方向键切换、Esc 关闭、焦点还原。
 *
 * 由 app.ts 在首次加载与每次 SPA 换页后调用；
 * 元素都从当前 DOM 里现查，所以换页后能直接复用同一份逻辑。
 */
export function initLightbox(): void {
  const images = Array.from(
    document.querySelectorAll<HTMLImageElement>("[data-lightbox] img"),
  );
  const dialog = document.getElementById("lightbox") as HTMLDialogElement | null;

  // 没有图片、或浏览器不支持原生 dialog → 整段逻辑不启动。
  if (images.length > 0 && dialog?.showModal) {
    const modal = dialog as HTMLDialogElement;
    const stage = modal.querySelector<HTMLImageElement>("#lightbox-image")!;
    const counter = modal.querySelector("#lightbox-counter")!;
    let index = 0;
    let lastTrigger: HTMLElement | null = null;

    // 把每张图包进一个按钮，键盘可用、点击热区也正确。
    images.forEach((image, i) => {
      const trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = "lightbox-trigger";
      trigger.setAttribute("aria-label", `放大图片：${image.alt || i + 1}`);
      image.replaceWith(trigger);
      trigger.append(image);
      trigger.addEventListener("click", () => open(i, trigger));
    });

    function render() {
      const image = images[index];
      stage.src = image.currentSrc || image.src;
      stage.alt = image.alt;
      counter.textContent = `${String(index + 1).padStart(2, "0")} / ${String(images.length).padStart(2, "0")}`;
    }

    function open(i: number, trigger: HTMLElement) {
      index = i;
      lastTrigger = trigger;
      render();
      modal.showModal();
    }

    function step(delta: number) {
      index = (index + delta + images.length) % images.length;
      render();
    }

    modal.querySelector("#lightbox-prev")?.addEventListener("click", () => step(-1));
    modal.querySelector("#lightbox-next")?.addEventListener("click", () => step(1));

    modal.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") step(-1);
      if (event.key === "ArrowRight") step(1);
    });

    // 点击图片以外的空白处关闭（Esc 由浏览器原生处理）。
    modal.addEventListener("click", (event) => {
      if (event.target === modal) modal.close();
    });

    // 关闭后把焦点还给触发的图片 —— 键盘用户不会"掉到文档开头"。
    modal.addEventListener("close", () => {
      lastTrigger?.focus();
    });
  }
}
