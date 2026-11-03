// rspress.config.ts
export default {
  root: 'docs',
  title: 'Lynx HTML Renderer',
  description:
    'A lightweight and extensible renderer that renders HTML string on Lynx',
  themeConfig: {
    logo: '/logo.png',
    socialLinks: [
      {
        icon: 'github',
        content: 'https://github.com/yourtion/lynx-html-renderer',
      },
    ],
    nav: [
      {
        text: 'Home',
        link: '/',
      },
      {
        text: 'Guides',
        items: [
          { text: 'API Reference', link: '/api-reference' },
          { text: 'CSS Class Mode', link: '/css-class-mode' },
          { text: 'Toolchain', link: '/upgrade' },
          { text: 'Native Validation', link: '/native-validation' },
        ],
      },
      {
        text: 'Design',
        items: [
          {
            text: 'Architecture',
            link: '/architecture',
          },
          {
            text: 'Plugin',
            link: '/plugin',
          },
        ],
        position: 'right',
      },
      {
        text: 'Development',
        items: [
          { text: 'Mutation Testing', link: '/mutation-testing' },
          { text: 'Releases', link: '/releasing' },
          {
            text: 'Contributing',
            link: 'https://github.com/yourtion/lynx-html-renderer/blob/main/CONTRIBUTING.md',
          },
        ],
      },
    ],
  },
  markdown: {
    toc: {
      level: [2, 3],
    },
  },
};
