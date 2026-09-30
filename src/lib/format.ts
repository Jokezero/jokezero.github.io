/** 日期与文本格式化的小工具（构建期使用）。 */

/** 统一成 2026-09-18 这样的展示格式。 */
export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * 估算阅读时长（分钟）。
 * 中文按 350 字/分钟，拉丁按 220 词/分钟，两个语种混排时相加。
 */
export function readingMinutes(body: string): number {
  const cjk = (body.match(/[\u4e00-\u9fff]/g) ?? []).length;
  const latin = (
    body.replace(/[\u4e00-\u9fff]/g, " ").match(/[A-Za-z0-9]+/g) ?? []
  ).length;
  return Math.max(1, Math.round(cjk / 350 + latin / 220));
}
