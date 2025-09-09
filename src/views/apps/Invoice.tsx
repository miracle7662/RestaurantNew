import React, { useState, createContext, useContext, useMemo, useCallback, memo } from 'react';
import { Printer, FileText, Receipt, Settings, Eye } from 'lucide-react';

// Types and Interfaces
interface Customer {
  name: string;
  phone: string;
  gst: string;
}

interface OrderItem {
  id: number;
  name: string;
  code: string;
  qty: number;
  rate: number;
  amount: number;
  notes: string;
}

interface Order {
  id: string;
  tableNo: string;
  waiter: string;
  date: string;
  time: string;
  customer: Customer;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
}

interface BillSettings {
  showLogo: boolean;
  showAddress: boolean;
  showGST: boolean;
  showCustomerDetails: boolean;
  showItemCode: boolean;
  paperSize: 'A4' | '80mm' | '58mm';
  copies: number;
}

interface KOTSettings {
  showTable: boolean;
  showTime: boolean;
  showWaiter: boolean;
  showItemNotes: boolean;
  showQuantity: boolean;
  paperSize: '80mm' | '58mm' | 'A4';
  copies: number;
}

interface PrintSettingsContextValue {
  billSettings: BillSettings;
  setBillSettings: React.Dispatch<React.SetStateAction<BillSettings>>;
  kotSettings: KOTSettings;
  setKotSettings: React.Dispatch<React.SetStateAction<KOTSettings>>;
}

// Constants
const RESTAURANT_INFO = {
  name: 'SPICE PARADISE',
  address: '123 Food Street, Delhi - 110001',
  phone: '+91 11 2345 6789',
  gstin: '07AABCU9603R1ZX'
} as const;

const TAX_RATE = 0.18; // 18%
const MAX_COPIES = 5;
const MIN_COPIES = 1;
const DEFAULT_TIMEOUT_MS = 100;
const DECIMAL_PLACES = 2;

const PAPER_SIZES = {
  BILL: ['A4', '80mm', '58mm'] as const,
  KOT: ['80mm', '58mm', 'A4'] as const
} as const;

const MESSAGES = {
  ERRORS: {
    INVALID_COPIES: 'Number of copies must be between 1 and 5',
    INVALID_QUANTITY: 'Quantity must be a positive number',
    CONTEXT_ERROR: 'usePrintSettings must be used within PrintSettingsProvider',
    PRINT_FAILED: 'Failed to print document. Please try again.'
  },
  SUCCESS: {
    BILL_THANKYOU: 'Thank you for dining with us!',
    KOT_MESSAGE: 'Please prepare as per order'
  }
} as const;

// Print Settings Context
const PrintSettingsContext = createContext<PrintSettingsContextValue | undefined>(undefined);

const PrintSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [billSettings, setBillSettings] = useState<BillSettings>({
    showLogo: true,
    showAddress: true,
    showGST: true,
    showCustomerDetails: true,
    showItemCode: false,
    paperSize: 'A4',
    copies: 1
  });

  const [kotSettings, setKotSettings] = useState<KOTSettings>({
    showTable: true,
    showTime: true,
    showWaiter: true,
    showItemNotes: true,
    showQuantity: true,
    paperSize: '80mm',
    copies: 2
  });

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    billSettings,
    setBillSettings,
    kotSettings,
    setKotSettings
  }), [billSettings, kotSettings]);

  return (
    <PrintSettingsContext.Provider value={contextValue}>
      {children}
    </PrintSettingsContext.Provider>
  );
};

const usePrintSettings = (): PrintSettingsContextValue => {
  const context = useContext(PrintSettingsContext);
  if (!context) {
    throw new Error('usePrintSettings must be used within PrintSettingsProvider');
  }
  return context;
};

// Sample data
const sampleOrder: Order = {
  id: 'ORD-001',
  tableNo: 'T-05',
  waiter: 'Raj Kumar',
  date: new Date().toLocaleDateString('hi-IN'),
  time: new Date().toLocaleTimeString('hi-IN', { hour12: true }),
  customer: {
    name: 'Amit Sharma',
    phone: '+91 98765 43210',
    gst: 'GST123456789'
  },
  items: [
    { id: 1, name: 'Butter Chicken', code: 'BC001', qty: 2, rate: 350, amount: 700, notes: 'Medium spicy' },
    { id: 2, name: 'Naan', code: 'N001', qty: 4, rate: 45, amount: 180, notes: '' },
    { id: 3, name: 'Dal Makhani', code: 'DM001', qty: 1, rate: 280, amount: 280, notes: 'Less butter' },
    { id: 4, name: 'Lassi', code: 'L001', qty: 2, rate: 80, amount: 160, notes: 'Sweet' }
  ],
  subtotal: 1320,
  tax: 237.6,
  total: 1557.6
};

