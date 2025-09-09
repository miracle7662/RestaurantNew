import React, { createContext, useContext, useState } from 'react';

// Define the interfaces for print settings
interface KOTPrintSetting {
  showTable: boolean;
  showTime: boolean;
  showWaiter: boolean;
  showItemNotes: boolean;
  showQuantity: boolean;
  paperSize: string;
  copies: number;
}

interface BillPreviewSetting {
  showLogo: boolean;
  showAddress: boolean;
  showGST: boolean;
  showCustomerDetails: boolean;
  showItemCode: boolean;
  paperSize: string;
  copies: number;
}

interface OutletSettings {
  KOTPrintSetting: KOTPrintSetting;
  BillPreviewSetting: BillPreviewSetting;
  showBillPreview: boolean;
}

// Create the context
const SettingsContext = createContext<{
  outletSettings: OutletSettings;
  setOutletSettings: React.Dispatch<React.SetStateAction<OutletSettings>>;
} | null>(null);

// Provider component
export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [outletSettings, setOutletSettings] = useState<OutletSettings>({
    KOTPrintSetting: {
      showTable: true,
      showTime: true,
      showWaiter: true,
      showItemNotes: true,
      showQuantity: true,
      paperSize: '80mm',
      copies: 2,
    },
    BillPreviewSetting: {
      showLogo: true,
      showAddress: true,
      showGST: true,
      showCustomerDetails: true,
      showItemCode: false,
      paperSize: 'A4',
      copies: 1,
    },
    showBillPreview: true,
  });

  return (
    <SettingsContext.Provider value={{ outletSettings, setOutletSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

// Hook to use the context
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export type { KOTPrintSetting, BillPreviewSetting, OutletSettings };
