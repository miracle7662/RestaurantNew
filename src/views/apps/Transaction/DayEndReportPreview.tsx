import React from 'react';
import { Button, Card } from 'react-bootstrap';
import { Printer } from 'lucide-react';

interface DayEndReportPreviewProps {
  previewHTML: string;
  handlePrintPreview: () => void;
}

const DayEndReportPreview: React.FC<DayEndReportPreviewProps> = ({
  previewHTML,
  handlePrintPreview,
}) => {
  return (
    <div className="p-3">
      {previewHTML ? (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="mb-0 fw-bold">Day End Report Preview</h6>
            <Button variant="primary" onClick={handlePrintPreview}>
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
