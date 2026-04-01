import React from 'react';
import { useAuthContext } from '@/common/context/useAuthContext';
import { Modal, Button, Spinner } from 'react-bootstrap';
import { toast } from 'react-hot-toast';
import { OutletSettings } from 'src/utils/applyOutletSettings';
import { applyBillSettings } from '@/utils/applyOutletSettings';
import BillPrintService from '@/common/api/billPrint';

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
  hsn?: string;
  note?: string;
  variantId?: number; // Variant ID for variant items
  variantName?: string; // Variant name for variant items
}

interface TaxCalc {
  subtotal: number;
  cgstAmt: number;
  sgstAmt: number;
  igstAmt: number;
  grandTotal: number;
}

interface TaxRates {
  cgst: number;
  sgst: number;
  igst: number;
}

interface BillPreviewPrintProps {
  show: boolean;
  onHide: () => void;
  formData: OutletSettings;
  user: any;
  items: MenuItem[];
  selectedWaiter?: string;
  currentKOTNos?: number[];
  currentKOTNo?: number | null;
  orderNo?: string;
  selectedTable?: string | null;
  activeTab: string;
  customerName?: string;
  mobileNumber?: string;
  currentTxnId?: string;
  taxCalc: TaxCalc;
  taxRates: TaxRates;
  discount?: number;
  reason?: string;
  roundOffEnabled?: boolean;
  roundOffValue?: number;
  selectedPaymentModes?: string[];
  onPrint?: () => void;
  onClose?: () => void;
  selectedOutletId?: number | null;
  restaurantName?: string;
  outletName?: string;
  dialogClassName?: string;
  billDate?: string;
  autoPrint?: boolean;
}

