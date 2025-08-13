import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Swal from 'sweetalert2';
import { toast } from 'react-hot-toast';
import { Button, Stack, Pagination, Table, Modal, Form } from 'react-bootstrap';
import { Preloader } from '@/components/Misc/Preloader';
import TitleHelmet from '@/components/Common/TitleHelmet';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table';

// Interfaces
interface HotelTypeItem {
  hoteltypeid: string;
  hotel_type: string;
  description?: string;
  status: number;
  created_by_id: string;
  created_date: string;
  updated_by_id: string;
  updated_date: string;
}

// Utility debounce function
const debounce = <T extends (...args: any[]) => void>(func: T, wait: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Status badge component
const getStatusBadge = (status: number) => {
  return status === 0 ? (
    <span className="badge bg-success">Active</span>
  ) : (
    <span className="badge bg-danger">Inactive</span>
  );
};

const HotelTypeMasters: React.FC = () => {
  const [hotelTypeItems, setHotelTypeItems] = useState<HotelTypeItem[]>([]);
  const [filteredHotelTypes, setFilteredHotelTypes] = useState<HotelTypeItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHotelType, setSelectedHotelType] = useState<HotelTypeItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Fetch hotel types
  const fetchHotelTypes = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/hoteltype');
      const data = await res.json();
      setHotelTypeItems(data);
      setFilteredHotelTypes(data);
    } catch {
      toast.error('Failed to fetch hotel types');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotelTypes();
  }, []);

  // Columns definition
  const columns = useMemo<ColumnDef<HotelTypeItem>[]>(() => [
    {
      id: 'srNo',
      header: 'Sr No',
      size: 20,
      cell: (cell) => <span>{cell.row.index + 1}</span>,
    },
    {
      accessorKey: 'hotel_type',
      header: 'Hotel Type',
      size: 200,
      cell: (cell) => <h6 className="mb-1">{cell.getValue<string>()}</h6>,
    },
    {
      accessorKey: 'description',
      header: 'Description',
      size: 300,
      cell: (cell) => <span>{cell.getValue<string>() || 'N/A'}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 100,
      cell: (cell) => getStatusBadge(Number(cell.getValue<number>())),
    },
    {
      id: 'actions',
      header: 'Actions',
      size: 120,
      cell: (cell) => (
        <div className="d-flex gap-2">
          <Button
            size="sm"
            variant="success"
            onClick={() => {
              setSelectedHotelType(cell.row.original);
              setShowEditModal(true);
            }}
            title="Edit Hotel Type"
          >
            <i className="fi fi-rr-edit" />
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleDeleteHotelType(cell.row.original)}
            title="Delete Hotel Type"
          >
            <i className="fi fi-rr-trash" />
          </Button>
        </div>
      ),
    },
  ], []);

  // React Table instance
  const table = useReactTable({
    data: filteredHotelTypes,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  // Debounced search filter
  const filterHotelTypes = useCallback(
    debounce((value: string) => {
      const searchValue = value.toLowerCase();
      const filtered = hotelTypeItems.filter((item) =>
        item.hotel_type.toLowerCase().includes(searchValue) ||
        (item.description && item.description.toLowerCase().includes(searchValue))
      );
      setFilteredHotelTypes(filtered);
    }, 500),
    [hotelTypeItems]
  );

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    filterHotelTypes(value);
  };

  // Delete handler
  const handleDeleteHotelType = async (hotelType: HotelTypeItem) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to recover this hotel type!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3E97FF',
      confirmButtonText: 'Yes, delete it!',
    });

    if (result.isConfirmed) {
      try {
        await fetch(`http://localhost:3001/api/hoteltype/${hotelType.hoteltypeid}`, { method: 'DELETE' });
        toast.success('Hotel type deleted successfully');
        fetchHotelTypes();
        setSelectedHotelType(null);
      } catch {
        toast.error('Failed to delete hotel type');
      }
    }
  };

  // Modal component for Add/Edit
  const HotelTypeModal: React.FC<{
    show: boolean;
    onHide: () => void;
    hotelType?: HotelTypeItem | null;
    onSuccess: () => void;
  }> = ({ show, onHide, hotelType, onSuccess }) => {
    const [hotel_type, setHotelType] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState('Active');
    const [loading, setLoading] = useState(false);

    const isEditMode = !!hotelType;

    useEffect(() => {
      if (hotelType && isEditMode) {
        setHotelType(hotelType.hotel_type);
        setDescription(hotelType.description || '');
        setStatus(hotelType.status === 0 ? 'Active' : 'Inactive');
      } else {
        setHotelType('');
        setDescription('');
        setStatus('Active');
      }
    }, [hotelType, show]);

    const handleSubmit = async () => {
      if (!hotel_type) {
        toast.error('Hotel Type is required');
        return;
      }

      setLoading(true);
      try {
        const statusValue = status === 'Active' ? 0 : 1;
        const payload = {
          hotel_type,
          description,
          status: statusValue,
          ...(isEditMode ? { hoteltypeid: hotelType!.hoteltypeid } : {}),
        };

        const url = isEditMode
          ? `http://localhost:3001/api/hoteltype/${hotelType!.hoteltypeid}`
          : 'http://localhost:3001/api/hoteltype';
        const method = isEditMode ? 'PUT' : 'POST';

        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          toast.success(`Hotel type ${isEditMode ? 'updated' : 'added'} successfully`);
          onSuccess();
          onHide();
        } else {
          toast.error(`Failed to ${isEditMode ? 'update' : 'add'} hotel type`);
        }
      } catch {
        toast.error('Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    return (
      <Modal show={show} onHide={onHide}>
        <Modal.Header closeButton>
          <Modal.Title>{isEditMode ? 'Edit Hotel Type' : 'Add Hotel Type'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Hotel Type *</Form.Label>
              <Form.Control
                type="text"
                value={hotel_type}
                onChange={(e) => setHotelType(e.target.value)}
                placeholder="Enter hotel type"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter description"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={loading}>
            {loading ? (isEditMode ? 'Updating...' : 'Adding...') : 'Save'}
          </Button>
        </Modal.Footer>
      </Modal>
    );
  };

  return (
    <>
      <TitleHelmet title="Hotel Type Management" />
      <div className="d-flex" style={{ height: 'calc(100vh - 70px)' }}>
        <div className="flex-grow-1" style={{ overflowY: 'auto' }}>
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap" style={{ maxWidth: '100%', gap: '10px' }}>
            <div className="d-flex align-items-center gap-3 flex-wrap" style={{ flexGrow: 1, minWidth: '300px' }}>
              <h4 className="mb-0" style={{ minWidth: '200px' }}>Hotel Type Master</h4>
              <input
                type="text"
                className="form-control rounded-pill"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                style={{ width: '250px' }}
              />
            </div>
            <div className="d-flex gap-2 flex-wrap">
              <Button variant="primary" onClick={() => alert('New Button Clicked')} className="mt-2 mt-sm-0">
                <i className="bi bi-plus-circle"></i> New Button
              </Button>
              <Button variant="success" onClick={() => setShowAddModal(true)} className="mt-2 mt-sm-0">
                <i className="bi bi-plus"></i> Add Hotel Type
              </Button>
            </div>
          </div>
          <div className="p-4">
            {loading ? (
              <Stack className="align-items-center justify-content-center h-100">
                <Preloader />
              </Stack>
            ) : (
              <>
                <Table responsive hover className="mb-4">
                  <thead style={{ backgroundColor: 'var(--window-gray-200)' }}>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <th key={header.id} style={{ width: header.column.columnDef.size, backgroundColor: 'var(--window-gray-200)' }}>
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
                          <td key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </Table>

                <Stack direction="horizontal" className="justify-content-between align-items-center">
                  <div>
                    <span className="text-muted">
                      Showing {table.getRowModel().rows.length} of {filteredHotelTypes.length} entries
                    </span>
                  </div>
                  <Pagination>
                    <Pagination.Prev
                      onClick={() => table.setPageIndex(table.getState().pagination.pageIndex - 1)}
                      disabled={!table.getCanPreviousPage()}
                    />
                    <Pagination.Item active>
                      {table.getState().pagination.pageIndex + 1}
                    </Pagination.Item>
                    <Pagination.Next
                      onClick={() => table.setPageIndex(table.getState().pagination.pageIndex + 1)}
                      disabled={!table.getCanNextPage()}
                    />
                  </Pagination>
                </Stack>
              </>
            )}
          </div>
        </div>
      </div>

      <HotelTypeModal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        onSuccess={fetchHotelTypes}
      />

      <HotelTypeModal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        hotelType={selectedHotelType}
        onSuccess={fetchHotelTypes}
      />
    </>
  );
};

export default HotelTypeMasters;
