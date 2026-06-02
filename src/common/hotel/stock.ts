// common/api/stock.ts - Updated with user_id support
import HttpClient from '../helpers/httpClient';
import { ApiResponse } from '@/types/api';

export interface StockItem {
  item_id: number;
  item_name: string;
  item_code: string;
  category: 'complimentary' | 'returnable' | 'chargeable';
  sub_category: string;
  unit: string;
  current_stock: number;
  minimum_stock: number;
  price: number;
  gst_percent: number;
  quantity_per_guest?: number;
  is_auto_assign?: number;
  is_returnable?: number;
  status: number;
  hotelid: number;
  created_date: string;
  created_by_id?: number;
  updated_by_id?: number;
}

export interface PurchaseItem {
  item_id: number;
  quantity: number;
  price: number;
  gst_percent: number;
  gst_amount?: number;
}

export interface PurchaseEntry {
  vendor_name: string;
  invoice_number: string;
  purchase_date?: string;
  items: PurchaseItem[];
  hotelid?: number;
  user_id?: number;
}

export interface StockTransaction {
  transaction_id: number;
  item_id: number;
  item_name: string;
  item_code: string;
  category: string;
  transaction_type: 'IN' | 'OUT' | 'RETURNED' | 'DAMAGED';
  quantity: number;
  reference_type: string;
  reference_id: number;
  reason: string;
  transaction_date: string;
  created_by_name: string;
  checkin_id?: number;
  room_id?: number;
}

export interface ReturnItem {
  item_id: number;
  quantity_returned: number;
  quantity_damaged: number;
  damage_charge: number;
}

const StockService = {
  // Stock Items
  getItems: (params?: { hotelid?: number }): Promise<ApiResponse<StockItem[]>> =>
    HttpClient.get<ApiResponse<StockItem[]>>('/stock/items', { params }),

  getItem: (id: number): Promise<ApiResponse<StockItem>> =>
    HttpClient.get<ApiResponse<StockItem>>(`/stock/items/${id}`),

  createItem: (payload: Partial<StockItem>): Promise<ApiResponse<{ item_id: number }>> =>
    HttpClient.post<ApiResponse<{ item_id: number }>>('/stock/items', payload),

  updateItem: (id: number, payload: Partial<StockItem>): Promise<ApiResponse<null>> =>
    HttpClient.put<ApiResponse<null>>(`/stock/items/${id}`, payload),

  deleteItem: (id: number): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/stock/items/${id}`),

  // Purchase
  createPurchase: (payload: PurchaseEntry): Promise<ApiResponse<{ purchase_id: number }>> =>
    HttpClient.post<ApiResponse<{ purchase_id: number }>>('/stock/purchases', payload),

  getPurchases: (params?: { hotelid?: number }): Promise<ApiResponse<any[]>> =>
    HttpClient.get<ApiResponse<any[]>>('/stock/purchases', { params }),

  // Transactions
  getTransactions: (params?: { hotelid?: number; item_id?: number; start_date?: string; end_date?: string; transaction_type?: string }): Promise<ApiResponse<StockTransaction[]>> =>
    HttpClient.get<ApiResponse<StockTransaction[]>>('/stock/transactions', { params }),

  getLowStockAlerts: (params?: { hotelid?: number }): Promise<ApiResponse<StockItem[]>> =>
    HttpClient.get<ApiResponse<StockItem[]>>('/stock/low-stock', { params }),

  // Room Items - For return modal
  getRoomIssuedItems: (params: { checkin_id: number; room_id: number; hotelid?: number }): Promise<ApiResponse<any[]>> =>
    HttpClient.get<ApiResponse<any[]>>('/stock/room-items', { params }),

  // Auto-assign amenities on check-in
  autoAssign: (payload: { checkin_id: number; room_id: number; guest_count: number; hotelid?: number; user_id?: number }): Promise<ApiResponse<{ assignedItems: any[] }>> =>
    HttpClient.post<ApiResponse<{ assignedItems: any[] }>>('/stock/auto-assign', payload),

  // Process return of items
  processReturn: (payload: { 
    checkin_id: number; 
    room_id: number; 
    items: Array<{ item_id: number; quantity_returned: number; quantity_damaged: number; damage_charge: number }>;
    hotelid?: number;
    user_id?: number;
  }): Promise<ApiResponse<{ total_damage_charge: number }>> =>
    HttpClient.post<ApiResponse<{ total_damage_charge: number }>>('/stock/process-return', payload),

  // Reports
  getDailyConsumptionReport: (params: { date?: string; hotelid?: number }): Promise<ApiResponse<any[]>> =>
    HttpClient.get<ApiResponse<any[]>>('/stock/reports/daily-consumption', { params }),

  getStockReport: (params?: { hotelid?: number }): Promise<ApiResponse<{ data: StockItem[]; total_value: number }>> =>
    HttpClient.get<ApiResponse<{ data: StockItem[]; total_value: number }>>('/stock/reports/stock', { params }),

  getDamageReport: (params?: { start_date?: string; end_date?: string; hotelid?: number }): Promise<ApiResponse<{ data: any[]; total_damage_value: number }>> =>
    HttpClient.get<ApiResponse<{ data: any[]; total_damage_value: number }>>('/stock/reports/damage', { params }),
};

export default StockService;