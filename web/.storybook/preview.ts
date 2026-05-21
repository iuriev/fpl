import type { Preview } from '@storybook/react';
import '../src/theme/colors_and_type.css';

const preview: Preview = {
  parameters: {
    layout: 'centered',
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
      },
    },
  },
};

export default preview;
