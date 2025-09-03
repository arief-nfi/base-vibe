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
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Expiry date must be in YYYY-MM-DD format")
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
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Received date must be in YYYY-MM-DD format")
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
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Expiry date must be in YYYY-MM-DD format")
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
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Received date must be in YYYY-MM-DD format")
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
