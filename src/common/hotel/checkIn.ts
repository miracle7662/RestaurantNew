// src/common/hotel/checkIn.ts

import HttpClient from '../helpers/httpClient';
import { ApiResponse } from '@/types/api';

// ============================================================================
// INTERFACES
// ============================================================================

export interface CheckIn {
  // ----- Core master fields -----
  checkin_id: number;
  guest_id: number;
  reg_no?: string;
  booking: string;
  plan_name?: string;
  checkin_datetime: string;
  checkout_datetime: string;
  hotelid: number;
  checkout_id?: number;
  room_no: string;
  room_id?: string;
  is_settle?: number;
  total_amount?: number;
  total_nights?: number;
  tot_room_tariff?: number;
  tot_ex_pax_charge?: number;
  tot_child_paid_amount?: number;
  tot_driver_charge?: number;
  tot_discount_amount?: number;
  tot_cgst_amount?: number;
  tot_sgst_amount?: number;
  tot_igst_amount?: number;
  tot_ex_cgst_amount?: number;
  tot_ex_sgst_amount?: number;
  tot_ex_igst_amount?: number;
  tot_child_cgst_amount?: number;
  tot_child_sgst_amount?: number;
  tot_child_igst_amount?: number;
  tot_driver_cgst_amount?: number;
  tot_driver_sgst_amount?: number;
  tot_driver_igst_amount?: number;
  tot_service_charge_amount?: number;
  tot_cess_amount?: number;
  tot_advance?: number;
  id_type?: string;
  id_number?: string;
  department_id?: number;
  department_name?: string;
  special_instruction?: string;
  message?: string;
  status?: string;
  created_by_id?: number;
  created_date?: string;
  updated_by_id?: number;
  updated_date?: string;
  outletid?: number;

  // ----- Guest details (from COALESCE) -----
  guest_name: string;
  address: string;
  mobile: string;
  company_name: string;
  email: string;              // mapped from gm.email / cdm.emailed
  // (legacy) emailed?: string;  // can be kept if needed

  // ----- Room detail fields (from cdm) -----
  detail_id?: number;
  room_category_id?: number;
  room_category_name?: string;
  converted_category_id?: number;
  converted_category_name?: string;
  parent_detail_id?: number;
  detail_checkin_datetime?: string;
  detail_checkout_datetime?: string;
  no_of_days?: number;
  adults: number;
  pax: number;
  ex_pax: number;
  child_paid: number;
  child_unpaid: number;
  driver: number;
  room_tariff?: number;
  ex_pax_charge?: number;
  child_paid_amount?: number;
  driver_charge?: number;
  discount_percent?: number;
  discount_amount?: number;
  cgst_percent?: number;
  cgst_amount?: number;
  sgst_percent?: number;
  sgst_amount?: number;
  igst_percent?: number;
  igst_amount?: number;
  ex_cgst_percent?: number;
  ex_cgst_amount?: number;
  ex_sgst_percent?: number;
  ex_sgst_amount?: number;
  ex_igst_percent?: number;
  ex_igst_amount?: number;
  child_cgst_percent?: number;
  child_cgst_amount?: number;
  child_sgst_percent?: number;
  child_sgst_amount?: number;
  child_igst_percent?: number;
  child_igst_amount?: number;
  driver_cgst_percent?: number;
  driver_cgst_amount?: number;
  driver_sgst_percent?: number;
  driver_sgst_amount?: number;
  driver_igst_percent?: number;
  driver_igst_amount?: number;
  service_charge?: number;
  service_charge_amount?: number;
  cess_percent?: number;
  cess_amount?: number;
  tax?: number;
  is_checkout?: number;
  merged?: number;
  is_settle_detail?: number;  // renamed to avoid clash with master

  // ----- Folio summary (from cgfm) -----
  total_debit?: number;
  total_credit?: number;
  balance?: number;

  // ----- Room charges summary (from cgrc) -----
  room_total_amount?: number;
  pax_count?: number;
  pax_price?: number;
  pax_tax?: number;
  ex_pax_count?: number;
  ex_pax_price?: number;
  ex_pax_tax?: number;
  ex_pax_total?: number;
  child_count?: number;
  child_price?: number;
  child_tax?: number;
  child_total?: number;
  driver_count?: number;
  driver_price?: number;
  driver_tax?: number;
  driver_total?: number;

