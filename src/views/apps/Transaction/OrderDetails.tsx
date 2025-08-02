import React, { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import { fetchItemGroup, ItemGroupItem, fetchMenu } from '@/utils/commonfunction';

// Interface for menu items from API
interface APIMenuItem {
  menuid: number;
  item_no: number;
  item_name: string;
  print_name: string;
  short_name: string;
  status: number;
}

// Interface for menu items used in state
interface MenuItem {
  id: number;
  name: string;
  price: number;
  qty: number;
}

// Interface for card items
interface CardItem {
  userId: string;
  itemCode: string;
  ItemName: string;
  shortName: string;
 //mechanu_name:string
  price: number;
  cardStatus: string;
}

// Interface for component props
interface OrderDetailsProps {
  tableId?: string | null;
  onChangeTable?: () => void;
  items: MenuItem[];
  setItems: Dispatch<SetStateAction<MenuItem[]>>;
  setSelectedTable: Dispatch<SetStateAction<string | null>>;
  invalidTable: string;
  setInvalidTable: Dispatch<SetStateAction<string>>;
}

// Define the category keys as a union type
type Category =
  | 'Appetizers'
  | 'MainCourse'
  | 'Desserts'
  | 'Beverages'
  | 'Cocktails'
  | 'Salads'
  | 'Soups'
  | 'KidsMenu'
  | 'Breakfast'
  | 'VeganOptions'
  | 'Smoothies';

// Interface for dropdownState
interface DropdownState {
  Appetizers: boolean;
  MainCourse: boolean;
  Desserts: boolean;
  Beverages: boolean;
  Cocktails: boolean;
  Salads: boolean;
  Soups: boolean;
  KidsMenu: boolean;
  Breakfast: boolean;
  VeganOptions: boolean;
  Smoothies: boolean;
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
    KidsMenu: false,
    Breakfast: false,
    VeganOptions: false,
    Smoothies: false,
  });
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
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
  const [cardItems, setCardItems] = useState<CardItem[]>([]); // State for fetched menu items

  const validTables = [
    'F1', 'F2', 'F3', 'F4', 'F5', 'F5A', 'F6', 'R2', 'R3', 'R4',
    'R5', 'R6', 'R7', 'R8', 'R9', 'R12', 'R14', 'R15', 'S1', 'S2',
    'S3', '104', '105',
  ];

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

  // Fetch item groups on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchItemGroup(setItemGroup, setItemGroupId);
        console.log('Fetched itemGroup:', itemGroup);
      } catch (error) {
        console.error('Fetch item groups error:', error);
      }
    };
    fetchData();
  }, []);

  // Fetch menu items on mount
  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        await fetchMenu(
          (data: APIMenuItem[]) => {
            // Map API menu items to CardItem interface
            const mappedItems: CardItem[] = data
              .filter(item => item.status === 0) // Filter active items (status === 0)
              .map(item => ({
                userId: item.menuid.toString(),
                itemCode: item.item_no.toString(),
                ItemName: item.item_name,
                shortName: item.short_name,
                price: 0, // Price not provided in API, set default or fetch from another source if available
                cardStatus: '✅ Available',
              }));
            setCardItems(mappedItems);
          },
          (id: number) => {
            // Handle menu ID if needed
            console.log('Fetched menu ID:', id);
          }
        );
      } catch (error) {
        console.error('Fetch menu items error:', error);
        setCardItems([]);
      }
    };
    fetchMenuData();
  }, []);

  // Dynamic item categories based on itemGroup or fallback to all items
  const itemCategories: { [key in Category]: CardItem[] } = {
    Appetizers: cardItems.filter(item => itemGroup.some(group => group.itemgroupname.toLowerCase().includes('appetizers') && item.ItemName.toLowerCase().includes('appetizer'))),
    MainCourse: cardItems.filter(item => itemGroup.some(group => group.itemgroupname.toLowerCase().includes('maincourse') && item.ItemName.toLowerCase().includes('main')) || item.ItemName === 'Dal Tadka'),
    Desserts: cardItems.filter(item => itemGroup.some(group => group.itemgroupname.toLowerCase().includes('desserts') && item.ItemName.toLowerCase().includes('dessert'))),
    Beverages: cardItems.filter(item => itemGroup.some(group => group.itemgroupname.toLowerCase().includes('beverages') && item.ItemName.toLowerCase().includes('drink'))),
    Cocktails: cardItems.filter(item => itemGroup.some(group => group.itemgroupname.toLowerCase().includes('cocktails') && item.ItemName.toLowerCase().includes('cocktail'))),
    Salads: cardItems.filter(item => itemGroup.some(group => group.itemgroupname.toLowerCase().includes('salads') && item.ItemName.toLowerCase().includes('salad'))),
    Soups: cardItems.filter(item => itemGroup.some(group => group.itemgroupname.toLowerCase().includes('soups') && item.ItemName.toLowerCase().includes('soup'))),
    KidsMenu: cardItems.filter(item => itemGroup.some(group => group.itemgroupname.toLowerCase().includes('kidsmenu') && item.ItemName.toLowerCase().includes('kids'))),
    Breakfast: cardItems.filter(item => itemGroup.some(group => group.itemgroupname.toLowerCase().includes('breakfast') && item.ItemName.toLowerCase().includes('breakfast'))),
    VeganOptions: cardItems.filter(item => itemGroup.some(group => group.itemgroupname.toLowerCase().includes('veganoptions') && item.ItemName.toLowerCase().includes('vegan')) || item.ItemName === 'Dal Tadka'),
    Smoothies: cardItems.filter(item => itemGroup.some(group => group.itemgroupname.toLowerCase().includes('smoothies') && item.ItemName.toLowerCase().includes('smoothie'))),
  };

  const allItems: CardItem[] = cardItems; // Use all fetched items directly

  const toggleDropdown = (category: Category | 'All') => {
    if (category === 'All') {
      setDropdownState(prevState => ({
        ...prevState,
        Appetizers: false,
        MainCourse: false,
        Desserts: false,
        Beverages: false,
        Cocktails: false,
        Salads: false,
        Soups: false,
        KidsMenu: false,
        Breakfast: false,
        VeganOptions: false,
        Smoothies: false,
      }));
      setSelectedCategory(null);
      setCategoryClicked(true);
    } else {
      setDropdownState(prevState => ({
        ...prevState,
        [category]: !prevState[category],
      }));
      setSelectedCategory(category);
      setCategoryClicked(true);
    }
  };

  const filterItems = () => {
    const baseItems = categoryClicked && selectedCategory ? itemCategories[selectedCategory] : allItems;

    return baseItems.filter((item) => {
      const matchesCode = searchCode
        ? item.itemCode.toLowerCase().includes(searchCode.toLowerCase())
        : true;

      const matchesName = searchName
        ? item.ItemName.toLowerCase().includes(searchName.toLowerCase())
        : true;

      return matchesCode && matchesName;
    });
  };

  useEffect(() => {
    setFilteredItems(filterItems());
  }, [searchCode, searchName, items, selectedCategory, categoryClicked, tableId, cardItems]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value.trim();
    setSearchCode(code);

    const matchedItem = cardItems.find(
      item => item.itemCode.toLowerCase() === code.toLowerCase()
    );
    if (matchedItem) {
      setSearchName(matchedItem.ItemName);
    } else {
      setSearchName('');
    }
  };

  const handleCodeKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchCode) {
      e.preventDefault();
      const matchedItem = cardItems.find(
        item => item.itemCode.toLowerCase() === searchCode.toLowerCase()
      );
      if (matchedItem) {
        const qty = parseInt(quantity) || 1;
        handleAddItem({ name: matchedItem.ItemName, price: matchedItem.price }, qty);
        setSearchCode('');
        setSearchName('');
        setQuantity('1');
      }
    }
  };

  const handleQuantityKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchName) {
      e.preventDefault();
      const matchedItem = cardItems.find(
        item => item.ItemName.toLowerCase() === searchName.toLowerCase()
      );
      if (matchedItem) {
        const qty = parseInt(quantity) || 1;
        handleAddItem({ name: matchedItem.ItemName, price: matchedItem.price }, qty);
        setSearchName('');
        setQuantity('1');
      }
    }
  };

  const handleAddItem = (newItem: Omit<MenuItem, 'id' | 'qty'>, qty: number = 1) => {
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

  const totalAmount = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  console.log('Total Amount:', totalAmount.toFixed(2));

  const getCategoryFromItemGroup = (itemGroupName: string): Category | 'All' => {
    const cleanName = itemGroupName.replace(/\.\.\./, '').trim().toLowerCase();
    const categoryMap: { [key: string]: Category } = {
      appetizers: 'Appetizers',
      maincourse: 'MainCourse',
      desserts: 'Desserts',
      beverages: 'Beverages',
      cocktails: 'Cocktails',
      salads: 'Salads',
      soups: 'Soups',
      kidsmenu: 'KidsMenu',
      breakfast: 'Breakfast',
      veganoptions: 'VeganOptions',
      smoothies: 'Smoothies',
    };
    return categoryMap[cleanName] || 'All';
  };

  return (
    <div className="container-fluid vh-100 d-flex flex-column p-0">
      <div className="row flex-grow-1">
        <div className="col-12 d-flex flex-column">
          <div className="row">
            <div className="col-12 p-2 border-bottom w-100">
              <nav className="navbar navbar-expand-lg navbar-light">
                <div className="container-fluid">
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
                        <button className="btn btn-sm btn-outline-secondary">Add Customer</button>
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
                    border-color: #ced4da !important;
                    box-shadow: none !important;
                    transform: none !important;
                  }
                  .rounded-search {
                    border-radius: 20px !important;
                    overflow: hidden;
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
                  }
                `}
              </style>
              <div className="d-flex flex-nowrap justify-content-start gap-1 no-hover search-row align-items-start">
                <div style={{ maxWidth: '100px', minHeight: '48px' }}>
                  <div className="input-group rounded-search">
                    <input
                      type="text"
                      className="form-control"
                      placeholder=" Table"
                      value={searchTable}
                      onChange={(e) => setSearchTable(e.target.value)}
                    />
                  </div>
                  {isTableInvalid && (
                    <div className="text-danger small text-center mt-1">
                      Invalid Table
                    </div>
                  )}
                </div>
                <div className="input-group rounded-search" style={{ maxWidth: '100px' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder=" Code"
                    value={searchCode}
                    onChange={handleCodeChange}
                    onKeyPress={handleCodeKeyPress}
                  />
                </div>
                <div className="input-group rounded-search" style={{ maxWidth: '300px' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder=" Name"
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                  />
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
                  />
                </div>
                <button
                  className="btn btn-sm btn-outline-danger rounded-button px-2"
                  onClick={handleDeleteAll}
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
                      fontSize: 12px;
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
                  {Object.keys(itemCategories).map((category) => (
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
                    .filter(group => String(group.status) === '0')
                    .map((group) => {
                      const category = getCategoryFromItemGroup(group.itemgroupname);
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
                                ${item.price.toFixed(2)}
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
    </div>
  );
};

export default OrderDetails;