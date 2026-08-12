// services/product.ts
/**
 * Product Service - Clean API service for product management operations
 * Uses HttpClient with interceptors for authentication
 * Returns ApiResponse<T> for consistent response handling
 */

import HttpClient from '../helpers/httpClient'
import { ApiResponse } from '@/types/api'


/* ═══════════════════════════════════════════════════════════════════════════════
 * Type Definitions
 * ═══════════════════════════════════════════════════════════════════════════════ */


/** Product information */
export interface Product {
    itemid: number
    hotelid: number
    outletid: number

    item_code: string
    barcode: string | null

    item_name: string
    short_name: string | null

    categoryid: number
    category_name?: string

    brandid: number | null

    item_type:
        | 'RAW_MATERIAL'
        | 'FINISHED_GOOD'
        | 'CONSUMABLE'
        | 'AMENITY'
        | 'CLEANING_ITEM'
        | 'LINEN'
        | 'ASSET'
        | 'OTHER'

    unitid: number
    unit_name?: string

    purchase_rate: number
    average_rate: number
    mrp: number

    is_stock_item: number
    is_purchase_item: number
    is_sale_item: number
    is_housekeeping_item: number
    is_restaurant_item: number
    is_bar_item: number
    is_recipe_item: number
    allow_negative_stock: number

    gst_percent: number
    hsn_sac_code: string | null

    reorder_level: number
    minimum_stock: number
    maximum_stock: number

    status: number

    createdby: number | null
    createdon: string

    updatedby: number | null
    updatedon: string | null
}


/** Product payload for create/update */
export interface ProductPayload {
    itemid?: number

    hotelid: number
    outletid: number

    item_code: string
    barcode?: string | null

    item_name: string
    short_name?: string | null

    categoryid: number
    brandid?: number | null

    item_type:
        | 'RAW_MATERIAL'
        | 'FINISHED_GOOD'
        | 'CONSUMABLE'
        | 'AMENITY'
        | 'CLEANING_ITEM'
        | 'LINEN'
        | 'ASSET'
        | 'OTHER'

    unitid: number

    purchase_rate?: number
    average_rate?: number
    mrp?: number

    is_stock_item?: number
    is_purchase_item?: number
    is_sale_item?: number
    is_housekeeping_item?: number
    is_restaurant_item?: number
    is_bar_item?: number
    is_recipe_item?: number
    allow_negative_stock?: number

    gst_percent?: number
    hsn_sac_code?: string | null

    reorder_level?: number
    minimum_stock?: number
    maximum_stock?: number

    status?: number

    createdby?: number
    updatedby?: number
}


/* ═══════════════════════════════════════════════════════════════════════════════
 * Product Service
 * ═══════════════════════════════════════════════════════════════════════════════ */

const ProductService = {


    /* ═══════════════════════════════════════════════════════════════════════════
     * CRUD Operations
     * ═══════════════════════════════════════════════════════════════════════════ */


    /**
     * Get all products
     *
     * hotelid and outletid are passed as query parameters
     */
    list: (
        params?: {
            hotelid?: number
            outletid?: number
            status?: number
        }
    ): Promise<ApiResponse<Product[]>> =>
        HttpClient.get<ApiResponse<Product[]>>(
            '/product',
            { params }
        ),


    /**
     * Get single product
     */
    getById: (
        id: number,
        params?: {
            hotelid?: number
            outletid?: number
        }
    ): Promise<ApiResponse<Product>> =>
        HttpClient.get<ApiResponse<Product>>(
            `/product/${id}`,
            { params }
        ),


    /**
     * Create a new product
     */
    create: (
        payload: ProductPayload
    ): Promise<ApiResponse<Product>> =>
        HttpClient.post<ApiResponse<Product>>(
            '/product',
            payload
        ),


    /**
     * Update an existing product
     */
    update: (
        id: number,
        payload: ProductPayload
    ): Promise<ApiResponse<Product>> =>
        HttpClient.put<ApiResponse<Product>>(
            `/product/${id}`,
            payload
        ),


    /**
     * Delete / deactivate a product
     */
    remove: (
        id: number,
        payload?: {
            hotelid?: number
            outletid?: number
            updatedby?: number
        }
    ): Promise<ApiResponse<null>> =>
        HttpClient.delete<ApiResponse<null>>(
            `/product/${id}`,
            { data: payload }
        )
}


export default ProductService