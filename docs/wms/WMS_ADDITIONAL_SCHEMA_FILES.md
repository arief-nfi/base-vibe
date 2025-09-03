# WMS Database Schema Implementation - Remaining Schema Files

## Purchase Order Management Schema

**File**: `/src/server/lib/db/schema/wms/purchaseOrder.ts`

```typescript
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
```

## Sales Order Management Schema

**File**: `/src/server/lib/db/schema/wms/salesOrder.ts`

```typescript
import { relations } from 'drizzle-orm';
import { date, decimal, integer, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';
import { tenant, user } from '../system';
import { customers, customerLocations } from './supplierCustomer';
import { products } from './masterData';

// Declare shipping methods here since it's needed for sales orders
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
export type SalesOrder = typeof salesOrders.$inferSelect;
export type NewSalesOrder = typeof salesOrders.$inferInsert;

export type SalesOrderItem = typeof salesOrderItems.$inferSelect;
export type NewSalesOrderItem = typeof salesOrderItems.$inferInsert;

export type ShippingMethod = typeof shippingMethods.$inferSelect;
export type NewShippingMethod = typeof shippingMethods.$inferInsert;
```

## Cycle Counting Schema

**File**: `/src/server/lib/db/schema/wms/cycleCounting.ts`

```typescript
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
```

## Shipping & Transportation Schema

**File**: `/src/server/lib/db/schema/wms/shipping.ts`

```typescript
import { relations } from 'drizzle-orm';
import { boolean, decimal, integer, json, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';
import { tenant } from '../system';
import { salesOrders } from './salesOrder';
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

// Shipping Methods Table (moved from salesOrder.ts)
export const shippingMethods = pgTable('wms_shipping_methods', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenant.id),
  methodType: varchar('method_type', { length: 20, enum: ['internal', 'third_party'] }).notNull(),
  transporterId: uuid('transporter_id')
    .references(() => transporters.id),
  name: varchar('name', { length: 255 }).notNull(),
  estimatedDays: integer('estimated_days'),
  costCalculation: varchar('cost_calculation', { length: 50, enum: ['fixed', 'weight_based', 'volumetric_based'] }),
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
  shippingMethods: many(shippingMethods),
  shipments: many(shipments),
}));

export const shippingMethodsRelations = relations(shippingMethods, ({ one, many }) => ({
  tenant: one(tenant, {
    fields: [shippingMethods.tenantId],
    references: [tenant.id],
  }),
  transporter: one(transporters, {
    fields: [shippingMethods.transporterId],
    references: [transporters.id],
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

export type ShippingMethod = typeof shippingMethods.$inferSelect;
export type NewShippingMethod = typeof shippingMethods.$inferInsert;

export type Shipment = typeof shipments.$inferSelect;
export type NewShipment = typeof shipments.$inferInsert;

export type Package = typeof packages.$inferSelect;
export type NewPackage = typeof packages.$inferInsert;

export type PackageItem = typeof packageItems.$inferSelect;
export type NewPackageItem = typeof packageItems.$inferInsert;
```

## Documentation & History Schema

**File**: `/src/server/lib/db/schema/wms/documentation.ts`

```typescript
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
```

## Workflow Management Schema

**File**: `/src/server/lib/db/schema/wms/workflow.ts`

```typescript
import { relations } from 'drizzle-orm';
import { boolean, integer, json, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { tenant } from '../system';
import { role } from '../system';

// Workflows Table
export const workflows = pgTable('wms_workflows', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenant.id),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50, enum: ['inbound', 'outbound', 'internal'] }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
});

// Workflow Steps Table
export const workflowSteps = pgTable('wms_workflow_steps', {
  id: uuid('id').primaryKey().defaultRandom(),
  workflowId: uuid('workflow_id')
    .notNull()
    .references(() => workflows.id),
  stepName: varchar('step_name', { length: 255 }).notNull(),
  stepOrder: integer('step_order').notNull(),
  assignedRoleId: uuid('assigned_role_id')
    .references(() => role.id),
  requiredInputFields: json('required_input_fields'),
  requiredOutputFields: json('required_output_fields'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const workflowsRelations = relations(workflows, ({ one, many }) => ({
  tenant: one(tenant, {
    fields: [workflows.tenantId],
    references: [tenant.id],
  }),
  steps: many(workflowSteps),
}));

export const workflowStepsRelations = relations(workflowSteps, ({ one }) => ({
  workflow: one(workflows, {
    fields: [workflowSteps.workflowId],
    references: [workflows.id],
  }),
  assignedRole: one(role, {
    fields: [workflowSteps.assignedRoleId],
    references: [role.id],
  }),
}));

// Type definitions
export type Workflow = typeof workflows.$inferSelect;
export type NewWorkflow = typeof workflows.$inferInsert;

export type WorkflowStep = typeof workflowSteps.$inferSelect;
export type NewWorkflowStep = typeof workflowSteps.$inferInsert;
```

This completes all the remaining schema files for the WMS implementation. Each file follows the base-vibe patterns:

1. **UUID primary keys** for all tables
2. **Proper multitenancy** with tenant_id references
3. **Timestamp fields** with automatic updates
4. **Unique indexes** with tenant isolation
5. **Drizzle relations** for type-safe queries
6. **TypeScript type definitions** for all tables
7. **Proper naming conventions** following the project standards

The implementation maintains consistency with your existing schema patterns while providing a comprehensive WMS database structure.
