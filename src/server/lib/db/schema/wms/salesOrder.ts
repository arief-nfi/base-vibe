import { relations } from 'drizzle-orm';
import { boolean, date, decimal, integer, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';
import { tenant, user } from '../system';
import { customers, customerLocations } from './supplierCustomer';
import { products } from './masterData';

// Shipping Methods Table (needed for sales orders)
export const shippingMethods = pgTable('wms_shipping_methods', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenant.id),
  methodType: varchar('method_type', { length: 20, enum: ['internal', 'third_party'] }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  estimatedDays: integer('estimated_days'),
  costCalculation: varchar('cost_calculation', { length: 50, enum: ['fixed', 'weight_based', 'volumetric_based'] }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
});

// Sales Orders Table
export const salesOrders = pgTable('wms_sales_orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenant.id),
  orderNumber: varchar('order_number', { length: 100 }).notNull(),
  customerId: uuid('customer_id')
    .notNull()
    .references(() => customers.id),
  billingLocationId: uuid('billing_location_id')
    .references(() => customerLocations.id),
  shippingLocationId: uuid('shipping_location_id')
    .references(() => customerLocations.id),
  shippingMethodId: uuid('shipping_method_id')
    .references(() => shippingMethods.id),
  status: varchar('status', { length: 50, enum: ['pending', 'allocated', 'picked', 'packed', 'shipped', 'delivered'] }).notNull(),
  workflowState: varchar('workflow_state', { length: 50, enum: ['create', 'allocate', 'pick', 'pack', 'ship', 'deliver', 'complete'] }),
  orderDate: date('order_date').notNull(),
  requestedDeliveryDate: date('requested_delivery_date'),
  totalAmount: decimal('total_amount', { precision: 15, scale: 2 }),
  trackingNumber: varchar('tracking_number', { length: 100 }),
  deliveryInstructions: text('delivery_instructions'),
  notes: text('notes'),
  createdBy: uuid('created_by')
    .references(() => user.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
}, (t) => [
  uniqueIndex('sales_orders_number_idx').on(t.orderNumber),
]);

// Sales Order Items Table
export const salesOrderItems = pgTable('wms_sales_order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  salesOrderId: uuid('sales_order_id')
    .notNull()
    .references(() => salesOrders.id),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenant.id),
  orderedQuantity: integer('ordered_quantity').notNull(),
  allocatedQuantity: integer('allocated_quantity').notNull().default(0),
  pickedQuantity: integer('picked_quantity').notNull().default(0),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }),
  totalPrice: decimal('total_price', { precision: 15, scale: 2 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const shippingMethodsRelations = relations(shippingMethods, ({ one, many }) => ({
  tenant: one(tenant, {
    fields: [shippingMethods.tenantId],
    references: [tenant.id],
  }),
  salesOrders: many(salesOrders),
}));

export const salesOrdersRelations = relations(salesOrders, ({ one, many }) => ({
  tenant: one(tenant, {
    fields: [salesOrders.tenantId],
    references: [tenant.id],
  }),
  customer: one(customers, {
    fields: [salesOrders.customerId],
    references: [customers.id],
  }),
  billingLocation: one(customerLocations, {
    fields: [salesOrders.billingLocationId],
    references: [customerLocations.id],
  }),
  shippingLocation: one(customerLocations, {
    fields: [salesOrders.shippingLocationId],
    references: [customerLocations.id],
  }),
  shippingMethod: one(shippingMethods, {
    fields: [salesOrders.shippingMethodId],
    references: [shippingMethods.id],
  }),
  createdByUser: one(user, {
    fields: [salesOrders.createdBy],
    references: [user.id],
  }),
  items: many(salesOrderItems),
}));

export const salesOrderItemsRelations = relations(salesOrderItems, ({ one }) => ({
  salesOrder: one(salesOrders, {
    fields: [salesOrderItems.salesOrderId],
    references: [salesOrders.id],
  }),
  product: one(products, {
    fields: [salesOrderItems.productId],
    references: [products.id],
  }),
  tenant: one(tenant, {
    fields: [salesOrderItems.tenantId],
    references: [tenant.id],
  }),
}));

// Type definitions
export type ShippingMethod = typeof shippingMethods.$inferSelect;
export type NewShippingMethod = typeof shippingMethods.$inferInsert;

export type SalesOrder = typeof salesOrders.$inferSelect;
export type NewSalesOrder = typeof salesOrders.$inferInsert;

export type SalesOrderItem = typeof salesOrderItems.$inferSelect;
export type NewSalesOrderItem = typeof salesOrderItems.$inferInsert;
