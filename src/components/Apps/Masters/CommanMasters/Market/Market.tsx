import React, { useState, useCallback, useEffect } from 'react';
import Swal from 'sweetalert2';
import { toast } from 'react-hot-toast';
import { Preloader } from '@/components/Misc/Preloader';
import { Button, Card, Stack, Table } from 'react-bootstrap';
import TitleHelmet from '@/components/Common/TitleHelmet';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table';
import MarketService from '@/common/api/markets';

// Define market data type matching API response
interface MarketItem {
  marketid: number;
  market_name: string;
  status: number;
  created_by_id?: string;
  created_date?: string;
  updated_by_id?: string;
  updated_date?: string;
}

// AddMarketModal component
const AddMarketModal: React.FC<{
  show: boolean;
  onHide: () => void;
  onAddMarket: (marketName: string, status: number) => void;
}> = ({ show, onHide, onAddMarket }) => {
  const [marketName, setMarketName] = useState<string>('');
  const [status, setStatus] = useState<number>(0);

  if (!show) return null;

  const handleAdd = () => {
    if (!marketName.trim()) {
      toast.error('Market Name is required');
      return;
    }

    onAddMarket(marketName, status);

    // Reset form
    setMarketName('');
    setStatus(0);
    onHide();
  };

  return (
    <div className="modal" style={{ display: 'block', background: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      <div className="modal-content" style={{ background: 'white', padding: '20px', maxWidth: '500px', margin: '100px auto', borderRadius: '8px' }}>
        <h3>Add New Market</h3>
        {/* Row 1: Market Name */}
        <div className="mb-3">
          <label className="form-label">Market Name</label>
          <input
            type="text"
            className="form-control"
            value={marketName}
            onChange={(e) => setMarketName(e.target.value)}
            placeholder="e.g., India"
          />
        </div>
        {/* Row 2: Status */}
        <div className="mb-3">
          <label className="form-label">Status</label>
          <select
            className="form-control"
            value={status}
            onChange={(e) => setStatus(Number(e.target.value))}
          >
            <option value={0}>Active</option>
            <option value={1}>Inactive</option>
          </select>
        </div>
        <div className="d-flex justify-content-end">
          <button className="btn btn-outline-secondary me-2" onClick={onHide}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleAdd}>
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

// EditMarketModal component
const EditMarketModal: React.FC<{
  show: boolean;
  onHide: () => void;
  market: MarketItem | null;
  onEditMarket: (id: number, marketName: string, status: number) => void;
}> = ({ show, onHide, market, onEditMarket }) => {
  const [marketName, setMarketName] = useState<string>('');
  const [status, setStatus] = useState<number>(0);

  useEffect(() => {
    if (market) {
      setMarketName(market.market_name);
      setStatus(market.status);
    }
  }, [market]);

  if (!show || !market) return null;

  const handleEdit = () => {
    if (!marketName.trim()) {
      toast.error('Market Name is required');
      return;
    }

    onEditMarket(market.marketid, marketName, status);

    onHide();
  };

  return (
    <div className="modal" style={{ display: 'block', background: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      <div className="modal-content" style={{ background: 'white', padding: '20px', maxWidth: '500px', margin: '100px auto', borderRadius: '8px' }}>
        <h3>Edit Market</h3>
        {/* Row 1: Market Name */}
        <div className="mb-3">
          <label className="form-label">Market Name</label>
          <input
            type="text"
            className="form-control"
            value={marketName}
            onChange={(e) => setMarketName(e.target.value)}
            placeholder="e.g., India"
          />
        </div>
        {/* Row 2: Status */}
        <div className="mb-3">
          <label className="form-label">Status</label>
          <select
            className="form-control"
            value={status}
            onChange={(e) => setStatus(Number(e.target.value))}
          >
            <option value={0}>Active</option>
            <option value={1}>Inactive</option>
          </select>
        </div>
        <div className="d-flex justify-content-end">
          <button className="btn btn-outline-secondary me-2" onClick={onHide}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleEdit}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

const getStatusBadge = (status: number) => {
  return status === 0 ? (
    <span className="badge bg-success">Active</span>
  ) : (
    <span className="badge bg-danger">Inactive</span>
  );
};

const MarketList: React.FC = () => {
  const [marketItems, setMarketItems] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddMarketModal, setShowAddMarketModal] = useState(false);
  const [showEditMarketModal, setShowEditMarketModal] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<MarketItem | null>(null);

  // Fetch markets from API
  const fetchMarkets = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching markets...');
      const response = await MarketService.list();
      console.log('Market response:', response);
      
      if (response.success && response.data) {
        setMarketItems(response.data);
        console.log('Markets set:', response.data);
      } else {
        console.log('Response not successful:', response);
        toast.error(response.message || 'Failed to fetch markets');
      }
    } catch (error: any) {
      console.error('Error fetching markets:', error);
      toast.error(error.message || 'Failed to fetch markets');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch markets on component mount
  useEffect(() => {
    fetchMarkets();
  }, [fetchMarkets]);

  // Define columns for react-table
  const columns = React.useMemo<ColumnDef<MarketItem>[]>(
    () => [
      {
        id: 'actions',
        header: () => <div style={{ textAlign: 'center' }}>Action</div>,
        size: 100,
        cell: ({ row }) => (
          <div className="d-flex gap-2 justify-content-center">
            <button
              className="btn btn-sm btn-success"
              style={{ padding: '4px 8px' }}
              onClick={() => handleEditMarketClick(row.original)}
            >
              <i className="fi fi-rr-edit"></i>
            </button>
            <button
              className="btn btn-sm btn-danger"
              onClick={() => handleDeleteMarket(row.original)}
              style={{ padding: '4px 8px' }}
            >
              <i className="fi fi-rr-trash"></i>
            </button>
          </div>
        ),
      },
      {
        accessorKey: 'marketid',
        header: () => <div style={{ textAlign: 'center' }}>#</div>,
        size: 50,
        cell: (info) => <div style={{ textAlign: 'center' }}>{info.getValue<number>()}</div>,
      },
      {
        accessorKey: 'market_name',
        header: () => <div style={{ textAlign: 'center' }}>Market Name</div>,
        size: 150,
        cell: (info) => <div style={{ textAlign: 'center' }}>{info.getValue<string>()}</div>,
      },
      {
        accessorKey: 'status',
        header: () => <div style={{ textAlign: 'center' }}>Status</div>,
        size: 100,
        cell: (info) => <div style={{ textAlign: 'center' }}>{getStatusBadge(info.getValue<number>())}</div>,
      },
    ],
    []
  );

  // Initialize react-table
  const table = useReactTable({
    data: marketItems,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const handleAddMarket = useCallback(async (marketName: string, status: number) => {
    try {
      const payload = {
        market_name: marketName,
        status: status,
        created_by_id: '1',
        created_date: new Date().toISOString(),
      };

      const response = await MarketService.create(payload);

      if (response.success) {
        toast.success(response.message || 'Market added successfully');
        fetchMarkets();
      } else {
        toast.error(response.message || 'Failed to add market');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to add market');
    }
  }, [fetchMarkets]);

  const handleEditMarketClick = useCallback((market: MarketItem) => {
    setSelectedMarket(market);
    setShowEditMarketModal(true);
  }, []);

  const handleEditMarket = useCallback(async (id: number, marketName: string, status: number) => {
    try {
      const payload = {
        market_name: marketName,
        status: status,
        updated_by_id: '1',
        updated_date: new Date().toISOString(),
      };

      const response = await MarketService.update(id, payload);

      if (response.success) {
        toast.success(response.message || 'Market updated successfully');
        fetchMarkets();
      } else {
        toast.error(response.message || 'Failed to update market');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update market');
    }
  }, [fetchMarkets]);

  const handleDeleteMarket = useCallback((marketItem: MarketItem) => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to recover this market!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3E97FF',
      confirmButtonText: 'Yes, delete it!',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await MarketService.remove(marketItem.marketid);
          
          if (response.success) {
            toast.success(response.message || 'Market deleted successfully');
            fetchMarkets();
          } else {
            toast.error(response.message || 'Failed to delete market');
          }
        } catch (error: any) {
          toast.error(error.message || 'Failed to delete market');
        }
      }
    });
  }, [fetchMarkets]);

  return (
    <>
      <TitleHelmet title="Market List" />
      <Card className="m-1">
        <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
          <h4 className="mb-0">Market List</h4>
          <div style={{ display: 'flex', gap: '4px' }}>
            <Button variant="success" className="me-1" onClick={() => setShowAddMarketModal(true)}>
              <i className="bi bi-plus"></i> Add Market
            </Button>
          </div>
        </div>
        <div className="p-3">
          {loading ? (
            <Stack className="align-items-center justify-content-center flex-grow-1 h-100">
              <Preloader />
            </Stack>
          ) : marketItems.length === 0 ? (
            <div className="text-center p-4">
              <p className="text-muted">No markets found. Click "Add Market" to create one.</p>
            </div>
          ) : (
            <div style={{ width: '100%', overflowX: 'auto' }}>
              <Table responsive className="mb-0" style={{ tableLayout: 'auto', width: '100%' }}>
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          colSpan={header.colSpan}
                          style={{
                            width: header.column.columnDef.size,
                            whiteSpace: 'normal',
                            padding: '8px',
                            textAlign: 'center',
                          }}
                        >
                          {header.isPlaceholder ? null : (
                            flexRender(header.column.columnDef.header, header.getContext())
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
                            textAlign: 'center',
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
          )}
        </div>
      </Card>
      <AddMarketModal
        show={showAddMarketModal}
        onHide={() => setShowAddMarketModal(false)}
        onAddMarket={handleAddMarket}
      />
      <EditMarketModal
        show={showEditMarketModal}
        onHide={() => setShowEditMarketModal(false)}
        market={selectedMarket}
        onEditMarket={handleEditMarket}
      />
    </>
  );
};

export default MarketList;