  // ----- Legacy fields (kept for backward compatibility) -----
  category_id?: number;
  converted_category?: string;
  pax_charges?: number;
  child_charge?: number;
}

export interface TodayCheckout {
  checkin_id: number;
  guest_name: string;
  reg_no: string;
  room_no: string;
  booking: string;
  plan_name: string;
  adults: number;
  pax: number;
  ex_pax: number;
  child_paid: number;
  child_unpaid: number;
  child_count: number;
  driver: number;
  checkin_datetime: string;
  checkout_datetime: string;
  total_nights: number;
  total_amount: number;
  folio_total: number;
  status: string;
  converted_category: string;
  room_category: string;
}

export interface CheckInPayload {
  // ----- Master fields (as per sp_add_checkin) -----
  guest_id?: number;
  booking?: string;
  plan_name?: string;
  checkin_datetime?: string;
  checkout_datetime?: string;
  room_no?: string;
  room_id?: string; // comma-separated room ids
  tot_room_tariff?: number;
  tot_ex_pax_charge?: number;
  tot_child_paid_amount?: number;
  tot_driver_charge?: number;
  tot_discount_amount?: number;
  tot_cgst_amount?: number;
  tot_sgst_amount?: number;
  tot_igst_amount?: number;
  tot_ex_cgst_amount?: number;
  tot_ex_sgst_amount?: number;
  tot_ex_igst_amount?: number;
  tot_child_cgst_amount?: number;
  tot_child_sgst_amount?: number;
  tot_child_igst_amount?: number;
  tot_driver_cgst_amount?: number;
  tot_driver_sgst_amount?: number;
  tot_driver_igst_amount?: number;
  tot_service_charge_amount?: number;
  tot_cess_amount?: number;
  tot_advance?: number;
  hotelid?: number;
  outletid?: number;
  id_type?: string;
  id_number?: string;
  department_id?: number;
  department_name?: string;
  special_instruction?: string;
  message?: string;
  total_nights?: number;
  total_amount?: number;
  status?: string;
  created_by_id?: number;

  // ----- Nested arrays (sent only in create) -----
  details?: any[];         // array of detail objects for checkin_detail_master
  room_charges?: any[];    // array of room charge objects for checkin_guest_room_charges
  folio_entries?: any[];   // array of folio entry objects for checkin_guest_folio_master

  // ----- Legacy fields (used in update and other endpoints, optional) -----
  guest_name?: string;
  address?: string;
  mobile?: string;
  company_name?: string;
  emailed?: string;
  category_id?: number;
  converted_category?: string;
  adults?: number;
  pax?: number;
  pax_charges?: number;
  ex_pax?: number;
  ex_pax_charge?: number;
  child_paid?: number;
  child_unpaid?: number;
  child_charge?: number;
  driver?: number | string;
  driver_charge?: number;
  room_ids?: number[];
  reg_no?: string;
}

export interface ExtendStayPayload {
  additionalDays: number;
  newCheckoutDatetime: string;
  additionalAmount: number;
  newTotalNights?: number;
  newTotalAmount?: number;
  roomId?: number;
  detailId?: number;
  extensionDetails?: any[];
}

export interface UpdatePartialPayload {
  total_amount?: number;
  checkout_datetime?: string;
  total_nights?: number;
  status?: string;
  [key: string]: any;
}

export interface DetailResponse {
  detail_id: number;
  checkin_id: number;
  room_id: number;
  room_number: string;
  room_tariff: number;
  no_of_days: number;
  is_checkout: number;
  checkout_datetime: string;
  checkin_datetime: string;
  [key: string]: any;
}

export interface ExtendDayPayload {
  roomId: number;
  extensionDays: number;
}

export interface ExtendDayResponse {
  checkin_id: number;
  new_checkout_datetime: string;
  new_total_amount: number;
  new_total_nights: number;
  checkin: CheckIn | null;
}


export interface DailySalesSummary {
  guest_id: number;
  guest_name: string;
  mobile: string;
  email: string;
  organisation: string;
  guest_type: string;
  gender: string;

  company_id: number;
  company_name: string;
  company_gst: string;
  company_mobile: string;
  company_email: string;
  company_credit_limit: number;
  company_credit_allowed: number;

