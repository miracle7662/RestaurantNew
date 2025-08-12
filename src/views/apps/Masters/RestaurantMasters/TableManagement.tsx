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
  tablemanagementid: string;
  table_name: string;
  hotelid: number | string;
  outletid: number | string;
  status: string;
  created_by_id: string;
  created_date: string;
  updated_by_id: string;
  updated_date: string;
  marketid: string;
}

// Status badge for table
const getStatusBadge = (status: number) => {
  return status === 0 ? (
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
  msttablemanagement: TableItem | null;
  onSuccess: () => void;
  onUpdateSelectedTable: (msttablemanagement: TableItem) => void;
}

// Main TableManagement Component
const TableManagement: React.FC = () => {
  const [tableItems, setTableItems] = useState<TableItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showAddTableModal, setShowAddTableModal] = useState(false);
  const [showEditTableModal, setShowEditTableModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredTable, setFilteredTable] = useState<TableItem[]>([]);
  const [brands, setBrands] = useState<Array<{ hotelid: number; hotel_name: string }>>([]);
  const [outlets, setOutlets] = useState<OutletData[]>([]);
  const [selectedTable, setSelectedTable] = useState<TableItem | null>(null);
  const { user } = useAuthContext();

  // Fetch table data
  const fetchTableManagement = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/tablemanagement', {
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        setTableItems(data);
        setFilteredTable(data);
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
    fetchTableManagement();
    fetchBrands(user, setBrands);
    fetchOutletsForDropdown(user, setOutlets, setLoading);
  }, [user]);

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
        accessorKey: 'tablemanagementid',
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
        accessorKey: 'hotelid',
        header: 'Hotel Name',
        size: 150,
        cell: (info) => {
          const hotelId = info.getValue<number | string>();
          const brand = brands.find((brand) => brand.hotelid === Number(hotelId));
          return <span>{brand ? brand.hotel_name : hotelId}</span>;
        },
      },
      {
        accessorKey: 'outletid',
        header: 'Outlet Name',
        size: 200,
        cell: (info) => {
          const outletId = info.getValue<number | string>();
          const outlet = outlets.find((outlet) => outlet.outletid === Number(outletId));
          return <span>{outlet ? `${outlet.outlet_name} (${outlet.outlet_code})` : outletId}</span>;
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
    [brands, outlets]
  );

  // Initialize react-table
  const table = useReactTable({
    data: filteredTable,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  // Handle search
  const handleSearch = useCallback(
    debounce((value: string) => {
      setSearchTerm(value);
      const filtered = tableItems.filter((item) => {
        const brand = brands.find((brand) => brand.hotelid === Number(item.hotelid));
        const outlet = outlets.find((outlet) => outlet.outletid === Number(item.outletid));
        return (
          item.table_name.toLowerCase().includes(value.toLowerCase()) ||
          (brand && brand.hotel_name.toLowerCase().includes(value.toLowerCase())) ||
          (outlet && outlet.outlet_name.toLowerCase().includes(value.toLowerCase()))
        );
      });
      setFilteredTable(filtered);
    }, 300),
    [tableItems, brands, outlets]
  );

  // Handle edit button click
  const handleEditClick = (table: TableItem) => {
    setSelectedTable(table);
    setShowEditTableModal(true);
  };

  // Handle delete operation
  const handleDeleteTable = async (table: TableItem) => {
    const res = await Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to recover this table!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3E97FF',
      confirmButtonText: 'Yes, delete it!',
    });
    if (res.isConfirmed) {
      try {
        const response = await fetch(
          `http://localhost:3001/api/tablemanagement/${table.tablemanagementid}`,
          {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
          }
        );
        if (response.ok) {
          toast.success('Table deleted successfully');
          fetchTableManagement();
          setSelectedTable(null);
        } else {
          toast.error('Failed to delete table');
        }
      } catch {
        toast.error('Failed to delete table');
      }
    }
  };

  return (
    <>
      <TitleHelmet title="Table Management" />
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
          <div className="mb-3">
            <input
              type="text"
              className="form-control rounded-pill"
              placeholder="Search..."
              onChange={(e) => handleSearch(e.target.value)}
              style={{ width: '350px', borderColor: '#ccc', borderWidth: '2px' }}
            />
          </div>
          {loading ? (
            <Stack className="align-items-center justify-content-center flex-grow-1 h-100">
              <Preloader />
            </Stack>
          ) : (
            <div style={{ width: '100%', overflowX: 'auto' }}>
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
      <AddTableModal
        show={showAddTableModal}
        onHide={() => setShowAddTableModal(false)}
        onSuccess={fetchTableManagement}
      />
      <EditTableModal
        show={showEditTableModal}
        onHide={() => {
          setShowEditTableModal(false);
          setSelectedTable(null);
        }}
        msttablemanagement={selectedTable}
        onSuccess={fetchTableManagement}
        onUpdateSelectedTable={setSelectedTable}
      />
    </>
  );
};

// AddTableModal Component
const AddTableModal: React.FC<AddTableModalProps> = ({ show, onHide, onSuccess }) => {
  const [table_name, setTableName] = useState<string>('');
  const [status, setStatus] = useState<string>('Active');
  const [loading, setLoading] = useState<boolean>(false);
  const [outlets, setOutlets] = useState<OutletData[]>([]);
  const [selectedOutlet, setSelectedOutlet] = useState<number | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<number | null>(null);
  const [brands, setBrands] = useState<Array<{ hotelid: number; hotel_name: string }>>([]);
  const { user } = useAuthContext();

  // Fetch outlets
  useEffect(() => {
    fetchOutletsForDropdown(user, setOutlets, setLoading);
    fetchBrands(user, setBrands);
  }, [user]);

  // Handle form submission
  const handleAdd = async () => {
    if (!table_name || !status || !selectedOutlet || !selectedBrand) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const statusValue = status === 'Active' ? 0 : 1;
      const currentDate = new Date().toISOString();
      const payload = {
        table_name,
        hotelid: selectedBrand?.toString() || '1',
        outletid: selectedOutlet?.toString() || '1',
        status: statusValue,
        created_by_id: user?.id || '1',
        created_date: currentDate,
        marketid: '1',
      };

      const res = await fetch('http://localhost:3001/api/tablemanagement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success('Table added successfully');
        setTableName('');
        setStatus('Active');
        setSelectedOutlet(null);
        setSelectedBrand(null);
        onSuccess();
        onHide();
      } else {
        toast.error('Failed to add table');
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
        {/* Row 1: Outlet Name Dropdown */}
        <div className="mb-3">
          <label className="form-label">Outlet Name <span style={{ color: 'red' }}>*</span></label>
          <select
            className="form-control"
            value={selectedOutlet || ''}
            onChange={(e) => setSelectedOutlet(e.target.value ? Number(e.target.value) : null)}
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

        {/* Row 2: Hotel Name Dropdown */}
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

        {/* Row 3: Table Name */}
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

        {/* Row 4: Status */}
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

        {/* Buttons */}
        <div className="d-flex justify-content-end">
          <button
            className="btn btn-outline-secondary me-2"
            onClick={onHide}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleAdd}
            disabled={loading}
          >
            {loading ? 'Adding...' : 'Add'}
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
  msttablemanagement,
  onSuccess,
  onUpdateSelectedTable,
}) => {
  const [table_name, setTableName] = useState<string>('');
  const [status, setStatus] = useState<string>('Active');
  const [loading, setLoading] = useState<boolean>(false);
  const [outlets, setOutlets] = useState<OutletData[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<number | null>(null);
  const [brands, setBrands] = useState<Array<{ hotelid: number; hotel_name: string }>>([]);
  const [selectedOutlet, setSelectedOutlet] = useState<number | null>(null);
  const { user } = useAuthContext();

  // Initialize form fields when msttablemanagement changes
  useEffect(() => {
    if (msttablemanagement) {
      setTableName(msttablemanagement.table_name);
      setStatus(String(msttablemanagement.status) === '0' ? 'Active' : 'Inactive');
      setSelectedOutlet(msttablemanagement.outletid ? Number(msttablemanagement.outletid) : null);
      setSelectedBrand(msttablemanagement.hotelid ? Number(msttablemanagement.hotelid) : null);
    }
  }, [msttablemanagement]);

  // Fetch outlets
  useEffect(() => {
    fetchOutletsForDropdown(user, setOutlets, setLoading);
    fetchBrands(user, setBrands);
  }, [user]);

  // Handle form submission
  const handleEdit = async () => {
    if (!msttablemanagement || !table_name || !status || !selectedOutlet || !selectedBrand) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const statusValue = status === 'Active' ? 0 : 1;
      const currentDate = new Date().toISOString();
      const payload = {
        table_name,
        hotelid: selectedBrand?.toString() || '1',
        outletid: selectedOutlet?.toString() || '1',
        status: statusValue,
        updated_by_id: user?.id || '2',
        updated_date: currentDate,
      };

      const res = await fetch(
        `http://localhost:3001/api/tablemanagement/${msttablemanagement.tablemanagementid}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (res.ok) {
        toast.success('Table updated successfully');
        const updatedTable: TableItem = {
          ...msttablemanagement,
          table_name,
          hotelid: selectedBrand?.toString() || '1',
          outletid: selectedOutlet?.toString() || '1',
          status: statusValue.toString(),
          updated_by_id: user?.id || '2',
          updated_date: currentDate,
        };
        onUpdateSelectedTable(updatedTable);
        onSuccess();
        onHide();
      } else {
        toast.error('Failed to update table');
      }
    } catch (err) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (!show || !msttablemanagement) return null;

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

        {/* Outlet Name Dropdown */}
        <div className="mb-3">
          <label className="form-label">Outlet Name <span style={{ color: 'red' }}>*</span></label>
          <select
            className="form-control"
            value={selectedOutlet || ''}
            onChange={(e) => setSelectedOutlet(e.target.value ? Number(e.target.value) : null)}
            disabled={loading}
          >
            <option value="">Select Outlet</option>
            {outlets.map((outlet) => (
              <option
                key={outlet.outletid}
                value={outlet.outletid}
              >
                {outlet.outlet_name} ({outlet.outlet_code})
              </option>
            ))}
          </select>
        </div>

        {/* Hotel Name Dropdown */}
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
              <option
                key={brand.hotelid}
                value={brand.hotelid}
              >
                {brand.hotel_name}
              </option>
            ))}
          </select>
        </div>

        {/* Table Name Input */}
        <div className="mb-3">
          <label className="form-label">Table Name <span style={{ color: 'red' }}>*</span></label>
          <input
            type="text"
            className="form-control"
            value={table_name || ''}
            onChange={(e) => setTableName(e.target.value)}
            placeholder="e.g., Conference, 106, R15"
            disabled={loading}
          />
        </div>

        {/* Status Dropdown */}
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

        {/* Action Buttons */}
        <div className="d-flex justify-content-end">
          <button
            className="btn btn-outline-secondary me-2"
            onClick={onHide}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleEdit}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TableManagement;