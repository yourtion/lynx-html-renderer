# 实现更完善的 Lynx HTML Renderer

## 1. 更新 LynxNode 类型定义

根据架构文档的 Capability-based 设计，更新 `typings.d.ts`：
- 为 `LynxElementNode` 添加 `role` 和 `capabilities` 字段
- 为 `LynxTextNode` 添加 `marks` 字段替代现有的 `props`
- 定义 `ElementRole` 和 `Capabilities` 类型

## 2. 实现无插件版 Transform

更新 `html-parser.ts`：
- 重构 `transformNode` 函数，支持 role 和 capabilities 赋值
- 扩展 TAG_MAP，添加更多 HTML 标签支持
- 实现文本语义标记（bold, italic, underline, code）
- 支持 void 元素处理

## 3. 实现基础 Renderer + Adapter 机制

创建新的渲染器架构：
- 实现 `LynxRenderAdapter` 接口
- 创建内置适配器：`ViewAdapter`、`TextAdapter`、`ImageAdapter`
- 实现适配器解析逻辑
- 更新 `HTMLRenderer` 组件，使用新的渲染器架构

## 4. 实现表格支持

扩展功能支持表格渲染：
- 添加表格标签映射（table, tr, td, th, thead, tbody, tfoot）
- 实现表格结构规整逻辑（展平 thead/tbody/tfoot）
- 创建 `TableAdapter` 和相关行、单元格适配器
- 添加表格样式处理

## 5. 接入插件系统

实现插件机制，支持扩展：
- 定义 `HtmlToLynxPlugin` 接口和插件上下文
- 实现插件注册和执行逻辑
- 支持 tag handler、style handler 和 node post-processor
- 保持现有功能不变，插件系统作为扩展点

## 6. 更新测试用例

确保所有功能都有测试覆盖：
- 更新现有测试用例以适应新的类型定义
- 添加新的测试用例，覆盖：
  - 新的 HTML 标签支持
  - 表格渲染
  - 文本语义标记
  - 适配器机制

## 7. 优化和完善

- 优化样式解析逻辑
- 完善错误处理
- 添加文档注释
- 确保代码符合 Biome 规范

## 预期成果

实现一个符合架构文档要求的、可扩展的 Lynx HTML Renderer，支持：
- 更丰富的 HTML 标签渲染
- 自定义标签和组件替换
- 表格渲染
- 插件扩展机制
- 安全子集渲染

该实现将具备长期演进能力，而非一次性富文本实现。