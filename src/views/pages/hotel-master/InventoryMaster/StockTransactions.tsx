// pages/InventoryManagement/StockTransactions.tsx
import { useState, useEffect, useMemo } from 'react';
import { Table, Form, Row, Col, Badge, Button } from 'react-bootstrap';
import Select from 'react-select';
import StockService, { StockTransaction, StockItem } from '@/common/hotel/stock';
import { useAuthContext } from '@/common/context/useAuthContext';

const StockTransactions = () => {
  const { user } = useAuthContext();
  const hotelId = user?.hotel_id;

  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<StockItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<number | null>(null);
  const [transactionType, setTransactionType] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (hotelId) {
      loadItems();
      loadTransactions();
    }
  }, [hotelId]);

  useEffect(() => {
    loadTransactions();
  }, [selectedItem, transactionType, startDate, endDate]);

  const loadItems = async () => {
    if (!hotelId) return;
    try {
      const res = await StockService.getItems({ hotelid: hotelId });
      if (res.success && res.data) {
        // Remove duplicates based on item_id
        const uniqueItems = res.data.filter((item, index, self) => 
          index === self.findIndex((i) => i.item_id === item.item_id)
        );
        setItems(uniqueItems);
      }
    } catch (error) {
      console.error('Failed to load items:', error);
    }
  };

  const loadTransactions = async () => {
    if (!hotelId) return;
    setLoading(true);
    try {
      const params: any = { hotelid: hotelId };
      if (selectedItem) params.item_id = selectedItem;
      if (transactionType) params.transaction_type = transactionType;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      
      const res = await StockService.getTransactions(params);
      if (res.success && res.data) {
        setTransactions(res.data);
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case 'IN':
        return <Badge bg="success">IN (Purchase)</Badge>;
      case 'OUT':
        return <Badge bg="primary">OUT (Issued)</Badge>;
      case 'RETURNED':
        return <Badge bg="info">Returned</Badge>;
      case 'DAMAGED':
        return <Badge bg="danger">Damaged</Badge>;
      default:
        return <Badge bg="secondary">{type}</Badge>;
    }
  };

  // Create unique options for react-select to prevent duplicates
  const itemOptions = useMemo(() => {
    const uniqueItems = items.filter((item, index, self) => 
      index === self.findIndex((i) => i.item_id === item.item_id)
    );
    return [
      { label: 'All Items', value: null },
      ...uniqueItems.map(item => ({ label: `${item.item_name} (${item.category})`, value: item.item_id }))
    ];
  }, [items]);

  const typeOptions = [
    { label: 'All Types', value: '' },
    { label: 'IN (Purchase)', value: 'IN' },
    { label: 'OUT (Issued)', value: 'OUT' },
    { label: 'Returned', value: 'RETURNED' },
    { label: 'Damaged', value: 'DAMAGED' },
  ];

  return (
    <div>
      <Row className="g-2 mb-3">
        <Col md={3}>
          <Form.Label className="fs-small fw-bold">Item</Form.Label>
          <Select
            options={itemOptions}
            onChange={(opt: any) => setSelectedItem(opt?.value || null)}
            placeholder="Select item"
            isClearable
          />
        </Col>
        <Col md={2}>
          <Form.Label className="fs-small fw-bold">Type</Form.Label>
          <Form.Select
            size="sm"
            value={transactionType}
            onChange={(e) => setTransactionType(e.target.value)}
          >
            {typeOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Form.Select>
        </Col>
        <Col md={2}>
          <Form.Label className="fs-small fw-bold">From Date</Form.Label>
          <Form.Control
            type="date"
            size="sm"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </Col>
        <Col md={2}>
          <Form.Label className="fs-small fw-bold">To Date</Form.Label>
          <Form.Control
            type="date"
            size="sm"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </Col>
        <Col md={3} className="d-flex align-items-end">
          <Button variant="outline-secondary" size="sm" onClick={() => {
            setSelectedItem(null);
            setTransactionType('');
            setStartDate('');
            setEndDate('');
          }}>
            Clear Filters
          </Button>
        </Col>
      </Row>

      <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto' }}>
        <Table size="sm" hover className="mb-0">
          <thead className="table-light sticky-top">
            <tr>
              <th>Date</th>
              <th>Item</th>
              <th>Type</th>
              <th>Qty</th>
              <th>Reference</th>
              <th>Reason</th>
              <th>By</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-4 text-muted">
                  Loading transactions...
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-4 text-muted">
                  No transactions found.
                </td>
              </tr>
            ) : (
              transactions.map((txn) => (
                <tr key={txn.transaction_id}>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {new Date(txn.transaction_date).toLocaleString()}
                  </td>
                  <td>
                    {txn.item_name}
                    <br />
                    <small className="text-muted">{txn.item_code}</small>
                  </td>
                  <td>{getTransactionBadge(txn.transaction_type)}</td>
                  <td className="fw-bold">{txn.quantity}</td>
                  <td>
                    {txn.reference_type}: {txn.reference_id || '-'}
                  </td>
                  <td className="small">{txn.reason || '-'}</td>
                  <td className="small">{txn.created_by_name || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>
    </div>
  );
};

export default StockTransactions;