/**
 * 文章列表：多标签 OR 筛选 + 命中数排序 + 标签计数 + 空状态。
 *
 * 由 app.ts 在首次加载与每次 SPA 换页后调用；
 * 元素都从当前 DOM 里现查，所以换页后能直接复用同一份逻辑。
 */
export function initBlogIndex(): void {
  const root = document.getElementById("blog-index");

  if (root) {
    const list = root.querySelector<HTMLUListElement>("#post-list")!;
    const rows = Array.from(root.querySelectorAll<HTMLLIElement>(".post-row"));
    const search = root.querySelector<HTMLInputElement>("#post-search");
    const tagButtons = Array.from(
      root.querySelectorAll<HTMLButtonElement>("#tag-filter [data-tag]"),
    );
    const emptyPosts = root.querySelector<HTMLElement>("#empty-posts");
    const emptyMatch = root.querySelector<HTMLElement>("#empty-match");

    // 状态：已选标签集合（多选，OR 语义）+ 搜索词
    const active = new Set<string>(
      JSON.parse(root.dataset.initialTags ?? "[]") as string[],
    );

    const tagsOf = (row: HTMLLIElement) => (row.dataset.tags ?? "").split(",");

    // 命中判定：标签"任一命中即显示"（OR）；搜索是标题子串、不区分大小写
    const isMatch = (row: HTMLLIElement, tagSet: Set<string>, query: string) => {
      const tags = tagsOf(row);
      const tagOk = tagSet.size === 0 || tags.some((tag) => tagSet.has(tag));
      const queryOk = !query || (row.dataset.title ?? "").includes(query);
      return tagOk && queryOk;
    };

    // 匹配度 = 命中的已选标签数量（用于排序）
    const hitCount = (row: HTMLLIElement, tagSet: Set<string>) =>
      tagsOf(row).filter((tag) => tagSet.has(tag)).length;

    const apply = () => {
      const query = (search?.value ?? "").trim().toLowerCase();

      const visible = rows.filter((row) => isMatch(row, active, query));

      // 排序：命中标签多的在前 → 日期倒序 → 标题，保证顺序稳定
      visible.sort((a, b) => {
        const byHits = hitCount(b, active) - hitCount(a, active);
        if (byHits !== 0) return byHits;
        const byDate = (b.dataset.date ?? "").localeCompare(a.dataset.date ?? "");
        if (byDate !== 0) return byDate;
        return (a.dataset.title ?? "").localeCompare(b.dataset.title ?? "");
      });

      const visibleSet = new Set(visible);
      for (const row of rows) {
        const show = visibleSet.has(row);
        row.hidden = !show;
        if (show) row.classList.remove("is-enter");
      }

      visible.forEach((row, index) => {
        // 第一条可见项没有上分隔线
        row.classList.toggle("is-first", index === 0);
        list.append(row);
      });

      // 重排后给新出现的行一次淡入，让"多出来的几条"被看见
      requestAnimationFrame(() => {
        visible.forEach((row) => row.classList.add("is-enter"));
      });

      // 标签计数按当前选择重算："点一下会得到几条"
      for (const button of tagButtons) {
        const tag = button.dataset.tag ?? "";
        const hypothetical = tag === "" ? new Set<string>() : new Set([...active, tag]);
        const count = rows.filter((row) => isMatch(row, hypothetical, query)).length;
        const countEl = button.querySelector("[data-count]");
        if (countEl) countEl.textContent = String(count);
        button.setAttribute(
          "aria-pressed",
          String(tag === "" ? active.size === 0 : active.has(tag)),
        );
      }

      const nothingAtAll = rows.length === 0;
      if (emptyPosts) emptyPosts.hidden = !nothingAtAll;
      if (emptyMatch) emptyMatch.hidden = nothingAtAll || visible.length > 0;
      list.hidden = visible.length === 0;
    };

    for (const button of tagButtons) {
      button.addEventListener("click", () => {
        const tag = button.dataset.tag ?? "";
        if (tag === "") {
          active.clear();
        } else if (active.has(tag)) {
          active.delete(tag);
        } else {
          active.add(tag);
        }
        apply();
      });
    }

    search?.addEventListener("input", apply);
    apply();
  }
}
