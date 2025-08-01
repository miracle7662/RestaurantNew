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

interface HoteltypeItem {
  hotel_type: string;
  hoteltypeid: string;
  status: string;
  created_by_id: string;
  created_date: string;
  Updated_by_id: string;
  updated_date: string;
  hotelid: string;
  marketid: string;
}

interface AddHoteltypeModalProps {
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

// Main Hoteltype Component
const Hoteltype: React.FC = () => {
  const [hoteltypeItem, setHoteltypeItem] = useState<HoteltypeItem[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredHoteltype, setFilteredHoteltype] = useState<HoteltypeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedHoteltype, setSelectedHoteltype] = useState<HoteltypeItem | null>(null);

  const fetchHoteltype = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:3001/api/hoteltype');
      const data = await res.json();
      console.log('Fetched hotel types:', data); // Debug log
      setHoteltypeItem(data);
      setFilteredHoteltype(data);
    } catch (err) {
      toast.error('Failed to fetch Hoteltype');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHoteltype();
  }, []);

  // Define columns for react-table with explicit widths
  const columns = useMemo<ColumnDef<HoteltypeItem>[]>(
    () => [
      {
        id: 'srNo',
        header: 'Sr No',
        size: 50,
        cell: ({ row }) => <div style={{ textAlign: 'center' }}>{row.index + 1}</div>,
      },
      {
        accessorKey: 'hotel_type',
        header: 'Hotel Type',
        size: 200,
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
              title="Edit Hotel Type"
            >
              <i className="fi fi-rr-edit"></i>
            </button>
            <button
              className="btn btn-sm btn-danger"
              onClick={() => handleDeleteHoteltype(row.original)}
              title="Delete Hotel Type"
            >
              <i className="fi fi-rr-trash"></i>
            </button>
          </div>
        ),
      },
    ],
    []
  );

  // Initialize react-table with pagination
  const table = useReactTable({
    data: filteredHoteltype,
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

  // Search functionality
 (
    debounce((value: string) => {
      setSearchTerm(value);
      const filteredHoteltypeBySearch = hoteltypeItem.filter((item) =>
        item.hotel_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredHoteltype(filteredHoteltypeBySearch);
    }, 300),
    [hoteltypeItem]
  );

  const handleEditClick = (hoteltype: HoteltypeItem) => {
    setSelectedHoteltype(hoteltype);
    setShowEditModal(true);
  };

  const handleDeleteHoteltype = async (hoteltype: HoteltypeItem) => {
    const res = await Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to recover this hotel type!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3E97FF',
      confirmButtonText: 'Yes, delete it!',
    });
    if (res.isConfirmed) {
      try {
        await fetch(`http://localhost:3001/api/hoteltype/${hoteltype.hoteltypeid}`, { method: 'DELETE' });
        toast.success('Deleted successfully');
        fetchHoteltype();
        setSelectedHoteltype(null);
      } catch {
        toast.error('Failed to delete');
      }
    }
  };
   //2
  // AddHoteltypeModal Component
  const AddHoteltypeModal: React.FC<AddHoteltypeModalProps> = ({ show, onHide, onSuccess }) => {
    const [hotel_type, setName] = useState('');
    const [status, setStatus] = useState('Active'); // Default to 'Active'
    const [loading, setLoading] = useState(false);

    const handleAdd = async () => {
      if (!hotel_type || !status) {
        toast.error('All fields are required');
        return;
      }

      setLoading(true);
      try {
        const statusValue = status === 'Active' ? 0 : 1;
      const currentDate = new Date().toISOString(); // Timestamp: e.g., 2025-07-01T04:00:00.000Z
      const payload = {
        hotel_type,
        status: statusValue,
        created_by_id: 1, // Default to null (or 0 if backend requires)
        created_date: currentDate,
      };
      console.log('Sending to backend:', payload); // Debug log
        const res = await fetch('http://localhost:3001/api/hoteltype', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        });
        if (res.ok) {
          toast.success('Hoteltype added successfully');
          setName('');
          setStatus('Active');
          onSuccess();
          onHide();
        } else {
          const errorData = await res.json();
          console.log('Backend error:', errorData); // Debug log
          toast.error('Failed to add hoteltype');
        }
      } catch (err) {
        console.error('Add hoteltype error:', err); // Debug log
        toast.error('Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    if (!show) return null;

    return (
      <div className="modal" style={{ display: show ? 'block' : 'none', background: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
        <div className="modal-content" style={{ background: 'white', padding: '20px', maxWidth: '600px', margin: '100px auto', borderRadius: '8px' }}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Add Hotel Type</h5>
            <button className="btn-close" onClick={onHide}></button>
          </div>
          <div className="row mb-3">
            <div className="col-md-12">
              <label className="form-label">Hotel Type <span style={{ color: 'red' }}>*</span></label>
              <input type="text" className="form-control" value={hotel_type} onChange={(e) => setName(e.target.value)} placeholder="Enter Hotel Type" />
            </div>
          </div>
          <div className="row mb-3">
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
          <div className="d-flex justify-content-end mt-4">
            <button className="btn btn-success me-2" onClick={handleAdd} disabled={loading}>
              {loading ? 'Adding...' : 'Create'}
            </button>
            <button className="btn btn-danger" onClick={onHide} disabled={loading}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };
  //3
  // EditHoteltypeModal Component
  interface EditHoteltypeModalProps {
    show: boolean;
    onHide: () => void;
    msthoteltype: HoteltypeItem | null;
    onSuccess: () => void;
    onUpdateSelectedHoteltype: (msthoteltype: HoteltypeItem) => void;
  }

  const EditHoteltypeModal: React.FC<EditHoteltypeModalProps> = ({ show, onHide, msthoteltype, onSuccess, onUpdateSelectedHoteltype }) => {
    const [hotel_type, setName] = useState('');
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      if (msthoteltype) {
        setName(msthoteltype.hotel_type);
        setStatus(String(msthoteltype.status) === '0' ? 'Active' : 'Inactive');
        console.log('Edit hoteltype status:', msthoteltype.status, typeof msthoteltype.status); // Debug log
      }
    }, [msthoteltype]);

    const handleEdit = async () => {
      if (!hotel_type || !status || !msthoteltype) {
        toast.error('All fields are required');
        return;
      }

      setLoading(true);
      try {
      const statusValue = status === 'Active' ? 0 : 1;
      const currentDate = new Date().toISOString(); // Timestamp: e.g., 2025-07-01T04:51:00.000Z
      const payload = {
        hotel_type,
        status: statusValue,
        hoteltypeid: msthoteltype.hoteltypeid,
        updated_by_id: '2', // Default to "0" (string)
        updated_date: currentDate,
       
      };
      console.log('Sending to backend:', payload); // Debug log
        const res = await fetch(`http://localhost:3001/api/hoteltype/${msthoteltype.hoteltypeid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        });
        if (res.ok) {
          toast.success('Hoteltype updated successfully');
          onSuccess();
          const updatedHoteltype = { ...msthoteltype, hotel_type, status: statusValue.toString() };
          onUpdateSelectedHoteltype(updatedHoteltype);
          onHide();
        } else {
          const errorData = await res.json();
          console.log('Backend error:', errorData); // Debug log
          toast.error('Failed to update hoteltype');
        }
      } catch (err) {
        console.error('Edit hoteltype error:', err); // Debug log
        toast.error('Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    if (!show || !msthoteltype) return null;

    return (
      <div className="modal" style={{ display: show ? 'block' : 'none', background: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
        <div className="modal-content" style={{ background: 'white', padding: '20px', maxWidth: '600px', margin: '100px auto', borderRadius: '8px' }}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Edit Hotel Type</h5>
            <button className="btn-close" onClick={onHide}></button>
          </div>
          <div className="row mb-3">
            <div className="col-md-12">
              <label className="form-label">Hotel Type <span style={{ color: 'red' }}>*</span></label>
              <input type="text" className="form-control" value={hotel_type} onChange={(e) => setName(e.target.value)} placeholder="Enter Hotel Type" />
            </div>
          </div>
          <div className="row mb-3">
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
          <div className="d-flex justify-content-end mt-4">
            <button className="btn btn-success me-2" onClick={handleEdit} disabled={loading}>
              {loading ? 'Updating...' : 'Save'}
            </button>
            <button className="btn btn-danger" onClick={onHide} disabled={loading}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <TitleHelmet title="Hotel Type List" />
      <Card className="m-1">
        <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
          <h4 className="mb-0">Hotel Type List</h4>
          <Button variant="success" onClick={() => setShowAddModal(true)}>
            <i className="bi bi-plus"></i> Add Hotel Type
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
      <AddHoteltypeModal show={showAddModal} onHide={() => setShowAddModal(false)} onSuccess={fetchHoteltype} />
      <EditHoteltypeModal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        msthoteltype={selectedHoteltype}
        onSuccess={fetchHoteltype}
        onUpdateSelectedHoteltype={setSelectedHoteltype}
      />
    </>
  );
};

export default Hoteltype;