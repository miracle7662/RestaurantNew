// pages/BillPrintSetting/BillSettingForm.tsx
import React, { useState, useEffect } from 'react';
import { Form, Row, Col, Button, Card, Alert } from 'react-bootstrap';
import { BillPrintSetting } from '@/common/hotel/billPrintSettingService';

interface BillSettingFormProps {
    settings: BillPrintSetting | null;
    onSave: (data: Partial<BillPrintSetting>) => void;
    saving: boolean;
    section: 'general' | 'header' | 'sections' | 'fields' | 'table' | 'footer' | 'print';
}

const BillSettingForm: React.FC<BillSettingFormProps> = ({ settings, onSave, saving, section }) => {
    const [formData, setFormData] = useState<Partial<BillPrintSetting>>({});

    useEffect(() => {
        if (settings) {
            setFormData(settings);
        } else {
            setFormData({
                show_top_header_section: 1,
                top_margin_when_header_hidden: 30,
                show_hotel_logo: 1,
                hotel_logo_position: 'left',
                show_hotel_name: 1,
                hotel_name_position: 'center',
                show_hotel_address: 1,
                hotel_address_position: 'left',
                show_hotel_contact: 1,
                hotel_contact_position: 'left',
                show_guest_details: 1,
                guest_details_position: 'left',
                show_guest_name: 1,
                show_guest_mobile: 1,
                show_guest_email: 1,
                show_guest_address: 1,
                show_guest_id_proof: 1,
                show_booking_details: 1,
                booking_details_position: 'right',
                show_checkin_date: 1,
                show_checkout_date: 1,
                show_nights: 1,
                show_room_type: 1,
                show_room_numbers: 1,
                show_guests_count: 1,
                show_tariff_plan: 1,
                show_bill_title: 1,
                bill_title_position: 'center',
                show_invoice_no: 1,
                show_invoice_date: 1,
                show_booking_id: 1,
                show_payment_status: 1,
                show_payment_mode: 1,
                table_font_size: 'normal',
                table_header_bg_color: '#1a2744',
                table_header_text_color: '#ffffff',
                show_row_numbers: 1,
                show_discount_column: 1,
                show_cgst_sgst_breakdown: 1,
                show_thankyou_message: 1,
                thankyou_message_text: 'Thank You!',
                show_footer_note: 1,
                footer_note_text: 'We look forward to welcoming you again.',
                show_gst_details: 1,
                show_company_pan: 1,
                show_fssai: 1,
                default_print_size: 'A4',
                paper_width_mm: 210,
                paper_height_mm: 297,
                margin_top_mm: 12,
                margin_bottom_mm: 12,
                margin_left_mm: 10,
                margin_right_mm: 10,
                custom_header_text: '',
                custom_footer_text: '',
            });
        }
    }, [settings]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        let finalValue: any = value;

        if (type === 'checkbox') {
            finalValue = (e.target as HTMLInputElement).checked ? 1 : 0;
        } else if (name.includes('_mm') || name.includes('_width') || name.includes('_height')) {
            finalValue = parseInt(value) || 0;
        }

        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    const renderGeneralSection = () => (
        <form onSubmit={handleSubmit}>
            <Row>
                <Col md={12}>
                    <Card className="mb-3">
                        <Card.Header>Top Header Section Visibility</Card.Header>
                        <Card.Body>
                            <Form.Check
                                type="switch"
                                id="show_top_header_section"
                                name="show_top_header_section"
                                label="Show Top Header Section (Hotel Name, Logo, Address, Contact)"
                                checked={formData.show_top_header_section === 1}
                                onChange={handleChange}
                                className="mb-3"
                            />

                            <hr />
                            
                            <Form.Group className="mt-3">
                                <Form.Label className="fw-bold">
                                    Top Margin for Pre-printed Paper (mm)
                                    {formData.show_top_header_section === 1 && (
                                        <span className="text-muted fw-normal ms-2" style={{ fontSize: '0.8em' }}>
                                            (applies only when header is hidden)
                                        </span>
                                    )}
                                </Form.Label>
                                <div className="d-flex align-items-center gap-2">
                                    <Form.Control
                                        type="number"
                                        name="top_margin_when_header_hidden"
                                        value={formData.top_margin_when_header_hidden ?? 30}
                                        onChange={handleChange}
                                        min={0}
                                        max={200}
                                        step={1}
                                        style={{ width: '120px' }}
                                    />
                                    <span className="text-muted">mm</span>
                                </div>
                            </Form.Group>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Form.Group className="mb-3">
                        <Form.Label>Custom Header Text</Form.Label>
                        <Form.Control
                            as="textarea"
                            name="custom_header_text"
                            value={formData.custom_header_text || ''}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Enter custom header text (optional)"
                        />
                        <Form.Text className="text-muted">
                            This text will appear at the top of the bill.
                        </Form.Text>
                    </Form.Group>
                </Col>
                <Col md={6}>
                    <Form.Group className="mb-3">
                        <Form.Label>Custom Footer Text</Form.Label>
                        <Form.Control
                            as="textarea"
                            name="custom_footer_text"
                            value={formData.custom_footer_text || ''}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Enter custom footer text (optional)"
                        />
                        <Form.Text className="text-muted">
                            This text will appear at the bottom of the bill.
                        </Form.Text>
                    </Form.Group>
                </Col>
            </Row>
            <div className="mt-3">
                <Button type="submit" variant="primary" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Settings'}
                </Button>
            </div>
        </form>
    );

    const renderHeaderSection = () => (
        <form onSubmit={handleSubmit}>
            <Row>
                <Col md={6}>
                    <Card className="mb-3">
                        <Card.Header>Hotel Logo</Card.Header>
                        <Card.Body>
                            <Form.Check
                                type="switch"
                                id="show_hotel_logo"
                                name="show_hotel_logo"
                                label="Show Hotel Logo"
                                checked={formData.show_hotel_logo === 1}
                                onChange={handleChange}
                                className="mb-2"
                            />
                            <Form.Group>
                                <Form.Label>Logo Position</Form.Label>
                                <Form.Select
                                    name="hotel_logo_position"
                                    value={formData.hotel_logo_position || 'left'}
                                    onChange={handleChange}
                                >
                                    <option value="left">Left</option>
                                    <option value="center">Center</option>
                                    <option value="right">Right</option>
                                </Form.Select>
                            </Form.Group>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card className="mb-3">
                        <Card.Header>Hotel Name</Card.Header>
                        <Card.Body>
                            <Form.Check
                                type="switch"
                                id="show_hotel_name"
                                name="show_hotel_name"
                                label="Show Hotel Name"
                                checked={formData.show_hotel_name === 1}
                                onChange={handleChange}
                                className="mb-2"
                            />
                            <Form.Group>
                                <Form.Label>Name Position</Form.Label>
                                <Form.Select
                                    name="hotel_name_position"
                                    value={formData.hotel_name_position || 'center'}
                                    onChange={handleChange}
                                >
                                    <option value="left">Left</option>
                                    <option value="center">Center</option>
                                    <option value="right">Right</option>
                                </Form.Select>
                            </Form.Group>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card>
                        <Card.Header>Hotel Address</Card.Header>
                        <Card.Body>
                            <Form.Check
                                type="switch"
                                id="show_hotel_address"
                                name="show_hotel_address"
                                label="Show Hotel Address"
                                checked={formData.show_hotel_address === 1}
                                onChange={handleChange}
                                className="mb-2"
                            />
                            <Form.Group>
                                <Form.Label>Address Position</Form.Label>
                                <Form.Select
                                    name="hotel_address_position"
                                    value={formData.hotel_address_position || 'left'}
                                    onChange={handleChange}
                                >
                                    <option value="left">Left</option>
                                    <option value="center">Center</option>
                                    <option value="right">Right</option>
                                </Form.Select>
                            </Form.Group>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card>
                        <Card.Header>Hotel Contact</Card.Header>
                        <Card.Body>
                            <Form.Check
                                type="switch"
                                id="show_hotel_contact"
                                name="show_hotel_contact"
                                label="Show Contact Info"
                                checked={formData.show_hotel_contact === 1}
                                onChange={handleChange}
                                className="mb-2"
                            />
                            <Form.Group>
                                <Form.Label>Contact Position</Form.Label>
                                <Form.Select
                                    name="hotel_contact_position"
                                    value={formData.hotel_contact_position || 'left'}
                                    onChange={handleChange}
                                >
                                    <option value="left">Left</option>
                                    <option value="center">Center</option>
                                    <option value="right">Right</option>
                                </Form.Select>
                            </Form.Group>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
            <div className="mt-3">
                <Button type="submit" variant="primary" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Settings'}
                </Button>
            </div>
        </form>
    );

    const renderSectionsSection = () => (
        <form onSubmit={handleSubmit}>
            <Row>
                <Col md={12}>
                </Col>
                <Col md={4}>
                    <Card className="mb-3">
                        <Card.Header>Guest Details Section</Card.Header>
                        <Card.Body>
                            <Form.Check
                                type="switch"
                                id="show_guest_details"
                                name="show_guest_details"
                                label="Show Guest Details"
                                checked={formData.show_guest_details === 1}
                                onChange={handleChange}
                                className="mb-2"
                            />
                            <Form.Group>
                                <Form.Label>Position</Form.Label>
                                <Form.Select
                                    name="guest_details_position"
                                    value={formData.guest_details_position || 'left'}
                                    onChange={handleChange}
                                >
                                    <option value="left">Left</option>
                                    <option value="right">Right</option>
                                    <option value="top">Top</option>
                                    <option value="bottom">Bottom</option>
                                </Form.Select>
                            </Form.Group>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="mb-3">
                        <Card.Header>Booking Details Section</Card.Header>
                        <Card.Body>
                            <Form.Check
                                type="switch"
                                id="show_booking_details"
                                name="show_booking_details"
                                label="Show Booking Details"
                                checked={formData.show_booking_details === 1}
                                onChange={handleChange}
                                className="mb-2"
                            />
                            <Form.Group>
                                <Form.Label>Position</Form.Label>
                                <Form.Select
                                    name="booking_details_position"
                                    value={formData.booking_details_position || 'right'}
                                    onChange={handleChange}
                                >
                                    <option value="left">Left</option>
                                    <option value="right">Right</option>
                                    <option value="top">Top</option>
                                    <option value="bottom">Bottom</option>
                                </Form.Select>
                            </Form.Group>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="mb-3">
                        <Card.Header>Bill Title</Card.Header>
                        <Card.Body>
                            <Form.Check
                                type="switch"
                                id="show_bill_title"
                                name="show_bill_title"
                                label="Show Bill Title"
                                checked={formData.show_bill_title === 1}
                                onChange={handleChange}
                                className="mb-2"
                            />
                            <Form.Group>
                                <Form.Label>Title Position</Form.Label>
                                <Form.Select
                                    name="bill_title_position"
                                    value={formData.bill_title_position || 'center'}
                                    onChange={handleChange}
                                >
                                    <option value="left">Left</option>
                                    <option value="center">Center</option>
                                    <option value="right">Right</option>
                                </Form.Select>
                            </Form.Group>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
            <div className="mt-3">
                <Button type="submit" variant="primary" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Settings'}
                </Button>
            </div>
        </form>
    );

    const renderFieldsSection = () => (
        <form onSubmit={handleSubmit}>
            <Row>
                <Col md={6}>
                    <Card className="mb-3">
                        <Card.Header>Guest Details Fields</Card.Header>
                        <Card.Body>
                            <Form.Check
                                type="switch"
                                id="show_guest_name"
                                name="show_guest_name"
                                label="Show Guest Name"
                                checked={formData.show_guest_name === 1}
                                onChange={handleChange}
                                className="mb-2"
                            />
                            <Form.Check
                                type="switch"
                                id="show_guest_mobile"
                                name="show_guest_mobile"
                                label="Show Mobile Number"
                                checked={formData.show_guest_mobile === 1}
                                onChange={handleChange}
                                className="mb-2"
                            />
                            <Form.Check
                                type="switch"
                                id="show_guest_email"
                                name="show_guest_email"
                                label="Show Email"
                                checked={formData.show_guest_email === 1}
                                onChange={handleChange}
                                className="mb-2"
                            />
                            <Form.Check
                                type="switch"
                                id="show_guest_address"
                                name="show_guest_address"
                                label="Show Address"
                                checked={formData.show_guest_address === 1}
                                onChange={handleChange}
                                className="mb-2"
                            />
                            <Form.Check
                                type="switch"
                                id="show_guest_id_proof"
                                name="show_guest_id_proof"
                                label="Show ID Proof"
                                checked={formData.show_guest_id_proof === 1}
                                onChange={handleChange}
                            />
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card className="mb-3">
                        <Card.Header>Booking Details Fields</Card.Header>
                        <Card.Body>
                            <Form.Check
                                type="switch"
                                id="show_checkin_date"
                                name="show_checkin_date"
                                label="Show Check-in Date"
                                checked={formData.show_checkin_date === 1}
                                onChange={handleChange}
                                className="mb-2"
                            />
                            <Form.Check
                                type="switch"
                                id="show_checkout_date"
                                name="show_checkout_date"
                                label="Show Check-out Date"
                                checked={formData.show_checkout_date === 1}
                                onChange={handleChange}
                                className="mb-2"
                            />
                            <Form.Check
                                type="switch"
                                id="show_nights"
                                name="show_nights"
                                label="Show Nights"
                                checked={formData.show_nights === 1}
                                onChange={handleChange}
                                className="mb-2"
                            />
                            <Form.Check
                                type="switch"
                                id="show_room_type"
                                name="show_room_type"
                                label="Show Room Type"
                                checked={formData.show_room_type === 1}
                                onChange={handleChange}
                                className="mb-2"
                            />
                            <Form.Check
                                type="switch"
                                id="show_room_numbers"
                                name="show_room_numbers"
                                label="Show Room Numbers"
                                checked={formData.show_room_numbers === 1}
                                onChange={handleChange}
                                className="mb-2"
                            />
                            <Form.Check
                                type="switch"
                                id="show_guests_count"
                                name="show_guests_count"
                                label="Show Guests Count"
                                checked={formData.show_guests_count === 1}
                                onChange={handleChange}
                                className="mb-2"
                            />
                            <Form.Check
                                type="switch"
                                id="show_tariff_plan"
                                name="show_tariff_plan"
                                label="Show Tariff Plan"
                                checked={formData.show_tariff_plan === 1}
                                onChange={handleChange}
                            />
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={12}>
                    <Card>
                        <Card.Header>Bill Info Fields</Card.Header>
                        <Card.Body>
                            <Row>
                                <Col md={3}>
                                    <Form.Check
                                        type="switch"
                                        id="show_invoice_no"
                                        name="show_invoice_no"
                                        label="Invoice Number"
                                        checked={formData.show_invoice_no === 1}
                                        onChange={handleChange}
                                        className="mb-2"
                                    />
                                </Col>
                                <Col md={3}>
                                    <Form.Check
                                        type="switch"
                                        id="show_invoice_date"
                                        name="show_invoice_date"
                                        label="Invoice Date"
                                        checked={formData.show_invoice_date === 1}
                                        onChange={handleChange}
                                        className="mb-2"
                                    />
                                </Col>
                                <Col md={3}>
                                    <Form.Check
                                        type="switch"
                                        id="show_booking_id"
                                        name="show_booking_id"
                                        label="Booking ID"
                                        checked={formData.show_booking_id === 1}
                                        onChange={handleChange}
                                        className="mb-2"
                                    />
                                </Col>
                                <Col md={3}>
                                    <Form.Check
                                        type="switch"
                                        id="show_payment_status"
                                        name="show_payment_status"
                                        label="Payment Status"
                                        checked={formData.show_payment_status === 1}
                                        onChange={handleChange}
                                        className="mb-2"
                                    />
                                </Col>
                                <Col md={3}>
                                    <Form.Check
                                        type="switch"
                                        id="show_payment_mode"
                                        name="show_payment_mode"
                                        label="Payment Mode"
                                        checked={formData.show_payment_mode === 1}
                                        onChange={handleChange}
                                    />
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
            <div className="mt-3">
                <Button type="submit" variant="primary" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Settings'}
                </Button>
            </div>
        </form>
    );

    const renderTableSection = () => (
        <form onSubmit={handleSubmit}>
            <Row>
                <Col md={6}>
                    <Card className="mb-3">
                        <Card.Header>Table Appearance</Card.Header>
                        <Card.Body>
                            <Form.Group className="mb-3">
                                <Form.Label>Font Size</Form.Label>
                                <Form.Select
                                    name="table_font_size"
                                    value={formData.table_font_size || 'normal'}
                                    onChange={handleChange}
                                >
                                    <option value="small">Small (8pt)</option>
                                    <option value="normal">Normal (9.5pt)</option>
                                    <option value="large">Large (11pt)</option>
                                </Form.Select>
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Header Background Color</Form.Label>
                                <Form.Control
                                    type="color"
                                    name="table_header_bg_color"
                                    value={formData.table_header_bg_color || '#1a2744'}
                                    onChange={handleChange}
                                />
                            </Form.Group>
                            <Form.Group>
                                <Form.Label>Header Text Color</Form.Label>
                                <Form.Control
                                    type="color"
                                    name="table_header_text_color"
                                    value={formData.table_header_text_color || '#ffffff'}
                                    onChange={handleChange}
                                />
                            </Form.Group>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card>
                        <Card.Header>Table Columns</Card.Header>
                        <Card.Body>
                            <Form.Check
                                type="switch"
                                id="show_row_numbers"
                                name="show_row_numbers"
                                label="Show Row Numbers (#)"
                                checked={formData.show_row_numbers === 1}
                                onChange={handleChange}
                                className="mb-2"
                            />
                            <Form.Check
                                type="switch"
                                id="show_discount_column"
                                name="show_discount_column"
                                label="Show Discount Column"
                                checked={formData.show_discount_column === 1}
                                onChange={handleChange}
                                className="mb-2"
                            />
                            <Form.Check
                                type="switch"
                                id="show_cgst_sgst_breakdown"
                                name="show_cgst_sgst_breakdown"
                                label="Show CGST/SGST Breakdown"
                                checked={formData.show_cgst_sgst_breakdown === 1}
                                onChange={handleChange}
                            />
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
            <div className="mt-3">
                <Button type="submit" variant="primary" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Settings'}
                </Button>
            </div>
        </form>
    );

    const renderFooterSection = () => (
        <form onSubmit={handleSubmit}>
            <Row>
                <Col md={6}>
                    <Card className="mb-3">
                        <Card.Header>Thank You Message</Card.Header>
                        <Card.Body>
                            <Form.Check
                                type="switch"
                                id="show_thankyou_message"
                                name="show_thankyou_message"
                                label="Show Thank You Message"
                                checked={formData.show_thankyou_message === 1}
                                onChange={handleChange}
                                className="mb-2"
                            />
                            <Form.Group>
                                <Form.Label>Message Text</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="thankyou_message_text"
                                    value={formData.thankyou_message_text || 'Thank You!'}
                                    onChange={handleChange}
                                />
                            </Form.Group>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card className="mb-3">
                        <Card.Header>Footer Note</Card.Header>
                        <Card.Body>
                            <Form.Check
                                type="switch"
                                id="show_footer_note"
                                name="show_footer_note"
                                label="Show Footer Note"
                                checked={formData.show_footer_note === 1}
                                onChange={handleChange}
                                className="mb-2"
                            />
                            <Form.Group>
                                <Form.Label>Note Text</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    name="footer_note_text"
                                    value={formData.footer_note_text || ''}
                                    onChange={handleChange}
                                    rows={3}
                                />
                            </Form.Group>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={12}>
                    <Card>
                        <Card.Header>Legal Details</Card.Header>
                        <Card.Body>
                            <Row>
                                <Col md={4}>
                                    <Form.Check
                                        type="switch"
                                        id="show_gst_details"
                                        name="show_gst_details"
                                        label="Show GST Details"
                                        checked={formData.show_gst_details === 1}
                                        onChange={handleChange}
                                        className="mb-2"
                                    />
                                </Col>
                                <Col md={4}>
                                    <Form.Check
                                        type="switch"
                                        id="show_company_pan"
                                        name="show_company_pan"
                                        label="Show PAN Number"
                                        checked={formData.show_company_pan === 1}
                                        onChange={handleChange}
                                        className="mb-2"
                                    />
                                </Col>
                                <Col md={4}>
                                    <Form.Check
                                        type="switch"
                                        id="show_fssai"
                                        name="show_fssai"
                                        label="Show FSSAI Number"
                                        checked={formData.show_fssai === 1}
                                        onChange={handleChange}
                                    />
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
            <div className="mt-3">
                <Button type="submit" variant="primary" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Settings'}
                </Button>
            </div>
        </form>
    );

    const renderPrintSection = () => (
        <form onSubmit={handleSubmit}>
            <Row>
                <Col md={6}>
                    <Card className="mb-3">
                        <Card.Header>Print Size</Card.Header>
                        <Card.Body>
                            <Form.Group className="mb-3">
                                <Form.Label>Default Print Size</Form.Label>
                                <Form.Select
                                    name="default_print_size"
                                    value={formData.default_print_size || 'A4'}
                                    onChange={handleChange}
                                >
                                    <option value="A4">A4 (210mm x 297mm)</option>
                                    <option value="thermal_80mm">Thermal 80mm</option>
                                    <option value="thermal_58mm">Thermal 58mm</option>
                                    <option value="full">Full Page</option>
                                </Form.Select>
                            </Form.Group>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-2">
                                        <Form.Label>Paper Width (mm)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            name="paper_width_mm"
                                            value={formData.paper_width_mm || 210}
                                            onChange={handleChange}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-2">
                                        <Form.Label>Paper Height (mm)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            name="paper_height_mm"
                                            value={formData.paper_height_mm || 297}
                                            onChange={handleChange}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card>
                        <Card.Header>Margins (mm)</Card.Header>
                        <Card.Body>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-2">
                                        <Form.Label>Top Margin</Form.Label>
                                        <Form.Control
                                            type="number"
                                            name="margin_top_mm"
                                            value={formData.margin_top_mm || 12}
                                            onChange={handleChange}
                                        />
                                        <Form.Text className="text-muted">
                                            This margin applies when header is visible.
                                        </Form.Text>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-2">
                                        <Form.Label>Bottom Margin</Form.Label>
                                        <Form.Control
                                            type="number"
                                            name="margin_bottom_mm"
                                            value={formData.margin_bottom_mm || 12}
                                            onChange={handleChange}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-2">
                                        <Form.Label>Left Margin</Form.Label>
                                        <Form.Control
                                            type="number"
                                            name="margin_left_mm"
                                            value={formData.margin_left_mm || 10}
                                            onChange={handleChange}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-2">
                                        <Form.Label>Right Margin</Form.Label>
                                        <Form.Control
                                            type="number"
                                            name="margin_right_mm"
                                            value={formData.margin_right_mm || 10}
                                            onChange={handleChange}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
            <div className="mt-3">
                <Button type="submit" variant="primary" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Settings'}
                </Button>
            </div>
        </form>
    );

    switch (section) {
        case 'general':
            return renderGeneralSection();
        case 'header':
            return renderHeaderSection();
        case 'sections':
            return renderSectionsSection();
        case 'fields':
            return renderFieldsSection();
        case 'table':
            return renderTableSection();
        case 'footer':
            return renderFooterSection();
        case 'print':
            return renderPrintSection();
        default:
            return renderGeneralSection();
    }
};

export default BillSettingForm;