import { useEffect } from '@lynx-js/react';

import './App.css';

import { HTMLRenderer } from '../../src/index';

const html = `
<div style="padding:10px">
  <p>Hello <strong>World</strong><br/>Lynx</p>
  <img src="https://xxx.png" />
</div>
`;

export function App(props: { onRender?: () => void }) {
  useEffect(() => {
    console.info('Hello, ReactLynx');
  }, []);
  props.onRender?.();

  return (
    <view class="container">
      <HTMLRenderer html={html} />
    </view>
  );
}
