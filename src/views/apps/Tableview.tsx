import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { useAuthContext } from '@/common';
import { useNavigate, useLocation } from 'react-router-dom';
import { Modal, Button } from 'react-bootstrap';

// Types
type TableStatus = 'blank' | 'running' | 'printed' | 'paid' | 'running-kot' | 'occupied' | 'available' | 'reserved';

interface Table {
  id: number;
  name: string;
  status: TableStatus;
  hasCustomer?: boolean;
  hasView?: boolean;
  outletid?: number;
  departmentid?: number;
  department_name?: string;
  txnId?: number | null;
  TxnNo?: string | null;
  billNo?: string | null;
  billAmount?: number | null;
  billPrintedTime?: string | null;
}

interface Department {
  departmentid: number;
  department_name: string;
}

// Table Card Component
const TableCard: React.FC<{ table: Table; onClick: () => void }> = ({ table, onClick }) => {
  const getStatusClass = (status: TableStatus): string => {
    switch (status) {
      case 'running': return 'bg-success';
      case 'printed': return 'bg-danger';
      case 'paid': return 'bg-white';
      case 'running-kot': return 'bg-warning-orange';
      case 'occupied': return 'bg-primary'; // Map 'occupied' to 'running' style
      case 'available': return 'bg-white'; // Map 'available' to 'blank' style
      case 'reserved': return 'bg-warning'; // Add handling for 'reserved' if needed
      default: return 'bg-white';
    }
  };

  return (
    <div
      className={`${getStatusClass(table.status)} cursor-pointer table-card d-flex flex-column align-items-center justify-content-center`}
      style={{
        width: '100px',
        height: '70px',
        borderRadius: '6px',
        cursor: 'pointer',
        border: '1px solid #ddd',
        padding: '2px'
      }}
      onClick={onClick}
    >
      <span className="text-dark fw-bold" style={{ fontSize: '14px', lineHeight: '1.1' }}>{table.name}</span>
      {table.status === 'printed' && table.billNo && table.billAmount && table.billPrintedTime && (
        <div className="d-flex flex-column align-items-center" style={{ fontSize: '10px', lineHeight: '1', color: 'white' }}>
          <span>{table.billNo}</span>
          <span>₹{table.billAmount}</span>
          <span>{table.billPrintedTime}</span>
        </div>
      )}
    </div>
  );
};

// Legend Component
const Legend: React.FC<{ statusCounts: { vacant: number; occupied: number; printed: number; pending: number } }> = ({ statusCounts }) => {
  const legendItems = [
    { label: 'Vacant', color: '#f0f0f0', border: true, count: statusCounts.vacant },
    { label: 'Occupied', color: '#17af68', count: statusCounts.occupied },
    { label: 'Printed', color: '#dc3545', count: statusCounts.printed },
    { label: 'Pending', color: '#fd7e14', count: statusCounts.pending },
  ];

  return (
    <div className="d-flex gap-3 flex-wrap align-items-center">
      {legendItems.map((item, idx) => (
        <div key={idx} className="d-flex align-items-center gap-2">
          <div
            style={{
              width: '16px',
              height: '16px',
              backgroundColor: item.color,
              border: item.border ? '1px solid #ddd' : 'none',
              borderRadius: '3px'
            }}
          />
          <small className="text-muted">{item.label} ({item.count})</small>
        </div>
      ))}
    </div>
  );
};

