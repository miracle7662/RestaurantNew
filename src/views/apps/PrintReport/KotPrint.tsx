import { useEffect, useState } from "react";
import { Button, Modal, Spinner } from "react-bootstrap";
import { toast } from "react-hot-toast";
import { OutletSettings } from "src/utils/applyOutletSettings";

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
  selectedOutletId
}) => {
  const [loading, setLoading] = useState(false);
  const [printerName, setPrinterName] = useState<string | null>(null);
  const [outletId, setOutletId] = useState<number | null>(null);

  // Initialize with selected outlet ID or user's outlet ID
  useEffect(() => {
    const outlet = selectedOutletId ?? Number(user?.outletid);
    if (outlet) {
      setOutletId(outlet);
    }
  }, [user, selectedOutletId]);

  // Fetch printer settings for the outlet
  useEffect(() => {
    const fetchPrinter = async () => {
      if (!outletId) return;

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
    };

    fetchPrinter();
  }, [outletId]);

  // Auto-print logic (if enabled)
  useEffect(() => {
    if (autoPrint && show && printerName && !loading) {
      handlePrintKOT();
    }
  }, [autoPrint, show, printerName, loading]);

  const handlePrintKOT = async () => {
    try {
      setLoading(true);

      // If no printer is configured, show error
      if (!printerName) {
        toast.error("No KOT printer configured. Please configure printer settings.");
        return;
      }

      // Get system printers via Electron API (synchronous)
      const systemPrinters = (window as any).electronAPI?.getInstalledPrinters?.() || [];
      console.log("System Printers:", systemPrinters);

      const normalize = (s: string) =>
        s.toLowerCase().replace(/\s+/g, "").trim();

      const matchedPrinter = systemPrinters.find((p: any) =>
        normalize(p.name).includes(normalize(printerName))
      );

      if (!matchedPrinter) {
        toast.error(`Printer "${printerName}" not found on this system.`);
        return;
      }

      const finalPrinterName: string = matchedPrinter.name;

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
    ${generateKOTContent()}
  </div>
</body>
</html>
`;
  };

  const generateKOTContent = () => {
    if (!formData) {
      return '<div style="text-align: center; padding: 20px;">Loading KOT data...</div>';
    }

    const kotItems = printItems.length > 0 ? printItems : items.filter(i => i.isNew);

    return `
    <!-- ================= STORE INFO ================= -->
    ${formData.show_store_name ? `
    <div style="text-align: center; margin-bottom: 10px;">
      <div style="font-weight: bold; font-size: 12pt;">
        ${user?.outlet_name || 'Restaurant Name'}
      </div>
      <div style="font-size: 8pt;">
        ${user?.outlet_address || 'Kolhapur Road Kolhapur 416416'}
      </div>
      ${user?.outlet_email ? `
      <div style="font-size: 8pt;">${user.outlet_email}</div>
      ` : ''}
    </div>
    ` : ''}

    <hr style="border: none; border-top: 1px dashed #000; margin: 8px 0;" />

    <!-- ================= KOT HEADER ================= -->
    <div style="text-align: center; margin-bottom: 8px;">
      <div><strong>Order Type:</strong> ${activeTab}</div>
      ${formData.show_new_order_tag && formData.new_order_tag_label ? `
      <div style="
        background-color: #007bff;
        color: #fff;
        display: inline-block;
        padding: 1px 5px;
        border-radius: 4px;
        font-size: 8pt;
        margin-top: 3px
      ">
        ${formData.new_order_tag_label}
      </div>
      ` : ''}

      ${formData.show_running_order_tag && formData.running_order_tag_label ? `
      <div style="
        background-color: #6c757d;
        color: #fff;
        display: inline-block;
        padding: 1px 5px;
        border-radius: 4px;
        font-size: 8pt;
        margin-top: 3px
      ">
        ${formData.running_order_tag_label}
      </div>
      ` : ''}
    </div>

    <hr style="border: none; border-top: 1px dashed #000; margin: 8px 0;" />

    <!-- ================= BASIC DETAILS ================= -->
    <div style="
      display: grid;
      grid-template-columns: 1fr 1fr;
      margin-bottom: 8px;
      font-size: 9pt
    ">
      <div><strong>KOT No:</strong> ${currentKOTNo || '—'}</div>
      <div><strong>Table:</strong> ${selectedTable || activeTab}</div>

      <div><strong>Date:</strong> ${new Date().toLocaleDateString('en-GB')}</div>
      <div><strong>Time:</strong> ${new Date().toLocaleTimeString('en-GB')}</div>
    </div>

    ${formData.show_waiter ? `
    <div style="font-size: 9pt; margin-bottom: 6px;">
      <strong>Waiter:</strong> ${user?.name || 'N/A'}
    </div>
    ` : ''}

    <hr style="border: none; border-top: 1px dashed #000; margin: 8px 0;" />

    <!-- ================= CUSTOMER DETAILS ================= -->
    ${((formData.customer_on_kot_dine_in && activeTab === 'Dine-in') ||
      (formData.customer_on_kot_quick_bill && activeTab === 'Quick Bill') ||
      (formData.customer_on_kot_pickup && activeTab === 'Pickup') ||
      (formData.customer_on_kot_delivery && activeTab === 'Delivery')) &&
      formData.customer_kot_display_option !== 'DISABLED' ? `
    <div style="font-size: 9pt; margin-bottom: 8px;">
      <strong>Customer:</strong> ${customerName || 'Guest'}
      ${formData.customer_kot_display_option === 'NAME_AND_MOBILE' && mobileNumber ? `
      <div><strong>Mobile:</strong> ${mobileNumber}</div>
      ` : ''}
    </div>

    <hr style="border: none; border-top: 1px dashed #000; margin: 8px 0;" />
    ` : ''}

    <!-- ================= ITEM HEADER ================= -->
    <div
      style="
        display: grid;
        grid-template-columns: 1fr 35px 45px 55px;
        font-weight: bold;
        border-bottom: 1px solid #000;
        padding-bottom: 4px;
        margin-bottom: 5px
      "
    >
      <div>Item</div>
      <div style="text-align: center">Qty</div>
      <div style="text-align: right">Rate</div>
      ${formData.show_item_price ? `
      <div style="text-align: right">Amt</div>
      ` : ''}
    </div>

    <!-- ================= ITEMS ================= -->
    ${kotItems.map((item, i) => {
      const kotQty = item.originalQty
        ? Math.max(0, item.qty - item.originalQty)
        : item.qty;

      const displayQty = kotQty > 0 ? kotQty : item.qty;

      return `
      <div
        key="${i}"
        style="
          display: grid;
          grid-template-columns: 1fr 35px 45px 55px;
          padding-bottom: 3px;
          margin-bottom: 3px;
          font-size: 9pt
        "
      >
        <div>${item.name}</div>
        <div style="text-align: center">${displayQty}</div>
        <div style="text-align: right">${item.price.toFixed(2)}</div>
        ${formData.show_item_price ? `
        <div style="text-align: right">
          ${(item.price * displayQty).toFixed(2)}
        </div>
        ` : ''}
      </div>
      `;
    }).join('')}

    <hr style="border: none; border-top: 1px dashed #000; margin: 8px 0;" />
    
    <!-- ================= REVERSE QTY BLOCK ================= -->
    ${reverseQtyMode && reverseQtyItems.length > 0 ? `
    <div
      style="
        text-align: center;
        font-weight: bold;
        color: #dc3545;
        margin-bottom: 10px;
        padding: 5px;
        background-color: #f8d7da;
        border: 1px solid #f5c6cb;
        border-radius: 4px;
        font-size: 9pt;
      "
    >
      REVERSE QUANTITY ITEMS
    </div>

    <!-- Reverse Qty Items List -->
    ${reverseQtyItems.map((item, index) => `
    <div
      style="
        display: grid;
        grid-template-columns: 1fr 35px 45px 55px;
        gap: 5px;
        padding-bottom: 4px;
        margin-bottom: 4px;
        background-color: #fff3cd;
        border: 1px solid #ffeaa7;
        border-radius: 4px;
        padding: 6px;
        font-size: 9pt;
      "
    >
      <!-- Item Name -->
      <div>
        ${item.name}
        ${formData.modifier_default_option && item.modifier ? `
        <div style="font-size: 7pt; color: #666">${item.modifier}</div>
        ` : ''}
      </div>

      <!-- Reverse Qty -->
      <div style="text-align: center; color: #dc3545; font-weight: bold;">
        -${item.qty}
      </div>

      <!-- Rate -->
      <div style="text-align: right">${item.price.toFixed(2)}</div>

      <!-- Amount -->
      ${formData.show_item_price ? `
      <div
        style="text-align: right; color: #dc3545; font-weight: bold"
      >
        -${(item.price * item.qty).toFixed(2)}
      </div>
      ` : ''}
    </div>
    `).join('')}

    <!-- Reverse Qty Total -->
    <div
      style="
        display: flex;
        justify-content: space-between;
        font-weight: bold;
        margin-top: 8px;
        margin-bottom: 8px;
        font-size: 10pt;
      "
    >
      <div style="color: #dc3545">
        Total Reverse Qty: ${reverseQtyItems.reduce((sum, item) => sum + item.qty, 0)}
      </div>

      ${formData.show_item_price ? `
      <div style="color: #dc3545">
        ₹
        ${reverseQtyItems
          .reduce((sum, item) => sum + item.price * item.qty, 0)
          .toFixed(2)}
      </div>
      ` : ''}
    </div>

    <hr
      style="
        border: none;
        border-top: 1px dashed #000;
        margin: 10px 0;
      "
    />
    ` : ''}

    <!-- ================= TOTALS ================= -->
    ${(() => {
      const totalQty = kotItems.reduce((a, b) => a + (b.originalQty ? b.qty - b.originalQty : b.qty), 0);
      const totalAmt = kotItems.reduce((a, b) => a + (b.price * (b.originalQty ? b.qty - b.originalQty : b.qty)), 0);

      return `
      <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 10pt">
        <div>Total Qty: ${totalQty}</div>
        ${formData.show_item_price ? `<div>Total: ₹${totalAmt.toFixed(2)}</div>` : ''}
      </div>
      `;
    })()}

    <hr style="border: none; border-top: 1px dashed #000; margin: 8px 0;" />

    <!-- ================= FOOTER ================= -->
    <div style="
      text-align: center;
      margin-top: 10px;
      font-size: 9pt;
      color: #666
    ">
      THANK YOU
      <br />
      Please prepare the order
    </div>
    `;
  };

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
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Loading printer settings...</p>
          </div>
        ) : (
          <div>
            {/* Preview Section */}
            <div className="border p-3 mb-3 bg-light">
              <div
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
                dangerouslySetInnerHTML={{ __html: generateKOTContent() }}
              />
            </div>

            {/* Printer Info */}
            <div className="alert alert-info mb-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <strong>Printer:</strong> {printerName || "Not configured"}
                </div>
                {!printerName && (
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => {
                      // Navigate to printer settings or show configuration
                      toast("Please configure printer in settings");
                    }}
                  >
                    Configure
                  </Button>
                )}
              </div>
            </div>

            {/* Print Stats */}
            <div className="row mb-3">
              <div className="col-md-6">
                <div className="card">
                  <div className="card-body">
                    <h6 className="card-title">KOT Details</h6>
                    <p className="mb-1">
                      <strong>KOT No:</strong> {currentKOTNo || "—"}
                    </p>
                    <p className="mb-1">
                      <strong>Table:</strong> {selectedTable || activeTab}
                    </p>
                    <p className="mb-1">
                      <strong>Items:</strong> {printItems.length > 0 ? printItems.length : items.filter(i => i.isNew).length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="card">
                  <div className="card-body">
                    <h6 className="card-title">Customer Info</h6>
                    <p className="mb-1">
                      <strong>Name:</strong> {customerName || "Guest"}
                    </p>
                    <p className="mb-1">
                      <strong>Mobile:</strong> {mobileNumber || "—"}
                    </p>
                    <p className="mb-0">
                      <strong>Order Type:</strong> {activeTab}
                    </p>
                  </div>
                </div>
              </div>
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
          disabled={loading || !printerName}
        >
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Printing...
            </>
          ) : (
            "Print KOT"
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default KotPreviewPrint;