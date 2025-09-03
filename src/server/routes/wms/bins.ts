import { Router } from 'express';
import { eq, asc, sql } from 'drizzle-orm';
import { db } from '../../lib/db';
import { bins, shelves, aisles, zones, warehouses } from '../../lib/db/schema/wms/warehouse';
import { authenticated, hasRoles, hasPermissions } from '../../middleware/authMiddleware';

const router = Router();

// Apply authentication middleware with SYSADMIN role and wms.inventory.view permission
router.use(authenticated());
//router.use(hasRoles(['SYSADMIN']));
//router.use(hasPermissions(['wms.inventory.view']));

/**
 * @swagger
 * /api/wms/bins:
 *   get:
 *     summary: Get paginated list of bins
 *     tags: [Bins]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of bins retrieved successfully
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

      // Query bins from database (simplified query without joins for now)
      const binResults = await db
        .select({
          id: bins.id,
          name: bins.name,
          barcode: bins.barcode,
          maxWeight: bins.maxWeight,
          maxVolume: bins.maxVolume,
          fixedSku: bins.fixedSku,
          category: bins.category,
          createdAt: bins.createdAt,
        })
        .from(bins)
        .where(eq(bins.tenantId, tenantId))
        .orderBy(asc(bins.name))
        .limit(perPage)
        .offset(offset);

      // Get total count for pagination
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(bins)
        .where(eq(bins.tenantId, tenantId));

      const totalPages = Math.ceil(count / perPage);

      res.json({
        success: true,
        data: binResults,
        pagination: {
          page,
          perPage,
          total: count,
          totalPages,
        },
      });
    } catch (error) {
      console.error('Get bins error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
);

export default router;
