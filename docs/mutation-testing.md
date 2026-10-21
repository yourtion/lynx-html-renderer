# 变异测试 | Mutation Testing

使用 StrykerJS 在源码中引入行为变化，检查现有测试能否识别这些变化。测试通过率和覆盖率之外，变异测试可帮助定位断言不足的场景。

## 本地运行

使用 Node 22+，先按仓库要求安装依赖，再执行：

```bash
pnpm mutation       # 增量执行；没有本地基线时全量运行
pnpm mutation:full  # 强制全量运行并重建本地基线
```

配置位于 `stryker.config.json`，使用现有 Vitest 测试，变异范围为 `src/` 下的 TypeScript 和 TSX 源码，排除声明文件。

| 输出 | 位置 |
| --- | --- |
| 增量基线 | `reports/stryker-incremental.json` |
| HTML 报告 | `reports/mutation/mutation.html` |
| JSON 报告 | `reports/mutation/mutation.json` |

`reports/` 和 `.stryker-tmp/` 不提交到 Git。

## CI 执行策略

独立的 `CI - Mutation Testing` 工作流采用以下策略：

| 场景 | 执行策略 |
| --- | --- |
| 首次接入、基线缓存丢失或失效 | 全量运行；仅在 main 成功后保存共享基线 |
| 面向 main 的 PR | 读取 main 基线，增量执行，不更新共享基线 |
| 合并到 main 或直接推送 main | 增量执行，成功后保存新基线 |
| 手动运行 | 默认增量；勾选 `full` 强制全量，在 main 成功运行可重建共享基线 |

main 没有可用基线时，PR 也会全量运行。main 首次成功运行后自动建立共享基线，无需额外服务或 Secret。
main 不主动取消运行中的任务；同一 PR 的新提交会取消该 PR 的旧任务。

每次运行的报告可在 GitHub Actions 的 `mutation-reports-*` artifact 中下载，保留 14 天。完整报告和增量基线在整轮结束后生成；任务提前中止时可能没有可上传的报告，下次运行也可能仍需全量执行。

## 耗时与重建

首次全量或基线重建可能超过 90 分钟，工作流总时限为 180 分钟。该时限与 Stryker 对单个变异执行设置的超时不同。

Stryker 比较源码与测试内容，复用未受影响的变异结果；每次仍会先运行原始测试，收集测试与覆盖信息。
依赖、配置、快照及测试辅助文件等兼容性输入变化时，CI 会重新建立基线。当前缓存键的输入范围见 `.github/workflows/mutation.yml`。

Stryker 对静态变异的测试变化检测存在限制，必要时使用 `pnpm mutation:full`，或在 main 手动运行工作流并勾选 `full`。

## 评分与门禁

当前保留 Stryker 默认评分阈值，未额外设置最低分门禁。原始测试失败或工作流执行错误会使 CI 失败；有存活变异时，应结合报告判断哪些行为缺少有效断言。
