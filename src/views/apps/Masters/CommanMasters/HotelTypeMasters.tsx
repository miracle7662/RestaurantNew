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

  // Fetch hotel types from API
  const fetchHoteltypes = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:3001/api/hoteltype');
      const data = await res.json();
      console.log('Fetched hotel types:', data); // Debug log
      setHoteltypeItems(data);
    } catch (err) {
      toast.error('Failed to fetch hotel types');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHoteltypes();
  }, []);

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
        await fetch(`http://localhost:3001/api/hoteltype/${hoteltype.hoteltypeid}`, { method: 'DELETE' });
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
  const HoteltypeModal: React.FC<HoteltypeModalProps> = ({ show, onHide, hoteltype, onSuccess, onUpdateSelectedHoteltype }) => {
    const [hotel_type, setName] = useState('');
    const [status, setStatus] = useState('Active');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      if (hoteltype) {
        setName(hoteltype.hotel_type);
        setStatus(hoteltype.status === 0 ? 'Active' : 'Inactive');
        console.log('Edit hoteltype status:', hoteltype.status, typeof hoteltype.status); // Debug log
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
          ...(hoteltype
            ? {
                hoteltypeid: hoteltype.hoteltypeid,
                updated_by_id: '2',
                updated_date: currentDate,
              }
            : {
                created_by_id: '1',
                created_date: currentDate,
              }),
        };
        console.log('Sending to backend:', payload); // Debug log

        const url = hoteltype
          ? `http://localhost:3001/api/hoteltype/${hoteltype.hoteltypeid}`
          : 'http://localhost:3001/api/hoteltype';
        const method = hoteltype ? 'PUT' : 'POST';

        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          toast.success(`Hotel type ${hoteltype ? 'updated' : 'added'} successfully`);
          if (hoteltype) {
            const updatedHoteltype = {
              ...hoteltype,
              hotel_type,
              status: statusValue,
              updated_by_id: '2',
              updated_date: currentDate,
            };
            onUpdateSelectedHoteltype(updatedHoteltype);
          }
          onSuccess();
          onHide();
        } else {
          const errorData = await res.json();
          console.log('Backend error:', errorData); // Debug log
          toast.error('Failed to save hotel type');
        }
      } catch (err) {
        console.error('Save hoteltype error:', err); // Debug log
        toast.error('Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    if (!show) return null;

    return (
      <Modal show={show} onHide={onHide} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{hoteltype ? 'Edit Hotel Type' : 'Add Hotel Type'}</Modal.Title>
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
          <Button variant="danger" onClick={onHide} disabled={loading}>
            Close
          </Button>
          <Button variant="success" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : hoteltype ? 'Save' : 'Create'}
          </Button>
        </Modal.Footer>
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
                    onChange={(e) => table.setPageSize(Number(e.target.value))}
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