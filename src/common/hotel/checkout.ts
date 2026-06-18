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
}

export interface BillPreviewResponse {
  // Define the structure based on your API response
  [key: string]: any;
}

export interface PerformCheckoutPayload {
  checkin_id: number;
  checkout_reason?: string;
  
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



const CheckoutService = {
  list: (params?: { hotelid?: number }): Promise<ApiResponse<CheckoutMaster[]>> =>
    HttpClient.get<ApiResponse<CheckoutMaster[]>>('/checkouts', { params }),

  get: (id: number): Promise<ApiResponse<CheckoutMaster>> =>
    HttpClient.get<ApiResponse<CheckoutMaster>>(`/checkouts/${id}`),

  getByCheckinId: (checkinId: number): Promise<ApiResponse<CheckoutMaster>> =>
    HttpClient.get<ApiResponse<CheckoutMaster>>(`/checkouts/by-checkin/${checkinId}`),

  performCheckout: (payload: PerformCheckoutPayload): Promise<ApiResponse<CheckoutResponse>> =>
    HttpClient.post<ApiResponse<CheckoutResponse>>('/checkouts/perform', payload),

  remove: (id: number): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/checkouts/${id}`),

    getNextInvoiceNo: (): Promise<ApiResponse<NextInvoiceNoResponse>> =>
    HttpClient.get<ApiResponse<NextInvoiceNoResponse>>('/checkouts/next-ldg_bill_no'),

    updateRoomsToAvailable: (payload: UpdateRoomsPayload) => 
    HttpClient.put<ApiResponse<UpdateRoomsResponse>>( "/checkouts/rooms/available", payload ),

     getBillPreview: (checkoutId?: number, ldgBillNo?: string): Promise<ApiResponse<BillPreviewResponse[]>> => {
    const params: any = {};
    if (checkoutId) params.checkout_id = checkoutId;
    if (ldgBillNo) params.ldg_bill_no = ldgBillNo;
    
    return HttpClient.get<ApiResponse<BillPreviewResponse[]>>('/checkouts/bill-preview', { params });
  },

};

export default CheckoutService;