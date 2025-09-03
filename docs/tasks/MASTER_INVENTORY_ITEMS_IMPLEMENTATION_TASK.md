# Master Inventory Items Implementation Guide

## Overview
This document provides a comprehensive step-by-step guide for implementing the Master Inventory Items feature in the WMS (Warehouse Management System) module of the base-vibe admin application. The implementation follows established project patterns and conventions, providing complete CRUD operations for inventory management with multitenancy support.

## Table of Contents
1. [Server-Side Implementation](#server-side-implementation)
2. [Client-Side Implementation](#client-side-implementation)  
3. [Testing & Validation](#testing--validation)
4. [Final Integration](#final-integration)

---

## Server-Side Implementation

### Step 1: Verify Database Schema

#### 1.1 Confirm inventory items schema exists
**File**: `/src/server/lib/db/schema/wms/inventory.ts`

The inventory items schema should already be created from the WMS implementation. Verify it contains:

```typescript
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
```

#### 1.2 Verify schema is exported
**File**: `/src/server/lib/db/schema/index.ts`

Ensure WMS schemas are exported:

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

### Step 2: Create Zod Validation Schemas

#### 2.1 Create inventory item validation schema
**File**: `/src/server/schemas/inventoryItemSchema.ts`

```typescript
import { z } from 'zod';
import { db } from '../lib/db';
import { inventoryItems, products, bins } from '../lib/db/schema';
import { and, eq, sql } from 'drizzle-orm';

export const inventoryItemAddSchema = z.object({
  tenantId: z.string().uuid("Invalid tenant ID"),
  productId: z.string().uuid("Invalid product ID"),
  binId: z.string().uuid("Invalid bin ID"),
  availableQuantity: z.number()
    .int("Available quantity must be an integer")
    .min(0, "Available quantity cannot be negative"),
  reservedQuantity: z.number()
    .int("Reserved quantity must be an integer")
    .min(0, "Reserved quantity cannot be negative")
    .default(0),
  expiryDate: z.string()
    .regex(/^\\d{4}-\\d{2}-\\d{2}$/, "Expiry date must be in YYYY-MM-DD format")
    .optional()
    .nullable(),
  batchNumber: z.string()
    .max(100, "Batch number must be at most 100 characters")
    .optional()
    .nullable(),
  lotNumber: z.string()
    .max(100, "Lot number must be at most 100 characters")
    .optional()
    .nullable(),
  receivedDate: z.string()
    .regex(/^\\d{4}-\\d{2}-\\d{2}$/, "Received date must be in YYYY-MM-DD format")
    .optional()
    .nullable(),
  costPerUnit: z.number()
    .min(0, "Cost per unit cannot be negative")
    .optional()
    .nullable(),
})
.refine(async (data) => {
  // Verify product exists and belongs to tenant
  const productExists = await db
    .select()
    .from(products)
    .where(and(
      eq(products.id, data.productId),
      eq(products.tenantId, data.tenantId)
    ));
  return productExists.length > 0;
}, {
  message: "Product not found or does not belong to this tenant",
  path: ["productId"],
})
.refine(async (data) => {
  // Verify bin exists and belongs to tenant
  const binExists = await db
    .select()
    .from(bins)
    .where(and(
      eq(bins.id, data.binId),
      eq(bins.tenantId, data.tenantId)
    ));
  return binExists.length > 0;
}, {
  message: "Bin not found or does not belong to this tenant",
  path: ["binId"],
})
.refine(async (data) => {
  // Check if inventory item already exists for this product and bin combination
  const existingItem = await db
    .select()
    .from(inventoryItems)
    .where(and(
      eq(inventoryItems.productId, data.productId),
      eq(inventoryItems.binId, data.binId),
      eq(inventoryItems.tenantId, data.tenantId),
      data.batchNumber ? eq(inventoryItems.batchNumber, data.batchNumber) : sql`${inventoryItems.batchNumber} IS NULL`,
      data.lotNumber ? eq(inventoryItems.lotNumber, data.lotNumber) : sql`${inventoryItems.lotNumber} IS NULL`
    ));
  return existingItem.length === 0;
}, {
  message: "Inventory item with this product, bin, batch, and lot combination already exists",
  path: ["productId"],
});

export const inventoryItemEditSchema = z.object({
  id: z.string().uuid("Invalid inventory item ID"),
  availableQuantity: z.number()
    .int("Available quantity must be an integer")
    .min(0, "Available quantity cannot be negative"),
  reservedQuantity: z.number()
    .int("Reserved quantity must be an integer")
    .min(0, "Reserved quantity cannot be negative"),
  expiryDate: z.string()
    .regex(/^\\d{4}-\\d{2}-\\d{2}$/, "Expiry date must be in YYYY-MM-DD format")
    .optional()
    .nullable(),
  batchNumber: z.string()
    .max(100, "Batch number must be at most 100 characters")
    .optional()
    .nullable(),
  lotNumber: z.string()
    .max(100, "Lot number must be at most 100 characters")
    .optional()
    .nullable(),
  receivedDate: z.string()
    .regex(/^\\d{4}-\\d{2}-\\d{2}$/, "Received date must be in YYYY-MM-DD format")
    .optional()
    .nullable(),
  costPerUnit: z.number()
    .min(0, "Cost per unit cannot be negative")
    .optional()
    .nullable(),
});

export const inventoryItemQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(1)).default("1"),
  perPage: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(1).max(100)).default("10"),
  sort: z.enum([
    "productSku", "productName", "binName", "availableQuantity", "reservedQuantity", 
    "expiryDate", "batchNumber", "lotNumber", "receivedDate", "costPerUnit", 
    "createdAt", "updatedAt"
  ]).default("productSku"),
  order: z.enum(["asc", "desc"]).default("asc"),
  filter: z.string().optional(),
  productId: z.string().uuid().optional(),
  binId: z.string().uuid().optional(),
  warehouseId: z.string().uuid().optional(),
  lowStock: z.string().transform(val => val === 'true').pipe(z.boolean()).optional(),
  expiringSoon: z.string().transform(val => val === 'true').pipe(z.boolean()).optional(),
  expiryDays: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(1).max(365)).default("30"),
});

export const inventoryAdjustmentSchema = z.object({
  id: z.string().uuid("Invalid inventory item ID"),
  adjustmentType: z.enum(["increase", "decrease"]),
  quantity: z.number()
    .int("Quantity must be an integer")
    .min(1, "Quantity must be positive"),
  reason: z.string()
    .min(1, "Reason is required")
    .max(500, "Reason must be at most 500 characters"),
});

// Type exports
export type InventoryItemAddData = z.infer<typeof inventoryItemAddSchema>;
export type InventoryItemEditData = z.infer<typeof inventoryItemEditSchema>;
export type InventoryItemQueryParams = z.infer<typeof inventoryItemQuerySchema>;
export type InventoryAdjustmentData = z.infer<typeof inventoryAdjustmentSchema>;
```

### Step 3: Create API Routes

#### 3.1 Create inventory item routes directory and file
**Directory**: `/src/server/routes/wms/`
**File**: `/src/server/routes/wms/inventoryItem.ts`

```typescript
import { Router } from 'express';
import { and, asc, count, desc, eq, gte, ilike, lte, or, sql } from 'drizzle-orm';
import { db } from '../../lib/db';
import { inventoryItems, products, bins, warehouses, zones, aisles, shelves } from '../../lib/db/schema';
import { authenticated, authorized } from '../../middleware/authMiddleware';
import { validateData } from '../../middleware/validationMiddleware';
import { 
  inventoryItemAddSchema, 
  inventoryItemEditSchema, 
  inventoryItemQuerySchema,
  inventoryAdjustmentSchema 
} from '../../schemas/inventoryItemSchema';

const inventoryItemRoutes = Router();

// Apply authentication middleware to all routes
inventoryItemRoutes.use(authenticated());

/**
 * @swagger
 * components:
 *   schemas:
 *     InventoryItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Inventory item unique identifier
 *         productId:
 *           type: string
 *           format: uuid
 *           description: Product reference
 *         binId:
 *           type: string
 *           format: uuid
 *           description: Bin location reference
 *         availableQuantity:
 *           type: integer
 *           minimum: 0
 *           description: Available stock quantity
 *         reservedQuantity:
 *           type: integer
 *           minimum: 0
 *           description: Reserved stock quantity
 *         expiryDate:
 *           type: string
 *           format: date
 *           description: Product expiry date
 *         batchNumber:
 *           type: string
 *           maxLength: 100
 *           description: Batch number
 *         lotNumber:
 *           type: string
 *           maxLength: 100
 *           description: Lot number
 *         receivedDate:
 *           type: string
 *           format: date
 *           description: Date when stock was received
 *         costPerUnit:
 *           type: number
 *           minimum: 0
 *           description: Cost per unit
 *         tenantId:
 *           type: string
 *           format: uuid
 *           description: Tenant identifier
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *         product:
 *           type: object
 *           description: Related product information
 *         bin:
 *           type: object
 *           description: Related bin information
 */

/**
 * @swagger
 * /api/wms/inventory-items:
 *   get:
 *     tags:
 *       - WMS - Inventory Items
 *     summary: List inventory items
 *     description: Retrieve a paginated list of inventory items with filtering and sorting options
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: perPage
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [productSku, productName, binName, availableQuantity, reservedQuantity, expiryDate, batchNumber, lotNumber, receivedDate, costPerUnit, createdAt, updatedAt]
 *           default: productSku
 *         description: Sort field
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order
 *       - in: query
 *         name: filter
 *         schema:
 *           type: string
 *         description: Search filter
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by product ID
 *       - in: query
 *         name: binId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by bin ID
 *       - in: query
 *         name: warehouseId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by warehouse ID
 *       - in: query
 *         name: lowStock
 *         schema:
 *           type: boolean
 *         description: Filter items with low stock
 *       - in: query
 *         name: expiringSoon
 *         schema:
 *           type: boolean
 *         description: Filter items expiring soon
 *       - in: query
 *         name: expiryDays
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 365
 *           default: 30
 *         description: Days until expiry for expiringSoon filter
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of inventory items with pagination info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/InventoryItem'
 *                       - type: object
 *                         properties:
 *                           productSku:
 *                             type: string
 *                           productName:
 *                             type: string
 *                           binName:
 *                             type: string
 *                           warehouseName:
 *                             type: string
 *                           totalQuantity:
 *                             type: integer
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     perPage:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
inventoryItemRoutes.get("/", authorized('ADMIN', 'wms.inventory.view'), async (req, res) => {
  try {
    const queryParams = inventoryItemQuerySchema.parse(req.query);
    const { page, perPage, sort, order, filter, productId, binId, warehouseId, lowStock, expiringSoon, expiryDays } = queryParams;

    const offset = (page - 1) * perPage;
    const orderDirection = order === 'desc' ? desc : asc;

    // Build where conditions
    const whereConditions = [
      eq(inventoryItems.tenantId, req.user!.activeTenantId)
    ];

    if (productId) {
      whereConditions.push(eq(inventoryItems.productId, productId));
    }

    if (binId) {
      whereConditions.push(eq(inventoryItems.binId, binId));
    }

    if (filter) {
      whereConditions.push(
        or(
          ilike(products.sku, `%${filter}%`),
          ilike(products.name, `%${filter}%`),
          ilike(inventoryItems.batchNumber, `%${filter}%`),
          ilike(inventoryItems.lotNumber, `%${filter}%`)
        )!
      );
    }

    if (lowStock) {
      whereConditions.push(
        sql`${inventoryItems.availableQuantity} <= ${products.minimumStockLevel}`
      );
    }

    if (expiringSoon) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + expiryDays);
      whereConditions.push(
        and(
          sql`${inventoryItems.expiryDate} IS NOT NULL`,
          lte(inventoryItems.expiryDate, futureDate.toISOString().split('T')[0])
        )!
      );
    }

    // Get total count
    const totalResult = await db
      .select({ count: count() })
      .from(inventoryItems)
      .leftJoin(products, eq(inventoryItems.productId, products.id))
      .leftJoin(bins, eq(inventoryItems.binId, bins.id))
      .leftJoin(shelves, eq(bins.shelfId, shelves.id))
      .leftJoin(aisles, eq(shelves.aisleId, aisles.id))
      .leftJoin(zones, eq(aisles.zoneId, zones.id))
      .leftJoin(warehouses, eq(zones.warehouseId, warehouses.id))
      .where(and(...whereConditions));

    const total = totalResult[0].count;
    const totalPages = Math.ceil(total / perPage);

    // Build sort field mapping
    let sortField;
    switch (sort) {
      case 'productSku':
        sortField = products.sku;
        break;
      case 'productName':
        sortField = products.name;
        break;
      case 'binName':
        sortField = bins.name;
        break;
      case 'availableQuantity':
        sortField = inventoryItems.availableQuantity;
        break;
      case 'reservedQuantity':
        sortField = inventoryItems.reservedQuantity;
        break;
      case 'expiryDate':
        sortField = inventoryItems.expiryDate;
        break;
      case 'batchNumber':
        sortField = inventoryItems.batchNumber;
        break;
      case 'lotNumber':
        sortField = inventoryItems.lotNumber;
        break;
      case 'receivedDate':
        sortField = inventoryItems.receivedDate;
        break;
      case 'costPerUnit':
        sortField = inventoryItems.costPerUnit;
        break;
      case 'createdAt':
        sortField = inventoryItems.createdAt;
        break;
      case 'updatedAt':
        sortField = inventoryItems.updatedAt;
        break;
      default:
        sortField = products.sku;
    }

    // Get paginated data with related information
    const inventoryData = await db
      .select({
        id: inventoryItems.id,
        productId: inventoryItems.productId,
        binId: inventoryItems.binId,
        availableQuantity: inventoryItems.availableQuantity,
        reservedQuantity: inventoryItems.reservedQuantity,
        expiryDate: inventoryItems.expiryDate,
        batchNumber: inventoryItems.batchNumber,
        lotNumber: inventoryItems.lotNumber,
        receivedDate: inventoryItems.receivedDate,
        costPerUnit: inventoryItems.costPerUnit,
        tenantId: inventoryItems.tenantId,
        createdAt: inventoryItems.createdAt,
        updatedAt: inventoryItems.updatedAt,
        productSku: products.sku,
        productName: products.name,
        binName: bins.name,
        warehouseName: warehouses.name,
        totalQuantity: sql<number>`${inventoryItems.availableQuantity} + ${inventoryItems.reservedQuantity}`,
      })
      .from(inventoryItems)
      .leftJoin(products, eq(inventoryItems.productId, products.id))
      .leftJoin(bins, eq(inventoryItems.binId, bins.id))
      .leftJoin(shelves, eq(bins.shelfId, shelves.id))
      .leftJoin(aisles, eq(shelves.aisleId, aisles.id))
      .leftJoin(zones, eq(aisles.zoneId, zones.id))
      .leftJoin(warehouses, eq(zones.warehouseId, warehouses.id))
      .where(and(...whereConditions))
      .orderBy(orderDirection(sortField))
      .limit(perPage)
      .offset(offset);

    res.json({
      success: true,
      data: inventoryData,
      pagination: {
        page,
        perPage,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching inventory items:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/wms/inventory-items:
 *   post:
 *     tags:
 *       - WMS - Inventory Items
 *     summary: Create inventory item
 *     description: Create a new inventory item
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - binId
 *               - availableQuantity
 *             properties:
 *               productId:
 *                 type: string
 *                 format: uuid
 *               binId:
 *                 type: string
 *                 format: uuid
 *               availableQuantity:
 *                 type: integer
 *                 minimum: 0
 *               reservedQuantity:
 *                 type: integer
 *                 minimum: 0
 *                 default: 0
 *               expiryDate:
 *                 type: string
 *                 format: date
 *               batchNumber:
 *                 type: string
 *                 maxLength: 100
 *               lotNumber:
 *                 type: string
 *                 maxLength: 100
 *               receivedDate:
 *                 type: string
 *                 format: date
 *               costPerUnit:
 *                 type: number
 *                 minimum: 0
 *     responses:
 *       201:
 *         description: Inventory item created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/InventoryItem'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
inventoryItemRoutes.post("/", validateData(inventoryItemAddSchema), authorized('ADMIN', 'wms.inventory.create'), async (req, res) => {
  try {
    const data = req.body;
    data.tenantId = req.user!.activeTenantId;

    const newInventoryItem = await db
      .insert(inventoryItems)
      .values({
        id: sql`gen_random_uuid()`,
        tenantId: data.tenantId,
        productId: data.productId,
        binId: data.binId,
        availableQuantity: data.availableQuantity,
        reservedQuantity: data.reservedQuantity || 0,
        expiryDate: data.expiryDate || null,
        batchNumber: data.batchNumber || null,
        lotNumber: data.lotNumber || null,
        receivedDate: data.receivedDate || null,
        costPerUnit: data.costPerUnit || null,
      })
      .returning();

    res.status(201).json({
      success: true,
      data: newInventoryItem[0]
    });
  } catch (error) {
    console.error('Error creating inventory item:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/wms/inventory-items/{id}:
 *   get:
 *     tags:
 *       - WMS - Inventory Items
 *     summary: Get inventory item by ID
 *     description: Retrieve a specific inventory item with related product and bin information
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Inventory item ID
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Inventory item details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   allOf:
 *                     - $ref: '#/components/schemas/InventoryItem'
 *                     - type: object
 *                       properties:
 *                         product:
 *                           type: object
 *                         bin:
 *                           type: object
 *       404:
 *         description: Inventory item not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
inventoryItemRoutes.get("/:id", authorized('ADMIN', 'wms.inventory.view'), async (req, res) => {
  try {
    const { id } = req.params;

    const inventoryData = await db
      .select({
        id: inventoryItems.id,
        productId: inventoryItems.productId,
        binId: inventoryItems.binId,
        availableQuantity: inventoryItems.availableQuantity,
        reservedQuantity: inventoryItems.reservedQuantity,
        expiryDate: inventoryItems.expiryDate,
        batchNumber: inventoryItems.batchNumber,
        lotNumber: inventoryItems.lotNumber,
        receivedDate: inventoryItems.receivedDate,
        costPerUnit: inventoryItems.costPerUnit,
        tenantId: inventoryItems.tenantId,
        createdAt: inventoryItems.createdAt,
        updatedAt: inventoryItems.updatedAt,
        product: {
          id: products.id,
          sku: products.sku,
          name: products.name,
          description: products.description,
          minimumStockLevel: products.minimumStockLevel,
          reorderPoint: products.reorderPoint,
        },
        bin: {
          id: bins.id,
          name: bins.name,
          barcode: bins.barcode,
        },
      })
      .from(inventoryItems)
      .leftJoin(products, eq(inventoryItems.productId, products.id))
      .leftJoin(bins, eq(inventoryItems.binId, bins.id))
      .where(and(eq(inventoryItems.id, id), eq(inventoryItems.tenantId, req.user!.activeTenantId)));

    if (inventoryData.length === 0) {
      return res.status(404).json({ success: false, message: 'Inventory item not found' });
    }

    res.json({ success: true, data: inventoryData[0] });
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/wms/inventory-items/{id}:
 *   put:
 *     tags:
 *       - WMS - Inventory Items
 *     summary: Update inventory item
 *     description: Update an existing inventory item
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Inventory item ID
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - availableQuantity
 *               - reservedQuantity
 *             properties:
 *               availableQuantity:
 *                 type: integer
 *                 minimum: 0
 *               reservedQuantity:
 *                 type: integer
 *                 minimum: 0
 *               expiryDate:
 *                 type: string
 *                 format: date
 *               batchNumber:
 *                 type: string
 *                 maxLength: 100
 *               lotNumber:
 *                 type: string
 *                 maxLength: 100
 *               receivedDate:
 *                 type: string
 *                 format: date
 *               costPerUnit:
 *                 type: number
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Inventory item updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Inventory item not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
inventoryItemRoutes.put("/:id", validateData(inventoryItemEditSchema), authorized('ADMIN', 'wms.inventory.edit'), async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    // Check if inventory item exists and belongs to tenant
    const existingItem = await db
      .select()
      .from(inventoryItems)
      .where(and(eq(inventoryItems.id, id), eq(inventoryItems.tenantId, req.user!.activeTenantId)))
      .limit(1);

    if (existingItem.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    const updatedInventoryItem = await db
      .update(inventoryItems)
      .set({
        availableQuantity: data.availableQuantity,
        reservedQuantity: data.reservedQuantity,
        expiryDate: data.expiryDate || null,
        batchNumber: data.batchNumber || null,
        lotNumber: data.lotNumber || null,
        receivedDate: data.receivedDate || null,
        costPerUnit: data.costPerUnit || null,
        updatedAt: new Date(),
      })
      .where(eq(inventoryItems.id, id))
      .returning();

    res.json({
      success: true,
      data: updatedInventoryItem[0]
    });
  } catch (error) {
    console.error('Error updating inventory item:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/wms/inventory-items/{id}:
 *   delete:
 *     tags:
 *       - WMS - Inventory Items
 *     summary: Delete inventory item
 *     description: Delete an inventory item (only if quantities are zero)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Inventory item ID
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Inventory item deleted successfully
 *       400:
 *         description: Cannot delete item with stock
 *       404:
 *         description: Inventory item not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
inventoryItemRoutes.delete("/:id", authorized('ADMIN', 'wms.inventory.delete'), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if inventory item exists and belongs to tenant
    const existingItem = await db
      .select()
      .from(inventoryItems)
      .where(and(eq(inventoryItems.id, id), eq(inventoryItems.tenantId, req.user!.activeTenantId)))
      .limit(1);

    if (existingItem.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    // Check if item has any quantities
    if (existingItem[0].availableQuantity > 0 || existingItem[0].reservedQuantity > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete inventory item with remaining stock. Adjust quantities to zero first.'
      });
    }

    await db
      .delete(inventoryItems)
      .where(eq(inventoryItems.id, id));

    res.json({
      success: true,
      message: 'Inventory item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/wms/inventory-items/{id}/adjust:
 *   post:
 *     tags:
 *       - WMS - Inventory Items
 *     summary: Adjust inventory quantities
 *     description: Increase or decrease inventory quantities with reason tracking
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Inventory item ID
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - adjustmentType
 *               - quantity
 *               - reason
 *             properties:
 *               adjustmentType:
 *                 type: string
 *                 enum: [increase, decrease]
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *               reason:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: Inventory adjusted successfully
 *       400:
 *         description: Invalid adjustment or insufficient stock
 *       404:
 *         description: Inventory item not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
inventoryItemRoutes.post("/:id/adjust", validateData(inventoryAdjustmentSchema), authorized('ADMIN', 'wms.inventory.adjust'), async (req, res) => {
  try {
    const { id } = req.params;
    const { adjustmentType, quantity, reason } = req.body;

    // Check if inventory item exists and belongs to tenant
    const existingItem = await db
      .select()
      .from(inventoryItems)
      .where(and(eq(inventoryItems.id, id), eq(inventoryItems.tenantId, req.user!.activeTenantId)))
      .limit(1);

    if (existingItem.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    const currentQuantity = existingItem[0].availableQuantity;
    let newQuantity: number;

    if (adjustmentType === 'increase') {
      newQuantity = currentQuantity + quantity;
    } else {
      newQuantity = currentQuantity - quantity;
      if (newQuantity < 0) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient stock for this adjustment'
        });
      }
    }

    // Update inventory
    const updatedInventoryItem = await db
      .update(inventoryItems)
      .set({
        availableQuantity: newQuantity,
        updatedAt: new Date(),
      })
      .where(eq(inventoryItems.id, id))
      .returning();

    // TODO: Log the adjustment in movement history table
    // This would be implemented when we create the movement history functionality

    res.json({
      success: true,
      data: updatedInventoryItem[0],
      message: `Inventory ${adjustmentType}d by ${quantity} units. New quantity: ${newQuantity}`
    });
  } catch (error) {
    console.error('Error adjusting inventory:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default inventoryItemRoutes;
```

#### 3.2 Register inventory item routes in main routes file
**File**: `/src/server/routes/wms/index.ts`

```typescript
import { Router } from 'express';
import inventoryItemRoutes from './inventoryItem';

const wmsRoutes = Router();

wmsRoutes.use('/inventory-items', inventoryItemRoutes);

export default wmsRoutes;
```

#### 3.3 Register WMS routes in main server file
**File**: `/src/server/main.ts`

Add the WMS routes import and registration:

```typescript
// Add import
import wmsRoutes from "./routes/wms";

// Register routes (add after existing routes)
app.use("/api/wms", wmsRoutes);
```

### Step 4: Create Helper Functions and Services

#### 4.1 Create inventory service helper
**File**: `/src/server/lib/services/inventoryService.ts`

```typescript
import { db } from '../db';
import { inventoryItems, products, bins } from '../db/schema';
import { and, eq, sum, sql } from 'drizzle-orm';

export class InventoryService {
  /**
   * Get total stock for a product across all bins
   */
  static async getTotalStockForProduct(productId: string, tenantId: string) {
    const result = await db
      .select({
        totalAvailable: sum(inventoryItems.availableQuantity),
        totalReserved: sum(inventoryItems.reservedQuantity),
      })
      .from(inventoryItems)
      .where(and(
        eq(inventoryItems.productId, productId),
        eq(inventoryItems.tenantId, tenantId)
      ));

    return result[0] || { totalAvailable: 0, totalReserved: 0 };
  }

  /**
   * Check if product is running low on stock
   */
  static async isProductLowStock(productId: string, tenantId: string) {
    const [stockResult, productResult] = await Promise.all([
      this.getTotalStockForProduct(productId, tenantId),
      db
        .select({ minimumStockLevel: products.minimumStockLevel })
        .from(products)
        .where(and(eq(products.id, productId), eq(products.tenantId, tenantId)))
        .limit(1)
    ]);

    if (productResult.length === 0) return false;

    const minimumLevel = productResult[0].minimumStockLevel || 0;
    const available = Number(stockResult.totalAvailable) || 0;

    return available <= minimumLevel;
  }

  /**
   * Get items expiring soon
   */
  static async getItemsExpiringSoon(tenantId: string, days: number = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return await db
      .select({
        id: inventoryItems.id,
        productId: inventoryItems.productId,
        binId: inventoryItems.binId,
        availableQuantity: inventoryItems.availableQuantity,
        expiryDate: inventoryItems.expiryDate,
        productSku: products.sku,
        productName: products.name,
      })
      .from(inventoryItems)
      .leftJoin(products, eq(inventoryItems.productId, products.id))
      .where(and(
        eq(inventoryItems.tenantId, tenantId),
        sql`${inventoryItems.expiryDate} IS NOT NULL`,
        sql`${inventoryItems.expiryDate} <= ${futureDate.toISOString().split('T')[0]}`,
        sql`${inventoryItems.availableQuantity} > 0`
      ));
  }

  /**
   * Reserve inventory for an order
   */
  static async reserveInventory(productId: string, quantity: number, tenantId: string) {
    // Find available inventory items for the product (FEFO - First Expired First Out)
    const availableItems = await db
      .select()
      .from(inventoryItems)
      .where(and(
        eq(inventoryItems.productId, productId),
        eq(inventoryItems.tenantId, tenantId),
        sql`${inventoryItems.availableQuantity} > 0`
      ))
      .orderBy(sql`${inventoryItems.expiryDate} ASC NULLS LAST`);

    let remainingQuantity = quantity;
    const reservations = [];

    for (const item of availableItems) {
      if (remainingQuantity <= 0) break;

      const availableToReserve = item.availableQuantity;
      const toReserve = Math.min(remainingQuantity, availableToReserve);

      // Update the inventory item
      await db
        .update(inventoryItems)
        .set({
          availableQuantity: item.availableQuantity - toReserve,
          reservedQuantity: item.reservedQuantity + toReserve,
          updatedAt: new Date(),
        })
        .where(eq(inventoryItems.id, item.id));

      reservations.push({
        inventoryItemId: item.id,
        quantity: toReserve,
      });

      remainingQuantity -= toReserve;
    }

    if (remainingQuantity > 0) {
      throw new Error(`Insufficient stock. Could not reserve ${remainingQuantity} units`);
    }

    return reservations;
  }

  /**
   * Release reserved inventory
   */
  static async releaseReservedInventory(inventoryItemId: string, quantity: number) {
    const item = await db
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.id, inventoryItemId))
      .limit(1);

    if (item.length === 0) {
      throw new Error('Inventory item not found');
    }

    if (item[0].reservedQuantity < quantity) {
      throw new Error('Cannot release more than reserved quantity');
    }

    await db
      .update(inventoryItems)
      .set({
        availableQuantity: item[0].availableQuantity + quantity,
        reservedQuantity: item[0].reservedQuantity - quantity,
        updatedAt: new Date(),
      })
      .where(eq(inventoryItems.id, inventoryItemId));
  }
}
```

---

## Client-Side Implementation

### Step 5: Create Client-Side Schema

#### 5.1 Create inventory item client schema
**File**: `/src/client/schemas/inventoryItemSchema.ts`

```typescript
import { z } from 'zod';

export const inventoryItemFormSchema = z.object({
  productId: z.string().uuid("Please select a product"),
  binId: z.string().uuid("Please select a bin"),
  availableQuantity: z.number()
    .int("Available quantity must be a whole number")
    .min(0, "Available quantity cannot be negative"),
  reservedQuantity: z.number()
    .int("Reserved quantity must be a whole number")
    .min(0, "Reserved quantity cannot be negative")
    .default(0),
  expiryDate: z.string().optional(),
  batchNumber: z.string().max(100, "Batch number must be at most 100 characters").optional(),
  lotNumber: z.string().max(100, "Lot number must be at most 100 characters").optional(),
  receivedDate: z.string().optional(),
  costPerUnit: z.number().min(0, "Cost per unit cannot be negative").optional(),
});

export const inventoryAdjustmentFormSchema = z.object({
  adjustmentType: z.enum(["increase", "decrease"], {
    required_error: "Please select adjustment type",
  }),
  quantity: z.number()
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1"),
  reason: z.string()
    .min(1, "Reason is required")
    .max(500, "Reason must be at most 500 characters"),
});

// Type definitions
export type InventoryItemFormData = z.infer<typeof inventoryItemFormSchema>;
export type InventoryAdjustmentFormData = z.infer<typeof inventoryAdjustmentFormSchema>;

export interface InventoryItem {
  id: string;
  productId: string;
  binId: string;
  availableQuantity: number;
  reservedQuantity: number;
  expiryDate?: string | null;
  batchNumber?: string | null;
  lotNumber?: string | null;
  receivedDate?: string | null;
  costPerUnit?: number | null;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  // Related data
  productSku?: string;
  productName?: string;
  binName?: string;
  warehouseName?: string;
  totalQuantity?: number;
  product?: {
    id: string;
    sku: string;
    name: string;
    description?: string;
    minimumStockLevel?: number;
    reorderPoint?: number;
  };
  bin?: {
    id: string;
    name: string;
    barcode?: string;
  };
}

export interface InventoryItemQueryParams {
  page: number;
  perPage: number;
  sort: string;
  order: 'asc' | 'desc';
  filter?: string;
  productId?: string;
  binId?: string;
  warehouseId?: string;
  lowStock?: boolean;
  expiringSoon?: boolean;
  expiryDays?: number;
}

export interface InventoryItemListResponse {
  success: boolean;
  data: InventoryItem[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

export interface InventoryItemResponse {
  success: boolean;
  data: InventoryItem;
}
```

### Step 6: Create Inventory Item Service/API Layer

#### 6.1 Create inventory item API client
**File**: `/src/client/lib/api/inventoryItemApi.ts`

```typescript
import axios from 'axios';
import { 
  InventoryItem, 
  InventoryItemFormData, 
  InventoryItemQueryParams, 
  InventoryItemListResponse, 
  InventoryItemResponse,
  InventoryAdjustmentFormData 
} from '@client/schemas/inventoryItemSchema';

const BASE_URL = '/api/wms/inventory-items';

export const inventoryItemApi = {
  // Get paginated list of inventory items
  getInventoryItems: async (params: Partial<InventoryItemQueryParams>): Promise<InventoryItemListResponse> => {
    const response = await axios.get<InventoryItemListResponse>(BASE_URL, { params });
    return response.data;
  },

  // Get single inventory item by ID
  getInventoryItem: async (id: string): Promise<InventoryItemResponse> => {
    const response = await axios.get<InventoryItemResponse>(`${BASE_URL}/${id}`);
    return response.data;
  },

  // Create new inventory item
  createInventoryItem: async (data: InventoryItemFormData): Promise<InventoryItemResponse> => {
    const response = await axios.post<InventoryItemResponse>(BASE_URL, data);
    return response.data;
  },

  // Update inventory item
  updateInventoryItem: async (id: string, data: InventoryItemFormData): Promise<InventoryItemResponse> => {
    const response = await axios.put<InventoryItemResponse>(`${BASE_URL}/${id}`, { ...data, id });
    return response.data;
  },

  // Delete inventory item
  deleteInventoryItem: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await axios.delete(`${BASE_URL}/${id}`);
    return response.data;
  },

  // Adjust inventory quantities
  adjustInventory: async (id: string, data: InventoryAdjustmentFormData): Promise<InventoryItemResponse> => {
    const response = await axios.post<InventoryItemResponse>(`${BASE_URL}/${id}/adjust`, data);
    return response.data;
  },
};
```

### Step 7: Create Form Components

#### 7.1 Create inventory item add form component
**File**: `/src/client/components/forms/InventoryItemAddForm.tsx`

```typescript
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { inventoryItemFormSchema, type InventoryItemFormData } from '@client/schemas/inventoryItemSchema';
import { inventoryItemApi } from '@client/lib/api/inventoryItemApi';
import { productApi } from '@client/lib/api/productApi';
import { binApi } from '@client/lib/api/binApi';
import { useErrorHandler } from '@client/hooks/useErrorHandler';

interface Product {
  id: string;
  sku: string;
  name: string;
}

interface Bin {
  id: string;
  name: string;
  warehouseName?: string;
}

export function InventoryItemAddForm() {
  const navigate = useNavigate();
  const { handleError } = useErrorHandler();
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [bins, setBins] = useState<Bin[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingBins, setLoadingBins] = useState(true);

  const form = useForm<InventoryItemFormData>({
    resolver: zodResolver(inventoryItemFormSchema),
    defaultValues: {
      productId: '',
      binId: '',
      availableQuantity: 0,
      reservedQuantity: 0,
      expiryDate: '',
      batchNumber: '',
      lotNumber: '',
      receivedDate: '',
      costPerUnit: 0,
    },
  });

  // Load products and bins on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsResponse, binsResponse] = await Promise.all([
          productApi.getProducts({ page: 1, perPage: 1000 }),
          binApi.getBins({ page: 1, perPage: 1000 }),
        ]);
        
        setProducts(productsResponse.data);
        setBins(binsResponse.data);
      } catch (error) {
        handleError(error);
      } finally {
        setLoadingProducts(false);
        setLoadingBins(false);
      }
    };

    loadData();
  }, [handleError]);

  const onSubmit = async (data: InventoryItemFormData) => {
    setIsLoading(true);
    try {
      await inventoryItemApi.createInventoryItem(data);
      toast.success('Inventory item created successfully');
      navigate('/console/wms/inventory-items');
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Add Inventory Item</h2>
        <p className="text-muted-foreground">Create a new inventory item in your warehouse system</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Item Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="productId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a product" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {loadingProducts ? (
                            <SelectItem value="" disabled>Loading products...</SelectItem>
                          ) : (
                            products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.sku} - {product.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="binId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bin Location *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a bin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {loadingBins ? (
                            <SelectItem value="" disabled>Loading bins...</SelectItem>
                          ) : (
                            bins.map((bin) => (
                              <SelectItem key={bin.id} value={bin.id}>
                                {bin.name} {bin.warehouseName && `(${bin.warehouseName})`}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="availableQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Available Quantity *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reservedQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reserved Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="batchNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Batch Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter batch number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lotNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lot Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter lot number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="receivedDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Received Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expiryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiry Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="costPerUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost Per Unit</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Inventory Item'}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/console/wms/inventory-items')}>
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
```

#### 7.2 Create inventory item edit form component
**File**: `/src/client/components/forms/InventoryItemEditForm.tsx`

```typescript
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { inventoryItemFormSchema, type InventoryItemFormData, type InventoryItem } from '@client/schemas/inventoryItemSchema';
import { inventoryItemApi } from '@client/lib/api/inventoryItemApi';
import { useErrorHandler } from '@client/hooks/useErrorHandler';

export function InventoryItemEditForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { handleError } = useErrorHandler();
  const [isLoading, setIsLoading] = useState(false);
  const [inventoryItem, setInventoryItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);

  const form = useForm<InventoryItemFormData>({
    resolver: zodResolver(inventoryItemFormSchema),
    defaultValues: {
      availableQuantity: 0,
      reservedQuantity: 0,
      expiryDate: '',
      batchNumber: '',
      lotNumber: '',
      receivedDate: '',
      costPerUnit: 0,
    },
  });

  // Load inventory item data
  useEffect(() => {
    const loadInventoryItem = async () => {
      if (!id) return;
      
      try {
        const response = await inventoryItemApi.getInventoryItem(id);
        setInventoryItem(response.data);
        
        // Update form with existing data
        form.reset({
          productId: response.data.productId,
          binId: response.data.binId,
          availableQuantity: response.data.availableQuantity,
          reservedQuantity: response.data.reservedQuantity,
          expiryDate: response.data.expiryDate || '',
          batchNumber: response.data.batchNumber || '',
          lotNumber: response.data.lotNumber || '',
          receivedDate: response.data.receivedDate || '',
          costPerUnit: response.data.costPerUnit || 0,
        });
      } catch (error) {
        handleError(error);
      } finally {
        setLoading(false);
      }
    };

    loadInventoryItem();
  }, [id, form, handleError]);

  const onSubmit = async (data: InventoryItemFormData) => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      await inventoryItemApi.updateInventoryItem(id, data);
      toast.success('Inventory item updated successfully');
      navigate('/console/wms/inventory-items');
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Edit Inventory Item</h2>
          <p className="text-muted-foreground">Loading inventory item data...</p>
        </div>
      </div>
    );
  }

  if (!inventoryItem) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Edit Inventory Item</h2>
          <p className="text-muted-foreground">Inventory item not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Edit Inventory Item</h2>
        <p className="text-muted-foreground">
          {inventoryItem.product?.name} in {inventoryItem.bin?.name}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Item Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Product</label>
                  <div className="p-3 bg-muted rounded-md">
                    {inventoryItem.product?.sku} - {inventoryItem.product?.name}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Bin Location</label>
                  <div className="p-3 bg-muted rounded-md">
                    {inventoryItem.bin?.name}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="availableQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Available Quantity *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reservedQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reserved Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="batchNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Batch Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter batch number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lotNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lot Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter lot number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="receivedDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Received Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expiryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiry Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="costPerUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost Per Unit</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Updating...' : 'Update Inventory Item'}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/console/wms/inventory-items')}>
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
```

#### 7.3 Create inventory adjustment form component
**File**: `/src/client/components/forms/InventoryAdjustmentForm.tsx`

```typescript
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { inventoryAdjustmentFormSchema, type InventoryAdjustmentFormData, type InventoryItem } from '@client/schemas/inventoryItemSchema';
import { inventoryItemApi } from '@client/lib/api/inventoryItemApi';
import { useErrorHandler } from '@client/hooks/useErrorHandler';

export function InventoryAdjustmentForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { handleError } = useErrorHandler();
  const [isLoading, setIsLoading] = useState(false);
  const [inventoryItem, setInventoryItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);

  const form = useForm<InventoryAdjustmentFormData>({
    resolver: zodResolver(inventoryAdjustmentFormSchema),
    defaultValues: {
      adjustmentType: undefined,
      quantity: 1,
      reason: '',
    },
  });

  // Load inventory item data
  useEffect(() => {
    const loadInventoryItem = async () => {
      if (!id) return;
      
      try {
        const response = await inventoryItemApi.getInventoryItem(id);
        setInventoryItem(response.data);
      } catch (error) {
        handleError(error);
      } finally {
        setLoading(false);
      }
    };

    loadInventoryItem();
  }, [id, handleError]);

  const onSubmit = async (data: InventoryAdjustmentFormData) => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      await inventoryItemApi.adjustInventory(id, data);
      toast.success('Inventory adjusted successfully');
      navigate('/console/wms/inventory-items');
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Adjust Inventory</h2>
          <p className="text-muted-foreground">Loading inventory item data...</p>
        </div>
      </div>
    );
  }

  if (!inventoryItem) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Adjust Inventory</h2>
          <p className="text-muted-foreground">Inventory item not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Adjust Inventory</h2>
        <p className="text-muted-foreground">
          {inventoryItem.product?.name} in {inventoryItem.bin?.name}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Stock Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Available Quantity</label>
              <div className="text-2xl font-bold text-green-600">
                {inventoryItem.availableQuantity}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Reserved Quantity</label>
              <div className="text-2xl font-bold text-yellow-600">
                {inventoryItem.reservedQuantity}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Total Quantity</label>
              <div className="text-2xl font-bold">
                {inventoryItem.availableQuantity + inventoryItem.reservedQuantity}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Adjustment</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="adjustmentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adjustment Type *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select adjustment type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="increase">Increase Stock</SelectItem>
                          <SelectItem value="decrease">Decrease Stock</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          step="1"
                          placeholder="1"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason for Adjustment *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter the reason for this inventory adjustment..."
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Adjusting...' : 'Adjust Inventory'}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/console/wms/inventory-items')}>
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Step 8: Create Page Components

#### 8.1 Create inventory items list page
**File**: `/src/client/pages/console/wms/InventoryItems.tsx`

```typescript
import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, MoreHorizontal, Edit, Eye, Trash2, TrendingUp, TrendingDown, Package, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { DataPagination } from '@client/components/data-pagination';
import { SortButton } from '@client/components/sort-button';
import { type InventoryItem, type InventoryItemQueryParams } from '@client/schemas/inventoryItemSchema';
import { inventoryItemApi } from '@client/lib/api/inventoryItemApi';
import { useErrorHandler } from '@client/hooks/useErrorHandler';

export function InventoryItems() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { handleError } = useErrorHandler();
  
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('filter') || '');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Pagination state
  const [pagination, setPagination] = useState({
    page: parseInt(searchParams.get('page') || '1'),
    perPage: parseInt(searchParams.get('perPage') || '10'),
    total: 0,
    totalPages: 0,
  });

  // Filter state
  const [filters, setFilters] = useState({
    sort: searchParams.get('sort') || 'productSku',
    order: (searchParams.get('order') as 'asc' | 'desc') || 'asc',
    lowStock: searchParams.get('lowStock') === 'true',
    expiringSoon: searchParams.get('expiringSoon') === 'true',
  });

  // Load inventory items
  const loadInventoryItems = useCallback(async () => {
    setLoading(true);
    try {
      const params: Partial<InventoryItemQueryParams> = {
        page: pagination.page,
        perPage: pagination.perPage,
        sort: filters.sort,
        order: filters.order,
        filter: searchQuery || undefined,
        lowStock: filters.lowStock || undefined,
        expiringSoon: filters.expiringSoon || undefined,
      };

      const response = await inventoryItemApi.getInventoryItems(params);
      
      setInventoryItems(response.data);
      setPagination(response.pagination);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.perPage, filters, searchQuery, handleError]);

  useEffect(() => {
    loadInventoryItems();
  }, [loadInventoryItems]);

  // Update URL params when state changes
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('page', pagination.page.toString());
    params.set('perPage', pagination.perPage.toString());
    params.set('sort', filters.sort);
    params.set('order', filters.order);
    if (searchQuery) params.set('filter', searchQuery);
    if (filters.lowStock) params.set('lowStock', 'true');
    if (filters.expiringSoon) params.set('expiringSoon', 'true');
    setSearchParams(params);
  }, [pagination.page, pagination.perPage, filters, searchQuery, setSearchParams]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSort = (field: string) => {
    setFilters(prev => ({
      ...prev,
      sort: field,
      order: prev.sort === field && prev.order === 'asc' ? 'desc' : 'asc',
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleFilterChange = (key: keyof typeof filters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleDeleteClick = (item: InventoryItem) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    setDeleting(true);
    try {
      await inventoryItemApi.deleteInventoryItem(itemToDelete.id);
      toast.success('Inventory item deleted successfully');
      loadInventoryItems();
    } catch (error) {
      handleError(error);
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.availableQuantity === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    }
    if (item.product?.minimumStockLevel && item.availableQuantity <= item.product.minimumStockLevel) {
      return <Badge variant="secondary">Low Stock</Badge>;
    }
    return <Badge variant="default">In Stock</Badge>;
  };

  const isExpiringSoon = (expiryDate?: string | null) => {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays >= 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Inventory Items</h2>
          <p className="text-muted-foreground">
            Manage your warehouse inventory items and stock levels
          </p>
        </div>
        <Button asChild>
          <Link to="/console/wms/inventory-items/add">
            <Plus className="h-4 w-4 mr-2" />
            Add Inventory Item
          </Link>
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Inventory Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by product, batch, or lot..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="low-stock"
                  checked={filters.lowStock}
                  onCheckedChange={(checked) => handleFilterChange('lowStock', checked)}
                />
                <Label htmlFor="low-stock">Low Stock</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="expiring-soon"
                  checked={filters.expiringSoon}
                  onCheckedChange={(checked) => handleFilterChange('expiringSoon', checked)}
                />
                <Label htmlFor="expiring-soon">Expiring Soon</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Items Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <SortButton
                    field="productSku"
                    currentSort={filters.sort}
                    currentOrder={filters.order}
                    onSort={handleSort}
                  >
                    Product
                  </SortButton>
                </TableHead>
                <TableHead>
                  <SortButton
                    field="binName"
                    currentSort={filters.sort}
                    currentOrder={filters.order}
                    onSort={handleSort}
                  >
                    Location
                  </SortButton>
                </TableHead>
                <TableHead>
                  <SortButton
                    field="availableQuantity"
                    currentSort={filters.sort}
                    currentOrder={filters.order}
                    onSort={handleSort}
                  >
                    Available
                  </SortButton>
                </TableHead>
                <TableHead>
                  <SortButton
                    field="reservedQuantity"
                    currentSort={filters.sort}
                    currentOrder={filters.order}
                    onSort={handleSort}
                  >
                    Reserved
                  </SortButton>
                </TableHead>
                <TableHead>Batch/Lot</TableHead>
                <TableHead>
                  <SortButton
                    field="expiryDate"
                    currentSort={filters.sort}
                    currentOrder={filters.order}
                    onSort={handleSort}
                  >
                    Expiry Date
                  </SortButton>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Loading inventory items...
                  </TableCell>
                </TableRow>
              ) : inventoryItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    No inventory items found
                  </TableCell>
                </TableRow>
              ) : (
                inventoryItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.productSku}</div>
                        <div className="text-sm text-muted-foreground">{item.productName}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.binName}</div>
                        {item.warehouseName && (
                          <div className="text-sm text-muted-foreground">{item.warehouseName}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{item.availableQuantity}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{item.reservedQuantity}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {item.batchNumber && <div>Batch: {item.batchNumber}</div>}
                        {item.lotNumber && <div>Lot: {item.lotNumber}</div>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.expiryDate ? (
                        <div className={`text-sm ${isExpiringSoon(item.expiryDate) ? 'text-orange-600 font-medium' : ''}`}>
                          {new Date(item.expiryDate).toLocaleDateString()}
                          {isExpiringSoon(item.expiryDate) && (
                            <AlertTriangle className="h-4 w-4 inline ml-1" />
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>{getStockStatus(item)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/console/wms/inventory-items/${item.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={`/console/wms/inventory-items/${item.id}/edit`}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={`/console/wms/inventory-items/${item.id}/adjust`}>
                              <TrendingUp className="h-4 w-4 mr-2" />
                              Adjust Stock
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(item)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      <DataPagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        pageSize={pagination.perPage}
        totalItems={pagination.total}
        onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
        onPageSizeChange={(perPage) => setPagination(prev => ({ ...prev, perPage, page: 1 }))}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Inventory Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this inventory item? This action cannot be undone.
              {itemToDelete && (itemToDelete.availableQuantity > 0 || itemToDelete.reservedQuantity > 0) && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <strong>Warning:</strong> This item still has stock quantities. Consider adjusting to zero first.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
```

#### 8.2 Create inventory item view page
**File**: `/src/client/pages/console/wms/InventoryItemView.tsx`

```typescript
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Edit, TrendingUp, Package, MapPin, Calendar, DollarSign } from 'lucide-react';
import { type InventoryItem } from '@client/schemas/inventoryItemSchema';
import { inventoryItemApi } from '@client/lib/api/inventoryItemApi';
import { useErrorHandler } from '@client/hooks/useErrorHandler';

export function InventoryItemView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { handleError } = useErrorHandler();
  const [inventoryItem, setInventoryItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInventoryItem = async () => {
      if (!id) return;
      
      try {
        const response = await inventoryItemApi.getInventoryItem(id);
        setInventoryItem(response.data);
      } catch (error) {
        handleError(error);
      } finally {
        setLoading(false);
      }
    };

    loadInventoryItem();
  }, [id, handleError]);

  const getStockStatus = (item: InventoryItem) => {
    if (item.availableQuantity === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    }
    if (item.product?.minimumStockLevel && item.availableQuantity <= item.product.minimumStockLevel) {
      return <Badge variant="secondary">Low Stock</Badge>;
    }
    return <Badge variant="default">In Stock</Badge>;
  };

  const isExpiringSoon = (expiryDate?: string | null) => {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays >= 0;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/console/wms/inventory-items')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h2 className="text-2xl font-bold">Loading...</h2>
        </div>
      </div>
    );
  }

  if (!inventoryItem) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/console/wms/inventory-items')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h2 className="text-2xl font-bold">Inventory Item Not Found</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/console/wms/inventory-items')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Inventory Item Details</h2>
            <p className="text-muted-foreground">
              {inventoryItem.product?.name} in {inventoryItem.bin?.name}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to={`/console/wms/inventory-items/${inventoryItem.id}/adjust`}>
              <TrendingUp className="h-4 w-4 mr-2" />
              Adjust Stock
            </Link>
          </Button>
          <Button asChild>
            <Link to={`/console/wms/inventory-items/${inventoryItem.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stock Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Stock Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {inventoryItem.availableQuantity}
                  </div>
                  <div className="text-sm text-muted-foreground">Available</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600">
                    {inventoryItem.reservedQuantity}
                  </div>
                  <div className="text-sm text-muted-foreground">Reserved</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">
                    {inventoryItem.availableQuantity + inventoryItem.reservedQuantity}
                  </div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
              </div>
              <div className="flex justify-center">
                {getStockStatus(inventoryItem)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Product Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">SKU</label>
                  <div className="text-lg font-medium">{inventoryItem.product?.sku}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Product Name</label>
                  <div className="text-lg font-medium">{inventoryItem.product?.name}</div>
                </div>
                {inventoryItem.product?.description && (
                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">Description</label>
                    <div className="text-sm">{inventoryItem.product.description}</div>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Minimum Stock Level</label>
                  <div className="text-lg font-medium">
                    {inventoryItem.product?.minimumStockLevel || 'Not set'}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Reorder Point</label>
                  <div className="text-lg font-medium">
                    {inventoryItem.product?.reorderPoint || 'Not set'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Bin Name</label>
                  <div className="text-lg font-medium">{inventoryItem.bin?.name}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Warehouse</label>
                  <div className="text-lg font-medium">{inventoryItem.warehouseName || 'N/A'}</div>
                </div>
                {inventoryItem.bin?.barcode && (
                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">Bin Barcode</label>
                    <div className="text-lg font-medium font-mono">{inventoryItem.bin.barcode}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Information */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Dates & Tracking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Received Date</label>
                <div className="text-sm">
                  {inventoryItem.receivedDate 
                    ? new Date(inventoryItem.receivedDate).toLocaleDateString()
                    : 'N/A'
                  }
                </div>
              </div>
              <Separator />
              <div>
                <label className="text-sm font-medium text-muted-foreground">Expiry Date</label>
                <div className={`text-sm ${isExpiringSoon(inventoryItem.expiryDate) ? 'text-orange-600 font-medium' : ''}`}>
                  {inventoryItem.expiryDate 
                    ? new Date(inventoryItem.expiryDate).toLocaleDateString()
                    : 'N/A'
                  }
                  {isExpiringSoon(inventoryItem.expiryDate) && (
                    <Badge variant="secondary" className="ml-2">Expiring Soon</Badge>
                  )}
                </div>
              </div>
              <Separator />
              <div>
                <label className="text-sm font-medium text-muted-foreground">Batch Number</label>
                <div className="text-sm font-mono">
                  {inventoryItem.batchNumber || 'N/A'}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Lot Number</label>
                <div className="text-sm font-mono">
                  {inventoryItem.lotNumber || 'N/A'}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Cost Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Cost Per Unit</label>
                <div className="text-lg font-medium">
                  {inventoryItem.costPerUnit 
                    ? `$${inventoryItem.costPerUnit.toFixed(2)}`
                    : 'N/A'
                  }
                </div>
              </div>
              {inventoryItem.costPerUnit && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Total Value (Available)</label>
                    <div className="text-lg font-medium">
                      ${(inventoryItem.costPerUnit * inventoryItem.availableQuantity).toFixed(2)}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Created</label>
                <div className="text-sm">
                  {new Date(inventoryItem.createdAt).toLocaleString()}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                <div className="text-sm">
                  {new Date(inventoryItem.updatedAt).toLocaleString()}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Item ID</label>
                <div className="text-sm font-mono text-muted-foreground">
                  {inventoryItem.id}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
```

#### 8.3 Create inventory item add page
**File**: `/src/client/pages/console/wms/InventoryItemAdd.tsx`

```typescript
import { InventoryItemAddForm } from '@client/components/forms/InventoryItemAddForm';

export function InventoryItemAdd() {
  return <InventoryItemAddForm />;
}
```

#### 8.4 Create inventory item edit page
**File**: `/src/client/pages/console/wms/InventoryItemEdit.tsx`

```typescript
import { InventoryItemEditForm } from '@client/components/forms/InventoryItemEditForm';

export function InventoryItemEdit() {
  return <InventoryItemEditForm />;
}
```

#### 8.5 Create inventory item adjustment page
**File**: `/src/client/pages/console/wms/InventoryItemAdjust.tsx`

```typescript
import { InventoryAdjustmentForm } from '@client/components/forms/InventoryAdjustmentForm';

export function InventoryItemAdjust() {
  return <InventoryAdjustmentForm />;
}
```

### Step 9: Update Routing Configuration

#### 9.1 Update main route configuration
**File**: `/src/client/route.ts`

Add the WMS inventory item routes:

```typescript
// Add imports
import { InventoryItems } from '@client/pages/console/wms/InventoryItems';
import { InventoryItemView } from '@client/pages/console/wms/InventoryItemView';
import { InventoryItemAdd } from '@client/pages/console/wms/InventoryItemAdd';
import { InventoryItemEdit } from '@client/pages/console/wms/InventoryItemEdit';
import { InventoryItemAdjust } from '@client/pages/console/wms/InventoryItemAdjust';

// In the routes array, add these routes within the console layout:
{
  path: '/console/wms/inventory-items',
  element: <AuthorizedComponent requiredRoles={['ADMIN']} requiredPermissions={['wms.inventory.view']}><InventoryItems /></AuthorizedComponent>,
},
{
  path: '/console/wms/inventory-items/add',
  element: <AuthorizedComponent requiredRoles={['ADMIN']} requiredPermissions={['wms.inventory.create']}><InventoryItemAdd /></AuthorizedComponent>,
},
{
  path: '/console/wms/inventory-items/:id',
  element: <AuthorizedComponent requiredRoles={['ADMIN']} requiredPermissions={['wms.inventory.view']}><InventoryItemView /></AuthorizedComponent>,
},
{
  path: '/console/wms/inventory-items/:id/edit',
  element: <AuthorizedComponent requiredRoles={['ADMIN']} requiredPermissions={['wms.inventory.edit']}><InventoryItemEdit /></AuthorizedComponent>,
},
{
  path: '/console/wms/inventory-items/:id/adjust',
  element: <AuthorizedComponent requiredRoles={['ADMIN']} requiredPermissions={['wms.inventory.adjust']}><InventoryItemAdjust /></AuthorizedComponent>,
},
```

### Step 10: Update Navigation

#### 10.1 Update main navigation component
**File**: `/src/client/components/nav-main.tsx`

Add the inventory items navigation to the WMS section:

```typescript
// In the navigation items array, update or add the WMS section:
{
  title: "WMS",
  url: "#",
  icon: Package,
  isActive: pathname.startsWith('/console/wms'),
  items: [
    {
      title: "Dashboard",
      url: "/console/wms",
    },
    {
      title: "Master Data",
      url: "#",
      items: [
        {
          title: "Products",
          url: "/console/wms/products",
        },
        {
          title: "Suppliers & Customers",
          url: "/console/wms/suppliers-customers",
        },
        {
          title: "Warehouses",
          url: "/console/wms/warehouses",
        },
      ],
    },
    {
      title: "Inventory",
      url: "#",
      items: [
        {
          title: "Inventory Items",
          url: "/console/wms/inventory-items",
        },
        {
          title: "Stock Movements",
          url: "/console/wms/stock-movements",
        },
        {
          title: "Cycle Counting",
          url: "/console/wms/cycle-counting",
        },
      ],
    },
    {
      title: "Orders",
      url: "#",
      items: [
        {
          title: "Purchase Orders",
          url: "/console/wms/purchase-orders",
        },
        {
          title: "Sales Orders",
          url: "/console/wms/sales-orders",
        },
      ],
    },
    {
      title: "Operations",
      url: "#",
      items: [
        {
          title: "Receiving",
          url: "/console/wms/receiving",
        },
        {
          title: "Picking",
          url: "/console/wms/picking",
        },
        {
          title: "Shipping",
          url: "/console/wms/shipping",
        },
      ],
    },
  ],
},
```

---

## Testing & Validation

### Step 11: Test Server-Side Implementation

#### 11.1 Test API endpoints using curl or Postman

```bash
# Test GET /api/wms/inventory-items
curl -X GET "http://localhost:5000/api/wms/inventory-items" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"

# Test POST /api/wms/inventory-items
curl -X POST "http://localhost:5000/api/wms/inventory-items" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "uuid-here",
    "binId": "uuid-here",
    "availableQuantity": 100,
    "reservedQuantity": 0,
    "batchNumber": "BATCH001",
    "lotNumber": "LOT001",
    "receivedDate": "2024-01-01",
    "expiryDate": "2024-12-31",
    "costPerUnit": 10.50
  }'

# Test inventory adjustment
curl -X POST "http://localhost:5000/api/wms/inventory-items/ITEM_ID/adjust" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "adjustmentType": "increase",
    "quantity": 50,
    "reason": "Stock replenishment from supplier"
  }'
```

#### 11.2 Verify database tables and data
```sql
-- Check if inventory items table exists and has data
SELECT * FROM wms_inventory_items LIMIT 10;

-- Check relationships work
SELECT 
  ii.*,
  p.sku as product_sku,
  p.name as product_name,
  b.name as bin_name
FROM wms_inventory_items ii
LEFT JOIN wms_products p ON ii.product_id = p.id
LEFT JOIN wms_bins b ON ii.bin_id = b.id
WHERE ii.tenant_id = 'your-tenant-id';

-- Test filters
SELECT * FROM wms_inventory_items 
WHERE available_quantity <= 10; -- Low stock

SELECT * FROM wms_inventory_items 
WHERE expiry_date <= CURRENT_DATE + INTERVAL '30 days'; -- Expiring soon
```

### Step 12: Test Client-Side Implementation

#### 12.1 Test navigation and routing
- Navigate to `/console/wms/inventory-items` and verify the list page loads
- Test search, filtering, and sorting functionality
- Test pagination controls
- Verify low stock and expiring soon filters work

#### 12.2 Test form components
- Navigate to `/console/wms/inventory-items/add` and test the add form
- Select products and bins from dropdowns
- Submit the form and verify success message
- Navigate to edit form and test update functionality
- Test the adjustment form with both increase and decrease operations

#### 12.3 Test CRUD operations
- Create a new inventory item
- View the item details
- Edit the item information
- Adjust the stock quantities
- Delete an item (ensure validation works for items with stock)

### Step 13: Validation and Error Handling

#### 13.1 Test validation scenarios
- Try creating inventory items with invalid data
- Test duplicate product/bin combinations
- Verify quantity validations work
- Test adjustment with insufficient stock

#### 13.2 Test error handling
- Test with invalid IDs
- Test with expired authentication tokens
- Test with insufficient permissions
- Verify error messages are user-friendly

---

## Final Integration

### Step 14: Integration Checklist

#### 14.1 Database Integration
- [ ] WMS inventory schema is created and migrated
- [ ] Foreign key relationships are working
- [ ] Unique constraints are enforced
- [ ] Multitenancy isolation is working

#### 14.2 API Integration
- [ ] All CRUD endpoints are working
- [ ] Swagger documentation is generated
- [ ] Authentication and authorization work
- [ ] Validation schemas are applied
- [ ] Error handling is consistent

#### 14.3 Client Integration
- [ ] All pages are accessible via navigation
- [ ] Forms submit data correctly
- [ ] List page shows data with proper pagination
- [ ] Filtering and sorting work
- [ ] Success/error messages display properly

#### 14.4 Permission Integration
- [ ] Required permissions are defined in the system
- [ ] Routes are protected with proper permission checks
- [ ] UI elements respect user permissions
- [ ] API endpoints validate permissions

### Step 15: Production Readiness

#### 15.1 Performance optimizations
- [ ] Database indexes are optimized for queries
- [ ] API responses include only necessary data
- [ ] Client-side pagination is implemented
- [ ] Search queries are debounced

#### 15.2 Security considerations
- [ ] All inputs are validated on server-side
- [ ] SQL injection protection is in place
- [ ] Tenant isolation is enforced
- [ ] Sensitive data is properly handled

#### 15.3 Documentation
- [ ] API documentation is complete and accurate
- [ ] Client-side components are documented
- [ ] Database schema is documented
- [ ] User guide is created (if needed)

### Step 16: Future Enhancements

#### 16.1 Advanced features to consider
- Inventory movement history tracking
- Automated reorder point notifications
- Barcode scanning integration
- Inventory valuation methods (FIFO, LIFO, Average)
- Stock transfer between bins/warehouses
- Integration with purchase orders for automatic stock receiving

#### 16.2 Analytics and reporting
- Stock level analytics dashboard
- Inventory turnover reports
- Expiring stock reports
- Low stock alerts and notifications
- Cost analysis and valuation reports

---

## Conclusion

This comprehensive implementation guide provides a complete Master Inventory Items feature that follows the established patterns in the base-vibe project. The implementation includes:

✅ **Complete CRUD Operations**: Create, Read, Update, Delete inventory items
✅ **Advanced Filtering**: Search, low stock, expiring items, product/bin filters  
✅ **Stock Management**: Inventory adjustments with reason tracking
✅ **Rich UI Components**: Responsive forms, detailed views, intuitive navigation
✅ **Robust Validation**: Server and client-side validation with helpful error messages
✅ **Security & Permissions**: Multi-tenant isolation, role-based access control
✅ **Type Safety**: Full TypeScript implementation with proper type definitions
✅ **API Documentation**: Comprehensive Swagger documentation for all endpoints

The feature is designed to scale and integrate seamlessly with other WMS modules while maintaining consistency with the existing codebase architecture and design patterns.

