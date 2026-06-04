import {
  boolean,
  date,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  serial,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
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

export const fplElementSummaryCache = pgTable(
  'fpl_element_summary_cache',
  {
    season: text('season').notNull(),
    elementId: integer('element_id').notNull(),
    data: jsonb('data').notNull(),
    fetchedAt: timestamp('fetched_at').notNull(),
  },
  (t) => [primaryKey({ columns: [t.season, t.elementId] })],
);

export const fplFixturesCache = pgTable('fpl_fixtures_cache', {
  season: text('season')
    .notNull()
    .primaryKey()
    .references(() => fplMeta.season),
  data: jsonb('data').notNull(),
  fetchedAt: timestamp('fetched_at').notNull(),
});

// ─── PRED-09 prediction model tables (relational source of truth) ───────────

export const predModelRun = pgTable('pred_model_run', {
  id: uuid('id').primaryKey().defaultRandom(),
  kind: text('kind').notNull(),
  season: text('season').notNull(),
  targetEvent: integer('target_event'),
  params: jsonb('params'),
  metrics: jsonb('metrics'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const predEplMatch = pgTable(
  'pred_epl_match',
  {
    season: text('season').notNull(),
    matchDate: date('match_date').notNull(),
    homeSlug: text('home_slug').notNull(),
    awaySlug: text('away_slug').notNull(),
    fthg: smallint('fthg').notNull(),
    ftag: smallint('ftag').notNull(),
    ftr: text('ftr').notNull(),
    referee: text('referee'),
    homeShots: smallint('home_shots'),
    awayShots: smallint('away_shots'),
    oddsHome: doublePrecision('odds_home'),
    oddsDraw: doublePrecision('odds_draw'),
    oddsAway: doublePrecision('odds_away'),
    oddsOver25: doublePrecision('odds_over25'),
    oddsUnder25: doublePrecision('odds_under25'),
    ingestedAt: timestamp('ingested_at').notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.season, t.matchDate, t.homeSlug] }),
  ],
);

export const predTeamAlias = pgTable('pred_team_alias', {
  slug: text('slug').primaryKey(),
  fplTeamId: integer('fpl_team_id').notNull(),
  fdName: text('fd_name'),
  vaastavName: text('vaastav_name'),
});

export const predPlayerGwFact = pgTable(
  'pred_player_gw_fact',
  {
    season: text('season').notNull(),
    round: integer('round').notNull(),
    element: integer('element').notNull(),
    fixture: integer('fixture').notNull().default(0),
    teamId: integer('team_id'),
    position: text('position'),
    minutes: smallint('minutes'),
    starts: smallint('starts'),
    goals: smallint('goals'),
    assists: smallint('assists'),
    totalPoints: smallint('total_points'),
    xp: doublePrecision('xp'),
    expectedGoals: doublePrecision('expected_goals'),
    expectedAssists: doublePrecision('expected_assists'),
    defensiveContribution: smallint('defensive_contribution'),
    ingestedAt: timestamp('ingested_at').notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.season, t.round, t.element, t.fixture] }),
  ],
);

export const predTeamStrength = pgTable(
  'pred_team_strength',
  {
    modelRunId: uuid('model_run_id')
      .notNull()
      .references(() => predModelRun.id, { onDelete: 'cascade' }),
    season: text('season').notNull(),
    teamSlug: text('team_slug').notNull(),
    attack: doublePrecision('attack').notNull(),
    defence: doublePrecision('defence').notNull(),
    homeAdv: doublePrecision('home_adv').notNull(),
    mu: doublePrecision('mu').notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.modelRunId, t.season, t.teamSlug] }),
  ],
);

export const predFixtureTeam = pgTable(
  'pred_fixture_team',
  {
    modelRunId: uuid('model_run_id')
      .notNull()
      .references(() => predModelRun.id, { onDelete: 'cascade' }),
    season: text('season').notNull(),
    event: integer('event'),
    fixtureId: integer('fixture_id').notNull().default(0),
    teamId: integer('team_id').notNull().default(0),
    opponentTeamId: integer('opponent_team_id'),
    isHome: boolean('is_home').notNull(),
    lambdaFor: doublePrecision('lambda_for').notNull(),
    lambdaAgainst: doublePrecision('lambda_against').notNull(),
    csProb: doublePrecision('cs_prob').notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.modelRunId, t.season, t.fixtureId, t.teamId] }),
  ],
);

export const predPlayerGw = pgTable(
  'pred_player_gw',
  {
    modelRunId: uuid('model_run_id')
      .notNull()
      .references(() => predModelRun.id, { onDelete: 'cascade' }),
    event: integer('event').notNull(),
    fplCode: integer('fpl_code').notNull(),
    seasonElementId: integer('season_element_id').notNull(),
    xPts: doublePrecision('x_pts').notNull(),
    xGoals: doublePrecision('x_goals').notNull(),
    xAssists: doublePrecision('x_assists').notNull(),
    csProb: doublePrecision('cs_prob'),
    defconPts: doublePrecision('defcon_pts').notNull(),
    confidence: text('confidence').notNull(),
    epNextAnchor: doublePrecision('ep_next_anchor').notNull(),
    modelXPts: doublePrecision('model_x_pts').notNull(),
  },
  (t) => [primaryKey({ columns: [t.modelRunId, t.event, t.fplCode] })],
);
