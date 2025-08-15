
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Swal from 'sweetalert2';
import { toast } from 'react-hot-toast';
import { Button, Card, Stack, Pagination, Table, Modal, Form } from 'react-bootstrap';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table';
import { Preloader } from '@/components/Misc/Preloader';
import { ContactSearchBar, ContactSidebar } from '@/components/Apps/Contact';
import TitleHelmet from '@/components/Common/TitleHelmet';

// Interfaces
interface MessageMasterItem {
  messagemasterid: string;
  Department: string;
  message: string;
  fromdate: string;
  todate: string;
  status: number | string;
  created_by_id: string;
  created_date: string;
  updated_by_id: string;
  updated_date: string;
  hotelid: string;
  marketid: string;
}

interface Category {
  name: string;
  value: string;
  icon: string;
  badge?: number;
  badgeClassName?: string;
}

interface Label {
  name: string;
  value: string;
  gradient: string;
}

interface ModalProps {
  show: boolean;
  onHide: () => void;
  onSuccess: () => void;
}

interface EditMessageMasterModalProps extends ModalProps {
  mstmessagemaster: MessageMasterItem | null;
  onUpdateSelectedMessageMaster: (MessageMasterItem: MessageMasterItem) => void;
}

// Utility Functions
const debounce = <T extends (...args: any[]) => void>(func: T, wait: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const getStatusBadge = (status: number | string) => {
  return status == '0' || status === 0 ? (
    <span className="badge bg-success">Active</span>
  ) : (
    <span className="badge bg-danger">Inactive</span>
  );
};

// Main Component
const MessageMaster: React.FC = () => {
  const [MessageMasterItem, setMessageMasterItem] = useState<MessageMasterItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('alls');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredMessageMaster, setFilteredMessageMaster] = useState<MessageMasterItem[]>([]);
  const [selectedMessageMaster, setSelectedMessageMaster] = useState<MessageMasterItem | null>(null);
  const [selectedMessageMasterIndex, setSelectedMessageMasterIndex] = useState<number>(-1);
  const [loading, setLoading] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [sidebarLeftToggle, setSidebarLeftToggle] = useState<boolean>(false);
  const [sidebarMiniToggle, setSidebarMiniToggle] = useState<boolean>(false);
  const [containerToggle, setContainerToggle] = useState<boolean>(false);

  const fetchMessageMaster = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/messagemaster');
      const data = await res.json();
      console.log('Fetched MessageMaster:', data);
      setMessageMasterItem(data);
      setFilteredMessageMaster(data);
    } catch {
      toast.error('Failed to fetch MessageMaster');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessageMaster();
  }, []);

  const columns = useMemo<ColumnDef<MessageMasterItem>[]>(() => [
    {
      id: 'srNo',
      header: 'Sr No',
      size: 10,
      cell: ({ row }) => <div style={{ textAlign: 'center' }}>{row.index + 1}</div>,
    },
    {
      accessorKey: 'Department',
      header: 'Department',
      size: 20,
      cell: ({ getValue }) => <div style={{ textAlign: 'center' }}>{getValue<string>()}</div>,
    },
    {
      accessorKey: 'message',
      header: 'Message',
      size: 20,
      cell: ({ getValue }) => <div style={{ textAlign: 'center' }}>{getValue<string>()}</div>,
    },
    {
      accessorKey: 'fromdate',
      header: 'From Date',
      size: 15,
      cell: ({ getValue }) => <div style={{ textAlign: 'center' }}>{getValue<string>()}</div>,
    },
    {
      accessorKey: 'todate',
      header: 'To Date',
      size: 15,
      cell: ({ getValue }) => <div style={{ textAlign: 'center' }}>{getValue<string>()}</div>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 10,
      cell: (info) => {
        const statusValue = info.getValue<string | number>();
        console.log('Status value:', statusValue, typeof statusValue);
        return <div style={{ textAlign: 'center' }}>{getStatusBadge(statusValue)}</div>;
      },
    },
    {
      id: 'actions',
      header: () => <div style={{ textAlign: 'center' }}>Actions</div>,
      size: 20,
      cell: ({ row }) => (
        <div className="d-flex gap-2 justify-content-center">
          <Button
            size="sm"
            variant="success"
            onClick={() => {
              setSelectedMessageMaster(row.original);
              setShowEditModal(true);
            }}
            style={{ padding: '4px 8px' }}
            title="Edit MessageMaster"
          >
            <i className="fi fi-rr-edit" />
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleDeleteMessageMaster(row.original)}
            style={{ padding: '4px 8px' }}
            title="Delete MessageMaster"
          >
            <i className="fi fi-rr-trash" />
          </Button>
        </div>
      ),
    },
  ], []);

  const table = useReactTable({
    data: filteredMessageMaster,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: { pagination: { pageSize: 10 } },
    state: { globalFilter: searchTerm },
  });

  const categories: Category[] = useMemo(
    () => [
      {
        name: 'Messages',
        value: 'alls',
        icon: 'fi-rr-globe',
        badge: MessageMasterItem.length,
        badgeClassName: 'bg-primary-subtle text-primary',
      },
    ],
    [MessageMasterItem.length]
  );

  const labels: Label[] = useMemo(
    () => [
      { name: 'North America', value: 'north_america', gradient: 'success' },
      { name: 'Europe', value: 'europe', gradient: 'warning' },
      { name: 'Asia', value: 'asia', gradient: 'danger' },
      { name: 'Africa', value: 'africa', gradient: 'info' },
    ],
    []
  );

  const handleSearch = useCallback(
    debounce((value: string) => {
      table.setGlobalFilter(value);
    }, 300),
    [table]
  );

  const onSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchTerm(value);
      handleSearch(value);
    },
    [handleSearch]
  );

  const handleCategoryChange = useCallback(
    (categoryValue: string) => {
      setSelectedCategory(categoryValue);
      setSearchTerm('');
      setFilteredMessageMaster(MessageMasterItem);
      table.setGlobalFilter('');
    },
    [MessageMasterItem, table]
  );

  const handleMessageMasterItemClick = useCallback((mstmessagemaster: MessageMasterItem) => {
    setSelectedMessageMaster(mstmessagemaster);
    setContainerToggle(true);
  }, []);

  const handleDeleteMessageMaster = async (mstmessagemaster: MessageMasterItem) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to recover this MessageMaster!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3E97FF',
      confirmButtonText: 'Yes, delete it!',
    });

    if (result.isConfirmed) {
      try {
        await fetch(`http://localhost:3001/api/messagemaster/${mstmessagemaster.messagemasterid}`, { method: 'DELETE' });
        toast.success('Deleted successfully');
        fetchMessageMaster();
        setSelectedMessageMaster(null);
        setContainerToggle(false);
      } catch {
        toast.error('Failed to delete');
      }
    }
  };

  useEffect(() => {
    const index = filteredMessageMaster.findIndex(
      (mst_Item_Main_Group) => mst_Item_Main_Group.messagemasterid === selectedMessageMaster?.messagemasterid
    );
    setSelectedMessageMasterIndex(index);
  }, [filteredMessageMaster, selectedMessageMaster]);

  const handleNext = useCallback(() => {
    if (selectedMessageMasterIndex < filteredMessageMaster.length - 1) {
      setSelectedMessageMaster(filteredMessageMaster[selectedMessageMasterIndex + 1]);
      setContainerToggle(true);
    }
  }, [selectedMessageMasterIndex, filteredMessageMaster]);

  const handlePrev = useCallback(() => {
    if (selectedMessageMasterIndex > 0) {
      setSelectedMessageMaster(filteredMessageMaster[selectedMessageMasterIndex - 1]);
      setContainerToggle(true);
    }
  }, [selectedMessageMasterIndex, filteredMessageMaster]);

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
          style={{ borderRadius: '4px', fontSize: '14px', padding: '4px 12px' }}
        >
          {i + 1}
        </Pagination.Item>
      );
    }
    return items;
  };

  const cardClasses = useMemo(() => {
    const classes = ['apps-card'];
    if (sidebarMiniToggle) classes.push('apps-sidebar-mini-toggle');
    if (containerToggle) classes.push('apps-container-toggle');
    if (sidebarLeftToggle) classes.push('apps-sidebar-left-toggle');
    return classes.join(' ');
  }, [sidebarMiniToggle, containerToggle, sidebarLeftToggle]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 991.98 && sidebarLeftToggle) {
        setSidebarLeftToggle(false);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarLeftToggle]);

  const handleMenuClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setSidebarLeftToggle((prev) => !prev);
  }, []);

  return (
    <>
      <TitleHelmet title="Message Master List" />
      <style>
        {`
          .apps-card, .apps-sidebar-left, .apps-container {
            transition: all 0.3s ease-in-out;
          }
          .market-list-header {
            padding: 10px 15px;
            border-bottom: 1px solid #eee;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .market-table th {
            background-color: #f8f9fa;
            font-weight: 500;
            color: #495057;
            padding: 8px;
            text-align: center;
          }
          .market-table td {
            padding: 8px;
            vertical-align: middle;
            text-align: center;
          }
          .add-market-btn {
            background-color: #28a745;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            color: white;
            font-size: 14px;
          }
          .add-market-btn:hover {
            background-color: #218838;
          }
          .mobile-add-button-container {
            display: none;
            padding: 1rem;
            background: white;
            border-top: 1px solid #dee2e6;
            position: sticky;
            bottom: 0;
            z-index: 10;
          }
          @media (max-width: 991.98px) {
            .mobile-add-button-container {
              display: block;
            }
            .desktop-add-button {
              display: none;
            }
          }
        `}
      </style>
      <Card className={cardClasses}>
        <div className="apps-sidebar-mini w-70">
          <ContactSidebar
            categories={categories}
            labels={labels}
            selectedCategory={selectedCategory}
            handleCategoryChange={handleCategoryChange}
            setSidebarMiniToggle={setSidebarMiniToggle}
          />
        </div>
        <div className="apps-sidebar apps-sidebar-left apps-sidebar-md" style={{ maxWidth: '100%' }}>
          <div className="market-list-header">
            <ContactSearchBar
              searchTerm={searchTerm}
              handleSearch={(value: string) => {
                setSearchTerm(value);
                handleSearch(value);
              }}
            />
            <Button className="add-market-btn desktop-add-button" onClick={() => setShowAddModal(true)}>
              <i className="bi bi-plus"></i> Add Message
            </Button>
          </div>
          <div className="apps-sidebar-content" style={{ flexDirection: 'column', height: 'calc(100% - 60px)', minWidth: '250px', padding: '10px' }}>
            {loading ? (
              <Stack className="align-items-center justify-content-center h-100">
                <Preloader />
              </Stack>
            ) : (
              <>
                <Table responsive hover className="market-table" style={{ minWidth: '300px' }}>
                  <thead>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <th key={header.id} style={{ width: `${header.column.columnDef.size}%` }}>
                            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        className={selectedMessageMaster?.messagemasterid === row.original.messagemasterid ? 'active' : ''}
                        onClick={() => handleMessageMasterItemClick(row.original)}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </Table>
                <Stack className="p-2 border-top d-flex flex-row align-items-center justify-content-between" style={{ gap: '6px', padding: '8px 12px' }}>
                  <div>
                    <Form.Select
                      value={table.getState().pagination.pageSize}
                      onChange={(e) => table.setPageSize(Number(e.target.value))}
                      style={{ width: '100px', display: 'inline-block', marginRight: '10px', border: '1px solid #ced4da', borderRadius: '4px', padding: '4px 8px', fontSize: '14px' }}
                    >
                      <option value="5">5</option>
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                    </Form.Select>
                    <span className="text-muted">
                      Showing {table.getRowModel().rows.length} of {filteredMessageMaster.length} entries
                    </span>
                  </div>
                  <Pagination className="m-0" style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: 0 }}>
                    <Pagination.Prev
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                      style={{ border: '1px solid #ced4da', color: table.getCanPreviousPage() ? '#495057' : '#6c757d', padding: '4px 10px', borderRadius: '4px', backgroundColor: '#fff', fontSize: '14px' }}
                    >
                      <i className="fi fi-rr-angle-left" />
                    </Pagination.Prev>
                    {getPaginationItems()}
                    <Pagination.Next
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                      style={{ border: '1px solid #ced4da', color: table.getCanNextPage() ? '#495057' : '#6c757d', padding: '4px 10px', borderRadius: '4px', backgroundColor: '#fff', fontSize: '14px' }}
                    >
                      <i className="fi fi-rr-angle-right" />
                    </Pagination.Next>
                  </Pagination>
                </Stack>
                <div className="mobile-add-button-container">
                  <Button
                    variant="primary"
                    className="w-100"
                    onClick={() => setShowAddModal(true)}
                  >
                    <i className="fi fi-br-plus fs-10"></i>
                    <span className="ms-2">Add New Message</span>
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
        <div className={`apps-container ${containerToggle ? 'w-full' : ''}`}>
          <div className="apps-container-inner" style={{ minHeight: 'calc(100vh)' }}>
            {loading ? (
              <Stack className="align-items-center justify-content-center h-100">
                <Preloader />
              </Stack>
            ) : !selectedMessageMaster ? (
              <Stack
                className="d-none d-lg-flex align-items-center justify-content-center flex-grow-1 h-100 mx-auto text-center"
                style={{ maxWidth: '420px' }}
              >
                <i className="fi fi-rr-globe fs-48 mb-6"></i>
                <h4 className="fw-bold">Select a Message to view</h4>
                <p className="fs-15 fw-light text-muted mb-4">
                  Select a Message from the left sidebar to view its details.
                </p>
                <Button
                  variant="neutral"
                  className="desktop-add-button"
                  onClick={() => setShowAddModal(true)}
                >
                  <i className="fi fi-br-plus fs-10"></i>
                  <span className="ms-2">Add New Message</span>
                </Button>
              </Stack>
            ) : (
              <div>
                <div className="apps-contact-details-header p-3 border-bottom">
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                      <Button
                        variant="light"
                        size="sm"
                        className="btn-icon me-3"
                        onClick={() => {
                          setSelectedMessageMaster(null);
                          setContainerToggle(false);
                          setSidebarLeftToggle(false);
                        }}
                      >
                        <i className="fi fi-rr-arrow-left"></i>
                      </Button>
                      <h5 className="mb-1">Message Details</h5>
                    </div>
                    <div className="d-flex gap-2">
                      <Button
                        variant="light"
                        className="btn-icon"
                        onClick={handleMenuClick}
                        style={{ padding: '8px', fontSize: '1.2rem' }}
                      >
                        <i className="fi fi-rr-menu-burger"></i>
                      </Button>
                      <Button
                        variant="light"
                        className="btn-icon"
                        onClick={handlePrev}
                        disabled={selectedMessageMasterIndex <= 0}
                        style={{ padding: '8px', fontSize: '1.2rem' }}
                      >
                        <i className="fi fi-rr-angle-left"></i>
                      </Button>
                      <Button
                        variant="light"
                        className="btn-icon"
                        onClick={handleNext}
                        disabled={selectedMessageMasterIndex >= filteredMessageMaster.length - 1}
                        style={{ padding: '8px', fontSize: '1.2rem' }}
                      >
                        <i className="fi fi-rr-angle-right"></i>
                      </Button>
                      <Button
                        variant="light"
                        className="btn-icon"
                        onClick={() => handleDeleteMessageMaster(selectedMessageMaster)}
                        style={{ padding: '8px', fontSize: '1.2rem' }}
                      >
                        <i className="fi fi-rr-trash"></i>
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="apps-contact-details p-4">
                  <div className="mb-4">
                    <h5 className="mb-2">{selectedMessageMaster.Department}</h5>
                    <p className="text-muted mb-0">Message: {selectedMessageMaster.message}</p>
                  </div>
                  <div className="mb-4">
                    <p className="text-muted mb-0">From Date: {selectedMessageMaster.fromdate}</p>
                  </div>
                  <div className="mb-4">
                    <p className="text-muted mb-0">To Date: {selectedMessageMaster.todate}</p>
                  </div>
                  <div className="mb-4">
                    <p className="text-muted mb-0">Status: {getStatusBadge(selectedMessageMaster.status)}</p>
                  </div>
                  <div className="mb-4">
                    <p className="text-muted mb-0">Created By: {selectedMessageMaster.created_by_id}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="custom-backdrop" onClick={() => setSidebarMiniToggle(false)} />
      </Card>
      <AddMessageMasterModal show={showAddModal} onHide={() => setShowAddModal(false)} onSuccess={fetchMessageMaster} />
      <EditMessageMasterModal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        mstmessagemaster={selectedMessageMaster}
        onSuccess={fetchMessageMaster}
        onUpdateSelectedMessageMaster={setSelectedMessageMaster}
      />
    </>
  );
};

// Add MessageMaster Modal
const AddMessageMasterModal: React.FC<ModalProps> = ({ show, onHide, onSuccess }) => {
  const [Department, setDepartment] = useState('');
  const [message, setMessage] = useState('');
  const [fromdate, setFromDate] = useState('');
  const [todate, setToDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('Active');

  const handleAdd = async () => {
    if (!Department || !message || !fromdate || !todate || !status) {
      toast.error('All fields are required');
      return;
    }

    setLoading(true);
    try {
      const statusValue = status === 'Active' ? 0 : 1;
      const currentDate = new Date().toISOString();
      const payload = {
        Department,
        message,
        fromdate,
        todate,
        status: statusValue,
        created_by_id: '1',
        created_date: currentDate,
        hotelid: '1',
        marketid: '1',
      };
      console.log('Sending to backend:', payload);
      const res = await fetch('http://localhost:3001/api/messagemaster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success('MessageMaster added successfully');
        setDepartment('');
        setMessage('');
        setFromDate('');
        setToDate('');
        setStatus('Active');
        onSuccess();
        onHide();
      } else {
        toast.error('Failed to add MessageMaster');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton style={{ borderBottom: '1px solid #eee', padding: '12px 20px' }}>
        <Modal.Title style={{ fontSize: '18px', color: '#333' }}>Add MessageMaster</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ padding: '20px' }}>
        <Form.Group className="mb-3">
          <Form.Label style={{ fontSize: '14px', color: '#495057' }}>Department <span style={{ color: 'red' }}>*</span></Form.Label>
          <Form.Control
            type="text"
            value={Department}
            onChange={(e) => setDepartment(e.target.value)}
            style={{ border: '1px solid #ced4da', borderRadius: '4px', padding: '8px' }}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label style={{ fontSize: '14px', color: '#495057' }}>Message <span style={{ color: 'red' }}>*</span></Form.Label>
          <Form.Control
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={{ border: '1px solid #ced4da', borderRadius: '4px', padding: '8px' }}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label style={{ fontSize: '14px', color: '#495057' }}>From Date <span style={{ color: 'red' }}>*</span></Form.Label>
          <Form.Control
            type="date"
            value={fromdate}
            onChange={(e) => setFromDate(e.target.value)}
            style={{ border: '1px solid #ced4da', borderRadius: '4px', padding: '8px' }}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label style={{ fontSize: '14px', color: '#495057' }}>To Date <span style={{ color: 'red' }}>*</span></Form.Label>
          <Form.Control
            type="date"
            value={todate}
            onChange={(e) => setToDate(e.target.value)}
            style={{ border: '1px solid #ced4da', borderRadius: '4px', padding: '8px' }}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label style={{ fontSize: '14px', color: '#495057' }}>Status <span style={{ color: 'red' }}>*</span></Form.Label>
          <select
            className="form-control"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{ border: '1px solid #ced4da', borderRadius: '4px', padding: '8px', width: '100%' }}
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </Form.Group>
      </Modal.Body>
      <Modal.Footer style={{ borderTop: '1px solid #eee', padding: '12px 20px' }}>
        <Button
          variant="secondary"
          onClick={onHide}
          disabled={loading}
          style={{ borderRadius: '4px', padding: '6px 12px', fontSize: '14px' }}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleAdd}
          disabled={loading}
          style={{ borderRadius: '4px', padding: '6px 12px', fontSize: '14px' }}
        >
          {loading ? 'Adding...' : 'Add MessageMaster'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

// Edit MessageMaster Modal
const EditMessageMasterModal: React.FC<EditMessageMasterModalProps> = ({
  show,
  onHide,
  mstmessagemaster,
  onSuccess,
  onUpdateSelectedMessageMaster,
}) => {
  const [Department, setDepartment] = useState('');
  const [message, setMessage] = useState('');
  const [fromdate, setFromDate] = useState('');
  const [todate, setToDate] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mstmessagemaster) {
      setDepartment(mstmessagemaster.Department);
      setMessage(mstmessagemaster.message);
      setFromDate(mstmessagemaster.fromdate);
      setToDate(mstmessagemaster.todate);
      setStatus(String(mstmessagemaster.status) === '0' ? 'Active' : 'Inactive');
      console.log('Edit MessageMaster status:', mstmessagemaster.status, typeof mstmessagemaster.status);
    }
  }, [mstmessagemaster]);

  const handleEdit = async () => {
    if (!Department || !message || !fromdate || !todate || !status || !mstmessagemaster) {
      toast.error('All fields are required');
      return;
    }

    setLoading(true);
    try {
      const statusValue = status === 'Active' ? 0 : 1;
      const currentDate = new Date().toISOString();
      const payload = {
        Department,
        message,
        fromdate,
        todate,
        status: statusValue,
        messagemasterid: mstmessagemaster.messagemasterid,
        updated_by_id: '2',
        updated_date: currentDate,
        hotelid: mstmessagemaster.hotelid,
        marketid: mstmessagemaster.marketid,
      };
      console.log('Sending to backend:', payload);
      const res = await fetch(`http://localhost:3001/api/messagemaster/${mstmessagemaster.messagemasterid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success('MessageMaster updated successfully');
        onUpdateSelectedMessageMaster({
          ...mstmessagemaster,
          Department,
          message,
          fromdate,
          todate,
          status: statusValue,
          updated_by_id: '2',
          updated_date: currentDate,
        });
        onSuccess();
        onHide();
      } else {
        toast.error('Failed to update MessageMaster');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton style={{ borderBottom: '1px solid #eee', padding: '12px 20px' }}>
        <Modal.Title style={{ fontSize: '18px', color: '#333' }}>Edit MessageMaster</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ padding: '20px' }}>
        <Form.Group className="mb-3">
          <Form.Label style={{ fontSize: '14px', color: '#495057' }}>Department <span style={{ color: 'red' }}>*</span></Form.Label>
          <Form.Control
            type="text"
            value={Department}
            onChange={(e) => setDepartment(e.target.value)}
            style={{ border: '1px solid #ced4da', borderRadius: '4px', padding: '8px' }}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label style={{ fontSize: '14px', color: '#495057' }}>Message <span style={{ color: 'red' }}>*</span></Form.Label>
          <Form.Control
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={{ border: '1px solid #ced4da', borderRadius: '4px', padding: '8px' }}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label style={{ fontSize: '14px', color: '#495057' }}>From Date <span style={{ color: 'red' }}>*</span></Form.Label>
          <Form.Control
            type="date"
            value={fromdate}
            onChange={(e) => setFromDate(e.target.value)}
            style={{ border: '1px solid #ced4da', borderRadius: '4px', padding: '8px' }}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label style={{ fontSize: '14px', color: '#495057' }}>To Date <span style={{ color: 'red' }}>*</span></Form.Label>
          <Form.Control
            type="date"
            value={todate}
            onChange={(e) => setToDate(e.target.value)}
            style={{ border: '1px solid #ced4da', borderRadius: '4px', padding: '8px' }}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label style={{ fontSize: '14px', color: '#495057' }}>Status <span style={{ color: 'red' }}>*</span></Form.Label>
          <select
            className="form-control"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{ border: '1px solid #ced4da', borderRadius: '4px', padding: '8px', width: '100%' }}
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </Form.Group>
      </Modal.Body>
      <Modal.Footer style={{ borderTop: '1px solid #eee', padding: '12px 20px' }}>
        <Button
          variant="secondary"
          onClick={onHide}
          disabled={loading}
          style={{ borderRadius: '4px', padding: '6px 12px', fontSize: '14px' }}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleEdit}
          disabled={loading}
          style={{ borderRadius: '4px', padding: '6px 12px', fontSize: '14px' }}
        >
          {loading ? 'Updating...' : 'Update MessageMaster'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default MessageMaster;
