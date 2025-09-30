import React, { useEffect, useState } from "react";
import { Modal, Button, Table, Form, Row, Col, Alert, Pagination } from "react-bootstrap";
import axios from "axios";

const EditSettlementPage = ({ role, currentUser }: any) => {
  const [settlements, setSettlements] = useState<any[]>([]);
  const [filters, setFilters] = useState({ orderNo: "", hotelId: "", outletId: "", from: "", to: "", paymentType: "", status: "" });
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ PaymentType: "", Amount: "" });
  const [outletPaymentModes, setOutletPaymentModes] = useState<any[]>([]);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOutletId, setSelectedOutletId] = useState<number | null>(currentUser?.outletid ? Number(currentUser.outletid) : null);

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

  // Edit handler
  const handleEdit = (settlement: any) => {
    setEditing(settlement);
    setForm({ PaymentType: settlement.PaymentType, Amount: settlement.Amount });
  };

  const saveEdit = async () => {
    try {
      // Validate amount matches bill total (assuming bill total is same as original amount here)
      if (Number(form.Amount) !== Number(editing.Amount)) {
        setNotification({ show: true, message: 'Updated amount must match the original bill total', type: 'danger' });
        return;
      }
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

  return (
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
        <thead>
          <tr>
          <th>ID</th><th>Order No</th><th>Payment Type</th><th>Hotel ID</th><th>Amount</th><th>Date</th><th>Status</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {settlements.map((s) => (
            <tr key={s.SettlementID} className={s.isSettled === 0 ? "table-danger" : ""}>
              <td>{s.SettlementID}</td>
              <td>{s.OrderNo}</td>
              <td>{s.PaymentType}</td>
              <td>{s.HotelID}</td>
              <td>₹{s.Amount.toFixed(2)}</td>
              <td>{new Date(s.InsertDate).toLocaleString()}</td>
              <td>{s.isSettled ? "Yes" : "No"}</td>
              <td>
                <Button size="sm" variant="primary" onClick={() => handleEdit(s)}>Edit</Button>{" "}
                {role === "Admin" && <Button size="sm" variant="danger" onClick={() => deleteSettlement(s.SettlementID)}>Delete</Button>}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      
      {/* Edit Modal */}
      <Modal show={!!editing} onHide={() => setEditing(null)}>
        <Modal.Header closeButton><Modal.Title>Edit Settlement</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Payment Mode</Form.Label>
              <Form.Select value={form.PaymentType} onChange={(e) => setForm({ ...form, PaymentType: e.target.value })}>
                {outletPaymentModes.filter((mode: any) => mode.mode_name).map((mode: any) => <option key={mode.id} value={mode.mode_name}>{mode.mode_name}</option>)}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Amount</Form.Label>
              <Form.Control type="number" value={form.Amount} onChange={(e) => setForm({ ...form, Amount: e.target.value })} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
          <Button variant="success" onClick={saveEdit}>Save</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default EditSettlementPage;