// Main App Component
export default function App() {
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | 'all'>('all');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [allTables, setAllTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tableInput, setTableInput] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [focusedButton, setFocusedButton] = useState<'yes' | 'no'>('yes');
  const yesButtonRef = useRef<HTMLButtonElement>(null);
  const noButtonRef = useRef<HTMLButtonElement>(null);
  const [takeawayOrders, setTakeawayOrders] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState<'All' | 'Pickup' | 'Delivery'>('All');
  const [statusCounts, setStatusCounts] = useState<{ vacant: number; occupied: number; printed: number; pending: number }>({
    vacant: 0,
    occupied: 0,
    printed: 0,
    pending: 0
  });
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const tableInputRef = useRef<HTMLInputElement>(null);



  useEffect(() => {
    const fetchTables = async () => {
      setLoading(true);
      try {
        if (!user || !user.hotelid) {
          setError('User not authenticated or hotel ID missing');
          setAllTables([]);
          setLoading(false);
          return;
        }
        const res = await fetch('http://localhost:3001/api/tablemanagement', {
          headers: { 'Content-Type': 'application/json' },
        });
        if (res.ok) {
          const response = await res.json();
          console.log('Raw tableItems data:', JSON.stringify(response, null, 2));
          const filteredData = response.data.filter((t: any) => t.hotelid === user.hotelid);
          if (response.success && Array.isArray(filteredData)) {
            const formattedData = await Promise.all(
              filteredData.map(async (item: any) => {
                let status = Number(item.status);

                // Fetch bill status for each table from backend
                const res = await fetch(`http://localhost:3001/api/TAxnTrnbill/bill-status/${item.tableid}`);
                const data = await res.json();

                let txnId: number | null = null;
                let billNo: string | null = null;
                let billAmount: number | null = null;
                let billPrintedTime: string | null = null;
                if (data.success && data.data) {
                  const { isBilled, isSetteled, TxnID, TxnNo, Amount, BilledDate } = data.data;
                  txnId = TxnID || null;
                  billNo = TxnNo || null;
                  billAmount = Amount || null;
                  if (BilledDate) {
                    const date = new Date(BilledDate);
                    const istDate = new Date(date.getTime() + (5.5 * 60 * 60 * 1000)); // Convert to IST
                    billPrintedTime = istDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                  }

                  if (isBilled === 1 && isSetteled !== 1) status = 2; // 🔴 red when billed but not settled
                  if (isSetteled === 1) status = 0; // ⚪ vacant when settled
                }

                let statusString: TableStatus;
                switch (status) {
                  case 0: statusString = 'available'; break;
                  case 1: statusString = 'running'; break;
                  case 2: statusString = 'printed'; break;
                  case 3: statusString = 'paid'; break;
                  case 4: statusString = 'running-kot'; break;
                  default: statusString = 'available'; break;
                }

                return { id: item.tableid, name: item.table_name, status: statusString, outletid: item.outletid, departmentid: item.departmentid, department_name: item.department_name, txnId, billNo, billAmount, billPrintedTime };
              })
            );

            setAllTables(formattedData);
            setError('');
          } else if (response.success && filteredData.length === 0) {
            setError('No tables found in TableManagement API.');
            setAllTables([]);
          } else {
            setError(response.message || 'Invalid data format received from TableManagement API.');
            setAllTables([]);
          }
        } else {
          setError(`Failed to fetch tables: ${res.status} ${res.statusText}`);
          setAllTables([]);
        }
      } catch (err) {
        console.error('Table fetch error:', err);
        setError('Failed to fetch tables. Please check the API endpoint.');
        setAllTables([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchDepartments = async () => {
      try {
        if (!user) {
          throw new Error('User not authenticated');
        }
        const response = await fetch(`http://localhost:3001/api/table-department`);

        if (!response.ok) {
          throw new Error('Failed to fetch departments');
        }
        const data = await response.json();
        setDepartments(data.data || data);
      } catch (err: any) {
        setError(err.message);
      }
    };

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      await Promise.all([fetchTables(), fetchDepartments()]);
      setLoading(false);
    };

    fetchData();

    // Add event listener for Escape key
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        navigate('/');
      }
    };

    document.addEventListener('keydown', handleEscapeKey);

    // Cleanup event listener on unmount
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [user, navigate]);

  // Focus the table input field when the component mounts
  useEffect(() => {
    if (tableInputRef.current) {
      tableInputRef.current.focus();
    }
  }, []);

  // Handle keyboard events for modal
  useEffect(() => {
    if (!showModal || !selectedTable) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        setFocusedButton('yes');
        yesButtonRef.current?.focus();
      } else if (event.key === 'ArrowRight') {
        setFocusedButton('no');
        noButtonRef.current?.focus();
      } else if (event.key === 'Enter') {
        if (focusedButton === 'yes') {
          navigate('/apps/Billview', { state: { tableId: selectedTable.id, tableName: selectedTable.name, outletId: selectedTable.outletid, openSettlement: true, txnId: selectedTable.txnId } });
        } else {
          navigate('/apps/Billview', { state: { tableId: selectedTable.id, tableName: selectedTable.name, outletId: selectedTable.outletid, txnId: selectedTable.txnId } });
        }
        setShowModal(false);
      } else if (event.key === 'n' || event.key === 'N') {
        // No action
        navigate('/apps/Billview', { state: { tableId: selectedTable.id, tableName: selectedTable.name, outletId: selectedTable.outletid, txnId: selectedTable.txnId } });
        setShowModal(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showModal, selectedTable, navigate, focusedButton]);

  // Focus the yes button when modal opens
  useEffect(() => {
    if (showModal && yesButtonRef.current) {
      yesButtonRef.current.focus();
    }
  }, [showModal]);

  // Handle Ctrl + number keys for department selection
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey) {
        const key = event.key;
        if (key === '0') {
          setSelectedDepartmentId('all');
        } else if (key >= '1' && key <= '9') {
          const index = parseInt(key) - 1;
          if (departments[index]) {
            setSelectedDepartmentId(departments[index].departmentid);
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [departments]);

  // Filter tables to only show specified statuses
  const filteredTables = allTables.filter(table =>
    table.status === 'available' || table.status === 'running' || table.status === 'printed' || table.status === 'running-kot'
  );

  // Compute status counts
  useEffect(() => {
    const counts = filteredTables.reduce((acc, table) => {
      if (table.status === 'available') acc.vacant++;
      else if (table.status === 'running') acc.occupied++;
      else if (table.status === 'printed') acc.printed++;
      else if (table.status === 'running-kot') acc.pending++;
      return acc;
    }, { vacant: 0, occupied: 0, printed: 0, pending: 0 });
    setStatusCounts(counts);
  }, [filteredTables]);

  // Group tables by their departmentid
  const tablesByDepartment = filteredTables.reduce((acc, table) => {
    if (table.departmentid) {
      if (!acc[table.departmentid]) {
        acc[table.departmentid] = [];
      }
      acc[table.departmentid].push(table);
    }
    return acc;
  }, {} as Record<number, Table[]>);

  // Filter departments to show based on dropdown selection
  const displayedDepartments = selectedDepartmentId === 'all' ? departments : departments.filter(d => d.departmentid === selectedDepartmentId);

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleTakeAwayClick = () => {
    const outletId = user?.outletid || allTables[0]?.outletid || null;
    // If 'all' departments selected, use the first department as default for takeaway
    const departmentId = selectedDepartmentId !== 'all' ? selectedDepartmentId : (departments.length > 0 ? departments[0].departmentid : null);

    navigate('/apps/Billview', {
      state: {
        mode: 'TAKEAWAY',
        orderType: 'TAKEAWAY',
        outletId,
        departmentId,
        tableId: null,
        tableName: 'TAKE AWAY'
      }
    });
  };

  const handleTableClick = (table: Table) => {
    if (table.status === 'printed') {
      setSelectedTable(table);
      setShowModal(true);
    } else {
      navigate('/apps/Billview', { state: { tableId: table.id, tableName: table.name, outletId: table.outletid, departmentId: table.departmentid } });
    }
  };

  const handleTableInputEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const input = tableInput.trim();
      if (input) {
        const tables = selectedDepartmentId === 'all' ? allTables : tablesByDepartment[selectedDepartmentId] || [];
        const table = tables.find(t => t.name === input);
        if (table) {
          if (table.status === 'printed') {
            setSelectedTable(table);
            setShowModal(true);
          } else {
            navigate('/apps/Billview', { state: { tableId: table.id, tableName: table.name, outletId: table.outletid } });
          }
        }
      }
      setTableInput('');
    }
  };

  const fetchTakeawayOrders = async () => {
    try {
      console.log('Fetching takeaway orders for outletId:', user?.outletid);
      const res = await fetch(`http://localhost:3001/api/TAxnTrnbill/pending-orders?type=takeaway&outletId=${user?.outletid}`);
      console.log('Takeaway orders response status:', res.status);
      if (res.ok) {
        const data = await res.json();
        console.log('Takeaway orders response data:', data);
        if (data.success) {
          console.log('Setting takeaway orders:', data.data);
          setTakeawayOrders(data.data || []);
        } else {
          console.error('API returned success=false:', data.message);
          setTakeawayOrders([]);
        }
      } else {
        console.error('API request failed with status:', res.status);
        setTakeawayOrders([]);
      }
    } catch (error) {
      console.error('Error fetching takeaway orders:', error);
      setTakeawayOrders([]);
    }
  };

  useEffect(() => {
    fetchTakeawayOrders();
  }, [user]);

  useEffect(() => {
    if ((location as any).state?.refreshTakeaway) {
      fetchTakeawayOrders();
    }
  }, [(location as any).state]);

  return (
    <div className="d-flex flex-column" style={{ height: '100vh', minHeight: '100vh' }}>
      <style>{`
        html, body, #root {
          height: 100vh;
          margin: 0;
          padding: 0;
          overflow: hidden;
        }
        .table-card {
          transition: all 0.2s ease;
        }
        .table-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        .bg-warning-orange {
          background-color: #fd7e14 !important;
        }
        .main-content {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }
        .cursor-pointer {
          cursor: pointer;
        }
        .full-screen-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1050;
          background: white;
          border-bottom: 1px solid #dee2e6;
        }
        .full-screen-toolbar {
          position: fixed;
          top: 60px;
          left: 0;
          right: 0;
          z-index: 1049;
          background: white;
          border-bottom: 1px solid #dee2e6;
        }
        .full-screen-content {
          position: fixed;
          top: 120px;
          left: 0;
          right: 0;
          bottom: 0;
          overflow-y: auto;
        }
        .table-grid .col {
          padding: 4px !important;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .table-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, 100px);
          gap: 10px;
          margin-bottom: 20px;
          justify-content: start;
        }
          .full-screen-toolbar input[placeholder="Table No"] {
          height: 40px;
          border: 2px solid #007bff;
          background-color: #e7f3ff;
          box-shadow: 0 0 5px rgba(0, 123, 255, 0.5);
      `}</style>

      {/* Header */}
      <div className="full-screen-header">
        <div className="container-fluid py-2 px-3">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0 fw-semibold">Table View</h5>
            <div className="d-flex gap-2">
              <button className="btn btn-outline-secondary btn-sm" onClick={handleRefresh}>
                <RefreshCw size={16} />
              </button>
              <button className="btn btn-danger btn-sm">Delivery</button>
              <button className="btn btn-danger btn-sm" onClick={handleTakeAwayClick}>Take Away</button>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="full-screen-toolbar">
        <div className="container-fluid  ">
          <div className="row align-items-center">
            <div className="col-auto">
              <div className="d-flex gap-2">
                <input
                  ref={tableInputRef}
                  type="number"
                  className="form-control form-control-sm"
                  placeholder="Table"
                  value={tableInput}
                  onChange={e => setTableInput(e.target.value)}
                  onKeyDown={handleTableInputEnter}
                  style={{ width: '130px', fontWeight: 'bold', fontSize: '25px', height: '60px' }}
                />
                <select
                  className="form-select form-select-sm"
                  value={selectedDepartmentId}
                  onChange={e => setSelectedDepartmentId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  style={{ width: '290px', fontWeight: 'bold', fontSize: '20px' }}
                >
                  <option value="all">All Departments</option>
                  {departments.map(department => (
                    <option key={department.departmentid} value={department.departmentid}>
                      {department.department_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="col d-flex justify-content-end">
              <Legend statusCounts={statusCounts} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="full-screen-content ">
        {loading ? (
          <div className="d-flex justify-content-center align-items-center h-100">Loading...</div>
        ) : error ? (
          <div className="alert alert-danger m-3">{error}</div>
        ) : (
          <div className="p-3">
            {displayedDepartments.map(department => {
              const tablesForDepartment = (tablesByDepartment[department.departmentid] || []).sort((a, b) => parseInt(a.name) - parseInt(b.name));
              return (
                <div key={department.departmentid} id={`department-section-${department.departmentid}`} className="mb-4">
                  <h6 className="fw-semibold mb-3 pb-2 border-bottom">{department.department_name}</h6>
                  {tablesForDepartment.length > 0 ? (
                    <div className="table-grid">
                      {tablesForDepartment.map((table) => (
                        <div key={table.id} id={`table-${table.id}-department-${department.departmentid}`} className="table-card-wrapper">
                          <TableCard table={table} onClick={() => handleTableClick(table)} />
                        </div>
                      ))}
                    </div>
                  ) : (<p className="text-muted">No tables found for this department.</p>)}
                </div>
              );
            })}
          </div>
        )}



        {/* Takeaway Orders Cards */}
        {takeawayOrders.length > 0 && (
          <div className="mt-3 p-3">
            {/* POS-style Header */}
          <div className="d-flex align-items-center gap-3 mb-3">
  <h6 className="mb-0 fw-semibold">Takeaway Orders</h6>

  <div className="d-flex gap-2">
    <button
      className={`btn btn-sm px-3 d-flex align-items-center gap-1
        ${activeFilter === 'All'
          ? 'btn-primary'
          : 'btn-outline-secondary text-primary'}`}
      onClick={() => setActiveFilter('All')}
    >
      <i className="fi fi-rr-list"></i>
    </button>

    <button
      className={`btn btn-sm px-3 d-flex align-items-center gap-1
        ${activeFilter === 'Pickup'
          ? 'btn-primary'
          : 'btn-outline-secondary text-muted'}`}
      onClick={() => setActiveFilter('Pickup')}
    >
      <i className="fi fi-rr-shopping-bag"></i>
      Pickup
    </button>

    <button
      className={`btn btn-sm px-3 d-flex align-items-center gap-1
        ${activeFilter === 'Delivery'
          ? 'btn-primary'
          : 'btn-outline-secondary text-muted'}`}
      onClick={() => setActiveFilter('Delivery')}
    >
      <i className="fi fi-rr-truck-moving"></i>
      Delivery
    </button>
  </div>
</div>

            <div className="d-flex gap-2 flex-wrap">
              {takeawayOrders
                .filter(order => {
                  const orderType = order.type === 'Pickup' ? 'Pickup' : order.type === 'Delivery' ? 'Delivery' : 'TAKEAWAY';
                  return activeFilter === 'All' || orderType === activeFilter;
                })
                .map(order => {
                  // Calculate KOT number from order details
                  const kotNumbers = order.details ? order.details.map((item: any) => parseInt(item.KOTNo || item.kotNo || 0)).filter((k: number) => k > 0) : [];
                  const maxKot = kotNumbers.length > 0 ? Math.max(...kotNumbers) : null;

                  // Determine order type for icon and navigation
                  const orderType = order.type === 'Pickup' ? 'Pickup' : order.type === 'Delivery' ? 'Delivery' : 'TAKEAWAY';

                  const bgStyle =
                    orderType === 'Pickup'
                      ? { backgroundColor: '#E7F1FF', border: '1px solid #B6D4FE' }
                      : { backgroundColor: '#FFF3CD', border: '1px solid #FFECB5' };

                  return (
                    <div
                      key={order.id}
                      className="card p-2 shadow-sm"
                      style={{ width: 140, cursor: 'pointer' }}
                      onClick={() =>
                        navigate('/apps/Billview', {
                          state: {
                            mode: 'TAKEAWAY',
                            orderType: orderType,
                            orderId: order.id,
                            txnId: order.id,
                            outletId: order.outletid,
                            departmentId: selectedDepartmentId !== 'all' ? selectedDepartmentId : null,
                            tableId: null,
                            tableName: 'TAKE AWAY'
                          }
                        })
                      }
                    >
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        {/* Order No - Left */}
                        <div className="fw-bold text-danger">
                          {order.orderNo}
                        </div>

                        {/* Order Type Icon - Right in Rectangle */}
                        {(orderType === 'Pickup' || orderType === 'Delivery') && (
                          <div
                            className="d-flex align-items-center justify-content-center rounded"
                            style={{
                              ...bgStyle,
                              width: '30px',
                              height: '26px',
                            }}
                            title={orderType}
                          >
                            {orderType === 'Pickup' && (
                              <i className="fi fi-rr-shopping-bag text-primary fs-6"></i>
                            )}
                            {orderType === 'Delivery' && (
                              <i className="fi fi-rr-truck-moving text-warning fs-6"></i>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="small text-muted">
                        {order.customer?.name || 'N/A'}
                      </div>
                      <div className="fw-semibold">
                        ₹{order.total}
                      </div>
                      {maxKot && (
                        <div className="small text-primary">
                          KOT: {maxKot}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="sm">
        <Modal.Header closeButton>
          <Modal.Title>Next Process</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mt-2">
            Select <strong>Yes</strong> Do you want to open the bill for settlement.
            <br />
            Select <strong>No</strong> Do you want to Modify the bill.
          </p>
        </Modal.Body>
        <Modal.Footer>

          <Button ref={yesButtonRef} variant="primary" onClick={() => {
            if (selectedTable) {
              navigate('/apps/Billview', { state: { tableId: selectedTable.id, tableName: selectedTable.name, outletId: selectedTable.outletid, departmentId: selectedTable.departmentid, openSettlement: true, txnId: selectedTable.txnId } });
            }
            setShowModal(false);
          }}>
            Yes -
          </Button>
          <Button ref={noButtonRef} variant="secondary" onClick={() => {
            if (selectedTable) {
              navigate('/apps/Billview', { state: { tableId: selectedTable.id, tableName: selectedTable.name, outletId: selectedTable.outletid, departmentId: selectedTable.departmentid, txnId: selectedTable.txnId } });
            }
            setShowModal(false);
          }}>
            No
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
