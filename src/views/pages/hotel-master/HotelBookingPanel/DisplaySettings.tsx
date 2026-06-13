import { Row, Col, Form, Button, Offcanvas, Tab, Tabs } from 'react-bootstrap'
import { HotelUiSettings } from '@/common/hotel/hotelSettings'

interface DisplaySettingsOffcanvasProps {
  show: boolean
  onHide: () => void
  uiSettings: HotelUiSettings
  onUiSettingsChange: (settings: HotelUiSettings) => void
  onSave: () => void
  savingSettings: boolean
}

const DEFAULT_STATUS_BG = {
  available: '#ffffff',
  occupied: '#DFF5E1',
  cleaning: '#FFF4CC',
  reserved: '#D9F1FF',
  maintenance: '#FFE0E0',
  reservation: '#D9F1FF',
}

const DEFAULT_STATUS_TEXT = {
  available: '#4B5563',
  occupied: '#16A34A',
  cleaning: '#D4A017',
  reserved: '#0284C7',
  maintenance: '#DC2626',
  reservation: '#0284C7',
}

const DEFAULT_STATUS_BORDER = {
  available: '#9CA3AF',
  occupied: '#4ADE80',
  cleaning: '#FACC15',
  reserved: '#38BDF8',
  maintenance: '#F87171',
  reservation: '#38BDF8',
}

