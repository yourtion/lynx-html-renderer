# Lynx 工具链升级与验证

本次修复以 main 的 `029bdb23` 为基线，保留 Parser / Transform / Renderer 分层。

## 工具链与运行基线

| 包 | 验证版本 |
| --- | --- |
| @lynx-js/react | 0.126.2 |
| @lynx-js/react-rsbuild-plugin | 0.20.3 |
| @lynx-js/rspeedy | 0.18.0 |
| @lynx-js/types | 4.3.0 |
| @lynx-js/qrcode-rsbuild-plugin | 0.7.3 |
| @rsbuild/plugin-type-check | 1.6.0 |
| @rsbuild/core | 2.2.11 |
| @rspack/core | 2.2.8 |
| postcss | 8.5.29 |

Node 要求为 `^20.19.0 || >=22.12.0`，CI 使用 Node 22。
使用 `pnpm@10.26.2`；CI 安装加 `--frozen-lockfile`。
只对 Rsbuild / Rspack 2 的依赖做版本对齐，Rspress 1 的旧工具链保留其兼容版本。
React 与 types peer 范围分别为 `^0.126.2`、`^4.3.0`；更早版本未纳入本次兼容验证。

示例使用 `pluginReactLynx({ engineVersion: '3.9' })`。
这是模板所需的最低引擎版本，与 React npm、types npm 和宿主原生 SDK 版本分别管理。
该工具链的编码器仍不接受 `engineVersion: '4.0'`，因此没有启用 4.0 的动态元素或媒体查询能力。

`engineVersion` 和 TypeScript 的 lib 配置不保证宿主 JavaScript API 可用。
转换器使用 `Object.prototype.hasOwnProperty.call` 检查标签映射及文本样式，
不依赖 `Object.hasOwn`；文本合并也不依赖 `Object.fromEntries`。
回归测试在这两个 API 缺失时验证转换、继承、自定义标签和文本合并。

## 行为与扩展变化

- 文本容器保留 margin、padding、背景、边框、class 和交互属性；段落与标题会保留额外容器节点。
- 所有格式化标签与链接保留原始属性。最终样式确定后才继承；显式子样式覆盖父样式和格式化默认值。
- code 的背景、padding、圆角保留在容器上，片段上的 code mark 只提供字体。
- table / row / cell role 贯通 IR 与 Adapter；显式 tag adapter 优先，其次 role，再其次内置原生兜底。
- capability 处理器依次接收当前节点；apply 插件作为批次边界，按 order 执行。
- 文本合并移动至 finalize / order 20，比较 marks、最终样式、class 和扩展语义。
- 组件与直接渲染函数支持 plugins、tagMappings、unknownTagPolicy；默认未知标签策略仍是 drop。
- html / body 包装保留内容，带 style / class 时保留容器。head、script 和 HTML style 内容仍排除。

库的 `main` / `types` / exports 继续指向源码，以供 Lynx 编译器处理静态 JSX。
`typecheck` 使用覆盖全部 src 的配置，库构建也进行类型检查并生成声明，不再使用 noCheck。
示例类型配置包含完整源码，并通过模块 augmentation 声明 GlobalProps。

## 验证方式

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm typecheck
pnpm test
pnpm build-example
pnpm docs:build
CODECOV_DRY_RUN=true pnpm build-example
```

CodeCov vendored 插件 1.0.0 的 peer 声明仍只包含 Rspack 0.5 / 1.x，安装会提示警告。
本次已用 Rspack 2.2.8 验证其 dry-run 分析路径，并检查生成的 `lhr-example-lynx-cjs-stats.json`。
真实上传需要 CI 的 Codecov 凭据，未在本地执行。dry-run 会关闭 telemetry 并仅生成本地分析文件。
未扩展该插件的 peer 声明，也未把本地分析验证当成上传验证。

原生首帧、LynxExplorer / 真机布局、3.9 flex 与 !important、图片加载与滚动性能需要宿主验证。
本次没有实现跨行跨列表格、完整 CSS tokenizer / 能力过滤、图片尺寸策略或深度限制等 P2 工作。
