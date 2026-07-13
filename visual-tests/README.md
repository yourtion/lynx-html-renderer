# Visual Alignment Tests

视觉对齐验证套件，用于评估 lynx-html-renderer 的渲染效果与浏览器渲染的对齐程度。

## 用法

```bash
# 回归测试（CI 友好）— 对比 Lynx Web Preview 与已提交的 baseline
pnpm test:visual

# 更新 baseline（手动确认渲染无误后）
pnpm test:visual:update

# 对齐评估 — 截取 Chromium + Lynx Web Preview，生成对比报告
pnpm test:visual:align

# 打开对齐报告
pnpm test:visual:report
```

## 架构

详见 `docs/visual-testing.md`
