import React, { useState, useEffect } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { OccupiedRoomItem } from '@/types/room';

interface DayExtendModalProps {
  show: boolean;
  occupiedItem: OccupiedRoomItem | null;
  siblingRooms: OccupiedRoomItem[];
  extending: boolean;
  onHide: () => void;
  onExtend: (params: {
    extensionDays: number;
    exPaxCount: number;
    childCount: number;
    driverCount: number;
    autoExtendSiblings: boolean;
  }) => void;
}

const formatDateTime = (isoString: string): string => {
  if (!isoString) return 'N/A';
  const d = new Date(isoString);
  const day = d.getDate().toString().padStart(2, '0');
  const month = d.toLocaleString('default', { month: 'short' }).replace('.', '');
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${day}-${month}-${year} ${hours}:${minutes}`;
};

const DayExtendModal: React.FC<DayExtendModalProps> = ({
  show,
  occupiedItem,
  siblingRooms,
  extending,
  onHide,
  onExtend,
}) => {
  // Local state
  const [editableExPax, setEditableExPax] = useState(0);
  const [editableChild, setEditableChild] = useState(0);
  const [editableDriver, setEditableDriver] = useState(0);
  const [extensionDays, setExtensionDays] = useState(1);
  const [autoExtendSiblings, setAutoExtendSiblings] = useState(siblingRooms.length > 0);

  // Reset form when occupiedItem changes
  useEffect(() => {
    if (occupiedItem) {
      setEditableExPax(occupiedItem.ex_pax || 0);
      setEditableChild(occupiedItem.child_count || 0);
      setEditableDriver(occupiedItem.driver_count || 0);
      setExtensionDays(1);
      setAutoExtendSiblings(siblingRooms.length > 0);
    }
  }, [occupiedItem, siblingRooms]);

  

  if (!occupiedItem) return null;

  return (
    <>
      <style>{`
        .extend-charge-breakdown {
          background: #f8f9fa;
          padding: 12px;
          border-radius: 8px;
          margin: 12px 0;
          font-size: 0.85rem;
        }
        .extend-charge-breakdown p {
          margin: 4px 0;
          display: flex;
          justify-content: space-between;
        }
        .extend-charge-breakdown .total-line {
          border-top: 1px solid #dee2e6;
          margin-top: 8px;
          padding-top: 8px;
          font-weight: bold;
        }
        .extend-discount-text { color: #28a745; font-size: 0.75rem; }
        .extend-tax-text { color: #856404; font-size: 0.75rem; }
      `}</style>

      <Modal show={show} onHide={onHide} centered backdrop="static" size="sm">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="text-center w-100 fw-bold">Extend Stay</Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-4 py-4">
          {/* Icon */}
          <div className="text-center mb-3">
            <i className="fi fi-rr-alarm-clock" style={{ fontSize: '48px', color: '#E03F4F' }}></i>
          </div>

          {/* Title */}
          <h6 className="fw-semibold text-center text-danger mb-2">
            {occupiedItem.isExpired ? '⚠️ Checkout Time Has Passed! ⚠️' : 'Extend Guest Stay'}
          </h6>

          {/* Room & Guest info */}
          <p className="text-muted text-center mb-1">
            Room <strong>{occupiedItem.room_no}</strong> - <strong>{occupiedItem.guest_name}</strong>
          </p>
          <p className="text-muted text-center mb-4">
            Checkout:{' '}
            <strong className="text-danger">
              {occupiedItem.detail_checkout_datetime ? formatDateTime(occupiedItem.detail_checkout_datetime) : 'N/A'}
            </strong>
          </p>



          {/* Action Buttons */}
          <div className="d-flex gap-3 justify-content-center mt-4">
            <Button
              variant="danger"
              onClick={() =>
                onExtend({
                  extensionDays,
                  exPaxCount: editableExPax,
                  childCount: editableChild,
                  driverCount: editableDriver,
                  autoExtendSiblings,
                })
              }
              disabled={extending}
              className="px-4 rounded">
              {extending ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Extending...
                </>
              ) : (
                <>
                  <i className="fi fi-rr-check me-2"></i>Extend
                </>
              )}
            </Button>

            <Button
              variant="secondary"
              onClick={onHide}
              disabled={extending}
              className="px-4 rounded">
              <i className="fi fi-rr-cross me-2"></i>Cancel
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default DayExtendModal;