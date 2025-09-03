import { InventoryItemAddForm } from '@client/components/forms/InventoryItemAddForm';

export function InventoryItemAddPage() {
  return (
    <div className="space-y-6 px-2 pb-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Add Inventory Item</h1>
        <p className="text-muted-foreground ">
          Create a new inventory item to track stock levels, batch information, and manage warehouse operations.
        </p>
      </div>
      <InventoryItemAddForm />
    </div>
  );
}
