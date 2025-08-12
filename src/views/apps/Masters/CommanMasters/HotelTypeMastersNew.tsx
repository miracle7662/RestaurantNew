import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Swal from 'sweetalert2';
import { toast } from 'react-hot-toast';
import { Button, Card, Stack, Pagination, Table, Modal, Form, Row, Col } from 'react-bootstrap';
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
interface HoteltypeItem {
  hoteltypeid: string;
  hotel_type: string;
  status: number;
  created_by_id: string;
  created_date: string;
  updated_by_id: string;
  updated_date: string;
}

interface Category {
  name: string;
  value: string;
  icon: string;
  badge?: number;
  badgeClassName?: string;
}

interface HoteltypeModalProps {
  show: boolean;
  onHide: () => void;
  hoteltype?: HoteltypeItem | null;
  onSuccess: () => void;
  onUpdateSelectedHoteltype?: (hoteltype: HoteltypeItem) => void;
}

// Utility Functions
const debounce = <T extends (...args: any[]) => void>(func: T, wait: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Status badge for table
const getStatusBadge = (status: number) => {
  return status === 0 ? (
    <span className="badge bg-success">Active</span>
  ) : (
    <span className="badge bg-danger">Inactive</span>
  );
};

// Main Component
const HoteltypeMasters: React.FC = () => {
  const [hoteltypeItems, setHoteltypeItems] = useState<HoteltypeItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('alls');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredHoteltypes, setFilteredHoteltypes] = useState<HoteltypeItem[]>([]);

  // Debounced search handler
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      fetchHoteltypes(value);
    }, 500),
    []
  );
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };
  const [selectedHoteltype, setSelectedHoteltype] = useState<HoteltypeItem | null>(null);
  const [selectedHoteltypeIndex, setSelectedHoteltypeIndex] = useState<number>(-1);
  const [loading, setLoading] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [sidebarLeftToggle, setSidebarLeftToggle] = useState<boolean>(false);
  const [sidebarMiniToggle, setSidebarMiniToggle] = useState<boolean>(false);
  const [containerToggle, setContainerToggle] = useState<boolean>(false);

  // CRUD operations
  const handleDeleteHoteltype = async (hoteltype: HoteltypeItem) => {
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
        await fetch(`http://localhost:3001/api/hoteltype/${hoteltype.hoteltypeid}`, { method: 'DELETE' });
        toast.success('Deleted successfully');
        await fetchHoteltypes();
        setSelectedHoteltype(null);
      } catch {
        toast.error('Failed to delete');
      }
    }
  };

  // Fetch hotel types from API
  const fetchHoteltypes = async (search: string = '') => {
    setLoading(true);
    try {
      const url = search ? `http://localhost:3001/api/hoteltype?search=${encodeURIComponent(search)}` : 'http://localhost:3001/api/hoteltype';
      const res = await fetch(url);
      const data = await res.json();
      setHoteltypeItems(data);
      setFilteredHoteltypes(data);
    } catch {
      toast.error('Failed to fetch hotel types');
    } finally {
      setLoading(false);
    }
  };

  // Table columns
  const columns = useMemo<ColumnDef<HoteltypeItem>[]>(() => [
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
              setSelectedHoteltype(cell.row.original);
              setShowEditModal(true);
            }}
            title="Edit Hotel Type"
          >
            <i className="fi fi-rr-edit" />
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleDeleteHoteltype(cell.row.original)}
            title="Delete Hotel Type"
          >
            <i className="fi fi-rr-trash" />
          </Button>
        </div>
      ),
    },
  ], []);

  // Initialize table
  const table = useReactTable({
    data: filteredHoteltypes,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  // Main content component
  const MainContent = () => (
    <div className="flex-grow-1 p-4" style={{ overflowY: 'auto' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>Hotel Type Management</h4>
        <input
          type="text"
          className="form-control w-25"
          placeholder="Search Hotel Type"
          value={searchTerm}
          onChange={handleSearchChange}
          style={{ marginRight: '10px' }}
        />
        <Button variant="success" onClick={() => setShowAddModal(true)}>
          <i className="bi bi-plus"></i> Add Hotel Type
        </Button>
      </div>

      {loading ? (
        <Stack className="align-items-center justify-content-center h-100">
          <Preloader />
        </Stack>
      ) : (
        <>
          <Table responsive hover className="mb-4">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} style={{ width: header.column.columnDef.size }}>
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
                Showing {table.getRowModel().rows.length} of {filteredHoteltypes.length} entries
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
  );

  // Modal for Add/Edit
  const HoteltypeModal: React.FC<HoteltypeModalProps> = ({ show, onHide, hoteltype, onSuccess, onUpdateSelectedHoteltype }) => {
    const [hotel_type, setName] = useState('');
    const [status, setStatus] = useState('Active');
    const [loading, setLoading] = useState(false);

    const isEditMode = !!hoteltype;

    useEffect(() => {
      if (hoteltype && isEditMode) {
        setName(hoteltype.hotel_type);
        setStatus(hoteltype.status === 0 ? 'Active' : 'Inactive');
      } else {
        setName('');
        setStatus('Active');
      }
    }, [hoteltype, show]);

    const handleSubmit = async () => {
      if (!hotel_type || !status) {
        toast.error('All fields are required');
        return;
      }

      setLoading(true);
      try {
        const statusValue = status === 'Active' ? 0 : 1;
        const currentDate = new Date().toISOString();
        
        const payload = {
          hotel_type,
          status: statusValue,
          ...(isEditMode 
            ? { 
                hoteltypeid: hoteltype!.hoteltypeid,
                updated_by_id: '2',
                updated_date: currentDate
              }
            : {
                created_by_id: '1',
                created_date: currentDate
              }
          ),
        };

        const url = isEditMode
          ? `http://localhost:3001/api/hoteltype/${hoteltype!.hoteltypeid}`
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
          toast.error('Failed to save hotel type');
        }
      } catch {
        toast.error('Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    if (!show) return null;

    return (
      <Modal show={show} onHide={onHide} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{isEditMode ? 'Edit Hotel Type' : 'Add Hotel Type'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Hotel Type <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    value={hotel_type}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter hotel type name"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Status <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </Modal.Footer>
      </Modal>
    );
  };

  return (
    <>
      <TitleHelmet title="Hotel Type Management" />
      <div className="d-flex" style={{ height: 'calc(100vh - 60px)' }}>
        <MainContent />
      </div>
      
      <HoteltypeModal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        onSuccess={fetchHoteltypes}
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
