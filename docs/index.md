# Lynx HTML Renderer

> 一个将 **HTML 渲染到 Lynx 原生组件** 的轻量、可扩展渲染引擎。
> 
> A lightweight and extensible renderer that render HTML string on Lynx.

## ✨ 项目简介 | Introduction

**HTML → Lynx Renderer** 通过解析 HTML 并转换为一棵中间语义树（LynxNode），最终渲染为 Lynx 原生组件。

该项目并非浏览器实现，而是一个 **面向原生的 HTML 安全集渲染方案**，适用于：

- 内容页 / 详情页
- 富文本展示
- 配置化页面


**HTML → Lynx Renderer** parses HTML into a semantic intermediate representation (LynxNode), then renders it into Lynx native components.

It is **not a browser**, but a **native-oriented, safe HTML rendering solution**, suitable for:

- Content & detail pages
- Rich text rendering
- Configuration-driven pages

## 🚀 使用方法 | Usage

### 安装 | Installation

```bash
npm install lynx-html-renderer
```

### 基本使用 | Basic Usage

```tsx
import { HTMLRenderer } from 'lynx-html-renderer';

function App() {
  const html = '<div>Hello <strong>world</strong></div>';

  return <HTMLRenderer html={html} />;
}
```

### CSS 类模式 | CSS Class Mode

Lynx HTML Renderer 支持两种样式模式：

#### 内联样式模式（默认）

```tsx
<HTMLRenderer html="<p>Hello</p>" />
```

#### CSS 类模式（推荐用于生产环境）

```tsx
import { HTMLRenderer } from 'lynx-html-renderer';
import 'lynx-html-renderer/dist/styles.css';

<HTMLRenderer html="<p>Hello</p>" styleMode="css-class" />
```

**优势：**
- 🎨 样式可定制 - 通过覆盖 CSS 类来定制默认样式
- 🚀 性能优化 - 减少重复的内联样式定义
- 🔄 样式复用 - 多个实例共享同一份 CSS
- 📦 主题切换 - 支持动态主题切换

详细的 CSS 类模式文档请参考：[CSS 类模式指南](./css-class-mode.md)

### 转换选项 | Transform Options

`HTMLRenderer` 组件支持通过 props 控制转换行为：

```tsx
import { HTMLRenderer } from 'lynx-html-renderer';

function App() {
  const html = '<div class="container" style="color: red;">Hello</div>';

  return (
    <HTMLRenderer
      html={html}
      removeAllClass={true}      // 删除所有 class 属性（默认：true）
      removeAllStyle={false}     // 删除所有 style 属性（默认：false）
      styleMode="css-class"      // 使用 CSS 类模式（默认：'inline'）
      rootClassName="my-app"     // CSS类模式下的根容器类名（默认：'lynx-html-renderer'）
    />
  );
}
```

**可用选项：**

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `html` | `string` | - | 要渲染的 HTML 字符串（必填） |
| `removeAllClass` | `boolean` | `true` | 是否删除所有 HTML 的 class 属性 |
| `removeAllStyle` | `boolean` | `false` | 是否删除所有 HTML 的 style 属性 |
| `styleMode` | `'inline' \| 'css-class'` | `'inline'` | 样式模式：内联样式或CSS类模式 |
| `rootClassName` | `string` | `'lynx-html-renderer'` | CSS类模式下的根容器类名 |

**使用场景：**

- **内联样式模式（`styleMode="inline"`）**：
  - 简单场景，无需额外 CSS
  - 快速原型开发
  - 默认模式，完全向后兼容

- **CSS 类模式（`styleMode="css-class"`）**：
  - 生产环境，需要样式定制
  - 多个实例共享样式
  - 需要主题切换功能

- **`removeAllClass: true`**（默认）：适合不需要 CSS class 的场景，避免引入外部样式依赖
- **`removeAllClass: false`**：保留 class 属性，可用于基于 class 的自定义样式处理
- **`removeAllStyle: true`**：移除所有内联样式，使用统一的主题样式
- **`removeAllStyle: false`**（默认）：保留内联样式，保持 HTML 原始样式

### 示例 Bundle | Example Bundle

Scan the QR code below to access the example bundle:

![QR Code for Example Bundle](./qrcode.png)

The example bundle is available at `https://lynx-html-renderer.vercel.app/index.lynx.bundle?fullscreen=true`

![QR Code for showcase](./showcase.png)

The HTML Version of the example can be found at `https://lynx-html-renderer.vercel.app/html/showcase.html`

## 🎯 设计目标 | Design Goals

- ✅ 渲染大部分真实业务中的 HTML 页面
- ✅ 支持文本、图片、Flex 布局、基础表格
- ✅ 支持用户自定义标签与渲染组件
- ✅ 架构可扩展、可长期维护


## 🚫 非目标 | Non-goals

- ❌ 不实现完整 HTML/CSS 规范
- ❌ 不执行 JavaScript（`script` / inline events）
- ❌ 不追求浏览器级像素一致
- ❌ 不做 DOM diff 或 hydration

## 🧠 核心思想 | Core Concepts

参考 [Architecture](./architecture.md)

## 📦 功能特性 | Features

- ✅ HTML 标签 → Lynx 组件映射
- ✅ CSS style 安全集解析（受支持属性集）
- ✅ 文本语义（strong / em / code）
- ✅ 基础表格支持（table / tr / td）
- ✅ 用户自定义渲染组件
- ✅ 插件化 Transform 机制（可选）


## 🧩 插件机制 | Plugin System

Transform 阶段支持插件，用于：

- 覆盖某些 HTML 标签的解析方式
- 插入自定义语义节点
- 扩展样式或结构处理逻辑

插件以 **pipeline** 形式执行，不影响核心逻辑的稳定性。


## 🛠 使用场景 | Use Cases

- 内容管理系统（CMS）页面渲染
- 富文本展示（不依赖 WebView）
- 多端统一内容渲染


## 🙌 贡献 | Contributing

欢迎 issue、讨论与 PR。

本项目更关注 **架构正确性与可维护性**，而非一次性功能堆叠。

Contributions, issues, and discussions are welcome.

This project is designed as a **long-term maintainable HTML-to-Native rendering pipeline**, not a one-off rich text solution.
