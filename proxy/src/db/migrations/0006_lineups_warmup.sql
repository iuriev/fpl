CREATE TABLE "fpl_element_summary_cache" (
	"season" text NOT NULL,
	"element_id" integer NOT NULL,
	"data" jsonb NOT NULL,
	"fetched_at" timestamp NOT NULL,
	CONSTRAINT "fpl_element_summary_cache_season_element_id_pk" PRIMARY KEY("season","element_id")
);
