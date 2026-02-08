import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { Preloader } from '@/components/Misc/Preloader';
import { toast } from 'react-hot-toast';
import { Button, Card, Stack, Table } from 'react-bootstrap';
import TitleHelmet from '@/components/Common/TitleHelmet';
import { useAuthContext } from '@/common';
import { fetchOutletsForDropdown, fetchBrands } from '@/utils/commonfunction';
import { OutletData } from '@/common/api/outlet';
import axios from 'axios';
import TableDepartmentService from '@/common/api/tabledepartment';
import PaginationComponent from '@/components/Common/PaginationComponent';

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
  taxgroupid?: number | string;
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


// Main TableDepartment Component
const TableDepartment: React.FC = () => {
  const [tableItems, setTableItems] = useState<DepartmentItem[]>([]);
  const [filteredTableItems, setFilteredTableItems] = useState<DepartmentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedTable, setSelectedTable] = useState<DepartmentItem | null>(null);
  const [outlets, setOutlets] = useState<OutletData[]>([]);
  const [, setBrands] = useState<Array<{ hotelid: number; hotel_name: string }>>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const { user } = useAuthContext();

  // Fetch table data
  const fetchTableDepartment = async () => {
    setLoading(true);
    try {
      const data = await TableDepartmentService.list();
      const formattedData = data.data.map((item: any) => ({
        ...item,
        status: Number(item.status),
        taxgroupid: item.taxgroupid || '',
      }));
      setTableItems(formattedData);
      setFilteredTableItems(formattedData);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch department data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTableDepartment();
    fetchBrands(user, setBrands);
    fetchOutletsForDropdown(user, setOutlets, setLoading);
  }, [user]);

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    const filtered = tableItems.filter(
      (item) =>
        item.department_name.toLowerCase().includes(value.toLowerCase()) ||
        item.hotel_name.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredTableItems(filtered);
    setCurrentPage(1); // Reset to first page on search
  };

  // Pagination logic
  const totalItems = filteredTableItems.length;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentItems = filteredTableItems.slice(startIndex, endIndex);

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
        await TableDepartmentService.remove(Number(table.departmentid));
        toast.success('Department deleted successfully');
        fetchTableDepartment();
        setSelectedTable(null);
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to delete department');
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
    const [taxgroupid, setTaxGroupId] = useState<number | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [outlets, setOutlets] = useState<OutletData[]>([]);
    const [, setBrands] = useState<Array<{ hotelid: number; hotel_name: string }>>([]);
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
        setTaxGroupId(DepartmentItem.taxgroupid ? Number(DepartmentItem.taxgroupid) : null);
      } else {
        setDepartmentName('');
        setOutletId(null);
        setStatus('Active');
        setTaxGroupId(null);
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
          taxgroupid: taxgroupid.toString(),
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

        try {
          if (DepartmentItem) {
            await TableDepartmentService.update(Number(DepartmentItem.departmentid), payload);
            const updatedTable: DepartmentItem = {
              ...DepartmentItem,
              department_name: department_name,
              outletid: outletid.toString(),
              taxgroupid: taxgroupid.toString(),
              status: statusValue,
              updated_by_id: user?.id || '2',
              updated_date: new Date().toISOString(),
            };
            onUpdateSelectedTable(updatedTable);
          } else {
            await TableDepartmentService.create(payload);
          }
          toast.success(`Department ${DepartmentItem ? 'updated' : 'added'} successfully`);
          setDepartmentName('');
          setOutletId(null);
          setStatus('Active');
          setTaxGroupId(null);
          onSuccess();
          onHide();
        } catch (err: any) {
          toast.error(err.response?.data?.message || `Failed to ${DepartmentItem ? 'update' : 'add'} department`);
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
              value={taxgroupid || ''}
              onChange={(e) => setTaxGroupId(e.target.value ? Number(e.target.value) : null)}
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
                value={searchTerm}
                onChange={handleSearch}
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
                    <tr>
                      <th style={{ width: '50px', textAlign: 'center' }}>
                        <input type="checkbox" />
                      </th>
                      <th style={{ width: '50px', textAlign: 'center' }}>SrNo</th>
                      <th style={{ width: '150px', textAlign: 'center' }}>Department Name</th>
                      <th style={{ width: '200px', textAlign: 'center' }}>Outlet Name</th>
                      <th style={{ width: '100px', textAlign: 'center' }}>Active</th>
                      <th style={{ width: '100px', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((item, index) => {
                      const outletId = Number(item.outletid);
                      const outlet = outlets.find((outlet) => outlet.outletid === outletId);
                      return (
                        <tr key={item.departmentid}>
                          <td style={{ textAlign: 'center' }}>
                            <input type="checkbox" />
                          </td>
                          <td style={{ textAlign: 'center' }}>{item.departmentid}</td>
                          <td style={{ textAlign: 'center' }}>{item.department_name}</td>
                          <td style={{ textAlign: 'center' }}>
                            {outlet ? `${outlet.outlet_name} (${outlet.outlet_code})` : 'Unknown Outlet'}
                          </td>
                          <td style={{ textAlign: 'center' }}>{getStatusBadge(item.status)}</td>
                          <td style={{ textAlign: 'right' }}>
                            <div className="d-flex gap-2 justify-content-end">
                              <button
                                className="btn btn-sm btn-success"
                                style={{ padding: '4px 8px' }}
                                onClick={() => handleEditClick(item)}
                              >
                                <i className="fi fi-rr-edit"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => handleDeleteTable(item)}
                                style={{ padding: '4px 8px' }}
                              >
                                <i className="fi fi-rr-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
                <PaginationComponent
                  totalItems={totalItems}
                  pageSize={pageSize}
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={(size) => {
                    setPageSize(size);
                    setCurrentPage(1);
                  }}
                />
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
        onSuccess={() => fetchTableDepartment()}
        onUpdateSelectedTable={setSelectedTable}
      />
    </>
  );
};

export default TableDepartment;