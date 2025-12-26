import React, { useEffect, useState } from 'react';
import axios from 'axios';

type Item = {
  id: number;
  name: string;
  qty: number;
  rate?: number;
  reversed?: boolean;
};

type Props = {
  user: any;
  tableId: number | null;
  tableName: string;
};

const ReverseKOT: React.FC<Props> = ({ user, tableId, tableName }) => {
  // ===== STATE (same style as Orders.tsx) =====
  const [txnId, setTxnId] = useState<number | null>(null);
  const [kotNo, setKotNo] = useState<number | null>(null);

  const [customerMobile, setCustomerMobile] = useState('');
  const [customerName, setCustomerName] = useState('');

  const [items, setItems] = useState<Item[]>([]);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  // ===== FETCH TABLE DATA (reuse Orders.tsx logic) =====
  useEffect(() => {
    if (!tableId || !user?.outletid) return;

    const fetchTableData = async () => {
      try {
        const res = await axios.get(
          `/api/TAxnTrnbill/unbilled-items/${tableId}`
        );

        const data = res.data?.data;

        // SAME as Orders.tsx
        if (data?.header?.TxnID) setTxnId(data.header.TxnID);
        if (data?.kotNo !== undefined) setKotNo(data.kotNo);

        setItems(data?.items || []);
        setCustomerMobile(data?.customer_mobile || '');
        setCustomerName(data?.customer_name || '');
      } catch (err) {
        console.error('Failed to load table data', err);
      }
    };

    fetchTableData();
  }, [tableId, user]);

  // ===== ITEM SELECT =====
  const toggleItem = (itemId: number) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  // ===== REVERSE KOT ACTION =====
  const reverseKOT = async () => {
    if (!txnId) {
      alert('Transaction not found');
      return;
    }

    if (selectedItems.length === 0) {
      alert('Select items to reverse');
      return;
    }

    setLoading(true);

    const payload = {
      outletid: user.outletid,
      txnId,            // 🔥 MUST (same transaction)
      kotNo,            // reference only
      items: selectedItems
    };

    console.log('Reverse KOT Payload:', payload);

    try {
      // 👉 Use existing reverse/cancel KOT API
      await axios.post('/api/TAxnTrnbill/reverse-kot', payload);

      // Reload data after reverse
      setSelectedItems([]);
      setLoading(false);

      // Re-fetch updated data
      if (tableId) {
        const res = await axios.get(
          `/api/TAxnTrnbill/unbilled-items/${tableId}`
        );
        const data = res.data?.data;
        setItems(data?.items || []);
        setKotNo(data?.kotNo);
      }
    } catch (err) {
      setLoading(false);
      console.error('Reverse KOT failed', err);
      alert('Reverse KOT failed');
    }
  };

  // ===== UI =====
  return (
    <div className="reverse-kot-page">
      {/* HEADER (Orders-like) */}
      <div className="header">
        <div><strong>Table:</strong> {tableName}</div>
        <div><strong>KOT:</strong> {kotNo ?? '--'}</div>

       
      </div>

      {/* ITEM LIST */}
      <div className="items">
        {items.map(item => (
          <div key={item.id} className="item-row">
            <input
              type="checkbox"
              disabled={item.reversed}
              checked={selectedItems.includes(item.id)}
              onChange={() => toggleItem(item.id)}
            />
            <span>{item.name}</span>
            <span>Qty: {item.qty}</span>
          </div>
        ))}
      </div>

      {/* ACTION */}
      <div className="footer">
        <button disabled={loading || !txnId} onClick={reverseKOT}>
          {loading ? 'Reversing...' : 'Reverse KOT'}
        </button>
      </div>
    </div>
  );
};

export default ReverseKOT;
