import React, { useState, useEffect, Dispatch, SetStateAction, useRef, useMemo, useCallback } from 'react';
import { Row, Col, Card, Modal, Offcanvas, Table } from 'react-bootstrap';
import { fetchMenu, MenuItem } from '@/utils/commonfunction';
import CustomerModal from './Customers';
// import { settleBill } from '@/common/api/orders';

// Interface for menu items used in state
interface MenuItemState {
  id: number;
  name: string;
  price: number;
  qty: number;
  isBilled: number;
  isNCKOT: number;
  NCName: string;
  NCPurpose: string;
  isNew?: boolean; // Added to track new items not yet sent to KOT
}

// Interface for card items (aligned with Menu.tsx)
interface CardItem {
  userId: string;
  itemCode: string;
  ItemName: string;
  shortName: string;
  price: number;
  cardStatus: string;
  item_group_id: number | null;
}

// Interface for table items (from Orders.tsx)
interface TableItem {
  tablemanagementid: string;
  table_name: string;
  hotel_name: string;
  outlet_name: string;
  status: number;
  created_by_id: string;
  created_date: string;
  updated_by_id: string;
  updated_date: string;
  outletid: string;
  hotelid: string;
  marketid: string;
  isActive: boolean;
  isCommonToAllDepartments: boolean;
  departmentid?: number;
  tableid?: string;
}

// Interface for component props
interface OrderDetailsProps {
  tableId?: string | null;
  onChangeTable?: () => void;
  items: MenuItemState[];
  setItems: Dispatch<SetStateAction<MenuItemState[]>>;
  setSelectedTable: Dispatch<SetStateAction<string | null>>;
  invalidTable: string;
  setInvalidTable: Dispatch<SetStateAction<string>>;
  filteredTables: TableItem[];
  setSelectedDeptId: Dispatch<SetStateAction<number | null>>;
  setSelectedOutletId: Dispatch<SetStateAction<number | null>>;
  focusMode: boolean;
  setFocusMode: Dispatch<SetStateAction<boolean>>;
  triggerFocus: number;
  refreshItemsForTable: (tableIdNum: number) => Promise<void>;
}
  

