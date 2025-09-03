import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router';
import { Button } from '@client/components/ui/button';
import { Input } from '@client/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@client/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@client/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@client/components/ui/form';
import { toast } from 'sonner';
import { inventoryItemFormSchema, type InventoryItemFormData } from '@client/schemas/inventoryItemSchema';
import { inventoryItemApi } from '@client/lib/api/inventoryItemApi';
import { productApi, type Product } from '@client/lib/api/productApi';
import { binApi, type Bin } from '@client/lib/api/binApi';
import { useErrorHandler } from '@client/hooks/useErrorHandler';

export function InventoryItemAddForm() {
  const navigate = useNavigate();
  const { handleError } = useErrorHandler();
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [bins, setBins] = useState<Bin[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingBins, setLoadingBins] = useState(true);

  const form = useForm<InventoryItemFormData>({
    resolver: zodResolver(inventoryItemFormSchema),
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

  // Load products and bins on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingProducts(true);
        setLoadingBins(true);

        const [productsResponse, binsResponse] = await Promise.all([
          productApi.getProducts({ page: 1, perPage: 1000 }),
          binApi.getBins({ page: 1, perPage: 1000 })
        ]);

        setProducts(productsResponse.data || []);
        setBins(binsResponse.data || []);
      } catch (error) {
        handleError(error);
        toast.error('Failed to load data');
      } finally {
        setLoadingProducts(false);
        setLoadingBins(false);
      }
    };

    loadData();
  }, [handleError]);

  const onSubmit = async (data: InventoryItemFormData) => {
    try {
      setIsLoading(true);
      await inventoryItemApi.createInventoryItem(data);
      toast.success('Inventory item created successfully');
      navigate('/console/wms/inventory-items');
    } catch (error) {
      handleError(error);
      toast.error('Failed to create inventory item');
    } finally {
      setIsLoading(false);
    }
  };

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
                            <SelectItem value="__loading__" disabled>Loading products...</SelectItem>
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

                {/* Available Quantity */}
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

                {/* Reserved Quantity */}
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
                  {isLoading ? 'Creating...' : 'Create Inventory Item'}
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
