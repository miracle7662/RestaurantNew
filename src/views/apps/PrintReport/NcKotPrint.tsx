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
  isNew?: boolean;
}

interface NCKotPrintProps {
  show: boolean;
  onHide: () => void;
  items: MenuItem[];
  user: any;
  outletName?: string;
  restaurantName?: string;
  date?: string;
}

const NCKotPrint: React.FC<NCKotPrintProps> = ({
  show,
  onHide,
  items,
  user,
  outletName,
  restaurantName,
  date
}) => {
  const [loading, setLoading] = useState(false);
  const [printerName, setPrinterName] = useState<string | null>(null);

  /** 🔹 Filter NC items */
  const ncItems = useMemo(() => {
    return items.filter(i => i.isNCKOT === 1);
  }, [items]);

  /** 🔹 Fetch printer */
  useEffect(() => {
    if (!show || !user?.outletid) return;

    const fetchPrinter = async () => {
      try {
        const res = await PrintService.getKotPrinterSettings(user.outletid);
        const data = res?.data || res;
        setPrinterName(data?.printer_name || null);
      } catch {
        toast.error("Failed to load printer settings");
      }
    };

    fetchPrinter();
  }, [show, user]);

  /** 🔹 DateTime */
  const dateTime = useMemo(() => {
    return date
      ? new Date(date).toLocaleString("en-GB")
      : new Date().toLocaleString("en-GB");
  }, [date]);

  /** 🔹 Full HTML (PRINT) - Updated with Price and Amount columns */
  const generateHTML = () => {
   

    return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<title>NC KOT</title>
<style>
  @page { size: 302px auto; margin: 0; }
  body {
    width: 302px;
    margin: 0;
    padding: 10px;
    font-family: 'Courier New', monospace;
    font-size: 12px;
  }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  hr { border-top: 1px dashed #000; margin: 5px 0; }
  .right { text-align: right; }
  .item-table th, .item-table td { padding: 2px 0; border-bottom: 1px solid #000; }
  .item-table .col-item { width: 55%; text-align: left; }
  .item-table .col-qty, .item-table .col-rate, .item-table .col-amt { width: 15%; text-align: center; }
  .totals { font-weight: bold; margin-top: 10px; }
</style>
</head>
<body>

<div class="center bold">${restaurantName || user?.hotel_name}</div>
<div class="center">${outletName || user?.outlet_name}</div>

<hr />

<div class="center bold">NC KOT</div>

<hr />

<div><strong>NC Name:</strong> ${ncItems[0]?.NCName || "-"}</div>
<div><strong>Purpose:</strong> ${ncItems[0]?.NCPurpose || "-"}</div>
<div><strong>Date:</strong> ${dateTime}</div>
<div><strong>User:</strong> ${user?.username}</div>

<hr />

<table class="item-table" width="100%">
<tr>
  <th class="col-item">Item</th>
  <th class="col-qty">Qty</th>
  <th class="col-amt">Amt</th>
</tr>
${ncItems.map(i => `
<tr>
  <td class="col-item">${i.name}</td>
  <td class="col-qty">${i.qty}</td>
  <td class="col-rate">${i.price.toFixed(2)}</td>
 
</tr>
`).join("")}

</table>

<hr />

<div class="center">*** NC KOT ***</div>

</body>
</html>
    `;
  };

  /** 🔹 Extract ONLY body for preview (FIX) */
  const getBodyContent = (html: string) => {
    const match = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    return match ? match[1] : html;
  };

  /** 🔹 Print */
  const handlePrint = async () => {
    try {
      setLoading(true);

      if (!printerName) {
        toast.error("Printer not configured");
        return;
      }

      await (window as any).electronAPI.directPrint(
        generateHTML(),
        printerName
      );

      toast.success("NC KOT Printed");
      onHide();
    } catch {
      toast.error("Print failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered backdrop="static">
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
              border: "1px solid #ccc",
              padding: "10px",
              backgroundColor: "#fff"
            }}
            dangerouslySetInnerHTML={{
              __html: getBodyContent(generateHTML())
            }}
          />
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
        <Button variant="danger" onClick={handlePrint} disabled={loading}>
          Print NC KOT
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default NCKotPrint;