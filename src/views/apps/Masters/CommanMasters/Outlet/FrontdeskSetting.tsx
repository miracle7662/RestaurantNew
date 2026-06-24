// FrontDeskSettingsModal.tsx
import React, { useState, useEffect } from 'react';
import { Modal, Card, Form, Button, Row, Col, Badge } from 'react-bootstrap';
import FrontdeskSettingAPI, { FrontdeskSetting } from '@/common/hotel/frontdeskSettings';
import Swal from 'sweetalert2';

interface FrontDeskSettingsModalProps {
  show: boolean;
  onHide: () => void;
  selectedOutlet: any;
  userId?: number; // Optional: pass from parent component
}

const FrontDeskSettingsModal: React.FC<FrontDeskSettingsModalProps> = ({
  show,
  onHide,
  selectedOutlet,
  userId = 1, // Default fallback
}) => {
  const [formData, setFormData] = useState({
    hotelid: selectedOutlet?.hotelid || 1,
    outletid: selectedOutlet?.outletid || 1,
    checkout_time_setting: '12_NOON' as '12_NOON' | '24_HOURS',
    fixed_checkout_time: '12:00',
    created_by_id: userId,
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [existingSetting, setExistingSetting] = useState<FrontdeskSetting | null>(null);
  const [isUpdateMode, setIsUpdateMode] = useState(false);

  // Fetch existing settings when modal opens or selectedOutlet changes
  useEffect(() => {
    if (show && selectedOutlet) {
      fetchExistingSettings();
    }
  }, [show, selectedOutlet]);

  // Update form data when selectedOutlet changes
  useEffect(() => {
    if (selectedOutlet && !existingSetting) {
      setFormData((prev) => ({
        ...prev,
        hotelid: selectedOutlet.hotelid || 1,
        outletid: selectedOutlet.outletid || 1,
      }));
    }
  }, [selectedOutlet, existingSetting]);

  const fetchExistingSettings = async () => {
    try {
      setLoading(true);
      const response = await FrontdeskSettingAPI.getByOutlet(selectedOutlet.outletid);
      
      if (response.success && response.data) {
        setExistingSetting(response.data);
        setIsUpdateMode(true);
        // Populate form with existing data
        setFormData({
          hotelid: response.data.hotelid,
          outletid: response.data.outletid,
          checkout_time_setting: response.data.checkout_time_setting,
          fixed_checkout_time: response.data.fixed_checkout_time || '12:00',
          created_by_id: response.data.created_by_id || userId,
        });
      } else {
        // No existing setting, use defaults
        setExistingSetting(null);
        setIsUpdateMode(false);
        setFormData({
          hotelid: selectedOutlet?.hotelid || 1,
          outletid: selectedOutlet?.outletid || 1,
          checkout_time_setting: '12_NOON',
          fixed_checkout_time: '12:00',
          created_by_id: userId,
        });
      }
    } catch (error: any) {
      // If 404, no settings exist - that's fine
      if (error.response?.status === 404) {
        setExistingSetting(null);
        setIsUpdateMode(false);
        setFormData({
          hotelid: selectedOutlet?.hotelid || 1,
          outletid: selectedOutlet?.outletid || 1,
          checkout_time_setting: '12_NOON',
          fixed_checkout_time: '12:00',
          created_by_id: userId,
        });
      } else {
        console.error('Error fetching settings:', error);
        Swal.fire({
          icon: 'warning',
          title: 'Error',
          text: 'Could not fetch existing settings. Please try again.',
          confirmButtonColor: '#5b6fed',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    const [h, m] = time.split(':');
    const hour = parseInt(h, 10);
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayHour}:${m} ${suffix}`;
  };

  const handleSave = async () => {
    if (!selectedOutlet) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No outlet selected',
        confirmButtonColor: '#5b6fed',
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        hotelid: formData.hotelid,
        outletid: formData.outletid,
        checkout_time_setting: formData.checkout_time_setting,
        fixed_checkout_time: formData.checkout_time_setting === '12_NOON' 
          ? formData.fixed_checkout_time 
          : null,
        updated_by_id: userId,
      };

      let response;
      if (isUpdateMode && existingSetting) {
        // Update existing setting
        response = await FrontdeskSettingAPI.update(
          existingSetting.frontdesk_setting_id, 
          payload
        );
      } else {
        // Create new setting
        response = await FrontdeskSettingAPI.create({
          ...payload,
          created_by_id: userId,
        });
      }

      if (response.success) {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: `Front Desk Setting ${isUpdateMode ? 'Updated' : 'Saved'} Successfully`,
          confirmButtonColor: '#5b6fed',
        });
        onHide();
      }
    } catch (error: any) {
      let errorMessage = 'Unable to Save Setting';
      
      if (error.response?.status === 409) {
        errorMessage = 'A setting already exists for this outlet. Please refresh and try again.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Setting not found. It may have been deleted.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMessage,
        confirmButtonColor: '#5b6fed',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg" className="fds-modal">
      <style>{`
        .fds-modal .modal-content {
          border: none;
          border-radius: 14px;
        }
        .fds-modal .modal-header {
          border-bottom: 1px solid #EEF0F4;
          padding: 1.25rem 1.5rem;
        }
        .fds-modal .modal-title {
          font-weight: 600;
          font-size: 18px;
          color: #20242C;
        }
        .fds-card {
          border: 1px solid #ECEEF2;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(20, 25, 40, 0.04);
        }
        .fds-card .card-header {
          background: #fff;
          border-bottom: 1px solid #ECEEF2;
          border-radius: 12px 12px 0 0;
          padding: 0.9rem 1.25rem;
        }
        .fds-card .card-body {
          padding: 1.5rem;
        }
        .fds-radio-group .form-check {
          margin-bottom: 0;
        }
        .fds-radio-group .form-check-label {
          font-size: 14.5px;
          color: #3A3F4B;
        }
        .fds-radio-group .form-check-input:checked {
          background-color: #5b6fed;
          border-color: #5b6fed;
        }
        .fds-time-input {
          max-width: 180px;
          border: 1px solid #DCE0E8;
        }
        .fds-time-input:focus {
          border-color: #5b6fed;
          box-shadow: 0 0 0 3px rgba(91, 111, 237, 0.12);
        }
        .fds-preview {
          background: #F6F7FB;
          border: 1px solid #ECEEF2;
          border-radius: 10px;
          padding: 1rem 1.25rem;
        }
        .fds-preview-label {
          font-size: 11.5px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          color: #8A8FA0;
          margin-bottom: 4px;
        }
        .fds-preview-value {
          font-size: 15px;
          font-weight: 600;
          color: #20242C;
        }
        .fds-btn-primary {
          background-color: #5b6fed;
          border-color: #5b6fed;
          font-weight: 500;
          padding: 0.5rem 1.4rem;
        }
        .fds-btn-primary:hover, .fds-btn-primary:focus {
          background-color: #4759d4;
          border-color: #4759d4;
        }
        .fds-btn-primary:disabled {
          background-color: #a0aec0;
          border-color: #a0aec0;
          cursor: not-allowed;
        }
        .loading-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          z-index: 10;
        }
        .fds-card {
          position: relative;
        }
      `}</style>

      <Modal.Header closeButton>
        <Modal.Title>Front Desk Settings</Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-4">
        <Card className="fds-card">
          <Card.Header className="d-flex align-items-center justify-content-between">
            <h6 className="mb-0 fw-semibold">
              Outlet: {selectedOutlet?.outlet_name || 'N/A'}
            </h6>
            <Badge bg={isUpdateMode ? "warning" : "info"} className="border">
              {isUpdateMode ? 'Update Mode' : 'New Setting'}
            </Badge>
          </Card.Header>

          <Card.Body>
            {loading && (
              <div className="loading-overlay">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            )}
            
            <Row>
              <Col md={7}>
                <Form.Group>
                  <Form.Label className="fw-semibold mb-2">
                    Checkout Time Setting
                  </Form.Label>

                  <div className="fds-radio-group d-flex gap-4">
                    <Form.Check
                      type="radio"
                      id="checkout-fixed"
                      label="12 Noon / Fixed Time"
                      name="checkout_time_setting"
                      value="12_NOON"
                      checked={formData.checkout_time_setting === '12_NOON'}
                      onChange={handleChange}
                    />

                    <Form.Check
                      type="radio"
                      id="checkout-24h"
                      label="24 Hours"
                      name="checkout_time_setting"
                      value="24_HOURS"
                      checked={formData.checkout_time_setting === '24_HOURS'}
                      onChange={handleChange}
                    />
                  </div>
                </Form.Group>
              </Col>
            </Row>

            {formData.checkout_time_setting === '12_NOON' && (
              <Row className="mt-3">
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="fw-semibold mb-2">
                      Fixed Checkout Time
                    </Form.Label>
                    <Form.Control
                      className="fds-time-input"
                      type="time"
                      name="fixed_checkout_time"
                      value={formData.fixed_checkout_time}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
              </Row>
            )}

            <hr className="my-4" />

            <Form.Label className="fw-semibold mb-2 d-block">Preview</Form.Label>
            <div className="fds-preview">
              {formData.checkout_time_setting === '12_NOON' ? (
                <>
                  <div className="fds-preview-label">Checkout type</div>
                  <div className="fds-preview-value mb-2">Fixed Time</div>
                  <div className="fds-preview-label">Checkout time</div>
                  <div className="fds-preview-value">
                    {formatTime(formData.fixed_checkout_time)}
                  </div>
                </>
              ) : (
                <>
                  <div className="fds-preview-label">Checkout type</div>
                  <div className="fds-preview-value mb-2">24 Hours</div>
                  <div className="fds-preview-label">Rule</div>
                  <div className="fds-preview-value">
                    Checkout time = Check-in time + 24 hours
                  </div>
                </>
              )}
            </div>
          </Card.Body>
        </Card>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onHide}>
          Close
        </Button>
        <Button 
          className="fds-btn-primary" 
          onClick={handleSave} 
          disabled={saving || loading}
        >
          {saving ? 'Saving...' : isUpdateMode ? 'Update Setting' : 'Save Setting'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default FrontDeskSettingsModal;