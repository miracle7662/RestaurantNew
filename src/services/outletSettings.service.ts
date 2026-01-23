// src/services/outletSettings.service.ts
import axios from "axios";

const BASE_URL = 'http://localhost:3001/api/outlets';

/* ---------------- KOT PRINT SETTINGS ---------------- */

export const fetchKotPrintSettings = async (outletId: number) => {
  try {
    const res = await axios.get(`${BASE_URL}/kot-print-settings/${outletId}`);
    return res.data?.data ?? res.data;
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
      axios.get(`${BASE_URL}/bill-preview-settings/${outletId}`),
      axios.get(`${BASE_URL}/bill-print-settings/${outletId}`)
    ]);

    return {
      billPreviewSettings: billPreviewRes.data?.data ?? billPreviewRes.data,
      billPrintSettings: billPrintRes.data?.data ?? billPrintRes.data
    };
  } catch (error: any) {
    console.error('Failed to fetch bill settings:', error);
    // Return empty objects on error to prevent crashes
    return {
      billPreviewSettings: {},
      billPrintSettings: {}
    };
  }
};


