import { Button, Modal, Form, Row, Col } from 'react-bootstrap';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuthContext } from '@/common';
import { OutletData } from '@/common/api/outlet';
import { fetchWaiterUsers, WaiterUser } from '@/services/user.service';

// Update OutletSettings interface
interface OutletSettings {
  outletid: number;
  outlet_name: string;
  outlet_code: string;
  hotelid: number;
  brand_name: string;
  send_order_notification: string;
  bill_number_length: number;
  next_reset_order_number_date: string | null;
  next_reset_order_number_days: string;
  decimal_points: number;
  bill_round_off: boolean;
  bill_round_off_to: number;
  enable_loyalty: boolean;
  multiple_price_setting: boolean;
  include_tax_in_invoice?: boolean;
  service_charges?:number;
  invoice_message?: string;
  verify_pos_system_login: boolean;
  table_reservation: boolean;
  auto_update_pos: boolean;
  send_report_email: boolean;
  send_report_whatsapp: boolean;
  allow_multiple_tax: boolean;
  enable_call_center: boolean;
  bharatpe_integration: boolean;
  phonepe_integration: boolean;
  reelo_integration: boolean;
  tally_integration: boolean;
  sunmi_integration: boolean;
  zomato_pay_integration: boolean;
  zomato_enabled: boolean;
  swiggy_enabled: boolean;
  rafeeq_enabled: boolean;
  noon_food_enabled: boolean;
  magicpin_enabled: boolean;
  dotpe_enabled: boolean;
  cultfit_enabled: boolean; // Fixed typo: removed cutfit_enabled
  ubereats_enabled: boolean;
  scooty_enabled: boolean;
  dunzo_enabled: boolean;
  foodpanda_enabled: boolean;
  amazon_enabled: boolean;
  talabat_enabled: boolean;
  deliveroo_enabled: boolean;
  careem_enabled: boolean;
  jahez_enabled: boolean;
  eazydiner_enabled: boolean;
  radyes_enabled: boolean;
  goshop_enabled: boolean;
  chatfood_enabled: boolean;
  jubeat_enabled: boolean;
  thrive_enabled: boolean;
  fidoo_enabled: boolean;
  mrsool_enabled: boolean;
  swiggystore_enabled: boolean;
  zomatormarket_enabled: boolean;
  hungerstation_enabled: boolean;
  instashop_enabled: boolean;
  eteasy_enabled: boolean;
  smiles_enabled: boolean;
  toyou_enabled: boolean;
  dca_enabled: boolean;
  ordable_enabled: boolean;
  beanz_enabled: boolean;
  cari_enabled: boolean;
  the_chefz_enabled: boolean;
  keeta_enabled: boolean;
  notification_channel: string;
  created_at: string;
  updated_at: string;
  updated_by_id?: string;
  default_waiter_id: number | null;
  enable_pax: boolean;
  pax?: number;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

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
    enable_pax: false,
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
          const res = await fetch(`${API_BASE_URL}/api/outlets/outlet-settings/${selectedOutlet.outletid}`, {
            headers: { 'Content-Type': 'application/json' },
          });
          if (res.ok) {
            const data: OutletSettings = await res.json();
            setFormData({
              ...data,
              outletid: selectedOutlet.outletid!,
              hotelid: selectedOutlet.hotelid!,
              updated_by_id: user?.id ?? '1',
            });
            toast.success('Outlet settings fetched successfully!');
          } else {
            const errorData = await res.json();
            toast.error(`Failed to fetch outlet settings: ${errorData.message || 'Unknown error'}`);
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
      // Convert boolean fields to 1/0 for the backend
      const payload: any = {
        ...formData,
        outletid: selectedOutlet.outletid,
        hotelid: selectedOutlet.hotelid,
        updated_at: new Date().toISOString(),
        updated_by_id: user?.id ?? '1',
        // Convert boolean fields to 1/0
        bill_round_off: formData.bill_round_off ? 1 : 0,
        enable_loyalty: formData.enable_loyalty ? 1 : 0,
        multiple_price_setting: formData.multiple_price_setting ? 1 : 0,
        bill_round_off_to: formData.bill_round_off_to,
        include_tax_in_invoice: formData.include_tax_in_invoice ? 1 : 0,
        service_charges: formData.service_charges || 0,
        verify_pos_system_login: formData.verify_pos_system_login ? 1 : 0,
        table_reservation: formData.table_reservation ? 1 : 0,
        auto_update_pos: formData.auto_update_pos ? 1 : 0,
        send_report_email: formData.send_report_email ? 1 : 0,
        send_report_whatsapp: formData.send_report_whatsapp ? 1 : 0,
        allow_multiple_tax: formData.allow_multiple_tax ? 1 : 0,
        enable_call_center: formData.enable_call_center ? 1 : 0,
        invoice_message: formData.invoice_message || '',
        bharatpe_integration: formData.bharatpe_integration ? 1 : 0,
        phonepe_integration: formData.phonepe_integration ? 1 : 0,
        reelo_integration: formData.reelo_integration ? 1 : 0,
        tally_integration: formData.tally_integration ? 1 : 0,
        sunmi_integration: formData.sunmi_integration ? 1 : 0,
        zomato_pay_integration: formData.zomato_pay_integration ? 1 : 0,
        zomato_enabled: formData.zomato_enabled ? 1 : 0,
        swiggy_enabled: formData.swiggy_enabled ? 1 : 0,
        rafeeq_enabled: formData.rafeeq_enabled ? 1 : 0,
        noon_food_enabled: formData.noon_food_enabled ? 1 : 0,
        magicpin_enabled: formData.magicpin_enabled ? 1 : 0,
        dotpe_enabled: formData.dotpe_enabled ? 1 : 0,
        cultfit_enabled: formData.cultfit_enabled ? 1 : 0,
        ubereats_enabled: formData.ubereats_enabled ? 1 : 0,
        scooty_enabled: formData.scooty_enabled ? 1 : 0,
        dunzo_enabled: formData.dunzo_enabled ? 1 : 0,
        foodpanda_enabled: formData.foodpanda_enabled ? 1 : 0,
        amazon_enabled: formData.amazon_enabled ? 1 : 0,
        talabat_enabled: formData.talabat_enabled ? 1 : 0,
        deliveroo_enabled: formData.deliveroo_enabled ? 1 : 0,
        careem_enabled: formData.careem_enabled ? 1 : 0,
        jahez_enabled: formData.jahez_enabled ? 1 : 0,
        eazydiner_enabled: formData.eazydiner_enabled ? 1 : 0,
        radyes_enabled: formData.radyes_enabled ? 1 : 0,
        goshop_enabled: formData.goshop_enabled ? 1 : 0,
        chatfood_enabled: formData.chatfood_enabled ? 1 : 0,
        jubeat_enabled: formData.jubeat_enabled ? 1 : 0,
        thrive_enabled: formData.thrive_enabled ? 1 : 0,
        fidoo_enabled: formData.fidoo_enabled ? 1 : 0,
        mrsool_enabled: formData.mrsool_enabled ? 1 : 0,
        swiggystore_enabled: formData.swiggystore_enabled ? 1 : 0,
        zomatormarket_enabled: formData.zomatormarket_enabled ? 1 : 0,
        hungerstation_enabled: formData.hungerstation_enabled ? 1 : 0,
        instashop_enabled: formData.instashop_enabled ? 1 : 0,
        eteasy_enabled: formData.eteasy_enabled ? 1 : 0,
        smiles_enabled: formData.smiles_enabled ? 1 : 0,
        toyou_enabled: formData.toyou_enabled ? 1 : 0,
        dca_enabled: formData.dca_enabled ? 1 : 0,
        ordable_enabled: formData.ordable_enabled ? 1 : 0,
        beanz_enabled: formData.beanz_enabled ? 1 : 0,
        cari_enabled: formData.cari_enabled ? 1 : 0,
        the_chefz_enabled: formData.the_chefz_enabled ? 1 : 0,
        keeta_enabled: formData.keeta_enabled ? 1 : 0,
        default_waiter_id: formData.default_waiter_id,
        enable_pax: formData.enable_pax ? 1 : 0,
        pax: formData.pax || 1,
      };

      const res = await fetch(`${API_BASE_URL}/api/outlets/outlet-settings/${selectedOutlet.outletid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await handleUpdate(selectedOutlet.outletid, selectedOutlet.hotelid);
        toast.success('Outlet settings updated successfully!');
        onHide();
      } else {
        const errorData = await res.json();
        console.error('Backend error response:', errorData); // Log detailed error
        toast.error(`Failed to update outlet settings: ${errorData.message || 'Unknown error'}`);
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
  {/* Toggle switch always on left */}
  <Form.Check
    type="switch"
    id="bill_round_off" // ✅ Match with formData field
    checked={formData.bill_round_off}
    onChange={handleChange}
    aria-label="Toggle bill round off"
  />

  {/* Dropdown shows only when toggle is ON */}
  {formData.bill_round_off && (
    <Form.Select
      id="bill_round_off_to" // ✅ Match with formData field
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
            <Form.Group controlId="enable_pax">
              <Form.Label>Enable Pax</Form.Label>
              <Form.Check
                type="switch"
                checked={formData.enable_pax}
                onChange={handleChange}
                aria-label="Toggle pax"
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