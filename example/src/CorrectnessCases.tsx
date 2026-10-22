import { type ReactNode, useState } from '@lynx-js/react';
import { HTMLRenderer } from 'lynx-html-renderer';
import reactLogo from './assets/react-logo.png';
import { runConversionChecks } from './correctness-checks';
import './App.css';

const preStyle = {
  fontFamily: 'monospace',
  fontSize: '16px',
  lineHeight: '24px',
  color: '#222',
  backgroundColor: '#eee',
  padding: '8px',
  overflow: 'visible',
};
const preHTML =
  '<pre id="actual-pre" style="font-family:monospace;font-size:16px;line-height:24px;color:#222;background-color:#eee;padding:8px;overflow:visible"><span>one</span>\n  <span>two</span>\n\n\t<span>three</span></pre>';
// The pinned CSSProperties type lacks a custom-property index signature.
const variableStyle = {
  '--sample-color': '#16803c',
  backgroundColor: 'var(--sample-color)',
  width: '80px',
  height: '30px',
};

function Pair(props: {
  title: string;
  expected: ReactNode;
  children: ReactNode;
}) {
  return (
    <view
      style={{
        padding: '12px',
        marginBottom: '12px',
        borderWidth: '1px',
        borderColor: '#aaa',
      }}
    >
      <text style={{ fontSize: '18px', color: '#111', marginBottom: '8px' }}>
        {props.title}
      </text>
      <text style={{ color: '#555' }}>HTMLRenderer</text>
      {props.children}
      <text style={{ color: '#555', marginTop: '8px' }}>手写 Lynx 对照</text>
      {props.expected}
    </view>
  );
}

/** Native acceptance fixture. No browser layout or screenshot is used as an oracle. */
export function CorrectnessCases() {
  const [styleMode, setStyleMode] = useState<'inline' | 'css-class'>('inline');
  const [measurements, setMeasurements] = useState<Record<string, string>>({});
  const [checks, setChecks] = useState<ReturnType<typeof runConversionChecks>>(
    [],
  );

  const measure = () => {
    const query = lynx.createSelectorQuery();
    for (const id of [
      'actual-pre',
      'native-pre',
      'actual-image',
      'native-image',
    ]) {
      query.select(`#${id}`).invoke({
        method: 'boundingClientRect',
        success: (result: { width: number; height: number }) => {
          const size = `${result.width} × ${result.height}`;
          setMeasurements((previous) => ({ ...previous, [id]: size }));
          console.info('[content-correctness]', styleMode, id, result);
        },
        fail: (error) => {
          setMeasurements((previous) => ({
            ...previous,
            [id]: `测量失败 ${error.code}`,
          }));
        },
      });
    }
    query.exec();
  };

  return (
    <scroll-view scroll-orientation="vertical" className="container">
      <text style={{ fontSize: '22px', padding: '12px', color: '#111' }}>
        内容正确性 · 原生验收
      </text>
      <view
        style={{ padding: '12px', backgroundColor: '#ddd' }}
        bindtap={() => {
          setStyleMode(styleMode === 'inline' ? 'css-class' : 'inline');
          setMeasurements({});
          setChecks([]);
        }}
      >
        <text>切换样式模式：{styleMode}</text>
      </view>
      <Pair
        title="1. 换行、空行、两空格与 Tab"
        expected={
          <text id="native-pre" style={preStyle}>
            <text>one</text>
            {'\n  '}
            <text>two</text>
            {'\n\n\t'}
            <text>three</text>
          </text>
        }
      >
        <HTMLRenderer html={preHTML} styleMode={styleMode} />
      </Pair>
      <Pair
        title="2. 图片：内联 200px 覆盖 HTML 100；高度 50px"
        expected={
          <image
            id="native-image"
            src={reactLogo}
            style={{ width: '200px', height: '50px' }}
          />
        }
      >
        <HTMLRenderer
          html={`<img id="actual-image" src="${reactLogo}" width="100" height="50" style="width:200px">`}
          styleMode={styleMode}
        />
      </Pair>
      <Pair
        title="3. 倒序和条目重置：5、9、8"
        expected={
          <view style={{ paddingLeft: '5px' }}>
            <text>5. A</text>
            <text>9. B</text>
            <text>8. C</text>
          </view>
        }
      >
        <HTMLRenderer
          html='<ol start="5" reversed><li>A</li><li value="9">B</li><li>C</li></ol>'
          styleMode={styleMode}
        />
      </Pair>
      <Pair
        title="4. 内联变量能力探针：两块应同为绿色（取决于宿主配置）"
        expected={<view style={variableStyle} />}
      >
        <HTMLRenderer
          html='<div style="--sample-color:#16803c;background-color:var(--sample-color);width:80px;height:30px"></div>'
          styleMode={styleMode}
        />
      </Pair>
      <view
        style={{ padding: '12px', backgroundColor: '#ddd' }}
        bindtap={measure}
      >
        <text>图片加载完成后：测量原生尺寸</text>
      </view>
      <text style={{ padding: '12px', color: '#111' }}>
        {Object.entries(measurements)
          .map(([id, size]) => `${id}: ${size}`)
          .join('\n') || '尚未测量'}
      </text>
      <view
        style={{ padding: '12px', backgroundColor: '#ddd' }}
        bindtap={() => {
          const result = runConversionChecks(styleMode);
          setChecks(result);
          console.info('[content-correctness] conversion', styleMode, result);
        }}
      >
        <text>运行 12 项转换检查（含 CSS 分号、图片、列表和输入限制）</text>
      </view>
      <text style={{ padding: '12px', color: '#111' }}>
        {checks.length
          ? `${checks.filter((check) => check.passed).length} / ${checks.length} 项通过`
          : '尚未运行转换检查'}
      </text>
      {checks.map((check) => (
        <view key={check.name} style={{ padding: '12px' }}>
          <text style={{ color: check.passed ? '#16803c' : '#b91c1c' }}>
            {check.passed ? 'PASS' : 'FAIL'} · {check.name}
          </text>
          <text style={{ color: '#555', fontSize: '12px' }}>
            {check.actual}
          </text>
        </view>
      ))}
      <text style={{ padding: '12px', marginBottom: '40px', color: '#555' }}>
        记录宿主版本、平台、模式、截图和测量值；两侧都异常时先检查宿主能力。
      </text>
    </scroll-view>
  );
}
