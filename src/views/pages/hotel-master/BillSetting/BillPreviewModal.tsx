// pages/BillPrintSetting/BillPreviewModal.tsx
import React, { useRef, useEffect, useState } from 'react';
import { Modal, Button, Spinner } from 'react-bootstrap';
import { BillPrintSetting } from '@/common/hotel/billPrintSettingService';
import BrandService from '@/common/api/brand';

interface BillPreviewModalProps {
    show: boolean;
    onHide: () => void;
    settings: BillPrintSetting | null;
    hotelId: number | null | undefined;
}

const MOCK = {
    guest_name: 'Mr. Rahul Sharma',
    guest_mobile: '+91 98765 43210',
    guest_email: 'rahul.sharma@email.com',
    guest_address: '221B, Green Park, New Delhi - 110016, India',
    guest_id_proof: 'Aadhar Card - 1234 5678 9012',
    checkin: '24 May 2024',
    checkout: '26 May 2024',
    nights: 2,
    room_type: 'Deluxe Room',
    room_numbers: '101',
    guests: '2 Adults',
    tariff_plan: 'Room Only',
    invoice_no: 'GVH/24-25/1876',
    invoice_date: '25 May 2024',
    booking_id: 'BKD5241876',
    payment_status: 'Paid',
    payment_mode: 'Credit Card',
    subtotal: 9000,
    tax: 1080,
    service_charge: 450,
    discount: 530,
    grand_total: 10000,
    txn_id: 'TXN52418762210',
    payment_date: '25 May 2024',
    bank: 'HDFC Bank Credit Card **** **** **** 4567',
    rows: [
        { label: 'Deluxe Room Tariff', date: '24 May 2024', qty: '1 Room X 2 Nights', rate: 4500.00, amount: 9000.00 },
        { label: 'Taxes (12% GST)', date: '24 May 2024', qty: '12%', rate: 1080.00, amount: 1080.00 },
        { label: 'Service Charge', date: '24 May 2024', qty: '5%', rate: 450.00, amount: 450.00 },
        { label: 'Extra Bed (if any)', date: '24 May 2024', qty: '0', rate: 0.00, amount: 0.00 },
    ],
}

