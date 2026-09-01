// checkout.ts - Updated with selected_rooms for partial/multiple checkout
import HttpClient from '../helpers/httpClient';
import { ApiResponse } from '@/types/api';

export interface CheckoutMaster {
  checkout_id: number;
  checkin_id: number;
  guest_id: number;
  reg_no: string;
  ldg_bill_no: string;             
  guest_name: string;
  address: string;
  mobile: string;
  company_name: string;
  emailed: string;
  booking: string;
  plan_name: string;
  checkin_datetime: string;
  checkout_datetime: string;
  room_no: string;
  category_id: number;
  converted_category: string;
  adults: number;
  pax: number;
  pax_charges: number;
  ex_pax: number;
  ex_pax_charge: number;
  child_paid: number;
  child_unpaid: number;
  child_charge: number;
  driver: string;
  driver_charge: number;
  hotelid: number;
  id_type: string;
  id_number: string;
  department_id: number;
  department_name: string;
  special_instruction: string;
  message: string;
  payment_id: string;
  payment_mode: string;
  payment_method?: string  
  is_settle: number;
  is_print: number;
  discount_amount: number;
  post_changes_amt: number;
  allowances_amt: number;
  advance_amt: number;
  cgst_amt: number;
  sgst_amt: number;
  igst_amt: number;
  cess_amt: number;
  service_charge_amt: number;
  net_payable: number;
  round_off_amount: number;
  room_id: number;

  // print FIELDS
  email : string;
  id_proof : string;

  
  // AUDIT FIELDS
  created_by_id: number;
  created_date: string;
  updated_by_id: number;
  updated_date: string;
  status: string;
  total_nights: number;
  total_amount: number;
  checkout_date: string;
  checkout_by_id: number;
  checkout_reason: string;
  is_partial_checkout?: number;
  checked_out_rooms?: string;

   detail_checkin_datetime: string;
  detail_checkout_datetime: string;
}

export interface BillPreviewResponse {
  // Define the structure based on your API response
  [key: string]: any;
}

export interface PerformCheckoutPayload {
  checkin_id: number;
  checkout_reason?: string;
   graceApplied?: boolean;

  
  /** Payment method name e.g. "Cash", "Card", "UPI" */
  payment_method?: string;
  
  /**
   * The payment_modes.id (PK) of the selected payment mode.
   * Stored directly in Checkout_Master.payment_id as a numeric FK.
   * Accepts number (preferred) or string for legacy compatibility.
   */
  payment_id?: number | string;

  /**
   * Payment mode label stored in the payment_mode column.
   * If omitted, falls back to payment_method value.
   */
  payment_mode?: string;

  total_amount?: number;
   room_id?: string;
  round_off_amount?: number;
  net_payable?: number;
  selected_rooms?: string[];

  /** Override invoice number. If omitted, backend auto-generates. */
  invoiceNoFromBody?: string;

  /**
   * Bill number for bill-wise checkout.
   * 1 = Lodging (default), 2 = Restaurant, 3 = Bar, 4 = Pantry
   * If omitted/NULL/0, falls back to legacy mode (all folio rows copied).
   * For non-lodging bills (>1), only the folio rows for that bill are copied.
   */
  bill_no?: number;

  /** 1 = settled, 0 = unsettled. Default: 1 */
  is_settle?: number;

  /** 1 = printed, 0 = not printed. Default: 0 */
  is_print?: number;

  // Optional pre-computed amounts (backend recalculates from DB if not provided)
  discount_amount?: number;
  post_changes_amt?: number;
  allowances_amt?: number;
  advance_amt?: number;
  cgst_amt?: number;
  sgst_amt?: number;
  igst_amt?: number;
  cess_amt?: number;
  service_charge_amt?: number;
}


export interface CheckoutResponse {
  checkout_id: number;
  checkin_id: number;
  payment_id?: number;
  is_partial?: boolean;
  checked_out_rooms?: string[];
  remaining_rooms?: string[];
  ldg_bill_no?: string;
   checked_out_room_ids: number[];        // new
    checked_out_room_ids_comma: string;    // new
}


export interface NextInvoiceNoResponse {
  ldg_bill_no: string;
}


export interface UpdateRoomsPayload {
  roomIds: number[];
  userId?: number;
}

export interface UpdateRoomsResponse {
  success: boolean;
  message: string;
  affectedRows: number;
}

export interface CheckoutBillData {
  checkoutMaster: any;      // या आप specific fields डिफ़ाइन कर सकते हैं
  roomDetails: any[];
  summary: any;
  // अगर मौजूदा modal को और fields चाहिए, तो उन्हें भी add करें
}


