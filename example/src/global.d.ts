/**
 * GlobalProps 类型扩展
 * 定义应用的全局属性
 */
declare module '@lynx-js/types' {
  interface GlobalProps {
    /**
     * 应用主题模式
     * 'light' - 明亮模式
     * 'dark' - 暗黑模式
     */
    theme?: 'Light' | 'Dark';
    /**
     * 视觉测试模式：指定要渲染的 fixture id
     * 不设置时渲染默认的 showcase.html
     */
    fixture?: string;
  }
}
