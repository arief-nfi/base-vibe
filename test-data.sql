-- Add test products
INSERT INTO wms_products (id, tenant_id, sku, name, description, minimum_stock_level, reorder_point, is_active, has_expiry_date, created_at, updated_at)
VALUES 
('550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM system_tenants WHERE name = 'Default Tenant' LIMIT 1), 'PROD001', 'Sample Product 1', 'Test product for inventory management', 10, 5, true, false, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440002', (SELECT id FROM system_tenants WHERE name = 'Default Tenant' LIMIT 1), 'PROD002', 'Sample Product 2', 'Another test product', 20, 10, true, true, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440003', (SELECT id FROM system_tenants WHERE name = 'Default Tenant' LIMIT 1), 'PROD003', 'Sample Product 3', 'Third test product', 15, 7, true, false, NOW(), NOW());

-- Add test warehouse
INSERT INTO wms_warehouses (id, tenant_id, name, address, is_active, created_at, updated_at)
VALUES ('550e8400-e29b-41d4-a716-446655440010', (SELECT id FROM system_tenants WHERE name = 'Default Tenant' LIMIT 1), 'Main Warehouse', '123 Storage Street', true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Add test zone
INSERT INTO wms_zones (id, warehouse_id, tenant_id, name, description, created_at)
VALUES ('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440010', (SELECT id FROM system_tenants WHERE name = 'Default Tenant' LIMIT 1), 'Zone A', 'Primary storage zone', NOW())
ON CONFLICT DO NOTHING;

-- Add test aisle
INSERT INTO wms_aisles (id, zone_id, tenant_id, name, description, created_at)
VALUES ('550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440020', (SELECT id FROM system_tenants WHERE name = 'Default Tenant' LIMIT 1), 'Aisle 1', 'First aisle in Zone A', NOW())
ON CONFLICT DO NOTHING;

-- Add test shelf
INSERT INTO wms_shelves (id, aisle_id, tenant_id, name, description, created_at)
VALUES ('550e8400-e29b-41d4-a716-446655440040', '550e8400-e29b-41d4-a716-446655440030', (SELECT id FROM system_tenants WHERE name = 'Default Tenant' LIMIT 1), 'Shelf 1', 'First shelf in Aisle 1', NOW())
ON CONFLICT DO NOTHING;

-- Add test bins
INSERT INTO wms_bins (id, shelf_id, tenant_id, name, barcode, max_weight, max_volume, is_active, created_at, updated_at)
VALUES 
('550e8400-e29b-41d4-a716-446655440050', '550e8400-e29b-41d4-a716-446655440040', (SELECT id FROM system_tenants WHERE name = 'Default Tenant' LIMIT 1), 'A1-01-01', 'BIN001', 100.000, 50.000, true, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440051', '550e8400-e29b-41d4-a716-446655440040', (SELECT id FROM system_tenants WHERE name = 'Default Tenant' LIMIT 1), 'A1-01-02', 'BIN002', 100.000, 50.000, true, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440052', '550e8400-e29b-41d4-a716-446655440040', (SELECT id FROM system_tenants WHERE name = 'Default Tenant' LIMIT 1), 'A1-01-03', 'BIN003', 100.000, 50.000, true, NOW(), NOW())
ON CONFLICT DO NOTHING;
