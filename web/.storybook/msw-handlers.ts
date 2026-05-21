import { http, HttpResponse } from 'msw';

export const mswHandlers = {
  entry: [
    http.get('/api/entry/:teamId', () =>
      HttpResponse.json({
        teamId: 1234567,
        teamName: 'Example FC',
        managerName: 'Jane Smith',
      })
    ),
  ],
  gameweeks: [
    http.get('/api/gameweeks', () =>
      HttpResponse.json({
        current: 30,
        gameweeks: [
          { id: 30, name: 'Gameweek 30', finished: false },
          { id: 29, name: 'Gameweek 29', finished: true },
        ],
      })
    ),
  ],
  squad: [
    http.get('/api/squad/:teamId/:gameweek', () =>
      HttpResponse.json({
        gameweek: 30,
        summary: { totalPoints: 58, averagePoints: 51, rank: 123456, transfers: 1 },
        starters: [],
        bench: [],
      })
    ),
  ],
};
