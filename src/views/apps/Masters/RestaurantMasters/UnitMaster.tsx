import React, { useState, useEffect, useMemo } from 'react';
import Swal from 'sweetalert2';
import { toast } from 'react-hot-toast';
import { Preloader } from '@/components/Misc/Preloader';
import { Button, Card, Stack, Table } from 'react-bootstrap';
import TitleHelmet from '@/components/Common/TitleHelmet';
import InputMask from 'react-input-mask';

import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table';

interface unitmasterItem {
  unit_name: string;
  unitid: string;
  status: string;
  created_by_id: string;
  created_date: string;
  updated_by_id: string;
  updated_date: string;
  hotel_id: string;
  client_code: string;
}

interface AddunitmasterModalProps {
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
const Unitmaster: React.FC = () => {
  const [unitmasterItem, setunitmasterItem] = useState<unitmasterItem[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredunitmaster, setFilteredunitmaster] = useState<unitmasterItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedunitmaster, setSelectedunitmaster] = useState<unitmasterItem | null>(null);

  const fetchunitmaster = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:3001/api/unitmaster');
      const data = await res.json();
      console.log('Fetched markets:', data); // Debug log to inspect backend data
      setunitmasterItem(data);
      setFilteredunitmaster(data);
    } catch (err) {
      toast.error('Failed to fetch Unitmaster');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchunitmaster();
  }, []);

  const columns = useMemo<ColumnDef<unitmasterItem>[]>(
    () => [
      {
        id: 'srNo',
        header: 'Sr No',
        size: 50,
        cell: ({ row }) => <div style={{ textAlign: 'center' }}>{row.index + 1}</div>,
      },
      {
        accessorKey: 'unit_name',
        header: ' unitname',
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
              title="Edit Unitmaster"
            >
              <i className="fi fi-rr-edit"></i>
            </button>
            <button
              className="btn btn-sm btn-danger"
              onClick={() => handleDeleteunitmaster(row.original)}
              title="Delete Unitmaster"
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
    data: filteredunitmaster,
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
      const filteredunitmasterBySearch = unitmasterItem.filter((item) =>
        item.unit_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredunitmaster(filteredunitmasterBySearch);
    }, 300),
    [unitmasterItem]
  );

  const handleEditClick = (unitmaster: unitmasterItem) => {
    setSelectedunitmaster(unitmaster);
    setShowEditModal(true);
  };

  const handleDeleteunitmaster = async (unitmaster: unitmasterItem) => {
    const res = await Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to recover this market!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3E97FF',
      confirmButtonText: 'Yes, delete it!',
    });
    if (res.isConfirmed) {
      try {
        await fetch(`http://localhost:3001/api/unitmaster/${unitmaster.unitid}`, { method: 'DELETE' });
        toast.success('Deleted successfully');
        fetchunitmaster();
        setSelectedunitmaster(null);
      } catch {
        toast.error('Failed to delete');
      }
    }
  };

  //2
  // AddMarketModal Component
  const AddunitmasterModal: React.FC<AddunitmasterModalProps> = ({ show, onHide, onSuccess }) => {
    const [unit_name, setunit_name] = useState('');
    const [status, setStatus] = useState('Active'); // Default to 'Active'
    const [loading, setLoading] = useState(false);

    const handleAdd = async () => {
      if (!unit_name || !status) {
        toast.error('Unitmaster Name and Status are required');
        return;
      }

      setLoading(true);
      try {
        const statusValue = status === 'Active' ? 0 : 1;
        const currentDate = new Date().toISOString(); // Timestamp: e.g., 2025-07-01T04:00:00.000Z
        const payload = {
          unit_name,
          status: statusValue,

          created_by_id: 1, // Default to null (or 0 if backend requires)
          created_date: currentDate,
        };
        console.log('Sending to backend:', payload); // Debug log
        const res = await fetch('http://localhost:3001/api/unitmaster', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          toast.success('Unitmaster added successfully');
          setunit_name('');
          setStatus('Active'); // Reset to 'Active' after successful add
          onSuccess();
          onHide();
        } else {
          const errorData = await res.json();
          console.log('Backend error:', errorData); // Debug log
          toast.error('Failed to add Unitmaster');
        }
      } catch (err) {
        console.error('Add Unitmaster error:', err); // Debug log
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
            <h5 className="mb-0">Add Unitmaster</h5>
            <button className="btn-close" onClick={onHide}></button>
          </div>
          <div className="row mb-3">
            <div className="col-md-12">
              <label className="form-label">
                Unitmaster Name <span style={{ color: 'red' }}>*</span>
              </label>
              <InputMask
                mask="aaaaa"
                value={unit_name}
                onChange={(e) => setunit_name(e.target.value.toUpperCase())}
                placeholder="Enter Market Name"
                className="form-control"

              />
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
  // EditUnitmasterModal Component
  const EditunitmasterModal: React.FC<{
    show: boolean;
    onHide: () => void;
    unitmaster: unitmasterItem | null;
    onSuccess: () => void;
    onUpdateSelectedunitmaster: (unitmaster: unitmasterItem) => void;
  }> = ({ show, onHide, unitmaster, onSuccess, onUpdateSelectedunitmaster }) => {
    const [unit_name, setunit_name] = useState('');
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      if (unitmaster) {
        setunit_name(unitmaster.unit_name);
        setStatus(String(unitmaster.status) === '0' ? 'Active' : 'Inactive');
        console.log('Edit unitmaster status:', unitmaster.status, typeof unitmaster.status); // Debug log
      }
    }, [unitmaster]);

    const handleEdit = async () => {
      if (!unit_name || !status || !unitmaster) {
        toast.error('Unitmaster Name and Status are required');
        return;
      }

      setLoading(true);
      try {
        const statusValue = status === 'Active' ? 0 : 1;
        const currentDate = new Date().toISOString(); // Timestamp: e.g., 2025-07-01T04:51:00.000Z
        const payload = {
          unit_name,
          status: statusValue,
          unitid: unitmaster.unitid,
          updated_by_id: '2', // Default to "0" (string)
          updated_date: currentDate,

        };
        console.log('Sending to backend:', payload); // Debug log
        const res = await fetch(`http://localhost:3001/api/unitmaster/${unitmaster.unitid}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          toast.success('Unitmaster updated successfully');
          const updatedUnitmaster = {
            ...unitmaster,
            unit_name,
            status: statusValue.toString(),
            updated_by_id: '2',
            updated_date: currentDate,
            unitid: unitmaster.unitid,

          };
          onUpdateSelectedunitmaster(updatedUnitmaster);
          onSuccess();
          onHide();
        } else {
          const errorData = await res.json();
          console.log('Backend error:', errorData); // Debug log
          toast.error('Failed to update Unitmaster');
        }
      } catch (err) {
        console.error('Edit Unitmaster error:', err); // Debug log
        toast.error('Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    if (!show || !unitmaster) return null;

    return (
      <div className="modal" style={{ display: show ? 'block' : 'none', background: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
        <div className="modal-content" style={{ background: 'white', padding: '20px', maxWidth: '600px', margin: '100px auto', borderRadius: '8px' }}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Edit Unitmaster</h5>
            <button className="btn-close" onClick={onHide}></button>
          </div>
          <div className="row mb-3">
            <div className="col-md-12">
              <label className="form-label">Unitmaster Name <span style={{ color: 'red' }}>*</span></label>
              <input
                type="text"
                className="form-control"
                value={unit_name}
                onChange={(e) => setunit_name(e.target.value)}
                placeholder="Enter Unitmaster Name"
              />
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
      <TitleHelmet title="Unitmaster List" />
      <Card className="m-1">
        <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
          <h4 className="mb-0">Unitmaster List</h4>
          <Button variant="success" onClick={() => setShowAddModal(true)}>
            <i className="bi bi-plus"></i> Add Unitmaster
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
      <AddunitmasterModal show={showAddModal} onHide={() => setShowAddModal(false)} onSuccess={fetchunitmaster} />
      <EditunitmasterModal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        unitmaster={selectedunitmaster}
        onSuccess={fetchunitmaster}
        onUpdateSelectedunitmaster={setSelectedunitmaster}
      />
    </>
  );
};

export default Unitmaster;