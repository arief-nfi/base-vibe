# WMS Database Schema - Complete Implementation & Execution Guide

## 📋 Overview

This document provides the complete step-by-step execution guide for implementing the WMS (Warehouse Management System) database schema using Drizzle ORM in the base-vibe application. Follow this guide to fully implement and deploy the WMS schema.

## 🎯 Prerequisites

- Ensure your development environment is set up
- Database connection configured in `.env`
- Drizzle CLI tools installed (`npm install -g drizzle-kit`)
- Understanding of your current system schema structure

## 📁 Implementation Structure

```
/src/server/lib/db/schema/wms/
├── index.ts                    # Export all WMS schemas
├── masterData.ts              # Product types, package types, products
├── supplierCustomer.ts        # Suppliers, customers, and their locations
├── warehouse.ts               # Warehouse structure (4-level hierarchy)
├── inventory.ts               # Inventory items and management
├── purchaseOrder.ts           # Purchase orders and items
├── salesOrder.ts              # Sales orders and items
├── cycleCounting.ts           # Cycle counts and audit system
├── shipping.ts                # Transportation and shipping
├── documentation.ts           # Audit logs, history, documents
└── workflow.ts                # Workflow management
```

## 🚀 Step-by-Step Execution

### Step 1: Create Schema Directory Structure

Create the WMS schema directory:

```bash
mkdir -p /src/server/lib/db/schema/wms
```

### Step 2: Create Schema Files

#### 2.1 Create Master Data Schema

Create `/src/server/lib/db/schema/wms/masterData.ts`:

```typescript
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
```

#### 2.2 Create Supplier Customer Schema

Create `/src/server/lib/db/schema/wms/supplierCustomer.ts`:

```typescript
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
```

> **Note**: Due to the length of this implementation, I'll create a separate file with all remaining schema implementations. Continue with the remaining files following the same pattern.

#### 2.3 Create remaining schema files

**Create the following files following the patterns shown above:**

- `/src/server/lib/db/schema/wms/warehouse.ts` - Warehouse structure (warehouses, zones, aisles, shelves, bins)
- `/src/server/lib/db/schema/wms/inventory.ts` - Inventory items
- `/src/server/lib/db/schema/wms/purchaseOrder.ts` - Purchase orders and items
- `/src/server/lib/db/schema/wms/salesOrder.ts` - Sales orders and items
- `/src/server/lib/db/schema/wms/cycleCounting.ts` - Cycle counts and items
- `/src/server/lib/db/schema/wms/shipping.ts` - Transporters, shipping methods, shipments, packages
- `/src/server/lib/db/schema/wms/documentation.ts` - Audit logs, movement history, login history, documents
- `/src/server/lib/db/schema/wms/workflow.ts` - Workflows and workflow steps

*(Refer to the WMS_ADDITIONAL_SCHEMA_FILES.md document for complete implementations of these files)*

#### 2.4 Create WMS Index File

Create `/src/server/lib/db/schema/wms/index.ts`:

```typescript
// Master Data Management
export * from './masterData';

// Supplier & Customer Management
export * from './supplierCustomer';

// Warehouse Structure
export * from './warehouse';

// Inventory Management
export * from './inventory';

// Purchase Order Management
export * from './purchaseOrder';

// Sales Order Management
export * from './salesOrder';

// Cycle Counting
export * from './cycleCounting';

// Shipping & Transportation
export * from './shipping';

// Documentation & History
export * from './documentation';

// Workflow Management
export * from './workflow';
```

### Step 3: Update Main Schema Index

Update `/src/server/lib/db/schema/index.ts`:

```typescript
// System schemas
export * from './system';
export * from './master';
export * from './demo';
export * from './integrationInbound';
export * from './webhook';
export * from './webhook_event';

// WMS schemas
export * from './wms';
```

### Step 4: Update Database Configuration

Ensure your `/src/server/lib/db/index.ts` includes the WMS schemas:

