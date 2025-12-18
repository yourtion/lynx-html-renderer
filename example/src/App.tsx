import { useEffect } from '@lynx-js/react';
import './App.css';
import { HTMLRenderer } from '../../src/index';

const html = `
<div style="padding: 20px; max-width: 800px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <header style="background-color: #f8f9fa; padding: 30px; border-radius: 8px; margin-bottom: 30px; text-align: center;">
    <h1 style="margin: 0 0 10px 0; font-size: 32px; color: #333;">Lynx HTML Renderer</h1>
    <p style="margin: 0; font-size: 16px; color: #666;">一个将 <strong>HTML 渲染到 Lynx 原生组件</strong> 的轻量、可扩展渲染引擎。</p>
    <p style="margin: 5px 0 0 0; font-size: 14px; color: #888;">A lightweight and extensible renderer that renders HTML string on Lynx.</p>
  </header>

  <section style="margin-bottom: 40px;">
    <h2 style="font-size: 24px; color: #333; margin-bottom: 20px; border-bottom: 2px solid #e9ecef; padding-bottom: 10px;">✨ 项目简介 | Introduction</h2>
    <p style="margin-bottom: 15px; line-height: 1.6; color: #495057;"><strong>HTML → Lynx Renderer</strong> 通过解析 HTML 并转换为一棵中间语义树（LynxNode），最终渲染为 Lynx 原生组件。</p>
    <p style="margin-bottom: 15px; line-height: 1.6; color: #495057;">该项目并非浏览器实现，而是一个 <strong>面向原生的 HTML 安全集渲染方案</strong>，适用于：</p>
    <ul style="margin: 15px 0 15px 30px; line-height: 1.6; color: #495057;">
      <li>内容页 / 详情页</li>
      <li>富文本展示</li>
      <li>配置化页面</li>
    </ul>
  </section>

  <section style="margin-bottom: 40px;">
    <h2 style="font-size: 24px; color: #333; margin-bottom: 20px; border-bottom: 2px solid #e9ecef; padding-bottom: 10px;">🎯 设计目标 | Design Goals</h2>
    <div style="display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 20px;">
      <div style="background-color: #e8f5e8; padding: 15px; border-radius: 6px; flex: 1; min-width: 200px;">
        <p style="margin: 0; font-weight: bold; color: #2e7d32;">✅ 渲染大部分真实业务中的 HTML 页面</p>
      </div>
      <div style="background-color: #e8f5e8; padding: 15px; border-radius: 6px; flex: 1; min-width: 200px;">
        <p style="margin: 0; font-weight: bold; color: #2e7d32;">✅ 支持文本、图片、Flex 布局、基础表格</p>
      </div>
      <div style="background-color: #e8f5e8; padding: 15px; border-radius: 6px; flex: 1; min-width: 200px;">
        <p style="margin: 0; font-weight: bold; color: #2e7d32;">✅ 支持用户自定义标签与渲染组件</p>
      </div>
    </div>
  </section>

  <section style="margin-bottom: 40px;">
    <h2 style="font-size: 24px; color: #333; margin-bottom: 20px; border-bottom: 2px solid #e9ecef; padding-bottom: 10px;">🖼️ 渲染示例 | Rendering Examples</h2>
    
    <h3 style="font-size: 18px; color: #495057; margin-bottom: 15px;">1. 文本格式化</h3>
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <p style="margin: 0 0 10px 0; line-height: 1.6;">这是一段 <strong>粗体</strong> 文本，<em>斜体</em> 文本，<u>下划线</u> 文本，和 <code>代码</code> 文本。</p>
      <p style="margin: 0; line-height: 1.6;">多种格式可以 <strong><em>组合使用</em></strong> 在同一个句子中。</p>
    </div>
    
    <h3 style="font-size: 18px; color: #495057; margin-bottom: 15px;">2. 表格支持</h3>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; background-color: white; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
      <thead>
        <tr style="background-color: #343a40; color: white;">
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">功能</th>
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">支持情况</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #dee2e6; color: #495057;">HTML 标签</td>
          <td style="padding: 12px; border-bottom: 1px solid #dee2e6; color: #28a745; font-weight: bold;">✅ 支持</td>
        </tr>
        <tr style="background-color: #f8f9fa;">
          <td style="padding: 12px; border-bottom: 1px solid #dee2e6; color: #495057;">CSS 样式</td>
          <td style="padding: 12px; border-bottom: 1px solid #dee2e6; color: #28a745; font-weight: bold;">✅ 支持</td>
        </tr>
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #dee2e6; color: #495057;">表格</td>
          <td style="padding: 12px; border-bottom: 1px solid #dee2e6; color: #28a745; font-weight: bold;">✅ 支持</td>
        </tr>
      </tbody>
    </table>
    
    <h3 style="font-size: 18px; color: #495057; margin-bottom: 15px;">3. 图片展示</h3>
    <div style="display: flex; gap: 15px; margin-bottom: 20px; flex-wrap: wrap;">
      <img src="https://placehold.co/150x100/png" style="width: 150px; height: 100px; object-fit: cover; border-radius: 8px;" />
      <img src="https://placehold.co/200x100/png" style="width: 200px; height: 100px; object-fit: cover; border-radius: 8px;" />
    </div>
    
    <h3 style="font-size: 18px; color: #495057; margin-bottom: 15px;">4. 嵌套结构</h3>
    <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <p style="margin: 0 0 15px 0;">这是一个包含嵌套结构的 div：</p>
      <div style="background-color: white; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
        <p style="margin: 0 0 10px 0;">内部 div 1</p>
        <div style="background-color: #f8f9fa; padding: 10px; border-radius: 4px;">
          <p style="margin: 0;">内部 div 2</p>
        </div>
      </div>
    </div>
  </section>

  <section style="margin-bottom: 40px;">
    <h2 style="font-size: 24px; color: #333; margin-bottom: 20px; border-bottom: 2px solid #e9ecef; padding-bottom: 10px;">📦 功能特性 | Features</h2>
    <ul style="margin: 15px 0 15px 30px; line-height: 1.6; color: #495057;">
      <li>HTML 标签 → Lynx 组件映射</li>
      <li>CSS style 安全集解析（白名单）</li>
      <li>文本语义（strong / em / code）</li>
      <li>基础表格支持（table / tr / td）</li>
      <li>用户自定义渲染组件</li>
      <li>插件化 Transform 机制</li>
    </ul>
  </section>

  <footer style="background-color: #343a40; color: white; padding: 30px; border-radius: 8px; text-align: center;">
    <p style="margin: 0 0 10px 0;">Lynx HTML Renderer - A lightweight and extensible renderer</p>
    <p style="margin: 0; font-size: 14px; opacity: 0.8;">&copy; 2025</p>
  </footer>
</div>
`;

export function App(props: { onRender?: () => void }) {
  useEffect(() => {
    console.info('Hello, ReactLynx');
  }, []);
  props.onRender?.();

  return (
    <scroll-view scroll-orientation="vertical" class="container">
      <HTMLRenderer html={html} />
    </scroll-view>
  );
}
