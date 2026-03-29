import React, { useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import { Printer, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useAuthContext } from "@/common/context/useAuthContext";
import SettingsService from "@/common/api/settings";

// ─────────────────────────────────────────────
// Convert plain-text receipt → styled HTML
// The backend generates lines like:
//   "BILL DETAILS\n\nBill No  Table...\n37779  24..."
// We turn every section header into a bold centred div,
// every separator line into an <hr>, and data lines into
// fixed-width monospace rows.
// ─────────────────────────────────────────────
function plaintextToStyledHTML(raw: string): string {
  // Section header keywords
  const HEADERS = [
    "BILL DETAILS",
    "CREDIT SUMMARY",
    "PAYMENT SUMMARY",
    "DISCOUNT SUMMARY",
    "REVERSE KOTs SUMMARY",
    "REVERSE BILL SUMMARY",
    "NC KOT SUMMARY",
    "DAILY COLLECTION SUMMARY",
    "BILL WISE COLLECTION SUMMARY",
    "PAYMENT SUMMARY",
    "REVERSE BILLS SUMMARY",
    "REVERSE KOT",
    "MATO",
  ];

  const SECTION_RE = new RegExp(`^(${HEADERS.join("|")})`, "i");
  const TOTAL_RE = /^(TOTAL|GRAND TOTAL|TOTAL CREDIT|TOTAL DISCOUNT|TOTAL REVERSED)/i;
  const DASHES_RE = /^[-─=]{5,}/;

  const lines = raw.split("\n");
  let out = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === "") {
      out += `<div style="height:5px"></div>`;
      continue;
    }

    if (SECTION_RE.test(trimmed)) {
      out += `
        <div style="
          font-family:'Courier New',Courier,monospace;
          font-size:11px;
          font-weight:bold;
          text-align:center;
          text-transform:uppercase;
          letter-spacing:0.4px;
          border-top:1px solid #000;
          border-bottom:1px solid #000;
          padding:2px 0;
          margin:7px 0 3px;
        ">${trimmed}</div>`;
      continue;
    }

    if (DASHES_RE.test(trimmed)) {
      out += `<div style="border-top:1px dashed #555;margin:2px 0;"></div>`;
      continue;
    }

    if (TOTAL_RE.test(trimmed)) {
      out += `
        <div style="
          font-family:'Courier New',Courier,monospace;
          font-size:11px;
          font-weight:bold;
          white-space:pre;
          border-top:1px solid #000;
          padding-top:2px;
          margin-top:1px;
        ">${trimmed}</div>`;
      continue;
    }

    // Normal data line
    out += `
      <div style="
        font-family:'Courier New',Courier,monospace;
        font-size:10.5px;
        white-space:pre;
        line-height:1.4;
        overflow:hidden;
        text-overflow:ellipsis;
      ">${trimmed}</div>`;
  }

  return out;
}

// ─────────────────────────────────────────────
// Detect whether the stored HTML is really just
// a plain-text blob wrapped in a <div> with pre-wrap
// ─────────────────────────────────────────────
function isPlainTextReceipt(html: string): boolean {
  // Backend wraps everything in one big div with white-space:pre-wrap
  // and almost no inner tags — so very few '<' characters
  const tagCount = (html.match(/</g) || []).length;
  const lineCount = (html.match(/\n/g) || []).length;
  return tagCount < lineCount * 0.3; // fewer tags than 30 % of lines → plain text
}

