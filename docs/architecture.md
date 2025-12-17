# LynxHTMLRenderer 架构设计文档

> 目标：将 **HTML 字符串** 转换并渲染为 **Lynx 原生组件树**，支持 **安全子集渲染**、**模块化扩展** 与 **用户自定义标签/样式处理**。


---

## 1. 设计目标与边界

### 1.1 核心目标

- 将 **HTML** 转换为 **Lynx 可渲染的原生组件树**
- 支持用户：
  - 自定义标签渲染
  - 替换内置渲染组件
- 支持真实业务中常见页面：
  - 文本流 / 图片
  - Flex 布局
  - 基础表格
- 架构具备长期演进能力，而非一次性富文本实现

### 1.2 明确不做的事情（阶段性）

- 不实现完整 CSS / Layout 引擎
- 不执行 JS（`script` / inline handler）
- 不追求浏览器级像素一致
- 不做 DOM diff / hydration

---

## 2. 总体架构

```
HTML String
   │
   ▼
HTML Parser（第三方，如 htmlparser2）
   │
   ▼
HTML AST
   │
   ▼
Transform Pipeline（插件化）
   │
   ▼
LynxNode Tree（Capability-based IR）
   │
   ▼
Renderer（Adapter / Mapping）
   │
   ▼
Lynx Runtime
```

### 架构核心思想

- **HTML AST**：语法结构（不可控）
- **LynxNode**：语义结构（可控、稳定）
- **Renderer**：展示策略（可替换）

---

## 3. LynxNode：Capability-based IR 设计

### 3.1 设计原则

- Node 类型尽量少（element / text）
- 能力通过 **capability / role** 描述
- 不提前绑定具体渲染实现
- 为表格、富文本、扩展组件预留空间

---

### 3.2 基础类型定义

```ts
type LynxNode = LynxElementNode | LynxTextNode;
```

#### LynxBaseNode

```ts
interface LynxBaseNode {
  kind: string;
  meta?: Record<string, any>; // 调试、插件扩展、来源信息
}
```

---

### 3.3 LynxElementNode

```ts
interface LynxElementNode extends LynxBaseNode {
  kind: 'element';

  tag: string;               // 逻辑标签，如 view / text / image / table
  props: LynxProps;          // 已归一化 props（含 style）
  children: LynxNode[];

  role?: ElementRole;        // 结构语义
  capabilities?: Capabilities;
}
```

#### ElementRole（结构角色）

```ts
type ElementRole =
  | 'block'
  | 'inline'
  | 'textContainer'
  | 'image'
  | 'table'
  | 'row'
  | 'cell';
```

#### Capabilities（能力描述）

```ts
interface Capabilities {
  layout?: 'block' | 'inline' | 'flex' | 'table';
  isVoid?: boolean;           // 如 img / br
  textContainer?: boolean;    // 是否只能包含 text
}
```

📌 **说明**：
- `role` 用于快速结构判断（MVP）
- `capabilities` 用于后期精细控制

---

### 3.4 LynxTextNode

```ts
interface LynxTextNode extends LynxBaseNode {
  kind: 'text';
  content: string;

  marks?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    code?: boolean;
  };
}
```

用于承载：`strong / em / code / span` 等语义。

---

## 4. Transform Pipeline（HTML → LynxNode）

### 4.1 Transform 职责

- 遍历 HTML AST
- 标签语义映射（HTML → Lynx）
- 样式解析（style string → style object）
- 结构规整（尤其是 table）
- 生成 LynxNode（不涉及渲染）

---

### 4.2 Transform 阶段核心约束

- 不支持标签直接丢弃（`script / style`）
- 不支持样式直接忽略
- Transform 输出 **结构合法的 LynxNode Tree**

---

### 4.3 表格的 Transform 策略（关键）

#### HTML 表格输入

```
<table>
  <thead>...</thead>
  <tbody>...</tbody>
</table>
```

#### Transform 后结构

```
ElementNode (role: table)
 ├── ElementNode (role: row)
 │    ├── ElementNode (role: cell)
 │    └── ElementNode (role: cell)
```

Transform 阶段负责：

- 展平 `thead / tbody / tfoot`
- 统一为 `table → row → cell`
- 保留 `rowSpan / colSpan` 语义

Renderer 不关心 HTML 表格细节。

---

## 5. 插件机制（Transform 扩展点）

### 5.1 插件目标

- 解耦 transform 规则
- 支持用户覆盖标签处理逻辑
- 保持核心 transform 简洁

---

### 5.2 插件接口（概念）

```ts
interface HtmlToLynxPlugin {
  name: string;
  priority?: number;
  setup(ctx: TransformContext): void;
}
```

插件可注册：

- tag handler
- style handler
- node post-processor

---

### 5.3 插件执行模型

```
HTML AST Node
   │
   ├─ plugin.beforeTransform
   ├─ plugin.transform（可 short-circuit）
   └─ plugin.afterTransform
```

- 按 priority 执行
- 任一插件返回 LynxNode 即终止默认逻辑

---

## 6. Renderer：Adapter / Mapping 机制

### 6.1 Renderer 的定位

- 消费 LynxNode
- 决定「如何画」
- 不理解 HTML、不依赖 Transform 细节

---

### 6.2 Renderer Adapter 接口

```ts
interface LynxRenderAdapter {
  match(node: LynxElementNode): boolean;
  render(node: LynxElementNode, ctx: RenderContext): any;
}
```

---

### 6.3 Adapter Resolution

```ts
function resolveAdapter(node: LynxElementNode): LynxRenderAdapter {
  // 用户 adapter 优先
  // 内置 adapter 兜底
}
```

支持：

- `table → CustomTableComponent`
- `img → LazyImage`
- `a → 自定义跳转组件`

---

## 7. Transform 与 Renderer 的边界

| 能力 | Transform | Renderer |
|----|----|----|
| HTML 语义 | ✅ | ❌ |
| 样式解析 | ✅ | ❌ |
| 结构规整 | ✅ | ❌ |
| 组件选择 | ❌ | ✅ |
| 具体布局 | ❌ | ✅ |

---

## 8. 内置能力划分建议

### 8.1 内置 Transform Plugin

- BaseTagPlugin
- TextSemanticPlugin
- TableNormalizePlugin
- UnsafeTagPlugin

### 8.2 内置 Renderer Adapter

- ViewAdapter
- TextAdapter
- ImageAdapter
- TableAdapter（基础实现）

---

## 9. MVP 实现顺序（强烈建议）

1. Capability-based LynxNode 定义
2. 无插件版 Transform（hardcode tag / role）
3. 基础 Renderer + Adapter mapping
4. 表格 Transform + TableAdapter
5. 插件系统接入（不改现有行为）

---

## 10. 总结

该架构本质是一个：

> **HTML → 语义 IR → 可替换 Native Renderer 的编译管线**

通过：

- Capability-based LynxNode
- Transform / Renderer 解耦
- Adapter + Plugin 双扩展点

可以在保证安全、可控的前提下，覆盖 **大多数真实页面的渲染需求**，同时为业务定制与长期演进留足空间。

这是一个「可以长期维护」而不是「一次性富文本」的架构。

