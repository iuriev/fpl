import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';

import { fixtureEntry, fixtureGameweeks, fixtureSquad, fixtureSquadEmpty } from '@/fixtures';

import { SquadScreen } from './SquadScreen';

const meta = {
  title: 'Screens/Squad',
  component: SquadScreen,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    teamId: 72828,
  },
  tags: ['autodocs', 'ai-generated'],
} satisfies Meta<typeof SquadScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

const baseHandlers = {
  gameweeks: [http.get('/api/gameweeks', () => HttpResponse.json(fixtureGameweeks))],
  entry: [http.get('/api/entry/:teamId', () => HttpResponse.json(fixtureEntry))],
};

export const Loaded: Story = {
  parameters: {
    msw: {
      handlers: {
        ...baseHandlers,
        squad: [http.get('/api/squad/:teamId/:gw', () => HttpResponse.json(fixtureSquad))],
      },
    },
  },
};

export const Loading: Story = {
  parameters: {
    msw: {
      handlers: {
        ...baseHandlers,
        squad: [
          http.get('/api/squad/:teamId/:gw', async () => {
            await new Promise(() => {});
          }),
        ],
      },
    },
  },
};

export const Empty: Story = {
  parameters: {
    msw: {
      handlers: {
        ...baseHandlers,
        squad: [http.get('/api/squad/:teamId/:gw', () => HttpResponse.json(fixtureSquadEmpty))],
      },
    },
  },
};

export const Error: Story = {
  parameters: {
    msw: {
      handlers: {
        ...baseHandlers,
        squad: [
          http.get('/api/squad/:teamId/:gw', () =>
            HttpResponse.json({ error: 'Upstream error' }, { status: 500 })
          ),
        ],
      },
    },
  },
};

export const ListViewLoaded: Story = {
  parameters: {
    initialEntries: ['/?teamId=72828&view=list'],
    msw: {
      handlers: {
        ...baseHandlers,
        squad: [http.get('/api/squad/:teamId/:gw', () => HttpResponse.json(fixtureSquad))],
      },
    },
  },
};

export const ListViewLoading: Story = {
  parameters: {
    initialEntries: ['/?teamId=72828&view=list'],
    msw: {
      handlers: {
        ...baseHandlers,
        squad: [
          http.get('/api/squad/:teamId/:gw', async () => {
            await new Promise(() => {});
          }),
        ],
      },
    },
  },
};