const DisplaySettingsOffcanvas = ({
  show,
  onHide,
  uiSettings,
  onUiSettingsChange,
  onSave,
  savingSettings,
}: DisplaySettingsOffcanvasProps) => {
  return (
    <Offcanvas show={show} onHide={onHide} placement="end" style={{ width: '525px', backgroundColor: '#ffffff' }}>
      <Offcanvas.Header closeButton>
        <Offcanvas.Title>Display Settings</Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body>
        <Form>
          <Form.Check
            type="checkbox"
            id="showRoomText"
            label="Show room subtext (floor/category)"
            checked={uiSettings.show_room_text}
            onChange={(e) => onUiSettingsChange({ ...uiSettings, show_room_text: e.target.checked })}
          />
          <Form.Check
            type="checkbox"
            id="showLeftCategory"
            label="Show left group box (floor/category name)"
            checked={uiSettings.show_left_category}
            onChange={(e) => onUiSettingsChange({ ...uiSettings, show_left_category: e.target.checked })}
            className="mt-3"
          />

          <Form.Label className="mt-3 fw-bold">Room box size: {uiSettings.room_box_size}</Form.Label>
          <div style={{ width: '100%', padding: '0 10px' }}>
            <Form.Range
              min={1}
              max={6}
              step={1}
              value={uiSettings.room_box_size}
              onChange={(e) =>
                onUiSettingsChange({ ...uiSettings, room_box_size: parseInt(e.target.value) })
              }
              style={{
                width: '100%',
                cursor: 'pointer',
                accentColor: '#000000',
                backgroundColor: '#000000',
              }}
            />
          </div>

          <hr className="my-4" />
          <h6>Status Colors</h6>

          <Tabs defaultActiveKey="background" className="mb-3">
            <Tab eventKey="background" title="Background">
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Vacant</Form.Label>
                    <Form.Control
                      type="color"
                      value={uiSettings.color_vacant}
                      onChange={(e) => onUiSettingsChange({ ...uiSettings, color_vacant: e.target.value })}
                      style={{ height: 40 }}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Occupied</Form.Label>
                    <Form.Control
                      type="color"
                      value={uiSettings.color_occupied}
                      onChange={(e) => onUiSettingsChange({ ...uiSettings, color_occupied: e.target.value })}
                      style={{ height: 40 }}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Cleaning (Dirty)</Form.Label>
                    <Form.Control
                      type="color"
                      value={uiSettings.color_cleaning}
                      onChange={(e) => onUiSettingsChange({ ...uiSettings, color_cleaning: e.target.value })}
                      style={{ height: 40 }}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Reserved (Block)</Form.Label>
                    <Form.Control
                      type="color"
                      value={uiSettings.color_reserved}
                      onChange={(e) => onUiSettingsChange({ ...uiSettings, color_reserved: e.target.value })}
                      style={{ height: 40 }}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Maintenance</Form.Label>
                    <Form.Control
                      type="color"
                      value={uiSettings.color_maintenance || DEFAULT_STATUS_BG.maintenance}
                      onChange={(e) => onUiSettingsChange({ ...uiSettings, color_maintenance: e.target.value })}
                      style={{ height: 40 }}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Reservation</Form.Label>
                    <Form.Control
                      type="color"
                      value={uiSettings.color_reservation || DEFAULT_STATUS_BG.reservation}
                      onChange={(e) => onUiSettingsChange({ ...uiSettings, color_reservation: e.target.value })}
                      style={{ height: 40 }}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Tab>

            <Tab eventKey="text" title="Text Color">
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Vacant Text</Form.Label>
                    <Form.Control
                      type="color"
                      value={uiSettings.text_color_vacant || DEFAULT_STATUS_TEXT.available}
                      onChange={(e) => onUiSettingsChange({ ...uiSettings, text_color_vacant: e.target.value })}
                      style={{ height: 40 }}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Occupied Text</Form.Label>
                    <Form.Control
                      type="color"
                      value={uiSettings.text_color_occupied || DEFAULT_STATUS_TEXT.occupied}
                      onChange={(e) => onUiSettingsChange({ ...uiSettings, text_color_occupied: e.target.value })}
                      style={{ height: 40 }}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Cleaning Text</Form.Label>
                    <Form.Control
                      type="color"
                      value={uiSettings.text_color_cleaning || DEFAULT_STATUS_TEXT.cleaning}
                      onChange={(e) => onUiSettingsChange({ ...uiSettings, text_color_cleaning: e.target.value })}
                      style={{ height: 40 }}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Reserved Text</Form.Label>
                    <Form.Control
                      type="color"
                      value={uiSettings.text_color_reserved || DEFAULT_STATUS_TEXT.reserved}
                      onChange={(e) => onUiSettingsChange({ ...uiSettings, text_color_reserved: e.target.value })}
                      style={{ height: 40 }}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Maintenance Text</Form.Label>
                    <Form.Control
                      type="color"
                      value={uiSettings.text_color_maintenance || DEFAULT_STATUS_TEXT.maintenance}
                      onChange={(e) => onUiSettingsChange({ ...uiSettings, text_color_maintenance: e.target.value })}
                      style={{ height: 40 }}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Reservation Text</Form.Label>
                    <Form.Control
                      type="color"
                      value={uiSettings.text_color_reservation || DEFAULT_STATUS_TEXT.reservation}
                      onChange={(e) => onUiSettingsChange({ ...uiSettings, text_color_reservation: e.target.value })}
                      style={{ height: 40 }}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Tab>

            <Tab eventKey="border" title="Border Color">
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Vacant Border</Form.Label>
                    <Form.Control
                      type="color"
                      value={uiSettings.border_color_vacant || DEFAULT_STATUS_BORDER.available}
                      onChange={(e) => onUiSettingsChange({ ...uiSettings, border_color_vacant: e.target.value })}
                      style={{ height: 40 }}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Occupied Border</Form.Label>
                    <Form.Control
                      type="color"
                      value={uiSettings.border_color_occupied || DEFAULT_STATUS_BORDER.occupied}
                      onChange={(e) => onUiSettingsChange({ ...uiSettings, border_color_occupied: e.target.value })}
                      style={{ height: 40 }}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Cleaning Border</Form.Label>
                    <Form.Control
                      type="color"
                      value={uiSettings.border_color_cleaning || DEFAULT_STATUS_BORDER.cleaning}
                      onChange={(e) => onUiSettingsChange({ ...uiSettings, border_color_cleaning: e.target.value })}
                      style={{ height: 40 }}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Reserved Border</Form.Label>
                    <Form.Control
                      type="color"
                      value={uiSettings.border_color_reserved || DEFAULT_STATUS_BORDER.reserved}
                      onChange={(e) => onUiSettingsChange({ ...uiSettings, border_color_reserved: e.target.value })}
                      style={{ height: 40 }}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Maintenance Border</Form.Label>
                    <Form.Control
                      type="color"
                      value={uiSettings.border_color_maintenance || DEFAULT_STATUS_BORDER.maintenance}
                      onChange={(e) => onUiSettingsChange({ ...uiSettings, border_color_maintenance: e.target.value })}
                      style={{ height: 40 }}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Reservation Border</Form.Label>
                    <Form.Control
                      type="color"
                      value={uiSettings.border_color_reservation || DEFAULT_STATUS_BORDER.reservation}
                      onChange={(e) => onUiSettingsChange({ ...uiSettings, border_color_reservation: e.target.value })}
                      style={{ height: 40 }}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Tab>

            <Tab eventKey="warning" title="Warning Colors">
              <Form.Group className="mb-3">
                <Form.Label>Checkout Warning (30 min or less) - Background</Form.Label>
                <Form.Control
                  type="color"
                  value={uiSettings.occupied_warning_bg || '#b96eff'}
                  onChange={(e) => onUiSettingsChange({ ...uiSettings, occupied_warning_bg: e.target.value })}
                  style={{ height: 40 }}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Checkout Warning (30 min or less) - Text</Form.Label>
                <Form.Control
                  type="color"
                  value={uiSettings.occupied_warning_text || '#ffffff'}
                  onChange={(e) => onUiSettingsChange({ ...uiSettings, occupied_warning_text: e.target.value })}
                  style={{ height: 40 }}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Checkout Expired - Background</Form.Label>
                <Form.Control
                  type="color"
                  value={uiSettings.occupied_expired_bg || '#E03F4F'}
                  onChange={(e) => onUiSettingsChange({ ...uiSettings, occupied_expired_bg: e.target.value })}
                  style={{ height: 40 }}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Checkout Expired - Text</Form.Label>
                <Form.Control
                  type="color"
                  value={uiSettings.occupied_expired_text || '#ffffff'}
                  onChange={(e) => onUiSettingsChange({ ...uiSettings, occupied_expired_text: e.target.value })}
                  style={{ height: 40 }}
                />
              </Form.Group>
            </Tab>
          </Tabs>

          <div className="d-grid mt-4">
            <Button variant="primary" onClick={onSave} disabled={savingSettings}>
              {savingSettings ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
          <p className="text-muted small mt-3">
            Settings are saved per hotel and will persist across sessions.
          </p>
        </Form>
      </Offcanvas.Body>
    </Offcanvas>
  )
}

export default DisplaySettingsOffcanvas