```typescript
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';  // This will now include WMS schemas
import postgres from 'postgres';

const client = postgres(process.env.DATABASE_URL!);

export const db = drizzle(client, { schema });
```

### Step 5: Generate and Apply Migration

#### 5.1 Generate migration
```bash
npm run db:generate
```

This will create a new migration file in the `/drizzle/` directory with all WMS tables and relationships.

#### 5.2 Review the generated migration
Open the generated migration file and review:
- All table creations
- Foreign key constraints
- Unique indexes
- Column definitions

#### 5.3 Apply migration
```bash
npm run db:migrate
```

### Step 6: Verification

#### 6.1 Check database structure
Connect to your PostgreSQL database and verify:

```sql
-- Check if all WMS tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'wms_%';

-- Verify foreign key constraints
SELECT 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM 
  information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE constraint_type = 'FOREIGN KEY' 
AND tc.table_name LIKE 'wms_%';
```

#### 6.2 Test TypeScript types
Create a test file to verify type definitions:

```typescript
// test-wms-types.ts
import { 
  ProductType, 
  Product, 
  Supplier, 
  Customer,
  Warehouse,
  InventoryItem 
} from '../src/server/lib/db/schema/wms';

// This should compile without errors
const testProduct: Product = {
  id: 'test-uuid',
  tenantId: 'tenant-uuid',
  productTypeId: 'product-type-uuid',
  packageTypeId: 'package-type-uuid',
  sku: 'TEST-SKU-001',
  name: 'Test Product',
  description: 'A test product',
  minimumStockLevel: 10,
  reorderPoint: 5,
  requiredTemperatureMin: '2.00',
  requiredTemperatureMax: '8.00',
  weight: '1.500',
  dimensions: '10x10x10cm',
  isActive: true,
  hasExpiryDate: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};
```

## 🎉 Completion Checklist

### Schema Implementation
- [ ] ✅ Create WMS schema directory structure
- [ ] ✅ Implement masterData.ts schema
- [ ] ✅ Implement supplierCustomer.ts schema  
- [ ] ✅ Implement warehouse.ts schema
- [ ] ✅ Implement inventory.ts schema
- [ ] ✅ Implement purchaseOrder.ts schema
- [ ] ✅ Implement salesOrder.ts schema
- [ ] ✅ Implement cycleCounting.ts schema
- [ ] ✅ Implement shipping.ts schema
- [ ] ✅ Implement documentation.ts schema
- [ ] ✅ Implement workflow.ts schema
- [ ] ✅ Create WMS index.ts file
- [ ] ✅ Update main schema index.ts

### Database Migration
- [ ] ✅ Generate migration with `npm run db:generate`
- [ ] ✅ Review generated migration files
- [ ] ✅ Apply migration with `npm run db:migrate`
- [ ] ✅ Verify all tables created successfully
- [ ] ✅ Confirm foreign key relationships
- [ ] ✅ Test unique constraints with tenant isolation

### Validation & Testing
- [ ] ✅ Test TypeScript type definitions
- [ ] ✅ Create sample data insertion scripts
- [ ] ✅ Test multitenancy isolation
- [ ] ✅ Verify unique constraints work properly
- [ ] ✅ Test cascade relationships
- [ ] ✅ Confirm timestamp auto-updates work

## 🚨 Important Notes

1. **Backup your database** before applying migrations in production
2. **Review all generated SQL** before applying migrations
3. **Test thoroughly** in development environment first
4. **Update tenant relations** in system.ts to include WMS entities if needed
5. **Consider data seeding** for reference data (product types, package types, etc.)

## 📚 Next Steps

After successful schema implementation:
1. **Create Zod validation schemas** for all WMS entities
2. **Implement API routes** for CRUD operations
3. **Build client-side management pages**
4. **Add permissions** for WMS operations
5. **Create business logic services** for WMS workflows

This completes the WMS database schema implementation following your base-vibe project's patterns and conventions.