  unique_rooms_used: number;
  room_numbers_used: string;
  room_categories_used: string;
  room_details: string;
  most_used_room: string;
  preferred_room_category: string;

  total_ldg_bills: number;
  ldg_bill_no: string;
  registration_numbers: string;
  booking_references: string;

  total_stays: number;
  total_checkouts: number;
  total_room_nights: number;
  avg_stay_duration: number;

  total_room_revenue: number;
  total_extra_charges: number;
  total_child_charges: number;
  total_driver_charges: number;
  total_service_charge: number;
  total_cess: number;

  total_discounts_received: number;
  total_cgst: number;
  total_sgst: number;
  total_igst: number;

  total_spent: number;
  total_advance_paid: number;

  first_visit: string;
  last_visit: string;
  customer_lifecycle_days: number;

  avg_amount_per_stay: number;
  loyalty_level: string;

  total_payment_received: number;
  total_tips_given: number;
  total_refunds_received: number;
}

export interface PaymentModeSummary {
  payment_mode: string;
  PaymentTypeID: number;

  total_transactions: number;
  unique_checkouts: number;
  unique_guests: number;
  unique_companies: number;

  total_amount: number;
  avg_transaction_amount: number;
  min_transaction: number;
  max_transaction: number;

  total_tips: number;
  total_refunds: number;
  net_amount: number;

  percentage_contribution: number;
  daily_average: number;

  guest_names: string;
  company_names: string;

  payment_volume_category: string;
}


export interface DailySalesReport {
  Date: string;
  Day: string;
  TotalBills: number;
  BillRange: string;
  RoomAmount: number;
  FoodAmount: number;
  ServiceCharge: number;
  CESS: number;
  TaxAmount: number;
  CGST: number;
  SGST: number;
  IGST: number;
  GrossAmount: number;
  Discount: number;
  NetAmount: number;
  Advance: number;
  SettlementAmount: number;
  TipAmount: number;
  DueAmount: number;
  PaymentModes: string;
}



export interface MonthlySalesReport {
  Year: number;
  Month: number;
  "Month Name": string;
  "Total Bills": number;
  "Bill Range": string;
  "Room Amount": number;
  "Food Amount": number;
  "Service Charge": number;
  CESS: number;
  "Tax Amount": number;
  CGST: number;
  SGST: number;
  IGST: number;
  "Gross Amount": number;
  Discount: number;
  "Net Amount": number;
  Advance: number;
  "Settlement Amount": number;
  "Tip Amount": number;
  "Due Amount": number;
  "Payment Modes": string;
}

export interface DailySalesSummaryReportResponse {
  dailySummary: DailySalesReport[];
  monthlySummary: MonthlySalesReport[];
}

export interface ActiveRoomCreditCheckin {
  checkin_id: number;
  reg_no: string;
  room_id: number;
  room_no: string;
  guest_name: string;
}

export interface BillAssignment {
  folio_id: number;
  bill_no: number;
}

export interface UpdateBillNoPayload {
  billAssignments: BillAssignment[];
}

// ============================================================================
// SERVICE
// ============================================================================

