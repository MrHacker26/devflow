ALTER TABLE "workflows" ADD COLUMN "share_token" text;--> statement-breakpoint
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_share_token_unique" UNIQUE("share_token");