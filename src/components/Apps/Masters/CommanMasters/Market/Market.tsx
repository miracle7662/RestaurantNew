import React, { useState, useCallback, useEffect } from 'react';
import Swal from 'sweetalert2';
import { toast } from 'react-hot-toast';
import { Preloader } from '@/components/Misc/Preloader';
import { Button, Card, Stack, Table } from 'react-bootstrap';
import TitleHelmet from '@/components/Common/TitleHelmet';
import MarketService, { Market } from '@/common/api/markets';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table';

// Define market data type (matching API response)
interface MarketItem {
  id: string;
  marketId: string;
  marketName: string;
}

// Initial empty array - data will be fetched from API
const initialMarketItems: MarketItem[] = [];

// Combined MarketModal component for Add and Edit
type ModalMode = 'add' | 'edit';

interface MarketModalProps {
  show: boolean;
  onHide: () => void;
  mode: ModalMode;
  market: MarketItem | null;
  onSave: (id: string | null, marketData: Omit<MarketItem, 'id'>) => void;
}

const MarketModal: React.FC<MarketModalProps> = ({ show, onHide, mode, market, onSave }) => {
  const [marketId, setMarketId] = useState<string>('');
  const [marketName, setMarketName] = useState<string>('');

  useEffect(() => {
    if (mode === 'edit' && market) {
      setMarketId(market.marketId);
      setMarketName(market.marketName);
    } else if (mode === 'add') {
      // Reset form for add mode
      setMarketId('');
      setMarketName('');
    }
  }, [mode, market, show]);

  if (!show) return null;

  const handleSave = () => {
    if (!marketId.trim() || !marketName.trim()) {
      toast.error('Market ID and Market Name are required');
      return;
    }

    if (mode === 'edit' && market) {
      onSave(market.id, { marketId, marketName });
    } else {
      onSave(null, { marketId, marketName });
    }

    // Reset form
    setMarketId('');
    setMarketName('');
    onHide();
  };

  return (
    <div className="modal" style={{ display: 'block', background: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      <div className="modal-content" style={{ background: 'white', padding: '20px', maxWidth: '500px', margin: '100px auto', borderRadius: '8px' }}>
        <h3>{mode === 'add' ? 'Add New Market' : 'Edit Market'}</h3>
        {/* Row 1: Market ID */}
        <div className="mb-3">
          <label className="form-label">Market ID</label>
          <input
            type="text"
            className="form-control"
            value={marketId}
            onChange={(e) => setMarketId(e.target.value)}
            placeholder="e.g., 66922908"
          />
        </div>
        {/* Row 2: Market Name */}
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
        <div className="d-flex justify-content-end">
          <button className="btn btn-outline-secondary me-2" onClick={onHide}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            {mode === 'add' ? 'Add' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

const MarketList: React.FC = () => {
  const [marketItems, setMarketItems] = useState<MarketItem[]>(initialMarketItems);
  const [loading, setLoading] = useState<boolean>(false);
  const [marketModalState, setMarketModalState] = useState<{ show: boolean; mode: 'add' | 'edit'; market: MarketItem | null }>({
    show: false,
    mode: 'add',
    market: null,
  });

  // Fetch markets from API on component mount
  useEffect(() => {
    const fetchMarkets = async () => {
      setLoading(true);
      try {
        const response = await MarketService.list();
        const marketsData = response.data
        
        if (Array.isArray(marketsData)) {
          // Map API response to component interface
          const mappedMarkets: MarketItem[] = marketsData.map((market: Market) => ({
            id: market.marketid?.toString() || '',
            marketId: market.marketid?.toString() || '',
            marketName: market.market_name || '',
          }));
          setMarketItems(mappedMarkets);
        }
      } catch (error) {
        console.error('Failed to fetch markets:', error);
        toast.error('Failed to load markets');
      } finally {
        setLoading(false);
      }
    };
    fetchMarkets();
  }, []);

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
        accessorKey: 'id',
        header: () => <div style={{ textAlign: 'center' }}>#</div>,
        size: 50,
        cell: (info) => <div style={{ textAlign: 'center' }}>{info.getValue<string>()}</div>,
      },
      {
        accessorKey: 'marketId',
        header: () => <div style={{ textAlign: 'center' }}>Market Id</div>,
        size: 150,
        cell: (info) => <div style={{ textAlign: 'center' }}>{info.getValue<string>()}</div>,
      },
      {
        accessorKey: 'marketName',
        header: () => <div style={{ textAlign: 'center' }}>Market Name</div>,
        size: 150,
        cell: (info) => <div style={{ textAlign: 'center' }}>{info.getValue<string>()}</div>,
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

  // Handle save market - API call
  const handleSaveMarket = useCallback(async (id: string | null, marketData: Omit<MarketItem, 'id'>) => {
    try {
      if (id) {
        // Edit mode - update existing market via API
        await MarketService.update(parseInt(id), {
          market_name: marketData.marketName,
          status: 1,
        });
        
        // Update local state
        setMarketItems(prev => prev.map(item => 
          item.id === id 
            ? { ...item, marketId: marketData.marketId, marketName: marketData.marketName }
            : item
        ));
        toast.success('Market updated successfully');
      } else {
        // Add mode - create new market via API
        const response = await MarketService.create({
          market_name: marketData.marketName,
          status: 1,
        });
        
        const newMarket: MarketItem = {
          id: response.data?.marketid?.toString() || Date.now().toString(),
          marketId: response.data?.marketid?.toString() || '',
          marketName: marketData.marketName,
        };
        
        setMarketItems(prev => [...prev, newMarket]);
        toast.success('Market added successfully');
      }
    } catch (error) {
      console.error('Failed to save market:', error);
      toast.error('Failed to save market');
    }
  }, []);

  const handleEditMarketClick = useCallback((market: MarketItem) => {
    setMarketModalState({ show: true, mode: 'edit', market });
  }, []);

  // Handle delete market - API call
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
        setLoading(true);
        try {
          await MarketService.remove(parseInt(marketItem.id));
          
          // Update local state
          const updatedMarkets = marketItems.filter((item) => item.id !== marketItem.id);
          setMarketItems(updatedMarkets);
          
          if (marketModalState.market?.id === marketItem.id) {
            setMarketModalState({ show: false, mode: 'add', market: null });
          }
          
          toast.success('Market deleted successfully');
        } catch (error) {
          console.error('Failed to delete market:', error);
          toast.error('Failed to delete market');
        } finally {
          setLoading(false);
        }
      }
    });
  }, [marketItems, marketModalState]);

  return (
    <>
      <TitleHelmet title="Market List" />
      <Card className="m-1">
        <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
          <h4 className="mb-0">Market List</h4>
          <div style={{ display: 'flex', gap: '4px' }}>
            <Button variant="success" className="me-1" onClick={() => setMarketModalState({ show: true, mode: 'add', market: null })}>
              <i className="bi bi-plus"></i> Add Market
            </Button>
          </div>
        </div>
        <div className="p-3">
          {loading ? (
            <Stack className="align-items-center justify-content-center flex-grow-1 h-100">
              <Preloader />
            </Stack>
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
      <MarketModal
        show={marketModalState.show}
        onHide={() => setMarketModalState({ show: false, mode: 'add', market: null })}
        mode={marketModalState.mode}
        market={marketModalState.market}
        onSave={handleSaveMarket}
      />
    </>
  );
};

export default MarketList;