const CheckInService = {
  /**
   * Get a list of checkins with optional filtering.
   * @param params.hotelid - filter by hotel
   * @param params.status - filter by status
   * @param params.q - search query
   */
  list(params?: { hotelid?: number; status?: string; q?: string }) {
    return HttpClient.get<ApiResponse<CheckIn[]>>("/checkins", { params });
  },

  /**
   * Get a single checkin by ID.
   */
  get: (id: number): Promise<ApiResponse<CheckIn>> =>
    HttpClient.get<ApiResponse<CheckIn>>(`/checkins/${id}`),

  /**
   * Get only occupied rooms (filtered on backend).
   * @param params.hotelid - required hotel ID
   */
  getOccupiedRooms: (params?: { hotelid?: number }): Promise<ApiResponse<CheckIn[]>> =>
    HttpClient.get<ApiResponse<CheckIn[]>>("/checkins", {
      params: { ...params, occupied_only: true },
    }),

  /**
   * Get the next registration number for a hotel.
   */
  getNextRegNumber: (params?: { hotelid?: number }): Promise<ApiResponse<{ reg_no: string }>> =>
    HttpClient.get<ApiResponse<{ reg_no: string }>>('/checkins/next-reg-number', { params }),

  /**
   * Get all room details for a specific checkin.
   */
  getDetailsByCheckinId: (checkinId: number): Promise<ApiResponse<DetailResponse[]>> =>
    HttpClient.get<ApiResponse<DetailResponse[]>>(`/checkins/details/${checkinId}`),

  /**
   * Get today's checkout list.
   */
  getTodayCheckouts: (params?: { hotelid?: number }): Promise<ApiResponse<TodayCheckout[]>> =>
    HttpClient.get<ApiResponse<TodayCheckout[]>>('/checkins/today-checkouts', { params }),

  /**
   * Get at-a-glance statistics.
   */
  getAtGlance: (params?: { hotelid?: number }): Promise<ApiResponse<any[]>> =>
    HttpClient.get<ApiResponse<any[]>>('/checkins/at-glance', { params }),

  /**
 * Daily Sales Summary
 */
getDailySalesSummary: (params: {
  hotelid: number;
  start_date: string;
  end_date: string;
  limit?: number;
}): Promise<ApiResponse<DailySalesSummary[]>> =>
  HttpClient.get<ApiResponse<DailySalesSummary[]>>(
    "/checkins/daily-sales-summary",
    { params }
  ),


  /**
 * Payment Mode Summary
 */
getPaymentModeSummary: (params: {
  hotelid: number;
  start_date: string;
  end_date: string;
}): Promise<ApiResponse<PaymentModeSummary[]>> =>
  HttpClient.get<ApiResponse<PaymentModeSummary[]>>(
    "/checkins/payment-mode-summary",
    { params }
  ),

  /**
 * Daily Sales Summary Report
 */
getDailySalesSummaryReport: (params: {
  hotelid: number;
  start_date: string;
  end_date: string;
}): Promise<ApiResponse<DailySalesSummaryReportResponse>> =>
  HttpClient.get<ApiResponse<DailySalesSummaryReportResponse>>(
    "/checkins/daily-sales-summary-report",
    { params }
  ),

  /**
   * Get active check-ins available for Room Credit settlement (restaurant billing).
   * Returns room count and guest names per checkin.
   */
  getActiveRoomCreditCheckins: (params: { hotelid: number; room_no?: string }): Promise<ApiResponse<ActiveRoomCreditCheckin[]>> =>
  HttpClient.get<ApiResponse<ActiveRoomCreditCheckin[]>>('/checkins/active-room-credit', { params }),
  /**
   * Create a new checkin.
   */
  create: (payload: CheckInPayload): Promise<ApiResponse<CheckIn>> =>
    HttpClient.post<ApiResponse<CheckIn>>('/checkins', payload),

  /**
   * Full update of a checkin.
   */
  update: (id: number, payload: CheckInPayload): Promise<ApiResponse<CheckIn>> =>
    HttpClient.put<ApiResponse<CheckIn>>(`/checkins/${id}`, payload),

  /**
   * Partial update (checkout_datetime, total_amount, total_nights, etc.).
   */
  updatePartial: (id: number, payload: UpdatePartialPayload): Promise<ApiResponse<CheckIn>> =>
    HttpClient.patch<ApiResponse<CheckIn>>(`/checkins/${id}/partial`, payload),

  /**
   * Extend stay – updates master checkout_datetime.
   */
  extendStay: (id: number, payload: ExtendStayPayload): Promise<ApiResponse<CheckIn>> =>
    HttpClient.post<ApiResponse<CheckIn>>(`/checkins/${id}/extend`, payload),

  /**
   * Extend stay by days for a specific room (newer endpoint).
   */
  extendDay: (checkinId: number, payload: ExtendDayPayload): Promise<ApiResponse<ExtendDayResponse>> =>
    HttpClient.post<ApiResponse<ExtendDayResponse>>(`/checkins/${checkinId}/extend-day`, payload),

  /**
   * Delete/remove a checkin.
   */
  remove: (id: number): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/checkins/${id}`),


  /**
 * Update bill numbers for guest folio entries.
 */
// Use:
// Service (checkIn.ts)
updateBillNo: (payload: UpdateBillNoPayload): Promise<ApiResponse<any>> =>
  HttpClient.put("/checkins/update-bill-no", payload),

};


export default CheckInService;

