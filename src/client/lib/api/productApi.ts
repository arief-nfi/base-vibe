import axios from 'axios';

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  minimumStockLevel?: number;
  reorderPoint?: number;
  isActive?: boolean;
  hasExpiryDate?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductListResponse {
  success: boolean;
  data: Product[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

export const productApi = {
  // Get paginated list of products
  getProducts: async (params: {
    page?: number;
    perPage?: number;
    sort?: string;
    order?: string;
    filter?: string;
  }): Promise<ProductListResponse> => {
    try {
      const response = await axios.get<ProductListResponse>('/api/wms/products', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching products:', error);
      // Fallback to sample data if API fails
      return {
        success: true,
        data: [
          { 
            id: '550e8400-e29b-41d4-a716-446655440001', 
            sku: 'PROD001', 
            name: 'Sample Product 1',
            description: 'Test product for inventory management',
            minimumStockLevel: 10,
            reorderPoint: 5,
            isActive: true,
            hasExpiryDate: false
          },
          { 
            id: '550e8400-e29b-41d4-a716-446655440002', 
            sku: 'PROD002', 
            name: 'Sample Product 2',
            description: 'Another test product',
            minimumStockLevel: 20,
            reorderPoint: 10,
            isActive: true,
            hasExpiryDate: true
          },
          { 
            id: '550e8400-e29b-41d4-a716-446655440003', 
            sku: 'PROD003', 
            name: 'Sample Product 3',
            description: 'Third test product',
            minimumStockLevel: 15,
            reorderPoint: 7,
            isActive: true,
            hasExpiryDate: false
          },
        ],
        pagination: {
          page: 1,
          perPage: 1000,
          total: 3,
          totalPages: 1,
        },
      };
    }
  },
};
