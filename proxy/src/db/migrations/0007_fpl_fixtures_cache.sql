CREATE TABLE "fpl_fixtures_cache" (
	"season" text PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL,
	"fetched_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fpl_fixtures_cache" ADD CONSTRAINT "fpl_fixtures_cache_season_fpl_meta_season_fk" FOREIGN KEY ("season") REFERENCES "public"."fpl_meta"("season") ON DELETE no action ON UPDATE no action;
