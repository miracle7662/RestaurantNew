import React, { useState, useEffect, useMemo } from 'react';
import { Card, Row, Col, Form, Button, Table, Alert, Modal } from 'react-bootstrap';
import { useAuthContext } from '@/common';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
// import { Eye } from 'react-feather';

interface KitchenAllocationData {
  item_no: string;
  item_name: string;
  TotalQty: number;
  Amount: number;
}

interface ItemDetailData {
  item_name: string;
  Qty: number;
  Amount: number;
  KOTNo: number | null;
  TxnDatetime: string;
  table_name: string | null;
  TableID: number | null;
}

interface FilterOption {
  [key: string]: any;
}

const KitchenAllocation: React.FC = () => {
  const { user } = useAuthContext();
  const [data, setData] = useState<KitchenAllocationData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [printerName, setPrinterName] = useState<string | null>(null);
  const [, setOutletId] = useState<number | null>(null);

  // Filters
  const [selectedUser, setSelectedUser] = useState('');
   const [departments, setDepartments] = useState<FilterOption[]>([]);
  const [users, setUsers] = useState<FilterOption[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
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
          // Use correct API endpoints that match backend routes
        const userParams = new URLSearchParams({
          currentUserId: user?.id?.toString() || '',
          roleLevel: user?.role || '',
          brandId: user?.hotelid?.toString() || '',
          hotelid: user?.hotelid?.toString() || ''
        });

        const departmentParams = new URLSearchParams({
          hotelid: user?.hotelid?.toString() || ''
        });

        const [usersRes, itemGroupsRes, departmentsRes, kitchenMainGroupsRes] = await Promise.all([
          fetch(`http://localhost:3001/api/users?${userParams}`),
          fetch('http://localhost:3001/api/ItemGroup'),
          fetch(`http://localhost:3001/api/table-department?${departmentParams}`),

          fetch('http://localhost:3001/api/KitchenMainGroup')
        ]);

        if (!usersRes.ok) throw new Error(`Failed to fetch users: ${usersRes.status} ${usersRes.statusText}`);
        if (!itemGroupsRes.ok) throw new Error(`Failed to fetch item groups: ${itemGroupsRes.status} ${itemGroupsRes.statusText}`);
        if (!departmentsRes.ok) throw new Error(`Failed to fetch departments: ${departmentsRes.status} ${departmentsRes.statusText}`);
        if (!kitchenMainGroupsRes.ok) throw new Error(`Failed to fetch kitchen main groups: ${kitchenMainGroupsRes.status} ${kitchenMainGroupsRes.statusText}`);

        const usersData = await usersRes.json();
        const itemGroupsData = await itemGroupsRes.json();
        const departmentsData = await departmentsRes.json();
        const kitchenMainGroupsData = await kitchenMainGroupsRes.json();

        // Handle different response formats
        setUsers(Array.isArray(usersData) ? usersData : []);
        setItemGroups(Array.isArray(itemGroupsData) ? itemGroupsData : itemGroupsData.data || []);
        setDepartments(Array.isArray(departmentsData.data) ? departmentsData.data : []);
        setKitchenMainGroups(Array.isArray(kitchenMainGroupsData) ? kitchenMainGroupsData : kitchenMainGroupsData.data || []);
      } catch (err) {
        console.error('Error fetching filter options:', err);
        setError('Failed to load filter options. Please check your connection.');
      }
    };

    fetchFilterOptions();
  }, []);

  // Fetch data on component mount with current date
  useEffect(() => {
    if (user?.hotelid) {
      fetchData();
    }
  }, [user]);

  // Fetch printer settings and outlet details
  useEffect(() => {
    const fetchPrinterAndOutlet = async () => {
      // Get outletId from user outletid, then hotelid
      const outletIdToUse = user?.outletid || user?.hotelid;

      if (!outletIdToUse) return;

      setOutletId(Number(outletIdToUse));

      try {
        const res = await fetch(
          `http://localhost:3001/api/settings/report-printer/${outletIdToUse}`
        );
        if (!res.ok) {
          throw new Error('Failed to fetch printers');
        }
        const data = await res.json();
        setPrinterName(data[0]?.printer_name || null);
      } catch (err) {
        console.error('Error fetching printer:', err);
        toast.error('Failed to load printer settings.');
        setPrinterName(null);
      }
    };

    fetchPrinterAndOutlet();
  }, [user]);

  // Fetch data
  const fetchData = async () => {
    if (!fromDate || !toDate) {
      setError('Please select both From Date and To Date.');
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
      }  else if (selectedKitchenMainGroup) {
        filterType = 'kitchen-category';
        filterId = selectedKitchenMainGroup;
      }

      // Ensure fromDate is before toDate
      const startDate = fromDate < toDate ? fromDate : toDate;
      const endDate = fromDate < toDate ? toDate : fromDate;

      const params = new URLSearchParams({
        fromDate: startDate,
        toDate: endDate,
        hotelId: user.hotelid.toString(),
        ...(user.outletid && { outletId: user.outletid.toString() }),
        ...(filterType && { filterType, filterId })
      });

      const response = await fetch(`http://localhost:3001/api/kitchen-allocation?${params}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.message || 'Failed to fetch data');
      }
    } catch (err) {
      setError('Error fetching data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handler functions for buttons
  const handlePDF = () => {
    const doc = new jsPDF();
    doc.text('Kitchen Allocation Report', 20, 10);
    const tableColumn = ['Item No', 'Item Name', 'Total Qty', 'Amount'];
    const tableRows = filteredData.map(item => [
      item.item_no,
      item.item_name,
      item.TotalQty.toString(),
      item.Amount.toString()
    ]);
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20
    });
    doc.save('kitchen_allocation_report.pdf');
  };

  const handleExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Kitchen Allocation');
    XLSX.writeFile(workbook, 'kitchen_allocation_report.xlsx');
  };

  const handlePrint = async () => {
    try {
      setLoading(true);

      // Get system printers via Electron API (asynchronous)
      const systemPrintersRaw = await (window as any).electronAPI?.getInstalledPrinters?.() || [];
      const systemPrinters = Array.isArray(systemPrintersRaw) ? systemPrintersRaw : [];
      console.log("System Printers:", systemPrinters);

      if (systemPrinters.length === 0) {
        toast.error("No printers detected on this system. Please check printer connections and drivers.");
        return;
      }

      const normalize = (s: string) =>
        s.toLowerCase().replace(/\s+/g, "").trim();

      let finalPrinterName: string | null = null;
      let usedFallback = false;

      // Try to match the configured printer (case-insensitive, partial match)
      if (printerName) {
        const matchedPrinter = systemPrinters.find((p: any) =>
          normalize(p.name).includes(normalize(printerName)) ||
          normalize(p.displayName || "").includes(normalize(printerName))
        );

        if (matchedPrinter) {
          finalPrinterName = matchedPrinter.name;
        }
      }

      // If no configured printer or not found, use default printer or first available
      if (!finalPrinterName) {
        const defaultPrinter = systemPrinters.find((p: any) => p.isDefault);
        const fallbackPrinter = defaultPrinter || systemPrinters[0];

        if (fallbackPrinter) {
          finalPrinterName = fallbackPrinter.name;
          usedFallback = true;
          if (printerName) {
            console.warn(`Configured printer "${printerName}" not found. Using fallback: ${fallbackPrinter.displayName || fallbackPrinter.name}`);
            toast(`Printer "${printerName}" not found. Using fallback: ${fallbackPrinter.displayName || fallbackPrinter.name}`);
          }
        } else {
          toast.error("No suitable printer found, including fallbacks.");
          return;
        }
      }

      if (!finalPrinterName) {
        toast.error("Failed to determine printer name.");
        return;
      }
      if (usedFallback) {
        console.log("Fallback printer used");
      }

      console.log(`Printing to printer: ${finalPrinterName}`);

      // Generate HTML for the kitchen allocation report
      const reportHTML = `
        <html>
          <head>
            <title>Kitchen Allocation Report</title>
            <style>
              body { font-family: monospace; font-size: 12px; line-height: 1.2; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #000; padding: 4px; text-align: left; }
              th { background-color: #f0f0f0; }
              .header { text-align: center; margin-bottom: 10px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>Kitchen Allocation Report</h2>
              <p>From: ${fromDate} To: ${toDate}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Item No</th>
                  <th>Item Name</th>
                  <th>Total Qty</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                ${filteredData.map(item => `
                  <tr>
                    <td>${item.item_no}</td>
                    <td>${item.item_name}</td>
                    <td>${item.TotalQty}</td>
                    <td>${item.Amount}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;

      // Print using Electron API
      if ((window as any).electronAPI?.directPrint) {
        await (window as any).electronAPI.directPrint(reportHTML, finalPrinterName);
        toast.success("Kitchen Allocation Report Printed Successfully!");
      } else {
        toast.error("Electron print API not available.");
      }
    } catch (err) {
      console.error("Print error:", err);
      toast.error("Failed to print Kitchen Allocation Report.");
    } finally {
      setLoading(false);
    }
  };

  // Filtered data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter(item =>
      item.item_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  // Handle eye icon click
  const handleEyeClick = async (item: KitchenAllocationData) => {
  setSelectedItem(item.item_name);
  setShowModal(true);
  setModalLoading(true);

  try {
    const startDate = fromDate <= toDate ? fromDate : toDate;
    const endDate = fromDate <= toDate ? toDate : fromDate;

    const params = new URLSearchParams();
    params.append('fromDate', startDate);
    params.append('toDate', endDate);
    params.append('hotelId', String(user?.hotelid));

    if (user?.outletid) {
      params.append('outletId', String(user.outletid));
    }

    const response = await fetch(
      `http://localhost:3001/api/kitchen-allocation/item-details/${item.item_no}?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const result = await response.json();

    if (result?.success) {
      setModalData(result.data);
    } else {
      setModalData([]);
      toast.error(result?.message || 'No item details found');
    }

  } catch (error) {
    console.error('Error fetching item details:', error);
    setModalData([]);
    toast.error('Failed to fetch item details');
  } finally {
    setModalLoading(false);
  }
};


  return (
    <div>
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
                  <Form.Label>From Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>To Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
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

          <Table striped bordered hover responsive className="mt-3">
            <thead>
              <tr>
                <th>Item No</th>
                <th>Item Name</th>
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
                  <td>{item.TotalQty}</td>
                  <td>{item.Amount}</td>
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

          {/* Modal for Item Details */}
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
                      <th>Txn Date & Time</th>
                      <th>Table Name / Table ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalData.map((detail, index) => (
                      <tr key={index}>
                        <td>{detail.item_name}</td>
                        <td>{detail.Qty}</td>
                        <td>{detail.Amount}</td>
                        <td>{detail.KOTNo || 'N/A'}</td>
                        <td>{new Date(detail.TxnDatetime).toLocaleString()}</td>
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
