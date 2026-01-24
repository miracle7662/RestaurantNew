import { useEffect, useState, useMemo } from "react";
import { Button, Modal, Spinner } from "react-bootstrap";
import { toast } from "react-hot-toast";
import { OutletSettings } from "src/utils/applyOutletSettings";
import {
  fetchKotPrintSettings,
} from "@/services/outletSettings.service";
import {
  applyKotSettings,
} from "@/utils/applyOutletSettings";


interface MenuItem {
  id: number;
  name: string;
  price: number;
  qty: number;
  isBilled: number;
  isNCKOT: number;
  NCName: string;
  NCPurpose: string;
  table_name?: string;
  isNew?: boolean;
  alternativeItem?: string;
  modifier?: string[];
  item_no?: string;
  originalQty?: number;
  kotNo?: number;
  txnDetailId?: number;
  isReverse?: boolean;
  revQty?: number;
}

interface KotPreviewPrintProps {
  show: boolean;
  onHide: () => void;
  printItems?: MenuItem[];
  items?: MenuItem[];
  currentKOTNo: number | null;
  selectedTable: string | null;
  activeTab: string;
  customerName: string;
  mobileNumber: string;
  user: any;
  formData: OutletSettings;
  reverseQtyMode: boolean;
  reverseQtyItems?: MenuItem[];
  onPrint?: () => void;
  onClose: () => void;
  kotNo?: number;
  autoPrint?: boolean;
  selectedOutletId?: number | null;
  pax?: number;
  restaurantName?: string;
  outletName?: string;
  kotNote?: string;
  orderNo?: string | null;
}

