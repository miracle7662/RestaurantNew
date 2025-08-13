import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Swal from 'sweetalert2';
import { toast } from 'react-hot-toast';
import { Preloader } from '@/components/Misc/Preloader';
import { Button, Card, Stack, Table } from 'react-bootstrap';
import TitleHelmet from '@/components/Common/TitleHelmet';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table';

interface KitchenCategoryItem {
  kitchencategoryid: number;
  Kitchen_Category: string;
  Description: string;
  alternative_category_Description: string;
  alternative_category_name: string;
  digital_order_image: File | null;
  categorycolor: string;
  status: string;
  created_by_id: string;
  created_date: string;
  updated_by_id: string;
  updated_date: string;
  hotelid: string;
  marketid: string;
}

interface AddKitchenCategoryModalProps {
  show: boolean;
  onHide: () => void;
  onSuccess: () => void;
}

interface EditKitchenCategoryModalProps {
  show: boolean;
  onHide: () => void;
  KitchenCategory: KitchenCategoryItem | null;
  onSuccess: () => void;
  onUpdateSelectedKitchenCategory: (KitchenCategory: KitchenCategoryItem) => void;
}

// Debounce utility function
const debounce = (func: (...args: any[]) => void, wait: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Main KitchenCategory Component
const KitchenCategory: React.FC = () => {
  const [kitchenCategoryItems, setKitchenCategoryItems] = useState<KitchenCategoryItem[]>([]);
  const [filteredKitchenCategory, setFilteredKitchenCategory] = useState<KitchenCategoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedKitchenCategory, setSelectedKitchenCategory] = useState<KitchenCategoryItem | null>(null);

  const fetchKitchenCategory = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:3001/api/KitchenCategory');
      const data = await res.json();
      console.log('Fetched KitchenCategory:', data);
      setKitchenCategoryItems(data);
      setFilteredKitchenCategory(data);
    } catch (err) {
      toast.error('Failed to fetch KitchenCategory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKitchenCategory();
  }, []);

  // Handle search
  const handleSearch = useCallback(
    debounce((value: string) => {
      setSearchTerm(value);
      const filtered = kitchenCategoryItems.filter((item) =>
        item.Kitchen_Category.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredKitchenCategory(filtered);
    }, 300),
    [kitchenCategoryItems]
  );

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
            {info.getValue<File>() ? info.getValue<File>().name : 'No Image'}
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
            {info.getValue<string>() === '0' ? 'Active' : 'Inactive'}
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
    []
  );

  const table = useReactTable({
    data: filteredKitchenCategory,
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

  const handleEditClick = useCallback((kitchenCategory: KitchenCategoryItem) => {
    setSelectedKitchenCategory(kitchenCategory);
    setShowEditModal(true);
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
          await fetch(`http://localhost:3001/api/KitchenCategory/${kitchenCategory.kitchencategoryid}`, {
            method: 'DELETE',
          });
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

  // AddKitchenCategoryModal Component
  const AddKitchenCategoryModal: React.FC<AddKitchenCategoryModalProps> = ({ show, onHide, onSuccess }) => {
    const [Kitchen_Category, setKitchen_Category] = useState('');
    const [Description, setDescription] = useState('');
    const [alternative_category_Description, setalternative_category_Description] = useState('');
    const [alternative_category_name, setalternative_category_name] = useState('');
    const [digital_order_image, setdigital_order_image] = useState<File | null>(null);
    const [categorycolor, setcategorycolor] = useState('');
    const [status, setStatus] = useState('Active');
    const [loading, setLoading] = useState(false);

    const handleAdd = async () => {
      if (!Kitchen_Category || !Description || !alternative_category_Description || !alternative_category_name || !status) {
        toast.error('All required fields must be filled');
        return;
      }

      setLoading(true);
      try {
        const statusValue = status === 'Active' ? 0 : 1;
        const currentDate = new Date().toISOString();
        const payload = {
          Kitchen_Category,
          alternative_category_name,
          Description,
          alternative_category_Description,
          digital_order_image: digital_order_image ? digital_order_image.name : null,
          categorycolor,
          status: statusValue,
          created_by_id: '1',
          created_date: currentDate,
          updated_by_id: '1',
          updated_date: currentDate,
          hotelid: '1',
          marketid: '1',
        };
        console.log('Sending to backend:', payload);
        const res = await fetch('http://localhost:3001/api/KitchenCategory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          toast.success('KitchenCategory added successfully');
          setKitchen_Category('');
          setDescription('');
          setalternative_category_Description('');
          setalternative_category_name('');
          setdigital_order_image(null);
          setcategorycolor('');
          setStatus('Active');
          onSuccess();
          onHide();
        } else {
          const errorData = await res.json();
          console.log('Backend error:', errorData);
          toast.error('Failed to add KitchenCategory');
        }
      } catch (err) {
        console.error('Add KitchenCategory error:', err);
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
      <div className="modal" style={{ display: 'block', background: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
        <div className="modal-content" style={{ padding: '20px', maxWidth: '800px', margin: '100px auto', borderRadius: '8px', background: 'white' }}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3 className="mb-0">Add Category</h3>
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
              <div className="mt-3">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  value={Description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description"
                  rows={3}
                />
              </div>
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
              <div className="mt-3">
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
              <label className="form-label">Image</label>
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  value={digital_order_image ? digital_order_image.name : ''}
                  placeholder="Choose a File or Drop it Here"
                  readOnly
                  disabled={loading}
                />
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => document.getElementById('fileInputAdd')?.click()}
                  disabled={loading}
                >
                  Browse
                </button>
                <input
                  id="fileInputAdd"
                  type="file"
                  hidden
                  onChange={handleImageChange}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-end">
            <button className="btn btn-outline-secondary me-2" onClick={onHide}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleAdd} disabled={loading}>
              Create
            </button>
          </div>
        </div>
      </div>
    );
  };

  // EditKitchenCategoryModal Component
  const EditKitchenCategoryModal: React.FC<EditKitchenCategoryModalProps> = ({
    show,
    onHide,
    KitchenCategory,
    onSuccess,
    onUpdateSelectedKitchenCategory,
  }) => {
    const [Kitchen_Category, setKitchen_Category] = useState('');
    const [alternative_category_name, setalternative_category_name] = useState('');
    const [Description, setDescription] = useState('');
    const [alternative_category_Description, setalternative_category_Description] = useState('');
    const [categorycolor, setcategorycolor] = useState('');
    const [digital_order_image, setdigital_order_image] = useState<File | null>(null);
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      if (KitchenCategory) {
        setKitchen_Category(KitchenCategory.Kitchen_Category);
        setalternative_category_name(KitchenCategory.alternative_category_name);
        setDescription(KitchenCategory.Description);
        setalternative_category_Description(KitchenCategory.alternative_category_Description);
        setcategorycolor(KitchenCategory.categorycolor);
        setdigital_order_image(KitchenCategory.digital_order_image);
        setStatus(KitchenCategory.status === '0' ? 'Active' : 'Inactive');
      }
    }, [KitchenCategory]);

    const handleEdit = async () => {
      if (!Kitchen_Category || !alternative_category_name || !status) {
        toast.error('Category Name, Alternative Category Name, and Status are required');
        return;
      }

      setLoading(true);
      try {
        const statusValue = status === 'Active' ? 0 : 1;
        const currentDate = new Date().toISOString();
        const payload = {
          Kitchen_Category,
          alternative_category_name,
          Description,
          alternative_category_Description,
          digital_order_image: digital_order_image ? digital_order_image.name : null,
          categorycolor,
          status: statusValue,
          kitchencategoryid: KitchenCategory?.kitchencategoryid,
          updated_by_id: '2',
          updated_date: currentDate,
          hotelid: KitchenCategory?.hotelid || '1',
          marketid: KitchenCategory?.marketid || '1',
        };
        console.log('Sending to backend:', payload);
        const res = await fetch(`http://localhost:3001/api/KitchenCategory/${KitchenCategory?.kitchencategoryid}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          toast.success('KitchenCategory updated successfully');
          onSuccess();
          const updatedKitchenCategory = {
            ...KitchenCategory!,
            Kitchen_Category,
            alternative_category_name,
            Description,
            alternative_category_Description,
            digital_order_image,
            categorycolor,
            status: statusValue.toString(),
            updated_by_id: '2',
            updated_date: currentDate,
          };
          onUpdateSelectedKitchenCategory(updatedKitchenCategory);
          onHide();
        } else {
          const errorData = await res.json();
          console.log('Backend error:', errorData);
          toast.error('Failed to update KitchenCategory');
        }
      } catch (err) {
        console.error('Edit KitchenCategory error:', err);
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

    if (!show || !KitchenCategory) return null;

    return (
      <div className="modal" style={{ display: 'block', background: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
        <div className="modal-content" style={{ background: 'white', padding: '20px', maxWidth: '800px', margin: '100px auto', borderRadius: '8px' }}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3 className="mb-0">Edit Category</h3>
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
                  onClick={() => document.getElementById('fileInputEdit')?.click()}
                  disabled={loading}
                >
                  Browse
                </button>
                <input
                  id="fileInputEdit"
                  type="file"
                  hidden
                  onChange={handleImageChange}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-end">
            <button className="btn btn-outline-secondary me-2" onClick={onHide}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleEdit} disabled={loading}>
              Save
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <TitleHelmet title="Kitchen Categories List" />
      <Card className="m-1">
        <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
          <h4 className="mb-0">
            <i className="bi bi-grid-fill me-2"></i>Kitchen Categories
          </h4>
          <div className="d-flex align-items-center gap-2">
            <input
              type="text"
              className="form-control"
              placeholder="Search by Category Name..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              style={{ maxWidth: '300px' }}
            />
            <Button
              style={{ backgroundColor: '#4682B4', borderColor: '#4682B4' }}
              onClick={() => setShowAddModal(true)}
            >
              <i className="bi bi-plus"></i> Add Kitchen Category
            </Button>
          </div>
        </div>
        <div className="p-3">
          {loading ? (
            <Stack className="align-items-center justify-content-center flex-grow-1 h-100">
              <Preloader />
            </Stack>
          ) : (
            <>
              <div style={{ width: '100%', overflowX: 'auto' }}>
                <Table responsive className="mb-0" style={{ tableLayout: 'auto', width: '100%' }}>
                  <thead>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <th
                            key={header.id}
                            style={{
                              width: header.column.columnDef.size,
                              whiteSpace: 'normal',
                              padding: '8px',
                              textAlign: header.id === 'actions' ? 'center' : 'center',
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
                            style={{
                              whiteSpace: 'normal',
                              padding: '8px',
                              textAlign: cell.column.id === 'actions' ? 'center' : 'center',
                            }}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              <div className="d-flex justify-content-between align-items-center mt-3">
                <div>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    className="ms-2"
                  >
                    Next
                  </Button>
                </div>
                <div>
                  Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                </div>
              </div>
            </>
          )}
        </div>
      </Card>
      <AddKitchenCategoryModal show={showAddModal} onHide={() => setShowAddModal(false)} onSuccess={fetchKitchenCategory} />
      <EditKitchenCategoryModal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        KitchenCategory={selectedKitchenCategory}
        onSuccess={fetchKitchenCategory}
        onUpdateSelectedKitchenCategory={setSelectedKitchenCategory}
      />
    </>
  );
};

export default KitchenCategory;