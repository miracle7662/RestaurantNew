import React, { useState, useEffect } from "react";
import {
  Settings,
  Printer,
  Keyboard,
  User,
  SlidersHorizontal,
} from "lucide-react";
import { fetchOutlets } from '../../utils/commonfunction';
import { OutletData } from '../../common/api/outlet';
import { useAuthContext } from "@/common/context/useAuthContext";


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
  source?: string;
  order_type?: string;
  size?: string;
  copies?: number;
  enablePrint?: boolean;
}

interface ReportPrinterSetting {
  id: number;
  printer_name: string;
  paper_size: string;
  auto_print: boolean;
  source?: string;
  order_type?: string;
  size?: string;
  copies?: number;
  enablePrint?: boolean;
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
  const { user } = useAuthContext();
  const [outlets, setOutlets] = useState<OutletData[]>([]);
  const [loading, setLoading] = useState(false);
  const [outletsLoaded, setOutletsLoaded] = useState(false);

  // Don't render if user is not available
 

  const [activeTab, setActiveTab] = useState("general");
  // const [selectedPrinter, setSelectedPrinter] = useState("");
  const [selectedKotPrinter, setSelectedKotPrinter] = useState("");
  const [selectedBillPrinter, setSelectedBillPrinter] = useState("");
  const [kotEnablePrint, setKotEnablePrint] = useState(true);
  const [billEnablePrint, setBillEnablePrint] = useState(true);
  const [selectedKotSource, setSelectedKotSource] = useState("");
  const [selectedKotOrderType, setSelectedKotOrderType] = useState("");
  const [selectedKotSize, setSelectedKotSize] = useState("");
  const [kotCopies, setKotCopies] = useState("");
  const [selectedBillSource, setSelectedBillSource] = useState("");
  const [selectedBillOrderType, setSelectedBillOrderType] = useState("");
  const [selectedBillSize, setSelectedBillSize] = useState("");
  const [billCopies, setBillCopies] = useState("");
 

  const [printers, setPrinters] = useState<Array<{ name: string; displayName: string }>>([]);


  // State for all printer settings
  const [kotPrinters, setKotPrinters] = useState<KotPrinterSetting[]>([]);
  const [billPrinters, setBillPrinters] = useState<BillPrinterSetting[]>([]);
  const [labelPrinters, setLabelPrinters] = useState<LabelPrinterSetting[]>([]);
  const [reportPrinters, setReportPrinters] = useState<ReportPrinterSetting[]>([]);
  const [departmentPrinters, setDepartmentPrinters] = useState<DepartmentWisePrinter[]>([]);
  const [tableWiseKot, setTableWiseKot] = useState<TableWiseKot[]>([]);
  const [tableWiseBill, setTableWiseBill] = useState<TableWiseBill[]>([]);
  const [categoryPrinters, setCategoryPrinters] = useState<CategoryWisePrinter[]>([]);
  const [, setKdsUsers] = useState<KDSUser[]>([]);
  const [, setEditingKotId] = useState<number | null>(null);
  const [, setEditingBillId] = useState<number | null>(null);
  const [reportPrinterName, setReportPrinterName] = useState("");
  const [reportPaperSize, setReportPaperSize] = useState("80mm");
  const [reportAutoPrint, setReportAutoPrint] = useState(true);
  const [selectedReportSource, setSelectedReportSource] = useState("");
  const [selectedReportOrderType, setSelectedReportOrderType] = useState("");
  const [selectedReportSize, setSelectedReportSize] = useState("");
  const [reportCopies, setReportCopies] = useState("");
  const [reportEnablePrint, setReportEnablePrint] = useState(true);
  const [editingReportId, setEditingReportId] = useState<number | null>(null);
  const [selectedOutlet, setSelectedOutlet] = useState<number | null>( null);

