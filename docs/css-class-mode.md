# CSS 类模式指南 | CSS Class Mode Guide

## 概述 | Overview

Lynx HTML Renderer 支持两种样式模式：

1. **内联样式模式（Inline Style Mode）** - 默认模式，所有样式作为内联样式应用
2. **CSS 类模式（CSS Class Mode）** - 通过预定义的 CSS 类应用默认样式

## 模式对比 | Mode Comparison

| 特性 | 内联样式模式 | CSS 类模式 |
|------|-------------|-----------|
| **TAG_MAP defaultStyle** | 作为 inline style 应用 | 作为 CSS 类应用 |
| **HTML style 属性** | 作为 inline style 保留 | 作为 inline style 保留 |
| **兼容性** | 完全向后兼容 | 更灵活，需引入 CSS |
| **使用场景** | 简单场景，无需额外 CSS | 复杂应用，需要样式定制 |
| **性能** | 每个元素都有完整样式 | 共享 CSS 类，更高效 |

## 基础使用 | Basic Usage

### 内联样式模式（默认）

```tsx
import { HTMLRenderer } from 'lynx-html-renderer';

function App() {
  return <HTMLRenderer html="<p>Hello World</p>" />;
}
```

生成的结果：
```tsx
// 每个 <p> 标签都有独立的 inline style
<text style="marginBottom: '1em'">Hello World</text>
```

### CSS 类模式

```tsx
import { HTMLRenderer } from 'lynx-html-renderer';
import 'lynx-html-renderer/dist/styles.css';

function App() {
  return <HTMLRenderer html="<p>Hello World</p>" styleMode="css-class" />;
}
```

生成的结果：
```tsx
// defaultStyle 通过 CSS 类应用
<view className="lynx-html-renderer">
  <text className="lhr-p">Hello World</text>
</view>
```

对应的 CSS：
```css
.lynx-html-renderer .lhr-p {
  margin-bottom: 1em;
}
```

## 样式优先级 | Style Priority

CSS 类模式下的样式优先级（从高到低）：

1. **HTML 的 `style` 属性** - 最高优先级，确保用户自定义样式生效
2. **HTML 的 `class` 属性** - 通过类名应用的样式
3. **TAG_MAP 的 `defaultStyle`** - 通过 `.lhr-{tag}` 类应用的默认样式

### 示例

```tsx
const html = '<p class="custom" style="color: red;">Text</p>';

<HTMLRenderer html={html} styleMode="css-class" removeAllClass={false} />
```

生成的结果：
```tsx
<view className="lynx-html-renderer">
  <text className="lhr-p custom" style="color: red;">Text</text>
</view>
```

样式应用顺序：
1. `.lhr-p` 的 `margin-bottom: 1em` 被应用
2. `.custom` 的样式被应用
3. `style="color: red"` 覆盖任何冲突的颜色样式

## 高级用法 | Advanced Usage

### 1. 自定义根容器类名

```tsx
import { HTMLRenderer, generateCSS } from 'lynx-html-renderer';

function App() {
  const rootClassName = 'my-custom-content';
  const css = generateCSS(rootClassName);

  return (
    <>
      <style>{css}</style>
      <HTMLRenderer
        html="<p>Hello</p>"
        styleMode="css-class"
        rootClassName={rootClassName}
      />
    </>
  );
}
```

生成的 CSS：
```css
.my-custom-content .lhr-p {
  margin-bottom: 1em;
}
```

### 2. 定制默认样式

创建自定义 CSS 文件来覆盖默认样式：

```css
/* custom-styles.css */
.lynx-html-renderer .lhr-h1 {
  font-size: 40px; /* 覆盖默认的 32px */
  color: #333;
}

.lynx-html-renderer .lhr-p {
  margin-bottom: 1.5em; /* 覆盖默认的 1em */
  line-height: 1.6;
}
```

```tsx
import 'lynx-html-renderer/dist/styles.css';
import './custom-styles.css';

<HTMLRenderer html={html} styleMode="css-class" />
```

### 3. 动态生成 CSS

```tsx
import { HTMLRenderer, generateCSS } from 'lynx-html-renderer';
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    // 动态生成并注入 CSS
    const css = generateCSS();
    const styleElement = document.createElement('style');
    styleElement.textContent = css;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  return <HTMLRenderer html="<p>Hello</p>" styleMode="css-class" />;
}
```

### 4. 主题切换

```tsx
import { HTMLRenderer, generateCSS } from 'lynx-html-renderer';
import { useState } from 'react';

function App() {
  const [theme, setTheme] = useState('light');

  const css = generateCSS(`html-renderer-${theme}`);

  return (
    <>
      <style>{css}</style>
      <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
        Toggle Theme
      </button>
      <HTMLRenderer
        html="<p>Hello</p>"
        styleMode="css-class"
        rootClassName={`html-renderer-${theme}`}
      />
    </>
  );
}
```

## CSS 工具函数 | CSS Utility Functions

### generateCSS

生成完整的 CSS 字符串。

```tsx
import { generateCSS } from 'lynx-html-renderer';

// 使用默认根类名 'lynx-html-renderer'
const css = generateCSS();

// 使用自定义根类名
const customCSS = generateCSS('my-app');
```

**参数：**
- `rootClass?: string` - 根容器类名，默认为 `'lynx-html-renderer'`

**返回：**
- 完整的 CSS 字符串，包含所有标签的默认样式

### getClassNameForTag

获取 HTML 标签对应的 CSS 类名。

