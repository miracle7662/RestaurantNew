import { Button, Modal, Form, Row, Col } from 'react-bootstrap';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuthContext } from '@/common';
import { OutletData, OutletSettings, OutletService } from '@/common/api/outlet';
import { fetchWaiterUsers, WaiterUser } from '@/services/user.service';

const convertBooleansToNumbers = (data: Record<string, any>) => {
  const result: Record<string, any> = {};

  Object.keys(data).forEach((key) => {
    const value = data[key];

    if (typeof value === 'boolean') {
      result[key] = value ? 1 : 0;
    } else {
      result[key] = value;
    }
  });

  return result;
};

const ModifyOutletSettingsModal: React.FC<{
  show: boolean;
  onHide: () => void;
  selectedOutlet: OutletData | null;
  handleUpdate: (outletId: number, hotelId: number) => Promise<void>;
}> = ({ show, onHide, selectedOutlet, handleUpdate }) => {
  const initialFormData: OutletSettings = {
    outletid: 0,
    outlet_name: '',
    outlet_code: '',
    hotelid: 0,
    brand_name: '',
    send_order_notification: 'ALL',
    bill_number_length: 2,
    next_reset_order_number_date: null,
    next_reset_order_number_days: 'Reset Order Number Daily',
    decimal_points: 2,
    bill_round_off: false,
    bill_round_off_to: 1,
    enable_loyalty: false,
    multiple_price_setting: false,
    verify_pos_system_login: false,
    table_reservation: false,
    auto_update_pos: false,
    send_report_email: false,
    send_report_whatsapp: false,
    allow_multiple_tax: false,
    enable_call_center: false,
    bharatpe_integration: false,
    phonepe_integration: false,
    reelo_integration: false,
    tally_integration: false,
    sunmi_integration: false,
    zomato_pay_integration: false,
    zomato_enabled: false,
    swiggy_enabled: false,
    rafeeq_enabled: false,
    noon_food_enabled: false,
    magicpin_enabled: false,
    dotpe_enabled: false,
    cultfit_enabled: false,
    ubereats_enabled: false,
    scooty_enabled: false,
    dunzo_enabled: false,
    foodpanda_enabled: false,
    amazon_enabled: false,
    talabat_enabled: false,
    deliveroo_enabled: false,
    careem_enabled: false,
    jahez_enabled: false,
    eazydiner_enabled: false,
    radyes_enabled: false,
    goshop_enabled: false,
    chatfood_enabled: false,
    jubeat_enabled: false,
    thrive_enabled: false,
    fidoo_enabled: false,
    mrsool_enabled: false,
    swiggystore_enabled: false,
    zomatormarket_enabled: false,
    hungerstation_enabled: false,
    instashop_enabled: false,
    eteasy_enabled: false,
    smiles_enabled: false,
    toyou_enabled: false,
    dca_enabled: false,
    ordable_enabled: false,
    beanz_enabled: false,
    cari_enabled: false,
    the_chefz_enabled: false,
    keeta_enabled: false,
    notification_channel: 'SMS',
    created_at: '',
    updated_at: '',
    updated_by_id: '',
    default_waiter_id: null,
    pax: 1,
  };

  const [formData, setFormData] = useState<OutletSettings>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [waiterUsers, setWaiterUsers] = useState<WaiterUser[]>([]);
  const { user } = useAuthContext();

  useEffect(() => {
    if (show && selectedOutlet?.outletid && selectedOutlet?.hotelid) {
      const fetchOutletSettings = async () => {
        setLoading(true);
        try {
          const response = await OutletService.getOutletSettings(selectedOutlet.outletid!);
          if (response.success) {
            const data: OutletSettings = response.data;
            setFormData({
              ...data,
              outletid: selectedOutlet.outletid!,
              hotelid: selectedOutlet.hotelid!,
              updated_by_id: user?.id ?? '1',
            });
            toast.success('Outlet settings fetched successfully!');
          } else {
            toast.error(`Failed to fetch outlet settings: ${response.message || 'Unknown error'}`);
          }
        } catch (error) {
          console.error('Error fetching outlet settings:', error);
          toast.error('Failed to fetch outlet settings. Please try again.');
        } finally {
          setLoading(false);
        }
      };

      const fetchWaiters = async () => {
        try {
          const waiters = await fetchWaiterUsers(selectedOutlet.outletid!);
          setWaiterUsers(waiters);
        } catch (error) {
          console.error('Error fetching waiter users:', error);
          toast.error('Failed to fetch waiter users.');
        }
      };

      fetchOutletSettings();
      fetchWaiters();
    } else {
      setFormData(initialFormData);
      setWaiterUsers([]);
    }
  }, [show, selectedOutlet]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    const { id, value, type } = target;
    setFormData((prev) => ({
      ...prev,
      [id]: (type === 'checkbox' || type === 'switch')
        ? (target instanceof HTMLInputElement ? target.checked : false)
        : value,
    }));
  };

  const handleSubmit = async () => {
    if (!selectedOutlet?.outletid || !selectedOutlet?.hotelid) {
      toast.error('Outlet ID and Hotel ID are required');
      return;
    }

    setLoading(true);
    try {
      const basePayload = {
        ...formData,
        outletid: selectedOutlet.outletid,
        hotelid: selectedOutlet.hotelid,
        updated_at: new Date().toISOString(),
        updated_by_id: user?.id ?? '1',
        service_charges: formData.service_charges || 0,
        invoice_message: formData.invoice_message || '',
        pax: Number(formData.pax) || 1,
      };

      const payload = convertBooleansToNumbers(basePayload);

      const response = await OutletService.updateOutletSettings(selectedOutlet.outletid!, payload as any);
      if (response.success) {
        await handleUpdate(selectedOutlet.outletid, selectedOutlet.hotelid);
        toast.success('Outlet settings updated successfully!');
        onHide();
      } else {
        toast.error(`Failed to update outlet settings: ${response.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating outlet settings:', error);
      toast.error('Failed to update outlet settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered size="xl" aria-labelledby="modify-outlet-settings-modal">
      <Modal.Header closeButton>
        <Modal.Title id="modify-outlet-settings-modal">Modify Outlet Settings</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: '590px', overflowY: 'auto' }}>
        <h6 className="mb-3">GENERAL SETTINGS:</h6>
        <Form>
          <Row className="mb-3">
            <Col md={3}>
              <Form.Group controlId="send_order_notification">
                <Form.Label>Send Order Notification</Form.Label>
                <Form.Select
                  style={{ borderColor: '#ccc' }}
                  value={formData.send_order_notification}
                  onChange={handleChange}
                  aria-label="Select order notification type"
                >
                  <option value="ALL">All</option>
                  <option value="EMAIL">Email</option>
                  <option value="SMS">SMS</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId="bill_number_length">
                <Form.Label>Bill Number Length</Form.Label>
                <div className="input-group">
                  <Button
                    variant="outline-secondary"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        bill_number_length: Math.max((prev.bill_number_length || 2) - 1, 1),
                      }))
                    }
                    aria-label="Decrease bill number length"
                  >
                    -
                  </Button>
                  <Form.Control
                    type="text"
                    className="text-center"
                    value={formData.bill_number_length || 2}
                    readOnly
                    style={{ borderColor: '#ccc' }}
                    aria-label="Bill number length"
                  />
                  <Button
                    variant="outline-secondary"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        bill_number_length: (prev.bill_number_length || 2) + 1,
                      }))
                    }
                    aria-label="Increase bill number length"
                  >
                    +
                  </Button>
                </div>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId="next_reset_order_number_date">
                <Form.Label>Next Reset Order Number Date</Form.Label>
                <Form.Control
                  type="date"
                  value={formData.next_reset_order_number_date || ''}
                  onChange={handleChange}
                  style={{ borderColor: '#ccc' }}
                  aria-label="Next reset order number date"
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId="next_reset_order_number_days">
                <Form.Label>Next Reset Order Number (In Days)</Form.Label>
                <Form.Select
                  style={{ borderColor: '#ccc' }}
                  value={formData.next_reset_order_number_days}
                  onChange={handleChange}
                  aria-label="Select reset order number frequency"
                >
                  <option value="DAILY">Reset Order Number Daily</option>
                  <option value="WEEKLY">Reset Order Number Weekly</option>
                  <option value="MONTHLY">Reset Order Number Monthly</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          <Row className="mb-3">
            <Col md={3}>
              <Form.Group controlId="decimal_points">
                <Form.Label>Select Decimal Points for Invoice Calculation and Menu Price Input</Form.Label>
                <div className="input-group">
                  <Button
                    variant="outline-secondary"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        decimal_points: Math.max((prev.decimal_points || 2) - 1, 0),
                      }))
                    }
                    aria-label="Decrease decimal points"
                  >
                    -
                  </Button>
                  <Form.Control
                    type="text"
                    className="text-center"
                    value={formData.decimal_points || 2}
                    readOnly
                    style={{ borderColor: '#ccc' }}
                    aria-label="Decimal points"
                  />
                  <Button
                    variant="outline-secondary"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        decimal_points: (prev.decimal_points || 2) + 1,
                      }))
                    }
                    aria-label="Increase decimal points"
                  >
                    +
                  </Button>
                </div>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Row>
                <Col md={6}>
                  <Form.Group controlId="bill_round_off">
                    <Form.Label>Bill Round Off</Form.Label>
                    <div className="d-flex align-items-center gap-2">
                      <Form.Check
                        type="switch"
                        id="bill_round_off"
                        checked={formData.bill_round_off}
                        onChange={handleChange}
                        aria-label="Toggle bill round off"
                      />
                      {formData.bill_round_off && (
                        <Form.Select
                          id="bill_round_off_to"
                          value={formData.bill_round_off_to}
                          onChange={handleChange}
                          style={{ width: "130px" }}
                        >
                          <option value={1}>Nearest 1</option>
                          <option value={5}>Nearest 5</option>
                          <option value={10}>Nearest 10</option>
                        </Form.Select>
                      )}
                    </div>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group controlId="multiple_price_setting">
                    <Form.Label style={{ whiteSpace: "nowrap" }}>Multiple Price Setting</Form.Label>
                    <Form.Check
                      type="switch"
                      checked={formData.multiple_price_setting}
                      onChange={handleChange}
                      aria-label="Toggle multiple price setting"
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Col>
            <Col md={3}>
              <Form.Group controlId="enable_loyalty">
                <Form.Label>Enable Loyalty</Form.Label>
                <Form.Check
                  type="switch"
                  checked={formData.enable_loyalty}
                  onChange={handleChange}
                  aria-label="Toggle loyalty program"
                />
              </Form.Group>
            </Col>
          </Row>
          <Row className="mb-3">
            <Col md={3}>
              <Form.Group controlId="default_waiter_id">
                <Form.Label>Default Waiter</Form.Label>
                <Form.Select
                  style={{ borderColor: '#ccc' }}
                  value={formData.default_waiter_id || ''}
                  onChange={handleChange}
                  aria-label="Select default waiter"
                >
                  <option value="">Select Waiter</option>
                  {waiterUsers.map((waiter) => (
                    <option key={waiter.userId} value={waiter.userId}>
                      {waiter.employee_name} ({waiter.designation})
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId="pax">
                <Form.Label>Pax</Form.Label>
                <Form.Control
                  type="number"
                  name="pax"
                  min={1}
                  value={formData.pax}
                  onChange={handleChange}
                  placeholder="Enter Pax"
                />
              </Form.Group>
            </Col>
          </Row>
          <Row className="mb-3">
            <Col md={3}>
              <Form.Group controlId="include_tax_in_invoice">
                <Form.Label>Include Tax in Invoice</Form.Label>
                <Form.Check
                  type="switch"
                  checked={formData.include_tax_in_invoice}
                  onChange={handleChange}
                  aria-label="Toggle include tax in invoice"
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId="service_charges">
                <Form.Label>Service Charges </Form.Label>
                <Form.Control
                  type="number"
                  value={formData.service_charges || 0}
                  onChange={handleChange}
                  style={{ borderColor: '#ccc' }}
                  aria-label="Service charges percentage"
                  min={0}
                  step={0.1}
                />
              </Form.Group>
            </Col>
          </Row>
          <Row className="mb-3">
            <Col md={3}>
              <Form.Group controlId="table_reservation">
                <Form.Label>Table Reservation</Form.Label>
                <Form.Check
                  type="switch"
                  checked={formData.table_reservation}
                  onChange={handleChange}
                  aria-label="Toggle table reservation"
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId="auto_update_pos">
                <Form.Label>Auto Update POS</Form.Label>
                <Form.Check
                  type="switch"
                  checked={formData.auto_update_pos}
                  onChange={handleChange}
                  aria-label="Toggle auto update POS"
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId="send_report_via">
                <Form.Label>Do You Want To Send Report Via</Form.Label>
                <Form.Check
                  type="checkbox"
                  id="send_report_email"
                  label="Email"
                  checked={formData.send_report_email}
                  onChange={handleChange}
                  aria-label="Send report via email"
                />
                <Form.Check
                  type="checkbox"
                  id="send_report_whatsapp"
                  label="WhatsApp / Text"
                  checked={formData.send_report_whatsapp}
                  onChange={handleChange}
                  aria-label="Send report via WhatsApp"
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId="allow_multiple_tax">
                <Form.Label>Allow Multiple Tax</Form.Label>
                <Form.Check
                  type="switch"
                  checked={formData.allow_multiple_tax}
                  onChange={handleChange}
                  aria-label="Toggle multiple tax"
                />
              </Form.Group>
            </Col>
          </Row>
          <Row className="mb-3">
            <Col md={3}>
              <Form.Group controlId="enable_call_center">
                <Form.Label>Enable Call Center</Form.Label>
                <Form.Check
                  type="switch"
                  checked={formData.enable_call_center}
                  onChange={handleChange}
                  aria-label="Toggle call center"
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId="verify_pos_system_login">
                <Form.Label>Verify POS System Login with Date</Form.Label>
                <Form.Check
                  type="switch"
                  checked={formData.verify_pos_system_login}
                  onChange={handleChange}
                  aria-label="Toggle POS system login verification"
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId="invoice_message">
                <Form.Label>Invoice Message</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={formData.invoice_message || ''}
                  onChange={handleChange}
                  style={{ borderColor: '#ccc', resize: 'both' }}
                  aria-label="Invoice message"
                  placeholder="Enter custom invoice message"
                />
              </Form.Group>
            </Col>
          </Row>
          <h6 className="mt-4 mb-3">Third Party Integration</h6>
          <Row className="mb-3">
            <Col md={3}>
              <Form.Group controlId="bharatpe_integration">
                <Form.Label>BharatPe Integration</Form.Label>
                <Form.Check
                  type="switch"
                  checked={formData.bharatpe_integration}
                  onChange={handleChange}
                  aria-label="Toggle BharatPe integration"
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId="phonepe_integration">
                <Form.Label>PhonePe Integration</Form.Label>
                <Form.Check
                  type="switch"
                  checked={formData.phonepe_integration}
                  onChange={handleChange}
                  aria-label="Toggle PhonePe integration"
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId="reelo_integration">
                <Form.Label>Reelo Integration</Form.Label>
                <Form.Check
                  type="switch"
                  checked={formData.reelo_integration}
                  onChange={handleChange}
                  aria-label="Toggle Reelo integration"
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId="tally_integration">
                <Form.Label>Tally Integration</Form.Label>
                <Form.Check
                  type="switch"
                  checked={formData.tally_integration}
                  onChange={handleChange}
                  aria-label="Toggle Tally integration"
                />
              </Form.Group>
            </Col>
          </Row>
          <Row className="mb-3">
            <Col md={3}>
              <Form.Group controlId="sunmi_integration">
                <Form.Label>Sunmi Integration</Form.Label>
                <Form.Check
                  type="switch"
                  checked={formData.sunmi_integration}
                  onChange={handleChange}
                  aria-label="Toggle Sunmi integration"
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId="zomato_pay_integration">
                <Form.Label>Zomato Pay Integration</Form.Label>
                <Form.Check
                  type="switch"
                  checked={formData.zomato_pay_integration}
                  onChange={handleChange}
                  aria-label="Toggle Zomato Pay integration"
                />
              </Form.Group>
            </Col>
          </Row>
          <h6 className="mt-4 mb-3">Platform Channel Enable</h6>
          <Row className="mb-3">
            <Col md={3}>
              <Form.Group controlId="zomato_enabled">
                <Form.Label>Zomato</Form.Label>
                <Form.Check
                  type="switch"
                  checked={formData.zomato_enabled}
                  onChange={handleChange}
                  aria-label="Toggle Zomato integration"
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId="swiggy_enabled">
                <Form.Label>Swiggy</Form.Label>
                <Form.Check
                  type="switch"
                  checked={formData.swiggy_enabled}
                  onChange={handleChange}
                  aria-label="Toggle Swiggy integration"
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId="rafeeq_enabled">
                <Form.Label>Rafeeq</Form.Label>
                <Form.Check
                  type="switch"
                  checked={formData.rafeeq_enabled}
                  onChange={handleChange}
                  aria-label="Toggle Rafeeq integration"
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId="noon_food_enabled">
                <Form.Label>Noon Food</Form.Label>
                <Form.Check
                  type="switch"
                  checked={formData.noon_food_enabled}
                  onChange={handleChange}
                  aria-label="Toggle Noon Food integration"
                />
              </Form.Group>
            </Col>
          </Row>
          <Row className="mb-3">
            <Col md={3}>
              <Form.Group controlId="magicpin_enabled">
                <Form.Label>Magicpin</Form.Label>
                <Form.Check
                  type="switch"
                  checked={formData.magicpin_enabled}
                  onChange={handleChange}
                  aria-label="Toggle Magicpin integration"
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId="dotpe_enabled">
                <Form.Label>DotPe</Form.Label>
                <Form.Check
                  type="switch"
                  checked={formData.dotpe_enabled}
                  onChange={handleChange}
                  aria-label="Toggle DotPe integration"
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId="cultfit_enabled">
                <Form.Label>Cultfit</Form.Label>
                <Form.Check
                  type="switch"
                  checked={formData.cultfit_enabled}
                  onChange={handleChange}
                  aria-label="Toggle Cultfit integration"
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId="ubereats_enabled">
                <Form.Label>Uber Eats</Form.Label>
                <Form.Check
                  type="switch"
                  checked={formData.ubereats_enabled}
                  onChange={handleChange}
                  aria-label="Toggle Uber Eats integration"
                />
              </Form.Group>
            </Col>
          </Row>
          <Row className="mb-3">
            <Col md={3}>
              <Form.Group controlId="scooty_enabled">
                <Form.Label>Scooty</Form.Label>
                <Form.Check
                  type="switch"
                  checked={formData.scooty_enabled}
                  onChange={handleChange}
                  aria-label="Toggle Scooty integration"
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId="dunzo_enabled">
                <Form.Label>Dunzo</Form.Label>
                <Form.Check
                  type="switch"
                  checked={formData.dunzo_enabled}
                  onChange={handleChange}
                  aria-label="Toggle Dunzo integration"
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId="foodpanda_enabled">
                <Form.Label>Foodpanda</Form.Label>
                <Form.Check
                  type="switch"
                  checked={formData.foodpanda_enabled}
                  onChange={handleChange}
                  aria-label="Toggle Foodpanda integration"
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId="amazon_enabled">
                <Form.Label>Amazon</Form.Label>
                <Form.Check
                  type="switch"
                  checked={formData.amazon_enabled}
                  onChange={handleChange}
                  aria-label="Toggle Amazon integration"
                />
              </Form.Group>
            </Col>
          </Row>
          <Row className="mb-3">
            <Col md={3}>
              <Form.Group controlId="talabat_enabled">
                <Form.Label>Talabat</Form.Label>
                <Form.Check
                  type="switch"
                  checked={formData.talabat_enabled}
                  onChange={handleChange}
                  aria-label="Toggle Talabat integration"
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId="deliveroo_enabled">
                <Form.Label>Deliveroo</Form.Label>
                <Form.Check
                  type="switch"
                  checked={formData.deliveroo_enabled}
                  onChange={handleChange}
                  aria-label="Toggle Deliveroo integration"
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId="careem_enabled">
                <Form.Label>Careem</Form.Label>
                <Form.Check
                  type="switch"
                  checked={formData.careem_enabled}
                  onChange={handleChange}
                  aria-label="Toggle Careem integration"
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId="jahez_enabled">
                <Form.Label>Jahez</Form.Label>
                <Form.Check
                  type="switch"
                  checked={formData.jahez_enabled}
                  onChange={handleChange}
                  aria-label="Toggle Jahez integration"
                />
              </Form.Group>
            </Col>
          </Row>
          <Row className="mb-3">
            <Col md={3}>
              <Form.Group controlId="eazydiner_enabled">
                <Form.Label>EazyDiner</Form.Label>
                <Form.Check
                  type="switch"
                  checked={formData.eazydiner_enabled}
                  onChange={handleChange}
                  aria-label="Toggle EazyDiner integration"
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId="radyes_enabled">
                <Form.Label>Radyes</Form.Label>
                <Form.Check
                  type="switch"
                  checked={formData.radyes_enabled}
                  onChange={handleChange}
                  aria-label="Toggle Radyes integration"
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId="goshop_enabled">
                <Form.Label>GoShop</Form.Label>
                <Form.Check
                  type="switch"
                  checked={formData.goshop_enabled}
                  onChange={handleChange}
                  aria-label="Toggle GoShop integration"
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId="chatfood_enabled">
                <Form.Label>Chatfood</Form.Label>
                <Form.Check
                  type="switch"
                  checked={formData.chatfood_enabled}
                  onChange={handleChange}
                  aria-label="Toggle Chatfood integration"
                />
              </Form.Group>
            </Col>
          </Row>
          <Row className="mb-3">
            <Col md={3}>
              <Form.Group controlId="jubeat_enabled">
                <Form.Label>Jubeat</Form.Label>
                <Form.Check
                  type="switch"
                  checked={formData.jubeat_enabled}
                  onChange={handleChange}
                  aria-label="Toggle Jubeat integration"
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId="thrive_enabled">
                <Form.Label>Thrive</Form.Label>
                <Form.Check
                  type="switch"
                  checked={formData.thrive_enabled}
                  onChange={handleChange}
                  aria-label="Toggle Thrive integration"
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId="fidoo_enabled">
                <Form.Label>Fidoo</Form.Label>
                <Form.Check
                  type="switch"
                  checked={formData.fidoo_enabled}
                  onChange={handleChange}
                  aria-label="Toggle Fidoo integration"
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId="mrsool_enabled">
                <Form.Label>Mrsool</Form.Label>
                <Form.Check
                  type="switch"
                  checked={formData.mrsool_enabled}
                  onChange={handleChange}
                  aria-label="Toggle Mrsool integration"
                />
              </Form.Group>
            </Col>
          </Row>
          <Row className="mb-3">
            <Col md={3}>
              <Form.Group controlId="swiggystore_enabled">
                <Form.Label>Swiggy Store</Form.Label>
                <Form.Check
                  type="switch"
                  checked={formData.swiggystore_enabled}
                  onChange={handleChange}
                  aria-label="Toggle Swiggy Store integration"
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId="zomatormarket_enabled">
                <Form.Label>Zomato Market</Form.Label>
                <Form.Check
                  type="switch"
                  checked={formData.zomatormarket_enabled}
                  onChange={handleChange}
                  aria-label="Toggle Zomato Market integration"
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId="hungerstation_enabled">
                <Form.Label>HungerStation</Form.Label>
                <Form.Check
                  type="switch"
                  checked={formData.hungerstation_enabled}
                  onChange={handleChange}
                  aria-label="Toggle HungerStation integration"
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId="instashop_enabled">
                <Form.Label>InstaShop</Form.Label>
                <Form.Check
                  type="switch"
                  checked={formData.instashop_enabled}
                  onChange={handleChange}
                  aria-label="Toggle InstaShop integration"
                />
              </Form.Group>
            </Col>
          </Row>
          <Row className="mb-3">
            <Col md={3}>
              <Form.Group controlId="eteasy_enabled">
                <Form.Label>Eteasy</Form.Label>
                <Form.Check
                  type="switch"
                  checked={formData.eteasy_enabled}
                  onChange={handleChange}
                  aria-label="Toggle Eteasy integration"
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId="smiles_enabled">
                <Form.Label>Smiles</Form.Label>
                <Form.Check
                  type="switch"
                  checked={formData.smiles_enabled}
                  onChange={handleChange}
                  aria-label="Toggle Smiles integration"
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId="toyou_enabled">
                <Form.Label>Toyou</Form.Label>
                <Form.Check
                  type="switch"
                  checked={formData.toyou_enabled}
                  onChange={handleChange}
                  aria-label="Toggle Toyou integration"
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId="dca_enabled">
                <Form.Label>DCA</Form.Label>
                <Form.Check
                  type="switch"
                  checked={formData.dca_enabled}
                  onChange={handleChange}
                  aria-label="Toggle DCA integration"
                />
              </Form.Group>
            </Col>
          </Row>
          <Row className="mb-3">
            <Col md={3}>
              <Form.Group controlId="ordable_enabled">
                <Form.Label>Ordable</Form.Label>
                <Form.Check
                  type="switch"
                  checked={formData.ordable_enabled}
                  onChange={handleChange}
                  aria-label="Toggle Ordable integration"
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId="beanz_enabled">
                <Form.Label>BeanZ</Form.Label>
                <Form.Check
                  type="switch"
                  checked={formData.beanz_enabled}
                  onChange={handleChange}
                  aria-label="Toggle BeanZ integration"
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId="cari_enabled">
                <Form.Label>Cari</Form.Label>
                <Form.Check
                  type="switch"
                  checked={formData.cari_enabled}
                  onChange={handleChange}
                  aria-label="Toggle Cari integration"
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId="the_chefz_enabled">
                <Form.Label>The Chefz</Form.Label>
                <Form.Check
                  type="switch"
                  checked={formData.the_chefz_enabled}
                  onChange={handleChange}
                  aria-label="Toggle The Chefz integration"
                />
              </Form.Group>
            </Col>
          </Row>
          <Row className="mb-3">
            <Col md={3}>
              <Form.Group controlId="keeta_enabled">
                <Form.Label>Keeta</Form.Label>
                <Form.Check
                  type="switch"
                  checked={formData.keeta_enabled}
                  onChange={handleChange}
                  aria-label="Toggle Keeta integration"
                />
              </Form.Group>
            </Col>
          </Row>
          <h6 className="mt-4 mb-3">SMS/WhatsApp Settings:</h6>
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group controlId="notification_channel">
                <Form.Label>Notification Channel</Form.Label>
                <Form.Select
                  style={{ borderColor: '#ccc' }}
                  value={formData.notification_channel}
                  onChange={handleChange}
                  aria-label="Select notification channel"
                >
                  <option value="SMS">SMS</option>
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="EMAIL">Email</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="danger" onClick={onHide} aria-label="Close modal">
          Close
        </Button>
        <Button variant="success" onClick={handleSubmit} disabled={loading} aria-label="Update settings">
          {loading ? 'Updating...' : 'Update'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ModifyOutletSettingsModal;
