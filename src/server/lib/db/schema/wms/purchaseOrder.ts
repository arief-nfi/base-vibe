import { relations } from 'drizzle-orm';
import { date, decimal, integer, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';
import { tenant, user } from '../system';
import { suppliers, supplierLocations } from './supplierCustomer';
import { products } from './masterData';

// Purchase Orders Table
export const purchaseOrders = pgTable('wms_purchase_orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenant.id),
  orderNumber: varchar('order_number', { length: 100 }).notNull(),
  supplierId: uuid('supplier_id')
    .notNull()
    .references(() => suppliers.id),
  supplierLocationId: uuid('supplier_location_id')
    .references(() => supplierLocations.id),
  status: varchar('status', { length: 50, enum: ['pending', 'approved', 'received', 'completed'] }).notNull(),
  workflowState: varchar('workflow_state', { length: 50, enum: ['create', 'approve', 'receive', 'putaway', 'complete'] }),
  orderDate: date('order_date').notNull(),
  expectedDeliveryDate: date('expected_delivery_date'),
  totalAmount: decimal('total_amount', { precision: 15, scale: 2 }),
  notes: text('notes'),
  createdBy: uuid('created_by')
    .references(() => user.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
}, (t) => [
  uniqueIndex('purchase_orders_number_idx').on(t.orderNumber),
]);

// Purchase Order Items Table
export const purchaseOrderItems = pgTable('wms_purchase_order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  purchaseOrderId: uuid('purchase_order_id')
    .notNull()
    .references(() => purchaseOrders.id),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenant.id),
  orderedQuantity: integer('ordered_quantity').notNull(),
  receivedQuantity: integer('received_quantity').notNull().default(0),
  unitCost: decimal('unit_cost', { precision: 10, scale: 2 }),
  totalCost: decimal('total_cost', { precision: 15, scale: 2 }),
  expectedExpiryDate: date('expected_expiry_date'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
  tenant: one(tenant, {
    fields: [purchaseOrders.tenantId],
    references: [tenant.id],
  }),
  supplier: one(suppliers, {
    fields: [purchaseOrders.supplierId],
    references: [suppliers.id],
  }),
  supplierLocation: one(supplierLocations, {
    fields: [purchaseOrders.supplierLocationId],
    references: [supplierLocations.id],
  }),
  createdByUser: one(user, {
    fields: [purchaseOrders.createdBy],
    references: [user.id],
  }),
  items: many(purchaseOrderItems),
}));

export const purchaseOrderItemsRelations = relations(purchaseOrderItems, ({ one }) => ({
  purchaseOrder: one(purchaseOrders, {
    fields: [purchaseOrderItems.purchaseOrderId],
    references: [purchaseOrders.id],
  }),
  product: one(products, {
    fields: [purchaseOrderItems.productId],
    references: [products.id],
  }),
  tenant: one(tenant, {
    fields: [purchaseOrderItems.tenantId],
    references: [tenant.id],
  }),
}));

// Type definitions
export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type NewPurchaseOrder = typeof purchaseOrders.$inferInsert;

export type PurchaseOrderItem = typeof purchaseOrderItems.$inferSelect;
export type NewPurchaseOrderItem = typeof purchaseOrderItems.$inferInsert;
