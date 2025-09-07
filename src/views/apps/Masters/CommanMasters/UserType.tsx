import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Swal from 'sweetalert2';
import { toast } from 'react-hot-toast';
import { Preloader } from '@/components/Misc/Preloader';
import { Button, Card, Stack, Pagination, Table, Form } from 'react-bootstrap';
import { useAuthContext } from '../../../../common/context/useAuthContext';
import TitleHelmet from '@/components/Common/TitleHelmet';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table';

interface UserTypeItem {
  User_type: string;
  usertypeid: number;
  status: string;
  created_by_id: number;
  created_date: string;
  Updated_by_id: number;
  updated_date: string;
  hotelid: number;
  marketid: string;
}

interface UserTypeModalProps {
  show: boolean;
  onHide: () => void;
  onSuccess: () => void;
  userType?: UserTypeItem | null;
  onUpdateSelectedUserType?: (userType: UserTypeItem) => void;
}

// Debounce utility function
const debounce = (func: (...args: any[]) => void, wait: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Main UserType Component
const UserType: React.FC = () => {
  const [UserTypeItem, setUserTypeItem] = useState<UserTypeItem[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedUserType, setSelectedUserType] = useState<UserTypeItem | null>(null);

  const fetchUserType = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:3001/api/UserType');
      const data = await res.json();
      console.log('Fetched user types:', data); // Debug log
      setUserTypeItem(data);
    } catch (err) {
      toast.error('Failed to fetch UserType');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserType();
  }, []);

  // Define columns for react-table with explicit widths
  const columns = useMemo<ColumnDef<UserTypeItem>[]>(
    () => [
      {
        id: 'srNo',
        header: 'Sr No',
        size: 50,
        cell: ({ row }) => <div style={{ textAlign: 'center' }}>{row.index + 1}</div>,
      },
      {
        accessorKey: 'User_type',
        header: 'User Type',
        size: 200,
        cell: (info) => <div style={{ textAlign: 'center' }}>{info.getValue<string>()}</div>,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 150,
        cell: (info) => {
          const statusValue = info.getValue<string | number>();
          console.log('Status value:', statusValue, typeof statusValue); // Debug log
          return <div style={{ textAlign: 'center' }}>{statusValue == '0' || statusValue === 0 ? 'Active' : 'Inactive'}</div>;
        },
      },
      {
        id: 'actions',
        header: () => <div style={{ textAlign: 'center' }}>Action</div>,
        size: 150,
        cell: ({ row }) => (
          <div className="d-flex gap-2 justify-content-center">
            <button
              className="btn btn-sm btn-success"
              onClick={() => {
                setSelectedUserType(row.original);
                setShowModal(true);
              }}
              title="Edit User Type"
            >
              <i className="fi fi-rr-edit"></i>
            </button>
            <button
              className="btn btn-sm btn-danger"
              onClick={() => handleDeleteUserType(row.original)}
              title="Delete User Type"
            >
              <i className="fi fi-rr-trash"></i>
            </button>
          </div>
        ),
      },
    ],
    []
  );

  // Initialize react-table with pagination
  const table = useReactTable({
    data: UserTypeItem,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
    state: {
      globalFilter: searchTerm,
    },
  });

  const handleSearch = useCallback(
    debounce((value: string) => {
      table.setGlobalFilter(value);
    }, 300),
    [table]
  );

  const onSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    handleSearch(value);
  };

  const handleDeleteUserType = async (usertype: UserTypeItem) => {
    const res = await Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to recover this user type!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3E97FF',
      confirmButtonText: 'Yes, delete it!',
    });
    if (res.isConfirmed) {
      try {
        await fetch(`http://localhost:3001/api/usertype/${usertype.usertypeid}`, { method: 'DELETE' });
        toast.success('Deleted successfully');
        fetchUserType();
        setSelectedUserType(null);
      } catch {
        toast.error('Failed to delete');
      }
    }
  };

  const getPaginationItems = () => {
    const items = [];
    const maxPagesToShow = 5;
    const pageIndex = table.getState().pagination.pageIndex;
    const totalPages = table.getPageCount();
    let startPage = Math.max(0, pageIndex - Math.floor(maxPagesToShow / 2));
    const endPage = Math.min(totalPages - 1, startPage + maxPagesToShow - 1);

    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(0, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <Pagination.Item
          key={i}
          active={i === pageIndex}
          onClick={() => table.setPageIndex(i)}
        >
          {i + 1}
        </Pagination.Item>
      );
    }
    return items;
  };

  return (
    <>
      <TitleHelmet title="User Type List" />
      <Card className="m-1">
        <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
          <h4 className="mb-0">User Type List</h4>
          <div style={{ display: 'flex', gap: '4px' }}>
            <Button
              variant="success"
              onClick={() => {
                setSelectedUserType(null);
                setShowModal(true);
              }}
            >
              <i className="bi bi-plus"></i> Add User Type
            </Button>
          </div>
        </div>
        <div className="p-3">
          <div className="mb-3">
            <input
              type="text"
              className="form-control rounded-pill"
              placeholder="Search..."
              value={searchTerm}
              onChange={onSearchChange}
              style={{ width: '350px', borderColor: '#ccc', borderWidth: '2px' }}
            />
          </div>
          <div className="flex-grow-1" style={{ overflowY: 'auto' }}>
            {loading ? (
              <Stack className="align-items-center justify-content-center flex-grow-1 h-100">
                <Preloader />
              </Stack>
            ) : (
              <>
                <Table responsive hover className="mb-4">
                  <thead>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <th key={header.id} style={{ width: header.column.columnDef.size, textAlign: header.id === 'actions' ? 'left' : 'center' }}>
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {table.getRowModel().rows.map((row) => (
                      <tr key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} style={{ textAlign: cell.column.id === 'actions' ? 'left' : 'center' }}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </Table>
                <Stack direction="horizontal" className="justify-content-between align-items-center">
                  <div>
                    <Form.Select
                      value={table.getState().pagination.pageSize}
                      onChange={(e) => table.setPageSize(Number(e.target.value))}
                      style={{ width: '100px', display: 'inline-block', marginRight: '10px' }}
                    >
                      <option value="5">5</option>
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                    </Form.Select>
                    <span className="text-muted">
                      Showing {table.getRowModel().rows.length} of {UserTypeItem.length} entries
                    </span>
                  </div>
                  <Pagination>
                    <Pagination.Prev
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                    />
                    {getPaginationItems()}
                    <Pagination.Next
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                    />
                  </Pagination>
                </Stack>
              </>
            )}
          </div>
        </div>
      </Card>
      <UserTypeModal
        show={showModal}
        onHide={() => setShowModal(false)}
        onSuccess={fetchUserType}
        userType={selectedUserType}
        onUpdateSelectedUserType={setSelectedUserType}
      />
    </>
  );
};

// Combined UserTypeModal Component
const UserTypeModal: React.FC<UserTypeModalProps> = ({ show, onHide, onSuccess, userType, onUpdateSelectedUserType }) => {
  const [User_type, setName] = useState('');
  const [status, setStatus] = useState('Active');
  const [loading, setLoading] = useState(false);
  const { user } = useAuthContext();
  const isEditMode = !!userType;

  useEffect(() => {
    if (userType && isEditMode) {
      setName(userType.User_type);
      setStatus(String(userType.status) === '0' ? 'Active' : 'Inactive');
      console.log('Edit userType status:', userType.status, typeof userType.status); // Debug log
    } else {
      setName('');
      setStatus('Active');
    }
  }, [userType, isEditMode]);

  const handleSubmit = async () => {
    if (!User_type || !status) {
      toast.error('All fields are required');
      return;
    }

    setLoading(true);
    try {
      const statusValue = status === 'Active' ? 0 : 1;
      const hotelId = user?.hotelid || '1';
      const currentDate = new Date().toISOString();
      const payload = {
        User_type,
        status: statusValue,
        ...(isEditMode ? { usertypeid: userType!.usertypeid, updated_by_id: user.id, updated_date: currentDate, hotelid: hotelId } : { created_by_id: user.id, created_date: currentDate, hotelid: hotelId } ),
      };
      console.log('Sending to backend:', payload); // Debug log

      const url = isEditMode
        ? `http://localhost:3001/api/usertype/${userType!.usertypeid}`
        : 'http://localhost:3001/api/usertype';
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(`UserType ${isEditMode ? 'updated' : 'added'} successfully`);
        if (isEditMode && userType && onUpdateSelectedUserType) {
          const updatedUserType = {
            ...userType,
            User_type,
            status: statusValue.toString(),
            updated_by_id: '2',
            updated_date: currentDate,
            usertypeid: userType.usertypeid,
          };
          onUpdateSelectedUserType(updatedUserType);
        }
        setName('');
        setStatus('Active');
        onSuccess();
        onHide();
      } else {
        const errorData = await res.json();
        console.log('Backend error:', errorData); // Debug log
        toast.error(`Failed to ${isEditMode ? 'update' : 'add'} usertype`);
      }
    } catch (err) {
      console.error(`${isEditMode ? 'Edit' : 'Add'} usertype error:`, err); // Debug log
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal" style={{ display: show ? 'block' : 'none', background: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      <div className="modal-content" style={{ background: 'white', padding: '20px', maxWidth: '600px', margin: '100px auto', borderRadius: '8px' }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">{isEditMode ? 'Edit User Type' : 'Add User Type'}</h5>
          <button className="btn-close" onClick={onHide}></button>
        </div>
        <div className="row mb-3">
          <div className="col-md-12">
            <label className="form-label">User Type <span style={{ color: 'red' }}>*</span></label>
            <input
              type="text"
              className="form-control"
              value={User_type}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter User Type"
            />
          </div>
        </div>
        <div className="row mb-3">
          <div className="col-md-12">
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
        </div>
        <div className="d-flex justify-content-end mt-4">
          <button className="btn btn-success me-2" onClick={handleSubmit} disabled={loading}>
            {loading ? (isEditMode ? 'Updating...' : 'Adding...') : (isEditMode ? 'Save' : 'Create')}
          </button>
          <button className="btn btn-danger" onClick={onHide} disabled={loading}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};



export default UserType;