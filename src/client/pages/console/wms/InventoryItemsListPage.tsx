import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Plus, Search, Filter, Download, Edit, Trash2, Package, TrendingUp, AlertCircle } from 'lucide-react';
import { Button } from '@client/components/ui/button';
import { Input } from '@client/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@client/components/ui/card';
import { Badge } from '@client/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@client/components/ui/select';
import { Checkbox } from '@client/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@client/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@client/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { inventoryItemApi } from '@client/lib/api/inventoryItemApi';
import { type InventoryItem } from '@client/schemas/inventoryItemSchema';
import { useErrorHandler } from '@client/hooks/useErrorHandler';
import DataPagination from '@client/components/data-pagination';

export function InventoryItemsListPage() {
  const navigate = useNavigate();
  const { handleError } = useErrorHandler();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
  // Pagination and filtering
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 10,
    total: 0,
    totalPages: 0,
  });
  
  // Get query parameters
  const page = parseInt(searchParams.get('page') || '1');
  const perPage = parseInt(searchParams.get('perPage') || '10');
  const sort = searchParams.get('sort') || 'productSku';
  const order = (searchParams.get('order') || 'asc') as 'asc' | 'desc';
  const filter = searchParams.get('filter') || '';
  const productId = searchParams.get('productId') || '';
  const binId = searchParams.get('binId') || '';
  const warehouseId = searchParams.get('warehouseId') || '';
  const lowStock = searchParams.get('lowStock') === 'true';
  const expiringSoon = searchParams.get('expiringSoon') === 'true';
  const expiryDays = parseInt(searchParams.get('expiryDays') || '30');

  // Load data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const response = await inventoryItemApi.getInventoryItems({
        page,
        perPage,
        sort,
        order,
        filter: filter || undefined,
        productId: productId || undefined,
        binId: binId || undefined,
        warehouseId: warehouseId || undefined,
        lowStock: lowStock || undefined,
        expiringSoon: expiringSoon || undefined,
        expiryDays: expiringSoon ? expiryDays : undefined,
      });
      
      setItems(response.data);
      setPagination(response.pagination);
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, perPage, sort, order, filter, productId, binId, warehouseId, lowStock, expiringSoon, expiryDays]);

  // Update URL params
  const updateSearchParams = (updates: Record<string, string | number | boolean | null>) => {
    const newParams = new URLSearchParams(searchParams);
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '' || value === false) {
        newParams.delete(key);
      } else {
        newParams.set(key, String(value));
      }
    });
    
    // Reset to page 1 when filtering/sorting changes
    if (!updates.page) {
      newParams.set('page', '1');
    }
    
    setSearchParams(newParams);
  };

  // Handle delete
  const handleDelete = async (item: InventoryItem) => {
    if (!confirm(`Are you sure you want to delete inventory item for ${item.productSku}?`)) {
      return;
    }
    
    setIsDeleting(item.id);
    try {
      await inventoryItemApi.deleteInventoryItem(item.id);
      toast.success('Inventory item deleted successfully');
      loadData();
    } catch (error) {
      handleError(error);
    } finally {
      setIsDeleting(null);
    }
  };

  // Handle export (placeholder)
  const handleExport = () => {
    toast.info('Export functionality will be implemented soon');
  };

  // Get status badge for inventory
  const getStatusBadge = (item: InventoryItem) => {
    const isLowStock = item.totalQuantity && item.totalQuantity < 10; // Simple threshold
    const isExpiringSoon = item.expiryDate && new Date(item.expiryDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    if (isExpiringSoon) {
      return <Badge variant="destructive" className="text-xs">Expiring Soon</Badge>;
    }
    if (isLowStock) {
      return <Badge variant="outline" className="text-xs border-orange-500 text-orange-700">Low Stock</Badge>;
    }
    if (item.availableQuantity > 0) {
      return <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">Available</Badge>;
    }
    return <Badge variant="outline" className="text-xs">Out of Stock</Badge>;
  };

  return (
    <div className="space-y-6 px-2 pb-4">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">Inventory Items</h2>
          <p className="text-muted-foreground">Manage your warehouse inventory items</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button asChild>
            <Link to="/console/wms/inventory-items/add">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products, SKU, batch..."
                value={filter}
                onChange={(e) => updateSearchParams({ filter: e.target.value })}
                className="pl-9"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="lowStock"
                checked={lowStock}
                onCheckedChange={(checked) => updateSearchParams({ lowStock: checked })}
              />
              <label htmlFor="lowStock" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Low Stock Only
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="expiringSoon"
                checked={expiringSoon}
                onCheckedChange={(checked) => updateSearchParams({ expiringSoon: checked })}
              />
              <label htmlFor="expiringSoon" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Expiring Soon
              </label>
            </div>
            
            <Select
              value={perPage.toString()}
              onValueChange={(value) => updateSearchParams({ perPage: parseInt(value), page: 1 })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 per page</SelectItem>
                <SelectItem value="25">25 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
                <SelectItem value="100">100 per page</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => updateSearchParams({ 
                          sort: 'productSku', 
                          order: sort === 'productSku' && order === 'asc' ? 'desc' : 'asc' 
                        })}
                        className="flex items-center gap-1 h-8 p-0 font-semibold"
                      >
                        Product
                        {sort === 'productSku' && (
                          <span className="ml-1">{order === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => updateSearchParams({ 
                          sort: 'binName', 
                          order: sort === 'binName' && order === 'asc' ? 'desc' : 'asc' 
                        })}
                        className="flex items-center gap-1 h-8 p-0 font-semibold"
                      >
                        Bin Location
                        {sort === 'binName' && (
                          <span className="ml-1">{order === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => updateSearchParams({ 
                          sort: 'availableQuantity', 
                          order: sort === 'availableQuantity' && order === 'asc' ? 'desc' : 'asc' 
                        })}
                        className="flex items-center gap-1 h-8 p-0 font-semibold"
                      >
                        Available
                        {sort === 'availableQuantity' && (
                          <span className="ml-1">{order === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => updateSearchParams({ 
                          sort: 'reservedQuantity', 
                          order: sort === 'reservedQuantity' && order === 'asc' ? 'desc' : 'asc' 
                        })}
                        className="flex items-center gap-1 h-8 p-0 font-semibold"
                      >
                        Reserved
                        {sort === 'reservedQuantity' && (
                          <span className="ml-1">{order === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>Batch/Lot</TableHead>
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => updateSearchParams({ 
                          sort: 'expiryDate', 
                          order: sort === 'expiryDate' && order === 'asc' ? 'desc' : 'asc' 
                        })}
                        className="flex items-center gap-1 h-8 p-0 font-semibold"
                      >
                        Expiry Date
                        {sort === 'expiryDate' && (
                          <span className="ml-1">{order === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="text-muted-foreground">
                          <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No inventory items found</p>
                          <p className="text-sm">Try adjusting your filters or add a new inventory item</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item) => (
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
                        <TableCell className="font-mono">{item.availableQuantity}</TableCell>
                        <TableCell className="font-mono">{item.reservedQuantity}</TableCell>
                        <TableCell>
                          {item.batchNumber || item.lotNumber ? (
                            <div className="text-sm">
                              {item.batchNumber && <div>B: {item.batchNumber}</div>}
                              {item.lotNumber && <div>L: {item.lotNumber}</div>}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.expiryDate ? (
                            <span className="text-sm">
                              {new Date(item.expiryDate).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(item)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                •••
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link to={`/console/wms/inventory-items/${item.id}`}>
                                  View Details
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
                                  Adjust Quantity
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(item)}
                                disabled={isDeleting === item.id}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {isDeleting === item.id ? 'Deleting...' : 'Delete'}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              
              {items.length > 0 && (
                <div className="p-4 border-t">
                  <DataPagination
                    page={pagination.page}
                    perPage={pagination.perPage}
                    count={pagination.total}
                    onPageChange={(page: number) => updateSearchParams({ page })}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
