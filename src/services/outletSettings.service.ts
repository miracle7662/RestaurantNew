// src/services/outletSettings.service.ts

const BASE_URL = 'http://localhost:3001/api/outlets';

export const fetchKotPrintSettings = async (outletId: number) => {
  const res = await fetch(`${BASE_URL}/kot-print-settings/${outletId}`, {
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error('Failed to fetch KOT print settings');
  }

  return res.json();
};

export const fetchBillSettings = async (outletId: number) => {
  const [previewRes, printRes] = await Promise.all([
    fetch(`${BASE_URL}/bill-preview-settings/${outletId}`),
    fetch(`${BASE_URL}/bill-print-settings/${outletId}`)
  ]);

  return {
    preview: previewRes.ok ? await previewRes.json() : {},
    print: printRes.ok ? await printRes.json() : {},
  };
};
