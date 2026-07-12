import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
// Bootstrap CSS must be loaded globally, e.g., in _app.tsx
// import "bootstrap/dist/css/bootstrap.min.css";

import CheckInService from "@/common/hotel/checkIn";
import { useAuthContext } from '@/common/context/useAuthContext'

// --------------------------------------------------------------------
// Types
// --------------------------------------------------------------------
type SimpleReportKey = "occupancy" | "dailysell" | "payment" | "pending" | "agent";
type ReportKey = SimpleReportKey | "guest";

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

// Matches columns returned by sp_daily_sales_summary
interface GuestReportRow {
  guest_id: string | number;
  guest_name: string;
  mobile: string;
  email: string;
  organisation: string;
  guest_type: string;
  gender: string;
  company_id: string | number;
  company_name: string;
  company_gst: string;
  company_mobile: string;
  company_email: string;
  company_credit_limit: string | number;
  company_credit_allowed: string;
  unique_rooms_used: string | number;
  room_numbers_used: string;
  room_categories_used: string;
  room_details: string;
  most_used_room: string;
  preferred_room_category: string;
  total_ldg_bills: string | number;
  ldg_bill_numbers: string;
  registration_numbers: string;
  booking_references: string;
  total_stays: string | number;
  total_checkouts: string | number;
  total_room_nights: string | number;
  avg_stay_duration: string | number;
  total_room_revenue: string | number;
  total_extra_charges: string | number;
  total_child_charges: string | number;
  total_driver_charges: string | number;
  total_service_charge: string | number;
  total_cess: string | number;
  total_discounts_received: string | number;
  total_cgst: string | number;
  total_sgst: string | number;
  total_igst: string | number;
  total_spent: string | number;
  total_advance_paid: string | number;
  first_visit: string;
  last_visit: string;
  customer_lifecycle_days: string | number;
  avg_amount_per_stay: string | number;
  loyalty_level: string;
  total_payment_received: string | number;
  total_tips_given: string | number;
  total_refunds_received: string | number;
}

interface GuestReport {
  title: string;
  fields: FieldDef[];
  defaultFields: string[];
}

