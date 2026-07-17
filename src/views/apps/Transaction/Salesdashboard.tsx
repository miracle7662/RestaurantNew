import { useState, useEffect } from "react";
import OrdersService from '@/common/api/orders';

// ============ TYPES ============
interface DepartmentRow {
  name: string;
  icon: "tandoor" | "extra" | "delivery";
  kot: number;
  billed: number | null;
  total: number;
}

interface SalesDashboardModalProps {
  show?: boolean;
  onHide?: () => void;
  curr_Date?: string;
  hotelId?: number;
  outletId?: number;
}

// ============ COLORS ============
const colors = {
  bgPrimary: "#ffffff",
  bgSecondary: "#f4f3f0",
  bgInfo: "#e6f1fb",
  textPrimary: "#1a1a18",
  textSecondary: "#5f5e5a",
  textTertiary: "#888780",
  textInfo: "#0c447c",
  border: "rgba(0,0,0,0.12)",
  highlightBg: "#f0f7ff", // Light blue background for total row
};

// ============ HELPER FUNCTIONS ============
function formatINR(value: number): string {
  return new Intl.NumberFormat("en-IN").format(value);
}

// ============ MAIN MODAL COMPONENT ============
export default function SalesDashboardModal({ 
  show, 
  onHide, 
  curr_Date, 
  hotelId, 
  outletId 
}: SalesDashboardModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<DepartmentRow[]>([]);
  const [totals, setTotals] = useState({ kot: 0, billed: 0, total: 0 });
  const [currentDateTime, setCurrentDateTime] = useState('');

  // Fetch data when modal opens
  useEffect(() => {
    console.log("useEffect Fired", {
      show,
      curr_Date,
      hotelId,
      outletId,
    });

    if (show && curr_Date && hotelId && outletId) {
      console.log("Calling fetchDepartmentSales()");
      fetchDepartmentSales();
    }
  }, [show, curr_Date, hotelId, outletId]);

  const fetchDepartmentSales = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await OrdersService.getDepartmentSales(
        curr_Date!,
        hotelId!,
        outletId!
      );
      console.log("Department Sales Response:", response);
      
      if (response.success && response.data) {
        const mappedDepartments: DepartmentRow[] = response.data.map((item: any) => {
          let icon: "tandoor" | "extra" | "delivery" = "delivery";
          const nameLower = item.department_name.toLowerCase();
          
          if (nameLower.includes('tandoor') && !nameLower.includes('extra')) {
            icon = "tandoor";
          } else if (nameLower.includes('extra')) {
            icon = "extra";
          }

          return {
            name: item.department_name,
            icon: icon,
            kot: Number(item.kot_sale) || 0,
            billed: item.billed_sale !== null && item.billed_sale !== undefined ? Number(item.billed_sale) : null,
            total: Number(item.total_sale) || 0
          };
        });

        setDepartments(mappedDepartments);

        if (response.totals) {
          setTotals({
            kot: Number(response.totals.kot_sale) || 0,
            billed: Number(response.totals.billed_sale) || 0,
            total: Number(response.totals.total_sale) || 0
          });
        } else {
          const calculatedTotals = mappedDepartments.reduce(
            (acc, row) => ({
              kot: acc.kot + row.kot,
              billed: acc.billed + (row.billed ?? 0),
              total: acc.total + row.total,
            }),
            { kot: 0, billed: 0, total: 0 }
          );
          setTotals(calculatedTotals);
        }

        const now = new Date();
        const formattedDate = now.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
        const formattedTime = now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit'
        });
        setCurrentDateTime(`${formattedDate}, ${formattedTime}`);
      } else {
        setError(response.message || 'Failed to fetch sales data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching department sales:', err);
    } finally {
      setLoading(false);
    }
  };

  if (show === false) {
    return null;
  }

  return (
    <>
      {/* Overlay/Backdrop */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onClick={onHide}
      >
        {/* Modal Content */}
        <div
          style={{
            maxWidth: 420,
            width: "100%",
            margin: "0 auto",
            background: colors.bgPrimary,
            borderRadius: 12,
            border: `0.5px solid ${colors.border}`,
            overflow: "hidden",
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            color: colors.textPrimary,
            position: "relative",
            zIndex: 1000,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onHide}
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              background: "none",
              border: "none",
              fontSize: 20,
              cursor: "pointer",
              color: colors.textSecondary,
              padding: "4px 8px",
              borderRadius: 4,
            }}
          >
            ✕
          </button>

          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 16px",
              borderBottom: `0.5px solid ${colors.border}`,
            }}
          >
            <div>
              <p style={{ fontSize: 16, fontWeight: 500, margin: 0 }}>
                Sales update
              </p>
              <p
                style={{
                  fontSize: 12,
                  color: colors.textSecondary,
                  margin: "2px 0 0",
                }}
              >
                {currentDateTime || 'Loading...'}
              </p>
            </div>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: colors.bgSecondary,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke={colors.textSecondary}
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M5 12h14" />
                <path d="M15 7c0 -2 -1.5 -3 -3 -3s-3 1 -3 3" />
                <path d="M5 12a7 7 0 0 0 14 0" />
                <path d="M5 12l-1 7h16l-1 -7" />
              </svg>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <p style={{ color: colors.textSecondary }}>Loading sales data...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <p style={{ color: '#d32f2f' }}>Error: {error}</p>
              <button
                onClick={fetchDepartmentSales}
                style={{
                  marginTop: 10,
                  padding: '8px 16px',
                  background: colors.bgInfo,
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  color: colors.textInfo,
                }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Data Display */}
          {!loading && !error && departments.length > 0 && (
            <>
              {/* Metric cards */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: 10,
                  padding: 16,
                }}
              >
                <div
                  style={{
                    background: colors.bgSecondary,
                    borderRadius: 8,
                    padding: "12px 10px",
                  }}
                >
                  <p
                    style={{
                      fontSize: 11,
                      color: colors.textSecondary,
                      margin: "0 0 4px",
                    }}
                  >
                    KOT sale
                  </p>
                  <p style={{ fontSize: 17, fontWeight: 500, margin: 0 }}>
                    {formatINR(totals.kot)}
                  </p>
                </div>
                <div
                  style={{
                    background: colors.bgSecondary,
                    borderRadius: 8,
                    padding: "12px 10px",
                  }}
                >
                  <p
                    style={{
                      fontSize: 11,
                      color: colors.textSecondary,
                      margin: "0 0 4px",
                    }}
                  >
                    Billed sale
                  </p>
                  <p style={{ fontSize: 17, fontWeight: 500, margin: 0 }}>
                    {formatINR(totals.billed)}
                  </p>
                </div>
                <div
                  style={{
                    background: colors.bgInfo,
                    borderRadius: 8,
                    padding: "12px 10px",
                  }}
                >
                  <p
                    style={{
                      fontSize: 11,
                      color: colors.textInfo,
                      margin: "0 0 4px",
                    }}
                  >
                    Total sale
                  </p>
                  <p
                    style={{
                      fontSize: 17,
                      fontWeight: 500,
                      margin: 0,
                      color: colors.textInfo,
                    }}
                  >
                    {formatINR(totals.total)}
                  </p>
                </div>
              </div>

              {/* Table */}
              <div style={{ padding: "0 16px 16px" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    tableLayout: "fixed",
                  }}
                >
                  <thead>
                    <tr>
                      <th
                        style={{
                          textAlign: "left",
                          fontSize: 12,
                          fontWeight: 500,
                          color: colors.textSecondary,
                          padding: "8px 6px",
                          borderBottom: `0.5px solid ${colors.border}`,
                        }}
                      >
                        Department
                      </th>
                      <th
                        style={{
                          textAlign: "right",
                          fontSize: 12,
                          fontWeight: 500,
                          color: colors.textSecondary,
                          padding: "8px 6px",
                          borderBottom: `0.5px solid ${colors.border}`,
                        }}
                      >
                        KOT
                      </th>
                      <th
                        style={{
                          textAlign: "right",
                          fontSize: 12,
                          fontWeight: 500,
                          color: colors.textSecondary,
                          padding: "8px 6px",
                          borderBottom: `0.5px solid ${colors.border}`,
                        }}
                      >
                        Billed
                      </th>
                      <th
                        style={{
                          textAlign: "right",
                          fontSize: 12,
                          fontWeight: 500,
                          color: colors.textSecondary,
                          padding: "8px 6px",
                          borderBottom: `0.5px solid ${colors.border}`,
                        }}
                      >
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {departments.map((row) => (
                      <tr key={row.name}>
                        <td
                          style={{
                            padding: "10px 6px",
                            fontSize: 13,
                            borderBottom: `0.5px solid ${colors.border}`,
                          }}
                        >
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              color: colors.textPrimary,
                            }}
                          >
                            <span style={{ color: colors.textSecondary, display: "inline-flex" }}>
                              {/* Icon placeholder */}
                            </span>
                            {row.name}
                          </span>
                        </td>
                        <td
                          style={{
                            textAlign: "right",
                            padding: "10px 6px",
                            fontSize: 13,
                            borderBottom: `0.5px solid ${colors.border}`,
                          }}
                        >
                          {formatINR(row.kot)}
                        </td>
                        <td
                          style={{
                            textAlign: "right",
                            padding: "10px 6px",
                            fontSize: 13,
                            color: row.billed === null ? colors.textTertiary : colors.textPrimary,
                            borderBottom: `0.5px solid ${colors.border}`,
                          }}
                        >
                          {row.billed === null ? "—" : formatINR(row.billed)}
                        </td>
                        <td
                          style={{
                            textAlign: "right",
                            padding: "10px 6px",
                            fontSize: 13,
                            fontWeight: 500,
                            borderBottom: `0.5px solid ${colors.border}`,
                          }}
                        >
                          {formatINR(row.total)}
                        </td>
                      </tr>
                    ))}
                    {/* Total Row - HIGHLIGHTED & BOLD */}
                    <tr style={{ 
                      background: colors.highlightBg,
                      borderTop: `2px solid ${colors.textInfo}`,
                    }}>
                      <td style={{ 
                        padding: "12px 6px", 
                        fontSize: 14, 
                        fontWeight: 700,  // BOLD
                        color: colors.textInfo,
                        borderBottom: `2px solid ${colors.textInfo}`,
                      }}>
                        Total
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          padding: "12px 6px",
                          fontSize: 14,
                          fontWeight: 700,  // BOLD
                          color: colors.textInfo,
                          borderBottom: `2px solid ${colors.textInfo}`,
                        }}
                      >
                        {formatINR(totals.kot)}
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          padding: "12px 6px",
                          fontSize: 14,
                          fontWeight: 700,  // BOLD
                          color: colors.textInfo,
                          borderBottom: `2px solid ${colors.textInfo}`,
                        }}
                      >
                        {formatINR(totals.billed)}
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          padding: "12px 6px",
                          fontSize: 14,
                          fontWeight: 700,  // BOLD
                          color: colors.textInfo,
                          borderBottom: `2px solid ${colors.textInfo}`,
                        }}
                      >
                        {formatINR(totals.total)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Empty State */}
          {!loading && !error && departments.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <p style={{ color: colors.textSecondary }}>No sales data available</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}