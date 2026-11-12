import { useEffect, useMemo, useState } from '@lynx-js/react';
import './App.css';
import { HTMLRenderer, PapiHTMLRenderer } from 'lynx-html-renderer';
import htmlContent from '../html/showcase.html';

type EngineMode = 'react' | 'papi';

interface InlinePapiNode {
  kind: 'text' | 'element';
  v?: string;
  st?: string;
  cl?: string;
  tg?: string;
  at?: Record<string, string>;
  k?: InlinePapiNode[];
}

/**
 * PAPI 主线程构建器（注入模式）：库内源码的 worklet 不会被 ReactLynx
 * 编译链处理（第三方库限制），需在项目源码中定义并经 builder prop 注入。
 * 逻辑与 lynx-html-renderer 的 buildPapiTree 一致。
 */
function papiBuilder(
  hostRef: { current: unknown },
  roots: InlinePapiNode[],
): boolean {
  'main thread';
  const g = globalThis as unknown as Record<string, unknown>;
  const current = hostRef.current as { element?: unknown } | null;
  const host = current?.element ?? current ?? null;
  if (host === null || host === undefined) return false;
  if (typeof g.__CreateView !== 'function') return false;

  const uniId = (g.__GetElementUniqueID as (n: unknown) => number)(host);
  for (;;) {
    const first = (g.__FirstElement as (p: unknown) => unknown)(host);
    if (!first) break;
    (g.__RemoveElement as (p: unknown, c: unknown) => unknown)(host, first);
  }

  const appendNode = (node: InlinePapiNode, parent: unknown): void => {
    if (node.kind === 'text') {
      const text = (g.__CreateText as (u: number) => unknown)(uniId);
      if (node.st) {
        (g.__SetInlineStyles as (n: unknown, c: string) => void)(text, node.st);
      }
      if (node.cl) {
        (g.__SetClasses as (n: unknown, c: string) => void)(text, node.cl);
      }
      (g.__AppendElement as (p: unknown, c: unknown) => unknown)(
        text,
        (g.__CreateRawText as (v: string) => unknown)(node.v ?? ''),
      );
      (g.__AppendElement as (p: unknown, c: unknown) => unknown)(parent, text);
      return;
    }
    const element =
      node.tg === 'image'
        ? (g.__CreateImage as (u: number) => unknown)(uniId)
        : node.tg === 'text'
          ? (g.__CreateText as (u: number) => unknown)(uniId)
          : (g.__CreateView as (u: number) => unknown)(uniId);
    if (node.st) {
      (g.__SetInlineStyles as (n: unknown, c: string) => void)(
        element,
        node.st,
      );
    }
    if (node.cl) {
      (g.__SetClasses as (n: unknown, c: string) => void)(element, node.cl);
    }
    if (node.at) {
      for (const key in node.at) {
        (g.__SetAttribute as (n: unknown, k: string, v: string) => void)(
          element,
          key,
          node.at[key],
        );
      }
    }
    (g.__AppendElement as (p: unknown, c: unknown) => unknown)(parent, element);
    if (node.k) {
      for (const child of node.k) appendNode(child, element);
    }
  };

  for (const root of roots) appendNode(root, host);
  (g.__FlushElementTree as () => void)();
  return true;
}

interface BenchResult {
  size: number;
  react: number;
  papi: number;
}

/** 双帧 rAF 计时（native 用 lynx.requestAnimationFrame，web 用全局 rAF） */
function raf2(cb: () => void): void {
  const g = globalThis as unknown as {
    requestAnimationFrame?: (fn: () => void) => number;
  };
  const rafFn =
    typeof lynx !== 'undefined' &&
    typeof lynx.requestAnimationFrame === 'function'
      ? lynx.requestAnimationFrame.bind(lynx)
      : (g.requestAnimationFrame ?? ((fn: () => void) => setTimeout(fn, 16)));
  rafFn(() => rafFn(cb));
}

function genBenchHtml(paras: number): string {
  let html = '<article style="padding: 20px; line-height: 1.6;">';
  for (let i = 0; i < paras; i++) {
    html += `<p style="color: #333; margin-bottom: 1em;">Paragraph ${i} with <strong>bold</strong> and <em>italic</em> and <code>code</code> text.</p>`;
  }
  return `${html}</article>`;
}

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

