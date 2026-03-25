import React, { useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import { Printer, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useAuthContext } from "@/common/context/useAuthContext";
import SettingsService from "@/common/api/settings";

const DayEndReportPreview: React.FC = () => {
  const navigate = useNavigate();
  const [previewHTML, setPreviewHTML] = useState("");
  const [printerName, setPrinterName] = useState<string | null>(null);
  const [, setOutletId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuthContext();

  // ✅ Load Preview HTML
  useEffect(() => {
    const html = sessionStorage.getItem("dayEndReportHTML");
    if (html) {
      setPreviewHTML(html);
    } else {
      navigate("/apps/DayEnd");
    }
  }, [navigate]);

  // ✅ Fetch Printer
  useEffect(() => {
    const fetchPrinterAndOutlet = async () => {
      const outletIdToUse = user?.outletid || user?.hotelid;
      if (!outletIdToUse) return;

      setOutletId(Number(outletIdToUse));

      try {
        const printerData = await SettingsService.getReportPrinterById(
          Number(outletIdToUse)
        );
        setPrinterName(printerData[0]?.printer_name || null);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load printer settings.");
      }
    };

    fetchPrinterAndOutlet();
  }, [user]);

  // ✅ 🔥 Create FULL HTML for print (IMPORTANT FIX)
  const getFullHTML = () => {
    return `
      <html>
        <head>
          <style>
            @page {
              size: 80mm auto;
              margin: 0;
            }

            body {
              width: 72mm;
              margin-left: 3mm;
              font-family: monospace;
              font-size: 11px;
              line-height: 1.3;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              table-layout: fixed;
            }

            th, td {
              padding: 2px;
              border-bottom: 1px dashed #000;
              font-size: 10px;
            }

            th { text-align: left; }
            td { overflow: hidden; white-space: nowrap; }

            .right { text-align: right; }

            .total {
              font-weight: bold;
              border-top: 1px solid #000;
            }
          </style>
        </head>
        <body>
          ${previewHTML}
        </body>
      </html>
    `;
  };

  // ✅ Print Function
  const handlePrint = async () => {
    try {
      setLoading(true);

      const printersRaw =
        (await (window as any).electronAPI?.getInstalledPrinters?.()) || [];
      const printers = Array.isArray(printersRaw) ? printersRaw : [];

      if (printers.length === 0) {
        toast.error("No printers found");
        return;
      }

      const normalize = (s: string) =>
        s.toLowerCase().replace(/\s+/g, "");

      let finalPrinter: string | null = null;

      // ✅ Match selected printer
      if (printerName) {
        const match = printers.find(
          (p: any) =>
            normalize(p.name).includes(normalize(printerName)) ||
            normalize(p.displayName || "").includes(normalize(printerName))
        );
        if (match) finalPrinter = match.name;
      }

      // ✅ Fallback
      if (!finalPrinter) {
        const fallback =
          printers.find((p: any) => p.isDefault) || printers[0];
        finalPrinter = fallback?.name;
      }

      if (!finalPrinter) {
        toast.error("No printer available");
        return;
      }

      // ✅ 🔥 FINAL PRINT
      const fullHTML = getFullHTML();

      if ((window as any).electronAPI?.directPrint) {
        await (window as any).electronAPI.directPrint(
          fullHTML,
          finalPrinter
        );
        toast.success("Printed successfully!");
      } else {
        toast.error("Print API not available");
      }
    } catch (err) {
      console.error(err);
      toast.error("Print failed");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => navigate("/apps/DayEnd");

  return (
    <div className="p-3">
      {previewHTML ? (
        <>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex align-items-center">
              <Button
                variant="outline-secondary"
                onClick={handleBack}
                className="me-3"
              >
                <ArrowLeft size={16} className="me-2" />
                Back
              </Button>
              <h6 className="mb-0 fw-bold">
                Day End Report Preview
              </h6>
            </div>

            <Button onClick={handlePrint} disabled={loading}>
              <Printer size={16} className="me-2" />
              {loading ? "Printing..." : "Print"}
            </Button>
          </div>

          {/* ✅ Preview */}
          <div
            className="border rounded p-3 bg-white"
            style={{
              fontFamily: "monospace",
              fontSize: "12px",
              maxWidth: "320px",
              margin: "0 auto",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
            dangerouslySetInnerHTML={{
              __html: previewHTML
                .replace(/<html[^>]*>/i, "")
                .replace(/<\/html>/i, "")
                .replace(/<body[^>]*>/i, "")
                .replace(/<\/body>/i, ""),
            }}
          />
        </>
      ) : (
        <div className="text-center py-5">
          <Printer size={48} className="text-muted mb-3" />
          <h6>No Report Generated</h6>
        </div>
      )}
    </div>
  );
};

export default DayEndReportPreview;