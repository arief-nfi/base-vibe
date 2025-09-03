import { Router } from 'express';
import { and, asc, count, desc, eq, gte, ilike, lte, or, sql } from 'drizzle-orm';
import { db } from '../../lib/db';
import { inventoryItems, products, bins, warehouses, zones, aisles, shelves } from '../../lib/db/schema';
import { authenticated, authorized } from '../../middleware/authMiddleware';
import { validateData } from '../../middleware/validationMiddleware';
import { 
  inventoryItemAddApiSchema, 
  inventoryItemAddSchema,
  inventoryItemEditSchema, 
  inventoryItemQuerySchema,
  inventoryAdjustmentApiSchema,
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
inventoryItemRoutes.post("/", validateData(inventoryItemAddApiSchema), authorized('ADMIN', 'wms.inventory.create'), async (req, res) => {
  try {
    const data = req.body;
    const tenantId = req.user!.activeTenantId;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID is required'
      });
    }

    // Add tenantId to data for full validation
    const fullData = { ...data, tenantId };

    // Validate the full data with tenantId
    try {
      const validatedData = await inventoryItemAddSchema.parseAsync(fullData);
      
      const newInventoryItem = await db
        .insert(inventoryItems)
        .values({
          tenantId: validatedData.tenantId,
          productId: validatedData.productId,
          binId: validatedData.binId,
          availableQuantity: validatedData.availableQuantity,
          reservedQuantity: validatedData.reservedQuantity || 0,
          expiryDate: validatedData.expiryDate || null,
          batchNumber: validatedData.batchNumber || null,
          lotNumber: validatedData.lotNumber || null,
          receivedDate: validatedData.receivedDate || null,
          costPerUnit: validatedData.costPerUnit ? validatedData.costPerUnit.toString() : null,
        })
        .returning();

      res.status(201).json({
        success: true,
        data: newInventoryItem[0]
      });
    } catch (validationError: any) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        details: validationError?.errors || validationError?.message || 'Unknown validation error'
      });
    }
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
        // Flat fields for easy access in frontend
        productSku: products.sku,
        productName: products.name,
        productDescription: products.description,
        binName: bins.name,
        binLocation: bins.name,
        warehouseName: warehouses.name,
        // Nested objects for detailed access if needed
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
      .leftJoin(shelves, eq(bins.shelfId, shelves.id))
      .leftJoin(aisles, eq(shelves.aisleId, aisles.id))
      .leftJoin(zones, eq(aisles.zoneId, zones.id))
      .leftJoin(warehouses, eq(zones.warehouseId, warehouses.id))
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
        productId: data.productId,
        binId: data.binId,
        availableQuantity: data.availableQuantity,
        reservedQuantity: data.reservedQuantity,
        expiryDate: data.expiryDate || null,
        batchNumber: data.batchNumber || null,
        lotNumber: data.lotNumber || null,
        receivedDate: data.receivedDate || null,
        costPerUnit: data.costPerUnit ? data.costPerUnit.toString() : null,
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
inventoryItemRoutes.post("/:id/adjust", validateData(inventoryAdjustmentApiSchema), authorized('ADMIN', 'wms.inventory.adjust'), async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Inventory item ID is required'
      });
    }

    // Add id to data for full validation
    const fullData = { ...data, id };

    // Validate the full data with id
    try {
      const validatedData = await inventoryAdjustmentSchema.parseAsync(fullData);
      
      const { adjustmentType, quantity, reason } = validatedData;

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
    } catch (validationError: any) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        details: validationError?.errors || validationError?.message || 'Unknown validation error'
      });
    }
  } catch (error) {
    console.error('Error adjusting inventory:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default inventoryItemRoutes;
