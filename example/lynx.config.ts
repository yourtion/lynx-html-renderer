import { codecovRspackPlugin } from '@codecov/rspack-plugin';
import { pluginQRCode } from '@lynx-js/qrcode-rsbuild-plugin';
import { pluginReactLynx } from '@lynx-js/react-rsbuild-plugin';
import { defineConfig } from '@lynx-js/rspeedy';
import { pluginWebPlatform } from '@lynx-js/web-platform-rsbuild-plugin';
import { pluginTypeCheck } from '@rsbuild/plugin-type-check';

const codecovDryRun = process.env.CODECOV_DRY_RUN === 'true';

export default defineConfig({
  source: {
    entry: {
      index: './src/index.tsx',
    },
  },
  environments: {
    // 显式保留默认 lynx 环境（声明 environments 后需完整列出，否则 lynx 环境丢失）
    lynx: {},
    web: {
      output: {
        // Web worker (web-core-worker-chunk) 与注入的 core-js polyfill 冲突，
        // 现代浏览器无需额外 polyfill
        polyfill: 'off',
      },
      plugins: [pluginWebPlatform()],
    },
  },
  output: {
    copy: [
      {
        from: 'html',
        to: 'html',
      },
    ],
  },
  plugins: [
    pluginQRCode({
      schema(url) {
        // We use `?fullscreen=true` to open the page in LynxExplorer in full screen mode
        return `${url}?fullscreen=true`;
      },
    }),
    pluginReactLynx({ engineVersion: '3.9' }),
    pluginTypeCheck({
      tsCheckerOptions: { typescript: { configFile: './src/tsconfig.json' } },
    }),
  ],
  tools: {
    rspack(config, { appendPlugins }) {
      // Add support for importing HTML files as raw strings to be used by HTMLRenderer component
      // This allows separating HTML content from TypeScript code for better maintainability
      config.module?.rules?.push({
        test: /\.html$/,
        type: 'asset/source',
      });

      appendPlugins(
        codecovRspackPlugin({
          enableBundleAnalysis:
            codecovDryRun || process.env.CODECOV_TOKEN !== undefined,
          bundleName: 'lhr-example',
          uploadToken: process.env.CODECOV_TOKEN,
          debug: true,
          uploadOverrides: {
            sha: process.env.GH_COMMIT_SHA,
          },
          dryRun: codecovDryRun,
          ...(codecovDryRun && { telemetry: false }),
        }),
      );
      return config;
    },
  },
});
