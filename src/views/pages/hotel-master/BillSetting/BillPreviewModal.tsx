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

// Mock data for preview
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
    room_numbers: '101, 102',
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
    dailyRows: [
        { 
            date: '24/05/24', 
            tariff: 4500.00, 
            expax: 0.00, 
            cgst: 202.50, 
            sgst: 202.50, 
            post: 0.00, 
            allow: 0.00, 
            advance: 0.00, 
            food: 0.00, 
            total: 4905.00 
        },
        { 
            date: '25/05/24', 
            tariff: 4500.00, 
            expax: 0.00, 
            cgst: 202.50, 
            sgst: 202.50, 
            post: 0.00, 
            allow: 0.00, 
            advance: 0.00, 
            food: 0.00, 
            total: 4905.00 
        },
    ],
    totals: {
        tariff: 9000.00,
        expax: 0.00,
        cgst: 405.00,
        sgst: 405.00,
        post: 0.00,
        allow: 0.00,
        advance: 0.00,
        food: 0.00,
        total: 9810.00
    }
};

const getBillStyles = (s: BillPrintSetting | null, headerBgColor: string, headerTextColor: string) => {
    const fontSize = s?.table_font_size === 'small' ? '7pt' : s?.table_font_size === 'large' ? '9pt' : '8pt';

    return `
    .bill-wrap * { box-sizing: border-box; }
    .bill-wrap {
      font-family: 'Segoe UI', 'Calibri', Arial, sans-serif;
      font-size: ${fontSize};
      color: #1a1a1a;
      line-height: 1.3;
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
      border: none;
      border-top: 1px solid #d0d0d0;
      margin: 10px 0;
    }

    .bill-wrap .bill-info-box {
      border: 1px solid #c8c8c8;
      border-radius: 3px;
      overflow: hidden;
      margin-bottom: 12px;
    }
    .bill-wrap .bill-info-box-header {
      background: ${headerBgColor};
      color: ${headerTextColor};
      text-align: center;
      font-weight: 700;
      font-size: 7.5pt;
      letter-spacing: 0.5px;
      padding: 4px 8px;
    }
    .bill-wrap .bill-info-box-body {
      padding: 8px 10px;
    }

    .bill-wrap .bill-detail-table {
      width: 100%;
      border-collapse: collapse;
    }
    .bill-wrap .bill-detail-table td {
      padding: 2px 4px;
      font-size: 7.5pt;
      vertical-align: top;
    }
    .bill-wrap .bdt-label {
      font-weight: 600;
      color: #333;
      white-space: nowrap;
      width: 90px;
    }
    .bill-wrap .bdt-colon {
      padding: 2px 4px;
      color: #555;
      width: 10px;
    }
    .bill-wrap .bdt-value {
      color: #222;
    }

    .bill-wrap .two-column-layout {
      display: flex;
      gap: 12px;
      margin-bottom: 12px;
      align-items: stretch;
    }
    .bill-wrap .two-column-layout > div {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }
    .bill-wrap .two-column-layout > div > .bill-info-box {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .bill-wrap .two-column-layout > div > .bill-info-box > .bill-info-box-body {
      flex: 1;
    }

    .bill-wrap .bill-charges-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 0;
      font-size: ${fontSize};
      table-layout: auto;
    }
    .bill-wrap .bill-charges-table thead tr th {
      background: ${headerBgColor};
      color: ${headerTextColor};
      font-weight: 700;
      padding: 5px 6px;
      border: 1px solid ${headerBgColor};
      white-space: nowrap;
      font-size: 7pt;
    }
    .bill-wrap .bill-charges-table tbody tr td {
      border: 1px solid #d4d4d4;
      padding: 5px 6px;
      vertical-align: middle;
      font-size: 7.5pt;
    }
    .bill-wrap .bill-charges-table tbody tr:nth-child(even) td {
      background: #f9f9f9;
    }
    .bill-wrap .bill-charges-table tfoot tr td {
      border: 1px solid #d4d4d4;
      padding: 5px 6px;
      font-size: 7.5pt;
    }
    .bill-wrap .bct-right { text-align: right; }
    .bill-wrap .bct-center { text-align: center; }
    .bill-wrap .bct-left { text-align: left; }

    .bill-wrap .col-srno { width: 35px; }
    .bill-wrap .col-date { width: 65px; }
    .bill-wrap .col-amount { width: 80px; }
    .bill-wrap .col-small { width: 65px; }

    .bill-wrap .bill-amount-words {
      border: 1px solid #d4d4d4;
      border-top: none;
      padding: 6px 10px;
      font-size: 7.5pt;
      margin-bottom: 12px;
      margin-top: 0;
    }
    .bill-wrap .baw-label { font-style: italic; color: #555; margin-right: 3px; }
    .bill-wrap .baw-text { font-style: italic; color: #222; }

    .bill-wrap .bill-thankyou {
      font-family: 'Dancing Script', 'Brush Script MT', cursive;
      font-size: 20pt;
      color: ${headerBgColor};
      line-height: 1.2;
    }

    .bill-wrap .bill-hotel-logo {
      max-height: 55px;
      max-width: 140px;
      object-fit: contain;
    }

    .bill-wrap .bill-info-row {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      flex-wrap: wrap;
      padding: 6px 10px;
      background: #f8f9fa;
      border: 1px solid #dde2ea;
      border-radius: 3px;
      margin-bottom: 12px;
      font-size: 7.5pt;
    }
    .bill-wrap .bill-info-row > div {
      flex: 1;
      min-width: 140px;
    }
    .bill-wrap .bill-info-row strong {
      color: #333;
    }
    .bill-wrap .status-paid {
      color: #1a7a3a;
      font-weight: 700;
    }
  `;
};

