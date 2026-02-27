import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Swal from 'sweetalert2';
import { toast } from 'react-hot-toast';
import { Button, Card, Stack, Pagination, Table, Modal, Form } from 'react-bootstrap';
import { Preloader } from '@/components/Misc/Preloader';
import TitleHelmet from '@/components/Common/TitleHelmet';
import { useAuthContext } from '../../../../common/context/useAuthContext';
import HotelTypeService from '@/common/api/hoteltype';

import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table';

// Interfaces
interface HoteltypeItem {
  hoteltypeid: number;
  hotelid: number;
  hotel_type: string;
  status: number;
  created_by_id: number;
  created_date: string;
  updated_by_id: number;
  updated_date: string;
}

interface HoteltypeModalProps {
  show: boolean;
  onHide: () => void;
  hoteltype: HoteltypeItem | null;
  onSuccess: () => void;
  onUpdateSelectedHoteltype: (hoteltype: HoteltypeItem) => void;
}


// Utility Functions
const debounce = (func: (...args: any[]) => void, wait: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Main Component
const HoteltypeMasters: React.FC = () => {
  const [hoteltypeItems, setHoteltypeItems] = useState<HoteltypeItem[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedHoteltype, setSelectedHoteltype] = useState<HoteltypeItem | null>(null);
  const { user } = useAuthContext();

  // Fetch hotel types on component mount
  useEffect(() => {
    fetchHoteltypes();
  }, []);

  // Fetch hotel types from API
 const fetchHoteltypes = async () => {
  try {
    setLoading(true);
    const response = await HotelTypeService.list(); // returns { success, count, data }

    if (response.success) {
      setHoteltypeItems(response.data); // data is HotelType[]
    } else {
      toast.error(response.message || 'Failed to fetch hotel types');
    }
  } catch (err) {
    console.error(err);
    toast.error('Failed to fetch hotel types');
  } finally {
    setLoading(false);
  }
};
  // Define columns for react-table with explicit widths
  const columns = useMemo<ColumnDef<HoteltypeItem>[]>(() => [
    {
      id: 'srNo',
      header: 'Sr No',
      size: 50,
      cell: ({ row }) => <div style={{ textAlign: 'center' }}>{row.index + 1}</div>,
    },
    {
      accessorKey: 'hotel_type',
      header: 'Hotel Type',
      size: 200,
      cell: (info) => <div style={{ textAlign: 'center' }}>{info.getValue<string>()}</div>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 150,
      cell: (info) => {
        const statusValue = info.getValue<number>();
        return <div style={{ textAlign: 'center' }}>{statusValue === 0 ? 'Active' : 'Inactive'}</div>;
      },
    },
    {
      id: 'actions',
      header: () => <div style={{ textAlign: 'center' }}>Action</div>,
      size: 150,
      cell: ({ row }) => (
        <div className="d-flex gap-2 justify-content-center">
          <Button
            size="sm"
            variant="success"
            onClick={() => {
              setSelectedHoteltype(row.original);
              setShowEditModal(true);
            }}
            title="Edit Hotel Type"
          >
            <i className="fi fi-rr-edit"></i>
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleDeleteHoteltype(row.original)}
            title="Delete Hotel Type"
          >
            <i className="fi fi-rr-trash"></i>
          </Button>
        </div>
      ),
    },
  ], []);

  // Initialize react-table with pagination
  const table = useReactTable({
    data: hoteltypeItems,
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

  const handleDeleteHoteltype = async (hoteltype: HoteltypeItem) => {
    const res = await Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to recover this hotel type!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3E97FF',
      confirmButtonText: 'Yes, delete it!',
    });
    if (res.isConfirmed) {
      try {
        await HotelTypeService.remove(hoteltype.hoteltypeid);
        toast.success('Deleted successfully');
        fetchHoteltypes();
        setSelectedHoteltype(null);
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

  // Modal for Add/Edit
  const HoteltypeModal = ({ show, onHide, onSuccess, hoteltype, onUpdateSelectedHoteltype }: HoteltypeModalProps) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
      hotel_type: hoteltype?.hotel_type || '',
      status: hoteltype ? (hoteltype.status === 0 ? 'Active' : 'Inactive') : 'Active',
    });

    const isEditMode = !!hoteltype;

    useEffect(() => {
      setFormData({
        hotel_type: hoteltype?.hotel_type || '',
        status: hoteltype ? (hoteltype.status === 0 ? 'Active' : 'Inactive') : 'Active',
      });
    }, [hoteltype]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      try {
        const statusValue = formData.status === 'Active' ? 0 : 1;
        const currentDate = new Date().toISOString();
        const hotelId = user?.hotelid || '1';
        const userId = user?.id || '1';
        const payload = {
          hotel_type: formData.hotel_type,
          status: statusValue,
          ...(isEditMode
            ? {
                updated_by_id: userId,
                updated_date: currentDate,
                hotelid: hoteltype!.hotelid || hotelId,
              }
            : {
                created_by_id: userId,
                created_date: currentDate,
                hotelid: hotelId,
              }),
        };

        try {
          if (isEditMode) {
            await HotelTypeService.update(hoteltype!.hoteltypeid, payload);
          } else {
            await HotelTypeService.create(payload);
          }
          toast.success(`Hotel type ${isEditMode ? 'updated' : 'added'} successfully`);

          if (isEditMode && hoteltype && onUpdateSelectedHoteltype) {
            onUpdateSelectedHoteltype({
              ...hoteltype,
              hotel_type: formData.hotel_type,
              status: statusValue,
              updated_by_id: userId,
              updated_date: currentDate,
            });
          }

          onSuccess();
          onHide();
        } catch (error: unknown) {
          toast.error((error as string) || `Failed to ${isEditMode ? 'update' : 'add'} hotel type`);
        }
      } catch (error) {
        toast.error('Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    return (
      <Modal show={show} onHide={onHide} >
        <Modal.Header closeButton>
          <Modal.Title>{isEditMode ? 'Edit Hotel Type' : 'Add Hotel Type'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-12 mb-3">
                <label>Hotel Type</label>
                <input
                  name="hotel_type"
                  value={formData.hotel_type}
                  onChange={handleInputChange}
                  placeholder="Enter hotel type name"
                  className="form-control"
                  required
                />
              </div>
            </div>
            <div className="row">
              <div className="col-md-12 mb-3">
                <label>Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="form-control"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
            <Modal.Footer>
              <Button variant="secondary" onClick={onHide} disabled={loading}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? (isEditMode ? 'Updating...' : 'Adding...') : 'Save'}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal.Body>
      </Modal>
    );
  };

  return (
    <>
      <TitleHelmet title="Hotel Type List" />
      <Card className="m-1">
        <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
          <h4 className="mb-0">Hotel Type List</h4>
          <div style={{ display: 'flex', gap: '4px' }}>
            <Button variant="success" onClick={() => setShowAddModal(true)}>
              <i className="bi bi-plus"></i> Add Hotel Type
            </Button>
          </div>
        </div>
        <div className="p-3">
          <div className="mb-3">
            <input
              type="text"
              className="form-control rounded-pill"
              placeholder="Search hotel types..."
              value={searchTerm}
              onChange={onSearchChange}
              style={{ width: '350px', borderColor: '#ccc', borderWidth: '2px' }}
            />
          </div>
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
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => table.setPageSize(Number(e.target.value))}
                    style={{ width: '100px', display: 'inline-block', marginRight: '10px' }}
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                  </Form.Select>
                  <span className="text-muted">
                    Showing {table.getRowModel().rows.length} of {hoteltypeItems.length} entries
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
      </Card>
      <HoteltypeModal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        hoteltype={null}
        onSuccess={fetchHoteltypes}
        onUpdateSelectedHoteltype={setSelectedHoteltype}
      />
      <HoteltypeModal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        hoteltype={selectedHoteltype}
        onSuccess={fetchHoteltypes}
        onUpdateSelectedHoteltype={setSelectedHoteltype}
      />
    </>
  );
};

export default HoteltypeMasters;