import { useState, useEffect, useRef } from "react";
import { Card, Row, Col, Form, Button, Table, Badge,  Modal } from "react-bootstrap";
import { getUnbilledItemsByTable  } from "@/common/api/orders";
import { useAuthContext } from "@/common";
import { toast } from 'react-hot-toast';

const KOT_COLORS = [
  '#E8F5E9', // Green 50
  '#FFF3E0', // Orange 50
];

const getRowColor = (kotNo: string | number | null | undefined) => {
  if (!kotNo) return '#ffffff';
  const s = String(kotNo);
  const firstKot = s.split('|')[0];
  const num = parseInt(firstKot.replace(/\D/g, ''), 10);

  if (isNaN(num) || num === 0) return '#ffffff';

  return KOT_COLORS[num % KOT_COLORS.length];
};

interface KotTransferProps {
  onCancel?: () => void;
  onSuccess?: () => void;
  transferSource?: "table" | "kot" 
  sourceTableId?: number | null;
  pax?: number;
  mode?: "table" | "kot";
}

const KotTransfer = ({ onCancel, onSuccess, transferSource = "table", sourceTableId, mode }: KotTransferProps) => {
  const { user } = useAuthContext();
  const proposedTableRef = useRef<HTMLSelectElement>(null);
  const kotSelectRef = useRef<HTMLSelectElement>(null);
  const f7ButtonRef = useRef<HTMLButtonElement>(null);

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
    status: 'Occupied' | 'printed' | 'paid' | 'running-kot' | 'available';
    department: string;
    pax?: number;
    isbilled?: number;
    outletid?: number;
    outlet_name?: string;
  }

  const [, setLoading] = useState(true);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [tables, setTables] = useState<TableData[]>([]);
  const [selectedItems, setSelectedItems] = useState<Item[]>([]);
  const [proposedItems, setProposedItems] = useState<Item[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [proposedTableId, setProposedTableId] = useState<number | null>(null);
  const [, setSelectedTable] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [proposedTable, setProposedTable] = useState('');
  const [proposedDepartment, setProposedDepartment] = useState('');
  const [availableKOTs, setAvailableKOTs] = useState<number[]>([]);
  const [selectedKOT, setSelectedKOT] = useState<number | null>(null);
  const [latestKOT, setLatestKOT] = useState<number | null>(null);
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [waitingForEnter, setWaitingForEnter] = useState(false);

  const effectiveSource = mode || transferSource;
  const [transferMode, setTransferMode] = useState<"table" | "kot" | "ORDER">(effectiveSource);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedOption, setSelectedOption] = useState<'no' | 'yes'>('no');
  const [transferDone, setTransferDone] = useState(false);
  const [currentDate] = useState(new Date().toLocaleDateString('en-GB'));
  const [proposedPax, setProposedPax] = useState<number>(0);
  const [currentFocus, setCurrentFocus] = useState<'table' | 'kot' | 'f7' | 'modal'>('table');
  const [pendingFocus, setPendingFocus] = useState<'table' | 'kot' | 'f7' | null>(null);

  useEffect(() => {
    setTransferMode(effectiveSource);
    if (effectiveSource === "table" ) {
      setSelectedKOT(-1);
    } else if (effectiveSource === "kot") {
      setSelectedKOT(latestKOT);
    }
  }, [effectiveSource, latestKOT]);

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
          status: table.status === 1 ? 'Occupied' : table.status === 2 ? 'printed' : table.status === 3 ? 'paid' : table.status === 4 ? 'running-kot' : 'available',
          department: table.department_name || '',
          pax: table.pax || 0,
          isbilled: table.isbilled || 0,
          outletid: table.outletid,
          outlet_name: table.outlet_name
        }));
        setTables(mappedTables);
      }
    } catch (error) {
      console.error('Error fetching tables:', error);
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!user) return;

      try {
        await fetchDepartments();

        const tablesResponse = await fetch('http://localhost:3001/api/tablemanagement');
        const tablesData = await tablesResponse.json();
        if (tablesData.success && Array.isArray(tablesData.data)) {
          const mappedTables: TableData[] = tablesData.data.map((table: any) => ({
            id: table.tableid.toString(),
            name: table.table_name,
            status: table.status === 1 ? 'Occupied' : table.status === 2 ? 'printed' : table.status === 3 ? 'paid' : table.status === 4 ? 'running-kot' : 'available',
            department: table.department_name || '',
            pax: table.pax || 0,
            isbilled: table.isbilled || 0,
            outletid: table.outletid,
            outlet_name: table.outlet_name
          }));
          setTables(mappedTables);

          const defaultTable =
            mappedTables.find(t => Number(t.id) === sourceTableId) ||
            mappedTables.find(t => t.status === 'Occupied') ||
            mappedTables[0];
          setSelectedTableId(Number(defaultTable.id));
          setSelectedTable(defaultTable.name);
          setSelectedDepartment(defaultTable.department);
          await fetchItemsForTable(Number(defaultTable.id), 'selected');
        }

        const availableTable = tablesData.data.find((t: any) => t.status === 0);
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

  useEffect(() => {
    if (tables.length > 0 && proposedTableRef.current) {
      proposedTableRef.current.focus();
      setCurrentFocus('table');
    }
  }, [tables]);

  useEffect(() => {
    if (currentFocus === 'table' && proposedTableRef.current) {
      proposedTableRef.current.focus();
    } else if (currentFocus === 'kot' && kotSelectRef.current) {
      kotSelectRef.current.focus();
    } else if (currentFocus === 'f7' && f7ButtonRef.current) {
      f7ButtonRef.current.focus();
    }
  }, [currentFocus]);

  useEffect(() => {
    if (!showConfirmModal && pendingFocus) {
      setCurrentFocus(pendingFocus);
      setPendingFocus(null);
    }
  }, [showConfirmModal, pendingFocus]);

  useEffect(() => {
    if (transferDone) {
      setWaitingForEnter(true);
      setTransferDone(false);
    }
  }, [transferDone]);

  useEffect(() => {
    if (!waitingForEnter) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        setShowConfirmModal(true);
        setWaitingForEnter(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [waitingForEnter]);

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
        const uniqueKOTs = [...new Set(mappedItems.map(item => item.kot))].sort((a, b) => a - b);
        setAvailableKOTs(uniqueKOTs);
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

  const updateSelectedItems = () => {
    if (transferMode === "table" || transferMode === "ORDER") {
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

  useEffect(() => {
    updateSelectedItems();
  }, [allItems, selectedKOT, transferMode]);

  const sourceTable = tables.find(t => t.id === selectedTableId?.toString());
  const sourcePax = sourceTable?.pax || 0;
 

  const totalSelectedAmount = selectedItems
    .filter(item => item.selected)
    .reduce((sum, item) => sum + (item.price * item.qty), 0);

  const totalProposedAmount = proposedItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const variance = totalProposedAmount - totalSelectedAmount;
  const change = Math.abs(variance);

  const selectedCount = selectedItems.filter(item => item.selected).length;
  const totalItemsCount = selectedItems.length;
  const isTableMode = transferMode === "table" || transferMode === "ORDER";
  const effectiveSelectedCount = isTableMode ? totalItemsCount : selectedCount;
  const effectiveSelectedAmount = isTableMode ? selectedItems.reduce((sum, item) => sum + (item.price * item.qty), 0) : totalSelectedAmount;
  const billDate = new Date().toISOString().split('T')[0];

  const handleCheck = (index: number) => {
    if (isTableMode) return;
    const updated = [...selectedItems];
    updated[index].selected = !updated[index].selected;
    setSelectedItems(updated);
  };

  const handleTransferTypeChange = (type: "table" | "kot" ) => {
    setTransferMode(type);
    if (type === "table"  ) {
      setSelectedKOT(-1);
      const updated = selectedItems.map(item => ({ ...item, selected: true }));
      setSelectedItems(updated);
    } else {
      setSelectedKOT(latestKOT);
    }
  };

  const handleSelectedTableChange = async (tableId: string) => {
    console.log('Selected Table ID:', handleSelectedTableChange);
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
    setProposedPax(destTable?.pax || 0);
    await fetchItemsForTable(numericTableId, 'proposed');
  };

  const handleTransfer = () => {
    if (selectedItems.length === 0) {
      toast.error("No items available to transfer!");
      return;
    }

    const itemsToTransfer = selectedItems.map(item => ({ ...item, selected: false, media: proposedTable }));

    setSelectedItems([]);
    setProposedItems(prev => [...prev, ...itemsToTransfer]);

    if (transferMode === "table" || transferMode === "ORDER") {
      setAllItems([]);
      setAvailableKOTs([]);
      setLatestKOT(null);
    } else {
      setAllItems(prev => prev.filter(item => item.kot !== selectedKOT));
      const updatedAllItems = allItems.filter(item => item.kot !== selectedKOT);
      const uniqueKOTs = [...new Set(updatedAllItems.map(item => item.kot))].sort((a, b) => a - b);
      setAvailableKOTs(uniqueKOTs);
      setLatestKOT(uniqueKOTs.length > 0 ? Math.max(...uniqueKOTs) : null);
    }

    setTables(prevTables =>
      prevTables.map(t => {
        if (t.id === selectedTableId?.toString()) {
          return { ...t, status: "available" as const };
        }
        return t;
      })
    );

    setShowConfirmModal(true);
  };

  const handleReverseTransfer = () => {
    setSelectedItems([...selectedItems, ...proposedItems]);
    setProposedItems([]);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'F7') {
        event.preventDefault();
        handleTransfer();
      } if (event.key === 'F8' && event.ctrlKey) {
        event.preventDefault();
        handleReverseTransfer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedItems, proposedItems, isTableMode, selectedCount]);

  const handleSave = async () => {
    if (!selectedTableId || !proposedTableId) {
      toast.error('Please select source and target tables');
      return;
    }

    if (proposedItems.length === 0) {
      toast.error('No items transferred to save.');
      return;
    }

    try {
      const proposedTableData = tables.find(t => t.id === proposedTableId?.toString());
      const tableOutletId = proposedTableData?.outletid;

      let payload;
      let endpoint;

      if (transferMode === "table" || transferMode === "ORDER") {
        payload = {
          sourceTableId: selectedTableId,
          targetTableId: proposedTableId,
          PAX: proposedPax,
          hotelid: user?.hotelid || user?.hotelId,
          outletid: tableOutletId || user?.outletid || user?.outletId
        };
        endpoint = 'transfer-table';
      } else {
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
          PAX: proposedPax,
          userId: user?.id || user?.userid,
          hotelid: user?.hotelid || user?.hotelId,
          outletid: tableOutletId || user?.outletid || user?.outletId
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

      if (!result.success) {
        toast.error(result.message || 'Transfer failed');
        return;
      }

      toast.success(result.message || `${transferMode === "table" ? "Table" : "KOT"} transfer saved successfully`);

      await fetchItemsForTable(selectedTableId, 'selected');
      await fetchItemsForTable(proposedTableId, 'proposed');
      await fetchTables();

      setSelectedItems([]);
      setProposedItems([]);

      onSuccess?.();

    } catch (error) {
      console.error('Error saving transfer:', error);
      alert('An error occurred while saving the transfer.');
    }
  };

  // Updated keyboard navigation for modal
  useEffect(() => {
    if (!showConfirmModal) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        setSelectedOption('no');
      } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        setSelectedOption('yes');
      } else if (event.key === 'Enter') {
        event.preventDefault();
        if (selectedOption === 'no') {
          // No selected: Close modal and save
          setShowConfirmModal(false);
          setTimeout(() => {
            handleSave();
          }, 100);
        } else if (selectedOption === 'yes') {
          // Yes selected: Close modal, check for remaining KOTs
          setShowConfirmModal(false);
          if (availableKOTs.length > 0) {
            setTimeout(() => {
              setCurrentFocus('kot');
            }, 100);
          } else {
            // No remaining KOTs, save immediately
            setTimeout(() => {
              handleSave();
            }, 100);
          }
        }
      } else if (event.key === 'Escape') {
        setShowConfirmModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showConfirmModal, selectedOption, availableKOTs]);

  const getTableStatusBadge = (status: string) => {
    const variants = {
      running: "danger",
      printed: "warning",
      paid: "success",
      "running-kot": "info",
      available: "secondary"
    } as const;
    const variant = variants[status as keyof typeof variants] || "secondary";
    return <Badge bg={variant}>{status.toUpperCase()}</Badge>;
  };

  const destTable = tables.find(t => t.id === proposedTableId?.toString());
  
  const destStatus = destTable?.status || "available";
  const destKOT = proposedItems.length > 0 ? proposedItems[0].kot : 0;

  return (
    <Card className="border-0 shadow" style={{ maxWidth: "100%", backgroundColor: "#f1f3f5" }}>
      <Card.Body className="p-1">
        <div className="d-flex justify-content-between align-items-center mb-2 p-2 bg-white rounded shadow-sm" style={{ minHeight: "60px" }}>
          <div className="d-flex gap-2">
            <Button
              variant={transferMode === "table" || transferMode === "ORDER" ? "primary" : "outline-primary"}
              onClick={() => handleTransferTypeChange("table")}
              style={{ fontWeight: 600, padding: "8px 20px", fontSize: "0.9rem" }}
              disabled={transferSource === "kot"}
            >
              TRANSFER TABLE
            </Button>
            <Button
              variant={transferMode === "kot" ? "primary" : "outline-primary"}
              onClick={() => handleTransferTypeChange("kot")}
              style={{ fontWeight: 600, padding: "8px 20px", fontSize: "0.9rem" }}
              disabled={transferSource === "table"}
            >
              TRANSFER KOT'S
            </Button>
          </div>
          <h2 className="fw-bold text-secondary m-0" style={{ fontSize: "1.5rem" }}>
            {transferMode === "table" || transferMode === "ORDER" ? "Selected Table (All KOTs)" : "Selected KOT Only"}
          </h2>
          <Badge bg="primary" style={{ fontSize: "0.9rem", padding: "8px 16px" }}>
            {effectiveSelectedCount} item{effectiveSelectedCount !== 1 ? 's' : ''} selected
          </Badge>
        </div>

        <Row className="p-1 justify">
          <Col md={5} className="d-flex justify-content-center col md-6 col-md-5">
            <Card className="border-0 shadow" style={{ backgroundColor: "#f8f9fa", height: "550px", border: currentFocus === 'kot' ? "3px solid #007bff" : "none" }}>
              <Card.Body className="p-2 d-flex flex-column" style={{ height: "100%"}}>
                <Row className="mb-2 g-2">
                  <Col xs={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold" style={{ fontSize: "0.9rem", marginBottom: "4px" }}>Table</Form.Label>
                      <Form.Select
                        value={selectedTableId || ''}
                        disabled
                        className="fw-bold"
                        style={{
                          fontSize: "0.9rem",
                          backgroundColor: "#e9ecef",
                          cursor: "not-allowed",
                        }}
                      >
                        {tables.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
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
                        ref={kotSelectRef}
                        value={selectedKOT === -1 ? "all" : selectedKOT || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "all") {
                            setSelectedKOT(-1);
                          } else {
                            setSelectedKOT(Number(value));
                          }
                        }}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); setCurrentFocus('f7'); } }}
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

                {!isTableMode ? (
                  <>
                    <div
                      className="table-responsive"
                      style={{
                        height: "300px",
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
                            <th style={{ width: "70px" }}>Table</th>
                            <th style={{ width: "90px" }}>KOT No.</th>
                            <th style={{ width: "130px" }}>Item</th>
                            <th style={{ width: "60px" }}>Qty</th>
                            <th style={{ width: "80px" }}>Price</th>
                          </tr>
                        </thead>
                        <tbody style={{ fontSize: "0.85rem", minHeight: "350px" }}>
                          {selectedItems.map((row, i) => (
                            <tr
                              key={row.id}
                              style={{ cursor: "pointer", backgroundColor: getRowColor(row.kot), fontWeight: row.selected ? 'bold' : 'normal' }}
                              onClick={() => handleCheck(i)}
                            >
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
                  <>
                    <div
                      className="table-responsive"
                      style={{
                        height: "400px",
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
                            <th style={{ width: "50px" }}>Table</th>
                            <th style={{ width: "50px" }}>KOT</th>
                            <th style={{ width: "150px" }}>Item</th>
                            <th style={{ width: "60px" }}>Qty</th>
                            <th style={{ width: "80px" }}>Price</th>
                          </tr>
                        </thead>
                        <tbody style={{ fontSize: "0.85rem", minHeight: "350px" }}>
                          {selectedItems.map((row, i) => (
                            <tr
                              key={row.id}
                              style={{ backgroundColor: getRowColor(row.kot) }}
                            >
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
                )}

                <div style={{ height: "20px" }}></div>

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

          <Col md={1} className="d-flex flex-column justify-content-center align-items-center px-2" style={{ gap: "15px" }}>
            <Button
              ref={f7ButtonRef}
              size="lg"
              onClick={handleTransfer}
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "12px",
                fontSize: "1.5rem",
                background: currentFocus === 'f7' ? "#6a5acd" : "#8a7ffb",
                border: currentFocus === 'f7' ? "3px solid #4a3bcd" : "none",
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
              onClick={handleReverseTransfer}
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

          <Col md={5} className="pe-0 d-flex justify-content-center">
            <Card className="border-0 shadow" style={{ backgroundColor: "#f8f9fa", height: "550px" }}>
              <Card.Body className="p-2">
                <Row className="mb-2 g-2">
                  <Col xs={6}>
                    <Form.Group>
                      <Form.Label
                        className="fw-semibold"
                        style={{ fontSize: "0.9rem", marginBottom: "4px" }}
                      >
                        Department
                      </Form.Label>
                      <Form.Select
                        value={proposedDepartment}
                        onChange={(e) => setProposedDepartment(e.target.value)}
                        style={{ fontSize: "0.9rem" }}
                      >
                        <option value="">Select Department</option>
                        {departments.map((dept) => (
                          <option key={dept.departmentid} value={dept.department_name}>
                            {dept.department_name}
                          </option>
                        ))}
                      </Form.Select>
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
                          ref={proposedTableRef}
                          value={proposedTableId || ''}
                          onChange={(e) => handleProposedTableChange(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); setCurrentFocus('kot'); } }}
                          className="fw-bold me-2"
                          style={{ fontSize: "0.9rem" }}
                        >
                          {tables
                            .filter(t => t.status !== 'printed' && t.isbilled !== 1)
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
                      <Form.Control
                        type="number"
                        value={proposedPax}
                        onChange={(e) => setProposedPax(Number(e.target.value))}
                        style={{ fontSize: "0.9rem" }}
                      />
                    </Form.Group>
                  </Col>
                  <Col xs={4}>
                    <Form.Group>
                      <Form.Label className="fw-semibold" style={{ fontSize: "0.9rem", marginBottom: "4px" }}>KOT</Form.Label>
                      <Form.Control value={destKOT} readOnly style={{ fontSize: "0.9rem" }} />
                    </Form.Group>
                  </Col>
                </Row>

                <div style={{ height: "300px", overflowY: "auto", border: "2px solid #e9ecef", borderRadius: "8px" }}>
                  <Table bordered hover size="sm" className="mb-0">
                    <thead className="table-light text-center sticky-top" style={{ fontSize: "0.85rem" }}>
                      <tr>
                        <th>Table</th>
                        <th>KOTNo.</th>
                        <th>Item</th>
                        <th>Qty</th>
                        <th>Price</th>
                      </tr>
                    </thead>
                    <tbody style={{ fontSize: "0.85rem", minHeight: "350px" }}>
                      {proposedItems.length > 0 ? proposedItems.map((row) => (
                        <tr key={row.id} style={{ backgroundColor: getRowColor(row.kot) }}>
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

        <div className="d-flex justify-content-end gap-3 mt-2">
          <Button variant="success" size="lg" className="px-4 fw-bold" onClick={handleSave} style={{ fontSize: "1rem", padding: "10px 30px" }}>
            💾 Save (F9)
          </Button>
          <Button variant="danger" size="lg" className="px-4 fw-bold" onClick={onCancel} style={{ fontSize: "1rem", padding: "10px 30px" }}>
            ✖ Cancel (Esc)
          </Button>
        </div>
      </Card.Body>

      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Save Transfer?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Do you want to save the transfer?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant={selectedOption === 'no' ? 'primary' : 'secondary'}
            onClick={async () => {
              setShowConfirmModal(false);
              setTimeout(() => {
                handleSave();
              }, 100);
            }}
            autoFocus={selectedOption === 'no'}
          >
            No
          </Button>
          <Button
            variant={selectedOption === 'yes' ? 'primary' : 'secondary'}
            onClick={() => {
              setShowConfirmModal(false);
              if (availableKOTs.length > 0) {
                setPendingFocus('kot');
              } else {
                setTimeout(() => {
                  handleSave();
                }, 100);
              }
            }}
          >
            Yes
          </Button>
        </Modal.Footer>
      </Modal>
    </Card>
  );
};

export default KotTransfer;