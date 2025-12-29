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
    theme: 'Light' | 'Dark';
  }
}
