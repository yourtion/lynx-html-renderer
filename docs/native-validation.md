# 内容正确性与 Lynx 原生验收

这轮修复区分两件事：库是否正确保留和转换 HTML 内容，以及宿主是否支持输出的 Lynx 属性。
自动测试通过、bundle 编译成功都不能替代 Android / iOS 原生布局验证。

## 本轮行为约定

| 输入 | 转换结果 |
| --- | --- |
| CSS 字符串、函数或 Data URL 内含分号 | 保留完整值，不按内部的分号切断 |
| `--Theme` 等 CSS 自定义属性 | 原样保留名称与大小写；变量求值交给宿主 |
| 同一属性重复声明 | 普通声明后者覆盖；`!important` 声明优先，保留后缀交给宿主 |
| `<pre>` 内嵌套 span/code 之间的空白 | 保留空格、换行、空行与 Tab，包括首尾空白；不添加 `pre-wrap` CSS |
| `<img width="100" height="50" style="width:200px">` | `width:200px; height:50px` |
| `<ol start="5" reversed><li>A</li><li value="9">B</li><li>C</li></ol>` | `5. A`、`9. B`、`8. C` |
| 默认限制下 2,000 层嵌套 | 在递归插件执行前抛出 `HTMLTransformError`，code 为 `LIMIT_EXCEEDED` |

图片尺寸规则是本库的 **HTML 输入转换约定**：现有已解析样式优先，原始内联尺寸次之，
HTML 尺寸属性兜底。HTML 数字尺寸转成显式 `px`；百分比和已有单位保留。
`removeAllStyle` 仍保留图片尺寸这一既有例外。零尺寸不回退到默认值。
相比旧版，数字尺寸的 IR 值由 `"100"` 变为 `"100px"`，属性尺寸也不再覆盖内联尺寸。

本次没有改变无尺寸图片的 `width:100%; height:auto` 默认策略，也没有启用 `auto-size`。
该默认策略不保证取得图片固有比例；是否启用 `auto-size` 或采用加载回调测量，需要宿主验收。
列表仍沿用现有文本标记布局，此次只修复编号，不承诺浏览器式悬挂缩进。

## Lynx 与 Web 的差异依据

