import React, { useState, useEffect, useMemo } from 'react';
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
  alternative_category_Description : string;
  alternative_category_name: string;
  digital_order_image: File;
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

//1
// Debounce utility function
const debounce = (func: (...args: any[]) => void, wait: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Main Market Component
const KitchenCategory: React.FC = () => {
  const [KitchenCategoryItems, setKitchenCategoryItems] = useState<KitchenCategoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredKitchenCategory, setFilteredKitchenCategory] = useState<KitchenCategoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedKitchenCategory, setSelectedKitchenCategory] = useState<KitchenCategoryItem | null>(null);

  const fetchKitchenCategory = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:3001/api/KitchenCategory');
      const data = await res.json();
      console.log('Fetched KitchenCategory:', data); // Debug log to inspect backend data
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
        header: ' Image',
        size: 150,
        cell: (info) => <div style={{ textAlign: 'center' }}>{info.getValue<string>()}</div>,
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
        accessorKey: 'categorycolor',
        header: 'Category Color',
        size: 150,
        cell: (info) => <div style={{ textAlign: 'center' }}>{info.getValue<string>()}</div>,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 150,
        cell: (info) => {
          const statusValue = info.getValue<string | number>();
          console.log('Status value:', statusValue, typeof statusValue); // Debug log
          return <div style={{ textAlign: 'center' }}>{statusValue == '0' || statusValue === 0 ? 'Active' : 'Inactive'}</div>;
        },
      },
      {
        id: 'actions',
        header: () => <div style={{ textAlign: 'center' }}>Action</div>,
        size: 150,
        cell: ({ row }) => (
          <div className="d-flex gap-2 justify-content-center">
            <button
              className="btn btn-sm btn-success"
              onClick={() => handleEditClick(row.original)}
              title="Edit KitchenCategory"
            >
              <i className="fi fi-rr-edit"></i>
            </button>
            <button
              className="btn btn-sm btn-danger"
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

 (
    debounce((value: string) => {
      setSearchTerm(value);
      const filteredKitchenCategoryBySearch = KitchenCategoryItems.filter((item) =>
        item.Kitchen_Category.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredKitchenCategory(filteredKitchenCategoryBySearch);
    }, 300),
    [KitchenCategoryItems]
  );

  const handleEditClick = (KitchenCategory: KitchenCategoryItem) => {
    setSelectedKitchenCategory(KitchenCategory);
    setShowEditModal(true);
  };

  const handleDeleteKitchenCategory = async (KitchenCategory: KitchenCategoryItem) => {
    const res = await Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to recover this KitchenCategory!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3E97FF',
      confirmButtonText: 'Yes, delete it!',
    });
    if (res.isConfirmed) {
      try {
        await fetch(`http://localhost:3001/api/KitchenCategory/${KitchenCategory.kitchencategoryid}`, { method: 'DELETE' });
        toast.success('Deleted successfully');
        fetchKitchenCategory();
        setSelectedKitchenCategory(null);
      } catch {
        toast.error('Failed to delete');
      }
    }
  };

   //2
  // AddMarketModal Component
  const AddKitchenCategoryModal: React.FC<AddKitchenCategoryModalProps> = ({ show, onHide, onSuccess }) => {
    const [Kitchen_Category, setKitchen_Category] = useState('');
    const [Description, setDescription] = useState('');
    const [alternative_category_Description, setalternative_category_Description] = useState('');
    const [alternative_category_name, setalternative_category_name] = useState('');
    const [digital_order_image, setdigital_order_image] = useState<File | null>(null);
    const [categorycolor, setcategorycolor] = useState('');
    const [status, setStatus] = useState('Active'); // Default to 'Active'
    const [loading, setLoading] = useState(false);

    const handleAdd = async () => {
      if (!Kitchen_Category || !Description || !alternative_category_Description || !alternative_category_name   || !status) {
        toast.error('All fields are required');
        return;
      }

      setLoading(true);
      try {
        const statusValue = status === 'Active' ? 0 : 1;
        const currentDate = new Date().toISOString (); // Timestamp:
        const payload = {
          Kitchen_Category,
          alternative_category_name,
          Description,
          alternative_category_Description,
          digital_order_image,
          categorycolor,
          status: statusValue,
          created_by_id:1,
          created_date: currentDate,
        };
        console.log('Sending to backend:', payload ); // Debug log
        const res = await fetch('http://localhost:3001/api/KitchenCategory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify( payload ),
        });
        if (res.ok) {
          toast.success('KitchenCategory added successfully');
          
          setKitchen_Category('');
          setDescription('');
          setalternative_category_Description('')
          setalternative_category_name('');
          setdigital_order_image(null); // This is the proper null value
          setcategorycolor('');
          setStatus('Active'); // Reset to 'Active' after successful add
          onSuccess();
          onHide();
        } else {
          const errorData = await res.json();
          console.log('Backend error:', errorData); // Debug log
          toast.error('Failed to add market');
        }
      } catch (err) {
        console.error('Add market error:', err); // Debug log
        toast.error('Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    if (!show) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setdigital_order_image(e.target.files[0]);
}
};

   return (
  <div className="modal" style={{ display: 'block', background: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
    <div className="modal-content" style={{ padding: '20px', maxWidth: '800px', margin: '100px auto', borderRadius: '8px' }}>
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
        <button className="btn btn-danger me-2" onClick={onHide}>
          Cancel
        </button>
        <button className="btn btn-success" onClick={handleAdd}>
          Create
        </button>
      </div>
    </div>
  </div>
);
};
  //3
  // EditKitchenCategorytModal Component
  const EditKitchenCategoryModal: React.FC<{
    show: boolean;
    onHide: () => void;
    KitchenCategory: KitchenCategoryItem | null;
    onSuccess: () => void;
    onUpdateSelectedKitchenCategory: (KitchenCategory: KitchenCategoryItem) => void;
  }> = ({ show, onHide, KitchenCategory, onSuccess, onUpdateSelectedKitchenCategory }) => {
    const [Kitchen_Category, setKitchen_Category] = useState('');
    const [alternative_category_name, setalternative_category_name] = useState('');
    const [Description, setDescription] = useState('');
    const [alternative_category_Description, setalternative_category_Description] = useState('');
    const [categorycolor, setcategorycolor] = useState('');
    const [digital_order_image, ] = useState<File | null>(null);
    const [status, setStatus] = useState('');
    const [, setLoading] = useState(false);

    useEffect(() => {
      if (KitchenCategory) {
        setKitchen_Category(KitchenCategory.Kitchen_Category);
        setalternative_category_name(KitchenCategory.alternative_category_name);
        setDescription(KitchenCategory.Description);
        setalternative_category_Description(KitchenCategory.alternative_category_Description);
        setcategorycolor(KitchenCategory.categorycolor);
        setStatus(String(KitchenCategory.status) === '0' ? 'Active' : 'Inactive');
        console.log('EditKitchenCategory status:', KitchenCategory.status, typeof KitchenCategory.status); // Debug log
      }
    }, [KitchenCategory]);

    const handleEdit = async () => {
      if (!Kitchen_Category  || !alternative_category_name || !Description || !alternative_category_Description || !categorycolor || !KitchenCategory  ) {
        toast.error('KitchenCategory Name and Status are required');
        return;
      }

      setLoading(true);
      try {
        const statusValue = status === 'Active' ? 0 : 1;
        const currentDate = new Date().toISOString(); // Timestamp: e.g., 2025-07-01T04:51:00.000Z
      const payload = {
        Kitchen_Category,
        alternative_category_name,
        Description,
        alternative_category_Description,
        categorycolor,
        status: statusValue,
        kitchencategoryid: KitchenCategory?.kitchencategoryid,
        updated_by_id: '2', // Default to "0" (string)
        updated_date: currentDate,
      };
        console.log('Sending to backend:', payload    ); // Debug log
        const res = await fetch(`http://localhost:3001/api/KitchenCategory/${KitchenCategory?.kitchencategoryid}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify( payload),
        });
        if (res.ok) {
          toast.success('KitchenCategory updated successfully');
          onSuccess();
          const updatedKitchenCategory = { ...KitchenCategory, Kitchen_Category, status: statusValue.toString() };
          onUpdateSelectedKitchenCategory(updatedKitchenCategory);
          onHide();
        } else {
          const errorData = await res.json();
          console.log('Backend error:', errorData); // Debug log
          toast.error('Failed to update KitchenCategory');
        }
      } catch (err) {
        console.error('Edit KitchenCategory error:', err); // Debug log
        toast.error('Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    if (!show || !Kitchen_Category) return null;

    // const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // if (e.target.files && e.target.files[0]) {
    //   setdigitalOrderImage(e.target.files[0]);
    //   };

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
          <div className="row mb-4">
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
          </div>
        </div>
        
        <div className="col-md-6">
          <label className="form-label">Digital Order Image</label>
          <div className="d-flex align-items-center">
            <div
              className="border rounded p-2 flex-grow-1 text-center"
              style={{ borderColor: digital_order_image ? '#dc3545' : '#ced4da' }}
            >
              {digital_order_image ? digital_order_image.name : 'Choose a File or Drop it Here'}
            </div>
            <button className="btn btn-outline-secondary ms-2">Browse</button>
          </div>
        </div>
      </div>

      <div className="d-flex justify-content-end">
        <button className="btn btn-danger me-2" onClick={onHide}>
          Cancel
        </button>
        <button className="btn btn-success" onClick={handleEdit}>
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
          <h4 className="mb-0">Kitchen Categories</h4>
          <Button variant="success" onClick={() => setShowAddModal(true)}>
            <i className="bi bi-plus"></i> Add Kitchen Categories
          </Button>
        </div>
        <div className="p-3">
          {loading ? (
            <Stack className="align-items-center justify-content-center flex-grow-1 h-100">
              <Preloader />
            </Stack>
          ) : (
            <Table responsive>
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