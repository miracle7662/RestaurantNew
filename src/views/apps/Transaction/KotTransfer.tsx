import  { useState, useEffect } from "react";
import { Card, Row, Col, Form, Button, Table, Badge, Alert, Modal } from "react-bootstrap";
import { fetchOutletsForDropdown } from "@/utils/commonfunction";
import { getUnbilledItemsByTable } from "@/common/api/orders";
import { OutletData } from "@/common/api/outlet";
import { useAuthContext } from "@/common";

interface KotTransferProps {
  onCancel?: () => void;
}

const KotTransfer = ({ onCancel }: KotTransferProps) => {
  const { user } = useAuthContext();

  interface Item {
    id: number;
    media: string;
    kot: number;
    item: string;
    qty: number;
    price: number;
    selected?: boolean;
  }

  interface TableData {
    id: string;
    name: string;
    status: 'occupied' | 'available' | 'reserved';
    outlet: string;
    pax?: number;
  }

  const [, setLoading] = useState(true);
  const [outlets, setOutlets] = useState<OutletData[]>([]);
  const [tables, setTables] = useState<TableData[]>([]);
  const [selectedItems, setSelectedItems] = useState<Item[]>([]);
  const [proposedItems, setProposedItems] = useState<Item[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [proposedTableId, setProposedTableId] = useState<number | null>(null);
  const [selectedTable, setSelectedTable] = useState('');
  const [selectedOutlet, setSelectedOutlet] = useState('');
  const [proposedTable, setProposedTable] = useState('');
  const [, setProposedOutlet] = useState('');
  const [transferType, setTransferType] = useState<"table" | "kot">("table");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [currentDate] = useState(new Date().toLocaleDateString('en-GB'));

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!user) return;

      try {
        const [outletsData, tablesResponse] = await Promise.all([
          new Promise<OutletData[]>((resolve) => {
            fetchOutletsForDropdown(user, resolve, () => {});
          }),
          fetch('http://localhost:3001/api/outlets/tables/all')
        ]);

        setOutlets(outletsData);
        const tablesData = await tablesResponse.json();

        const mappedTables: TableData[] = tablesData.map((table: any) => ({
          id: table.tableid.toString(),
          name: table.table_name,
          status: table.status,
          outlet: table.outlet_name || 'Unknown',
          pax: table.pax || 0
        }));
        setTables(mappedTables);

        if (mappedTables.length > 0) {
          const defaultTable = mappedTables.find(t => t.status === 'occupied') || mappedTables[0];
          setSelectedTableId(Number(defaultTable.id));
          setSelectedTable(defaultTable.name);
          setSelectedOutlet(defaultTable.outlet);
          await fetchItemsForTable(Number(defaultTable.id), 'selected');
        }

        const availableTable = mappedTables.find(t => t.status === 'available');
        if (availableTable) {
          setProposedTableId(Number(availableTable.id));
          setProposedTable(availableTable.name);
          setProposedOutlet(availableTable.outlet);
          await fetchItemsForTable(Number(availableTable.id), 'proposed');
        }

      } catch (error) {
        console.error('Error fetching initial data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [user]);

  const fetchItemsForTable = async (tableId: number, type: 'selected' | 'proposed') => {
    try {
      const response = await getUnbilledItemsByTable(tableId);
      const mappedItems: Item[] = response.data.items.map((item: any, index: number) => ({
        id: item.id || index,
        media: item.tableName || 'Unknown',
        kot: item.kotNo || 0,
        item: item.itemName,
        qty: item.netQty,
        price: item.price,
        selected: false
      }));

      if (type === 'selected') {
        setSelectedItems(mappedItems);
      } else {
        setProposedItems(mappedItems);
      }
    } catch (error) {
      console.error(`Error fetching items for table ${tableId}:`, error);
    }
  };

  const sourceTable = tables.find(t => t.id === selectedTableId?.toString());
  const sourcePax = sourceTable?.pax || 0;
  const sourceKOT = selectedItems.length > 0 ? selectedItems[0].kot : 0;
  const sourceStatus = sourceTable?.status || "available";

  const totalSelectedAmount = selectedItems
    .filter(item => item.selected)
    .reduce((sum, item) => sum + (item.price * item.qty), 0);

  const totalProposedAmount = proposedItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const variance = totalProposedAmount - totalSelectedAmount;
  const change = Math.abs(variance);

  const selectedCount = selectedItems.filter(item => item.selected).length;
  const totalItemsCount = selectedItems.length;
  const isTableMode = transferType === "table";
  const effectiveSelectedCount = isTableMode ? totalItemsCount : selectedCount;
  const effectiveSelectedAmount = isTableMode ? selectedItems.reduce((sum, item) => sum + (item.price * item.qty), 0) : totalSelectedAmount;

  const handleCheck = (index: number) => {
    if (isTableMode) return;
    const updated = [...selectedItems];
    updated[index].selected = !updated[index].selected;
    setSelectedItems(updated);
  };

  const handleTransferTypeChange = (type: "table" | "kot") => {
    setTransferType(type);
    if (type === "table") {
      const updated = selectedItems.map(item => ({ ...item, selected: true }));
      setSelectedItems(updated);
    }
  };

  const handleSelectedTableChange = async (tableId: string) => {
    const numericTableId = Number(tableId);
    setSelectedTableId(numericTableId);
    const srcTable = tables.find(t => t.id === tableId);
    setSelectedTable(srcTable?.name || '');
    setSelectedOutlet(srcTable?.outlet || '');
    await fetchItemsForTable(numericTableId, 'selected');
  };

  const handleProposedTableChange = async (tableId: string) => {
    const numericTableId = Number(tableId);
    setProposedTableId(numericTableId);

    const destTable = tables.find(t => t.id === tableId);
    setProposedTable(destTable?.name || '');
    setProposedOutlet(destTable?.outlet || '');
    await fetchItemsForTable(numericTableId, 'proposed');
  };

  const handleTransfer = () => {
    if (!isTableMode && effectiveSelectedCount === 0) {
      alert("Please select at least one item to transfer!");
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmTransfer = () => {
    let itemsToTransfer: Item[];
    if (isTableMode) {
      itemsToTransfer = selectedItems.map(item => ({ ...item, selected: false, media: proposedTable }));
      setSelectedItems([]);
    } else {
      itemsToTransfer = selectedItems.filter(item => item.selected).map(item => ({ ...item, selected: false, media: proposedTable }));
      const remainingItems = selectedItems.filter(item => !item.selected);
      setSelectedItems(remainingItems);
    }
    
    if (isTableMode) {
      setProposedItems(itemsToTransfer);
    } else {
      setProposedItems([...proposedItems, ...itemsToTransfer]);
    }
    
    setTables(prevTables =>
      prevTables.map(t => {
        if (t.id === selectedTableId?.toString() && selectedItems.length === 0) {
          return { ...t, status: "available" as const };
        }
        if (t.id === proposedTableId?.toString()) {
          return { ...t, status: "occupied" as const };
        }
        return t;
      })
    );
    
    setShowConfirmModal(false);
    alert(`Successfully transferred ${itemsToTransfer.length} item${itemsToTransfer.length !== 1 ? 's' : ''} to Table ${proposedTable}`);
  };

  const getTableStatusBadge = (status: string) => {
    const variants = {
      occupied: "danger",
      available: "success",
      reserved: "warning"
    } as const;
    const variant = variants[status as keyof typeof variants];
    return <Badge bg={variant} className="ms-2">{status.toUpperCase()}</Badge>;
  };

  const destTable = tables.find(t => t.id === proposedTableId?.toString());
  const destPax = destTable?.pax || 0;
  const destStatus = destTable?.status || "available";
  const destKOT = proposedItems.length > 0 ? proposedItems[0].kot : 0;

  return (
    <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', minHeight: '100vh', padding: '20px' }}>
      <Card className="border-0 shadow-lg" style={{ maxWidth: "1400px", margin: '0 auto', borderRadius: '16px' }}>
        <Card.Body className="p-4">
          {/* Header */}
          <div className="text-center mb-4">
            <h2 className="fw-bold mb-3" style={{ color: '#667eea', fontSize: '2rem' }}>
              {transferType === "table" ? "🔄 Transfer Table" : "📋 Transfer KOT"}
            </h2>
            <div className="d-flex justify-content-center gap-3 mb-3">
              <Button 
                variant={transferType === "table" ? "primary" : "outline-primary"} 
                onClick={() => handleTransferTypeChange("table")}
                style={{ 
                  borderRadius: '25px', 
                  padding: '10px 30px',
                  fontWeight: 600,
                  boxShadow: transferType === "table" ? '0 4px 15px rgba(102, 126, 234, 0.4)' : 'none'
                }}
              >
                Table Transfer
              </Button>
              <Button 
                variant={transferType === "kot" ? "primary" : "outline-primary"}
                onClick={() => handleTransferTypeChange("kot")}
                style={{ 
                  borderRadius: '25px', 
                  padding: '10px 30px',
                  fontWeight: 600,
                  boxShadow: transferType === "kot" ? '0 4px 15px rgba(102, 126, 234, 0.4)' : 'none'
                }}
              >
                KOT Transfer
              </Button>
            </div>
            <Badge bg="info" style={{ fontSize: '1rem', padding: '10px 25px', borderRadius: '20px' }}>
              {effectiveSelectedCount} Items Selected
            </Badge>
          </div>

          {/* Content Section */}
          <Row className="g-4">
            {/* Source Table */}
            <Col md={5}>
              <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '12px', background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' }}>
                <Card.Header className="border-0 bg-transparent">
                  <h5 className="fw-bold text-center mb-0" style={{ color: '#d63031' }}>📤 From Table</h5>
                </Card.Header>
                <Card.Body className="p-3">
                  <Row className="g-2 mb-3">
                    <Col xs={6}>
                      <Form.Label className="fw-semibold small">Table</Form.Label>
                      <Form.Select
                        value={selectedTableId || ''}
                        onChange={(e) => handleSelectedTableChange(e.target.value)}
                        style={{ borderRadius: '8px' }}
                      >
                        {tables.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </Form.Select>
                    </Col>
                    <Col xs={6}>
                      <Form.Label className="fw-semibold small">Outlet</Form.Label>
                      <Form.Select value={selectedOutlet} onChange={(e) => setSelectedOutlet(e.target.value)} style={{ borderRadius: '8px' }}>
                        {outlets.map(outlet => (
                          <option key={outlet.outletid} value={outlet.outlet_name}>{outlet.outlet_name}</option>
                        ))}
                      </Form.Select>
                    </Col>
                    <Col xs={4}>
                      <Form.Label className="fw-semibold small">KOT</Form.Label>
                      <Form.Control value={sourceKOT} readOnly style={{ borderRadius: '8px', background: 'white' }} />
                    </Col>
                    <Col xs={4}>
                      <Form.Label className="fw-semibold small">Pax</Form.Label>
                      <Form.Control value={sourcePax} readOnly style={{ borderRadius: '8px', background: 'white' }} />
                    </Col>
                    <Col xs={4}>
                      <Form.Label className="fw-semibold small">Date</Form.Label>
                      <Form.Control value={currentDate} readOnly style={{ borderRadius: '8px', background: 'white' }} />
                    </Col>
                  </Row>

                  {!isTableMode ? (
                    <div style={{ maxHeight: "280px", overflowY: "auto", borderRadius: "12px", background: 'white', padding: '10px' }}>
                      <Table hover size="sm" className="mb-0">
                        <thead style={{ position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1 }}>
                          <tr>
                            <th style={{ width: "40px" }}></th>
                            <th>Item</th>
                            <th>Qty</th>
                            <th>Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedItems.map((row, i) => (
                            <tr
                              key={row.id}
                              className={row.selected ? "table-primary" : ""}
                              style={{ cursor: "pointer" }}
                              onClick={() => handleCheck(i)}
                            >
                              <td className="text-center">
                                <Form.Check
                                  type="checkbox"
                                  checked={row.selected}
                                  onChange={() => handleCheck(i)}
                                />
                              </td>
                              <td>{row.item}</td>
                              <td>{row.qty}</td>
                              <td>₹{row.price?.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  ) : (
                    <Alert variant="light" className="text-center" style={{ borderRadius: '12px', border: '2px dashed #d63031' }}>
                      <h6 className="fw-bold mb-2">Complete Table Transfer</h6>
                      <p className="mb-0">All {totalItemsCount} items from KOT {sourceKOT}</p>
                    </Alert>
                  )}

                  <div className="mt-3 p-3 text-center" style={{ background: 'white', borderRadius: '12px' }}>
                    <div className="fw-bold text-danger" style={{ fontSize: '1.5rem' }}>₹{effectiveSelectedAmount.toFixed(2)}</div>
                    <small className="text-muted">Total Amount</small>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            {/* Transfer Buttons */}
            <Col md={2} className="d-flex flex-column justify-content-center align-items-center">
              <Button 
                size="lg"
                onClick={handleTransfer}
                disabled={!isTableMode && selectedCount === 0}
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  fontSize: "2rem",
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: "none",
                  boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)',
                  marginBottom: '20px'
                }}
              >
                →
              </Button>
              <small className="text-muted">F7</small>
              
              <div style={{ height: '30px' }}></div>
              
              <Button 
                size="lg"
                variant="success"
                disabled={proposedItems.length === 0}
                onClick={() => {
                  setSelectedItems([...selectedItems, ...proposedItems]);
                  setProposedItems([]);
                }}
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  fontSize: "2rem",
                  background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                  border: "none",
                  boxShadow: '0 8px 25px rgba(40, 167, 69, 0.4)'
                }}
              >
                ←
              </Button>
              <small className="text-muted">F8</small>
            </Col>

            {/* Destination Table */}
            <Col md={5}>
              <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '12px', background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' }}>
                <Card.Header className="border-0 bg-transparent">
                  <h5 className="fw-bold text-center mb-0" style={{ color: '#00b894' }}>📥 To Table</h5>
                </Card.Header>
                <Card.Body className="p-3">
                  <Row className="g-2 mb-3">
                    <Col xs={6}>
                      <Form.Label className="fw-semibold small">Outlet</Form.Label>
                      <Form.Select value={selectedOutlet} onChange={(e) => setSelectedOutlet(e.target.value)} style={{ borderRadius: '8px' }}>
                        {outlets.map(outlet => (
                          <option key={outlet.outletid} value={outlet.outlet_name}>{outlet.outlet_name}</option>
                        ))}
                      </Form.Select>
                    </Col>
                    <Col xs={6}>
                      <Form.Label className="fw-semibold small d-flex align-items-center">
                        Table
                        {destStatus && getTableStatusBadge(destStatus)}
                      </Form.Label>
                      <Form.Select
                        value={proposedTableId || ''}
                        onChange={(e) => handleProposedTableChange(e.target.value)}
                        style={{ borderRadius: '8px' }}
                      >
                        {tables.filter(t => t.id !== selectedTableId?.toString()).map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </Form.Select>
                    </Col>
                    <Col xs={4}>
                      <Form.Label className="fw-semibold small">Date</Form.Label>
                      <Form.Control value={currentDate} readOnly style={{ borderRadius: '8px', background: 'white' }} />
                    </Col>
                    <Col xs={4}>
                      <Form.Label className="fw-semibold small">Pax</Form.Label>
                      <Form.Control value={destPax} readOnly style={{ borderRadius: '8px', background: 'white' }} />
                    </Col>
                    <Col xs={4}>
                      <Form.Label className="fw-semibold small">KOT</Form.Label>
                      <Form.Control value={destKOT} readOnly style={{ borderRadius: '8px', background: 'white' }} />
                    </Col>
                  </Row>

                  <div style={{ maxHeight: "280px", overflowY: "auto", borderRadius: "12px", background: 'white', padding: '10px' }}>
                    <Table hover size="sm" className="mb-0">
                      <thead style={{ position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1 }}>
                        <tr>
                          <th>Item</th>
                          <th>Qty</th>
                          <th>Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {proposedItems.length > 0 ? proposedItems.map((row) => (
                          <tr key={row.id}>
                            <td>{row.item}</td>
                            <td>{row.qty}</td>
                            <td>₹{row.price?.toFixed(2)}</td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={3} className="text-center text-muted py-5">No items transferred yet</td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </div>

                  <div className="mt-3 p-3 text-center" style={{ background: 'white', borderRadius: '12px' }}>
                    <div className="fw-bold text-success" style={{ fontSize: '1.5rem' }}>₹{totalProposedAmount.toFixed(2)}</div>
                    <small className="text-muted">Total Amount</small>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Action Buttons */}
          <div className="d-flex justify-content-center gap-3 mt-4">
            <Button 
              variant="success" 
              size="lg" 
              style={{ 
                borderRadius: '25px', 
                padding: '12px 40px',
                fontWeight: 'bold',
                boxShadow: '0 6px 20px rgba(40, 167, 69, 0.3)'
              }}
            >
              💾 Save (F9)
            </Button>
            <Button 
              variant="danger" 
              size="lg" 
              onClick={onCancel}
              style={{ 
                borderRadius: '25px', 
                padding: '12px 40px',
                fontWeight: 'bold',
                boxShadow: '0 6px 20px rgba(220, 53, 69, 0.3)'
              }}
            >
              ✖ Cancel (Esc)
            </Button>
          </div>
        </Card.Body>
      </Card>

      {/* Confirmation Modal */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered>
        <Modal.Header closeButton style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <Modal.Title>Confirm Transfer</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <div className="text-center mb-3">
            <h4>Transfer {effectiveSelectedCount} item{effectiveSelectedCount !== 1 ? 's' : ''}</h4>
            <p className="text-muted">From <strong>{selectedTable}</strong> to <strong>{proposedTable}</strong></p>
          </div>
          <Alert variant="info" className="text-center">
            <strong>Total Amount:</strong> ₹{effectiveSelectedAmount.toFixed(2)}
          </Alert>
          {!isTableMode && selectedItems.filter(item => item.selected).length > 0 && (
            <div className="mt-3">
              <small className="text-muted">Items to transfer:</small>
              <ul className="mt-2">
                {selectedItems.filter(item => item.selected).map(item => (
                  <li key={item.id}>{item.item} - ₹{item.price?.toFixed(2)}</li>
                ))}
              </ul>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)} style={{ borderRadius: '20px' }}>
            Cancel
          </Button>
          <Button variant="primary" onClick={confirmTransfer} style={{ borderRadius: '20px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none' }}>
            Confirm Transfer
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default KotTransfer;