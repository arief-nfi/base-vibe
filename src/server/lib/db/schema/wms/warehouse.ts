import { relations } from 'drizzle-orm';
import { boolean, decimal, integer, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';
import { tenant } from '../system';

// Warehouses Table
export const warehouses = pgTable('wms_warehouses', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenant.id),
  name: varchar('name', { length: 255 }).notNull(),
  address: text('address'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
}, (t) => [
  uniqueIndex('warehouses_tenant_name_idx').on(t.tenantId, t.name),
]);

// Warehouse Configs Table
export const warehouseConfigs = pgTable('wms_warehouse_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  warehouseId: uuid('warehouse_id')
    .notNull()
    .references(() => warehouses.id),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenant.id),
  pickingStrategy: varchar('picking_strategy', { length: 50, enum: ['FIFO', 'FEFO', 'LIFO'] }).notNull().default('FEFO'),
  autoAssignBins: boolean('auto_assign_bins').notNull().default(true),
  requireBatchTracking: boolean('require_batch_tracking').notNull().default(false),
  requireExpiryTracking: boolean('require_expiry_tracking').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
});

// Zones Table
export const zones = pgTable('wms_zones', {
  id: uuid('id').primaryKey().defaultRandom(),
  warehouseId: uuid('warehouse_id')
    .notNull()
    .references(() => warehouses.id),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenant.id),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  uniqueIndex('zones_warehouse_name_idx').on(t.warehouseId, t.name),
]);

// Aisles Table
export const aisles = pgTable('wms_aisles', {
  id: uuid('id').primaryKey().defaultRandom(),
  zoneId: uuid('zone_id')
    .notNull()
    .references(() => zones.id),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenant.id),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  uniqueIndex('aisles_zone_name_idx').on(t.zoneId, t.name),
]);

// Shelves Table
export const shelves = pgTable('wms_shelves', {
  id: uuid('id').primaryKey().defaultRandom(),
  aisleId: uuid('aisle_id')
    .notNull()
    .references(() => aisles.id),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenant.id),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  uniqueIndex('shelves_aisle_name_idx').on(t.aisleId, t.name),
]);

// Bins Table
export const bins = pgTable('wms_bins', {
  id: uuid('id').primaryKey().defaultRandom(),
  shelfId: uuid('shelf_id')
    .notNull()
    .references(() => shelves.id),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenant.id),
  name: varchar('name', { length: 255 }).notNull(),
  barcode: varchar('barcode', { length: 100 }),
  maxWeight: decimal('max_weight', { precision: 10, scale: 3 }),
  maxVolume: decimal('max_volume', { precision: 10, scale: 3 }),
  fixedSku: varchar('fixed_sku', { length: 255 }),
  category: varchar('category', { length: 100 }),
  requiredTemperature: varchar('required_temperature', { length: 50 }),
  accessibilityScore: integer('accessibility_score').default(50),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  uniqueIndex('bins_shelf_name_idx').on(t.shelfId, t.name),
]);

// Relations
export const warehousesRelations = relations(warehouses, ({ one, many }) => ({
  tenant: one(tenant, {
    fields: [warehouses.tenantId],
    references: [tenant.id],
  }),
  config: one(warehouseConfigs),
  zones: many(zones),
}));

export const warehouseConfigsRelations = relations(warehouseConfigs, ({ one }) => ({
  warehouse: one(warehouses, {
    fields: [warehouseConfigs.warehouseId],
    references: [warehouses.id],
  }),
  tenant: one(tenant, {
    fields: [warehouseConfigs.tenantId],
    references: [tenant.id],
  }),
}));

export const zonesRelations = relations(zones, ({ one, many }) => ({
  warehouse: one(warehouses, {
    fields: [zones.warehouseId],
    references: [warehouses.id],
  }),
  tenant: one(tenant, {
    fields: [zones.tenantId],
    references: [tenant.id],
  }),
  aisles: many(aisles),
}));

export const aislesRelations = relations(aisles, ({ one, many }) => ({
  zone: one(zones, {
    fields: [aisles.zoneId],
    references: [zones.id],
  }),
  tenant: one(tenant, {
    fields: [aisles.tenantId],
    references: [tenant.id],
  }),
  shelves: many(shelves),
}));

export const shelvesRelations = relations(shelves, ({ one, many }) => ({
  aisle: one(aisles, {
    fields: [shelves.aisleId],
    references: [aisles.id],
  }),
  tenant: one(tenant, {
    fields: [shelves.tenantId],
    references: [tenant.id],
  }),
  bins: many(bins),
}));

export const binsRelations = relations(bins, ({ one }) => ({
  shelf: one(shelves, {
    fields: [bins.shelfId],
    references: [shelves.id],
  }),
  tenant: one(tenant, {
    fields: [bins.tenantId],
    references: [tenant.id],
  }),
}));

// Type definitions
export type Warehouse = typeof warehouses.$inferSelect;
export type NewWarehouse = typeof warehouses.$inferInsert;

export type WarehouseConfig = typeof warehouseConfigs.$inferSelect;
export type NewWarehouseConfig = typeof warehouseConfigs.$inferInsert;

export type Zone = typeof zones.$inferSelect;
export type NewZone = typeof zones.$inferInsert;

export type Aisle = typeof aisles.$inferSelect;
export type NewAisle = typeof aisles.$inferInsert;

export type Shelf = typeof shelves.$inferSelect;
export type NewShelf = typeof shelves.$inferInsert;

export type Bin = typeof bins.$inferSelect;
export type NewBin = typeof bins.$inferInsert;
