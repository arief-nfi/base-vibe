import { relations } from 'drizzle-orm';
import { date, decimal, integer, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';
import { tenant, user } from '../system';
import { products } from './masterData';
import { bins } from './warehouse';

// Cycle Counts Table
export const cycleCounts = pgTable('wms_cycle_counts', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenant.id),
  countNumber: varchar('count_number', { length: 100 }).notNull(),
  status: varchar('status', { length: 50, enum: ['scheduled', 'in_progress', 'completed', 'approved', 'rejected'] }).notNull(),
  countType: varchar('count_type', { length: 50, enum: ['full', 'partial', 'spot'] }).notNull().default('partial'),
  scheduledDate: date('scheduled_date'),
  completedDate: date('completed_date'),
  varianceThreshold: decimal('variance_threshold', { precision: 5, scale: 2 }).default('0.00'),
  totalVarianceAmount: decimal('total_variance_amount', { precision: 15, scale: 2 }),
  notes: text('notes'),
  createdBy: uuid('created_by')
    .references(() => user.id),
  approvedBy: uuid('approved_by')
    .references(() => user.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
}, (t) => [
  uniqueIndex('cycle_counts_tenant_number_idx').on(t.tenantId, t.countNumber),
]);

// Cycle Count Items Table
export const cycleCountItems = pgTable('wms_cycle_count_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  cycleCountId: uuid('cycle_count_id')
    .notNull()
    .references(() => cycleCounts.id),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenant.id),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id),
  binId: uuid('bin_id')
    .notNull()
    .references(() => bins.id),
  systemQuantity: integer('system_quantity').notNull(),
  countedQuantity: integer('counted_quantity'),
  varianceQuantity: integer('variance_quantity'),
  varianceAmount: decimal('variance_amount', { precision: 15, scale: 2 }),
  reasonCode: varchar('reason_code', { length: 50 }),
  reasonDescription: text('reason_description'),
  countedBy: uuid('counted_by')
    .references(() => user.id),
  countedAt: timestamp('counted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const cycleCountsRelations = relations(cycleCounts, ({ one, many }) => ({
  tenant: one(tenant, {
    fields: [cycleCounts.tenantId],
    references: [tenant.id],
  }),
  createdByUser: one(user, {
    fields: [cycleCounts.createdBy],
    references: [user.id],
  }),
  approvedByUser: one(user, {
    fields: [cycleCounts.approvedBy],
    references: [user.id],
  }),
  items: many(cycleCountItems),
}));

export const cycleCountItemsRelations = relations(cycleCountItems, ({ one }) => ({
  cycleCount: one(cycleCounts, {
    fields: [cycleCountItems.cycleCountId],
    references: [cycleCounts.id],
  }),
  tenant: one(tenant, {
    fields: [cycleCountItems.tenantId],
    references: [tenant.id],
  }),
  product: one(products, {
    fields: [cycleCountItems.productId],
    references: [products.id],
  }),
  bin: one(bins, {
    fields: [cycleCountItems.binId],
    references: [bins.id],
  }),
  countedByUser: one(user, {
    fields: [cycleCountItems.countedBy],
    references: [user.id],
  }),
}));

// Type definitions
export type CycleCount = typeof cycleCounts.$inferSelect;
export type NewCycleCount = typeof cycleCounts.$inferInsert;

export type CycleCountItem = typeof cycleCountItems.$inferSelect;
export type NewCycleCountItem = typeof cycleCountItems.$inferInsert;
