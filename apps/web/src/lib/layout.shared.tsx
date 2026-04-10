import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: '@deessejs/fp',
    },
    githubUrl: 'https://github.com/nesalia-inc/fp',
    links: [
      {
        text: 'Documentation',
        url: '/docs',
        active: 'nested-url',
      },
    ],
  };
}
