import { useEffect, useState, useMemo } from "react";
import { Modal, Button, Spinner } from "react-bootstrap";
import { toast } from "react-hot-toast";

interface MenuItem {
  id: number;
  name: string;
  qty: number;
  revQty?: number;
  isReverse?: boolean;
  kotNo?: number;
}

interface ReverseKotPrintProps {
  show: boolean;
  onHide: () => void;
  items: MenuItem[];
  user: any;
  restaurantName?: string;
  outletName?: string;
  date?: string;
  reversePrintTrigger?: number;
}

const ReverseKotPrint: React.FC<ReverseKotPrintProps> = ({
  show,
  onHide,
  items,
  user,
  restaurantName,
  outletName,
  date,
  reversePrintTrigger
}) => {
  const [loading, setLoading] = useState(false);
  const [printerName, setPrinterName] = useState<string | null>(null);

  /** 🔹 Filter reverse items */
  const reverseItems = useMemo(() => {
    return items.filter(i => i.isReverse && (i.revQty ?? 0) > 0);
  }, [items]);

  /** 🔹 Unique Reverse KOT Nos */
  const reverseKotNos = useMemo(() => {
    const set = new Set<number>();
    reverseItems.forEach(i => {
      if (i.kotNo) set.add(i.kotNo);
    });
    return Array.from(set).join(", ");
  }, [reverseItems]);

  /** 🔹 Fetch printer */
  useEffect(() => {
    if (!show || !user?.outletid) return;

    const fetchPrinter = async () => {
      try {
        const res = await fetch(
          `http://localhost:3001/api/settings/kot-printer-settings/${user.outletid}`
        );
        const data = await res.json();
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

  /** 🔹 ONLY CONTENT (for preview) */
  const generateContent = useMemo(() => {
    return `
<div class="center bold">${restaurantName || user?.hotel_name || ""}</div>
<div class="center">${outletName || user?.outlet_name || ""}</div>

<hr/>

<div class="center bold">REVERSE KOT</div>

<hr/>

<div><strong>Reverse KOT No:</strong> ${reverseKotNos || "-"}</div>
<div><strong>Date:</strong> ${dateTime}</div>
<div><strong>User:</strong> ${user?.username || "-"}</div>

<hr/>

<table width="100%">
<tr>
  <th align="left">Item</th>
  <th align="center">Qty</th>
</tr>

${reverseItems.map(i => `
<tr>
  <td>${i.name}</td>
  <td align="center">-${i.revQty}</td>
</tr>
`).join("")}

</table>

<hr/>

<div class="center">*** REVERSE KOT ***</div>
    `;
  }, [
    restaurantName,
    outletName,
    user,
    reverseKotNos,
    dateTime,
    reverseItems
  ]);

  /** 🔹 FULL HTML (for printing only) */
  const generateHTML = () => `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<style>
  @page { size: 302px auto; margin: 0; }
  body {
    width: 302px;
    margin: 0;
    font-family: 'Courier New', monospace;
    font-size: 12px;
  }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  hr { border-top: 1px dashed #000; }
</style>
</head>
<body>
${generateContent}
</body>
</html>
  `;

  /** 🔹 Print */
  const handlePrint = async () => {
    try {
      setLoading(true);

      if (!printerName) {
        toast.error("No printer configured for this outlet");
        return;
      }

      await (window as any).electronAPI.directPrint(
        generateHTML(),
        printerName
      );

      toast.success("Reverse KOT Printed");
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
        <Modal.Title>Reverse KOT Preview</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {loading ? (
          <div className="text-center">
            <Spinner />
          </div>
        ) : (
          <div className="border p-3 bg-light">
            <div
              key={reversePrintTrigger}
              style={{
                width: "302px",
                margin: "0 auto",
                fontFamily: "'Courier New', monospace",
                fontSize: "12px",
                lineHeight: "1.4",
                padding: "10px",
                backgroundColor: "#fff",
                border: "1px solid #ccc"
              }}
              dangerouslySetInnerHTML={{ __html: generateContent }}
            />
          </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
        <Button variant="danger" onClick={handlePrint} disabled={loading}>
          Print Reverse KOT
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ReverseKotPrint;