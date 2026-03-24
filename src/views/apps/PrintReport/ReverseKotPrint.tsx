import { useEffect, useState, useMemo } from "react";
import PrintService from "@/common/api/print";
import { Modal, Button, Spinner } from "react-bootstrap";
import { toast } from "react-hot-toast";

interface MenuItem {
  id: number;
  name: string;
  qty: number;
  price?: number;
  revQty?: number;
  isReverse?: boolean;
  kotNo?: number;
}

interface ReverseKotPrintProps {
  show: boolean;
  onHide: () => void;
  items: MenuItem[];
  restaurantName?: string;
  user: any;
  outletName?: string;
  selectedTable?: string | null;
  tableName?: string;
  date?: string;
  reversePrintTrigger?: number;
}

const ReverseKotPrint: React.FC<ReverseKotPrintProps> = ({
  show,
  onHide,
  items,
  restaurantName,
  user,
  outletName,
  selectedTable,
  tableName,
  date,
  reversePrintTrigger
}) => {
  const [loading, setLoading] = useState(false);
  const [printerName, setPrinterName] = useState<string | null>(null);
  const [localRestaurantName, setLocalRestaurantName] = useState("");
  const [localOutletName, setLocalOutletName] = useState("");
  const [isLoadingNames, setIsLoadingNames] = useState(true);

  

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

  /** 🔹 Fetch printer + outlet details */
  useEffect(() => {
    if (!show || !user?.outletid) {
      setIsLoadingNames(false);
      return;
    }

    const fetchPrinterAndOutlet = async () => {
      setIsLoadingNames(true);
      try {
        const [printerRes, outletRes] = await Promise.all([
          PrintService.getKotPrinterSettings(user.outletid),
          PrintService.getOutletDetails(user.outletid)
        ]);

        const printerData = printerRes?.data || printerRes;
        const outletData = outletRes?.data || outletRes;

        setPrinterName(printerData?.printer_name || null);
        setLocalRestaurantName(
          outletData?.brand_name || outletData?.hotel_name || user?.hotel_name || ""
        );
       setLocalOutletName(
  outletData?.outlet_name || 
  outletName ||   // 🔥 add this
  user?.outlet_name || 
  "Outlet Name"
);
      } catch (error) {
        console.error("Error fetching printer/outlet:", error);
        toast.error("Failed to load printer/outlet settings");
        setPrinterName(null);
        setLocalRestaurantName(user?.hotel_name || "");
        setLocalOutletName(user?.outlet_name || "");
      } finally {
        setIsLoadingNames(false);
      }
    };

    fetchPrinterAndOutlet();
  }, [show, user]);

  /** 🔹 DateTime */
  const dateTime = useMemo(() => {
    return date
      ? new Date(date).toLocaleString("en-GB")
      : new Date().toLocaleString("en-GB");
  }, [date]);

  /** 🔹 PREVIEW + PRINT CONTENT (Shared) */
  const generateContent = useMemo(() => {
    const displayRestaurantName = restaurantName || localRestaurantName || user?.hotel_name || "";
    const displayOutletName = localOutletName || outletName || user?.outlet_name || "";
    const displayTableName =
  (tableName && tableName.trim()) ||
  (selectedTable && selectedTable.trim()) ||
  "-";
    return `
<div style="text-align:center; font-weight:bold;">${displayRestaurantName}</div>
<div style="text-align:center;">${displayOutletName}</div>

<!-- TABLE BIG BOX (similar to KotPrint.tsx) -->
<div style="
  border: 1px solid #696868;
  min-width: 70px;
  min-height: 55px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16pt;
  font-weight: bold;
  margin: 8px auto;
">${displayTableName}</div>

<hr style="border-top:1px dashed #000; margin:8px 0;" />

<div style="text-align:center; font-weight:bold;">REVERSE KOT</div>

<hr style="border-top:1px dashed #000; margin:8px 0;" />

<div><strong>Reverse KOT No:</strong> ${reverseKotNos || "-"}</div>
<div><strong>Date:</strong> ${dateTime}</div>
<div><strong>User:</strong> ${user?.username || "-"}</div>

<hr style="border-top:1px dashed #000; margin:8px 0;" />

<!-- Table -->
<div style="display:grid; grid-template-columns: 55% 20% 25%; font-weight:bold; border-bottom:1px solid #000; padding:4px 0;">
  <div style="text-align:left;">Item</div>
  <div style="text-align:center;">Qty</div>
  <div style="text-align:right;">Amount</div>
</div>

${reverseItems
  .map(
    i => `
<div style="display:grid; grid-template-columns: 55% 20% 25%; border-bottom:1px solid #000; padding:4px 0;">
  <div style="text-align:left;">${i.name}</div>
  <div style="text-align:center; color:#d32f2f;">-${i.revQty}</div>
  <div style="text-align:right;">₹${(i.price || 0).toFixed(2)}</div>
</div>`
  )
  .join("")}

<hr style="border-top:1px dashed #000; margin:8px 0;" />

<div style="text-align:center;">*** REVERSE KOT ***</div>
    `;
  }, [
    restaurantName,
    localRestaurantName,
    outletName,
    localOutletName,
    selectedTable,
    tableName,
    user,
    reverseKotNos,
    dateTime,
    reverseItems
  ]);

  /** 🔹 FULL HTML for Printing */
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


  /** 🔹 Print Handler */
  const handlePrint = async () => {
    try {
      setLoading(true);

      if (!printerName) {
        toast.error("No printer configured for this outlet");
        return;
      }

      await (window as any).electronAPI.directPrint(generateHTML(), printerName);

      toast.success("Reverse KOT Printed");
      onHide();
    } catch (err) {
      console.error(err);
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
        {loading || isLoadingNames ? (
          <div className="text-center py-4">
            <Spinner animation="border" />
            <div className="mt-2">Loading printer & outlet details...</div>
          </div>
        ) : (
          <div className="d-flex justify-content-center">
            <div
              key={reversePrintTrigger} // Force re-render when needed
              style={{
                width: "302px",
                margin: "0 auto",
                fontFamily: "'Courier New', monospace",
                fontSize: "12px",
                lineHeight: "1.4",
                padding: "10px",
                backgroundColor: "#fff",
                border: "1px solid #ccc",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
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
        <Button variant="danger" onClick={handlePrint} disabled={loading || isLoadingNames}>
          Print Reverse KOT
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ReverseKotPrint;