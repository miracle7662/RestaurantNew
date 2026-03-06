import React from 'react';
import { Modal, Button, Row, Col } from 'react-bootstrap';

interface VariantOption {
  variant_value_id: number;
  value_name: string;
  price: number;
}

interface VariantModalProps {
  show: boolean;
  onHide: () => void;
  itemName: string;
  variants: VariantOption[];
  onSelectVariant: (variant: VariantOption) => void;
}

/**
 * Small, POS-friendly modal for variant selection
 * Used when menu items have multiple pricing variants (e.g., Half/Full, Small/Medium/Large)
 */
const VariantModal: React.FC<VariantModalProps> = ({
  show,
  onHide,
  itemName,
  variants,
  onSelectVariant,
}) => {
  const handleVariantClick = (variant: VariantOption) => {
    onSelectVariant(variant);
    onHide();
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      size="sm"
      backdrop="static"
      keyboard={false}
      dialogClassName="variant-modal-dialog"
    >
      <Modal.Header closeButton className="py-2 px-3">
        <Modal.Title className="fs-6 fw-semibold mb-0">
          Select Variant
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="py-3 px-3">
        <div className="mb-3">
          <span className="text-muted small">Item:</span>
          <span className="fw-semibold ms-2">{itemName}</span>
        </div>
        
        <Row className="g-2">
          {variants.map((variant) => (
            <Col xs={6} key={variant.variant_value_id}>
              <Button
                variant="outline-primary"
                className="w-100 py-3 variant-btn"
                onClick={() => handleVariantClick(variant)}
                style={{
                  borderRadius: '8px',
                  fontWeight: '500',
                  whiteSpace: 'nowrap',
                }}
              >
                <div className="d-flex flex-column align-items-center">
                  <span className="fs-6">{variant.value_name}</span>
                  <span className="fs-5 fw-bold text-success">
                    ₹{variant.price.toFixed(2)}
                  </span>
                </div>
              </Button>
            </Col>
          ))}
        </Row>

        {variants.length === 0 && (
          <div className="text-center text-muted py-3">
            No variants available
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default VariantModal;
