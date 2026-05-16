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
import PrintService from "@/common/api/print";


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
  item_no?: number;
  originalQty?: number;
  kotNo?: number;
  txnDetailId?: number;
  isReverse?: boolean;
  revQty?: number;
  variantId?: number;
  variantName?: string;
}

interface KotPreviewPrintProps {
  show: boolean;
  selectedWaiter?: string;

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
  date?: string | null;
  tableStatus?: number | null;
  order_tag?: string;
}

const KotPreviewPrint: React.FC<KotPreviewPrintProps> = ({
  show,
  selectedWaiter,
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
  onClose,
  autoPrint = false,
  selectedOutletId,
  pax,
  restaurantName,
  outletName,
  kotNote,
  orderNo,
  date,
  tableStatus
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
  const [, setLoadingSetting] = useState(true);


  const loadOutletSettings = async (outletId: number) => {
    try {
      const kotData = await fetchKotPrintSettings(outletId);
      if (kotData) {
        const newFormData = applyKotSettings(localFormData, kotData);
        setLocalFormData(newFormData);
      }
    } catch (err) {
      toast.error('Failed to load KOT print settings.');
    }
  };

  // Load outlet settings when modal opens
  useEffect(() => {
    if (!show) return;

    const outlet = selectedOutletId ?? Number(user?.outletid);
    if (!outlet || isNaN(outlet)) return;

    setOutletId(outlet);
    loadOutletSettings(outlet);
  }, [show, selectedOutletId, user]);

  // Reset hasPrinted when modal is closed
  useEffect(() => {
    if (!show) {
      setHasPrinted(false);
    }
  }, [show]);

  useEffect(() => {
    const fetchPrinterAndOutlet = async () => {
      if (!outletId) return;

      setIsLoadingNames(true);

      try {
        const printerRes = await PrintService.getKotPrinterSettings(outletId);
        const data = printerRes?.data || printerRes;
        setPrinterName(data?.printer_name || null);
      } catch (err) {
        toast.error('Failed to load printer settings.');
        setPrinterName(null);
      }

      if (!restaurantName || restaurantName.trim() === '' || restaurantName === 'Restaurant Name' ||
        !outletName || outletName.trim() === '' || outletName === 'Outlet Name') {
        try {
          const outletRes = await PrintService.getOutletDetails(outletId);
          const data = outletRes?.data || outletRes;
          if (data) {
            setLocalRestaurantName(data.brand_name || data.hotel_name || 'Restaurant Name');
            setLocalOutletName(data.outlet_name || 'Outlet Name');
          }
        } catch (error) {
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
        const printerRes = await PrintService.getKotPrinterSettings(outletId);
        const data = printerRes?.data || printerRes;
        setEnableKotPrint(Number(data?.enableKotPrint) || 0);
      } catch (err) {
        setEnableKotPrint(0);
      } finally {
        setLoadingSetting(false);
      }
    };

    fetchKotSetting();
  }, [selectedOutletId, user]);


  const generateKOTHTML = () => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>KOT</title>
  <style>

    @page {
      size: 72mm auto;
      margin: 0;
    }

    @media print {
      html, body { overflow: visible !important; }
      body { margin: 0 !important; padding: 0 !important; }
    }

    *,
    *::before,
    *::after {
      box-sizing: border-box;
    }

    html, body {
      width: 72mm !important;
      max-width: 72mm !important;
      min-width: 72mm !important;
      margin: 0;
      padding: 0;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      line-height: 1.3;
      color: #000;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      overflow-x: hidden;
    }

    /* CONTENT WRAPPER — fixed 72mm, padded inside */
    #kot-preview-content {
      width: 72mm !important;
      max-width: 72mm !important;
      min-width: 72mm !important;
      /* 6px left + 5px right — enough room so 3-digit qty never clips */
      padding: 6px 5px 6px 8px;
      margin: 0;
      font-weight: bold;
      overflow-x: hidden;
    }

    /* All children must stay within parent width */
    #kot-preview-content * {
      max-width: 100%;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }

    .center { text-align: center; }
    .right { text-align: right; }
    .bold { font-weight: bold; }
    .text-large { font-size: 14px; }
    .text-small { font-size: 10px; }
    .text-smaller { font-size: 9px; }
    .separator { border: none; border-top: 1px dashed #000; margin: 5px 0; }

    /* Grid items: never overflow, always wrap text */
    .item-row {
      display: grid;
      column-gap: 4px;
      font-weight: bold;
      border-bottom: 1px solid #000;
      padding: 3px 0;
      margin-bottom: 3px;
      align-items: start;
      width: 100%;
    }

    .item-qty {
      text-align: center;
      font-size: 12pt;
      font-weight: bold;
    }

    .item-name {
      text-align: left;
      font-size: 10pt;
      word-wrap: break-word;
      overflow-wrap: break-word;
      white-space: normal;
    }

    .item-rate {
      text-align: right;
      font-size: 10pt;
      white-space: nowrap;
    }

    .item-amt {
      text-align: right;
      font-size: 10pt;
      white-space: nowrap;
    }

    .header-row {
      display: grid;
      column-gap: 4px;
      font-weight: bold;
      border-bottom: 1px solid #000;
      padding-bottom: 4px;
      margin-bottom: 5px;
      width: 100%;
    }

    .header-qty  { text-align: center; }
    .header-item { text-align: left; }
    .header-rate { text-align: right; }
    .header-amt  { text-align: right; }

    .kot-variant {
      font-size: 9pt;
      color: #0066cc;
      font-weight: bold;
    }

    .totals-row {
      display: flex;
      justify-content: space-between;
      font-weight: bold;
      font-size: 10pt;
      padding: 2px 0;
    }

    .basic-details {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 8px;
      margin-bottom: 10px;
      font-size: 9pt;
      width: 100%;
    }

    .table-box {
      border: 1px solid #696868;
      min-width: 60px;
      min-height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14pt;
      font-weight: bold;
      padding: 4px;
    }

    .details-grid {
      display: grid;
      grid-template-columns: auto auto;
      gap: 1px 6px;
      text-align: left;
      justify-content: end;
    }

    hr.dashed {
      border: none;
      border-top: 1px dashed #000;
      margin: 6px 0;
      width: 100%;
    }

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

      if (!printerName) {
        toast.error("No KOT printer configured. Please configure printer settings.");
        return;
      }

      if (!window.electronAPI?.getInstalledPrinters) {
        toast.error("Printer functionality is only available in the desktop app.");
        setLoading(false);
        return;
      }

      const systemPrintersRaw = await window.electronAPI?.getInstalledPrinters?.() || [];
      const systemPrinters = Array.isArray(systemPrintersRaw) ? systemPrintersRaw : [];

      if (systemPrinters.length === 0) {
        toast.error("No printers detected on this system. Please check printer connections and drivers.");
        return;
      }

      const normalize = (s: string) =>
        s.toLowerCase().replace(/\s+/g, "").trim();

      const matchedPrinter = systemPrinters.find((p) =>
        normalize(p.name).includes(normalize(printerName)) ||
        normalize(p.displayName || "").includes(normalize(printerName))
      );

      let finalPrinterName: string | null = null;
      let usedFallback = false;

      if (usedFallback) {
  toast(`Printer "${printerName}" not found. Using fallback: `);
}
      

      if (matchedPrinter) {
        finalPrinterName = matchedPrinter.name;
      } else {
        const defaultPrinter = systemPrinters.find((p) => p.isDefault);
        const fallbackPrinter = defaultPrinter || systemPrinters[0];

        if (fallbackPrinter) {
          finalPrinterName = fallbackPrinter.name;
          usedFallback = true;
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

      const kotHTML = generateKOTHTML();

      if (window.electronAPI?.directPrint) {
        await window.electronAPI.directPrint(kotHTML, finalPrinterName);
        toast.success("KOT Printed Successfully!");

        if (onPrint) {
          onPrint();
        }

        if (onClose) onClose();

        setTimeout(onHide, 300);
      } else {
        toast.error("Electron print API not available.");
      }
    } catch (err) {
      toast.error("Failed to print KOT.");
    } finally {
      setLoading(false);
    }
  };

  const formatKotDateTime = (input: string | null | undefined) => {
    if (!input) {
      return new Date().toLocaleString('en-GB', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    // If input already has a timezone (ISO string with Z or +/-hh:mm), Date() conversion is correct.
    const hasTimezone = /([zZ]|[\+\-]\d{2}:?\d{2})$/.test(String(input).trim());

    if (hasTimezone) {
      return new Date(input).toLocaleString('en-GB', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    // Otherwise treat it as a business/local datetime in Asia/Kolkata (avoid UTC->IST shift showing 05:30).
    const parts = String(input).trim().replace('T', ' ').split(' ');
    const datePart = parts[0] || '';
    const timePart = parts[1] || '00:00:00';

    const [y, m, d] = datePart.includes('-') ? datePart.split('-').map(Number) : [NaN, NaN, NaN];
    const [hh, mm] = timePart.split(':').map(Number);

    if (![y, m, d, hh, mm].every((n) => Number.isFinite(n))) {
      // fallback to normal behaviour
      return new Date(input).toLocaleString('en-GB', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    const zoned = new Date(Date.UTC(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0));
    return zoned.toLocaleString('en-GB', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const dateTime = formatKotDateTime(date);



  const generateKOTContent = useMemo(() => {
    const kotItems = printItems.length > 0 ? printItems : items.filter(i => i.isNew);

    const displayRestaurantName = restaurantName || localRestaurantName || user?.hotel_name || 'Restaurant Name';
    const displayOutletName = localOutletName || outletName || user?.outlet_name || "";

    const tabKeyMap: { [key: string]: string } = {
      'Dine-in': 'dine_in',
      'Pickup': 'pickup',
      'Delivery': 'delivery',
      'Quick Bill': 'quick_bill'
    };
    const tabKey = tabKeyMap[activeTab] || 'dine_in';

    const orderTag = (() => {
      if (activeTab === 'Dine-in' && selectedTable && tableStatus !== null) {
        if (tableStatus === 0 && localFormData.show_new_order_tag) {
          return localFormData.new_order_tag_label || 'New';
        } else if ((tableStatus === 1 || tableStatus === 2) && localFormData.show_running_order_tag) {
          return localFormData.running_order_tag_label || 'Running';
        }
      }
      return '';
    })();

    const kotNoPrefix = localFormData[`${tabKey}_kot_no`] || '';
    const displayKOTNo = currentKOTNo ? `${kotNoPrefix}${currentKOTNo}` : '—';

    const showStoreName = localFormData.show_store_name;
    const showWaiter = localFormData.show_waiter && (selectedWaiter || user?.name);

    const showUsername = localFormData.show_username && user?.username;
    const showTerminalUsername = localFormData.show_terminal_username && user?.terminal_username;
    const showCaptainUsername = localFormData.show_captain_username && user?.captain_username;
    const showCustomerOnKOT = (() => {
      switch (activeTab) {
        case 'Dine-in': return localFormData.customer_on_kot_dine_in;
        case 'Pickup': return true;
        case 'Delivery': return true;
        case 'Quick Bill': return localFormData.customer_on_kot_quick_bill;
        default: return false;
      }
    })();
    const displayOption = localFormData.customer_kot_display_option ?? 'NAME_ONLY';

    const showCustomerName =
      showCustomerOnKOT &&
      !!customerName &&
      ['NAME_ONLY', 'NAME_AND_MOBILE'].includes(displayOption);

    const showCustomerMobile =
      showCustomerOnKOT &&
      !!mobileNumber &&
      localFormData.customer_kot_display_option === 'NAME_AND_MOBILE';

    const showTable = selectedTable && (activeTab === 'Dine-in' || localFormData[`table_name_${tabKey}`]) && !(activeTab === 'Quick Bill' && localFormData.hide_table_name_quick_bill);
    const showRateColumn = localFormData.show_item_price;
    const showAmountColumn = localFormData.hide_item_Amt_column;
    const showOrderTypeSymbol = localFormData.show_order_type_symbol;
    const showKotNote = localFormData.show_kot_note;
    const showOnlineOrderOtp = localFormData.show_online_order_otp;
    const showOrderIdQuickBill = localFormData.show_order_id_quick_bill && activeTab === 'Quick Bill';
    const showKotNoQuickBill = localFormData.show_kot_no_quick_bill && activeTab === 'Quick Bill';
    const showOrderNoQuickBillSection = localFormData.show_order_no_quick_bill_section && ['Pickup', 'Quick Bill', 'Delivery'].includes(activeTab);
    const modifierDefaultOption = localFormData.modifier_default_option;
    const showAlternativeItem = localFormData.show_alternative_item;
    const groupKotItemsByCategory = localFormData.group_kot_items_by_category;

    // Grid columns: Qty is fixed wider to fit 3-digit numbers, Rate/Amt fixed narrow, Item takes the rest
    // 40px qty comfortably fits "999" in Courier New at 12pt
    const qtyW = '40px';
    const rateW = '38px';
    const amtW = '42px';
    const gridCols = [
      qtyW,
      '1fr',
      ...(showRateColumn ? [rateW] : []),
      ...(showAmountColumn ? [amtW] : []),
    ].join(' ');

    return `
    <!-- STORE INFO -->
    ${showStoreName ? `
    <div style="text-align: center; margin-bottom: 8px;">
      <div style="font-weight: bold; font-size: 12pt; word-wrap: break-word;">
        ${displayRestaurantName}
      </div>
      <div style="font-size: 8pt; word-wrap: break-word;">
        ${displayOutletName}
      </div>
    </div>
    <hr class="dashed" />
    ` : ''}

    <!-- KOT HEADER -->
    <div style="text-align: center; margin-bottom: 6px; word-wrap: break-word;">
      <div><strong>${showOrderTypeSymbol ? '🔸 ' : ''}Order Type:</strong> ${activeTab}${orderTag ? ` - ${orderTag}` : ''}</div>
      ${showCustomerName ? `<div style="font-size: 9pt; margin-top: 3px;"><strong>Customer:</strong> ${customerName}</div>` : ''}
      ${showCustomerMobile ? `<div style="font-size: 9pt;"><strong>Mobile:</strong> ${mobileNumber}</div>` : ''}
    </div>

    <hr class="dashed" />

    <!-- BASIC DETAILS: Table box left, details right -->
    <div class="basic-details">
      <!-- TABLE BIG BOX -->
      <div class="table-box">
        ${showTable ? selectedTable : activeTab}
      </div>

      <!-- RIGHT DETAILS: right-aligned label/value pairs -->
      <div style="display: flex; justify-content: flex-end; align-items: flex-start;">
        <div class="details-grid">
          ${activeTab !== 'Quick Bill' || showKotNoQuickBill ? `
            <div><strong>KOT No:</strong></div><div>${displayKOTNo}</div>
          ` : ''}
          <div><strong>Date:</strong></div>
          <div style="font-size: 8pt; white-space: nowrap;">${dateTime}</div>
          ${showWaiter ? `
            <div><strong>Waiter:</strong></div>
            <div style="word-wrap: break-word; max-width: 80px;">${selectedWaiter || user?.name || 'N/A'}</div>
          ` : ''}
        </div>
      </div>
    </div>

    <!-- EXTRA FIELDS -->
    ${showUsername ? `<div style="font-size: 9pt; margin-bottom: 3px;"><strong>Username:</strong> ${user.username}</div>` : ''}
    ${showTerminalUsername ? `<div style="font-size: 9pt; margin-bottom: 3px;"><strong>Terminal:</strong> ${user.terminal_username}</div>` : ''}
    ${showCaptainUsername ? `<div style="font-size: 9pt; margin-bottom: 3px;"><strong>Captain:</strong> ${user.captain_username}</div>` : ''}
    ${showOnlineOrderOtp ? `<div style="font-size: 9pt; margin-bottom: 3px;"><strong>OTP:</strong> 123456</div>` : ''}
    ${showOrderIdQuickBill ? `<div style="font-size: 9pt; margin-bottom: 3px;"><strong>Order ID:</strong> QB-${currentKOTNo || 'N/A'}</div>` : ''}
    ${showKotNoQuickBill ? `<div style="font-size: 9pt; margin-bottom: 3px;"><strong>KOT No:</strong> ${displayKOTNo}</div>` : ''}
    ${showOrderNoQuickBillSection ? `<div style="font-size: 9pt; margin-bottom: 3px;"><strong>Order No:</strong> ${orderNo || 'N/A'}</div>` : ''}

    <hr class="dashed" />

    <!-- ITEM HEADER -->
    <div class="header-row" style="grid-template-columns: ${gridCols};">
      <div class="header-qty">Qty</div>
      <div class="header-item">Item</div>
      ${showRateColumn ? `<div class="header-rate">Rate</div>` : ''}
      ${showAmountColumn ? `<div class="header-amt">Amt</div>` : ''}
    </div>

    <!-- CATEGORY GROUP HEADER (if enabled) -->
    ${groupKotItemsByCategory ? `
    <div style="font-weight: bold; margin-bottom: 4px; font-size: 9pt;">Category: Main Course</div>
    ` : ''}

    <!-- ITEMS -->
    ${kotItems.map((item) => {
      const qty = item.originalQty ? item.qty - item.originalQty : item.qty;
      const modifierHtml = modifierDefaultOption && item.modifier && item.modifier.length > 0
        ? `<div style="font-size: 8pt; color: #444; font-weight: normal;">Mod: ${item.modifier.join(', ')}</div>`
        : '';
      const alternativeHtml = showAlternativeItem && item.alternativeItem
        ? `<div style="font-size: 8pt; color: #555; font-weight: normal;">Alt: ${item.alternativeItem}</div>`
        : '';
      const variantHtml = item.variantName
        ? `<span class="kot-variant"> (${item.variantName})</span>`
        : '';

      return `
      <div class="item-row" style="grid-template-columns: ${gridCols};">
        <div class="item-qty">${qty}</div>
        <div class="item-name">
          ${item.name}${variantHtml}
          ${modifierHtml}
          ${alternativeHtml}
        </div>
        ${showRateColumn ? `<div class="item-rate">${Number(item.price || 0)}</div>` : ''}
        ${showAmountColumn ? `<div class="item-amt">${(item.price * qty).toFixed(2)}</div>` : ''}
      </div>
      `;
    }).join('')}

    <!-- TOTALS ROW -->
    <div class="totals-row">
      <div style="min-width: ${qtyW}; text-align: center;">
        ${kotItems.reduce((a, b) => a + (b.originalQty ? b.qty - b.originalQty : b.qty), 0)}
      </div>
      <div style="flex: 1;"></div>
      ${showAmountColumn ? `
        <div style="text-align: right; white-space: nowrap;">
          &#8377;${kotItems.reduce((a, b) => a + (b.price * (b.originalQty ? b.qty - b.originalQty : b.qty)), 0).toFixed(2)}
        </div>
      ` : ''}
    </div>

    <!-- KOT NOTE -->
    ${showKotNote && kotNote ? `
    <hr class="dashed" />
    <div style="font-size: 9pt; word-wrap: break-word;"><strong>Note:</strong> ${kotNote}</div>
    ` : ''}
    `;
  }, [localFormData, printItems, items, restaurantName, localRestaurantName, user, outletName, localOutletName, activeTab, currentKOTNo, selectedTable, customerName, mobileNumber, pax]);

  if (autoPrint) {
    return null;
  }

  return (
    <Modal
      show={show}
      onHide={() => {
        onHide();
        if (onClose) onClose();
      }}
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
                  /* Preview wrapper: just enough to show the 72mm strip */
                  width: "272px",          /* 72mm ≈ 272px at 96dpi */
                  minWidth: "272px",
                  maxWidth: "272px",
                  margin: "0 auto",
                  fontFamily: "'Courier New', monospace",
                  fontSize: "11px",
                  lineHeight: "1.3",
                  color: "#000",
                  backgroundColor: "white",
                  border: "1px solid #ccc",
                  overflowX: "hidden",
                  boxSizing: "border-box",
                  paddingLeft: "8px",      /* mirror the #kot-preview-content left padding */
                  paddingRight: "5px",
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