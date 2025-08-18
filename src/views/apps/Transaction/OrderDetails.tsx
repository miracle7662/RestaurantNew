import React, { useState, useEffect, Dispatch, SetStateAction, useRef, useMemo, useCallback } from 'react';
import { Row, Col, Card, Modal, Form, Button, Table } from 'react-bootstrap';
import { fetchItemGroup, ItemGroupItem, fetchMenu, MenuItem } from '@/utils/commonfunction';

// Interface for menu items used in state
interface MenuItemState {
  id: number;
  name: string;
  price: number;
  qty: number;
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

// Interface for customer data (for the modal)
interface Customer {
  srNo: number;
  name: string;
  countryCode: string;
  mobile: string;
  mail: string;
  city: string;
  address1: string;
  address2: string;
  birthday?: string;
  state?: string;
  pincode?: string;
  gstNo?: string;
  fssai?: string;
  panNo?: string;
  aadharNo?: string;
  anniversary?: string;
  createWallet?: boolean;
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
}

// Define the category keys as a union type
type Category =
  | 'All'
  | 'Appetizers'
  | 'MainCourse'
  | 'Desserts'
  | 'Beverages'
  | 'Cocktails'
  | 'Salads'
  | 'Soups'
  | 'Breakfast'
  | 'VeganOptions';

// Interface for dropdownState
interface DropdownState {
  Appetizers: boolean;
  MainCourse: boolean;
  Desserts: boolean;
  Beverages: boolean;
  Cocktails: boolean;
  Salads: boolean;
  Soups: boolean;
  Breakfast: boolean;
  VeganOptions: boolean;
}

const OrderDetails: React.FC<OrderDetailsProps> = ({
  tableId,
  onChangeTable,
  items,
  setItems,
  setSelectedTable,
  invalidTable,
  setInvalidTable,
}) => {
  const [dropdownState, setDropdownState] = useState<DropdownState>({
    Appetizers: false,
    MainCourse: false,
    Desserts: false,
    Beverages: false,
    Cocktails: false,
    Salads: false,
    Soups: false,
    Breakfast: false,
    VeganOptions: false,
  });
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const [categoryClicked, setCategoryClicked] = useState<boolean>(false);
  const [searchTable, setSearchTable] = useState<string>(tableId || '');
  const [searchCode, setSearchCode] = useState<string>('');
  const [searchName, setSearchName] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');
  const [filteredItems, setFilteredItems] = useState<CardItem[]>([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [hasTyped, setHasTyped] = useState<boolean>(false);
  const [isTableInvalid, setIsTableInvalid] = useState<boolean>(false);
  const [itemGroup, setItemGroup] = useState<ItemGroupItem[]>([]);
  const [itemGroupId, setItemGroupId] = useState<number | null>(null);
  const [cardItems, setCardItems] = useState<CardItem[]>([]);
  const [showNameDropdown, setShowNameDropdown] = useState<boolean>(false);
  const [selectedNameIndex, setSelectedNameIndex] = useState(-1);
  
  // New state for the customer modal
  const [showNewCustomerForm, setShowNewCustomerForm] = useState<boolean>(false);
  const [newCustomer, setNewCustomer] = useState<Customer>({
    srNo: 0,
    name: '',
    countryCode: '+91',
    mobile: '',
    mail: '',
    city: '',
    address1: '',
    address2: '',
    birthday: '',
    state: '',
    pincode: '',
    gstNo: '',
    fssai: '',
    panNo: '',
    aadharNo: '',
    anniversary: '',
    createWallet: false,
  });
  const [currentCustomers, setCurrentCustomers] = useState<Customer[]>([]);

  const codeInputRef = useRef<HTMLInputElement>(null);
  const quantityInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const validTables = [
    'F1', 'F2', 'F3', 'F4', 'F5', 'F5A', 'F6', 'R2', 'R3', 'R4',
    'R5', 'R6', 'R7', 'R8', 'R9', 'R12', 'R14', 'R15', 'S1', 'S2',
    'S3', '104', '105',
  ];

  const getCategoryFromItemGroup = (itemGroupId: number | null): Category => {
    if (!itemGroupId) return 'All';
    const group = itemGroup.find(g => g.item_groupid === itemGroupId);
    if (!group) return 'All';
    const cleanName = group.itemgroupname.replace(/\.\.\./, '').trim().toLowerCase();
    const categoryMap: { [key: string]: Category } = {
      appetizers: 'Appetizers',
      maincourse: 'MainCourse',
      desserts: 'Desserts',
      beverages: 'Beverages',
      cocktails: 'Cocktails',
      salads: 'Salads',
      soups: 'Soups',
      breakfast: 'Breakfast',
      veganoptions: 'VeganOptions',
    };
    return categoryMap[cleanName] || 'All';
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (searchTable) {
      setHasTyped(true);
      if (validTables.includes(searchTable)) {
        setSelectedTable(searchTable);
        setItems([]);
        setInvalidTable('');
        setIsTableInvalid(false);
      } else {
        setInvalidTable(searchTable);
        setIsTableInvalid(true);
      }
    } else if (hasTyped) {
      setSelectedTable(null);
      setInvalidTable('');
      setIsTableInvalid(false);
      setHasTyped(false);
    }
  }, [searchTable, setSelectedTable, setItems, setInvalidTable, hasTyped]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchItemGroup(setItemGroup, setItemGroupId);
        await fetchMenu(
          (data: MenuItem[]) => {
            const mappedItems: CardItem[] = data
              .filter(item => item.status === 1)
              .map(item => ({
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
          (id: number) => {}
        );
      } catch (error) {
        console.error('Fetch error:', error);
        setCardItems([]);
      }
    };
    fetchData();
  }, []);

  const itemCategories = useMemo(() => {
    const categories: { [key in Category]: CardItem[] } = {
      All: cardItems,
      Appetizers: [],
      MainCourse: [],
      Desserts: [],
      Beverages: [],
      Cocktails: [],
      Salads: [],
      Soups: [],
      Breakfast: [],
      VeganOptions: [],
    };
    cardItems.forEach((item) => {
      const category = getCategoryFromItemGroup(item.item_group_id);
      if (category !== 'All') {
        categories[category].push(item);
      }
    });
    return categories;
  }, [cardItems, itemGroup]);

  const allItems: CardItem[] = cardItems;

  const toggleDropdown = (category: Category) => {
    setDropdownState(prevState => ({
      ...prevState,
      Appetizers: category === 'Appetizers' ? !prevState.Appetizers : false,
      MainCourse: category === 'MainCourse' ? !prevState.MainCourse : false,
      Desserts: category === 'Desserts' ? !prevState.Desserts : false,
      Beverages: category === 'Beverages' ? !prevState.Beverages : false,
      Cocktails: category === 'Cocktails' ? !prevState.Cocktails : false,
      Salads: category === 'Salads' ? !prevState.Salads : false,
      Soups: category === 'Soups' ? !prevState.Soups : false,
      Breakfast: category === 'Breakfast' ? !prevState.Breakfast : false,
      VeganOptions: category === 'VeganOptions' ? !prevState.VeganOptions : false,
    }));
    setSelectedCategory(category);
    setCategoryClicked(true);
  };

  const filterItems = useCallback(() => {
    const baseItems = categoryClicked && selectedCategory !== 'All' ? itemCategories[selectedCategory] || [] : allItems;
    const filtered = baseItems.filter((item) => {
      const matchesCode = searchCode
        ? item.itemCode.toLowerCase().includes(searchCode.toLowerCase())
        : true;
      const matchesName = searchName
        ? item.ItemName.toLowerCase().includes(searchName.toLowerCase()) ||
          item.shortName.toLowerCase().includes(searchName.toLowerCase())
        : true;
      return matchesCode && matchesName;
    });
    return filtered;
  }, [searchCode, searchName, selectedCategory, categoryClicked, allItems, itemCategories]);

  const filterDropdownItems = useCallback((type: 'code' | 'name') => {
    const baseItems = categoryClicked && selectedCategory !== 'All' ? itemCategories[selectedCategory] || [] : allItems;
    return baseItems.filter((item) => {
      if (type === 'code') {
        return searchCode
          ? item.itemCode.toLowerCase().includes(searchCode.toLowerCase())
          : false;
      } else {
        return searchName
          ? item.ItemName.toLowerCase().includes(searchName.toLowerCase()) ||
            item.shortName.toLowerCase().includes(searchName.toLowerCase())
          : false;
      }
    }).slice(0, 7);
  }, [searchCode, searchName, categoryClicked, selectedCategory, allItems, itemCategories]);

  useEffect(() => {
    setFilteredItems(filterItems());
  }, [filterItems]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value;
    setSearchCode(code);
    const matchedItem = cardItems.find(
      (item) => item.itemCode.toLowerCase() === code.toLowerCase()
    );
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

  const handleCodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const matchedItem = cardItems.find(
        (item) => item.itemCode.toLowerCase() === searchCode.toLowerCase()
      );
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
        setSelectedNameIndex((prev) =>
          prev < dropdownItems.length - 1 ? prev + 1 : prev
        );
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

  const handleCodeKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchCode) {
      e.preventDefault();
      const matchedItem = cardItems.find(
        (item) => item.itemCode.toLowerCase() === searchCode.toLowerCase()
      );
      if (matchedItem) {
        handleCodeSelect(matchedItem);
      }
    }
  };

  const handleNameKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchName) {
      e.preventDefault();
      const matchedItem = cardItems.find(
        (item) =>
          item.ItemName.toLowerCase() === searchName.toLowerCase() ||
          item.shortName.toLowerCase() === searchName.toLowerCase()
      );
      if (matchedItem) {
        handleNameSelect(matchedItem);
      }
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
        handleAddItem({ name: matchedItem.ItemName, price: matchedItem.price }, qty);
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

  const handleAddItem = (newItem: Omit<MenuItemState, 'id' | 'qty'>, qty: number = 1) => {
    const existingItem = items.find((item) => item.name === newItem.name);
    if (existingItem) {
      setItems(
        items.map((item) =>
          item.name === newItem.name ? { ...item, qty: item.qty + qty } : item
        )
      );
    } else {
      setItems([...items, { ...newItem, id: items.length + 1, qty }]);
    }
  };

  const handleDeleteAll = () => {
    setItems([]);
  };

  // New handler for adding a customer
  const handleAddCustomerSubmit = () => {
    if (newCustomer.name && newCustomer.mobile) {
      setCurrentCustomers([
        ...currentCustomers,
        { ...newCustomer, srNo: currentCustomers.length + 1, address1: '', address2: '' },
      ]);
      setNewCustomer({
        srNo: 0,
        name: '',
        countryCode: '+91',
        mobile: '',
        mail: '',
        city: '',
        address1: '',
        address2: '',
        birthday: '',
        state: '',
        pincode: '',
        gstNo: '',
        fssai: '',
        panNo: '',
        aadharNo: '',
        anniversary: '',
        createWallet: false,
      });
      setShowNewCustomerForm(false);
    } else {
      alert('Name and Mobile are required fields.');
    }
  };

  // Clear form handler
  const handleClearForm = () => {
    setNewCustomer({
      srNo: 0,
      name: '',
      countryCode: '+91',
      mobile: '',
      mail: '',
      city: '',
      address1: '',
      address2: '',
      birthday: '',
      state: '',
      pincode: '',
      gstNo: '',
      fssai: '',
      panNo: '',
      aadharNo: '',
      anniversary: '',
      createWallet: false,
    });
  };

  const totalAmount = items.reduce((sum, item) => sum + item.price * item.qty, 0);

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
                        <a className="nav-link" href="#" aria-label="Menu">
                          <i className="bi bi-list" style={{ fontSize: '1.5rem' }}></i>
                        </a>
                      </li>
                    </ul>
                    <ul className="navbar-nav mx-auto mb-2 mb-lg-0 d-flex gap-2">
                      <li className="nav-item">
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={onChangeTable}
                        >
                          Change Table
                        </button>
                      </li>
                      <li className="nav-item">
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => setShowNewCustomerForm(true)}
                        >
                          Add Customer
                        </button>
                      </li>
                      <li className="nav-item">
                        <button className="btn btn-sm btn-outline-secondary">Refresh</button>
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
                    font-size: 0.875rem;
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
                      placeholder=" Table"
                      value={searchTable}
                      onChange={(e) => setSearchTable(e.target.value)}
                      style={{ maxWidth: '100px', minHeight: '68px', fontSize: '1.2rem' }}
                    />
                  </div>
                  {isTableInvalid && (
                    <div className="text-danger small text-center mt-1">
                      Invalid Table
                    </div>
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
                    onKeyPress={handleCodeKeyPress}
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
                    onKeyPress={handleNameKeyPress}
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
                            style={{ cursor: 'pointer', fontSize: '1rem', backgroundColor: index === selectedNameIndex ? '#e9ecef' : 'transparent' }}
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

          {isMobile && (
            <div className="row">
              <div className="col-12 p-2 border-bottom" style={{ backgroundColor: '#f8f9fa' }}>
                <style>
                  {`
                    .categories-container {
                      display: flex;
                      flex-wrap: wrap;
                      gap: 4px;
                      padding: 4px 0;
                    }
                    .category-btn {
                      padding: 4px 8px;
                      font-size: 12px;
                      border-radius: 12px;
                      white-space: nowrap;
                      margin: 2px;
                    }
                  `}
                </style>
                <div className="categories-container">
                  <button
                    className="btn btn-sm btn-outline-secondary category-btn"
                    onClick={() => toggleDropdown('All')}
                  >
                    All
                  </button>
                  {Object.keys(itemCategories)
                    .filter(category => category !== 'All')
                    .map((category) => (
                      <button
                        key={category}
                        className="btn btn-sm btn-outline-secondary category-btn"
                        onClick={() => toggleDropdown(category as Category)}
                      >
                        {category.replace(/([A-Z])/g, ' $1').trim()}
                      </button>
                    ))}
                </div>
              </div>
            </div>
          )}

          <div className="row flex-grow-1">
            {!isMobile && (
              <div className="col-2 border-end p-3" style={{ backgroundColor: 'transparent' }}>
                <ul className="list-unstyled">
                  <li className="mb-2">
                    <button
                      className="btn btn-link text-dark text-decoration-none d-flex justify-content-between align-items-center w-100"
                      onClick={() => toggleDropdown('All')}
                      style={{ padding: '0' }}
                    >
                      All
                    </button>
                  </li>
                  {itemGroup
                    .filter(group => group.status === 0)
                    .map((group) => {
                      const category = getCategoryFromItemGroup(group.item_groupid);
                      return (
                        <li className="mb-2" key={group.item_groupid}>
                          <button
                            className="btn btn-link text-dark text-decoration-none d-flex justify-content-between align-items-center w-100"
                            onClick={() => toggleDropdown(category)}
                            style={{ padding: '0' }}
                          >
                            {group.itemgroupname.replace(/([A-Z])/g, ' $1').trim()}
                          </button>
                        </li>
                      );
                    })}
                </ul>
              </div>
            )}

            <div className={`p-3 ${isMobile ? 'col-12' : 'col-10'}`} style={{ backgroundColor: 'transparent' }}>
              <div className="flex-grow-1 p-3">
                <div
                  style={{
                    maxHeight: 'calc(100vh - 260px)',
                    overflowY: 'auto',
                    paddingRight: '10px',
                  }}
                >
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
                            onClick={() => handleAddItem({ name: item.ItemName, price: item.price }, parseInt(quantity) || 1)}
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

      {/* Customer Modal with Updated Design */}
      <Modal
        show={showNewCustomerForm}
        onHide={() => setShowNewCustomerForm(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Add New Customer</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row className="mb-3 form-row">
              <Col md={3}>
                <Form.Group controlId="code">
                  <Form.Label>Code *</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Code"
                    value={newCustomer.name} // Using name as a placeholder for code
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group controlId="countryCode">
                  <Form.Label>Mobile *</Form.Label>
                  <Form.Control
                    as="select"
                    value={newCustomer.countryCode}
                    onChange={(e) => setNewCustomer({ ...newCustomer, countryCode: e.target.value })}
                  >
                    <option value="+91">+91</option>
                    <option value="+1">+1</option>
                    <option value="+44">+44</option>
                  </Form.Control>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group controlId="mobile">
                  <Form.Label></Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Mobile number"
                    value={newCustomer.mobile}
                    onChange={(e) => setNewCustomer({ ...newCustomer, mobile: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group controlId="email">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Email"
                    value={newCustomer.mail}
                    onChange={(e) => setNewCustomer({ ...newCustomer, mail: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row className="mb-3 form-row">
              <Col md={3}>
                <Form.Group controlId="name">
                  <Form.Label>Name *</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Name"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group controlId="address1">
                  <Form.Label>Address line 1</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Address line 1"
                    value={newCustomer.address1}
                    onChange={(e) => setNewCustomer({ ...newCustomer, address1: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group controlId="address2">
                  <Form.Label>Address line 2</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Address line 2"
                    value={newCustomer.address2}
                    onChange={(e) => setNewCustomer({ ...newCustomer, address2: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group controlId="state">
                  <Form.Label>State</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="State"
                    value={newCustomer.state}
                    onChange={(e) => setNewCustomer({ ...newCustomer, state: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row className="mb-3 form-row">
              <Col md={3}>
                <Form.Group controlId="city">
                  <Form.Label>City</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="City"
                    value={newCustomer.city}
                    onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group controlId="birthday">
                  <Form.Label>Birthday</Form.Label>
                  <Form.Control
                    type="date"
                    value={newCustomer.birthday}
                    onChange={(e) => setNewCustomer({ ...newCustomer, birthday: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group controlId="anniversary">
                  <Form.Label>Anniversary</Form.Label>
                  <Form.Control
                    type="date"
                    value={newCustomer.anniversary}
                    onChange={(e) => setNewCustomer({ ...newCustomer, anniversary: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group controlId="pincode">
                  <Form.Label>Pincode</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Pincode"
                    value={newCustomer.pincode}
                    onChange={(e) => setNewCustomer({ ...newCustomer, pincode: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row className="mb-3 form-row">
              <Col md={3}>
                <Form.Group controlId="gstNo">
                  <Form.Label>GST No.</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="GST No."
                    value={newCustomer.gstNo}
                    onChange={(e) => setNewCustomer({ ...newCustomer, gstNo: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group controlId="aadharNo">
                  <Form.Label>Aadhar No.</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Aadhar No."
                    value={newCustomer.aadharNo}
                    onChange={(e) => setNewCustomer({ ...newCustomer, aadharNo: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group controlId="fssai">
                  <Form.Label>FSSAI</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="FSSAI"
                    value={newCustomer.fssai}
                    onChange={(e) => setNewCustomer({ ...newCustomer, fssai: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group controlId="panNo">
                  <Form.Label>PAN No.</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="PAN No."
                    value={newCustomer.panNo}
                    onChange={(e) => setNewCustomer({ ...newCustomer, panNo: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row className="mb-3 form-row">
              <Col md={3}>
                <Form.Group controlId="createWallet">
                  <Form.Check
                    type="checkbox"
                    label="Create Wallet"
                    checked={newCustomer.createWallet}
                    onChange={(e) => setNewCustomer({ ...newCustomer, createWallet: e.target.checked })}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>

          {/* Customer List Table */}
          <div className="modal-table-container" style={{ maxHeight: '200px', overflowY: 'auto', marginTop: '20px' }}>
            <Table bordered hover>
              <thead>
                <tr>
                  <th>Sr No</th>
                  <th>C NAME</th>
                  <th>MOBILE</th>
                  <th>MAIL</th>
                  <th>CITY</th>
                  <th>ADDRESS 1</th>
                </tr>
              </thead>
              <tbody>
                {currentCustomers.map((customer) => (
                  <tr key={customer.srNo}>
                    <td>{customer.srNo}</td>
                    <td>{customer.name}</td>
                    <td>{customer.countryCode + customer.mobile}</td>
                    <td>{customer.mail}</td>
                    <td>{customer.city}</td>
                    <td>{customer.address1}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowNewCustomerForm(false)}>
            Close
          </Button>
          <Button variant="outline-secondary" onClick={handleClearForm}>
            Clear Form
          </Button>
          <Button variant="primary" onClick={handleAddCustomerSubmit}>
            Add
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default OrderDetails;