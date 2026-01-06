import  { useState, useEffect } from "react";
import { Card, Row, Col, Form, Button, Table, Badge, Alert, Modal } from "react-bootstrap";
import { getUnbilledItemsByTable } from "@/common/api/orders";
import { useAuthContext } from "@/common";

interface KotTransferProps {
  onCancel?: () => void;
  onSuccess?: () => void;
  transferSource?: "table" | "kot";
  sourceTableId?: number | null;
}

const KotTransfer = ({ onCancel, onSuccess, transferSource = "table", sourceTableId }: KotTransferProps) => {
  const { user } = useAuthContext();

  // Type definitions
  interface Item {
    id: number;
    txnDetailId: number;
    media: string;
    kotNo?: number;
    kot: number;
    item: string;
    qty: number;
    price: number;
    selected?: boolean;
  }

  interface Department {
    departmentid: number;
    department_name: string;
  }

  interface TableData {
    id: string;
    name: string;
    status: 'occupied' | 'available' | 'reserved';
    department: string;
    pax?: number;
    isbilled?: number;
  }

  // State management
  const [, setLoading] = useState(true);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [tables, setTables] = useState<TableData[]>([]);
  const [selectedItems, setSelectedItems] = useState<Item[]>([]);
  const [proposedItems, setProposedItems] = useState<Item[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [proposedTableId, setProposedTableId] = useState<number | null>(null);
  const [selectedTable, setSelectedTable] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [proposedTable, setProposedTable] = useState('');
  const [proposedDepartment, setProposedDepartment] = useState('');
  const [availableKOTs, setAvailableKOTs] = useState<number[]>([]);
  const [selectedKOT, setSelectedKOT] = useState<number | null>(null);
  const [latestKOT, setLatestKOT] = useState<number | null>(null);
  const [allItems, setAllItems] = useState<Item[]>([]);

  const [transferMode, setTransferMode] = useState<"table" | "kot">(transferSource);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [currentDate] = useState(new Date().toLocaleDateString('en-GB'));

  useEffect(() => {
    setTransferMode(transferSource);
    if (transferSource === "table") {
      setSelectedKOT(-1);
    } else if (transferSource === "kot") {
      setSelectedKOT(latestKOT);
    }
  }, [transferSource, latestKOT]);

  const fetchDepartments = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/table-department');
      const data = await response.json();
      if (data.success) {
        setDepartments(data.data);
      } else {
        console.error('Failed to fetch departments');
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchTables = async () => {
    try {
      const tablesResponse = await fetch('http://localhost:3001/api/tablemanagement');
      const tablesData = await tablesResponse.json();
      if (tablesData.success && Array.isArray(tablesData.data)) {
        const mappedTables: TableData[] = tablesData.data.map((table: any) => ({
          id: table.tableid.toString(),
          name: table.table_name,
          status: table.status === 1 ? 'occupied' : table.status === 2 ? 'reserved' : 'available',
          department: table.department_name || '',
          pax: table.pax || 0,
          isbilled: table.isbilled || 0
        }));
        setTables(mappedTables);
      }
    } catch (error) {
      console.error('Error fetching tables:', error);
    }
  };

  // Fetch data on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!user) return;

      try {
        await fetchDepartments();

        // Fetch tables from the correct endpoint
        const tablesResponse = await fetch('http://localhost:3001/api/tablemanagement');
        const tablesData = await tablesResponse.json();
        if (tablesData.success && Array.isArray(tablesData.data)) {
          const mappedTables: TableData[] = tablesData.data.map((table: any) => ({
            id: table.tableid.toString(),
            name: table.table_name,
            status: table.status === 1 ? 'occupied' : table.status === 2 ? 'reserved' : 'available',
            department: table.department_name || '',
            pax: table.pax || 0,
            isbilled: table.isbilled || 0
          }));
          setTables(mappedTables);

          const defaultTable =
            mappedTables.find(t => Number(t.id) === sourceTableId) ||
            mappedTables.find(t => t.status === 'occupied') ||
            mappedTables[0];
          setSelectedTableId(Number(defaultTable.id));
          setSelectedTable(defaultTable.name);
          setSelectedDepartment(defaultTable.department);
          await fetchItemsForTable(Number(defaultTable.id), 'selected');
        }

        const availableTable = tablesData.data.find((t: any) => t.status === 0); // 0 for available
          if (availableTable) {
            setProposedTableId(Number(availableTable.tableid));
            setProposedTable(availableTable.table_name);
            setProposedDepartment(availableTable.department_name || '');
            await fetchItemsForTable(Number(availableTable.tableid), 'proposed');
          }


      } catch (error) {
        console.error('Error fetching initial data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [user, sourceTableId]);

  const fetchItemsForTable = async (tableId: number, type: 'selected' | 'proposed') => {
    try {
      const response = await getUnbilledItemsByTable(tableId);
      const mappedItems: Item[] = response.data.items.map((item: any, index: number) => ({
        id: item.id || index,
        txnDetailId: item.txnDetailId || item.id || index,
        media: item.tableName || 'Unknown',
        kot: item.kotNo || 0,
        item: item.itemName,
        qty: item.netQty,
        price: item.price,
        selected: false
      }));

      if (type === 'selected') {
        setAllItems(mappedItems);
        // Extract unique KOTs and sort them
        const uniqueKOTs = [...new Set(mappedItems.map(item => item.kot))].sort((a, b) => a - b);
        setAvailableKOTs(uniqueKOTs);
        // Set latest KOT
        const latest = uniqueKOTs.length > 0 ? Math.max(...uniqueKOTs) : null;
        setLatestKOT(latest);
        setSelectedKOT(latest);
      } else {
        setProposedItems(mappedItems);
      }
    } catch (error) {
      console.error(`Error fetching items for table ${tableId}:`, error);
    }
  };

  // Function to update selectedItems based on selectedKOT and transferMode
  const updateSelectedItems = () => {
    if (transferMode === "table") {
      setSelectedItems(allItems.map(item => ({ ...item, selected: true })));
    } else if (selectedKOT !== null && selectedKOT !== -1) {
      const filteredItems = allItems.filter(item => item.kot === selectedKOT).map(item => ({ ...item, selected: true }));
      setSelectedItems(filteredItems);
    } else if (selectedKOT === -1) {
      setSelectedItems(allItems.map(item => ({ ...item, selected: true })));
    } else {
      setSelectedItems([]);
    }
  };

  // useEffect to update selectedItems when dependencies change
  useEffect(() => {
    updateSelectedItems();
  }, [allItems, selectedKOT, transferMode]);

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
  const totalItemsCount = selectedItems.length;
  const isTableMode = transferMode === "table";
  const effectiveSelectedCount = isTableMode ? totalItemsCount : selectedCount;
  const effectiveSelectedAmount = isTableMode ? selectedItems.reduce((sum, item) => sum + (item.price * item.qty), 0) : totalSelectedAmount;
const billDate = new Date().toISOString().split('T')[0];

  const handleCheck = (index: number) => {
    if (isTableMode) return;
    const updated = [...selectedItems];
    updated[index].selected = !updated[index].selected;
    setSelectedItems(updated);
  };


  const handleTransferTypeChange = (type: "table" | "kot") => {
    setTransferMode(type);
    if (type === "table") {
      setSelectedKOT(-1); // Special value for "All KOTs"
      const updated = selectedItems.map(item => ({ ...item, selected: true }));
      setSelectedItems(updated);
    } else {
      setSelectedKOT(latestKOT); // Set to latest KOT for KOT mode
    }
  };

  const handleSelectedTableChange = async (tableId: string) => {
    const numericTableId = Number(tableId);
    setSelectedTableId(numericTableId);
    const srcTable = tables.find(t => t.id === tableId);
    setSelectedTable(srcTable?.name || '');
    setSelectedDepartment(srcTable?.department || '');
    await fetchItemsForTable(numericTableId, 'selected');
  };

  const handleProposedTableChange = async (tableId: string) => {
    const numericTableId = Number(tableId);
    setProposedTableId(numericTableId);

    const destTable = tables.find(t => t.id === tableId);
    setProposedTable(destTable?.name || '');
    setProposedDepartment(destTable?.department || '');
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


const handleSave = async () => {
  if (!selectedTableId || !proposedTableId) {
    alert('Please select source and target tables');
    return;
  }

  if (proposedItems.length === 0) {
    alert('No items transferred to save.');
    return;
  }

  try {
    let payload;
    let endpoint;

    if (transferMode === "table") {
      // For table transfer, use simpler payload
      payload = {
        sourceTableId: selectedTableId,
        targetTableId: proposedTableId
      };
      endpoint = 'transfer-table';
    } else {
      // For KOT transfer, use detailed payload
      payload = {
        sourceTableId: selectedTableId,
        proposedTableId,
        targetTableName: proposedTable,
        billDate,
        KOTNo: proposedItems[0]?.kot,
        selectedItems: proposedItems.map(item => ({
          txnDetailId: item.txnDetailId
        })),
        transferMode,
        userId: user?.id || user?.userid
      };
      endpoint = 'transfer-kot';
    }

    console.log('SAVE PAYLOAD:', payload);

    const response = await fetch(
      `http://localhost:3001/api/TAxnTrnbill/${endpoint}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }
    );

    const result = await response.json();

    // ✅ backend contract respected
    if (!result.success) {
      alert(result.message || 'Transfer failed');
      return;
    }

    alert(result.message || `${transferMode === "table" ? "Table" : "KOT"} transfer saved successfully`);

    // 🔄 Sync UI
    await fetchItemsForTable(selectedTableId, 'selected');
    await fetchItemsForTable(proposedTableId, 'proposed');
    await fetchTables();

    // ♻ Reset state
    setSelectedItems([]);
    setProposedItems([]);

    onSuccess?.();

  } catch (error) {
    console.error('Error saving transfer:', error);
    alert('An error occurred while saving the transfer.');
  }
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
    <Card className="border-0 shadow" style={{ maxWidth: "100%",backgroundColor: "#f1f3f5" }}>
      <Card.Body className="p-3">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-2 p-2 bg-white rounded shadow-sm" style={{ minHeight: "60px" }}>
        <div className="d-flex gap-2">
          <Button
            variant={transferMode === "table" ? "primary" : "outline-primary"}
            onClick={() => handleTransferTypeChange("table")}
            style={{ fontWeight: 600, padding: "8px 20px", fontSize: "0.9rem" }}
            disabled={transferSource === "kot"}
          >
            Selected Table (All KOTs)
          </Button>
          <Button
            variant={transferMode === "kot" ? "primary" : "outline-primary"}
            onClick={() => handleTransferTypeChange("kot")}
            style={{ fontWeight: 600, padding: "8px 20px", fontSize: "0.9rem" }}
            disabled={transferSource === "table"}
          >
            Selected KOT Only
          </Button>
        </div>
        <h2 className="fw-bold text-secondary m-0" style={{ fontSize: "1.5rem" }}>
          {transferMode === "table" ? "TRANSFER TABLE" : "TRANSFER KOT'S"}
        </h2>
        <Badge bg="primary" style={{ fontSize: "0.9rem", padding: "8px 16px" }}>
          {effectiveSelectedCount} item{effectiveSelectedCount !== 1 ? 's' : ''} selected
        </Badge>
      </div>

     

        {/* Content Section */}
        <Row className="g-2 justify-content-center" style={{ padding: "10px 0" }}>
        {/* Source Table Section */}
        <Col md={5} className="d-flex justify-content-center">
          <Card className="border-0 shadow" style={{ backgroundColor: "#f8f9fa", height: "500px" }}>
           
            <Card.Body className="p-3 d-flex flex-column" style={{ height: "100%" }}>
              <Row className="mb-2 g-2">
                <Col xs={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold" style={{ fontSize: "0.9rem", marginBottom: "4px" }}>Table</Form.Label>
                    <Form.Select
                      value={selectedTableId || ''}
                      onChange={(e) => handleSelectedTableChange(e.target.value)}
                      className="fw-bold"
                      style={{ fontSize: "0.9rem" }}
                    >
                      {tables.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col xs={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold" style={{ fontSize: "0.9rem", marginBottom: "4px" }}>Department</Form.Label>
                    <Form.Control
                      value={selectedDepartment}
                      readOnly
                      className="fw-bold"
                      style={{ fontSize: "0.9rem", backgroundColor: "#e9ecef" }}
                    />
                  </Form.Group>
                </Col>
                <Col xs={4}>
                  <Form.Group>
                    <Form.Label className="fw-semibold" style={{ fontSize: "0.9rem", marginBottom: "4px" }}>KOT</Form.Label>
                    <Form.Select
                      value={selectedKOT === -1 ? "all" : selectedKOT || ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "all") {
                          setSelectedKOT(-1);
                        } else {
                          setSelectedKOT(Number(value));
                        }
                      }}
                      style={{ fontSize: "0.9rem" }}
                    >
                      <option value="all">All KOTs</option>
                      {availableKOTs.map(kot => (
                        <option key={kot} value={kot}>{kot}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col xs={4}>
                  <Form.Group>
                    <Form.Label className="fw-semibold" style={{ fontSize: "0.9rem", marginBottom: "4px" }}>Pax</Form.Label>
                    <Form.Control value={sourcePax} readOnly style={{ fontSize: "0.9rem" }} />
                  </Form.Group>
                </Col>
                <Col xs={4}>
                  <Form.Group>
                    <Form.Label className="fw-semibold" style={{ fontSize: "0.9rem", marginBottom: "4px" }}>Date</Form.Label>
                    <Form.Control value={currentDate} readOnly style={{ fontSize: "0.9rem" }} />
                  </Form.Group>
                </Col>
              </Row>

              {/* Item Selection - Only for KOT mode */}
              {!isTableMode ? (
  <>
    <div className="d-flex justify-content-between align-items-center mb-2">
      <Badge bg="primary" style={{ fontSize: "0.85rem" }}>
        {selectedCount} selected
      </Badge>
    </div>

    <div
      className="table-responsive"
      style={{
        maxHeight: "250px",
        border: "2px solid #e9ecef",
        borderRadius: "8px",
        overflowY: "auto",
      }}
    >
      <Table
        bordered
        hover
        size="sm"
        className="mb-0"
        style={{ tableLayout: "fixed", width: "100%" }}
      >
        <thead
          className="table-light text-center sticky-top"
          style={{ fontSize: "0.85rem" }}
        >
          <tr>
            <th style={{ width: "60px" }}></th>
            <th style={{ width: "70px" }}>Media</th>
            <th style={{ width: "80px" }}>KOT No.</th>
            <th style={{ width: "130px" }}>Item</th>
            <th style={{ width: "60px" }}>Qty</th>
            <th style={{ width: "80px" }}>Price</th>
          </tr>
        </thead>
        <tbody style={{ fontSize: "0.85rem" }}>
          {selectedItems.map((row, i) => (
            <tr
              key={row.id}
              className={row.selected ? "table-primary" : ""}
              style={{ cursor: "pointer" }}
              onClick={() => handleCheck(i)}
            >
              <td className="text-center align-middle">
                <Form.Check
                  type="checkbox"
                  checked={row.selected}
                  onChange={() => handleCheck(i)}
                  style={{ cursor: "pointer" }}
                />
              </td>
              <td>{row.media}</td>
              <td>{row.kot}</td>
               <td style={{ wordWrap: 'break-word', whiteSpace: 'normal' }}>{row.item}</td>
              <td className="text-center">{row.qty}</td>
              <td className="text-end">₹{row.price?.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
                </>
              ) : (
                <Alert variant="warning" className="mb-2" style={{ fontSize: "0.9rem" }}>
                  <h6 className="mb-1 fw-bold">Entire Table Transfer</h6>
                  <p className="mb-1">All {totalItemsCount} items from KOT {sourceKOT}</p>
                  <div className="fw-bold text-primary">Total: ₹{effectiveSelectedAmount.toFixed(2)}</div>
                </Alert>
              )}

              <div className="d-flex gap-3 mt-2 mb-2" style={{ fontSize: "0.9rem" }}>
                <Form.Check type="checkbox" label="Fixed Items" />
                <Form.Check type="checkbox" label="Transferred Tables' / KOT's Item" />
              </div>

              <div className="d-flex justify-content-around border-top pt-2">
                <div className="text-center">
                  <small className="text-muted d-block" style={{ fontSize: "0.75rem" }}>Total Amount</small>
                  <h5 className="text-danger mb-0" style={{ fontSize: "1.2rem" }}>₹{effectiveSelectedAmount.toFixed(2)}</h5>
                </div>
                <div className="text-center">
                  <small className="text-muted d-block" style={{ fontSize: "0.75rem" }}>Selected Items</small>
                  <h5 className="text-dark mb-0" style={{ fontSize: "1.2rem" }}>{effectiveSelectedCount}</h5>
                </div>
                <div className="text-center">
                  <small className="text-muted d-block" style={{ fontSize: "0.75rem" }}>Variance</small>
                  <h5 className="text-dark mb-0" style={{ fontSize: "1.2rem" }}>₹{variance.toFixed(2)}</h5>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Transfer Buttons */}
        <Col md={1} className="d-flex flex-column justify-content-center align-items-center px-2" style={{ gap: "15px" }}>
          <Button 
            size="lg"
            onClick={handleTransfer}
            disabled={!isTableMode && selectedCount === 0}
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "12px",
              fontSize: "1.5rem",
              background: "#8a7ffb",
              border: "none",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              color: "white",
              fontWeight: "bold",
              gap: "2px"
            }}
          >
            <span style={{ fontSize: "1.5rem" }}>{'>>'}</span>
            <div style={{ fontSize: "0.75rem" }}>F7</div>
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
              width: "60px",
              height: "60px",
              borderRadius: "12px",
              fontSize: "1.5rem",
              background: "#28a745",
              border: "none",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              color: "white",
              fontWeight: "bold",
              gap: "2px"
            }}
          >
            <span style={{ fontSize: "1.5rem" }}>{'<<'}</span>
            <div style={{ fontSize: "0.75rem" }}>F8</div>
          </Button>
        </Col>

        {/* Destination Table Section */}
        <Col md={5} className="pe-0 d-flex justify-content-center">
          <Card className="border-0 shadow" style={{ backgroundColor: "#f8f9fa", height: "500px" }}>
           
            <Card.Body className="p-3">
              <Row className="mb-2 g-2">
                <Col xs={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold" style={{ fontSize: "0.9rem", marginBottom: "4px" }}>Department</Form.Label>
                    <Form.Control
                      value={proposedDepartment}
                      readOnly
                      className="fw-bold"
                      style={{ fontSize: "0.9rem", backgroundColor: "#e9ecef" }}
                    />
                  </Form.Group>
                </Col>
                <Col xs={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold d-flex justify-content-between align-items-center" style={{ fontSize: "0.9rem", marginBottom: "4px" }}>
                      Table
                      {destStatus && getTableStatusBadge(destStatus)}
                    </Form.Label>
                    <div className="d-flex">
                      <Form.Select
                        value={proposedTableId || ''}
                        onChange={(e) => handleProposedTableChange(e.target.value)}
                        className="fw-bold me-2"
                        style={{ fontSize: "0.9rem" }}
                      >
                        {tables
                          .filter(t => (t.status === 'available' || t.status === 'occupied') && t.isbilled !== 1)
                          .map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                      </Form.Select>
                    </div>
                  </Form.Group>
                </Col>
                <Col xs={4}>
                  <Form.Group>
                    <Form.Label className="fw-semibold" style={{ fontSize: "0.9rem", marginBottom: "4px" }}>Date</Form.Label>
                    <Form.Control value={currentDate} readOnly style={{ fontSize: "0.9rem" }} />
                  </Form.Group>
                </Col>
                <Col xs={4}>
                  <Form.Group>
                    <Form.Label className="fw-semibold" style={{ fontSize: "0.9rem", marginBottom: "4px" }}>Pax</Form.Label>
                    <Form.Control value={destPax} readOnly style={{ fontSize: "0.9rem" }} />
                  </Form.Group>
                </Col>
                <Col xs={4}>
                  <Form.Group>
                    <Form.Label className="fw-semibold" style={{ fontSize: "0.9rem", marginBottom: "4px" }}>KOT</Form.Label>
                    <Form.Control value={destKOT} readOnly style={{ fontSize: "0.9rem" }} />
                  </Form.Group>
                </Col>
              </Row>

              <div style={{ maxHeight: "250px", overflowY: "auto", border: "2px solid #e9ecef", borderRadius: "8px" }}>
                <Table bordered hover size="sm" className="mb-0">
                  <thead className="table-light text-center sticky-top" style={{ fontSize: "0.85rem" }}>
                    <tr>
                      <th>Media</th>
                      <th>KOT No.</th>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>Price</th>
                    </tr>
                  </thead>
                  <tbody style={{ fontSize: "0.85rem" }}>
                    {proposedItems.length > 0 ? proposedItems.map((row) => (
                      <tr key={row.id}>
                        <td>{row.media}</td>
                        <td>{row.kot}</td>
                         <td style={{ wordWrap: 'break-word', whiteSpace: 'normal' }}>{row.item}</td>
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

              <div style={{ height: "20px" }}></div>

              <div className="d-flex justify-content-around border-top pt-2">
                <div className="text-center">
                  <small className="text-muted d-block" style={{ fontSize: "0.75rem" }}>Total Amount</small>
                  <h5 className="text-success mb-0" style={{ fontSize: "1.2rem" }}>₹{totalProposedAmount.toFixed(2)}</h5>
                </div>
                <div className="text-center">
                  <small className="text-muted d-block" style={{ fontSize: "0.75rem" }}>Variance</small>
                  <h5 className={`mb-0 ${variance >= 0 ? 'text-success' : 'text-warning'}`} style={{ fontSize: "1.2rem" }}>₹{variance.toFixed(2)}</h5>
                </div>
                <div className="text-center">
                  <small className="text-muted d-block" style={{ fontSize: "0.75rem" }}>Change Amount</small>
                  <h5 className="text-success mb-0" style={{ fontSize: "1.2rem" }}>₹{change.toFixed(2)}</h5>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

        {/* Action Buttons */}
        <div className="d-flex justify-content-end gap-3 mt-2">
          <Button variant="success" size="lg" className="px-4 fw-bold" onClick={handleSave} style={{ fontSize: "1rem", padding: "10px 30px" }}>
            💾 Save (F9)
          </Button>
          <Button variant="danger" size="lg" className="px-4 fw-bold" onClick={onCancel} style={{ fontSize: "1rem", padding: "10px 30px" }}>
            ✖ Cancel (Esc)
          </Button>
        </div>
      </Card.Body>

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
    </Card>
  );
};

export default KotTransfer; 