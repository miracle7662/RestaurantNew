/**
 * Subscription Plan Service - Clean API service for subscription plan management
 * Uses HttpClient with interceptors for authentication
 * Returns ApiResponse<T> for consistent response handling
 */

import HttpClient from '../helpers/httpClient';
import { ApiResponse } from '@/types/api';

/* ═══════════════════════════════════════════════════════════════════════════════
 * Type Definitions
 * ═══════════════════════════════════════════════════════════════════════════════ */

/** Subscription Plan information */
export interface SubscriptionPlan {
  plan_id: number;
  plan_name: string;
  plan_duration_months: number;
  plan_amount: number;
  max_hotels: number;
  max_users: number;
  is_active: number;
  created_date: string;
  updated_date: string;
}

/** Subscription Plan payload for create/update */
export interface SubscriptionPlanPayload {
  plan_id?: number;
  plan_name: string;
  plan_duration_months: number;
  plan_amount: number;
  max_hotels?: number;
  max_users?: number;
  is_active: number;
  created_date?: string;
  updated_date?: string;
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * Subscription Plan Service
 * ═══════════════════════════════════════════════════════════════════════════════ */

const SubscriptionPlanService = {

  /* ═══════════════════════════════════════════════════════════════════════════
   * CRUD Operations
   * ═══════════════════════════════════════════════════════════════════════════ */

  /**
   * Get all subscription plans with optional search
   */
  list: (params?: { q?: string }): Promise<ApiResponse<SubscriptionPlan[]>> =>
    HttpClient.get<ApiResponse<SubscriptionPlan[]>>('/subscription-plans', { params }),

  /**
   * Create a new subscription plan
   */
  create: (payload: SubscriptionPlanPayload): Promise<ApiResponse<SubscriptionPlan>> =>
    HttpClient.post<ApiResponse<SubscriptionPlan>>('/subscription-plans', payload),

  /**
   * Update an existing subscription plan
   */
  update: (id: number, payload: SubscriptionPlanPayload): Promise<ApiResponse<SubscriptionPlan>> =>
    HttpClient.put<ApiResponse<SubscriptionPlan>>(`/subscription-plans/${id}`, payload),

  /**
   * Delete a subscription plan
   */
  remove: (id: number): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/subscription-plans/${id}`)
};

export default SubscriptionPlanService;