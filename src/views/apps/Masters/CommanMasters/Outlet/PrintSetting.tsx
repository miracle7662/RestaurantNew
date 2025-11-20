import React, { useState } from 'react';
import { Card, Form, Button } from 'react-bootstrap';

interface PrintSettingProps {
  onBack: () => void;
  selectedOutlet: any; // Adjust type as needed
}

const PrintSetting: React.FC<PrintSettingProps> = ({ onBack, selectedOutlet }) => {
  const [enableKOT, setEnableKOT] = useState(false);
  const [enableBill, setEnableBill] = useState(false);
  const [showBillPreview, setShowBillPreview] = useState(false);
  const [showKOTPreview, setShowKOTPreview] = useState(false);

  return (
    <Card>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h4 className="mb-0">Print Settings for {selectedOutlet?.outlet_name}</h4>
        <Button variant="danger" onClick={onBack}>
          Back to Outlet List
        </Button>
      </Card.Header>
      <Card.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Check
              type="switch"
              id="enable-kot"
              label="Enable KOT Print"
              checked={enableKOT}
              onChange={(e) => setEnableKOT(e.target.checked)}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Check
              type="switch"
              id="enable-bill"
              label="Enable Bill Print"
              checked={enableBill}
              onChange={(e) => setEnableBill(e.target.checked)}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Check
              type="switch"
              id="show-bill-preview"
              label="Show Bill Preview Before Printing"
              checked={showBillPreview}
              onChange={(e) => setShowBillPreview(e.target.checked)}
              disabled={!enableBill}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Check
              type="switch"
              id="show-kot-preview"
              label="Show KOT Preview Before Printing"
              checked={showKOTPreview}
              onChange={(e) => setShowKOTPreview(e.target.checked)}
              disabled={!enableKOT}
            />
          </Form.Group>
        </Form>
      </Card.Body>
      <Card.Footer className="text-end">
        <Button variant="secondary" onClick={onBack} className="me-2">
          Close
        </Button>
        <Button variant="primary" onClick={() => { /* Add save logic here */ onBack(); }}>
          Save Changes
        </Button>
      </Card.Footer>
    </Card>
  );
};

export default PrintSetting;
