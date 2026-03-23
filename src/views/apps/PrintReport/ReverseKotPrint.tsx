import { useEffect, useState, useMemo } from "react";
import PrintService from "@/common/api/print";
import { Modal, Button, Spinner } from "react-bootstrap";
import { toast } from "react-hot-toast";
import { useAuthContext } from "@/common";


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
 
  restaurantName,
  outletName,
  date,
  reversePrintTrigger
}) => {
  const [loading, setLoading] = useState(false);
  const [printerName, setPrinterName] = useState<string | null>(null);
  const [localRestaurantName, setLocalRestaurantName] = useState<string>('');
  const [localOutletName, setLocalOutletName] = useState<string>('');
  const [isLoadingNames, setIsLoadingNames] = useState(true);
  const { user } = useAuthContext();
  

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

  /** 🔹 Fetch printer + outlet details (parallel) */
  useEffect(() => {
    if (!show || !user.outletid) {
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
        setLocalRestaurantName(outletData?.brand_name || outletData?.hotel_name || user?.hotel_name || '');
        setLocalOutletName(outletData?.outlet_name || user?.outlet_name || '');
      } catch (error) {
        console.error('Error fetching printer/outlet:', error);
        toast.error("Failed to load printer/outlet settings");
        setPrinterName(null);
        setLocalRestaurantName(user?.hotel_name || '');
        setLocalOutletName(user?.outlet_name || '');
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

  /** 🔹 ONLY CONTENT (for preview) */
  const generateContent = useMemo(() => {
    const displayRestaurantName = restaurantName || localRestaurantName || user.hotel_name || "";
    const displayOutletName = outletName || localOutletName || user.outlet_name || "";
    return `
<div class="center bold">${displayRestaurantName}</div>
<div class="center">${displayOutletName}</div>

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
  <th align="right">Amount</th>
</tr>

${reverseItems.map(i => `
<tr>
  <td>${i.name}</td>
  <td align="center">-${i.revQty}</td>
  <td align="right">${(i.price || 0).toFixed(2)}</td>
</tr>
`).join("")}

</table>

<hr/>

<div class="center">*** REVERSE KOT ***</div>
    `;
  }, [
    restaurantName, localRestaurantName, outletName, localOutletName, user, reverseKotNos, dateTime, reverseItems
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
        {loading || isLoadingNames ? (
          <div className="text-center">
            <Spinner />
            <div className="mt-2">Loading printer/outlet...</div>
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