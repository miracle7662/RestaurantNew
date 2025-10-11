import React, { useState } from 'react';
import { Modal, Card, Form, Button, Row, Col } from 'react-bootstrap';

const OrderModal = () => {
  const [showModal, setShowModal] = useState(false);
  const [orderType, setOrderType] = useState('Pickup'); // 'Pickup' or 'Delivery'
  
  // Sample orders data - replace with your actual state management
  const [orders, setOrders] = useState([
    {
      id: 1,
      name: '',
      mobile: '',
      items: [
        { name: 'Pizza Margherita', qty: 2, price: 250 },
        { name: 'Burger Deluxe', qty: 1, price: 150 }
      ]
    },
    {
      id: 2,
      name: '',
      mobile: '',
      items: [
        { name: 'Pasta Alfredo', qty: 1, price: 200 },
        { name: 'Garlic Bread', qty: 3, price: 60 }
      ]
    },
    {
      id: 3,
      name: '',
      mobile: '',
      items: [
        { name: 'Chicken Wings', qty: 4, price: 100 }
      ]
    }
  ]);

  const handleOpenModal = (type) => {
    setOrderType(type);
    setShowModal(true);
  };

  const handleInputChange = (orderId, field, value) => {
    setOrders(orders.map(order => 
      order.id === orderId ? { ...order, [field]: value } : order
    ));
  };

  const calculateTotals = (items) => {
    const totalQty = items.reduce((sum, item) => sum + item.qty, 0);
    const totalAmount = items.reduce((sum, item) => sum + (item.qty * item.price), 0);
    return { totalQty, totalAmount };
  };

  const handleMakePayment = (orderId) => {
    const order = orders.find(o => o.id === orderId);
    const { totalQty, totalAmount } = calculateTotals(order.items);
    
    console.log('Payment Processing:', {
      orderType,
      orderId,
      name: order.name,
      mobile: order.mobile,
      items: order.items,
      totalQty,
      totalAmount
    });

    // Clear this specific order
    setOrders(orders.map(o => 
      o.id === orderId ? { ...o, name: '', mobile: '' } : o
    ));

    alert(`Payment of ₹${totalAmount} processed successfully for ${orderType} order!`);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  return (
    <div className="p-4">
      {/* Demo Navbar Buttons */}
      <div className="mb-3">
        <Button 
          variant="primary" 
          className="me-2"
          onClick={() => handleOpenModal('Pickup')}
        >
          Pickup Orders
        </Button>
        <Button 
          variant="success"
          onClick={() => handleOpenModal('Delivery')}
        >
          Delivery Orders
        </Button>
      </div>

      {/* Order Modal */}
      <Modal 
        show={showModal} 
        onHide={handleCloseModal}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>{orderType} Orders - Today</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <Row>
            {orders.map((order) => {
              const { totalQty, totalAmount } = calculateTotals(order.items);
              
              return (
                <Col md={6} key={order.id} className="mb-3">
                  <Card style={{ border: '3px solid #000' }}>
                    <Card.Body className="p-3">
                      {/* Customer Details */}
                      <div style={{ border: '2px solid #000', padding: '10px', marginBottom: '10px' }}>
                        <Form.Group className="mb-2">
                          <Form.Label className="mb-1 fw-bold">Name:</Form.Label>
                          <Form.Control 
                            type="text"
                            value={order.name}
                            onChange={(e) => handleInputChange(order.id, 'name', e.target.value)}
                            placeholder="Enter customer name"
                          />
                        </Form.Group>
                        <Form.Group>
                          <Form.Label className="mb-1 fw-bold">Mo no:</Form.Label>
                          <Form.Control 
                            type="tel"
                            value={order.mobile}
                            onChange={(e) => handleInputChange(order.id, 'mobile', e.target.value)}
                            placeholder="Enter mobile number"
                            maxLength={10}
                          />
                        </Form.Group>
                      </div>

                      {/* Order Items */}
                      <div style={{ border: '2px solid #000', padding: '10px' }}>
                        <h6 className="text-danger fw-bold mb-2">Item Name</h6>
                        
                        <div 
                          style={{ 
                            maxHeight: '150px', 
                            overflowY: 'auto',
                            marginBottom: '10px'
                          }}
                        >
                          {order.items.map((item, index) => (
                            <div 
                              key={index}
                              className="d-flex justify-content-between mb-2 pb-2"
                              style={{ borderBottom: '1px solid #ddd' }}
                            >
                              <span>{item.name}</span>
                              <span>
                                <strong>Qty:</strong> {item.qty} | 
                                <strong> ₹{item.qty * item.price}</strong>
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Footer Section */}
                        <div className="d-flex justify-content-between align-items-center pt-2" style={{ borderTop: '2px solid #000' }}>
                          <span className="text-danger fw-bold">total qty: {totalQty}</span>
                          <span className="text-danger fw-bold">Total amount: ₹{totalAmount}</span>
                        </div>

                        <Button 
                          variant="danger" 
                          className="w-100 mt-3 fw-bold"
                          onClick={() => handleMakePayment(order.id)}
                          disabled={!order.name || !order.mobile}
                        >
                          Make payment
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default OrderModal;