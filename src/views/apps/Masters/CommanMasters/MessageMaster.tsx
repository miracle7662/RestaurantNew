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
  status: number;
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
2
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
      setMessageMasterItem(data);
      setFilteredMessageMaster(data);
    } catch {
      toast.error('Failed to fetch messagemaster');
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
        cell: ({ row }) => <span>{row.index + 1}</span>,
      },
      
      {
        accessorKey: 'Department',
        header: 'Department ',
        size: 10,
        cell: ({ getValue }) => <h6 className="mb-1">{getValue<string>()}</h6>,
      },
      {
        accessorKey: 'message',
        header: 'Message ',
        size: 10,
        cell: ({ getValue }) => <h6 className="mb-1">{getValue<string>()}</h6>,
      },
      {
        accessorKey: 'fromdate',
        header: 'from date ',
        size: 10,
        cell: ({ getValue }) => <h6 className="mb-1">{getValue<string>()}</h6>,
      },
      {
        accessorKey: 'todate',
        header: 'to date ',
        size: 10,
        cell: ({ getValue }) => <h6 className="mb-1">{getValue<string>()}</h6>,
      },
  
  
      {
          accessorKey: 'status',
          header: 'Status',
          size: 10,
          cell: (info) => {
            const statusValue = info.getValue<string | number>();
            console.log('Status value:', statusValue, typeof statusValue); // Debug log
            return <div style={{ textAlign: 'left' }}>{statusValue == '0' || statusValue === 0 ? 'Active' : 'Inactive'}</div>;
          },
        },
      {
        id: 'actions',
        header: 'Actions',
        size: 20,
        cell: ({ row }) => (
          <div className="d-flex gap-2">
            <Button
              size="sm"
              variant="success"
              onClick={() => setShowEditModal(true)}
              style={{ padding: '4px 8px' }}
            >
              <i className="fi fi-rr-edit" />
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => handleDeleteMessageMaster(row.original)}
              style={{ padding: '4px 8px' }}
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
  });

  const categories: Category[] = useMemo(
    () => [
      {
        name: 'Countries',
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
      setSearchTerm(value);
      const filtered = MessageMasterItem.filter((item) =>
        item.Department.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredMessageMaster(filtered);
    }, 300),
    [MessageMasterItem]
  );

  const handleCategoryChange = useCallback(
    (categoryValue: string) => {
      setSelectedCategory(categoryValue);
      setSearchTerm('');
      setFilteredMessageMaster(MessageMasterItem);
    },
    [MessageMasterItem]
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
      } catch {
        toast.error('Failed to delete');
      }
    }
  };

  useEffect(() => {
    const index = filteredMessageMaster.findIndex((mst_Item_Main_Group) => mst_Item_Main_Group.messagemasterid === selectedMessageMaster?.messagemasterid);
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
      <TitleHelmet title="Market List" />
      <style>
        {`
          .apps-card, .apps-sidebar-left, .apps-container {
            transition: all 0.3s ease-in-out;
          }
          .market-list-header {
            padding: 10px 15px;
            border-bottom: 1px solid #eee;
            display: flex;
            justify-content: flex-end;
            align-items: center;
          }
          .market-table th {
            background-color: #f8f9fa;
            font-weight: 500;
            color: #495057;
            padding: 8px;
            text-align: left;
          }
          .market-table td {
            padding: 8px;
            vertical-align: middle;
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
            <Button className="add-market-btn" onClick={() => setShowAddModal(true)}>Add Market</Button>
          </div>
          <div className="apps-sidebar-content" style={{ flexDirection: 'column', height: 'calc(100% - 60px)', minWidth: '250px', padding: '10px' }}>
            <Table responsive className="market-table" style={{ minWidth: '300px' }}>
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
              <select
                value={table.getState().pagination.pageSize}
                onChange={(e) => table.setPageSize(Number(e.target.value))}
                style={{ border: '1px solid #ced4da', borderRadius: '4px', padding: '4px 8px', fontSize: '14px', backgroundColor: '#fff', color: '#495057', cursor: 'pointer', width: '80px', height: '34px' }}
              >
                {[10, 20, 30].map((pageSize) => (
                  <option key={pageSize} value={pageSize}>
                    {pageSize}
                  </option>
                ))}
              </select>
              <Pagination className="m-0" style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: 0 }}>
                <Pagination.Prev
                  onClick={() => table.setPageIndex(table.getState().pagination.pageIndex - 1)}
                  disabled={table.getState().pagination.pageIndex === 0}
                  style={{ border: '1px solid #ced4da', color: table.getState().pagination.pageIndex === 0 ? '#6c757d' : '#495057', padding: '4px 10px', borderRadius: '4px', backgroundColor: '#fff', fontSize: '14px' }}
                >
                  <i className="fi fi-rr-angle-left" />
                </Pagination.Prev>
                <Pagination.Item
                  active
                  style={{ backgroundColor: '#007bff', border: '1px solid #007bff', color: '#fff', padding: '4px 12px', borderRadius: '4px', fontSize: '14px' }}
                >
                  {table.getState().pagination.pageIndex + 1}
                </Pagination.Item>
                <Pagination.Next
                  onClick={() => table.setPageIndex(table.getState().pagination.pageIndex + 1)}
                  disabled={table.getState().pagination.pageIndex === table.getPageCount() - 1}
                  style={{ border: '1px solid #ced4da', color: table.getState().pagination.pageIndex === table.getPageCount() - 1 ? '#6c757d' : '#495057', padding: '4px 10px', borderRadius: '4px', backgroundColor: '#fff', fontSize: '14px' }}
                >
                  <i className="fi fi-rr-angle-right" />
                </Pagination.Next>
              </Pagination>
            </Stack>
          </div>
        </div>
        <div className={`apps-container ${containerToggle ? 'w-full' : ''}`}>
          {/* Existing container content remains unchanged */}
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
  const [messagemasterid, setmessagemasterid] = useState('');
  const [Department, setDepartment] = useState('');
  const [message, setmessage] = useState('');
  const [fromdate, setfromdate] = useState('');
  const [todate, settodate] = useState('');
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
        created_by_id: 1,
        created_date: currentDate,
      };
      console.log('Sending to backend:', payload);
      const res = await fetch('http://localhost:3001/api/messagemaster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success('ItemMainGroup added successfully');
        setDepartment('');
        setmessage('');
        setfromdate('');
        settodate('');
        setStatus('Active');
        onSuccess();
        onHide();
      } else {
        toast.error('Failed to add ItemMainGroup');
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
        <Modal.Title style={{ fontSize: '18px', color: '#333' }}>Add messagemaster</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ padding: '20px' }}>
        <Form.Group className="mb-3">
          <Form.Label style={{ fontSize: '14px', color: '#495057' }}>Department</Form.Label>
          <Form.Control type="text" value={Department} onChange={(e) => setDepartment(e.target.value)} style={{ border: '1px solid #ced4da', borderRadius: '4px', padding: '8px' }} />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label style={{ fontSize: '14px', color: '#495057' }}>message</Form.Label>
          <Form.Control type="text" value={message} onChange={(e) => setmessage(e.target.value)} style={{ border: '1px solid #ced4da', borderRadius: '4px', padding: '8px' }} />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label style={{ fontSize: '14px', color: '#495057' }}>from date</Form.Label>
          <Form.Control type="text" value={fromdate} onChange={(e) => setfromdate(e.target.value)} style={{ border: '1px solid #ced4da', borderRadius: '4px', padding: '8px' }} />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label style={{ fontSize: '14px', color: '#495057' }}>to date</Form.Label>
          <Form.Control type="text" value={todate} onChange={(e) => settodate(e.target.value)} style={{ border: '1px solid #ced4da', borderRadius: '4px', padding: '8px' }} />
        </Form.Group>
        <Form.Group className="mb-3">
          <div className="col-md-12">
            <label className="form-label" style={{ fontSize: '14px', color: '#495057' }}>Status <span style={{ color: 'red' }}>*</span></label>
            <select
              className="form-control"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{ border: '1px solid #ced4da', borderRadius: '4px', padding: '8px', width: '100%' }}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </Form.Group>
      </Modal.Body>
      <Modal.Footer style={{ borderTop: '1px solid #eee', padding: '12px 20px' }}>
        <Button variant="secondary" onClick={onHide} disabled={loading} style={{ borderRadius: '4px', padding: '6px 12px', fontSize: '14px' }}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleAdd} disabled={loading} style={{ borderRadius: '4px', padding: '6px 12px', fontSize: '14px' }}>
          {loading ? 'Adding...' : 'Add ItemMainGroup'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

// Edit ItemMainGroup Modal
const EditMessageMasterModal: React.FC<EditMessageMasterModalProps> = ({ show, onHide, mstmessagemaster, onSuccess, onUpdateSelectedMessageMaster }) => {
  const [Department, setDepartment] = useState('');
  const [message, setmessage] = useState('');
  const [fromdate, setfromdate] = useState('');
  const [todate, settodate] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (mstmessagemaster) {
      setDepartment(mstmessagemaster.Department);
      setmessage(mstmessagemaster.message);
      setfromdate(mstmessagemaster.fromdate);
      settodate(mstmessagemaster.todate);
      setStatus(String(mstmessagemaster.status) === '0' ? 'Active' : 'Inactive');
      console.log('Edit ItemMainGroup status:', mstmessagemaster.status, typeof mstmessagemaster.status);
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
        item_maingroupid: mstmessagemaster.messagemasterid,
        updated_by_id: '2',
        updated_date: currentDate,
      };
      console.log('Sending to backend:', payload);
      const res = await fetch(`http://localhost:3001/api/messagemaster/${mstmessagemaster.messagemasterid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success('ItemMainGroup updated successfully');
        onSuccess();
        onUpdateSelectedMessageMaster({ ...mstmessagemaster, Department, message, fromdate, todate });
        onHide();
      } else {
        toast.error('Failed to update ItemMainGroup');
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
        <Modal.Title style={{ fontSize: '18px', color: '#333' }}>Edit messagemaster</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ padding: '20px' }}>
        <Form.Group className="mb-3">
          <Form.Label style={{ fontSize: '14px', color: '#495057' }}>Department</Form.Label>
          <Form.Control type="text" value={Department} onChange={(e) => setDepartment(e.target.value)} style={{ border: '1px solid #ced4da', borderRadius: '4px', padding: '8px' }} />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label style={{ fontSize: '14px', color: '#495057' }}>message</Form.Label>
          <Form.Control type="text" value={message} onChange={(e) => setmessage(e.target.value)} style={{ border: '1px solid #ced4da', borderRadius: '4px', padding: '8px' }} />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label style={{ fontSize: '14px', color: '#495057' }}>from date</Form.Label>
          <Form.Control type="text" value={fromdate} onChange={(e) => setfromdate(e.target.value)} style={{ border: '1px solid #ced4da', borderRadius: '4px', padding: '8px' }} />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label style={{ fontSize: '14px', color: '#495057' }}>to date</Form.Label>
          <Form.Control type="text" value={todate} onChange={(e) => settodate(e.target.value)} style={{ border: '1px solid #ced4da', borderRadius: '4px', padding: '8px' }} />
        </Form.Group>
        <Form.Group className="mb-3">
          <div className="col-md-12">
            <label className="form-label" style={{ fontSize: '14px', color: '#495057' }}>Status <span style={{ color: 'red' }}>*</span></label>
            <select
              className="form-control"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{ border: '1px solid #ced4da', borderRadius: '4px', padding: '8px', width: '100%' }}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </Form.Group>
      </Modal.Body>
      <Modal.Footer style={{ borderTop: '1px solid #eee', padding: '12px 20px' }}>
        <Button variant="secondary" onClick={onHide} disabled={loading} style={{ borderRadius: '4px', padding: '6px 12px', fontSize: '14px' }}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleEdit} disabled={loading} style={{ borderRadius: '4px', padding: '6px 12px', fontSize: '14px' }}>
          {loading ? 'Updating...' : 'Update ItemMainGroup'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default MessageMaster;