# 0004 · 依赖构建脚本白名单写在 `pnpm-workspace.yaml`

状态：已采纳（2026-09-30，P0）

## 背景

pnpm 10 起默认**拦截**依赖的安装脚本（防供应链投毒），被拦截时会以退出码 1 结束安装。
本项目需要放行两个依赖：`esbuild`（校验/链接平台二进制，Vite 与 Astro 都依赖它）、
`sharp`（图像处理原生模块，P2 起用于图片优化）。

pnpm 11 的告警明确指出：`package.json` 里的 `"pnpm"` 字段**不再被读取**，
安装策略已迁移到 `pnpm-workspace.yaml`。

## 决策

新建 `pnpm-workspace.yaml`（单包仓库也保留该文件），写入：

```yaml
packages: ["."]
allowBuilds:
  esbuild: true
  sharp: true
```

**踩坑记录（实测）**：

1. 旧写法 `onlyBuiltDependencies` 在 pnpm 11 里被当作 legacy 设置，**写了不生效**，
   安装仍会打印 `ERR_PNPM_IGNORED_BUILDS` 并以非 0 退出（CI 会直接红）。
2. 让 pnpm 自己往 `pnpm-workspace.yaml` 里补模板时，它写的是提示文本
   `esbuild: set this to true or false`，必须手动改成 `true`；不改会解析成字符串而**不是**布尔值。
3. 设置写对之后，在临时目录复制一份仓库做干净安装验证：
   `pnpm install --frozen-lockfile --offline` 与 `pnpm build` 的退出码均为 0。

## 影响

- 白名单是显式的、可审计的；其他依赖的安装脚本仍然被拦截。
- 以后新增需要构建脚本的依赖（例如某天换掉 sharp），要在这里加一行，否则会看到
  `ERR_PNPM_IGNORED_BUILDS`。