  const [labelPrinterName, setLabelPrinterName] = useState("");
  const [labelPaperWidth, setLabelPaperWidth] = useState("");
  const [labelIsEnabled, setLabelIsEnabled] = useState(true);
  const [selectedLabelSource, setSelectedLabelSource] = useState("");
  const [selectedLabelOrderType, setSelectedLabelOrderType] = useState("");
  const [selectedLabelSize, setSelectedLabelSize] = useState("");
  const [labelCopies, setLabelCopies] = useState("");
  const [labelEnablePrint, setLabelEnablePrint] = useState(true);
  const [editingLabelId, setEditingLabelId] = useState<number | null>(null);

  // Department Wise Printer states
  const [selectedDeptPrinter, setSelectedDeptPrinter] = useState("");
  const [selectedDeptSource, setSelectedDeptSource] = useState("");
  const [selectedDeptOrderType, setSelectedDeptOrderType] = useState("");
  const [selectedDeptDepartment, setSelectedDeptDepartment] = useState("");
  const [selectedDeptSize, setSelectedDeptSize] = useState("");
  const [deptCopies, setDeptCopies] = useState("");


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

  useEffect(() => {
    console.log('User in Settings:', user);
    if (user) {
      console.log('Fetching outlets for user...');
      fetchOutlets(user, setOutlets, setLoading);
    }
  }, [user]);

