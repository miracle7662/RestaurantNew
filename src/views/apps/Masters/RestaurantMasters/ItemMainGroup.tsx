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
import { useAuthContext } from '../../../../common/context/useAuthContext';
import ItemMainGroupService from '@/common/api/itemmaingroup';

// Interfaces
interface ItemMainGroupItem {
  item_maingroupid: number;
  item_group_name: string;
  status: number;
  created_by_id: number;
  created_date: number;
  updated_by_id: number;
  updated_date: string;
  hotelid: number;
  marketid: number;
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

interface ItemMainGroupModalProps {
  show: boolean;
  onHide: () => void;
  itemMainGroup?: ItemMainGroupItem | null;
  onSuccess: () => void;
  onUpdateSelectedItemMainGroup?: (itemMainGroup: ItemMainGroupItem) => void;
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
const ItemMainGroup: React.FC = () => {
  const [itemMainGroupItems, setItemMainGroupItems] = useState<ItemMainGroupItem[]>([]);
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

  const { user } = useAuthContext();

  // Fetch ItemMainGroup from API
  const fetchItemMainGroup = async () => {
    setLoading(true);
    try {
      const hotelid = user?.hotelid;
      const response = await ItemMainGroupService.list({ hotelid });

      if (response.success) {
        const groups = response.data ?? [];

        setItemMainGroupItems(groups);
        setFilteredItemMainGroup(groups);
      } else {
        toast.error(response.message || "Failed to fetch Item Main Group");
      }

    } catch (error) {
      console.error("Fetch ItemMainGroup Error:", error);
      toast.error("Failed to fetch Item Main Group");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItemMainGroup();
  }, [user?.hotelid]);

  // Table columns
  const columns = useMemo<ColumnDef<ItemMainGroupItem>[]>(() => [
    {
      id: 'srNo',
      header: 'Sr No',
      size: 20,
      cell: (cell) => <span>{cell.row.index + 1}</span>,
    },
    {
      accessorKey: 'item_group_name',
      header: 'Main Item',
      size: 10,
      cell: (cell) => <h6 className="mb-1">{cell.getValue<string>()}</h6>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 150,
      cell: (cell) => getStatusBadge(Number(cell.getValue<string | number>())),
    },
    {
      id: 'actions',
      header: 'Actions',
      size: 30,
      cell: (cell) => (
        <div className="d-flex gap-2">
          <Button
            size="sm"
            variant="success"
            onClick={() => {
              setSelectedItemMainGroup(cell.row.original);
              setShowEditModal(true);
            }}
          >
            <i className="fi fi-rr-edit" />
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleDeleteItemMainGroup(cell.row.original)}
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
        name: 'ItemMainGroups',
        value: 'alls',
        icon: 'fi-rr-globe',
        badge: itemMainGroupItems.length,
        badgeClassName: 'bg-primary-subtle text-primary',
      },
    ],
    [itemMainGroupItems.length]
  );

  const labels: Label[] = useMemo(
    () => [
      { name: 'Active', value: 'active', gradient: 'success' },
      { name: 'Inactive', value: 'inactive', gradient: 'danger' },
    ],
    []
  );

  // Search handler
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    filterCountries(value);
  };

  const filterCountries = useCallback(
    debounce((value: string) => {
      const searchValue = value.toLowerCase();
      const filtered = itemMainGroupItems.filter((item) =>
        item.item_group_name.toLowerCase().includes(searchValue)
      );
      setFilteredItemMainGroup(filtered);
    }, 500),
    [itemMainGroupItems]
  );

  // Category change handler
  const handleCategoryChange = useCallback(
    (categoryValue: string) => {
      setSelectedCategory(categoryValue);
      setSearchTerm('');
      setFilteredItemMainGroup(itemMainGroupItems);
    },
    [itemMainGroupItems]
  );

  // ItemMainGroup selection handler
  const handleItemMainGroupItemClick = useCallback((itemMainGroup: ItemMainGroupItem) => {
    setSelectedItemMainGroup(itemMainGroup);
    setContainerToggle(true);
  }, []);

