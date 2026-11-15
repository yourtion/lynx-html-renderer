# 真机验证指南（PAPI 直绘 vs ReactLynx）

在真机上验证 `PapiHTMLRenderer`（`lynx-html-renderer/papi`）的渲染效果与性能。

## 前置要求

| 项目 | 说明 |
|------|------|
| LynxExplorer | Lynx 官方调试客户端，从 [lynxjs.org 快速开始](https://lynxjs.org/guide/start/quick-start.html) 页面下载（含 iOS / Android / iOS 模拟器版） |
| 引擎版本 | Element API 需要引擎 4.2+；不支持时组件自动降级到 `fallback` |
| 网络 | 手机与电脑同一局域网 |

## 一、启动与加载

```bash
pnpm dev
```

终端输出二维码，用 LynxExplorer 扫码打开（或手动输入 `http://<电脑IP>:3000/index.lynx.bundle?fullscreen=true`）。

## 二、渲染效果验证

页面底部的圆形控制按钮：

| 按钮 | 作用 |
|------|------|
| ⚛ / ⚡ | 切换渲染引擎，对比两种模式的视觉效果 |
| Aa | 纯文本模式（`removeAllStyle` 路径） |
| ↻ | 全量重建 |
| ⏱ | 运行 A/B 渲染基准 |

验证要点：文本样式（粗体/斜体/行内代码）两种模式视觉一致；表格、图片、嵌套结构等价；重建后内容正确重现。

## 三、性能基准

点击 ⏱ 自动运行：50 / 200 / 800 段 HTML（约 450 / 1,800 / 7,200 节点），口径为 `setState` → 双帧 rAF 的中位数（每档 10~20 轮）。

结果直接显示在页面顶部面板（`React Xms | PAPI Yms → N.Nx`），同时输出 `[BENCH-RESULT]` 到 console（LynxExplorer 调试面板可查）。

注意事项：
1. 扫码加载的是 dev bundle，绝对值偏慢；两引擎同环境对比，**比值可信**。正式验收用 `pnpm build-example` 的 release 产物。
2. 首轮自带 warmup；需更稳数据可连点两次取第二次。

## 四、参考数据（Android 模拟器 release，ReactLynx 0.129.2）

| 规模 | React | PAPI | 加速 |
|------|-------|------|------|
| 50 段 | ~100ms | ~80ms | ~1.2x |
| 200 段 | ~460ms | ~230ms | ~2.0x |
| 800 段 | ~1250ms | ~720ms | **~1.7x** |

Android 真机 release 约 1.4x（800 段）。web 平台数据不具参考性（管线实现不同）。

## 五、常见问题

**Q: PAPI 模式内容空白？**
两步排查：① 引擎缺 Element API → 传 `fallback={<HTMLRenderer html={html} />}` 降级；② `builder` 未注入且构建链不处理第三方库源码的 worklet（见 README「注入构建器」）。

**Q: 扫码打不开？**
确认同网段（公司网络常隔离客户端，换热点）；dev server 端口见终端输出。

**Q: 想测自己的 HTML？**
存为 `example/html/xxx.html` 并在 `example/src/App.tsx` import，或直接传给 `html` prop。
