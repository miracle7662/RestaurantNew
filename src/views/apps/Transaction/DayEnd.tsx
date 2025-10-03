import React, { useState } from "react";
import { Download, CheckCircle, AlertTriangle } from "lucide-react";

interface Order {
  id: number;
  table: string;
  kot: string;
  waiter: string;
  items: number;
  amount: number;
  status: "Pending" | "Settled";
}

const DayEnd: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([
    { id: 1, table: "T1", kot: "KOT001", waiter: "Amit", items: 3, amount: 540, status: "Pending" },
    { id: 2, table: "T2", kot: "KOT002", waiter: "Suresh", items: 2, amount: 320, status: "Settled" },
    { id: 3, table: "T3", kot: "KOT003", waiter: "Rahul", items: 5, amount: 1200, status: "Pending" },
  ]);

  const [dayEndConfirmed, setDayEndConfirmed] = useState(false);

  const handleConfirmDayEnd = () => {
    const hasPending = orders.some(o => o.status === "Pending");
    if (hasPending) {
      alert("⚠️ Cannot perform Day End. Please settle all pending orders first.");
      return;
    }
    setDayEndConfirmed(true);
    alert("✅ Day End Completed Successfully!");
  };

  const handleSettleOrder = (id: number) => {
    setOrders(prev =>
      prev.map(o => (o.id === id ? { ...o, status: "Settled" } : o))
    );
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <h1 className="text-2xl font-bold mb-6 text-gray-800">📅 Day End Summary</h1>

      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white shadow rounded-xl p-4 text-center">
          <p className="text-gray-500">Total Sales</p>
          <h2 className="text-xl font-bold text-green-600">₹ 2,060</h2>
        </div>
        <div className="bg-white shadow rounded-xl p-4 text-center">
          <p className="text-gray-500">Total Tax</p>
          <h2 className="text-xl font-bold text-blue-600">₹ 260</h2>
        </div>
        <div className="bg-white shadow rounded-xl p-4 text-center">
          <p className="text-gray-500">Discounts</p>
          <h2 className="text-xl font-bold text-red-600">₹ 120</h2>
        </div>
        <div className="bg-white shadow rounded-xl p-4 text-center">
          <p className="text-gray-500">Pending Orders</p>
          <h2 className="text-xl font-bold text-yellow-600">
            {orders.filter(o => o.status === "Pending").length}
          </h2>
        </div>
      </div>

      {/* Pending Orders Table */}
      <div className="bg-white shadow rounded-xl p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Pending / Unsettled Orders</h2>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">Table</th>
              <th className="p-2 border">KOT No</th>
              <th className="p-2 border">Waiter</th>
              <th className="p-2 border">Items</th>
              <th className="p-2 border">Amount</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="p-2 border">{order.table}</td>
                <td className="p-2 border">{order.kot}</td>
                <td className="p-2 border">{order.waiter}</td>
                <td className="p-2 border">{order.items}</td>
                <td className="p-2 border">₹ {order.amount}</td>
                <td className="p-2 border">
                  {order.status === "Settled" ? (
                    <span className="text-green-600 font-medium">Settled</span>
                  ) : (
                    <span className="text-red-600 font-medium">Pending</span>
                  )}
                </td>
                <td className="p-2 border">
                  {order.status === "Pending" && (
                    <button
                      onClick={() => handleSettleOrder(order.id)}
                      className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                    >
                      Settle
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Day End Actions */}
      <div className="flex flex-wrap gap-4">
        <button
          onClick={handleConfirmDayEnd}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white ${
            dayEndConfirmed ? "bg-gray-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
          }`}
          disabled={dayEndConfirmed}
        >
          <CheckCircle size={18} /> {dayEndConfirmed ? "Day End Completed" : "Confirm Day End"}
        </button>

        <button
          onClick={() => alert("📄 Downloading Sales Report...")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
        >
          <Download size={18} /> Export Report
        </button>

        <button
          onClick={() => alert("⚠️ Day End cancelled")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
        >
          <AlertTriangle size={18} /> Cancel
        </button>
      </div>
    </div>
  );
};

export default DayEnd;
