import { relations } from 'drizzle-orm';
import { boolean, decimal, integer, json, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';
import { tenant } from '../system';
import { salesOrders, shippingMethods } from './salesOrder';
import { products } from './masterData';

// Transporters Table
export const transporters = pgTable('wms_transporters', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenant.id),
  name: varchar('name', { length: 255 }).notNull(),
  contactPerson: varchar('contact_person', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  email: varchar('email', { length: 255 }),
  serviceAreas: json('service_areas'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
});

// Shipments Table
export const shipments = pgTable('wms_shipments', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenant.id),
  salesOrderId: uuid('sales_order_id')
    .notNull()
    .references(() => salesOrders.id),
  shipmentNumber: varchar('shipment_number', { length: 100 }).notNull(),
  transporterId: uuid('transporter_id')
    .references(() => transporters.id),
  shippingMethodId: uuid('shipping_method_id')
    .references(() => shippingMethods.id),
  trackingNumber: varchar('tracking_number', { length: 100 }),
  status: varchar('status', { length: 50, enum: ['ready', 'in_transit', 'delivered', 'failed'] }).notNull(),
  shippingDate: timestamp('shipping_date'),
  deliveryDate: timestamp('delivery_date'),
  totalWeight: decimal('total_weight', { precision: 10, scale: 3 }),
  totalVolume: decimal('total_volume', { precision: 10, scale: 3 }),
  totalCost: decimal('total_cost', { precision: 15, scale: 2 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
}, (t) => [
  uniqueIndex('shipments_tenant_order_idx').on(t.tenantId, t.salesOrderId),
  uniqueIndex('shipments_number_idx').on(t.shipmentNumber),
]);

// Packages Table
export const packages = pgTable('wms_packages', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenant.id),
  shipmentId: uuid('shipment_id')
    .notNull()
    .references(() => shipments.id),
  packageNumber: varchar('package_number', { length: 100 }).notNull(),
  barcode: varchar('barcode', { length: 100 }).unique(),
  dimensions: varchar('dimensions', { length: 100 }),
  weight: decimal('weight', { precision: 10, scale: 3 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Package Items Table
export const packageItems = pgTable('wms_package_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  packageId: uuid('package_id')
    .notNull()
    .references(() => packages.id),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenant.id),
  quantity: integer('quantity').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const transportersRelations = relations(transporters, ({ one, many }) => ({
  tenant: one(tenant, {
    fields: [transporters.tenantId],
    references: [tenant.id],
  }),
  shipments: many(shipments),
}));

export const shipmentsRelations = relations(shipments, ({ one, many }) => ({
  tenant: one(tenant, {
    fields: [shipments.tenantId],
    references: [tenant.id],
  }),
  salesOrder: one(salesOrders, {
    fields: [shipments.salesOrderId],
    references: [salesOrders.id],
  }),
  transporter: one(transporters, {
    fields: [shipments.transporterId],
    references: [transporters.id],
  }),
  shippingMethod: one(shippingMethods, {
    fields: [shipments.shippingMethodId],
    references: [shippingMethods.id],
  }),
  packages: many(packages),
}));

export const packagesRelations = relations(packages, ({ one, many }) => ({
  tenant: one(tenant, {
    fields: [packages.tenantId],
    references: [tenant.id],
  }),
  shipment: one(shipments, {
    fields: [packages.shipmentId],
    references: [shipments.id],
  }),
  items: many(packageItems),
}));

export const packageItemsRelations = relations(packageItems, ({ one }) => ({
  package: one(packages, {
    fields: [packageItems.packageId],
    references: [packages.id],
  }),
  product: one(products, {
    fields: [packageItems.productId],
    references: [products.id],
  }),
  tenant: one(tenant, {
    fields: [packageItems.tenantId],
    references: [tenant.id],
  }),
}));

// Type definitions
export type Transporter = typeof transporters.$inferSelect;
export type NewTransporter = typeof transporters.$inferInsert;

export type Shipment = typeof shipments.$inferSelect;
export type NewShipment = typeof shipments.$inferInsert;

export type Package = typeof packages.$inferSelect;
export type NewPackage = typeof packages.$inferInsert;

export type PackageItem = typeof packageItems.$inferSelect;
export type NewPackageItem = typeof packageItems.$inferInsert;