export function App(props: { onRender?: () => void }) {
  const [removeAllStyle, setRemoveAllStyle] = useState(false);
  // 通过 globalProps.engine 可指定初始渲染引擎，便于对比验证
  const [engine, setEngine] = useState<EngineMode>(
    lynx.__globalProps?.engine === 'papi' ? 'papi' : 'react',
  );
  const [renderCount, setRenderCount] = useState(0);

  // 基准测试状态
  const [benchRound, setBenchRound] = useState<{
    engine: EngineMode;
    html: string;
    n: number;
  } | null>(null);
  const [benchStatus, setBenchStatus] = useState('');
  const [benchResults, setBenchResults] = useState<BenchResult[]>([]);
  const benchRunning = benchRound !== null || benchStatus.startsWith('运行中');

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

  const toggleEngine = () => {
    setEngine(engine === 'react' ? 'papi' : 'react');
  };

  const rerender = () => {
    setRenderCount(renderCount + 1);
  };

  /** 运行 A/B 渲染基准：setState → 双帧 rAF（DOM 稳定）耗时，中位数 */
  const runBenchmark = () => {
    if (benchRunning) return;
    setBenchResults([]);
    const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
    (async () => {
      const results: BenchResult[] = [];
      for (const size of [50, 200, 800]) {
        const html = genBenchHtml(size);
        const iters = size >= 800 ? 10 : 20;
        const medians: Record<string, number> = {};
        for (const eng of ['react', 'papi'] as const) {
          // 引擎间冷却：ReactLynx 大文档 snapshot 查询会触发引擎
          // CallLepusMethod 限流（error_code 204），等限流窗口滑走
          await sleep(eng === 'react' ? 600 : 300);
          setBenchStatus(
            `运行中 ${size}段 · ${eng === 'react' ? 'ReactLynx' : 'PAPI'}…`,
          );
          const times: number[] = [];
          for (let i = 0; i < iters; i++) {
            const t = await new Promise<number>((res) => {
              const t0 = Date.now();
              setBenchRound({ engine: eng, html, n: i });
              raf2(() => res(Date.now() - t0));
            });
            times.push(t);
          }
          medians[eng] = Math.round(median(times));
        }
        results.push({
          size,
          react: medians.react,
          papi: medians.papi,
        });
        setBenchResults([...results]);
        // 档间冷却：大文档查询量大，避免下一档继承限流计数
        await sleep(800);
      }
      setBenchRound(null);
      setBenchStatus('完成 ✓');
      console.info(
        '[BENCH-RESULT]',
        JSON.stringify(
          results.map((r) => ({
            size: r.size,
            react: r.react,
            papi: r.papi,
            speedup: Number.parseFloat(
              (r.react / Math.max(r.papi, 1)).toFixed(1),
            ),
          })),
        ),
      );
    })();
  };

  const useDarkMode = darkMode && removeAllStyle;

  const renderer =
    engine === 'papi' ? (
      <PapiHTMLRenderer
        key={`papi-${renderCount}`}
        html={htmlContent}
        styleMode="css-class"
        removeAllStyle={removeAllStyle}
        darkMode={useDarkMode}
        builder={papiBuilder}
      />
    ) : (
      <HTMLRenderer
        key={`react-${renderCount}`}
        html={htmlContent}
        styleMode="css-class"
        removeAllStyle={removeAllStyle}
        darkMode={useDarkMode}
      />
    );

  const benchRenderer = benchRound ? (
    benchRound.engine === 'react' ? (
      <HTMLRenderer key={`b-r-${benchRound.n}`} html={benchRound.html} />
    ) : (
      <PapiHTMLRenderer
        key={`b-p-${benchRound.n}`}
        html={benchRound.html}
        builder={papiBuilder}
      />
    )
  ) : null;

  return (
    <scroll-view
      scroll-orientation="vertical"
      class="container"
      style={{
        backgroundColor: useDarkMode ? '#121212' : '#fff',
      }}
    >
      {/* 基准结果面板 */}
      {(benchResults.length > 0 || benchStatus) && (
        <view
          style={{
            margin: '8px',
            padding: '10px',
            backgroundColor: useDarkMode ? '#1e1e1e' : '#f6f8fa',
            borderRadius: '8px',
          }}
        >
          <text
            style={{ fontSize: '13px', fontWeight: 'bold', color: '#24292f' }}
          >
            {`⏱ 渲染基准（中位数 ms）${benchStatus ? ` — ${benchStatus}` : ''}`}
          </text>
          {benchResults.map((r) => (
            <text
              key={r.size}
              style={{ fontSize: '12px', color: '#57606a', marginTop: '4px' }}
            >
              {`${r.size}段: React ${r.react}ms | PAPI ${r.papi}ms → ${(r.react / Math.max(r.papi, 1)).toFixed(1)}x`}
            </text>
          ))}
        </view>
      )}

      {benchRenderer ?? renderer}

      {/* 控制面板：icon-only 圆形按钮（窄屏安全，长文字见基准面板/文档） */}
      <view
        style={{
          position: 'fixed',
          bottom: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'row',
          gap: '14px',
        }}
      >
        <view
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: engine === 'papi' ? '#e83e8c' : '#6f42c1',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
          bindtap={toggleEngine}
        >
          <text style={{ color: 'white', fontSize: '22px' }}>
            {engine === 'papi' ? '⚡' : '⚛'}
          </text>
        </view>
        <view
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: removeAllStyle
              ? '#28a745'
              : darkMode
                ? '#333'
                : '#007bff',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
          bindtap={toggleStyle}
        >
          <text
            style={{ color: 'white', fontSize: '16px', fontWeight: 'bold' }}
          >
            Aa
          </text>
        </view>
        <view
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#fd7e14',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
          bindtap={rerender}
        >
          <text style={{ color: 'white', fontSize: '22px' }}>↻</text>
        </view>
        <view
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: benchRunning ? '#999' : '#17a2b8',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
          bindtap={runBenchmark}
        >
          <text style={{ color: 'white', fontSize: '20px' }}>⏱</text>
        </view>
      </view>
    </scroll-view>
  );
}
