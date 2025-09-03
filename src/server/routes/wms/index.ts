import { Router } from 'express';
import inventoryItemRoutes from './inventoryItem';
import productRoutes from './products';
import binRoutes from './bins';

const wmsRoutes = Router();

wmsRoutes.use('/inventory-items', inventoryItemRoutes);
wmsRoutes.use('/products', productRoutes);
wmsRoutes.use('/bins', binRoutes);

export default wmsRoutes;