const numberToWords = (num: number): string => {
    const ones = [
        '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
        'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
        'Seventeen', 'Eighteen', 'Nineteen'
    ];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const convertHundreds = (n: number): string => {
        if (n >= 100) {
            return ones[Math.floor(n / 100)] + ' Hundred ' + convertHundreds(n % 100);
        } else if (n >= 20) {
            return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
        } else {
            return ones[n];
        }
    };

    if (num === 0) return 'Zero Rupees Only';

    const intPart = Math.floor(num);
    const decPart = Math.round((num - intPart) * 100);

    let result = '';
    if (intPart >= 10000000) {
        result += convertHundreds(Math.floor(intPart / 10000000)) + ' Crore ';
        const remainder = intPart % 10000000;
        if (remainder > 0) result += convertHundreds(remainder);
    } else if (intPart >= 100000) {
        result += convertHundreds(Math.floor(intPart / 100000) % 100) + ' Lakh ';
        result += convertHundreds(intPart % 100000);
    } else if (intPart >= 1000) {
        result += convertHundreds(Math.floor(intPart / 1000) % 100) + ' Thousand ';
        result += convertHundreds(intPart % 1000);
    } else {
        result += convertHundreds(intPart % 1000);
    }

    result = result.trim() + ' Rupees';
    if (decPart > 0) result += ' and ' + convertHundreds(decPart) + ' Paise';
    return result + ' Only';
};

const formatAmt = (amt: number): string => {
    if (isNaN(amt) || amt === null || amt === undefined) return '0.00';
    return amt.toFixed(2);
};

const formatAmtDisplay = (amt: number): string => {
    if (isNaN(amt) || amt === null || amt === undefined) return '₹0.00';
    return `₹${amt.toFixed(2)}`;
};