// BillPreview Component - Memoized for performance
interface BillPreviewProps {
  printType: 'BILL' | 'KOT';
}

const BillPreview = memo<BillPreviewProps>(({ printType }) => {
  const { billSettings, kotSettings } = usePrintSettings();
  
  // Memoize settings selection to avoid recalculation
  const settings = useMemo(() =>
    printType === 'BILL' ? billSettings : kotSettings,
    [printType, billSettings, kotSettings]
  );
  
  // Memoize title and currency formatter
  const title = useMemo(() =>
    printType === 'BILL' ? 'BILL' : 'KOT (Kitchen Order Ticket)',
    [printType]
  );
  
  const formatCurrency = useCallback((amount: number): string => {
    if (typeof amount !== 'number' || isNaN(amount)) {
      return '₹0.00';
    }
    return `₹${amount.toFixed(DECIMAL_PLACES)}`;
  }, []);

  return (
    <div className="bg-white border-2 border-gray-300 rounded-lg p-6 max-w-md mx-auto shadow-lg">
      {/* Header */}
      <div className="text-center mb-4 border-b-2 border-dashed border-gray-400 pb-4">
        {settings.showLogo && (
          <div className="mb-2">
            <div className="w-12 h-12 bg-orange-500 rounded-full mx-auto flex items-center justify-center">
              <Receipt className="w-6 h-6 text-white" />
            </div>
          </div>
        )}
        <h1 className="text-xl font-bold">SPICE PARADISE</h1>
        {settings.showAddress && (
          <div className="text-sm text-gray-600 mt-1">
            <p>123 Food Street, Delhi - 110001</p>
            <p>Phone: +91 11 2345 6789</p>
            {printType === 'BILL' && settings.showGST && (
              <p>GSTIN: 07AABCU9603R1ZX</p>
            )}
          </div>
        )}
      </div>

      {/* Document Type */}
      <div className="text-center mb-4">
        <h2 className="text-lg font-semibold bg-gray-100 py-2 px-4 rounded">
          {title}
        </h2>
      </div>

      {/* Order Details */}
      <div className="mb-4 text-sm">
        <div className="flex justify-between mb-1">
          <span>Order No:</span>
          <span className="font-semibold">{sampleOrder.id}</span>
        </div>
        {settings.showTable && (
          <div className="flex justify-between mb-1">
            <span>Table:</span>
            <span className="font-semibold">{sampleOrder.tableNo}</span>
          </div>
        )}
        {settings.showWaiter && (
          <div className="flex justify-between mb-1">
            <span>Waiter:</span>
            <span className="font-semibold">{sampleOrder.waiter}</span>
          </div>
        )}
        <div className="flex justify-between mb-1">
          <span>Date:</span>
          <span>{sampleOrder.date}</span>
        </div>
        {settings.showTime && (
          <div className="flex justify-between mb-1">
            <span>Time:</span>
            <span>{sampleOrder.time}</span>
          </div>
        )}
      </div>

      {/* Customer Details - Only for BILL */}
      {printType === 'BILL' && settings.showCustomerDetails && (
        <div className="mb-4 text-sm border-t border-dashed border-gray-300 pt-3">
          <h3 className="font-semibold mb-2">Customer Details:</h3>
          <div className="flex justify-between mb-1">
            <span>Name:</span>
            <span>{sampleOrder.customer.name}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span>Phone:</span>
            <span>{sampleOrder.customer.phone}</span>
          </div>
          {settings.showGST && (
            <div className="flex justify-between mb-1">
              <span>GST No:</span>
              <span>{sampleOrder.customer.gst}</span>
            </div>
          )}
        </div>
      )}

      {/* Items */}
      <div className="mb-4 border-t border-dashed border-gray-300 pt-3">
        <h3 className="font-semibold mb-2 text-sm">Items:</h3>
        <div className="space-y-2">
          {sampleOrder.items.map((item) => (
            <div key={item.id} className="text-sm">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex justify-between">
                    <span className="font-medium">{item.name}</span>
                    {printType === 'BILL' && (
                      <span className="font-semibold">{formatCurrency(item.amount)}</span>
                    )}
                  </div>
                  {settings.showItemCode && printType === 'BILL' && (
                    <div className="text-xs text-gray-500">Code: {item.code}</div>
                  )}
                  {settings.showQuantity && (
                    <div className="text-xs text-gray-600">
                      Qty: {item.qty} {printType === 'BILL' && `× ${formatCurrency(item.rate)}`}
                    </div>
                  )}
                  {settings.showItemNotes && item.notes && (
                    <div className="text-xs text-blue-600 italic">Note: {item.notes}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Totals - Only for BILL */}
      {printType === 'BILL' && (
        <div className="border-t-2 border-dashed border-gray-400 pt-3 text-sm">
          <div className="flex justify-between mb-1">
            <span>Subtotal:</span>
            <span>{formatCurrency(sampleOrder.subtotal)}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span>Tax ({Math.round(TAX_RATE * 100)}%):</span>
            <span>{formatCurrency(sampleOrder.tax)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg border-t border-gray-300 pt-2 mt-2">
            <span>Total:</span>
            <span>{formatCurrency(sampleOrder.total)}</span>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center mt-4 pt-3 border-t border-dashed border-gray-300">
        <p className="text-xs text-gray-600">
          {printType === 'BILL' ? MESSAGES.SUCCESS.BILL_THANKYOU : MESSAGES.SUCCESS.KOT_MESSAGE}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Printed on: {new Date().toLocaleString('hi-IN')}
        </p>
      </div>
    </div>
  );
});

// Add display name for debugging
BillPreview.displayName = 'BillPreview';

// Settings Components - Optimized with useCallback
const BillPrintSettings = memo(() => {
  const { billSettings, setBillSettings } = usePrintSettings();

  // Memoize update function to prevent unnecessary re-renders with validation
  const updateSetting = useCallback((key: keyof BillSettings, value: any) => {
    try {
      // Validate copies input
      if (key === 'copies') {
        const numValue = typeof value === 'string' ? parseInt(value, 10) : value;
        if (isNaN(numValue) || numValue < MIN_COPIES || numValue > MAX_COPIES) {
          console.warn(MESSAGES.ERRORS.INVALID_COPIES);
          return;
        }
        value = numValue;
      }
      
      setBillSettings(prev => ({ ...prev, [key]: value }));
    } catch (error) {
      console.error('Error updating bill setting:', error);
    }
  }, [setBillSettings]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <Receipt className="w-4 h-4" />
        Bill Print Settings
      </h3>
      <div className="space-y-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={billSettings.showLogo}
            onChange={(e) => updateSetting('showLogo', e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">Show Logo</span>
        </label>
        
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={billSettings.showAddress}
            onChange={(e) => updateSetting('showAddress', e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">Show Address</span>
        </label>
        
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={billSettings.showGST}
            onChange={(e) => updateSetting('showGST', e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">Show GST Details</span>
        </label>
        
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={billSettings.showCustomerDetails}
            onChange={(e) => updateSetting('showCustomerDetails', e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">Show Customer Details</span>
        </label>
        
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={billSettings.showItemCode}
            onChange={(e) => updateSetting('showItemCode', e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">Show Item Codes</span>
        </label>

        <div>
          <label className="block text-sm font-medium mb-1">Paper Size:</label>
          <select
            value={billSettings.paperSize}
            onChange={(e) => updateSetting('paperSize', e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
          >
            <option value="A4">A4</option>
            <option value="80mm">80mm</option>
            <option value="58mm">58mm</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Number of Copies:</label>
          <input
            type="number"
            min={MIN_COPIES}
            max={MAX_COPIES}
            value={billSettings.copies}
            onChange={(e) => updateSetting('copies', e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            aria-describedby="copies-help"
          />
          <p id="copies-help" className="text-xs text-gray-500 mt-1">
            Enter a number between {MIN_COPIES} and {MAX_COPIES}
          </p>
        </div>
      </div>
    </div>
  );
});

// Add display name for debugging
BillPrintSettings.displayName = 'BillPrintSettings';

const KOTPrintSettings = memo(() => {
  const { kotSettings, setKotSettings } = usePrintSettings();

  // Memoize update function to prevent unnecessary re-renders with validation
  const updateSetting = useCallback((key: keyof KOTSettings, value: any) => {
    try {
      // Validate copies input
      if (key === 'copies') {
        const numValue = typeof value === 'string' ? parseInt(value, 10) : value;
        if (isNaN(numValue) || numValue < MIN_COPIES || numValue > MAX_COPIES) {
          console.warn(MESSAGES.ERRORS.INVALID_COPIES);
          return;
        }
        value = numValue;
      }
      
      setKotSettings(prev => ({ ...prev, [key]: value }));
    } catch (error) {
      console.error('Error updating KOT setting:', error);
    }
  }, [setKotSettings]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <FileText className="w-4 h-4" />
        KOT Print Settings
      </h3>
      <div className="space-y-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={kotSettings.showTable}
            onChange={(e) => updateSetting('showTable', e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">Show Table Number</span>
        </label>
        
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={kotSettings.showTime}
            onChange={(e) => updateSetting('showTime', e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">Show Time</span>
        </label>
        
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={kotSettings.showWaiter}
            onChange={(e) => updateSetting('showWaiter', e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">Show Waiter Name</span>
        </label>
        
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={kotSettings.showItemNotes}
            onChange={(e) => updateSetting('showItemNotes', e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">Show Item Notes</span>
        </label>
        
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={kotSettings.showQuantity}
            onChange={(e) => updateSetting('showQuantity', e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">Show Quantity</span>
        </label>

        <div>
          <label className="block text-sm font-medium mb-1">Paper Size:</label>
          <select
            value={kotSettings.paperSize}
            onChange={(e) => updateSetting('paperSize', e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
          >
            <option value="80mm">80mm</option>
            <option value="58mm">58mm</option>
            <option value="A4">A4</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Number of Copies:</label>
          <input
            type="number"
            min={MIN_COPIES}
            max={MAX_COPIES}
            value={kotSettings.copies}
            onChange={(e) => updateSetting('copies', e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            aria-describedby="kot-copies-help"
          />
          <p id="kot-copies-help" className="text-xs text-gray-500 mt-1">
            Enter a number between {MIN_COPIES} and {MAX_COPIES}
          </p>
        </div>
      </div>
    </div>
  );
});

// Add display name for debugging
KOTPrintSettings.displayName = 'KOTPrintSettings';

// Main Order Component with Tab System - Optimized
const OrderPage = memo(() => {
  const [activeTab, setActiveTab] = useState<'order' | 'billing'>('order');
  const [showPreview, setShowPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoize event handlers to prevent unnecessary re-renders
  const handlePrint = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setShowPreview(true);
      
      // Simulate print preparation
      await new Promise(resolve => setTimeout(resolve, DEFAULT_TIMEOUT_MS));
      
      if (window.print) {
        window.print();
      } else {
        throw new Error('Print functionality not available');
      }
    } catch (error) {
      console.error('Print error:', error);
      setError(MESSAGES.ERRORS.PRINT_FAILED);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const togglePreview = useCallback(() => {
    setShowPreview(prev => !prev);
  }, []);

  const switchToOrderTab = useCallback(() => {
    setActiveTab('order');
  }, []);

  const switchToBillingTab = useCallback(() => {
    setActiveTab('billing');
  }, []);

  // Memoize computed values
  const isOrderTab = useMemo(() => activeTab === 'order', [activeTab]);
  const isBillingTab = useMemo(() => activeTab === 'billing', [activeTab]);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 p-4">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Restaurant Order Management</h1>
          
          {/* Tab Navigation */}
          <div className="flex gap-2 border-b">
            <button
              onClick={switchToOrderTab}
              className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${
                isOrderTab
                  ? 'bg-blue-500 text-white border-b-2 border-blue-500'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              KOT / Order
            </button>
            <button
              onClick={switchToBillingTab}
              className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${
                isBillingTab
                  ? 'bg-green-500 text-white border-b-2 border-green-500'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Receipt className="w-4 h-4 inline mr-2" />
              Billing
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings Panel */}
          <div className="lg:col-span-1">
            <div className="space-y-4">
              {isOrderTab ? <KOTPrintSettings /> : <BillPrintSettings />}
              
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={togglePreview}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  <Eye className="w-4 h-4" />
                  {showPreview ? 'Hide Preview' : 'Show Preview'}
                </button>
                
                <button
                  onClick={handlePrint}
                  disabled={isLoading}
                  className={`w-full py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    isOrderTab
                      ? 'bg-orange-500 hover:bg-orange-600 text-white'
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
                >
                  <Printer className="w-4 h-4" />
                  {isLoading ? 'Printing...' : `Print ${isOrderTab ? 'KOT' : 'Bill'}`}
                </button>
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-2">
            {showPreview ? (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">
                    {isOrderTab ? 'KOT Preview' : 'Bill Preview'}
                  </h2>
                  <div className="text-sm text-gray-600">
                    Preview Mode: {isOrderTab ? 'KOT' : 'BILL'}
                  </div>
                </div>
                <BillPreview printType={isOrderTab ? 'KOT' : 'BILL'} />
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Preview not shown</p>
                <p className="text-sm text-gray-500">
                  Click "Show Preview" to see {isOrderTab ? 'KOT' : 'Bill'} preview
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

// Add display name for debugging
OrderPage.displayName = 'OrderPage';

// Main App Component
const App = () => {
  return (
    <PrintSettingsProvider>
      <OrderPage />
    </PrintSettingsProvider>
  );
};

export default App;