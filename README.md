# Lynx HTML Renderer

将 HTML 字符串转换为 Lynx 原生组件的轻量渲染库，适用于内容详情页、富文本和配置化页面。

A lightweight, extensible HTML renderer for Lynx native components.

- 支持常见文本、图片、列表和基础表格。
- 提供内联样式、CSS 类模式和主题定制。
- 通过标签映射、Transform 插件和渲染适配器扩展业务组件。

处理范围为已支持的 HTML/CSS 子集，不执行 HTML 中的脚本。标签、样式和扩展能力见 [API 文档](docs/api-reference.md)。

## 安装 | Installation

在已有的 Lynx React 项目中安装：

```bash
npm install lynx-html-renderer
# 或
pnpm add lynx-html-renderer
```

当前 peer 依赖为 `@lynx-js/react ^0.126.2`、`@lynx-js/types ^4.3.0`。
宿主引擎与 npm 包版本的兼容要求见 [工具链说明](docs/upgrade.md)。

## 基本使用 | Basic Usage

```tsx
import { HTMLRenderer } from 'lynx-html-renderer';

function App() {
  return <HTMLRenderer html="<p>Hello <strong>Lynx</strong></p>" />;
}
```

默认使用内联样式，保留 HTML 的 `style` 并移除 `class`。
可通过 `removeAllStyle` 和 `removeAllClass` 调整；完整属性和直接渲染、HTML 转换接口见 [API 文档](docs/api-reference.md)。

## PAPI 直绘模式 | Direct-Draw via Element PAPI

面向新引擎（Lynx 4.2+）的高性能路径，与 `HTMLRenderer` 同入口导出，也可从 `lynx-html-renderer/papi` 子路径引入：

```tsx
import { HTMLRenderer, PapiHTMLRenderer } from 'lynx-html-renderer';

function Article({ html }: { html: string }) {
  return <PapiHTMLRenderer html={html} />;
}
```

未使用 `PapiHTMLRenderer` 时，其代码随库的 `sideEffects` 声明被构建工具裁剪，不进入产物。

与默认的 `HTMLRenderer` 共享同一 HTML 转换管道与样式系统（`styleMode` inline /
css-class、`darkMode`、`removeAllClass/Style` 等语义一致），区别只在渲染层：跳过
React 协调，把序列化树发送到主线程直接构建原生元素树。

**何时选择**：内容大且基本静态（文章 / 详情页）且引擎 ≥ 4.2 —— 真机全量渲染
快 ~1.4x（Android 模拟器 1.7~1.9x），且不触发引擎对大文档的跨线程调用限流。

**注入构建器（推荐用法）**：当前 ReactLynx 工具链（react-rsbuild-plugin ≤ 0.22.x）
只对项目自身源码做 `'main thread'` worklet 提取，第三方库源码中的 worklet 不会被
正确编译。因此在你的项目源码中定义构建器并注入：

```tsx
import { PapiHTMLRenderer } from 'lynx-html-renderer/papi';

// 复制自 lynx-html-renderer 的 buildPapiTree（example/src/App.tsx 有完整示例）
function myPapiBuilder(hostRef, roots) {
  'main thread';
  /* __CreateView 等 Element API 构建 */
}

<PapiHTMLRenderer
  html={html}
  builder={myPapiBuilder}          // 注入构建器
  styleMode="css-class"            // 可选：CSS 类模式（页面需引入样式表）
  darkMode={isDark}                // 可选：暗色模式（css-class 模式）
  fallback={<HTMLRenderer html={html} />}  // 引擎过旧时降级
/>;
```

**自定义适配器（Portal 桥接）**：传入 `adapterRegistry` 后，命中的自定义适配器
子树不进直绘，而是经 `createPortal` 渲染进原位置的占位元素——React 组件保留
完整生命周期（portal 子树仅 background 线程渲染）。模拟/测试环境已全链路验证；
**native 引擎当前限制**：运行时创建的元素不在 selector 索引中（编译期建立），
Portal 占位无法被 `createSelectorQuery` 命中——已反馈上游（`NodeSelectType.UniqueID`
类型已存在，等待 `serializeNodesRef` 放开）。native 落地前的过渡：适配器内容
在 PAPI 模式按默认块渲染，或使用 `fallback` 整体降级。

**其余限制**：更新为全量重建。

类型包 `@lynx-js/type-element-api` 为可选 peer 依赖（仅使用 `/papi` 入口且需要元素类型时安装）。
真机验证与性能测试见 [docs/native-verification.md](docs/native-verification.md)。

## CSS 类模式 | CSS Class Mode

引入预生成 CSS，用共享类名应用标签的默认样式：

```tsx
import { HTMLRenderer } from 'lynx-html-renderer';
import 'lynx-html-renderer/dist/styles.css';

function App() {
  return (
    <HTMLRenderer
      html='<p class="article-text" style="color: red">Hello Lynx</p>'
      styleMode="css-class"
      removeAllClass={false}
    />
  );
}
```

HTML 的 `style` 仍受 `removeAllStyle` 控制；保留自定义 `class` 时需显式设置 `removeAllClass={false}`。
主题、`rootClassName`、动态 CSS 生成和样式覆盖见 [CSS 类模式指南](docs/css-class-mode.md)。

## 自定义标签与插件 | Custom Tags and Plugins

`tagMappings` 决定自定义标签如何进入节点树，`adapterRegistry` 决定节点如何渲染：

```tsx
import { createDefaultRegistry, HTMLRenderer } from 'lynx-html-renderer';

const registry = createDefaultRegistry();
registry.registerByTag('custom-card', {
  render(node, ctx) {
    return <view {...node.props}>{ctx.renderChildren(node)}</view>;
  },
});

<HTMLRenderer
  html="<custom-card><p>Content</p></custom-card>"
  adapterRegistry={registry}
  tagMappings={{
    'custom-card': {
      lynxTag: 'custom-card',
      role: 'card',
      capabilities: { layout: 'flex' },
    },
  }}
/>
```

通过 `plugins` 添加、替换或禁用 Transform 插件。未知标签默认丢弃子树，可用 `unknownTagPolicy="unwrap"` 保留子内容，或用 `"fallback"` 保留标签供适配器处理。
自定义标签映射优先于未知标签策略；执行顺序与扩展契约见 [插件文档](docs/plugin.md)。

## 文档 | Documentation

| 文档 | 内容 |
| --- | --- |
| [使用指南与示例](docs/index.md) | 使用选项、示例页面及 Lynx 示例 bundle |
| [API 参考](docs/api-reference.md) | 组件属性、转换接口、类型与支持范围 |
| [CSS 类模式](docs/css-class-mode.md) | 默认样式、主题、自定义 CSS 与样式工具 |
| [插件系统](docs/plugin.md) | Transform 阶段、标签映射和渲染适配器 |
| [架构设计](docs/architecture.md) | Parser、Transform、Renderer 分层 |
| [工具链说明](docs/upgrade.md) | 依赖、宿主引擎和兼容验证范围 |

## 贡献 | Contributing

欢迎提交 issue、讨论和 PR。开发环境、检查命令与提交说明见 [贡献指南](CONTRIBUTING.md)。
变异测试和维护者发版流程分别见 [变异测试说明](docs/mutation-testing.md) 与 [发布说明](docs/releasing.md)。

## 许可 | License

[MIT](LICENSE)
