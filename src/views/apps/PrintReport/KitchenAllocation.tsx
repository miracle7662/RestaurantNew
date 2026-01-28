// KitchenAllocationReport.tsx
import React, { useState, useEffect, useMemo } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { 
  KitchenAllocationItem, 
  DateRange, 
  FilterType, 
  TabType,
  FilterOption 
} from './types';

// Mock data
const mockData: KitchenAllocationItem[] = [
  { id: '1', itemName: 'Chicken Tikka', itemNo: 'CT-001', quantity: 15, amount: 4500, kitchenCategory: 'Tandoor', itemGroup: 'Appetizers', tableNo: 'T-12', department: 'Main Dining', txnDate: new Date() },
  { id: '2', itemName: 'Butter Chicken', itemNo: 'BC-002', quantity: 8, amount: 3200, kitchenCategory: 'Curry', itemGroup: 'Main Course', tableNo: 'T-05', department: 'Private Room', txnDate: new Date() },
  { id: '3', itemName: 'Garlic Naan', itemNo: 'GN-003', quantity: 25, amount: 2500, kitchenCategory: 'Tandoor', itemGroup: 'Bread', tableNo: 'T-08', department: 'Main Dining', txnDate: new Date() },
  { id: '4', itemName: 'Vegetable Biryani', itemNo: 'VB-004', quantity: 12, amount: 3600, kitchenCategory: 'Rice', itemGroup: 'Main Course', tableNo: 'T-03', department: 'Terrace', txnDate: new Date() },
];

