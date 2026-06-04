CREATE TABLE "pred_epl_match" (
	"season" text NOT NULL,
	"match_date" date NOT NULL,
	"home_slug" text NOT NULL,
	"away_slug" text NOT NULL,
	"fthg" smallint NOT NULL,
	"ftag" smallint NOT NULL,
	"ftr" text NOT NULL,
	"referee" text,
	"home_shots" smallint,
	"away_shots" smallint,
	"odds_home" double precision,
	"odds_draw" double precision,
	"odds_away" double precision,
	"odds_over25" double precision,
	"odds_under25" double precision,
	"ingested_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pred_epl_match_season_match_date_home_slug_pk" PRIMARY KEY("season","match_date","home_slug")
);
--> statement-breakpoint
CREATE TABLE "pred_fixture_team" (
	"model_run_id" uuid NOT NULL,
	"season" text NOT NULL,
	"event" integer,
	"fixture_id" integer DEFAULT 0 NOT NULL,
	"team_id" integer DEFAULT 0 NOT NULL,
	"opponent_team_id" integer,
	"is_home" boolean NOT NULL,
	"lambda_for" double precision NOT NULL,
	"lambda_against" double precision NOT NULL,
	"cs_prob" double precision NOT NULL,
	CONSTRAINT "pred_fixture_team_model_run_id_season_fixture_id_team_id_pk" PRIMARY KEY("model_run_id","season","fixture_id","team_id")
);
--> statement-breakpoint
CREATE TABLE "pred_model_run" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"season" text NOT NULL,
	"target_event" integer,
	"params" jsonb,
	"metrics" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pred_player_gw" (
	"model_run_id" uuid NOT NULL,
	"event" integer NOT NULL,
	"player_id" integer NOT NULL,
	"x_pts" double precision NOT NULL,
	"x_goals" double precision NOT NULL,
	"x_assists" double precision NOT NULL,
	"cs_prob" double precision,
	"defcon_pts" double precision NOT NULL,
	"confidence" text NOT NULL,
	"ep_next_anchor" double precision NOT NULL,
	"model_x_pts" double precision NOT NULL,
	CONSTRAINT "pred_player_gw_model_run_id_event_player_id_pk" PRIMARY KEY("model_run_id","event","player_id")
);
--> statement-breakpoint
CREATE TABLE "pred_player_gw_fact" (
	"season" text NOT NULL,
	"round" integer NOT NULL,
	"element" integer NOT NULL,
	"fixture" integer DEFAULT 0 NOT NULL,
	"team_id" integer,
	"position" text,
	"minutes" smallint,
	"starts" smallint,
	"goals" smallint,
	"assists" smallint,
	"total_points" smallint,
	"xp" double precision,
	"expected_goals" double precision,
	"expected_assists" double precision,
	"defensive_contribution" smallint,
	"ingested_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pred_player_gw_fact_season_round_element_fixture_pk" PRIMARY KEY("season","round","element","fixture")
);
--> statement-breakpoint
CREATE TABLE "pred_team_alias" (
	"slug" text PRIMARY KEY NOT NULL,
	"fpl_team_id" integer NOT NULL,
	"fd_name" text,
	"vaastav_name" text
);
--> statement-breakpoint
CREATE TABLE "pred_team_strength" (
	"model_run_id" uuid NOT NULL,
	"season" text NOT NULL,
	"team_slug" text NOT NULL,
	"attack" double precision NOT NULL,
	"defence" double precision NOT NULL,
	"home_adv" double precision NOT NULL,
	"mu" double precision NOT NULL,
	CONSTRAINT "pred_team_strength_model_run_id_season_team_slug_pk" PRIMARY KEY("model_run_id","season","team_slug")
);
--> statement-breakpoint
ALTER TABLE "pred_fixture_team" ADD CONSTRAINT "pred_fixture_team_model_run_id_pred_model_run_id_fk" FOREIGN KEY ("model_run_id") REFERENCES "public"."pred_model_run"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pred_player_gw" ADD CONSTRAINT "pred_player_gw_model_run_id_pred_model_run_id_fk" FOREIGN KEY ("model_run_id") REFERENCES "public"."pred_model_run"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pred_team_strength" ADD CONSTRAINT "pred_team_strength_model_run_id_pred_model_run_id_fk" FOREIGN KEY ("model_run_id") REFERENCES "public"."pred_model_run"("id") ON DELETE cascade ON UPDATE no action;