import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Swal from 'sweetalert2';
import { toast } from 'react-hot-toast';
import { Preloader } from '@/components/Misc/Preloader';
import { Button, Card, Stack, Pagination, Table, Modal, Form } from 'react-bootstrap';
import { useAuthContext } from '../../../../common/context/useAuthContext';
import { ContactSearchBar, ContactSidebar } from '@/components/Apps/Contact';
import KitchenSubCategoryService from '@/common/api/kitchensubcategory';
import TitleHelmet from '@/components/Common/TitleHelmet';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table';
import {
  fetchKitchenCategory,
  fetchKitchenMainGroup,
  KitchenCategoryItem,
  KitchenMainGroupItem,
} from '../../../../utils/commonfunction';

interface KitchenSubCategoryItem {
  id: number;
  kitchensubcategoryid: string;
  Kitchen_sub_category: string;
  kitchencategoryid: string;
  kitchenmaingroupid: string | number;
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

// Debounce utility function
const debounce = (func: (...args: any[]) => void, wait: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Status badge utility function
const getStatusBadge = (status: number) => {
  return status === 0 ? (
    <span className="badge bg-success">Active</span>
  ) : (
    <span className="badge bg-danger">Inactive</span>
  );
};

// Main KitchenSubCategory Component
const KitchenSubCategory: React.FC = () => {
  const [kitchenSubCategoryItem, setKitchenSubCategoryItem] = useState<KitchenSubCategoryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('alls');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredKitchenSubCategory, setFilteredKitchenSubCategory] = useState<KitchenSubCategoryItem[]>([]);
  const [selectedKitchenSubCategory, setSelectedKitchenSubCategory] = useState<KitchenSubCategoryItem | null>(null);
  const [selectedKitchenSubCategoryIndex, setSelectedKitchenSubCategoryIndex] = useState<number>(-1);
  const [loading, setLoading] = useState<boolean>(false);
  const [showKitchenSubCategoryModal, setShowKitchenSubCategoryModal] = useState(false);
  const [sidebarLeftToggle, setSidebarLeftToggle] = useState<boolean>(false);
  const [sidebarMiniToggle, setSidebarMiniToggle] = useState<boolean>(false);
  const [containerToggle, setContainerToggle] = useState<boolean>(false);


  const fetchKitchenSubCategory = async () => {
    setLoading(true);
    try {
      const response = await KitchenSubCategoryService.list();
      if (response.success) {
        const data = response.data as unknown as KitchenSubCategoryItem[];
        setKitchenSubCategoryItem(data);
        setFilteredKitchenSubCategory(data);
      } else {
        toast.error(response.message || 'Failed to fetch KitchenSubCategory');
      }
    } catch (err) {
      toast.error('Failed to fetch KitchenSubCategory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKitchenSubCategory();
  }, []);

  // Define columns for react-table with explicit widths
  const columns = useMemo<ColumnDef<KitchenSubCategoryItem>[]>(() => [
    {
      id: 'srNo',
      header: 'Sr No',
      size: 20,
      cell: ({ row }) => <span>{row.index + 1}</span>,
    },
    {
      accessorKey: 'Kitchen_sub_category',
      header: 'Kitchen Subcategory',
      size: 10,
      cell: (info) => <h6 className="mb-1">{info.getValue<string>()}</h6>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 15,
      cell: (info) => {
        const statusValue = info.getValue<string | number>();
        return <div style={{ textAlign: 'left' }}>{getStatusBadge(Number(statusValue))}</div>;
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
            onClick={() => handleEditKitchenSubCategoryClick(row.original)}
            style={{ padding: '4px 8px' }}
          >
            <i className="fi fi-rr-edit"></i>
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleDeleteKitchenSubCategory(row.original)}
            style={{ padding: '4px 8px' }}
          >
            <i className="fi fi-rr-trash"></i>
          </Button>
        </div>
      ),
    },
  ], []);

  // Initialize react-table with pagination
  const table = useReactTable({
    data: filteredKitchenSubCategory,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  // Sidebar categories and labels
  const categories: Category[] = useMemo(
    () => [
      {
        name: 'Kitchen Subcategories',
        value: 'alls',
        icon: 'fi-rr-globe',
        badge: kitchenSubCategoryItem.length,
        badgeClassName: 'bg-primary-subtle text-primary',
      },
    ],
    [kitchenSubCategoryItem.length]
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

  // Update the handleSearch function
  const handleSearch = useCallback(
    (value: string) => {
      setSearchTerm(value); // Update searchTerm immediately
      const debouncedFilter = debounce((searchValue: string) => {
        const filtered = kitchenSubCategoryItem.filter((item) =>
          item.Kitchen_sub_category.toLowerCase().includes(searchValue.toLowerCase())
        );
        setFilteredKitchenSubCategory(filtered);
      }, 300);
      debouncedFilter(value);
    },
    [kitchenSubCategoryItem]
  );

  // Category change handler
  const handleCategoryChange = useCallback(
    (categoryValue: string) => {
      setSelectedCategory(categoryValue);
      setSearchTerm('');
      setFilteredKitchenSubCategory(kitchenSubCategoryItem);
    },
    [kitchenSubCategoryItem]
  );

  const handleKitchenSubCategoryItemClick = useCallback((kitchenSubCategory: KitchenSubCategoryItem) => {
    setSelectedKitchenSubCategory(kitchenSubCategory);
    setContainerToggle(true);
  }, []);

  const handleEditKitchenSubCategoryClick = useCallback((kitchenSubCategory: KitchenSubCategoryItem) => {
    setSelectedKitchenSubCategory(kitchenSubCategory);
    setShowKitchenSubCategoryModal(true);
  }, []);

  const handleDeleteKitchenSubCategory = useCallback(async (kitchenSubCategory: KitchenSubCategoryItem) => {
    const res = await Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to recover this KitchenSubCategory!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3E97FF',
      confirmButtonText: 'Yes, delete it!',
    });

    if (res.isConfirmed) {
      try {
        const response = await KitchenSubCategoryService.remove(Number(kitchenSubCategory.kitchensubcategoryid));
        if (response.success) {
          setSelectedKitchenSubCategory(null);
          setContainerToggle(false);
          setKitchenSubCategoryItem((prev) => prev.filter((s) => s.kitchensubcategoryid !== kitchenSubCategory.kitchensubcategoryid));
          setFilteredKitchenSubCategory((prev) => prev.filter((s) => s.kitchensubcategoryid !== kitchenSubCategory.kitchensubcategoryid));
          if (selectedKitchenSubCategory && selectedKitchenSubCategory.kitchensubcategoryid === kitchenSubCategory.kitchensubcategoryid) {
            setSelectedKitchenSubCategoryIndex(-1);
          }
          toast.success('KitchenSubCategory deleted successfully');
          await fetchKitchenSubCategory();
        } else {
          toast.error(response.message || 'Failed to delete KitchenSubCategory');
        }
      } catch (error) {
        toast.error('Failed to delete KitchenSubCategory');
        // console.error('Deletion error:', error);
      }
    }
  }, [selectedKitchenSubCategory, fetchKitchenSubCategory]);

  useEffect(() => {
    const index = filteredKitchenSubCategory.findIndex(
      (kitchenSubCategory) => kitchenSubCategory.kitchensubcategoryid === (selectedKitchenSubCategory?.kitchensubcategoryid || ''),
    );
    setSelectedKitchenSubCategoryIndex(index);
  }, [filteredKitchenSubCategory, selectedKitchenSubCategory]);

  const handleNext = useCallback(() => {
    if (selectedKitchenSubCategoryIndex < filteredKitchenSubCategory.length - 1) {
      const nextIndex = selectedKitchenSubCategoryIndex + 1;
      setSelectedKitchenSubCategory(filteredKitchenSubCategory[nextIndex]);
      setContainerToggle(true);
    }
  }, [selectedKitchenSubCategoryIndex, filteredKitchenSubCategory]);

  const handlePrev = useCallback(() => {
    if (selectedKitchenSubCategoryIndex > 0) {
      const prevIndex = selectedKitchenSubCategoryIndex - 1;
      setSelectedKitchenSubCategory(filteredKitchenSubCategory[prevIndex]);
      setContainerToggle(true);
    }
  }, [selectedKitchenSubCategoryIndex, filteredKitchenSubCategory]);

  const cardClasses = useMemo(() => {
    let classes = 'apps-card';
    if (sidebarMiniToggle) classes += ' apps-sidebar-mini-toggle';
    if (containerToggle) classes += ' apps-container-toggle';
    if (sidebarLeftToggle) classes += ' apps-sidebar-left-toggle';
    return classes;
  }, [sidebarMiniToggle, containerToggle, sidebarLeftToggle]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 991.98 && sidebarLeftToggle) {
        setSidebarLeftToggle(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [sidebarLeftToggle]);

  const handleMenuClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setSidebarLeftToggle((prev) => !prev);
  }, []);

  return (
    <>
      <TitleHelmet title="Kitchen Subcategories" />
      <style>
        {`
          .apps-card,
          .apps-sidebar-left,
          .apps-container {
            transition: all 0.3s ease-in-out;
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
        <div className="apps-sidebar apps-sidebar-left apps-sidebar-md" style={{ minWidth: '530px' }}>
          <ContactSearchBar searchTerm={searchTerm} handleSearch={handleSearch} />
          <div
            className="apps-sidebar-content"
            style={{
              flexDirection: 'column',
              height: '100%',
              minWidth: '250px',
              position: 'relative'
            }}
          >
            <Table
              responsive
              size="sm"
              className="mb-0"
              style={{ minWidth: '300px' }}
            >
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        colSpan={header.colSpan}
                        style={{ width: header.column.columnDef.size }}
                      >
                        {header.isPlaceholder ? null : (
                          <div>{flexRender(header.column.columnDef.header, header.getContext())}</div>
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className={selectedKitchenSubCategory?.kitchensubcategoryid === row.original.kitchensubcategoryid ? 'active' : ''}
                    onClick={() => handleKitchenSubCategoryItemClick(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </Table>
            <Stack
              className="p-2 border-top d-flex flex-row align-items-center justify-content-between"
              style={{ gap: '6px', padding: '8px 12px' }}
            >
              <select
                value={table.getState().pagination.pageSize}
                onChange={(e) => {
                  table.setPageSize(Number(e.target.value));
                }}
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
              <Pagination
                className="m-0"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  marginRight: '20px',
                }}
              >
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
            <div className="mobile-add-button-container">
              <Button
                variant="primary"
                className="w-100"
                onClick={() => setShowKitchenSubCategoryModal(true)}
              >
                <i className="fi fi-br-plus fs-10"></i>
                <span className="ms-2">Add New Kitchen Subcategory</span>
              </Button>
            </div>
          </div>
        </div>
        <div className={`apps-container ${containerToggle ? 'w-full' : ''}`}>
          <div className="apps-container-inner" style={{ minHeight: 'calc(100vh )' }}>
            {loading ? (
              <Stack className="align-items-center justify-content-center h-100">
                <Preloader />
              </Stack>
            ) : !selectedKitchenSubCategory ? (
              <Stack
                className="d-none d-lg-flex align-items-center justify-content-center flex-grow-1 h-100 mx-auto text-center"
                style={{ maxWidth: '420px' }}
              >
                <i className="fi fi-rr-globe fs-48 mb-6"></i>
                <h4 className="fw-bold">Select a Kitchen Subcategory to view</h4>
                <p className="fs-15 fw-light text-muted mb-4">
                  Select a Kitchen Subcategory from the left sidebar to view its details.
                </p>
                <Button
                  variant="neutral"
                  className="desktop-add-button"
                  onClick={() => setShowKitchenSubCategoryModal(true)}
                >
                  <i className="fi fi-br-plus fs-10"></i>
                  <span className="ms-2">Add New Kitchen Subcategory</span>
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
                          setSelectedKitchenSubCategory(null);
                          setContainerToggle(false);
                          setSidebarLeftToggle(false);
                        }}
                      >
                        <i className="fi fi-rr-arrow-left"></i>
                      </Button>
                      <h5 className="mb-1">Kitchen Subcategory</h5>
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
                        disabled={selectedKitchenSubCategoryIndex <= 0}
                        style={{ padding: '8px', fontSize: '1.2rem' }}
                      >
                        <i className="fi fi-rr-angle-left"></i>
                      </Button>
                      <Button
                        variant="light"
                        className="btn-icon"
                        onClick={handleNext}
                        disabled={selectedKitchenSubCategoryIndex >= filteredKitchenSubCategory.length - 1}
                        style={{ padding: '8px', fontSize: '1.2rem' }}
                      >
                        <i className="fi fi-rr-angle-right"></i>
                      </Button>
                      <Button
                        variant="light"
                        className="btn-icon"
                        onClick={() => handleDeleteKitchenSubCategory(selectedKitchenSubCategory)}
                        style={{ padding: '8px', fontSize: '1.2rem' }}
                      >
                        <i className="fi fi-rr-trash"></i>
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="apps-contact-details p-4">
                  <div className="mb-4">
                    <h5 className="mb-2">{selectedKitchenSubCategory.Kitchen_sub_category}</h5>
                    <p className="text-muted mb-0">Kitchen Category ID: {selectedKitchenSubCategory.kitchencategoryid}</p>
                  </div>
                  <div className="mb-4">
                    <p className="text-muted mb-0">Kitchen Main Group ID: {selectedKitchenSubCategory.kitchenmaingroupid}</p>
                  </div>
                  <div className="mb-4">
                    <p className="text-muted mb-0">Created By: {selectedKitchenSubCategory.created_by_id}</p>
                  </div>
                  <div className="mb-4">
                    <p className="text-muted mb-0">Status: {getStatusBadge(Number(selectedKitchenSubCategory.status))}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="custom-backdrop" onClick={() => setSidebarMiniToggle(false)}></div>
      </Card>
      <KitchenSubCategoryModal
        show={showKitchenSubCategoryModal}
        onHide={() => setShowKitchenSubCategoryModal(false)}
        kitchenSubCategory={selectedKitchenSubCategory}
        onSuccess={fetchKitchenSubCategory}
        onUpdateSelectedKitchenSubCategory={(updatedKitchenSubCategory) => setSelectedKitchenSubCategory(updatedKitchenSubCategory)}

      />
    </>
  );
};

// Unified KitchenSubCategoryModal component
interface KitchenSubCategoryModalProps {
  show: boolean;
  onHide: () => void;
  kitchenSubCategory: KitchenSubCategoryItem | null;
  onSuccess: () => void;
  onUpdateSelectedKitchenSubCategory: (kitchenSubCategory: KitchenSubCategoryItem) => void;
}

const KitchenSubCategoryModal: React.FC<KitchenSubCategoryModalProps> = ({
  show,
  onHide,
  kitchenSubCategory,
  onSuccess,
  onUpdateSelectedKitchenSubCategory,

}) => {
  const [kitchenSubCategoryName, setKitchenSubCategoryName] = useState('');
  const [kitchencategoryid, setKitchenCategoryId] = useState<number | null>(null);
  const [kitchenmaingroupid, setKitchenMainGroupId] = useState<number | null>(null);
  const [status, setStatus] = useState('Active');
  const [loading, setLoading] = useState(false);
  const [kitchenCategory, setKitchenCategory] = useState<KitchenCategoryItem[]>([]);
  const [kitchenMainGroup, setKitchenMainGroup] = useState<KitchenMainGroupItem[]>([]);
  const { user } = useAuthContext();

  const isEditMode = !!kitchenSubCategory;

  useEffect(() => {
    if (show) {
      fetchKitchenCategory(setKitchenCategory, setKitchenCategoryId, isEditMode ? Number(kitchenSubCategory?.kitchencategoryid) : undefined);
      fetchKitchenMainGroup(setKitchenMainGroup, setKitchenMainGroupId, isEditMode ? String(kitchenSubCategory?.kitchenmaingroupid) : undefined);
    }
  }, [show, kitchenSubCategory]);

  useEffect(() => {
    if (isEditMode && kitchenSubCategory) {
      setKitchenSubCategoryName(kitchenSubCategory.Kitchen_sub_category);
      setKitchenCategoryId(Number(kitchenSubCategory.kitchencategoryid) || null);
      setKitchenMainGroupId(Number(kitchenSubCategory.kitchenmaingroupid) || null);
      setStatus(kitchenSubCategory.status == '0' || kitchenSubCategory.status === 0 ? 'Active' : 'Inactive');
    } else {
      setKitchenSubCategoryName('');
      setKitchenCategoryId(null);
      setKitchenMainGroupId(null);
      setStatus('Active');
    }
  }, [kitchenSubCategory, show]);

  const handleSubmit = async () => {
    if (!kitchenSubCategoryName || !kitchencategoryid || !kitchenmaingroupid || !status) {
      toast.error('All fields are required');
      return;
    }
    // Use authenticated user ID and context
    const hotelId = user.hotelid || '1';
    const marketId = user.marketid || '1';


    setLoading(true);
    try {
      const statusValue = status === 'Active' ? 0 : 1;
      const currentDate = new Date().toISOString();
      const payload = {
        Kitchen_sub_category: kitchenSubCategoryName,
        kitchencategoryid,
        kitchenmaingroupid: String(kitchenmaingroupid),
        status: statusValue,
        ...(isEditMode
          ? {
            updated_by_id: user?.id ?? 1,
            updated_date: currentDate,
            hotelid: kitchenSubCategory!.hotelid || hotelId,
            marketid: kitchenSubCategory!.marketid || marketId
          }
          : {
            created_by_id: user?.id ?? 1,
            created_date: currentDate,
            hotelid: hotelId,
            marketid: marketId,
          }),
      };
      // console.log('Sending to backend:', payload);

      let res;
      if (isEditMode) {
        res = await KitchenSubCategoryService.update(Number(kitchenSubCategory!.kitchensubcategoryid), payload);
      } else {
        res = await KitchenSubCategoryService.create(payload);
      }

      if (res && res.success) {
        toast.success(`Kitchen Subcategory ${isEditMode ? 'updated' : 'added'} successfully`);
        if (isEditMode && kitchenSubCategory) {
          const updatedKitchenSubCategory = {
            ...kitchenSubCategory,
            Kitchen_sub_category: kitchenSubCategoryName,
            kitchencategoryid: kitchencategoryid.toString(), // convert to string
            kitchenmaingroupid: kitchenmaingroupid.toString(), // convert to string
            status: statusValue,
            updated_by_id: user?.id || '2',
            updated_date: currentDate,
          };
          onUpdateSelectedKitchenSubCategory(updatedKitchenSubCategory);
        }
        onSuccess();
        onHide();
      } else {
        toast.error(res?.message || `Failed to ${isEditMode ? 'update' : 'add'} Kitchen Subcategory`);
      }
    } catch (err) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>{isEditMode ? 'Edit Kitchen Subcategory' : 'Add Kitchen Subcategory'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group className="mb-3">
          <Form.Label>Kitchen Subcategory Name <span style={{ color: 'red' }}>*</span></Form.Label>
          <Form.Control
            style={{ borderColor: '#ccc' }}
            type="text"
            value={kitchenSubCategoryName}
            onChange={(e) => setKitchenSubCategoryName(e.target.value)}
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
            disabled={loading}
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
          <Form.Label>Kitchen Main Group <span style={{ color: 'red' }}>*</span></Form.Label>
          <select
            className="form-control"
            value={kitchenmaingroupid ?? ''}
            onChange={(e) => {
              const value = e.target.value;
              setKitchenMainGroupId(value === '' ? null : Number(value));
            }}
            disabled={loading}
          >
            <option value="">Select a Kitchen Main Group</option>
            {kitchenMainGroup
              .filter((group) => String(group.status) === '0')
              .map((group) => (
                <option key={group.kitchenmaingroupid} value={group.kitchenmaingroupid}>
                  {group.Kitchen_main_Group}
                </option>
              ))}
          </select>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Status <span style={{ color: 'red' }}>*</span></Form.Label>
          <select
            className="form-control"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={loading}>
          {loading ? (isEditMode ? 'Updating...' : 'Adding...') : (isEditMode ? 'Update Kitchen Subcategory' : 'Add Kitchen Subcategory')}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default KitchenSubCategory;