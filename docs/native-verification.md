# 真机验证指南（PAPI 直绘 vs ReactLynx）

本文档介绍如何在真机上验证 Element PAPI 直绘路线（`PapiHTMLRenderer`）的渲染效果与性能。

## 前置要求

| 项目 | 说明 |
|------|------|
| LynxExplorer | Lynx 官方调试客户端（[iOS App Store](https://apps.apple.com/us/app/lynxexplorer/id6464515772) / [Android GitHub Releases](https://github.com/lynx-family/lynx-explorer/releases)），扫码加载开发页面 |
| 引擎版本 | Element API 需要较新引擎（参考 @lynx-js/genui 标注的 4.2+）。LynxExplorer 最新版默认满足；引擎不支持时 `PapiHTMLRenderer` 会自动降级到 `fallback` 节点 |
| 网络 | 手机与电脑同一局域网（扫码加载 dev server） |

## 一、启动与加载

```bash
pnpm dev
```

终端会输出二维码（由 `@lynx-js/qrcode-rsbuild-plugin` 生成），用 LynxExplorer 扫码打开页面。

> 浏览器调试（可选）：`cd example && npx rspeedy dev --environment web`，访问日志中的 Preview URL。web 平台需要 ReactLynx ≥ 0.129（旧版 `runOnMainThread` 通道存在死锁）。

## 二、渲染效果验证

页面底部控制面板提供四个按钮：

| 按钮 | 作用 |
|------|------|
| ⚛ ReactLynx / ⚡ PAPI 直绘 | 切换渲染引擎，肉眼对比两种模式的视觉效果 |
| 切换纯文本模式 | 验证 `removeAllStyle` 路径 |
| ↻ 重建 | 强制全量重建（key 换新），测更新场景 |
| ⏱ 基准 | 运行 A/B 渲染性能基准（见下节） |

验证要点：
- 文本样式（粗体/斜体/下划线/行内代码）在两种模式下视觉一致
- 表格、图片、嵌套结构与 ReactLynx 模式等价
- 「↻ 重建」后内容正确重现（PAPI 路径会清空宿主后重建）

## 三、性能基准测试

点击「⏱ 基准」按钮，自动运行 A/B 基准：

- **规模**：50 / 200 / 800 段 HTML（约 450 / 1,800 / 7,200 节点）
- **口径**：`setState` → 双帧 rAF（DOM 稳定）的耗时，每档 10~20 轮取**中位数**
- **输出**：
  1. 页面顶部结果面板（每档一行：`React Xms | PAPI Yms → N.Nx`）
  2. 控制台 `[BENCH-RESULT]` JSON（便于工具抓取）

### 读取结果的几种方式

**方式 1：直接看页面**（最简单）——结果面板在页面顶部，截图即可留档。

**方式 2：Lynx DevTool 面板**——LynxExplorer 内打开调试面板（摇一摇 / 菜单 → DevTool），Console 页签过滤 `BENCH-RESULT`。

**方式 3：电脑端 lynx-devtool CLI**（设备 USB 连接时，Android 需 `adb devices` 可见）：

```bash
# 列出已连接的调试客户端
node ~/.zcode/skills/lynx-devtool/scripts/index.mjs list-clients

# 远程打开页面（无需扫码）
node ~/.zcode/skills/lynx-devtool/scripts/index.mjs open "http://<电脑IP>:3000/index.lynx.bundle"

# 抓取 console 里的基准结果
node ~/.zcode/skills/lynx-devtool/scripts/index.mjs get-console --offset 0 --limit 50

# 远程截图（效果留档）
node ~/.zcode/skills/lynx-devtool/scripts/index.mjs take-screenshot -o /tmp/lynx-papi.png
```

### 注意事项

1. **Debug vs Release**：LynxExplorer 扫码加载的是 dev bundle（带调试桥、未充分优化），绝对值偏慢；两引擎同一环境对比，**相对比值**可信。正式性能验收请用 release 构建（`pnpm build-example` 产物）在目标 App 内测。
2. **首轮预热**：基准每档自带 warmup（首轮丢弃）；如需更稳数据可连点两次取第二次。
3. **真机 vs web**：web（浏览器）端数据仅供参考；native 引擎的主线程实现不同，务必以真机数据为准。

## 四、参考数据（web 真实管线，ReactLynx 0.129.2 + web-core 0.26.7）

| 文档规模 | ReactLynx 中位数 | PAPI 直绘中位数 | 加速比 |
|---------|----------------|----------------|--------|
| 50 段（451 节点） | 43~47ms | 33ms | ~1.4x |
| 200 段（1,801 节点） | 151~162ms | 33ms | ~4.7x |
| 800 段（7,201 节点） | 634~667ms | 34ms | **~19x** |

PAPI 直绘耗时基本恒定在双帧上限（≈2 帧 rAF），不随文档规模增长；ReactLynx 随节点数线性增长。

## 五、常见问题

**Q: PAPI 模式内容空白？**
引擎缺少 Element API 时组件会降级渲染 `fallback`（默认为空）。传入 `fallback={<HTMLRenderer html={html} />}` 可无缝回退；同时检查引擎版本 ≥ 4.2。

**Q: 真机扫码打不开？**
确认手机与电脑同网段；公司网络隔离时用手机热点。`pnpm dev` 默认监听 3000 端口，URL 形如 `http://<电脑IP>:3000/index.lynx.bundle?fullscreen=true`。

**Q: 想测自己业务的 HTML？**
把内容存为 `example/html/xxx.html` 并在 `example/src/App.tsx` 里 import，或直接传字符串给 `html` prop。
