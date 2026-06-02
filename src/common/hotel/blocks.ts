// services/blocks.ts
/**
 * Block Service - Clean API service for block management operations
 * Uses HttpClient with interceptors for authentication
 * Returns ApiResponse<T> for consistent response handling
 */

import HttpClient from '../helpers/httpClient'
import { ApiResponse } from '@/types/api'

/* ═══════════════════════════════════════════════════════════════════════════════
 * Type Definitions
 * ═══════════════════════════════════════════════════════════════════════════════ */

/** Block information */
export interface Block {
    block_id: number
    block_name: string
    display_name: string
    hotelid: number  // Changed from mst_hotelid to hotelid
    status: number
    created_by_id: number
    created_date: string
    updated_by_id: number
    updated_date: string
}

/** Block payload for create/update */
export interface BlockPayload {
    block_id?: number
    block_name: string
    display_name: string
    hotelid?: number          // Changed from mst_hotelid to hotelid
    status: number
    created_by_id?: number
    updated_by_id?: number
    created_date?: string
    updated_date?: string
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * Block Service
 * ═══════════════════════════════════════════════════════════════════════════════ */

const BlockService = {

    /* ═══════════════════════════════════════════════════════════════════════════
     * CRUD Operations
     * ═══════════════════════════════════════════════════════════════════════════ */

    /**
     * Get all blocks – expects hotelid as a query parameter
     */
    list: (params?: { hotelid?: number; q?: string }): Promise<ApiResponse<Block[]>> =>
        HttpClient.get<ApiResponse<Block[]>>('/blocks', { params }),

    /**
     * Create a new block
     */
    create: (payload: BlockPayload): Promise<ApiResponse<Block>> =>
        HttpClient.post<ApiResponse<Block>>('/blocks', payload),

    /**
     * Update an existing block
     */
    update: (id: number, payload: BlockPayload): Promise<ApiResponse<Block>> =>
        HttpClient.put<ApiResponse<Block>>(`/blocks/${id}`, payload),

    /**
     * Delete a block
     */
    remove: (id: number): Promise<ApiResponse<null>> =>
        HttpClient.delete<ApiResponse<null>>(`/blocks/${id}`)
}

export default BlockService