const BillPreviewPrint: React.FC<BillPreviewPrintProps> = ({
  show,
  onHide,
  formData,
  user,
  items,
  selectedWaiter,
  currentKOTNos,
  currentKOTNo,
  orderNo,
  selectedTable,
  activeTab,
  customerName,
  mobileNumber,
  currentTxnId,
  taxCalc,
  taxRates,
  discount = 0,
  reason,
  roundOffEnabled = false,
  roundOffValue = 0,
  selectedPaymentModes = [],
  onPrint,
  onClose,
  selectedOutletId,
  restaurantName,
  outletName,
  dialogClassName,
  billDate,
  autoPrint
}) => {
  const [loading, setLoading] = React.useState(false);
  const [printerName, setPrinterName] = React.useState<string | null>(null);
  const [outletId, setOutletId] = React.useState<number | null>(null);
  const [localFormData, setLocalFormData] = React.useState<OutletSettings>(formData);
  const [localRestaurantName, setLocalRestaurantName] = React.useState<string>('');
  const [hasPrinted, setHasPrinted] = React.useState(false);

  // Collect all unique KOT numbers from items if currentKOTNos is not provided or empty
  const allKOTNos = React.useMemo(() => {
    if (currentKOTNos && currentKOTNos.length > 0) {
      return currentKOTNos;
    }
    const kotsFromItems = items.map(item => item.kotNo).filter(Boolean);
    return [...new Set(kotsFromItems)].sort((a, b) => (a ?? 0) - (b ?? 0));
  }, [currentKOTNos, items]);
  const [localOutletName, setLocalOutletName] = React.useState<string>('');
  const [, setIsLoadingNames] = React.useState(true);
  const { user: authUser } = useAuthContext();

  const displayRestaurantName = restaurantName || localRestaurantName || user?.hotel_name || 'Restaurant Name';
  const displayOutletName = outletName || localOutletName || user?.outlet_name || 'Outlet Name';

  // Control visibility based on backend enable flags
  const canPreviewBill = localFormData.enabled_bill_section !== false;
  const canPrintBill = localFormData.enabled_bill_section !== false;

  const loadOutletSettings = async (outletId: number) => {
    try {
      // console.log('BillPrint: Loading outlet settings for outletId:', outletId);
      const [billPreviewRes, billPrintRes] = await Promise.all([
        BillPrintService.getBillPreviewSettings(outletId),
        BillPrintService.getBillPrintSettings(outletId)
      ]);
      const billPreviewSettings = billPreviewRes?.data || billPreviewRes;
      const billPrintSettings = billPrintRes?.data || billPrintRes;
      // console.log('BillPrint: Fetched billPreviewSettings:', billPreviewSettings);
      // console.log('BillPrint: Fetched billPrintSettings:', billPrintSettings);
      const newFormData = applyBillSettings(localFormData, billPreviewSettings, billPrintSettings);
      // console.log('BillPrint: New form data after applyBillSettings:', newFormData);
      setLocalFormData(newFormData);
    } catch (err) {
      // console.error('Failed to load outlet settings', err);
    }
  };

  // Initialize with selected outlet ID or user's outlet ID or default to 1
  React.useEffect(() => {
    if (!show) return;

    const outlet = selectedOutletId ?? Number(user?.outletid) ?? 1;
    if (outlet && !isNaN(outlet)) {
      setOutletId(outlet);
      loadOutletSettings(outlet);
    }
  }, [show, user, selectedOutletId]);



  // Fetch printer settings for the outlet
  React.useEffect(() => {


    const fetchPrinter = async () => {
      if (!outletId) {
        // console.log('No outletId, skipping fetch');
        return;
      }

      // console.log('Fetching printer for outletId:', outletId);

      try {
        const res = await BillPrintService.getBillPrinterSettings(outletId);
        const data = res?.data || res;
        // console.log('API response data:', data);
        const printer = data?.printer_name || null;
        // console.log('Setting printerName to:', printer);
        setPrinterName(printer);


      } catch (err) {
        // console.error('Error fetching printer:', err);
        toast.error('Failed to load printer settings.');
        setPrinterName(null);
      }

    };


    fetchPrinter();
  }, [outletId]);

  // Fetch outlet details if restaurantName or outletName are not provided or are defaults
  React.useEffect(() => {
    const fetchOutletDetails = async () => {
      if (!outletId) return;

      setIsLoadingNames(true);

      if (!restaurantName || restaurantName.trim() === '' || restaurantName === 'Restaurant Name' ||
        !outletName || outletName.trim() === '' || outletName === 'Outlet Name') {
        try {
          const outletRes = await BillPrintService.getOutletDetails(outletId);
          const data = outletRes?.data || outletRes;
          if (data) {
            setLocalRestaurantName(data.brand_name || data.hotel_name || 'Restaurant Name');
            setLocalOutletName(data.outlet_name || 'Outlet Name');
          }
        } catch (error) {
          // console.error('Error fetching outlet details:', error);
          setLocalRestaurantName(user?.hotel_name || 'Restaurant Name');
          setLocalOutletName(user?.outlet_name || 'Outlet Name');
        }
      }

      setIsLoadingNames(false);
    };

    fetchOutletDetails();
  }, [outletId, restaurantName, outletName, user]);

  // MAIN AUTO-PRINT LOGIC (exact KOT pattern)
  React.useEffect(() => {
    if (autoPrint && show && !loading && !hasPrinted && printerName) {
      setHasPrinted(true);
      handlePrintBill();
    }
  }, [autoPrint, show, loading, hasPrinted, printerName]);

  // Reset hasPrinted when modal closes
  React.useEffect(() => {
    if (!show) {
      setHasPrinted(false);
    }
  }, [show]);

  const generateBillHTML = () => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>BILL</title>
  <style>
   @page {
  size: 80mm auto;
  margin: 0;
}

html, body {
  width: 80mm !important;
  min-width: 80mm !important;
  margin: 0;
  padding: 0;
  font-family: 'Courier New', monospace;
  font-size: 12pt;
  line-height: 1.4;
  color: #000 !important;
  -webkit-print-color-adjust: exact !important;
}

#bill-preview-content {
  width: 80mm !important;
  min-width: 80mm !important;
  margin: 0 auto;
  padding: 10px;
  box-sizing: border-box;
}

    .center { text-align: center; }
    .right { text-align: right; }
    .bold { font-weight: bold; }
    .separator { border: none; border-top: 1px dashed #000; margin: 5px 0; }
  </style>
</head>
<body>
  <div id="bill-preview-content">
    ${generateBillContent()}
  </div>
</body>
</html>
`;
  };

  const handlePrintBill = async () => {
    // console.log('Print Bill button clicked');
    // console.log('Current printerName:', printerName);
    // console.log('Current outletId:', outletId);

    try {
      setLoading(true);



      // Get system printers via Electron API (asynchronous)
      const systemPrintersRaw = await (window as any).electronAPI?.getInstalledPrinters?.() || [];
      const systemPrinters = Array.isArray(systemPrintersRaw) ? systemPrintersRaw : [];
      // console.log("System Printers:", systemPrinters);

      if (systemPrinters.length === 0) {
        toast.error("No printers detected on this system. Please check printer connections and drivers.");
        return;
      }

      const normalize = (s: string) =>
        s.toLowerCase().replace(/\s+/g, "").trim();

      // Try to match the configured printer (case-insensitive, partial match)
      let matchedPrinter = null;
      if (printerName) {
        matchedPrinter = systemPrinters.find((p: any) =>
          normalize(p.name).includes(normalize(printerName)) ||
          normalize(p.displayName || "").includes(normalize(printerName))
        );
      }

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
        } else {
          toast.error("No suitable printer found, including fallbacks.");
          return;
        }
      }

      if (!finalPrinterName) {
        toast.error("Failed to determine printer name.");
        return;
      }

      if (usedFallback) {
        // console.log("Fallback printer used");
      }

      // Generate KOT HTML for printing
      const kotHTML = generateBillHTML();

      // Print using Electron API
      if ((window as any).electronAPI?.directPrint) {
        await (window as any).electronAPI.directPrint(kotHTML, finalPrinterName);
        toast.success("Bill Printed Successfully!");

        // Call onPrint callback if provided
        if (onPrint) {
          onPrint();
        }

        // Bonus UX: auto close + hide
        if (onClose) onClose();
        setTimeout(onHide, 300);
      } else {
        toast.error("Electron print API not available.");
      }
    } catch (err) {
      // console.error("Print error:", err);
      toast.error("Failed to print KOT.");
    } finally {
      setLoading(false);
    }
  };

  const generateBillContent = (isPreview = false) => {
     // DEBUG LOGS - Remove after testing
   
    console.log('user.trn_gstno:', user?.trn_gstno);
   console.log('showAll:', 'localFormData.trn_gstno:', user.trn_gstno);
    console.log('Customer section condition:', (  localFormData.show_customer_bill || localFormData.show_customer_gst_bill) && (customerName || mobileNumber));
    console.log('localFormData keys:', Object.keys(localFormData));
    console.log('======================');
    // For preview, show all values regardless of settings
    const showAll = isPreview;

    return `
    <!-- Bill Preview Section (for printing) -->
    <div id="bill-preview-section">
      <div style="margin: 0 auto; font-family: 'Courier New', monospace; font-size: 10pt; line-height: 1.2; padding: 10px; color: #000;">
        <!-- ================= HEADER (with conditional rendering) ================= -->
        <div style="text-align: center; margin-bottom: 10px;">
          ${(showAll || localFormData.show_logo_bill) ? `<div style="font-weight: bold; font-size: 12pt; margin-bottom: 5px;">${(showAll || localFormData.show_brand_name_bill) ? displayRestaurantName : ''}</div>` : ''}
          ${(showAll || localFormData.show_outlet_name_bill) ? `<div style="font-weight: bold; font-size: 12pt; margin-bottom: 5px;">${displayOutletName}</div>` : ''}
<div style="font-size: 8pt;">${authUser?.address || user?.outlet_address || ''}</div>
${(showAll || localFormData.trn_gstno || !!user?.trn_gstno) ? `<div style="font-size: 8pt;">GST No: ${user?.trn_gstno || 'N/A'}</div>` : ''}
          ${(showAll || localFormData.email) ? `<div style="font-size: 8pt;">Email: ${localFormData.email || 'N/A'}</div>` : ''}
          ${(showAll || localFormData.website) ? `<div style="font-size: 8pt;">Website: ${localFormData.website || 'N/A'}</div>` : ''}
          ${(showAll || localFormData.show_phone_on_bill) ? `<div style="font-size: 8pt;">Phone: ${user?.outlet_phone || 'N/A'}</div>` : ''}
          
           ${(showAll || localFormData.show_item_hsn_code_bill) ? `<div>HSN: ${localFormData.hsn || 'N/A'}</div>` : ''}
           
          ${(showAll || localFormData.fssai_no) ? `<div style="font-size: 8pt;">FSSAI: ${localFormData.fssai_no || 'N/A'}</div>` : ''}
           ${(showAll || localFormData.field1) ? `<div style="font-size: 8pt;">${localFormData.field1 || 'N/A'}</div>` : ''}
         
        </div>
        <hr style="border: none; border-top: 1px dashed #000; margin: 5px 0;" />
        <!-- ============ BILL INFO (with conditional rendering) ============ -->
        <!-- Row 1: billno, table, date, time -->
        <div style="display: flex; gap: 8px; margin-bottom: 5px; font-size: 9pt;">
          <div style="flex: 1;"><strong>BillNo </strong><br />${(localFormData.dine_in_kot_no || '')}${orderNo || ''}</div>
          <div style="flex: 1;"><strong>Table </strong><br />${selectedTable || '—'}</div>
          <div style="flex: 1;"><strong>Date </strong><br />${billDate ? new Date(billDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB')}</div>
          <div style="flex: 1; white-space: nowrap;"><strong>Time </strong><br />${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</div>

        </div>
        <!-- Row 2: waiters, covers, kot no -->
        <div style="display: flex; gap: 8px; margin-bottom: 10px; font-size: 9pt;">
          <div style="flex: 1;"><strong>Waiter </strong><br />${selectedWaiter || user?.name || 'N/A'}</div>
          <div style="flex: 1;"><strong>Covers </strong><br />N/A</div>
          <div style="flex: 1; white-space: nowrap;"><strong>KOT No </strong><br />${allKOTNos.length > 0 ? allKOTNos.join(", ") : (currentKOTNo || "—")}</div>
          <div style="flex: 1;"></div>
        </div>
       ${(showAll || localFormData.show_customer_bill) && (customerName || mobileNumber) ? `
  <hr style="border: none; border-top: 1px dashed #000; margin: 5px 0;" />
  <div style="font-size: 9pt; margin-bottom: 8px;">
    ${customerName ? `<div><strong>Customer:</strong> ${customerName}</div>` : ''}
    ${mobileNumber ? `<div><strong>Mobile:</strong> ${mobileNumber}</div>` : ''}
    ${(showAll || localFormData.show_customer_gst_bill) ? `<div><strong>GSTIN:</strong> N/A</div>` : ''}
    ${(showAll || (activeTab === 'Pickup' && localFormData.show_customer_address_pickup_bill)) ? `<div><strong>Address:</strong> N/A</div>` : ''}
  </div>
` : ''}
        ${(showAll || ((activeTab === 'Dine-in' && localFormData.order_type_dine_in) || (activeTab === 'Pickup' && localFormData.order_type_pickup) || (activeTab === 'Delivery' && localFormData.order_type_delivery) || (activeTab === 'Quick Bill' && localFormData.order_type_quick_bill))) ? `
          <hr style="border: none; border-top: 1px dashed #000; margin: 5px 0;" />
          <div style="text-align: center; font-weight: bold; font-size: 10pt; margin-bottom: 5px;">
            ${activeTab === 'Dine-in' && (showAll || localFormData.bill_title_dine_in) ? 'Dine-In Bill' : ''}
            ${activeTab === 'Pickup' && (showAll || localFormData.bill_title_pickup) ? 'Pickup Bill' : ''}
            ${activeTab === 'Delivery' && (showAll || localFormData.bill_title_delivery) ? 'Delivery Bill' : ''}
            ${activeTab === 'Quick Bill' && (showAll || localFormData.bill_title_quick_bill) ? 'Quick Bill' : ''}
          </div>
        ` : ''}
        <hr style="border: none; border-top: 1px dashed #000; margin: 5px 0;" />
        <!-- ============ ITEMS TABLE (with conditional rendering) ============ -->
        <div style="margin-bottom: 10px;">
          <div style="display: grid; grid-template-columns: ${(showAll || localFormData.print_bill_both_languages) ? '3fr' : '2fr'} ${(showAll || !localFormData.hide_item_quantity_column) ? '30px' : ''} ${(showAll || !localFormData.hide_item_rate_column) ? '40px' : ''} ${(showAll || !localFormData.hide_item_total_column) ? '50px' : ''}; gap: 5px; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 2px; margin-bottom: 5px; font-size: 9pt;">
            <div>${(showAll || (localFormData.show_alt_item_title_bill && localFormData.print_bill_both_languages)) ? 'Item' : 'Description'}</div>
            ${(showAll || !localFormData.hide_item_quantity_column) ? '<div style="text-align: right;">Qty</div>' : ''}
            ${(showAll || !localFormData.hide_item_rate_column) ? '<div style="text-align: right;">Rate</div>' : ''}
            ${(showAll || !localFormData.hide_item_total_column) ? '<div style="text-align: right;">Amount</div>' : ''}
          </div>
          ${Object.values(items.filter(i => i.qty > 0).reduce((acc: any, item: any) => {
        const key = (showAll || localFormData.show_items_sequence_bill)
          ? `${item.id}-${item.variantId || 0}-${item.price}`
          : `${item.id}-${item.variantId || 0}`;

        if (!acc[key]) {
          acc[key] = { ...item, qty: 0 };
        }

        acc[key].qty += item.qty;

        return acc;
      }, {})).map((item: any, index: number) => `
            <div style="display: grid; grid-template-columns: ${(showAll || localFormData.print_bill_both_languages) ? '3fr' : '2fr'} ${(showAll || !localFormData.hide_item_quantity_column) ? '30px' : ''} ${(showAll || !localFormData.hide_item_rate_column) ? '40px' : ''} ${(showAll || !localFormData.hide_item_total_column) ? '50px' : ''}; gap: 5px; padding: 2px 0; font-size: 9pt;">
              <div>
               ${item.name} ${item.variantName ? `<span style="font-size:8pt; color:#0066cc; font-weight:bold;">(${item.variantName})</span>` : ''}
                ${(showAll || (localFormData.print_bill_both_languages && localFormData.show_alt_name_bill && item.alternativeItem)) ? ` / ${item.alternativeItem || 'N/A'}` : ''}
                ${(showAll || (localFormData.show_item_note_bill && item.note)) ? `<div style="font-size: 8pt; color: #6c757d;">${item.note || 'N/A'}</div>` : ''}
                ${(showAll || (localFormData.modifier_default_option_bill && item.modifier)) ? `<div style="font-size: 8pt; color: #6c757d;">${item.modifier ? item.modifier.join(', ') : 'N/A'}</div>` : ''}
               
              </div>
              ${(showAll || !localFormData.hide_item_quantity_column) ? `<div style="text-align: right;">${item.qty}</div>` : ''}
              ${(showAll || !localFormData.hide_item_rate_column) ? `<div style="text-align: right;">${item.price.toFixed(2)}</div>` : ''}
              ${(showAll || !localFormData.hide_item_total_column) ? `<div style="text-align: right;">${(item.qty * item.price).toFixed(2)}</div>` : ''}
            </div>
          `).join('')}
        </div>
        <hr style="border: none; border-top: 1px dashed #000; margin: 5px 0;" />
        <!-- ================= TOTALS (with conditional rendering) ================= -->
       <div style="text-align: right; font-size: 9pt; margin-bottom: 5px; font-family: monospace;">

  ${(showAll || !localFormData.hide_total_without_tax) ? `
  <div style="display:grid; grid-template-columns:auto 4px 55px; justify-content:end; column-gap:4px">
    <span>Subtotal</span>
    <span style="text-align:center;">:</span>
    <span style="text-align:right;">₹${taxCalc.subtotal.toFixed(2)}</span>
  </div>` : ''}

  ${discount > 0 ? `
  <div style="display:grid; grid-template-columns:auto 4px 55px; justify-content:end; column-gap:4px">
    <span>Discount</span>
    <span style="text-align:center;">:</span>
    <span style="text-align:right;">-₹${discount.toFixed(2)}</span>
  </div>

  ${(showAll || (localFormData.show_discount_reason_bill && reason)) ? `
  <div style="font-size: 8pt;">(${reason || 'N/A'})</div>` : ''}
  ` : ''}

  ${(showAll || localFormData.show_tax_charge_bill) ? `
  <div style="display:grid; grid-template-columns:auto 4px 55px; justify-content:end; column-gap:4px">
    <span><strong>Taxable Value</strong></span>
    <span style="text-align:center;">:</span>
    <span style="text-align:right;">₹${(taxCalc.subtotal - discount).toFixed(2)}</span>
  </div>

  ${taxCalc.cgstAmt > 0 ? `
  <div style="display:grid; grid-template-columns:auto 4px 55px; justify-content:end; column-gap:4px">
    <span>CGST @${taxRates.cgst}%</span>
    <span style="text-align:center;">:</span>
    <span style="text-align:right;">₹${taxCalc.cgstAmt.toFixed(2)}</span>
  </div>` : ''}

  ${taxCalc.sgstAmt > 0 ? `
  <div style="display:grid; grid-template-columns:auto 4px 55px; justify-content:end; column-gap:4px">
    <span>SGST @${taxRates.sgst}%</span>
    <span style="text-align:center;">:</span>
    <span style="text-align:right;">₹${taxCalc.sgstAmt.toFixed(2)}</span>
  </div>` : ''}

  ${taxCalc.igstAmt > 0 ? `
  <div style="display:grid; grid-template-columns:auto 4px 55px; justify-content:end; column-gap:4px;">
    <span>IGST @${taxRates.igst}%</span>
    <span style="text-align:center;">:</span>
    <span style="text-align:right;">₹${taxCalc.igstAmt.toFixed(2)}</span>
  </div>` : ''}
  ` : ''}

  ${roundOffEnabled && roundOffValue !== 0 ? `
  <div style="display:grid; grid-template-columns:auto 4px 55px; justify-content:end; column-gap:4px">
    <span>Round Off</span>
    <span style="text-align:center;">:</span>
    <span style="text-align:right;">
      ${roundOffValue > 0 ? '+' : ''}₹${roundOffValue.toFixed(2)}
    </span>
  </div>` : ''}

  ${(showAll || localFormData.field2) ? `<div style="font-size: 8pt;">${localFormData.field2 || 'N/A'}</div>` : ''}
  ${(showAll || localFormData.field3) ? `<div style="font-size: 8pt;">${localFormData.field3 || 'N/A'}</div>` : ''}
  ${(showAll || localFormData.field4) ? `<div style="font-size: 8pt;">${localFormData.field4 || 'N/A'}</div>` : ''}

  <div style="font-weight: bold; font-size: 10pt; border-top: 1px solid #000; padding-top: 5px;">
    GRAND TOTAL: ₹${taxCalc.grandTotal.toFixed(2)}
  </div>

</div>
          
          ${(showAll || localFormData.show_bill_amount_words) ? '<div>In Words: {/* TODO: Function to convert number to words needed */}</div>' : ''}
          ${(showAll || localFormData.show_customer_paid_amount) ? `<div>Paid: ₹${taxCalc.grandTotal.toFixed(2)}</div>` : ''}
          ${(showAll || localFormData.show_due_amount_bill) && localFormData.due > 0 ? `<div>Due: ₹${localFormData.due.toFixed(2)}</div>` : ''}

        </div>
        ${(showAll || (localFormData.show_order_note_bill && localFormData.note)) ? `<div style="text-align: center; font-size: 8pt; margin-top: 5px;">${localFormData.note || 'N/A'}</div>` : ''}
        ${(showAll || (((activeTab === 'Dine-in' && localFormData.payment_mode_dine_in) || (activeTab === 'Pickup' && localFormData.payment_mode_pickup) || (activeTab === 'Delivery' && localFormData.payment_mode_delivery) || (activeTab === 'Quick Bill' && localFormData.payment_mode_quick_bill)) && localFormData.show_default_payment)) ? `
          <hr style="border: none; border-top: 1px dashed #000; margin: 5px 0;" />
          <div style="text-align: center; font-size: 9pt;">Payment Mode: ${selectedPaymentModes.join(', ') || 'Cash'}</div>
        ` : ''}
        <!-- QR Codes -->
        ${(showAll || localFormData.show_custom_qr_codes_bill) ? '<div>{/* Custom QR Code Image */}</div>' : ''}
        ${(showAll || localFormData.show_ebill_invoice_qrcode) ? '<div>{/* E-bill QR Code Image */}</div>' : ''}
        ${(showAll || localFormData.show_zatca_invoice_qr) ? '<div>{/* ZATCA QR Code Image */}</div>' : ''}
        <hr style="border: none; border-top: 1px dashed #000; margin: 5px 0;" />
        <div style="text-align: center; font-size: 8pt; margin-top: 10px;">
          ${localFormData.footer_note || 'STAY SAFE, STAY HEALTHY'}
        </div>
      </div>
    </div>
    `;
  };

  if (autoPrint) {
    return null;
  }

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="lg"
      centered
      backdrop="static"
      dialogClassName={dialogClassName}
    >
      <Modal.Header closeButton>
        <Modal.Title>Bill Preview & Print</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: "70vh", overflowY: "auto" }}>
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Loading printer settings...</p>
          </div>
        ) : (
          <div>
            {/* Preview Section - only show if enabled */}
            {canPreviewBill && (
              <div className="border  mb-3 bg-light">
                <div
                  style={{
                    width: "80mm",
                    margin: "0 auto",
                    fontFamily: "'Courier New', monospace",
                    fontSize: "10px",
                    lineHeight: "1.2",
                    padding: "10px",
                    color: "#000",
                    backgroundColor: "white",
                    border: "1px solid #ccc"
                  }}
                  dangerouslySetInnerHTML={{ __html: generateBillContent(false) }}
                />
              </div>
            )}

          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
        <Button
          variant="primary"
          onClick={handlePrintBill}
          disabled={loading || !canPrintBill}
        >
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Printing...
            </>
          ) : (
            "Print Bill"
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default BillPreviewPrint;
