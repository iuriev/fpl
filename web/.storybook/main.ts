import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.ts', '../src/**/*.stories.tsx'],
  addons: ['@storybook/addon-vitest', '@storybook/addon-docs', '@chromatic-com/storybook'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  staticDirs: ['../public'],
};

export default config;
