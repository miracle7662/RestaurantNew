import React, { useEffect, useState } from "react";
import { Modal, Button, Table, Form, Row, Col, Alert, Card } from "react-bootstrap";
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import SimpleBar from 'simplebar-react';

const EditSettlementPage = ({ role, currentUser }: any) => {
  const [settlements, setSettlements] = useState<any[]>([]);
  const [filters, setFilters] = useState({ orderNo: "", hotelId: "", outletId: "", from: "", to: "", paymentType: "" });
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ PaymentType: "", Amount: "" });
  const [outletPaymentModes, setOutletPaymentModes] = useState<any[]>([]);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOutletId, setSelectedOutletId] = useState<number | null>(currentUser?.outletid ? Number(currentUser.outletid) : null);
  const navigate = useNavigate();

  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [grandTotal, setGrandTotal] = useState(0);
  const [isMixedPayment, setIsMixedPayment] = useState(false);
  const [selectedPaymentModes, setSelectedPaymentModes] = useState<string[]>([]);
  const [paymentAmounts, setPaymentAmounts] = useState<{ [key: string]: string }>({});
  const [totalPaid, setTotalPaid] = useState(0);
  const [settlementBalance, setSettlementBalance] = useState(0);

  interface PaymentMode {
  id: number;
  paymenttypeid: number;
  mode_name: string;
}

  // Fetch settlements
  const fetchData = async (page = currentPage) => {
    try {
      const params = { ...filters, outletId: selectedOutletId, page, limit: 10 };
      const res = await axios.get("http://localhost:3001/api/settlements", { params });
      const settlementsData = res.data?.data?.settlements || res.data?.settlements || (Array.isArray(res.data) ? res.data : []);
      const total = res.data?.data?.total || res.data?.total || 0;
      setSettlements(settlementsData);
      setTotalPages(Math.ceil(total / 10));
    } catch (error) {
      setNotification({ show: true, message: 'Failed to fetch settlements', type: 'danger' });
      setSettlements([]);
      setTotalPages(1);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters, currentPage]);

  useEffect(() => {
    setSelectedOutletId(filters.outletId ? Number(filters.outletId) : null);
  }, [filters.outletId]);

  useEffect(() => {
    const fetchPaymentModes = async () => {
      try {
        const res = await axios.get(`http://localhost:3001/api/payment-modes`);
        const data = Array.isArray(res.data) ? res.data : [];
        setOutletPaymentModes(data);
      } catch (error) {
        console.error("Failed to fetch payment modes", error);
        setOutletPaymentModes([]);
      }
    };
    fetchPaymentModes();
  }, []);

  useEffect(() => {
    const paid = Object.values(paymentAmounts).reduce((sum, amt) => sum + (parseFloat(amt) || 0), 0);
    setTotalPaid(paid);
    setSettlementBalance(grandTotal - paid);
  }, [paymentAmounts, grandTotal]);

  // Edit handler
  const handleEdit = (settlement: any) => {
    setEditing(settlement);
    setGrandTotal(settlement.Amount);
    const breakdown = settlement.paymentBreakdown || {};
    const types = Object.keys(breakdown);
    if (types.length > 1) {
      setIsMixedPayment(true);
      setSelectedPaymentModes(types);
      setPaymentAmounts(Object.fromEntries(types.map(t => [t, breakdown[t].toString()])));
    } else if (types.length === 1) {
      setIsMixedPayment(false);
      setSelectedPaymentModes([types[0]]);
      setPaymentAmounts({ [types[0]]: settlement.Amount.toString() });
    } else {
      setIsMixedPayment(false);
      setSelectedPaymentModes([]);
      setPaymentAmounts({});
    }
    setShowSettlementModal(true);
  };

  const saveEdit = async () => {
    try {
      await axios.put(`http://localhost:3001/api/settlements/${editing.SettlementID}`, {
        ...form,
        EditedBy: currentUser,
      });
      setNotification({ show: true, message: 'Settlement updated successfully', type: 'success' });
      setEditing(null);
      fetchData();
    } catch (error: any) {
      setNotification({ show: true, message: error.response?.data?.message || 'Failed to update settlement', type: 'danger' });
    }
  };

  const deleteSettlement = async (id: any) => {
    try {
      await axios.delete(`http://localhost:3001/api/settlements/${id}`, { data: { EditedBy: currentUser } });
      setNotification({ show: true, message: 'Settlement reversed successfully', type: 'success' });
      fetchData();
    } catch (error: any) {
      setNotification({ show: true, message: error.response?.data?.message || 'Failed to reverse settlement', type: 'danger' });
    }
  };

  const handlePaymentModeClick = (mode: PaymentMode) => {
    if (isMixedPayment) {
      // Mixed Payment Logic
      const currentTotalPaid = Object.values(paymentAmounts).reduce((acc, val) => acc + (parseFloat(val) || 0), 0);
      const remaining = Math.max(0, grandTotal - currentTotalPaid);
      setSelectedPaymentModes(prev => {
        const isSelected = prev.includes(mode.mode_name);
        if (isSelected) {
          // Deselect: remove from list and clear amount
          const newAmounts = { ...paymentAmounts };
          delete newAmounts[mode.mode_name];
          setPaymentAmounts(newAmounts);
          return prev.filter(m => m !== mode.mode_name);
        } else {
          // Select: add to list and auto-fill with remaining balance
          setPaymentAmounts(prev => ({ ...prev, [mode.mode_name]: remaining.toFixed(2) }));
          return [...prev, mode.mode_name];
        }
      });
    } else {
      // Single Payment Logic
      setSelectedPaymentModes([mode.mode_name]);
      setPaymentAmounts({ [mode.mode_name]: grandTotal.toFixed(2) });
    }
  };

  const handlePaymentAmountChange = (modeName: string, value: string) => {
    setPaymentAmounts({ ...paymentAmounts, [modeName]: value });
  };

  const handleSettleAndPrint = async () => {
    if (!editing) return;
    try {
      // Reverse existing settlements
      for (const id of editing.SettlementIDs) {
        await axios.delete(`http://localhost:3001/api/settlements/${id}`, { data: { EditedBy: currentUser } });
      }
      // Create new settlements for each selected payment mode
      for (const [mode, amtStr] of Object.entries(paymentAmounts)) {
        const amt = parseFloat(amtStr);
        if (amt > 0) {
          await axios.post("http://localhost:3001/api/settlements", {
            OrderNo: editing.OrderNo,
            PaymentType: mode,
            Amount: amt,
            HotelID: editing.HotelID,
            EditedBy: currentUser,
          });
        }
      }
      setNotification({ show: true, message: 'Settlement updated successfully', type: 'success' });
      setShowSettlementModal(false);
      setEditing(null);
      fetchData();
    } catch (error: any) {
      setNotification({ show: true, message: error.response?.data?.message || 'Failed to update settlement', type: 'danger' });
    }
  };

  // Helper function to group settlements by OrderNo
  const groupSettlementsByOrderNo = (settlements: any[]) => {
    const grouped: { [orderNo: string]: any } = {};
    settlements.forEach((s) => {
      if (!grouped[s.OrderNo]) {
        grouped[s.OrderNo] = {
          OrderNo: s.OrderNo,
          PaymentTypes: [s.PaymentType],
          Amount: s.Amount,
          SettlementIDs: [s.SettlementID],
          InsertDate: s.InsertDate,
          HotelID: s.HotelID,
          isSettled: s.isSettled,
          paymentBreakdown: { [s.PaymentType]: s.Amount },
        };
      } else {
        grouped[s.OrderNo].PaymentTypes.push(s.PaymentType);
        grouped[s.OrderNo].Amount += s.Amount;
        grouped[s.OrderNo].SettlementIDs.push(s.SettlementID);
        const currentBreakdown = grouped[s.OrderNo].paymentBreakdown;
        currentBreakdown[s.PaymentType] = (currentBreakdown[s.PaymentType] || 0) + s.Amount;
      }
    });
    return Object.values(grouped);
  };

  const groupedSettlements = groupSettlementsByOrderNo(settlements);

  return (
    <SimpleBar style={{ maxHeight: '80vh' }}>
      <div className="container mt-4">
        <h3>Edit Settlement</h3>

        <Alert show={notification.show} variant={notification.type} dismissible onClose={() => setNotification({ show: false, message: '', type: 'success' })}>
          {notification.message}
        </Alert>

        {/* Filter Section */}
        <div className="p-3 bg-light rounded mb-4">
          <Row>
            <Col><Form.Control placeholder="Order No" value={filters.orderNo} onChange={(e) => setFilters({ ...filters, orderNo: e.target.value })} /></Col>          
            <Col><Form.Control type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} /></Col>
            <Col><Form.Control type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} /></Col>
            <Col>
              <Form.Select value={filters.paymentType} onChange={(e) => setFilters({ ...filters, paymentType: e.target.value })}>
                <option value="">All Payment Types</option>
                <option>Cash</option>
                <option>Card</option>
                <option>UPI</option>
                <option>Wallet</option>
              </Form.Select>
            </Col>

            <Col><Button onClick={() => { fetchData(); }}>Search</Button></Col>
          </Row>
        </div>

        {/* Settlement Table */}
        <Table striped bordered hover>
          <thead className="table-light"  >
            <tr>
            <th>ID</th><th>Order No</th><th>Payment Type</th><th>Hotel ID</th><th>Amount</th><th>Date</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {groupedSettlements.map((s) => (
              <tr key={s.SettlementIDs.join('-')} className={s.isSettled === 0 ? "table-danger" : ""}>
                <td>{s.SettlementIDs.join(', ')}</td>
                <td>{s.OrderNo}</td>
                <td>{s.PaymentTypes.map((type: string, index: number) => <div key={index}>{type}</div>)}</td>
                <td>{s.HotelID}</td>
                <td>₹{s.Amount.toFixed(2)}</td>
                <td>{new Date(s.InsertDate.replace(' ', 'T') + 'Z').toLocaleString()}</td>
             
             
             
                <td>
                  <Button size="sm" variant="primary" onClick={() => handleEdit(s)}>Edit</Button>{" "}
                  {role === "Admin" && <Button size="sm" variant="danger" onClick={() => deleteSettlement(s.SettlementIDs[0])}>Delete</Button>}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>

        
        {/* Edit Modal */}
    

        {/* Main Settlement Modal */}
        <Modal
          show={showSettlementModal}
          onHide={() => setShowSettlementModal(false)}
          centered
          size="lg"
        >
          {/* Header */}
          <Modal.Header closeButton className="border-0">
            <Modal.Title className="fw-bold text-dark">Payment Mode</Modal.Title>
          </Modal.Header>

          {/* Body */}
          <Modal.Body className="bg-light">
            {/* Bill Summary */}
            <div className="p-4 mb-4 bg-white rounded shadow-sm text-center">
              <h6 className="text-secondary mb-2">Total Amount Due</h6>
              <div className="fw-bold display-5 text-dark">
                ₹{grandTotal.toFixed(2)}
              </div>
            </div>

            {/* Mixed Payment Toggle */}
            <div className="d-flex justify-content-end mb-3">
              <Form.Check
                type="switch"
                id="mixed-payment-switch"
                label="Mixed Payment"
                checked={isMixedPayment}
                onChange={(e) => {
                  setIsMixedPayment(e.target.checked);
                  setSelectedPaymentModes([]);
                  setPaymentAmounts({});
                }}
              />
            </div>

            {/* Payment Modes */}
            <Row xs={1} md={2} className="g-3">
              {outletPaymentModes.filter(mode => mode.mode_name).map((mode) => (
                <Col key={mode.id}>
                  <Card
                    onClick={() => handlePaymentModeClick(mode)}
                    className={`text-center h-100 shadow-sm ${selectedPaymentModes.includes(mode.mode_name)
                        ? "bg-primary bg-opacity-10 border border-primary"
                        : "border-0"
                        }`}
                    style={{
                      cursor: "pointer",
                      transition: "transform 0.2s ease, box-shadow 0.2s ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.transform = "translateY(-4px)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.transform = "translateY(0)")
                    }
                  >
                    <Card.Body>
                      <Card.Title className="fw-semibold">
                        {mode.mode_name}
                      </Card.Title>

                      {/* Amount Display or Input */}
                      {selectedPaymentModes.includes(mode.mode_name) ? (
                        isMixedPayment ? (
                          <Form.Control
                            type="number"
                            placeholder="0.00"
                            value={paymentAmounts[mode.mode_name] || ""}
                            onChange={(e) =>
                              handlePaymentAmountChange(mode.mode_name, e.target.value)
                            }
                            onClick={(e) => e.stopPropagation()}
                            autoFocus={isMixedPayment}
                            readOnly={!isMixedPayment}
                            className="mt-2 text-center"
                          />
                        ) : (
                          <div className="mt-2 text-center fw-bold">
                            ₹{parseFloat(paymentAmounts[mode.mode_name] || "0").toFixed(2)}
                          </div>
                        )
                      ) : null}
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>

            {/* Payment Summary */}
            <div className="mt-4 p-3 bg-white rounded shadow-sm">
              <div className="d-flex justify-content-around fw-bold fs-5">
                <div>
                  <span>Total Paid: </span>
                  <span className="text-primary">{totalPaid.toFixed(2)}</span>
                </div>
                <div>
                  <span>Balance Due: </span>
                  <span
                    className={settlementBalance === 0 ? "text-success" : "text-danger"}
                  >
                    {settlementBalance.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Validation Messages */}
              {settlementBalance !== 0 && (
                <div className="text-danger mt-2 text-center small">
                  Total paid amount must match the grand total.
                </div>
              )}
              {settlementBalance === 0 && totalPaid > 0 && (
                <div className="text-success mt-2 text-center small">
                  ✅ Payment amount matches. Ready to settle.
                </div>
              )}
            </div>
          </Modal.Body>

          {/* Footer */}
          <Modal.Footer className="border-0 justify-content-between">
            <Button
              variant="outline-secondary"
              onClick={() => setShowSettlementModal(false)}
              className="px-4"
            >
              Back
            </Button>
            <Button
              variant="success"
              onClick={handleSettleAndPrint}
              disabled={settlementBalance !== 0 || totalPaid === 0}
              className="px-4"
            >
              Settle & Print
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </SimpleBar>
  );
};

export default EditSettlementPage;