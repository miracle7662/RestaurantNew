import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import CheckInService from "@/common/hotel/checkIn";
import { useAuthContext } from "@/common/context/useAuthContext";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import {
  DailySalesSummaryReportResponse,
  DailySalesReport,
  MonthlySalesReport,
} from "@/common/hotel/checkIn";

// --------------------------------------------------------------------
// Types
// --------------------------------------------------------------------
type SimpleReportKey = "payment" | "pending" | "agent";
type ReportKey = SimpleReportKey | "dailysell" | "guest" | "dailysellguest" | "dailysummary";

interface SimpleReport {
  title: string;
  columns: string[];
  rows: (string | number)[][];
  footerLabel: string;
  footerCol: number;
  footerAmtCol: number;
}

interface FieldDef {
  key: string;
  label: string;
}

// Extended to include all 28 fields from the stored procedure
interface DailyBookingRow {
  ldg_bill_no: string;
  room_numbers_used: string;
  guest_name: string;
  company_name: string;
  stay: number;
  checkin_datetime: string;
  checkout_datetime: string;
  room_amount: number;
  food_amount: number;
  settlement_amount: number;
  gross_amount: number;
  discount: number;
  tax_percentage: string; // e.g., "5.00% | 12.00%"
  taxable_value: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
  service_charge: number;
  debit_amount: number;
  credit_amount: number;
  advance: number;
  net_amount: number;
  due_amount: number;
  payment_modes: string; // raw string from backend
  payment_breakdown: Record<string, number>; // parsed from payment_modes
  // NEW FIELDS
  extra_pax_amount: number;
  child_amount: number;
  driver_amount: number;
}

// -------- REPORT FIELD DEFINITIONS (all 28 fields) --------
const guestReport = {
  title: "Daily Sell Report (Guest Details)",
  fields: [
    { key: "ldg_bill_no", label: "Bill No" },
    { key: "guest_name", label: "Guest Name" },
    { key: "company_name", label: "Company" },
    { key: "room_numbers_used", label: "Room" },
    { key: "stay", label: "Stay (Nights)" },
    { key: "checkin_datetime", label: "Check‑in" },
    { key: "checkout_datetime", label: "Check‑out" },
    { key: "room_amount", label: "Room Amount" },
    { key: "food_amount", label: "Food Amount" },
    { key: "settlement_amount", label: "Settlement Amount" },
    { key: "gross_amount", label: "Gross Amount" },
    { key: "discount", label: "Discount" },
    { key: "tax_percentage", label: "Tax %" },
    { key: "taxable_value", label: "Taxable Value" },
    { key: "cgst", label: "CGST" },
    { key: "sgst", label: "SGST" },
    { key: "igst", label: "IGST" },
    { key: "cess", label: "CESS" },
    { key: "service_charge", label: "Service Charge" },
    { key: "debit_amount", label: "Debit Amount" },
    { key: "credit_amount", label: "Credit Amount" },
    { key: "advance", label: "Advance" },
    { key: "net_amount", label: "Net Amount" },
    { key: "due_amount", label: "Due Amount" },
    { key: "payment_modes", label: "Payment Modes" },
    // NEW FIELDS
    { key: "extra_pax_amount", label: "Extra Pax Amount" },
    { key: "child_amount", label: "Child Amount" },
    { key: "driver_amount", label: "Driver Amount" },
  ],
  // All 28 fields are selected by default
  defaultFields: [
    "ldg_bill_no",
    "guest_name",
    "company_name",
    "room_numbers_used",
    "stay",
    "checkin_datetime",
    "checkout_datetime",
    "room_amount",
    "food_amount",
    "settlement_amount",
    "gross_amount",
    "discount",
    "tax_percentage",
    "taxable_value",
    "cgst",
    "sgst",
    "igst",
    "cess",
    "service_charge",
    "debit_amount",
    "credit_amount",
    "advance",
    "net_amount",
    "due_amount",
    "payment_modes",
    "extra_pax_amount",
    "child_amount",
    "driver_amount",
  ],
};

// Payment report uses a simpler subset (unchanged)
const paymentReport = {
  title: "Payment Mode Report (Detailed)",
  fields: [
    { key: "ldg_bill_no", label: "Bill No" },
    { key: "guest_name", label: "Guest Name" },
    { key: "room_numbers_used", label: "Room" },
    { key: "checkin_datetime", label: "Check‑in / Check‑out" },
  ],
  defaultFields: ["ldg_bill_no", "guest_name", "room_numbers_used", "checkin_datetime"],
};

// -------- DAILY SUMMARY REPORT FIELDS (updated with new fields) --------
const dailySummaryFields: FieldDef[] = [
  { key: "Date", label: "Date" },
  { key: "Day", label: "Day" },
  { key: "Total Bills", label: "Total Bills" },
  { key: "Bill Range", label: "Bill Range" },
  { key: "Room Amount", label: "Room Amount" },
  { key: "Food Amount", label: "Food Amount" },
  { key: "Service Charge", label: "Service Charge" },
  { key: "CESS", label: "CESS" },
  { key: "Tax Amount", label: "Tax Amount" },
  { key: "CGST", label: "CGST" },
  { key: "SGST", label: "SGST" },
  { key: "IGST", label: "IGST" },
  { key: "Gross Amount", label: "Gross Amount" },
  { key: "Discount", label: "Discount" },
  { key: "Net Amount", label: "Net Amount" },
  { key: "Advance", label: "Advance" },
  { key: "Settlement Amount", label: "Settlement Amount" },
  { key: "Tip Amount", label: "Tip Amount" },
  { key: "Due Amount", label: "Due Amount" },
  { key: "Payment Modes", label: "Payment Modes" },
  // NEW FIELDS for summary
  { key: "Extra Pax Amount", label: "Extra Pax Amount" },
  { key: "Child Amount", label: "Child Amount" },
  { key: "Driver Amount", label: "Driver Amount" },
];

