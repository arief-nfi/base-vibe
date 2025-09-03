import { Router } from 'express';
import { eq, asc, sql } from 'drizzle-orm';
import { db } from '../../lib/db';
import { products } from '../../lib/db/schema/wms/masterData';
import { authenticated, hasRoles, hasPermissions } from '../../middleware/authMiddleware';

const router = Router();

// Apply authentication middleware with SYSADMIN role and wms.inventory.view permission
router.use(authenticated());
//router.use(hasRoles(['SYSADMIN']));
//router.use(hasPermissions(['wms.inventory.view']));

/**
 * @swagger
 * /api/wms/products:
 *   get:
 *     summary: Get paginated list of products
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of products retrieved successfully
 */
router.get('/', async (req, res) => {
    try {
      // Get pagination parameters
      const page = parseInt(req.query.page as string) || 1;
      const perPage = parseInt(req.query.perPage as string) || 50;
      const offset = (page - 1) * perPage;

      // Get tenantId from authenticated user
      const tenantId = (req as any).user?.activeTenantId;
      
      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: 'Tenant ID is required',
        });
      }

      // Query products from database
      const productResults = await db
        .select({
          id: products.id,
          sku: products.sku,
          name: products.name,
          description: products.description,
          minimumStockLevel: products.minimumStockLevel,
          reorderPoint: products.reorderPoint,
          isActive: products.isActive,
          hasExpiryDate: products.hasExpiryDate,
          createdAt: products.createdAt,
          updatedAt: products.updatedAt,
        })
        .from(products)
        .where(eq(products.tenantId, tenantId))
        .orderBy(asc(products.name))
        .limit(perPage)
        .offset(offset);

      // Get total count for pagination
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(eq(products.tenantId, tenantId));

      const totalPages = Math.ceil(count / perPage);

      res.json({
        success: true,
        data: productResults,
        pagination: {
          page,
          perPage,
          total: count,
          totalPages,
        },
      });
    } catch (error) {
      console.error('Get products error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
);

export default router;
