-- Create test data for WMS inventory testing

-- Get the tenant ID (assuming we're working with the system tenant)
-- We'll use the system tenant from our seed data

-- Insert a warehouse
INSERT INTO wms_warehouses (id, tenant_id, name, address, is_active) 
SELECT gen_random_uuid(), id, 'Test Warehouse', '123 Test Street, Test City', true
FROM sys_tenant WHERE code = 'SYSTEM'
ON CONFLICT DO NOTHING;

-- Insert a zone
WITH warehouse AS (
  SELECT w.id as warehouse_id, w.tenant_id
  FROM wms_warehouses w
  JOIN sys_tenant t ON w.tenant_id = t.id
  WHERE t.code = 'SYSTEM' AND w.name = 'Test Warehouse'
  LIMIT 1
)
INSERT INTO wms_zones (id, warehouse_id, tenant_id, name, description)
SELECT gen_random_uuid(), warehouse_id, tenant_id, 'Zone A', 'Test Zone A'
FROM warehouse
ON CONFLICT DO NOTHING;

-- Insert an aisle
WITH zone AS (
  SELECT z.id as zone_id, z.tenant_id
  FROM wms_zones z
  JOIN wms_warehouses w ON z.warehouse_id = w.id
  JOIN sys_tenant t ON z.tenant_id = t.id
  WHERE t.code = 'SYSTEM' AND w.name = 'Test Warehouse' AND z.name = 'Zone A'
  LIMIT 1
)
INSERT INTO wms_aisles (id, zone_id, tenant_id, name, description)
SELECT gen_random_uuid(), zone_id, tenant_id, 'Aisle 1', 'Test Aisle 1'
FROM zone
ON CONFLICT DO NOTHING;

-- Insert a shelf
WITH aisle AS (
  SELECT a.id as aisle_id, a.tenant_id
  FROM wms_aisles a
  JOIN wms_zones z ON a.zone_id = z.id
  JOIN wms_warehouses w ON z.warehouse_id = w.id
  JOIN sys_tenant t ON a.tenant_id = t.id
  WHERE t.code = 'SYSTEM' AND w.name = 'Test Warehouse' AND z.name = 'Zone A' AND a.name = 'Aisle 1'
  LIMIT 1
)
INSERT INTO wms_shelves (id, aisle_id, tenant_id, name, description)
SELECT gen_random_uuid(), aisle_id, tenant_id, 'Shelf 1', 'Test Shelf 1'
FROM aisle
ON CONFLICT DO NOTHING;

-- Insert a bin
WITH shelf AS (
  SELECT s.id as shelf_id, s.tenant_id
  FROM wms_shelves s
  JOIN wms_aisles a ON s.aisle_id = a.id
  JOIN wms_zones z ON a.zone_id = z.id
  JOIN wms_warehouses w ON z.warehouse_id = w.id
  JOIN sys_tenant t ON s.tenant_id = t.id
  WHERE t.code = 'SYSTEM' AND w.name = 'Test Warehouse' AND z.name = 'Zone A' AND a.name = 'Aisle 1' AND s.name = 'Shelf 1'
  LIMIT 1
)
INSERT INTO wms_bins (id, shelf_id, tenant_id, name, barcode, max_weight, max_volume, is_active)
SELECT gen_random_uuid(), shelf_id, tenant_id, 'Bin A1', 'BIN-A1', 100.000, 50.000, true
FROM shelf
ON CONFLICT DO NOTHING;

-- Insert a product type
INSERT INTO wms_product_types (id, tenant_id, name, description, category, is_active)
SELECT gen_random_uuid(), id, 'Electronics', 'Electronic products', 'GENERAL', true
FROM sys_tenant WHERE code = 'SYSTEM'
ON CONFLICT DO NOTHING;

-- Insert a product
WITH product_type AS (
  SELECT pt.id as product_type_id, pt.tenant_id
  FROM wms_product_types pt
  JOIN sys_tenant t ON pt.tenant_id = t.id
  WHERE t.code = 'SYSTEM' AND pt.name = 'Electronics'
  LIMIT 1
)
INSERT INTO wms_products (id, tenant_id, product_type_id, sku, name, description, minimum_stock_level, reorder_point, has_expiry_date, is_active)
SELECT gen_random_uuid(), tenant_id, product_type_id, 'LAPTOP-001', 'Gaming Laptop', 'High-performance gaming laptop', 5, 10, false, true
FROM product_type
ON CONFLICT DO NOTHING;

-- Add another bin for testing
WITH shelf AS (
  SELECT s.id as shelf_id, s.tenant_id
  FROM wms_shelves s
  JOIN wms_aisles a ON s.aisle_id = a.id
  JOIN wms_zones z ON a.zone_id = z.id
  JOIN wms_warehouses w ON z.warehouse_id = w.id
  JOIN sys_tenant t ON s.tenant_id = t.id
  WHERE t.code = 'SYSTEM' AND w.name = 'Test Warehouse' AND z.name = 'Zone A' AND a.name = 'Aisle 1' AND s.name = 'Shelf 1'
  LIMIT 1
)
INSERT INTO wms_bins (id, shelf_id, tenant_id, name, barcode, max_weight, max_volume, is_active)
SELECT gen_random_uuid(), shelf_id, tenant_id, 'Bin A2', 'BIN-A2', 100.000, 50.000, true
FROM shelf
ON CONFLICT DO NOTHING;

-- Display the created test data
SELECT 'Created test data:' as status;
SELECT 'Warehouses:' as table_name, name, address FROM wms_warehouses w JOIN sys_tenant t ON w.tenant_id = t.id WHERE t.code = 'SYSTEM';
SELECT 'Products:' as table_name, sku, name, description FROM wms_products p JOIN sys_tenant t ON p.tenant_id = t.id WHERE t.code = 'SYSTEM';
SELECT 'Bins:' as table_name, name, barcode FROM wms_bins b JOIN sys_tenant t ON b.tenant_id = t.id WHERE t.code = 'SYSTEM';
