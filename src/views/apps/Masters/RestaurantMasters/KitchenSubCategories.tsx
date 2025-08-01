// 
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Swal from 'sweetalert2';
import { toast } from 'react-hot-toast';
import { Preloader } from '@/components/Misc/Preloader';
import { Button, Card, Stack, Pagination, Table, Modal, Form } from 'react-bootstrap';
import {
  ContactSearchBar,
 
} from '@/components/Apps/Contact';
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
  kitchenmaingroupid: string | number
  status: string | number; // 'Active' or 'Inactive'
  created_by_id: string;
  created_date: string;
  updated_by_id: string;
  updated_date: string;
  hotelid: string;
  marketid: string;
  
}





// AddKitchenSubCategoryModal component
interface AddKitchenSubCategoryModalProps {
  show: boolean;
  onHide: () => void;
  onSuccess: () => void;
}

// Debounce utility function
const debounce = (func: (...args: any[]) => void, wait: number) => {
  let timeout: NodeJS.Timeout
  return (...args: any[]) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Main KitchenSubCategory Component
const KitchenSubCategory: React.FC = () => {
  const [KitchenSubCategoryItem, setKitchenSubCategoryItem] = useState<KitchenSubCategoryItem[]>([]);
  const [selectedCategory, ] = useState<string>('alls');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredKitchenSubCategory, setFilteredKitchenSubCategory] = useState<KitchenSubCategoryItem[]>([]);
  const [selectedKitchenSubCategory, setSelectedKitchenSubCategory] = useState<KitchenSubCategoryItem | null>(null);
  const [selectedKitchenSubCategoryIndex, setSelectedKitchenSubCategoryIndex] = useState<number>(-1);
  const [loading] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [sidebarLeftToggle, setSidebarLeftToggle] = useState<boolean>(false);
  const [sidebarMiniToggle, setSidebarMiniToggle] = useState<boolean>(false);
  const [containerToggle, setContainerToggle] = useState<boolean>(false);
  // const [kitchenCategory, setKitchenCategory] = useState<KitchenCategoryItem[]>([]);
  // const [kitchenMainGroup, setKitchenMainGroup] = useState<KitchenMainGroupItem[]>([]);
  const [, setIsMobileView] = useState(false);

  const fetchKitchenSubCategory = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/KitchenSubCategory');
      const data = await res.json();
      setKitchenSubCategoryItem(data);
      setFilteredKitchenSubCategory(data);
    } catch (err) {
      toast.error('Failed to fetch KitchenSubCategory');
    }
  };

  useEffect(() => {
    fetchKitchenSubCategory();
  }, []);

  // Check for mobile view on resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 991.98);
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
      cell: (info) => (
        <div >
          {info.getValue<string>()}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 15,
      cell: (info) => {
        const statusValue = info.getValue<string | number>();
        console.log('Status value:', statusValue, typeof statusValue); // Debug log
        return <div style={{ textAlign: 'center' }}>{statusValue == '0' || statusValue === 0 ? 'Active' : 'Inactive'}</div>;
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      size: 30,
      cell: ({ row }) => (
        <div className="d-flex gap-2">
          <button
            className="btn btn-sm btn-success"
            onClick={() => handleEditClick(row.original)}
            style={{ padding: '4px 8px' }}
          >
            <i className="fi fi-rr-edit"></i>
          </button>
          <button
            className="btn btn-sm btn-danger"
            onClick={() => handleDeleteKitchenSubCategory(row.original)}
            style={{ padding: '4px 8px' }}
          >
            <i className="fi fi-rr-trash"></i>
          </button>
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

 

  useEffect(() => {
    setFilteredKitchenSubCategory(KitchenSubCategoryItem.filter((item) => item));
  }, [KitchenSubCategoryItem]);

  const handleSearch = useCallback(
    debounce((value: string) => {
      setSearchTerm(value);

      const filteredCountriesByCategory = KitchenSubCategoryItem.filter(
        (item) => item,
      );
      const filteredCountriesBySearch = filteredCountriesByCategory.filter((item) =>
        item.Kitchen_sub_category.toLowerCase().includes(value.toLowerCase()),
      );
      setFilteredKitchenSubCategory(filteredCountriesBySearch);
    }, 300),
    [KitchenSubCategoryItem, selectedCategory]
  );

  // const handleCategoryChange = useCallback((categoryValue: string) => {
  //   setSelectedCategory(categoryValue);
  //   setSearchTerm('');
  //   setFilteredKitchenSubCategory(KitchenSubCategoryItem.filter((item) => item));
  // }, [KitchenSubCategoryItem]);

  const handleKitchenSubCategoryItemClick = useCallback((KitchenSubCategory: KitchenSubCategoryItem) => {
    setSelectedKitchenSubCategory(KitchenSubCategory);
    setContainerToggle(true);
  }, []);

  const handleEditClick = (KitchenSubCategory: KitchenSubCategoryItem) => {
    setSelectedKitchenSubCategory(KitchenSubCategory);
    setShowEditModal(true);
  };

  const handleDeleteKitchenSubCategory = async (KitchenSubCategory: KitchenSubCategoryItem) => {
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
        await fetch(`http://localhost:3001/api/KitchenSubCategory/${KitchenSubCategory.kitchensubcategoryid}`, { method: 'DELETE' });
        toast.success('Deleted successfully');
        fetchKitchenSubCategory();
        setSelectedKitchenSubCategory(null); // Clear selected KitchenSubCategory to remove right-side details
      } catch {
        toast.error('Failed to delete');
      }
    }
  };

  useEffect(() => {
    const index = filteredKitchenSubCategory.findIndex(
      (KitchenSubCategory) => KitchenSubCategory.id === (selectedKitchenSubCategory?.id || ''),
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

  // Compute the card classes based on state
  const cardClasses = useMemo(() => {
    let classes = 'apps-card';
    if (sidebarMiniToggle) classes += ' apps-sidebar-mini-toggle';
    if (containerToggle) classes += ' apps-container-toggle';
    if (sidebarLeftToggle) classes += ' apps-sidebar-left-toggle';
    return classes;
  }, [sidebarMiniToggle, containerToggle, sidebarLeftToggle]);

  // Handle resize for sidebarLeftToggle
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
      <TitleHelmet title="Countries" />
      <style>
        {`
          .apps-card {
            transition: all 0.3s ease-in-out;
          }
          .apps-sidebar-left,
          .apps-container {
            transition: width 0.3s ease-in-out;
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
        <div className="apps-sidebar apps-sidebar-left apps-sidebar-md" style={{ minWidth: '550px' }}>
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
            <div className="d-flex justify-content-between align-items-center mb-0 px-1 ">
              <span className="text-muted fw-bold"></span>
              <span className="text-muted fw-bold"></span>
            </div>
            <div style={{ marginLeft: '10px', flex: 1 }}>
              <Table
                responsive
                size='sm'
                className="mb-0"
                style={{ minWidth: '350px' }}
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
                      className={selectedKitchenSubCategory?.id === row.original.id ? 'active' : ''}
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
            </div>
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
          </div>
          {/* Mobile Add Button Container - Fixed at bottom */}
          <div className="mobile-add-button-container">
            <Button
              variant="primary"
              className="w-100"
              onClick={() => setShowAddModal(true)}
            >
              <i className="fi fi-br-plus fs-10"></i>
              <span className="ms-2">Add New KitchenSubCategory</span>
            </Button>
          </div>
        </div>
        <div className={`apps-container ${containerToggle ? 'w-full' : ''}`}>
          <div className="apps-container-inner" style={{ minHeight: 'calc(100vh )' }}>
            {loading ? (
              <Stack className="align-items-center justify-content-center  h-100">
                <Preloader />
              </Stack>
            ) : !selectedKitchenSubCategory ? (
              <Stack
                className="d-none d-lg-flex align-items-center justify-content-center flex-grow-1 h-100 mx-auto text-center"
                style={{ maxWidth: '420px' }}
              >
                <i className="fi fi-rr-globe fs-48 mb-6"></i>
                <h4 className="fw-bold">Select a KitchenSubCategory to view</h4>
                <p className="fs-15 fw-light text-muted mb-4">
                  Select a KitchenSubCategory from the left sidebar to view its details.
                </p>
                <Button
                  variant=""
                  className="btn-neutral desktop-add-button"
                  onClick={() => setShowAddModal(true)}
                >
                  <i className="fi fi-br-plus fs-10"></i>
                  <span className="ms-2">Add New KitchenSubCategory</span>
                </Button>
              </Stack>
            ) : (
              <div>
                <div className="apps-contact-details-header p-3 border-bottom">
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                      <button
                        className="btn btn-sm btn-icon btn-light me-3"
                        onClick={() => {
                          setSelectedKitchenSubCategory(null);
                          setContainerToggle(false);
                          setSidebarLeftToggle(false);
                        }}
                      >
                        <i className="fi fi-rr-arrow-left"></i>
                      </button>
                      <div className="flex-grow-1">
                        <h5 className="mb-1">kitchen sub categories</h5>
                      </div>
                    </div>
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-icon btn-light"
                        onClick={handleMenuClick}
                        style={{ padding: '8px', fontSize: '1.2rem' }}
                      >
                        <i className="fi fi-rr-menu-burger"></i>
                      </button>
                      <button
                        className="btn btn-icon btn-light"
                        onClick={handlePrev}
                        disabled={selectedKitchenSubCategoryIndex <= 0}
                        style={{ padding: '8px', fontSize: '1.2rem' }}
                      >
                        <i className="fi fi-rr-angle-left"></i>
                      </button>
                      <button
                        className="btn btn-icon btn-light"
                        onClick={handleNext}
                        disabled={selectedKitchenSubCategoryIndex >= filteredKitchenSubCategory.length - 1}
                        style={{ padding: '8px', fontSize: '1.2rem' }}
                      >
                        <i className="fi fi-rr-angle-right"></i>
                      </button>
                      <button
                        className="btn btn-icon btn-light"
                        onClick={() => handleDeleteKitchenSubCategory(selectedKitchenSubCategory)}
                        style={{ padding: '8px', fontSize: '1.2rem' }}
                      >
                        <i className="fi fi-rr-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="apps-contact-details p-4">
                  <div className="mb-4">
                    <h5 className="mb-2">{selectedKitchenSubCategory.Kitchen_sub_category}</h5>
                    <p className="text-muted mb-0"> id: {selectedKitchenSubCategory.kitchencategoryid}</p>
                  </div>
                  <div className="mb-4">
                    <p className="text-muted mb-0">KitchenSubCategory: {selectedKitchenSubCategory.Kitchen_sub_category}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="custom-backdrop" onClick={() => setSidebarMiniToggle(false)}></div>
      </Card>
      <AddKitchenSubCategoryModal show={showAddModal} onHide={() => setShowAddModal(false)} onSuccess={fetchKitchenSubCategory} />
      <EditKitchenSubCategoryModal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        KitchenSubCategory={selectedKitchenSubCategory}
        onSuccess={fetchKitchenSubCategory}
        onUpdateSelectedKitchenSubCategory={(updatedKitchenSubCategory) => setSelectedKitchenSubCategory(updatedKitchenSubCategory)}
      />
    </>
  );
};

// AddNew KitchenSubCategoryyModal component
const AddKitchenSubCategoryModal: React.FC<AddKitchenSubCategoryModalProps> = ({ show, onHide, onSuccess }) => {
  const [Kitchen_sub_category, setKitchen_sub_category] = useState('');
  const [kitchencategoryid, setkitchencategoryid] = useState<number | null>(null);

  const [kitchenmaingroupid, setkitchenmaingroupid] = useState<number | null>(null);

  const [status, setstatus] = useState('Active'); // Default to 'Active'
  const [loading, setLoading] = useState(false);
  const [kitchenCategory, setKitchenCategory] = useState<KitchenCategoryItem[]>([]);
  const [kitchenMainGroup, setKitchenMainGroup] = useState<KitchenMainGroupItem[]>([]);
  // const [Selectedkitchenmaingroupid, setSelectedkitchenmaingroupid] = useState('');

  //fetch kitchen category and kitchen main group

  useEffect(() => {
    if (show) {
      fetchKitchenCategory(setKitchenCategory, setkitchencategoryid, kitchencategoryid ?? undefined);
      fetchKitchenMainGroup(setKitchenMainGroup, setkitchenmaingroupid);
    }
  }, [show]);


  const handleAdd = async () => {
    if (!Kitchen_sub_category || !kitchencategoryid || !kitchenmaingroupid || !status) {
      toast.error('All fields are required');
      return;
    }

    setLoading(true);
    try {
      const statusValue = status === 'Active' ? 0 : 1;
      const currentDate = new Date().toISOString(); // Timestamp: e.g., 2025-07-01T04:00:00.000Z
      const payload = {
        Kitchen_sub_category,
        kitchencategoryid,
        kitchenmaingroupid,
        status: statusValue,
        created_by_id: 1, // Default to null (or 0 if backend requires)
        created_date: currentDate,
      };
      console.log('Sending to backend:', payload); // Debug log
      const res = await fetch('http://localhost:3001/api/KitchenSubCategory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success('KitchenSubCategory added successfully');
        setKitchen_sub_category('');
        setkitchencategoryid(null);
        setkitchenmaingroupid(null);
        setstatus('Active');
        onSuccess();
        onHide();
      } else {
        toast.error('Failed to add country');
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
        <Modal.Title>Add Kitchensubcategory</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group className="mb-3">
          <Form.Label>Kitchensubcategory Name</Form.Label>
          <Form.Control style={{ borderColor: '#ccc' }} type="text" value={Kitchen_sub_category} onChange={(e) => setKitchen_sub_category(e.target.value)} />
        </Form.Group>
        <Form.Group className="mb-3">
          <div className="col-md-6">
            <label className="form-label">
              KitchenCategory name <span style={{ color: 'red' }}>*</span>
            </label>
            <select
              className="form-control"
              value={kitchencategoryid ?? ''}
              onChange={(e) => {
                const value = e.target.value;
                setkitchencategoryid(value === '' ? null : Number(value));
              }}
             
            >
              <option value=" ">Select a KitchenCategory</option>
              {kitchenCategory.filter((KitchenCategory) => String(KitchenCategory.status) === '0')  .map((KitchenCategory) => (
                <option key={KitchenCategory.kitchencategoryid} value={KitchenCategory.kitchencategoryid}>
                  {KitchenCategory.Kitchen_Category}
                </option>
              ))}
            </select>
          </div>
        </Form.Group>
        <Form.Group className="mb-3">
          <div className="col-md-6">
            <label className="form-label">
              KitchenMainGroup name <span style={{ color: 'red' }}>*</span>
            </label>
            <select
              className="form-control"
              value={kitchenmaingroupid ?? ''}
              onChange={(e) => {
                const value = e.target.value;
                setkitchenmaingroupid(value === '' ? null : Number(value));
              }}
              disabled={loading}
            >
              <option value="">Select aKitchenMainGroup id</option>
              {kitchenMainGroup.filter((kitchenMainGroup) => String(kitchenMainGroup.status) === '0')  .map((kitchenMainGroup) => (
                <option key={kitchenMainGroup.kitchenmaingroupid} value={kitchenMainGroup.kitchenmaingroupid}>
                  {kitchenMainGroup.Kitchen_main_Group}
                </option>
              ))}
            </select>
          </div>
        </Form.Group>
        <Form.Group className="mb-3">
          <div className="row mb-3">
            <div className="col-md-12">
              <label className="form-label">Status <span style={{ color: 'red' }}>*</span></label>
              <select
                className="form-control"
                value={status}
                onChange={(e) => setstatus(e.target.value)}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleAdd} disabled={loading}>
          {loading ? 'Adding...' : 'Add Kitchensubcategory'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

interface EditKitchenSubCategoryModalProps {
  show: boolean;
  onHide: () => void;
  KitchenSubCategory: KitchenSubCategoryItem | null;
  onSuccess: () => void;
  onUpdateSelectedKitchenSubCategory: (KitchenSubCategory: KitchenSubCategoryItem) => void;
}

const EditKitchenSubCategoryModal: React.FC<EditKitchenSubCategoryModalProps> = ({
  show,
  onHide,
  KitchenSubCategory,
  onSuccess,
  onUpdateSelectedKitchenSubCategory,
}) => {
  const [Kitchen_sub_category, setKitchen_sub_category] = useState('');
  const [kitchencategoryid, setkitchencategoryid] = useState<number | null>(null);
  const [kitchenmaingroupid, setkitchenmaingroupid] = useState<number | null>(null);
  const [status, setstatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [kitchenCategory, setKitchenCategory] = useState<KitchenCategoryItem[]>([]);
  const [kitchenMainGroup, setKitchenMainGroup] = useState<KitchenMainGroupItem[]>([]);

  // Fetch kitchen category and main group when modal opens
  useEffect(() => {
    if (show && KitchenSubCategory) {
      // Fetch kitchen categories and set the default kitchencategoryid
      fetchKitchenCategory(setKitchenCategory, setkitchencategoryid, Number(KitchenSubCategory.kitchencategoryid));
     fetchKitchenMainGroup(setKitchenMainGroup, setkitchenmaingroupid, (KitchenSubCategory.kitchenmaingroupid.toString()
));    }
  }, [show, KitchenSubCategory]);

  // Set initial values for the form fields
  useEffect(() => {
    if (KitchenSubCategory) {
      setKitchen_sub_category(KitchenSubCategory.Kitchen_sub_category);
      setkitchencategoryid(Number(KitchenSubCategory.kitchencategoryid) || null);
      setkitchenmaingroupid(Number(KitchenSubCategory.kitchenmaingroupid) || null);
      setstatus(KitchenSubCategory.status === 0 || KitchenSubCategory.status === '0' ? 'Active' : 'Inactive');
    }
  }, [KitchenSubCategory]);

  const handleEdit = async () => {
    if (!Kitchen_sub_category || !kitchencategoryid || !kitchenmaingroupid || !KitchenSubCategory) {
      toast.error('All fields are required');
      return;
    }

    setLoading(true);
    try {
      const statusValue = status === 'Active' ? 0 : 1;
      const currentDate = new Date().toISOString();
      const payload = {
        Kitchen_sub_category,
        kitchencategoryid,
        kitchenmaingroupid,
        kitchensubcategoryid: KitchenSubCategory.kitchensubcategoryid,
        status: statusValue,
        updated_by_id: '2',
        updated_date: currentDate,
      };
      console.log('Sending to backend:', payload);
      const res = await fetch(`http://localhost:3001/api/KitchenSubCategory/${KitchenSubCategory.kitchensubcategoryid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
     if (res.ok) {
              toast.success('KitchenSubCategory updated successfully');
              const updatedKitchenSubCategory = {
                ...KitchenSubCategory,
                Kitchen_sub_category,
                status: statusValue.toString(),
                updated_by_id: '2',
                updated_date: currentDate,
                kitchensubcategoryid: Kitchen_sub_category.toString(),
    
              };
              onUpdateSelectedKitchenSubCategory(updatedKitchenSubCategory);
              onSuccess();
              onHide();
      } else {
        toast.error('Failed to update KitchenSubCategory');
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
        <Modal.Title>Edit KitchenSubCategory</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group className="mb-3">
          <Form.Label>KitchenSubCategory Name</Form.Label>
          <Form.Control
            style={{ borderColor: '#ccc' }}
            type="text"
            value={Kitchen_sub_category}
            onChange={(e) => setKitchen_sub_category(e.target.value)}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <div className="col-md-6">
            <label className="form-label">
              Kitchen Category Name <span style={{ color: 'red' }}>*</span>
            </label>
            <select
              className="form-control"
              value={kitchencategoryid ?? ''}
              onChange={(e) => {
                const value = e.target.value;
                setkitchencategoryid(value === '' ? null : Number(value));
              }}
              disabled={loading}
            >
              <option value="">Select a KitchenCategory id</option>
              {kitchenCategory.filter((KitchenCategory) => String(KitchenCategory.status) === '0')  .map((KitchenCategory) => (
                <option key={KitchenCategory.kitchencategoryid} value={KitchenCategory.kitchencategoryid}>
                  {KitchenCategory.Kitchen_Category}
                </option>
              ))}
            </select>
          </div>
        </Form.Group>
        <Form.Group className="mb-3">
          <div className="col-md-6">
            <label className="form-label">
              Kitchen Main Group Name <span style={{ color: 'red' }}>*</span>
            </label>
            <select
              className="form-control"
              value={kitchenmaingroupid ?? ''}
              onChange={(e) => {
                const value = e.target.value;
                setkitchenmaingroupid(value === '' ? null : Number(value));
              }}
              disabled={loading}
            >
              <option value="">Select aKitchenMainGroup id</option>
              {kitchenMainGroup.filter((kitchenMainGroup) => String(kitchenMainGroup.status) === '0')  .map((kitchenMainGroup) => (
                <option key={kitchenMainGroup.kitchenmaingroupid} value={kitchenMainGroup.kitchenmaingroupid}>
                  {kitchenMainGroup.Kitchen_main_Group}
                </option>
              ))}
            </select>
          </div>
        </Form.Group>
        <Form.Group className="mb-3">
          <div className="row mb-3">
            <div className="col-md-12">
              <label className="form-label">
                Status <span style={{ color: 'red' }}>*</span>
              </label>
              <select
                className="form-control"
                value={status}
                onChange={(e) => setstatus(e.target.value)}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleEdit} disabled={loading}>
          {loading ? 'Updating...' : 'Update KitchenSubCategory'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
export default KitchenSubCategory;
