import React, { useState, useEffect, useMemo } from 'react';
import { Card, Row, Col, Form, Button, Table, Alert, Modal } from 'react-bootstrap';
import { useAuthContext } from '@/common';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import KitchenAllocationService, { ItemDetailData } from '@/common/api/kitchenallocation';
import ItemGroupService from '@/common/api/itemgroup';
import KitchenMainGroupService from '@/common/api/kitchenmaingroup';
import TableDepartmentService from '@/common/api/tabledepartment';
import OutletUserService from '@/common/api/outletUser';
import SettingsService from '@/common/api/settings';

const formatAmount = (value: any) => {
  const num = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(num)) return value ?? '-';
  if (Number.isInteger(num)) return String(num);
  const fixed = num.toFixed(2);
  return fixed.endsWith('.00') ? String(num.toFixed(0)) : fixed;
};

interface FilterOption {
  [key: string]: any;
}

interface KitchenAllocationDataWithRev {
  item_no: string;
  item_name: string;
  TotalQty: number;
  RevQty: number;
  Amount: number;
}

// Get current datetime in local format for datetime-local input
const getCurrentDateTimeLocal = () => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const getEndDateTimeLocal = () => {
  const now = new Date();
  now.setHours(23, 59, 59);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const KitchenAllocation: React.FC = () => {
  const { user } = useAuthContext();
  const hotelName: string =
    (user?.hotelname as string) ||
    (user as any)?.hotelName ||
    (user as any)?.hotel_name ||
    '';
  const [data, setData] = useState<KitchenAllocationDataWithRev[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [printerName, setPrinterName] = useState<string | null>(null);
  const [, setOutletId] = useState<number | null>(null);

  // Filters - Using datetime-local inputs
  const [selectedUser, setSelectedUser] = useState('');
  const [departments, setDepartments] = useState<FilterOption[]>([]);
  const [users, setUsers] = useState<FilterOption[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [fromDateTime, setFromDateTime] = useState(getCurrentDateTimeLocal());
  const [toDateTime, setToDateTime] = useState(getEndDateTimeLocal());
  const [selectedItemGroup, setSelectedItemGroup] = useState('');
  const [selectedKitchenMainGroup, setSelectedKitchenMainGroup] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter options
  const [itemGroups, setItemGroups] = useState<FilterOption[]>([]);
  const [kitchenMainGroups, setKitchenMainGroups] = useState<FilterOption[]>([]);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [modalData, setModalData] = useState<ItemDetailData[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  // Fetch filter options
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const userParams = {
          currentUserId: user?.id,
          roleLevel: user?.role,
          brandId: user?.hotelid,
          hotelid: user?.hotelid
        };

        const departmentParams = {
          hotelid: user?.hotelid
        };

        const [usersRes, itemGroupsRes, departmentsRes, kitchenMainGroupsRes] = await Promise.all([
          OutletUserService.getOutletUsers(userParams),
          ItemGroupService.list({ hotelid: user?.hotelid }),
          TableDepartmentService.list(departmentParams),
          KitchenMainGroupService.list()
        ]);

        setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
        setItemGroups(Array.isArray(itemGroupsRes.data) ? itemGroupsRes.data : []);
        setDepartments(Array.isArray(departmentsRes.data) ? departmentsRes.data : []);
        setKitchenMainGroups(Array.isArray(kitchenMainGroupsRes.data) ? kitchenMainGroupsRes.data : []);
      } catch (err) {
        setError('Failed to load filter options. Please check your connection.');
      }
    };

    fetchFilterOptions();
  }, [user]);

  // Fetch data on component mount with current datetime
  useEffect(() => {
    if (user?.hotelid) {
      fetchData();
    }
  }, [user]);

  // Fetch printer settings and outlet details
  useEffect(() => {
    const fetchPrinterAndOutlet = async () => {
      const outletIdToUse = user?.outletid || user?.hotelid;
      if (!outletIdToUse) return;
      setOutletId(Number(outletIdToUse));
      try {
        const res = await SettingsService.getReportPrinterById(Number(outletIdToUse));
        setPrinterName(res?.[0]?.printer_name || null);
      } catch (err) {
        toast.error('Failed to load printer settings.');
        setPrinterName(null);
      }
    };
    fetchPrinterAndOutlet();
  }, [user]);

  // Fetch data using KitchenAllocationService
  const fetchData = async () => {
    if (!fromDateTime || !toDateTime) {
      setError('Please select both From Date/Time and To Date/Time.');
      return;
    }
    if (!user?.hotelid) {
      setError('Hotel information is not available. Please log in again.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let filterType = '';
      let filterId = '';

      if (selectedUser) {
        filterType = 'user';
        filterId = selectedUser;
      } else if (selectedItemGroup) {
        filterType = 'item-group';
        filterId = selectedItemGroup;
      } else if (selectedDepartment) {
        filterType = 'department';
        filterId = selectedDepartment;
      } else if (selectedKitchenMainGroup) {
        filterType = 'kitchen-category';
        filterId = selectedKitchenMainGroup;
      }

      // Compare datetimes
      const startDateTime = fromDateTime < toDateTime ? fromDateTime : toDateTime;
      const endDateTime = fromDateTime < toDateTime ? toDateTime : fromDateTime;

      const result = await KitchenAllocationService.getAllocationData({
        fromDate: startDateTime,
        toDate: endDateTime,
        hotelId: user.hotelid.toString(),
        outletId: user.outletid?.toString(),
        filterType,
        filterId
      });

      if (result.success) {
        const processedData = result.data.map((item: any) => ({
          ...item,
          TotalQty: (item.TotalQty || 0) - (item.RevQty || 0),
          Amount: item.Amount || 0
        }));
        setData(processedData);
      } else {
        setError(result.message || 'Failed to fetch data');
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  const handlePDF = () => {
    const doc = new jsPDF();
    let y = 10;
    if (hotelName) {
      doc.text(hotelName, 20, y);
      y += 6;
    }
    doc.text('Kitchen Allocation Report', 20, y);
    y += 6;
    doc.text(`From: ${fromDateTime} To: ${toDateTime}`, 20, y);
    y += 6;
    
    const tableColumn = ['Item No', 'Item Name', 'Rev Qty', 'Total Qty', 'Amount'];
    const tableRows = filteredData.map((item) => [
      item.item_no,
      item.item_name,
      item.RevQty?.toString?.() ?? String(item.RevQty ?? '-'),
      item.TotalQty?.toString?.() ?? String(item.TotalQty ?? '-'),
      formatAmount(item.Amount)
    ]);

    const totalRevQty = filteredData.reduce((sum, item) => sum + Number(item.RevQty ?? 0), 0);
    const totalQty = filteredData.reduce((sum, item) => sum + Number(item.TotalQty ?? 0), 0);
    const totalAmount = filteredData.reduce((sum, item) => sum + Number(item.Amount ?? 0), 0);

    tableRows.push([
      '',
      'Total',
      totalRevQty.toString(),
      totalQty.toString(),
      formatAmount(totalAmount)
    ]);
    
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: y
    });
    doc.save('kitchen_allocation_report.pdf');
  };

  const handleExcel = () => {
    const totalRevQty = filteredData.reduce((sum, item) => sum + Number(item.RevQty ?? 0), 0);
    const totalQty = filteredData.reduce((sum, item) => sum + Number(item.TotalQty ?? 0), 0);
    const totalAmount = filteredData.reduce((sum, item) => sum + Number(item.Amount ?? 0), 0);

    const rowsWithTotal = [
      ...filteredData,
      {
        item_no: '',
        item_name: 'Total',
        RevQty: totalRevQty,
        TotalQty: totalQty,
        Amount: totalAmount,
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(rowsWithTotal);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Kitchen Allocation');
    XLSX.writeFile(workbook, 'kitchen_allocation_report.xlsx');
  };

  const handlePrint = async () => {
    try {
      setLoading(true);
      const systemPrintersRaw = await (window as any).electronAPI?.getInstalledPrinters?.() || [];
      const systemPrinters = Array.isArray(systemPrintersRaw) ? systemPrintersRaw : [];

      if (systemPrinters.length === 0) {
        toast.error("No printers detected on this system.");
        return;
      }

      const normalize = (s: string) =>
        s.toLowerCase().replace(/\s+/g, "").trim();

      let finalPrinterName: string | null = null;
      let usedFallback = false; 
      console.log("System Printers:", usedFallback);

      if (printerName) {
        const matchedPrinter = systemPrinters.find((p: any) =>
          normalize(p.name).includes(normalize(printerName)) ||
          normalize(p.displayName || "").includes(normalize(printerName))
        );
        if (matchedPrinter) {
          finalPrinterName = matchedPrinter.name;
        }
      }

      if (!finalPrinterName) {
        const defaultPrinter = systemPrinters.find((p: any) => p.isDefault);
        const fallbackPrinter = defaultPrinter || systemPrinters[0];
        if (fallbackPrinter) {
          finalPrinterName = fallbackPrinter.name;
          usedFallback = true;
          if (printerName) {
            toast(`Printer "${printerName}" not found. Using fallback: ${fallbackPrinter.displayName || fallbackPrinter.name}`);
          }
        } else {
          toast.error("No suitable printer found.");
          return;
        }
      }

      const totalRevQty = filteredData.reduce((sum, item) => sum + Number(item.RevQty ?? 0), 0);
      const totalQty = filteredData.reduce((sum, item) => sum + Number(item.TotalQty ?? 0), 0);
      const totalAmount = filteredData.reduce((sum, item) => sum + Number(item.Amount ?? 0), 0);

      // Format datetime for display
      const formatDisplayDateTime = (dateTimeStr: string) => {
        return dateTimeStr.replace('T', ' ');
      };

      const reportHTML = `
      <html>
      <head>
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }
          @media print {
            html, body { overflow: visible !important; }
            thead { display: table-header-group !important; }
            tr { page-break-inside: avoid; }
            table { page-break-inside: avoid; }
          }
          body {
            font-family: monospace;
            font-size: 14px;
            line-height: 1.3;
            width: 72mm;
            margin-left: 3mm;
            margin-right: 2mm;
            padding: 0;
          }
          .sub-header {
            text-align: center;
            font-size: 13px;
            margin-bottom: 5px;
            font-weight: bold;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }
          th, td {
            border-bottom: 1px dashed #000;
            padding: 2px;
            font-size: 13px;
          }
          th {
            text-align: left;
          }
          .col-no   { width: 12%; }
          .col-name { width: 38%; }
          .col-revqty { width: 15%; text-align: right; }
          .col-qty  { width: 15%; text-align: right; }
          .col-amt  { width: 20%; text-align: right; }
          td {
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
          }
          .totals-block {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            padding-top: 6px;
            font-weight: bold;
            border-top: 1px solid #000;
          }
          .totals-left {
            width: 30%;
            text-align: left;
          }
          .totals-right {
            width: 70%;
            display: flex;
            justify-content: flex-end;
            gap: 10px;
          }
          .totals-revqty, .totals-qty, .totals-amt {
            text-align: right;
          }
          .totals-revqty { width: 20%; }
          .totals-qty { width: 20%; }
          .totals-amt { width: 25%; }
        </style>
      </head>
      <body>
        <div class="sub-header">
          <p>${hotelName || ''}</p>
          <p>Kitchen Allocation Report</p>
          <p>From: ${formatDisplayDateTime(fromDateTime)} To: ${formatDisplayDateTime(toDateTime)}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th class="col-no">No</th>
              <th class="col-name">Item</th>
              <th class="col-revqty">Rev Qty</th>
              <th class="col-qty">Qty</th>
              <th class="col-amt">Amt</th>
            </tr>
          </thead>
          <tbody>
            ${filteredData.map(item => `
              <tr>
                <td class="col-no">${item.item_no ?? '-'}</td>
                <td class="col-name">${item.item_name}</td>
                <td class="col-revqty">${item.RevQty ?? 0}</td>
                <td class="col-qty">${item.TotalQty}</td>
                <td class="col-amt">${formatAmount(item.Amount)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="totals-block">
          <div class="totals-left">Total</div>
          <div class="totals-right">
            <div class="totals-revqty">${formatAmount(totalRevQty)}</div>
            <div class="totals-qty">${formatAmount(totalQty)}</div>
            <div class="totals-amt">${formatAmount(totalAmount)}</div>
          </div>
        </div>
      </body>
      </html>
      `;

      if ((window as any).electronAPI?.directPrint) {
        await (window as any).electronAPI.directPrint(reportHTML, finalPrinterName);
        toast.success("Kitchen Allocation Report Printed Successfully!");
      } else {
        toast.error("Electron print API not available.");
      }
    } catch (err) {
      toast.error("Failed to print Kitchen Allocation Report.");
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter(item =>
      item.item_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  const handleEyeClick = async (item: KitchenAllocationDataWithRev) => {
    setSelectedItem(item.item_name);
    setShowModal(true);
    setModalLoading(true);

    try {
      const startDateTime = fromDateTime <= toDateTime ? fromDateTime : toDateTime;
      const endDateTime = fromDateTime <= toDateTime ? toDateTime : fromDateTime;

      const result = await KitchenAllocationService.getItemDetails(item.item_no, {
        fromDate: startDateTime,
        toDate: endDateTime,
        hotelId: String(user?.hotelid),
        outletId: user?.outletid?.toString()
      });

      if (result?.success) {
        setModalData(result.data);
      } else {
        setModalData([]);
        toast.error(result?.message || 'No item details found');
      }
    } catch (error: any) {
      setModalData([]);
      toast.error(error.message || 'Failed to fetch item details');
    } finally {
      setModalLoading(false);
    }
  };

  // Format datetime for display in modal
  const formatDateTimeDisplay = (dateTimeStr: string) => {
    if (!dateTimeStr) return 'N/A';
    const date = new Date(dateTimeStr);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div>
      <style>
        {`
          .kitchen-allocation-table th,
          .kitchen-allocation-table td {
            font-weight: bold !important;
            font-size: 13px !important;
          }
        `}
      </style>
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h4>Kitchen Allocation Report</h4>
          <div>
            <Button variant="outline-primary" onClick={handlePDF} className="me-2">PDF</Button>
            <Button variant="outline-success" onClick={handleExcel} className="me-2">Excel</Button>
            <Button variant="outline-info" onClick={handlePrint}>Print</Button>
          </div>
        </Card.Header>
        <Card.Body>
          <Form>
            <Row>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>From Date & Time</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    value={fromDateTime}
                    onChange={(e) => setFromDateTime(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>To Date & Time</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    value={toDateTime}
                    onChange={(e) => setToDateTime(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>User</Form.Label>
                  <Form.Select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
                    <option value="">All Users</option>
                    {users.map((user) => (
                      <option key={user.userid} value={user.userid}>{user.full_name || user.username}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Item Group</Form.Label>
                  <Form.Select value={selectedItemGroup} onChange={(e) => setSelectedItemGroup(e.target.value)}>
                    <option value="">All Item Groups</option>
                    {itemGroups.map((group) => (
                      <option key={group.item_groupid} value={group.item_groupid}>{group.itemgroupname}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row className="mt-3">
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Department</Form.Label>
                  <Form.Select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)}>
                    <option value="">All Departments</option>
                    {departments.map((dept) => (
                      <option key={dept.departmentid} value={dept.departmentid}>{dept.department_name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Kitchen Main Group</Form.Label>
                  <Form.Select value={selectedKitchenMainGroup} onChange={(e) => setSelectedKitchenMainGroup(e.target.value)}>
                    <option value="">All Kitchen Main Groups</option>
                    {kitchenMainGroups.map((group) => (
                      <option key={group.kitchenmaingroupid} value={group.kitchenmaingroupid}>{group.Kitchen_main_Group}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Search Item Name</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter item name to search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={3} className="d-flex align-items-end">
                <Button onClick={fetchData} disabled={loading}>
                  {loading ? 'Loading...' : 'Generate Report'}
                </Button>
              </Col>
            </Row>
          </Form>

          {error && <Alert variant="danger" className="mt-3">{error}</Alert>}

          <Table striped bordered hover responsive className="mt-3 kitchen-allocation-table">
            <thead>
              <tr>
                <th>Item No</th>
                <th>Item Name</th>
                <th>Rev Qty</th>
                <th>Total Qty</th>
                <th>Amount</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, index) => (
                <tr key={index}>
                  <td>{item.item_no}</td>
                  <td>{item.item_name}</td>
                  <td>{item.RevQty ?? 0}</td>
                  <td>{item.TotalQty}</td>
                  <td>{formatAmount(item.Amount)}</td>
                  <td>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => handleEyeClick(item)}
                      title="View Item Details"
                    >
                      👁️
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
            <Modal.Header closeButton>
              <Modal.Title>Item Details - {selectedItem}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {modalLoading ? (
                <div className="text-center">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p>Loading item details...</p>
                </div>
              ) : modalData.length > 0 ? (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>Item Name</th>
                      <th>Qty</th>
                      <th>Amount</th>
                      <th>KOT No</th>
                      <th>KOT Used Date & Time</th>
                      <th>Table Name / Table ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalData.map((detail, index) => (
                      <tr key={index}>
                        <td>{detail.item_name}</td>
                        <td>{detail.Qty}</td>
                        <td>{formatAmount(detail.Amount)}</td>
                        <td>{detail.KOTNo || 'N/A'}</td>
                        <td>{formatDateTimeDisplay(detail.TxnDatetime)}</td>
                        <td>{detail.table_name || `Table ${detail.TableID}`}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <Alert variant="info">
                  No item details found for the selected item.
                </Alert>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Close
              </Button>
            </Modal.Footer>
          </Modal>
        </Card.Body>
      </Card>
    </div>
  );
};

export default KitchenAllocation;