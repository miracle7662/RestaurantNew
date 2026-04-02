// src/services/outletSettings.service.ts
import HttpClient from '@/common/helpers/httpClient';

/* ---------------- KOT PRINT SETTINGS ---------------- */

export const fetchKotPrintSettings = async (outletId: number) => {
  try {
    const res = await HttpClient.get<any>(`/outlets/kot-print-settings/${outletId}`);
    return res?.data ?? res;
  } catch (error: any) {
    if (error.response?.status === 404) return null;
    throw new Error('Failed to fetch KOT print settings');
  }
};


/* ---------------- BILL SETTINGS (PREVIEW + PRINT) ---------------- */

export const fetchBillSettings = async (outletId: number): Promise<{ billPreviewSettings: any; billPrintSettings: any }> => {
  try {
    const [
      billPreviewRes,
      billPrintRes
    ] = await Promise.all([
      HttpClient.get<any>(`/outlets/bill-preview-settings/${outletId}`),
      HttpClient.get<any>(`/outlets/bill-print-settings/${outletId}`)
    ]);

    return {
      billPreviewSettings: billPreviewRes?.data ?? billPreviewRes,
      billPrintSettings: billPrintRes?.data ?? billPrintRes
    };
  } catch (error: any) {
    // console.error('Failed to fetch bill settings:', error);
    // Return empty objects on error to prevent crashes
    return {
      billPreviewSettings: {},
      billPrintSettings: {}
    };
  }
};


