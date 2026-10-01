/**
 * 项目列表：搜索 / 技术栈筛选 / 分页 / 每页数量 / 滚轮翻页。
 *
 * 由 app.ts 在首次加载与每次 SPA 换页后调用；
 * 元素都从当前 DOM 里现查，所以换页后能直接复用同一份逻辑。
 */
export function initProjectShelf(): (() => void) | void {
  const root = document.getElementById("project-shelf");

  if (root) {
    const grid = root.querySelector<HTMLElement>("#project-grid")!;
    const items = Array.from(root.querySelectorAll<HTMLElement>(".proj-item"));
    const search = root.querySelector<HTMLInputElement>("#project-search");
    const tagButtons = Array.from(
      root.querySelectorAll<HTMLButtonElement>("#stack-filter [data-tag]"),
    );
    const sizeButtons = Array.from(
      root.querySelectorAll<HTMLButtonElement>("#size-list [data-size]"),
    );
    const pageList = root.querySelector<HTMLElement>("#page-list")!;
    const emptyAll = root.querySelector<HTMLElement>("#empty-projects");
    const emptyMatch = root.querySelector<HTMLElement>("#empty-project-match");

    const active = new Set<string>();
    let perPage = Number(root.dataset.perPage ?? 6);
    let page = 0;
    let switching = false;

    const tagsOf = (item: HTMLElement) => (item.dataset.tags ?? "").split(",");

    const isMatch = (item: HTMLElement, tagSet: Set<string>, query: string) => {
      const tags = tagsOf(item);
      const tagOk = tagSet.size === 0 || tags.some((tag) => tagSet.has(tag));
      const queryOk = !query || (item.dataset.title ?? "").includes(query);
      return tagOk && queryOk;
    };

    const hitCount = (item: HTMLElement, tagSet: Set<string>) =>
      tagsOf(item).filter((tag) => tagSet.has(tag)).length;

    /** 当前可见集合：OR 筛选 + 命中数排序（并列按日期倒序、再按标题） */
    const visibleItems = () => {
      const query = (search?.value ?? "").trim().toLowerCase();
      return items
        .filter((item) => isMatch(item, active, query))
        .sort((a, b) => {
          const byHits = hitCount(b, active) - hitCount(a, active);
          if (byHits !== 0) return byHits;
          const byDate = (b.dataset.date ?? "").localeCompare(a.dataset.date ?? "");
          if (byDate !== 0) return byDate;
          return (a.dataset.title ?? "").localeCompare(b.dataset.title ?? "");
        });
    };

    const pageCount = (total: number) => Math.max(1, Math.ceil(total / perPage));

    const renderPageButtons = (total: number) => {
      pageList.replaceChildren();
      for (let i = 0; i < total; i += 1) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "text-btn";
        button.dataset.page = String(i);
        button.textContent = String(i + 1).padStart(2, "0");
        button.setAttribute("aria-current", i === page ? "true" : "false");
        button.addEventListener("click", () => goTo(i));
        pageList.append(button);
      }
    };

    const paint = (animate: boolean) => {
      const visible = visibleItems();
      const total = pageCount(visible.length);
      page = Math.min(page, total - 1);

      const start = page * perPage;
      const slice = visible.slice(start, start + perPage);
      const shown = new Set(slice);

      for (const item of items) {
        const show = shown.has(item);
        item.hidden = !show;
        item.classList.remove("is-enter");
      }

      slice.forEach((item, index) => {
        const indexEl = item.querySelector("[data-index]");
        if (indexEl) indexEl.textContent = String(start + index + 1).padStart(2, "0");
        grid.append(item);
        if (animate) {
          item.style.setProperty("--enter-delay", `${index * 55}ms`);
          item.classList.add("is-enter");
        }
      });

      renderPageButtons(total);

      const nothingAtAll = items.length === 0;
      if (emptyAll) emptyAll.hidden = !nothingAtAll;
      if (emptyMatch) emptyMatch.hidden = nothingAtAll || slice.length > 0;
      grid.hidden = slice.length === 0;

      for (const button of tagButtons) {
        const tag = button.dataset.tag ?? "";
        button.setAttribute(
          "aria-pressed",
          String(tag === "" ? active.size === 0 : active.has(tag)),
        );
      }
    };

    const goTo = (next: number) => {
      const total = pageCount(visibleItems().length);
      if (next < 0 || next >= total || switching) return;
      switching = true;
      page = next;
      paint(true);
      // 让"旧条目滑出 + 新条目逐条归位"播完再解除屏蔽（§4.5.3）
      setTimeout(
        () => {
          switching = false;
        },
        360 + 55 * perPage,
      );
    };

    for (const button of tagButtons) {
      button.addEventListener("click", () => {
        const tag = button.dataset.tag ?? "";
        if (tag === "") active.clear();
        else if (active.has(tag)) active.delete(tag);
        else active.add(tag);

        // 重排后页码归零，否则会停在一个不存在的页（06-content-model.md §4）
        page = 0;
        paint(true);
      });
    }

    for (const button of sizeButtons) {
      button.addEventListener("click", () => {
        perPage = Number(button.dataset.size ?? 6);
        page = 0;
        for (const other of sizeButtons) {
          other.setAttribute("aria-pressed", String(other === button ? "true" : "false"));
        }
        paint(false);
      });
    }

    search?.addEventListener("input", () => {
      page = 0;
      paint(false);
    });

    // ── 滚轮翻页：本页任意位置滚动都生效，但到边界就把滚动交还给页面 ──
    let lastWheel = 0;

    // 具名处理函数：换页时（SPA 导航）必须摘掉，否则每换一次页就多挂一个监听
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey) return; // 缩放手势不拦截
      if (matchMedia("(hover: none)").matches) return; // 触屏走页码按钮
      if (Math.abs(event.deltaY) < 4) return;
      // 页面切换进行中：交还给页面，别让触控板惯性触发第二次动效（§10 第 4 条坑）
      if (document.documentElement.classList.contains("is-transitioning")) return;

      const total = pageCount(visibleItems().length);
      if (total <= 1) return; // 只有一页 = 不拦，正常滚动页面

      // 切换动画进行中直接返回，避免惯性滚动又触发一次（§10 常见坑）
      if (switching) return;

      const direction = event.deltaY > 0 ? 1 : -1;
      const next = page + direction;
      if (next < 0 || next >= total) return; // 首页/末页：交还给页面滚动

      const now = Date.now();
      if (now - lastWheel < 780) {
        event.preventDefault();
        return;
      }

      lastWheel = now;
      event.preventDefault();
      goTo(next);
    };

    addEventListener("wheel", onWheel, { passive: false });

    paint(false);

    return () => {
      removeEventListener("wheel", onWheel);
    };
  }
}
