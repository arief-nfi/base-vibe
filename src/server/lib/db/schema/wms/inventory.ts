import { relations } from 'drizzle-orm';
import { date, decimal, integer, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { tenant } from '../system';
import { products } from './masterData';
import { bins } from './warehouse';

// Inventory Items Table
export const inventoryItems = pgTable('wms_inventory_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenant.id),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id),
  binId: uuid('bin_id')
    .notNull()
    .references(() => bins.id),
  availableQuantity: integer('available_quantity').notNull(),
  reservedQuantity: integer('reserved_quantity').notNull().default(0),
  expiryDate: date('expiry_date'),
  batchNumber: varchar('batch_number', { length: 100 }),
  lotNumber: varchar('lot_number', { length: 100 }),
  receivedDate: date('received_date'),
  costPerUnit: decimal('cost_per_unit', { precision: 10, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
});

// Relations
export const inventoryItemsRelations = relations(inventoryItems, ({ one }) => ({
  tenant: one(tenant, {
    fields: [inventoryItems.tenantId],
    references: [tenant.id],
  }),
  product: one(products, {
    fields: [inventoryItems.productId],
    references: [products.id],
  }),
  bin: one(bins, {
    fields: [inventoryItems.binId],
    references: [bins.id],
  }),
}));

// Type definitions
export type InventoryItem = typeof inventoryItems.$inferSelect;
export type NewInventoryItem = typeof inventoryItems.$inferInsert;
