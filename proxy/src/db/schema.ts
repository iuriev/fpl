import {
  boolean,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  fplTeamId: integer('fpl_team_id'),
  subscriptionTier: text('subscription_tier').notNull().default('free'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
});

export const watchlistEntry = pgTable(
  'watchlist_entry',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    teamId: integer('team_id').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [uniqueIndex('watchlist_entry_user_team_idx').on(t.userId, t.teamId)],
);

export const playerWatchlistEntry = pgTable(
  'player_watchlist_entry',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    playerId: integer('player_id').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [uniqueIndex('player_watchlist_entry_user_player_idx').on(t.userId, t.playerId)],
);

export const transferDraft = pgTable('transfer_draft', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  teamId: integer('team_id').notNull(),
  targetGw: integer('target_gw').notNull(),
  savedAt: timestamp('saved_at').notNull(),
  freeTransfers: integer('free_transfers').notNull(),
  chip: text('chip').notNull(),
  swaps: jsonb('swaps').notNull(),
  subs: jsonb('subs').notNull(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ─── FPL persistent cache tables ───────────────────────────────────────────

export const fplMeta = pgTable('fpl_meta', {
  season: text('season').primaryKey(),
  isComplete: boolean('is_complete').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const fplBootstrapCache = pgTable('fpl_bootstrap_cache', {
  id: serial('id').primaryKey(),
  season: text('season')
    .notNull()
    .references(() => fplMeta.season),
  data: jsonb('data').notNull(),
  fetchedAt: timestamp('fetched_at').notNull(),
  archived: boolean('archived').notNull().default(false),
});

export const fplGwLiveCache = pgTable(
  'fpl_gw_live_cache',
  {
    season: text('season').notNull(),
    gw: integer('gw').notNull(),
    data: jsonb('data').notNull(),
    frozen: boolean('frozen').notNull().default(false),
    fetchedAt: timestamp('fetched_at').notNull(),
  },
  (t) => [primaryKey({ columns: [t.season, t.gw] })],
);

export const fplSquadCache = pgTable(
  'fpl_squad_cache',
  {
    season: text('season').notNull(),
    teamId: integer('team_id').notNull(),
    gw: integer('gw').notNull(),
    data: jsonb('data').notNull(),
    frozen: boolean('frozen').notNull().default(false),
    fetchedAt: timestamp('fetched_at').notNull(),
  },
  (t) => [primaryKey({ columns: [t.season, t.teamId, t.gw] })],
);

export const fplDreamTeamCache = pgTable(
  'fpl_dream_team_cache',
  {
    season: text('season').notNull(),
    gw: integer('gw').notNull(),
    data: jsonb('data').notNull(),
    frozen: boolean('frozen').notNull().default(false),
    fetchedAt: timestamp('fetched_at').notNull(),
  },
  (t) => [primaryKey({ columns: [t.season, t.gw] })],
);

export const fplHistoryCache = pgTable(
  'fpl_history_cache',
  {
    season: text('season').notNull(),
    teamId: integer('team_id').notNull(),
    data: jsonb('data').notNull(),
    lastFinishedGw: integer('last_finished_gw').notNull(),
    fetchedAt: timestamp('fetched_at').notNull(),
  },
  (t) => [primaryKey({ columns: [t.season, t.teamId] })],
);

export const fplTransfersCache = pgTable(
  'fpl_transfers_cache',
  {
    season: text('season').notNull(),
    teamId: integer('team_id').notNull(),
    data: jsonb('data').notNull(),
    lastFinishedGw: integer('last_finished_gw').notNull(),
    fetchedAt: timestamp('fetched_at').notNull(),
  },
  (t) => [primaryKey({ columns: [t.season, t.teamId] })],
);
