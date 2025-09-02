CREATE TABLE "integration_webhook" (
	"id" uuid PRIMARY KEY NOT NULL,
	"partner_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"url" varchar(1000) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "integration_webhook" ADD CONSTRAINT "integration_webhook_partner_id_master_partner_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."master_partner"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_webhook" ADD CONSTRAINT "integration_webhook_tenant_id_sys_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."sys_tenant"("id") ON DELETE no action ON UPDATE no action;