const DayEndReportPreview: React.FC = () => {
  const navigate = useNavigate();
  const [previewHTML, setPreviewHTML] = useState("");
  const [printerName, setPrinterName] = useState<string | null>(null);
  const [, setOutletId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuthContext();

  useEffect(() => {
    const html = sessionStorage.getItem("dayEndReportHTML");
    if (html) setPreviewHTML(html);
    else navigate("/apps/DayEnd");
  }, [navigate]);

  useEffect(() => {
    const fetchPrinterAndOutlet = async () => {
      const outletIdToUse = user?.outletid || user?.hotelid;
      if (!outletIdToUse) return;
      setOutletId(Number(outletIdToUse));
      try {
        const printerData = await SettingsService.getReportPrinterById(Number(outletIdToUse));
        setPrinterName(printerData[0]?.printer_name || null);
      } catch (err) {
        // console.error(err);
        toast.error("Failed to load printer settings.");
      }
    };
    fetchPrinterAndOutlet();
  }, [user]);

  const getFullHTML = () => `
    <html>
      <head>
        <style>
          @page { size: 80mm auto; margin: 0; }
          body {
            width: 72mm; margin-left: 3mm;
            font-family: 'Courier New', Courier, monospace;
            font-size: 11px; line-height: 1.3;
            white-space: pre-wrap;
          }
          table { width: 100%; border-collapse: collapse; table-layout: fixed; }
          th, td { padding: 2px; border-bottom: 1px dashed #000; font-size: 10px; }
          th { text-align: left; }
          td { overflow: hidden; white-space: nowrap; }
          .right { text-align: right; }
          .total { font-weight: bold; border-top: 1px solid #000; }
        </style>
      </head>
      <body>${previewHTML}</body>
    </html>`;

  const handlePrint = async () => {
    try {
      setLoading(true);
      const printersRaw = (await (window as any).electronAPI?.getInstalledPrinters?.()) || [];
      const printers = Array.isArray(printersRaw) ? printersRaw : [];
      if (printers.length === 0) { toast.error("No printers found"); return; }

      const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, "");
      let finalPrinter: string | null = null;

      if (printerName) {
        const match = printers.find(
          (p: any) =>
            normalize(p.name).includes(normalize(printerName)) ||
            normalize(p.displayName || "").includes(normalize(printerName))
        );
        if (match) finalPrinter = match.name;
      }
      if (!finalPrinter) {
        const fallback = printers.find((p: any) => p.isDefault) || printers[0];
        finalPrinter = fallback?.name;
      }
      if (!finalPrinter) { toast.error("No printer available"); return; }

      if ((window as any).electronAPI?.directPrint) {
        await (window as any).electronAPI.directPrint(getFullHTML(), finalPrinter);
        toast.success("Printed successfully!");
      } else {
        toast.error("Print API not available");
      }
    } catch (err) {
      // console.error(err);
      toast.error("Print failed");
    } finally {
      setLoading(false);
    }
  };

  // ── Decide how to render ──────────────────────────────────
  // Strip outer wrapper tags first
  const stripped = previewHTML
    .replace(/<html[^>]*>/gi, "")
    .replace(/<\/html>/gi, "")
    .replace(/<head[\s\S]*?<\/head>/gi, "")
    .replace(/<body[^>]*>/gi, "")
    .replace(/<\/body>/gi, "");

  // Extract raw text if it's the plain-text blob from the backend
  // Backend wraps in: <div style="...white-space: pre-wrap...">TEXT</div>
  const innerTextMatch = stripped.match(/<div[^>]*>([\s\S]*?)<\/div>/i);
  const rawText = innerTextMatch ? innerTextMatch[1] : stripped;

  const renderContent = isPlainTextReceipt(stripped)
    ? plaintextToStyledHTML(rawText)   // ← convert plain text to styled HTML
    : stripped;                        // ← already has HTML tables etc.

  return (
    <div style={{ background: "#d9d9d9", minHeight: "100vh", padding: "14px" }}>
      {previewHTML ? (
        <>
          {/* ── Toolbar ── */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            background: "#fff", borderRadius: "8px", padding: "8px 14px",
            marginBottom: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.13)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Button variant="outline-secondary" size="sm" onClick={() => navigate("/apps/DayEnd")}>
                <ArrowLeft size={14} style={{ marginRight: 5 }} />
                Back
              </Button>
              <strong style={{ fontSize: "14px" }}>Day End Report Preview</strong>
            </div>
            <Button variant="dark" size="sm" onClick={handlePrint} disabled={loading}>
              <Printer size={14} style={{ marginRight: 5 }} />
              {loading ? "Printing…" : "Print"}
            </Button>
          </div>

          {/* ── Receipt paper ── */}
          <div style={{ maxWidth: "340px", margin: "0 auto" }}>
            {/* tape */}
            <div style={{
              width: "54px", height: "12px",
              background: "rgba(180,180,180,0.55)",
              borderRadius: "3px", margin: "0 auto -1px",
              position: "relative", zIndex: 2,
            }} />

            {/* paper */}
            <div style={{
              background: "#fffef5",
              boxShadow: "2px 5px 14px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.07)",
              padding: "10px 12px 20px",
              maxHeight: "80vh", overflowY: "auto",
              backgroundImage:
                "repeating-linear-gradient(0deg,transparent,transparent 18px,rgba(0,0,0,0.022) 19px)",
            }}>
              <div dangerouslySetInnerHTML={{ __html: renderContent }} />
            </div>

            {/* torn bottom */}
            <div style={{
              height: "10px",
              background: [
                "linear-gradient(135deg,#fffef5 25%,transparent 25%) -7px 0",
                "linear-gradient(225deg,#fffef5 25%,transparent 25%) -7px 0",
                "linear-gradient(315deg,#fffef5 25%,transparent 25%)",
                "linear-gradient(45deg,  #fffef5 25%,transparent 25%)",
              ].join(","),
              backgroundSize: "14px 10px",
              backgroundColor: "#d9d9d9",
            }} />
          </div>
        </>
      ) : (
        <div style={{ textAlign: "center", paddingTop: "80px", color: "#999" }}>
          <Printer size={48} style={{ marginBottom: 12 }} />
          <h6>No Report Generated</h6>
        </div>
      )}
    </div>
  );
};

export default DayEndReportPreview;
