/**
 * FPL Proxy — Hono server fronting the public FPL API.
 * To be implemented in Phase 3.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

// Enable CORS
app.use('*', cors());

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok' });
});

// Placeholder endpoints
app.get('/api/gameweeks', (c) => {
  return c.json({
    current: 1,
    gameweeks: [],
  });
});

const port = process.env.PORT || 3001;

console.log(`Proxy server running on port ${port}`);

export default {
  port,
  fetch: app.fetch,
};