- [Lynx white-space](https://lynxjs.org/api/css/properties/white-space.html)：仅支持 `normal`、`nowrap`；
  `normal` 不额外处理文本。因此先保留实际文本字符，并以原生 `<text>` 对照换行和 Tab 的表现。
  本次不实现完整 Web `white-space` 级联，也不处理浏览器对 pre 开头首个换行的特殊删除规则。
- [Lynx image](https://lynxjs.org/api/elements/built-in/image.html)：固有尺寸与比例有专门的 `auto-size` 能力。
  显式 `px` 宽高可以与手写 `<image>` 直接对照；未知尺寸不能直接按 HTML img 推断。
- [Lynx CSS variables](https://lynxjs.org/api/css/properties/css-variable.html)：变量名称需要保留 `--`。
  内联变量的实际生效还依赖宿主版本和 `enableCSSInlineVariables` 配置，修复名称不等于开启宿主能力。
- [ReactLynx testing-library](https://github.com/lynx-family/lynx-stack/tree/main/packages/react/testing-library)：
  测试环境基于 jsdom，节点内容及属性断言不能证明原生测量、换行、图片解码或绘制正确。

上述官网可能展示新版本文档。本项目同时对照已安装的 `@lynx-js/types 4.3.0`，
并继续使用 ReactLynx `0.126.2`、编译目标 `engineVersion: '3.9'`。
编译目标不是设备上的原生 SDK 版本；验收时需单独记录 SDK。

## 自动验证

```bash
pnpm test
pnpm typecheck
pnpm check
pnpm build-example
```

- `tests/utils/style-parser.test.ts`：声明边界、转义、注释、自定义属性及重复声明。
- `tests/core/content-correctness.test.ts`：pre 字符保真、样式模式、图片尺寸及移除样式选项。
- `tests/plugins/list-structure.test.ts`：起始值、倒序、条目重置、嵌套列表、非法编号回退。
- `tests/core/input-limits.test.ts`：资源边界、默认深度及插件执行前拒绝。
- `tests/integration/content-correctness.integration.test.tsx`：组件和直接渲染 API、属性传递及 limits 更新。

## 在 LynxExplorer 或自有宿主上验收

示例新增独立入口 `example/src/correctness.tsx`，与现有 showcase 一起构建，产物为
`example/dist/correctness.lynx.bundle`。入口不需要在线图片，使用项目已有 PNG 资源。

PR 预览部署完成后，机器人评论会同时给出“本次修复真机验收”和“原示例”的二维码。
优先在 LynxExplorer 扫描验收二维码，地址为 `<preview-url>/correctness.lynx.bundle?fullscreen=true`。
预览构建使用仓库锁定的 `pnpm@10.26.2`，两个 bundle 都配置了下载响应头。

1. 也可在本地 `pnpm build-example` 后运行 `pnpm dev`，从开发服务器取得 `correctness.lynx.bundle` 的地址。
   手机需能访问该地址；使用 LynxExplorer 打开，或由自有宿主加载。
   如通过静态服务器加载生产 bundle，应同时提供 `example/dist` 中的图片资源。
2. 分别切换 `inline`、`css-class` 两种模式。每组上方是 HTMLRenderer，下方是手写 Lynx 组件。
3. 第一组检查文字顺序、两空格缩进、换行、空行和 Tab。两侧应一致；Tab 的实际宽度由宿主决定。
4. 第二组等待图片加载后点击“测量原生尺寸”。通过原生 `boundingClientRect` 返回尺寸，并写入页面和日志。
   `actual-image` 与 `native-image` 应相等；在相同宿主缩放设置下对应 `200px × 50px`。
   `actual-pre` 与 `native-pre` 的尺寸及可见换行应相符；数值容差可按设备取整设为 1 像素。
5. 第三组检查编号为 `5、9、8`。这里验收编号，不要求两侧所有默认字体与边距逐像素相同。
6. 第四组是内联变量能力探针。支持并开启内联变量时，两块都应为绿色。
   两侧都不生效，先记录宿主配置；仅库输出不生效，再查转换链路。
7. 点击“运行 12 项转换检查”，应显示 `12 / 12 项通过`。切换模式后重新执行。
   该面板在设备 JS 运行时调用真实转换器，显示各项 PASS/FAIL 和实际值；
   CSS/Data URL 用例只验证声明完整性，不会加载测试 URL，也不把 PASS 当作原生 CSS 能力证明。

### 示例覆盖范围

| 修复项 | 原生对照 | 设备端转换检查 |
| --- | --- | --- |
| CSS 声明解析 | 内联变量能力探针 | 引号内分号、Data URL 分号、注释/转义引号、自定义属性大小写、同名声明 important 优先级 |
| pre 空白 | span 间换行、空行、两空格、Tab；可测量两侧尺寸 | code 间换行与首尾空白的完整字符值 |
| 图片尺寸 | 内联 200px 优先于属性 100，高度属性转成 50px；可测量两侧尺寸 | removeAllStyle 尺寸例外、零尺寸、百分比 |
| 列表编号 | start=5、reversed、li value=9，显示 5/9/8 | 嵌套倒序列表独立编号 |
| 输入限制 | 无布局依赖 | 2,000 层默认深度限制、节点数限制、字符串长度限制；必须返回 LIMIT_EXCEEDED |

结果记录建议：

| 平台 / 设备 | App / 原生 SDK | 样式模式 | pre 对照 | 图片两侧尺寸 | 编号 | 变量配置 / 结果 | 转换检查 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Android | 待填 | inline / css-class | 待验收 | 待验收 | 待验收 | 待验收 | 待验收 |
| iOS | 待填 | inline / css-class | 待验收 | 待验收 | 待验收 | 待验收 | 待验收 |

保存截图和控制台中的 `[content-correctness]` 测量日志。这个表保留为待验收，不能因单元测试或编译成功填成通过。
