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
import {
  fetchKitchenCategory,
  fetchItemGroup,
  fetchTableDepartment,
  KitchenCategoryItem,
  ItemGroupItem,
  TableDepartmentItem
} from '../../../utils/commonfunction';



const KitchenAllocationReport = () => {
  const [activeTab, setActiveTab] = useState<TabType>('current');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [filterValue, setFilterValue] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRange>({
    fromDate: null,
    toDate: null
  });
  const [filterOptions, setFilterOptions] = useState<FilterOption[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const today = new Date();
  const todayString = today.toISOString().split('T')[0];
  const [kitchenCategories, setKitchenCategories] = useState<KitchenCategoryItem[]>([]);
  const [itemGroups, setItemGroups] = useState<ItemGroupItem[]>([]);
  const [tableDepartments, setTableDepartments] = useState<TableDepartmentItem[]>([]);
  const [data] = useState<KitchenAllocationItem[]>([]);

  
  useEffect(() => {
    const fetchData = async () => {
      await fetchKitchenCategory(setKitchenCategories, (id: number) => {});
      await fetchItemGroup(setItemGroups, (id: number) => {});
      await fetchTableDepartment(setTableDepartments, (id: number) => {});
     
    };
    fetchData();
  }, []);
  useEffect(() => {
    const options: FilterOption[] = [];
    
    if (selectedFilter === 'all') {
      options.push({ value: 'all', label: 'All Items', type: 'all' });
    } else if (selectedFilter === 'kitchen-category') {
      options.push(...kitchenCategories.map(cat => ({
        value: cat.Kitchen_Category,
        label: cat.Kitchen_Category,
        type: 'kitchen-category'
      })));
    } else if (selectedFilter === 'item-group') {
      options.push(...itemGroups.map(group => ({
        value: group.itemgroupname,
        label: group.itemgroupname,
        type: 'item-group'
      })));
    } else if (selectedFilter === 'table-department') {
     // Show only department names
      if (Array.isArray(tableDepartments)) {
        const departmentOptions = tableDepartments.map(dept => ({
          value: dept.department_name,
          label: dept.department_name,
          type: 'table-department' as const
        }));
        options.push(...departmentOptions);
      }
    }
    
    setFilterOptions(options);
    if (options.length > 0) {
      setFilterValue(options[0].value);
    }
}, [selectedFilter, kitchenCategories, itemGroups, tableDepartments]);

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
           filtered = filtered.filter(item => item.department === filterValue);
          break;
      }
    }
 // Apply search filter for 'all' items
    if (selectedFilter === 'all' && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(item =>
        item.itemName.toLowerCase().includes(query) ||
        item.itemNo.toLowerCase().includes(query)
      );
    }
    return filtered;
  }, [data, activeTab, dateRange, selectedFilter, filterValue, searchQuery, todayString]);

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
    <div className="container-fluid p-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
        <div className="mb-3 mb-md-0">
          <h1 className="h4 fw-bold text-dark mb-1">Kitchen Allocation Report</h1>
          <p className="text-muted small mb-0">Track kitchen item allocations and usage</p>
        </div>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-outline-secondary btn-sm d-flex align-items-center"
            onClick={handlePrint}
          >
            <i className="bi bi-printer me-2"></i> Print
          </button>
          <button 
            className="btn btn-outline-danger btn-sm d-flex align-items-center"
            onClick={handleExportPDF}
          >
            <i className="bi bi-file-pdf me-2"></i> PDF
          </button>
          <button 
            className="btn btn-outline-success btn-sm d-flex align-items-center"
            onClick={handleExportExcel}
          >
            <i className="bi bi-file-excel me-2"></i> Excel
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-2">
          <div className="d-flex">
            <button
              className={`btn btn-sm ${activeTab === 'current' ? 'btn-primary' : 'btn-outline-primary'} me-2 d-flex align-items-center`}
              onClick={() => setActiveTab('current')}
            >
              <i className="bi bi-calendar-day me-2"></i>
              Today's Allocation
            </button>
            <button
              className={`btn btn-sm ${activeTab === 'backdated' ? 'btn-primary' : 'btn-outline-primary'} d-flex align-items-center`}
              onClick={() => setActiveTab('backdated')}
            >
              <i className="bi bi-calendar-range me-2"></i>
              Backdated Report
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3">
          <div className="row g-2">
            {activeTab === 'backdated' && (
              <>
                <div className="col-12 col-md-3">
                  <label className="form-label small fw-semibold">From Date</label>
                  <DatePicker
                    selected={dateRange.fromDate}
                    onChange={(date: Date | null) =>
                      setDateRange(prev => ({ ...prev, fromDate: date }))
                    }
                    className="form-control form-control-sm border"
                    dateFormat="dd/MM/yyyy"
                    isClearable
                    placeholderText="Select from date"
                  />
                </div>
                <div className="col-12 col-md-3">
                  <label className="form-label small fw-semibold">To Date</label>
                  <DatePicker
                    selected={dateRange.toDate}
                    onChange={(date: Date | null) =>
                      setDateRange(prev => ({ ...prev, toDate: date }))
                    }
                    className="form-control form-control-sm border"
                    dateFormat="dd/MM/yyyy"
                    isClearable
                    minDate={dateRange.fromDate || undefined}
                    placeholderText="Select to date"
                  />
                </div>
              </>
            )}
            <div className={activeTab === 'backdated' ? 'col-12 col-md-3' : 'col-12 col-md-4'}>
              <label className="form-label small fw-semibold">Filter By</label>
              <select
                className="form-select form-select-sm border"
                value={selectedFilter}
                 onChange={(e) => {
                  const newFilter = e.target.value as FilterType;
                  setSelectedFilter(newFilter);
                  if (newFilter !== 'all') {
                    setSearchQuery('');
                  }
                }}
              >
                <option value="all">All Items</option>
                <option value="kitchen-category">Kitchen Category</option>
                <option value="item-group">Item Group</option>
                <option value="table-department">Department</option>
              </select>
            </div>
             {selectedFilter === 'all' && (
              <div className={activeTab === 'backdated' ? 'col-12 col-md-3' : 'col-12 col-md-4'}>
                <label className="form-label small fw-semibold">Search Items</label>
                <div className="input-group input-group-sm">
                  <span className="input-group-text"><i className="bi bi-search"></i></span>
                  <input
                    type="text"
                    className="form-control border"
                    placeholder="Search by name or item no..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            )}
            {selectedFilter !== 'all' && (
              <div className={activeTab === 'backdated' ? 'col-12 col-md-3' : 'col-12 col-md-4'}>
                <label className="form-label small fw-semibold">
                  {selectedFilter === 'kitchen-category'
                    ? 'Select Category'
                    : selectedFilter === 'item-group'
                    ? 'Select Group'
                    : 'Select Table/Dept'}
                </label>
                <select
                  className="form-select form-select-sm border"
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

    

      {/* Data Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="border-0 ps-4 fw-semibold text-secondary">Item No</th>
                  <th className="border-0 fw-semibold text-secondary">Item Name</th>
                  <th className="border-0 text-end fw-semibold text-secondary">Quantity</th>
                  <th className="border-0 text-end fw-semibold text-secondary">Amount</th>
                 
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="text-center py-5">
                      <div className="d-flex justify-content-center">
                        <div className="spinner-border spinner-border-sm text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </div>
                      <p className="mt-2 text-muted small">Loading data...</p>
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-5">
                      <div className="text-muted">
                        <i className="bi bi-inbox fs-1 opacity-50"></i>
                        <p className="mt-3">No allocation data found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => (
                    <tr key={item.id} className="border-bottom">

                      <td className="ps-4">
                        
                        <div className="small text-muted">
                          <span className="badge bg-light text-dark me-2">{item.itemNo}</span>
                          {item.tableNo} • {item.department}
                        </div>
                      </td>
                      <td className="ps-4">
                        <div className="fw-semibold">{item.itemName}</div>
                        <div className="small text-muted">
                          <span className="badge bg-light text-dark me-2">{item.itemNo}</span>
                          {item.tableNo} • {item.department}
                        </div>
                      </td>
                      <td className="text-end align-middle">
                        <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-1 rounded-pill">
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
                    <td className="text-end fw-bold">₹{totals.totalAmount.toLocaleString('en-IN')}</td>
                    <td className="pe-4"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 text-center">
        <small className="text-muted">
          <i className="bi bi-info-circle me-1"></i>
          Report generated on {new Date().toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </small>
      </div>
    </div>
  );
};

export default KitchenAllocationReport;