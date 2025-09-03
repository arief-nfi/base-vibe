import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ArrowLeft, Edit, TrendingUp, Package, Calendar, MapPin, Hash, DollarSign, Clock } from 'lucide-react';
import { Button } from '@client/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@client/components/ui/card';
import { Badge } from '@client/components/ui/badge';
import { Separator } from '@client/components/ui/separator';
import { toast } from 'sonner';
import { inventoryItemApi } from '@client/lib/api/inventoryItemApi';
import { type InventoryItem } from '@client/schemas/inventoryItemSchema';
import { useErrorHandler } from '@client/hooks/useErrorHandler';

export function InventoryItemViewPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { handleError } = useErrorHandler();
  
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      toast.error('Invalid inventory item ID');
      navigate('/console/wms/inventory-items');
      return;
    }

    const loadItem = async () => {
      setIsLoading(true);
      try {
        const response = await inventoryItemApi.getInventoryItem(id);
        setItem(response.data);
      } catch (error) {
        handleError(error);
        navigate('/console/wms/inventory-items');
      } finally {
        setIsLoading(false);
      }
    };

    loadItem();
  }, [id, handleError, navigate]);

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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/console/wms/inventory-items')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to List
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Inventory Item Details</h2>
            <p className="text-muted-foreground">Loading inventory item...</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!item) {
    return null;
  }

  return (
    <div className="space-y-6 px-2 pb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/console/wms/inventory-items')}>
            <ArrowLeft className="h-2 w-2" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Inventory Item Details</h2>
            <p className="text-muted-foreground">View and manage inventory item information</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to={`/console/wms/inventory-items/${item.id}/adjust`}>
              <TrendingUp className="h-4 w-4 mr-2" />
              Adjust Quantity
            </Link>
          </Button>
          <Button asChild>
            <Link to={`/console/wms/inventory-items/${item.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Item
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Product Information
                </CardTitle>
                {getStatusBadge(item)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Product SKU</label>
                  <p className="text-lg font-semibold">{item.productSku || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Product Name</label>
                  <p className="text-lg">{item.productName || 'N/A'}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Bin Location
                  </label>
                  <p className="text-lg font-semibold">{item.binName || 'N/A'}</p>
                  {item.warehouseName && (
                    <p className="text-sm text-muted-foreground">{item.warehouseName}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Total Quantity</label>
                  <p className="text-lg font-semibold">
                    {(item.availableQuantity || 0) + (item.reservedQuantity || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Batch and Lot Information */}
          {(item.batchNumber || item.lotNumber || item.expiryDate || item.receivedDate) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="h-5 w-5" />
                  Batch & Tracking Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {item.batchNumber && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Batch Number</label>
                      <p className="text-lg font-mono">{item.batchNumber}</p>
                    </div>
                  )}
                  {item.lotNumber && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Lot Number</label>
                      <p className="text-lg font-mono">{item.lotNumber}</p>
                    </div>
                  )}
                  {item.receivedDate && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Received Date
                      </label>
                      <p className="text-lg">{new Date(item.receivedDate).toLocaleDateString()}</p>
                    </div>
                  )}
                  {item.expiryDate && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Expiry Date
                      </label>
                      <p className="text-lg">{new Date(item.expiryDate).toLocaleDateString()}</p>
                      {new Date(item.expiryDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && (
                        <p className="text-sm text-destructive">⚠️ Expiring within 30 days</p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Quantities and Metadata */}
        <div className="space-y-6">
          {/* Quantity Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Quantity Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-green-800">Available</p>
                    <p className="text-xs text-green-600">Ready for use</p>
                  </div>
                  <p className="text-2xl font-bold text-green-800">{item.availableQuantity || 0}</p>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-orange-800">Reserved</p>
                    <p className="text-xs text-orange-600">Allocated for orders</p>
                  </div>
                  <p className="text-2xl font-bold text-orange-800">{item.reservedQuantity || 0}</p>
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-blue-800">Total</p>
                    <p className="text-xs text-blue-600">All quantities</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-800">
                    {(item.availableQuantity || 0) + (item.reservedQuantity || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cost Information */}
          {item.costPerUnit && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Cost Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Cost Per Unit</label>
                    <p className="text-2xl font-bold">${(Number(item.costPerUnit) || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Total Value</label>
                    <p className="text-xl font-semibold">
                      ${(((item.availableQuantity || 0) + (item.reservedQuantity || 0)) * (Number(item.costPerUnit) || 0)).toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Record Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Created</label>
                <p className="text-sm">{new Date(item.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                <p className="text-sm">{new Date(item.updatedAt).toLocaleString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Item ID</label>
                <p className="text-sm font-mono text-xs">{item.id}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
