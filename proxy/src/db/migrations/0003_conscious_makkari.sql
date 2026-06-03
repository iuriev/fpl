CREATE TABLE "transfer_draft" (
	"user_id" text PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"target_gw" integer NOT NULL,
	"saved_at" timestamp NOT NULL,
	"free_transfers" integer NOT NULL,
	"chip" text NOT NULL,
	"swaps" jsonb NOT NULL,
	"subs" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "transfer_draft" ADD CONSTRAINT "transfer_draft_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;