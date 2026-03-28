import React, { useEffect, useState } from "react";
import { Button, Form, Card, Spinner, Container, Row, Col } from 'react-bootstrap';
import { Printer, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useAuthContext } from "@/common/context/useAuthContext";
import DayendService from "@/common/api/dayend";
import SettingsService from "@/common/api/settings";

// ─────────────────────────────────────────────
// Convert plain-text receipt → styled HTML (copied from DayEndReportPreview)
// ─────────────────────────────────────────────
function plaintextToStyledHTML(raw: string): string {
  const HEADERS = [
    "BILL DETAILS", "CREDIT SUMMARY", "PAYMENT SUMMARY", "DISCOUNT SUMMARY",
    "REVERSE KOTs SUMMARY", "REVERSE BILL SUMMARY", "NC KOT SUMMARY",
    "DAILY COLLECTION SUMMARY", "BILL WISE COLLECTION SUMMARY",
    "REVERSE BILLS SUMMARY", "REVERSE KOT", "MATO",
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

function isPlainTextReceipt(html: string): boolean {
  const tagCount = (html.match(/</g) || []).length;
  const lineCount = (html.match(/\n/g) || []).length;
  return tagCount < lineCount * 0.3;
}

const BackdatedDayEndReport: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  
  const [formData, setFormData] = useState({
    dayEndEmpID: '',
    businessDate: ''
  });
  const [previewHTML, setPreviewHTML] = useState("");
  const [printerName, setPrinterName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Load employees + printer
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load DayEnd employees
       

        // Load printer (same as DayEndReportPreview)
        const outletId = user?.outletid || user?.hotelid;
        if (outletId) {
          const printerData = await SettingsService.getReportPrinterById(Number(outletId));
          setPrinterName(printerData[0]?.printer_name || null);
        }
      } catch (err) {
        toast.error("Failed to load data");
        console.error(err);
      }
    };
    loadData();
  }, [user]);

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.businessDate  ) {
      toast.error("Please select  and Date");
      return;
    }

    setGenerating(true);
    try {
      const payload = {
        DayEndEmpID: Number(formData.dayEndEmpID),
        businessDate: formData.businessDate,
        selectedReports: ['billDetails', 'paymentSummary', 'discountSummary'] // Default reports
      };

      const response = await DayendService.generateReportHTML(payload);
      if (response.success && response.html) {
        setPreviewHTML(response.html);
        toast.success("Report generated successfully!");
      } else {
        toast.error(response.message || "Failed to generate report");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to generate report");
    } finally {
      setGenerating(false);
    }
  };

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
        </style>
      </head>
      <body>${previewHTML}</body>
    </html>`;

  const handlePrint = async () => {
    if (!previewHTML) return;
    
    try {
      setLoading(true);
      const printersRaw = (window as any).electronAPI?.getInstalledPrinters?.() || [];
      const printers = Array.isArray(printersRaw) ? printersRaw : [];
      
      let finalPrinter = null;
      if (printerName && printers.length > 0) {
        const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, "");
        const match = printers.find(
          (p: any) => normalize(p.name).includes(normalize(printerName)) ||
                      normalize(p.displayName || "").includes(normalize(printerName))
        );
        finalPrinter = match?.name;
      }
      
      if (!finalPrinter && printers.length > 0) {
        const fallback = printers.find((p: any) => p.isDefault) || printers[0];
        finalPrinter = fallback?.name;
      }

      if (finalPrinter && (window as any).electronAPI?.directPrint) {
        await (window as any).electronAPI.directPrint(getFullHTML(), finalPrinter);
        toast.success("Printed successfully!");
      } else {
        toast.error("No printer available or Print API not ready");
      }
    } catch (err) {
      console.error(err);
      toast.error("Print failed");
    } finally {
      setLoading(false);
    }
  };

  const renderContent = previewHTML 
    ? isPlainTextReceipt(previewHTML) 
      ? plaintextToStyledHTML(previewHTML) 
      : previewHTML.replace(/<html[^>]*>/gi, "").replace(/<\/html>/gi, "").replace(/<head[\s\S]*?<\/head>/gi, "").replace(/<body[^>]*>/gi, "").replace(/<\/body>/gi, "")
    : "";

  return (
    <Container className="py-4">
      <Row>
        <Col md={8} className="mx-auto">
          <Card>
            <Card.Header className="bg-primary text-white">
              <h4>Backdated Day End Report</h4>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleGenerateReport}>
                <Row>
                  
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Business Date *</Form.Label>
                      <Form.Control
                        type="date"
                        value={formData.businessDate}
                        onChange={(e) => setFormData({ ...formData, businessDate: e.target.value })}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <div className="text-center">
                  <Button variant="primary" type="submit" disabled={generating}>
                    {generating ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        Generating...
                      </>
                    ) : (
                      'Generate Report'
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>

          {previewHTML && (
            <Card className="mt-4">
              <Card.Header className="d-flex justify-content-between align-items-center bg-light">
                <div>
                  <Button variant="outline-secondary" size="sm" onClick={() => setPreviewHTML("")}>
                    <ArrowLeft size={14} className="me-1" /> New Report
                  </Button>
                </div>
                <Button 
                  variant="dark" 
                  size="sm" 
                  onClick={handlePrint} 
                  disabled={loading}
                >
                  <Printer size={14} className="me-1" />
                  {loading ? "Printing..." : "Print Report"}
                </Button>
              </Card.Header>
              <Card.Body style={{ maxHeight: "70vh", overflowY: "auto" }}>
                <div 
                  style={{ 
                    maxWidth: "340px", 
                    margin: "0 auto",
                    background: "#fffef5",
                    boxShadow: "2px 5px 14px rgba(0,0,0,0.25)",
                    padding: "20px 15px",
                    backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 18px,rgba(0,0,0,0.022) 19px)",
                  }}
                  dangerouslySetInnerHTML={{ __html: renderContent }} 
                />
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default BackdatedDayEndReport;

