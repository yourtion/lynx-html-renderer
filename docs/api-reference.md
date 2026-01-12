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
| `darkMode` | `boolean` | `false` | 启用暗色模式 |
| `linkStyle` | `Record<string, string \| number>` | - | 自定义链接样式 |

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
});
```

## Error Codes

| Code | Description |
|------|-------------|
| `PARSE_ERROR` | HTML parsing failed |
| `UNSUPPORTED_TAG` | Unsupported HTML tag |
| `STYLE_ERROR` | Style parsing failed |
| `PLUGIN_ERROR` | Plugin execution failed |
| `VALIDATION_ERROR` | Validation error |
| `RENDER_ERROR` | Rendering error |
