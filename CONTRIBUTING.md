# 贡献指南

欢迎提交问题、使用反馈和 PR。报告渲染问题时，请提供最小 HTML、使用的选项、Lynx 依赖与宿主版本，以及预期和实际结果。

## 开发环境

建议使用 Node 22（≥22.12）或 Node 24，以及仓库固定的 `pnpm@10.26.2`。
变异测试所用 Stryker 10 要求 Node 22+；发布工作流使用 Node 24。
工具链、peer 依赖与宿主引擎的验证范围见 [工具链说明](docs/upgrade.md)。

```bash
git clone https://github.com/yourtion/lynx-html-renderer.git
cd lynx-html-renderer
pnpm install --frozen-lockfile
pnpm dev
```

## 常用命令

| 命令 | 用途 |
| --- | --- |
| `pnpm check` | Biome 格式、导入排序与代码检查 |
| `pnpm check:fix` | 自动修复可处理的 Biome 问题 |
| `pnpm typecheck` | 检查库源码与公开 API 类型用例 |
| `pnpm test` | 运行 Vitest 测试 |
| `pnpm coverage` | 生成源码覆盖率报告 |
| `pnpm test:release` | 检查发布脚本的行为 |
| `pnpm build` | 构建库并生成 CSS |
| `pnpm build-example` | 构建库及示例应用 |
| `pnpm docs:dev` | 本地预览文档站 |
| `pnpm docs:build` | 构建文档站 |

## 提交变更

- 从最新 `main` 创建分支，通过 PR 提交。
- 保持改动集中；行为变化在 `tests/` 中补充相应场景，公开 API 变化同步更新类型用例和文档。
- TypeScript 使用具体类型、`unknown` 或泛型，避免 `any`。
- 提交前运行 `pnpm check`，并根据改动运行类型检查、相关测试和构建。文档变更检查链接并运行 `pnpm docs:build`；修改发布脚本时运行 `pnpm test:release`。

## 测试与发布

变异测试的本地命令、增量基线、CI 策略和强制重建方法见 [变异测试说明](docs/mutation-testing.md)。
维护者的版本更新、npm Trusted Publisher 配置、tag 发布与失败重跑见 [发布说明](docs/releasing.md)。
