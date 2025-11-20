import React, { useState } from 'react';
import { Modal, Form, Button } from 'react-bootstrap';

interface PrintSettingProps {
  show: boolean;
  onHide: () => void;
  selectedOutlet: any; // Adjust type as needed
}

const PrintSetting: React.FC<PrintSettingProps> = ({ show, onHide, selectedOutlet }) => {
  const [enableKOT, setEnableKOT] = useState(false);
  const [enableBill, setEnableBill] = useState(false);
  const [showBillPreview, setShowBillPreview] = useState(false);
  const [showKOTPreview, setShowKOTPreview] = useState(false);

  return (
    <Modal show={show} onHide={onHide} centered>
        <Modal.Header closeButton>
          <Modal.Title>Print Settings for {selectedOutlet?.outlet_name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
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
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Close
          </Button>
          <Button variant="primary" onClick={() => { /* Add save logic here */ onHide(); }}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
  );
};

export default PrintSetting;
