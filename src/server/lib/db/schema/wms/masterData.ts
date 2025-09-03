import { relations } from 'drizzle-orm';
import { boolean, decimal, integer, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';
import { tenant } from '../system';

// Product Types Table
export const productTypes = pgTable('wms_product_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenant.id),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
}, (t) => [
  uniqueIndex('product_types_tenant_name_idx').on(t.tenantId, t.name),
]);

// Package Types Table
export const packageTypes = pgTable('wms_package_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenant.id),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  unitsPerPackage: integer('units_per_package'),
  barcode: varchar('barcode', { length: 100 }),
  dimensions: varchar('dimensions', { length: 100 }),
  weight: decimal('weight', { precision: 10, scale: 3 }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
}, (t) => [
  uniqueIndex('package_types_tenant_name_idx').on(t.tenantId, t.name),
]);

// Products Table
export const products = pgTable('wms_products', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenant.id),
  productTypeId: uuid('product_type_id')
    .references(() => productTypes.id),
  packageTypeId: uuid('package_type_id')
    .references(() => packageTypes.id),
  sku: varchar('sku', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  minimumStockLevel: integer('minimum_stock_level'),
  reorderPoint: integer('reorder_point'),
  requiredTemperatureMin: decimal('required_temperature_min', { precision: 5, scale: 2 }),
  requiredTemperatureMax: decimal('required_temperature_max', { precision: 5, scale: 2 }),
  weight: decimal('weight', { precision: 10, scale: 3 }),
  dimensions: varchar('dimensions', { length: 100 }),
  isActive: boolean('is_active').notNull().default(true),
  hasExpiryDate: boolean('has_expiry_date').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
}, (t) => [
  uniqueIndex('products_tenant_sku_idx').on(t.tenantId, t.sku),
]);

// Relations
export const productTypesRelations = relations(productTypes, ({ one, many }) => ({
  tenant: one(tenant, {
    fields: [productTypes.tenantId],
    references: [tenant.id],
  }),
  products: many(products),
}));

export const packageTypesRelations = relations(packageTypes, ({ one, many }) => ({
  tenant: one(tenant, {
    fields: [packageTypes.tenantId],
    references: [tenant.id],
  }),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one }) => ({
  tenant: one(tenant, {
    fields: [products.tenantId],
    references: [tenant.id],
  }),
  productType: one(productTypes, {
    fields: [products.productTypeId],
    references: [productTypes.id],
  }),
  packageType: one(packageTypes, {
    fields: [products.packageTypeId],
    references: [packageTypes.id],
  }),
}));

// Type definitions
export type ProductType = typeof productTypes.$inferSelect;
export type NewProductType = typeof productTypes.$inferInsert;

export type PackageType = typeof packageTypes.$inferSelect;
export type NewPackageType = typeof packageTypes.$inferInsert;

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
