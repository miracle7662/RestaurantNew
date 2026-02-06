import React, { useState, useEffect } from "react";
import {
  Settings,
  Printer,
  Keyboard,
  User,
  SlidersHorizontal,
} from "lucide-react";


interface KotPrinterSetting {
  id: number;
  printer_name: string;
  source: string;
  order_type: string;
  size: string;
  copies: number;
  outletid: number;
  enableKotPrint: boolean;
}

interface BillPrinterSetting {
  id: number;
  printer_name: string;
  source: string;
  order_type: string;
  size: string;
  copies: number;
  outletid: number;
  enableBillPrint: boolean;
}

interface LabelPrinterSetting {
  id: number;
  printer_name: string;
  paper_width: number;
  is_enabled: boolean;
}

interface ReportPrinterSetting {
  id: number;
  printer_name: string;
  paper_size: string;
  auto_print: boolean;
}

interface DepartmentWisePrinter {
  id: number;
  department: string;
  printer_name: string;
  order_type: string;
  size: string;
  source: string;
  copies: number;
}

interface TableWiseKot {
  id: number;
  table_no: string;
  printer_name: string;
  size: string;
  source: string;
  copies: number;
}

interface TableWiseBill {
  id: number;
  table_no: string;
  printer_name: string;
  size: string;
  source: string;
  copies: number;
}

interface CategoryWisePrinter {
  id: number;
  category: string;
  printer_name: string;
  order_type: string;
  size: string;
  source: string;
  copies: number;
}

interface KDSUser {
  id: number;
  department: string;
  user: string;
  is_active: boolean;
  updated_at: string;
}

