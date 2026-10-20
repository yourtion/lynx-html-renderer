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
