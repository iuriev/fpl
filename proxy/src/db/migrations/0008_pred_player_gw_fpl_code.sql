ALTER TABLE "pred_player_gw" ADD COLUMN "fpl_code" integer;--> statement-breakpoint
ALTER TABLE "pred_player_gw" ADD COLUMN "season_element_id" integer;--> statement-breakpoint
UPDATE "pred_player_gw" SET "season_element_id" = "player_id" WHERE "season_element_id" IS NULL;--> statement-breakpoint
ALTER TABLE "pred_player_gw" DROP CONSTRAINT "pred_player_gw_model_run_id_event_player_id_pk";--> statement-breakpoint
ALTER TABLE "pred_player_gw" DROP COLUMN "player_id";--> statement-breakpoint
DELETE FROM "pred_player_gw" WHERE "fpl_code" IS NULL;--> statement-breakpoint
ALTER TABLE "pred_player_gw" ALTER COLUMN "fpl_code" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "pred_player_gw" ALTER COLUMN "season_element_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "pred_player_gw" ADD CONSTRAINT "pred_player_gw_model_run_id_event_fpl_code_pk" PRIMARY KEY("model_run_id","event","fpl_code");
