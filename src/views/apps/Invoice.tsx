import React, { useState } from "react";
import axios from "axios";
import { Table, Form, Button, Alert } from "react-bootstrap";

const denominationValues = [2000, 500, 200, 100, 50, 20, 10, 5, 2, 1];

export default function CashDenomination({ orderId, billTotal, onClose }) {
  const [counts, setCounts] = useState({});
  const [message, setMessage] = useState("");

  const handleChange = (value, count) => {
    setCounts({ ...counts, [value]: count });
  };

  const total = Object.entries(counts).reduce(
    (sum, [value, count]) => sum + value * count,
    0
  );

  const difference = total - billTotal;

  const handleSave = async () => {
    const denominations = Object.entries(counts)
      .filter(([value, count]) => count > 0)
      .map(([value, count]) => ({
        value: Number(value),
        count: Number(count),
      }));

    await axios.post("/api/cash-denomination", {
      order_id: orderId,
      denominations,
      created_by: "cashier1", // replace with logged-in user
    });

    setMessage("✅ Cash denomination saved successfully!");
    setTimeout(() => onClose(), 1500);
  };

  return (
    <div className="p-3 bg-light rounded shadow-sm">
      <h5 className="fw-bold mb-3">💵 Cash Denomination</h5>

      {message && <Alert variant="success">{message}</Alert>}

      <Table bordered size="sm" className="text-center align-middle">
        <thead className="table-secondary">
          <tr>
            <th>Denomination (₹)</th>
            <th>Count</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {denominationValues.map((value) => (
            <tr key={value}>
              <td>{value}</td>
              <td>
                <Form.Control
                  type="number"
                  min="0"
                  className="text-center"
                  value={counts[value] || ""}
                  onChange={(e) => handleChange(value, Number(e.target.value))}
                />
              </td>
              <td>{(counts[value] || 0) * value}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="fw-bold bg-secondary text-white">
            <td colSpan={2}>Total Received</td>
            <td>₹{total}</td>
          </tr>
          <tr>
            <td colSpan={2}>Bill Amount</td>
            <td>₹{billTotal}</td>
          </tr>
          <tr>
            <td colSpan={2}>
              {difference > 0
                ? "Change to Return"
                : difference < 0
                ? "Pending Amount"
                : "Exact Amount"}
            </td>
            <td className={difference > 0 ? "text-success" : "text-danger"}>
              ₹{Math.abs(difference)}
            </td>
          </tr>
        </tfoot>
      </Table>

      <div className="text-end">
        <Button variant="primary" onClick={handleSave}>
          Save Denomination
        </Button>
      </div>
    </div>
  );
}
