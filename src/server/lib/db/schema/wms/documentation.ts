import { relations } from 'drizzle-orm';
import { integer, json, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { tenant, user } from '../system';
import { inventoryItems } from './inventory';
import { bins } from './warehouse';

// Audit Logs Table
export const auditLogs = pgTable('wms_audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenant.id),
  userId: uuid('user_id')
    .notNull()
    .references(() => user.id),
  action: varchar('action', { length: 100 }).notNull(),
  resourceType: varchar('resource_type', { length: 100 }).notNull(),
  resourceId: uuid('resource_id').notNull(),
  oldValue: json('old_value'),
  newValue: json('new_value'),
  ipAddress: varchar('ip_address', { length: 50 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Movement History Table
export const movementHistory = pgTable('wms_movement_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenant.id),
  userId: uuid('user_id')
    .notNull()
    .references(() => user.id),
  itemId: uuid('item_id')
    .notNull()
    .references(() => inventoryItems.id),
  fromBinId: uuid('from_bin_id')
    .references(() => bins.id),
  toBinId: uuid('to_bin_id')
    .references(() => bins.id),
  quantityChanged: integer('quantity_changed').notNull(),
  movementType: varchar('movement_type', { length: 50, enum: ['putaway', 'pick', 'cycle_count', 'adjustment'] }).notNull(),
  referenceType: varchar('reference_type', { length: 50, enum: ['sales_order', 'purchase_order', 'cycle_count'] }),
  referenceId: uuid('reference_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Login History Table
export const loginHistory = pgTable('wms_login_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenant.id),
  userId: uuid('user_id')
    .notNull()
    .references(() => user.id),
  loginAt: timestamp('login_at').defaultNow().notNull(),
  ipAddress: varchar('ip_address', { length: 50 }),
  userAgent: text('user_agent'),
});

// Generated Documents Table
export const generatedDocuments = pgTable('wms_generated_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenant.id),
  documentType: varchar('document_type', { length: 50, enum: ['packing_slip', 'shipping_label', 'po_receipt'] }).notNull(),
  referenceType: varchar('reference_type', { length: 50 }).notNull(),
  referenceId: uuid('reference_id').notNull(),
  filePath: text('file_path').notNull(),
  generatedBy: uuid('generated_by')
    .notNull()
    .references(() => user.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  tenant: one(tenant, {
    fields: [auditLogs.tenantId],
    references: [tenant.id],
  }),
  user: one(user, {
    fields: [auditLogs.userId],
    references: [user.id],
  }),
}));

export const movementHistoryRelations = relations(movementHistory, ({ one }) => ({
  tenant: one(tenant, {
    fields: [movementHistory.tenantId],
    references: [tenant.id],
  }),
  user: one(user, {
    fields: [movementHistory.userId],
    references: [user.id],
  }),
  item: one(inventoryItems, {
    fields: [movementHistory.itemId],
    references: [inventoryItems.id],
  }),
  fromBin: one(bins, {
    fields: [movementHistory.fromBinId],
    references: [bins.id],
  }),
  toBin: one(bins, {
    fields: [movementHistory.toBinId],
    references: [bins.id],
  }),
}));

export const loginHistoryRelations = relations(loginHistory, ({ one }) => ({
  tenant: one(tenant, {
    fields: [loginHistory.tenantId],
    references: [tenant.id],
  }),
  user: one(user, {
    fields: [loginHistory.userId],
    references: [user.id],
  }),
}));

export const generatedDocumentsRelations = relations(generatedDocuments, ({ one }) => ({
  tenant: one(tenant, {
    fields: [generatedDocuments.tenantId],
    references: [tenant.id],
  }),
  generatedByUser: one(user, {
    fields: [generatedDocuments.generatedBy],
    references: [user.id],
  }),
}));

// Type definitions
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;

export type MovementHistory = typeof movementHistory.$inferSelect;
export type NewMovementHistory = typeof movementHistory.$inferInsert;

export type LoginHistory = typeof loginHistory.$inferSelect;
export type NewLoginHistory = typeof loginHistory.$inferInsert;

export type GeneratedDocument = typeof generatedDocuments.$inferSelect;
export type NewGeneratedDocument = typeof generatedDocuments.$inferInsert;