const BillPreviewModal: React.FC<BillPreviewModalProps> = ({ show, onHide, settings, hotelId }) => {
    const printRef = useRef<HTMLDivElement>(null);
    const [hotelDetails, setHotelDetails] = useState<any>(null);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(false);

    useEffect(() => {
        if (show && hotelId) {
            fetchHotelDetails();
        }
    }, [show, hotelId]);

    const fetchHotelDetails = async () => {
        if (!hotelId) return;
        setIsFetching(true);
        try {
            const response = await BrandService.getBrandById(String(hotelId));
            setHotelDetails(response.data || response);
        } catch (err) {
            console.error('Failed to fetch hotel details:', err);
        } finally {
            setIsFetching(false);
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

    const discountAmount = MOCK.discount;
    const netTotal = MOCK.grand_total;

    const handlePrint = () => {
        const printContents = printRef.current?.innerHTML || '';
        const printWindow = window.open('', '_blank', 'width=800,height=700');
        if (!printWindow) return;
        
        const effectiveTopMargin = !showTopHeaderSection ? 0 : (s?.margin_top_mm || 8);
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Bill Preview - ${hotelName}</title>
                    <style>
                        * { box-sizing: border-box; margin: 0; padding: 0; }
                        @page {
                            size: ${s?.default_print_size === 'A4' ? 'A4' : 'auto'};
                            margin: ${effectiveTopMargin}mm ${s?.margin_right_mm || 8}mm ${s?.margin_bottom_mm || 8}mm ${s?.margin_left_mm || 8}mm;
                        }
                        body { 
                            background: white; 
                            margin: 0; 
                            padding: 0;
                        }
                        .print-container {
                            width: 100%;
                            margin: 0;
                            padding: 0;
                        }
                        ${getBillStyles(s, headerBg, headerText)}
                        @media print {
                            body {
                                margin: 0;
                                padding: 0;
                            }
                            .print-container {
                                margin: 0;
                                padding: 0;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="print-container">
                        ${printContents}
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 300);
    };

    const handleDownloadPDF = async () => {
        const billEl = printRef.current;
        if (!billEl) return;

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

            const printSize = s?.default_print_size || 'A4';
            const isA4 = printSize !== 'thermal_80mm' && printSize !== 'thermal_58mm';
            const pdfW = isA4 ? 210 : (printSize === 'thermal_80mm' ? 80 : 58);

            const canvas = await html2canvas(billEl, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false,
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.92);
            const imgW = pdfW - (s?.margin_left_mm || 8) - (s?.margin_right_mm || 8);
            const imgH = (canvas.height / canvas.width) * imgW;

            const topMargin = !showTopHeaderSection ? (s?.top_margin_when_header_hidden || 20) : (s?.margin_top_mm || 8);
            const bottomMargin = s?.margin_bottom_mm || 8;
            const leftMargin = s?.margin_left_mm || 8;

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
            const spacerPx = Math.round((topMarginWhenHeaderHidden || 20) * 3.7795);
            return (
                <div
                    style={{ height: `${spacerPx}px`, width: '100%' }}
                    aria-hidden="true"
                    data-role="header-spacer"
                />
            );
        }

        const nameAlign = s?.hotel_name_position || 'center';
        const addressAlign = s?.hotel_address_position || 'left';
        const contactAlign = s?.hotel_contact_position || 'left';
        const logoPos = s?.hotel_logo_position || 'left';

        return (
            <div className="mb-2">
                {s?.show_hotel_logo === 1 && hotelLogo && (
                    <div className={`text-${logoPos} mb-1`}>
                        <img src={hotelLogo} alt="Hotel Logo" className="bill-hotel-logo" />
                    </div>
                )}
                {s?.show_hotel_name === 1 && (
                    <div className={`text-${nameAlign}`} style={{ fontSize: '16pt', fontWeight: 800, color: headerBg }}>
                        {hotelName}
                    </div>
                )}
                {s?.show_hotel_address === 1 && (
                    <div className={`text-${addressAlign} mt-1`} style={{ fontSize: '7.5pt', color: '#666' }}>
                        📍 {hotelAddress}
                    </div>
                )}
                {s?.show_hotel_contact === 1 && (
                    <div className={`text-${contactAlign} mt-1`} style={{ fontSize: '7pt', color: '#666' }}>
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
            <div className={`text-${titleAlign} mb-2`}>
                <h3 style={{ margin: 0, fontWeight: 800, letterSpacing: '0.5px', color: headerBg, fontSize: '12pt' }}>
                    HOTEL BOOKING BILL
                </h3>
            </div>
        );
    };

    const renderBillInfo = () => (
        <div className="bill-info-row">
            <div>
                {s?.show_invoice_no === 1 && <div><strong>Invoice No.</strong> : {MOCK.invoice_no}</div>}
                {s?.show_invoice_date === 1 && <div><strong>Invoice Date</strong> : {MOCK.invoice_date}</div>}
                {s?.show_booking_id === 1 && <div><strong>Booking ID</strong> : {MOCK.booking_id}</div>}
            </div>
            <div>
                {s?.show_payment_status === 1 && <div><strong>Payment Status</strong> : <span className="status-paid">{MOCK.payment_status}</span></div>}
                {s?.show_payment_mode === 1 && <div><strong>Payment Mode</strong> : {MOCK.payment_mode}</div>}
                <div><strong>Guest Name</strong> : {MOCK.guest_name}</div>
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
                            {s?.show_guest_name === 1 && (
                                <tr>
                                    <td className="bdt-label">Name</td>
                                    <td className="bdt-colon">:</td>
                                    <td className="bdt-value">{MOCK.guest_name}</td>
                                </tr>
                            )}
                            {s?.show_guest_mobile === 1 && (
                                <tr>
                                    <td className="bdt-label">Phone</td>
                                    <td className="bdt-colon">:</td>
                                    <td className="bdt-value">{MOCK.guest_mobile}</td>
                                </tr>
                            )}
                            {s?.show_guest_email === 1 && (
                                <tr>
                                    <td className="bdt-label">Email</td>
                                    <td className="bdt-colon">:</td>
                                    <td className="bdt-value">{MOCK.guest_email}</td>
                                </tr>
                            )}
                            {s?.show_guest_address === 1 && (
                                <tr>
                                    <td className="bdt-label">Address</td>
                                    <td className="bdt-colon">:</td>
                                    <td className="bdt-value">{MOCK.guest_address}</td>
                                </tr>
                            )}
                            {s?.show_guest_id_proof === 1 && (
                                <tr>
                                    <td className="bdt-label">ID Proof</td>
                                    <td className="bdt-colon">:</td>
                                    <td className="bdt-value">{MOCK.guest_id_proof}</td>
                                </tr>
                            )}
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
                            {s?.show_checkin_date === 1 && (
                                <tr>
                                    <td className="bdt-label">Check-in Date</td>
                                    <td className="bdt-colon">:</td>
                                    <td className="bdt-value">{MOCK.checkin}</td>
                                </tr>
                            )}
                            {s?.show_checkout_date === 1 && (
                                <tr>
                                    <td className="bdt-label">Check-out Date</td>
                                    <td className="bdt-colon">:</td>
                                    <td className="bdt-value">{MOCK.checkout}</td>
                                </tr>
                            )}
                            {s?.show_nights === 1 && (
                                <tr>
                                    <td className="bdt-label">No. of Nights</td>
                                    <td className="bdt-colon">:</td>
                                    <td className="bdt-value">{MOCK.nights}</td>
                                </tr>
                            )}
                            {s?.show_room_type === 1 && (
                                <tr>
                                    <td className="bdt-label">Room Type</td>
                                    <td className="bdt-colon">:</td>
                                    <td className="bdt-value">{MOCK.room_type}</td>
                                </tr>
                            )}
                            {s?.show_room_numbers === 1 && (
                                <tr>
                                    <td className="bdt-label">Room No(s).</td>
                                    <td className="bdt-colon">:</td>
                                    <td className="bdt-value">{MOCK.room_numbers}</td>
                                </tr>
                            )}
                            {s?.show_guests_count === 1 && (
                                <tr>
                                    <td className="bdt-label">Guests</td>
                                    <td className="bdt-colon">:</td>
                                    <td className="bdt-value">{MOCK.guests}</td>
                                </tr>
                            )}
                            {s?.show_tariff_plan === 1 && (
                                <tr>
                                    <td className="bdt-label">Tariff Plan</td>
                                    <td className="bdt-colon">:</td>
                                    <td className="bdt-value">{MOCK.tariff_plan}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderChargesTable = () => {
        const showRowNums = s?.show_row_numbers === 1;
        const hasCGSTData = MOCK.totals.cgst > 0 || MOCK.totals.sgst > 0;
        const hasAdvanceData = MOCK.totals.advance > 0;
        
        const headers: React.ReactElement[] = [];
        if (showRowNums) headers.push(<th key="srno" className="col-srno bct-center">#</th>);
        headers.push(<th key="date" className="col-date bct-left">DATE</th>);
        headers.push(<th key="tariff" className="col-amount bct-right">TARIFF</th>);
        headers.push(<th key="expax" className="col-amount bct-right">EX.PAX</th>);
        if (hasCGSTData) {
            headers.push(<th key="cgst" className="col-small bct-right">CGST</th>);
            headers.push(<th key="sgst" className="col-small bct-right">SGST</th>);
        }
        headers.push(<th key="post" className="col-amount bct-right">POST</th>);
        headers.push(<th key="allow" className="col-amount bct-right">ALLOW</th>);
        if (hasAdvanceData) {
            headers.push(<th key="advance" className="col-amount bct-right">ADVANCE</th>);
        }
        headers.push(<th key="food" className="col-amount bct-right">FOOD</th>);
        headers.push(<th key="total" className="col-amount bct-right">TOTAL</th>);

        const totalCols = headers.length;
        const bodyRows: React.ReactElement[] = [];
        let runningIndex = 1;

        MOCK.dailyRows.forEach((row, idx) => {
            const postDisplay = row.post > 0 ? formatAmtDisplay(row.post) : '-';
            const allowDisplay = row.allow > 0 ? formatAmtDisplay(row.allow) : '-';
            const advanceDisplay = row.advance > 0 ? formatAmtDisplay(row.advance) : '-';
            const foodDisplay = row.food > 0 ? formatAmtDisplay(row.food) : '-';

            const cells: React.ReactElement[] = [];
            if (showRowNums) cells.push(<td key="srno" className="bct-center">{runningIndex++}</td>);
            cells.push(<td key="date" className="bct-left">{row.date}</td>);
            cells.push(<td key="tariff" className="bct-right">{formatAmtDisplay(row.tariff)}</td>);
            cells.push(<td key="expax" className="bct-right">{formatAmtDisplay(row.expax)}</td>);
            if (hasCGSTData) {
                cells.push(<td key="cgst" className="bct-right">{formatAmtDisplay(row.cgst)}</td>);
                cells.push(<td key="sgst" className="bct-right">{formatAmtDisplay(row.sgst)}</td>);
            }
            cells.push(<td key="post" className="bct-right" style={{ color: '#1a7a3a', fontWeight: 500 }}>{postDisplay}</td>);
            cells.push(<td key="allow" className="bct-right" style={{ color: '#cc0000', fontWeight: 500 }}>{allowDisplay}</td>);
            if (hasAdvanceData) {
                cells.push(<td key="advance" className="bct-right" style={{ color: '#cc0000', fontWeight: 500 }}>{advanceDisplay}</td>);
            }
            cells.push(<td key="food" className="bct-right">{foodDisplay}</td>);
            cells.push(<td key="total" className="bct-right" style={{ fontWeight: 600 }}>{formatAmtDisplay(row.total)}</td>);
            bodyRows.push(<tr key={idx}>{cells}</tr>);
        });

        const labelColSpan = showRowNums ? 2 : 1;

        const footerCells: React.ReactElement[] = [];
        footerCells.push(<td key="total_label" colSpan={labelColSpan} className="bct-right" style={{ fontWeight: 700 }}>Total</td>);
        footerCells.push(<td key="total_tariff" className="bct-right" style={{ fontWeight: 700 }}>{formatAmtDisplay(MOCK.totals.tariff)}</td>);
        footerCells.push(<td key="total_expax" className="bct-right" style={{ fontWeight: 700 }}>{formatAmtDisplay(MOCK.totals.expax)}</td>);
        if (hasCGSTData) {
            footerCells.push(<td key="total_cgst" className="bct-right" style={{ fontWeight: 700 }}>{formatAmtDisplay(MOCK.totals.cgst)}</td>);
            footerCells.push(<td key="total_sgst" className="bct-right" style={{ fontWeight: 700 }}>{formatAmtDisplay(MOCK.totals.sgst)}</td>);
        }
        footerCells.push(<td key="total_post" className="bct-right" style={{ fontWeight: 700, color: '#1a7a3a' }}>{formatAmtDisplay(MOCK.totals.post)}</td>);
        footerCells.push(<td key="total_allow" className="bct-right" style={{ fontWeight: 700, color: '#cc0000' }}>{formatAmtDisplay(MOCK.totals.allow)}</td>);
        if (hasAdvanceData) {
            footerCells.push(<td key="total_advance" className="bct-right" style={{ fontWeight: 700, color: '#cc0000' }}>{formatAmtDisplay(MOCK.totals.advance)}</td>);
        }
        footerCells.push(<td key="total_food" className="bct-right" style={{ fontWeight: 700 }}>{formatAmtDisplay(MOCK.totals.food)}</td>);
        footerCells.push(<td key="total_amount" className="bct-right" style={{ fontWeight: 800, background: '#f0f0f0' }}>{formatAmtDisplay(MOCK.totals.total)}</td>);

        const afterDiscountTotal = MOCK.totals.total - discountAmount;

        const summaryRows: React.ReactElement[] = [];

        if (discountAmount > 0) {
            summaryRows.push(
                <tr key="summary_discount">
                    <td colSpan={totalCols - 1} className="bct-right" style={{ fontWeight: 600, color: '#cc0000', borderTop: '2px solid #d4d4d4' }}>
                        Discount
                    </td>
                    <td className="bct-right" style={{ fontWeight: 600, color: '#cc0000', borderTop: '2px solid #d4d4d4' }}>
                        {formatAmtDisplay(discountAmount)}
                    </td>
                </tr>
            );
        }

        summaryRows.push(
            <tr key="summary_total" style={{ background: '#e8f0fe' }}>
                <td colSpan={totalCols - 1} className="bct-right" style={{ fontWeight: 800 }}>
                    Sub Total
                </td>
                <td className="bct-right" style={{ fontWeight: 800 }}>
                    {formatAmtDisplay(afterDiscountTotal)}
                </td>
            </tr>
        );

        summaryRows.push(
            <tr key="summary_grand_total" style={{ background: headerBg, color: headerText }}>
                <td colSpan={totalCols - 1} className="bct-right" style={{ fontWeight: 800, fontSize: '9pt' }}>
                    TOTAL PAID (INR)
                </td>
                <td className="bct-right" style={{ fontWeight: 800, fontSize: '9pt' }}>
                    {formatAmtDisplay(netTotal)}
                </td>
            </tr>
        );

        return (
            <div style={{ overflowX: 'auto' }}>
                <table className="bill-charges-table">
                    <thead>
                        <tr>{headers}</tr>
                    </thead>
                    <tbody>
                        {bodyRows}
                    </tbody>
                    <tfoot>
                        <tr>{footerCells}</tr>
                        {summaryRows}
                    </tfoot>
                </table>
            </div>
        );
    };

    const renderAmountInWords = () => (
        <div className="bill-amount-words">
            <span className="baw-label">Amount in Words: </span>
            <span className="baw-text">{numberToWords(netTotal)}</span>
        </div>
    );

    const renderPaymentDetails = () => (
        <div className="bill-info-box">
            <div className="bill-info-box-header">PAYMENT DETAILS</div>
            <div className="bill-info-box-body">
                <table className="bill-detail-table">
                    <tbody>
                        <tr>
                            <td className="bdt-label">Paid Amount</td>
                            <td className="bdt-colon">:</td>
                            <td className="bdt-value">INR {formatAmt(netTotal)}</td>
                        </tr>
                        <tr>
                            <td className="bdt-label">Transaction ID</td>
                            <td className="bdt-colon">:</td>
                            <td className="bdt-value">{MOCK.txn_id}</td>
                        </tr>
                        <tr>
                            <td className="bdt-label">Payment Date</td>
                            <td className="bdt-colon">:</td>
                            <td className="bdt-value">{MOCK.payment_date}</td>
                        </tr>
                        <tr>
                            <td className="bdt-label">Bank / Card</td>
                            <td className="bdt-colon">:</td>
                            <td className="bdt-value">{MOCK.bank}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderNoteBox = () => (
        <div className="bill-info-box">
            <div className="bill-info-box-header">NOTE</div>
            <div className="bill-info-box-body">
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '7pt' }}>
                    <li>Check-in time: 02:00 PM</li>
                    <li>Check-out time: 11:00 AM</li>
                    <li>Early check-in or late check-out is subject to availability and may incur additional charges.</li>
                    <li>This is a computer generated invoice. No signature required.</li>
                </ul>
            </div>
        </div>
    );

    const renderFooter = () => (
        <div className="text-center mt-2">
            {s?.show_thankyou_message === 1 && (
                <div className="bill-thankyou">{s?.thankyou_message_text || 'Thank You!'}</div>
            )}
            {s?.show_footer_note === 1 && (
                <div className="mt-1" style={{ fontSize: '8pt', color: '#555' }}>
                    {s?.footer_note_text || 'We look forward to welcoming you again.'}
                </div>
            )}
            <div className="mt-1" style={{ fontSize: '7pt', color: '#999' }}>
                {s?.show_gst_details === 1 && <div>GSTIN: {hotelGSTIN}</div>}
                {s?.show_company_pan === 1 && <div>PAN: {hotelPAN}</div>}
                {s?.show_fssai === 1 && <div>FSSAI: {hotelFSSAI}</div>}
            </div>
            {s?.custom_footer_text && (
                <div className="mt-1" style={{ fontSize: '7pt', color: '#999' }}>{s.custom_footer_text}</div>
            )}
        </div>
    );

    const renderLayout = () => {
        const guestPos = s?.guest_details_position || 'left';
        const bookingPos = s?.booking_details_position || 'right';
        const topBottom = guestPos === 'top' || bookingPos === 'top' || guestPos === 'bottom' || bookingPos === 'bottom';

        return (
            <div>
                {renderHotelHeader()}
                {renderBillTitle()}
                {s?.custom_header_text && (
                    <div className="text-center mb-2" style={{ fontSize: '8pt', color: '#666' }}>
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

    const printSize = s?.default_print_size || 'A4';
    const paperWidth = printSize === 'thermal_80mm' ? '80mm' : printSize === 'thermal_58mm' ? '58mm' : '850px';

    if (isFetching) {
        return (
            <Modal show={show} onHide={onHide} size="lg" centered>
                <Modal.Body className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-2">Loading preview...</p>
                </Modal.Body>
            </Modal>
        );
    }

    return (
        <>
            <style>{`
                .bill-preview-modal-dialog { max-width: 950px !important; width: 95% !important; }
                .bill-preview-body {
                    background: #e8eaed;
                    padding: 0;
                    max-height: 85vh;
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
                    padding: 6px 20px;
                    border-radius: 4px;
                    font-size: 12px;
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
                    padding: 6px 20px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 7px;
                    cursor: pointer;
                }
                .btn-preview-pdf:hover { opacity: 0.88; color: white; }

                .bill-preview-paper {
                    background: white;
                    width: ${paperWidth};
                    max-width: 900px;
                    margin: 0 auto;
                    padding: 15px 25px 25px 25px;
                    box-shadow: 0 6px 24px rgba(0,0,0,0.13);
                    border-radius: 3px;
                }
                @media print {
                    .bill-preview-paper { 
                        box-shadow: none; 
                        width: 100% !important; 
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    .no-print { display: none !important; }
                    body { 
                        margin: 0 !important; 
                        padding: 0 !important;
                        background: white !important;
                    }
                }
                ${getBillStyles(s, headerBg, headerText)}
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
                    <Modal.Title className="text-white fw-bold" style={{ fontSize: '0.85rem' }}>
                        🔍 Bill Preview — {hotelName}
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body className="bill-preview-body p-0">
                    <div className="bill-preview-action-bar no-print">
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
                    <div style={{ padding: '15px', background: '#e8eaed' }}>
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