const getBillStyles = (s: BillPrintSetting | null) => {
    const headerBg = s?.table_header_bg_color || '#1a2744';
    const headerText = s?.table_header_text_color || '#ffffff';
    const fontSize = s?.table_font_size === 'small' ? '8pt' : s?.table_font_size === 'large' ? '11pt' : '9.5pt';

    return `
    .bill-wrap * { box-sizing: border-box; }
    .bill-wrap {
      font-family: 'Segoe UI', 'Calibri', Arial, sans-serif;
      font-size: ${fontSize};
      color: #1a1a1a;
      line-height: 1.4;
    }
    .bill-wrap .text-left { text-align: left; }
    .bill-wrap .text-center { text-align: center; }
    .bill-wrap .text-right { text-align: right; }
    .bill-wrap .mt-1 { margin-top: 5px; }
    .bill-wrap .mt-2 { margin-top: 10px; }
    .bill-wrap .mt-3 { margin-top: 15px; }
    .bill-wrap .mb-1 { margin-bottom: 5px; }
    .bill-wrap .mb-2 { margin-bottom: 10px; }
    .bill-wrap .mb-3 { margin-bottom: 15px; }

    .bill-wrap .bill-divider {
      border: none; border-top: 1.5px solid #d0d0d0; margin: 12px 0;
    }
    .bill-wrap .bill-info-box {
      border: 1px solid #c8c8c8; border-radius: 4px; overflow: hidden; margin-bottom: 15px;
    }
    .bill-wrap .bill-info-box-header {
      background: ${headerBg}; color: ${headerText}; text-align: center;
      font-weight: 700; font-size: 8.5pt; letter-spacing: 1px; padding: 6px 10px;
    }
    .bill-wrap .bill-info-box-body { padding: 10px 12px; }

    .bill-wrap .bill-detail-table { width: 100%; border-collapse: collapse; }
    .bill-wrap .bill-detail-table td { padding: 3px 2px; font-size: 8.5pt; vertical-align: top; }
    .bill-wrap .bdt-label { font-weight: 600; color: #333; white-space: nowrap; width: 110px; }
    .bill-wrap .bdt-colon { padding: 3px 6px; color: #555; width: 12px; }
    .bill-wrap .bdt-value { color: #222; }

    .bill-wrap .two-column-layout { display: flex; gap: 16px; margin-bottom: 16px; align-items: stretch; }
    .bill-wrap .two-column-layout > div { flex: 1; min-width: 0; display: flex; flex-direction: column; }
    .bill-wrap .two-column-layout > div > .bill-info-box { flex: 1; display: flex; flex-direction: column; }
    .bill-wrap .two-column-layout > div > .bill-info-box > .bill-info-box-body { flex: 1; }

    .bill-wrap .bill-charges-table { width: 100%; border-collapse: collapse; margin-bottom: 0; font-size: ${fontSize}; }
    .bill-wrap .bill-charges-table thead tr th {
      background: ${headerBg}; color: ${headerText};
      font-weight: 700; padding: 7px 8px; border: 1px solid ${headerBg}; white-space: nowrap;
    }
    .bill-wrap .bill-charges-table tbody tr td {
      border: 1px solid #d4d4d4; padding: 6px 8px; vertical-align: middle;
    }
    .bill-wrap .bill-charges-table tbody tr:nth-child(even) td { background: #f9f9f9; }
    .bill-wrap .bill-charges-table tfoot td { border: 1px solid #d4d4d4; padding: 6px 8px; }
    .bill-wrap .bct-right { text-align: right; }
    .bill-wrap .bct-center { text-align: center; }

    .bill-wrap .bct-total-row .bct-total-label { font-weight: 600; text-align: right; background: #f4f4f4; }
    .bill-wrap .bct-total-row .bct-total-value { text-align: right; font-weight: 600; background: #f4f4f4; }
    .bill-wrap .bct-grand-total-row .bct-grand-label { font-weight: 800; font-size: 10pt; text-align: right; background: #f0f0f0; }
    .bill-wrap .bct-grand-total-row .bct-grand-value { font-weight: 800; font-size: 10pt; text-align: right; background: #f0f0f0; }
    .bill-wrap .bct-paid-row .bct-paid-label { font-weight: 800; font-size: 10pt; color: ${headerBg}; text-align: right; background: #eef2fa; }
    .bill-wrap .bct-paid-row .bct-paid-value { font-weight: 800; font-size: 10pt; color: ${headerBg}; text-align: right; background: #eef2fa; }

    .bill-wrap .bill-amount-words {
      border: 1px solid #d4d4d4; border-top: none; padding: 6px 10px; font-size: 8.5pt; margin-bottom: 16px;
    }
    .bill-wrap .baw-label { font-style: italic; color: #555; margin-right: 4px; }
    .bill-wrap .baw-text { font-style: italic; color: #222; }

    .bill-wrap .bill-thankyou {
      font-family: 'Dancing Script', 'Brush Script MT', cursive;
      font-size: 24pt; color: ${headerBg}; line-height: 1.2;
    }
    .bill-wrap .bill-hotel-logo { max-height: 70px; max-width: 180px; object-fit: contain; }

    .bill-wrap .bill-info-row {
      display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap;
      padding: 8px 12px; background: #f8f9fa; border: 1px solid #dde2ea;
      border-radius: 4px; margin-bottom: 15px; font-size: 8.5pt;
    }
    .bill-wrap .bill-info-row > div { flex: 1; min-width: 160px; }
    .bill-wrap .bill-info-row strong { color: #333; }
    .bill-wrap .status-paid { color: #1a7a3a; font-weight: 700; }
  `;
};

