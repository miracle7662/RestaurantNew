import React, { useEffect, useState } from 'react';
import { Button,  } from 'react-bootstrap';
import { Printer, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuthContext } from '@/common/context/useAuthContext';
import SettingsService from '@/common/api/settings';


const DayEndReportPreview: React.FC = () => {
  const navigate = useNavigate();
  const [previewHTML, setPreviewHTML] = useState('');
  const [printerName, setPrinterName] = useState<string | null>(null);
  const [, setOutletId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [printIframeRef, setPrintIframeRef] = useState<HTMLIFrameElement | null>(null);
  const { user } = useAuthContext();

  useEffect(() => {
    // Retrieve the HTML from sessionStorage
    const html = sessionStorage.getItem('dayEndReportHTML');
    if (html) {
      setPreviewHTML(html);
    } else {
      // If no HTML found, redirect back to DayEnd
      navigate('/apps/DayEnd');
    }
  }, [navigate]);

  // Fetch printer settings and outlet details
    useEffect(() => {
      const fetchPrinterAndOutlet = async () => {
        // Get outletId from user outletid, then hotelid
        const outletIdToUse = user?.outletid || user?.hotelid;
  
        if (!outletIdToUse) return;
  
        setOutletId(Number(outletIdToUse));
        try {
          const printerData = await SettingsService.getReportPrinterById(Number(outletIdToUse));
          setPrinterName(printerData[0]?.printer_name || null);
        } catch (err) {
          console.error('Error fetching printer:', err);
          toast.error('Failed to load printer settings.');
          setPrinterName(null);
        }
      };
  
      fetchPrinterAndOutlet();
    }, [user]);
  

  const handlePrint = async () => {
    try {
      setLoading(true);

      // Debug HTML content
      console.log('📄 Preview HTML length:', previewHTML.length);
      console.log('📄 Preview HTML preview:', previewHTML.substring(0, 500) + '...');

      // Try iframe print first (better for web content)
      if (printIframeRef?.contentWindow) {
        const iframeWin = printIframeRef.contentWindow!;
        iframeWin.focus();
        iframeWin.print();
        toast.success("Print dialog opened! Use system dialog to print.");
        setLoading(false);
        return;
      }

      // Fallback to Electron direct print
      const systemPrintersRaw = await (window as any).electronAPI?.getInstalledPrinters?.() || [];
      const systemPrinters = Array.isArray(systemPrintersRaw) ? systemPrintersRaw : [];
      console.log("🖨️ System Printers:", systemPrinters);

      if (systemPrinters.length === 0) {
        toast.error("No printers detected on this system. Please check printer connections and drivers.");
        return;
      }

      const normalize = (s: string) =>
        s.toLowerCase().replace(/\s+/g, "").trim();

      let finalPrinterName: string | null = null;
      let usedFallback = false;

      // Try to match the configured printer (case-insensitive, partial match)
      if (printerName) {
        const matchedPrinter = systemPrinters.find((p: any) =>
          normalize(p.name).includes(normalize(printerName)) ||
          normalize(p.displayName || "").includes(normalize(printerName))
        );

        if (matchedPrinter) {
          finalPrinterName = matchedPrinter.name;
        }
      }

      // If no configured printer or not found, use default printer or first available
      if (!finalPrinterName) {
        const defaultPrinter = systemPrinters.find((p: any) => p.isDefault);
        const fallbackPrinter = defaultPrinter || systemPrinters[0];

        if (fallbackPrinter) {
          finalPrinterName = fallbackPrinter.name;
          usedFallback = true;
          if (printerName) {
            console.warn(`Configured printer "${printerName}" not found. Using fallback: ${fallbackPrinter.displayName || fallbackPrinter.name}`);
            toast(`Printer "${printerName}" not found. Using fallback: ${fallbackPrinter.displayName || fallbackPrinter.name}`);
          }
        } else {
          toast.error("No suitable printer found, including fallbacks.");
          return;
        }
      }

      if (!finalPrinterName) {
        toast.error("Failed to determine printer name.");
        return;
      }
      if (usedFallback) {
  console.log("Fallback printer used");
}

      // Print using Electron API
      if ((window as any).electronAPI?.directPrint) {
        await (window as any).electronAPI.directPrint(previewHTML, finalPrinterName);
        toast.success("Day End Report Printed Successfully!");
      } else {
        toast.error("Electron print API not available.");
      }
    } catch (err) {
      console.error("Print error:", err);
      toast.error("Failed to print Day End Report.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/apps/DayEnd');
  };

  return (
    <div className="p-3">
      {previewHTML ? (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex align-items-center">
              <Button variant="outline-secondary" onClick={handleBack} className="me-3">
                <ArrowLeft size={16} className="me-2" />
                Back
              </Button>
              <h6 className="mb-0 fw-bold">Day End Report Preview</h6>
            </div>
            <Button variant="primary" onClick={handlePrint} disabled={loading}>
              <Printer size={16} className="me-2" />
              {loading ? 'Printing...' : 'Print Report'}
            </Button>
          </div>
          <div className="border rounded bg-white" style={{ maxHeight: '80vh', overflow: 'auto' }}>
            <iframe
              ref={(el) => {
                if (el) setPrintIframeRef(el);
              }}
              srcDoc={`
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="UTF-8">
                  <style>
                    body {
                      font-family: 'Courier New', Courier, monospace !important;
                      font-size: 13px !important;
                      line-height: 1.4 !important;
                      margin: 0.25in !important;
                      padding: 0.125in !important;
                      width: 100% !important;
                      min-width: 7.5in !important;
                      max-width: none !important;
                      color: black !important;
                      background: white !important;
                      print-color-adjust: exact !important;
                      -webkit-print-color-adjust: exact !important;
                      word-wrap: break-word !important;
                    }
                    img { max-width: 100% !important; height: auto !important; }
                    table { 
                      width: 100% !important; 
                      border-collapse: collapse !important;
                      table-layout: fixed !important;
                      word-wrap: break-word !important;
                    }
                    td, th { 
                      word-wrap: break-word !important;
                      padding: 2px 4px !important;
                    }
                    @media print {
                      body {
                        margin: 0.125in !important;
                        padding: 0.0625in !important;
                        font-size: 12px !important;
                        line-height: 1.3 !important;
                        -webkit-print-color-adjust: exact !important;
                        color-adjust: exact !important;
                      }
                      @page {
                        size: A4 portrait;
                        margin: 0.125in;
                      }
                      table { font-size: 11px !important; }
                    }
                    * { box-sizing: border-box !important; }
                  </style>
                </head>
                <body>
                  ${previewHTML}
                </body>
                </html>
              `}
              style={{
                width: '100%',
                height: '600px',
                border: 'none',
                fontFamily: 'monospace',
                fontSize: '12px'
              }}
              title="Day End Report Preview"
            />
          </div>
          {previewHTML.length < 100 && (
            <div className="alert alert-warning mt-2">
              ⚠️ Warning: Preview HTML is very short ({previewHTML.length} chars). Check DayEnd report generation.
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-5">
          <Printer size={48} className="text-muted mb-3" />
          <h6 className="text-muted">No Report Generated</h6>
          <p className="text-muted small">Click "DayEnd" button to generate reports</p>
        </div>
      )}
    </div>
  );
};

export default DayEndReportPreview;
