import { codecovWebpackPlugin } from '@codecov/webpack-plugin';
import { pluginQRCode } from '@lynx-js/qrcode-rsbuild-plugin';
import { pluginReactLynx } from '@lynx-js/react-rsbuild-plugin';
import { defineConfig } from '@lynx-js/rspeedy';
import { pluginTypeCheck } from '@rsbuild/plugin-type-check';

export default defineConfig({
  source: {
    entry: {
      index: './src/index.tsx',
    },
  },
  plugins: [
    pluginQRCode({
      schema(url) {
        // We use `?fullscreen=true` to open the page in LynxExplorer in full screen mode
        return `${url}?fullscreen=true`;
      },
    }),
    pluginReactLynx(),
    pluginTypeCheck(),
  ],
  tools: {
    rspack(config, { appendPlugins }) {
      appendPlugins(
        codecovWebpackPlugin({
          enableBundleAnalysis: process.env.CODECOV_TOKEN !== undefined,
          bundleName: 'lynx-html-renderer-example',
          uploadToken: process.env.CODECOV_TOKEN,
        }),
      );
      return config;
    },
  },
});