const monthlySummaryFields: FieldDef[] = [
  { key: "Year", label: "Year" },
  { key: "Month", label: "Month" },
  { key: "Month Name", label: "Month Name" },
  { key: "Total Bills", label: "Total Bills" },
  { key: "Bill Range", label: "Bill Range" },
  { key: "Room Amount", label: "Room Amount" },
  { key: "Food Amount", label: "Food Amount" },
  { key: "Service Charge", label: "Service Charge" },
  { key: "CESS", label: "CESS" },
  { key: "Tax Amount", label: "Tax Amount" },
  { key: "CGST", label: "CGST" },
  { key: "SGST", label: "SGST" },
  { key: "IGST", label: "IGST" },
  { key: "Gross Amount", label: "Gross Amount" },
  { key: "Discount", label: "Discount" },
  { key: "Net Amount", label: "Net Amount" },
  { key: "Advance", label: "Advance" },
  { key: "Settlement Amount", label: "Settlement Amount" },
  { key: "Tip Amount", label: "Tip Amount" },
  { key: "Due Amount", label: "Due Amount" },
  { key: "Payment Modes", label: "Payment Modes" },
  // NEW FIELDS for summary
  { key: "Extra Pax Amount", label: "Extra Pax Amount" },
  { key: "Child Amount", label: "Child Amount" },
  { key: "Driver Amount", label: "Driver Amount" },
];

// -------- SIMPLE REPORTS (Pending, Agent) - unchanged --------
const simpleReports: Record<SimpleReportKey, SimpleReport> = {
  payment: {
    title: "Payment Mode Report",
    columns: ["#", "Payment Mode", "Transactions", "Total Amount", "Net Amount", "Contribution %"],
    rows: [],
    footerLabel: "Total Payment Modes:",
    footerCol: 2,
    footerAmtCol: 3,
  },
  pending: {
    title: "Pending Payment Report",
    columns: ["#", "Guest", "Room No", "Total Amt", "Paid Amt", "Pending Amt", "Status", "Contact"],
    rows: [],
    footerLabel: "Total Pending:",
    footerCol: 5,
    footerAmtCol: 5,
  },
  agent: {
    title: "Agent Booking Report",
    columns: [
      "#",
      "Agent Name",
      "Guest",
      "Room No",
      "Booking Date",
      "Total Amt",
      "Commission %",
      "Commission Amt",
    ],
    rows: [],
    footerLabel: "Total Bookings:",
    footerCol: 5,
    footerAmtCol: 5,
  },
};

const reportMenu: { key: ReportKey; label: string }[] = [
  { key: "dailysell", label: "Daily Sell Report" },
  { key: "dailysummary", label: "Daily Summary Report" },
  { key: "payment", label: "Payment Mode Report" },
  { key: "pending", label: "Pending Payment Report" },
  { key: "agent", label: "Agent Booking Report" },
  { key: "guest", label: "Guest Report" },
];

// --------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function statusBadgeClass(value: string): string {
  const v = value.toLowerCase();
  if (v === "paid" || v === "gold" || v === "platinum")
    return "bg-success-subtle text-success-emphasis";
  if (v === "pending" || v === "new")
    return "bg-danger-subtle text-danger-emphasis";
  if (v === "partial" || v === "silver" || v === "bronze")
    return "bg-warning-subtle text-warning-emphasis";
  return "bg-secondary-subtle text-secondary-emphasis";
}

const STATUS_WORDS = [
  "paid",
  "pending",
  "partial",
  "gold",
  "silver",
  "bronze",
  "platinum",
  "new",
];

function formatCell(value: string | number | null | undefined): React.ReactNode {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "string" && STATUS_WORDS.includes(value.toLowerCase())) {
    return <span className={`badge rounded-pill ${statusBadgeClass(value)}`}>{value}</span>;
  }
  return value;
}

function useClickOutside<T extends HTMLElement>(isOpen: boolean, onClose: () => void) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isOpen, onClose]);
  return ref;
}

