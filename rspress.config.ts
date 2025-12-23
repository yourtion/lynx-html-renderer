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
        link: 'https://github.com/yourtion/lynx-html-renderer',
      },
    ],
  },
  markdown: {
    toc: {
      level: [2, 3],
    },
  },
  navs: [
    {
      text: 'Architecture',
      link: '/architecture',
    },
  ],
};
