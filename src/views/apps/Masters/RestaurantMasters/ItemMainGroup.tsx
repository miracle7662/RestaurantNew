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
interface ItemMainGroupItem {
  item_maingroupid: string;
  item_group_name: string;
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

interface EditItemMainGroupModalProps extends ModalProps {
  mst_Item_Main_Group: ItemMainGroupItem | null;
  onUpdateSelectedItemMainGroup: (mst_Item_Main_Group: ItemMainGroupItem) => void;
}


//1
// Utility Functions
const debounce = <T extends (...args: any[]) => void>(func: T, wait: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Main Component
const ItemMainGroup: React.FC = () => {
  const [ItemMainGroupItem, setItemMainGroupItem] = useState<ItemMainGroupItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('alls');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredItemMainGroup, setFilteredItemMainGroup] = useState<ItemMainGroupItem[]>([]);
  const [selectedItemMainGroup, setSelectedItemMainGroup] = useState<ItemMainGroupItem | null>(null);
  const [selectedItemMainGroupIndex, setSelectedItemMainGroupIndex] = useState<number>(-1);
  const [loading, setLoading] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [sidebarLeftToggle, setSidebarLeftToggle] = useState<boolean>(false);
  const [sidebarMiniToggle, setSidebarMiniToggle] = useState<boolean>(false);
  const [containerToggle, setContainerToggle] = useState<boolean>(false);

  // Fetch ItemMainGroup from API
  const fetchItemMainGroup = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/ItemMainGroup');
      const data = await res.json();
      setItemMainGroupItem(data);
      setFilteredItemMainGroup(data);
    } catch {
      toast.error('Failed to fetch ItemMainGroup');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItemMainGroup();
  }, []);

  // Table columns
  const columns = useMemo<ColumnDef<ItemMainGroupItem>[]>(() => [
    {
      id: 'srNo',
      header: 'Sr No',
      size: 20,
      cell: ({ row }) => <span>{row.index + 1}</span>,
    },
    
    {
      accessorKey: 'item_group_name',
      header: 'Main Item ',
      size: 10,
      cell: ({ getValue }) => <h6 className="mb-1">{getValue<string>()}</h6>,
    },


    {
        accessorKey: 'status',
        header: 'Status',
        size: 15,
        cell: (info) => {
          const statusValue = info.getValue<string | number>();
          console.log('Status value:', statusValue, typeof statusValue); // Debug log
          return <div style={{ textAlign: 'left' }}>{statusValue == '0' || statusValue === 0 ? 'Active' : 'Inactive'}</div>;
        },
      },
    {
      id: 'actions',
      header: 'Actions',
      size: 30,
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
            onClick={() => handleDeleteItemMainGroup(row.original)}
            style={{ padding: '4px 8px' }}
          >
            <i className="fi fi-rr-trash" />
          </Button>
        </div>
      ),
    },
    
  ], []);

  // Initialize table
  const table = useReactTable({
    data: filteredItemMainGroup,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  // Sidebar categories and labels
  const categories: Category[] = useMemo(
    () => [
      {
        name: 'Countries',
        value: 'alls',
        icon: 'fi-rr-globe',
        badge: ItemMainGroupItem.length,
        badgeClassName: 'bg-primary-subtle text-primary',
      },
    ],
    [ItemMainGroupItem.length]
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

  // Search handler
  const handleSearch = useCallback(
    debounce((value: string) => {
      setSearchTerm(value);
      const filtered = ItemMainGroupItem.filter((item) =>
        item.item_group_name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredItemMainGroup(filtered);
    }, 300),
    [ItemMainGroupItem]
  );

  // Category change handler
  const handleCategoryChange = useCallback(
    (categoryValue: string) => {
      setSelectedCategory(categoryValue);
      setSearchTerm('');
      setFilteredItemMainGroup(ItemMainGroupItem);
    },
    [ItemMainGroupItem]
  );

  // ItemMainGroup selection handler
  const handleItemMainGroupItemClick = useCallback((mst_Item_Main_Group: ItemMainGroupItem) => {
    setSelectedItemMainGroup(mst_Item_Main_Group);
    setContainerToggle(true);
  }, []);

  // Delete ItemMainGroup handler
  const handleDeleteItemMainGroup = async (mst_Item_Main_Group: ItemMainGroupItem) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to recover thisItemMainGroup!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3E97FF',
      confirmButtonText: 'Yes, delete it!',
    });

    if (result.isConfirmed) {
      try {
        await fetch(`http://localhost:3001/api/ItemMainGroup/${mst_Item_Main_Group.item_maingroupid}`, { method: 'DELETE' });
        toast.success('Deleted successfully');
        fetchItemMainGroup();
        setSelectedItemMainGroup(null);
      } catch {
        toast.error('Failed to delete');
      }
    }
  };

  // Update selected ItemMainGroup index
  useEffect(() => {
    const index = filteredItemMainGroup.findIndex((mst_Item_Main_Group) => mst_Item_Main_Group.item_maingroupid === selectedItemMainGroup?.item_maingroupid);
    setSelectedItemMainGroupIndex(index);
  }, [filteredItemMainGroup, selectedItemMainGroup]);

  // Navigation handlers
  const handleNext = useCallback(() => {
    if (selectedItemMainGroupIndex < filteredItemMainGroup.length - 1) {
      setSelectedItemMainGroup(filteredItemMainGroup[selectedItemMainGroupIndex + 1]);
      setContainerToggle(true);
    }
  }, [selectedItemMainGroupIndex, filteredItemMainGroup]);

  const handlePrev = useCallback(() => {
    if (selectedItemMainGroupIndex > 0) {
      setSelectedItemMainGroup(filteredItemMainGroup[selectedItemMainGroupIndex - 1]);
      setContainerToggle(true);
    }
  }, [selectedItemMainGroupIndex, filteredItemMainGroup]);

  // Card classes
  const cardClasses = useMemo(() => {
    const classes = ['apps-card'];
    if (sidebarMiniToggle) classes.push('apps-sidebar-mini-toggle');
    if (containerToggle) classes.push('apps-container-toggle');
    if (sidebarLeftToggle) classes.push('apps-sidebar-left-toggle');
    return classes.join(' ');
  }, [sidebarMiniToggle, containerToggle, sidebarLeftToggle]);

  // Handle window resize
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
      <TitleHelmet title="Countries" />
      <style>
        {`
          .apps-card,
          .apps-sidebar-left,
          .apps-container {
            transition: all 0.3s ease-in-out;
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
        <div className="apps-sidebar apps-sidebar-left apps-sidebar-md" style={{ minWidth: '530px' }}>
          <ContactSearchBar searchTerm={searchTerm} handleSearch={handleSearch} />
          <div className="apps-sidebar-content" style={{  flexDirection: 'column', height: '100%', minWidth: '250px' }}>
            <Table responsive size="sm" className="mb-0" style={{ minWidth: '300px' }}>
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} style={{ width: header.column.columnDef.size }}>
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
                    className={selectedItemMainGroup?.item_maingroupid === row.original.item_maingroupid ? 'active' : ''}
                    onClick={() => handleItemMainGroupItemClick(row.original)}
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
                style={{ border: '1px solid #0d6efd', borderRadius: '4px', padding: '2px 4px', fontSize: '12px', backgroundColor: '#fff', color: '#6c757d', cursor: 'pointer', width: '100px', height: '30px' }}
              >
                {[10, 20, 30].map((pageSize) => (
                  <option key={pageSize} value={pageSize}>
                    {pageSize}
                  </option>
                ))}
              </select>
              <Pagination className="m-0" style={{ display: 'flex', alignItems: 'center', gap: '3px', marginRight: '20px' }}>
                <Pagination.Prev
                  onClick={() => table.setPageIndex(table.getState().pagination.pageIndex - 1)}
                  disabled={table.getState().pagination.pageIndex === 0}
                  style={{ border: '1px solid #e5e7eb', color: table.getState().pagination.pageIndex === 0 ? '#d3d3d3' : '#6c757d', padding: '2px 4px', borderRadius: '4px', backgroundColor: 'transparent', fontSize: '12px', lineHeight: '1' }}
                >
                  <i className="fi fi-rr-angle-left" style={{ fontSize: '12px' }} />
                </Pagination.Prev>
                <Pagination.Item
                  active
                  style={{ backgroundColor: '#0d6efd', border: '1px solid #0d6efd', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', lineHeight: '1', minWidth: '24px', textAlign: 'center' }}
                >
                  {table.getState().pagination.pageIndex + 1}
                </Pagination.Item>
                <Pagination.Next
                  onClick={() => table.setPageIndex(table.getState().pagination.pageIndex + 1)}
                  disabled={table.getState().pagination.pageIndex === table.getPageCount() - 1}
                  style={{ border: '1px solid #e5e7eb', color: table.getState().pagination.pageIndex === table.getPageCount() - 1 ? '#d3d3d3' : '#6c757d', padding: '2px 4px', borderRadius: '4px', backgroundColor: 'transparent', fontSize: '12px', lineHeight: '1' }}
                >
                  <i className="fi fi-rr-angle-right" style={{ fontSize: '12px' }} />
                </Pagination.Next>
              </Pagination>
            </Stack>
          </div>
        </div>
        <div className={`apps-container ${containerToggle ? 'w-full' : ''}`}>
          <div className="apps-container-inner" style={{ minHeight: '100vh' }}>
            {loading ? (
              <Stack className="align-items-center justify-content-center h-100">
                <Preloader />
              </Stack>
            ) : !selectedItemMainGroup ? (
              <Stack className="d-none d-lg-flex align-items-center justify-content-center flex-grow-1 h-100 mx-auto text-center" style={{ maxWidth: '420px' }}>
                <i className="fi fi-rr-globe fs-48 mb-6" />
                <h4 className="fw-bold">Select a ItemMainGroup to view</h4>
                <p className="fs-15 fw-light text-muted mb-4">Select a ItemMainGroup from the left sidebar to view its details.</p>
                <Button variant="neutral" onClick={() => setShowAddModal(true)}>
                  <i className="fi fi-br-plus fs-10" />
                  <span className="ms-2">Add New ItemMainGroup</span>
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
                          setSelectedItemMainGroup(null);
                          setContainerToggle(false);
                          setSidebarLeftToggle(false);
                        }}
                      >
                        <i className="fi fi-rr-arrow-left" />
                      </Button>
                      <h5 className="mb-1">ItemMainGroup</h5>
                    </div>
                    <div className="d-flex gap-2">
                      <Button variant="light" className="btn-icon" onClick={handleMenuClick} style={{ padding: '8px', fontSize: '1.2rem' }}>
                        <i className="fi fi-rr-menu-burger" />
                      </Button>
                      <Button variant="light" className="btn-icon" onClick={handlePrev} disabled={selectedItemMainGroupIndex <= 0} style={{ padding: '8px', fontSize: '1.2rem' }}>
                        <i className="fi fi-rr-angle-left" />
                      </Button>
                      <Button variant="light" className="btn-icon" onClick={handleNext} disabled={selectedItemMainGroupIndex >= filteredItemMainGroup.length - 1} style={{ padding: '8px', fontSize: '1.2rem' }}>
                        <i className="fi fi-rr-angle-right" />
                      </Button>
                      <Button variant="light" className="btn-icon" onClick={() => handleDeleteItemMainGroup(selectedItemMainGroup)} style={{ padding: '8px', fontSize: '1.2rem' }}>
                        <i className="fi fi-rr-trash" />
                      </Button>
                    </div>
                  </div>
                </div>
                
              </div>
            )}
          </div>
        </div>
        <div className="custom-backdrop" onClick={() => setSidebarMiniToggle(false)} />
      </Card>
      <AddItemMainGroupModal show={showAddModal} onHide={() => setShowAddModal(false)} onSuccess={fetchItemMainGroup} />
      <EditItemMainGroupModal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        mst_Item_Main_Group={selectedItemMainGroup}
        onSuccess={fetchItemMainGroup}
        onUpdateSelectedItemMainGroup={setSelectedItemMainGroup}
      />
    </>
  );
};
// 2
// Add ItemMainGroup Modal
const AddItemMainGroupModal: React.FC<ModalProps> = ({ show, onHide, onSuccess }) => {
  const [item_group_name, setitem_group_name] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('Active'); // Default to 'Active'

  const handleAdd = async () => {
    if (!item_group_name ||  !status) {
      toast.error('All fields are required');
      return;
    }

    setLoading(true);
    try {
      const statusValue = status === 'Active' ? 0 : 1;
      const currentDate = new Date().toISOString(); // Timestamp: e.g., 2025-07-01T04:00:00.000Z
      const payload = {
        item_group_name,
        status: statusValue,
       
        created_by_id: 1, // Default to null (or 0 if backend requires)
        created_date: currentDate,
      };
      console.log('Sending to backend:', payload); // Debug log
      const res = await fetch('http://localhost:3001/api/ItemMainGroup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success('ItemMainGroup added successfully');
        setitem_group_name('');
        setStatus('Active'); // Reset to 'Active' after successful add
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
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Add ItemMainGroup</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group className="mb-3">
          <Form.Label>ItemMainGroup Name</Form.Label>
          <Form.Control type="text" value={item_group_name} onChange={(e) => setitem_group_name(e.target.value)} style={{ borderColor: '#ccc' }} />
        </Form.Group>
         <Form.Group className="mb-3">
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
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleAdd} disabled={loading}>
          {loading ? 'Adding...' : 'Add ItemMainGroup'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

//3

// Edit ItemMainGroup Modal
const EditItemMainGroupModal: React.FC<EditItemMainGroupModalProps> = ({ show, onHide, mst_Item_Main_Group, onSuccess, onUpdateSelectedItemMainGroup }) => {
  const [item_group_name, setitem_group_name] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  
  

  useEffect(() => {
    if (mst_Item_Main_Group) {
      setitem_group_name(mst_Item_Main_Group.item_group_name);
      setStatus(String(mst_Item_Main_Group.status) === '0' ? 'Active' : 'Inactive');
      console.log('Edit ItemMainGroup status:', mst_Item_Main_Group.status, typeof mst_Item_Main_Group.status); // Debug log
    }
  }, [mst_Item_Main_Group]);

  const handleEdit = async () => {
    if (!item_group_name || !status || !mst_Item_Main_Group) {
      toast.error('All fields are required');
      return;
    }

    setLoading(true);
    try {
       const statusValue = status === 'Active' ? 0 : 1;
      const currentDate = new Date().toISOString(); // Timestamp: e.g., 2025-07-01T04:51:00.000Z
      const payload = {
        item_group_name,
        status: statusValue,
        item_maingroupid: mst_Item_Main_Group.item_maingroupid, // Ensure this is included
        updated_by_id: '2', // Default to "0" (string)
        updated_date: currentDate,
       
      };
      console.log('Sending to backend:', payload); // Debug log
      const res = await fetch(`http://localhost:3001/api/ItemMainGroup/${mst_Item_Main_Group.item_maingroupid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success('ItemMainGroup updated successfully');
        onSuccess();
        onUpdateSelectedItemMainGroup({ ...mst_Item_Main_Group, item_group_name });
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
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Edit ItemMainGroup</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group className="mb-3">
          <Form.Label>ItemMainGroup Name</Form.Label>
          <Form.Control type="text" value={item_group_name} onChange={(e) => setitem_group_name(e.target.value)} style={{ borderColor: '#ccc' }} />
        </Form.Group>
         <Form.Group className="mb-3">
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
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleEdit} disabled={loading}>
          {loading ? 'Updating...' : 'Update ItemMainGroup'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ItemMainGroup;