# LynxHTMLRenderer 插件系统

## 1. 设计目标（Design Goals）

### 核心目标

本插件系统用于 HTML AST → Capability-based LynxNode IR 的转换阶段，目标是：

1. **高度模块化**

   - HTML 语义处理被拆分为多个正交插件
   - 单个插件职责单一、可独立替换

2. **可被用户接管**

   - 内建插件无特殊地位
   - 用户可以禁用、替换、重排任意插件

3. **可演进**

   - 支持未来扩展：
     - table / list / media
     - 自定义标签
     - 业务组件映射

4. **与 Renderer 解耦**
   - 插件只负责语义与能力建模
   - 不关心最终如何渲染

---

## 2. 插件在整体架构中的位置

```
HTML String
   ↓
HTML Parser (htmlparser2)
   ↓
HTML AST
   ↓
┌──────────────────────────┐
│   Transform Pipeline     │
│                          │
│  normalize Phase         │
│  ├─ html-normalize       │
│  └─ text-merge           │
│                          │
│  structure Phase         │
│  ├─ block-structure      │
│  ├─ list-structure       │
│  └─ table-structure      │
│                          │
│  capability Phase        │
│  ├─ style-capability     │
│  ├─ layout-capability    │
│  └─ media-capability     │
│                          │
│  finalize Phase          │
│  (reserved)              │
└──────────────────────────┘
   ↓
LynxNode Tree (IR)
   ↓
Renderer + Adapter Mapping
   ↓
Lynx Native Components
```

**插件系统只存在于 Transform 阶段**

---

## 3. 核心类型定义

### 3.1 TransformPhase

```typescript
export type TransformPhase =
  | "normalize" // AST 预处理：实体解码、空白归一化
  | "structure" // HTML 结构语义：标签转换、树构建
  | "capability" // LynxNode 能力建模：样式、布局、媒体
  | "finalize"; // 收尾处理：预留扩展
```

### 3.2 TransformPlugin

```typescript
export interface TransformPlugin {
  /** 插件唯一标识（用于禁用 / 替换） */
  name: string;
  /** 所属执行阶段 */
  phase: TransformPhase;
  /** 同 phase 内执行顺序（数字越小越先执行） */
  order?: number;
  /** 是否默认启用 */
  enabledByDefault?: boolean;
  /** 插件执行入口 */
  apply(ctx: TransformContext): void;
}
```

### 3.3 TransformContext

```typescript
export interface TransformContext {
  /** 只读：HTML AST 根节点 */
  readonly ast: HtmlAstNode;
  /** 可写：LynxNode 根节点 */
  root: LynxNode;
  /** 工具方法 */
  utils: {
    /** 遍历 AST 所有节点 */
    walkAst(cb: (node: HtmlAstNode) => void): void;
    /** 创建新的 LynxNode */
    createNode(partial: Partial<LynxNode>): LynxNode;
    /** 替换已有 LynxNode */
    replaceNode(target: LynxNode, next: LynxNode): void;
  };
  /** 元数据：插件间传递非结构化信息 */
  metadata: Record<string, unknown>;
}
```

**metadata 常用键：**

- `removeAllClass`: 是否移除所有 class（默认 true）
- `removeAllStyle`: 是否移除所有 style（默认 false）

### 3.4 PluginConfig

```typescript
export interface PluginConfig {
  /** 禁用指定的内建插件 */
  disable?: string[];
  /** 替换指定的内建插件 */
  replace?: Record<string, TransformPlugin>;
  /** 添加额外的自定义插件 */
  extra?: TransformPlugin[];
}
```

## 4. 插件执行流程

### 4.1 执行顺序

插件按 **phase → order** 顺序执行：

```typescript
const phaseOrder: Record<TransformPhase, number> = {
  normalize: 1,
  structure: 2,
  capability: 3,
  finalize: 4,
};

// 先按 phase 分组，同 phase 内按 order 排序
plugins.sort((a, b) => {
  const phaseDiff = phaseOrder[a.phase] - phaseOrder[b.phase];
  if (phaseDiff !== 0) return phaseDiff;
  return (a.order ?? 0) - (b.order ?? 0);
});
```

### 4.2 执行模型

```typescript
for (const phase of ["normalize", "structure", "capability", "finalize"]) {
  const plugins = resolver.getPluginsByPhase(phase);
  for (const plugin of plugins) {
    plugin.apply(ctx);
  }
}
```

**特点：**

- 无条件顺序执行
- 无插件间直接调用
- 插件失败 = transform 失败

## 5. 内建插件详解

