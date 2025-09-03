CREATE TABLE "wms_package_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"units_per_package" integer,
	"barcode" varchar(100),
	"dimensions" varchar(100),
	"weight" numeric(10, 3),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wms_product_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(100),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wms_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"product_type_id" uuid,
	"package_type_id" uuid,
	"sku" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"minimum_stock_level" integer,
	"reorder_point" integer,
	"required_temperature_min" numeric(5, 2),
	"required_temperature_max" numeric(5, 2),
	"weight" numeric(10, 3),
	"dimensions" varchar(100),
	"is_active" boolean DEFAULT true NOT NULL,
	"has_expiry_date" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wms_customer_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"location_type" varchar(50) NOT NULL,
	"address" text,
	"city" varchar(100),
	"state" varchar(100),
	"postal_code" varchar(20),
	"country" varchar(100),
	"latitude" numeric(9, 6),
	"longitude" numeric(9, 6),
	"contact_person" varchar(255),
	"phone" varchar(50),
	"email" varchar(255),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wms_customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"contact_person" varchar(255),
	"email" varchar(255),
	"phone" varchar(50),
	"tax_id" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wms_supplier_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supplier_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"location_type" varchar(50) DEFAULT 'pickup' NOT NULL,
	"address" text,
	"city" varchar(100),
	"state" varchar(100),
	"postal_code" varchar(20),
	"country" varchar(100),
	"latitude" numeric(9, 6),
	"longitude" numeric(9, 6),
	"contact_person" varchar(255),
	"phone" varchar(50),
	"email" varchar(255),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wms_suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"contact_person" varchar(255),
	"email" varchar(255),
	"phone" varchar(50),
	"tax_id" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wms_aisles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"zone_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wms_bins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shelf_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"barcode" varchar(100),
	"max_weight" numeric(10, 3),
	"max_volume" numeric(10, 3),
	"fixed_sku" varchar(255),
	"category" varchar(100),
	"required_temperature" varchar(50),
	"accessibility_score" integer DEFAULT 50,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wms_shelves" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"aisle_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wms_warehouse_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"picking_strategy" varchar(50) DEFAULT 'FEFO' NOT NULL,
	"auto_assign_bins" boolean DEFAULT true NOT NULL,
	"require_batch_tracking" boolean DEFAULT false NOT NULL,
	"require_expiry_tracking" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wms_warehouses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"address" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wms_zones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wms_inventory_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"bin_id" uuid NOT NULL,
	"available_quantity" integer NOT NULL,
	"reserved_quantity" integer DEFAULT 0 NOT NULL,
	"expiry_date" date,
	"batch_number" varchar(100),
	"lot_number" varchar(100),
	"received_date" date,
	"cost_per_unit" numeric(10, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wms_purchase_order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"purchase_order_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"ordered_quantity" integer NOT NULL,
	"received_quantity" integer DEFAULT 0 NOT NULL,
	"unit_cost" numeric(10, 2),
	"total_cost" numeric(15, 2),
	"expected_expiry_date" date,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wms_purchase_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"order_number" varchar(100) NOT NULL,
	"supplier_id" uuid NOT NULL,
	"supplier_location_id" uuid,
	"status" varchar(50) NOT NULL,
	"workflow_state" varchar(50),
	"order_date" date NOT NULL,
	"expected_delivery_date" date,
	"total_amount" numeric(15, 2),
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wms_sales_order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sales_order_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"ordered_quantity" integer NOT NULL,
	"allocated_quantity" integer DEFAULT 0 NOT NULL,
	"picked_quantity" integer DEFAULT 0 NOT NULL,
	"unit_price" numeric(10, 2),
	"total_price" numeric(15, 2),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wms_sales_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"order_number" varchar(100) NOT NULL,
	"customer_id" uuid NOT NULL,
	"billing_location_id" uuid,
	"shipping_location_id" uuid,
	"shipping_method_id" uuid,
	"status" varchar(50) NOT NULL,
	"workflow_state" varchar(50),
	"order_date" date NOT NULL,
	"requested_delivery_date" date,
	"total_amount" numeric(15, 2),
	"tracking_number" varchar(100),
	"delivery_instructions" text,
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wms_shipping_methods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"method_type" varchar(20) NOT NULL,
	"name" varchar(255) NOT NULL,
	"estimated_days" integer,
	"cost_calculation" varchar(50),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wms_cycle_count_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cycle_count_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"bin_id" uuid NOT NULL,
	"system_quantity" integer NOT NULL,
	"counted_quantity" integer,
	"variance_quantity" integer,
	"variance_amount" numeric(15, 2),
	"reason_code" varchar(50),
	"reason_description" text,
	"counted_by" uuid,
	"counted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wms_cycle_counts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"count_number" varchar(100) NOT NULL,
	"status" varchar(50) NOT NULL,
	"count_type" varchar(50) DEFAULT 'partial' NOT NULL,
	"scheduled_date" date,
	"completed_date" date,
	"variance_threshold" numeric(5, 2) DEFAULT '0.00',
	"total_variance_amount" numeric(15, 2),
	"notes" text,
	"created_by" uuid,
	"approved_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wms_package_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"package_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wms_packages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"shipment_id" uuid NOT NULL,
	"package_number" varchar(100) NOT NULL,
	"barcode" varchar(100),
	"dimensions" varchar(100),
	"weight" numeric(10, 3),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "wms_packages_barcode_unique" UNIQUE("barcode")
);
--> statement-breakpoint
CREATE TABLE "wms_shipments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"sales_order_id" uuid NOT NULL,
	"shipment_number" varchar(100) NOT NULL,
	"transporter_id" uuid,
	"shipping_method_id" uuid,
	"tracking_number" varchar(100),
	"status" varchar(50) NOT NULL,
	"shipping_date" timestamp,
	"delivery_date" timestamp,
	"total_weight" numeric(10, 3),
	"total_volume" numeric(10, 3),
	"total_cost" numeric(15, 2),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wms_transporters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"contact_person" varchar(255),
	"phone" varchar(50),
	"email" varchar(255),
	"service_areas" json,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wms_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"action" varchar(100) NOT NULL,
	"resource_type" varchar(100) NOT NULL,
	"resource_id" uuid NOT NULL,
	"old_value" json,
	"new_value" json,
	"ip_address" varchar(50),
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wms_generated_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"document_type" varchar(50) NOT NULL,
	"reference_type" varchar(50) NOT NULL,
	"reference_id" uuid NOT NULL,
	"file_path" text NOT NULL,
	"generated_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wms_login_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"login_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" varchar(50),
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE "wms_movement_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"from_bin_id" uuid,
	"to_bin_id" uuid,
	"quantity_changed" integer NOT NULL,
	"movement_type" varchar(50) NOT NULL,
	"reference_type" varchar(50),
	"reference_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wms_workflow_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"workflow_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"step_order" integer NOT NULL,
	"step_type" varchar(50) NOT NULL,
	"description" text,
	"is_optional" boolean DEFAULT false NOT NULL,
	"configuration" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wms_workflows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"workflow_type" varchar(50) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" uuid NOT NULL,
	"configuration" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "wms_package_types" ADD CONSTRAINT "wms_package_types_tenant_id_sys_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."sys_tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_product_types" ADD CONSTRAINT "wms_product_types_tenant_id_sys_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."sys_tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_products" ADD CONSTRAINT "wms_products_tenant_id_sys_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."sys_tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_products" ADD CONSTRAINT "wms_products_product_type_id_wms_product_types_id_fk" FOREIGN KEY ("product_type_id") REFERENCES "public"."wms_product_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_products" ADD CONSTRAINT "wms_products_package_type_id_wms_package_types_id_fk" FOREIGN KEY ("package_type_id") REFERENCES "public"."wms_package_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_customer_locations" ADD CONSTRAINT "wms_customer_locations_customer_id_wms_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."wms_customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_customer_locations" ADD CONSTRAINT "wms_customer_locations_tenant_id_sys_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."sys_tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_customers" ADD CONSTRAINT "wms_customers_tenant_id_sys_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."sys_tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_supplier_locations" ADD CONSTRAINT "wms_supplier_locations_supplier_id_wms_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."wms_suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_supplier_locations" ADD CONSTRAINT "wms_supplier_locations_tenant_id_sys_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."sys_tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_suppliers" ADD CONSTRAINT "wms_suppliers_tenant_id_sys_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."sys_tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_aisles" ADD CONSTRAINT "wms_aisles_zone_id_wms_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."wms_zones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_aisles" ADD CONSTRAINT "wms_aisles_tenant_id_sys_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."sys_tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_bins" ADD CONSTRAINT "wms_bins_shelf_id_wms_shelves_id_fk" FOREIGN KEY ("shelf_id") REFERENCES "public"."wms_shelves"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_bins" ADD CONSTRAINT "wms_bins_tenant_id_sys_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."sys_tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_shelves" ADD CONSTRAINT "wms_shelves_aisle_id_wms_aisles_id_fk" FOREIGN KEY ("aisle_id") REFERENCES "public"."wms_aisles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_shelves" ADD CONSTRAINT "wms_shelves_tenant_id_sys_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."sys_tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_warehouse_configs" ADD CONSTRAINT "wms_warehouse_configs_warehouse_id_wms_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."wms_warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_warehouse_configs" ADD CONSTRAINT "wms_warehouse_configs_tenant_id_sys_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."sys_tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_warehouses" ADD CONSTRAINT "wms_warehouses_tenant_id_sys_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."sys_tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_zones" ADD CONSTRAINT "wms_zones_warehouse_id_wms_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."wms_warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_zones" ADD CONSTRAINT "wms_zones_tenant_id_sys_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."sys_tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_inventory_items" ADD CONSTRAINT "wms_inventory_items_tenant_id_sys_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."sys_tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_inventory_items" ADD CONSTRAINT "wms_inventory_items_product_id_wms_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."wms_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_inventory_items" ADD CONSTRAINT "wms_inventory_items_bin_id_wms_bins_id_fk" FOREIGN KEY ("bin_id") REFERENCES "public"."wms_bins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_purchase_order_items" ADD CONSTRAINT "wms_purchase_order_items_purchase_order_id_wms_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."wms_purchase_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_purchase_order_items" ADD CONSTRAINT "wms_purchase_order_items_product_id_wms_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."wms_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_purchase_order_items" ADD CONSTRAINT "wms_purchase_order_items_tenant_id_sys_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."sys_tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_purchase_orders" ADD CONSTRAINT "wms_purchase_orders_tenant_id_sys_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."sys_tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_purchase_orders" ADD CONSTRAINT "wms_purchase_orders_supplier_id_wms_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."wms_suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_purchase_orders" ADD CONSTRAINT "wms_purchase_orders_supplier_location_id_wms_supplier_locations_id_fk" FOREIGN KEY ("supplier_location_id") REFERENCES "public"."wms_supplier_locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_purchase_orders" ADD CONSTRAINT "wms_purchase_orders_created_by_sys_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."sys_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_sales_order_items" ADD CONSTRAINT "wms_sales_order_items_sales_order_id_wms_sales_orders_id_fk" FOREIGN KEY ("sales_order_id") REFERENCES "public"."wms_sales_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_sales_order_items" ADD CONSTRAINT "wms_sales_order_items_product_id_wms_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."wms_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_sales_order_items" ADD CONSTRAINT "wms_sales_order_items_tenant_id_sys_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."sys_tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_sales_orders" ADD CONSTRAINT "wms_sales_orders_tenant_id_sys_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."sys_tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_sales_orders" ADD CONSTRAINT "wms_sales_orders_customer_id_wms_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."wms_customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_sales_orders" ADD CONSTRAINT "wms_sales_orders_billing_location_id_wms_customer_locations_id_fk" FOREIGN KEY ("billing_location_id") REFERENCES "public"."wms_customer_locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_sales_orders" ADD CONSTRAINT "wms_sales_orders_shipping_location_id_wms_customer_locations_id_fk" FOREIGN KEY ("shipping_location_id") REFERENCES "public"."wms_customer_locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_sales_orders" ADD CONSTRAINT "wms_sales_orders_shipping_method_id_wms_shipping_methods_id_fk" FOREIGN KEY ("shipping_method_id") REFERENCES "public"."wms_shipping_methods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_sales_orders" ADD CONSTRAINT "wms_sales_orders_created_by_sys_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."sys_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_shipping_methods" ADD CONSTRAINT "wms_shipping_methods_tenant_id_sys_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."sys_tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_cycle_count_items" ADD CONSTRAINT "wms_cycle_count_items_cycle_count_id_wms_cycle_counts_id_fk" FOREIGN KEY ("cycle_count_id") REFERENCES "public"."wms_cycle_counts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_cycle_count_items" ADD CONSTRAINT "wms_cycle_count_items_tenant_id_sys_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."sys_tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_cycle_count_items" ADD CONSTRAINT "wms_cycle_count_items_product_id_wms_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."wms_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_cycle_count_items" ADD CONSTRAINT "wms_cycle_count_items_bin_id_wms_bins_id_fk" FOREIGN KEY ("bin_id") REFERENCES "public"."wms_bins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_cycle_count_items" ADD CONSTRAINT "wms_cycle_count_items_counted_by_sys_user_id_fk" FOREIGN KEY ("counted_by") REFERENCES "public"."sys_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_cycle_counts" ADD CONSTRAINT "wms_cycle_counts_tenant_id_sys_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."sys_tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_cycle_counts" ADD CONSTRAINT "wms_cycle_counts_created_by_sys_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."sys_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_cycle_counts" ADD CONSTRAINT "wms_cycle_counts_approved_by_sys_user_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."sys_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_package_items" ADD CONSTRAINT "wms_package_items_package_id_wms_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."wms_packages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_package_items" ADD CONSTRAINT "wms_package_items_product_id_wms_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."wms_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_package_items" ADD CONSTRAINT "wms_package_items_tenant_id_sys_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."sys_tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_packages" ADD CONSTRAINT "wms_packages_tenant_id_sys_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."sys_tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_packages" ADD CONSTRAINT "wms_packages_shipment_id_wms_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "public"."wms_shipments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_shipments" ADD CONSTRAINT "wms_shipments_tenant_id_sys_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."sys_tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_shipments" ADD CONSTRAINT "wms_shipments_sales_order_id_wms_sales_orders_id_fk" FOREIGN KEY ("sales_order_id") REFERENCES "public"."wms_sales_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_shipments" ADD CONSTRAINT "wms_shipments_transporter_id_wms_transporters_id_fk" FOREIGN KEY ("transporter_id") REFERENCES "public"."wms_transporters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_shipments" ADD CONSTRAINT "wms_shipments_shipping_method_id_wms_shipping_methods_id_fk" FOREIGN KEY ("shipping_method_id") REFERENCES "public"."wms_shipping_methods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_transporters" ADD CONSTRAINT "wms_transporters_tenant_id_sys_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."sys_tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_audit_logs" ADD CONSTRAINT "wms_audit_logs_tenant_id_sys_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."sys_tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_audit_logs" ADD CONSTRAINT "wms_audit_logs_user_id_sys_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."sys_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_generated_documents" ADD CONSTRAINT "wms_generated_documents_tenant_id_sys_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."sys_tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_generated_documents" ADD CONSTRAINT "wms_generated_documents_generated_by_sys_user_id_fk" FOREIGN KEY ("generated_by") REFERENCES "public"."sys_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_login_history" ADD CONSTRAINT "wms_login_history_tenant_id_sys_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."sys_tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_login_history" ADD CONSTRAINT "wms_login_history_user_id_sys_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."sys_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_movement_history" ADD CONSTRAINT "wms_movement_history_tenant_id_sys_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."sys_tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_movement_history" ADD CONSTRAINT "wms_movement_history_user_id_sys_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."sys_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_movement_history" ADD CONSTRAINT "wms_movement_history_item_id_wms_inventory_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."wms_inventory_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_movement_history" ADD CONSTRAINT "wms_movement_history_from_bin_id_wms_bins_id_fk" FOREIGN KEY ("from_bin_id") REFERENCES "public"."wms_bins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_movement_history" ADD CONSTRAINT "wms_movement_history_to_bin_id_wms_bins_id_fk" FOREIGN KEY ("to_bin_id") REFERENCES "public"."wms_bins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_workflow_steps" ADD CONSTRAINT "wms_workflow_steps_tenant_id_sys_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."sys_tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_workflow_steps" ADD CONSTRAINT "wms_workflow_steps_workflow_id_wms_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."wms_workflows"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_workflows" ADD CONSTRAINT "wms_workflows_tenant_id_sys_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."sys_tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wms_workflows" ADD CONSTRAINT "wms_workflows_created_by_sys_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."sys_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "package_types_tenant_name_idx" ON "wms_package_types" USING btree ("tenant_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "product_types_tenant_name_idx" ON "wms_product_types" USING btree ("tenant_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "products_tenant_sku_idx" ON "wms_products" USING btree ("tenant_id","sku");--> statement-breakpoint
CREATE UNIQUE INDEX "customers_tenant_name_idx" ON "wms_customers" USING btree ("tenant_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "suppliers_tenant_name_idx" ON "wms_suppliers" USING btree ("tenant_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "aisles_zone_name_idx" ON "wms_aisles" USING btree ("zone_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "bins_shelf_name_idx" ON "wms_bins" USING btree ("shelf_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "shelves_aisle_name_idx" ON "wms_shelves" USING btree ("aisle_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "warehouses_tenant_name_idx" ON "wms_warehouses" USING btree ("tenant_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "zones_warehouse_name_idx" ON "wms_zones" USING btree ("warehouse_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "purchase_orders_number_idx" ON "wms_purchase_orders" USING btree ("order_number");--> statement-breakpoint
CREATE UNIQUE INDEX "sales_orders_number_idx" ON "wms_sales_orders" USING btree ("order_number");--> statement-breakpoint
CREATE UNIQUE INDEX "cycle_counts_tenant_number_idx" ON "wms_cycle_counts" USING btree ("tenant_id","count_number");--> statement-breakpoint
CREATE UNIQUE INDEX "shipments_tenant_order_idx" ON "wms_shipments" USING btree ("tenant_id","sales_order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "shipments_number_idx" ON "wms_shipments" USING btree ("shipment_number");--> statement-breakpoint
CREATE UNIQUE INDEX "wms_workflow_steps_tenant_workflow_order_idx" ON "wms_workflow_steps" USING btree ("tenant_id","workflow_id","step_order");--> statement-breakpoint
CREATE UNIQUE INDEX "wms_workflows_tenant_name_idx" ON "wms_workflows" USING btree ("tenant_id","name");