```tsx
import { getClassNameForTag } from 'lynx-html-renderer';

getClassNameForTag('p');     // => 'lhr-p'
getClassNameForTag('h1');    // => 'lhr-h1'
getClassNameForTag('div');   // => 'lhr-div'
getClassNameForTag('table'); // => 'lhr-table'
getClassNameForTag('img');   // => null (无默认样式)
```

**参数：**
- `tag: string` - HTML 标签名

**返回：**
- CSS 类名（如 `'lhr-p'`），如果标签没有默认样式则返回 `null`

## 预生成 CSS | Pre-generated CSS

项目包含两个预生成的 CSS 文件：

- `dist/styles.css` - 完整版，带注释和格式
- `dist/styles.min.css` - 压缩版，用于生产环境

### 使用预生成 CSS

```tsx
import { HTMLRenderer } from 'lynx-html-renderer';
import 'lynx-html-renderer/dist/styles.css';

<HTMLRenderer html={html} styleMode="css-class" />
```

### 重新生成 CSS

如果修改了 TAG_MAP 配置，可以重新生成 CSS：

```bash
pnpm generate:css
```

## CSS 类命名规范 | CSS Class Naming

### 根容器类
- 默认：`.lynx-html-renderer`
- 可通过 `rootClassName` 属性自定义

### 标签类
- 格式：`.lhr-{html-tag}`
- 示例：
  - `.lhr-p` - 段落
  - `.lhr-h1` ~ `.lhr-h6` - 标题
  - `.lhr-div` - 容器
  - `.lhr-strong` - 粗体
  - `.lhr-blockquote` - 引用块
  - `.lhr-table` - 表格

### 选择器结构

所有标签类都使用后代选择器，确保样式作用域：

```css
.lynx-html-renderer .lhr-p {
  margin-bottom: 1em;
}
```

这种设计避免了样式污染全局命名空间。

## 迁移指南 | Migration Guide

### 从内联样式模式迁移到 CSS 类模式

**步骤 1：引入 CSS 文件**

```tsx
import 'lynx-html-renderer/dist/styles.css';
```

**步骤 2：添加 styleMode 属性**

```tsx
// 之前
<HTMLRenderer html={html} />

// 之后
<HTMLRenderer html={html} styleMode="css-class" />
```

**步骤 3：测试样式**

确保所有样式正常显示。

**步骤 4：（可选）定制样式**

根据需要覆盖 CSS 类样式。

### 定制默认样式示例

```css
/* 创建 custom-styles.css */
.lynx-html-renderer .lhr-h1 {
  font-size: 40px;
  color: #333;
}

.lynx-html-renderer .lhr-p {
  margin-bottom: 1.5em;
  line-height: 1.6;
}
```

```tsx
import 'lynx-html-renderer/dist/styles.css';
import './custom-styles.css';

<HTMLRenderer html={html} styleMode="css-class" />
```

## 完整示例 | Complete Example

```tsx
import { HTMLRenderer, generateCSS } from 'lynx-html-renderer';
import { useState } from 'react';

function App() {
  const [html] = useState(`
    <h1>Welcome</h1>
    <p>This is a <strong>bold</strong> example with CSS class mode.</p>
    <blockquote>
      This is a quote with custom styling.
    </blockquote>
    <ul>
      <li>Item 1</li>
      <li>Item 2</li>
    </ul>
  `);

  return (
    <div>
      {/* 方式1：使用预生成 CSS（推荐） */}
      <link rel="stylesheet" href="/node_modules/lynx-html-renderer/dist/styles.css" />

      {/* 方式2：动态生成 CSS */}
      {/* <style>{generateCSS()}</style> */}

      <HTMLRenderer html={html} styleMode="css-class" />
    </div>
  );
}

export default App;
```

## 常见问题 | FAQ

### Q: CSS 类模式会影响性能吗？

A: 不会。实际上，CSS 类模式可能更高效，因为：
- 减少了重复的内联样式定义
- 多个实例共享同一份 CSS
- 浏览器可以更好地缓存 CSS 规则

### Q: HTML 中的 `style` 属性会被保留吗？

A: 是的。HTML 的 `style` 属性始终作为内联样式保留，确保用户自定义样式生效。

### Q: 如何覆盖默认样式？

A: 有三种方式：
1. 使用更高优先级的 CSS 选择器
2. 通过 HTML 的 `style` 属性
3. 通过 HTML 的 `class` 属性配合自定义 CSS

### Q: 可以同时使用两种模式吗？

A: 可以。不同的 `HTMLRenderer` 实例可以使用不同的模式。

### Q: CSS 类模式会破坏现有代码吗？

A: 不会。默认模式仍然是内联样式模式，只有显式设置 `styleMode="css-class"` 才会使用 CSS 类模式。

## 最佳实践 | Best Practices

1. **推荐使用预生成 CSS**
   ```tsx
   import 'lynx-html-renderer/dist/styles.css';
   ```

2. **使用自定义根类名隔离样式**
   ```tsx
   <HTMLRenderer rootClassName="my-app" styleMode="css-class" />
   ```

3. **保持 HTML style 属性用于动态样式**
   ```html
   <p style="color: var(--dynamic-color);">Text</p>
   ```

4. **使用 CSS 类处理静态样式**
   ```tsx
   <HTMLRenderer styleMode="css-class" />
   ```

5. **组合使用两种模式**
   - 内容页：使用 CSS 类模式
   - 预览/编辑：使用内联样式模式