### 5.1 Normalize Phase（预处理阶段）

#### 5.1.1 html-normalize 插件

**职责：** 实体解码、空白节点标记

**文件：** `src/transform/plugins/normalize/html-normalize.plugin.ts`

**作用：**

- 遍历 AST，标记纯空白文本节点（通过 `isWhitespace` 标记）
- 后续 `block-structure` 会过滤这些节点，避免产生无意义的 `<text> </text>` 节点

#### 5.1.2 text-merge 插件

**职责：** 合并相邻文本节点

**文件：** `src/transform/plugins/normalize/text-merge.plugin.ts`

**作用：**

- 合并相邻的文本节点，减少节点数量
- 提升 Lynx 渲染性能

---

### 5.2 Structure Phase（结构转换阶段）

#### 5.2.1 block-structure 插件

**职责：** 将 HTML 块级元素转换为 LynxNode

**文件：** `src/transform/plugins/structure/block-structure.plugin.ts`

**支持的标签：** `div`, `p`, `span`, `h1`-`h6`, `blockquote`, `pre`, `br`

**核心逻辑：**

- 将 HTML AST 节点转换为 LynxNode 树
- 根据 `BLOCK_TAG_MAP` 映射标签到 Lynx 组件
- 保存原始 HTML 信息到 `meta.sourceTag` 和 `meta.sourceAttrs`
- 应用 `defaultStyle` 和 `capabilities`

**特殊处理：**

- **内联格式化标签**（strong、em、u、code）：不创建包装元素，只传递 `marks`（bold、italic、underline、code）
- **br 标签**：转换为 `\n` 文本节点
- **空白节点过滤**：过滤被 `html-normalize` 标记的节点

#### 5.2.2 list-structure 插件

**职责：** 列表结构转换，添加列表标记

**文件：** `src/transform/plugins/structure/list-structure.plugin.ts`

**支持的标签：** `ul`, `ol`, `li`

**作用：**

- 为 `ol` 的每个 `li` 添加数字标记（1. 2. 3.）
- 为 `ul` 的每个 `li` 添加项目符号（•）
- 标记合并到第一个文本子节点，或作为独立文本节点插入

#### 5.2.3 table-structure 插件

**职责：** 表格结构转换，扁平化 thead/tbody/tfoot

**文件：** `src/transform/plugins/structure/table-structure.plugin.ts`

**支持的标签：** `table`, `thead`, `tbody`, `tfoot`, `tr`, `th`, `td`

**作用：**

- 将 `table` 结构转换为 Lynx `view` 元素
- 扁平化 `thead`/`tbody`/`tfoot`，减少不必要的嵌套层级
- 单个子节点的 section 直接展开，多个子节点保留包装

---

### 5.3 Capability Phase（能力建模阶段）

#### 5.3.1 style-capability 插件

**职责：** CSS 样式解析与转换

**文件：** `src/transform/plugins/capability/style-capability.plugin.ts`

**作用：**

- 解析 `style` 属性（`font-size: 14px; color: red;`）
- 转换 kebab-case 为 camelCase（`font-size` → `fontSize`）
- 支持 `removeAllStyle` 选项（移除所有 style）
- 从 `meta.sourceAttrs.style` 提取样式并应用到 `props.style`

#### 5.3.2 layout-capability 插件

**职责：** 布局能力建模（block/inline）

**文件：** `src/transform/plugins/capability/layout-capability.plugin.ts`

**作用：**

- 为元素添加布局能力标记（block/inline）
- 从 `BLOCK_TAG_MAP` 读取 `capabilities` 并设置到元素
- 指导后续渲染器选择合适的布局组件

#### 5.3.3 media-capability 插件

**职责：** 媒体元素处理（img）

**文件：** `src/transform/plugins/capability/media-capability.plugin.ts`

**作用：**

- 提取 `img` 的 `src` 属性到 `props.src`
- 保持图片尺寸（**即使 `removeAllStyle=true`**）
- 三级优先级策略：
  1. HTML 属性：`width="200" height="100"`
  2. style 属性提取：`style="width:150px;height:100px"`
  3. 默认值：`width: 100%; height: auto`
- order 设为 100，确保在 style-capability 之后执行

## 6. 用户 API 使用示例

### 6.1 基础使用

```typescript
import { transformHTML } from "lynx-html-renderer/html-parser";

const html = "<div>Hello World</div>";
const nodes = transformHTML(html);
```

### 6.2 禁用内建插件

```typescript
const nodes = transformHTML(html, {
  plugins: {
    disable: ["table-structure"],
  },
});
```

