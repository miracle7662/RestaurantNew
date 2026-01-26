import React, { useEffect, useState } from 'react';
import { Button, Card } from 'react-bootstrap';
import { Printer, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DayEndReportPreview: React.FC = () => {
  const navigate = useNavigate();
  const [previewHTML, setPreviewHTML] = useState('');

  useEffect(() => {
    // Retrieve the HTML from sessionStorage
    const html = sessionStorage.getItem('dayEndReportHTML');
    if (html) {
      setPreviewHTML(html);
    } else {
      // If no HTML found, redirect back to DayEnd
      navigate('/apps/Transaction/DayEnd');
    }
  }, [navigate]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(previewHTML);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleBack = () => {
    navigate('/apps/Transaction/DayEnd');
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
            <Button variant="primary" onClick={handlePrint}>
              <Printer size={16} className="me-2" />
              Print Report
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
              margin: '0 auto'
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
