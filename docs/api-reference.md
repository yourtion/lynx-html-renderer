# API Reference

## HTMLRenderer 组件

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `html` | `string` | - | HTML 字符串（必填） |
| `removeAllClass` | `boolean` | `true` | 删除所有 class 属性 |
| `removeAllStyle` | `boolean` | `false` | 删除所有 style 属性 |
| `styleMode` | `'inline' \| 'css-class'` | `'inline'` | 样式模式 |
| `rootClassName` | `string` | `'lynx-html-renderer'` | 根容器类名 |
| `darkMode` | `boolean` | `false` | CSS 类模式下启用暗色主题类名 |
| `linkStyle` | `Record<string, string \| number>` | - | 自定义链接样式，仅 inline 模式生效 |
| `debug` | `boolean` | `false` | 启用 transform 调试日志 |
| `adapterRegistry` | `AdapterRegistry` | 全局默认注册表 | 为该组件指定独立的渲染适配器 |
| `plugins` | `PluginConfig` | - | 添加、替换或禁用 Transform 插件 |
| `tagMappings` | `TransformOptions['tagMappings']` | - | 自定义或覆盖 HTML 标签映射 |
| `unknownTagPolicy` | `'drop' \| 'unwrap' \| 'fallback'` | `'drop'` | 未知标签的处理策略 |
| `limits` | `TransformLimits` | 见下表 | HTML 输入长度、解析节点数和嵌套深度限制 |

`HTMLRenderer` 与 `renderHTMLDirect` 接受相同的属性。扩展方式及未知标签策略见 [插件文档](./plugin.md)。

### 输入限制

`transformHTML`、`HTMLRenderer`、`renderHTMLDirect` 共用 `limits`：

| 字段 | 默认值 | 计数方式 |
| --- | --- | --- |
| `maxInputLength` | 1,000,000 | HTML 字符串的 UTF-16 code unit 长度，在解析前检查 |
| `maxNodes` | 50,000 | 解析后的节点数，不含文档根节点；含文本、注释和将被忽略的子树 |
| `maxDepth` | 256 | 嵌套元素层数，顶层元素为 1；html/body 也计数，文本不增加层数 |

值必须是非负安全整数。超限抛出 `HTMLTransformError`（`code: 'LIMIT_EXCEEDED'`），
非法配置为 `VALIDATION_ERROR`。节点数和深度在 AST 生成后、任何递归插件执行前检查。
边界针对 HTML 输入，不限制可信自定义插件自行创建的树，也不提供自动截断或 UI 错误占位。
提高深度上限前需在目标宿主验证调用栈与布局能力。

```tsx
<HTMLRenderer html={html} limits={{ maxInputLength: 200_000, maxNodes: 10_000, maxDepth: 128 }} />
```

### 内容语义与原生验证

`pre` 保留实际空白字符；图片内联尺寸优先于 HTML 尺寸属性，数字属性转换成 `px`；
有序列表支持 `start`、`reversed` 和 `li value`。`removeAllStyle` 仍保留图片尺寸。
CSS 解析保留自定义属性名称及完整声明值，具体属性和变量是否生效取决于 Lynx 宿主。
行为变化、原生对照入口和验收步骤见 [内容正确性与原生验收](./native-validation.md)。

## Supported HTML Tags

### Block Elements

| HTML Tag | Lynx Component | Notes |
|----------|---------------|-------|
| `div` | `<view>` | Default block container |
| `p` | `<text>` | Paragraph with margin |
| `h1`-`h6` | `<text>` | Heading levels |
| `section` | `<view>` | Section container |
| `article` | `<view>` | Article container |
| `header` | `<view>` | Header container |
| `footer` | `<view>` | Footer container |
| `nav` | `<view>` | Navigation container |
| `aside` | `<view>` | Aside container |
| `blockquote` | `<view>` | Block quote with border |
| `pre` | `<text>` | Preformatted text |
| `hr` | `<view>` | Horizontal divider |

### Inline Elements

| HTML Tag | Lynx Component | Notes |
|----------|---------------|-------|
| `span` | `<text>` | Inline text container |
| `strong` | `<text>` | Bold text (via marks) |
| `b` | `<text>` | Bold text (via marks) |
| `em` | `<text>` | Italic text (via marks) |
| `i` | `<text>` | Italic text (via marks) |
| `u` | `<text>` | Underlined text (via marks) |
| `code` | `<text>` | Inline code style |
| `a` | `<text>` | Link with `data-href` attribute |

### Media Elements

| HTML Tag | Lynx Component | Notes |
|----------|---------------|-------|
| `img` | `<image>` | Image element |

### List Elements

| HTML Tag | Lynx Component | Notes |
|----------|---------------|-------|
| `ul` | `<view>` | Unordered list |
| `ol` | `<view>` | Ordered list |
| `li` | `<view>` | List item |

### Table Elements

