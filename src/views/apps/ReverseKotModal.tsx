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

    const updateQty = (idx: number, field: string, val: number) => {
        const updated = [...items];
        updated[idx][field] = val;
        updated[idx].amount = updated[idx].reversedQty * updated[idx].rate;
        setItems(updated);
    };

    const totalReversedAmount = items.reduce(
        (s, i) => s + (i.amount || 0),
        0
    );

    return (
        <Modal show={show} onHide={onClose} size="xl" backdrop="static">
            <Modal.Body>

                {/* ===== HEADER ===== */}
                <Row className="align-items-center mb-3">
                    <Col>
                        <h3 className="text-primary fw-bold mb-0">REVERSE KOT</h3>
                    </Col>

                </Row>

                {/* ===== INFO CARDS ===== */}
                <Row className="g-2 mb-3 text-center">
                    {[
                        { label: 'TABLE NO', value: tableNo },
                        { label: 'WAITER', value: waiter },
                        { label: 'PAX', value: pax },
                        { label: 'REV KOT NO', value: revKotNo },
                        { label: 'DATE', value: date }
                    ].map((i, idx) => (
                        <Col key={idx}>
                            <Card className="py-2">
                                <div className="text-muted small">{i.label}</div>
                                <div className="fs-5 fw-bold">{i.value}</div>
                            </Card>
                        </Col>
                    ))}
                </Row>

                {/* ===== TABLE ===== */}
                <Table bordered hover size="sm">
                    <thead className="table-light">
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
                            <tr key={idx}>

                                <td>{row.itemName}</td>
                                <td>{row.qty}</td>

                                <td>
                                    <Form.Control
                                        type="number"
                                        size="sm"
                                        value={row.reversedQty}
                                        min={0}
                                        max={row.qty}
                                        onChange={e =>
                                            updateQty(idx, 'reversedQty', +e.target.value)
                                        }
                                    />
                                </td>

                                <td>
                                    <Form.Control
                                        type="number"
                                        size="sm"
                                        value={row.cancelQty}
                                        min={0}
                                        max={row.qty}
                                        onChange={e =>
                                            updateQty(idx, 'cancelQty', +e.target.value)
                                        }
                                    />
                                </td>

                                <td>{row.rate}</td>
                                <td>{row.amount.toFixed(2)}</td>

                                <td>
                                    <Badge bg="secondary">{row.kotNo}</Badge>
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
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
                {/* ===== TOTAL REVERSED AMOUNT (Right Side) ===== */}
                <Row className="justify-content-end align-items-center mb-2">
                    <Col xs="auto" className="fw-bold">
                        TOTAL REVERSED AMOUNT :
                    </Col>

                    <Col xs="auto">
                        <Form.Control
                            size="sm"
                            value={totalReversedAmount.toFixed(2)}
                            disabled
                            style={{
                                width: '110px',
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
