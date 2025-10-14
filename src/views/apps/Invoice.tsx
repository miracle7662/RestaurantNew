import React, { useState } from "react";
import { Button } from "react-bootstrap";
import { Plus, Minus } from "lucide-react";

const OrderPanel = () => {
  // Example data (replace with your real order logic)
  const [items, setItems] = useState([
    { id: 1, name: "Paneer", qty: 1, amount: 567.0 },
    { id: 2, name: "Paneer Tikka", qty: 1, amount: 560.0 },
    { id: 3, name: "Chicken Fry", qty: 1, amount: 460.0 },
    { id: 4, name: "Paneer Masala", qty: 1, amount: 470.0 },
    { id: 5, name: "Chicken Handi", qty: 1, amount: 860.0 },
    { id: 6, name: "Veg Biryani", qty: 1, amount: 360.0 },
    { id: 7, name: "Paneer Roll", qty: 3, amount: 560.0 },
    { id: 8, name: "Butter Roti", qty: 2, amount: 40.0 },
    { id: 9, name: "Dal Tadka", qty: 1, amount: 380.0 },
    { id: 10, name: "Jeera Rice", qty: 1, amount: 420.0 },
    { id: 11, name: "Cold Drink", qty: 2, amount: 160.0 },
    { id: 12, name: "Gulab Jamun", qty: 2, amount: 220.0 },
    { id: 13, name: "Soup", qty: 1, amount: 210.0 },
    { id: 14, name: "Salad", qty: 1, amount: 180.0 },
    { id: 15, name: "Ice Cream", qty: 1, amount: 240.0 },
    { id: 16, name: "Extra Item", qty: 1, amount: 250.0 },
  ]);

  const increment = (id: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, qty: item.qty + 1 } : item
      )
    );
  };

  const decrement = (id: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id && item.qty > 1
          ? { ...item, qty: item.qty - 1 }
          : item
      )
    );
  };

  const grandTotal = items.reduce(
    (sum, item) => sum + item.qty * item.amount,
    0
  );

  return (
    <div className="order-panel-container">
      {/* Sticky Header Tabs */}
      <div className="billing-header">
        <div className="tabs d-flex gap-2">
          <Button size="sm" variant="primary">
            Dine-in
          </Button>
          <Button size="sm" variant="outline-secondary">
            Pickup
          </Button>
          <Button size="sm" variant="outline-secondary">
            Delivery
          </Button>
          <Button size="sm" variant="outline-secondary">
            Quick Bill
          </Button>
          <Button size="sm" variant="outline-secondary">
            Order/KOT
          </Button>
          <Button size="sm" variant="outline-secondary">
            Billing
          </Button>
        </div>
        <div className="text-muted small fw-bold mt-2">
          KOT 1, Table F3
        </div>
      </div>

      {/* Item List Header (Sticky) */}
      <div className="item-list-header">
        <div className="row text-center fw-semibold border-bottom py-1">
          <div className="col-6">Item Name</div>
          <div className="col-3">Qty</div>
          <div className="col-3">Amount</div>
        </div>
      </div>

      {/* Scrollable Item List */}
      <div className="item-list-container">
        {items.map((item) => (
          <div
            key={item.id}
            className="row align-items-center text-center py-1 item-row"
          >
            <div className="col-6 text-start">{item.name}</div>
            <div className="col-3 d-flex justify-content-center align-items-center gap-2">
              <Button
                size="sm"
                variant="danger"
                className="btn-sm"
                onClick={() => decrement(item.id)}
              >
                <Minus size={14} />
              </Button>
              <span className="fw-bold">{item.qty}</span>
              <Button
                size="sm"
                variant="success"
                className="btn-sm"
                onClick={() => increment(item.id)}
              >
                <Plus size={14} />
              </Button>
            </div>
            <div className="col-3 fw-semibold">
              {(item.amount * item.qty).toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      {/* Customer Info */}
      <div className="customer-section mt-2 d-flex gap-2">
        <input
          type="text"
          placeholder="Mobile No"
          className="form-control form-control-sm"
        />
        <input
          type="text"
          placeholder="Customer Name"
          className="form-control form-control-sm"
        />
      </div>

      <div className="kot-note mt-2">
        <input
          type="text"
          placeholder="KOT Note"
          className="form-control form-control-sm"
        />
      </div>

      {/* Sticky Footer */}
      <div className="billing-footer mt-2">
        <Button variant="dark" className="fw-semibold px-4 py-2">
          Print & Save KOT
        </Button>
        <div className="grand-total-box">
          <span className="fw-bold text-success fs-5">
            Grand Total: ₹{grandTotal.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Styles */}
      <style jsx>{`
        .order-panel-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: #fff;
          padding: 8px;
        }

        .billing-header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: #fff;
          border-bottom: 1px solid #dee2e6;
          padding-bottom: 4px;
        }

        .item-list-header {
          position: sticky;
          top: 58px;
          background: #f8f9fa;
          z-index: 99;
        }

        .item-list-container {
          flex-grow: 1;
          overflow-y: auto;
          max-height: 460px;
          border: 1px solid #dee2e6;
          border-radius: 12px;
          background-color: #f9fafb;
          margin-top: 4px;
        }

        .item-row:nth-child(odd) {
          background-color: #ffffff;
        }
        .item-row:nth-child(even) {
          background-color: #f1f3f5;
        }

        .item-row {
          font-size: 0.9rem;
          min-height: 38px;
        }

        .billing-footer {
          position: sticky;
          bottom: 0;
          z-index: 100;
          background-color: #fff;
          padding: 10px 12px;
          border-top: 1px solid #dee2e6;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-radius: 10px;
        }

        .grand-total-box {
          background: #d4edda;
          padding: 6px 14px;
          border-radius: 6px;
        }

        @media (max-width: 768px) {
          .billing-footer {
            flex-direction: column;
            gap: 6px;
            align-items: stretch;
          }
        }
      `}</style>
    </div>
  );
};

export default OrderPanel;
