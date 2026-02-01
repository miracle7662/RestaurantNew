import React, { useState, useEffect } from 'react';
import { Button, Card, Table, Alert, Form, Pagination } from 'react-bootstrap';
import { Plus, FileEarmarkPdf, FileEarmarkExcel, Trash, Pencil } from 'react-bootstrap-icons';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useAuthContext } from '@/common/context/useAuthContext';
import AccountLedgerModal from './AccountLedgerModal';

interface ILedger {
  LedgerId?: string;
  LedgerNo: string;
  Name: string;
  MarathiName?: string;
  address: string;
  stateid?: string;
  state?: string;
  cityid?: string;
  city?: string;
  MobileNo: string;
  PhoneNo?: string;
  GstNo?: string;
  PanNo?: string;
  OpeningBalance: string;
  OpeningBalanceDate?: string;
  AccountTypeId?: string;
  AccountType: string;
  Status: number;
  createdbyid?: number;
  updatedbyid?: number;
  hotelid?: string;
}

// // Fixed constants for account types matching backend names
// const ACCOUNT_TYPE_SUNDRY_DEBTORS_NAME = "SUNDRY DEBTORS(Customer)";
// const ACCOUNT_TYPE_SUNDRY_CREDITORS_NAME = "SUNDRY CREDITORS(Supplier)";

// Helper to get next auto-increment CustomerNo as string
// const getNextCustomerNo = (data: ILedger[]): string => {
//   if (!data || data.length === 0) return "1";
//   const customerNos = data
//     .filter((d) => d.CustomerNo)
//     .map((d) => parseInt(d.CustomerNo || "0", 10))
//     .filter((num) => !isNaN(num));
//   const maxNo = customerNos.length > 0 ? Math.max(...customerNos) : 0;
//   return String(maxNo + 1);
// };

// Helper to get next auto-increment FarmerNo as string
// const getNextFarmerNo = (data: ILedger[]): string => {
//   if (!data || data.length === 0) return "1";
//   const farmerNos = data
//     .filter((d) => d.FarmerNo)
//     .map((d) => parseInt(d.FarmerNo || "0", 10))
//     .filter((num) => !isNaN(num));
//   const maxNo = farmerNos.length > 0 ? Math.max(...farmerNos) : 0;
//   return String(maxNo + 1);
// };

// Helper to get next auto-increment LedgerNo as string
const getNextLedgerNo = (data: ILedger[]): string => {
  if (!data || data.length === 0) return "1";
  const ledgerNos = data
    .filter((d) => d.LedgerNo)
    .map((d) => parseInt(d.LedgerNo || "0", 10))
    .filter((num) => !isNaN(num));
  const maxNo = ledgerNos.length > 0 ? Math.max(...ledgerNos) : 0;
  return String(maxNo + 1);
};
console.log(getNextLedgerNo);


