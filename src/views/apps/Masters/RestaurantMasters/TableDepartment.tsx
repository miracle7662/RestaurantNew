import React, { useState, useCallback, useEffect, useMemo } from 'react';
import Swal from 'sweetalert2';
import { Preloader } from '@/components/Misc/Preloader';
import { toast } from 'react-hot-toast';
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
import { fetchOutletsForDropdown, fetchBrands } from '@/utils/commonfunction';
import { OutletData } from '@/common/api/outlet';
import axios from 'axios';

// Define TableItem interface
interface DepartmentItem {
  departmentid: number | string;
  department_name: string;
  hotel_name: string;
  outlet_name: string;
  outletid: number | string;
  hotelid: number | string;
  marketid: string;
  status: number;
  created_by_id: string;
  created_date: string;
  updated_by_id: string;
  updated_date: string;
  hotel_details?: string;
  outlet_details?: string;
  market_details?: string;
  taxgroupid?: number | string; // Added to support tax group
}

// TableModal Props
interface TableModalProps {
  show: boolean;
  onHide: () => void;
  DepartmentItem: DepartmentItem | null;
  onSuccess: () => void;
  onUpdateSelectedTable: (DepartmentItem: DepartmentItem) => void;
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

// Main TableDepartment Component
const TableDepartment: React.FC = () => {
  const [tableItems, setTableItems] = useState<DepartmentItem[]>([]);
  const [filteredTableItems, setFilteredTableItems] = useState<DepartmentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedTable, setSelectedTable] = useState<DepartmentItem | null>(null);
  const [outlets, setOutlets] = useState<OutletData[]>([]);
  const [brands, setBrands] = useState<Array<{ hotelid: number; hotel_name: string }>>([]);
  const { user } = useAuthContext();