const KitchenAllocationReport: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('current');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [filterValue, setFilterValue] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRange>({
    fromDate: null,
    toDate: null
  });
  const [data, setData] = useState<KitchenAllocationItem[]>(mockData);
  const [filterOptions, setFilterOptions] = useState<FilterOption[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const today = new Date();
  const todayString = today.toISOString().split('T')[0];

  useEffect(() => {
    const options: FilterOption[] = [];
    
    if (selectedFilter === 'all') {
      options.push({ value: 'all', label: 'All Items', type: 'all' });
    } else if (selectedFilter === 'kitchen-category') {
      const categories = Array.from(new Set(data.map(item => item.kitchenCategory).filter(Boolean)));
      options.push(...categories.map(cat => ({
        value: cat!,
        label: cat!,
        type: 'kitchen-category'
      })));
    } else if (selectedFilter === 'item-group') {
      const groups = Array.from(new Set(data.map(item => item.itemGroup).filter(Boolean)));
      options.push(...groups.map(group => ({
        value: group!,
        label: group!,
        type: 'item-group'
      })));
    } else if (selectedFilter === 'table-department') {
      const tableDepts = Array.from(new Set(
        data.map(item => `${item.tableNo} - ${item.department}`).filter(Boolean)
      ));
      options.push(...tableDepts.map(td => ({
        value: td,
        label: td,
        type: 'table-department'
      })));
    }
    
    setFilterOptions(options);
    if (options.length > 0) {
      setFilterValue(options[0].value);
    }
  }, [selectedFilter, data]);

  const filteredData = useMemo(() => {
    let filtered = [...data];

    if (activeTab === 'current') {
      filtered = filtered.filter(item => 
        item.txnDate.toISOString().split('T')[0] === todayString
      );
    } else if (activeTab === 'backdated' && dateRange.fromDate && dateRange.toDate) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.txnDate);
        return itemDate >= dateRange.fromDate! && itemDate <= dateRange.toDate!;
      });
    }

    if (selectedFilter !== 'all' && filterValue) {
      switch (selectedFilter) {
        case 'kitchen-category':
          filtered = filtered.filter(item => item.kitchenCategory === filterValue);
          break;
        case 'item-group':
          filtered = filtered.filter(item => item.itemGroup === filterValue);
          break;
        case 'table-department':
          const [tableNo, department] = filterValue.split(' - ');
          filtered = filtered.filter(item => 
            item.tableNo === tableNo && item.department === department
          );
          break;
      }
    }

    return filtered;
  }, [data, activeTab, dateRange, selectedFilter, filterValue, todayString]);

  const totals = useMemo(() => {
    return filteredData.reduce(
      (acc, item) => ({
        totalQuantity: acc.totalQuantity + item.quantity,
        totalAmount: acc.totalAmount + item.amount
      }),
      { totalQuantity: 0, totalAmount: 0 }
    );
  }, [filteredData]);

  const handleExportPDF = () => {
    alert('PDF export functionality would be implemented here');
  };

  const handleExportExcel = () => {
    alert('Excel export functionality would be implemented here');
  };

  const handlePrint = () => {
    window.print();
  };

  const fetchData = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, selectedFilter, filterValue, dateRange]);

  return (
    <div className="container-fluid p-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 fw-bold text-dark mb-1">Kitchen Allocation Report</h1>
          <p className="text-muted">Track and manage kitchen item allocations</p>
        </div>
        <div className="btn-group">
          <button className="btn btn-light border" onClick={handlePrint}>
            <i className="bi bi-printer me-1"></i> Print
          </button>
          <button className="btn btn-light border" onClick={handleExportPDF}>
            <i className="bi bi-file-pdf text-danger me-1"></i> PDF
          </button>
          <button className="btn btn-light border" onClick={handleExportExcel}>
            <i className="bi bi-file-excel text-success me-1"></i> Excel
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body p-0">
          <div className="nav nav-pills p-3">
            <button
              className={`nav-link ${activeTab === 'current' ? 'active' : ''} me-3`}
              onClick={() => setActiveTab('current')}
            >
              <i className="bi bi-calendar-day me-2"></i>
              Today's Allocation
            </button>
            <button
              className={`nav-link ${activeTab === 'backdated' ? 'active' : ''}`}
              onClick={() => setActiveTab('backdated')}
            >
              <i className="bi bi-calendar-range me-2"></i>
              Backdated Report
            </button>
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0 mb-4">
  <div className="card-body">
    <div className="row g-3 align-items-end">

      {/* From Date */}
      {activeTab === 'backdated' && (
        <div className="col-md-3">
          <label className="form-label small">From Date</label>
          <DatePicker
            selected={dateRange.fromDate}
            onChange={(date: Date | null) =>
              setDateRange(prev => ({ ...prev, fromDate: date }))
            }
            className="form-control form-control-sm"
            dateFormat="dd/MM/yyyy"
            isClearable
          />
        </div>
      )}

      {/* To Date */}
      {activeTab === 'backdated' && (
        <div className="col-md-3">
          <label className="form-label small">To Date</label>
          <DatePicker
            selected={dateRange.toDate}
            onChange={(date: Date | null) =>
              setDateRange(prev => ({ ...prev, toDate: date }))
            }
            className="form-control form-control-sm"
            dateFormat="dd/MM/yyyy"
            isClearable
            minDate={dateRange.fromDate || undefined}
          />
        </div>
      )}

      {/* Filter By */}
      <div className={activeTab === 'backdated' ? 'col-md-3' : 'col-md-4'}>
        <label className="form-label small">Filter By</label>
        <select
          className="form-select form-select-sm"
          value={selectedFilter}
          onChange={(e) =>
            setSelectedFilter(e.target.value as FilterType)
          }
        >
          <option value="all">All Items</option>
          <option value="kitchen-category">Kitchen Category</option>
          <option value="item-group">Item Group</option>
          <option value="table-department">Table / Department</option>
        </select>
      </div>

      {/* Filter Value */}
      {selectedFilter !== 'all' && (
        <div className={activeTab === 'backdated' ? 'col-md-3' : 'col-md-4'}>
          <label className="form-label small">
            {selectedFilter === 'kitchen-category'
              ? 'Kitchen Category'
              : selectedFilter === 'item-group'
              ? 'Item Group'
              : 'Table / Department'}
          </label>
          <select
            className="form-select form-select-sm"
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            disabled={filterOptions.length === 0}
          >
            {filterOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}

    </div>
  </div>
</div>


      {/* Summary Cards */}
      <div className="row mb-4">
        <div className="col-md-4 mb-3">
          <div className="card border-0 bg-light-subtle shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="bg-primary bg-opacity-10 p-3 rounded me-3">
                  <i className="bi bi-box text-primary fs-4"></i>
                </div>
                <div>
                  <h6 className="text-muted mb-1">Total Items</h6>
                  <h3 className="mb-0">{filteredData.length}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-3">
          <div className="card border-0 bg-light-subtle shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="bg-success bg-opacity-10 p-3 rounded me-3">
                  <i className="bi bi-cart-check text-success fs-4"></i>
                </div>
                <div>
                  <h6 className="text-muted mb-1">Total Quantity</h6>
                  <h3 className="mb-0">{totals.totalQuantity}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-3">
          <div className="card border-0 bg-light-subtle shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="bg-info bg-opacity-10 p-3 rounded me-3">
                  <i className="bi bi-currency-rupee text-info fs-4"></i>
                </div>
                <div>
                  <h6 className="text-muted mb-1">Total Amount</h6>
                  <h3 className="mb-0">₹{totals.totalAmount.toLocaleString('en-IN')}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="bg-light">
                <tr>
                   <th className="border-0 ps-4">Item No</th>
                  <th className="border-0 ps-4">Item Name</th>
                  <th className="border-0 text-end">Quantity</th>
                  <th className="border-0 text-end">Amount</th>
                  
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="text-center py-5">
                      <div className="spinner-border spinner-border-sm text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-2 text-muted">Loading data...</p>
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-5">
                      <i className="bi bi-clipboard-x text-muted fs-1"></i>
                      <p className="mt-3 text-muted">No allocation data found</p>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => (
                    <tr key={item.id} className="border-bottom">
                        <td className="ps-4">
                        
                        <div className="small text-muted">
                          <span className="badge bg-light text-dark me-2">{item.itemNo}</span>
                          {item.kitchenCategory}
                        </div>
                      </td>
                      <td className="ps-4">
                        <div className="fw-semibold">{item.itemName}</div>
                        <div className="small text-muted">
                          <span className="badge bg-light text-dark me-2">{item.itemNo}</span>
                          {item.kitchenCategory}
                        </div>
                      </td>
                      <td className="text-end align-middle">
                        <span className="badge bg-primary rounded-pill px-3 py-2">
                          {item.quantity}
                        </span>
                      </td>
                      <td className="text-end align-middle fw-semibold">
                        ₹{item.amount.toLocaleString('en-IN')}
                      </td>
                     
                    </tr>
                  ))
                )}
              </tbody>
              {filteredData.length > 0 && (
                <tfoot className="bg-light">
                  <tr>
                    <td className="ps-4 fw-bold">Totals</td>
                    <td className="text-end fw-bold">{totals.totalQuantity}</td>
                    <td className="text-end fw-bold pe-4">₹{totals.totalAmount.toLocaleString('en-IN')}</td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-4 text-center">
        <small className="text-muted">
          Data last updated: {new Date().toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          })}
        </small>
      </div>
    </div>
  );
};

export default KitchenAllocationReport;