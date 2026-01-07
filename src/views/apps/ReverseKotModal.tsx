import React, { useEffect, useState } from 'react';
import {
    Modal,
    Row,
    Col,
    Card,
    Table,
    Button,
    Badge,
    Form,
    Spinner
} from 'react-bootstrap';
import { toast } from 'react-toastify';

const KOT_COLORS = ['#E8F5E9', '#FFF3E0'];

const getRowColor = (kotNo: string | number | null | undefined) => {
    if (!kotNo) return '#ffffff';
    const firstKot = String(kotNo).split('|')[0];
    const num = parseInt(firstKot.replace(/\D/g, ''), 10);
    if (isNaN(num) || num === 0) return '#ffffff';
    return KOT_COLORS[num % KOT_COLORS.length];
};

interface ReverseKotModalProps {
    show: boolean;
    onClose: () => void;
    onSave: (data: any) => void;  // Callback to notify parent after save
    kotItems: any[];
    revKotNo: number;
    tableNo: number | string;
    waiter: string;
    pax: number;
    date: string;
    persistentTxnId: number|null;
    persistentTableId: number;
}

const ReverseKotModal: React.FC<ReverseKotModalProps> = ({
    show,
    onClose,
    onSave,
    kotItems,
    revKotNo,
    tableNo,
    waiter,
    pax,
    date,
    persistentTxnId,
    persistentTableId
}) => {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setItems(
            kotItems.map(item => ({
                ...item,
                reversedQty: 0,
                cancelQty: 0,
                reason: '',
                amount: 0
            }))
        );
    }, [kotItems]);

    const updateQty = (
        idx: number,
        field: 'reversedQty' | 'cancelQty',
        value: number
    ) => {
        const updated = [...items];
        updated[idx][field] = value;

        // Amount calculated ONLY from cancelQty
        updated[idx].amount = updated[idx].cancelQty * updated[idx].rate;

        setItems(updated);
    };

    const totalReversedAmount = items.reduce(
        (sum, item) => sum + (item.amount || 0),
        0
    );

   const handleReverseKotSave = async (items: any[]) => {
  const filteredItems = items.filter(
    i => i.reversedQty > 0 || i.cancelQty > 0
  );

  if (filteredItems.length === 0) {
    toast.error('No items selected for reverse');
    return;
  }

  const payload = {
    txnId: persistentTxnId,
    tableId: persistentTableId,
    reversedItems: filteredItems.map(i => ({
      item_no: i.itemId,
      item_name: i.itemName,
      qty: i.reversedQty + i.cancelQty
    })),
    userId: 1 // ya logged-in user id
  };

  try {
    const response = await fetch(
      'http://localhost:3001/api/TAxnTrnbill/create-reverse-kot',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }
    );

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Reverse KOT failed');
    }

    toast.success('Reverse KOT saved successfully');

    onSave(result.data);
    onClose();

  } catch (error) {
    console.error('Error saving reverse KOT:', error);
    toast.error('Failed to save reverse KOT');
  }
};


    return (
        <Modal show={show} onHide={onClose} size="xl" backdrop="static">
            <Modal.Body
                style={{
                    height: '90vh',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                {/* ===== HEADER ===== */}
                <Row className="mb-3">
                    <Col>
                        <h4 className="fw-bold text-primary mb-0">REVERSE KOT</h4>
                    </Col>
                </Row>

                {/* ===== INFO ===== */}
                <Row className="g-2 mb-3 text-center">
                    {[
                        { label: 'TABLE NO', value: tableNo },
                        { label: 'REV KOT NO', value: revKotNo },
                        { label: 'WAITER', value: waiter },
                        { label: 'PAX', value: pax },
                        { label: 'DATE', value: date }
                    ].map((info, idx) => (
                        <Col key={idx}>
                            <Card className="py-2">
                                <div className="text-muted small">{info.label}</div>
                                <div className="fw-bold">{info.value}</div>
                            </Card>
                        </Col>
                    ))}
                </Row>

                {/* ===== TABLE (SCROLL ONLY) ===== */}
                <div
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        border: '1px solid #dee2e6'
                    }}
                >
                    <Table bordered hover size="sm" className="mb-0">
                        <thead className="table-light sticky-top">
                            <tr>
                                <th>Item Name</th>
                                <th>Actual</th>
                                <th>Reversed</th>
                                <th>Cancel</th>
                                <th>Rate</th>
                                <th>Total</th>
                                <th>KOT</th>
                                <th>Reason</th>
                            </tr>
                        </thead>

                        <tbody>
                            {items.map((row, idx) => (
                                <tr
                                    key={idx}
                                    style={{
                                        backgroundColor: getRowColor(row.mkotNo)
                                    }}
                                >
                                    <td>{row.itemName}</td>
                                    <td>{row.qty}</td>

                                    <td>
                                        <Form.Control
                                            type="number"
                                            size="sm"
                                            min={0}
                                            max={row.qty}
                                            value={row.reversedQty}
                                            onChange={e =>
                                                updateQty(
                                                    idx,
                                                    'reversedQty',
                                                    +e.target.value
                                                )
                                            }
                                        />
                                    </td>

                                    <td>
                                        <Form.Control
                                            type="number"
                                            size="sm"
                                            min={0}
                                            max={row.qty}
                                            value={row.cancelQty}
                                            onChange={e =>
                                                updateQty(
                                                    idx,
                                                    'cancelQty',
                                                    +e.target.value
                                                )
                                            }
                                        />
                                    </td>

                                    <td>{row.rate}</td>
                                    <td>{row.amount.toFixed(2)}</td>

                                    <td>
                                        {row.mkotNo && (
                                            <div className="d-flex flex-wrap gap-1 justify-content-center">
                                                {row.mkotNo
                                                    .split('|')
                                                    .map(
                                                        (kot: string, i: number) => (
                                                            <Badge
                                                                key={i}
                                                                bg="secondary"
                                                            >
                                                                {kot}
                                                            </Badge>
                                                        )
                                                    )}
                                            </div>
                                        )}
                                    </td>

                                    <td>
                                        <Form.Control
                                            size="sm"
                                            value={row.reason}
                                            onChange={e => {
                                                const updated = [...items];
                                                updated[idx].reason =
                                                    e.target.value;
                                                setItems(updated);
                                            }}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>

                {/* ===== TOTAL ===== */}
                <Row className="justify-content-end align-items-center mt-2">
                    <Col xs="auto" className="fw-bold">
                        TOTAL REVERSED AMOUNT :
                    </Col>
                    <Col xs="auto">
                        <Form.Control
                            size="sm"
                            value={totalReversedAmount.toFixed(2)}
                            disabled
                            style={{
                                width: '120px',
                                textAlign: 'right',
                                fontWeight: 'bold'
                            }}
                        />
                    </Col>
                    <Col xs="auto" className="fw-bold">
                        Rs.
                    </Col>
                </Row>

                {/* ===== FOOTER ===== */}
                <div className="d-flex justify-content-end gap-2 mt-3">
                    <Button
                        variant="primary"
                        onClick={() => {
                            setLoading(true);
                            handleReverseKotSave(items).finally(() => setLoading(false));
                        }}
                        disabled={loading}
                    >
                        {loading ? (
                            <Spinner as="span" animation="border" size="sm" />
                        ) : (
                            'Save'
                        )}
                    </Button>
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                </div>
            </Modal.Body>
        </Modal>
    );
};

export default ReverseKotModal;