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

interface DesignationItem {
  Designation: string;
  designationid: string;
  status: string;
  created_by_id: string;
  created_date: string;
  updated_by_id: string;
  updated_date: string;
  hotelid: string;
  marketid: string;
}

interface AddDesignationtModalProps {
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

// Main Designation Component
const Designation: React.FC = () => {
  const [DesignationItem, setDesignationItem] = useState<DesignationItem[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredDesignation, setFilteredDesignation] = useState<DesignationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDesignation, setSelectedDesignation] = useState<DesignationItem | null>(null);

  const fetchDesignation = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:3001/api/Designation');
      const data = await res.json();
      console.log('FetchedDesignation:', data); // Debug log to inspect backend data
      setDesignationItem(data);
      setFilteredDesignation(data);
    } catch (err) {
      toast.error('Failed to fetch Markets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDesignation();
  }, []);

  const columns = useMemo<ColumnDef<DesignationItem>[]>(
    () => [
      {
        id: 'srNo',
        header: 'Sr No',
        size: 50,
        cell: ({ row }) => <div style={{ textAlign: 'center' }}>{row.index + 1}</div>,
      },
      {
        accessorKey: 'Designation',
        header: 'Designation',
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
              title="Edit Designationt"
            >
              <i className="fi fi-rr-edit"></i>
            </button>
            <button
              className="btn btn-sm btn-danger"
              onClick={() => handleDeleteDesignation(row.original)}
              title="Delete Designation"
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
    data: filteredDesignation,
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
      const filteredDesignationBySearch = DesignationItem.filter((item) =>
        item.Designation.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredDesignation(filteredDesignationBySearch);
    }, 300),
    [DesignationItem]
  );

  const handleEditClick = (Designation: DesignationItem) => {
    setSelectedDesignation(Designation);
    setShowEditModal(true);
  };

  const handleDeleteDesignation = async (Designation: DesignationItem) => {
    const res = await Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to recover this Designation!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3E97FF',
      confirmButtonText: 'Yes, delete it!',
    });
    if (res.isConfirmed) {
      try {
        await fetch(`http://localhost:3001/api/Designation/${Designation.designationid}`, { method: 'DELETE' });
        toast.success('Deleted successfully');
        fetchDesignation();
        setSelectedDesignation(null);
      } catch {
        toast.error('Failed to delete');
      }
    }
  };
  //2
  // AddMarketModal Component
  const AddDesignationModal: React.FC<AddDesignationtModalProps> = ({ show, onHide, onSuccess }) => {
    const [Designation, setDesignation] = useState('');
    const [status, setStatus] = useState('Active'); // Default to 'Active'
    const [loading, setLoading] = useState(false);

    const handleAdd = async () => {
      if (!Designation || !status) {
        toast.error('Designation Name and Status are required');
        return;
      }

      setLoading(true);
      try {
        const statusValue = status === 'Active' ? 0 : 1;
        console.log('Sending to backend:', { Designation, status: statusValue }); // Debug log
        const res = await fetch('http://localhost:3001/api/Designation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ Designation, status: statusValue }),
        });
        if (res.ok) {
          toast.success('Designation added successfully');
          setDesignation('');
          setStatus('Active'); // Reset to 'Active' after successful add
          onSuccess();
          onHide();
        } else {
          const errorData = await res.json();
          console.log('Backend error:', errorData); // Debug log
          toast.error('Failed to add market');
        }
      } catch (err) {
        console.error('Add Designation error:', err); // Debug log
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
            <h5 className="mb-0">Add Designation</h5>
            <button className="btn-close" onClick={onHide}></button>
          </div>
          <div className="row mb-3">
            <div className="col-md-12">
              <label className="form-label">Designation Name <span style={{ color: 'red' }}>*</span></label>
              <input type="text" className="form-control" value={Designation} onChange={(e) => setDesignation(e.target.value)} placeholder="EnterDesignation Name" />
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
  // EditDesignationModal Component
  const EditDesignationModal: React.FC<{
    show: boolean;
    onHide: () => void;
    Designation: DesignationItem | null;
    onSuccess: () => void;
    onUpdateSelectedDesignation: (Designation: DesignationItem) => void;
  }> = ({ show, onHide, Designation, onSuccess, onUpdateSelectedDesignation }) => {
    const [designationName, setDesignationName] = useState('');
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      if (Designation) {
        setDesignationName(Designation.Designation);
        setStatus(String(Designation.status) === '0' ? 'Active' : 'Inactive');
        console.log('Edit market status:', Designation.status, typeof Designation.status); // Debug log
      }
    }, [Designation]);

    const handleEdit = async () => {
      if (!designationName || !status || !Designation) {
        toast.error('Market Name and Status are required');
        return;
      }

      setLoading(true);
      try {
        const statusValue = status === 'Active' ? 0 : 1;
        console.log('Sending to backend:', { Designation: designationName, status: statusValue }); // Debug log
        const res = await fetch(`http://localhost:3001/api/Designation/${Designation.designationid}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ Designation: designationName, status: statusValue }),
        });
        if (res.ok) {
          toast.success('Designation updated successfully');
          onSuccess();
          const updatedDesignation = { ...Designation, Designation: designationName, status: statusValue.toString() };
          onUpdateSelectedDesignation(updatedDesignation);
          onHide();
        } else {
          const errorData = await res.json();
          console.log('Backend error:', errorData); // Debug log
          toast.error('Failed to update Designation');
        }
      } catch (err) {
        console.error('Edit Designation error:', err); // Debug log
        toast.error('Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    if (!show || !Designation) return null;

    return (
      <div className="modal" style={{ display: show ? 'block' : 'none', background: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
        <div className="modal-content" style={{ background: 'white', padding: '20px', maxWidth: '600px', margin: '100px auto', borderRadius: '8px' }}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Edit Designation</h5>
            <button className="btn-close" onClick={onHide}></button>
          </div>
          <div className="row mb-3">
            <div className="col-md-12">
              <label className="form-label">Designation Name <span style={{ color: 'red' }}>*</span></label>
              <input type="text" className="form-control" value={designationName} onChange={(e) => setDesignationName(e.target.value)} placeholder="Enter Designation Name" />
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
      <TitleHelmet title="Designation List" />
      <Card className="m-1">
        <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
          <h4 className="mb-0">Designation List</h4>
          <Button variant="success" onClick={() => setShowAddModal(true)}>
            <i className="bi bi-plus"></i> Add Designation
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
      <AddDesignationModal show={showAddModal} onHide={() => setShowAddModal(false)} onSuccess={fetchDesignation} />
      <EditDesignationModal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        Designation={selectedDesignation}
        onSuccess={fetchDesignation}
        onUpdateSelectedDesignation={setSelectedDesignation}
      />
    </>
  );
};

export default Designation;