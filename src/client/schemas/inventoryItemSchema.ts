import { z } from 'zod';

export const inventoryItemFormSchema = z.object({
  productId: z.string().uuid("Please select a product"),
  binId: z.string().uuid("Please select a bin"),
  availableQuantity: z.number()
    .int("Available quantity must be a whole number")
    .min(0, "Available quantity cannot be negative"),
  reservedQuantity: z.number()
    .int("Reserved quantity must be a whole number")
    .min(0, "Reserved quantity cannot be negative"),
  expiryDate: z.string().optional(),
  batchNumber: z.string().max(100, "Batch number must be at most 100 characters").optional(),
  lotNumber: z.string().max(100, "Lot number must be at most 100 characters").optional(),
  receivedDate: z.string().optional(),
  costPerUnit: z.number().min(0, "Cost per unit cannot be negative").optional(),
});

export const inventoryItemEditSchema = z.object({
  productId: z.string().uuid("Please select a product"),
  binId: z.string().uuid("Please select a bin"),
  availableQuantity: z.number()
    .int("Available quantity must be a whole number")
    .min(0, "Available quantity cannot be negative"),
  reservedQuantity: z.number()
    .int("Reserved quantity must be a whole number")
    .min(0, "Reserved quantity cannot be negative"),
  expiryDate: z.string().optional(),
  batchNumber: z.string().max(100, "Batch number must be at most 100 characters").optional(),
  lotNumber: z.string().max(100, "Lot number must be at most 100 characters").optional(),
  receivedDate: z.string().optional(),
  costPerUnit: z.number().min(0, "Cost per unit cannot be negative").optional(),
});

export const inventoryAdjustmentFormSchema = z.object({
  adjustmentType: z.enum(["increase", "decrease"], {
    message: "Please select adjustment type",
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
export type InventoryItemEditData = z.infer<typeof inventoryItemEditSchema>;
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
