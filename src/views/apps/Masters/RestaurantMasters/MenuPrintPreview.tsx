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
interface DepartmentDetail {
  departmentid: number;
  department_name: string;
  item_rate: number;
  unitid: number | null;
  servingunitid: number | null;
  IsConversion: number;
  variant_value_id: number | null;
  value_name: string | null;
  taxgroupid: number | null;
}

interface MenuPrintItem {
  restitemid: number;
  item_no: string | null;
  item_name: string;
  print_name: string | null;
  short_name: string | null;
  price: number;
  status: number;
  groupname?: string;
  department_details?: DepartmentDetail[];
}

// ─────────────────────────────────────────────
// STYLES — 80mm Thermal Paper Design
// ─────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&display=swap');

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  .menu-page {
    background: #e8e4d8;
    min-height: 100vh;
    padding: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    font-family: 'Courier Prime', 'Courier New', Courier, monospace;
  }
  
  .menu-toolbar {
    display: flex; 
    justify-content: space-between; 
    align-items: center;
    background: #2c2825; 
    border-radius: 8px; 
    padding: 8px 12px;
    margin-bottom: 12px; 
    width: 100%;
    max-width: 400px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  }
  
  .menu-toolbar-left { 
    display: flex; 
    align-items: center; 
    gap: 10px; 
  }
  
  .menu-toolbar-title {
    font-family: 'Courier Prime', monospace; 
    font-size: 12px;
    font-weight: 700; 
    color: #f0ebe0; 
    letter-spacing: 1px; 
  }
  
  .menu-btn-back {
    background: transparent !important; 
    border: 1px solid #7a6f62 !important;
    color: #d4cdc3 !important; 
    font-size: 11px !important; 
    border-radius: 6px !important;
    padding: 4px 8px !important; 
    display: flex; 
    align-items: center; 
    gap: 4px;
  }
  
  .menu-btn-back:hover { 
    background: #3e3530 !important; 
    border-color: #a89880 !important; 
    color: #fff !important; 
  }
  
  .menu-btn-print {
    background: #e8520a !important; 
    border: none !important; 
    color: #fff !important;
    font-size: 11px !important; 
    border-radius: 6px !important; 
    padding: 5px 12px !important;
    display: flex; 
    align-items: center; 
    gap: 5px; 
    font-weight: 700;
  }
  
  .menu-btn-print:hover:not(:disabled) {
    background: #c94408 !important; 
  }
  
  .menu-btn-print:disabled { 
    opacity: 0.6; 
  }

  /* Thermal Receipt Container - 80mm width */
  .menu-receipt-wrap {
    width: 80mm;
    max-width: 80mm;
    margin: 0 auto;
    background: white;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  }
  
  .menu-receipt-top {
    height: 8px;
    background: repeating-linear-gradient(90deg, #f0ebe0 0px, #f0ebe0 6px, #d8d2c5 6px, #d8d2c5 12px);
  }
  
  .menu-receipt-body {
    background: white;
    padding: 6px 8px 12px;
    width: 100%;
    max-height: 70vh;
    overflow-y: auto;
    overflow-x: auto;
  }
  
  .menu-receipt-bottom {
    height: 8px;
    background: #f5f0e4;
    clip-path: polygon(
      0 0, 4% 100%, 8% 40%, 12% 100%, 16% 40%, 20% 100%,
      24% 40%, 28% 100%, 32% 40%, 36% 100%, 40% 40%, 44% 100%,
      48% 40%, 52% 100%, 56% 40%, 60% 100%, 64% 40%, 68% 100%,
      72% 40%, 76% 100%, 80% 40%, 84% 100%, 88% 40%, 92% 100%,
      96% 40%, 100% 100%, 100% 0
    );
  }
  
  .menu-empty { 
    text-align: center; 
    padding: 40px 20px; 
    color: #6b6055; 
  }
  
  /* Thermal Receipt Content Styles */
  .rc { 
    font-family: 'Courier Prime', 'Courier New', Courier, monospace; 
    font-size: 9px; 
    color: #000; 
    line-height: 1.3;
  }
  
  .rc-hotel { 
    font-size: 14px; 
    font-weight: 700; 
    text-align: center; 
    letter-spacing: 2px; 
    text-transform: uppercase; 
    margin-bottom: 3px; 
    padding-bottom: 3px; 
    border-bottom: 1px solid #000;
  }
  
  .rc-meta { 
    text-align: center; 
    font-size: 8px; 
    color: #444;
    margin-bottom: 2px; 
  }
  
  .rc-section { 
    font-size: 9px; 
    font-weight: 700; 
    text-align: center; 
    text-transform: uppercase; 
    border-top: 1px solid #000;
    border-bottom: 1px solid #000;
    padding: 2px 0; 
    margin: 6px 0 3px; 
  }
  
  .rc-hr-dash { 
    border: none; 
    border-top: 1px dashed #888; 
    margin: 4px 0; 
  }
  
  /* Table Styles for Thermal Printer */
  .thermal-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 7.5px;
    margin: 3px 0;
  }
  
  .thermal-table th,
  .thermal-table td {
    border: 0.5px solid #000;
    padding: 2px 3px;
    vertical-align: top;
  }
  
  .thermal-table th {
    background-color: #e8e0d0;
    font-weight: 700;
    text-align: center;
    font-size: 7px;
  }
  
  .thermal-table td {
    font-size: 7.5px;
  }
  
  .rate-cell {
    text-align: right;
    font-weight: 600;
    white-space: nowrap;
  }
  
  .item-code {
    font-weight: 700;
    white-space: nowrap;
  }
  
  .item-name-cell {
    word-break: break-word;
    max-width: 120px;
  }
  
  .short-name-text {
    font-size: 6px;
    color: #555;
  }
  
  .rc-footer {
    text-align: center;
    font-size: 7px;
    color: #666;
    margin-top: 6px;
    padding-top: 4px;
    border-top: 1px dashed #888;
  }
  
  /* Scrollbar for preview only */
  .menu-receipt-body::-webkit-scrollbar {
    width: 4px;
    height: 4px;
  }
  
  .menu-receipt-body::-webkit-scrollbar-track {
    background: #f0ebe0;
  }
  
  .menu-receipt-body::-webkit-scrollbar-thumb {
    background: #c8bfae;
    border-radius: 2px;
  }