### 6.3 替换内建插件

```typescript
const customPlugin: TransformPlugin = {
  name: "block-structure",
  phase: "structure",
  order: 10,
  apply(ctx) {
    // 自定义逻辑
  },
};

const nodes = transformHTML(html, {
  plugins: {
    replace: {
      "block-structure": customPlugin,
    },
  },
});
```

### 6.4 添加自定义插件

```typescript
const analyticsPlugin: TransformPlugin = {
  name: "analytics",
  phase: "capability",
  order: 1000,
  apply(ctx) {
    ctx.utils.walkAst((node) => {
      ctx.metadata.nodeCount = ((ctx.metadata.nodeCount as number) ?? 0) + 1;
    });
  },
};

const nodes = transformHTML(html, {
  plugins: {
    extra: [analyticsPlugin],
  },
});
```

### 6.5 完整配置示例

```typescript
const nodes = transformHTML(html, {
  removeAllClass: true,
  removeAllStyle: false,
  plugins: {
    disable: ["text-merge"],
    replace: {
      "media-capability": myCustomMediaPlugin,
    },
    extra: [analyticsPlugin, customTagPlugin],
  },
});
```

## 7. 插件开发指南

### 7.1 创建自定义插件

```typescript
import type { TransformPlugin } from "lynx-html-renderer/transform";

const myPlugin: TransformPlugin = {
  name: "my-custom-plugin",
  phase: "capability",
  order: 50,
  enabledByDefault: true,
  apply(ctx) {
    // 访问 AST
    ctx.utils.walkAst((node) => {
      // 处理 AST 节点
    });

    // 访问 LynxNode Tree
    const root = ctx.root;

    // 创建/替换节点
    const newNode = ctx.utils.createNode({ kind: "text", content: "Hello" });
    ctx.utils.replaceNode(oldNode, newNode);

    // 使用 metadata 与其他插件通信
    ctx.metadata.myData = "value";
  },
};
```

### 7.2 插件最佳实践

1. **职责单一**：每个插件只做一件事
2. **幂等性**：多次执行结果相同
3. **无副作用**：不修改全局状态
4. **错误处理**：捕获异常，避免影响其他插件
5. **性能考虑**：避免深层递归，使用 `walkAst` 优化遍历

### 7.3 选择正确的 Phase

| Phase        | 适用场景   | 示例               |
| ------------ | ---------- | ------------------ |
| `normalize`  | AST 预处理 | 实体解码、空白标记 |
| `structure`  | 结构转换   | 标签映射、树构建   |
| `capability` | 能力建模   | 样式解析、布局计算 |
| `finalize`   | 收尾处理   | 节点清理、统计信息 |

## 8. 与 Renderer 的职责边界

| Transform Plugin | Renderer |
| ---------------- | -------- |
| 语义归一化       | 组件选择 |
| 能力建模         | 布局实现 |
| 表格结构         | 表格绘制 |
| 样式解析         | 样式应用 |

**插件不关心 `createElement`，只关心语义建模**

## 9. 总结

该插件系统：

- ✅ 把 HTML 渲染问题拆解为可控的语义问题
- ✅ 允许用户**删除、替换、扩展**任何内建逻辑
- ✅ 为复杂场景（table / 自定义组件）预留演进空间
- ✅ 不牺牲 MVP 落地速度
- ✅ 保持向后兼容性

**内建插件清单（8 个）：**

| Phase      | Plugin            | Order |
| ---------- | ----------------- | ----- |
| normalize  | html-normalize    | 10    |
| normalize  | text-merge        | 20    |
| structure  | block-structure   | 10    |
| structure  | list-structure    | 20    |
| structure  | table-structure   | 30    |
| capability | style-capability  | 10    |
| capability | layout-capability | 20    |
| capability | media-capability  | 100   |

## 10. 相关文件

**核心类型：**

- `src/transform/types.ts` - TransformPlugin、TransformContext
- `src/transform/context.ts` - TransformContextImpl
- `src/transform/resolver.ts` - TransformPluginResolver
- `src/transform/engine.ts` - transformHTML 主引擎

**内建插件：**

- `src/transform/plugins/normalize/` - html-normalize、text-merge
- `src/transform/plugins/structure/` - block-structure、list-structure、table-structure
- `src/transform/plugins/capability/` - style-capability、layout-capability、media-capability

**工具函数：**

- `src/ast/walkers.ts` - AST 遍历工具
- `src/lynx/factory.ts` - LynxNode 工厂函数
