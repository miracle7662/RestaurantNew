import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Search, Calendar, Users, Receipt, Save, X, ChevronDown, Filter, RefreshCw } from 'lucide-react';

export default function ModernKOTTransfer() {
  const [sourceTable, setSourceTable] = useState('C4');
  const [sourceKOT, setSourceKOT] = useState('24');
  const [destTable, setDestTable] = useState('C1');
  const [sourcePax, setSourcePax] = useState('2');
  const [destPax, setDestPax] = useState('3');
  const [selectedItems, setSelectedItems] = useState([]);
  
  const sourceItems = [
    { id: 24, name: 'Masala Uttappa', qty: 1, price: 120, category: 'Main Course' },
    { id: 24, name: 'Rose Lassi', qty: 1, price: 80, category: 'Beverages' },
    { id: 24, name: 'Cheese Chilly Toast', qty: 1, price: 95, category: 'Starters' }
  ];
  
  const destItems = [
    { id: 21, name: 'Tomato Uttappa', qty: 1, price: 110, category: 'Main Course' },
    { id: 21, name: 'Alu Palak', qty: 1, price: 135, category: 'Main Course' }
  ];

  const toggleItemSelection = (item) => {
    setSelectedItems(prev => 
      prev.some(selected => selected.name === item.name) 
        ? prev.filter(selected => selected.name !== item.name)
        : [...prev, item]
    );
  };

  const calculateTotal = (items) => items.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const sourceTotal = calculateTotal(sourceItems);
  const destTotal = calculateTotal(destItems);
  const variance = sourceTotal - destTotal;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-6 mb-6 backdrop-blur-sm bg-white/95">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <Receipt className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800 mb-1">KOT Transfer</h1>
                <p className="text-slate-500 flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                  Manage table and KOT transfers efficiently
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-emerald-700 font-medium text-sm">OCCUPIED</span>
              </div>
              <button className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-all duration-200 hover:shadow-lg border border-slate-200/60">
                Exit (Esc)
              </button>
            </div>
          </div>
        </div>

        {/* Main Transfer Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Source Table - Enhanced */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-6 transition-all duration-300 hover:shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md">
                  <Receipt className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">Source Table</h2>
                  <p className="text-sm text-slate-500">Select items to transfer</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <RefreshCw className="w-4 h-4 text-slate-600" />
                </button>
                <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <Filter className="w-4 h-4 text-slate-600" />
                </button>
              </div>
            </div>

            {/* Table Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Table</label>
                <div className="relative">
                  <select 
                    value={sourceTable}
                    onChange={(e) => setSourceTable(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none"
                  >
                    <option>C4</option>
                    <option>C1</option>
                    <option>C2</option>
                    <option>C3</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Outlet</label>
                <div className="relative">
                  <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none">
                    <option>Classic Veg</option>
                    <option>Classic Non-Veg</option>
                    <option>Bar</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">KOT Number</label>
                <div className="relative">
                  <select 
                    value={sourceKOT}
                    onChange={(e) => setSourceKOT(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none"
                  >
                    <option>24</option>
                    <option>21</option>
                    <option>25</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Pax</label>
                <input 
                  type="number"
                  value={sourcePax}
                  onChange={(e) => setSourcePax(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Date</label>
                <div className="relative">
                  <input 
                    type="text"
                    value="19/Oct/2024"
                    readOnly
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600"
                  />
                  <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 transform -translate-y-1/2" />
                </div>
              </div>
            </div>

            {/* Items List */}
            <div className="bg-gradient-to-br from-blue-50/50 to-slate-50 rounded-xl p-4 border border-slate-200/60 mb-4">
              <div className="grid grid-cols-12 gap-3 text-sm font-semibold text-slate-600 mb-3 pb-3 border-b border-slate-300/60">
                <div className="col-span-1"></div>
                <div className="col-span-2">Table</div>
                <div className="col-span-2">KOT No.</div>
                <div className="col-span-5">Item</div>
                <div className="col-span-2 text-right">Qty</div>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                {sourceItems.map((item, idx) => (
                  <div 
                    key={idx}
                    onClick={() => toggleItemSelection(item)}
                    className={`grid grid-cols-12 gap-3 text-sm p-3 rounded-xl transition-all duration-200 cursor-pointer ${
                      selectedItems.some(selected => selected.name === item.name)
                        ? 'bg-blue-50 border border-blue-200 shadow-sm'
                        : 'bg-white hover:bg-slate-50 hover:shadow-md'
                    }`}
                  >
                    <div className="col-span-1 flex items-center">
                      <div className={`w-4 h-4 rounded border-2 transition-all ${
                        selectedItems.some(selected => selected.name === item.name)
                          ? 'bg-blue-500 border-blue-500'
                          : 'bg-white border-slate-300'
                      }`}></div>
                    </div>
                    <div className="col-span-2 text-slate-600 font-medium">{sourceTable}</div>
                    <div className="col-span-2 text-slate-800 font-semibold">{item.id}</div>
                    <div className="col-span-5">
                      <div className="text-slate-800">{item.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{item.category}</div>
                    </div>
                    <div className="col-span-2 text-right text-slate-800 font-semibold">{item.qty}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-sm opacity-90 mb-1">Total Amount</div>
                  <div className="text-lg font-bold">₹{sourceTotal}</div>
                </div>
                <div>
                  <div className="text-sm opacity-90 mb-1">Variance</div>
                  <div className="text-lg font-bold">₹{variance}</div>
                </div>
                <div>
                  <div className="text-sm opacity-90 mb-1">Selected Items</div>
                  <div className="text-lg font-bold">{selectedItems.length}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Destination Table - Enhanced */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-6 transition-all duration-300 hover:shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg shadow-md">
                  <Receipt className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">Destination Table</h2>
                  <p className="text-sm text-slate-500">Transfer items here</p>
                </div>
              </div>
              <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                <span className="text-emerald-700 font-medium text-sm">AVAILABLE</span>
              </div>
            </div>

            {/* Table Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Outlet</label>
                <div className="relative">
                  <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all appearance-none">
                    <option>Classic Veg</option>
                    <option>Classic Non-Veg</option>
                    <option>Bar</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Table</label>
                <div className="relative">
                  <select 
                    value={destTable}
                    onChange={(e) => setDestTable(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all appearance-none"
                  >
                    <option>C1</option>
                    <option>C2</option>
                    <option>C3</option>
                    <option>C4</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Date</label>
                <div className="relative">
                  <input 
                    type="text"
                    value="19/Oct/2024"
                    readOnly
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600"
                  />
                  <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 transform -translate-y-1/2" />
                </div>
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="block text-sm font-medium text-slate-700">Pax</label>
                <input 
                  type="number"
                  value={destPax}
                  onChange={(e) => setDestPax(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  min="1"
                />
              </div>
            </div>

            {/* Items List */}
            <div className="bg-gradient-to-br from-emerald-50/50 to-slate-50 rounded-xl p-4 border border-slate-200/60 mb-4">
              <div className="grid grid-cols-12 gap-3 text-sm font-semibold text-slate-600 mb-3 pb-3 border-b border-slate-300/60">
                <div className="col-span-2">Table</div>
                <div className="col-span-2">KOT No.</div>
                <div className="col-span-6">Item</div>
                <div className="col-span-2 text-right">Qty</div>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                {destItems.map((item, idx) => (
                  <div 
                    key={idx}
                    className="grid grid-cols-12 gap-3 text-sm bg-white p-3 rounded-xl hover:shadow-md transition-all duration-200"
                  >
                    <div className="col-span-2 text-slate-600 font-medium">{destTable}</div>
                    <div className="col-span-2 text-slate-800 font-semibold">{item.id}</div>
                    <div className="col-span-6">
                      <div className="text-slate-800">{item.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{item.category}</div>
                    </div>
                    <div className="col-span-2 text-right text-slate-800 font-semibold">{item.qty}</div>
                  </div>
                ))}
                {selectedItems.map((item, idx) => (
                  <div 
                    key={`selected-${idx}`}
                    className="grid grid-cols-12 gap-3 text-sm bg-emerald-50 border border-emerald-200 p-3 rounded-xl shadow-sm transition-all duration-200"
                  >
                    <div className="col-span-2 text-emerald-700 font-medium">{destTable}</div>
                    <div className="col-span-2 text-emerald-800 font-semibold">New</div>
                    <div className="col-span-6">
                      <div className="text-emerald-800">{item.name}</div>
                      <div className="text-xs text-emerald-600 mt-0.5">{item.category}</div>
                    </div>
                    <div className="col-span-2 text-right text-emerald-800 font-semibold">{item.qty}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl p-4 text-white">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-sm opacity-90 mb-1">Total Amount</div>
                  <div className="text-lg font-bold">₹{destTotal + calculateTotal(selectedItems)}</div>
                </div>
                <div>
                  <div className="text-sm opacity-90 mb-1">Variance</div>
                  <div className="text-lg font-bold">₹{variance}</div>
                </div>
                <div>
                  <div className="text-sm opacity-90 mb-1">Items Count</div>
                  <div className="text-lg font-bold">{destItems.length + selectedItems.length}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Transfer Controls */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-6 mb-6">
          <div className="flex items-center justify-center gap-6">
            <button className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-2xl font-semibold transition-all duration-300 flex items-center gap-3 shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 transform hover:-translate-y-0.5">
              <ArrowRight className="w-5 h-5" />
              Transfer Selected Items (F7)
            </button>
            <button className="px-8 py-4 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white rounded-2xl font-semibold transition-all duration-300 flex items-center gap-3 shadow-lg shadow-slate-200 hover:shadow-xl hover:shadow-slate-300 transform hover:-translate-y-0.5">
              <ArrowLeft className="w-5 h-5" />
              Return Items (F8)
            </button>
          </div>
        </div>

        {/* Enhanced Legend & Actions */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-white border-2 border-slate-400 rounded-lg shadow-sm"></div>
                <span className="text-sm font-medium text-slate-700">Fixed Items</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-emerald-100 border-2 border-emerald-400 rounded-lg shadow-sm"></div>
                <span className="text-sm font-medium text-slate-700">Transferred Items</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-blue-100 border-2 border-blue-500 rounded-lg shadow-sm"></div>
                <span className="text-sm font-medium text-slate-700">Selected Items</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-300 transform hover:-translate-y-0.5">
                <Save className="w-5 h-5" />
                Save Transfer (F9)
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Bottom Action Bar */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl shadow-xl p-4 border border-slate-700/60">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            {[
              { label: 'KOT Tr (F2)', active: true },
              { label: 'Rev Bill (F5)', active: true },
              { label: 'TBL Tr (F7)', active: true },
              { label: 'New Bill (F6)', active: true },
              { label: 'Rev KOT (F8)', active: true },
              { label: 'K O T (F9)', active: false },
              { label: 'Print (F10)', active: true },
              { label: 'Settle (F11)', active: true },
            ].map((action, index) => (
              <button 
                key={index}
                className={`px-4 py-2.5 rounded-xl font-medium transition-all duration-200 flex-1 min-w-[100px] text-center ${
                  action.active 
                    ? 'bg-slate-700 hover:bg-slate-600 text-white hover:shadow-lg' 
                    : 'bg-slate-800 text-slate-400 cursor-not-allowed'
                }`}
                disabled={!action.active}
              >
                {action.label}
              </button>
            ))}
            <button className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-all duration-200 flex-1 min-w-[100px] text-center hover:shadow-lg hover:shadow-red-500/20">
              Exit (Esc)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}