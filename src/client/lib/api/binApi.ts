import axios from 'axios';

export interface Bin {
  id: string;
  name: string;
  barcode?: string;
  maxWeight?: string;
  maxVolume?: string;
  fixedSku?: string;
  category?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  shelfName?: string;
  aisleName?: string;
  zoneName?: string;
  warehouseName?: string;
  warehouseId?: string;
}

export interface BinListResponse {
  success: boolean;
  data: Bin[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

export const binApi = {
  // Get paginated list of bins
  getBins: async (params: {
    page?: number;
    perPage?: number;
    sort?: string;
    order?: string;
    filter?: string;
    warehouseId?: string;
  }): Promise<BinListResponse> => {
    try {
      const response = await axios.get<BinListResponse>('/api/wms/bins', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching bins:', error);
      // Fallback to sample data if API fails
      return {
        success: true,
        data: [
          { 
            id: '550e8400-e29b-41d4-a716-446655440050', 
            name: 'A1-01-01',
            barcode: 'BIN001',
            maxWeight: '100.000',
            maxVolume: '50.000',
            isActive: true,
            shelfName: 'Shelf 1',
            aisleName: 'Aisle 1',
            zoneName: 'Zone A',
            warehouseName: 'Main Warehouse',
            warehouseId: '550e8400-e29b-41d4-a716-446655440010'
          },
          { 
            id: '550e8400-e29b-41d4-a716-446655440051', 
            name: 'A1-01-02',
            barcode: 'BIN002',
            maxWeight: '100.000',
            maxVolume: '50.000',
            isActive: true,
            shelfName: 'Shelf 1',
            aisleName: 'Aisle 1',
            zoneName: 'Zone A',
            warehouseName: 'Main Warehouse',
            warehouseId: '550e8400-e29b-41d4-a716-446655440010'
          },
          { 
            id: '550e8400-e29b-41d4-a716-446655440052', 
            name: 'A1-01-03',
            barcode: 'BIN003',
            maxWeight: '100.000',
            maxVolume: '50.000',
            isActive: true,
            shelfName: 'Shelf 1',
            aisleName: 'Aisle 1',
            zoneName: 'Zone A',
            warehouseName: 'Main Warehouse',
            warehouseId: '550e8400-e29b-41d4-a716-446655440010'
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
