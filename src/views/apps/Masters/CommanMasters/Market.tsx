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

interface MarketItem {
  market_name: string;
  marketid: string;
  status: string;
  created_by_id: string;
  created_date: string;
  updated_by_id: string;
  updated_date: string;
}

interface AddMarketModalProps {
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
const Market: React.FC = () => {
  const [marketItems, setMarketItems] = useState<MarketItem[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredMarkets, setFilteredMarkets] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<MarketItem | null>(null);

  const fetchMarkets = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:3001/api/markets');
      const data = await res.json();
      console.log('Fetched markets:', data); // Debug log to inspect backend data
      setMarketItems(data);
      setFilteredMarkets(data);
    } catch (err) {
      toast.error('Failed to fetch Markets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarkets();
  }, []);

  const columns = useMemo<ColumnDef<MarketItem>[]>(
    () => [
      {
        id: 'srNo',
        header: 'Sr No',
        size: 50,
        cell: ({ row }) => <div style={{ textAlign: 'center' }}>{row.index + 1}</div>,
      },
      {
        accessorKey: 'market_name',
        header: 'Market Name',
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
              title="Edit Market"
            >
              <i className="fi fi-rr-edit"></i>
            </button>
            <button
              className="btn btn-sm btn-danger"
              onClick={() => handleDeleteMarket(row.original)}
              title="Delete Market"
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
    data: filteredMarkets,
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
      const filteredMarketsBySearch = marketItems.filter((item) =>
        item.market_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMarkets(filteredMarketsBySearch);
    }, 300),
    [marketItems]
  );

  const handleEditClick = (mstmarkets: MarketItem) => {
    setSelectedMarket(mstmarkets);
    setShowEditModal(true);
  };

  const handleDeleteMarket = async (mstmarkets: MarketItem) => {
    const res = await Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to recover this mstmarkets!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3E97FF',
      confirmButtonText: 'Yes, delete it!',
    });
    if (res.isConfirmed) {
      try {
        await fetch(`http://localhost:3001/api/markets/${mstmarkets.marketid}`, { method: 'DELETE' });
        toast.success('Deleted successfully');
        fetchMarkets();
        setSelectedMarket(null);
      } catch {
        toast.error('Failed to delete');
      }
    }
  };

  //2
  // AddMarketModal Component
  const AddMarketModal: React.FC<AddMarketModalProps> = ({ show, onHide, onSuccess }) => {
    const [market_name, setMarketName] = useState('');
    const [status, setStatus] = useState('Active'); // Default to 'Active'
    const [loading, setLoading] = useState(false);

    const handleAdd = async () => {
      if (!market_name || !status) {
        toast.error('Market Name and Status are required');
        return;
      }

      setLoading(true);
      try {
        const statusValue = status === 'Active' ? 0 : 1;
        const currentDate = new Date().toISOString(); // Timestamp: e.g., 2025-07-01T04:00:00.000Z
        const payload = {
          market_name,
          status: statusValue,

          created_by_id: 1, // Default to null (or 0 if backend requires)
          created_date: currentDate,
        };
        console.log('Sending to backend:', payload); // Debug log
        const res = await fetch('http://localhost:3001/api/markets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          toast.success('Market added successfully');
          setMarketName('');
          setStatus('Active'); // Reset to 'Active' after successful add
          onSuccess();
          onHide();
        } else {
          const errorData = await res.json();
          console.log('Backend error:', errorData); // Debug log
          toast.error('Failed to add mstmarkets');
        }
      } catch (err) {
        console.error('Add mstmarkets error:', err); // Debug log
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
            <h5 className="mb-0">Add Market</h5>
            <button className="btn-close" onClick={onHide}></button>
          </div>
          <div className="row mb-3">
            <div className="col-md-12">
              <label className="form-label">Market Name <span style={{ color: 'red' }}>*</span></label>
              <input type="text" className="form-control" value={market_name} onChange={(e) => setMarketName(e.target.value)} placeholder="Enter Market Name" />
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
  // EditMarketModal Component
  const EditMarketModal: React.FC<{
    show: boolean;
    onHide: () => void;
    mstmarkets: MarketItem | null;
    onSuccess: () => void;
    onUpdateSelectedMarket: (mstmarkets: MarketItem) => void;
  }> = ({ show, onHide, mstmarkets, onSuccess, onUpdateSelectedMarket }) => {
    const [market_name, setMarketName] = useState('');
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      if (mstmarkets) {
        setMarketName(mstmarkets.market_name);
        setStatus(String(mstmarkets.status) === '0' ? 'Active' : 'Inactive');
        console.log('Edit mstmarkets status:', mstmarkets.status, typeof mstmarkets.status); // Debug log
      }
    }, [mstmarkets]);

    const handleEdit = async () => {
      if (!market_name || !status || !mstmarkets) {
        toast.error('Market Name and Status are required');
        return;
      }

      setLoading(true);
      try {
        const statusValue = status === 'Active' ? 0 : 1;
      const currentDate = new Date().toISOString(); // Timestamp: e.g., 2025-07-01T04:51:00.000Z
      const payload = {
        market_name,
        status: statusValue,
        marketid: mstmarkets.marketid,
        updated_by_id: '2', // Default to "0" (string)
        updated_date: currentDate,
       
      };
      console.log('Sending to backend:', payload); // Debug log
      const res = await fetch(`http://localhost:3001/api/markets/${mstmarkets.marketid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        });
        if (res.ok) {
          toast.success('Market updated successfully');
          onSuccess();
          const updatedMarket = { ...mstmarkets, market_name, status: statusValue.toString() };
          onUpdateSelectedMarket(updatedMarket);
          onHide();
        } else {
          const errorData = await res.json();
          console.log('Backend error:', errorData); // Debug log
          toast.error('Failed to update mstmarkets');
        }
      } catch (err) {
        console.error('Edit mstmarkets error:', err); // Debug log
        toast.error('Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    if (!show || !mstmarkets) return null;

    return (
      <div className="modal" style={{ display: show ? 'block' : 'none', background: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
        <div className="modal-content" style={{ background: 'white', padding: '20px', maxWidth: '600px', margin: '100px auto', borderRadius: '8px' }}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Edit Market</h5>
            <button className="btn-close" onClick={onHide}></button>
          </div>
          <div className="row mb-3">
            <div className="col-md-12">
              <label className="form-label">Market Name <span style={{ color: 'red' }}>*</span></label>
              <input type="text" className="form-control" value={market_name} onChange={(e) => setMarketName(e.target.value)} placeholder="Enter Market Name" />
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
      <TitleHelmet title="Market List" />
      <Card className="m-1">
        <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
          <h4 className="mb-0">Market List</h4>
          <Button variant="success" onClick={() => setShowAddModal(true)}>
            <i className="bi bi-plus"></i> Add Market
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
      <AddMarketModal show={showAddModal} onHide={() => setShowAddModal(false)} onSuccess={fetchMarkets} />
      <EditMarketModal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        mstmarkets={selectedMarket}
        onSuccess={fetchMarkets}
        onUpdateSelectedMarket={setSelectedMarket}
      />
    </>
  );
};

export default Market;