/**
 * 站点版本号：`v<年>.<月>.<当月功能更新次数>.<当月修复与维护次数>`
 *
 * 例：`v2026.09.4.12` = 2026 年 9 月的第 4 次功能更新、第 12 次修复/维护。
 *
 * 为什么用这套规则：
 *   · 只读版本号就知道"这是哪个月的、第几次更新"
 *   · **完全由 git 历史自动算出**，不需要手工递增（手工的迟早会忘记）
 *   · 同一次提交重复构建 → 版本号不变（可复现）
 *   · 每日定时重建不产生新提交 → 版本号不变，只有页脚的 Build 日期会变
 *
 * 分类规则（与仓库里的提交习惯一致）：提交信息以 `feat` 开头的算"功能更新"（大的那一位），
 * 其余（fix / docs / chore / test / style…）算"修复与维护"（小的那一位）。
 *
 * 注意：需要完整的 git 历史，所以 CI 里 `actions/checkout` 必须带 `fetch-depth: 0`。
 * 本地开发、浅克隆或从压缩包构建时取不到历史 → 退化成 `v<年>.<月>.0.0`，不影响构建。
 */
import { execFileSync } from "node:child_process";

export interface SiteVersion {
  year: string;
  month: string;
  /** 当月功能更新次数 */
  major: number;
  /** 当月修复与维护次数 */
  minor: number;
  /** 展示用：v2026.09.4.12 */
  label: string;
  /** 是否读到了 git 历史 */
  fromGit: boolean;
}

const FEATURE_PATTERN = /^feat(\(|!|:)/;

function commitSubjectsSince(since: string): string[] | null {
  try {
    const output = execFileSync("git", ["log", `--since=${since}`, "--pretty=%s"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return output
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return null;
  }
}

function computeVersion(now = new Date()): SiteVersion {
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const subjects = commitSubjectsSince(`${year}-${month}-01 00:00:00`);

  if (!subjects || subjects.length === 0) {
    return {
      year,
      month,
      major: 0,
      minor: 0,
      label: `v${year}.${month}.0.0`,
      fromGit: false,
    };
  }

  const major = subjects.filter((subject) => FEATURE_PATTERN.test(subject)).length;
  const minor = subjects.length - major;

  return {
    year,
    month,
    major,
    minor,
    label: `v${year}.${month}.${major}.${minor}`,
    fromGit: true,
  };
}

export const SITE_VERSION = computeVersion();
