import axios from 'axios';
import { 
  InventoryItem, 
  InventoryItemFormData, 
  InventoryItemEditData,
  InventoryItemQueryParams, 
  InventoryItemListResponse, 
  InventoryItemResponse,
  InventoryAdjustmentFormData 
} from '@client/schemas/inventoryItemSchema';

const BASE_URL = '/api/wms/inventory-items';

export const inventoryItemApi = {
  // Get paginated list of inventory items
  getInventoryItems: async (params: Partial<InventoryItemQueryParams>): Promise<InventoryItemListResponse> => {
    const response = await axios.get<InventoryItemListResponse>(BASE_URL, { params });
    return response.data;
  },

  // Get single inventory item by ID
  getInventoryItem: async (id: string): Promise<InventoryItemResponse> => {
    const response = await axios.get<InventoryItemResponse>(`${BASE_URL}/${id}`);
    return response.data;
  },

  // Create new inventory item
  createInventoryItem: async (data: InventoryItemFormData): Promise<InventoryItemResponse> => {
    const response = await axios.post<InventoryItemResponse>(BASE_URL, data);
    return response.data;
  },

  // Update inventory item
  updateInventoryItem: async (id: string, data: InventoryItemEditData): Promise<InventoryItemResponse> => {
    const response = await axios.put<InventoryItemResponse>(`${BASE_URL}/${id}`, { ...data, id });
    return response.data;
  },

  // Delete inventory item
  deleteInventoryItem: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await axios.delete(`${BASE_URL}/${id}`);
    return response.data;
  },

  // Adjust inventory quantities
  adjustInventory: async (id: string, data: InventoryAdjustmentFormData): Promise<InventoryItemResponse> => {
    const response = await axios.post<InventoryItemResponse>(`${BASE_URL}/${id}/adjust`, data);
    return response.data;
  },
};
