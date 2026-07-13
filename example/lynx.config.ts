import { codecovRspackPlugin } from '@codecov/rspack-plugin';
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
  environments: {
    lynx: {},
    web: {},
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
    pluginReactLynx(),
    pluginTypeCheck(),
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
          enableBundleAnalysis: process.env.CODECOV_TOKEN !== undefined,
          bundleName: 'lhr-example',
          uploadToken: process.env.CODECOV_TOKEN,
          debug: true,
          uploadOverrides: {
            sha: process.env.GH_COMMIT_SHA,
          },
          // dryRun: true,
        }),
      );
      return config;
    },
  },
});
