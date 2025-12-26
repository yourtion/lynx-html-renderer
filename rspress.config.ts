// rspress.config.ts
export default {
  root: "docs",
  title: "Lynx HTML Renderer",
  description:
    "A lightweight and extensible renderer that renders HTML string on Lynx",
  themeConfig: {
    logo: "/logo.png",
    socialLinks: [
      {
        icon: "github",
        content: "https://github.com/yourtion/lynx-html-renderer",
      },
    ],
    nav: [
      {
        text: "Home",
        link: "/",
      },
      {
        text: "Design",
        items: [
          {
            text: "Architecture",
            link: "/architecture",
          },
          {
            text: "Plugin",
            link: "/plugin",
          },
        ],
        position: "right",
      },
    ],
  },
  markdown: {
    toc: {
      level: [2, 3],
    },
  },
};
