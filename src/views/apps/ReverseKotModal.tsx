import React, { useEffect, useState } from 'react';
import {
    Modal,
    Row,
    Col,
    Card,
    Table,
    Button,
    Badge,
    Form
} from 'react-bootstrap';

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
    kotItems: any[];
    revKotNo: number;
    tableNo: number;
    waiter: string;
    pax: number;
    date: string;
    onSave: (items: any[]) => void;
}

const ReverseKotModal: React.FC<ReverseKotModalProps> = ({
    show,
    onClose,
    kotItems,
    revKotNo,
    tableNo,
    waiter,
    pax,
    date,
    onSave
}) => {
    const [items, setItems] = useState<any[]>([]);

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

        // ✅ Amount calculated ONLY from cancelQty
        updated[idx].amount = updated[idx].cancelQty * updated[idx].rate;

        setItems(updated);
    };

    const totalReversedAmount = items.reduce(
        (sum, item) => sum + (item.amount || 0),
        0
    );

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
                    <Button variant="primary" onClick={() => onSave(items)}>
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
