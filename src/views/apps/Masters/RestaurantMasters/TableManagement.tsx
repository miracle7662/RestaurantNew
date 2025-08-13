import React, { useState, useCallback, useEffect, useMemo } from 'react';
import Swal from 'sweetalert2';
import { toast } from 'react-hot-toast';
import { Preloader } from '@/components/Misc/Preloader';
import { Button, Card, Stack, Table } from 'react-bootstrap';
import TitleHelmet from '@/components/Common/TitleHelmet';
import { useAuthContext } from '@/common';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table';
import { fetchOutletsForDropdown } from '@/utils/commonfunction';
import { OutletData } from '@/common/api/outlet';
import { fetchBrands } from '@/utils/commonfunction';

// Define TableItem interface
interface TableItem {
  tableid: string;
  table_name: string;
  hotel_name: string;
  outlet_name: string;
  outletid: number | string;
  hotelid: number | string;
  marketid: string;
  status: string;
  created_by_id: string;
  created_date: string;
  updated_by_id: string;
  updated_date: string;
  hotel_details?: string;
  outlet_details?: string;
  market_details?: string;
}

// Status badge for table
const getStatusBadge = (status: number) => {
  return status === 1 ? (
    <span className="badge bg-success">Active</span>
  ) : (
    <span className="badge bg-danger">Inactive</span>
  );
};

