import { useEffect, useMemo, useState } from '@lynx-js/react';
import './App.css';
import { HTMLRenderer } from 'lynx-html-renderer';
import htmlContent from '../html/showcase.html';

// 视觉测试 fixture 列表（与 visual-tests/fixtures/index.ts 保持一致）
const VISUAL_FIXTURES = [
  'basic-tags-cleaning',
  'base-url',
  'ars-1',
  'bbc-1',
  'aclu',
  'keep-tabular-data',
  'v8-blog',
  'medium-1',
  'wikipedia',
  'keep-images',
] as const;

export function App(props: { onRender?: () => void }) {
  const [removeAllStyle, setRemoveAllStyle] = useState(false);
  const [fixtureHtml, setFixtureHtml] = useState<string | null>(null);

  // 从 globalProps 获取主题状态
  const darkMode = useMemo(
    () => lynx.__globalProps.theme === 'Dark',
    [lynx.__globalProps.theme],
  );

  // 视觉测试模式：从 globalProps 读取 fixture id，fetch 加载 HTML
  useEffect(() => {
    const fixtureId = lynx.__globalProps.fixture as string | undefined;
    if (fixtureId && (VISUAL_FIXTURES as readonly string[]).includes(fixtureId)) {
      fetch(`/fixtures/${fixtureId}.html`)
        .then((res) => res.text())
        .then(setFixtureHtml)
        .catch((err) => console.error(`Failed to load fixture: ${fixtureId}`, err));
    }
  }, []);

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
        html={fixtureHtml ?? htmlContent}
        styleMode="css-class"
        removeAllStyle={removeAllStyle}
        darkMode={useDarkMode}
      />

      {/* 控制面板（仅非 fixture 模式显示） */}
      {!fixtureHtml && (
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
      )}
    </scroll-view>
  );
}