  // Fetch report printer settings on component mount
  useEffect(() => {
    fetchReportPrinters();
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
      const dataWithOutlet = data.map(item => {
        const outlet = outlets.find(o => o.outletid === item.outletid);
        return { ...item, outlet_name: outlet ? outlet.outlet_name : 'Unknown' };
      });
      setKotPrinters(dataWithOutlet);
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
      console.log('Fetching department printers...');
      const data = await apiCall('/settings/department-wise-printer');
      setDepartmentPrinters(data);
      console.log('Department printers state updated');
    } catch (error) {
      console.error('Failed to fetch department printers:', error);
      console.error('Error details:', error);
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
-      fetchReportPrinters();
      fetchDepartmentPrinters();
      fetchTableWiseKot();
      fetchTableWiseBill();
      fetchCategoryPrinters();
      fetchKdsUsers();
    }
  }, [activeTab]);

  // Populate label printer state when data is fetched
  useEffect(() => {
    if (labelPrinters && labelPrinters.length > 0) {
      const labelSetting = labelPrinters[0]; // Assuming single setting
      setLabelPrinterName(labelSetting.printer_name);
      setLabelPaperWidth(labelSetting.paper_width.toString());
      setLabelIsEnabled(labelSetting.is_enabled);
      setSelectedLabelSource(labelSetting.source || '');
      setSelectedLabelOrderType(labelSetting.order_type || '');
      setSelectedLabelSize(labelSetting.size || '');
      setLabelCopies(labelSetting.copies?.toString() || '');
      setLabelEnablePrint(labelSetting.enablePrint || true);
    }
  }, [labelPrinters]);

  // Populate report printer state when data is fetched
  useEffect(() => {
    if (reportPrinters && reportPrinters.length > 0) {
      const reportSetting = reportPrinters[0]; // Assuming single setting
      setReportPrinterName(reportSetting.printer_name);
      setReportPaperSize(reportSetting.paper_size);
      setReportAutoPrint(reportSetting.auto_print);
      setSelectedReportSource(reportSetting.source || '');
      setSelectedReportOrderType(reportSetting.order_type || '');
      setSelectedReportSize(reportSetting.size || '');
      setReportCopies(reportSetting.copies?.toString() || '');
      setReportEnablePrint(reportSetting.enablePrint || true);
    }
  }, [reportPrinters]);

  const tabs = [
    { key: "general", label: "General", icon: Settings },
    { key: "printer", label: "Printer", icon: Printer },
    { key: "shortcuts", label: "Shortcuts", icon: Keyboard },
    { key: "profile", label: "Profile", icon: User },
    { key: "formatting", label: "Formatting", icon: SlidersHorizontal },
  ];

  // Printer Settings Components
  const PrinterSection = ({ title, children, style }: { title: string; children: React.ReactNode; style?: React.CSSProperties }) => (
    <div className="border rounded p-3 mb-4" style={style}>
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
    const printer = selectedKotPrinter;
    const source = selectedKotSource;
    const orderType = selectedKotOrderType;
    const size = selectedKotSize;
    const copies = parseInt(kotCopies || '1');
    const enablePrint = kotEnablePrint;

    if (!printer || !orderType || !size || !selectedOutlet) {
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
        outletid: selectedOutlet,
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
    setSelectedKotPrinter(item.printer_name);
    setSelectedKotSource(item.source);
    setSelectedKotOrderType(item.order_type);
    setSelectedKotSize(item.size);
    setKotCopies(item.copies.toString());
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
    setSelectedKotPrinter('');
    setSelectedKotSource('');
    setSelectedKotOrderType('');
    setSelectedKotSize('');
    setKotCopies('');
    setKotEnablePrint(true);
    setEditingKotId(null);
  };

  // Report Printer handlers
  const handleAddReportPrinter = async () => {
    const printer = reportPrinterName;
    const source = selectedReportSource;
    // const orderType = selectedReportOrderType;
    // const size = selectedReportSize;
    // const copies = parseInt(reportCopies || '1');
    const enablePrint = reportEnablePrint;

    if (!printer || !source || !selectedOutlet) {
      alert('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const newSetting = {
        printer_name: printer,
        source,

        enablePrint,
        paper_size: reportPaperSize,
        auto_print: reportAutoPrint,
        outletid: selectedOutlet
      };

      await apiCall('/settings/report-printer', {
        method: 'POST',
        body: JSON.stringify(newSetting)
      });

      fetchReportPrinters();
      clearReportForm();
    } catch (error) {
      console.error('Failed to add report printer:', error);
      alert('Failed to add report printer setting');
    } finally {
      setLoading(false);
    }
  };

  const handleEditReportPrinter = (item: ReportPrinterSetting) => {
    setEditingReportId(item.id);
    setReportEnablePrint(item.enablePrint || true);
    setReportPrinterName(item.printer_name);
    setSelectedReportSource(item.source || '');
    setSelectedReportOrderType(item.order_type || '');
    setSelectedReportSize(item.size || '');
    setReportCopies(item.copies?.toString() || '');
    setReportPaperSize(item.paper_size);
    setReportAutoPrint(item.auto_print);
  };

  const handleDeleteReportPrinter = async (id: number) => {
    if (!confirm('Are you sure you want to delete this report printer setting?')) return;

    try {
      await apiCall(`/settings/report-printer/${id}`, {
        method: 'DELETE'
      });
      fetchReportPrinters();
    } catch (error) {
      console.error('Failed to delete report printer:', error);
      alert('Failed to delete report printer setting');
    }
  };

  const clearReportForm = () => {
    setReportPrinterName('');
    setSelectedReportSource('');
    setSelectedReportOrderType('');
    setSelectedReportSize('');
    setReportCopies('');
    setReportEnablePrint(true);
    setReportPaperSize('80mm');
    setReportAutoPrint(true);
    setEditingReportId(null);
  };

  // Label Printer handlers
  const handleAddLabelPrinter = async () => {
    const printer = labelPrinterName;
    // const source = selectedLabelSource;
    // const orderType = selectedLabelOrderType;
    // const size = selectedLabelSize;
    // const copies = parseInt(labelCopies || '1');
    const enablePrint = labelEnablePrint;

    if (!printer || !selectedOutlet) {
      alert('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const newSetting = {
        printer_name: printer,



        enablePrint,
        paper_width: parseInt(labelPaperWidth),
        is_enabled: labelIsEnabled,
        outletid: selectedOutlet
      };

      await apiCall('/settings/label-printer', {
        method: 'POST',
        body: JSON.stringify(newSetting)
      });

      fetchLabelPrinters();
      clearLabelForm();
    } catch (error) {
      console.error('Failed to add label printer:', error);
      alert('Failed to add label printer setting');
    } finally {
      setLoading(false);
    }
  };

  const handleEditLabelPrinter = (item: LabelPrinterSetting) => {
    setEditingLabelId(item.id);
    setLabelEnablePrint(item.enablePrint || true);
    setLabelPrinterName(item.printer_name);
    setSelectedLabelSource(item.source || '');
    setSelectedLabelOrderType(item.order_type || '');
    setSelectedLabelSize(item.size || '');
    setLabelCopies(item.copies?.toString() || '');
    setLabelPaperWidth(item.paper_width.toString());
    setLabelIsEnabled(item.is_enabled);
  };

  const handleDeleteLabelPrinter = async (id: number) => {
    if (!confirm('Are you sure you want to delete this label printer setting?')) return;

    try {
      await apiCall(`/settings/label-printer/${id}`, {
        method: 'DELETE'
      });
      fetchLabelPrinters();
    } catch (error) {
      console.error('Failed to delete label printer:', error);
      alert('Failed to delete label printer setting');
    }
  };

  const clearLabelForm = () => {
    setLabelPrinterName('');
    setSelectedLabelSource('');
    setSelectedLabelOrderType('');
    setSelectedLabelSize('');
    setLabelCopies('');
    setLabelEnablePrint(true);
    setLabelPaperWidth('');
    setLabelIsEnabled(true);
    setEditingLabelId(null);
  };

  // Bill Printer handlers
  const clearBillForm = () => {
    setSelectedBillPrinter('');
    setSelectedBillSource('');
    setSelectedBillOrderType('');
    setSelectedBillSize('');
    setBillCopies('');
    setBillEnablePrint(true);
    setEditingBillId(null);
  };

  const handleAddBillPrinter = async () => {
    const printer = selectedBillPrinter;
    const source = selectedBillSource;
    const orderType = selectedBillOrderType;
    const size = selectedBillSize;
    const copies = parseInt(billCopies || '1');
    const enablePrint = billEnablePrint;

    if (!printer || !source || !orderType || !size || !selectedOutlet) {
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
        outletid: selectedOutlet,
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
    setSelectedBillPrinter(item.printer_name);
    setSelectedBillSource(item.source);
    setSelectedBillOrderType(item.order_type);
    setSelectedBillSize(item.size);
    setBillCopies(item.copies.toString());
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

  // Department Wise Printer handlers
  const handleAddDepartmentPrinter = async () => {
    const printer = selectedDeptPrinter;
    const source = selectedDeptSource;
    const orderType = selectedDeptOrderType;
    const department = selectedDeptDepartment;
    const size = selectedDeptSize;
    const copies = parseInt(deptCopies || '1');

    if (!printer || !source || !orderType || !department || !size || !selectedOutlet) {
      alert('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const newSetting = {
        department,
        printer_name: printer,
        order_type: orderType,
        size,
        source,
        copies,
        outletid: selectedOutlet
      };

      await apiCall('/settings/department-wise-printer', {
        method: 'POST',
        body: JSON.stringify(newSetting)
      });

      fetchDepartmentPrinters();
      clearDeptForm();
    } catch (error) {
      console.error('Failed to add department printer:', error);
      alert('Failed to add department printer setting');
    } finally {
      setLoading(false);
    }
  };

  const clearDeptForm = () => {
    setSelectedDeptPrinter('');
    setSelectedDeptSource('');
    setSelectedDeptOrderType('');
    setSelectedDeptDepartment('');
    setSelectedDeptSize('');
    setDeptCopies('');
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
                    <label className="form-label">Outlet</label>
                    <select
  value={selectedOutlet !== null ? String(selectedOutlet) : ''}
  onChange={(e) =>
    setSelectedOutlet(e.target.value ? Number(e.target.value) : null)
  }

  className="form-select rounded-lg"
  required
>
  <option value="">Select Outlet</option>
  {outlets.map((outlet) => (
    <option key={outlet.outletid} value={String(outlet.outletid)}>
      {outlet.outlet_name}
    </option>
  ))}
</select>

                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Order Type</label>
                    <select
                      className="form-select"
                      id="kot-order-type"
                      value={selectedKotOrderType}
                      onChange={(e) => setSelectedKotOrderType(e.target.value)}
                    >
                      <option value="">Select Order Type</option>
                      <option value="Dine-in">Dine-in</option>
                      <option value="Takeaway">Takeaway</option>
                      <option value="Delivery">Delivery</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Size</label>
                    <select
                      className="form-select"
                      id="kot-size"
                      value={selectedKotSize}
                      onChange={(e) => setSelectedKotSize(e.target.value)}
                    >
                      <option value="">Select Size</option>
                      <option value="58mm">58mm</option>
                      <option value="80mm">80mm</option>
                      <option value="A4">A4</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Copies</label>
                    <input
                      className="form-control"
                      id="kot-copies"
                      placeholder="No of Copies"
                      type="number"
                      min="1"
                      value={kotCopies}
                      onChange={(e) => setKotCopies(e.target.value)}
                    />
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
                    <label className="form-label">Outlet</label>
                    <select
  value={selectedOutlet !== null ? String(selectedOutlet) : ''}
  onChange={(e) =>
    setSelectedOutlet(e.target.value ? Number(e.target.value) : null)
  }

  className="form-select rounded-lg"
  required
>
  <option value="">Select Outlet</option>
  {outlets.map((outlet) => (
    <option key={outlet.outletid} value={String(outlet.outletid)}>
      {outlet.outlet_name}
    </option>
  ))}
</select>

                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Order Type</label>
                    <select
                      className="form-select"
                      id="bill-order-type"
                      value={selectedBillOrderType}
                      onChange={(e) => setSelectedBillOrderType(e.target.value)}
                    >
                      <option value="">Select Order Type</option>
                      <option value="Dine-in">Dine-in</option>
                      <option value="Takeaway">Takeaway</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Size</label>
                    <select
                      className="form-select"
                      id="bill-size"
                      value={selectedBillSize}
                      onChange={(e) => setSelectedBillSize(e.target.value)}
                    >
                      <option value="">Select Size</option>
                      <option value="58mm">58mm</option>
                      <option value="80mm">80mm</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Copies</label>
                    <input
                      className="form-control"
                      id="bill-copies"
                      placeholder="No of Copies"
                      type="number"
                      min="1"
                      value={billCopies}
                      onChange={(e) => setBillCopies(e.target.value)}
                    />
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
                <div className="row g-3">
                  
                  <div className="col-md-3">
                    <label className="form-label">Printer</label>
                    <select
                      className="form-select"
                      value={labelPrinterName}
                      onChange={(e) => setLabelPrinterName(e.target.value)}
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
                    <label className="form-label">Outlet</label>
                    <select
  value={selectedOutlet !== null ? String(selectedOutlet) : ''}
  onChange={(e) =>
    setSelectedOutlet(e.target.value ? Number(e.target.value) : null)
  }

  className="form-select rounded-lg"
  required
>
  <option value="">Select Outlet</option>
  {outlets.map((outlet) => (
    <option key={outlet.outletid} value={String(outlet.outletid)}>
      {outlet.outlet_name}
    </option>
  ))}
</select>

                  </div>
                  
          
                  
                  <div className="col-md-3">
                    <label className="form-label">Paper Width (mm)</label>
                    <input
                      className="form-control"
                      type="number"
                      value={labelPaperWidth}
                      onChange={(e) => setLabelPaperWidth(e.target.value)}
                      placeholder="80"
                    />
                  </div>
                  <div className="col-md-3">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        checked={labelIsEnabled}
                        onChange={(e) => setLabelIsEnabled(e.target.checked)}
                      />
                      <label className="form-check-label">Enable Label Printing</label>
                    </div>
                  </div>
                  <div className="col-md-9 d-flex gap-2 align-items-end">
                    <button
                      className="btn btn-success"
                      onClick={handleAddLabelPrinter}
                      disabled={loading}
                    >
                      {loading ? 'Adding...' : 'Add'}
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={clearLabelForm}
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <PrinterTable
                  data={labelPrinters}
                  columns={['Printer Name',  'Paper Width']}
                  onEdit={handleEditLabelPrinter}
                  onDelete={handleDeleteLabelPrinter}
                />
              </PrinterSection>

              {/* REPORTS PRINTER SETTINGS */}
              <PrinterSection title="Reports Printer Settings">
                <div className="row g-3">
                  
                  <div className="col-md-3">
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
                    <label className="form-label">Outlet</label>
                    <select
  value={selectedOutlet !== null ? String(selectedOutlet) : ''}
  onChange={(e) =>
    setSelectedOutlet(e.target.value ? Number(e.target.value) : null)
  }

  className="form-select rounded-lg"
  required
>
  <option value="">Select Outlet</option>
  {outlets.map((outlet) => (
    <option key={outlet.outletid} value={String(outlet.outletid)}>
      {outlet.outlet_name}
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
                  <div className="col-md-9 d-flex gap-2 align-items-end">
                    <button
                      className="btn btn-success"
                      onClick={handleAddReportPrinter}
                      disabled={loading}
                    >
                      {loading ? 'Adding...' : 'Add'}
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={clearReportForm}
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <PrinterTable
                  data={reportPrinters}
                  columns={['Printer Name',  'Paper Size']}
                  onEdit={handleEditReportPrinter}
                  onDelete={handleDeleteReportPrinter}
                />
              </PrinterSection>

              {/* KITCHEN DEPARTMENT WISE PRINTER */}
              <PrinterSection title="Kitchen Department Wise Printer Settings">
                <div className="row g-3">
                  <div className="col-md-3">
                    <label className="form-label">Printer</label>
                    <select
                      className="form-select"
                      value={selectedDeptPrinter}
                      onChange={(e) => setSelectedDeptPrinter(e.target.value)}
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
                    <label className="form-label">Outlet</label>
                    <select
  value={selectedOutlet !== null ? String(selectedOutlet) : ''}
  onChange={(e) =>
    setSelectedOutlet(e.target.value ? Number(e.target.value) : null)
  }

  className="form-select rounded-lg"
  required
>
  <option value="">Select Outlet</option>
  {outlets.map((outlet) => (
    <option key={outlet.outletid} value={String(outlet.outletid)}>
      {outlet.outlet_name}
    </option>
  ))}
</select>

                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Order Type</label>
                    <select
                      className="form-select"
                      value={selectedDeptOrderType}
                      onChange={(e) => setSelectedDeptOrderType(e.target.value)}
                    >
                      <option value="">Select Order Type</option>
                      <option value="Dine-in">Dine-in</option>
                      <option value="Takeaway">Takeaway</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Department</label>
                    <select
                      className="form-select"
                      value={selectedDeptDepartment}
                      onChange={(e) => setSelectedDeptDepartment(e.target.value)}
                    >
                      <option value="">Select Department</option>
                      <option value="Main Kitchen">Main Kitchen</option>
                      <option value="Bar">Bar</option>
                      <option value="Bakery">Bakery</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Size</label>
                    <select
                      className="form-select"
                      value={selectedDeptSize}
                      onChange={(e) => setSelectedDeptSize(e.target.value)}
                    >
                      <option value="">Select Size</option>
                      <option value="58mm">58mm</option>
                      <option value="80mm">80mm</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Copies</label>
                    <input
                      className="form-control"
                      placeholder="No of Copies"
                      type="number"
                      min="1"
                      value={deptCopies}
                      onChange={(e) => setDeptCopies(e.target.value)}
                    />
                  </div>
                  <div className="col-md-6 d-flex gap-2 align-items-end">
                    <button
                      className="btn btn-success"
                      onClick={() => handleAddDepartmentPrinter()}
                      disabled={loading}
                    >
                      {loading ? 'Adding...' : 'Add'}
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => clearDeptForm()}
                    >
                      Clear
                    </button>
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
              <PrinterSection title="Table Wise KOT Printer Settings" style={{ display: 'none' }}>
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
              <PrinterSection title="Table Wise Bill Printer Settings " style={{ display: 'none' }}>
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
              <PrinterSection title="Category Wise Printer Settings " style={{ display: 'none' }} >
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
              <div className="border rounded p-3 mb-4"  style={{ display: 'none' }}>
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