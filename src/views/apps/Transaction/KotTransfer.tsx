import React, { useState, useEffect } from "react";
import { Card, Row, Col, Form, Button, Table, Badge, Alert, Modal } from "react-bootstrap";
import { fetchOutletsForDropdown } from "@/utils/commonfunction";
import { getUnbilledItemsByTable } from "@/common/api/orders";
import { OutletData } from "@/common/api/outlet";
import { useAuthContext } from "@/common";

interface KotTransferProps {
  onCancel: () => void;
}

const KotTransfer = ({ onCancel }: KotTransferProps) => {
  const { user } = useAuthContext();

  // Type definitions
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

    // State management
  const [loading, setLoading] = useState(true);
  const [outlets, setOutlets] = useState<OutletData[]>([]);
  const [tables, setTables] = useState<TableData[]>([]);
  const [selectedItems, setSelectedItems] = useState<Item[]>([]);
  const [proposedItems, setProposedItems] = useState<Item[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [proposedTableId, setProposedTableId] = useState<number | null>(null);
  const [selectedTable, setSelectedTable] = useState('');
  const [selectedOutlet, setSelectedOutlet] = useState('');
  const [proposedTable, setProposedTable] = useState('');
  const [proposedOutlet, setProposedOutlet] = useState('');

  const [transferType, setTransferType] = useState<"table" | "kot">("table");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [currentDate] = useState(new Date().toLocaleDateString('en-GB'));

  // Fetch data on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!user) return;

      try {
        const [outletsData, tablesResponse] = await Promise.all([
          new Promise<OutletData[]>((resolve) => {
            fetchOutletsForDropdown(user, resolve, () => {});
          }),
          fetch('http://localhost:3001/api/outlets/tables/all') // Use the new endpoint
        ]);

        setOutlets(outletsData);
        const tablesData = await tablesResponse.json();

        const mappedTables: TableData[] = tablesData.map((table: any) => ({
          id: table.tableid.toString(), // Use tableid as the unique identifier
          name: table.table_name,
          status: table.status,
          outlet: table.outlet_name || 'Unknown',
          pax: table.pax || 0
        }));
        setTables(mappedTables);

        if (mappedTables.length > 0) {
          const defaultTable = mappedTables.find(t => t.status === 'occupied') || mappedTables[0];
          setSelectedTableId(Number(defaultTable.id));
          setSelectedTable(defaultTable.name); // For display
          setSelectedOutlet(defaultTable.outlet); // For display
          await fetchItemsForTable(Number(defaultTable.id), 'selected');
        }

        const availableTable = mappedTables.find(t => t.status === 'available');
        if (availableTable) {
          setProposedTableId(Number(availableTable.id));
          setProposedTable(availableTable.name); // For display
          setProposedOutlet(availableTable.outlet); // For display
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
        media: item.tableName || 'Unknown', // This might need adjustment based on API response
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

  const totalSelectedAmount = selectedItems
    .filter(item => item.selected)
    .reduce((sum, item) => sum + (item.price * item.qty), 0);

  const totalProposedAmount = proposedItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const variance = totalProposedAmount - totalSelectedAmount;
  const change = Math.abs(variance);

  const selectedCount = selectedItems.filter(item => item.selected).length;
  const allSelected = selectedItems.length > 0 && selectedItems.every(item => item.selected);
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

  const handleSelectAll = (checked: boolean) => {
    if (isTableMode) return;
    const updated = selectedItems.map(item => ({
      ...item,
      selected: checked
    }));
    setSelectedItems(updated);
  };

  const handleTransferTypeChange = (type: "table" | "kot") => {
    setTransferType(type);
    if (type === "table") {
      const updated = selectedItems.map(item => ({ ...item, selected: true }));
      setSelectedItems(updated);
    }
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
    alert(`Successfully transferred ${itemsToTransfer.length} item${itemsToTransfer.length !== 1 ? 's' : ''} to Table ${proposedTable}`); // proposedTable is name
  };

  const getTableStatusBadge = (status: string) => {
    const variants = {
      occupied: "danger",
      available: "success",
      reserved: "warning"
    } as const;
    const variant = variants[status as keyof typeof variants];
    return <Badge bg={variant}>{status.toUpperCase()}</Badge>;
  };

  const destTable = tables.find(t => t.id === proposedTableId?.toString());
  const destPax = destTable?.pax || 0;
  const destStatus = destTable?.status || "available";
  const destKOT = proposedItems.length > 0 ? proposedItems[0].kot : 0;

  return (
    <div className="container mt-0 p-2 rounded shadow" >
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-2 p-2 bg-white rounded shadow-sm">
        <div className="d-flex gap-2">
          <Button 
            variant={transferType === "table" ? "primary" : "outline-primary"} 
            onClick={() => handleTransferTypeChange("table")}
            style={{ fontWeight: 600, padding: "10px 30px" }}
          >
            Selected Table (All KOTs)
          </Button>
          <Button 
            variant={transferType === "kot" ? "primary" : "outline-primary"}
            onClick={() => handleTransferTypeChange("kot")}
            style={{ fontWeight: 600, padding: "10px 30px" }}
          >
            Selected KOT Only
          </Button>
        </div>
        <h2 className="fw-bold text-secondary m-0" style={{ fontSize: "2rem" }}>
          {transferType === "table" ? "TRANSFER TABLE" : "TRANSFER KOT'S"}
        </h2>
        <div style={{ width: "200px" }}></div>
      </div>

      {/* Transfer Type Indicator */}
      <Alert variant="info" className="d-flex align-items-center justify-content-between">
        <div>
          <span className="fw-bold me-2">Transfer Mode:</span>
          {transferType === "table" ? "📋 Table Transfer" : "🧾 KOT Transfer"}
        </div>
        <Badge bg="primary" style={{ fontSize: "1rem", padding: "8px 16px" }}>
          {effectiveSelectedCount} item{effectiveSelectedCount !== 1 ? 's' : ''} selected
        </Badge>
      </Alert>

      {/* Content Section */}
      <Row className="g-4">
        {/* Source Table Section */}
        <Col md={5}>
          <Card className="border-0 shadow h-100">
            <Card.Header className="text-white fw-bold" style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", fontSize: "1.1rem" }}>
              Selected Table
            </Card.Header>
            <Card.Body>
              <Row className="mb-3 g-2">
                <Col xs={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold">Table</Form.Label>
                    <Form.Control value={selectedTable} readOnly className="fw-bold" />
                  </Form.Group>
                </Col>
                <Col xs={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold">Outlet</Form.Label>
                    <Form.Select value={selectedOutlet} onChange={(e) => setSelectedOutlet(e.target.value)}>
                      {outlets.map(outlet => (
                        <option key={outlet.outletid} value={outlet.outlet_name}>{outlet.outlet_name}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col xs={4}>
                  <Form.Group>
                    <Form.Label className="fw-semibold">KOT</Form.Label>
                    <Form.Control value={sourceKOT} readOnly />
                  </Form.Group>
                </Col>
                <Col xs={4}>
                  <Form.Group>
                    <Form.Label className="fw-semibold">Pax</Form.Label>
                    <Form.Control value={sourcePax} readOnly />
                  </Form.Group>
                </Col>
                <Col xs={4}>
                  <Form.Group>
                    <Form.Label className="fw-semibold">Date</Form.Label>
                    <Form.Control value={currentDate} readOnly />
                  </Form.Group>
                </Col>
              </Row>

              {/* Item Selection - Only for KOT mode */}
              {!isTableMode ? (
                <>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <Form.Check
                      type="checkbox"
                      label="Select All Items"
                      checked={allSelected}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="fw-semibold"
                    />
                    <Badge bg="primary" style={{ fontSize: "0.9rem" }}>
                      {selectedCount} selected
                    </Badge>
                  </div>

                  <div style={{ maxHeight: "300px", overflowY: "auto", border: "2px solid #e9ecef", borderRadius: "8px" }}>
                    <Table bordered hover size="sm" className="mb-0">
                      <thead className="table-light text-center sticky-top">
                        <tr>
                          <th style={{ width: "50px" }}>Select</th>
                          <th>Media</th>
                          <th>KOT No.</th>
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
                                checked={!!row.selected}
                                onChange={() => handleCheck(i)}
                              />
                            </td>
                            <td>{row.media}</td>
                            <td>{row.kot}</td>
                            <td>{row.item}</td>
                            <td className="text-center">{row.qty}</td>
                            <td className="text-end">₹{row.price?.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </>
              ) : (
                <Alert variant="warning" className="mb-3">
                  <h6 className="mb-1 fw-bold">Entire Table Transfer</h6>
                  <p className="mb-1">All {totalItemsCount} items from KOT {sourceKOT}</p>
                  <div className="fw-bold text-primary">Total: ₹{effectiveSelectedAmount.toFixed(2)}</div>
                </Alert>
              )}

              <div className="d-flex gap-3 mt-3 mb-3">
                <Form.Check type="checkbox" label="Fixed Items" />
                <Form.Check type="checkbox" label="Transferred Tables' / KOT's Item" />
              </div>

              <div className="d-flex justify-content-around border-top pt-3">
                <div className="text-center">
                  <small className="text-muted d-block">Total Amount</small>
                  <h4 className="text-danger mb-0">₹{effectiveSelectedAmount.toFixed(2)}</h4>
                </div>
                <div className="text-center">
                  <small className="text-muted d-block">Selected Items</small>
                  <h4 className="text-dark mb-0">{effectiveSelectedCount}</h4>
                </div>
                <div className="text-center">
                  <small className="text-muted d-block">Variance</small>
                  <h4 className="text-dark mb-0">₹{variance.toFixed(2)}</h4>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Transfer Buttons */}
        <Col md={2} className="d-flex flex-column justify-content-center align-items-center" style={{ paddingTop: "180px" }}>
          <Button 
            size="lg"
            onClick={handleTransfer}
            disabled={!isTableMode && selectedCount === 0}
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "12px",
              fontSize: "2rem",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              border: "none",
              marginBottom: "20px"
            }}
          >
            ➜
            <div style={{ fontSize: "0.7rem", marginTop: "5px" }}>F7</div>
          </Button>
          <Button 
            size="lg"
            variant="secondary"
            disabled={proposedItems.length === 0}
            onClick={() => {
              setSelectedItems([...selectedItems, ...proposedItems]);
              setProposedItems([]);
            }}
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "12px",
              fontSize: "2rem",
              background: "linear-gradient(135deg, #6c757d 0%, #495057 100%)",
              border: "none"
            }}
          >
            ←
            <div style={{ fontSize: "0.7rem", marginTop: "5px" }}>F8</div>
          </Button>
        </Col>

        {/* Destination Table Section */}
        <Col md={5}>
          <Card className="border-0 shadow h-100">
            <Card.Header className="text-white fw-bold" style={{ background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", fontSize: "1.1rem" }}>
              Proposed Table
            </Card.Header>
            <Card.Body>
              <Row className="mb-3 g-2">
                <Col xs={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold">Outlet</Form.Label>
                    <Form.Select value={proposedOutlet} onChange={(e) => setProposedOutlet(e.target.value)}>
                      {outlets.map(outlet => (
                        <option key={outlet.outletid} value={outlet.outlet_name}>{outlet.outlet_name}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col xs={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold">Table</Form.Label>
                    <div className="d-flex">
                      <Form.Select
                        value={proposedTableId || ''}
                        onChange={(e) => handleProposedTableChange(e.target.value)}
                        className="fw-bold me-2"
                      >
                        {tables.filter(t => t.id !== selectedTableId?.toString()).map(t => (
                          <option key={t.id} value={t.name}>{t.name}</option>
                        ))}
                      </Form.Select>
                    </div>
                  </Form.Group>
                </Col>
                <Col xs={4}>
                  <Form.Group>
                    <Form.Label className="fw-semibold">Date</Form.Label>
                    <Form.Control value={currentDate} readOnly />
                  </Form.Group>
                </Col>
                <Col xs={4}>
                  <Form.Group>
                    <Form.Label className="fw-semibold">Pax</Form.Label>
                    <Form.Control value={destPax} readOnly />
                  </Form.Group>
                </Col>
                <Col xs={4}>
                  <Form.Group>
                    <Form.Label className="fw-semibold">KOT</Form.Label>
                    <Form.Control value={destKOT} readOnly />
                  </Form.Group>
                </Col>
              </Row>

              <div style={{ maxHeight: "300px", overflowY: "auto", border: "2px solid #e9ecef", borderRadius: "8px" }}>
                <Table bordered hover size="sm" className="mb-0">
                  <thead className="table-light text-center sticky-top">
                    <tr>
                      <th>Media</th>
                      <th>KOT No.</th>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proposedItems.length > 0 ? proposedItems.map((row) => (
                      <tr key={row.id}>
                        <td>{row.media}</td>
                        <td>{row.kot}</td>
                        <td>{row.item}</td>
                        <td className="text-center">{row.qty}</td>
                        <td className="text-end">₹{row.price?.toFixed(2)}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="text-center text-muted py-5">No items</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>

              <div style={{ height: "40px" }}></div>

              <div className="d-flex justify-content-around border-top pt-3">
                <div className="text-center">
                  <small className="text-muted d-block">Total Amount</small>
                  <h4 className="text-success mb-0">₹{totalProposedAmount.toFixed(2)}</h4>
                </div>
                <div className="text-center">
                  <small className="text-muted d-block">Variance</small>
                  <h4 className={`mb-0 ${variance >= 0 ? 'text-success' : 'text-warning'}`}>₹{variance.toFixed(2)}</h4>
                </div>
                <div className="text-center">
                  <small className="text-muted d-block">Change Amount</small>
                  <h4 className="text-success mb-0">₹{change.toFixed(2)}</h4>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Action Buttons */}
      <div className="d-flex justify-content-end gap-3 mt-4">
        <Button variant="success" size="lg" className="px-5 fw-bold">
          💾 Save (F9)
        </Button>
        <Button variant="danger" size="lg" className="px-5 fw-bold" onClick={onCancel}>
          ✖ Cancel (Esc)
        </Button>
      </div>

      {/* Confirmation Modal */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm {isTableMode ? "Table" : "KOT"} Transfer</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to transfer {effectiveSelectedCount} item{effectiveSelectedCount !== 1 ? 's' : ''} from Table {selectedTable} to Table {proposedTable}?</p> 
          <Alert variant="warning">
            <strong>Total Amount:</strong> ₹{effectiveSelectedAmount.toFixed(2)}
          </Alert>
          {!isTableMode && (
            <ul>
              {selectedItems.filter(item => item.selected).map(item => (
                <li key={item.id}>{item.item} (₹{item.price?.toFixed(2)})</li>
              ))}
            </ul>
          )}
          {isTableMode && <p className="text-muted">This will move the entire bill.</p>}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={confirmTransfer}>
            Confirm Transfer
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default KotTransfer;