const AccountLedger = () => {
  const { user } = useAuthContext();
  const [data, setData] = useState<ILedger[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ILedger | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortField, setSortField] = useState<keyof ILedger>('Name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Check if required session data is available
  const isDisabled = !user?.hotelid;

  // Fetch ledger data
  const fetchData = async () => {
    if (isDisabled) return;

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`http://localhost:3001/api/account-ledger/ledger`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Failed to fetch ledger data' }));
        throw new Error(errorData.message || 'Failed to fetch ledger data');
      }

      const result = await res.json();
      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch ledger data';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isDisabled) {
      fetchData();
    }
  }, [user?.hotelid]);

  // Handle delete
  const handleDelete = async (item: ILedger) => {
    if (!window.confirm('Are you sure you want to delete this ledger entry?')) return;

    try {
      const res = await fetch(`http://localhost:3001/api/account-ledger/${item.LedgerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Failed to delete ledger entry' }));
        throw new Error(errorData.message || 'Failed to delete ledger entry');
      }

      toast.success('Ledger entry deleted successfully');
      fetchData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete ledger entry';
      toast.error(errorMessage);
    }
  };

  // Handle edit
  const handleEdit = (item: ILedger) => {
    setEditingItem(item);
    setShowModal(true);
  };

  // Handle add
  const handleAdd = () => {
    setEditingItem(null);
    setShowModal(true);
  };

  // Handle modal success
  const handleModalSuccess = () => {
    fetchData();
    setShowModal(false);
  };

  // Filter and sort data
  const filteredData = data.filter(item =>
    (item.Name && typeof item.Name === 'string' && item.Name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.LedgerNo && typeof item.LedgerNo === 'string' && item.LedgerNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.MobileNo && typeof item.MobileNo === 'string' && item.MobileNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.address && typeof item.address === 'string' && item.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const sortedData = [...filteredData].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      const comparison = aValue.localeCompare(bValue);
      return sortDirection === 'asc' ? comparison : -comparison;
    }

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }

    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);

  // Handle sort
  const handleSort = (field: keyof ILedger) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text('Account Ledger Report', 20, 10);
    const tableColumn = ['Ledger No', 'Name', 'Address', 'Mobile', 'GST No', 'Opening Balance', 'Account Type', 'Status'];
    const tableRows = filteredData.map(item => [
      item.LedgerNo,
      item.Name,
      item.address,
      item.MobileNo,
      item.GstNo || '-',
      item.OpeningBalance,
      item.AccountType,
      item.Status === 1 ? 'Active' : 'Inactive'
    ]);
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });
    doc.save('account-ledger-report.pdf');
  };

  // Export to Excel
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredData.map(item => ({
      'Ledger No': item.LedgerNo,
      'Name': item.Name,
      'Address': item.address,
      'Mobile': item.MobileNo,
      'GST No': item.GstNo || '-',
      'Opening Balance': item.OpeningBalance,
      'Account Type': item.AccountType,
      'Status': item.Status === 1 ? 'Active' : 'Inactive'
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Account Ledger');
    XLSX.writeFile(workbook, 'account-ledger-report.xlsx');
  };

  if (isDisabled) {
    return (
      <Card className="p-4">
        <Alert variant="warning">
          <h5>Access Restricted</h5>
          <p>Please select a company and year to access the Account Ledger management page.</p>
        </Alert>
      </Card>
    );
  }

  return (
    <>
      <Card className="m-2 p-2">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h4>Account Ledger</h4>
          <Button variant="success" onClick={handleAdd}>
            <Plus className="me-1" /> Add Ledger Entry
          </Button>
        </div>
        <Card.Body className="p-0 "  >
          {error && <Alert variant="danger">{error}</Alert>}
          {loading ? (
            <div className="text-center p-4">Loading...</div>
          ) : (
            <>
              {/* Search, Date Filters, and Export Buttons in Single Row */}
              <div className="d-flex flex-wrap gap-1 mb-4 align-items-end ">
                {/* Search - takes maximum space */}
                <div className="flex-grow-1" style={{ minWidth: '280px' }}>
                  <Form.Control
                    type="text"
                    placeholder="Search by name, ledger no, mobile, or address..."
                    value={searchTerm}
                    onChange={handleSearch}
                  />
                </div>

                {/* Dates + Buttons group */}
                <div className="d-flex gap-2 align-items-end flex-wrap">
                  <div style={{ minWidth: '160px' }}>
                    {/* <Form.Label className="small mb-1 text-muted">From Date</Form.Label> */}
                    <Form.Control
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                    />
                  </div>

                  <div style={{ minWidth: '160px' }}>
                    {/* <Form.Label className="small mb-1 text-muted">To Date</Form.Label> */}
                    <Form.Control
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                    />
                  </div>

                  {/* Export buttons */}
                  <div className="d-flex gap-2 pt-0 pt-md-4">
                    <Button variant="outline-primary" onClick={exportToPDF}>
                      <FileEarmarkPdf className="me-1" /> Export PDF
                    </Button>
                    <Button variant="outline-success" onClick={exportToExcel}>
                      <FileEarmarkExcel className="me-1" /> Export Excel
                    </Button>
                  </div>
                </div>
              </div>

              {/* Results Summary */}


              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <Table striped bordered hover responsive>
                  <thead className="table-light">
                    <tr>
                      <th onClick={() => handleSort('LedgerNo')} style={{ cursor: 'pointer' }}>
                        Ledger No {sortField === 'LedgerNo' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th onClick={() => handleSort('Name')} style={{ cursor: 'pointer' }}>
                        Name {sortField === 'Name' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th>Address</th>
                      <th onClick={() => handleSort('MobileNo')} style={{ cursor: 'pointer' }}>
                        Mobile {sortField === 'MobileNo' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th>GST No</th>
                      <th onClick={() => handleSort('OpeningBalance')} style={{ cursor: 'pointer' }}>
                        Opening Balance {sortField === 'OpeningBalance' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th>Account Type</th>
                      <th onClick={() => handleSort('Status')} style={{ cursor: 'pointer' }}>
                        Status {sortField === 'Status' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((item) => (
                      <tr key={item.LedgerId}>
                        <td>{item.LedgerNo}</td>
                        <td>{item.Name}</td>
                        <td>{item.address}</td>
                        <td>{item.MobileNo}</td>
                        <td>{item.GstNo || '-'}</td>
                        <td>{item.OpeningBalance}</td>
                        <td>{item.AccountType}</td>
                        <td>
                          <span className={`badge ${item.Status === 1 ? 'bg-success' : 'bg-danger'}`}>
                            {item.Status === 1 ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-2"
                            onClick={() => handleEdit(item)}
                          >
                            <Pencil className="me-1" /> 
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDelete(item)}
                          >
                            <Trash className="me-1" /> 
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {paginatedData.length === 0 && (
                      <tr>
                        <td colSpan={9} className="text-center">
                          {searchTerm ? 'No ledger entries match your search' : 'No ledger entries found'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div>
                    <small className="text-muted">
                      Page {currentPage} of {totalPages}
                    </small>
                  </div>
                  <Pagination>
                    <Pagination.Prev
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    />
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                      return (
                        <Pagination.Item
                          key={pageNum}
                          active={pageNum === currentPage}
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </Pagination.Item>
                      );
                    })}
                    <Pagination.Next
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    />
                  </Pagination>
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>

      <AccountLedgerModal
        show={showModal}
        onHide={() => setShowModal(false)}
        ledger={editingItem}
        onSuccess={handleModalSuccess}
      />
    </>
  );
};

export default AccountLedger;
