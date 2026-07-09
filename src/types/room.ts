import { CheckIn } from '@/common/hotel/checkIn';
import { Detail } from '@/common/hotel/detail';


export interface OccupiedRoomItem {
  room_no: string;
  guest_name: string;
  detail_checkin_datetime: string;
  detail_checkout_datetime: string;
  
  guest_type: string;
  original_charge: number;
  folio_total: number;
  total_charge: number;
  adults: number;
  pax:number;
  guest_id: number;
  
  ex_pax: number;
  child_paid:number;
  child_unpaid:number;
  child_count: number;
  driver: number;
  driver_count: number;
 
  payment_method: string;
  checkin?: CheckIn;
  detail?: Detail;
  checkin_id: number;
  detail_id?: number;
  room_id?: number;
  room_status_id?: number;
  room_category_id?: number;
  isCheckoutNear: boolean;
  minutesLeft: number;
  isExpired: boolean;
  ex_pax_charge?: number;
  child_paid_amount?: number;
  driver_charge?: number;
  cgst_percent?: number;
  sgst_percent?: number;
  igst_percent?: number;
  cess_percent?: number;
  service_charge?: number;
  tax?: number;
  discount_percent?: number;
  previous_folio_total?: number;
  total_days?: number;
  per_day_base_price?: number;
  guest_room_charges_total?: number;
  checkin_total_amount?: number;
  guest_room_charges_per_day?:number;
  room_tariff_from_category?: number;
  room_category_name?: string;
  converted_category_name?: string;
  original_pax?: number;
  is_multi_room_checkin?: boolean;
  agent_name?: string;
  booking_type?: string;
  is_agent_checkin?: boolean;
  post_charges_by_date?: Record<string, number>;
  today_combined_total?: number;
  current_active_day_key?: string;
  individual_room_charges_total?: number;
  latest_charge_checkout_datetime?: string;
  pending_advance?: number;
  pending_advance_for_room?: number;
  net_room_amount?: number;
  total_all_rooms_net?: number;
  total_allowances?: number;
  status_color?: string;
  company_name?: string;
  
}