import { InventoryItemEditForm } from '@client/components/forms/InventoryItemEditForm';

export function InventoryItemEditPage() {
  return (
    <div className="space-y-6 px-2 pb-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Edit Inventory Item</h1>
        <p className="text-muted-foreground mt-2">
          Update inventory item details including quantities, batch information, pricing, and location assignments.
        </p>
      </div>
      <InventoryItemEditForm />
    </div>
  );
}