// ✅ NEW: Room Service / Restaurant active order check
export interface RoomServiceCheckDetail {
  table_name: string;
  status: number;
  OrderNo: string;
}

export interface RoomServiceCheckResponse {
  blockedRooms: string[];   // e.g. ['101', '102']
  details: RoomServiceCheckDetail[];
}


// =====================================================
// LIVE ROOM AVAILABILITY
// =====================================================

export interface LiveRoomCategory {
  hotelid: number;
  room_category_id: number;
  category_name: string;
  category_total_rooms: number;

  occupied_rooms: number;
  reserved_rooms: number;

  today_reservations: number;
  today_checkins: number;
  today_checkouts: number;

  available_rooms_raw: number;
  available_rooms: number;

  blocked_rooms: number;

  next_available_from: string | null;

   today_revenue?: number;

  rooms?: LiveRoom[];
}

export interface LiveRoom {
  room_id: number;
  room_no: string;
  room_name?: string;
  room_status_id?: number;
  live_status?: string;

  guest_id?: number | null;
  guest_name?: string | null;
  mobile?: string | null;

  checkin_id?: number | null;
  detail_id?: number | null;

  checkin_datetime?: string | null;
  checkout_datetime?: string | null;
}

export interface LiveDataResponse {
  success: boolean;
  message: string;
  data: LiveRoomCategory[];
}



const CheckoutService = {
  list: (params?: { hotelid?: number }): Promise<ApiResponse<CheckoutMaster[]>> =>
    HttpClient.get<ApiResponse<CheckoutMaster[]>>('/checkouts', { params }),

  get: (id: number): Promise<ApiResponse<CheckoutMaster>> =>
    HttpClient.get<ApiResponse<CheckoutMaster>>(`/checkouts/${id}`),

  getByCheckinId: (checkinId: number): Promise<ApiResponse<CheckoutMaster>> =>
    HttpClient.get<ApiResponse<CheckoutMaster>>(`/checkouts/by-checkin/${checkinId}`),

  performCheckout: (payload: PerformCheckoutPayload): Promise<ApiResponse<CheckoutResponse>> =>
    HttpClient.post<ApiResponse<CheckoutResponse>>('/checkouts/perform', payload),

  processCheckoutWithGrace: (
  payload: PerformCheckoutPayload
): Promise<ApiResponse<CheckoutResponse>> =>
  HttpClient.post<ApiResponse<CheckoutResponse>>(
    "/checkouts/process-checkout-with-grace",
    payload
  ),

  remove: (id: number): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/checkouts/${id}`),

    getNextInvoiceNo: (): Promise<ApiResponse<NextInvoiceNoResponse>> =>
    HttpClient.get<ApiResponse<NextInvoiceNoResponse>>('/checkouts/next-ldg_bill_no'),

    updateRoomsToAvailable: (payload: UpdateRoomsPayload) => 
    HttpClient.put<ApiResponse<UpdateRoomsResponse>>( "/checkouts/rooms/available", payload ),

    // In checkout.ts - Replace the getBillPreview method with this:

getBillPreview: async (checkoutId?: number, ldgBillNo?: string): Promise<{
  success: boolean;
  message: string;
  data: BillPreviewResponse[];
  summary: BillPreviewResponse['summary'];
}> => {
  const params: any = {};
  if (checkoutId) params.checkout_id = checkoutId;
  if (ldgBillNo) params.ldg_bill_no = ldgBillNo;
  
  // Use HttpClient directly with a custom return type
  return HttpClient.get<{
    success: boolean;
    message: string;
    data: BillPreviewResponse[];
    summary: BillPreviewResponse['summary'];
  }>('/checkouts/bill-preview', { params });
},

  getCheckoutBill: (checkoutId: number): Promise<ApiResponse<CheckoutBillData>> =>
    HttpClient.get<ApiResponse<CheckoutBillData>>(`/checkout/bill/${checkoutId}`),


    // =====================================================
  // LIVE ROOM DATA
  // =====================================================

  getLiveData: (
    hotelId: number
  ): Promise<LiveDataResponse> =>
    HttpClient.get<LiveDataResponse>(
      `/checkouts/live-data/${hotelId}`
    ),



   checkActiveRoomServiceOrders: (
    hotelId: number,
    roomNumbers: string[]
  ): Promise<ApiResponse<RoomServiceCheckResponse>> =>
    HttpClient.get<ApiResponse<RoomServiceCheckResponse>>(
      '/checkouts/active-orders-check',
      {
        params: {
          hotelId,
          roomNumbers: roomNumbers.join(','),
        },
      }
    ),
};


// In checkout.ts, inside the CheckoutService object:



export default CheckoutService;