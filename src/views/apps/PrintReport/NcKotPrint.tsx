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
  const [localRestaurantName, setLocalRestaurantName] = useState<string>('');
  const [localOutletName, setLocalOutletName] = useState<string>('');
  const [isLoadingNames, setIsLoadingNames] = useState(true);

  /** 🔹 Filter NC items */
  const ncItems = useMemo(() => {
    return items.filter(i => i.isNCKOT === 1);
  }, [items]);

  /** 🔹 Fetch printer + outlet details (parallel) */
  useEffect(() => {
    if (!show || !user?.outletid) {
      setIsLoadingNames(false);
      return;
    }

    const fetchPrinterAndOutlet = async () => {
      setIsLoadingNames(true);
      try {
        // Parallel fetches
        const [printerRes, outletRes] = await Promise.all([
          PrintService.getKotPrinterSettings(user.outletid),
          PrintService.getOutletDetails(user.outletid)
        ]);

        // Handle wrapped/unwrapped responses (HttpClient interceptor)
        const printerData = printerRes?.data || printerRes;
        const outletData = outletRes?.data || outletRes;

        setPrinterName(printerData?.printer_name || null);
        
        // Use brand_name first (preferred), fallback to hotel_name
        if (!restaurantName || restaurantName.trim() === '' || restaurantName === 'Restaurant Name') {
          setLocalRestaurantName(outletData?.brand_name || outletData?.hotel_name || user?.hotel_name || 'Restaurant Name');
        } else {
          setLocalRestaurantName(restaurantName);
        }

        // Always set outlet name (most important)
        if (!outletName || outletName.trim() === '' || outletName === 'Outlet Name') {
          setLocalOutletName(outletData?.outlet_name || user?.outlet_name || 'Outlet Name');
        } else {
          setLocalOutletName(outletName);
        }
      } catch (error) {
        console.error('Error fetching printer/outlet:', error);
        toast.error('Failed to load printer/outlet settings.');
        setPrinterName(null);
        setLocalRestaurantName(user?.hotel_name || 'Restaurant Name');
        setLocalOutletName(user?.outlet_name || 'Outlet Name');
      } finally {
        setIsLoadingNames(false);
      }
    };

    fetchPrinterAndOutlet();
  }, [show, user, outletName, restaurantName]);

  /** 🔹 DateTime */
  const dateTime = useMemo(() => {
    return date
      ? new Date(date).toLocaleString("en-GB")
      : new Date().toLocaleString("en-GB");
  }, [date]);

  /** 🔹 Full HTML (PRINT) */
  const generateHTML = () => `
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

<div class="center bold">${restaurantName || localRestaurantName || user?.hotel_name || 'Restaurant Name'}</div>
<div class="center">${outletName || localOutletName || user?.outlet_name || 'Outlet Name'}</div>

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