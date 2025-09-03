import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router';
import { Button } from '@client/components/ui/button';
import { Input } from '@client/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@client/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@client/components/ui/select';
import { Textarea } from '@client/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@client/components/ui/form';
import { toast } from 'sonner';
import { inventoryAdjustmentFormSchema, type InventoryAdjustmentFormData } from '@client/schemas/inventoryItemSchema';
import { inventoryItemApi } from '@client/lib/api/inventoryItemApi';
import { useErrorHandler } from '@client/hooks/useErrorHandler';

interface InventoryAdjustmentFormProps {
  inventoryItemId: string;
  currentQuantity: number;
  productName?: string;
  productSku?: string;
  binName?: string;
}

export function InventoryAdjustmentForm({
  inventoryItemId,
  currentQuantity,
  productName,
  productSku,
  binName,
}: InventoryAdjustmentFormProps) {
  const navigate = useNavigate();
  const { handleError } = useErrorHandler();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<InventoryAdjustmentFormData>({
    resolver: zodResolver(inventoryAdjustmentFormSchema),
    defaultValues: {
      adjustmentType: 'increase',
      quantity: 1,
      reason: '',
    },
  });

  const adjustmentType = form.watch('adjustmentType');
  const adjustmentQuantity = form.watch('quantity');

  // Calculate new quantity based on adjustment
  const newQuantity = adjustmentType === 'increase' 
    ? currentQuantity + (adjustmentQuantity || 0)
    : currentQuantity - (adjustmentQuantity || 0);

  const onSubmit = async (data: InventoryAdjustmentFormData) => {
    setIsLoading(true);
    try {
      await inventoryItemApi.adjustInventory(inventoryItemId, data);
      toast.success('Inventory adjustment applied successfully');
      navigate('/console/wms/inventory-items');
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Inventory Adjustment</h2>
        <p className="text-muted-foreground">Adjust inventory quantities with proper tracking</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Item Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            {productSku && (
              <div>
                <span className="font-medium">Product SKU:</span>
                <p className="text-muted-foreground">{productSku}</p>
              </div>
            )}
            {productName && (
              <div>
                <span className="font-medium">Product Name:</span>
                <p className="text-muted-foreground">{productName}</p>
              </div>
            )}
            {binName && (
              <div>
                <span className="font-medium">Bin Location:</span>
                <p className="text-muted-foreground">{binName}</p>
              </div>
            )}
          </div>
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-medium">Current Available Quantity:</span>
              <span className="text-lg font-bold">{currentQuantity}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Adjustment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="adjustmentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adjustment Type *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select adjustment type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="increase">
                            <span className="flex items-center gap-2">
                              <span className="text-green-600">↗</span>
                              Increase Quantity
                            </span>
                          </SelectItem>
                          <SelectItem value="decrease">
                            <span className="flex items-center gap-2">
                              <span className="text-red-600">↘</span>
                              Decrease Quantity
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adjustment Quantity *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          step="1"
                          placeholder="1"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        {adjustmentType === 'decrease' && newQuantity < 0 && (
                          <span className="text-destructive">
                            Warning: This will result in negative quantity ({newQuantity})
                          </span>
                        )}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason for Adjustment *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Provide a detailed reason for this inventory adjustment..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Please provide a clear explanation for this adjustment for audit purposes
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Summary Card */}
              <Card className="bg-muted/50">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Current Quantity:</span>
                      <span>{currentQuantity}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Adjustment:</span>
                      <span className={adjustmentType === 'increase' ? 'text-green-600' : 'text-red-600'}>
                        {adjustmentType === 'increase' ? '+' : '-'}{adjustmentQuantity || 0}
                      </span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold">New Quantity:</span>
                        <span className={`font-bold ${newQuantity < 0 ? 'text-destructive' : 'text-foreground'}`}>
                          {newQuantity}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-4">
                <Button 
                  type="submit" 
                  disabled={isLoading || (adjustmentType === 'decrease' && newQuantity < 0)}
                >
                  {isLoading ? 'Processing...' : 'Apply Adjustment'}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/console/wms/inventory-items')}>
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

// Wrapper component for route-based usage
export function InventoryAdjustmentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { handleError } = useErrorHandler();
  const [item, setItem] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      toast.error('Invalid inventory item ID');
      navigate('/console/wms/inventory-items');
      return;
    }

    const loadItem = async () => {
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
  }, [id, navigate, handleError]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Inventory Adjustment</h2>
          <p className="text-muted-foreground">Loading inventory item...</p>
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
    <InventoryAdjustmentForm
      inventoryItemId={item.id}
      currentQuantity={item.availableQuantity}
      productName={item.productName}
      productSku={item.productSku}
      binName={item.binName}
    />
  );
}
