import { relations } from 'drizzle-orm';
import { boolean, decimal, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';
import { tenant } from '../system';

// Suppliers Table
export const suppliers = pgTable('wms_suppliers', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenant.id),
  name: varchar('name', { length: 255 }).notNull(),
  contactPerson: varchar('contact_person', { length: 255 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  taxId: varchar('tax_id', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
}, (t) => [
  uniqueIndex('suppliers_tenant_name_idx').on(t.tenantId, t.name),
]);

// Supplier Locations Table
export const supplierLocations = pgTable('wms_supplier_locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  supplierId: uuid('supplier_id')
    .notNull()
    .references(() => suppliers.id),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenant.id),
  locationType: varchar('location_type', { length: 50, enum: ['pickup', 'billing'] }).notNull().default('pickup'),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 100 }),
  postalCode: varchar('postal_code', { length: 20 }),
  country: varchar('country', { length: 100 }),
  latitude: decimal('latitude', { precision: 9, scale: 6 }),
  longitude: decimal('longitude', { precision: 9, scale: 6 }),
  contactPerson: varchar('contact_person', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  email: varchar('email', { length: 255 }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Customers Table
export const customers = pgTable('wms_customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenant.id),
  name: varchar('name', { length: 255 }).notNull(),
  contactPerson: varchar('contact_person', { length: 255 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  taxId: varchar('tax_id', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
}, (t) => [
  uniqueIndex('customers_tenant_name_idx').on(t.tenantId, t.name),
]);

// Customer Locations Table
export const customerLocations = pgTable('wms_customer_locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id')
    .notNull()
    .references(() => customers.id),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenant.id),
  locationType: varchar('location_type', { length: 50, enum: ['billing', 'shipping'] }).notNull(),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 100 }),
  postalCode: varchar('postal_code', { length: 20 }),
  country: varchar('country', { length: 100 }),
  latitude: decimal('latitude', { precision: 9, scale: 6 }),
  longitude: decimal('longitude', { precision: 9, scale: 6 }),
  contactPerson: varchar('contact_person', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  email: varchar('email', { length: 255 }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const suppliersRelations = relations(suppliers, ({ one, many }) => ({
  tenant: one(tenant, {
    fields: [suppliers.tenantId],
    references: [tenant.id],
  }),
  locations: many(supplierLocations),
}));

export const supplierLocationsRelations = relations(supplierLocations, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [supplierLocations.supplierId],
    references: [suppliers.id],
  }),
  tenant: one(tenant, {
    fields: [supplierLocations.tenantId],
    references: [tenant.id],
  }),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  tenant: one(tenant, {
    fields: [customers.tenantId],
    references: [tenant.id],
  }),
  locations: many(customerLocations),
}));

export const customerLocationsRelations = relations(customerLocations, ({ one }) => ({
  customer: one(customers, {
    fields: [customerLocations.customerId],
    references: [customers.id],
  }),
  tenant: one(tenant, {
    fields: [customerLocations.tenantId],
    references: [tenant.id],
  }),
}));

// Type definitions
export type Supplier = typeof suppliers.$inferSelect;
export type NewSupplier = typeof suppliers.$inferInsert;

export type SupplierLocation = typeof supplierLocations.$inferSelect;
export type NewSupplierLocation = typeof supplierLocations.$inferInsert;

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;

export type CustomerLocation = typeof customerLocations.$inferSelect;
export type NewCustomerLocation = typeof customerLocations.$inferInsert;
