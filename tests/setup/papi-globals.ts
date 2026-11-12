/**
 * 为 Element PAPI 全局函数提供无害 stub。
 *
 * `src/papi/builder.ts` 的 worklet 在 testing-library 编译器转换后，
 * 模块加载阶段即可能引用主线程全局（`__CreateView` 等）。
 * 此 setup 在任何测试模块 import 之前装上 stub，避免 ReferenceError；
 * 具体行为由各测试（tests/papi.test.ts）安装的 mock 覆盖。
 */

const stubs: Record<string, unknown> = {
  __CreateView: () => ({}),
  __CreateScrollView: () => ({}),
  __CreateText: () => ({}),
  __CreateRawText: () => ({}),
  __CreateImage: () => ({}),
  __CreateWrapperElement: () => ({}),
  __GetElementUniqueID: () => 0,
  __FirstElement: () => undefined,
  __RemoveElement: () => ({}),
  __AppendElement: () => ({}),
  __InsertElementBefore: () => ({}),
  __SetAttribute: () => undefined,
  __AddClass: () => undefined,
  __SetClasses: () => undefined,
  __GetClasses: () => [],
  __SetStaticStyle: () => undefined,
  __SetInlineStyles: () => undefined,
  __GetInlineStyle: () => '',
  __GetInlineStyles: () => '',
  __SetID: () => undefined,
  __GetID: () => '',
  __SetCSSId: () => undefined,
  __AddEvent: () => undefined,
  __SetEvents: () => undefined,
  __GetParent: () => undefined,
  __GetChildren: () => [],
  __LastElement: () => undefined,
  __NextElement: () => undefined,
  __GetTag: () => '',
  __FlushElementTree: () => undefined,
};

for (const [name, fn] of Object.entries(stubs)) {
  const g = globalThis as unknown as Record<string, unknown>;
  if (typeof g[name] === 'undefined') {
    g[name] = fn;
  }
}
