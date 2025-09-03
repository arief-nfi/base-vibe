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