const BillPreviewModal: React.FC<BillPreviewModalProps> = ({ show, onHide, settings, hotelId }) => {
    const printRef = useRef<HTMLDivElement>(null);
    const [hotelDetails, setHotelDetails] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);

    useEffect(() => {
        if (show && hotelId) {
            fetchHotelDetails();
        }
    }, [show, hotelId]);

    const fetchHotelDetails = async () => {
        if (!hotelId) return;
        setLoading(true);
        try {
            const response = await BrandService.getBrandById(String(hotelId));
            setHotelDetails(response.data || response);
        } catch (err) {
            console.error('Failed to fetch hotel details:', err);
        } finally {
            setLoading(false);
        }
    };

    const s = settings;
    const headerBg = s?.table_header_bg_color || '#1a2744';
    const headerText = s?.table_header_text_color || '#ffffff';
    
    const showTopHeaderSection = s?.show_top_header_section !== 0;
    const topMarginWhenHeaderHidden = s?.top_margin_when_header_hidden || 30;

    const hotelName = hotelDetails?.hotel_name || 'GRAND VIEW HOTEL';
    const hotelAddress = hotelDetails?.address || '123, Park Avenue, City Center, New Delhi - 110001, India';
    const hotelPhone = hotelDetails?.phone || '+91 11 4567 8900';
    const hotelEmail = hotelDetails?.email || 'info@grandviewhotel.com';
    const hotelWebsite = hotelDetails?.website || 'www.grandviewhotel.com';
    const hotelGSTIN = hotelDetails?.gstin || '07AABCG1234F1Z5';
    const hotelPAN = hotelDetails?.pan || 'AABCG1234F';
    const hotelFSSAI = hotelDetails?.fssai || '12345678901234';
    const hotelLogo = hotelDetails?.logo || '';

    const handlePrint = () => {
        const printContents = printRef.current?.innerHTML || '';
        const printWindow = window.open('', '_blank', 'width=900,height=700');
        if (!printWindow) return;
        const printSize = s?.default_print_size || 'A4';
        
        // When header is hidden, spacer div in printContents handles the top gap,
        // so @page top margin = 0.
        const effectiveTopMargin = !showTopHeaderSection
            ? 0
            : (s?.margin_top_mm || 12);
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Bill Preview</title>
                    <style>
                        * { box-sizing: border-box; margin: 0; padding: 0; }
                        @page {
                            size: ${printSize === 'A4' ? 'A4' : 'auto'};
                            margin: ${effectiveTopMargin}mm ${s?.margin_right_mm || 10}mm ${s?.margin_bottom_mm || 12}mm ${s?.margin_left_mm || 10}mm;
                        }
                        body { background: #f0f0f0; padding: 20px; }
                        .bill-paper { 
                            background: white; 
                            padding: 0 32px 28px 32px;
                            margin: 0 auto;
                            ${printSize === 'thermal_80mm' ? 'width:80mm;' : printSize === 'thermal_58mm' ? 'width:58mm;' : 'width:210mm;min-height:297mm;'}
                        }
                        ${getBillStyles(s)}
                    </style>
                </head>
                <body>
                    <div class="bill-paper bill-wrap">${printContents}</div>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { printWindow.print(); }, 500);
    };

    const handleDownloadPDF = async () => {
        const billEl = printRef.current;
        if (!billEl) return;

        // Alias settings to avoid shadowing by the 'script' element variable inside loadScript
        const ps = s;

        setPdfLoading(true);
        try {
            const loadScript = (src: string): Promise<void> =>
                new Promise((resolve, reject) => {
                    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
                    const scriptEl = document.createElement('script');
                    scriptEl.src = src;
                    scriptEl.onload = () => resolve();
                    scriptEl.onerror = () => reject(new Error(`Failed to load ${src}`));
                    document.head.appendChild(scriptEl);
                });

            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');

            const html2canvas = (window as any).html2canvas;
            const { jsPDF } = (window as any).jspdf;

            const printSize = ps?.default_print_size || 'A4';
            const isA4 = printSize !== 'thermal_80mm' && printSize !== 'thermal_58mm';
            const pdfW = isA4 ? 210 : (printSize === 'thermal_80mm' ? 80 : 58);

            const canvas = await html2canvas(billEl, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false,
                width: billEl.scrollWidth,
                height: billEl.scrollHeight,
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.92);
            const imgW = pdfW - (ps?.margin_left_mm || 10) - (ps?.margin_right_mm || 10);
            const imgH = (canvas.height / canvas.width) * imgW;

            const topMargin = !showTopHeaderSection
                ? (ps?.top_margin_when_header_hidden || 30)
                : (ps?.margin_top_mm || 12);
            const bottomMargin = ps?.margin_bottom_mm || 12;
            const leftMargin = ps?.margin_left_mm || 10;

            const pageContentH = (isA4 ? 297 : 999) - topMargin - bottomMargin;

            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: isA4 ? 'a4' : [pdfW, imgH + topMargin + bottomMargin] });

            if (imgH <= pageContentH) {
                pdf.addImage(imgData, 'JPEG', leftMargin, topMargin, imgW, imgH);
            } else {
                const pageHeightPx = (pageContentH / imgW) * canvas.width;
                let yOffset = 0;
                let page = 0;
                while (yOffset < canvas.height) {
                    if (page > 0) pdf.addPage();
                    const sliceH = Math.min(pageHeightPx, canvas.height - yOffset);
                    const sliceCanvas = document.createElement('canvas');
                    sliceCanvas.width = canvas.width;
                    sliceCanvas.height = sliceH;
                    const ctx = sliceCanvas.getContext('2d')!;
                    ctx.drawImage(canvas, 0, yOffset, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
                    const sliceData = sliceCanvas.toDataURL('image/jpeg', 0.92);
                    const sliceImgH = (sliceH / canvas.width) * imgW;
                    const yPos = page === 0 ? topMargin : bottomMargin;
                    pdf.addImage(sliceData, 'JPEG', leftMargin, yPos, imgW, sliceImgH);
                    yOffset += sliceH;
                    page++;
                }
            }

            pdf.save(`BillPreview_${hotelName.replace(/[^a-zA-Z0-9 ]/g, '_')}.pdf`);
        } catch (err) {
            console.error('PDF generation failed:', err);
            alert('PDF generation failed. Please try Print instead.');
        } finally {
            setPdfLoading(false);
        }
    };

    const renderHotelHeader = () => {
        if (!showTopHeaderSection) {
            // Spacer: pushes content down by the configured top margin height
            // so it aligns with the pre-printed header on the paper.
            const spacerPx = Math.round((topMarginWhenHeaderHidden || 30) * 3.7795)
            return (
                <div
                    style={{ height: `${spacerPx}px`, width: '100%' }}
                    aria-hidden="true"
                    data-role="header-spacer"
                />
            )
        }

        const nameAlign = s?.hotel_name_position || 'center';
        const addressAlign = s?.hotel_address_position || 'left';
        const contactAlign = s?.hotel_contact_position || 'left';
        const logoPos = s?.hotel_logo_position || 'left';

        return (
            <div className="mb-3">
                {s?.show_hotel_logo === 1 && hotelLogo && (
                    <div className={`text-${logoPos} mb-2`}>
                        <img src={hotelLogo} alt="Hotel Logo" className="bill-hotel-logo" />
                    </div>
                )}
                {s?.show_hotel_name === 1 && (
                    <div className={`text-${nameAlign}`} style={{ fontSize: '18pt', fontWeight: 800, color: headerBg }}>
                        {hotelName}
                    </div>
                )}
                {s?.show_hotel_address === 1 && (
                    <div className={`text-${addressAlign} mt-1`} style={{ fontSize: '8.5pt', color: '#666' }}>
                        📍 {hotelAddress}
                    </div>
                )}
                {s?.show_hotel_contact === 1 && (
                    <div className={`text-${contactAlign} mt-1`} style={{ fontSize: '8pt', color: '#666' }}>
                        📞 {hotelPhone} &nbsp;|&nbsp; ✉ {hotelEmail} &nbsp;|&nbsp; 🌐 {hotelWebsite}
                    </div>
                )}
                <hr className="bill-divider" />
            </div>
        );
    };

    const renderBillTitle = () => {
        if (s?.show_bill_title !== 1) return null;
        const titleAlign = s?.bill_title_position || 'center';
        return (
            <div className={`text-${titleAlign} mb-3`}>
                <h3 style={{ margin: 0, fontWeight: 800, letterSpacing: '1px', color: headerBg }}>
                    HOTEL BOOKING BILL
                </h3>
            </div>
        );
    };

    const renderBillInfo = () => (
        <div className="bill-info-row">
            <div>
                {s?.show_invoice_no === 1 && <div><strong>Invoice No.&nbsp;:&nbsp;</strong>{MOCK.invoice_no}</div>}
                {s?.show_invoice_date === 1 && <div><strong>Invoice Date&nbsp;:&nbsp;</strong>{MOCK.invoice_date}</div>}
                {s?.show_booking_id === 1 && <div><strong>Booking ID&nbsp;:&nbsp;</strong>{MOCK.booking_id}</div>}
            </div>
            <div>
                {s?.show_payment_status === 1 && <div><strong>Payment Status&nbsp;:&nbsp;</strong><span className="status-paid">{MOCK.payment_status}</span></div>}
                {s?.show_payment_mode === 1 && <div><strong>Payment Mode&nbsp;:&nbsp;</strong>{MOCK.payment_mode}</div>}
                <div><strong>Guest Name&nbsp;:&nbsp;</strong>{MOCK.guest_name}</div>
            </div>
        </div>
    );

    const renderGuestDetails = () => {
        if (s?.show_guest_details !== 1) return null;
        return (
            <div className="bill-info-box">
                <div className="bill-info-box-header">GUEST DETAILS</div>
                <div className="bill-info-box-body">
                    <table className="bill-detail-table">
                        <tbody>
                            {s?.show_guest_name === 1 && <tr><td className="bdt-label">Name</td><td className="bdt-colon">:</td><td className="bdt-value">{MOCK.guest_name}</td></tr>}
                            {s?.show_guest_mobile === 1 && <tr><td className="bdt-label">Phone</td><td className="bdt-colon">:</td><td className="bdt-value">{MOCK.guest_mobile}</td></tr>}
                            {s?.show_guest_email === 1 && <tr><td className="bdt-label">Email</td><td className="bdt-colon">:</td><td className="bdt-value">{MOCK.guest_email}</td></tr>}
                            {s?.show_guest_address === 1 && <tr><td className="bdt-label">Address</td><td className="bdt-colon">:</td><td className="bdt-value">{MOCK.guest_address}</td></tr>}
                            {s?.show_guest_id_proof === 1 && <tr><td className="bdt-label">ID Proof</td><td className="bdt-colon">:</td><td className="bdt-value">{MOCK.guest_id_proof}</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderBookingDetails = () => {
        if (s?.show_booking_details !== 1) return null;
        return (
            <div className="bill-info-box">
                <div className="bill-info-box-header">BOOKING DETAILS</div>
                <div className="bill-info-box-body">
                    <table className="bill-detail-table">
                        <tbody>
                            {s?.show_checkin_date === 1 && <tr><td className="bdt-label">Check-in Date</td><td className="bdt-colon">:</td><td className="bdt-value">{MOCK.checkin}</td></tr>}
                            {s?.show_checkout_date === 1 && <tr><td className="bdt-label">Check-out Date</td><td className="bdt-colon">:</td><td className="bdt-value">{MOCK.checkout}</td></tr>}
                            {s?.show_nights === 1 && <tr><td className="bdt-label">No. of Nights</td><td className="bdt-colon">:</td><td className="bdt-value">{MOCK.nights}</td></tr>}
                            {s?.show_room_type === 1 && <tr><td className="bdt-label">Room Type</td><td className="bdt-colon">:</td><td className="bdt-value">{MOCK.room_type}</td></tr>}
                            {s?.show_room_numbers === 1 && <tr><td className="bdt-label">No. of Rooms</td><td className="bdt-colon">:</td><td className="bdt-value">{MOCK.room_numbers}</td></tr>}
                            {s?.show_guests_count === 1 && <tr><td className="bdt-label">Guests</td><td className="bdt-colon">:</td><td className="bdt-value">{MOCK.guests}</td></tr>}
                            {s?.show_tariff_plan === 1 && <tr><td className="bdt-label">Tariff Plan</td><td className="bdt-colon">:</td><td className="bdt-value">{MOCK.tariff_plan}</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderChargesTable = () => {
        const showRowNums = s?.show_row_numbers === 1;
        const colCount = showRowNums ? 5 : 4;
        const subTotal = MOCK.subtotal + MOCK.service_charge;
        const tax = MOCK.tax;
        const discount = MOCK.discount;
        const grandTotal = MOCK.grand_total;

        return (
            <table className="bill-charges-table">
                <thead>
                    <tr>
                        {showRowNums && <th style={{ width: '40px' }}>#</th>}
                        <th>DESCRIPTION</th>
                        <th>DATE</th>
                        <th className="bct-right">QTY</th>
                        <th className="bct-right">RATE (INR)</th>
                        <th className="bct-right">AMOUNT (INR)</th>
                    </tr>
                </thead>
                <tbody>
                    {MOCK.rows.map((row, idx) => (
                        <tr key={idx}>
                            {showRowNums && <td className="bct-center">{idx + 1}</td>}
                            <td>{row.label}</td>
                            <td>{row.date}</td>
                            <td className="bct-right">{row.qty}</td>
                            <td className="bct-right">{row.rate.toFixed(2)}</td>
                            <td className="bct-right">{row.amount.toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr className="bct-total-row">
                        <td colSpan={colCount} className="bct-total-label">SUBTOTAL</td>
                        <td className="bct-total-value bct-right">{subTotal.toFixed(2)}</td>
                    </tr>
                    {s?.show_discount_column === 1 && discount > 0 && (
                        <tr className="bct-total-row">
                            <td colSpan={colCount} className="bct-total-label" style={{ color: '#cc0000' }}>DISCOUNT</td>
                            <td className="bct-total-value bct-right" style={{ color: '#cc0000' }}>-{discount.toFixed(2)}</td>
                        </tr>
                    )}
                    {s?.show_cgst_sgst_breakdown === 1 && (
                        <>
                            <tr className="bct-total-row">
                                <td colSpan={colCount} className="bct-total-label">CGST (6%)</td>
                                <td className="bct-total-value bct-right">{(tax / 2).toFixed(2)}</td>
                            </tr>
                            <tr className="bct-total-row">
                                <td colSpan={colCount} className="bct-total-label">SGST (6%)</td>
                                <td className="bct-total-value bct-right">{(tax / 2).toFixed(2)}</td>
                            </tr>
                        </>
                    )}
                    <tr className="bct-grand-total-row">
                        <td colSpan={colCount} className="bct-grand-label">GRAND TOTAL</td>
                        <td className="bct-grand-value bct-right">{grandTotal.toFixed(2)}</td>
                    </tr>
                    <tr className="bct-paid-row">
                        <td colSpan={colCount} className="bct-paid-label">TOTAL PAID (INR)</td>
                        <td className="bct-paid-value bct-right">{grandTotal.toFixed(2)}</td>
                    </tr>
                </tfoot>
            </table>
        );
    };

    const renderAmountInWords = () => (
        <div className="bill-amount-words">
            <span className="baw-label">Amount in Words: </span>
            <span className="baw-text">Rupees Ten Thousand Only</span>
        </div>
    );

    const renderPaymentDetails = () => (
        <div className="bill-info-box">
            <div className="bill-info-box-header">PAYMENT DETAILS</div>
            <div className="bill-info-box-body">
                <table className="bill-detail-table">
                    <tbody>
                        <tr><td className="bdt-label">Paid Amount</td><td className="bdt-colon">:</td><td className="bdt-value">INR {MOCK.grand_total.toFixed(2)}</td></tr>
                        <tr><td className="bdt-label">Transaction ID</td><td className="bdt-colon">:</td><td className="bdt-value">{MOCK.txn_id}</td></tr>
                        <tr><td className="bdt-label">Payment Date</td><td className="bdt-colon">:</td><td className="bdt-value">{MOCK.payment_date}</td></tr>
                        <tr><td className="bdt-label">Bank / Card</td><td className="bdt-colon">:</td><td className="bdt-value">{MOCK.bank}</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderNoteBox = () => (
        <div className="bill-info-box">
            <div className="bill-info-box-header">NOTE</div>
            <div className="bill-info-box-body">
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '8pt' }}>
                    <li>Check-in time: 02:00 PM</li>
                    <li>Check-out time: 11:00 AM</li>
                    <li>Early check-in or late check-out is subject to availability and may incur additional charges.</li>
                    <li>This is a computer generated invoice. No signature required.</li>
                </ul>
            </div>
        </div>
    );

    const renderFooter = () => (
        <div className="text-center mt-3">
            {s?.show_thankyou_message === 1 && (
                <div className="bill-thankyou">{s?.thankyou_message_text || 'Thank You!'}</div>
            )}
            {s?.show_footer_note === 1 && (
                <div className="mt-2" style={{ fontSize: '9pt', color: '#555' }}>
                    {s?.footer_note_text || 'We look forward to welcoming you again.'}
                </div>
            )}
            <div className="mt-2" style={{ fontSize: '8pt', color: '#999' }}>
                {s?.show_gst_details === 1 && <div>GSTIN: {hotelGSTIN}</div>}
                {s?.show_company_pan === 1 && <div>PAN: {hotelPAN}</div>}
                {s?.show_fssai === 1 && <div>FSSAI: {hotelFSSAI}</div>}
            </div>
            {s?.custom_footer_text && (
                <div className="mt-2" style={{ fontSize: '8pt', color: '#999' }}>
                    {s.custom_footer_text}
                </div>
            )}
        </div>
    );

    const renderLayout = () => {
        const guestPos = s?.guest_details_position || 'left';
        const bookingPos = s?.booking_details_position || 'right';
        const topBottom = guestPos === 'top' || bookingPos === 'top' ||
            guestPos === 'bottom' || bookingPos === 'bottom';

        return (
            <div>
                {renderHotelHeader()}
                {renderBillTitle()}
                {s?.custom_header_text && (
                    <div className="text-center mb-3" style={{ fontSize: '9pt', color: '#666' }}>
                        {s.custom_header_text}
                    </div>
                )}

                {topBottom ? (
                    <>
                        {guestPos === 'top' && s?.show_guest_details === 1 && renderGuestDetails()}
                        {bookingPos === 'top' && s?.show_booking_details === 1 && renderBookingDetails()}
                        {renderBillInfo()}
                        {renderChargesTable()}
                        {renderAmountInWords()}
                        <div className="two-column-layout">
                            {renderPaymentDetails()}
                            {renderNoteBox()}
                        </div>
                        {guestPos === 'bottom' && s?.show_guest_details === 1 && renderGuestDetails()}
                        {bookingPos === 'bottom' && s?.show_booking_details === 1 && renderBookingDetails()}
                    </>
                ) : (
                    <>
                        <div className="two-column-layout">
                            <div>
                                {guestPos === 'left' && s?.show_guest_details === 1 && renderGuestDetails()}
                                {bookingPos === 'left' && s?.show_booking_details === 1 && renderBookingDetails()}
                            </div>
                            <div>
                                {guestPos === 'right' && s?.show_guest_details === 1 && renderGuestDetails()}
                                {bookingPos === 'right' && s?.show_booking_details === 1 && renderBookingDetails()}
                            </div>
                        </div>
                        {renderBillInfo()}
                        {renderChargesTable()}
                        {renderAmountInWords()}
                        <div className="two-column-layout">
                            {renderPaymentDetails()}
                            {renderNoteBox()}
                        </div>
                    </>
                )}
                {renderFooter()}
            </div>
        );
    };

    if (loading) {
        return (
            <Modal show={show} onHide={onHide} size="lg" centered>
                <Modal.Body className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-2">Loading preview...</p>
                </Modal.Body>
            </Modal>
        );
    }

    const printSize = s?.default_print_size || 'A4';
    const paperWidth = printSize === 'thermal_80mm' ? '80mm' : printSize === 'thermal_58mm' ? '58mm' : '820px';

    return (
        <>
            <style>{`
                .bill-preview-modal-dialog { max-width: 980px !important; }
                .bill-preview-body {
                    background: #e8eaed;
                    padding: 0;
                    max-height: 82vh;
                    overflow-y: auto;
                }
                .bill-preview-action-bar {
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                    padding: 10px 20px;
                    background: white;
                    border-bottom: 1px solid #dee2e6;
                    position: sticky;
                    top: 0;
                    z-index: 10;
                }
                .btn-preview-print {
                    background: ${headerBg};
                    color: white;
                    border: none;
                    padding: 7px 22px;
                    border-radius: 4px;
                    font-size: 13px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 7px;
                    cursor: pointer;
                }
                .btn-preview-print:hover { opacity: 0.88; color: white; }
                .btn-preview-pdf {
                    background: #c0392b;
                    color: white;
                    border: none;
                    padding: 7px 22px;
                    border-radius: 4px;
                    font-size: 13px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 7px;
                    cursor: pointer;
                    position: relative;
                }
                .btn-preview-pdf:hover { opacity: 0.88; color: white; }

                .bill-preview-paper {
                    background: white;
                    width: ${paperWidth};
                    margin: 0 auto;
                    padding: 0 32px 28px 32px;
                    box-shadow: 0 6px 24px rgba(0,0,0,0.13);
                    border-radius: 3px;
                }
                ${getBillStyles(s)}
            `}</style>

            <Modal
                show={show}
                onHide={onHide}
                dialogClassName="bill-preview-modal-dialog"
                centered
                backdrop="static"
            >
                <Modal.Header
                    closeButton
                    className="py-2"
                    style={{ background: headerBg, borderBottom: 'none' }}
                >
                    <Modal.Title className="text-white fw-bold" style={{ fontSize: '0.9rem' }}>
                        🔍 Bill Preview — {hotelName}
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body className="bill-preview-body p-0">
                    <div className="bill-preview-action-bar">
                        <Button className="btn-preview-print" onClick={handlePrint}>
                            🖨️ Print Preview
                        </Button>
                        <Button className="btn-preview-pdf" onClick={handleDownloadPDF} disabled={pdfLoading}>
                            {pdfLoading ? (
                                <><Spinner animation="border" size="sm" className="me-1" /> Generating PDF...</>
                            ) : (
                                <>📄 Download PDF</>
                            )}
                        </Button>
                        <Button variant="outline-secondary" size="sm" onClick={onHide}>
                            Close
                        </Button>
                    </div>
                    <div style={{ padding: '20px', background: '#e8eaed' }}>
                        <div className="bill-preview-paper bill-wrap" ref={printRef}>
                            {renderLayout()}
                        </div>
                    </div>
                </Modal.Body>
            </Modal>
        </>
    );
};

export default BillPreviewModal;