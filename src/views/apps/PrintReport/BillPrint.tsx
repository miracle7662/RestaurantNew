import React from 'react'
import { Modal, Button, Spinner } from 'react-bootstrap'
import { toast } from 'react-hot-toast'
import { OutletSettings } from 'src/utils/applyOutletSettings'
import { applyBillSettings } from '@/utils/applyOutletSettings'
import BillPrintService from '@/common/api/billPrint'
import { useAuthContext } from '@/common/context/useAuthContext'
import HotelService from '@/common/api/hotels'  // ✅ Import for logo fetching

// ─────────────────────────────────────────────────────────────────────────────
// Type Definitions (keep exactly as in original)
// ─────────────────────────────────────────────────────────────────────────────
interface MenuItem {
  id: number
  name: string
  price: number
  qty: number
  isBilled: number
  isNCKOT: number
  NCName: string
  NCPurpose: string
  table_name?: string
  isNew?: boolean
  alternativeItem?: string
  modifier?: string[]
  item_no?: number
  originalQty?: number
  kotNo?: number
  txnDetailId?: number
  isReverse?: boolean
  revQty?: number
  hsn?: string
  note?: string
  variantId?: number
  variantName?: string
}

interface TaxCalc {
  subtotal: number
  TaxableValue?: number
  cgstAmt: number
  sgstAmt: number
  igstAmt: number
  grandTotal: number
}

interface TaxRates {
  cgst: number
  sgst: number
  igst: number
}

interface BillPreviewPrintProps {
  show: boolean
  onHide: () => void
  formData: OutletSettings
  user: any
  items: MenuItem[]
  selectedWaiter?: string
  currentKOTNos?: number[]
  currentKOTNo?: number | null
  orderNo?: string
  txnNo?: string
  selectedTable?: string | null
  activeTab: string
  customerName?: string
  mobileNumber?: string
  currentTxnId?: string
  taxCalc: TaxCalc
  taxRates: TaxRates
  discount?: number
  reason?: string
  roundOffEnabled?: boolean
  roundOffValue?: number
  selectedPaymentModes?: string[]
  onPrint?: () => void
  onClose?: () => void
  selectedOutletId?: number | null
  restaurantName?: string
  outletName?: string
  dialogClassName?: string
  billDate?: string
  autoPrint?: boolean
  billData?: any
  departmentName?: string
}


// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
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
  txnNo,
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
  autoPrint,
  billData,
  departmentName,
}) => {
  // ─── Auth context ──────────────────────────────────────────────────────────
  const {
    billSettings,
    billSettingsLoading: contextSettingsLoading,
    fetchBillSettings,
    user: authUser,
  } = useAuthContext()

  const businessCurrDate = (authUser as any)?.currDate || undefined

  // ─── Local state ───────────────────────────────────────────────────────────
  const [loading, setLoading] = React.useState(false)
  const [printerName, setPrinterName] = React.useState<string | null>(null)
  const [outletId, setOutletId] = React.useState<number | null>(null)
  const [hasPrinted, setHasPrinted] = React.useState(false)
  const [localRestaurantName, setLocalRestaurantName] = React.useState('')
  const [localOutletName, setLocalOutletName] = React.useState('')
  const [hotelLogoUrl, setHotelLogoUrl] = React.useState<string | null>(null)   // ✅ Logo state

  // ─── FormData with bill settings ───────────────────────────────────────────
  const [localFormData, setLocalFormData] = React.useState<OutletSettings>(() =>
    billSettings
      ? applyBillSettings(formData, billSettings.preview, billSettings.print)
      : formData,
  )

  React.useEffect(() => {
    if (billSettings) {
      setLocalFormData(applyBillSettings(formData, billSettings.preview, billSettings.print))
    }
  }, [billSettings, formData])

  // ─── Derived display values ────────────────────────────────────────────────
  const displayRestaurantName =
    restaurantName || localRestaurantName || user?.hotel_name || 'Restaurant Name'
  const displayOutletName =
    outletName || localOutletName || user?.outlet_name || 'Outlet Name'

  const canPreviewBill = localFormData.enabled_bill_section !== false
  const canPrintBill = localFormData.enabled_bill_section !== false

  const allKOTNos = React.useMemo(() => {
    if (currentKOTNos && currentKOTNos.length > 0) return currentKOTNos
    const kotsFromItems = items.map((item) => item.kotNo).filter(Boolean) as number[]
    return [...new Set(kotsFromItems)].sort((a, b) => a - b)
  }, [currentKOTNos, items])

  // ─── Outlet settings fetch ─────────────────────────────────────────────────
  React.useEffect(() => {
    if (!show) return
    const outlet = selectedOutletId ?? Number(user?.outletid) ?? 1
    if (!outlet || isNaN(outlet)) return
    setOutletId(outlet)
    const defaultOutlet = Number(user?.outletid) ?? 1
    if (outlet !== defaultOutlet || !billSettings) {
      fetchBillSettings(outlet)
    }
  }, [show, selectedOutletId, user, billSettings, fetchBillSettings])

  React.useEffect(() => {
    if (!show) setHasPrinted(false)
  }, [show])

  // ─── Printer settings ──────────────────────────────────────────────────────
  React.useEffect(() => {
    const fetchPrinter = async () => {
      if (!outletId) return
      try {
        const res = await BillPrintService.getBillPrinterSettings(outletId)
        const data = res?.data || res
        setPrinterName(data?.printer_name || null)
      } catch {
        toast.error('Failed to load printer settings.')
        setPrinterName(null)
      }
    }
    fetchPrinter()
  }, [outletId])

  // ─── Outlet display names ──────────────────────────────────────────────────
  React.useEffect(() => {
    const fetchOutletDetails = async () => {
      if (!outletId) return
      const needsName =
        !restaurantName || restaurantName.trim() === '' || restaurantName === 'Restaurant Name'
      const needsOutlet =
        !outletName || outletName.trim() === '' || outletName === 'Outlet Name'
      if (!needsName && !needsOutlet) return
      try {
        const res = await BillPrintService.getOutletDetails(outletId)
        const data = res?.data || res
        if (data) {
          setLocalRestaurantName(data.brand_name || data.hotel_name || 'Restaurant Name')
          setLocalOutletName(data.outlet_name || 'Outlet Name')
        }
      } catch {
        setLocalRestaurantName(user?.hotel_name || 'Restaurant Name')
        setLocalOutletName(user?.outlet_name || 'Outlet Name')
      }
    }
    fetchOutletDetails()
  }, [outletId, restaurantName, outletName, user])

  // ─── Helper: Build API base URL (same as HttpClient) ───────────────────────
  const getApiBaseUrl = React.useCallback(() => {
    try {
      const savedConfig = localStorage.getItem('posServerConfig')
      if (savedConfig) {
        const cfg = JSON.parse(savedConfig)
        return `http://${cfg.serverIP || 'localhost'}:${cfg.port || 3001}/api`
      }
    } catch { }
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL
    if (window.location.protocol === 'file:') return 'http://localhost:3001/api'
    return `${window.location.protocol}//${window.location.hostname}:3001/api`
  }, [])

  // ─── Helper: Build server base URL (no /api) for static files ───────────
  const getServerBaseUrl = React.useCallback(() => {
    try {
      const savedConfig = localStorage.getItem('posServerConfig')
      if (savedConfig) {
        const cfg = JSON.parse(savedConfig)
        return `http://${cfg.serverIP || 'localhost'}:${cfg.port || 3001}`
      }
    } catch { }

    const viteApiUrl = import.meta.env.VITE_API_URL as string | undefined
    if (viteApiUrl) {
      // VITE_API_URL usually ends with /api; strip it.
      return viteApiUrl.replace(/\/api\/?$/, '')
    }

    if (window.location.protocol === 'file:') return 'http://localhost:3001'
    return `${window.location.protocol}//${window.location.hostname}:3001`
  }, [])

  // ─── Normalize logo URL (relative/absolute → absolute URL) ─────────────────
  const normalizeLogoUrl = React.useCallback((logo: any): string | null => {
    if (!logo) return null
    if (typeof logo === 'string') {
      if (
        logo.startsWith('http://') ||
        logo.startsWith('https://') ||
        logo.startsWith('data:')
      ) {
        return logo
      }

      // Backend stores logo as something like: /uploads/brands/<filename>
      // Backend serves static files from: /uploads
      const base = getServerBaseUrl()
      const cleanPath = logo.startsWith('/') ? logo.slice(1) : logo
      return `${base}/${cleanPath}`
    }
    if (logo instanceof Uint8Array) {
      try {
        const base64 = btoa(String.fromCharCode(...logo))
        return `data:image/png;base64,${base64}`
      } catch {
        return null
      }
    }
    return null
  }, [getServerBaseUrl, getApiBaseUrl])


  // ─── Fetch hotel logo when modal opens ─────────────────────────────────────
  React.useEffect(() => {
    const fetchHotelLogo = async () => {
      const hotelid = (user as any)?.hotelid ?? (user as any)?.hotelId
      if (!hotelid || isNaN(Number(hotelid))) {
        setHotelLogoUrl(null)
        return
      }
      try {
        const res = await HotelService.get(hotelid)
        const data = res?.data || res
        const rawLogo = data?.Logo ?? data?.Logo ?? null
        const normalized = normalizeLogoUrl(rawLogo)
        setHotelLogoUrl(normalized)
      } catch (err) {
        console.error('Failed to fetch hotel logo:', err)
        setHotelLogoUrl(null)
      }
    }
    if (show) fetchHotelLogo()
  }, [show, user, normalizeLogoUrl])

  // ─── Auto-print logic ──────────────────────────────────────────────────────
  React.useEffect(() => {
    if (autoPrint && show && !loading && !hasPrinted && printerName) {
      setHasPrinted(true)
      handlePrintBill()
    }
  }, [autoPrint, show, loading, hasPrinted, printerName])

  // ─── HTML generation ───────────────────────────────────────────────────────
  const generateBillHTML = () => `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>BILL</title>
  <style>
    @page { size: 80mm auto; margin: 0; }
    @media print { html, body { overflow: visible !important; } }
    html, body {
      width: 80mm !important;
      min-width: 80mm !important;
      margin: 0; padding: 0;
      font-family: 'Courier New', monospace;
      font-size: 12pt; line-height: 1.4;
      color: #000 !important;
      -webkit-print-color-adjust: exact !important;
    }
    #bill-preview-content {
      width: 80mm !important; min-width: 80mm !important;
      margin: 0 auto; padding: 10px; box-sizing: border-box;
    }
    .center { text-align: center; }
    .right  { text-align: right; }
    .bold   { font-weight: bold; }
    .separator { border: none; border-top: 1px dashed #000; margin: 5px 0; }
  </style>
</head>
<body>
  <div id="bill-preview-content">${generateBillContent()}</div>
</body>
</html>`

  const generateBillContent = (isPreview = false) => {
    const safePrice = (p: any): number => Number(p) || 0

    // IMPORTANT:
    // When rendering PREVIEW, we should respect only preview-enabled sections,
    // not force-show everything using `showAll`.
    const showAll = false
    const showLogo = localFormData.show_logo_bill !== false && !!hotelLogoUrl

    const formatAmount = (val: number) => {
      return Number.isInteger(val) ? val.toString() : val.toFixed(2).replace(/\.00$/, '')
    }

    return `
<div id="bill-preview-section">
<div style="margin:0 auto;font-family:'Courier New',monospace;font-size:12pt;line-height:1.2;padding:10px;color:#000;font-weight:bold;">

  <!-- HEADER -->
  <div style="text-align:center;margin-bottom:10px;">

    ${showLogo ? `
    <div style="text-align:center;margin-bottom:4px;">
      <img src="${hotelLogoUrl}" alt="Hotel Logo" style="max-width:70px;max-height:40px;object-fit:contain;display:inline-block;" onerror="this.style.display='none'" />
    </div>` : ''}

    <div style="font-weight:bold;font-size:14pt;margin-bottom:2px;">
      ${billData?.hotelName || displayRestaurantName || ''}
    </div>

    <div style="font-weight:bold;font-size:10pt;margin-bottom:2px;">
      ${billData?.outletName || displayOutletName || ''}
    </div>

    <div style="font-size:8pt;">
      ${billData?.address || user?.address || ''}
    </div>

    <div style="font-size:8pt;">
      GST No: ${billData?.gstNo || user?.trn_gstno || 'N/A'}
    </div>

    <div style="font-size:8pt;">
      Phone: ${billData?.phone || 'N/A'}
    </div>

    <div style="font-size:8pt;">
      FSSAI: ${billData?.fssaiNo || 'N/A'}
    </div>

    ${(showAll || localFormData.email) ? `<div style="font-size:8pt;">Email: ${localFormData.email || 'N/A'}</div>` : ''}
    ${(showAll || localFormData.website) ? `<div style="font-size:8pt;">Website: ${localFormData.website || 'N/A'}</div>` : ''}
    ${(showAll || localFormData.show_item_hsn_code_bill) ? `<div>HSN: ${localFormData.hsn || 'N/A'}</div>` : ''}
    ${(showAll || localFormData.field1) ? `<div style="font-size:8pt;">${localFormData.field1 || 'N/A'}</div>` : ''}
  </div>

  <hr style="border:none;border-top:1px dashed #000;margin:5px 0;" />

  <!-- BILL INFO -->
  <div style="display:flex;gap:8px;margin-bottom:5px;font-size:9pt;">
<div style="flex:1;">
  <strong>BillNo</strong><br />
  ${(billData?.txnNo || '').toString()}
</div>
    <div style="flex:1;"><strong>Date</strong><br />${billDate ? new Date(billDate).toLocaleDateString('en-GB') : (businessCurrDate ? new Date(businessCurrDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'))}</div>
    <div style="flex:1;white-space:nowrap;"><strong>Time</strong><br />${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</div>
  </div>
  <div style="display:flex;gap:8px;margin-bottom:10px;font-size:9pt;">
    <div style="flex:1;"><strong>Table</strong><br />${selectedTable || '—'}</div>
    <div style="flex:1;"><strong>Waiter</strong><br />${selectedWaiter || user?.name || 'N/A'}</div>
    <div style="flex:1;font-size:7pt;"><strong>Covers</strong><br />N/A</div>
    <div style="flex:1;white-space:nowrap;"><strong>KOT No</strong><br />${allKOTNos.length > 0 ? allKOTNos.join(', ') : currentKOTNo || '—'}</div>
    <div style="flex:1;"></div>
  </div>

  ${(showAll || localFormData.show_customer_bill) && (customerName || mobileNumber) ? `
  <hr style="border:none;border-top:1px dashed #000;margin:5px 0;" />
  <div style="font-size:9pt;margin-bottom:8px;">
    ${customerName ? `<div><strong>Customer:</strong> ${customerName}</div>` : ''}
    ${mobileNumber ? `<div><strong>Mobile:</strong> ${mobileNumber}</div>` : ''}
    ${(showAll || localFormData.show_customer_gst_bill) ? `<div><strong>GSTIN:</strong> N/A</div>` : ''}
    ${(showAll || (activeTab === 'Pickup' && localFormData.show_customer_address_pickup_bill)) ? `<div><strong>Address:</strong> N/A</div>` : ''}
  </div>` : ''}

  ${(showAll || (
        (activeTab === 'Dine-in' && localFormData.order_type_dine_in) ||
        (activeTab === 'Pickup' && localFormData.order_type_pickup) ||
        (activeTab === 'Delivery' && localFormData.order_type_delivery) ||
        (activeTab === 'Quick Bill' && localFormData.order_type_quick_bill)
      )) ? `
  <hr style="border:none;border-top:1px dashed #000;margin:5px 0;" />
  <div style="display:flex;justify-content:space-between;gap:8px;font-weight:bold;font-size:12pt;margin-bottom:5px;">
    <div style="text-align:left;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:45%;">
  ${activeTab === 'Pickup' || activeTab === 'Delivery'
        ? ` ${(billData?.orderNo || '').toString().replace(/^DIN-/, '')}`
        : (departmentName ? ` ${departmentName}` : '')}
</div>
    <div style="text-align:right;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:55%;">
      ${activeTab === 'Dine-in' && (showAll || localFormData.bill_title_dine_in) ? 'Dine-In Bill' : ''}
      ${activeTab === 'Pickup' && (showAll || localFormData.bill_title_pickup) ? 'Pickup Bill' : ''}
      ${activeTab === 'Delivery' && (showAll || localFormData.bill_title_delivery) ? 'Delivery Bill' : ''}
      ${activeTab === 'Quick Bill' && (showAll || localFormData.bill_title_quick_bill) ? 'Quick Bill' : ''}
    </div>
  </div>` : ''}

  <hr style="border:none;border-top:1px dashed #000;margin:5px 0;" />

  <!-- ITEMS TABLE -->
  <div style="margin-bottom:10px;">
    <div style="display:grid;
      grid-template-columns:
        ${(showAll || localFormData.print_bill_both_languages) ? '3fr' : '2fr'}
        ${(showAll || !localFormData.hide_item_quantity_column) ? '30px' : ''}
        ${(showAll || !localFormData.hide_item_rate_column) ? '40px' : ''}
        ${(showAll || !localFormData.hide_item_total_column) ? '50px' : ''};
      gap:5px;font-weight:bold;border-bottom:1px solid #000;
      padding-bottom:2px;margin-bottom:5px;font-size:9pt;">
      <div>${(showAll || (localFormData.show_alt_item_title_bill && localFormData.print_bill_both_languages)) ? 'Item' : 'Description'}</div>
      ${(showAll || !localFormData.hide_item_quantity_column) ? '<div style="text-align:right;">Qty</div>' : ''}
      ${(showAll || !localFormData.hide_item_rate_column) ? '<div style="text-align:right;">Rate</div>' : ''}
      ${(showAll || !localFormData.hide_item_total_column) ? '<div style="text-align:right;">Amount</div>' : ''}
    </div>

    ${(Object.values(
          items.filter((i) => i.qty > 0).reduce((acc: any, item: any) => {
            const key = (showAll || localFormData.show_items_sequence_bill)
              ? `${item.id}-${item.variantId || 0}-${item.price}`
              : `${item.id}-${item.variantId || 0}`
            if (!acc[key]) acc[key] = { ...item, qty: 0 }
            acc[key].qty += item.qty
            return acc
          }, {}),
        ) as any[]).map((item) => `
      <div style="display:grid;
        grid-template-columns:
          ${(showAll || localFormData.print_bill_both_languages) ? '3fr' : '2fr'}
          ${(showAll || !localFormData.hide_item_quantity_column) ? '30px' : ''}
          ${(showAll || !localFormData.hide_item_rate_column) ? '40px' : ''}
          ${(showAll || !localFormData.hide_item_total_column) ? '50px' : ''};
        gap:5px;padding:2px 0;font-size:9pt;">
        <div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
          ${item.name}
          ${item.variantName ? `<span style="font-size:8pt;color:#0066cc;font-weight:bold;">(${item.variantName})</span>` : ''}
          ${(showAll || (localFormData.print_bill_both_languages && localFormData.show_alt_name_bill && item.alternativeItem)) ? ` / ${item.alternativeItem || 'N/A'}` : ''}
          ${(showAll || (localFormData.show_item_note_bill && item.note)) ? `<div style="font-size:8pt;color:#6c757d;">${item.note || 'N/A'}</div>` : ''}
          ${(showAll || (localFormData.modifier_default_option_bill && item.modifier)) ? `<div style="font-size:8pt;color:#6c757d;">${item.modifier ? item.modifier.join(', ') : 'N/A'}</div>` : ''}
        </div>
        ${(showAll || !localFormData.hide_item_quantity_column) ? `<div style="text-align:right;">${item.qty}</div>` : ''}
        ${(showAll || !localFormData.hide_item_rate_column) ? `<div style="text-align:right;">${formatAmount(safePrice(item.price))}</div>` : ''}
        ${(showAll || !localFormData.hide_item_total_column) ? `<div style="text-align:right;">${formatAmount(item.qty * safePrice(item.price))}</div>` : ''}
      </div>`).join('')}
  </div>

  <hr style="border:none;border-top:1px dashed #000;margin:5px 0;" />

  <!-- TOTALS -->
  <div style="text-align:right;font-size:9pt;margin-bottom:5px;font-family:monospace;">
    ${(showAll || !localFormData.hide_total_without_tax) ? `
    <div style="display:grid;grid-template-columns:auto 4px 55px;justify-content:end;column-gap:4px;">
      <span>Subtotal</span><span style="text-align:center;">:</span>
      <span style="text-align:right;">₹${taxCalc.subtotal.toFixed(2)}</span>
    </div>` : ''}

    ${discount > 0 ? `
    <div style="display:grid;grid-template-columns:auto 4px 55px;justify-content:end;column-gap:4px;">
      <span>Discount</span><span style="text-align:center;">:</span>
      <span style="text-align:right;">₹${discount.toFixed(2)}</span>
    </div>
    ${(showAll || (localFormData.show_discount_reason_bill && reason)) ? `<div style="font-size:8pt;">(${reason || 'N/A'})</div>` : ''}` : ''}

    <div style="display:grid;grid-template-columns:auto 4px 55px;justify-content:end;column-gap:4px;">
      <span><strong>Taxable Value</strong></span>
      <span style="text-align:center;">:</span>
      <span style="text-align:right;">₹${(billData?.TaxableValue ?? taxCalc.TaxableValue ?? (taxCalc.subtotal - discount)).toFixed(2)}</span>
    </div>

    ${taxCalc.cgstAmt > 0 ? `
    <div style="display:grid;grid-template-columns:auto 4px 55px;justify-content:end;column-gap:4px;">
      <span>CGST @${taxRates.cgst}%</span>
      <span style="text-align:center;">:</span>
      <span style="text-align:right;">₹${taxCalc.cgstAmt.toFixed(2)}</span>
    </div>` : ''}

    ${taxCalc.sgstAmt > 0 ? `
    <div style="display:grid;grid-template-columns:auto 4px 55px;justify-content:end;column-gap:4px;">
      <span>SGST @${taxRates.sgst}%</span>
      <span style="text-align:center;">:</span>
      <span style="text-align:right;">₹${taxCalc.sgstAmt.toFixed(2)}</span>
    </div>` : ''}

    ${taxCalc.igstAmt > 0 ? `
    <div style="display:grid;grid-template-columns:auto 4px 55px;justify-content:end;column-gap:4px;">
      <span>IGST @${taxRates.igst}%</span>
      <span style="text-align:center;">:</span>
      <span style="text-align:right;">₹${taxCalc.igstAmt.toFixed(2)}</span>
    </div>` : ''}

    ${roundOffEnabled && roundOffValue !== 0 ? `
    <div style="display:grid;grid-template-columns:auto 4px 55px;justify-content:end;column-gap:4px;">
      <span>Round Off</span><span style="text-align:center;">:</span>
      <span style="text-align:right;">${roundOffValue > 0 ? '+' : ''}₹${roundOffValue.toFixed(2)}</span>
    </div>` : ''}

    ${(showAll || localFormData.field2) ? `<div style="font-size:8pt;">${localFormData.field2 || 'N/A'}</div>` : ''}
    ${(showAll || localFormData.field3) ? `<div style="font-size:8pt;">${localFormData.field3 || 'N/A'}</div>` : ''}
    ${(showAll || localFormData.field4) ? `<div style="font-size:8pt;">${localFormData.field4 || 'N/A'}</div>` : ''}

    <div style="font-weight:bold;font-size:10pt;border-top:1px solid #000;padding-top:5px;">
      GRAND TOTAL: ₹${taxCalc.grandTotal.toFixed(2)}
    </div>
  </div>

  ${(showAll || localFormData.show_bill_amount_words) ? '<div>In Words: {/* TODO */}</div>' : ''}
  ${(showAll || localFormData.show_customer_paid_amount) ? `<div>Paid: ₹${taxCalc.grandTotal.toFixed(2)}</div>` : ''}
  ${(showAll || localFormData.show_due_amount_bill) && localFormData.due > 0 ? `<div>Due: ₹${localFormData.due.toFixed(2)}</div>` : ''}
  ${(showAll || (localFormData.show_order_note_bill && localFormData.note)) ? `<div style="text-align:center;font-size:8pt;margin-top:5px;">${localFormData.note || 'N/A'}</div>` : ''}

  ${(showAll || ((
        (activeTab === 'Dine-in' && localFormData.payment_mode_dine_in) ||
        (activeTab === 'Pickup' && localFormData.payment_mode_pickup) ||
        (activeTab === 'Delivery' && localFormData.payment_mode_delivery) ||
        (activeTab === 'Quick Bill' && localFormData.payment_mode_quick_bill)
      ) && localFormData.show_default_payment)) ? `
  <hr style="border:none;border-top:1px dashed #000;margin:5px 0;" />
  <div style="text-align:center;font-size:9pt;">Payment Mode: ${selectedPaymentModes.join(', ') || 'Cash'}</div>` : ''}

  ${(showAll || localFormData.show_custom_qr_codes_bill) ? '<div>{/* Custom QR Code */}</div>' : ''}
  ${(showAll || localFormData.show_ebill_invoice_qrcode) ? '<div>{/* E-bill QR Code */}</div>' : ''}
  ${(showAll || localFormData.show_zatca_invoice_qr) ? '<div>{/* ZATCA QR Code */}</div>' : ''}

  <hr style="border:none;border-top:1px dashed #000;margin:5px 0;" />
  <div style="text-align:center;font-size:8pt;margin-top:10px;">
    ${localFormData.footer_note || 'STAY SAFE, STAY HEALTHY'}
  </div>
</div>
</div>`
  }

  // ─── Print handler with base64 logo conversion ──────────────────────────────
  const handlePrintBill = async () => {
    console.log('[BillPrint] handlePrintBill start', {
      printerName, outletId, orderNo, currentTxnId,
      selectedTable, discount, roundOffEnabled, roundOffValue,
      taxCalc, taxRates, selectedPaymentModes, itemsCount: items?.length,
    })

    try {
      setLoading(true)

      const systemPrintersRaw =
        await (window as any).electronAPI?.getInstalledPrinters?.() || []
      const systemPrinters = Array.isArray(systemPrintersRaw) ? systemPrintersRaw : []

      if (systemPrinters.length === 0) {
        toast.error('No printers detected on this system. Please check printer connections and drivers.')
        return
      }

      const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, '').trim()

      let matchedPrinter = null
      if (printerName) {
        matchedPrinter = systemPrinters.find(
          (p: any) =>
            normalize(p.name).includes(normalize(printerName)) ||
            normalize(p.displayName || '').includes(normalize(printerName)),
        )
      }

      let finalPrinterName: string | null = null

      if (matchedPrinter) {
        finalPrinterName = matchedPrinter.name
      } else {
        const defaultPrinter = systemPrinters.find((p: any) => p.isDefault)
        const fallbackPrinter = defaultPrinter || systemPrinters[0]
        if (fallbackPrinter) {
          finalPrinterName = fallbackPrinter.name
        } else {
          toast.error('No suitable printer found, including fallbacks.')
          return
        }
      }

      if (!finalPrinterName) {
        toast.error('Failed to determine printer name.')
        return
      }

      // 1. Convert logo to base64 if needed (bypass Electron print blocking)
      let logoSrcForHtml = hotelLogoUrl
      if (hotelLogoUrl && !hotelLogoUrl.startsWith('data:')) {
        try {
          console.log('[Print] Fetching logo from:', hotelLogoUrl)
          const response = await fetch(hotelLogoUrl)
          if (response.ok) {
            const blob = await response.blob()
            const base64 = await new Promise<string>((resolve) => {
              const reader = new FileReader()
              reader.onloadend = () => resolve(reader.result as string)
              reader.readAsDataURL(blob)
            })
            console.log('[Print] Logo successfully converted to base64')
            logoSrcForHtml = base64
          } else {
            console.warn('[Print] Logo fetch failed, status:', response.status)
          }
        } catch (err) {
          console.error('[Print] Error converting logo to base64:', err)
        }
      }

      // 2. Generate HTML using the correct logo src (avoid regex replace mismatch)
      let kotHTML = generateBillHTML()
      if (hotelLogoUrl && logoSrcForHtml && hotelLogoUrl !== logoSrcForHtml) {
        // String-safe replace (no regex): guarantees the <img src="..."> gets updated
        kotHTML = kotHTML.split(hotelLogoUrl).join(logoSrcForHtml)
      }

      // 3. Send to Electron
      if ((window as any).electronAPI?.directPrint) {
        await (window as any).electronAPI.directPrint(kotHTML, finalPrinterName)
        toast.success('Bill Printed Successfully!')
        if (onPrint) onPrint()
        if (onClose) onClose()
        setTimeout(onHide, 300)
      } else {
        toast.error('Electron print API not available.')
      }
    } catch (err) {
      console.error('Print error:', err)
      toast.error('Failed to print bill.')
    } finally {
      setLoading(false)
    }
  }

  // ─── Auto-print mode ───────────────────────────────────────────────────────
  if (autoPrint) return null

  const isSettingsLoading = loading || contextSettingsLoading

  // ─── Modal UI ───────────────────────────────────────────────────────────────
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
        <Modal.Title>Bill Preview &amp; Print</Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        {isSettingsLoading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Loading bill settings...</p>
          </div>
        ) : (
          canPreviewBill && (
            <div className="border mb-3 bg-light">
              <div
                style={{
                  width: '80mm',
                  margin: '0 auto',
                  fontFamily: "'Courier New', monospace",
                  fontSize: '10px',
                  lineHeight: '1.2',
                  padding: '10px',
                  color: '#000',
                  backgroundColor: 'white',
                  border: '1px solid #ccc',
                }}
                dangerouslySetInnerHTML={{ __html: generateBillContent(true) }}
              />
            </div>
          )
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
        <Button
          variant="primary"
          onClick={handlePrintBill}
          disabled={isSettingsLoading || !canPrintBill}
        >
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Printing...
            </>
          ) : (
            'Print Bill'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default BillPreviewPrint