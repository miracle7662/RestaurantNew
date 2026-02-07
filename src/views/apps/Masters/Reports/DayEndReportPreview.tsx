import React, { useEffect, useState } from 'react';
import { Button,  } from 'react-bootstrap';
import { Printer, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuthContext } from '@/common/context/useAuthContext';


const DayEndReportPreview: React.FC = () => {
  const navigate = useNavigate();
  const [previewHTML, setPreviewHTML] = useState('');
  const [printerName, setPrinterName] = useState<string | null>(null);
  const [, setOutletId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
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
  // Fetch printer settings and outlet details
    useEffect(() => {
      const fetchPrinterAndOutlet = async () => {
        // Get outletId from user outletid, then hotelid
        const outletIdToUse = user?.outletid || user?.hotelid;
  
        if (!outletIdToUse) return;
  
        setOutletId(Number(outletIdToUse));
  
        try {
          const res = await fetch(
            `http://localhost:3001/api/settings/report-printer/${outletIdToUse}`
          );
          if (!res.ok) {
            throw new Error('Failed to fetch printers');
          }
          const data = await res.json();
          setPrinterName(data[0]?.printer_name || null);
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

      // Get system printers via Electron API (asynchronous)
      const systemPrintersRaw = await (window as any).electronAPI?.getInstalledPrinters?.() || [];
      const systemPrinters = Array.isArray(systemPrintersRaw) ? systemPrintersRaw : [];
      console.log("System Printers:", systemPrinters);

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
          <div
            className="border rounded p-3 bg-white"
            style={{
              fontFamily: 'monospace',
              fontSize: '12px',
              lineHeight: '1.2',
              whiteSpace: 'pre-wrap',
              maxWidth: '320px',
              margin: '0 auto',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}
            dangerouslySetInnerHTML={{
              __html: previewHTML.replace(/<html>[\s\S]*<body>/, '').replace(/<\/body><\/html>/, '')
            }}
          />
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