// --------------------------------------------------------------------
// Static data
// --------------------------------------------------------------------
const simpleReports: Record<SimpleReportKey, SimpleReport> = {
  occupancy: {
    title: "Occupancy Report",
    columns: [
      "#",
      "Room No",
      "Room Category",
      "Converted Category",
      "Guest",
      "Total Days",
      "Total Amt",
      "Discount %",
      "Pay Type",
      "Adults",
      "Pax",
      "Ex-Pax",
      "Child",
      "Driver",
    ],
    rows: [],
    footerLabel: "Total Rooms:",
    footerCol: 5,
    footerAmtCol: 6,
  },
  dailysell: {
    title: "Daily Sell Report",
    columns: [
      "#",
      "Date",
      "Room No",
      "Room Category",
      "Guest",
      "Nights",
      "Rate",
      "Tax",
      "Total Amt",
      "Pay Type",
    ],
    rows: [],
    footerLabel: "Total Bookings:",
    footerCol: 5,
    footerAmtCol: 8,
  },
  payment: {
    title: "Payment Mode Report",
    columns: ["#", "Date", "Guest", "Room No", "Pay Type", "Amount", "Reference No"],
    rows: [],
    footerLabel: "Total Transactions:",
    footerCol: 5,
    footerAmtCol: 5,
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

const guestReport: GuestReport = {
  title: "Guest Report",
  fields: [
    { key: "guest_id", label: "Guest ID" },
    { key: "guest_name", label: "Guest Name" },
    { key: "mobile", label: "Mobile" },
    { key: "email", label: "Email" },
    { key: "organisation", label: "Organisation" },
    { key: "guest_type", label: "Guest Type" },
    { key: "gender", label: "Gender" },
    { key: "company_id", label: "Company ID" },
    { key: "company_name", label: "Company Name" },
    { key: "company_gst", label: "Company GST" },
    { key: "company_mobile", label: "Company Mobile" },
    { key: "company_email", label: "Company Email" },
    { key: "company_credit_limit", label: "Company Credit Limit" },
    { key: "company_credit_allowed", label: "Company Credit Allowed" },
    { key: "unique_rooms_used", label: "Unique Rooms Used" },
    { key: "room_numbers_used", label: "Room Numbers Used" },
    { key: "room_categories_used", label: "Room Categories Used" },
    { key: "room_details", label: "Room Details" },
    { key: "most_used_room", label: "Most Used Room" },
    { key: "preferred_room_category", label: "Preferred Room Category" },
    { key: "total_ldg_bills", label: "Total LDG Bills" },
    { key: "ldg_bill_numbers", label: "LDG Bill Numbers" },
    { key: "registration_numbers", label: "Registration Numbers" },
    { key: "booking_references", label: "Booking References" },
    { key: "total_stays", label: "Total Stays" },
    { key: "total_checkouts", label: "Total Checkouts" },
    { key: "total_room_nights", label: "Total Room Nights" },
    { key: "avg_stay_duration", label: "Avg Stay Duration" },
    { key: "total_room_revenue", label: "Total Room Revenue" },
    { key: "total_extra_charges", label: "Total Extra Charges" },
    { key: "total_child_charges", label: "Total Child Charges" },
    { key: "total_driver_charges", label: "Total Driver Charges" },
    { key: "total_service_charge", label: "Total Service Charge" },
    { key: "total_cess", label: "Total Cess" },
    { key: "total_discounts_received", label: "Total Discounts Received" },
    { key: "total_cgst", label: "Total CGST" },
    { key: "total_sgst", label: "Total SGST" },
    { key: "total_igst", label: "Total IGST" },
    { key: "total_spent", label: "Total Spent" },
    { key: "total_advance_paid", label: "Total Advance Paid" },
    { key: "first_visit", label: "First Visit" },
    { key: "last_visit", label: "Last Visit" },
    { key: "customer_lifecycle_days", label: "Customer Lifecycle Days" },
    { key: "avg_amount_per_stay", label: "Avg Amount Per Stay" },
    { key: "loyalty_level", label: "Loyalty Level" },
    { key: "total_payment_received", label: "Total Payment Received" },
    { key: "total_tips_given", label: "Total Tips Given" },
    { key: "total_refunds_received", label: "Total Refunds Received" },
  ],
  defaultFields: [
    "guest_name",
    "mobile",
    "email",
    "guest_type",
    "total_stays",
    "total_room_nights",
    "total_spent",
    "last_visit",
    "loyalty_level",
  ],
};

const reportMenu: { key: ReportKey; label: string }[] = [
  { key: "occupancy", label: "Occupancy Report" },
  { key: "dailysell", label: "Daily Sell Report" },
  { key: "payment", label: "Payment Mode Report" },
  { key: "pending", label: "Pending Payment Report" },
  { key: "agent", label: "Agent Booking Report" },
  { key: "guest", label: "Guest Report" },
];

// --------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------
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

/**
 * Generic hook that closes a dropdown when the user clicks (or focuses)
 * anywhere outside the given container. This replaces the old
 * onBlur + setTimeout hack, which raced against click handlers inside the
 * menu (e.g. "Select all") and often required two clicks to register.
 */
function useClickOutside<T extends HTMLElement>(
  isOpen: boolean,
  onClose: () => void
) {
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
  // -------------------- Auth --------------------
  const { user } = useAuthContext();
  const hotelid = user?.hotelid ?? 1; // fallback if not logged in

  // -------------------- State --------------------
  const [activeReport, setActiveReport] = useState<ReportKey>("occupancy");
  const [fromDate, setFromDate] = useState("2026-01-01"); // wider range to catch existing data
  const [toDate, setToDate] = useState("2026-07-12");
  const [selectedFields, setSelectedFields] = useState<string[]>(guestReport.defaultFields);

  const [guestRows, setGuestRows] = useState<GuestReportRow[]>([]);
  const [guestLoading, setGuestLoading] = useState(false);
  const [guestError, setGuestError] = useState<string | null>(null);

  const [simpleSelectedColumns, setSimpleSelectedColumns] = useState<
    Record<SimpleReportKey, string[]>
  >(() => {
    const initial = {} as Record<SimpleReportKey, string[]>;
    for (const key of Object.keys(simpleReports) as SimpleReportKey[]) {
      initial[key] = [...simpleReports[key].columns];
    }
    return initial;
  });

  // Dropdown open states (React-controlled)
  const [reportDropdownOpen, setReportDropdownOpen] = useState(false);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [fieldDropdownOpen, setFieldDropdownOpen] = useState(false);
  const [columnDropdownOpen, setColumnDropdownOpen] = useState(false);

  // Click-outside refs — clicking anywhere else closes the relevant menu,
  // and clicks *inside* the menu (Select all / Clear all / checkboxes)
  // always register on the first click.
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

  // -------------------- fetchGuestReport --------------------
  const fetchGuestReport = useCallback(
    async (params: {
      hotelid: number;
      fromDate: string;
      toDate: string;
      limit?: number;
    }): Promise<GuestReportRow[]> => {
      const response = await CheckInService.getDailySalesSummary({
        hotelid: params.hotelid,
        start_date: params.fromDate,
        end_date: params.toDate,
        limit: params.limit ?? 100,
      });

      // API returns { success: true, count: number, data: [...] }
      return (response?.data ?? []) as GuestReportRow[];
    },
    []
  );

  // -------------------- Main fetch effect --------------------
  useEffect(() => {
    if (activeReport !== "guest") return;

    let cancelled = false;
    setGuestLoading(true);
    setGuestError(null);

    fetchGuestReport({ hotelid, fromDate, toDate })
      .then((rows) => {
        if (!cancelled) setGuestRows(rows);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setGuestError(err instanceof Error ? err.message : "Failed to load guest report");
          setGuestRows([]);
        }
      })
      .finally(() => {
        if (!cancelled) setGuestLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeReport, fromDate, toDate, hotelid, fetchGuestReport]);

  // -------------------- Refresh handler --------------------
  const refreshGuestReport = () => {
    if (activeReport !== "guest") return;
    setGuestLoading(true);
    setGuestError(null);
    fetchGuestReport({ hotelid, fromDate, toDate })
      .then(setGuestRows)
      .catch((err: unknown) =>
        setGuestError(err instanceof Error ? err.message : "Failed to load guest report")
      )
      .finally(() => setGuestLoading(false));
  };

  // -------------------- Toggle handlers --------------------
  const toggleField = (key: string) => {
    setSelectedFields((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const toggleAllFields = () => {
    setSelectedFields((prev) =>
      prev.length === guestReport.fields.length ? [] : guestReport.fields.map((f) => f.key)
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

  const guestColumns = useMemo(
    () => guestReport.fields.filter((f) => selectedFields.includes(f.key)),
    [selectedFields]
  );

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

  const renderGuestTable = () => {
    if (guestLoading) {
      return (
        <div className="text-center py-5" style={{ color: "var(--rp-text-muted)" }}>
          <div
            className="spinner-border spinner-border-sm me-2"
            style={{ color: "var(--rp-primary)" }}
            role="status"
          />
          Loading guest report...
        </div>
      );
    }

    if (guestError) {
      return (
        <div
          className="text-center py-5 mx-3 my-3 rounded"
          style={{ background: "var(--rp-danger-soft)", color: "var(--rp-danger)" }}
        >
          <i className="bi bi-exclamation-triangle-fill d-block mb-2" style={{ fontSize: 20 }} />
          {guestError}
          <div>
            <button className="btn btn-sm rp-btn-outline-danger mt-3" onClick={refreshGuestReport}>
              Retry
            </button>
          </div>
        </div>
      );
    }

    if (guestColumns.length === 0) {
      return (
        <div className="text-center py-5" style={{ color: "var(--rp-text-muted)" }}>
          <i className="bi bi-columns-gap d-block mb-2" style={{ fontSize: 20 }} />
          No fields selected — use <strong>Select Fields</strong> above to choose columns to display
        </div>
      );
    }

    if (guestRows.length === 0) {
      return (
        <div className="text-center py-5" style={{ color: "var(--rp-text-muted)" }}>
          <i className="bi bi-people d-block mb-2" style={{ fontSize: 20 }} />
          No guest records found for {fromDate} to {toDate}
          <div>
            <button className="btn btn-sm rp-btn-outline mt-3" onClick={refreshGuestReport}>
              Refresh
            </button>
          </div>
        </div>
      );
    }

    return (
      <table className="table table-hover align-middle mb-0">
        <thead className="rp-thead">
          <tr>
            {guestColumns.map((c) => (
              <th key={c.key} className="text-nowrap">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {guestRows.map((row, i) => (
            <tr key={row.guest_id ?? i}>
              {guestColumns.map((c) => (
                <td key={c.key} className="text-nowrap">
                  {formatCell(row[c.key as keyof GuestReportRow])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="rp-tfoot fw-bold">
            <td colSpan={Math.max(guestColumns.length, 1)}>Total Guests: {guestRows.length}</td>
          </tr>
        </tfoot>
      </table>
    );
  };

  const currentSimpleReport = activeReport !== "guest" ? simpleReports[activeReport] : null;

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
      `}</style>
      {/* Toolbar */}
      <div className="d-flex align-items-center gap-3 p-3 border-bottom flex-wrap">
        {/* Report Selection — proper dropdown, shows the active report name */}
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

        {/* Date pickers */}
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

        <div className="ms-auto d-flex gap-2">
          {/* Export Dropdown */}
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
                }}
              >
                <li>
                  <button
                    className="dropdown-item rp-dropdown-item"
                    onClick={() => {
                      setExportDropdownOpen(false);
                      // TODO: implement Excel export
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
                      // TODO: implement PDF export
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
            onClick={activeReport === "guest" ? refreshGuestReport : undefined}
          >
            <i className="bi bi-arrow-clockwise" />&#8635;
          </button>
          <button className="btn rp-btn-outline-danger" title="Close">
            &#10005;
          </button>
        </div>
      </div>

      {/* Column / Field Selectors */}
      <div className="d-flex align-items-center justify-content-between px-3 pt-3 pb-2 flex-wrap gap-2">
        <h6 className="fw-bold mb-0">{activeLabel}</h6>

        {activeReport === "guest" && (
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
                    {selectedFields.length === guestReport.fields.length
                      ? "Clear all"
                      : "Select all"}
                  </button>
                </div>
                <div className="row row-cols-2 g-1">
                  {guestReport.fields.map((f) => (
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

        {activeReport !== "guest" && currentSimpleReport && (
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
                    currentSimpleReport.columns.length
                      ? "Clear all"
                      : "Select all"}
                  </button>
                </div>
                <div className="row row-cols-2 g-1">
                  {currentSimpleReport.columns.map((col) => (
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

      {/* Table */}
      <div className="table-responsive">
        {activeReport === "guest"
          ? renderGuestTable()
          : renderSimpleTable(currentSimpleReport!)}
      </div>
    </div>
  );
}