// --------------------------------------------------------------------
// Main Component
// --------------------------------------------------------------------
export default function ReportsPage(): JSX.Element {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const hotelid = user?.hotelid ?? 1;

  const [activeReport, setActiveReport] = useState<ReportKey>("dailysell");

  const today = new Date();
  const [fromDate, setFromDate] = useState(formatDate(today));
  const [toDate, setToDate] = useState(formatDate(today));

  const [detailRows, setDetailRows] = useState<DailyBookingRow[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [selectedFields, setSelectedFields] = useState<string[]>(guestReport.defaultFields);

  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // ----- DAILY SUMMARY STATE -----
  const [summaryData, setSummaryData] = useState<DailySalesSummaryReportResponse | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  // New state for summary view toggle
  const [summaryView, setSummaryView] = useState<'daily' | 'monthly'>('daily');

  const [simpleSelectedColumns, setSimpleSelectedColumns] = useState<
    Record<SimpleReportKey, string[]>
  >(() => {
    const initial = {} as Record<SimpleReportKey, string[]>;
    for (const key of Object.keys(simpleReports) as SimpleReportKey[]) {
      initial[key] = [...simpleReports[key].columns];
    }
    return initial;
  });

  const [reportDropdownOpen, setReportDropdownOpen] = useState(false);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [fieldDropdownOpen, setFieldDropdownOpen] = useState(false);
  const [columnDropdownOpen, setColumnDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  // Ensure hotelid is valid before making any API calls
const isValidHotel = user?.hotelid && user.hotelid > 0;

  const reportRef = useClickOutside<HTMLDivElement>(reportDropdownOpen, () =>
    setReportDropdownOpen(false)
  );
  const exportRef = useClickOutside<HTMLDivElement>(exportDropdownOpen, () =>
    setExportDropdownOpen(false)
  );
  const fieldRef = useClickOutside<HTMLDivElement>(fieldDropdownOpen, () =>
    setFieldDropdownOpen(false)
  );
  const columnRef = useClickOutside<HTMLDivElement>(columnDropdownOpen, () =>
    setColumnDropdownOpen(false)
  );

  const activeLabel = reportMenu.find((r) => r.key === activeReport)?.label ?? "";

  // -------------------- API calls --------------------
  const fetchDailyBookings = useCallback(
    async (params: { hotelid: number; fromDate: string; toDate: string }): Promise<DailyBookingRow[]> => {
      const response = await CheckInService.getDailySalesSummary({
        hotelid: params.hotelid,
        start_date: params.fromDate,
        end_date: params.toDate,
        limit: 1000,
      });
      const rawData = response?.data ?? [];

      return rawData.map((item: any) => {
        // Parse payment modes from the 'Payment Modes' string
        let breakdown: Record<string, number> = {};
        const paymentModesStr = item['Payment Modes'] || '';
        if (paymentModesStr) {
          const entries = paymentModesStr.split('|').map((s: string) => s.trim()).filter((s: string) => s);
          entries.forEach((entry: string) => {
            const parts = entry.split(':');
            if (parts.length === 2) {
              const mode = parts[0].trim();
              const amount = parseFloat(parts[1].trim());
              if (!isNaN(amount) && amount > 0) {
                breakdown[mode] = (breakdown[mode] || 0) + amount;
              }
            }
          });
        }
        // Fallback if breakdown is empty
        if (Object.keys(breakdown).length === 0) {
          const settlement = Number(item['Settlement Amount']) || 0;
          if (settlement > 0) {
            breakdown = { Cash: settlement };
          }
        }

        return {
          ldg_bill_no: item['Ldg Bill No'] ?? '',
          guest_name: item['Guest Name'] ?? '',
          company_name: item['Company Name'] ?? '',
          room_numbers_used: item['Room No'] ?? '',
          stay: Number(item['Stay']) || 0,
          checkin_datetime: item['Check In'] ?? '',
          checkout_datetime: item['Check Out'] ?? '',
          room_amount: Number(item['Room Amount']) || 0,
          food_amount: Number(item['Food Amount']) || 0,
          settlement_amount: Number(item['Settlement Amount']) || 0,
          gross_amount: Number(item['Gross Amount']) || 0,
          discount: Number(item['Discount']) || 0,
          tax_percentage: item['Tax%'] ?? '',
          taxable_value: Number(item['Taxable Value']) || 0,
          cgst: Number(item['CGST']) || 0,
          sgst: Number(item['SGST']) || 0,
          igst: Number(item['IGST']) || 0,
          cess: Number(item['CESS']) || 0,
          service_charge: Number(item['Service Charge']) || 0,
          debit_amount: Number(item['Debit Amount']) || 0,
          credit_amount: Number(item['Credit Amount']) || 0,
          advance: Number(item['Advance']) || 0,
          net_amount: Number(item['Net Amount']) || 0,
          due_amount: Number(item['Due Amount']) || 0,
          payment_modes: paymentModesStr,
          payment_breakdown: breakdown,
          // NEW FIELDS
          extra_pax_amount: Number(item['Extra Pax Amount']) || 0,
          child_amount: Number(item['Child Amount']) || 0,
          driver_amount: Number(item['Driver Amount']) || 0,
        };
      });
    },
    []
  );

  const fetchPaymentReport = useCallback(async () => {
    setPaymentLoading(true);
    setPaymentError(null);
    try {
      await CheckInService.getPaymentModeSummary({
        hotelid,
        start_date: fromDate,
        end_date: toDate,
      });
    } catch (err: unknown) {
      setPaymentError(err instanceof Error ? err.message : "Failed to load payment report");
    } finally {
      setPaymentLoading(false);
    }
  }, [hotelid, fromDate, toDate]);

  // ----- DAILY SUMMARY FETCH -----
 const fetchDailySummary = useCallback(async () => {
  if (!isValidHotel) {
    setSummaryError("Hotel ID not available");
    return;
  }
  setSummaryLoading(true);
  setSummaryError(null);
  try {
    const response = await CheckInService.getDailySalesSummaryReport({
      hotelid: hotelid, // ab yeh valid hoga
      start_date: fromDate,
      end_date: toDate,
    });
    console.log("Summary API response:", response);
console.log("data:", response.data);
    setSummaryData(response.data ?? null);
  } catch (err: unknown) {
    setSummaryError(err instanceof Error ? err.message : "Failed to load summary report");
    setSummaryData(null);
  } finally {
    setSummaryLoading(false);
  }
}, [hotelid, fromDate, toDate, isValidHotel]);

  // -------------------- Effects --------------------
  const isDetailReport = useMemo(
    () => ["dailysell", "guest", "dailysellguest", "payment"].includes(activeReport),
    [activeReport]
  );

  const currentFieldList = useMemo(() => {
    if (activeReport === "payment") return paymentReport.fields;
    if (["dailysell", "guest", "dailysellguest"].includes(activeReport)) return guestReport.fields;
    return [];
  }, [activeReport]);

  useEffect(() => {
    if (activeReport === "payment") {
      setSelectedFields(paymentReport.defaultFields);
    } else if (["dailysell", "guest", "dailysellguest"].includes(activeReport)) {
      setSelectedFields(guestReport.defaultFields);
    }
  }, [activeReport]);

  useEffect(() => {
    if (!isDetailReport) return;
    let cancelled = false;
    setDetailLoading(true);
    setDetailError(null);

    fetchDailyBookings({ hotelid, fromDate, toDate })
      .then((rows) => {
        if (!cancelled) {
          setDetailRows(rows);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setDetailError(err instanceof Error ? err.message : "Failed to load report");
          setDetailRows([]);
        }
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isDetailReport, fromDate, toDate, hotelid, fetchDailyBookings]);

  // Trigger summary fetch when report is active
  useEffect(() => {
    if (activeReport === "dailysummary") {
      fetchDailySummary();
    }
  }, [activeReport, fetchDailySummary]);

  // -------------------- Refresh --------------------
  const refreshDetailReport = () => {
    if (!isDetailReport) return;
    setDetailLoading(true);
    setDetailError(null);
    fetchDailyBookings({ hotelid, fromDate, toDate })
      .then(setDetailRows)
      .catch((err: unknown) =>
        setDetailError(err instanceof Error ? err.message : "Failed to load report")
      )
      .finally(() => setDetailLoading(false));
  };

  // -------------------- Toggle handlers --------------------
  const toggleField = (key: string) => {
    setSelectedFields((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const toggleAllFields = () => {
    const allKeys = currentFieldList.map((f) => f.key);
    setSelectedFields((prev) =>
      prev.length === allKeys.length ? [] : allKeys
    );
  };

  const toggleSimpleColumn = (reportKey: SimpleReportKey, col: string) => {
    setSimpleSelectedColumns((prev) => {
      const current = prev[reportKey] || [];
      const updated = current.includes(col)
        ? current.filter((c) => c !== col)
        : [...current, col];
      return { ...prev, [reportKey]: updated };
    });
  };

  const toggleAllSimpleColumns = (reportKey: SimpleReportKey) => {
    setSimpleSelectedColumns((prev) => {
      const all = simpleReports[reportKey].columns;
      const current = prev[reportKey] || [];
      const updated = current.length === all.length ? [] : [...all];
      return { ...prev, [reportKey]: updated };
    });
  };

  // -------------------- Data filtering --------------------
  const filteredDetailRows = useMemo(() => {
    if (!searchQuery.trim()) return detailRows;
    const q = searchQuery.trim().toLowerCase();
    return detailRows.filter((row) =>
      Object.values(row).some((val) => String(val as any).toLowerCase().includes(q))
    );
  }, [detailRows, searchQuery]);

  const getBreakdownAmount = (row: DailyBookingRow, modeName: string): number => {
    const normalizedMode = modeName.trim().toLowerCase();
    const key = Object.keys(row.payment_breakdown || {}).find(
      (k) => k.trim().toLowerCase() === normalizedMode
    );
    return key ? Number(row.payment_breakdown[key]) || 0 : 0;
  };

  const paymentModeTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    filteredDetailRows.forEach((row) => {
      Object.entries(row.payment_breakdown || {}).forEach(([mode, amt]) => {
        totals[mode] = (totals[mode] || 0) + (Number(amt) || 0);
      });
    });
    return totals;
  }, [filteredDetailRows]);

  const visiblePaymentModes = useMemo(
    () => Object.keys(paymentModeTotals).filter((mode) => paymentModeTotals[mode] > 0),
    [paymentModeTotals]
  );

  // -------------------- Report builders --------------------
  const currentReport = useMemo(() => {
    if (isDetailReport) return null;
    const base = simpleReports[activeReport as SimpleReportKey];
    if (!base) return null;
    return { ...base, rows: base.rows };
  }, [activeReport, isDetailReport]);

  const filteredSimpleRows = useMemo(() => {
    if (!currentReport) return [];
    if (!searchQuery.trim()) return currentReport.rows;
    const q = searchQuery.trim().toLowerCase();
    return currentReport.rows.filter((row) =>
      row.some((cell) => String(cell).toLowerCase().includes(q))
    );
  }, [currentReport, searchQuery]);

  const filteredReport = currentReport
    ? { ...currentReport, rows: filteredSimpleRows }
    : null;

  // -------------------- Export functions --------------------
  const exportToExcel = (data: DailyBookingRow[], columns: FieldDef[]) => {
    const excelData = data.map((row) => {
      const obj: Record<string, any> = {};
      columns.forEach((col) => {
        let value = row[col.key as keyof DailyBookingRow];
        // Special handling for checkin/checkout if needed
        if (col.key === "checkin_datetime") {
          value = `${row.checkin_datetime} → ${row.checkout_datetime}`;
        }
        obj[col.label] = value ?? "-";
      });
      visiblePaymentModes.forEach((mode) => {
        obj[mode] = getBreakdownAmount(row, mode);
      });
      return obj;
    });
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, activeLabel);
    XLSX.writeFile(wb, `${activeLabel}.xlsx`);
  };

  const exportToPDF = (data: DailyBookingRow[], columns: FieldDef[]) => {
    const doc = new jsPDF();
    doc.text(activeLabel, 14, 16);

    const tableHeaders = [...columns.map((c) => c.label), ...visiblePaymentModes];
    const tableRows = data.map((row) => {
      const base = columns.map((c) => {
        let value = row[c.key as keyof DailyBookingRow];
        if (c.key === "checkin_datetime") {
          value = `${row.checkin_datetime} → ${row.checkout_datetime}`;
        }
        return value ?? "-";
      });
      const modeVals = visiblePaymentModes.map((mode) => getBreakdownAmount(row, mode));
      return [...base, ...modeVals];
    });

    (doc as any).autoTable({
      head: [tableHeaders],
      body: tableRows,
      startY: 22,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [31, 58, 95] },
    });

    doc.save(`${activeLabel}.pdf`);
  };

  // -------------------- Render helpers --------------------
  const renderSimpleTable = (report: SimpleReport) => {
    const reportKey = activeReport as SimpleReportKey;
    const visibleColNames = simpleSelectedColumns[reportKey] || report.columns;
    const visible = visibleColNames.length === 0 ? report.columns : visibleColNames;
    const visibleIndices = visible
      .map((col) => report.columns.indexOf(col))
      .filter((idx) => idx !== -1);
    const total = report.rows.reduce((sum, row) => {
      const raw = String(row[report.footerAmtCol]).replace(/[₹,]/g, "");
      const num = parseFloat(raw);
      return sum + (isNaN(num) ? 0 : num);
    }, 0);
    const amtColIndex = visible.indexOf(report.columns[report.footerAmtCol]);

    return (
      <table className="table table-hover align-middle mb-0">
        <thead className="rp-thead">
          <tr>
            {visible.map((col) => (
              <th key={col} className="text-nowrap">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {report.rows.length === 0 ? (
            <tr>
              <td colSpan={visible.length} className="text-center text-muted fst-italic py-5">
                No records found for selected date range
              </td>
            </tr>
          ) : (
            report.rows.map((row, i) => (
              <tr key={i}>
                {visibleIndices.map((idx) => (
                  <td key={idx} className="text-nowrap">
                    {formatCell(row[idx])}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
        <tfoot>
          <tr className="rp-tfoot fw-bold">
            <td colSpan={amtColIndex}>
              {report.footerLabel} {report.rows.length}
            </td>
            <td>₹{total.toLocaleString("en-IN")}.00</td>
            {Array.from({ length: visible.length - amtColIndex - 1 }).map((_, i) => (
              <td key={i} />
            ))}
          </tr>
        </tfoot>
      </table>
    );
  };

  const renderDetailTable = () => {
    if (detailLoading) {
      return (
        <div className="text-center py-5" style={{ color: "var(--rp-text-muted)" }}>
          <div
            className="spinner-border spinner-border-sm me-2"
            style={{ color: "var(--rp-primary)" }}
            role="status"
          />
          Loading report...
        </div>
      );
    }

    if (detailError) {
      return (
        <div
          className="text-center py-5 mx-3 my-3 rounded"
          style={{ background: "var(--rp-danger-soft)", color: "var(--rp-danger)" }}
        >
          <i className="bi bi-exclamation-triangle-fill d-block mb-2" style={{ fontSize: 20 }} />
          {detailError}
          <div>
            <button className="btn btn-sm rp-btn-outline-danger mt-3" onClick={refreshDetailReport}>
              Retry
            </button>
          </div>
        </div>
      );
    }

    const columns = currentFieldList.filter((f) => selectedFields.includes(f.key));
    if (columns.length === 0) {
      return (
        <div className="text-center py-5" style={{ color: "var(--rp-text-muted)" }}>
          <i className="bi bi-columns-gap d-block mb-2" style={{ fontSize: 20 }} />
          No fields selected — use <strong>Select Fields</strong> above to choose columns to display
        </div>
      );
    }

    if (filteredDetailRows.length === 0) {
      return (
        <div className="text-center py-5" style={{ color: "var(--rp-text-muted)" }}>
          <i className="bi bi-people d-block mb-2" style={{ fontSize: 20 }} />
          {searchQuery.trim()
            ? `No records match "${searchQuery}"`
            : `No records found for ${fromDate} to ${toDate}`}
          <div>
            <button className="btn btn-sm rp-btn-outline mt-3" onClick={refreshDetailReport}>
              Refresh
            </button>
          </div>
        </div>
      );
    }

    // -------- CONDITIONAL COLUMN VISIBILITY --------
    // These keys will be hidden if all rows have zero/empty values
    const conditionalKeys = new Set([
      'food_amount',
      'igst',
      'cess',
      'service_charge',
      'extra_pax_amount',
      'child_amount',
      'driver_amount',
    ]);
    const visibleColumns = columns.filter(col => {
      if (!conditionalKeys.has(col.key)) return true;
      // Check if any row has a non-zero value for this field
      return filteredDetailRows.some(row => {
        const val = row[col.key as keyof DailyBookingRow];
        if (typeof val === 'number') {
          return val !== 0;
        }
        // For string fields (though these are numeric) we keep if non-empty
        return val !== '' && val !== null && val !== undefined;
      });
    });

    if (visibleColumns.length === 0) {
      return (
        <div className="text-center py-5" style={{ color: "var(--rp-text-muted)" }}>
          <i className="bi bi-columns-gap d-block mb-2" style={{ fontSize: 20 }} />
          No columns to display after conditional filtering.
        </div>
      );
    }

    const isPaymentReport = activeReport === "payment";

    const renderCell = (row: DailyBookingRow, fieldKey: string) => {
      if (fieldKey === "checkin_datetime") {
        return (
          <>
            {row.checkin_datetime}
            <br />
            {row.checkout_datetime}
          </>
        );
      }
      // Chunk room numbers for Payment Report
      if (fieldKey === "room_numbers_used" && isPaymentReport) {
        const rooms = row.room_numbers_used
          .split(',')
          .map(r => r.trim())
          .filter(r => r);
        const chunks: string[] = [];
        for (let i = 0; i < rooms.length; i += 3) {
          chunks.push(rooms.slice(i, i + 3).join(', '));
        }
        return (
          <>
            {chunks.map((chunk, idx) => (
              <React.Fragment key={idx}>
                {chunk}
                {idx < chunks.length - 1 && <br />}
              </React.Fragment>
            ))}
          </>
        );
      }
      // Format numbers as currency for numeric fields (optional)
      if (typeof row[fieldKey as keyof DailyBookingRow] === 'number') {
        const num = row[fieldKey as keyof DailyBookingRow] as number;
        return num.toLocaleString('en-IN');
      }
      return formatCell(row[fieldKey as keyof DailyBookingRow] as string | number | null | undefined);
    };

    return (
      <table className="table table-hover align-middle mb-0">
        <thead className="rp-thead">
          <tr>
            {visibleColumns.map((c) => {
              const isRoom = isPaymentReport && c.key === "room_numbers_used";
              const thStyle = isRoom
                ? ({ padding: "0.3rem 0.2rem", maxWidth: "150px", whiteSpace: "normal", wordBreak: "break-word" } as React.CSSProperties)
                : {};
              const thClassName = isRoom ? "" : "text-nowrap";
              return (
                <th key={c.key} className={thClassName} style={thStyle}>
                  {c.label}
                </th>
              );
            })}
            {visiblePaymentModes.map((mode) => (
              <th key={mode} className="text-nowrap">
                {mode}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredDetailRows.map((row, i) => (
            <tr key={i}>
              {visibleColumns.map((c) => {
                const isRoom = isPaymentReport && c.key === "room_numbers_used";
                const tdStyle = isRoom
                  ? ({ padding: "0.3rem 0.2rem", maxWidth: "150px", whiteSpace: "normal", wordBreak: "break-word" } as React.CSSProperties)
                  : {};
                const tdClassName = isRoom ? "" : "text-nowrap";
                return (
                  <td key={c.key} className={tdClassName} style={tdStyle}>
                    {renderCell(row, c.key)}
                  </td>
                );
              })}
              {visiblePaymentModes.map((mode) => (
                <td key={mode} className="text-nowrap">
                  ₹{getBreakdownAmount(row, mode).toLocaleString("en-IN")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="rp-tfoot fw-bold">
            <td colSpan={Math.max(visibleColumns.length, 1)}>
              Total Records: {filteredDetailRows.length}
            </td>
            {visiblePaymentModes.map((mode) => (
              <td key={mode}>₹{(paymentModeTotals[mode] || 0).toLocaleString("en-IN")}</td>
            ))}
          </tr>
        </tfoot>
      </table>
    );
  };

  // ----- RENDER DAILY SUMMARY TABLES (updated with view toggle) -----
  const renderSummaryTables = () => {
    if (summaryLoading) {
      return (
        <div className="text-center py-5" style={{ color: "var(--rp-text-muted)" }}>
          <div
            className="spinner-border spinner-border-sm me-2"
            style={{ color: "var(--rp-primary)" }}
            role="status"
          />
          Loading summary report...
        </div>
      );
    }

    if (summaryError) {
      return (
        <div
          className="text-center py-5 mx-3 my-3 rounded"
          style={{ background: "var(--rp-danger-soft)", color: "var(--rp-danger)" }}
        >
          <i className="bi bi-exclamation-triangle-fill d-block mb-2" style={{ fontSize: 20 }} />
          {summaryError}
          <div>
            <button className="btn btn-sm rp-btn-outline-danger mt-3" onClick={fetchDailySummary}>
              Retry
            </button>
          </div>
        </div>
      );
    }

    if (!summaryData) {
      return (
        <div className="text-center py-5" style={{ color: "var(--rp-text-muted)" }}>
          No summary data available for the selected date range.
        </div>
      );
    }

    const { dailySummary, monthlySummary } = summaryData;

    // Decide which fields and data to render based on summaryView
    const isDaily = summaryView === 'daily';
    const fields = isDaily ? dailySummaryFields : monthlySummaryFields;
    const data = isDaily ? dailySummary : monthlySummary;

    return (
      <div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="rp-thead">
              <tr>
                {fields.map((f) => (
                  <th key={f.key} className="text-nowrap">{f.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={fields.length} className="text-center text-muted fst-italic py-5">
                    No {isDaily ? 'daily' : 'monthly'} records
                  </td>
                </tr>
              ) : (
                data.map((row, i) => (
                  <tr key={i}>
                    {fields.map((f) => (
                      <td key={f.key} className="text-nowrap">
                        {row[f.key as keyof (DailySalesReport | MonthlySalesReport)] ?? "-"}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // -------------------- ESC key handler --------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        navigate("/hotel-master/HotelBookingPanel", { replace: true });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  // --------------------------------------------------------------------
  // JSX
  // --------------------------------------------------------------------
  return (
    <div className="rp-app bg-white">
      <style>{`
        .rp-app {
          --rp-primary: #1f3a5f;
          --rp-primary-hover: #16304c;
          --rp-primary-soft: #eaf0f6;
          --rp-accent: #0f766e;
          --rp-accent-hover: #0b5c56;
          --rp-accent-soft: #e6f4f2;
          --rp-danger: #b42318;
          --rp-danger-hover: #8f1b12;
          --rp-danger-soft: #fbeae9;
          --rp-surface: #f8fafc;
          --rp-border: #e2e8f0;
          --rp-text: #1e293b;
          --rp-text-muted: #64748b;
          color: var(--rp-text);
        }
        .rp-app .rp-btn-primary {
          background: var(--rp-primary);
          border: 1px solid var(--rp-primary);
          color: #fff;
        }
        .rp-app .rp-btn-primary:hover,
        .rp-app .rp-btn-primary:focus {
          background: var(--rp-primary-hover);
          border-color: var(--rp-primary-hover);
          color: #fff;
        }
        .rp-app .rp-btn-accent {
          background: var(--rp-accent);
          border: 1px solid var(--rp-accent);
          color: #fff;
        }
        .rp-app .rp-btn-accent:hover,
        .rp-app .rp-btn-accent:focus {
          background: var(--rp-accent-hover);
          border-color: var(--rp-accent-hover);
          color: #fff;
        }
        .rp-app .rp-btn-outline {
          background: #fff;
          border: 1px solid var(--rp-border);
          color: var(--rp-text);
        }
        .rp-app .rp-btn-outline:hover,
        .rp-app .rp-btn-outline:focus {
          background: var(--rp-primary-soft);
          border-color: var(--rp-primary);
          color: var(--rp-primary);
        }
        .rp-app .rp-btn-outline-danger {
          background: #fff;
          border: 1px solid var(--rp-border);
          color: var(--rp-text-muted);
        }
        .rp-app .rp-btn-outline-danger:hover,
        .rp-app .rp-btn-outline-danger:focus {
          background: var(--rp-danger-soft);
          border-color: var(--rp-danger);
          color: var(--rp-danger);
        }
        .rp-app .rp-btn-link {
          color: var(--rp-accent);
          text-decoration: none;
          font-weight: 600;
        }
        .rp-app .rp-btn-link:hover {
          color: var(--rp-accent-hover);
          text-decoration: underline;
        }
        .rp-app .rp-dropdown-item.active,
        .rp-app .rp-dropdown-item:active {
          background: var(--rp-primary-soft) !important;
          color: var(--rp-primary) !important;
        }
        .rp-app .rp-dropdown-item:hover {
          background: var(--rp-surface);
        }
        .rp-app .rp-thead th {
          background: var(--rp-surface);
          color: var(--rp-text-muted);
          border-bottom: 1px solid var(--rp-border);
          font-size: 0.78rem;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          font-weight: 600;
        }
        .rp-app .rp-tfoot td {
          background: var(--rp-primary-soft);
          color: var(--rp-primary);
          border-top: 1px solid var(--rp-border);
        }
        .rp-app .rp-panel {
          border: 1px solid var(--rp-border);
        }
        .rp-app .rp-panel-header {
          color: var(--rp-text-muted);
        }
        .rp-app .dropdown-menu {
          max-height: 280px;
          overflow-y: auto;
        }
        .rp-app .dropdown-menu.rp-panel {
          max-height: 420px;
          overflow-y: auto;
        }
      `}</style>

      {/* Toolbar */}
      <div className="d-flex align-items-center gap-3 p-3 border-bottom flex-wrap">
        <div className="dropdown" style={{ position: "relative" }} ref={reportRef}>
          <button
            className="btn rp-btn-primary dropdown-toggle fw-semibold d-flex align-items-center gap-2"
            type="button"
            style={{ minWidth: 220, justifyContent: "space-between" }}
            onClick={() => setReportDropdownOpen((v) => !v)}
          >
            <span>{activeLabel}</span>
          </button>
          {reportDropdownOpen && (
            <ul
              className="dropdown-menu show shadow-sm"
              style={{
                display: "block",
                position: "absolute",
                top: "calc(100% + 4px)",
                left: 0,
                zIndex: 1000,
                minWidth: 220,
                maxHeight: "none",
                overflowY: "auto",
              }}
            >
              {reportMenu.map((r) => (
                <li key={r.key}>
                  <button
                    className={`dropdown-item rp-dropdown-item d-flex align-items-center justify-content-between ${
                      activeReport === r.key ? "active fw-semibold" : ""
                    }`}
                    onClick={() => {
                      setActiveReport(r.key);
                      setReportDropdownOpen(false);
                    }}
                  >
                    <span>{r.label}</span>
                    {activeReport === r.key && <i className="bi bi-check-lg" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <input
          type="date"
          className="form-control"
          style={{ width: 170 }}
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
        />
        <input
          type="date"
          className="form-control"
          style={{ width: 170 }}
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
        />

        <input
          type="text"
          className="form-control"
          placeholder="Search..."
          style={{ width: 200 }}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <div className="ms-auto d-flex gap-2">
          <div className="dropdown" style={{ position: "relative" }} ref={exportRef}>
            <button
              className="btn rp-btn-accent dropdown-toggle fw-semibold"
              type="button"
              onClick={() => setExportDropdownOpen((v) => !v)}
            >
              Export
            </button>
            {exportDropdownOpen && (
              <ul
                className="dropdown-menu show dropdown-menu-end shadow-sm"
                style={{
                  display: "block",
                  position: "absolute",
                  top: "calc(100% + 4px)",
                  right: 0,
                  zIndex: 1000,
                  maxHeight: "280px",
                  overflowY: "auto",
                }}
              >
                <li>
                  <button
                    className="dropdown-item rp-dropdown-item"
                    onClick={() => {
                      setExportDropdownOpen(false);
                      if (activeReport === "dailysummary") {
                        if (summaryData) {
                          const wb = XLSX.utils.book_new();
                          const dailySheet = XLSX.utils.json_to_sheet(summaryData.dailySummary);
                          XLSX.utils.book_append_sheet(wb, dailySheet, "Daily");
                          const monthlySheet = XLSX.utils.json_to_sheet(summaryData.monthlySummary);
                          XLSX.utils.book_append_sheet(wb, monthlySheet, "Monthly");
                          XLSX.writeFile(wb, "Daily_Summary_Report.xlsx");
                        } else {
                          alert("No summary data to export.");
                        }
                      } else if (isDetailReport) {
                        const cols = currentFieldList.filter((f) =>
                          selectedFields.includes(f.key)
                        );
                        exportToExcel(filteredDetailRows, cols);
                      } else {
                        alert("Excel export for this report not implemented yet.");
                      }
                    }}
                  >
                    Export as Excel
                  </button>
                </li>
                <li>
                  <button
                    className="dropdown-item rp-dropdown-item"
                    onClick={() => {
                      setExportDropdownOpen(false);
                      if (activeReport === "dailysummary") {
                        if (summaryData) {
                          const doc = new jsPDF();
                          doc.text("Daily Summary Report", 14, 16);
                          // Daily table
                          (doc as any).autoTable({
                            head: [dailySummaryFields.map((f) => f.label)],
                            body: summaryData.dailySummary.map((row) =>
                              dailySummaryFields.map((f) => row[f.key as keyof DailySalesReport] ?? "-")
                            ),
                            startY: 22,
                            styles: { fontSize: 8 },
                            headStyles: { fillColor: [31, 58, 95] },
                            tableWidth: 'auto',
                          });
                          // Monthly table
                          const finalY = (doc as any).lastAutoTable.finalY + 10;
                          (doc as any).autoTable({
                            head: [monthlySummaryFields.map((f) => f.label)],
                            body: summaryData.monthlySummary.map((row) =>
                              monthlySummaryFields.map((f) => row[f.key as keyof MonthlySalesReport] ?? "-")
                            ),
                            startY: finalY,
                            styles: { fontSize: 8 },
                            headStyles: { fillColor: [31, 58, 95] },
                            tableWidth: 'auto',
                          });
                          doc.save("Daily_Summary_Report.pdf");
                        } else {
                          alert("No summary data to export.");
                        }
                      } else if (isDetailReport) {
                        const cols = currentFieldList.filter((f) =>
                          selectedFields.includes(f.key)
                        );
                        exportToPDF(filteredDetailRows, cols);
                      } else {
                        alert("PDF export for this report not implemented yet.");
                      }
                    }}
                  >
                    Export as PDF
                  </button>
                </li>
              </ul>
            )}
          </div>

          <button
            className="btn rp-btn-outline"
            title="Refresh"
            onClick={() => {
              if (activeReport === "dailysummary") {
                fetchDailySummary();
              } else if (isDetailReport) {
                refreshDetailReport();
              }
            }}
          >
            <i className="bi bi-arrow-clockwise" />&#8635;
          </button>
          <button
            className="btn rp-btn-outline-danger"
            title="Close"
            onClick={() => navigate("/hotel-master/HotelBookingPanel")}
          >
            &#10005;
          </button>
        </div>
      </div>

      {/* Column / Field Selectors */}
      <div className="d-flex align-items-center justify-content-between px-3 pt-3 pb-2 flex-wrap gap-2">
        <div className="d-flex align-items-center gap-3">
          <h6 className="fw-bold mb-0">{activeLabel}</h6>
          {/* Dropdown for Daily Summary View Toggle */}
          {activeReport === "dailysummary" && (
            <div className="dropdown" style={{ position: "relative" }}>
              <button
                className="btn rp-btn-outline btn-sm dropdown-toggle fw-semibold"
                type="button"
                onClick={() => setSummaryView((prev) => (prev === 'daily' ? 'monthly' : 'daily'))}
              >
                {summaryView === 'daily' ? 'Daily View' : 'Monthly View'}
              </button>
            </div>
          )}
        </div>

        {isDetailReport && (
          <div className="dropdown" style={{ position: "relative" }} ref={fieldRef}>
            <button
              className="btn rp-btn-outline btn-sm fw-semibold"
              type="button"
              onClick={() => setFieldDropdownOpen((v) => !v)}
            >
              Select Fields
            </button>
            {fieldDropdownOpen && (
              <div
                className="dropdown-menu rp-panel show p-3 shadow-sm"
                style={{
                  display: "block",
                  width: 360,
                  maxHeight: 420,
                  overflowY: "auto",
                  position: "absolute",
                  top: "calc(100% + 4px)",
                  right: 0,
                  zIndex: 1000,
                }}
              >
                <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-2">
                  <span className="small fw-bold text-uppercase rp-panel-header">
                    Choose columns
                  </span>
                  <button
                    type="button"
                    className="btn btn-link rp-btn-link btn-sm p-0"
                    onClick={toggleAllFields}
                  >
                    {selectedFields.length === currentFieldList.length
                      ? "Clear all"
                      : "Select all"}
                  </button>
                </div>
                <div className="row row-cols-2 g-1">
                  {currentFieldList.map((f) => (
                    <div className="col" key={f.key}>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`fld_${f.key}`}
                          checked={selectedFields.includes(f.key)}
                          onChange={() => toggleField(f.key)}
                        />
                        <label className="form-check-label small" htmlFor={`fld_${f.key}`}>
                          {f.label}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!isDetailReport && currentReport && activeReport !== "dailysummary" && (
          <div className="dropdown" style={{ position: "relative" }} ref={columnRef}>
            <button
              className="btn rp-btn-outline btn-sm fw-semibold"
              type="button"
              onClick={() => setColumnDropdownOpen((v) => !v)}
            >
              Select Columns
            </button>
            {columnDropdownOpen && (
              <div
                className="dropdown-menu rp-panel show p-3 shadow-sm"
                style={{
                  display: "block",
                  width: 360,
                  maxHeight: 420,
                  overflowY: "auto",
                  position: "absolute",
                  top: "calc(100% + 4px)",
                  right: 0,
                  zIndex: 1000,
                }}
              >
                <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-2">
                  <span className="small fw-bold text-uppercase rp-panel-header">
                    Choose columns
                  </span>
                  <button
                    type="button"
                    className="btn btn-link rp-btn-link btn-sm p-0"
                    onClick={() => toggleAllSimpleColumns(activeReport as SimpleReportKey)}
                  >
                    {simpleSelectedColumns[activeReport as SimpleReportKey]?.length ===
                    currentReport.columns.length
                      ? "Clear all"
                      : "Select all"}
                  </button>
                </div>
                <div className="row row-cols-2 g-1">
                  {currentReport.columns.map((col) => (
                    <div className="col" key={col}>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`col_${col}`}
                          checked={(simpleSelectedColumns[activeReport as SimpleReportKey] || []).includes(
                            col
                          )}
                          onChange={() =>
                            toggleSimpleColumn(activeReport as SimpleReportKey, col)
                          }
                        />
                        <label className="form-check-label small" htmlFor={`col_${col}`}>
                          {col}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Table Area */}
      <div className="table-responsive">
        {isDetailReport ? (
          renderDetailTable()
        ) : activeReport === "dailysummary" ? (
          renderSummaryTables()
        ) : (
          <>
            {activeReport === "payment" && paymentLoading && (
              <div className="text-center py-5" style={{ color: "var(--rp-text-muted)" }}>
                <div
                  className="spinner-border spinner-border-sm me-2"
                  style={{ color: "var(--rp-primary)" }}
                  role="status"
                />
                Loading payment report...
              </div>
            )}
            {activeReport === "payment" && paymentError && (
              <div
                className="text-center py-5 mx-3 my-3 rounded"
                style={{ background: "var(--rp-danger-soft)", color: "var(--rp-danger)" }}
              >
                <i className="bi bi-exclamation-triangle-fill d-block mb-2" style={{ fontSize: 20 }} />
                {paymentError}
                <div>
                  <button className="btn btn-sm rp-btn-outline-danger mt-3" onClick={fetchPaymentReport}>
                    Retry
                  </button>
                </div>
              </div>
            )}
            {!paymentLoading && !paymentError && filteredReport && renderSimpleTable(filteredReport)}
          </>
        )}
      </div>
    </div>
  );
}