`;

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const fmt = (n: number) => Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

// Helper function to sort by item code
const sortByItemCode = (a: MenuPrintItem, b: MenuPrintItem) => {
  const codeA = a.item_no || '';
  const codeB = b.item_no || '';
  
  const numA = parseInt(codeA, 10);
  const numB = parseInt(codeB, 10);
  
  if (!isNaN(numA) && !isNaN(numB)) {
    return numA - numB;
  }
  
  return codeA.localeCompare(codeB, undefined, { numeric: true, sensitivity: 'base' });
};

// Truncate text for thermal printer
const truncate = (text: string, maxLen: number) => {
  if (!text) return '';
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen - 2) + '..';
};

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
const MenuPrintPreview: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [menuItems, setMenuItems] = useState<MenuPrintItem[]>([]);
  const [businessDate, setBusinessDate] = useState('');
  const [printerName, setPrinterName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("menuPrintItems");
    const date = sessionStorage.getItem("menuPrintDate") || new Date().toLocaleDateString('en-IN');
    
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setMenuItems(parsed);
        setBusinessDate(date);
      } catch (error) {
        console.error("Failed to parse menu data:", error);
        toast.error("Failed to parse menu data");
        navigate("/apps/Menu");
      }
    } else {
      toast.error("No menu data found. Please try again.");
      navigate("/apps/Menu");
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
      }
    };
    fetchPrinter();
  }, [user]);

  const hotelName = user?.hotel_name || 'Menu Report';
  const outletName = user?.outlet_name || '';
  const hasData = menuItems.length > 0;

  // Get all unique departments from all items
  const getAllDepartments = () => {
    const departmentsMap = new Map<number, string>();
    
    menuItems.forEach(item => {
      if (item.department_details && item.department_details.length > 0) {
        item.department_details.forEach(dept => {
          if (!departmentsMap.has(dept.departmentid)) {
            departmentsMap.set(dept.departmentid, truncate(dept.department_name || `Dept ${dept.departmentid}`, 12));
          }
        });
      }
    });
    
    // Return sorted departments
    return Array.from(departmentsMap.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([id, name]) => ({ id, name }));
  };

  // Get rate for a specific item and department
  const getRateForDepartment = (item: MenuPrintItem, departmentId: number): number => {
    if (item.department_details && item.department_details.length > 0) {
      const dept = item.department_details.find(d => d.departmentid === departmentId);
      if (dept) {
        return dept.item_rate || 0;
      }
    }
    return item.price || 0;
  };

  const departments = getAllDepartments();
  const sortedItems = [...menuItems].sort(sortByItemCode);
  const totalItems = sortedItems.length;

  // Build print HTML for 80mm thermal printer - SHOWS ALL ITEMS
  const buildPrintHTML = () => {
    const deptCount = departments.length;
    const codeWidth = deptCount > 2 ? '14%' : '12%';
    const nameWidth = deptCount > 2 ? '30%' : '25%';
    const deptWidth = deptCount > 2 ? `${Math.floor(56 / deptCount)}%` : `${Math.floor(63 / deptCount)}%`;
    
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 9px;
            width: 78mm;
            margin: 0 auto;
            padding: 2mm 1mm;
            background: white;
            color: black;
          }
          .print-header {
            text-align: center;
            margin-bottom: 6px;
            padding-bottom: 4px;
            border-bottom: 1px solid #000;
          }
          .hotel-name {
            font-size: 14px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .outlet-name {
            font-size: 9px;
            margin-top: 2px;
          }
          .report-title {
            font-size: 10px;
            font-weight: bold;
            margin-top: 4px;
          }
          .report-date {
            font-size: 7px;
            margin-top: 2px;
            color: #333;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 5px;
            font-size: 7.5px;
          }
          th, td {
            border: 0.5px solid #000;
            padding: 2px 3px;
            vertical-align: top;
          }
          th {
            background-color: #e8e0d0;
            font-weight: bold;
            text-align: center;
            font-size: 7px;
            padding: 2px 2px;
          }
          td {
            font-size: 7.5px;
          }
          .rate-cell {
            text-align: right;
            font-weight: bold;
            white-space: nowrap;
          }
          .item-code {
            font-weight: bold;
            white-space: nowrap;
          }
          .item-name-cell {
            word-break: break-word;
          }
          .footer {
            text-align: center;
            margin-top: 8px;
            padding-top: 4px;
            border-top: 1px dashed #888;
            font-size: 6px;
          }
          @media print {
            body {
              margin: 0;
              padding: 1mm;
            }
            th {
              background-color: #e8e0d0 !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-header">
          <div class="hotel-name">${truncate(hotelName, 24)}</div>
          ${outletName ? `<div class="outlet-name">${truncate(outletName, 28)}</div>` : ''}
          <div class="report-title">MENU RATES</div>
          <div class="report-date">${businessDate} | Total: ${totalItems} items</div>
        </div>
    `;

    if (sortedItems.length === 0) {
      html += `<div style="text-align:center; padding:20px;">No items found.</div>`;
    } else {
      html += `
        <table>
          <thead>
            <tr>
              <th style="width:${codeWidth}">Code</th>
              <th style="width:${nameWidth}">Item</th>
              ${departments.map(dept => `<th style="width:${deptWidth}">${dept.name}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
      `;

      // SHOW ALL ITEMS - NO LIMIT
      sortedItems.forEach(item => {
        const itemName = truncate(item.item_name, deptCount > 2 ? 18 : 25);
        html += `
          <tr>
            <td class="item-code">${item.item_no || '-'}</td>
            <td class="item-name-cell">
              ${itemName}
              ${item.short_name ? `<br><span style="font-size:5.5px;">(${truncate(item.short_name, 12)})</span>` : ''}
            </td>
            ${departments.map(dept => {
              const rate = getRateForDepartment(item, dept.id);
              return `<td class="rate-cell">${fmt(rate)}</td>`;
            }).join('')}
          </tr>
        `;
      });

      html += `
          </tbody>
        </table>
      `;
    }

    html += `
        <div class="footer">
          Total: ${totalItems} items | Printed: ${new Date().toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          <br>*** END OF REPORT ***
        </div>
      </body>
      </html>
    `;

    return html;
  };

  const handlePrint = async () => {
    if (!menuItems.length) { 
      toast.error("No menu data available"); 
      return; 
    }
    
    try {
      setLoading(true);
      const printersRaw = (await (window as any).electronAPI?.getInstalledPrinters?.()) || [];
      const printers = Array.isArray(printersRaw) ? printersRaw : [];
      
      if (!printers.length) { 
        toast.error("No printers found"); 
        return; 
      }

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

      if (!finalPrinter) { 
        toast.error("No printer available"); 
        return; 
      }

      const printHTML = buildPrintHTML();

      if ((window as any).electronAPI?.directPrint) {
        await (window as any).electronAPI.directPrint(printHTML, finalPrinter);
        toast.success(`Printed ${totalItems} items successfully!`);
      } else {
        const printWindow = window.open('', '_blank', 'width=450,height=700');
        if (printWindow) {
          printWindow.document.write(printHTML);
          printWindow.document.close();
          printWindow.print();
          toast.success("Print dialog opened");
        } else {
          toast.error("Please allow popups to print");
        }
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
      <div className="menu-page">
        {hasData ? (
          <>
            <div className="menu-toolbar">
              <div className="menu-toolbar-left">
                <Button className="menu-btn-back" size="sm" onClick={() => navigate("/apps/Menu")}>
                  <ArrowLeft size={12} /> Back
                </Button>
                <span className="menu-toolbar-title">Menu Report</span>
              </div>
              <Button className="menu-btn-print" size="sm" onClick={handlePrint} disabled={loading}>
                <Printer size={12} />
                {loading ? "..." : `Print (${totalItems})`}
              </Button>
            </div>

            {/* Thermal Printer Preview - Shows ALL Items */}
            <div className="menu-receipt-wrap">
              <div className="menu-receipt-top" />
              <div className="menu-receipt-body">
                <div className="rc">
                  <div className="rc-hotel">{truncate(hotelName, 28)}</div>
                  {outletName && <div className="rc-meta">{truncate(outletName, 32)}</div>}
                  <div className="rc-meta">MENU RATES | {businessDate}</div>
                  <div className="rc-meta">Total Items: {totalItems} | Departments: {departments.length}</div>
                  <div className="rc-hr-dash" />

                  <div style={{ overflowX: 'auto' }}>
                    <table className="thermal-table">
                      <thead>
                        <tr>
                          <th style={{ width: departments.length > 2 ? '14%' : '12%' }}>Code</th>
                          <th style={{ width: departments.length > 2 ? '30%' : '25%' }}>Item</th>
                          {departments.map(dept => (
                            <th key={dept.id} style={{ width: departments.length > 2 ? `${Math.floor(56 / departments.length)}%` : `${Math.floor(63 / departments.length)}%` }}>
                              {dept.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {/* SHOW ALL ITEMS - NO LIMIT */}
                        {sortedItems.map(item => (
                          <tr key={item.restitemid}>
                            <td className="item-code">{item.item_no || '-'}</td>
                            <td className="item-name-cell">
                              {truncate(item.item_name, departments.length > 2 ? 18 : 22)}
                              {item.short_name && (
                                <div className="short-name-text">({truncate(item.short_name, 12)})</div>
                              )}
                            </td>
                            {departments.map(dept => {
                              const rate = getRateForDepartment(item, dept.id);
                              return <td key={dept.id} className="rate-cell">{fmt(rate)}</td>;
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="rc-hr-dash" />
                  <div className="rc-footer">
                    Total: {totalItems} items | Printed: {new Date().toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
              <div className="menu-receipt-bottom" />
            </div>
          </>
        ) : (
          <div className="menu-empty">
            <Printer size={36} strokeWidth={1.2} />
            <h6>No Menu Data Found</h6>
            <p style={{ fontSize: '9px', marginTop: '8px', color: '#999' }}>
              Please go back and try again.
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default MenuPrintPreview;