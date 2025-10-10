import React, { useState } from 'react';
import { Eye, Printer, X, Smartphone, CreditCard, Banknote } from 'lucide-react';

// Sample bill data
const initialBills = [
  {
    id: 1,
    billNo: 'BILL-001',
    customerName: 'Rajesh Kumar',
    mobile: '+91 98765 43210',
    items: 'Paneer Tikka, Dal Makhani, Roti x4',
    paymentMode: 'UPI',
    amount: 724.50,
    date: '2025-10-10',
    time: '14:30',
    status: 'paid',
    itemDetails: [
      { name: 'Paneer Tikka', qty: 2, price: 400 },
      { name: 'Dal Makhani', qty: 1, price: 250 },
      { name: 'Roti', qty: 4, price: 40 }
    ],
    subtotal: 690,
    cgst: 17.25,
    sgst: 17.25,
    discount: 0
  },
  {
    id: 2,
    billNo: 'BILL-002',
    customerName: 'Priya Sharma',
    mobile: '+91 87654 32109',
    items: 'Veg Biryani, Raita, Gulab Jamun',
    paymentMode: 'Cash',
    amount: 450,
    date: '2025-10-10',
    time: '13:15',
    status: 'paid',
    itemDetails: [
      { name: 'Veg Biryani', qty: 1, price: 280 },
      { name: 'Raita', qty: 1, price: 80 },
      { name: 'Gulab Jamun', qty: 2, price: 80 }
    ],
    subtotal: 440,
    cgst: 5,
    sgst: 5,
    discount: 0
  },
  {
    id: 3,
    billNo: 'BILL-003',
    customerName: 'Amit Patel',
    mobile: '+91 76543 21098',
    items: 'Masala Dosa, Coffee x2, Idli',
    paymentMode: 'Card',
    amount: 320,
    date: '2025-10-10',
    time: '12:45',
    status: 'paid',
    itemDetails: [
      { name: 'Masala Dosa', qty: 1, price: 120 },
      { name: 'Coffee', qty: 2, price: 100 },
      { name: 'Idli', qty: 2, price: 80 }
    ],
    subtotal: 300,
    cgst: 10,
    sgst: 10,
    discount: 0
  },
  {
    id: 4,
    billNo: 'BILL-004',
    customerName: 'Sneha Desai',
    mobile: '+91 65432 10987',
    items: 'Butter Chicken, Naan, Lassi',
    paymentMode: 'Split',
    amount: 890,
    date: '2025-10-10',
    time: '19:20',
    status: 'cancelled',
    itemDetails: [
      { name: 'Butter Chicken', qty: 2, price: 600 },
      { name: 'Naan', qty: 3, price: 90 },
      { name: 'Lassi', qty: 2, price: 120 }
    ],
    subtotal: 810,
    cgst: 40,
    sgst: 40,
    discount: 0
  },
  {
    id: 5,
    billNo: 'BILL-005',
    customerName: 'Vikram Singh',
    mobile: '+91 54321 09876',
    items: 'Chicken Biryani, Raita, Salad',
    paymentMode: 'UPI',
    amount: 550,
    date: '2025-10-10',
    time: '18:00',
    status: 'paid',
    itemDetails: [
      { name: 'Chicken Biryani', qty: 1, price: 350 },
      { name: 'Raita', qty: 1, price: 80 },
      { name: 'Salad', qty: 1, price: 50 }
    ],
    subtotal: 480,
    cgst: 35,
    sgst: 35,
    discount: 0
  }
];

