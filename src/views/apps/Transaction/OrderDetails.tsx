import React, { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import { fetchItemGroup, ItemGroupItem, fetchMenu } from '@/utils/commonfunction';

// Interface for menu items
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
  const [, setDropdownState] = useState<DropdownState>({
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

  const cardItems: CardItem[] = [
    { userId: '1', itemCode: '1', ItemName: 'Chicken Biryani (CB)', shortName: 'CB', price: 12.99, cardStatus: '✅ Available' },
    { userId: '2', itemCode: '2', ItemName: 'Paneer Tikka', shortName: 'PT', price: 9.99, cardStatus: '✅ Available' },
    { userId: '3', itemCode: '3', ItemName: 'Butter Naan', shortName: 'BN', price: 2.99, cardStatus: '✅ Available' },
    { userId: '4', itemCode: '4', ItemName: 'Cold Drink', shortName: 'CD', price: 1.99, cardStatus: '✅ Available' },
    { userId: '5', itemCode: '5', ItemName: 'Mineral Water', shortName: 'MW', price: 0.99, cardStatus: '✅ Available' },
    { userId: '6', itemCode: '6', ItemName: 'Dal Tadka', shortName: 'DT', price: 7.99, cardStatus: '✅ Available' },
    { userId: '7', itemCode: '7', ItemName: 'Mojito', shortName: 'MJ', price: 5.99, cardStatus: '✅ Available' },
    { userId: '8', itemCode: '8', ItemName: 'Margarita', shortName: 'MG', price: 6.49, cardStatus: '✅ Available' },
    { userId: '9', itemCode: '9', ItemName: 'Caesar Salad', shortName: 'CS', price: 4.99, cardStatus: '✅ Available' },
    { userId: '10', itemCode: '10', ItemName: 'Greek Salad', shortName: 'GS', price: 5.49, cardStatus: '✅ Available' },
    { userId: '11', itemCode: '11', ItemName: 'Tomato Soup', shortName: 'TS', price: 3.99, cardStatus: '✅ Available' },
    { userId: '12', itemCode: '12', ItemName: 'Lentil Soup', shortName: 'LS', price: 3.49, cardStatus: '✅ Available' },
    { userId: '13', itemCode: '13', ItemName: 'Mini Pizza', shortName: 'MP', price: 4.49, cardStatus: '✅ Available' },
    { userId: '14', itemCode: '14', ItemName: 'Cheese Sandwich', shortName: 'CHS', price: 3.99, cardStatus: '✅ Available' },
    { userId: '15', itemCode: '15', ItemName: 'Pancakes', shortName: 'PC', price: 5.99, cardStatus: '✅ Available' },
    { userId: '16', itemCode: '16', ItemName: 'Omelette', shortName: 'OM', price: 4.99, cardStatus: '✅ Available' },
    { userId: '17', itemCode: '17', ItemName: 'Vegan Curry', shortName: 'VC', price: 8.99, cardStatus: '✅ Available' },
    { userId: '18', itemCode: '18', ItemName: 'Tofu Stir Fry', shortName: 'TSF', price: 7.49, cardStatus: '✅ Available' },
    { userId: '19', itemCode: '19', ItemName: 'Mango Smoothie', shortName: 'MS', price: 4.99, cardStatus: '✅ Available' },
    { userId: '20', itemCode: '20', ItemName: 'Berry Smoothie', shortName: 'BS', price: 4.49, cardStatus: '✅ Available' },
  ];

  const itemCategories: { [key in Category]: CardItem[] } = {
    Appetizers: cardItems.filter(item => ['Paneer Tikka'].includes(item.ItemName)),
    MainCourse: cardItems.filter(item => ['Chicken Biryani (CB)', 'Dal Tadka'].includes(item.ItemName)),
    Desserts: [],
    Beverages: cardItems.filter(item => ['Cold Drink', 'Mineral Water'].includes(item.ItemName)),
    Cocktails: cardItems.filter(item => ['Mojito', 'Margarita'].includes(item.ItemName)),
    Salads: cardItems.filter(item => ['Caesar Salad', 'Greek Salad'].includes(item.ItemName)),
    Soups: cardItems.filter(item => ['Tomato Soup', 'Lentil Soup'].includes(item.ItemName)),
    KidsMenu: cardItems.filter(item => ['Mini Pizza', 'Cheese Sandwich'].includes(item.ItemName)),
    Breakfast: cardItems.filter(item => ['Pancakes', 'Omelette'].includes(item.ItemName)),
    VeganOptions: cardItems.filter(item => ['Dal Tadka', 'Vegan Curry', 'Tofu Stir Fry'].includes(item.ItemName)),
    Smoothies: cardItems.filter(item => ['Mango Smoothie', 'Berry Smoothie'].includes(item.ItemName)),
  };

  const allItems: CardItem[] = Array.from(
    new Map(
      Object.values(itemCategories)
        .flat()
        .map(item => [item.ItemName, item])
    ).values()
  );

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
  }, [searchCode, searchName, items, selectedCategory, categoryClicked, tableId]);

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
                    .filter(group => String(group.status) === '0') // Filter out inactive groups (status !== '0')
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