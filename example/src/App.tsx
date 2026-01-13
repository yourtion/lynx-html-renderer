import { useEffect, useMemo, useState } from '@lynx-js/react';
import './App.css';
import { HTMLRenderer } from 'lynx-html-renderer';
import htmlContent from '../html/showcase.html';

export function App(props: { onRender?: () => void }) {
  const [removeAllStyle, setRemoveAllStyle] = useState(false);

  // 从 globalProps 获取主题状态
  const darkMode = useMemo(
    () => lynx.__globalProps.theme === 'Dark',
    [lynx.__globalProps.theme],
  );

  useEffect(() => {
    console.info(`Hello, ReactLynx ${JSON.stringify(lynx.__globalProps)}`);
    console.info(`Dark mode: ${darkMode}, theme: ${lynx.__globalProps.theme}`);
  }, [darkMode]);
  props.onRender?.();

  const toggleStyle = () => {
    setRemoveAllStyle(!removeAllStyle);
  };

  const useDarkMode = darkMode && removeAllStyle;

  return (
    <scroll-view
      scroll-orientation="vertical"
      class="container"
      style={{
        backgroundColor: useDarkMode ? '#121212' : '#fff',
      }}
    >
      <HTMLRenderer
        html={htmlContent}
        styleMode="css-class"
        removeAllStyle={removeAllStyle}
        darkMode={useDarkMode}
      />

      {/* 控制面板 */}
      <view
        style={{
          position: 'fixed',
          bottom: '50px',
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      >
        <view
          style={{
            backgroundColor: removeAllStyle
              ? '#28a745'
              : darkMode
                ? '#333'
                : '#007bff',
            padding: '12px 24px',
            borderRadius: '8px',
            shadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
          bindtap={toggleStyle}
        >
          <text
            style={{
              color: 'white',
              fontSize: '16px',
              fontWeight: 'bold',
            }}
          >
            {removeAllStyle ? '✓ 已移除样式' : '切换纯文本模式'}
          </text>
        </view>
      </view>
    </scroll-view>
  );
}
