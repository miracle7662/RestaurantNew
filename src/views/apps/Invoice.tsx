import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Save, X } from 'lucide-react';

export default function POSTransferScreen() {
  const [transferMode, setTransferMode] = useState('allKOTs');
  const [fixedItems, setFixedItems] = useState(false);
  const [transferredItems, setTransferredItems] = useState(false);
  
  const [selectedTable, setSelectedTable] = useState({
    table: 'C4',
    outlet: 'Classic Veg',
    kot: '24',
    pax: '1',
    date: '19-10-10',
    items: [
      { media: 'C4', kotNo: 24, item: 'Masala Uttappa', qty: 1 },
      { media: 'C4', kotNo: 24, item: 'Rose Lassi', qty: 1 },
      { media: 'C4', kotNo: 24, item: 'Cheese Chilly Toast', qty: 1 }
    ],
    total: 130.00,
    variance: 0.00,
    change: 0.00
  });

  const [proposedTable, setProposedTable] = useState({
    table: 'C1',
    outlet: 'Classic Veg',
    pax: '',
    date: '19/Oct/2010',
    items: [],
    total: 0.00,
    variance: 0.00,
    change: 0.00
  });

  const transferRight = () => {
    if (selectedTable.items.length > 0) {
      setProposedTable({
        ...proposedTable,
        items: [...proposedTable.items, ...selectedTable.items],
        total: selectedTable.total,
        variance: selectedTable.total,
        change: -selectedTable.total
      });
      setSelectedTable({
        ...selectedTable,
        items: [],
        total: 0.00,
        variance: selectedTable.total,
        change: selectedTable.total
      });
    }
  };

  const transferLeft = () => {
    if (proposedTable.items.length > 0) {
      setSelectedTable({
        ...selectedTable,
        items: [...selectedTable.items, ...proposedTable.items],
        total: proposedTable.total,
        variance: proposedTable.total,
        change: proposedTable.total
      });
      setProposedTable({
        ...proposedTable,
        items: [],
        total: 0.00,
        variance: 0.00,
        change: 0.00
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setTransferMode('allKOTs')}
                className={`px-6 py-2 rounded-md font-semibold transition-all ${
                  transferMode === 'allKOTs'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Selected Table (All KOTs)
              </button>
              <button
                onClick={() => setTransferMode('kotOnly')}
                className={`px-6 py-2 rounded-md font-semibold transition-all ${
                  transferMode === 'kotOnly'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Selected KOT Only
              </button>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">
              {transferMode === 'allKOTs' ? 'TRANSFER TABLE' : "TRANSFER KOT'S"}
            </h1>
            <div className="w-48"></div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-[1fr_auto_1fr] gap-4">
          {/* Left Panel - Selected Table */}
          <div className="bg-white rounded-lg shadow-md p-5">
            <h2 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2">Selected Table</h2>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Table:</label>
                <select value={selectedTable.table} onChange={(e) => setSelectedTable({...selectedTable, table: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500">
                  <option>C4</option>
                  <option>C1</option>
                  <option>C2</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Outlet:</label>
                <select value={selectedTable.outlet} onChange={(e) => setSelectedTable({...selectedTable, outlet: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500">
                  <option>Classic Veg</option>
                  <option>Premium Veg</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">KOT:</label>
                <select value={selectedTable.kot} onChange={(e) => setSelectedTable({...selectedTable, kot: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500">
                  <option>24</option>
                  <option>25</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Pax:</label>
                  <input type="text" value={selectedTable.pax} onChange={(e) => setSelectedTable({...selectedTable, pax: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Date:</label>
                  <input type="text" value={selectedTable.date} onChange={(e) => setSelectedTable({...selectedTable, date: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500" />
                </div>
              </div>
            </div>

            <div className="border border-gray-300 rounded overflow-hidden mb-3">
              <table className="w-full">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="px-3 py-2 text-left text-sm font-bold text-gray-700">Media</th>
                    <th className="px-3 py-2 text-left text-sm font-bold text-gray-700">KOT No</th>
                    <th className="px-3 py-2 text-left text-sm font-bold text-gray-700">Item</th>
                    <th className="px-3 py-2 text-right text-sm font-bold text-gray-700">Qty</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {selectedTable.items.length > 0 ? (
                    selectedTable.items.map((item, idx) => (
                      <tr key={idx} className="border-t border-gray-200 hover:bg-gray-50">
                        <td className="px-3 py-2 text-sm">{item.media}</td>
                        <td className="px-3 py-2 text-sm">{item.kotNo}</td>
                        <td className="px-3 py-2 text-sm">{item.item}</td>
                        <td className="px-3 py-2 text-sm text-right">{item.qty}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-3 py-12 text-center text-gray-400 text-sm">No items</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex gap-2 mb-3">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={fixedItems} onChange={(e) => setFixedItems(e.target.checked)} className="w-4 h-4" />
                <span>Fixed Items</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={transferredItems} onChange={(e) => setTransferredItems(e.target.checked)} className="w-4 h-4" />
                <span>Transferred Tables' / KOT's Item</span>
              </label>
            </div>

            <div className="grid grid-cols-3 gap-2 border-t pt-3">
              <div>
                <div className="text-xs font-semibold text-gray-600 mb-1">Total Amount</div>
                <div className={`text-lg font-bold ${selectedTable.total > 0 ? 'text-red-600' : 'text-gray-800'}`}>
                  {selectedTable.total.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-600 mb-1">Variance</div>
                <div className={`text-lg font-bold ${selectedTable.variance > 0 ? 'text-red-600' : 'text-gray-800'}`}>
                  {selectedTable.variance.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-600 mb-1">Change Amount</div>
                <div className={`text-lg font-bold ${selectedTable.change > 0 ? 'text-red-600' : 'text-gray-800'}`}>
                  {selectedTable.change.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Middle - Transfer Buttons */}
          <div className="flex flex-col justify-center gap-4">
            <button
              onClick={transferRight}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg p-4 shadow-lg hover:shadow-xl transition-all flex flex-col items-center justify-center gap-2"
            >
              <ArrowRight size={32} />
              <span className="text-xs font-semibold">F7</span>
            </button>
            <button
              onClick={transferLeft}
              className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-lg p-4 shadow-lg hover:shadow-xl transition-all flex flex-col items-center justify-center gap-2"
            >
              <ArrowLeft size={32} />
              <span className="text-xs font-semibold">F8</span>
            </button>
          </div>

          {/* Right Panel - Proposed Table */}
          <div className="bg-white rounded-lg shadow-md p-5">
            <h2 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2">Proposed Table</h2>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Outlet:</label>
                <select value={proposedTable.outlet} onChange={(e) => setProposedTable({...proposedTable, outlet: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500">
                  <option>Classic Veg</option>
                  <option>Premium Veg</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Table:</label>
                <select value={proposedTable.table} onChange={(e) => setProposedTable({...proposedTable, table: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500">
                  <option>C1</option>
                  <option>C2</option>
                  <option>C4</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Date:</label>
                <input type="text" value={proposedTable.date} onChange={(e) => setProposedTable({...proposedTable, date: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Pax:</label>
                  <input type="text" value={proposedTable.pax} onChange={(e) => setProposedTable({...proposedTable, pax: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1"></label>
                  <input type="text" className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500" />
                </div>
              </div>
            </div>

            <div className="border border-gray-300 rounded overflow-hidden mb-3">
              <table className="w-full">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="px-3 py-2 text-left text-sm font-bold text-gray-700">Media</th>
                    <th className="px-3 py-2 text-left text-sm font-bold text-gray-700">KOT No</th>
                    <th className="px-3 py-2 text-left text-sm font-bold text-gray-700">Item</th>
                    <th className="px-3 py-2 text-right text-sm font-bold text-gray-700">Qty</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {proposedTable.items.length > 0 ? (
                    proposedTable.items.map((item, idx) => (
                      <tr key={idx} className="border-t border-gray-200 hover:bg-gray-50">
                        <td className="px-3 py-2 text-sm">{item.media}</td>
                        <td className="px-3 py-2 text-sm">{item.kotNo}</td>
                        <td className="px-3 py-2 text-sm">{item.item}</td>
                        <td className="px-3 py-2 text-sm text-right">{item.qty}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-3 py-12 text-center text-gray-400 text-sm">No items</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="h-8 mb-3"></div>

            <div className="grid grid-cols-3 gap-2 border-t pt-3">
              <div>
                <div className="text-xs font-semibold text-gray-600 mb-1">Total Amount</div>
                <div className={`text-lg font-bold ${proposedTable.total > 0 ? 'text-red-600' : 'text-gray-800'}`}>
                  {proposedTable.total.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-600 mb-1">Variance</div>
                <div className={`text-lg font-bold ${proposedTable.variance > 0 ? 'text-red-600' : 'text-gray-800'}`}>
                  {proposedTable.variance.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-600 mb-1">Change Amount</div>
                <div className={`text-lg font-bold ${proposedTable.change < 0 ? 'text-red-600' : 'text-gray-800'}`}>
                  {proposedTable.change.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-end gap-3 mt-4">
          <button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-3 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2 font-semibold">
            <Save size={20} />
            Save (F9)
          </button>
          <button className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-8 py-3 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2 font-semibold">
            <X size={20} />
            Exit (Esc)
          </button>
        </div>
      </div>
    </div>
  );
}