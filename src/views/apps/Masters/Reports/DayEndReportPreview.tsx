import React, { useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import { Printer, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/common/context/useAuthContext";
import { toast } from "react-hot-toast";
import SettingsService from "@/common/api/settings";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
interface BillDetail {
  TxnNo: string;
  table_name: string;
  Discount: number;
  tipAmount: number;
  grossAmount: number;
  CGST: number;
  SGST: number;
  netAmount: number;
  paymentMode: string;
  TxnDatetime: string;
  settlement_breakdown?: string;
}
interface PaymentSummary  { PaymentType: string; totalAmount: number; billCount: number; }
interface CreditSummary   { customerName: string; creditAmount: number; billCount: number; }
interface DiscountSummary { TxnNo: string; table_name: string; Discount: number; reason: string; }
interface ReverseKOT      { kotNo: string; table_name: string; item_name: string; RevQty: number; amount: number; TxnDatetime: string; }
interface ReverseBill     { billNo: string; table_name: string; reversedAmount: number; TxnDatetime: string; }
interface NCKOTSummary    { ncName: string; purpose: string; quantity: number; amount: number; TxnDatetime: string; kotNo: string; }

interface ReportData {
  billDetails?:     BillDetail[];
  paymentSummary?:  PaymentSummary[];
  creditSummary?:   CreditSummary[];
  discountSummary?: DiscountSummary[];
  reverseKOTs?:     ReverseKOT[];
  reverseBills?:    ReverseBill[];
  ncKOTSummary?:    NCKOTSummary[];
}

// ─────────────────────────────────────────────
// STYLES — thermal paper design
// ─────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&display=swap');

  .der-page {
    background: #b8b0a4;
    background-image:
      radial-gradient(ellipse at 20% 20%, rgba(160,150,140,0.4) 0%, transparent 60%),
      radial-gradient(ellipse at 80% 80%, rgba(100,95,90,0.3) 0%, transparent 50%);
    min-height: 100vh;
    padding: 20px 14px 40px;
    font-family: 'Courier Prime', 'Courier New', Courier, monospace;
  }
  .der-toolbar {
    display: flex; justify-content: space-between; align-items: center;
    background: #2c2825; border-radius: 10px; padding: 10px 16px;
    margin-bottom: 22px; box-shadow: 0 2px 12px rgba(0,0,0,0.35);
  }
  .der-toolbar-left { display: flex; align-items: center; gap: 12px; }
  .der-toolbar-title {
    font-family: 'Courier Prime', monospace; font-size: 14px;
    font-weight: 700; color: #f0ebe0; letter-spacing: 1.5px; text-transform: uppercase;
  }
  .der-btn-back {
    background: transparent !important; border: 1px solid #7a6f62 !important;
    color: #d4cdc3 !important; font-size: 12px !important; border-radius: 6px !important;
    padding: 4px 10px !important; display: flex; align-items: center; gap: 5px; transition: all 0.18s;
  }
  .der-btn-back:hover { background: #3e3530 !important; border-color: #a89880 !important; color: #fff !important; }
  .der-btn-print {
    background: #e8520a !important; border: none !important; color: #fff !important;
    font-size: 12px !important; border-radius: 6px !important; padding: 6px 16px !important;
    display: flex; align-items: center; gap: 6px; font-family: 'Courier Prime', monospace;
    font-weight: 700; letter-spacing: 0.5px; box-shadow: 0 2px 8px rgba(232,82,10,0.4); transition: all 0.18s;
  }
  .der-btn-print:hover:not(:disabled) {
    background: #c94408 !important; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(232,82,10,0.5);
  }
  .der-btn-print:disabled { opacity: 0.6 !important; cursor: not-allowed; }

  .der-receipt-wrap {
    max-width: 340px; margin: 0 auto; position: relative;
    filter: drop-shadow(3px 6px 18px rgba(0,0,0,0.45));
  }
  .der-receipt-top {
    height: 14px;
    background: repeating-linear-gradient(90deg, #f0ebe0 0px, #f0ebe0 7px, #d8d2c5 7px, #d8d2c5 14px);
    border-radius: 5px 5px 0 0; position: relative;
  }
  .der-receipt-top::before {
    content: ''; position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%); width: 180px; height: 6px;
    background: repeating-linear-gradient(90deg, transparent 0px, transparent 8px, rgba(0,0,0,0.18) 8px, rgba(0,0,0,0.18) 12px);
    border-radius: 3px;
  }
  .der-receipt-body {
    background: #f5f0e4; padding: 14px 16px 22px; max-height: 78vh; overflow-y: auto;
    background-image: repeating-linear-gradient(0deg, transparent, transparent 22px, rgba(0,0,0,0.018) 22px, rgba(0,0,0,0.018) 23px);
    scrollbar-width: thin; scrollbar-color: #c8bfae #f0ebe0;
  }
  .der-receipt-body::-webkit-scrollbar { width: 5px; }
  .der-receipt-body::-webkit-scrollbar-track { background: #f0ebe0; }
  .der-receipt-body::-webkit-scrollbar-thumb { background: #c8bfae; border-radius: 3px; }
  .der-receipt-bottom {
    height: 14px; background: #f5f0e4;
    clip-path: polygon(
      0 0, 3% 100%, 6% 40%, 9% 100%, 12% 40%, 15% 100%,
      18% 40%, 21% 100%, 24% 40%, 27% 100%, 30% 40%, 33% 100%,
      36% 40%, 39% 100%, 42% 40%, 45% 100%, 48% 40%, 51% 100%,
      54% 40%, 57% 100%, 60% 40%, 63% 100%, 66% 40%, 69% 100%,
      72% 40%, 75% 100%, 78% 40%, 81% 100%, 84% 40%, 87% 100%,
      90% 40%, 93% 100%, 96% 40%, 100% 100%, 100% 0
    );
  }
  .der-empty { text-align: center; padding-top: 80px; color: #6b6055; }
  .der-empty h6 { font-family: 'Courier Prime', monospace; margin-top: 11px; letter-spacing: 1px; }

  /* ── Receipt content classes ── */
  .rc { font-family: 'Courier Prime','Courier New',Courier,monospace; font-size: 11px; color: #1a1612; line-height: 1.5; }
  .rc-hotel { font-size: 16px; font-weight: 700; text-align: center; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 4px; padding-bottom: 5px; border-bottom: 2px solid #1a1612; }
  .rc-meta  { text-align: center; font-size: 11px; color: #5a5048; margin-bottom: 2px; }
  .rc-section { font-size: 11px; font-weight: 700; text-align: center; text-transform: uppercase; letter-spacing: 1.2px; border-top: 2px solid #1a1612; border-bottom: 1px solid #1a1612; padding: 3px 0; margin: 8px 0 4px; }
  .rc-hr-dash { border: none; border-top: 1px dashed #8a7f72; margin: 3px 0; }
  .rc-hr-solid{ border: none; border-top: 1px solid #1a1612; margin: 3px 0; }
  .rc-row      { display: flex; justify-content: space-between; font-size: 13px; padding: 1.2px 0; }
  .rc-row-bold { display: flex; justify-content: space-between; font-size: 13px; font-weight: 700; padding: 2px 0; border-top: 1px solid #1a1612; border-bottom: 1px solid #1a1612; margin: 2px 0; }
  .rc-col-hdr  { display: grid; font-size: 11px; font-weight: 700; border-bottom: 1px solid #1a1612; padding-bottom: 2px; margin-bottom: 2px; }
  .rc-col-row  { display: grid; font-size: 11px; font-weight: 700; padding: 1.5px 0; border-bottom: 1px dashed #c8bfae; }
  .rc-total    { display: flex; justify-content: space-between; font-size: 12px; font-weight: 700; border-top: 1px solid #1a1612; padding-top: 2px; margin-top: 2px; }
  .rc-footer   { text-align: center; font-size: 11px; color: #7a6f62; margin-top: 6px; letter-spacing: 0.8px; }
`;

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const fmt = (n: number) => Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
const timeStr = (dt: string) => dt ? new Date(dt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '--:--';

const parseSettlementBreakdown = (breakdown: string | undefined): Record<string, number> => {
  const result: Record<string, number> = {};
  if (!breakdown) return result;
  breakdown.split(',').forEach(item => {
    const [type, amount] = item.split(':');
    if (type && amount) result[type.trim()] = Number(amount) || 0;
  });
  return result;
};

const isSplitPayment = (paymentMode: string): boolean => {
  const modes = (paymentMode || '').split(',').map(m => m.trim().toLowerCase());
  return modes.length > 1;
};

const groupBillsByPaymentMode = (billDetails: BillDetail[]) => {
  const groups: Record<string, { bills: BillDetail[]; totalAmount: number }> = {};
  (billDetails || []).forEach((bill) => {
    const breakdown = parseSettlementBreakdown(bill.settlement_breakdown);
    if (Object.keys(breakdown).length > 0) {
      Object.entries(breakdown).forEach(([mode, amount]) => {
        const modeKey = mode.toLowerCase();
        if (modeKey === 'cash') return;
        if (!groups[modeKey]) groups[modeKey] = { bills: [], totalAmount: 0 };
        groups[modeKey].bills.push({ ...bill, netAmount: amount });
        groups[modeKey].totalAmount += amount;
      });
    } else {
      const modeRaw = (bill.paymentMode || 'Cash').trim().toLowerCase();
      if (modeRaw === 'cash') return;
      if (!groups[modeRaw]) groups[modeRaw] = { bills: [], totalAmount: 0 };
      groups[modeRaw].bills.push(bill);
      groups[modeRaw].totalAmount += Number(bill.netAmount || 0);
    }
  });
  return groups;
};

// ─────────────────────────────────────────────
// SECTION COMPONENTS
// ─────────────────────────────────────────────
const SecHdr: React.FC<{ title: string }> = ({ title }) => <div className="rc-section">{title}</div>;
const DashHr = () => <hr className="rc-hr-dash" />;
const SolidHr = () => <hr className="rc-hr-solid" />;

// Bill Details — 8-column grid with consistent widths
// Columns: Bill(52) | Tbl(20) | Disc(32) | Gross(44) | GST(28) | Tip(28) | Net(44) | Mode(auto)
const BILL_COLS = '52px 20px 18px 44px 28px 28px 50px auto';

const BillDetailsSection: React.FC<{ data: BillDetail[] }> = ({ data }) => {
  if (!data?.length) return null;

  let tDisc = 0, tGross = 0, tGST = 0, tTip = 0, tNet = 0;

  const rows = data.map((b, i) => {
    const gst = Number(b.CGST || 0) + Number(b.SGST || 0);
    tDisc  += Number(b.Discount || 0);
    tGross += Number(b.grossAmount || 0);
    tGST   += gst;
    tTip   += Number(b.tipAmount || 0);
    tNet   += Number(b.netAmount || 0);

    return (
      <div key={i} className="rc-col-row" style={{ gridTemplateColumns: BILL_COLS, columnGap: '2px' }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {String(b.TxnNo).slice(-5)}
        </span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {(b.table_name || '').substring(0, 4)}
        </span>
        <span style={{ textAlign: 'right' }}>{fmt(b.Discount)}</span>
        <span style={{ textAlign: 'right' }}>{fmt(b.grossAmount)}</span>
        <span style={{ textAlign: 'right' }}>{gst.toFixed(0)}</span>
        <span style={{ textAlign: 'right' }}>{fmt(b.tipAmount)}</span>
        <span style={{ textAlign: 'right' }}>{fmt(b.netAmount)}</span>
        <span style={{ overflow: 'hidden', whiteSpace: 'nowrap', paddingLeft: '5px' }}>
          {(b.paymentMode || 'Cash').substring(0, 2)  .toUpperCase()}
        </span>
      </div>
    );
  });

  return (
    <>
      <SecHdr title="BILL DETAILS" />
      <div className="rc-col-hdr" style={{ gridTemplateColumns: BILL_COLS, columnGap: '2px' }}>
        <span>Bill</span>
        <span>Tbl</span>
        <span style={{ textAlign: 'right' }}>Disc</span>
        <span style={{ textAlign: 'right' }}>Gross</span>
        <span style={{ textAlign: 'right' }}>GST</span>
        <span style={{ textAlign: 'right' }}>Tip</span>
        <span style={{ textAlign: 'right' }}>Net</span>
        <span style={{ paddingLeft: '5px' }}>Mode</span>
      </div>
      {rows}
      <div className="rc-row-bold">
        <span>TOTAL</span>
        <span>{fmt(tDisc)} | {fmt(tGross)} | {tGST.toFixed(0)} | {fmt(tTip)} | {fmt(tNet)}</span>
      </div>
    </>
  );
};

const PaymentSummarySection: React.FC<{ data: PaymentSummary[] }> = ({ data }) => {
  const filtered = (data || []).filter(p => Number(p.totalAmount) > 0);
  if (!filtered.length) return null;
  const total = filtered.reduce((s, p) => s + Number(p.totalAmount || 0), 0);
  return (
    <>
      <SecHdr title="PAYMENT SUMMARY" />
      {filtered.map((p, i) => (
        <div key={i} className="rc-row" style={{ fontWeight: 700 }}>
          <span>{p.PaymentType}</span>
          <span>{fmt(p.totalAmount)}</span>
        </div>
      ))}
      <div className="rc-row-bold"><span>TOTAL</span><span>{fmt(total)}</span></div>
    </>
  );
};

// Columns: BillNo(52) | Table(52) | Amount(1fr)
const MODE_COLS = '52px 52px 1fr';

const PaymentModeDetailsSection: React.FC<{ billDetails: BillDetail[] }> = ({ billDetails }) => {
  const groups = groupBillsByPaymentMode(billDetails);
  if (Object.keys(groups).length === 0) return null;

  return (
    <>
      {Object.entries(groups).map(([mode, { bills, totalAmount }]) => (
        <div key={mode} style={{ marginBottom: '14px' }}>
          <div className="rc-section" style={{ textTransform: 'uppercase' }}>
            {mode.toUpperCase()} PAYMENTS
          </div>
          <div className="rc-col-hdr" style={{ gridTemplateColumns: MODE_COLS, columnGap: '5px' }}>
            <span>Bill No</span>
            <span>Table</span>
            <span style={{ textAlign: 'right' }}>Amount</span>
          </div>
          {bills.map((bill, idx) => (
            <div key={idx} className="rc-col-row" style={{ gridTemplateColumns: MODE_COLS, columnGap: '5px' }}>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {String(bill.TxnNo).slice(-6)}
              </span>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {(bill.table_name || '').substring(0, 6)}
              </span>
              <span style={{ textAlign: 'right' }}>₹{fmt(bill.netAmount)}</span>
            </div>
          ))}
          <div className="rc-total">
            <span>Total ({mode.toUpperCase()})</span>
            <span>₹{fmt(totalAmount)}</span>
          </div>
        </div>
      ))}
    </>
  );
};

// Columns: BillNo(52) | Table(52) | Modes(1fr) | Amount(64)
const SPLIT_COLS = '52px 52px 1fr 64px';

const SplitPaymentsSection: React.FC<{ billDetails: BillDetail[] }> = ({ billDetails }) => {
  const splitBills = (billDetails || []).filter(bill => {
    const breakdown = parseSettlementBreakdown(bill.settlement_breakdown);
    return Object.keys(breakdown).length > 1;
  });
  if (splitBills.length === 0) return null;
  const total = splitBills.reduce((sum, b) => sum + Number(b.netAmount || 0), 0);

  return (
    <>
      <div className="rc-section">SPLIT PAYMENTS</div>
      <div className="rc-col-hdr" style={{ gridTemplateColumns: SPLIT_COLS, columnGap: '5px' }}>
        <span>Bill No</span>
        <span>Table</span>
        <span>Modes</span>
        <span style={{ textAlign: 'right' }}>Amount</span>
      </div>
      {splitBills.map((bill, idx) => {
        const breakdown = parseSettlementBreakdown(bill.settlement_breakdown);
        const modesText = Object.keys(breakdown).join(', ');
        return (
          <div key={idx} className="rc-col-row" style={{ gridTemplateColumns: SPLIT_COLS, columnGap: '5px' }}>
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {String(bill.TxnNo).slice(-6)}
            </span>
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {(bill.table_name || '').substring(0, 6)}
            </span>
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {modesText}
            </span>
            <span style={{ textAlign: 'right' }}>₹{fmt(bill.netAmount)}</span>
          </div>
        );
      })}
      <div className="rc-total">
        <span>Total Split</span>
        <span>₹{fmt(total)}</span>
      </div>
    </>
  );
};

// Columns: Customer(1fr) | Bills(28) | Amount(58)
const CREDIT_COLS = '1fr 28px 58px';

const CreditSummarySection: React.FC<{ data: CreditSummary[] }> = ({ data }) => {
  if (!data?.length) return null;
  const total = data.reduce((s, c) => s + Number(c.creditAmount || 0), 0);
  return (
    <>
      <SecHdr title="CREDIT SUMMARY" />
      <div className="rc-col-hdr" style={{ gridTemplateColumns: CREDIT_COLS, columnGap: '4px' }}>
        <span>Customer</span>
        <span style={{ textAlign: 'right' }}>Bills</span>
        <span style={{ textAlign: 'right' }}>Amount</span>
      </div>
      {data.map((c, i) => (
        <div key={i} className="rc-col-row" style={{ gridTemplateColumns: CREDIT_COLS, columnGap: '4px' }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {(c.customerName || '').substring(0, 18)}
          </span>
          <span style={{ textAlign: 'right' }}>{c.billCount}</span>
          <span style={{ textAlign: 'right' }}>{fmt(c.creditAmount)}</span>
        </div>
      ))}
      <div className="rc-total"><span>TOTAL</span><span>{fmt(total)}</span></div>
    </>
  );
};

// Columns: Bill(48) | Table(48) | Reason(1fr) | Amount(54)
const DISC_COLS = '48px 48px 1fr 54px';

const DiscountSummarySection: React.FC<{ data: DiscountSummary[] }> = ({ data }) => {
  if (!data?.length) return null;
  const total = data.reduce((s, d) => s + Number(d.Discount || 0), 0);
  return (
    <>
      <SecHdr title="DISCOUNT SUMMARY" />
      <div className="rc-col-hdr" style={{ gridTemplateColumns: DISC_COLS, columnGap: '4px' }}>
        <span>Bill</span>
        <span>Table</span>
        <span>Reason</span>
        <span style={{ textAlign: 'right' }}>Amount</span>
      </div>
      {data.map((d, i) => (
        <div key={i} className="rc-col-row" style={{ gridTemplateColumns: DISC_COLS, columnGap: '4px' }}>
          <span>{String(d.TxnNo).slice(-5)}</span>
          <span>{(d.table_name || '').substring(0, 6)}</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {(d.reason || '').substring(0, 10)}
          </span>
          <span style={{ textAlign: 'right' }}>{fmt(d.Discount)}</span>
        </div>
      ))}
      <div className="rc-total"><span>TOTAL</span><span>{fmt(total)}</span></div>
    </>
  );
};

// Columns: KOT(32) | Table(32) | Item(1fr) | Qty(24) | Amt(44) | Time(38)
const RKOT_COLS = '32px 32px 1fr 24px 44px 38px';

const ReverseKOTSection: React.FC<{ data: ReverseKOT[] }> = ({ data }) => {
  if (!data?.length) return null;
  const totalQty = data.reduce((s, k) => s + Number(k.RevQty || 0), 0);
  const totalAmt = data.reduce((s, k) => s + Number(k.amount || 0), 0);

  return (
    <>
      <SecHdr title="REVERSE KOT SUMMARY" />
      <div className="rc-col-hdr" style={{ gridTemplateColumns: RKOT_COLS, columnGap: '3px' }}>
        <span>KOT</span>
        <span>Tbl</span>
        <span>Item</span>
        <span style={{ textAlign: 'right' }}>Qty</span>
        <span style={{ textAlign: 'right' }}>Amt</span>
        <span>Time</span>
      </div>
      {data.map((k, i) => (
        <div key={i} className="rc-col-row" style={{ gridTemplateColumns: RKOT_COLS, columnGap: '3px', alignItems: 'center' }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {String(k.kotNo).substring(0, 5)}
          </span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {(k.table_name || '').substring(0, 5)}
          </span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {k.item_name}
          </span>
          <span style={{ textAlign: 'right' }}>{k.RevQty}</span>
          <span style={{ textAlign: 'right' }}>{fmt(k.amount)}</span>
          <span style={{ fontSize: '9px', whiteSpace: 'nowrap' }}>
            {timeStr(k.TxnDatetime).toLowerCase().replace(' ', '')}
          </span>
        </div>
      ))}
      <div className="rc-total">
        <span>TOTAL</span>
        <span>{totalQty} | {fmt(totalAmt)}</span>
      </div>
    </>
  );
};

// Columns: Bill(56) | Table(56) | Amount(1fr) | Time(42)
const RBILL_COLS = '56px 56px 1fr 42px';

const ReverseBillSection: React.FC<{ data: ReverseBill[] }> = ({ data }) => {
  if (!data?.length) return null;
  const total = data.reduce((s, b) => s + Number(b.reversedAmount || 0), 0);
  return (
    <>
      <SecHdr title="REVERSE BILL SUMMARY" />
      <div className="rc-col-hdr" style={{ gridTemplateColumns: RBILL_COLS, columnGap: '4px' }}>
        <span>Bill</span>
        <span>Table</span>
        <span style={{ textAlign: 'right' }}>Amount</span>
        <span>Time</span>
      </div>
      {data.map((b, i) => (
        <div key={i} className="rc-col-row" style={{ gridTemplateColumns: RBILL_COLS, columnGap: '4px' }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {String(b.billNo).substring(0, 7)}
          </span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {(b.table_name || '').substring(0, 7)}
          </span>
          <span style={{ textAlign: 'right' }}>{fmt(b.reversedAmount)}</span>
          <span style={{ whiteSpace: 'nowrap' }}>{timeStr(b.TxnDatetime)}</span>
        </div>
      ))}
      <div className="rc-total"><span>TOTAL</span><span>{fmt(total)}</span></div>
    </>
  );
};

// Columns: Name(70) | Purpose(1fr) | Qty(28) | Amount(58)
const NCKOT_COLS = '70px 1fr 28px 58px';

const NCKOTSection: React.FC<{ data: NCKOTSummary[] }> = ({ data }) => {
  if (!data?.length) return null;
  const tQty = data.reduce((s, n) => s + Number(n.quantity || 0), 0);
  const tAmt = data.reduce((s, n) => s + Number(n.amount   || 0), 0);
  return (
    <>
      <SecHdr title="NC KOT SUMMARY" />
      <div className="rc-col-hdr" style={{ gridTemplateColumns: NCKOT_COLS, columnGap: '4px' }}>
        <span>Name</span>
        <span>Purpose</span>
        <span style={{ textAlign: 'right' }}>Qty</span>
        <span style={{ textAlign: 'right' }}>Amount</span>
      </div>
      {data.map((n, i) => (
        <div key={i} className="rc-col-row" style={{ gridTemplateColumns: NCKOT_COLS, columnGap: '4px' }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {(n.ncName || 'N/A').substring(0, 10)}
          </span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {(n.purpose || 'N/A').substring(0, 12)}
          </span>
          <span style={{ textAlign: 'right' }}>{n.quantity}</span>
          <span style={{ textAlign: 'right' }}>{fmt(n.amount)}</span>
        </div>
      ))}
      <div className="rc-total">
        <span>TOTAL</span>
        <span>Qty:{tQty} | {fmt(tAmt)}</span>
      </div>
    </>
  );
};

// ─────────────────────────────────────────────
// PRINT HTML BUILDER
// ─────────────────────────────────────────────
function buildPrintHTML(data: ReportData, hotelName: string, businessDate: string): string {
  const f = (n: number) => Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  const t = (dt: string) => dt ? new Date(dt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '--:--';

  let b = '';

  // Header
  b += `<div style="text-align:center;font-weight:700;font-size:15px;border-bottom:1px solid #000;padding-bottom:3px;margin-bottom:5px;">${hotelName}</div>`;
  b += `<div style="text-align:center;font-size:12px;margin-bottom:8px;">Date: ${businessDate}</div>`;

  // Bill Details Section
  if (data.billDetails?.length) {
    b += `<div style="font-weight:700;text-align:center;border-top:1px solid #000;border-bottom:1px solid #000;padding:2px 0;margin:5px 0;">BILL DETAILS</div>`;
      b += `<div style="font-size:10px;font-weight:700;display:flex;justify-content:space-between;border-bottom:1px dashed #000;padding:2px 0;">
            <span style="width:20%">Bill</span>
            <span style="width:12%">Tbl</span>
            <span style="width:10%;text-align:right">Disc</span>
            <span style="width:18%;text-align:right">Gross</span>
            <span style="width:10%;text-align:right">GST</span>
            <span style="width:10%;text-align:right">Tip</span>
            <span style="width:15%;text-align:right">Net</span>
            <span style="width:10%;padding-left:10px">Mode</span>
          </div>`;
    let tDisc = 0, tGross = 0, tGST = 0, tTip = 0, tNet = 0;
    data.billDetails.forEach(row => {
      const gst = Number(row.CGST || 0) + Number(row.SGST || 0);
      tDisc += Number(row.Discount || 0);
      tGross += Number(row.grossAmount || 0);
      tGST += gst;
      tTip += Number(row.tipAmount || 0); 
      tNet += Number(row.netAmount || 0);
      b += `<div style="font-size:10px;font-weight:700;display:flex;justify-content:space-between;padding:1.5px 0;border-bottom:1px dashed #ccc;">
              <span style="width:20%;overflow:hidden;white-space:nowrap">${String(row.TxnNo).slice(-6)}</span>
              <span style="width:12%;overflow:hidden;white-space:nowrap">${(row.table_name || '').substring(0, 4)}</span>
              <span style="width:10%;text-align:right">${f(row.Discount)}</span>
              <span style="width:18%;text-align:right">${f(row.grossAmount)}</span>
              <span style="width:10%;text-align:right">${gst.toFixed(0)}</span>
              <span style="width:10%;text-align:right">${f(row.tipAmount)}</span>
              <span style="width:15%;text-align:right">${f(row.netAmount)}</span>
              <span style="width:10%;overflow:hidden;white-space:nowrap;padding-left:10px">${(row.paymentMode || 'Cash').substring(0, 2).toUpperCase() }</span>
            </div>`;
    });
    b += `<div style="border-top:1px solid #000;margin:3px 0;"></div>`;
    b += `<div style="font-weight:700;font-size:10px;display:flex;justify-content:space-between;padding:2px 0;">
            <span>TOTAL</span>
            <span>${f(tDisc)} | ${f(tGross)} | ${tGST.toFixed(0)} | ${f(tTip)} | ${f(tNet)}</span>
          </div>`;
  }

  // Payment Summary Section
  if (data.paymentSummary?.length) {
    const filtered = data.paymentSummary.filter(p => Number(p.totalAmount) > 0);
    if (filtered.length) {
      b += `<div style="font-weight:700;text-align:center;border-top:1px solid #000;border-bottom:1px solid #000;padding:2px 0;margin:8px 0 4px;">PAYMENT SUMMARY</div>`;
      let total = 0;
      filtered.forEach(p => {
        b += `<div style="font-size:10px;font-weight:700;display:flex;justify-content:space-between;padding:1.5px 0;">
                <span>${p.PaymentType}</span>
                <span style="text-align:right">${f(p.totalAmount)}</span>
              </div>`;
        total += Number(p.totalAmount || 0);
      });
      b += `<div style="border-top:1px solid #000;margin:2px 0;"></div>`;
      b += `<div style="font-weight:700;font-size:10px;display:flex;justify-content:space-between;"><span>TOTAL</span><span>${f(total)}</span></div>`;
    }
  }

    // Detailed payment mode wise list (using the same logic as screen preview)
  if (data.billDetails?.length) {
    // Helper to parse settlement_breakdown (same as screen)
    const parseBreakdown = (breakdown: string | undefined): Record<string, number> => {
      const result: Record<string, number> = {};
      if (!breakdown) return result;
      breakdown.split(',').forEach(item => {
        const [type, amount] = item.split(':');
        if (type && amount) result[type.trim()] = Number(amount) || 0;
      });
      return result;
    };

    // Group exactly like groupBillsByPaymentMode (includes split portions)
    const groups: Record<string, { bills: Array<{ bill: BillDetail; amount: number }>; totalAmount: number }> = {};

    data.billDetails.forEach(bill => {
      const breakdown = parseBreakdown(bill.settlement_breakdown);
      if (Object.keys(breakdown).length > 0) {
        // Split bill – add each non‑cash portion
        Object.entries(breakdown).forEach(([mode, amount]) => {
          const modeKey = mode.toLowerCase();
          if (modeKey === 'cash') return;
          if (!groups[modeKey]) groups[modeKey] = { bills: [], totalAmount: 0 };
          groups[modeKey].bills.push({ bill, amount });
          groups[modeKey].totalAmount += amount;
        });
      } else {
        // Single‑mode bill
        const modeRaw = (bill.paymentMode || 'Cash').trim().toLowerCase();
        if (modeRaw === 'cash') return;
        if (!groups[modeRaw]) groups[modeRaw] = { bills: [], totalAmount: 0 };
        groups[modeRaw].bills.push({ bill, amount: bill.netAmount });
        groups[modeRaw].totalAmount += bill.netAmount;
      }
    });

    // Render each mode section (same style as screen)
    for (const [mode, { bills, totalAmount }] of Object.entries(groups)) {
      b += `<div style="font-weight:700;text-align:center;border-top:1px solid #000;border-bottom:1px solid #000;padding:2px 0;margin:8px 0 4px;">${mode.toUpperCase()} PAYMENTS</div>`;
      b += `<div style="font-size:10px;font-weight:700;display:flex;justify-content:space-between;border-bottom:1px dashed #000;padding:2px 0;">
              <span style="width:35%">Bill No</span>
              <span style="width:30%">Table</span>
              <span style="width:35%;text-align:right">Amount</span>
            </div>`;
      for (const { bill, amount } of bills) {
        b += `<div style="font-size:10px;font-weight:700;display:flex;justify-content:space-between;padding:1.5px 0;border-bottom:1px dashed #ccc;">
                <span style="width:35%;overflow:hidden;white-space:nowrap">${String(bill.TxnNo).slice(-6)}</span>
                <span style="width:30%;overflow:hidden;white-space:nowrap">${(bill.table_name || '').substring(0, 6)}</span>
                <span style="width:35%;text-align:right">₹${f(amount)}</span>
              </div>`;
      }
      b += `<div style="border-top:1px solid #000;margin:3px 0;"></div>`;
      b += `<div style="font-weight:700;font-size:10px;display:flex;justify-content:space-between;"><span>Total (${mode.toUpperCase()})</span><span>₹${f(totalAmount)}</span></div>`;
    }
  }
  // Split Payments Section
  if (data.billDetails?.length) {
    const splitBills = data.billDetails.filter(bill => {
      const mode = (bill.paymentMode || '').trim().toLowerCase();
      return isSplitPayment(mode);
    });
    if (splitBills.length > 0) {
      b += `<div style="font-weight:700;text-align:center;border-top:1px solid #000;border-bottom:1px solid #000;padding:2px 0;margin:8px 0 4px;">SPLIT PAYMENTS</div>`;
      b += `<div style="font-size:10px;font-weight:700;display:flex;justify-content:space-between;border-bottom:1px dashed #000;padding:2px 0;">
              <span style="width:25%">Bill No</span>
              <span style="width:25%">Table</span>
              <span style="width:30%">Modes</span>
              <span style="width:20%;text-align:right">Amount</span>
            </div>`;
      let total = 0;
      splitBills.forEach(bill => {
        const amt = Number(bill.netAmount || 0);
        total += amt;
        b += `<div style="font-size:10px;font-weight:700;display:flex;justify-content:space-between;padding:1.5px 0;border-bottom:1px dashed #ccc;">
                <span style="width:25%;overflow:hidden;white-space:nowrap">${String(bill.TxnNo).slice(-6)}</span>
                <span style="width:25%;overflow:hidden;white-space:nowrap">${(bill.table_name || '').substring(0, 6)}</span>
                <span style="width:30%;overflow:hidden;white-space:nowrap">${bill.paymentMode}</span>
                <span style="width:20%;text-align:right">₹${f(amt)}</span>
              </div>`;
      });
      b += `<div style="border-top:1px solid #000;margin:3px 0;"></div>`;
      b += `<div style="font-weight:700;font-size:10px;display:flex;justify-content:space-between;"><span>Total Split</span><span>₹${f(total)}</span></div>`;
    }
  }

  // Credit Summary Section
  if (data.creditSummary?.length) {
    b += `<div style="font-weight:700;text-align:center;border-top:1px solid #000;border-bottom:1px solid #000;padding:2px 0;margin:8px 0 4px;">CREDIT SUMMARY</div>`;
    b += `<div style="font-size:10px;font-weight:700;display:flex;justify-content:space-between;border-bottom:1px dashed #000;padding:2px 0;">
            <span style="width:55%">Customer</span>
            <span style="width:15%;text-align:right">Bills</span>
            <span style="width:30%;text-align:right">Amount</span>
          </div>`;
    let total = 0;
    data.creditSummary.forEach(c => {
      b += `<div style="font-size:10px;font-weight:700;display:flex;justify-content:space-between;padding:1.5px 0;border-bottom:1px dashed #ccc;">
              <span style="width:55%;overflow:hidden;white-space:nowrap">${(c.customerName || '').substring(0, 18)}</span>
              <span style="width:15%;text-align:right">${c.billCount}</span>
              <span style="width:30%;text-align:right">${f(c.creditAmount)}</span>
            </div>`;
      total += Number(c.creditAmount || 0);
    });
    b += `<div style="border-top:1px solid #000;margin:2px 0;"></div>`;
    b += `<div style="font-weight:700;font-size:10px;display:flex;justify-content:space-between;"><span>TOTAL</span><span>${f(total)}</span></div>`;
  }

  // Discount Summary Section
  if (data.discountSummary?.length) {
    b += `<div style="font-weight:700;text-align:center;border-top:1px solid #000;border-bottom:1px solid #000;padding:2px 0;margin:8px 0 4px;">DISCOUNT SUMMARY</div>`;
    b += `<div style="font-size:10px;font-weight:700;display:flex;justify-content:space-between;border-bottom:1px dashed #000;padding:2px 0;">
            <span style="width:22%">Bill</span>
            <span style="width:22%">Table</span>
            <span style="width:34%">Reason</span>
            <span style="width:22%;text-align:right">Amount</span>
          </div>`;
    let total = 0;
    data.discountSummary.forEach(d => {
      b += `<div style="font-size:10px;font-weight:700;display:flex;justify-content:space-between;padding:1.5px 0;border-bottom:1px dashed #ccc;">
              <span style="width:22%;overflow:hidden;white-space:nowrap">${String(d.TxnNo).slice(-5)}</span>
              <span style="width:22%;overflow:hidden;white-space:nowrap">${(d.table_name || '').substring(0, 6)}</span>
              <span style="width:34%;overflow:hidden;white-space:nowrap">${(d.reason || '').substring(0, 10)}</span>
              <span style="width:22%;text-align:right">${f(d.Discount)}</span>
            </div>`;
      total += Number(d.Discount || 0);
    });
    b += `<div style="border-top:1px solid #000;margin:2px 0;"></div>`;
    b += `<div style="font-weight:700;font-size:10px;display:flex;justify-content:space-between;"><span>TOTAL</span><span>${f(total)}</span></div>`;
  }

  // Reverse KOT Section
  if (data.reverseKOTs?.length) {
    b += `<div style="font-weight:700;text-align:center;border-top:1px solid #000;border-bottom:1px solid #000;padding:2px 0;margin:8px 0 4px;">REVERSE KOT SUMMARY</div>`;
    b += `<div style="font-size:10px;font-weight:700;display:flex;justify-content:space-between;border-bottom:1px dashed #000;padding:2px 0;">
            <span style="width:12%">KOT</span>
            <span style="width:12%">Tbl</span>
            <span style="width:44%">Item</span>
            <span style="width:10%;text-align:right">Qty</span>
            <span style="width:12%;text-align:right">Amt</span>
            <span style="width:10%">Time</span>
          </div>`;
    let tQty = 0, tAmt = 0;
    data.reverseKOTs.forEach(k => {
      tQty += Number(k.RevQty || 0);
      tAmt += Number(k.amount || 0);
      b += `<div style="font-size:10px;font-weight:700;display:flex;justify-content:space-between;padding:1.5px 0;border-bottom:1px dashed #ccc;">
              <span style="width:12%;overflow:hidden;white-space:nowrap">${String(k.kotNo).substring(0, 5)}</span>
              <span style="width:12%;overflow:hidden;white-space:nowrap">${(k.table_name || '').substring(0, 5)}</span>
              <span style="width:44%;overflow:hidden;white-space:nowrap">${(k.item_name || '').substring(0, 20)}</span>
              <span style="width:10%;text-align:right">${k.RevQty}</span>
              <span style="width:12%;text-align:right">${f(k.amount)}</span>
              <span style="width:10%;font-size:9px;white-space:nowrap">${t(k.TxnDatetime)}</span>
            </div>`;
    });
    b += `<div style="border-top:1px solid #000;margin:2px 0;"></div>`;
    b += `<div style="font-weight:700;font-size:10px;display:flex;justify-content:space-between;"><span>TOTAL</span><span>${tQty} | ${f(tAmt)}</span></div>`;
  }

  // Reverse Bill Section
  if (data.reverseBills?.length) {
    b += `<div style="font-weight:700;text-align:center;border-top:1px solid #000;border-bottom:1px solid #000;padding:2px 0;margin:8px 0 4px;">REVERSE BILL SUMMARY</div>`;
    b += `<div style="font-size:10px;font-weight:700;display:flex;justify-content:space-between;border-bottom:1px dashed #000;padding:2px 0;">
            <span style="width:28%">BillNo</span>
            <span style="width:28%">Table</span>
            <span style="width:25%;text-align:right">Amount</span>
            <span style="width:19%">Time</span>
          </div>`;
    let total = 0;
    data.reverseBills.forEach(bill => {
      b += `<div style="font-size:10px;font-weight:700;display:flex;justify-content:space-between;padding:1.5px 0;border-bottom:1px dashed #ccc;">
              <span style="width:28%;overflow:hidden;white-space:nowrap">${String(bill.billNo).substring(0, 7)}</span>
              <span style="width:28%;overflow:hidden;white-space:nowrap">${(bill.table_name || '').substring(0, 7)}</span>
              <span style="width:25%;text-align:right">${f(bill.reversedAmount)}</span>
              <span style="width:19%;white-space:nowrap">${t(bill.TxnDatetime)}</span>
            </div>`;
      total += Number(bill.reversedAmount || 0);
    });
    b += `<div style="border-top:1px solid #000;margin:2px 0;"></div>`;
    b += `<div style="font-weight:700;font-size:10px;display:flex;justify-content:space-between;"><span>TOTAL</span><span>${f(total)}</span></div>`;
  }

  // NC KOT Section
  if (data.ncKOTSummary?.length) {
    b += `<div style="font-weight:700;text-align:center;border-top:1px solid #000;border-bottom:1px solid #000;padding:2px 0;margin:8px 0 4px;">NC KOT SUMMARY</div>`;
    b += `<div style="font-size:10px;font-weight:700;display:flex;justify-content:space-between;border-bottom:1px dashed #000;padding:2px 0;">
            <span style="width:30%">Name</span>
            <span style="width:35%">Purpose</span>
            <span style="width:10%;text-align:right">Qty</span>
            <span style="width:25%;text-align:right">Amount</span>
          </div>`;
    let tQty = 0, tAmt = 0;
    data.ncKOTSummary.forEach(n => {
      b += `<div style="font-size:10px;font-weight:700;display:flex;justify-content:space-between;padding:1.5px 0;border-bottom:1px dashed #ccc;">
              <span style="width:30%;overflow:hidden;white-space:nowrap">${(n.ncName || 'N/A').substring(0, 10)}</span>
              <span style="width:35%;overflow:hidden;white-space:nowrap">${(n.purpose || 'N/A').substring(0, 12)}</span>
              <span style="width:10%;text-align:right">${n.quantity}</span>
              <span style="width:25%;text-align:right">${f(n.amount)}</span>
            </div>`;
      tQty += Number(n.quantity || 0);
      tAmt += Number(n.amount || 0);
    });
    b += `<div style="border-top:1px solid #000;margin:2px 0;"></div>`;
    b += `<div style="font-weight:700;font-size:10px;display:flex;justify-content:space-between;"><span>TOTAL</span><span>Qty:${tQty} | ${f(tAmt)}</span></div>`;
  }

  // Footer
  b += `<div style="border-top:1px solid #000;margin:8px 0 3px;"></div>`;
  b += `<div style="text-align:center;font-size:9px;margin-top:5px;">*** END OF REPORT ***</div>`;
  b += `<div style="text-align:center;font-size:8px;margin-top:2px;">${new Date().toLocaleString('en-IN')}</div>`;

  return `<html>
<head>
  <style>
    @page { size: 80mm auto; margin: 0; }
    html, body { margin: 0; padding: 0; width: 80mm; background: #ffffff; }
    body {
      font-family: monospace; font-size: 12.5px; line-height: 1.2;
      width: 76mm; margin: 0 auto; padding: 2mm 2mm 4mm 2mm;
      color: #000000; -webkit-print-color-adjust: exact; print-color-adjust: exact;
      overflow: visible !important;
    }
    * { box-sizing: border-box; }
    div, table, tr, td { page-break-inside: avoid !important; break-inside: avoid !important; }
  </style>
</head>
<body>${b}</body>
</html>`;
}

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
const DayEndReportPreview: React.FC = () => {
  const navigate = useNavigate();
  const { removeSession, user } = useAuthContext();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [businessDate, setBusinessDate] = useState('');
  const [printerName, setPrinterName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const raw  = sessionStorage.getItem("dayEndReportData");
    const date = sessionStorage.getItem("dayEndReportDate") || '';
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setReportData(parsed);
        setBusinessDate(date);
      } catch (error) {
        console.error("Failed to parse report data:", error);
        toast.error("Failed to parse report data");
        navigate("/apps/DayEnd");
      }
    } else {
      toast.error("No report data found. Please generate report again.");
      navigate("/apps/DayEnd");
    }
  }, [navigate]);

  useEffect(() => {
    const fetchPrinter = async () => {
      const outletIdToUse = user?.outletid || user?.hotelid;
      if (!outletIdToUse) return;
      try {
        const printerData = await SettingsService.getReportPrinterById(Number(outletIdToUse));
        setPrinterName(printerData[0]?.printer_name || null);
      } catch (error) {
        console.error("Failed to load printer settings:", error);
        toast.error("Failed to load printer settings.");
      }
    };
    fetchPrinter();
  }, [user]);

  const hotelName = user?.hotel_name || 'Report';
  const hasData   = reportData && Object.values(reportData).some(v => Array.isArray(v) && v.length > 0);

  const handlePrint = async () => {
    if (!reportData) { toast.error("No report data available"); return; }
    try {
      setLoading(true);
      const printersRaw = (await (window as any).electronAPI?.getInstalledPrinters?.()) || [];
      const printers = Array.isArray(printersRaw) ? printersRaw : [];
      if (!printers.length) { toast.error("No printers found"); return; }

      const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, "");
      let finalPrinter: string | null = null;

      if (printerName) {
        const match = printers.find((p: any) =>
          normalize(p.name).includes(normalize(printerName)) ||
          normalize(p.displayName || "").includes(normalize(printerName))
        );
        if (match) finalPrinter = match.name;
      }

      if (!finalPrinter) {
        const fallback = printers.find((p: any) => p.isDefault) || printers[0];
        finalPrinter = fallback?.name;
      }

      if (!finalPrinter) { toast.error("No printer available"); return; }

      const printHTML = buildPrintHTML(reportData, hotelName, businessDate);

      if ((window as any).electronAPI?.directPrint) {
        await (window as any).electronAPI.directPrint(printHTML, finalPrinter);
        toast.success("Printed successfully!");
        setTimeout(() => {
          removeSession();
          navigate("/auth/minimal/login", { replace: true });
        }, 2000);
      } else {
        toast.error("Print API not available");
      }
    } catch (error) {
      console.error("Print failed:", error);
      toast.error("Print failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="der-page">
        {hasData ? (
          <>
            <div className="der-toolbar">
              <div className="der-toolbar-left">
                <Button className="der-btn-back" size="sm" onClick={() => navigate("/apps/DayEnd")}>
                  <ArrowLeft size={13} /> Back
                </Button>
                <span className="der-toolbar-title">Day End Report</span>
              </div>
              <Button className="der-btn-print" size="sm" onClick={handlePrint} disabled={loading}>
                <Printer size={13} />
                {loading ? "Printing…" : "Print"}
              </Button>
            </div>

            <div className="der-receipt-wrap">
              <div className="der-receipt-top" />
              <div className="der-receipt-body">
                <div className="rc">
                  <div className="rc-hotel">{hotelName}</div>
                  {businessDate && <div className="rc-meta">Date: {businessDate}</div>}
                  <DashHr />

                  <BillDetailsSection    data={reportData?.billDetails    || []} />
                  <PaymentSummarySection data={reportData?.paymentSummary || []} />
                  <PaymentModeDetailsSection billDetails={reportData?.billDetails || []} />
                  <SplitPaymentsSection      billDetails={reportData?.billDetails || []} />
                  <CreditSummarySection  data={reportData?.creditSummary  || []} />
                  <DiscountSummarySection data={reportData?.discountSummary || []} />
                  <ReverseKOTSection     data={reportData?.reverseKOTs    || []} />
                  <ReverseBillSection    data={reportData?.reverseBills   || []} />
                  <NCKOTSection          data={reportData?.ncKOTSummary   || []} />

                  <SolidHr />
                  <div className="rc-footer">*** END OF REPORT ***</div>
                  <div className="rc-footer">{new Date().toLocaleString('en-IN')}</div>
                </div>
              </div>
              <div className="der-receipt-bottom" />
            </div>
          </>
        ) : (
          <div className="der-empty">
            <Printer size={48} strokeWidth={1.2} />
            <h6>No Report Data Found</h6>
            <p style={{ fontSize: '10px', marginTop: '10px', color: '#999' }}>
              Please go back and generate the report again.
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default DayEndReportPreview;