ALTER TABLE "workflows" ADD COLUMN "user_id" text;--> statement-breakpoint
UPDATE "workflows" SET "user_id" = (SELECT "id" FROM "user" ORDER BY "created_at" ASC LIMIT 1) WHERE "user_id" IS NULL;--> statement-breakpoint
DELETE FROM "workflows" WHERE "user_id" IS NULL;--> statement-breakpoint
ALTER TABLE "workflows" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "workflows_user_id_updated_at_idx" ON "workflows" USING btree ("user_id","updated_at");