const KotPreviewPrint: React.FC<KotPreviewPrintProps> = ({
  show,
  onHide,
  printItems = [],
  items = [],
  currentKOTNo,
  selectedTable,
  activeTab,
  customerName,
  mobileNumber,
  user,
  formData,
  reverseQtyMode,
  reverseQtyItems = [],
  onPrint,
  autoPrint = false,
  selectedOutletId,
  pax,
  restaurantName,
  outletName,
  kotNote,
  orderNo
}) => {
  const [loading, setLoading] = useState(false);
  const [hasPrinted, setHasPrinted] = useState(false);
  const [printerName, setPrinterName] = useState<string | null>(null);
  const [outletId, setOutletId] = useState<number | null>(null);
  const [localRestaurantName, setLocalRestaurantName] = useState<string>('');
  const [localOutletName, setLocalOutletName] = useState<string>('');
  const [isLoadingNames, setIsLoadingNames] = useState(true);
  const [localFormData, setLocalFormData] = useState<OutletSettings>(formData);
  const [enableKotPrint, setEnableKotPrint] = useState<number>(0);
const [loadingSetting, setLoadingSetting] = useState(true);


  const loadOutletSettings = async (outletId: number) => {
    console.log('loadOutletSettings called with outletId:', outletId);
    try {
      const kotData = await fetchKotPrintSettings(outletId);
      console.log('fetchKotPrintSettings returned:', kotData);
      if (kotData) {
        const newFormData = applyKotSettings(localFormData, kotData);
        console.log('New form data after applyKotSettings:', newFormData);
        setLocalFormData(newFormData);
      } else {
        console.log('No KOT data returned from fetchKotPrintSettings');
      }
    } catch (err) {
      console.error('Failed to load outlet settings', err);
      toast.error('Failed to load KOT print settings.');
    }
  };

  // Load outlet settings when modal opens
  useEffect(() => {
    if (!show) return;

    const outlet = selectedOutletId ?? Number(user?.outletid);
    console.log('KOT Settings Load Debug:', { selectedOutletId, userOutletId: user?.outletid, outlet, show });
    if (!outlet || isNaN(outlet)) {
      console.log('Skipping outlet settings load - invalid outlet ID');
      return;
    }

    setOutletId(outlet);
    loadOutletSettings(outlet);
  }, [show, selectedOutletId, user]);

  // Reset hasPrinted when modal is closed
  useEffect(() => {
    if (!show) {
      setHasPrinted(false);
    }
  }, [show]);

  // Fetch printer settings and outlet details for the outlet
  useEffect(() => {
    const fetchPrinterAndOutlet = async () => {
      if (!outletId) return;

      setIsLoadingNames(true);

      try {
         const res = await fetch(
          `http://localhost:3001/api/settings/kot-printer-settings/${outletId}`
        );
        if (!res.ok) {
          throw new Error('Failed to fetch printers');
        }
        const data = await res.json();
        setPrinterName(data?.printer_name || null);
      } catch (err) {
        console.error('Error fetching printer:', err);
        toast.error('Failed to load printer settings.');
        setPrinterName(null);
      }

      // Fetch outlet details if restaurantName or outletName are not provided or are defaults
      if (!restaurantName || restaurantName.trim() === '' || restaurantName === 'Restaurant Name' ||
          !outletName || outletName.trim() === '' || outletName === 'Outlet Name') {
        try {
          const outletRes = await fetch(`http://localhost:3001/api/outlets/${outletId}`);
          if (outletRes.ok) {
            const outletData = await outletRes.json();
            const data = outletData.data || outletData;
            if (data) {
              setLocalRestaurantName(data.brand_name || data.hotel_name || 'Restaurant Name');
              setLocalOutletName(data.outlet_name || 'Outlet Name');
            }
          }
        } catch (error) {
          console.error('Error fetching outlet details:', error);
          setLocalRestaurantName(user?.hotel_name || 'Restaurant Name');
          setLocalOutletName(user?.outlet_name || 'Outlet Name');
        }
      }

      setIsLoadingNames(false);
    };

    fetchPrinterAndOutlet();
  }, [outletId, restaurantName, outletName, user]);

  // Auto-print logic (if enabled)
  useEffect(() => {
    if (autoPrint && show && !loading && !hasPrinted && !isLoadingNames) {
      setHasPrinted(true);
      handlePrintKOT();
    }
  }, [autoPrint, show, loading, hasPrinted, isLoadingNames]);

  // Direct API call for enableKotPrint setting
 useEffect(() => {
  const outletId = selectedOutletId ?? Number(user?.outletid);
  if (!outletId) return;

  const fetchKotSetting = async () => {
    try {
      const res = await fetch(
        `http://localhost:3001/api/settings/kot-printer-settings/${outletId}`
      );
      const data = await res.json();

      // 👇 IMPORTANT: backend sends 0 / 1
      setEnableKotPrint(Number(data?.enableKotPrint) || 0);
    } catch (err) {
      console.error("KOT setting fetch failed", err);
      setEnableKotPrint(0);
    } finally {
      setLoadingSetting(false);
    }
  };

  fetchKotSetting();
}, [selectedOutletId, user]);


  const generateKOTHTML = () => {
    const kotItems = printItems.length > 0 ? printItems : items.filter(i => i.isNew);

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>KOT</title>
  <style>
    @page {
      size: 302px auto;
      margin: 0;
    }

    html, body {
      width: 302px !important;
      min-width: 302px !important;
      margin: 0;
      padding: 0;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      line-height: 1.3;
      color: #000;
      box-sizing: border-box;
    }

    /* CONTENT WRAPPER */
    #kot-preview-content {
      width: 302px !important;
      min-width: 302px !important;
      margin: 0 auto;
      padding: 10px;
      box-sizing: border-box;
    }

    .center { text-align: center; }
    .right { text-align: right; }
    .bold { font-weight: bold; }
    .text-large { font-size: 14px; }
    .text-small { font-size: 10px; }
    .text-smaller { font-size: 9px; }
    .separator { border: none; border-top: 1px dashed #000; margin: 5px 0; }

    .item-table { width: 100%; border-collapse: collapse; }
    .item-table th, .item-table td { padding: 2px 0; vertical-align: top; }
    .item-table .col-item { width: 55%; }
    .item-table .col-qty { width: 15%; text-align: center; }
    .item-table .col-rate, .item-table .col-amt { width: 15%; text-align: right; }
    .item-table thead th { border-bottom: 1px solid #000; padding-bottom: 4px; }

    .totals-table { width: 100%; }
    .totals-table td { padding: 1px 0; }

    .tag { display: inline-block; padding: 1px 5px; border-radius: 4px; font-size: 9px; margin-top: 3px; }
    .tag-new { background-color: #333; color: #fff; }
    .tag-running { background-color: #666; color: #fff; }

    .reverse-header {
      text-align: center;
      font-weight: bold;
      color: #000;
      margin: 5px 0;
      padding: 3px;
      background-color: #ccc;
      border: 1px solid #000;
      font-size: 11px;
    }

    .reverse-item td { color: #000; }
    .reverse-item .reverse-qty, .reverse-item .reverse-amt { font-weight: bold; }
  </style>
</head>
<body>
  <div id="kot-preview-content">
    ${generateKOTContent}
  </div>
</body>
</html>
`;
  };



  const handlePrintKOT = async () => {
    try {
      setLoading(true);

      // If no printer is configured, show error
      if (!printerName) {
        toast.error("No KOT printer configured. Please configure printer settings.");
        return;
      }

      // Get system printers via Electron API (asynchronous)
      const systemPrintersRaw = await (window as any).electronAPI?.getInstalledPrinters?.() || [];
      const systemPrinters = Array.isArray(systemPrintersRaw) ? systemPrintersRaw : [];
      console.log("System Printers:", systemPrinters);

      if (systemPrinters.length === 0) {
        toast.error("No printers detected on this system. Please check printer connections and drivers.");
        return;
      }

      const normalize = (s: string) =>
        s.toLowerCase().replace(/\s+/g, "").trim();

      // Try to match the configured printer (case-insensitive, partial match)
      let matchedPrinter = systemPrinters.find((p: any) =>
        normalize(p.name).includes(normalize(printerName)) ||
        normalize(p.displayName || "").includes(normalize(printerName))
      );

      let finalPrinterName: string | null = null;
      let usedFallback = false;

      if (matchedPrinter) {
        finalPrinterName = matchedPrinter.name;
      } else {
        // Fallback: Use default printer or first available printer
        const defaultPrinter = systemPrinters.find((p: any) => p.isDefault);
        const fallbackPrinter = defaultPrinter || systemPrinters[0];

        if (fallbackPrinter) {
          finalPrinterName = fallbackPrinter.name;
          usedFallback = true;
          console.warn(`Configured printer "${printerName}" not found. Using fallback: ${fallbackPrinter.displayName || fallbackPrinter.name}`);
          toast(`Printer "${printerName}" not found. Using fallback: ${fallbackPrinter.displayName || fallbackPrinter.name}`);
        } else {
          toast.error("No suitable printer found, including fallbacks.");
          return;
        }
      }

      if (!finalPrinterName) {
        toast.error("Failed to determine printer name.");
        return;
      }

      // Generate KOT HTML for printing
      const kotHTML = generateKOTHTML();

      // Print using Electron API
      if ((window as any).electronAPI?.directPrint) {
        await (window as any).electronAPI.directPrint(kotHTML, finalPrinterName);
        toast.success("KOT Printed Successfully!");

        // Call onPrint callback if provided
        if (onPrint) {
          onPrint();
        }

        // Close modal after printing with delay to prevent job cancellation
        setTimeout(onHide, 300);
      } else {
        toast.error("Electron print API not available.");
      }
    } catch (err) {
      console.error("Print error:", err);
      toast.error("Failed to print KOT.");
    } finally {
      setLoading(false);
    }
  };

const dateTime = new Date().toLocaleString('en-GB', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})




  const generateKOTContent = useMemo(() => {
    const kotItems = printItems.length > 0 ? printItems : items.filter(i => i.isNew);

    console.log('KOT SETTINGS USED 👉', localFormData);

    // Determine the names to use: outlet props first, then local state, then user object, then defaults
    const displayRestaurantName = restaurantName || localRestaurantName || user?.hotel_name || 'Restaurant Name';
    const displayOutletName = outletName || localOutletName || user?.outlet_name || 'Outlet Name';

    console.log('KOT Print Debug:', {
      restaurantName,

      displayRestaurantName,
      outletName,
      localOutletName,
      userOutletName: user?.outlet_name,
      displayOutletName
    });

    // Map activeTab to key suffix
    const tabKeyMap: { [key: string]: string } = {
      'Dine In': 'dine_in',
      'Pickup': 'pickup',
      'Delivery': 'delivery',
      'Quick Bill': 'quick_bill'
    };
    const tabKey = tabKeyMap[activeTab] || 'dine_in';

    console.log('ACTIVE TAB 👉', activeTab, 'TAB KEY 👉', tabKey);

    // Get KOT no prefix
    const kotNoPrefix = localFormData[`${tabKey}_kot_no`] || '';
    const displayKOTNo = currentKOTNo ? `${kotNoPrefix}${currentKOTNo}` : '—';

    // Conditional rendering flags
    const showStoreName = localFormData.show_store_name;
    const showWaiter = localFormData.show_waiter && user?.name;
    const showUsername = localFormData.show_username && user?.username;
    const showTerminalUsername = localFormData.show_terminal_username && user?.terminal_username;
    const showCaptainUsername = localFormData.show_captain_username && user?.captain_username;
    const showCustomerOnKOT = (() => {
  switch (activeTab) {
    case 'Dine-in':
      return localFormData.customer_on_kot_dine_in;
    case 'Pickup':
      return localFormData.customer_on_kot_pickup;
    case 'Delivery':
      return localFormData.customer_on_kot_delivery;
    case 'Quick Bill':
      return localFormData.customer_on_kot_quick_bill;
    default:
      return false;
  }
})();
const displayOption =
  localFormData.customer_kot_display_option ?? 'NAME_ONLY';


const showCustomerName =
  showCustomerOnKOT &&
  !!customerName &&
  ['NAME_ONLY', 'NAME_AND_MOBILE'].includes(displayOption);

const showCustomerMobile =
  showCustomerOnKOT &&
  !!mobileNumber &&
  localFormData.customer_kot_display_option === 'NAME_AND_MOBILE';
    const showCustomer = showCustomerName || showCustomerMobile;


    const showTable = selectedTable && (activeTab === 'Dine-in' || localFormData[`table_name_${tabKey}`]) && !(activeTab === 'Quick Bill' && localFormData.hide_table_name_quick_bill);
    const showRateColumn = localFormData.show_item_price;
    const showAmountColumn = !localFormData.hide_item_total_column;
    const showOrderTypeSymbol = localFormData.show_order_type_symbol;
    const showCoversAsGuest = localFormData.show_covers_as_guest;
    const showKotNote = localFormData.show_kot_note;
    const showOnlineOrderOtp = localFormData.show_online_order_otp;
    const showOrderIdQuickBill = localFormData.show_order_id_quick_bill && activeTab === 'Quick Bill';
    const showKotNoQuickBill = localFormData.show_kot_no_quick_bill && activeTab === 'Quick Bill';
    const showOrderNoQuickBillSection = localFormData.show_order_no_quick_bill_section && ['Pickup', 'Quick Bill', 'Delivery'].includes(activeTab);
    const showNewOrderTag = localFormData.show_new_order_tag;
    const showRunningOrderTag = localFormData.show_running_order_tag;
    const modifierDefaultOption = localFormData.modifier_default_option;
    const showAlternativeItem = localFormData.show_alternative_item;
    const printKotBothLanguages = localFormData.print_kot_both_languages;
    const groupKotItemsByCategory = localFormData.group_kot_items_by_category;

    // Calculate grid columns for items
    const columns = ['35px', '1fr'];
    if (showAmountColumn) columns.push('55px');
    const gridTemplateColumns = columns.join(' ');

    return `
    <!-- STORE INFO -->
    ${showStoreName ? `
    <div style="text-align: center; margin-bottom: 10px;">
      <div style="font-weight: bold; font-size: 12pt;">
        ${displayRestaurantName}
      </div>
      <div style="font-size: 8pt;">
        ${displayOutletName}
      </div>
    </div>

    <hr style="border: none; border-top: 1px dashed #000; margin: 8px 0;" />
    ` : ''}

    <!-- KOT HEADER -->
    <div style="text-align: center; margin-bottom: 8px;">
      <div><strong>${showOrderTypeSymbol ? '🔸 ' : ''}Order Type:</strong> ${activeTab}</div>

        ${showCustomerName
  ? `<div style="font-size: 9pt; margin-bottom: 6px;">
       <strong>Customer:</strong> ${customerName}
     </div>`
  : ''}

${showCustomerMobile
  ? `<div style="font-size: 9pt; margin-bottom: 6px;">
       <strong>Mobile:</strong> ${mobileNumber}
     </div>`
  : ''}
    </div>

    <hr style="border: none; border-top: 1px dashed #000; margin: 8px 0;" />

    <!-- BASIC DETAILS -->
    <div style="display: grid; grid-template-columns: auto 1fr; gap: 12px; margin-bottom: 10px; font-size: 9pt;">

  <!-- TABLE BIG BOX -->
  <div style="
    border: 1px solid #696868;
    min-width: 70px;
    min-height: 55px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16pt;
    font-weight: bold;
  ">
    ${showTable ? selectedTable : activeTab}
  </div>

 <!-- RIGHT DETAILS -->
<div style="
  display: flex;
  justify-content: flex-end;
">
  <div style="
    display: grid;
    grid-template-columns: 60px auto;
    text-align: left;
  ">
    <div><strong>KOT No:</strong></div>
    <div>${displayKOTNo}</div>

    <div><strong>Date:</strong></div>
    <div>${dateTime}</div>
  </div>
</div>


</div>

    </div>

    ${showWaiter ? `<div style="font-size: 9pt; margin-bottom: 6px;"><strong>Waiter:</strong> ${user.name}</div>` : ''}
    ${showUsername ? `<div style="font-size: 9pt; margin-bottom: 6px;"><strong>Username:</strong> ${user.username}</div>` : ''}
    ${showTerminalUsername ? `<div style="font-size: 9pt; margin-bottom: 6px;"><strong>Terminal Username:</strong> ${user.terminal_username}</div>` : ''}
    ${showCaptainUsername ? `<div style="font-size: 9pt; margin-bottom: 6px;"><strong>Captain Username:</strong> ${user.captain_username}</div>` : ''}
 

    ${showOnlineOrderOtp ? `<div style="font-size: 9pt; margin-bottom: 6px;"><strong>OTP:</strong> 123456</div>` : ''}
    ${showOrderIdQuickBill ? `<div style="font-size: 9pt; margin-bottom: 6px;"><strong>Order ID:</strong> QB-${currentKOTNo || 'N/A'}</div>` : ''}
    ${showKotNoQuickBill ? `<div style="font-size: 9pt; margin-bottom: 6px;"><strong>KOT No:</strong> ${displayKOTNo}</div>` : ''}
    ${showOrderNoQuickBillSection ? `<div style="font-size: 9pt; margin-bottom: 6px;"><strong>Order No:</strong> ${orderNo || 'N/A'}</div>` : ''}

    <hr style="border: none; border-top: 1px dashed #000; margin: 8px 0;" />
    <!-- ITEM HEADER -->
    <div style="display: grid; grid-template-columns: ${gridTemplateColumns}; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 4px; margin-bottom: 5px;">
      <div style="text-align: center">Qty</div>
      <div style="text-align: center">Item</div>
      ${showAmountColumn ? `<div style="text-align: right">Amt</div>` : ''}
    </div>
    <!-- ITEMS -->
    ${groupKotItemsByCategory ? `
    <!-- Grouped by Category Placeholder -->
    <div style="font-weight: bold;   margin-bottom: 5px;">Category: Main Course</div>
    ` : ''}
    ${kotItems.map((item) => {
      const qty = item.originalQty ? item.qty - item.originalQty : item.qty;
      const tags = [];
      if (showNewOrderTag && item.isNew) tags.push(`<span class="tag tag-new">${localFormData.new_order_tag_label || 'New'}</span>`);
      if (showRunningOrderTag && !item.isNew) tags.push(`<span class="tag tag-running">${localFormData.running_order_tag_label || 'Running'}</span>`);
      const tagHtml = tags.length > 0 ? `<div>${tags.join(' ')}</div>` : '';
      const modifierHtml = modifierDefaultOption && item.modifier && item.modifier.length > 0 ? `<div style="font-size: 8pt; color: #666;">Modifiers: ${item.modifier.join(', ')}</div>` : '';
      const alternativeHtml = showAlternativeItem && item.alternativeItem ? `<div style="font-size: 8pt; color: #666;">Alt: ${item.alternativeItem}</div>` : '';
      return `
      <div style="display: grid; grid-template-columns: ${gridTemplateColumns}; padding-bottom: 3px; margin-bottom: 3px; font-size: 10pt;">
        <div style="text-align: center">${qty}</div>
        <div style="text-align: center">
          ${item.name}
          ${tagHtml}
          ${modifierHtml}
          ${alternativeHtml}
        </div>
        ${showAmountColumn ? `<div style="text-align: right">${(item.price * qty).toFixed(2)}</div>` : ''}
      </div>
      `;
    }).join('')}

    <hr style="border: none; border-top: 1px dashed #000; margin: 8px 0;" />

    <!-- TOTALS -->
    <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 10pt;">
<div style="padding: 2px 11px;">
   ${kotItems.reduce(
    (a, b) => a + (b.originalQty ? b.qty - b.originalQty : b.qty),
    0
  )}
</div>

      ${showAmountColumn ? `<div> ₹${kotItems.reduce((a, b) => a + (b.price * (b.originalQty ? b.qty - b.originalQty : b.qty)), 0).toFixed(2)}</div>` : ''}
    </div>
    <hr style="border: none; border-top: 1px dashed #000; margin: 8px 0;" />
    <!-- FOOTER -->
        ${showKotNote && kotNote ? `<div style="font-size: 9pt; margin-bottom: 6px;"><strong>Note:</strong> ${kotNote}</div>` : ''}

    
    `;
  }, [localFormData, printItems, items, restaurantName, localRestaurantName, user, outletName, localOutletName, activeTab, currentKOTNo, selectedTable, customerName, mobileNumber, pax]);

  // if (autoPrint) {
  //   // For auto print, don't show the modal, just handle printing in useEffect
  //   return null;
  // }

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="lg"
      centered
      backdrop="static"
    >
      <Modal.Header closeButton>
        <Modal.Title>KOT Preview & Print</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: "70vh", overflowY: "auto" }}>
        {loading || isLoadingNames ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">{loading ? 'Loading printer settings...' : 'Loading outlet details...'}</p>
          </div>
        ) : (
          <div>
            {/* Preview Section */}
            <div className="border p-3 mb-3 bg-light">
              <div
                key={JSON.stringify(localFormData)}
                style={{
                  width: "302px",
                  margin: "0 auto",
                  fontFamily: "'Courier New', monospace",
                  fontSize: "12px",
                  lineHeight: "1.3",
                  padding: "10px",
                  color: "#000",
                  backgroundColor: "white",
                  border: "1px solid #ccc"
                }}
                dangerouslySetInnerHTML={{ __html: generateKOTContent }}
              />
            </div>


          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
       <Button
  variant="primary"
  onClick={handlePrintKOT}
  disabled={enableKotPrint === 0 || loading}
>
  Print KOT
</Button>

      </Modal.Footer>
    </Modal>
  );
};

export default KotPreviewPrint;