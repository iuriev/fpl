CREATE TABLE "fpl_bootstrap_cache" (
	"id" serial PRIMARY KEY NOT NULL,
	"season" text NOT NULL,
	"data" jsonb NOT NULL,
	"fetched_at" timestamp NOT NULL,
	"archived" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fpl_dream_team_cache" (
	"season" text NOT NULL,
	"gw" integer NOT NULL,
	"data" jsonb NOT NULL,
	"frozen" boolean DEFAULT false NOT NULL,
	"fetched_at" timestamp NOT NULL,
	CONSTRAINT "fpl_dream_team_cache_season_gw_pk" PRIMARY KEY("season","gw")
);
--> statement-breakpoint
CREATE TABLE "fpl_gw_live_cache" (
	"season" text NOT NULL,
	"gw" integer NOT NULL,
	"data" jsonb NOT NULL,
	"frozen" boolean DEFAULT false NOT NULL,
	"fetched_at" timestamp NOT NULL,
	CONSTRAINT "fpl_gw_live_cache_season_gw_pk" PRIMARY KEY("season","gw")
);
--> statement-breakpoint
CREATE TABLE "fpl_history_cache" (
	"season" text NOT NULL,
	"team_id" integer NOT NULL,
	"data" jsonb NOT NULL,
	"last_finished_gw" integer NOT NULL,
	"fetched_at" timestamp NOT NULL,
	CONSTRAINT "fpl_history_cache_season_team_id_pk" PRIMARY KEY("season","team_id")
);
--> statement-breakpoint
CREATE TABLE "fpl_meta" (
	"season" text PRIMARY KEY NOT NULL,
	"is_complete" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fpl_squad_cache" (
	"season" text NOT NULL,
	"team_id" integer NOT NULL,
	"gw" integer NOT NULL,
	"data" jsonb NOT NULL,
	"frozen" boolean DEFAULT false NOT NULL,
	"fetched_at" timestamp NOT NULL,
	CONSTRAINT "fpl_squad_cache_season_team_id_gw_pk" PRIMARY KEY("season","team_id","gw")
);
--> statement-breakpoint
CREATE TABLE "fpl_transfers_cache" (
	"season" text NOT NULL,
	"team_id" integer NOT NULL,
	"data" jsonb NOT NULL,
	"last_finished_gw" integer NOT NULL,
	"fetched_at" timestamp NOT NULL,
	CONSTRAINT "fpl_transfers_cache_season_team_id_pk" PRIMARY KEY("season","team_id")
);
--> statement-breakpoint
ALTER TABLE "fpl_bootstrap_cache" ADD CONSTRAINT "fpl_bootstrap_cache_season_fpl_meta_season_fk" FOREIGN KEY ("season") REFERENCES "public"."fpl_meta"("season") ON DELETE no action ON UPDATE no action;