export default function BillingPage() {
  const [bills] = useState(initialBills);
  const [viewModal, setViewModal] = useState(null);

  const getPaymentIcon = (mode) => {
    switch(mode) {
      case 'Cash': return <Banknote className="w-4 h-4" />;
      case 'UPI': return <Smartphone className="w-4 h-4" />;
      case 'Card': return <CreditCard className="w-4 h-4" />;
      case 'Split': return <span className="text-sm">⚡</span>;
      default: return null;
    }
  };

  const handlePrint = (bill) => {
    alert(`Printing bill ${bill.billNo}...`);
  };

  return (
    <div className="min-vh-100  p-4">
      <div className="container">
        <div className="card">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead className="table-light border-bottom">
                <tr>
                  <th className="px-4 py-3 text-start small fw-semibold text-secondary">Bill No</th>
                  <th className="px-4 py-3 text-start small fw-semibold text-secondary">Customer</th>
                  <th className="px-4 py-3 text-start small fw-semibold text-secondary">Mobile</th>
                  <th className="px-4 py-3 text-start small fw-semibold text-secondary">Items</th>
                  <th className="px-4 py-3 text-start small fw-semibold text-secondary">Payment</th>
                  <th className="px-4 py-3 text-start small fw-semibold text-secondary">Amount</th>
                  <th className="px-4 py-3 text-start small fw-semibold text-secondary">Date & Time</th>
                  <th className="px-4 py-3 text-start small fw-semibold text-secondary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill) => (
                  <tr 
                    key={bill.id} 
                    className={bill.status === 'cancelled' ? 'table-light' : ''}
                  >
                    <td className="px-4 py-4 small fw-medium text-dark">
                      {bill.billNo}
                      {bill.status === 'cancelled' && (
                        <div className="text-xs text-danger fw-medium mt-1">CANCELLED</div>
                      )}
                    </td>
                    <td className="px-4 py-4 small text-secondary">{bill.customerName}</td>
                    <td className="px-4 py-4 small text-muted">{bill.mobile}</td>
                    <td className="px-4 py-4 small text-secondary">{bill.items}</td>
                    <td className="px-4 py-4">
                      <div className="d-flex align-items-center gap-2 small text-secondary">
                        {getPaymentIcon(bill.paymentMode)}
                        <span>{bill.paymentMode}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 small fw-bold text-dark">
                      ₹{bill.amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="small text-secondary">{bill.date}</div>
                      <div className="small text-muted mt-1">{bill.time}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="d-flex align-items-center gap-3">
                        <button
                          onClick={() => setViewModal(bill)}
                          className="btn btn-link p-0 text-primary"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handlePrint(bill)}
                          className="btn btn-link p-0 text-success"
                          title="Print"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        {bill.status !== 'cancelled' && (
                          <button
                            className="btn btn-link p-0 text-danger"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* View Modal */}
      {viewModal && (
        <>
          <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
            <div className="modal-dialog modal-lg modal-dialog-scrollable">
              <div className="modal-content">
                <div className="modal-header border-bottom">
                  <h2 className="modal-title h4 fw-bold text-dark">Bill Details</h2>
                  <button
                    type="button"
                    onClick={() => setViewModal(null)}
                    className="btn-close"
                    data-bs-dismiss="modal"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="modal-body p-4">
                  <div className="row g-3 pb-4 mb-4 border-bottom">
                    <div className="col-md-6">
                      <p className="small text-muted mb-1">Bill No</p>
                      <p className="fw-semibold text-dark">{viewModal.billNo}</p>
                    </div>
                    <div className="col-md-6">
                      <p className="small text-muted mb-1">Date & Time</p>
                      <p className="fw-semibold text-dark">{viewModal.date} {viewModal.time}</p>
                    </div>
                    <div className="col-md-6">
                      <p className="small text-muted mb-1">Customer</p>
                      <p className="fw-semibold text-dark">{viewModal.customerName}</p>
                    </div>
                    <div className="col-md-6">
                      <p className="small text-muted mb-1">Mobile</p>
                      <p className="fw-semibold text-dark">{viewModal.mobile}</p>
                    </div>
                    <div className="col-md-6">
                      <p className="small text-muted mb-1">Payment Mode</p>
                      <p className="fw-semibold text-dark d-flex align-items-center gap-2">
                        {getPaymentIcon(viewModal.paymentMode)}
                        {viewModal.paymentMode}
                      </p>
                    </div>
                    <div className="col-md-6">
                      
                      <p className="small text-muted mb-1">Status</p>
                      <p className={`fw-semibold ${viewModal.status === 'cancelled' ? 'text-danger' : 'text-success'}`}>
                        {viewModal.status.toUpperCase()}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h3 className="h5 fw-bold text-dark mb-3">Ordered Items</h3>
                    <div className="table-responsive">
                      <table className="table table-sm">
                        <thead className="table-light">
                          <tr>
                            <th className="px-3 py-2 text-start small fw-semibold text-secondary">Item</th>
                            <th className="px-3 py-2 text-center small fw-semibold text-secondary">Qty</th>
                            <th className="px-3 py-2 text-end small fw-semibold text-secondary">Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {viewModal.itemDetails.map((item, idx) => (
                            <tr key={idx}>
                              <td className="px-3 py-2 small text-secondary">{item.name}</td>
                              <td className="px-3 py-2 small text-secondary text-center">{item.qty}</td>
                              <td className="px-3 py-2 small fw-medium text-dark text-end">₹{item.price}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-light rounded p-3 mb-4">
                    <div className="d-flex justify-content-between small mb-1">
                      <span className="text-muted">Subtotal</span>
                      <span className="fw-medium text-dark">₹{viewModal.subtotal}</span>
                    </div>
                    <div className="d-flex justify-content-between small mb-1">
                      <span className="text-muted">CGST (2.5%)</span>
                      <span className="fw-medium text-dark">₹{viewModal.cgst}</span>
                    </div>
                    <div className="d-flex justify-content-between small mb-1">
                      <span className="text-muted">SGST (2.5%)</span>
                      <span className="fw-medium text-dark">₹{viewModal.sgst}</span>
                    </div>
                    <div className="pt-2 mt-2 border-top border-secondary-subtle d-flex justify-content-between">
                      <span className="fw-bold text-dark">Grand Total</span>
                      <span className="fw-bold fs-4 text-dark">₹{viewModal.amount.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="d-flex gap-3">
                    <button
                      onClick={() => handlePrint(viewModal)}
                      className="flex-fill d-flex align-items-center justify-content-center gap-2 px-4 py-3 btn btn-primary"
                    >
                      <Printer className="w-4 h-4" />
                      Print Bill
                    </button>
                    <button
                      onClick={() => setViewModal(null)}
                      className="px-4 py-3 btn btn-outline-secondary"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Backdrop */}
          {viewModal && <div className="modal-backdrop fade show" onClick={() => setViewModal(null)}></div>}
        </>
      )}
    </div>
  );
}