import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import * as gameweeksService from './gameweeks-service';
import * as entryService from './entry-service';
import * as squadService from './squad-service';

vi.mock('./gameweeks-service');
vi.mock('./entry-service');
vi.mock('./squad-service');

describe('Proxy Endpoints', () => {
  let app: Hono;

  beforeEach(() => {
    vi.clearAllMocks();
    app = new Hono();

    app.get('/api/gameweeks', async (c) => {
      try {
        const result = await gameweeksService.getGameweeks();
        return c.json(result);
      } catch {
        return c.json({ error: 'Unable to fetch gameweeks' }, { status: 500 });
      }
    });

    app.get('/api/entry/:teamId', async (c) => {
      try {
        const teamId = parseInt(c.req.param('teamId'), 10);
        if (isNaN(teamId) || teamId <= 0) {
          return c.json({ error: 'Invalid team ID' }, { status: 400 });
        }
        const result = await entryService.getEntry(teamId);
        return c.json(result);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        if (errorMsg.includes('404')) {
          return c.json({ error: 'Team not found' }, { status: 404 });
        }
        return c.json({ error: 'Unable to fetch team information' }, { status: 500 });
      }
    });

    app.get('/api/squad/:teamId/:gw', async (c) => {
      try {
        const teamId = parseInt(c.req.param('teamId'), 10);
        const gw = parseInt(c.req.param('gw'), 10);
        if (isNaN(teamId) || teamId <= 0 || isNaN(gw) || gw <= 0) {
          return c.json({ error: 'Invalid team ID or gameweek' }, { status: 400 });
        }
        const result = await squadService.getSquad(teamId, gw);
        return c.json(result);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        if (errorMsg.includes('No picks available')) {
          return c.json(
            { error: `No squad available for gameweek ${c.req.param('gw')}` },
            { status: 404 },
          );
        }
        if (errorMsg.includes('not found')) {
          return c.json({ error: 'Team or gameweek not found' }, { status: 404 });
        }
        return c.json({ error: 'Unable to fetch squad' }, { status: 500 });
      }
    });
  });

  describe('GET /api/gameweeks', () => {
    it('returns gameweeks', async () => {
      const mockResponse = {
        current: 10,
        gameweeks: [{ id: 1, name: 'Gameweek 1', finished: true }],
      };
      (gameweeksService.getGameweeks as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockResponse,
      );

      const req = new Request('http://localhost:3001/api/gameweeks');
      const res = await app.fetch(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toEqual(mockResponse);
    });

    it('returns 500 on error', async () => {
      (gameweeksService.getGameweeks as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('API error'),
      );

      const req = new Request('http://localhost:3001/api/gameweeks');
      const res = await app.fetch(req);

      expect(res.status).toBe(500);
    });
  });

  describe('GET /api/entry/:teamId', () => {
    it('returns entry data', async () => {
      const mockResponse = {
        teamId: 123,
        teamName: 'My Team',
        managerName: 'John Doe',
      };
      (entryService.getEntry as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockResponse);

      const req = new Request('http://localhost:3001/api/entry/123');
      const res = await app.fetch(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toEqual(mockResponse);
    });

    it('returns 400 for invalid team ID', async () => {
      const req = new Request('http://localhost:3001/api/entry/invalid');
      const res = await app.fetch(req);

      expect(res.status).toBe(400);
    });

    it('returns 404 for unknown team', async () => {
      (entryService.getEntry as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('FPL API error: 404 Not Found'),
      );

      const req = new Request('http://localhost:3001/api/entry/999999');
      const res = await app.fetch(req);

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/squad/:teamId/:gw', () => {
    it('returns squad data', async () => {
      const mockResponse = {
        gameweek: 1,
        summary: { totalPoints: 45, transfers: 0 },
        starters: [],
        bench: [],
      };
      (squadService.getSquad as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockResponse);

      const req = new Request('http://localhost:3001/api/squad/123/1');
      const res = await app.fetch(req);
      const data = await res.json() as Record<string, unknown>;

      expect(res.status).toBe(200);
      expect(data.gameweek).toBe(1);
    });

    it('returns 400 for invalid parameters', async () => {
      const req = new Request('http://localhost:3001/api/squad/invalid/1');
      const res = await app.fetch(req);

      expect(res.status).toBe(400);
    });

    it('returns 404 when no picks available', async () => {
      (squadService.getSquad as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('No picks available for gameweek 1'),
      );

      const req = new Request('http://localhost:3001/api/squad/123/1');
      const res = await app.fetch(req);

      expect(res.status).toBe(404);
    });
  });
});