// Debounce utility function
const debounce = (func: (...args: any[]) => void, wait: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// AddTableModal Props
interface AddTableModalProps {
  show: boolean;
  onHide: () => void;
  onSuccess: () => void;
}

// EditTableModal Props
interface EditTableModalProps {
  show: boolean;
  onHide: () => void;
  tableItem: TableItem | null;
  onSuccess: () => void;
  onUpdateSelectedTable: (tableItem: TableItem) => void;
}

// Main TableManagement Component
const TableManagement: React.FC = () => {
  const [tableItems, setTableItems] = useState<TableItem[]>([]);
  const [filteredTableItems, setFilteredTableItems] = useState<TableItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showAddTableModal, setShowAddTableModal] = useState(false);
  const [showEditTableModal, setShowEditTableModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedTable, setSelectedTable] = useState<TableItem | null>(null);
  const [outlets, setOutlets] = useState<OutletData[]>([]);
  const [brands, setBrands] = useState<Array<{ hotelid: number; hotel_name: string }>>([]);
  const [selectedOutletId, setSelectedOutletId] = useState<number | null>(null); // New state for outlet filter

  const { user } = useAuthContext();

  // Fetch table data
  const fetchTableManagement = async (search: string = '') => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3001/api/tablemanagement?search=${encodeURIComponent(search)}`, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setTableItems(data.data);
          setFilteredTableItems(data.data);
        } else {
          toast.error(data.message || 'Failed to fetch table data');
        }
      } else {
        toast.error('Failed to fetch table data');
      }
    } catch (err) {
      toast.error('Failed to fetch table data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTableManagement(searchTerm);
    fetchBrands(user, setBrands);
    fetchOutletsForDropdown(user, setOutlets, setLoading);
  }, [user, searchTerm]);

  // Define table columns
  const columns = useMemo<ColumnDef<TableItem>[]>(
    () => [
      {
        id: 'checkbox',
        header: '',
        size: 50,
        cell: () => (
          <input
            type="checkbox"
            style={{
              width: '20px',
              height: '20px',
              border: '2px solid #ccc',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          />
        ),
      },
      {
        accessorKey: 'tableid',
        header: 'Sr No',
        size: 50,
        cell: (info) => <span>{info.getValue<string>()}</span>,
      },
      {
        accessorKey: 'table_name',
        header: 'Table Name',
        size: 150,
        cell: (info) => <span>{info.getValue<string>()}</span>,
      },
      {
        accessorKey: 'hotel_name',
        header: 'Hotel Name',
        size: 150,
        cell: (info) => {
          const hotelId = Number(info.row.original.hotelid);
          const hotel = brands.find((brand) => brand.hotelid === hotelId);
          return <span>{hotel ? hotel.hotel_name : 'Unknown Hotel'}</span>;
        },
      },
      {
        accessorKey: 'outlet_name',
        header: 'Outlet Name',
        size: 200,
        cell: (info) => {
          const outletId = Number(info.row.original.outletid);
          const outlet = outlets.find((outlet) => outlet.outletid === outletId);
          return <span>{outlet ? `${outlet.outlet_name} (${outlet.outlet_code})` : 'Unknown Outlet'}</span>;
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 15,
        cell: (info) => {
          const statusValue = Number(info.getValue<string | number>());
          return <div style={{ textAlign: 'center' }}>{getStatusBadge(statusValue)}</div>;
        },
      },
      {
        id: 'actions',
        header: 'Action',
        size: 100,
        cell: ({ row }) => (
          <div className="d-flex gap-2 justify-content-end">
            <button
              className="btn btn-sm btn-success"
              style={{ padding: '4px 8px' }}
              onClick={() => handleEditClick(row.original)}
            >
              <i className="fi fi-rr-edit"></i>
            </button>
            <button
              className="btn btn-sm btn-danger"
              onClick={() => handleDeleteTable(row.original)}
              style={{ padding: '4px 8px' }}
            >
              <i className="fi fi-rr-trash"></i>
            </button>
          </div>
        ),
      },
    ],
    [outlets, brands]
  );

  // Initialize react-table
  const table = useReactTable({
    data: filteredTableItems,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  // Handle search and outlet filter
  const handleSearch = useCallback(
    debounce((value: string) => {
      setSearchTerm(value);
      let filtered = [...tableItems];

      // Apply outlet filter first if selected
      if (selectedOutletId !== null && selectedOutletId !== undefined) {
        filtered = filtered.filter((item) => Number(item.outletid) === selectedOutletId);
      }

      // Apply search term filter
      if (value) {
        filtered = filtered.filter((item) =>
          item.table_name.toLowerCase().includes(value.toLowerCase()) ||
          item.hotel_name.toLowerCase().includes(value.toLowerCase()) ||
          item.outlet_name.toLowerCase().includes(value.toLowerCase())
        );
      }

      setFilteredTableItems(filtered);
    }, 300),
    [tableItems, selectedOutletId]
  );

  // Handle outlet filter change
  const handleOutletFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const outletId = e.target.value ? Number(e.target.value) : null;
    setSelectedOutletId(outletId);
    let filtered = [...tableItems];

    // Apply outlet filter
    if (outletId !== null && outletId !== undefined) {
      filtered = filtered.filter((item) => {
        const itemOutletId = Number(item.outletid); // Ensure outletid is a number
        return itemOutletId === outletId;
      });
    }

    // Apply search term filter if any
    if (searchTerm) {
      filtered = filtered.filter((item) =>
        item.table_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.hotel_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.outlet_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredTableItems(filtered);
  };

  // Handle edit button click
  const handleEditClick = (table: TableItem) => {
    setSelectedTable(table);
    setShowEditTableModal(true);
  };

  // Handle delete operation
  const handleDeleteTable = async (table: TableItem) => {
    const res = await Swal.fire({
      title: 'Are you sure?',
      text: 'This will delete the table permanently!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3E97FF',
      confirmButtonText: 'Yes, delete it!',
    });
    if (res.isConfirmed) {
      try {
        const response = await fetch(
          `http://localhost:3001/api/tablemanagement/${table.tableid}`,
          {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
          }
        );
        const data = await response.json();
        if (response.ok && data.success) {
          toast.success(data.message || 'Table deleted successfully');
          fetchTableManagement(searchTerm);
          setSelectedTable(null);
        } else {
          toast.error(data.message || 'Failed to delete table');
        }
      } catch {
        toast.error('Failed to delete table');
      }
    }
  };

  return (
    <>
      <TitleHelmet title="Table Management" />
      <div >
        <Card className="m-1">
          <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
            <h4 className="mb-0">Table Management</h4>
            <div style={{ display: 'flex', gap: '4px' }}>
              <Button variant="success" className="me-1" onClick={() => setShowAddTableModal(true)}>
                <i className="bi bi-plus"></i> Add New
              </Button>
              <Button variant="primary" className="me-1">
                <i className="bi bi-upload"></i> Upload Tables
              </Button>
              <Button variant="primary">
                <i className="bi bi-download"></i> Download Table Format
              </Button>
            </div>
          </div>
          <div className="p-3">
            <div className="mb-3" style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                className="form-control rounded-pill"
                placeholder="Search..."
                onChange={(e) => handleSearch(e.target.value)}
                style={{ width: '350px', borderColor: '#ccc', borderWidth: '2px' }}
              />
              <select
                className="form-control"
                value={selectedOutletId || ''}
                onChange={handleOutletFilterChange}
                style={{ width: '200px', borderColor: '#ccc', borderWidth: '2px' }}
              >
                <option value="">All Outlets</option>
                {outlets.map((outlet) => (
                  <option key={outlet.outletid} value={outlet.outletid}>
                    {outlet.outlet_name} ({outlet.outlet_code})
                  </option>
                ))}
              </select>
            </div>
            {loading ? (
              <Stack className="align-items-center justify-content-center flex-grow-1 h-100">
                <Preloader />
              </Stack>
            ) : (
              <div style={{ maxHeight: '500px', overflowY: 'auto', width: '100%' }}>
                <Table responsive className="mb-0" style={{ tableLayout: 'auto', width: '100%' }}>
                  <thead>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <th
                            key={header.id}
                            colSpan={header.colSpan}
                            style={{
                              width: header.column.columnDef.size,
                              whiteSpace: 'normal',
                              padding: '8px',
                              textAlign: header.id === 'actions' ? 'right' : 'center',
                            }}
                          >
                            {header.isPlaceholder ? null : (
                              <div>
                                {flexRender(header.column.columnDef.header, header.getContext())}
                              </div>
                            )}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {table.getRowModel().rows.map((row) => (
                      <tr key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <td
                            key={cell.id}
                            style={{
                              whiteSpace: 'normal',
                              padding: '8px',
                              textAlign: cell.column.id === 'actions' ? 'right' : 'center',
                            }}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </div>
        </Card>
      </div>
      <AddTableModal
        show={showAddTableModal}
        onHide={() => setShowAddTableModal(false)}
        onSuccess={() => fetchTableManagement(searchTerm)}
      />
      <EditTableModal
        show={showEditTableModal}
        onHide={() => {
          setShowEditTableModal(false);
          setSelectedTable(null);
        }}
        tableItem={selectedTable}
        onSuccess={() => fetchTableManagement(searchTerm)}
        onUpdateSelectedTable={setSelectedTable}
      />
    </>
  );
};
// AddTableModal Component
const AddTableModal: React.FC<AddTableModalProps> = ({ show, onHide, onSuccess }) => {
  const [table_name, setTableName] = useState<string>('');
  const [outletid, setOutletId] = useState<number | null>(null);
  const [status, setStatus] = useState<string>('Active');
  const [loading, setLoading] = useState<boolean>(false);
  const [outlets, setOutlets] = useState<OutletData[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<number | null>(null);
  const [brands, setBrands] = useState<Array<{ hotelid: number; hotel_name: string }>>([]);
  const { user } = useAuthContext();

  useEffect(() => {
    fetchOutletsForDropdown(user, setOutlets, setLoading);
    fetchBrands(user, setBrands);
  }, [user]);

  const handleAdd = async () => {
    if (!table_name || !selectedBrand || !outletid) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const statusValue = status === 'Active' ? 1 : 0;
      const payload = {
        table_name,
        outletid: outletid.toString(),
        hotelid: selectedBrand.toString(),
        marketid: '1', // Placeholder, adjust as needed
        status: statusValue,
        created_by_id: user?.id || '1',
      };

      const res = await fetch('http://localhost:3001/api/tablemanagement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'Table added successfully');
        setTableName('');
        setOutletId(null);
        setStatus('Active');
        setSelectedBrand(null);
        onSuccess();
        onHide();
      } else {
        toast.error(data.message || 'Failed to add table');
      }
    } catch (err) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div
      className="modal"
      style={{
        display: 'block',
        background: 'rgba(0,0,0,0.5)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1050,
      }}
    >
      <div
        className="modal-content"
        style={{
          background: 'white',
          padding: '20px',
          maxWidth: '500px',
          margin: '100px auto',
          borderRadius: '8px',
        }}
      >
        <h3>Add New Table</h3>
        <div className="mb-3">
          <label className="form-label">Table Name <span style={{ color: 'red' }}>*</span></label>
          <input
            type="text"
            className="form-control"
            value={table_name}
            onChange={(e) => setTableName(e.target.value)}
            placeholder="e.g., Conference, 106, R15"
            disabled={loading}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Hotel Name <span style={{ color: 'red' }}>*</span></label>
          <select
            className="form-control"
            value={selectedBrand || ''}
            onChange={(e) => setSelectedBrand(e.target.value ? Number(e.target.value) : null)}
            disabled={loading}
          >
            <option value="">Select Hotel</option>
            {brands.map((brand) => (
              <option key={brand.hotelid} value={brand.hotelid}>
                {brand.hotel_name}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">Outlet Name <span style={{ color: 'red' }}>*</span></label>
          <select
            className="form-control"
            value={outletid || ''}
            onChange={(e) => setOutletId(e.target.value ? Number(e.target.value) : null)}
            disabled={loading}
          >
            <option value="">Select Outlet</option>
            {outlets.map((outlet) => (
              <option key={outlet.outletid} value={outlet.outletid}>
                {outlet.outlet_name} ({outlet.outlet_code})
              </option>
            ))}
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">Status <span style={{ color: 'red' }}>*</span></label>
          <select
            className="form-control"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
        <div className="d-flex justify-content-end">
          <button
            className="btn btn-primary"
            onClick={handleAdd}
            disabled={loading}
          >
            {loading ? 'Adding...' : 'Add'}
          </button>
          <button
            className="btn btn-outline-secondary ms-2"
            onClick={onHide}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// EditTableModal Component
const EditTableModal: React.FC<EditTableModalProps> = ({
  show,
  onHide,
  tableItem,
  onSuccess,
  onUpdateSelectedTable,
}) => {
  const [table_name, setTableName] = useState<string>('');
  const [outletid, setOutletId] = useState<number | null>(null);
  const [status, setStatus] = useState<string>('Active');
  const [loading, setLoading] = useState<boolean>(false);
  const [outlets, setOutlets] = useState<OutletData[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<number | null>(null);
  const [brands, setBrands] = useState<Array<{ hotelid: number; hotel_name: string }>>([]);
  const { user } = useAuthContext();

  useEffect(() => {
    if (tableItem) {
      setTableName(tableItem.table_name);
      setOutletId(tableItem.outletid ? Number(tableItem.outletid) : null);
      setStatus(Number(tableItem.status) === 1 ? 'Active' : 'Inactive');
      setSelectedBrand(tableItem.hotelid ? Number(tableItem.hotelid) : null);
    }
    fetchOutletsForDropdown(user, setOutlets, setLoading);
    fetchBrands(user, setBrands);
  }, [tableItem, user]);

  const handleEdit = async () => {
    if (!tableItem || !table_name || !selectedBrand || !outletid) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const statusValue = status === 'Active' ? 1 : 0;
      const payload = {
        table_name,
        outletid: outletid.toString(),
        hotelid: selectedBrand.toString(),
        marketid: tableItem.marketid || '1',
        status: statusValue,
        updated_by_id: user?.id || '2',
      };

      const res = await fetch(
        `http://localhost:3001/api/tablemanagement/${tableItem.tableid}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'Table updated successfully');
        const updatedTable: TableItem = {
          ...tableItem,
          table_name,
          outletid: outletid.toString(),
          hotelid: selectedBrand.toString(),
          status: statusValue.toString(),
          updated_by_id: user?.id || '2',
          updated_date: new Date().toISOString(),
        };
        onUpdateSelectedTable(updatedTable);
        onSuccess();
        onHide();
      } else {
        toast.error(data.message || 'Failed to update table');
      }
    } catch (err) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (!show || !tableItem) return null;

  return (
    <div
      className="modal"
      style={{
        display: 'block',
        background: 'rgba(0,0,0,0.5)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1050,
      }}
    >
      <div
        className="modal-content"
        style={{
          background: 'white',
          padding: '20px',
          maxWidth: '500px',
          margin: '100px auto',
          borderRadius: '8px',
        }}
      >
        <h3>Edit Table</h3>
        <div className="mb-3">
          <label className="form-label">Table Name <span style={{ color: 'red' }}>*</span></label>
          <input
            type="text"
            className="form-control"
            value={table_name}
            onChange={(e) => setTableName(e.target.value)}
            placeholder="e.g., Conference, 106, R15"
            disabled={loading}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Hotel Name <span style={{ color: 'red' }}>*</span></label>
          <select
            className="form-control"
            value={selectedBrand || ''}
            onChange={(e) => setSelectedBrand(e.target.value ? Number(e.target.value) : null)}
            disabled={loading}
          >
            <option value="">Select Hotel</option>
            {brands.map((brand) => (
              <option key={brand.hotelid} value={brand.hotelid}>
                {brand.hotel_name}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">Outlet Name <span style={{ color: 'red' }}>*</span></label>
          <select
            className="form-control"
            value={outletid || ''}
            onChange={(e) => setOutletId(e.target.value ? Number(e.target.value) : null)}
            disabled={loading}
          >
            <option value="">Select Outlet</option>
            {outlets.map((outlet) => (
              <option
                key={outlet.outletid}
                value={outlet.outletid}
                selected={outletid === outlet.outletid}
              >
                {outlet.outlet_name} ({outlet.outlet_code})
              </option>
            ))}
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">Status <span style={{ color: 'red' }}>*</span></label>
          <select
            className="form-control"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
        <div className="d-flex justify-content-end">
          <button
            className="btn btn-primary"
            onClick={handleEdit}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
          <button
            className="btn btn-outline-secondary ms-2"
            onClick={onHide}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default TableManagement;