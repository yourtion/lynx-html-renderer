# 自动发布

推送 `v<package.json.version>` tag 后，`.github/workflows/release.yml` 会检查版本及提交是否属于 `main`，运行代码检查、类型检查、测试和构建，检查 npm 压缩包中的全部公开入口，发布该压缩包，最后创建 GitHub Release。保持源码 TSX 导出，供 Lynx 编译器处理静态 JSX；同时包含生成的两份 CSS。

## 一次性配置 npm Trusted Publisher

在 npm 的 `lynx-html-renderer` 包设置中添加 GitHub Actions Trusted Publisher，填写：

| 字段 | 值 |
| --- | --- |
| Organization or user | `yourtion` |
| Repository | `lynx-html-renderer` |
| Workflow filename | `release.yml` |
| Environment | 留空 |
| Allowed actions | 勾选允许 `npm publish` 直接发布 |

这些字段大小写敏感。workflow 使用 Node 24 自带的 npm（需 ≥11.5.1）和 `id-token: write`，通过 OIDC 发布，无需配置 `NPM_TOKEN`。公开仓库的 Trusted Publishing 自动生成 npm provenance。改 workflow 文件名或添加 GitHub environment 时，必须同步 npm 设置。

OIDC 校验 workflow 身份，Allowed actions 授予该身份可执行的动作。当前流程使用 `npm publish`，因此必须允许直接发布；这项授权只授予匹配的 Trusted Publisher，不是开放本地任意用户发布。若只允许 `npm stage publish`，CI 只能暂存包，需维护者审批后才公开，不能原样使用当前自动直发流程。

包级 Publishing access 中的 “Require two-factor authentication and disallow tokens” 是另一项设置，限制的是传统 token 认证，可以与允许 Trusted Publisher 执行 `npm publish` 同时启用。

npm Trusted Publisher 是 npm 侧配置，提交 workflow 不代表已经绑定。首次发布新包时需先按 npm 官方支持的方式创建包，再绑定 Trusted Publisher；本包已存在。详见 [npm 官方文档](https://docs.npmjs.com/trusted-publishers/)。

## 发版

在分支中修改 `package.json` 的版本，完成检查并合入 `main` 后，从最新 `main` 创建 tag，例如：

```bash
git switch main
git pull --ff-only
node scripts/npm-release.mjs check v1.0.1
git tag -a v1.0.1 -m 'Release v1.0.1'
git push origin v1.0.1
```

示例的版本须替换为实际新版本。正式版本使用 npm `latest`；`v1.1.0-beta.1` 这样的预发布版本使用 `next`，GitHub 也标记为 prerelease。拒绝带前导零、不完整或含 `+build` 的版本，避免 npm 版本归一化后与 tag 不一致。发布任务跨版本串行，不取消运行中的发布；GitHub concurrency 只保留一个 pending，不保证处理多条积压 tag，因此逐个发版并确认完成。

## 验证与失败重跑

```bash
pnpm check
pnpm typecheck
pnpm test
pnpm test:release
pnpm build
node scripts/npm-release.mjs pack v1.0.0 /tmp/lynx-release-check
```

本地 pack 的 tag 也须与当前 `package.json` 相同；只打包和检查，不执行发布。workflow 在构建后使用 `npm pack --ignore-scripts`，发布已检查的 `.tgz`，避免 lifecycle 再构建改变产物。

失败时从 Actions 页面重跑原 tag 的 workflow。精确版本已在 npm 时跳过发布，继续完成 GitHub Release；只有 npm 返回结构化 `E404` 才尝试发布，认证、网络、限流等错误会中止。GitHub Release 列表查询失败也会中止。已经发布的 npm 版本不能覆盖，修复代码需使用新版本和新 tag。

合入此改动不会自动触发发布，也不会移动已有 tag；真实 OIDC 认证和发包只能在完成 npm 绑定后的 tag workflow 中验证。
