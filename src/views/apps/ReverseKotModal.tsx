import React, { useEffect, useState, useRef } from 'react';
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
    onSave: (data: any) => void;
    kotItems: any[];
    revKotNo: number;
    tableNo: number | string;
    waiter: string;
    pax: number;
    date: string;
    persistentTxnId: number | null;
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

    // Refs for navigation
    const cancelRefs = useRef<(HTMLInputElement | null)[]>([]);
    const reasonRefs = useRef<(HTMLInputElement | null)[]>([]);

useEffect(() => {
  const initialized = kotItems.map(item => {
    const rev = Number(item.revQty ?? item.RevQty ?? 0);
    const rate = Number(item.rate ?? item.RuntimeRate ?? 0);

    return {
      ...item,
      reversedQty: rev,     // ✅ DB se fetch
      cancelQty: 0,         // user yahan type karega
      reason: '',
      rate: rate,           // ✅ Add rate to the item object
      amount: rev * rate   // ✅ already reversed amount
    };
  });
  setItems(initialized);
}, [kotItems]);

    const updateQty = (
        idx: number,
        field: 'reversedQty' | 'cancelQty',
        value: number
    ) => {
        const updated = [...items];
        updated[idx][field] = Number(value);

        // ✅ FINAL AMOUNT = reversed + cancel
        const totalQty =
            Number(updated[idx].reversedQty || 0) +
            Number(updated[idx].cancelQty || 0);

        updated[idx].amount = totalQty * Number(updated[idx].rate || 0);

        setItems(updated);
    };

    // Focus next row's Cancel input
    const focusNextCancel = (currentIdx: number) => {
        const nextIdx = currentIdx + 1;
        if (nextIdx < items.length) {
            cancelRefs.current[nextIdx]?.focus();
            cancelRefs.current[nextIdx]?.select(); // Optional: selects text for quick overwrite
        }
        // Last row → do nothing (you can add Save focus here later if wanted)
    };

    const handleCancelKeyDown = (idx: number, e: React.KeyboardEvent<HTMLElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            reasonRefs.current[idx]?.focus();
            reasonRefs.current[idx]?.select();
        }
    };

    const handleReasonKeyDown = (idx: number, e: React.KeyboardEvent<HTMLElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (idx === items.length - 1) {
                // Last row: trigger save
                handleReverseKotSave();
            } else {
                focusNextCancel(idx);
            }
        }
    };

    const totalReversedAmount = items.reduce(
        (sum, item) => sum + (item.amount || 0),
        0
    );

    const handleReverseKotSave = () => {
        const filteredItems = items.filter(
            i => Number(i.reversedQty) > 0 || Number(i.cancelQty) > 0
        );

        if (filteredItems.length === 0) {
            toast.error('No items selected for reverse');
            return;
        }

        console.log('Modal sending:', filteredItems);

        onSave(filteredItems);
        onClose();
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
                        { label: '', value: tableNo, highlight: true },
                        { label: 'REV KOT NO', value: revKotNo },
                        { label: 'WAITER', value: waiter },
                        { label: 'PAX', value: pax },
                        { label: 'DATE', value: date }
                    ].map((info, idx) => (
                        <Col key={idx}>
                            <Card
                                className="py-2"
                                style={{
                                    backgroundColor: info.highlight ? '#e3f2fd' : '#f8f9fa',
                                    border: info.highlight ? '1px solid #90caf9' : '1px solid #dee2e6',
                                    borderRadius: '10px'
                                }}
                            >
                                <div className="text-muted small">{info.label}</div>
                                <div
                                    className="fw-bold"
                                    style={{
                                        fontSize: info.highlight ? '1.6rem' : '1rem',
                                        color: info.highlight ? '#0d6efd' : '#212529'
                                    }}
                                >
                                    {info.value}
                                </div>
                            </Card>
                        </Col>
                    ))}
                </Row>

                {/* ===== TABLE ===== */}
                <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #dee2e6' }}>
                    <Table bordered hover size="sm" className="mb-0">
                        <thead className="sticky-top" style={{ backgroundColor: '#dc3545' }}>
                            <tr>
                                <th className="text-white">Item Name</th>
                                <th className="text-white">Actual</th>
                                <th className="text-white">Reversed</th>
                                <th className="text-white">Cancel</th>
                                <th className="text-white">Rate</th>
                                <th className="text-white">Total</th>
                                <th className="text-white">KOT</th>
                                <th className="text-white">Reason</th>
                            </tr>
                        </thead>

                        <tbody>
                            {items.map((row, idx) => (
                                <tr key={idx} style={{ backgroundColor: getRowColor(row.mkotNo) }}>
                                    <td>{row.itemName}</td>
                                  <td>{row.qty + row.reversedQty}</td>

                                    <td>
                                        <Form.Control
                                            type="number"
                                            size="sm"
                                            min={0}
                                            max={row.qty}
                                            value={row.reversedQty}
                                            readOnly
                                            tabIndex={-1}
                                            className="bg-light"
                                            style={{ cursor: 'not-allowed' }}
                                        />
                                    </td>

                                    <td>
                                        <Form.Control
                                            type="number"
                                            size="sm"
                                            min={0}
                                            max={row.qty}
                                            value={row.cancelQty}
                                            onChange={e => updateQty(idx, 'cancelQty', +e.target.value)}
                                            onKeyDown={e => handleCancelKeyDown(idx, e)}
                                            ref={el => { cancelRefs.current[idx] = el; }}
                                        />
                                    </td>

                                    <td>{row.rate}</td>
                                    <td>{row.amount.toFixed(2)}</td>

                                    <td>
                                        {row.mkotNo && (
                                            <div className="d-flex flex-wrap gap-1 justify-content-center">
                                                {row.mkotNo.split('|').map((kot: string, i: number) => (
                                                    <Badge key={i} bg="secondary">{kot}</Badge>
                                                ))}
                                            </div>
                                        )}
                                    </td>

                                    <td>
                                        <Form.Control
                                            size="sm"
                                            value={row.reason}
                                            onChange={e => {
                                                const updated = [...items];
                                                updated[idx].reason = e.target.value;
                                                setItems(updated);
                                            }}
                                            onKeyDown={e => handleReasonKeyDown(idx, e)}
                                            ref={el => { reasonRefs.current[idx] = el; }}
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
                            style={{ width: '120px', textAlign: 'right', fontWeight: 'bold' }}
                        />
                    </Col>
                    <Col xs="auto" className="fw-bold">Rs.</Col>
                </Row>

                {/* ===== FOOTER ===== */}
                <div className="d-flex justify-content-end gap-2 mt-3">
                    <Button variant="primary" onClick={handleReverseKotSave}>
                        Save
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