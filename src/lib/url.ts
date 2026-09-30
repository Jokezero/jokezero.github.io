/**
 * 链接小工具。
 *
 * 全站约定：站外链接一律新开标签页，并带 rel="noopener noreferrer"
 * （docs/02-build-and-deploy.md 的 P2 验收项，这里先集中成函数，避免每处重复判断）。
 */

export function isExternal(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

/** 站外链接需要的属性；站内链接返回空对象。 */
export function externalAttrs(href: string) {
  return isExternal(href) ? { target: "_blank", rel: "noopener noreferrer" } : {};
}
