// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import '../src/theme/colors_and_type.css';

import type { Preview } from '@storybook/react-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { initialize, mswLoader } from 'msw-storybook-addon';
import { MemoryRouter } from 'react-router-dom';

import { mswHandlers } from './msw-handlers';

initialize({ onUnhandledRequest: 'bypass' });

const preview: Preview = {
  decorators: [
    (Story) => {
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });
      return (
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <Story />
          </MemoryRouter>
        </QueryClientProvider>
      );
    },
  ],
  loaders: [mswLoader],
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'app',
      values: [
        { name: 'app', value: '#220035' },
        { name: 'pitch', value: '#1a8a3e' },
      ],
    },
    viewport: {
      defaultViewport: 'mobile1',
      viewports: {
        mobile1: {
          name: 'Mobile (390x844)',
          styles: {
            width: '390px',
            height: '844px',
          },
        },
        tablet: {
          name: 'Tablet (768x1024)',
          styles: {
            width: '768px',
            height: '1024px',
          },
        },
        desktop: {
          name: 'Desktop (1440x900)',
          styles: {
            width: '1440px',
            height: '900px',
          },
        },
      },
    },
    msw: {
      handlers: mswHandlers,
    },
  },
};

export default preview;