function SettingsPage() {
 
  const [activeTab, setActiveTab] = useState("general");
  // const [selectedPrinter, setSelectedPrinter] = useState("");
  const [selectedKotPrinter, setSelectedKotPrinter] = useState("");
  const [selectedBillPrinter, setSelectedBillPrinter] = useState("");
  const [kotEnablePrint, setKotEnablePrint] = useState(true);
  const [billEnablePrint, setBillEnablePrint] = useState(true);
 

  const [printers, setPrinters] = useState<Array<{ name: string; displayName: string }>>([]);


  // State for all printer settings
  const [kotPrinters, setKotPrinters] = useState<KotPrinterSetting[]>([]);
  const [billPrinters, setBillPrinters] = useState<BillPrinterSetting[]>([]);
  const [, setLabelPrinters] = useState<LabelPrinterSetting[]>([]);
  const [reportPrinters, setReportPrinters] = useState<ReportPrinterSetting[]>([]);
  const [departmentPrinters, setDepartmentPrinters] = useState<DepartmentWisePrinter[]>([]);
  const [tableWiseKot, setTableWiseKot] = useState<TableWiseKot[]>([]);
  const [tableWiseBill, setTableWiseBill] = useState<TableWiseBill[]>([]);
  const [categoryPrinters, setCategoryPrinters] = useState<CategoryWisePrinter[]>([]);
  const [, setKdsUsers] = useState<KDSUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [, setEditingKotId] = useState<number | null>(null);
  const [, setEditingBillId] = useState<number | null>(null);
  const [reportPrinterName, setReportPrinterName] = useState("");
  const [reportPaperSize, setReportPaperSize] = useState("80mm");
  const [reportAutoPrint, setReportAutoPrint] = useState(true);


  useEffect(() => {
    const fetchPrinters = async () => {
      try {
        const printerList = await window.electronAPI.getInstalledPrinters();
        console.log('Printers fetched from system:', printerList);
        setPrinters(printerList);
      } catch (error) {
        console.error('Failed to fetch printers:', error);
      }
    };
    fetchPrinters();
  }, []);

  // API Base URL
  const API_BASE = 'http://localhost:3001/api';

  // Generic API functions
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }
    return response.json();
  };

  // Fetch functions for each data type
  const fetchKotPrinters = async () => {
    try {
      const data = await apiCall('/settings/kot-printer-settings');
      setKotPrinters(data);
    } catch (error) {
      console.error('Failed to fetch KOT printers:', error);
    }
  };

  const fetchBillPrinters = async () => {
    try {
      const data = await apiCall('/settings/bill-printer-settings');
      setBillPrinters(data);
    } catch (error) {
      console.error('Failed to fetch bill printers:', error);
    }
  };

  const fetchLabelPrinters = async () => {
    try {
      const data = await apiCall('/settings/label-printer');
      setLabelPrinters(data);
    } catch (error) {
      console.error('Failed to fetch label printers:', error);
    }
  };

  const fetchReportPrinters = async () => {
    try {
      console.log('Fetching report printers...');
      const data = await apiCall('/settings/report-printer');
      console.log('Report printers data:', data);
      setReportPrinters(data);
    } catch (error) {
      console.error('Failed to fetch report printers:', error);
    }
  };

  const fetchDepartmentPrinters = async () => {
    try {
      const data = await apiCall('/settings/department-wise-printer');
      setDepartmentPrinters(data);
    } catch (error) {
      console.error('Failed to fetch department printers:', error);
    }
  };

  const fetchTableWiseKot = async () => {
    try {
      const data = await apiCall('/settings/table-wise-kot');
      setTableWiseKot(data);
    } catch (error) {
      console.error('Failed to fetch table wise KOT:', error);
    }
  };

  const fetchTableWiseBill = async () => {
    try {
      const data = await apiCall('/settings/table-wise-bill');
      setTableWiseBill(data);
    } catch (error) {
      console.error('Failed to fetch table wise bill:', error);
    }
  };

  const fetchCategoryPrinters = async () => {
    try {
      const data = await apiCall('/settings/category-wise-printer');
      setCategoryPrinters(data);
    } catch (error) {
      console.error('Failed to fetch category printers:', error);
    }
  };

  const fetchKdsUsers = async () => {
    try {
      const data = await apiCall('/settings/kds-users');
      setKdsUsers(data);
    } catch (error) {
      console.error('Failed to fetch KDS users:', error);
    }
  };

  // Load all data when printer tab is active
  useEffect(() => {
    if (activeTab === 'printer') {
      fetchKotPrinters();
      fetchBillPrinters();
      fetchLabelPrinters();
      fetchReportPrinters();
      fetchDepartmentPrinters();
      fetchTableWiseKot();
      fetchTableWiseBill();
      fetchCategoryPrinters();
      fetchKdsUsers();
    }
  }, [activeTab]);

  const tabs = [
    { key: "general", label: "General", icon: Settings },
    { key: "printer", label: "Printer", icon: Printer },
    { key: "shortcuts", label: "Shortcuts", icon: Keyboard },
    { key: "profile", label: "Profile", icon: User },
    { key: "formatting", label: "Formatting", icon: SlidersHorizontal },
  ];

  // Printer Settings Components
  const PrinterSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="border rounded p-3 mb-4">
      <h5 className="fw-bold mb-3">{title}</h5>
      {children}
    </div>
  );

  const PrinterSelector = () => (
    <select className="form-select">
      <option>Select Printer</option>
      {printers.map((printer, index: number) => (
        <option key={index} value={printer.name}>
          {printer.displayName}
        </option>
      ))}
    </select>
  );


  // const ActionButtons = () => (
  //   <div className="d-flex gap-1">
  //     <button className="btn btn-sm btn-outline-primary">
  //       <i className="bi bi-pencil"></i> Edit
  //     </button>
  //     <button className="btn btn-sm btn-outline-danger">
  //       <i className="bi bi-trash"></i> Delete
  //     </button>
  //   </div>
  // );

  // KOT Printer handlers
  const handleAddKotPrinter = async () => {
    const printer = (document.getElementById('kot-printer') as HTMLSelectElement)?.value;
    const source = (document.getElementById('kot-source') as HTMLSelectElement)?.value;
    const orderType = (document.getElementById('kot-order-type') as HTMLSelectElement)?.value;
    const size = (document.getElementById('kot-size') as HTMLSelectElement)?.value;
    const copies = parseInt((document.getElementById('kot-copies') as HTMLInputElement)?.value || '1');
    const enablePrint = kotEnablePrint;

    if (!printer || !source || !orderType || !size) {
      alert('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const newSetting = {
        printer_name: printer,
        source,
        order_type: orderType,
        size,
        copies,
        outletid: 1,
        enableKotPrint: enablePrint
      };

      await apiCall('/settings/kot-printer-settings', {
        method: 'POST',
        body: JSON.stringify(newSetting)
      });

      fetchKotPrinters();
      clearKotForm();
    } catch (error) {
      console.error('Failed to add KOT printer:', error);
      alert('Failed to add KOT printer setting');
    } finally {
      setLoading(false);
    }
  };

  const handleEditKotPrinter = (item: KotPrinterSetting) => {
    setEditingKotId(item.id);
    setKotEnablePrint(item.enableKotPrint);
    (document.getElementById('kot-printer') as HTMLSelectElement).value = item.printer_name;
    (document.getElementById('kot-source') as HTMLSelectElement).value = item.source;
    (document.getElementById('kot-order-type') as HTMLSelectElement).value = item.order_type;
    (document.getElementById('kot-size') as HTMLSelectElement).value = item.size;
    (document.getElementById('kot-copies') as HTMLInputElement).value = item.copies.toString();
  };

  const handleDeleteKotPrinter = async (id: number) => {
    if (!confirm('Are you sure you want to delete this KOT printer setting?')) return;

    try {
      await apiCall(`/settings/kot-printer-settings/${id}`, {
        method: 'DELETE'
      });
      fetchKotPrinters();
    } catch (error) {
      console.error('Failed to delete KOT printer:', error);
      alert('Failed to delete KOT printer setting');
    }
  };

  const clearKotForm = () => {
    (document.getElementById('kot-printer') as HTMLSelectElement).value = 'Select Printer';
    (document.getElementById('kot-source') as HTMLSelectElement).value = 'Select Source';
    (document.getElementById('kot-order-type') as HTMLSelectElement).value = 'Select Order Type';
    (document.getElementById('kot-size') as HTMLSelectElement).value = 'Select Size';
    (document.getElementById('kot-copies') as HTMLInputElement).value = '';
    setKotEnablePrint(true);
    setEditingKotId(null);
  };

  // Report Printer handlers
  const handleUpdateReportPrinter = async () => {
    if (reportPrinters.length === 0) {
      alert('No report printer settings found to update');
      return;
    }

    const existingSetting = reportPrinters[0]; // Assuming single setting for now

    setLoading(true);
    try {
      await apiCall(`/settings/report-printer/${existingSetting.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          printer_name: reportPrinterName,
          paper_size: reportPaperSize,
          auto_print: reportAutoPrint
        })
      });

      fetchReportPrinters();
      alert('Report printer settings updated successfully');
    } catch (error) {
      console.error('Failed to update report printer:', error);
      alert('Failed to update report printer settings');
    } finally {
      setLoading(false);
    }
  };

  // Bill Printer handlers
  const handleAddBillPrinter = async () => {
    const printer = (document.getElementById('bill-printer') as HTMLSelectElement)?.value;
    const source = (document.getElementById('bill-source') as HTMLSelectElement)?.value;
    const orderType = (document.getElementById('bill-order-type') as HTMLSelectElement)?.value;
    const size = (document.getElementById('bill-size') as HTMLSelectElement)?.value;
    const copies = parseInt((document.getElementById('bill-copies') as HTMLInputElement)?.value || '1');
    const enablePrint = billEnablePrint;

    if (!printer || !source || !orderType || !size) {
      alert('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const newSetting = {
        printer_name: printer,
        source,
        order_type: orderType,
        size,
        copies,
        outletid: 1, // Assuming outletid is 1 for now
        enableBillPrint: enablePrint
      };

      await apiCall('/settings/bill-printer-settings', {
        method: 'POST',
        body: JSON.stringify(newSetting)
      });

      fetchBillPrinters();
      clearBillForm();
    } catch (error) {
      console.error('Failed to add bill printer:', error);
      alert('Failed to add bill printer setting');
    } finally {
      setLoading(false);
    }
  };

  const handleEditBillPrinter = (item: BillPrinterSetting) => {
    setEditingBillId(item.id);
    setBillEnablePrint(item.enableBillPrint);
    (document.getElementById('bill-printer') as HTMLSelectElement).value = item.printer_name;
    (document.getElementById('bill-source') as HTMLSelectElement).value = item.source;
    (document.getElementById('bill-order-type') as HTMLSelectElement).value = item.order_type;
    (document.getElementById('bill-size') as HTMLSelectElement).value = item.size;
    (document.getElementById('bill-copies') as HTMLInputElement).value = item.copies.toString();
  };

  const handleDeleteBillPrinter = async (id: number) => {
    if (!confirm('Are you sure you want to delete this bill printer setting?')) return;

    try {
      await apiCall(`/settings/bill-printer-settings/${id}`, {
        method: 'DELETE'
      });
      fetchBillPrinters();
    } catch (error) {
      console.error('Failed to delete bill printer:', error);
      alert('Failed to delete bill printer setting');
    }
  };

  const clearBillForm = () => {
    (document.getElementById('bill-printer') as HTMLSelectElement).value = 'Select Printer';
    (document.getElementById('bill-source') as HTMLSelectElement).value = 'Select Source';
    (document.getElementById('bill-order-type') as HTMLSelectElement).value = 'Select Order Type';
    (document.getElementById('bill-size') as HTMLSelectElement).value = 'Select Size';
    (document.getElementById('bill-copies') as HTMLInputElement).value = '';
    setBillEnablePrint(true);
    setEditingBillId(null);
  };

  const PrinterTable = ({
    data,
    columns,
    onEdit,
    onDelete
  }: {
    data: any[];
    columns: string[];
    onEdit: (item: any) => void;
    onDelete: (id: number) => void;
  }) => (
    <div className="table-responsive mt-3">
      <table className="table table-bordered table-sm">
        <thead className="table-light">
          <tr>
            {columns.map((col, index) => (
              <th key={index}>{col}</th>
            ))}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + 1} className="text-center text-muted">
                No data available
              </td>
            </tr>
          ) : (
            data.map((item, index) => (
              <tr key={item.id || index}>
                {columns.map((col, colIndex) => (
                  <td key={colIndex}>{item[col.toLowerCase().replace(' ', '_')] || item[col]}</td>
                ))}
                <td>
                  <div className="d-flex gap-1">
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => onEdit(item)}
                    >
                      <i className="bi bi-pencil"></i> Edit
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => onDelete(item.id)}
                    >
                      <i className="bi bi-trash"></i> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="container-fluid p-4">
      {/* TABS HEADER */}
      <div className="d-flex gap-3 align-items-center border-bottom pb-2 mb-4">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`btn d-flex align-items-center gap-2 px-3 py-2 fw-semibold 
              ${activeTab === t.key ? "btn-primary text-white" : "btn-light"}`}
          >
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {/* CONTENT AREA */}
      <div className="card shadow-lg border-0 rounded">
        <div className="card-body" style={{ minHeight: "80vh" }}>


          {/* PRINTER TAB */}
          {activeTab === "printer" && (
            <div className="p-3" style={{ maxHeight: '80vh', overflowY: 'auto' }}>

              {/* KOT PRINTER SETTINGS */}
              <PrinterSection title="KOT Printer Settings">
                <div className="row g-3">
                   <div className="col-md-2">
                    <div className="form-check form-switch">
                      <input className="form-check-input" type="checkbox" role="switch" id="kot-enable-print" checked={kotEnablePrint} onChange={(e) => setKotEnablePrint(e.target.checked)} />
                      <label className="form-check-label">KOT Enable Print</label>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Printer</label>
                      <select
                        className="form-select"
                        id="kot-printer"
                        value={selectedKotPrinter}
                        onChange={(e) => setSelectedKotPrinter(e.target.value)}
                      >
                        <option value="">Select Printer</option>

                        {printers.map((p, index: number) => (
                          <option key={index} value={p.name}>
                            {p.displayName}
                          </option>
                        ))}
                      </select>


                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Source</label>
                    <select className="form-select" id="kot-source">
                      <option>Select Source</option>
                      <option>Source 1</option>
                      <option>Source 2</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Order Type</label>
                    <select className="form-select" id="kot-order-type" >
                      <option>Select Order Type</option>
                      <option>Dine-in</option>
                      <option>Takeaway</option>
                      <option>Delivery</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Size</label>
                    <select className="form-select" id="kot-size" >
                      <option>Select Size</option>
                      <option>58mm</option>
                      <option>80mm</option>
                      <option>A4</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Copies</label>
                    <input className="form-control" id="kot-copies" placeholder="No of Copies" type="number" min="1"  />
                  </div>

                  <div className="col-md-9 d-flex gap-2 align-items-end">
                    <button className="btn btn-success" onClick={() => handleAddKotPrinter()} >
                      {loading ? 'Adding...' : 'Add'}
                    </button>
                    <button className="btn btn-secondary" onClick={() => clearKotForm()} >Clear</button>
                  </div>
                </div>
                <PrinterTable
                  data={kotPrinters}
                  columns={['Printer Name', 'Source', 'Order Type', 'Size', 'Copies']}
                  onEdit={handleEditKotPrinter}
                  onDelete={handleDeleteKotPrinter}
                />
              </PrinterSection>

              {/* BILL PRINTER SETTINGS */}
              <PrinterSection title="Bill Printer Settings">
                <div className="row g-3">
                  <div className="col-md-2">
                    <div className="form-check form-switch">

                      <input className="form-check-input" type="checkbox" role="switch" id="bill-enable-print" checked={billEnablePrint} onChange={(e) => setBillEnablePrint(e.target.checked)} />
                      <label className="form-check-label">BILL Enable Print</label>
                    </div>
                  </div>
                  
                  <div className="col-md-3">

                    <label className="form-label">Printer</label>
                      <select
                        className="form-select"
                        id="bill-printer"
                        value={selectedBillPrinter}
                        onChange={(e) => setSelectedBillPrinter(e.target.value)}
                       
                      >
                        <option value="">Select Printer</option>

                        {printers.map((p, index: number) => (
                          <option key={index} value={p.name}>
                            {p.displayName}
                          </option>
                        ))}
                      </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Source</label>
                    <select className="form-select" id="bill-source" >
                      <option>Select Source</option>
                      <option>Source 1</option>
                      <option>Source 2</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Order Type</label>
                    <select className="form-select" id="bill-order-type">
                      <option>Select Order Type</option>
                      <option>Dine-in</option>
                      <option>Takeaway</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Size</label>
                    <select className="form-select" id="bill-size" >
                      <option>Select Size</option>
                      <option>58mm</option>
                      <option>80mm</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Copies</label>
                    <input className="form-control" id="bill-copies" placeholder="No of Copies" type="number" min="1" />
                  </div>

                  <div className="col-md-9 d-flex gap-2 align-items-end">
                    <button className="btn btn-success" onClick={() => handleAddBillPrinter()} >
                      {loading ? 'Adding...' : 'Add'}
                    </button>
                    <button className="btn btn-secondary" onClick={() => clearBillForm()}>Clear</button>
                  </div>
                </div>
                <PrinterTable
                  data={billPrinters}
                  columns={['Printer Name', 'Source', 'Order Type', 'Size', 'Copies']}
                  onEdit={handleEditBillPrinter}
                  onDelete={handleDeleteBillPrinter}
                />
              </PrinterSection>

              {/* LABEL PRINTER SETTINGS */}
              <PrinterSection title="Label Printer Settings">
                <div className="row g-3 align-items-end">
                  <div className="col-md-4">
                    <label className="form-label">Printer</label>
                    <PrinterSelector />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Paper Width (mm)</label>
                    <input className="form-control" type="number" placeholder="80" />
                  </div>
                  <div className="col-md-3">
                    <div className="form-check form-switch">
                      <input className="form-check-input" type="checkbox" role="switch" />
                      <label className="form-check-label">Enable Label Printing</label>
                    </div>
                  </div>
                  <div className="col-md-2">
                    <button className="btn btn-success w-100">Update</button>
                  </div>
                </div>
              </PrinterSection>

              {/* REPORTS PRINTER SETTINGS */}
              <PrinterSection title="Reports Printer Settings">
                <div className="row g-3 align-items-end">
                  <div className="col-md-4">
                    <label className="form-label">Printer</label>
                    <select
                      className="form-select"
                      value={reportPrinterName}
                      onChange={(e) => setReportPrinterName(e.target.value)}
                    >
                      <option value="">Select Printer</option>
                      {printers.map((printer, index: number) => (
                        <option key={index} value={printer.name}>
                          {printer.displayName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Paper Size</label>
                    <select
                      className="form-select"
                      value={reportPaperSize}
                      onChange={(e) => setReportPaperSize(e.target.value)}
                    >
                      <option value="80mm">80mm</option>
                      <option value="A4">A4</option>
                      <option value="A5">A5</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        checked={reportAutoPrint}
                        onChange={(e) => setReportAutoPrint(e.target.checked)}
                      />
                      <label className="form-check-label">Auto Print Reports</label>
                    </div>
                  </div>
                  <div className="col-md-2">
                    <button
                      className="btn btn-success w-100"
                      onClick={handleUpdateReportPrinter}
                      disabled={loading}
                    >
                      {loading ? 'Updating...' : 'Update'}
                    </button>
                  </div>
                </div>
              </PrinterSection>

              {/* KITCHEN DEPARTMENT WISE PRINTER */}
              <PrinterSection title="Kitchen Department Wise Printer Settings">
                <div className="row g-3">
                  <div className="col-md-3">
                    <label className="form-label">Printer</label>
                    <PrinterSelector />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Source</label>
                    <select className="form-select">
                      <option>Select Source</option>
                      <option>Kitchen 1</option>
                      <option>Kitchen 2</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Order Type</label>
                    <select className="form-select">
                      <option>Select Order Type</option>
                      <option>Dine-in</option>
                      <option>Takeaway</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Department</label>
                    <select className="form-select">
                      <option>Select Department</option>
                      <option>Main Kitchen</option>
                      <option>Bar</option>
                      <option>Bakery</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Size</label>
                    <select className="form-select">
                      <option>Select Size</option>
                      <option>58mm</option>
                      <option>80mm</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Copies</label>
                    <input className="form-control" placeholder="No of Copies" type="number" min="1" />
                  </div>
                  <div className="col-md-6 d-flex gap-2 align-items-end">
                    <button className="btn btn-success">Add</button>
                    <button className="btn btn-secondary">Clear</button>
                  </div>
                </div>
                <PrinterTable
                  data={departmentPrinters}
                  columns={['Printer Name', 'Source', 'Order Type', 'Department', 'Size', 'Copies']}
                  onEdit={() => { }}
                  onDelete={(id) => { }}
                />
              </PrinterSection>

              {/* TABLE WISE KOT PRINTER SETTINGS */}
              <PrinterSection title="Table Wise KOT Printer Settings">
                <div className="row g-3">
                  <div className="col-md-3">
                    <label className="form-label">Printer</label>
                    <PrinterSelector />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Table</label>
                    <select className="form-select">
                      <option>Select Table</option>
                      <option>Table 1</option>
                      <option>Table 2</option>
                      <option>Table 3</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Source</label>
                    <select className="form-select">
                      <option>Select Source</option>
                      <option>Source 1</option>
                      <option>Source 2</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Size</label>
                    <select className="form-select">
                      <option>Select Size</option>
                      <option>58mm</option>
                      <option>80mm</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Copies</label>
                    <input className="form-control" placeholder="No of Copies" type="number" min="1" />
                  </div>
                  <div className="col-md-9 d-flex gap-2 align-items-end">
                    <button className="btn btn-success">Add</button>
                    <button className="btn btn-secondary">Clear</button>
                  </div>
                </div>
                <PrinterTable
                  data={tableWiseKot}
                  columns={['Table No', 'Printer Name', 'Size', 'Source', 'Copies']}
                  onEdit={() => { }}
                  onDelete={(id) => { }}
                />
              </PrinterSection>

              {/* TABLE WISE BILL PRINTER SETTINGS */}
              <PrinterSection title="Table Wise Bill Printer Settings">
                <div className="row g-3">
                  <div className="col-md-3">
                    <label className="form-label">Printer</label>
                    <PrinterSelector />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Table</label>
                    <select className="form-select">
                      <option>Select Table</option>
                      <option>Table 1</option>
                      <option>Table 2</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Source</label>
                    <select className="form-select">
                      <option>Select Source</option>
                      <option>Source 1</option>
                      <option>Source 2</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Size</label>
                    <select className="form-select">
                      <option>Select Size</option>
                      <option>58mm</option>
                      <option>80mm</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Copies</label>
                    <input className="form-control" placeholder="No of Copies" type="number" min="1" />
                  </div>
                  <div className="col-md-9 d-flex gap-2 align-items-end">
                    <button className="btn btn-success">Add</button>
                    <button className="btn btn-secondary">Clear</button>
                  </div>
                </div>
                <PrinterTable
                  data={tableWiseBill}
                  columns={['Table No', 'Printer Name', 'Size', 'Source', 'Copies']}
                  onEdit={() => { }}
                  onDelete={(id) => { }}
                />
              </PrinterSection>

              {/* CATEGORY WISE PRINTER SETTINGS */}
              <PrinterSection title="Category Wise Printer Settings">
                <div className="row g-3">
                  <div className="col-md-3">
                    <label className="form-label">Printer</label>
                    <PrinterSelector />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Order Type</label>
                    <select className="form-select">
                      <option>Select Order Type</option>
                      <option>Dine-in</option>
                      <option>Takeaway</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Source</label>
                    <select className="form-select">
                      <option>Select Source</option>
                      <option>Source 1</option>
                      <option>Source 2</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Category</label>
                    <select className="form-select">
                      <option>Select Category</option>
                      <option>Food</option>
                      <option>Beverages</option>
                      <option>Desserts</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Size</label>
                    <select className="form-select">
                      <option>Select Size</option>
                      <option>58mm</option>
                      <option>80mm</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Copies</label>
                    <input className="form-control" placeholder="No of Copies" type="number" min="1" />
                  </div>
                  <div className="col-md-6 d-flex gap-2 align-items-end">
                    <button className="btn btn-success">Add</button>
                    <button className="btn btn-secondary">Clear</button>
                  </div>
                </div>
                <PrinterTable
                  data={categoryPrinters}
                  columns={['Printer Name', 'Order Type', 'Source', 'Category', 'Size', 'Copies']}
                  onEdit={() => { }}
                  onDelete={(id) => { }}
                />
              </PrinterSection>

              {/* ================= KITCHEN DEPARTMENT WISE KDS (OFFLINE) ================= */}
              <div className="border rounded p-3 mb-4">
                <h5 className="fw-bold mb-3">Kitchen Department Wise KDS (Offline)</h5>

                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label">Department</label>
                    <select className="form-select">
                      <option>Select Department</option>
                      <option>Main Kitchen</option>
                      <option>Bar</option>
                      <option>Bakery</option>
                      <option>Grill Station</option>
                      <option>Salad Station</option>
                    </select>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">User</label>
                    <select className="form-select">
                      <option>Select User</option>
                      <option>Chef John</option>
                      <option>Chef Maria</option>
                      <option>Bartender Mike</option>
                      <option>Baker David</option>
                    </select>
                  </div>

                  <div className="col-md-2 d-flex align-items-end">
                    <button className="btn btn-success w-100">Add</button>
                  </div>

                  <div className="col-md-2 d-flex align-items-end">
                    <button className="btn btn-secondary w-100">Clear</button>
                  </div>
                </div>

                <h6 className="mt-4 mb-3">KDS Configuration List:</h6>
                <div className="table-responsive">
                  <table className="table table-bordered table-sm">
                    <thead className="table-light">
                      <tr>
                        <th>Department</th>
                        <th>User</th>
                        <th>Status</th>
                        <th>Last Updated</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Main Kitchen</td>
                        <td>Chef John</td>
                        <td><span className="badge bg-success">Active</span></td>
                        <td>2024-01-15 10:30 AM</td>
                        <td>
                          <div className="d-flex gap-1">
                            <button className="btn btn-sm btn-outline-primary">
                              <i className="bi bi-pencil"></i> Edit
                            </button>
                            <button className="btn btn-sm btn-outline-danger">
                              <i className="bi bi-trash"></i> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td>Bar</td>
                        <td>Bartender Mike</td>
                        <td><span className="badge bg-success">Active</span></td>
                        <td>2024-01-14 03:45 PM</td>
                        <td>
                          <div className="d-flex gap-1">
                            <button className="btn btn-sm btn-outline-primary">
                              <i className="bi bi-pencil"></i> Edit
                            </button>
                            <button className="btn btn-sm btn-outline-danger">
                              <i className="bi bi-trash"></i> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td>Bakery</td>
                        <td>Baker David</td>
                        <td><span className="badge bg-warning">Inactive</span></td>
                        <td>2024-01-10 09:15 AM</td>
                        <td>
                          <div className="d-flex gap-1">
                            <button className="btn btn-sm btn-outline-primary">
                              <i className="bi bi-pencil"></i> Edit
                            </button>
                            <button className="btn btn-sm btn-outline-danger">
                              <i className="bi bi-trash"></i> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;