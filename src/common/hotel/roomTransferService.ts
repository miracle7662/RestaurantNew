// services/roomTransferService.ts

import HttpClient from "../helpers/httpClient";
import { ApiResponse } from "@/types/api";

// ================================================================
// TYPES
// ================================================================

/**
 * Request payload for room transfer
 */
export interface RoomTransferRequest {
  /** Hotel ID */
  hotelid: number;
  /** Checkin ID */
  checkin_id: number;
  /** Old room number */
  old_room_no: string;
  /** Old room ID */
  old_room_id: number;
  /** New room number */
  new_room_no: string;
  /** New room ID */
  new_room_id: number;
  /** User ID who performed the transfer (optional) */
  updated_by_id?: number;
}

/**
 * Response data for room transfer
 */
export interface RoomTransferResponse {
  checkin_id: number;
  old_room: {
    room_id: number;
    room_no: string;
  };
  new_room: {
    room_id: number;
    room_no: string;
  };
  updates: {
    master_updated: number;
    details_updated: number;
    charges_updated: number;
  };
}

// ================================================================
// SERVICE
// ================================================================

const RoomTransferService = {
  /**
   * Transfer room only
   * 
   * This API handles:
   * 1. checkin_master - room_no, room_id
   * 2. checkin_detail_master - room_number, room_id (active/future records)
   * 3. checkin_guest_room_charges - room_id (active/future records)
   * 4. Room status update (old room → available, new room → occupied)
   * 
   * @param {RoomTransferRequest} data - Transfer data
   * @returns {Promise<ApiResponse<RoomTransferResponse>>} API response
   * 
   * @example
   * const response = await RoomTransferService.transferRoom({
   *   hotelid: 1,
   *   checkin_id: 123,
   *   old_room_no: '101',
   *   old_room_id: 10,
   *   new_room_no: '102',
   *   new_room_id: 11,
   *   updated_by_id: 5,
   * });
   */
  transferRoom(data: RoomTransferRequest) {
    return HttpClient.post<ApiResponse<RoomTransferResponse>>(
      '/room-transfer/transfer',
      data
    );
  },
};

export default RoomTransferService;