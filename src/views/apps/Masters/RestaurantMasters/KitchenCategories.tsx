import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Swal from 'sweetalert2';
import { toast } from 'react-hot-toast';
import { Preloader } from '@/components/Misc/Preloader';
import { Button, Card, Stack, Pagination, Table, Form } from 'react-bootstrap';
import { useAuthContext } from '../../../../common/context/useAuthContext';
import TitleHelmet from '@/components/Common/TitleHelmet';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table';
import KitchenCategoryService from '@/common/api/kitchencategory';
import KitchenMainGroupService from '@/common/api/kitchenmaingroup';

interface KitchenCategoryItem {
  kitchencategoryid: number;
  Kitchen_Category: string;
  Description: string;
  alternative_category_Description: string;
  alternative_category_name: string;
  digital_order_image?: File | string | null;
  categorycolor: string;
  status: number;
  created_by_id: number;
  created_date: number;
  updated_by_id: number;
  updated_date: number;
  hotelid: number;
  marketid: number;
  kitchenmaingroupid?: number;
}

interface KitchenGroupItem {
  kitchenmaingroupid: number;
  Kitchen_main_Group: string;
  status: number;
}

interface KitchenCategoryModalProps {
  show: boolean;
  onHide: () => void;
  KitchenCategory: KitchenCategoryItem | null;
  onSuccess: () => void;
  onUpdateSelectedKitchenCategory: (KitchenCategory: KitchenCategoryItem) => void;
  kitchenGroups: KitchenGroupItem[];
}

