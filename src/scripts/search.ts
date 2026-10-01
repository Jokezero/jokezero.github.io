/**
 * 全文搜索：Pagefind 懒加载 + 结果渲染 + URL 同步。
 *
 * 由 app.ts 在首次加载与每次 SPA 换页后调用；
 * 元素都从当前 DOM 里现查，所以换页后能直接复用同一份逻辑。
 */
/** Pagefind 只在运行时从构建产物里加载，这里给最小可用类型 */
interface PagefindModule {
  init?: () => Promise<void>;
  search: (query: string) => Promise<{
    results: { data: () => Promise<PagefindItem> }[];
  }>;
}

interface PagefindItem {
  url: string;
  excerpt?: string;
  meta?: { title?: string };
}

export function initSearch(): (() => void) | void {
  const input = document.getElementById("search-input") as HTMLInputElement | null;
  const results = document.getElementById("search-results");
  const message = document.getElementById("search-message");

  if (input && results) {
    let pagefind: PagefindModule | null = null;
    let timer = 0;

    const load = async (): Promise<PagefindModule> => {
      if (!pagefind) {
        // 索引文件只在构建产物里存在（由构建末尾的 pagefind 步骤生成），
        // 所以用变量 + @vite-ignore：打包器既不解析它，也不会在构建期报错。
        const pagefindPath = "/pagefind/pagefind.js";
        pagefind = (await import(/* @vite-ignore */ pagefindPath)) as PagefindModule;
        if (typeof pagefind.init === "function") await pagefind.init();
      }
      return pagefind;
    };

    const render = async (query: string) => {
      results.replaceChildren();

      if (!query) {
        if (message) message.hidden = false;
        return;
      }

      try {
        const pf = await load();
        const found = await pf.search(query);
        const items = await Promise.all(
          found.results
            .slice(0, 20)
            .map((result: { data: () => Promise<PagefindItem> }) => result.data()),
        );

        if (message) message.hidden = items.length > 0;

        for (const item of items) {
          const link = document.createElement("a");
          link.href = item.url;
          link.className =
            "block border-b border-line-0 py-5 no-underline transition-colors hover:border-line-2";

          const title = document.createElement("h2");
          title.className = "text-[15px] font-normal text-fg-1";
          title.textContent = item.meta?.title ?? item.url;

          const excerpt = document.createElement("p");
          excerpt.className = "mt-2 text-[13px] leading-[1.8] text-fg-3";
          // Pagefind 自己转义过正文，这里只额外插入它生成的 <mark> 高亮
          excerpt.innerHTML = item.excerpt ?? "";

          link.append(title, excerpt);
          results.append(link);
        }
      } catch (error) {
        // 技术细节只留给控制台（本地开发时索引不存在会走到这里），
        // 页面上只说人话，不出现 pnpm / 构建之类的字眼。
        console.warn("[search] Pagefind 不可用：", error);
        if (message) {
          message.hidden = false;
          message.textContent = "搜索暂时不可用，请稍后重试。";
        }
      }
    };

    // 支持 /search/?q=关键词 直接带参进入
    const initial = new URLSearchParams(location.search).get("q");
    if (initial) {
      input.value = initial;
      render(initial);
    }

    const onInput = () => {
      clearTimeout(timer);
      const query = input.value.trim();
      timer = window.setTimeout(() => {
        const url = new URL(location.href);
        if (query) url.searchParams.set("q", query);
        else url.searchParams.delete("q");
        history.replaceState(null, "", url);
        render(query);
      }, 150);
    };

    input.addEventListener("input", onInput);

    // 换页时清掉待执行的防抖计时器（输入框随页面一起被替换）
    return () => {
      clearTimeout(timer);
      input.removeEventListener("input", onInput);
    };
  }
}
