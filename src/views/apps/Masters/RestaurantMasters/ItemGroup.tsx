import React, { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import { useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { Preloader } from '@/components/Misc/Preloader';
import { Button, Card, Stack, Pagination, Table, Modal, Form } from 'react-bootstrap';
import { ContactSearchBar, ContactSidebar } from '@/components/Apps/Contact';
import TitleHelmet from '@/components/Common/TitleHelmet';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table';
import { useAuthContext } from '../../../../common/context/useAuthContext';
import { fetchKitchenCategory, KitchenCategoryItem } from '../../../../utils/commonfunction';

// Interfaces
interface ItemGroupItem {
  item_groupid: string;
  itemgroupname: string;
  code: string;
  kitchencategoryid: string;
  status: string | number;
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

interface ItemGroupModalProps {
  show: boolean;
  onHide: () => void;
  itemGroup?: ItemGroupItem | null;
  onSuccess: () => void;
  onUpdateSelectedItemGroup?: (itemGroup: ItemGroupItem) => void;
}

// Debounce utility function
const debounce = (func: (...args: any[]) => void, wait: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
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
const ItemGroup: React.FC = () => {
  const { user } = useAuthContext();
  const [itemGroupItems, setItemGroupItems] = useState<ItemGroupItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('alls');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredItemGroup, setFilteredItemGroup] = useState<ItemGroupItem[]>([]);
  const [selectedItemGroup, setSelectedItemGroup] = useState<ItemGroupItem | null>(null);
  const [selectedItemGroupIndex, setSelectedItemGroupIndex] = useState<number>(-1);
  const [loading, setLoading] = useState<boolean>(false);
  const [showModal, setShowModal] = useState(false);
  const [sidebarLeftToggle, setSidebarLeftToggle] = useState<boolean>(false);
  const [sidebarMiniToggle, setSidebarMiniToggle] = useState<boolean>(false);
  const [containerToggle, setContainerToggle] = useState<boolean>(false);

  // Fetch ItemGroup from API
  const fetchItemGroup = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/ItemGroup');
      const data = await res.json();
      setItemGroupItems(data);
      setFilteredItemGroup(data);
    } catch {
      toast.error('Failed to fetch ItemGroup');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItemGroup();
  }, []);

  // Table columns
  const columns: ColumnDef<ItemGroupItem>[] = [
    {
      id: 'srNo',
      header: 'Sr No',
      size: 20,
      cell: (cell) => <span>{cell.row.index + 1}</span>,
    },
    {
      accessorKey: 'itemgroupname',
      header: 'Item Group Name',
      size: 150,
      cell: (cell) => <h6 className="mb-1">{cell.getValue<string>()}</h6>,
    },
    {
      accessorKey: 'code',
      header: 'Code',
      size: 100,
      cell: (cell) => <h6 className="mb-1">{cell.getValue<string>()}</h6>,
    },
    
    {
      accessorKey: 'status',
      header: 'Status',
      size: 100,
      cell: (cell) => getStatusBadge(Number(cell.getValue<string | number>())),
    },
    {
      id: 'actions',
      header: 'Actions',
      size: 100,
      cell: (cell) => (
        <div className="d-flex gap-2">
          <Button
            size="sm"
            variant="success"
            onClick={() => {
              setSelectedItemGroup(cell.row.original);
              setShowModal(true);
            }}
            style={{ padding: '4px 8px' }}
          >
            <i className="fi fi-rr-edit" />
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleDeleteItemGroup(cell.row.original)}
            style={{ padding: '4px 8px' }}
          >
            <i className="fi fi-rr-trash" />
          </Button>
        </div>
      ),
    },
  ];

  // Initialize table
  const table = useReactTable({
    data: filteredItemGroup,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  // Sidebar categories and labels
  const categories: Category[] = [
    {
      name: 'ItemGroups',
      value: 'alls',
      icon: 'fi-rr-globe',
      badge: itemGroupItems.length,
      badgeClassName: 'bg-primary-subtle text-primary',
    },
  ];

  const labels: Label[] = [
    { name: 'Active', value: 'active', gradient: 'success' },
    { name: 'Inactive', value: 'inactive', gradient: 'danger' },
  ];

  // Search handler
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    filterItems(value);
  };

  const filterItems = useCallback(
    debounce((value: string) => {
      const searchValue = value.toLowerCase();
      const filtered = itemGroupItems.filter((item) =>
        item.itemgroupname.toLowerCase().includes(searchValue)
      );
      setFilteredItemGroup(filtered);
    }, 500),
    [itemGroupItems]
  );

  // Category change handler
  const handleCategoryChange = useCallback(
    (categoryValue: string) => {
      setSelectedCategory(categoryValue);
      setSearchTerm('');
      setFilteredItemGroup(itemGroupItems);
    },
    [itemGroupItems]
  );

  // ItemGroup selection handler
  const handleItemGroupItemClick = useCallback((itemGroup: ItemGroupItem) => {
    setSelectedItemGroup(itemGroup);
    setContainerToggle(true);
  }, []);

  // Delete ItemGroup handler
  const handleDeleteItemGroup = async (itemGroup: ItemGroupItem) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to recover this ItemGroup!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3E97FF',
      confirmButtonText: 'Yes, delete it!',
    });

    if (result.isConfirmed) {
      try {
        await fetch(`http://localhost:3001/api/ItemGroup/${itemGroup.item_groupid}`, {
          method: 'DELETE',
        });
        toast.success('ItemGroup deleted successfully');
        setItemGroupItems((prev) => prev.filter((s) => s.item_groupid !== itemGroup.item_groupid));
        setFilteredItemGroup((prev) => prev.filter((s) => s.item_groupid !== itemGroup.item_groupid));
        if (selectedItemGroup && selectedItemGroup.item_groupid === itemGroup.item_groupid) {
          setSelectedItemGroup(null);
          setSelectedItemGroupIndex(-1);
          setContainerToggle(false);
        }
        fetchItemGroup();
      } catch {
        toast.error('Failed to delete ItemGroup');
      }
    }
  };

  // Update selected ItemGroup index
  useEffect(() => {
    const index = filteredItemGroup.findIndex(
      (itemGroup) => itemGroup.item_groupid === selectedItemGroup?.item_groupid
    );
    setSelectedItemGroupIndex(index);
  }, [filteredItemGroup, selectedItemGroup]);

  // Navigation handlers
  const handleNext = useCallback(() => {
    if (selectedItemGroupIndex < filteredItemGroup.length - 1) {
      setSelectedItemGroup(filteredItemGroup[selectedItemGroupIndex + 1]);
      setContainerToggle(true);
    }
  }, [selectedItemGroupIndex, filteredItemGroup]);

  const handlePrev = useCallback(() => {
    if (selectedItemGroupIndex > 0) {
      setSelectedItemGroup(filteredItemGroup[selectedItemGroupIndex - 1]);
      setContainerToggle(true);
    }
  }, [selectedItemGroupIndex, filteredItemGroup]);

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
      <TitleHelmet title="Item Groups" />
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
        <div className="apps-sidebar apps-sidebar-left apps-sidebar-md" style={{ minWidth: '580px' }}>
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
                      className={selectedItemGroup?.item_groupid === row.original.item_groupid ? 'active' : ''}
                      style={{ color: isActive ? 'black' : 'gray', fontWeight: isActive ? 'bold' : 'normal' }}
                      onClick={() => handleItemGroupItemClick(row.original)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </Table>
            <Stack
              className="p-2 border-top d-flex flex-row align-items-center justify-content-between"
              style={{ gap: '6px', padding: '8px 12px' }}
            >
              <select
                value={table.getState().pagination.pageSize}
                onChange={(e) => table.setPageSize(Number(e.target.value))}
                style={{
                  border: '1px solid #0d6efd',
                  borderRadius: '4px',
                  padding: '2px 4px',
                  fontSize: '12px',
                  backgroundColor: '#fff',
                  color: '#6c757d',
                  cursor: 'pointer',
                  width: '100px',
                  height: '30px',
                }}
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
                  style={{
                    border: '1px solid #e5e7eb',
                    color: table.getState().pagination.pageIndex === 0 ? '#d3d3d3' : '#6c757d',
                    padding: '2px 4px',
                    borderRadius: '4px',
                    backgroundColor: 'transparent',
                    fontSize: '12px',
                    lineHeight: '1',
                  }}
                >
                  <i className="fi fi-rr-angle-left" style={{ fontSize: '12px' }} />
                </Pagination.Prev>
                <Pagination.Item
                  active
                  style={{
                    backgroundColor: '#0d6efd',
                    border: '1px solid #0d6efd',
                    color: '#fff',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    minWidth: '24px',
                    textAlign: 'center',
                    lineHeight: '1',
                  }}
                >
                  {table.getState().pagination.pageIndex + 1}
                </Pagination.Item>
                <Pagination.Next
                  onClick={() => table.setPageIndex(table.getState().pagination.pageIndex + 1)}
                  disabled={table.getState().pagination.pageIndex === table.getPageCount() - 1}
                  style={{
                    border: '1px solid #e5e7eb',
                    color: table.getState().pagination.pageIndex === table.getPageCount() - 1 ? '#d3d3d3' : '#6c757d',
                    padding: '2px 4px',
                    borderRadius: '4px',
                    backgroundColor: 'transparent',
                    fontSize: '12px',
                    lineHeight: '1',
                  }}
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
            ) : !selectedItemGroup ? (
              <Stack
                className="d-none d-lg-flex align-items-center justify-content-center flex-grow-1 h-100 mx-auto text-center"
                style={{ maxWidth: '420px' }}
              >
                <i className="fi fi-rr-globe fs-48 mb-6" />
                <h4 className="fw-bold">Select an ItemGroup to view</h4>
                <p className="fs-15 fw-light text-muted mb-4">
                  Select an ItemGroup from the left sidebar to view its details.
                </p>
                <Button variant="neutral" onClick={() => setShowModal(true)}>
                  <i className="fi fi-br-plus fs-10" />
                  <span className="ms-2">Add New ItemGroup</span>
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
                          setSelectedItemGroup(null);
                          setContainerToggle(false);
                          setSidebarLeftToggle(false);
                        }}
                      >
                        <i className="fi fi-rr-arrow-left" />
                      </Button>
                      <h5 className="mb-1">ItemGroup</h5>
                    </div>
                    <div className="d-flex gap-2">
                      <Button variant="light" className="btn-icon" onClick={handleMenuClick} style={{ padding: '8px', fontSize: '1.2rem' }}>
                        <i className="fi fi-rr-menu-burger" />
                      </Button>
                      <Button
                        variant="light"
                        className="btn-icon"
                        onClick={handlePrev}
                        disabled={selectedItemGroupIndex <= 0}
                        style={{ padding: '8px', fontSize: '1.2rem' }}
                      >
                        <i className="fi fi-rr-angle-left" />
                      </Button>
                      <Button
                        variant="light"
                        className="btn-icon"
                        onClick={handleNext}
                        disabled={selectedItemGroupIndex >= filteredItemGroup.length - 1}
                        style={{ padding: '8px', fontSize: '1.2rem' }}
                      >
                        <i className="fi fi-rr-angle-right" />
                      </Button>
                      <Button
                        variant="light"
                        className="btn-icon"
                        onClick={() => handleDeleteItemGroup(selectedItemGroup)}
                        style={{ padding: '8px', fontSize: '1.2rem' }}
                      >
                        <i className="fi fi-rr-trash" />
                      </Button>
                    </div>
                  </div>
              </div>
                <div className="apps-contact-details p-4">
                  <div className="mb-4">
                    <h5 className="mb-2">{selectedItemGroup.itemgroupname}</h5>
                    <p className="text-muted mb-0">Code: {selectedItemGroup.code}</p>
                  </div>
                  <div className="mb-4">
                    <p className="text-muted mb-0">Kitchen Category ID: {selectedItemGroup.kitchencategoryid}</p>
                  </div>
                  <div className="mb-4">
                    <p className="text-muted mb-0">
                      Status: {Number(selectedItemGroup.status) === 0 ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="custom-backdrop" onClick={() => setSidebarMiniToggle(false)} />
      </Card>
      <ItemGroupModal
        show={showModal}
        onHide={() => {
          setShowModal(false);
          setSelectedItemGroup(null);
        }}
        itemGroup={selectedItemGroup}
        onSuccess={fetchItemGroup}
        onUpdateSelectedItemGroup={setSelectedItemGroup}
      />
    </>
  );
};