const OrderDetails: React.FC<OrderDetailsProps> = ({
  tableId,
  onChangeTable,
  items,
  setItems,
  setSelectedTable,
  invalidTable,
  setInvalidTable,
  filteredTables,
  setSelectedDeptId,
  setSelectedOutletId,
  focusMode,
  setFocusMode,
  triggerFocus,
  refreshItemsForTable,
}) => {
  const [searchTable, setSearchTable] = useState<string>(tableId || '');
  const [searchCode, setSearchCode] = useState<string>('');
  const [searchName, setSearchName] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');
  const [filteredItems, setFilteredItems] = useState<CardItem[]>([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [hasTyped, setHasTyped] = useState<boolean>(false);
  const [isTableInvalid, setIsTableInvalid] = useState<boolean>(false);
  const [cardItems, setCardItems] = useState<CardItem[]>([]);
  const [showNameDropdown, setShowNameDropdown] = useState<boolean>(false);
  const [selectedNameIndex, setSelectedNameIndex] = useState(-1);
  const [showCustomerModal, setShowCustomerModal] = useState<boolean>(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [selectedItemGroup, setSelectedItemGroup] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]); // State for sidebar menu items

  const tableInputRef = useRef<HTMLInputElement>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const quantityInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (triggerFocus > 0 && tableInputRef.current) {
      // When KOT is saved with Focus Mode ON, clear the table search and focus it.
      setSearchTable('');
      tableInputRef.current.focus();
      tableInputRef.current.select();
    }
  }, [triggerFocus]);

  // Global key event listener for F4, F5, F6
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'f4') {
        e.preventDefault();
        tableInputRef.current?.focus();
        tableInputRef.current?.select();
      } else if (key === 'f5') {
        e.preventDefault();
        codeInputRef.current?.focus();
        codeInputRef.current?.select();
      } else if (key === 'f6') {
        e.preventDefault();
        nameInputRef.current?.focus();
        nameInputRef.current?.select();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Sync searchTable state with tableId prop
  useEffect(() => {
    setSearchTable(tableId || '');
  }, [tableId]);

  // Derive valid tables from filteredTables
  const validTables = useMemo(
    () =>
      filteredTables
        .filter((table) => table && table.table_name)
        .map((table) => table.table_name),
    [filteredTables]
  );

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Validate table input
  useEffect(() => {
    if (searchTable) {
      setHasTyped(true);
      const matchedTable = filteredTables.find(
        (table) => table.table_name.toLowerCase() === searchTable.toLowerCase()
      );
      if (matchedTable) {
        setSelectedTable(searchTable);
        // setItems([]); // This was clearing items fetched by the parent component.
        setInvalidTable('');
        setIsTableInvalid(false);
        // Set selectedDeptId and selectedOutletId for tax calculation
        setSelectedDeptId(Number(matchedTable.departmentid));
        setSelectedOutletId(Number(matchedTable.outletid));

        const tableIdNum = Number(matchedTable.tableid ?? matchedTable.tablemanagementid);
        if (tableIdNum) {
          refreshItemsForTable(tableIdNum);
        }
      } else {
        setInvalidTable(searchTable);
        setIsTableInvalid(true);
        setItems([]);
      }
    } else if (hasTyped) {
      setSelectedTable(null);
      setInvalidTable('');
      setIsTableInvalid(false);
      setHasTyped(false);
      setItems([]);
    }
  }, [searchTable, setSelectedTable, setInvalidTable, hasTyped, validTables, filteredTables, setSelectedDeptId, setSelectedOutletId, refreshItemsForTable, setItems]);

  // Fetch menu items for sidebar and card items
  const fetchMenuItems = async (hotelid?: number, outletid?: number) => {
    try {
      setLoading(true);
      setError(null);

      let url = 'http://localhost:3001/api/menu';
      const params: string[] = [];

      if (hotelid) params.push(`hotelid=${hotelid}`);
      if (outletid) params.push(`outletid=${outletid}`);

      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch menu items');
      const data = await res.json();
      console.log('Fetched menu items:', data);
      setMenuItems(data);

      // Map fetched menu items to card items
      const mappedItems: CardItem[] = data
        .filter((item: MenuItem) => item.status === 1)
        .map((item: MenuItem) => ({
          userId: String(item.menuid),
          itemCode: String(item.item_no),
          ItemName: item.item_name,
          shortName: item.short_name || '',
          price: item.price || 0,
          item_group_id: item.item_group_id,
          cardStatus: item.status === 1 ? '✅ Available' : '❌ Unavailable',
        }));
      setCardItems(mappedItems);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch menu items');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch menu and item groups
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        await fetchMenuItems(); // Fetch menu items for sidebar
        await fetchMenu(
          (data: MenuItem[]) => {
            const mappedItems: CardItem[] = data
              .filter((item) => item.status === 1)
              .map((item) => ({
                userId: String(item.menuid),
                itemCode: String(item.item_no),
                ItemName: item.item_name,
                shortName: item.short_name || '',
                price: item.price || 0,
                item_group_id: item.item_group_id,
                cardStatus: item.status === 1 ? '✅ Available' : '❌ Unavailable',
              }));
            setCardItems(mappedItems);
          },
          () => { }
        );
      } catch (error) {
        console.error('Fetch error:', error);
        setCardItems([]);
        setError('Failed to fetch menu items');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Categorize items dynamically based on item groups
  const itemCategories = useMemo(() => {
    const categories: { [key: string]: CardItem[] } = { All: cardItems };
    menuItems.forEach((item) => {
      if (item.item_group_id !== null && item.groupname) {
        const groupName = item.groupname;
        if (!categories[groupName]) {
          categories[groupName] = [];
        }
        const cardItem = cardItems.find((ci) => ci.userId === String(item.menuid));
        if (cardItem) {
          categories[groupName].push(cardItem);
        }
      }
    });
    return categories;
  }, [cardItems, menuItems]);

  const allItems: CardItem[] = cardItems;

  // Toggle category dropdown (no longer needed for static categories)
  const toggleDropdown = (groupName: string) => {
    setSelectedItemGroup(
      menuItems.find((item) => item.groupname === groupName)?.item_group_id || null
    );
    setShowSidebar(false);
  };

  // Filter items based on search and selected item group
  const filterItems = useCallback(() => {
    const baseItems = selectedItemGroup !== null
      ? cardItems.filter(item => item.item_group_id === selectedItemGroup)
      : allItems;
    return baseItems.filter((item) => {
      const matchesCode = searchCode
        ? item.itemCode.toLowerCase().includes(searchCode.toLowerCase())
        : true;
      const matchesName = searchName
        ? item.ItemName.toLowerCase().includes(searchName.toLowerCase()) ||
        item.shortName.toLowerCase().includes(searchName.toLowerCase())
        : true;
      return matchesCode && matchesName;
    });
  }, [searchCode, searchName, allItems, selectedItemGroup]);

  // Filter dropdown items for code or name
  const filterDropdownItems = useCallback(
    (type: 'code' | 'name') => {
      const baseItems = selectedItemGroup !== null
        ? cardItems.filter(item => item.item_group_id === selectedItemGroup)
        : allItems;
      return baseItems
        .filter((item) => {
          if (type === 'code') {
            return searchCode
              ? item.itemCode.toLowerCase().includes(searchCode.toLowerCase())
              : false;
          }
          return searchName
            ? item.ItemName.toLowerCase().includes(searchName.toLowerCase()) ||
            item.shortName.toLowerCase().includes(searchName.toLowerCase())
            : false;
        })
        .slice(0, 7);
    },
    [searchCode, searchName, allItems, selectedItemGroup]
  );

  useEffect(() => {
    setFilteredItems(filterItems());
  }, [filterItems]);

  // Handle input changes
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value;
    setSearchCode(code);
    const matchedItem = cardItems.find((item) => item.itemCode.toLowerCase() === code.toLowerCase());
    if (matchedItem) {
      setSearchName(matchedItem.ItemName);
    } else {
      setSearchName('');
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchName(value);
    setShowNameDropdown(!!value);
    setSelectedNameIndex(-1);
    if (value === '') {
      setSearchCode('');
    } else {
      const matchedItem = allItems.find(
        (item) =>
          item.ItemName.toLowerCase() === value.toLowerCase() ||
          item.shortName.toLowerCase() === value.toLowerCase()
      );
      if (matchedItem) {
        setSearchCode(matchedItem.itemCode);
      }
    }
  };

  // Handle item selection
  const handleCodeSelect = (item: CardItem) => {
    setSearchCode(item.itemCode);
    setSearchName(item.ItemName);
    setShowNameDropdown(false);
    setSelectedNameIndex(-1);
    if (quantityInputRef.current) {
      quantityInputRef.current.focus();
      quantityInputRef.current.select();
    }
  };

  const handleNameSelect = (item: CardItem) => {
    setSearchName(item.ItemName);
    setSearchCode(item.itemCode);
    setShowNameDropdown(false);
    setSelectedNameIndex(-1);
    if (quantityInputRef.current) {
      quantityInputRef.current.focus();
      quantityInputRef.current.select();
    }
  };

  // Handle keyboard events
  const handleCodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const matchedItem = cardItems.find((item) => item.itemCode.toLowerCase() === searchCode.toLowerCase());
      if (matchedItem) {
        handleCodeSelect(matchedItem);
      }
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const dropdownItems = filterDropdownItems('name');
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (showNameDropdown && dropdownItems.length > 0) {
        setSelectedNameIndex((prev) => (prev < dropdownItems.length - 1 ? prev + 1 : prev));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (showNameDropdown && dropdownItems.length > 0) {
        setSelectedNameIndex((prev) => (prev > 0 ? prev - 1 : -1));
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedNameIndex >= 0 && showNameDropdown) {
        const selectedItem = dropdownItems[selectedNameIndex];
        if (selectedItem) {
          handleNameSelect(selectedItem);
        }
      } else if (searchName) {
        const matchedItem = cardItems.find(
          (item) =>
            item.ItemName.toLowerCase() === searchName.toLowerCase() ||
            item.shortName.toLowerCase() === searchName.toLowerCase()
        );
        if (matchedItem) {
          handleNameSelect(matchedItem);
        }
      }
    } else if (e.key === 'Escape') {
      setShowNameDropdown(false);
      setSelectedNameIndex(-1);
    }
  };

  const handleQuantityKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && (searchName || searchCode)) {
      e.preventDefault();
      const matchedItem = cardItems.find(
        (item) =>
          item.ItemName.toLowerCase() === searchName.toLowerCase() ||
          item.itemCode.toLowerCase() === searchCode.toLowerCase()
      );
      if (matchedItem) {
        const qty = parseInt(quantity) || 1;
        handleAddItem({ id: Number(matchedItem.userId), name: matchedItem.ItemName, price: matchedItem.price, isBilled: 0, isNCKOT: 0, NCName: '', NCPurpose: '' }, qty);
        setSearchCode('');
        setSearchName('');
        setQuantity('1');
        setShowNameDropdown(false);
        setSelectedNameIndex(-1);
        if (codeInputRef.current) {
          codeInputRef.current.focus();
        }
      }
    }
  };

  // Add item to order
  const handleAddItem = (newItem: Omit<MenuItemState, 'qty'>, qty: number = 1) => {
    // Always find and update quantity for existing new items, regardless of view mode.
    setItems((prevItems) => {
      const existingNewItemIndex = prevItems.findIndex(
        (item) => item.id === newItem.id && item.isNew
      );

      if (existingNewItemIndex > -1) {
        const updatedItems = [...prevItems];
        const existingItem = updatedItems[existingNewItemIndex];
        updatedItems[existingNewItemIndex] = {
          ...existingItem,
          qty: existingItem.qty + qty,
        };
        return updatedItems;
      } else {
        return [...prevItems, { ...newItem, qty, isNew: true }];
      }
    });
  };

  // Delete all items
  const handleDeleteAll = () => {
    setItems([]);
  };

  // Handle customer modal
  const handleShowCustomerModal = () => setShowCustomerModal(true);
  const handleCloseCustomerModal = () => setShowCustomerModal(false);

  // Optional: billing trigger here if this component hosts a Billing action later
  // const handleBilling = async (billId?: number, total?: number) => {
  //   if (!billId || !total) return;
  //   try {
  //     await settleBill(billId, [{ PaymentType: 'Cash', Amount: total }]);
  //   } catch (err) {}
  // };

  return (
    <div className="container-fluid vh-100 d-flex flex-column p-0">
      <div className="row flex-grow-1">
        <div className="col-12 d-flex flex-column">
          <div className="row">
            <div className="col-12 p-2 border-bottom w-100">
              <nav className="navbar navbar-expand-lg navbar-light">
                <div className="container-fluid m-0 p-0">
                  <button
                    className="navbar-toggler"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#navbarNav"
                    aria-controls="navbarNav"
                    aria-expanded="false"
                    aria-label="Toggle navigation"
                  >
                    <span className="navbar-toggler-icon"></span>
                  </button>
                  <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                      <li className="nav-item">
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => setShowSidebar(true)}
                        >
                          Show Item Groups
                        </button>
                      </li>
                    </ul>
                    <ul className="navbar-nav mx-auto mb-2 mb-lg-0 d-flex gap-2">
                      <li className="nav-item">
                        <button className="btn btn-sm btn-outline-secondary" onClick={onChangeTable}>
                          Change Table
                        </button>
                      </li>
                      <li className="nav-item">
                        <button className="btn btn-sm btn-outline-secondary" onClick={handleShowCustomerModal}>
                          Add Customer
                        </button>
                      </li>
                      <li className="nav-item">
                        <button className="btn btn-sm btn-outline-secondary">Refresh</button>
                      </li>
                      <li className="nav-item d-flex align-items-center ms-2">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            role="switch"
                            id="focusModeSwitch"
                            checked={focusMode}
                            onChange={(e) => setFocusMode(e.target.checked)}
                          />
                          <label className="form-check-label small" htmlFor="focusModeSwitch">
                            Focus Mode
                          </label>
                        </div>
                      </li>
                    </ul>
                    <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
                      <li className="nav-item">
                        <a className="nav-link" href="#" aria-label="Search">
                          <i className="bi bi-search" style={{ fontSize: '1.5rem' }}></i>
                        </a>
                      </li>
                      <li className="nav-item">
                        <a className="nav-link" href="#" aria-label="User">
                          <i className="bi bi-person" style={{ fontSize: '1.5rem' }}></i>
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              </nav>
            </div>
          </div>

          <div className="row">
            <div className="col-12 p-2 border-bottom w-100" style={{ backgroundColor: 'transparent' }}>
              <style>
                {`
                  .no-hover:hover, .no-hover input:hover, .no-hover button:hover {
                    background-color: inherit !important;
                    border-color: rgba(65, 149, 246, 1) !important;
                    box-shadow: none !important;
                    transform: none !important;
                  }
                  .rounded-search {
                    border-radius: 20px !important;
                    overflow: hidden;
                    position: relative;
                  }
                  .rounded-search .form-control {
                    border-radius: 20px !important;
                    background-color: #f4f4f4;
                    border: 1px solid #ced4da;
                    padding: 0.5rem;
                    fontSize: 0.875rem;
                    width: 150px;
                    height: 32px;
                    box-sizing: border-box;
                  }
                  .rounded-button {
                    border-radius: 20px !important;
                  }
                  .dropdown-menu {
                    width: 100%;
                    max-height: 200px;
                    overflow-y: auto;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
                  }
                  .dropdown-item {
                    font-size: 0.875rem;
                    padding: 0.5rem 1rem;
                  }
                  .dropdown-item:hover, .dropdown-item.selected {
                    background-color: #e9ecef;
                  }
                  @media (max-width: 768px) {
                    .search-row {
                      flex-wrap: nowrap;
                      overflow-x: auto;
                      padding-bottom: 8px;
                    }
                    .search-row .input-group {
                      min-width: 120px;
                      margin-right: 8px;
                    }
                    .search-row .btn {
                      white-space: nowrap;
                    }
                    .rounded-search .form-control {
                      width: 120px;
                    }
                    .dropdown-menu {
                      width: 120px;
                    }
                  }
                `}
              </style>
              <div className="d-flex flex-nowrap justify-content-start gap-1 no-hover search-row align-items-start">
                <div style={{ maxWidth: '100px', minHeight: '38px' }}>
                  <div className="input-group rounded-search">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Table"
                      value={searchTable}
                      onChange={(e) => setSearchTable(e.target.value)}
                      ref={tableInputRef}
                      style={{
                        maxWidth: '100px',
                        minHeight: '60px',
                        fontSize: '1.2rem',
                        border: '2px solid #4A90E2',
                        backgroundColor: '#E6F3FA',
                      }}
                    />
                  </div>
                  {isTableInvalid && (
                    <div className="text-danger small text-center mt-1">Invalid Table</div>
                  )}
                </div>
                <div className="input-group rounded-search" style={{ maxWidth: '100px', position: 'relative' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Code"
                    value={searchCode}
                    onChange={handleCodeChange}
                    onKeyDown={handleCodeKeyDown}
                    ref={codeInputRef}
                    style={{ maxWidth: '100px', minHeight: '48px' }}
                  />
                </div>
                <div style={{ position: 'relative', width: '100%', maxWidth: '500px' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search Name"
                    value={searchName}
                    onChange={handleNameChange}
                    onKeyDown={handleNameKeyDown}
                    autoComplete="off"
                    onFocus={() => setShowNameDropdown(true)}
                    onBlur={(e) => {
                      const relatedTarget = e.relatedTarget as HTMLElement;
                      if (!relatedTarget?.closest('.dropdown-item')) {
                        setTimeout(() => {
                          setShowNameDropdown(false);
                          setSelectedNameIndex(-1);
                        }, 100);
                      }
                    }}
                    ref={nameInputRef}
                    style={{
                      borderRadius: '20px',
                      height: '48px',
                      padding: '10px 16px',
                      fontSize: '16px',
                      border: '1px solid #ced4da',
                    }}
                  />
                  {showNameDropdown && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        zIndex: 1000,
                        backgroundColor: '#fff',
                        border: '1px solid #ced4da',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                        maxHeight: '200px',
                        overflowY: 'auto',
                        width: '100%',
                      }}
                    >
                      {filterDropdownItems('name')
                        .filter((item) => item.ItemName !== searchName)
                        .slice(0, 7)
                        .map((item, index) => (
                          <div
                            key={item.userId}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleNameSelect(item);
                            }}
                            className={`dropdown-item ${index === selectedNameIndex ? 'selected' : ''}`}
                            style={{
                              cursor: 'pointer',
                              fontSize: '1rem',
                              backgroundColor: index === selectedNameIndex ? '#e9ecef' : 'transparent',
                            }}
                            onMouseEnter={() => setSelectedNameIndex(index)}
                          >
                            <strong>{item.ItemName}</strong> | {item.shortName} | {item.itemCode} | ₹{item.price.toFixed(2)}
                          </div>
                        ))}
                      {filterDropdownItems('name').length === 0 && (
                        <div className="dropdown-item text-muted">No matches found</div>
                      )}
                    </div>
                  )}
                </div>
                <div className="input-group rounded-search" style={{ maxWidth: '100px' }}>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Qty"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    onKeyPress={handleQuantityKeyPress}
                    min="1"
                    ref={quantityInputRef}
                    style={{ maxWidth: '100px', minHeight: '48px' }}
                  />
                </div>
                <button
                  className="btn btn-sm btn-outline-danger rounded-button px-2"
                  onClick={handleDeleteAll}
                  style={{ minWidth: '80px', height: '48px' }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>

          <div className="d-flex flex-column flex-lg-row flex-grow-1">
            <Offcanvas
              show={showSidebar}
              onHide={() => setShowSidebar(false)}
              responsive="lg"
              placement="start"
              className="bg-white shadow-sm border-end"
              style={{ width: '210px', minWidth: '210px', maxWidth: '210px', overflowY: 'auto' }}
            >
              <Offcanvas.Header closeButton className="border-bottom">
                <Offcanvas.Title as="h6" className="fw-bold mb-0">Item Groups</Offcanvas.Title>
              </Offcanvas.Header>
              <Offcanvas.Body className="p-3" style={{ overflowY: 'auto', overflowX: 'hidden' }}>
                {loading ? (
                  <p className="text-muted">Loading item groups...</p>
                ) : error ? (
                  <p className="text-muted">Error: {error}</p>
                ) : menuItems.length === 0 ? (
                  <p className="text-muted">No item groups available.</p>
                ) : (
                  <Table striped bordered hover size="sm" style={{ marginBottom: 0, tableLayout: 'fixed', width: '100%' }}>
                    <thead>
                      <tr>
                        <th style={{ width: '100%', padding: '8px', backgroundColor: '#f8f9fa', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Item Group</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        style={{ backgroundColor: !cardItems.length ? '#e9ecef' : 'transparent', color: '#2d3748' }}
                        onClick={() => {
                          setSelectedItemGroup(null);
                          setShowSidebar(false);
                        }}
                      >
                        <td style={{ padding: '8px', verticalAlign: 'middle', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>All</td>
                      </tr>
                      {Array.from(new Set(menuItems
                        .filter((item) => item.item_group_id !== null)
                        .map(item => item.item_group_id as number)))
                        .map(groupId => {
                          const groupItems = menuItems.filter(item => item.item_group_id === groupId);
                          const groupName = groupItems[0].groupname || `Group ${groupId}`;
                          return (
                            <tr
                              key={groupId}
                              style={{ backgroundColor: 'transparent', color: '#2d3748' }}
                              onClick={() => {
                                setSelectedItemGroup(groupId);
                                setShowSidebar(false);
                              }}
                            >
                              <td style={{ padding: '8px', verticalAlign: 'middle', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {groupName}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </Table>
                )}
              </Offcanvas.Body>
            </Offcanvas>

            <div className={`p-3 ${isMobile ? 'col-12' : 'col-12 col-lg-9'}`} style={{ backgroundColor: 'transparent' }}>
              <div className="flex-grow-1 p-3">
                <div style={{ maxHeight: 'calc(100vh - 260px)', overflowY: 'auto', paddingRight: '10px' }}>
                  <Row xs={1} sm={2} md={3} lg={4} className="g-3">
                    {filteredItems.length > 0 ? (
                      filteredItems.map((item, index) => (
                        <Col key={index}>
                          <Card
                            className="shadow-sm border-0 h-100"
                            style={{
                              borderRadius: '12px',
                              transition: 'transform 0.2s, box-shadow 0.2s',
                              minHeight: '120px',
                            }}
                            onClick={() => handleAddItem({ id: Number(item.userId), name: item.ItemName, price: item.price, isBilled: 0, isNCKOT: 0, NCName: '', NCPurpose: '' }, parseInt(quantity) || 1)}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-4px)';
                              e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
                            }}
                          >
                            <Card.Body className="d-flex flex-column p-2 p-md-3">
                              <Card.Title
                                className="mb-1"
                                style={{ fontSize: '14px', fontWeight: '600', color: '#1a202c' }}
                              >
                                {item.ItemName}
                              </Card.Title>
                              <Card.Text style={{ fontSize: '12px', color: '#6b7280' }}>
                                {item.itemCode} | {item.shortName}
                              </Card.Text>
                              <Card.Text style={{ fontSize: '12px', color: '#6b7280' }}>
                                ₹{item.price.toFixed(2)}
                              </Card.Text>
                              <Card.Text style={{ fontSize: '12px', color: '#6b7280' }}>
                                {item.cardStatus}
                              </Card.Text>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))
                    ) : (
                      <Col>
                        <p className="text-center">No items found</p>
                      </Col>
                    )}
                  </Row>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        show={showCustomerModal}
        onHide={handleCloseCustomerModal}
        size="lg"
        aria-labelledby="customer-modal-title"
        centered
        backdrop="static"
        keyboard={false}
        dialogClassName="compact-modal"
      >
        <Modal.Header closeButton style={{ padding: '0.5rem', margin: 0 }} />
        <Modal.Body style={{ padding: '0px', maxHeight: '780px', overflowY: 'auto' }}>
          <CustomerModal />
        </Modal.Body>
        <Modal.Footer style={{ padding: '0.5rem', margin: 0 }}>
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={handleCloseCustomerModal}
            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
          >
            Close
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};


export default OrderDetails;