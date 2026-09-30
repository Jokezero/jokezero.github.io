/**
 * ESLint 扁平配置（ESLint 10）。
 *
 * 覆盖范围：
 *   · src/**\/*.ts    —— 脚本与工具函数（typescript-eslint 推荐规则）
 *   · src/**\/*.astro —— 组件（eslint-plugin-astro 推荐规则，含模板与 frontmatter）
 *
 * 刻意不引入 @eslint/js 之类的额外包：pnpm 的严格 node_modules 下，未声明的
 * 传递依赖不保证可解析；规则集只取已声明的四个包。
 */
import astro from "eslint-plugin-astro";
import tseslint from "typescript-eslint";
import globals from "globals";

export default [
  {
    ignores: ["dist/**", ".astro/**", "node_modules/**", "public/**"],
  },

  ...tseslint.configs.recommended,
  ...astro.configs.recommended,

  {
    files: ["**/*.{js,mjs,ts,astro}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      // 用 TS 版本替代基础规则，避免重复报错
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // 浏览器 API 的兜底分支里允许显式 any（数量极少，逐处有注释）
      "@typescript-eslint/no-explicit-any": "off",
    },
  },

  {
    // 构建脚本跑在 Node 里
    files: ["scripts/**/*.mjs"],
    languageOptions: { globals: { ...globals.node } },
  },
];