// ItemGroupModal Component
const ItemGroupModal: React.FC<ItemGroupModalProps> = ({ show, onHide, itemGroup, onSuccess, onUpdateSelectedItemGroup }) => {
  const { user } = useAuthContext();
  const [itemgroupname, setItemGroupName] = useState('');
  const [code, setCode] = useState('');
  const [kitchencategoryid, setKitchenCategoryId] = useState<number | null>(null);
  const [status, setStatus] = useState('Active');
  const [loading, setLoading] = useState(false);
  const [kitchenCategory, setKitchenCategory] = useState<KitchenCategoryItem[]>([]);

  const isEditMode = !!itemGroup;

  useEffect(() => {
    if (show) {
      fetchKitchenCategory(setKitchenCategory, setKitchenCategoryId);
    }
  }, [show, itemGroup]);

  useEffect(() => {
    if (itemGroup && isEditMode) {
      setItemGroupName(itemGroup.itemgroupname);
      setCode(itemGroup.code);
      setKitchenCategoryId(Number(itemGroup.kitchencategoryid));
      setStatus(String(itemGroup.status) === '0' ? 'Active' : 'Inactive');
    } else {
      setItemGroupName('');
      setCode('');
      setKitchenCategoryId(null);
      setStatus('Active');
    }
  }, [itemGroup, isEditMode]);

  const handleSubmit = async () => {
    if (!itemgroupname || !code || !kitchencategoryid || !status) {
      toast.error('All fields are required');
      return;
    }

    setLoading(true);
    try {
      const statusValue = status === 'Active' ? 0 : 1;
      const currentDate = new Date().toISOString();
      const userId = user?.id || '1';
      const hotelId = user?.hotelid || '1';
      const marketId = user?.marketid || '1';

      const payload = {
        itemgroupname,
        code,
        kitchencategoryid: String(kitchencategoryid),
        status: statusValue,
        ...(isEditMode
          ? {
              item_groupid: itemGroup!.item_groupid,
              updated_by_id: userId,
              updated_date: currentDate,
              hotelid: itemGroup!.hotelid || hotelId,
              marketid: itemGroup!.marketid || marketId,
            }
          : {
              created_by_id: userId,
              created_date: currentDate,
              hotelid: hotelId,
              marketid: marketId,
            }),
      };

      const url = isEditMode
        ? `http://localhost:3001/api/ItemGroup/${itemGroup!.item_groupid}`
        : 'http://localhost:3001/api/ItemGroup';
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(`ItemGroup ${isEditMode ? 'updated' : 'added'} successfully`);
        if (isEditMode && itemGroup && onUpdateSelectedItemGroup) {
          const updatedItemGroup = {
            ...itemGroup,
            itemgroupname,
            code,
            kitchencategoryid: String(kitchencategoryid),
            status: statusValue,
            updated_by_id: userId,
            updated_date: currentDate,
            hotelid: itemGroup.hotelid || hotelId,
            marketid: itemGroup.marketid || marketId,
          };
          onUpdateSelectedItemGroup(updatedItemGroup);
        }
        setItemGroupName('');
        setCode('');
        setKitchenCategoryId(null);
        setStatus('Active');
        onSuccess();
        onHide();
      } else {
        toast.error(`Failed to ${isEditMode ? 'update' : 'add'} ItemGroup`);
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
        <Modal.Title>{isEditMode ? 'Edit ItemGroup' : 'Add New ItemGroup'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>ItemGroup Name <span style={{ color: 'red' }}>*</span></Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter ItemGroup name"
              value={itemgroupname}
              onChange={(e) => setItemGroupName(e.target.value)}
              style={{ borderColor: '#ccc' }}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Code <span style={{ color: 'red' }}>*</span></Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter Code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              style={{ borderColor: '#ccc' }}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Kitchen Category <span style={{ color: 'red' }}>*</span></Form.Label>
            <select
              className="form-control"
              value={kitchencategoryid ?? ''}
              onChange={(e) => {
                const value = e.target.value;
                setKitchenCategoryId(value === '' ? null : Number(value));
              }}
              style={{ borderColor: '#ccc' }}
            >
              <option value="">Select a Kitchen Category</option>
              {kitchenCategory
                .filter((category) => String(category.status) === '0')
                .map((category) => (
                  <option key={category.kitchencategoryid} value={category.kitchencategoryid}>
                    {category.Kitchen_Category}
                  </option>
                ))}
            </select>
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

export default ItemGroup;