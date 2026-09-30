#!/usr/bin/env node
/**
 * 内部死链检查：pnpm links
 *
 * 做法：扫描 dist/ 下所有 HTML，取出 href / src，只校验**站内**链接
 * （/xxx、./xxx、xxx），确认目标在构建产物里真实存在（目录 URL 视为 index.html）。
 * 站外链接不发请求：离线可跑，也不会因为别人的站点抖动而误报。
 *
 * 之所以不装链接检查工具：这个脚本不到 80 行、零依赖，规则完全贴合本站
 * （用户站挂根路径、目录式 URL、忽略锚点与查询串）。
 */
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const DIST = "dist";

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else files.push(full);
  }
  return files;
}

async function exists(target) {
  try {
    const info = await stat(target);
    return info.isFile();
  } catch {
    return false;
  }
}

const htmlFiles = (await walk(DIST)).filter((file) => file.endsWith(".html"));
const problems = [];

for (const file of htmlFiles) {
  const html = await readFile(file, "utf8");
  const page = "/" + path.relative(DIST, file);
  const refs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((match) => match[1]);
  const baseDir = path.dirname(file);

  for (const raw of refs) {
    const ref = raw.trim();
    if (
      !ref ||
      ref.startsWith("#") ||
      ref.startsWith("data:") ||
      ref.startsWith("mailto:") ||
      ref.startsWith("tel:") ||
      ref.startsWith("//") ||
      /^[a-z]+:\/\//i.test(ref)
    ) {
      continue;
    }

    const clean = ref.split("#")[0].split("?")[0];
    if (!clean) continue;

    // 以 / 开头 = 站点根目录；否则相对当前页面所在目录
    const target = clean.startsWith("/")
      ? path.join(DIST, clean)
      : path.resolve(baseDir, clean);

    const candidates = [target, path.join(target, "index.html"), `${target}.html`];
    let ok = false;
    for (const candidate of candidates) {
      if (await exists(candidate)) {
        ok = true;
        break;
      }
    }

    if (!ok) problems.push({ page, ref });
  }
}

if (problems.length > 0) {
  console.error(`✗ 发现 ${problems.length} 条内部死链：`);
  for (const { page, ref } of problems) {
    console.error(`   ${page}  →  ${ref}`);
  }
  process.exit(1);
}

console.log(`✓ 内部链接检查通过：${htmlFiles.length} 个页面全部命中构建产物`);