// Debounce utility function
const debounce = (func: (...args: any[]) => void, wait: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Function to get status badge
const getStatusBadge = (status: number) => {
  return status === 0 ? (
    <span className="badge bg-success">Active</span>
  ) : (
    <span className="badge bg-danger">Inactive</span>
  );
};

// Main KitchenCategory Component
const KitchenCategory: React.FC = () => {
  const [kitchenCategoryItems, setKitchenCategoryItems] = useState<KitchenCategoryItem[]>([]);
  const [kitchenGroups, setKitchenGroups] = useState<KitchenGroupItem[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedKitchenCategory, setSelectedKitchenCategory] = useState<KitchenCategoryItem | null>(null);

const fetchKitchenCategory = async () => {
  try {
    setLoading(true);
    const response = await KitchenCategoryService.list();
    setKitchenCategoryItems(response.data || []);
  } catch (err) {
    toast.error('Failed to fetch KitchenCategory');
  } finally {
    setLoading(false);
  }
};

 const fetchKitchenGroups = async () => {
  try {
    setLoading(true);
    const response = await KitchenMainGroupService.list();
    // Map API response to match KitchenGroupItem interface
    const mappedGroups: KitchenGroupItem[] = response.data.map((item) => ({
      kitchenmaingroupid: item.kitchen_maingroupid,
      Kitchen_main_Group: item.Kitchen_main_Group,
      status: item.status,
    }));
    setKitchenGroups(mappedGroups);
  } catch (err) {
    toast.error('Failed to fetch Kitchen Groups');
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchKitchenCategory();
    fetchKitchenGroups();
  }, []);

  // Define columns for react-table
  const columns = useMemo<ColumnDef<KitchenCategoryItem>[]>(
    () => [
      {
        id: 'srNo',
        header: 'Sr No',
        size: 50,
        cell: ({ row }) => <div style={{ textAlign: 'center' }}>{row.index + 1}</div>,
      },
      {
        accessorKey: 'digital_order_image',
        header: 'Image',
        size: 150,
        cell: (info) => (
          <div style={{ textAlign: 'center' }}>
            {info.getValue() ? (info.getValue() as File).name : 'No Image'}
          </div>
        ),
      },
      {
        accessorKey: 'Kitchen_Category',
        header: 'Kitchen Category',
        size: 200,
        cell: (info) => <div style={{ textAlign: 'center' }}>{info.getValue<string>()}</div>,
      },
      
      {
        accessorKey: 'Description',
        header: 'Description',
        size: 200,
        cell: (info) => <div style={{ textAlign: 'center' }}>{info.getValue<string>()}</div>,
      },
      {
        accessorKey: 'alternative_category_name',
        header: 'Alternative Category Name',
        size: 200,
        cell: (info) => <div style={{ textAlign: 'center' }}>{info.getValue<string>()}</div>,
      },
      {
        accessorKey: 'categorycolor',
        header: 'Category Color',
        size: 150,
        cell: (info) => (
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                backgroundColor: info.getValue<string>(),
                width: '30px',
                height: '20px',
                display: 'inline-block',
                border: '1px solid #ccc',
              }}
            ></div>
            <span style={{ marginLeft: '8px' }}>{info.getValue<string>()}</span>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 150,
        cell: (info) => (
          <div style={{ textAlign: 'center' }}>
            {getStatusBadge(info.getValue<number>())}
          </div>
        ),
      },
      {
        id: 'actions',
        header: () => <div style={{ textAlign: 'center' }}>Action</div>,
        size: 150,
        cell: ({ row }) => (
          <div className="d-flex gap-2 justify-content-center">
            <button
              className="btn btn-sm"
              style={{ backgroundColor: '#2E8B57', borderColor: '#2E8B57', padding: '4px 8px' }}
              onClick={() => handleEditClick(row.original)}
              title="Edit KitchenCategory"
            >
              <i className="fi fi-rr-edit" style={{ color: 'white' }}></i>
            </button>
            <button
              className="btn btn-sm btn-danger"
              style={{ padding: '4px 8px' }}
              onClick={() => handleDeleteKitchenCategory(row.original)}
              title="Delete KitchenCategory"
            >
              <i className="fi fi-rr-trash"></i>
            </button>
          </div>
        ),
      },
    ],
    [kitchenGroups]
  );

  // Initialize react-table with pagination
  const table = useReactTable({
    data: kitchenCategoryItems,
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

  const handleEditClick = useCallback((kitchenCategory: KitchenCategoryItem) => {
    setSelectedKitchenCategory(kitchenCategory);
    setShowModal(true);
  }, []);

  const handleDeleteKitchenCategory = useCallback((kitchenCategory: KitchenCategoryItem) => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to recover this KitchenCategory!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3E97FF',
      confirmButtonText: 'Yes, delete it!',
    }).then(async (result) => {
      if (result.isConfirmed) {
        setLoading(true);
        try {
          await KitchenCategoryService.remove(kitchenCategory.kitchencategoryid);
          toast.success('KitchenCategory deleted successfully');
          fetchKitchenCategory();
          if (selectedKitchenCategory?.kitchencategoryid === kitchenCategory.kitchencategoryid) {
            setSelectedKitchenCategory(null);
          }
        } catch {
          toast.error('Failed to delete KitchenCategory');
        } finally {
          setLoading(false);
        }
      }
    });
  }, [selectedKitchenCategory]);

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

  // KitchenCategoryModal Component (Combined Add/Edit Modal)
  const KitchenCategoryModal: React.FC<KitchenCategoryModalProps> = ({
    show,
    onHide,
    KitchenCategory,
    onSuccess,
    onUpdateSelectedKitchenCategory,
    kitchenGroups,
  }) => {
    const [Kitchen_Category, setKitchen_Category] = useState('');
    const [alternative_category_name, setalternative_category_name] = useState('');
    const [selectedKitchenGroupId, setSelectedKitchenGroupId] = useState<number | undefined>(undefined);
    const [Description, setDescription] = useState('');
    const [alternative_category_Description, setalternative_category_Description] = useState('');
    const [categorycolor, setcategorycolor] = useState('');
    const [digital_order_image, setdigital_order_image] = useState<File | null>(null);
    const [status, setStatus] = useState('Active');
    const [loading, setLoading] = useState(false);
    const { user } = useAuthContext();

    useEffect(() => {
      if (KitchenCategory) {
        setKitchen_Category(KitchenCategory.Kitchen_Category);
        setalternative_category_name(KitchenCategory.alternative_category_name);
        setSelectedKitchenGroupId(KitchenCategory.kitchenmaingroupid);
        setDescription(KitchenCategory.Description);
        setalternative_category_Description(KitchenCategory.alternative_category_Description);
        setcategorycolor(KitchenCategory.categorycolor);
        // Handle the case where digital_order_image is string or undefined - convert to null
        const imageValue = KitchenCategory.digital_order_image;
        if (imageValue && imageValue instanceof File) {
          setdigital_order_image(imageValue);
        } else {
          // If it's a string URL/path or null/undefined, set to null since state only accepts File | null
          setdigital_order_image(null);
        }
        setStatus(KitchenCategory.status === 0 ? 'Active' : 'Inactive');
      } else {
        setKitchen_Category('');
        setalternative_category_name('');
        setSelectedKitchenGroupId(undefined);
        setDescription('');
        setalternative_category_Description('');
        setcategorycolor('');
        setdigital_order_image(null);
        setStatus('Active');
      }
    }, [KitchenCategory]);

    const handleSave = async () => {
      if (!Kitchen_Category || !alternative_category_name || !selectedKitchenGroupId || !status) {
        toast.error('Category Name, Alternative Category Name, Kitchen Group, and Status are required');
        return;
      }

      const hotelId = user.hotelid || '1';
      const marketId = user.marketid || '1';

      setLoading(true);
      try {
        const statusValue = status === 'Active' ? 0 : 1;
        const currentDate = Date.now(); // Use timestamp (number) instead of ISO string
        const payload = {
          Kitchen_Category,
          alternative_category_name,
          kitchenmaingroupid: selectedKitchenGroupId,
          Description,
          alternative_category_Description,
          digital_order_image: digital_order_image ? digital_order_image.name : null,
          categorycolor,
          status: statusValue,
          ...(KitchenCategory
            ? {
                kitchencategoryid: KitchenCategory.kitchencategoryid,
                updated_by_id: user?.id ?? '1',
                updated_date: currentDate,
                hotelid: KitchenCategory.hotelid || hotelId,
                marketid: KitchenCategory.marketid || marketId,
              }
            : {
                created_by_id: user?.id ?? '1',
                created_date: currentDate,
                hotelid: hotelId,
                marketid: marketId,
              }),
        };
        // console.log('Sending to backend:', payload);
        const res = KitchenCategory
          ? await KitchenCategoryService.update(KitchenCategory.kitchencategoryid, payload)
          : await KitchenCategoryService.create(payload);
        toast.success(`KitchenCategory ${KitchenCategory ? 'updated' : 'added'} successfully`);
        if (KitchenCategory) {
          const updatedKitchenCategory: KitchenCategoryItem = {
            ...KitchenCategory,
            Kitchen_Category,
            alternative_category_name,
            kitchenmaingroupid: selectedKitchenGroupId,
            Description,
            alternative_category_Description,
            digital_order_image,
            categorycolor,
            status: statusValue,
            updated_by_id: user?.id || '1',
            updated_date: currentDate,
            hotelid: KitchenCategory.hotelid || hotelId,
            marketid: KitchenCategory.marketid || marketId,
          };
          onUpdateSelectedKitchenCategory(updatedKitchenCategory);
        }
        setKitchen_Category('');
        setalternative_category_name('');
        setSelectedKitchenGroupId(undefined);
        setDescription('');
        setalternative_category_Description('');
        setcategorycolor('');
        setdigital_order_image(null);
        setStatus('Active');
        onSuccess();
        onHide();
      } catch (err) {
        // console.error(`${KitchenCategory ? 'Edit' : 'Add'} KitchenCategory error:`, err);
        toast.error('Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        setdigital_order_image(e.target.files[0]);
      }
    };

    if (!show) return null;

    return (
      <div className="modal" style={{ display: 'block', background: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1050 }}>
        <div className="modal-content" style={{ background: 'white', padding: '20px', maxWidth: '800px', margin: '100px auto', borderRadius: '8px' }}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3 className="mb-0">{KitchenCategory ? 'Edit Category' : 'Add Category'}</h3>
            <button className="btn btn-sm btn-close" onClick={onHide}></button>
          </div>

          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">
                Category Name: <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                value={Kitchen_Category}
                onChange={(e) => setKitchen_Category(e.target.value)}
                placeholder="Enter Category Name"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">
                Alternative Category Name: <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                value={alternative_category_name}
                onChange={(e) => setalternative_category_name(e.target.value)}
                placeholder="Alternative Category Name"
              />
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">
                Kitchen Group: <span className="text-danger">*</span>
              </label>
              <Form.Select
                value={selectedKitchenGroupId || ''}
                onChange={(e) => setSelectedKitchenGroupId(e.target.value ? Number(e.target.value) : undefined)}
                disabled={loading}
              >
                <option value="">Select Kitchen Group</option>
                {kitchenGroups.map((group) => (
                  <option key={group.kitchenmaingroupid} value={group.kitchenmaingroupid}>
                    {group.Kitchen_main_Group}
                  </option>
                ))}
              </Form.Select>
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">Description</label>
              <textarea
                className="form-control"
                value={Description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description"
                rows={3}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Alternative Description</label>
              <textarea
                className="form-control"
                value={alternative_category_Description}
                onChange={(e) => setalternative_category_Description(e.target.value)}
                placeholder="Alternative Description"
                rows={3}
              />
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">Color:</label>
              <div className="d-flex align-items-center">
                <input
                  type="text"
                  className="form-control me-2"
                  value={categorycolor}
                  onChange={(e) => setcategorycolor(e.target.value)}
                  placeholder="Color"
                />
                <input
                  type="color"
                  value={categorycolor}
                  onChange={(e) => setcategorycolor(e.target.value)}
                  style={{ width: '40px', height: '40px', padding: '0', border: 'none' }}
                />
              </div>
            </div>
            <div className="col-md-6">
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
          </div>

          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">Digital Order Image</label>
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  value={digital_order_image ? digital_order_image.name : 'Choose a File or Drop it Here'}
                  placeholder="Choose a File or Drop it Here"
                  readOnly
                  disabled={loading}
                />
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => document.getElementById(`fileInput${KitchenCategory ? 'Edit' : 'Add'}`)?.click()}
                  disabled={loading}
                >
                  Browse
                </button>
                <input
                  id={`fileInput${KitchenCategory ? 'Edit' : 'Add'}`}
                  type="file"
                  hidden
                  onChange={handleImageChange}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-end">
            <button className="btn btn-outline-secondary me-2" onClick={onHide} disabled={loading}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
              {KitchenCategory ? 'Save' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <TitleHelmet title="Kitchen Categories List" />
      <div style={{ height: '100vh', overflowY: 'auto', padding: '0 10px' }}>
        <Card className="m-1">
          <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
            <h4 className="mb-0">
              <i className="bi bi-grid-fill me-2"></i>Kitchen Categories
            </h4>
            <div style={{ display: 'flex', gap: '4px' }}>
              <Button
                variant="success"
                onClick={() => {
                  setSelectedKitchenCategory(null);
                  setShowModal(true);
                }}
              >
                <i className="bi bi-plus"></i> Add Kitchen Category
              </Button>
            </div>
          </div>
          <div className="p-3">
            <div className="mb-3">
              <input
                type="text"
                className="form-control rounded-pill"
                placeholder="Search..."
                value={searchTerm}
                onChange={onSearchChange}
                style={{ width: '350px', borderColor: '#ccc', borderWidth: '2px' }}
              />
            </div>
            <div className="flex-grow-1" style={{ overflowY: 'auto' }}>
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
                            <th
                              key={header.id}
                              style={{
                                width: header.column.columnDef.size,
                                textAlign: header.id === 'actions' ? 'left' : 'center',
                              }}
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
                        <tr key={row.id}>
                          {row.getVisibleCells().map((cell) => (
                            <td
                              key={cell.id}
                              style={{ textAlign: cell.column.id === 'actions' ? 'left' : 'center' }}
                            >
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
                        Showing {table.getRowModel().rows.length} of {kitchenCategoryItems.length} entries
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
          </div>
        </Card>
      </div>
      <KitchenCategoryModal
        show={showModal}
        onHide={() => setShowModal(false)}
        KitchenCategory={selectedKitchenCategory}
        onSuccess={fetchKitchenCategory}
        onUpdateSelectedKitchenCategory={setSelectedKitchenCategory}
        kitchenGroups={kitchenGroups}
      />
    </>
  );
};

export default KitchenCategory;