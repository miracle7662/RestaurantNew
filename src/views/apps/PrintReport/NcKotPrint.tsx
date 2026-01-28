import { useEffect, useState, useMemo } from "react";
import { Button, Modal, Spinner } from "react-bootstrap";
import { toast } from "react-hot-toast";

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

  const ncItems = useMemo(
    () => items.filter(i => i.isNCKOT === 1),
    [items]
  );

  useEffect(() => {
    if (!show) return;

    const fetchPrinter = async () => {
      try {
        const res = await fetch(
          `http://localhost:3001/api/settings/kot-printer-settings/${user?.outletid}`
        );
        const data = await res.json();
        setPrinterName(data?.printer_name || null);
      } catch {
        toast.error("Failed to load printer settings");
      }
    };

    fetchPrinter();
  }, [show, user]);

  const dateTime = date
    ? new Date(date).toLocaleString("en-GB")
    : new Date().toLocaleString("en-GB");

  const generateNCKOTHTML = () => {
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
  hr { border-top: 1px dashed #000; }
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

<table width="100%">
<tr>
  <th align="left">Item</th>
  <th align="center">Qty</th>
</tr>
${ncItems
  .map(
    i => `
<tr>
  <td>${i.name}</td>
  <td align="center">${i.qty}</td>
</tr>`
  )
  .join("")}
</table>

<hr />

<div class="center">*** NC KOT ***</div>

</body>
</html>
`;
  };

  const handlePrint = async () => {
    try {
      setLoading(true);

      if (!printerName) {
        toast.error("Printer not configured");
        return;
      }

      const html = generateNCKOTHTML();

      await (window as any).electronAPI.directPrint(html, printerName);
      toast.success("NC KOT Printed");

      onHide();
    } catch (err) {
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
          <Spinner />
        ) : (
          <div
            style={{
              width: "302px",
              margin: "0 auto",
              border: "1px solid #ccc",
              padding: "10px"
            }}
            dangerouslySetInnerHTML={{ __html: generateNCKOTHTML() }}
          />
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Close</Button>
        <Button variant="danger" onClick={handlePrint} disabled={loading}>
          Print NC KOT
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default NCKotPrint;
