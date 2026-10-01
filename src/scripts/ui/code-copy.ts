/**
 * 代码块的语言标签与复制按钮（渐进增强）。
 *
 * 由 app.ts 在首次加载与每次 SPA 换页后调用；
 * 元素都从当前 DOM 里现查，所以换页后能直接复用同一份逻辑。
 */
export function initCodeCopy(): void {
  const blocks = Array.from(document.querySelectorAll<HTMLPreElement>(".prose pre"));

  blocks.forEach((pre) => {
    const code = pre.querySelector("code");
    if (!code) return;

    const language = pre.getAttribute("data-language") ?? "";
    pre.classList.add("has-code-bar");

    const bar = document.createElement("div");
    bar.className = "code-bar";

    const label = document.createElement("span");
    label.className = "code-lang";
    label.textContent = language;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "code-copy";
    button.textContent = "COPY";
    button.setAttribute("aria-label", "复制这段代码");

    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(code.textContent ?? "");
        button.textContent = "COPIED";
      } catch {
        button.textContent = "FAILED";
      }
      setTimeout(() => {
        button.textContent = "COPY";
      }, 1200);
    });

    bar.append(label, button);
    pre.prepend(bar);
  });
}
