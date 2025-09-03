import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router';
import { Button } from '@client/components/ui/button';
import { Input } from '@client/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@client/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@client/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@client/components/ui/form';
import { toast } from 'sonner';
import { inventoryItemEditSchema, type InventoryItemEditData, type InventoryItem } from '@client/schemas/inventoryItemSchema';
import { inventoryItemApi } from '@client/lib/api/inventoryItemApi';
import { productApi, type Product } from '@client/lib/api/productApi';
import { binApi, type Bin } from '@client/lib/api/binApi';
import { useErrorHandler } from '@client/hooks/useErrorHandler';

export function InventoryItemEditForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { handleError } = useErrorHandler();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingItem, setIsLoadingItem] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [bins, setBins] = useState<Bin[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingBins, setLoadingBins] = useState(true);

  const form = useForm<InventoryItemEditData>({
    resolver: zodResolver(inventoryItemEditSchema),
    defaultValues: {
      productId: '',
      binId: '',
      availableQuantity: 0,
      reservedQuantity: 0,
      expiryDate: '',
      batchNumber: '',
      lotNumber: '',
      receivedDate: '',
      costPerUnit: 0,
    },
  });

  // Load inventory item, products and bins on component mount
  useEffect(() => {
    if (!id) {
      toast.error('Invalid inventory item ID');
      navigate('/console/wms/inventory-items');
      return;
    }

    const loadData = async () => {
      try {
        const [itemResponse, productsResponse, binsResponse] = await Promise.all([
          inventoryItemApi.getInventoryItem(id),
          productApi.getProducts({ page: 1, perPage: 1000 }),
          binApi.getBins({ page: 1, perPage: 1000 }),
        ]);
        
        const item = itemResponse.data;
        
        // Set form values from the item
        form.reset({
          productId: item.productId,
          binId: item.binId,
          availableQuantity: item.availableQuantity,
          reservedQuantity: item.reservedQuantity,
          expiryDate: item.expiryDate || '',
          batchNumber: item.batchNumber || '',
          lotNumber: item.lotNumber || '',
          receivedDate: item.receivedDate || '',
          costPerUnit: Math.round(item.costPerUnit || 0),
        });
        
        setProducts(productsResponse.data);
        setBins(binsResponse.data);
      } catch (error) {
        handleError(error);
      } finally {
        setIsLoadingItem(false);
        setLoadingProducts(false);
        setLoadingBins(false);
      }
    };

    loadData();
  }, [id, form, handleError, navigate]);

  const onSubmit = async (data: InventoryItemEditData) => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      await inventoryItemApi.updateInventoryItem(id, data);
      toast.success('Inventory item updated successfully');
      navigate('/console/wms/inventory-items');
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingItem) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Edit Inventory Item</h2>
          <p className="text-muted-foreground">Loading inventory item details...</p>
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

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Product Selection */}
                <FormField
                  control={form.control}
                  name="productId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a product" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {loadingProducts ? (
                            <SelectItem value="" disabled>Loading products...</SelectItem>
                          ) : products.length === 0 ? (
                            <SelectItem value="" disabled>No products found</SelectItem>
                          ) : (
                            products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.sku} - {product.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Bin Selection */}
                <FormField
                  control={form.control}
                  name="binId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bin *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a bin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {loadingBins ? (
                            <SelectItem value="__loading__" disabled>Loading bins...</SelectItem>
                          ) : (
                            bins.map((bin) => (
                              <SelectItem key={bin.id} value={bin.id}>
                                {bin.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="availableQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Available Quantity *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="Enter available quantity"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reservedQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reserved Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="Enter reserved quantity"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Cost Per Unit */}
                <FormField
                  control={form.control}
                  name="costPerUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost Per Unit</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="Enter cost per unit"
                          {...field}
                          onChange={(e) => field.onChange(Math.round(parseFloat(e.target.value)) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Batch Number */}
                <FormField
                  control={form.control}
                  name="batchNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Batch Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter batch number"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Lot Number */}
                <FormField
                  control={form.control}
                  name="lotNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lot Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter lot number"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Expiry Date */}
                <FormField
                  control={form.control}
                  name="expiryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiry Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Received Date */}
                <FormField
                  control={form.control}
                  name="receivedDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Received Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Updating...' : 'Update Inventory Item'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/console/wms/inventory-items')}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
  );
}
