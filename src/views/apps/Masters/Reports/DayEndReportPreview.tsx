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
  TxnNo: string; table_name: string;
  grossAmount: number; CGST: number; SGST: number;
  netAmount: number; paymentMode: string; TxnDatetime: string;
}
interface PaymentSummary { PaymentType: string; totalAmount: number; billCount: number; }
interface CreditSummary  { customerName: string; creditAmount: number; billCount: number; }
interface DiscountSummary{ TxnNo: string; table_name: string; Discount: number; reason: string; }
interface ReverseKOT     { kotNo: string; table_name: string; item_name: string; quantity: number; TxnDatetime: string; }
interface ReverseBill    { billNo: string; table_name: string; reversedAmount: number; TxnDatetime: string; }
interface NCKOTSummary   { ncName: string; purpose: string; quantity: number; amount: number; TxnDatetime: string; kotNo: string; }

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
  .der-empty h6 { font-family: 'Courier Prime', monospace; margin-top: 12px; letter-spacing: 1px; }

  /* ── Receipt content classes ── */
  .rc { font-family: 'Courier Prime','Courier New',Courier,monospace; font-size: 10.5px; color: #1a1612; line-height: 1.5; }
  .rc-hotel { font-size: 15px; font-weight: 700; text-align: center; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 4px; padding-bottom: 5px; border-bottom: 2px solid #1a1612; }
  .rc-meta  { text-align: center; font-size: 10px; color: #5a5048; margin-bottom: 2px; }
  .rc-section { font-size: 10.5px; font-weight: 700; text-align: center; text-transform: uppercase; letter-spacing: 1.2px; border-top: 2px solid #1a1612; border-bottom: 1px solid #1a1612; padding: 3px 0; margin: 8px 0 4px; }
  .rc-hr-dash { border: none; border-top: 1px dashed #8a7f72; margin: 3px 0; }
  .rc-hr-solid{ border: none; border-top: 1px solid #1a1612; margin: 3px 0; }
  .rc-row      { display: flex; justify-content: space-between; font-size: 10px; padding: 1.2px 0; }
  .rc-row-bold { display: flex; justify-content: space-between; font-size: 10.5px; font-weight: 700; padding: 2px 0; border-top: 1px solid #1a1612; border-bottom: 1px solid #1a1612; margin: 2px 0; }
  .rc-col-hdr  { display: grid; font-size: 9.5px; font-weight: 700; border-bottom: 1px solid #1a1612; padding-bottom: 2px; margin-bottom: 2px; }
  .rc-col-row  { display: grid; font-size: 9.5px; padding: 1.2px 0; border-bottom: 1px dashed #c8bfae; }
  .rc-total    { display: flex; justify-content: space-between; font-size: 10.5px; font-weight: 700; border-top: 1px solid #1a1612; padding-top: 2px; margin-top: 2px; }
  .rc-footer   { text-align: center; font-size: 9.5px; color: #7a6f62; margin-top: 6px; letter-spacing: 0.8px; }
`;

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const fmt = (n: number) => Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
const timeStr = (dt: string) => dt ? new Date(dt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '--:--';

// ─────────────────────────────────────────────
// SECTION COMPONENTS
// ─────────────────────────────────────────────
const SecHdr: React.FC<{ title: string }> = ({ title }) => <div className="rc-section">{title}</div>;
const DashHr = () => <hr className="rc-hr-dash" />;
const SolidHr= () => <hr className="rc-hr-solid" />;

const BillDetailsSection: React.FC<{ data: BillDetail[] }> = ({ data }) => {
  console.log("📊 BillDetailsSection rendering with:", data?.length || 0, "records");
  if (!data?.length) return null;
  let tGross = 0, tGST = 0, tNet = 0;
  const rows = data.map((b, i) => {
    const gst = Number(b.CGST || 0) + Number(b.SGST || 0);
    tGross += Number(b.grossAmount || 0);
    tGST   += gst;
    tNet   += Number(b.netAmount || 0);
    return (
      <div key={i} className="rc-col-row" style={{ gridTemplateColumns: '50px 34px 52px 34px 50px auto' }}>
        <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{String(b.TxnNo).slice(-6)}</span>
        <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{(b.table_name||'').substring(0,5)}</span>
        <span style={{ textAlign:'right' }}>{fmt(b.grossAmount)}</span>
        <span style={{ textAlign:'right' }}>{gst.toFixed(0)}</span>
        <span style={{ textAlign:'right' }}>{fmt(b.netAmount)}</span>
        <span style={{ overflow:'hidden', whiteSpace:'nowrap' }}>{(b.paymentMode||'Cash').substring(0,5)}</span>
      </div>
    );
  });
  return (
    <>
      <SecHdr title="BILL DETAILS" />
      <div className="rc-col-hdr" style={{ gridTemplateColumns: '50px 34px 52px 34px 50px auto' }}>
        <span>Bill</span><span>Tbl</span>
        <span style={{ textAlign:'right' }}>Gross</span>
        <span style={{ textAlign:'right' }}>GST</span>
        <span style={{ textAlign:'right' }}>Net</span>
        <span>Mode</span>
      </div>
      {rows}
      <div className="rc-row-bold">
        <span>TOTAL</span>
        <span>{fmt(tGross)} | {tGST.toFixed(0)} | {fmt(tNet)}</span>
      </div>
    </>
  );
};

const PaymentSummarySection: React.FC<{ data: PaymentSummary[] }> = ({ data }) => {
  console.log("💰 PaymentSummarySection rendering with:", data?.length || 0, "records");
  const filtered = (data || []).filter(p => Number(p.totalAmount) > 0);
  if (!filtered.length) return null;
  const total = filtered.reduce((s, p) => s + Number(p.totalAmount || 0), 0);
  return (
    <>
      <SecHdr title="PAYMENT SUMMARY" />
      {filtered.map((p, i) => (
        <div key={i} className="rc-row">
          <span>{p.PaymentType}</span>
          <span>{fmt(p.totalAmount)}</span>
        </div>
      ))}
      <div className="rc-row-bold"><span>TOTAL</span><span>{fmt(total)}</span></div>
    </>
  );
};

const CreditSummarySection: React.FC<{ data: CreditSummary[] }> = ({ data }) => {
  console.log("💳 CreditSummarySection rendering with:", data?.length || 0, "records");
  if (!data?.length) return null;
  const total = data.reduce((s, c) => s + Number(c.creditAmount || 0), 0);
  return (
    <>
      <SecHdr title="CREDIT SUMMARY" />
      <div className="rc-col-hdr" style={{ gridTemplateColumns: '1fr 28px 58px' }}>
        <span>Customer</span>
        <span style={{ textAlign:'right' }}>Bills</span>
        <span style={{ textAlign:'right' }}>Amount</span>
      </div>
      {data.map((c, i) => (
        <div key={i} className="rc-col-row" style={{ gridTemplateColumns: '1fr 28px 58px' }}>
          <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{(c.customerName||'').substring(0,18)}</span>
          <span style={{ textAlign:'right' }}>{c.billCount}</span>
          <span style={{ textAlign:'right' }}>{fmt(c.creditAmount)}</span>
        </div>
      ))}
      <div className="rc-total"><span>TOTAL</span><span>{fmt(total)}</span></div>
    </>
  );
};

const DiscountSummarySection: React.FC<{ data: DiscountSummary[] }> = ({ data }) => {
  console.log("🏷️ DiscountSummarySection rendering with:", data?.length || 0, "records");
  if (!data?.length) return null;
  const total = data.reduce((s, d) => s + Number(d.Discount || 0), 0);
  return (
    <>
      <SecHdr title="DISCOUNT SUMMARY" />
      <div className="rc-col-hdr" style={{ gridTemplateColumns: '48px 48px 1fr 54px' }}>
        <span>Bill</span><span>Table</span><span>Reason</span>
        <span style={{ textAlign:'right' }}>Amount</span>
      </div>
      {data.map((d, i) => (
        <div key={i} className="rc-col-row" style={{ gridTemplateColumns: '48px 48px 1fr 54px' }}>
          <span>{String(d.TxnNo).slice(-5)}</span>
          <span>{(d.table_name||'').substring(0,6)}</span>
          <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{(d.reason||'').substring(0,10)}</span>
          <span style={{ textAlign:'right' }}>{fmt(d.Discount)}</span>
        </div>
      ))}
      <div className="rc-total"><span>TOTAL</span><span>{fmt(total)}</span></div>
    </>
  );
};

const ReverseKOTSection: React.FC<{ data: ReverseKOT[] }> = ({ data }) => {
  console.log("🔄 ReverseKOTSection rendering with:", data?.length || 0, "records");
  if (!data?.length) return null;
  return (
    <>
      <SecHdr title="REVERSE KOT SUMMARY" />
      <div className="rc-col-hdr" style={{ gridTemplateColumns: '38px 36px 1fr 22px 38px' }}>
        <span>KOT</span><span>Tbl</span><span>Item</span>
        <span style={{ textAlign:'right' }}>Qty</span><span>Time</span>
      </div>
      {data.map((k, i) => (
        <div key={i} className="rc-col-row" style={{ gridTemplateColumns: '38px 36px 1fr 22px 38px' }}>
          <span>{String(k.kotNo).substring(0,5)}</span>
          <span>{(k.table_name||'').substring(0,5)}</span>
          <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{(k.item_name||'').substring(0,14)}</span>
          <span style={{ textAlign:'right' }}>{k.quantity}</span>
          <span>{timeStr(k.TxnDatetime)}</span>
        </div>
      ))}
    </>
  );
};

const ReverseBillSection: React.FC<{ data: ReverseBill[] }> = ({ data }) => {
  console.log("📄 ReverseBillSection rendering with:", data?.length || 0, "records");
  if (!data?.length) return null;
  const total = data.reduce((s, b) => s + Number(b.reversedAmount || 0), 0);
  return (
    <>
      <SecHdr title="REVERSE BILL SUMMARY" />
      <div className="rc-col-hdr" style={{ gridTemplateColumns: '54px 54px 1fr 38px' }}>
        <span>Bill</span><span>Table</span>
        <span style={{ textAlign:'right' }}>Amount</span><span>Time</span>
      </div>
      {data.map((b, i) => (
        <div key={i} className="rc-col-row" style={{ gridTemplateColumns: '54px 54px 1fr 38px' }}>
          <span>{String(b.billNo).substring(0,7)}</span>
          <span>{(b.table_name||'').substring(0,7)}</span>
          <span style={{ textAlign:'right' }}>{fmt(b.reversedAmount)}</span>
          <span>{timeStr(b.TxnDatetime)}</span>
        </div>
      ))}
      <div className="rc-total"><span>TOTAL</span><span>{fmt(total)}</span></div>
    </>
  );
};

const NCKOTSection: React.FC<{ data: NCKOTSummary[] }> = ({ data }) => {
  console.log("📝 NCKOTSection rendering with:", data?.length || 0, "records");
  if (!data?.length) return null;
  const tQty = data.reduce((s, n) => s + Number(n.quantity || 0), 0);
  const tAmt = data.reduce((s, n) => s + Number(n.amount   || 0), 0);
  return (
    <>
      <SecHdr title="NC KOT SUMMARY" />
      <div className="rc-col-hdr" style={{ gridTemplateColumns: '68px 1fr 28px 58px' }}>
        <span>Name</span><span>Purpose</span>
        <span style={{ textAlign:'right' }}>Qty</span>
        <span style={{ textAlign:'right' }}>Amount</span>
      </div>
      {data.map((n, i) => (
        <div key={i} className="rc-col-row" style={{ gridTemplateColumns: '68px 1fr 28px 58px' }}>
          <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{(n.ncName||'N/A').substring(0,10)}</span>
          <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{(n.purpose||'N/A').substring(0,12)}</span>
          <span style={{ textAlign:'right' }}>{n.quantity}</span>
          <span style={{ textAlign:'right' }}>{fmt(n.amount)}</span>
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
// PRINT HTML BUILDER — plain 80mm HTML for printer
// ─────────────────────────────────────────────
function buildPrintHTML(data: ReportData, hotelName: string, businessDate: string): string {
  console.log("🖨️ Building print HTML with data:", {
    billDetails: data.billDetails?.length || 0,
    paymentSummary: data.paymentSummary?.length || 0,
    creditSummary: data.creditSummary?.length || 0,
    discountSummary: data.discountSummary?.length || 0,
    reverseKOTs: data.reverseKOTs?.length || 0,
    reverseBills: data.reverseBills?.length || 0,
    ncKOTSummary: data.ncKOTSummary?.length || 0
  });
  
  const f  = (n: number) => Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  const t  = (dt: string) => dt ? new Date(dt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '--:--';
  const c  = (s: string, w: number) => (s||'').substring(0, w).padEnd(w);
  const r  = (s: string, w: number) => (s||'').substring(0, w).padStart(w);
  const ln = (s: string) => `<div style="font-size:10px;white-space:pre;line-height:1.35;">${s}</div>`;
  const sec= (title: string) => `<div style="font-weight:700;text-align:center;border-top:2px solid #000;border-bottom:1px solid #000;padding:2px 0;margin:6px 0 3px;letter-spacing:1px;font-size:10px;">${title}</div>`;
  const hr = () => `<div style="border-top:1px dashed #555;margin:2px 0;"></div>`;
  const hl = () => `<div style="border-top:1px solid #000;margin:2px 0;"></div>`;
  const tot= (s: string) => `<div style="font-size:10.5px;font-weight:700;white-space:pre;border-top:1px solid #000;border-bottom:1px solid #000;padding:1px 0;margin:1px 0;">${s}</div>`;

  let b = '';
  b += `<div style="text-align:center;font-weight:700;font-size:13px;letter-spacing:2px;border-bottom:2px solid #000;padding-bottom:3px;margin-bottom:3px;">${hotelName}</div>`;
  b += `<div style="text-align:center;font-size:10px;margin-bottom:5px;">Date: ${businessDate}</div>`;

  // Bill Details
  if (data.billDetails?.length) {
    console.log("  - Adding Bill Details section");
    b += sec('BILL DETAILS');
    b += ln(`${c('Bill',7)} ${c('Tbl',5)} ${r('Gross',7)} ${r('GST',5)} ${r('Net',7)} Mode`);
    b += hr();
    let tG=0,tT=0,tN=0;
    data.billDetails.forEach(row => {
      const gst = Number(row.CGST||0)+Number(row.SGST||0);
      tG+=Number(row.grossAmount||0); tT+=gst; tN+=Number(row.netAmount||0);
      b += ln(`${c(String(row.TxnNo).slice(-6),7)} ${c(row.table_name,5)} ${r(f(row.grossAmount),7)} ${r(gst.toFixed(0),5)} ${r(f(row.netAmount),7)} ${c(row.paymentMode||'Cash',5)}`);
    });
    b += hl();
    b += tot(`${'TOTAL'.padEnd(14)} ${r(f(tG),7)} ${r(tT.toFixed(0),5)} ${r(f(tN),7)}`);
  }

  // Payment Summary
  if (data.paymentSummary?.length) {
    const rows = data.paymentSummary.filter(p=>Number(p.totalAmount)>0);
    if (rows.length) {
      console.log("  - Adding Payment Summary section");
      b += sec('PAYMENT SUMMARY');
      let total=0;
      rows.forEach(p=>{ b+=ln(`${c(p.PaymentType,22)} ${r(f(p.totalAmount),8)}`); total+=Number(p.totalAmount||0); });
      b += hl();
      b += tot(`${'TOTAL'.padEnd(22)} ${r(f(total),8)}`);
    }
  }

  // Credit Summary
  if (data.creditSummary?.length) {
    console.log("  - Adding Credit Summary section");
    b += sec('CREDIT SUMMARY');
    b += ln(`${'Customer'.padEnd(18)} ${'Bills'.padStart(5)} ${'Amount'.padStart(8)}`);
    b += hr();
    let total=0;
    data.creditSummary.forEach(row=>{
      b+=ln(`${c(row.customerName,18)} ${r(String(row.billCount||0),5)} ${r(f(row.creditAmount),8)}`);
      total+=Number(row.creditAmount||0);
    });
    b+=hl(); b+=tot(`${'TOTAL'.padEnd(24)} ${r(f(total),8)}`);
  }

  // Discount Summary
  if (data.discountSummary?.length) {
    console.log("  - Adding Discount Summary section");
    b += sec('DISCOUNT SUMMARY');
    b += ln(`${'Bill'.padEnd(7)} ${'Table'.padEnd(7)} ${'Reason'.padEnd(9)} ${'Amount'.padStart(7)}`);
    b += hr();
    let total=0;
    data.discountSummary.forEach(row=>{
      b+=ln(`${c(String(row.TxnNo).slice(-5),7)} ${c(row.table_name,7)} ${c(row.reason,9)} ${r(f(row.Discount),7)}`);
      total+=Number(row.Discount||0);
    });
    b+=hl(); b+=tot(`${'TOTAL'.padEnd(24)} ${r(f(total),7)}`);
  }

  // Reverse KOTs
  if (data.reverseKOTs?.length) {
    console.log("  - Adding Reverse KOT section");
    b += sec('REVERSE KOT SUMMARY');
    b += ln(`${'KOT'.padEnd(6)} ${'Tbl'.padEnd(6)} ${'Item'.padEnd(13)} ${'Qty'.padStart(3)} Time`);
    b += hr();
    data.reverseKOTs.forEach(row=>{
      b+=ln(`${c(String(row.kotNo),6)} ${c(row.table_name,6)} ${c(row.item_name,13)} ${r(String(row.quantity),3)} ${t(row.TxnDatetime)}`);
    });
  }

  // Reverse Bills
  if (data.reverseBills?.length) {
    console.log("  - Adding Reverse Bill section");
    b += sec('REVERSE BILL SUMMARY');
    b += ln(`${'Bill'.padEnd(8)} ${'Table'.padEnd(8)} ${'Amount'.padStart(8)} Time`);
    b += hr();
    let total=0;
    data.reverseBills.forEach(row=>{
      b+=ln(`${c(String(row.billNo),8)} ${c(row.table_name,8)} ${r(f(row.reversedAmount),8)} ${t(row.TxnDatetime)}`);
      total+=Number(row.reversedAmount||0);
    });
    b+=hl(); b+=tot(`${'TOTAL'.padEnd(17)} ${r(f(total),8)}`);
  }

  // NC KOT
  if (data.ncKOTSummary?.length) {
    console.log("  - Adding NC KOT section");
    b += sec('NC KOT SUMMARY');
    b += ln(`${'Name'.padEnd(11)} ${'Purpose'.padEnd(11)} ${'Qty'.padStart(4)} ${'Amount'.padStart(8)}`);
    b += hr();
    let tQ=0, tA=0;
    data.ncKOTSummary.forEach(row=>{
      b+=ln(`${c(row.ncName||'N/A',11)} ${c(row.purpose||'N/A',11)} ${r(String(row.quantity||0),4)} ${r(f(row.amount),8)}`);
      tQ+=Number(row.quantity||0); tA+=Number(row.amount||0);
    });
    b+=hl(); b+=tot(`${'TOTAL'.padEnd(22)} ${r(String(tQ),4)} ${r(f(tA),8)}`);
  }

  b += `<div style="text-align:center;margin-top:10px;font-size:10px;">*** END OF REPORT ***</div>`;
  b += `<div style="text-align:center;font-size:9px;margin-top:2px;">${new Date().toLocaleString('en-IN')}</div>`;

  console.log("✅ Print HTML built, total length:", b.length);
  return `<html><head><style>
    @page{size:80mm auto;margin:0;}
    body{width:72mm;margin-left:3mm;font-family:'Courier New',Courier,monospace;font-size:10px;line-height:1.3;background:#fff;color:#000;}
  </style></head><body>${b}</body></html>`;
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

  // ── Load JSON data stored by DayEnd page ──
  useEffect(() => {
    console.log("🚀 DayEndReportPreview Component Mounted");
    console.log("🔍 Checking sessionStorage...");
    
    const raw  = sessionStorage.getItem("dayEndReportData");
    const date = sessionStorage.getItem("dayEndReportDate") || '';
    
    console.log("📦 Raw data from sessionStorage:", raw ? `Found (length: ${raw.length})` : "NOT FOUND");
    console.log("📅 Date from sessionStorage:", date || "NOT FOUND");
    
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        console.log("✅ Parsed report data successfully:", parsed);
        console.log("📊 Data counts:", {
          billDetails: parsed.billDetails?.length || 0,
          paymentSummary: parsed.paymentSummary?.length || 0,
          creditSummary: parsed.creditSummary?.length || 0,
          discountSummary: parsed.discountSummary?.length || 0,
          reverseKOTs: parsed.reverseKOTs?.length || 0,
          reverseBills: parsed.reverseBills?.length || 0,
          ncKOTSummary: parsed.ncKOTSummary?.length || 0
        });
        setReportData(parsed);
        setBusinessDate(date);
      } catch (error) {
        console.error("❌ Failed to parse report data:", error);
        toast.error("Failed to parse report data");
        navigate("/apps/DayEnd");
      }
    } else {
      console.warn("⚠️ No data found in sessionStorage");
      toast.error("No report data found. Please generate report again.");
      navigate("/apps/DayEnd");
    }
  }, [navigate]);

  // ── Load printer setting ──
  useEffect(() => {
    const fetchPrinter = async () => {
      const outletIdToUse = user?.outletid || user?.hotelid;
      console.log("🖨️ Fetching printer for outlet:", outletIdToUse);
      if (!outletIdToUse) {
        console.warn("⚠️ No outletid or hotelid found");
        return;
      }
      try {
        const printerData = await SettingsService.getReportPrinterById(Number(outletIdToUse));
        console.log("✅ Printer data received:", printerData);
        setPrinterName(printerData[0]?.printer_name || null);
      } catch (error) {
        console.error("❌ Failed to load printer settings:", error);
        toast.error("Failed to load printer settings.");
      }
    };
    fetchPrinter();
  }, [user]);

  const hotelName = user?.hotel_name || 'Report';
  const hasData   = reportData && Object.values(reportData).some(v => Array.isArray(v) && v.length > 0);
  
  console.log("🎨 Rendering preview, hasData:", hasData);
  console.log("🏨 Hotel name:", hotelName);
  console.log("📅 Business date:", businessDate);

  // ── Print ──
  const handlePrint = async () => {
    console.log("🖨️ Print button clicked");
    if (!reportData) {
      console.error("❌ No report data available for printing");
      toast.error("No report data available");
      return;
    }
    
    try {
      setLoading(true);
      console.log("🔍 Getting installed printers...");
      const printersRaw = (await (window as any).electronAPI?.getInstalledPrinters?.()) || [];
      const printers = Array.isArray(printersRaw) ? printersRaw : [];
      console.log("📋 Available printers:", printers.map((p: any) => p.name));
      
      if (!printers.length) { 
        console.error("❌ No printers found");
        toast.error("No printers found"); 
        return; 
      }

      const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, "");
      let finalPrinter: string | null = null;
      
      if (printerName) {
        console.log("🔍 Looking for configured printer:", printerName);
        const match = printers.find((p: any) =>
          normalize(p.name).includes(normalize(printerName)) ||
          normalize(p.displayName || "").includes(normalize(printerName))
        );
        if (match) {
          finalPrinter = match.name;
          console.log("✅ Matched printer:", finalPrinter);
        } else {
          console.warn("⚠️ Configured printer not found, using fallback");
        }
      }
      
      if (!finalPrinter) {
        const fallback = printers.find((p: any) => p.isDefault) || printers[0];
        finalPrinter = fallback?.name;
        console.log("📌 Using fallback printer:", finalPrinter);
      }
      
      if (!finalPrinter) { 
        console.error("❌ No printer available");
        toast.error("No printer available"); 
        return; 
      }

      const printHTML = buildPrintHTML(reportData, hotelName, businessDate);
      console.log("📄 Print HTML generated, sending to printer...");
      
      if ((window as any).electronAPI?.directPrint) {
        await (window as any).electronAPI.directPrint(printHTML, finalPrinter);
        console.log("✅ Print successful!");
        toast.success("Printed successfully!");
        setTimeout(() => { 
          console.log("🚪 Removing session and navigating to login...");
          removeSession(); 
          navigate("/auth/minimal/login", { replace: true }); 
        }, 2000);
      } else {
        console.error("❌ Print API not available");
        toast.error("Print API not available");
      }
    } catch (error) {
      console.error("❌ Print failed:", error);
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
            {/* Toolbar */}
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

            {/* Receipt paper */}
            <div className="der-receipt-wrap">
              <div className="der-receipt-top" />
              <div className="der-receipt-body">
                <div className="rc">
                  <div className="rc-hotel">{hotelName}</div>
                  {businessDate && <div className="rc-meta">Date: {businessDate}</div>}
                  <DashHr />
                  <BillDetailsSection    data={reportData?.billDetails    || []} />
                  <PaymentSummarySection data={reportData?.paymentSummary || []} />
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