| HTML Tag | Lynx Component | Notes |
|----------|---------------|-------|
| `table` | `<view>` | Table container |
| `thead` | `<view>` | Table header |
| `tbody` | `<view>` | Table body |
| `tfoot` | `<view>` | Table footer |
| `tr` | `<view>` | Table row (role: `row`) |
| `th` | `<view>` | Table header cell (role: `cell`) |
| `td` | `<view>` | Table cell (role: `cell`) |

### Void Elements

| HTML Tag | Lynx Component | Notes |
|----------|---------------|-------|
| `br` | `\n` | Line break |

## Supported CSS Properties

### Text Properties

All text properties are supported on `<text>` elements:

| Property | Type | Description |
|----------|------|-------------|
| `color` | `string` | Text color |
| `fontFamily` | `string` | Font family |
| `fontSize` | `string \| number` | Font size |
| `fontWeight` | `string \| number` | Font weight |
| `fontStyle` | `string` | Font style (normal, italic) |
| `lineHeight` | `string \| number` | Line height |
| `textAlign` | `string` | Text alignment |
| `textDecoration` | `string` | Text decoration |
| `textShadow` | `string` | Text shadow (Lynx specific) |
| `textStroke` | `string` | Text stroke (Lynx specific) |
| `textIndent` | `string \| number` | Text indent |
| `letterSpacing` | `string \| number` | Letter spacing |
| `wordSpacing` | `string \| number` | Word spacing |
| `wordBreak` | `string` | Word break behavior |
| `whiteSpace` | `string` | White space handling |
| `direction` | `string` | Text direction (ltr, rtl) |

### Layout Properties

| Property | Type | Description |
|----------|------|-------------|
| `display` | `string` | Display mode |
| `flexDirection` | `string` | Flex direction |
| `justifyContent` | `string` | Justify content |
| `alignItems` | `string` | Align items |
| `flexWrap` | `string` | Flex wrap |
| `gap` | `string \| number` | Gap |
| `margin*` | `string \| number` | Margin properties |
| `padding*` | `string \| number` | Padding properties |
| `width` | `string \| number` | Width |
| `height` | `string \| number` | Height |
| `minWidth` | `string \| number` | Minimum width |
| `maxWidth` | `string \| number` | Maximum width |
| `minHeight` | `string \| number` | Minimum height |
| `maxHeight` | `string \| number` | Maximum height |

### Lynx-Specific Properties

| Property | Description |
|----------|-------------|
| `-x-flex-direction` | Flex direction (vendor prefix) |
| `-x-transform` | CSS transform |
| `-x-animation` | CSS animation |
| `-x-transition` | CSS transition |

## CSS Variables (CSS Class Mode)

### Light Mode

```css
.lynx-html-renderer {
  --lhr-text-color: #212529;
  --lhr-text-color-secondary: #495057;
  --lhr-text-color-muted: #6c757d;
  --lhr-border-color: #dee2e6;
  --lhr-bg-color-secondary: #f8f9fa;
  --lhr-bg-color-tertiary: #f5f5f5;
  --lhr-divider-color: #ccc;
  --lhr-blockquote-border: #ddd;
}
```

### Dark Mode

```css
.lynx-html-renderer.lhr-dark {
  --lhr-text-color: #e9ecef;
  --lhr-text-color-secondary: #ced4da;
  --lhr-text-color-muted: #adb5bd;
  --lhr-border-color: #404040;
  --lhr-bg-color-secondary: #2d2d2d;
  --lhr-bg-color-tertiary: #1e1e1e;
  --lhr-divider-color: #3a3a3a;
  --lhr-blockquote-border: #555;
}
```

## Type Exports

### Main Types

```typescript
import type {
  LynxNode,
  LynxElementNode,
  LynxTextNode,
  HTMLRendererProps,
  TransformOptions,
} from 'lynx-html-renderer';
```

### Error Types

```typescript
import {
  HTMLTransformError,
  LynxRenderError,
  PluginError,
  TransformErrorCode,
  isTransformError,
  createParseError,
  createUnsupportedTagError,
} from 'lynx-html-renderer/errors';
```

## Functions

### renderHTMLDirect

Render HTML to React elements without hooks:

```typescript
import { renderHTMLDirect } from 'lynx-html-renderer';

const result = renderHTMLDirect({
  html: '<div>Hello</div>',
  styleMode: 'inline',
});
```

### transformHTML

Parse HTML to LynxNodes:

```typescript
import { transformHTML } from 'lynx-html-renderer/html-parser';

const nodes = transformHTML('<div>Hello</div>', {
  removeAllClass: true,
  styleMode: 'inline',
  debug: false,
});
```

Note: `rootClassName` is a renderer-only option (`HTMLRenderer`) and is ignored by `transformHTML`.

## Error Codes

| Code | Description |
|------|-------------|
| `PARSE_ERROR` | HTML parsing failed |
| `LIMIT_EXCEEDED` | HTML input exceeds configured length, node count or depth |
| `UNSUPPORTED_TAG` | Unsupported HTML tag |
| `STYLE_ERROR` | Style parsing failed |
| `PLUGIN_ERROR` | Plugin execution failed |
| `VALIDATION_ERROR` | Validation error |
| `RENDER_ERROR` | Rendering error |
