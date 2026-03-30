import { useEffect, useState, useMemo } from "react";
import { Button, Modal, Spinner } from "react-bootstrap";
import { toast } from "react-hot-toast";
import PrintService from "@/common/api/print";

interface MenuItem {
  id: number;
  name: string;
  price: number;
  qty: number;
  isNCKOT: number;
  NCName: string;
  NCPurpose: string;
}

interface NCKotPrintProps {
  show: boolean;
  autoPrint?: boolean;
  selectedWaiter?: string;
  onHide: () => void;
  items: MenuItem[];
  user: any;
  outletName?: string;
  restaurantName?: string;
  date?: string;
  tableName?: string;
}

const NCKotPrint: React.FC<NCKotPrintProps> = ({
  show,
  selectedWaiter,
  autoPrint,
  onHide,
  items,
  user,
  outletName,
  restaurantName,
  date,
  tableName
}) => {
  const [loading, setLoading] = useState(false);
  const [printerName, setPrinterName] = useState<string | null>(null);
  const [hasPrinted, setHasPrinted] = useState(false);
  const [localRestaurantName, setLocalRestaurantName] = useState("");
  const [localOutletName, setLocalOutletName] = useState("");

  /** 🔹 Filter NC items */
  const ncItems = useMemo(() => {
    return items.filter(i => i.isNCKOT === 1);
  }, [items]);

  /** 🔹 Fetch printer + outlet */
  useEffect(() => {
    if (!show || !user?.outletid) return;

    const fetchData = async () => {
      try {
        const [printerRes, outletRes] = await Promise.all([
          PrintService.getKotPrinterSettings(user.outletid),
          PrintService.getOutletDetails(user.outletid)
        ]);

        const printerData = printerRes?.data || printerRes;
        const outletData = outletRes?.data || outletRes;

        setPrinterName(printerData?.printer_name || null);

        setLocalRestaurantName(
          restaurantName ||
            outletData?.brand_name ||
            outletData?.hotel_name ||
            user?.hotel_name ||
            "Restaurant Name"
        );

        setLocalOutletName(
  outletData?.outlet_name ||   // 🔥 FIRST priority API se
  outletName ||                // 🔥 then props
  user?.outlet_name ||
  "Outlet Name"
);
      } catch {
        toast.error("Failed to load printer settings");
      }
    };

    fetchData();
  }, [show, user, outletName, restaurantName]);

  /** 🔹 Date */
  const dateTime = useMemo(() => {
    return date
      ? new Date(date).toLocaleString("en-GB")
      : new Date().toLocaleString("en-GB");
  }, [date]);

  /** 🔹 FULL PRINT HTML (with fixes: ₹ in Rate/Amt, right align Rate, Total label fixed) */
  const generateFullPrintHTML = () => `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<style>
  @page {
    size: 80mm auto;
    margin: 0;
  }

  body {
    width: 72mm;              /* 🔥 SAFE WIDTH */
    margin-left: 4mm;         /* 🔥 LEFT FIX */
    margin-right: 2mm;        /* 🔥 RIGHT FIX */
    font-family: monospace;
    font-size: 11px;
    line-height: 1.3;
  }

  .center { text-align: center; }
  .bold { font-weight: bold; }

  hr {
    border-top: 1px dashed #000;
    margin: 6px 0;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;     /* 🔥 IMPORTANT */
  }

  th, td {
    padding: 3px 2px;
    border-bottom: 1px solid #000;
    font-size: 10px;
  }

  th { text-align: left; }

  /* 🔥 COLUMN FIX */
  .col-qty  { width: 15%; text-align: center; }
  .col-item { width: 45%; text-align: left; }
  .col-rate { width: 20%; text-align: right; }
  .col-amt  { width: 20%; text-align: right; }

  /* 🔥 PREVENT CUT */
  td {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* 🔥 LONG ITEM WRAP */
  .col-item {
    white-space: normal;
    word-break: break-word;
  }
</style>
</head>

<body>

<div class="center bold">${localRestaurantName}</div>
<div class="center">${localOutletName}</div>

<hr/>

<div class="center bold">NC KOT</div>

<hr/>

<div><b>NC:</b> ${ncItems[0]?.NCName || "-"}</div>
<div><b>Purpose:</b> ${ncItems[0]?.NCPurpose || "-"}</div>
<div><b>Date:</b> ${dateTime}</div>
  <div><b>Waiter:</b> ${selectedWaiter || user?.name || '-'}</div>
  <div><b>Table:</b> ${tableName || '-'}</div>

<hr/>

<table>
<tr>
  <th class="col-qty">Qty</th>
  <th class="col-item">Item</th>
  <th class="col-rate">Rate</th>
  <th class="col-amt">Amt</th>
</tr>

${ncItems.map(i => `
<tr>
  <td class="col-qty">${i.qty}</td>
  <td class="col-item">${i.name}</td>
  <td class="col-rate">₹${i.price.toFixed(2)}</td>
  <td class="col-amt">₹${(i.price * i.qty).toFixed(2)}</td>
</tr>
`).join("")}

</table>

<hr/>

<div class="bold" style="display:flex; justify-content:space-between;">
  <div>Total: ${ncItems.reduce((a, b) => a + b.qty, 0)}</div>
  <div>₹${ncItems.reduce((a, b) => a + b.price * b.qty, 0).toFixed(2)}</div>
</div>

<hr/>
<div class="center">*** NC KOT ***</div>

</body>
</html>
`;

  /** 🔹 PREVIEW (now uses SAME layout + inline styles + ₹ + right-aligned Rate + monospace font on container) */
  const generatePreviewContent = useMemo(() => {
    const totalQty = ncItems.reduce((a, b) => a + b.qty, 0);
    const totalAmt = ncItems.reduce((a, b) => a + b.price * b.qty, 0);

    return `
<div style="text-align:center; font-weight:bold;">${localRestaurantName}</div>
<div style="text-align:center;">${localOutletName}</div>

<hr style="border-top:1px dashed #000; margin:6px 0;" />

<div style="text-align:center; font-weight:bold;">NC KOT</div>

<hr style="border-top:1px dashed #000; margin:6px 0;" />

<div><b>NC:</b> ${ncItems[0]?.NCName || "-"}</div>
<div><b>Purpose:</b> ${ncItems[0]?.NCPurpose || "-"}</div>
<div><b>Date:</b> ${dateTime}</div>
   
    <div><b>Waiter:</b> ${selectedWaiter || user?.name || '-'}</div>
    <div><b>Table:</b> ${tableName || '-'}</div>

<hr style="border-top:1px dashed #000; margin:6px 0;" />

<!-- TABLE HEADER -->
<div style="display:grid; grid-template-columns:15% 40% 20% 25%; font-weight:bold; border-bottom:1px solid #000; padding:4px 0;">
  <div style="text-align:center;">Qty</div>
  <div style="text-align:left;">Item</div>
  <div style="text-align:right;">Rate</div>
  <div style="text-align:right;">Amt</div>
</div>

<!-- ITEMS -->
${ncItems
  .map(
    i => `
<div style="display:grid; grid-template-columns:15% 40% 20% 25%; border-bottom:1px solid #000; padding:4px 0;">
  <div style="text-align:center;">${i.qty}</div>
  <div style="text-align:left;">${i.name}</div>
  <div style="text-align:right;">₹${i.price.toFixed(2)}</div>
  <div style="text-align:right;">₹${(i.price * i.qty).toFixed(2)}</div>
</div>`
  )
  .join("")}

<hr style="border-top:1px dashed #000; margin:6px 0;" />

<div style="display:flex; justify-content:space-between; font-weight:bold;">
  <div>Total: ${totalQty}</div>
  <div>₹${totalAmt.toFixed(2)}</div>
</div>

<hr style="border-top:1px dashed #000; margin:6px 0;" />
<div style="text-align:center;">*** NC KOT ***</div>
`;
  }, [ncItems, localRestaurantName, localOutletName, dateTime, user]);

  /** 🔹 Print */
  const handlePrint = async () => {
    try {
      setLoading(true);

      if (!printerName) {
        toast.error("Printer not configured");
        return;
      }

      await (window as any).electronAPI.directPrint(
        generateFullPrintHTML(),
        printerName
      );

      toast.success("Printed");
      onHide();
    } catch {
      toast.error("Print failed");
    } finally {
      setLoading(false);
    }
  };

  // Main Auto-Print Logic
  useEffect(() => {
    if (
      autoPrint &&
      show &&
      !loading &&
      !hasPrinted &&
      printerName &&
      ncItems.length > 0
    ) {
      setHasPrinted(true);
      handlePrint();
    }
  }, [autoPrint, show, loading, hasPrinted, printerName, ncItems]);

  // Reset hasPrinted when modal is closed
  useEffect(() => {
    if (!show) {
      setHasPrinted(false);
    }
  }, [show]);

  if (autoPrint) {
    return null;
  }

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>NC KOT Preview</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {loading ? (
          <div className="text-center">
            <Spinner />
          </div>
        ) : (
          <div
            style={{
              width: "302px",
              margin: "0 auto",
              background: "#fff",
              padding: "10px",
              border: "1px solid #ccc",
              fontFamily: "monospace",   // ← Fixed: Print-like font
              fontSize: "12px"           // ← Fixed: Print-like size
            }}
            dangerouslySetInnerHTML={{ __html: generatePreviewContent }}
          />
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button onClick={onHide}>Close</Button>
        <Button variant="danger" onClick={handlePrint}>
          Print
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default NCKotPrint;text-center">
            <Spinner />
          </div>
        ) : (
          <div
            style={{
              width: "302px",
              margin: "0 auto",
              background: "#fff",
              padding: "10px",
              border: "1px solid #ccc",
              fontFamily: "monospace",   // ← Fixed: Print-like font
              fontSize: "12px"           // ← Fixed: Print-like size
            }}
            dangerouslySetInnerHTML={{ __html: generatePreviewContent }}
          />
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button onClick={onHide}>Close</Button>
        <Button variant="danger" onClick={handlePrint}>
          Print
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default NCKotPrint;text-center">
            <Spinner />
          </div>
        ) : (
          <div
            style={{
              width: "302px",
              margin: "0 auto",
              background: "#fff",
              padding: "10px",
              border: "1px solid #ccc",
              fontFamily: "monospace",   // ← Fixed: Print-like font
              fontSize: "12px"           // ← Fixed: Print-like size
            }}
            dangerouslySetInnerHTML={{ __html: generatePreviewContent }}
          />
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button onClick={onHide}>Close</Button>
        <Button variant="danger" onClick={handlePrint}>
          Print
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default NCKotPrint;text-center">
            <Spinner />
          </div>
        ) : (
          <div
            style={{
              width: "302px",
              margin: "0 auto",
              background: "#fff",
              padding: "10px",
              border: "1px solid #ccc",
              fontFamily: "monospace",   // ← Fixed: Print-like font
              fontSize: "12px"           // ← Fixed: Print-like size
            }}
            dangerouslySetInnerHTML={{ __html: generatePreviewContent }}
          />
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button onClick={onHide}>Close</Button>
        <Button variant="danger" onClick={handlePrint}>
          Print
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default NCKotPrint;