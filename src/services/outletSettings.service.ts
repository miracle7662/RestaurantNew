 // src/services/outletSettings.service.ts
import axios from "axios";

const BASE_URL = 'http://localhost:3001/api/outlets';

/* ---------------- KOT PRINT SETTINGS ---------------- */

export const fetchKotPrintSettings = async (outletId: number) => {
  const res = await fetch(`${BASE_URL}/kot-print-settings/${outletId}`, {
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error('Failed to fetch KOT print settings');
  }

  const data = await res.json();
  return data?.data ?? data;
};


/* ---------------- BILL SETTINGS (PREVIEW + PRINT) ---------------- */

export const fetchBillSettings = async (outletId: number) => {
  const [
    billPreviewRes,
    billPrintRes
  ] = await Promise.all([
    axios.get(`${BASE_URL}/bill-preview-settings/${outletId}`),
    axios.get(`${BASE_URL}/bill-print-settings/${outletId}`)
  ]);

  return {
    billPreviewSettings: billPreviewRes.data,
    billPrintSettings: billPrintRes.data
  };
};