  // Fetch table data
  const fetchTableDepartment = async (search: string = '') => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3001/api/table-department?search=${encodeURIComponent(search)}`, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const formattedData = data.data.map((item: any) => ({
            ...item,
            status: Number(item.status),
            taxgroupid: item.taxgroupid || '', // Default to empty string if not present
          }));
          setTableItems(formattedData);
          setFilteredTableItems(formattedData);
        } else {
          toast.error(data.message || 'Failed to fetch department data');
        }
      } else {
        toast.error('Failed to fetch department data');
      }
    } catch (err) {
      toast.error('Failed to fetch department data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTableDepartment(searchTerm);
    fetchBrands(user, setBrands);
    fetchOutletsForDropdown(user, setOutlets, setLoading);
  }, [user, searchTerm]);

  // Define table columns with action column shifted to the right
  const columns = useMemo<ColumnDef<DepartmentItem>[]>(
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
        accessorKey: 'departmentid',
        header: 'SrNo',
        size: 50,
        cell: (info) => <span>{info.getValue<string>()}</span>,
      },
      {
        accessorKey: 'department_name',
        header: 'Department Name',
        size: 150,
        cell: (info) => <span>{info.getValue<string>()}</span>,
      },
      {
        accessorKey: 'hotel_name',
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
        header: 'Active',
        size: 15,
        cell: (info) => {
          const statusValue = Number(info.getValue<number>());
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

  // Handle search
  const handleSearch = useCallback(
    debounce((value: string) => {
      setSearchTerm(value);
      let filtered = [...tableItems];

      if (value) {
        filtered = filtered.filter((item) =>
          item.department_name.toLowerCase().includes(value.toLowerCase()) ||
          item.hotel_name.toLowerCase().includes(value.toLowerCase()) ||
          item.outlet_name.toLowerCase().includes(value.toLowerCase())
        );
      }

      setFilteredTableItems(filtered);
    }, 300),
    [tableItems]
  );

  // Handle edit button click
  const handleEditClick = (table: DepartmentItem) => {
    setSelectedTable(table);
    setShowTableModal(true);
  };

  // Handle delete operation
  const handleDeleteTable = async (table: DepartmentItem) => {
    const res = await Swal.fire({
      title: 'Are you sure?',
      text: 'This will delete the department permanently!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3E97FF',
      confirmButtonText: 'Yes, delete it!',
    });
    if (res.isConfirmed) {
      try {
        const response = await fetch(
          `http://localhost:3001/api/table-department/${table.departmentid}`,
          {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
          }
        );
        const data = await response.json();
        if (response.ok && data.success) {
          toast.success(data.message || 'Department deleted successfully');
          fetchTableDepartment(searchTerm);
          setSelectedTable(null);
        } else {
          toast.error(data.message || 'Failed to delete department');
        }
      } catch {
        toast.error('Failed to delete department');
      }
    }
  };

  // TableModal Component (Combined Add/Edit Modal)
  const TableModal: React.FC<TableModalProps> = ({
    show,
    onHide,
    DepartmentItem,
    onSuccess,
    onUpdateSelectedTable,
  }) => {
    const [department_name, setDepartmentName] = useState<string>('');
    const [outletid, setOutletId] = useState<number | null>(null);
    const [status, setStatus] = useState<string>('Active');
    const [taxgroupid, setTaxGroupId] = useState<number | null>(null); // New state for tax group
    const [loading, setLoading] = useState<boolean>(false);
    const [outlets, setOutlets] = useState<OutletData[]>([]);
    const [brands, setBrands] = useState<Array<{ hotelid: number; hotel_name: string }>>([]);
    const [taxGroups, setTaxGroups] = useState<Array<{ taxgroupid: number; taxgroup_name: string }>>([]);
    const { user } = useAuthContext();

    // Fetch tax groups
    const fetchTaxGroups = async () => {
      try {
        setLoading(true);
        const taxGroupsRes = await axios.get('/api/taxgroup');
        setTaxGroups(Array.isArray(taxGroupsRes.data.data?.taxGroups) ? taxGroupsRes.data.data.taxGroups : []);
      } catch (err: any) {
        toast.error('Failed to fetch tax groups: ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      fetchTaxGroups();
      if (DepartmentItem) {
        setDepartmentName(DepartmentItem.department_name);
        setOutletId(DepartmentItem.outletid ? Number(DepartmentItem.outletid) : null);
        setStatus(DepartmentItem.status === 1 ? 'Active' : 'Inactive');
        setTaxGroupId(DepartmentItem.taxgroupid ? Number(DepartmentItem.taxgroupid) : null); // Initialize taxgroupid
      } else {
        setDepartmentName('');
        setOutletId(null);
        setStatus('Active');
        setTaxGroupId(null); // Reset taxgroupid for new entry
      }
      fetchOutletsForDropdown(user, setOutlets, setLoading);
      fetchBrands(user, setBrands);
    }, [DepartmentItem, user]);

    const handleSave = async () => {
      if (!department_name || !outletid || !taxgroupid) {
        toast.error('Please fill all required fields');
        return;
      }

      setLoading(true);
      try {
        const statusValue = status === 'Active' ? 1 : 0;
        const payload = {
          department_name,
          outletid: outletid.toString(),
          taxgroupid: taxgroupid.toString(), // Include taxgroupid in payload
          status: statusValue,
          ...(DepartmentItem
            ? {
                updated_by_id: user?.id || '2',
                updated_date: new Date().toISOString(),
              }
            : {
                created_by_id: user?.id || '1',
                created_date: new Date().toISOString(),
              }),
        };

        const url = DepartmentItem
          ? `http://localhost:3001/api/table-department/${DepartmentItem.departmentid}`
          : 'http://localhost:3001/api/table-department';
        const method = DepartmentItem ? 'PUT' : 'POST';

        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          toast.success(data.message || `Department ${DepartmentItem ? 'updated' : 'added'} successfully`);
          if (DepartmentItem) {
            const updatedTable: DepartmentItem = {
              ...DepartmentItem,
              department_name: department_name,
              outletid: outletid.toString(),
              taxgroupid: taxgroupid.toString(), // Update taxgroupid
              status: statusValue,
              updated_by_id: user?.id || '2',
              updated_date: new Date().toISOString(),
            };
            onUpdateSelectedTable(updatedTable);
          }
          setDepartmentName('');
          setOutletId(null);
          setStatus('Active');
          setTaxGroupId(null); // Reset taxgroupid
          onSuccess();
          onHide();
        } else {
          toast.error(data.message || `Failed to ${DepartmentItem ? 'update' : 'add'} department`);
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
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3 className="mb-0">{DepartmentItem ? 'Edit Department' : 'Add Outlet Department'}</h3>
            <button className="btn btn-sm btn-close" onClick={onHide}></button>
          </div>
          <div className="mb-3">
            <label className="form-label">Department Name <span style={{ color: 'red' }}>*</span></label>
            <input
              type="text"
              className="form-control"
              value={department_name}
              onChange={(e) => setDepartmentName(e.target.value)}
              placeholder="Enter Department Name"
              disabled={loading}
            />
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
            <label className="form-label">Tax Group <span style={{ color: 'red' }}>*</span></label>
            <select
              className="form-control"
              value={taxgroupid || ''} // Bind to taxgroupid state
              onChange={(e) => setTaxGroupId(e.target.value ? Number(e.target.value) : null)} // Update taxgroupid
              disabled={loading}
            >
              <option value="">Select Tax Group</option>
              {taxGroups.map((group) => (
                <option key={group.taxgroupid} value={group.taxgroupid}>
                  {group.taxgroup_name}
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
              className="btn btn-outline-secondary me-2"
              onClick={onHide}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? 'Saving...' : DepartmentItem ? 'Save' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <TitleHelmet title="Table Department" />
      <div style={{ height: '100vh', overflowY: 'auto', padding: '0 10px' }}>
        <Card className="m-1">
          <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
            <h4 className="mb-0">Table Department</h4>
            <div style={{ display: 'flex', gap: '4px' }}>
              <Button variant="success" className="me-1" onClick={() => {
                setSelectedTable(null);
                setShowTableModal(true);
              }}>
                <i className="bi bi-plus"></i> Add New
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
            </div>
            {loading ? (
              <Stack className="align-items-center justify-content-center flex-grow-1 h-100">
                <Preloader />
              </Stack>
            ) : (
              <div style={{ overflowY: 'auto', width: '100%' }}>
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
      <TableModal
        show={showTableModal}
        onHide={() => {
          setShowTableModal(false);
          setSelectedTable(null);
        }}
        DepartmentItem={selectedTable}
        onSuccess={() => fetchTableDepartment(searchTerm)}
        onUpdateSelectedTable={setSelectedTable}
      />
    </>
  );
};

export default TableDepartment;