  // Delete ItemMainGroup handler
  const handleDeleteItemMainGroup = async (itemMainGroup: ItemMainGroupItem) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to recover this ItemMainGroup!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3E97FF',
      confirmButtonText: 'Yes, delete it!',
    });

    if (result.isConfirmed) {
      try {
        await ItemMainGroupService.remove(itemMainGroup.item_maingroupid);
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
    const index = filteredItemMainGroup.findIndex(
      (itemMainGroup) => itemMainGroup.item_maingroupid === selectedItemMainGroup?.item_maingroupid
    );
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
      <TitleHelmet title="Item Main Groups" />
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
          <div className="apps-sidebar-content" style={{ flexDirection: 'column', height: '100%', minWidth: '250px' }}>
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
                {table.getRowModel().rows.map((row) => {
                  const isActive = Number(row.original.status) === 0;
                  return (
                    <tr
                      key={row.id}
                      className={selectedItemMainGroup?.item_maingroupid === row.original.item_maingroupid ? 'active' : ''}
                      style={{ color: isActive ? 'black' : 'gray', fontWeight: isActive ? 'bold' : 'normal' }}
                      onClick={() => handleItemMainGroupItemClick(row.original)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                      ))}
                    </tr>
                  );
                })}
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
                      <h5 className="mb-1">ItemMainGroups</h5>
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
                <div className="apps-contact-details p-4">
                  <div className="mb-4">
                    <h5 className="mb-2">{selectedItemMainGroup.item_group_name}</h5>
                    <p className="text-muted mb-0">Status: {selectedItemMainGroup.status === 0 ? 'Active' : 'Inactive'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="custom-backdrop" onClick={() => setSidebarMiniToggle(false)} />
      </Card>
      <ItemMainGroupModal show={showAddModal} onHide={() => setShowAddModal(false)} onSuccess={fetchItemMainGroup} />
      <ItemMainGroupModal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        itemMainGroup={selectedItemMainGroup}
        onSuccess={fetchItemMainGroup}
        onUpdateSelectedItemMainGroup={setSelectedItemMainGroup}
      />
    </>
  );
};

// ItemMainGroupModal Component
const ItemMainGroupModal: React.FC<ItemMainGroupModalProps> = ({ show, onHide, onSuccess, itemMainGroup, onUpdateSelectedItemMainGroup }) => {
  const { user } = useAuthContext();
  const [item_group_name, setItemGroupName] = useState('');
  const [status, setStatus] = useState('Active');
  const [loading, setLoading] = useState(false);

  const isEditMode = !!itemMainGroup;

  useEffect(() => {
    if (itemMainGroup && isEditMode) {
      setItemGroupName(itemMainGroup.item_group_name);
      setStatus(String(itemMainGroup.status) === '0' ? 'Active' : 'Inactive');
    } else {
      setItemGroupName('');
      setStatus('Active');
    }
  }, [itemMainGroup, show]);

  const handleSubmit = async () => {
    if (!item_group_name || !status) {
      toast.error('All fields are required');
      return;
    }

    // Use authenticated user ID and context
    const userId = user.id;
    const hotelId = user.hotelid || '1';
    const marketId = user.marketid || '1';

    setLoading(true);
    try {
      const statusValue = status === 'Active' ? 0 : 1;
      const currentDate = new Date().toISOString();
      const payload = {
        item_group_name,
        status: statusValue,
        ...(isEditMode
          ? {
            item_maingroupid: itemMainGroup!.item_maingroupid,
            updated_by_id: userId,
            updated_date: currentDate,
            hotelid: itemMainGroup!.hotelid || hotelId,
            marketid: itemMainGroup!.marketid || marketId

          }
          : {
            created_by_id: userId,
            created_date: currentDate,
            hotelid: hotelId,
            marketid: marketId
          }),
      };

      const res = isEditMode
        ? await ItemMainGroupService.update(itemMainGroup!.item_maingroupid, payload)
        : await ItemMainGroupService.create(payload);

      toast.success(`ItemMainGroup ${isEditMode ? 'updated' : 'added'} successfully`);
      if (isEditMode && itemMainGroup && onUpdateSelectedItemMainGroup) {
        const updatedItemMainGroup = {
          ...itemMainGroup,
          item_group_name,
          status: statusValue,
          updated_by_id: user?.id || '2',
          updated_date: currentDate,
        };
        onUpdateSelectedItemMainGroup(updatedItemMainGroup);
      }
      onSuccess();
      onHide();
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>{isEditMode ? 'Edit ItemMainGroup' : 'Add New ItemMainGroup'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>ItemMainGroup Name <span style={{ color: 'red' }}>*</span></Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter ItemMainGroup name"
              value={item_group_name}
              onChange={(e) => setItemGroupName(e.target.value)}
              style={{ borderColor: '#ccc' }}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Status <span style={{ color: 'red' }}>*</span></Form.Label>
            <Form.Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{ borderColor: '#ccc' }}
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

export default ItemMainGroup;
