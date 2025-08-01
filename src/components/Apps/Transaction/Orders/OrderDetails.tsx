import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Row, Col, Card } from 'react-bootstrap';

// Interface for menu items
interface MenuItem {
  id: number;
  name: string;
  price: number;
  qty: number;
}

// Interface for component props to fix TS2739
interface OrderDetailsProps {
  tableId?: string; // Optional to avoid TS2739
  onChangeTable?: () => void; // Optional to avoid TS2739
}

const App: React.FC<OrderDetailsProps> = ({ tableId, onChangeTable }) => {
  // State and logic for the billing panel
  const [activeTab, setActiveTab] = useState<string>('Dine-in');
  const [items] = useState<MenuItem[]>([
    { id: 1, name: 'Chicken Biryani', price: 12.99, qty: 1 },
    { id: 2, name: 'Paneer Tikka', price: 9.99, qty: 2 },
  ]); // Populated with sample data to make totalAmount functional
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('+91');
  const [showCountryOptions, setShowCountryOptions] = useState<boolean>(false);
  const [showBeveragesDropdown, setShowBeveragesDropdown] = useState<boolean>(false);

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
  };

  const handleCountryCodeClick = () => {
    setShowCountryOptions(!showCountryOptions);
  };

  const toggleBeveragesDropdown = () => {
    setShowBeveragesDropdown(!showBeveragesDropdown);
  };

  // Use totalAmount in the UI to fix TS6133
  const totalAmount = items
    .reduce((sum, item) => sum + item.price * item.qty, 0)
    .toFixed(2);

  // Use getKOTLabel in the UI to fix TS6133
  const getKOTLabel = () => {
    switch (activeTab) {
      case 'Dine-in':
        return `KOT 1`;
      case 'Pickup':
        return 'Pickup Order';
      case 'Delivery':
        return 'Delivery Order';
      case 'Quick Bill':
        return 'Quick Bill';
      case 'Order/KOT':
        return 'Order/KOT';
      case 'Billing':
        return 'Billing';
      default:
        return 'KOT 1';
    }
  };

  return (
    <div className="container-fluid vh-100 d-flex flex-column p-0">
      <div className="row flex-grow-1">
        {/* Left Section (Headers, Sidebar, and Main Content) */}
        <div className="col-9 d-flex flex-column">
          {/* Headers */}
          <div className="row">
            <div className="col-12 bg-light p-2 border-bottom w-100">
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
                          onClick={onChangeTable} // Use onChangeTable prop
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
            <div className="col-12 bg-white p-2 border-bottom w-100">
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
                  }
                  .rounded-button {
                    border-radius: 20px !important;
                  }
                `}
              </style>
              <div className="d-flex flex-nowrap justify-content-center gap-1 no-hover">
                <div className="input-group rounded-search" style={{ maxWidth: '150px' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search Table"
                    style={{
                      backgroundColor: '#f4f4f4',
                      border: '1px solid #ced4da',
                      padding: '0.5rem',
                      fontSize: '0.875rem',
                    }}
                  />
                </div>
                <div className="input-group rounded-search" style={{ maxWidth: '150px' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by Code"
                    style={{
                      backgroundColor: '#f4f4f4',
                      border: '1px solid #ced4da',
                      padding: '0.5rem',
                      fontSize: '0.875rem',
                    }}
                  />
                </div>
                <div className="input-group rounded-search" style={{ maxWidth: '150px' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by Name"
                    style={{
                      backgroundColor: '#f4f4f4',
                      border: '1px solid #ced4da',
                      padding: '0.5rem',
                      fontSize: '0.875rem',
                    }}
                  />
                </div>
                <div className="input-group rounded-search" style={{ maxWidth: '150px' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Quantity"
                    style={{
                      backgroundColor: '#f4f4f4',
                      border: '1px solid #ced4da',
                      padding: '0.5rem',
                      fontSize: '0.875rem',
                    }}
                  />
                </div>
                <div className="input-group rounded-search" style={{ maxWidth: '150px' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by Item"
                    style={{
                      backgroundColor: '#f4f4f4',
                      border: '1px solid #ced4da',
                      padding: '0.5rem',
                      fontSize: '0.875rem',
                    }}
                  />
                </div>
                <button className="btn btn-sm btn-outline-danger rounded-button">Delete</button>
              </div>
            </div>
          </div>

          {/* Sidebar and Main Content */}
          <div className="row flex-grow-1">
            <div className="col-2 bg-light border-end p-3">
              <ul className="list-unstyled">
                <li className="mb-2">
                  <button
                    className="btn btn-link text-dark text-decoration-none d-flex justify-content-between align-items-center w-100"
                    onClick={toggleBeveragesDropdown}
                    style={{ padding: '0' }}
                  >
                    Beverages
                  </button>
                  <div className={`collapse ${showBeveragesDropdown ? 'show' : ''}`}>
                    <ul className="list-unstyled ps-3">
                      <li className="mb-1">
                        <a href="#" className="text-dark text-decoration-none">Cold Drink</a>
                      </li>
                      <li className="mb-1">
                        <a href="#" className="text-dark text-decoration-none">Mineral Water</a>
                      </li>
                    </ul>
                  </div>
                </li>
                <li className="mb-2">
                  <a href="#" className="text-dark text-decoration-none">Biryani</a>
                </li>
                <li className="mb-2">
                  <a href="#" className="text-dark text-decoration-none">Raita</a>
                </li>
                <li className="mb-2">
                  <a href="#" className="text-dark text-decoration-none">Indian Bread</a>
                </li>
                <li className="mb-2">
                  <a href="#" className="text-dark text-decoration-none">Main Course</a>
                </li>
                <li className="mb-2">
                  <a href="#" className="text-dark text-decoration-none">Snacks</a>
                </li>
                <li className="mb-2">
                  <a href="#" className="text-dark text-decoration-none">North Indian</a>
                </li>
              </ul>
            </div>
            <div className="col-10 p-3" style={{ backgroundColor: '#f4f6f9' }}>
              <div className="flex-grow-1 p-3">
                {/* Display KOT Label and Total Amount to fix TS6133 */}
                <div className="mb-3">
                  <h5>Order Type: {getKOTLabel()}</h5>
                  <h5>Total Amount: ${totalAmount}</h5>
                </div>
                {/* Tab Navigation */}
                <div className="mb-3">
                  <button
                    className={`btn ${activeTab === 'Dine-in' ? 'btn-primary' : 'btn-outline-primary'} me-2`}
                    onClick={() => handleTabClick('Dine-in')}
                  >
                    Dine-in
                  </button>
                  <button
                    className={`btn ${activeTab === 'Pickup' ? 'btn-primary' : 'btn-outline-primary'} me-2`}
                    onClick={() => handleTabClick('Pickup')}
                  >
                    Pickup
                  </button>
                  <button
                    className={`btn ${activeTab === 'Delivery' ? 'btn-primary' : 'btn-outline-primary'} me-2`}
                    onClick={() => handleTabClick('Delivery')}
                  >
                    Delivery
                  </button>
                  <button
                    className={`btn ${activeTab === 'Quick Bill' ? 'btn-primary' : 'btn-outline-primary'} me-2`}
                    onClick={() => handleTabClick('Quick Bill')}
                  >
                    Quick Bill
                  </button>
                  <button
                    className={`btn ${activeTab === 'Order/KOT' ? 'btn-primary' : 'btn-outline-primary'} me-2`}
                    onClick={() => handleTabClick('Order/KOT')}
                  >
                    Order/KOT
                  </button>
                  <button
                    className={`btn ${activeTab === 'Billing' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => handleTabClick('Billing')}
                  >
                    Billing
                  </button>
                </div>
                {/* Country Code Input */}
                <div className="mb-3">
                  <div className="input-group" style={{ maxWidth: '200px' }}>
                    <button
                      className="btn btn-outline-secondary"
                      onClick={handleCountryCodeClick}
                    >
                      {selectedCountryCode}
                    </button>
                    {showCountryOptions && (
                      <div className="dropdown-menu show">
                        <a
                          className="dropdown-item"
                          href="#"
                          onClick={() => {
                            setSelectedCountryCode('+91');
                            setShowCountryOptions(false);
                          }}
                        >
                          +91
                        </a>
                        <a
                          className="dropdown-item"
                          href="#"
                          onClick={() => {
                            setSelectedCountryCode('+1');
                            setShowCountryOptions(false);
                          }}
                        >
                          +1
                        </a>
                      </div>
                    )}
                    <input
                      type="text"
                      className="form-control"
                      value={selectedCountryCode}
                      onChange={(e) => setSelectedCountryCode(e.target.value)}
                      placeholder="Phone number"
                    />
                  </div>
                </div>
                <div
                  style={{
                    maxHeight: 'calc(100vh - 80px)',
                    overflowY: 'auto',
                    paddingRight: '10px',
                  }}
                >
                  <Row xs={1} sm={2} md={3} lg={4} className="g-3">
                    {[
                      { userId: '1', itemCode: '1', ItemName: 'Chicken Biryani (CB)', shortName: 'CB', price: 12.99, cardStatus: '✅ Available' },
                      { userId: '2', itemCode: '2', ItemName: 'Paneer Tikka', shortName: 'PT', price: 9.99, cardStatus: '✅ Available' },
                      { userId: '3', itemCode: '3', ItemName: 'Butter Naan', shortName: 'BN', price: 2.99, cardStatus: '✅ Available' },
                      { userId: '4', itemCode: '4', ItemName: 'Cold Drink', shortName: 'CD', price: 1.99, cardStatus: '✅ Available' },
                      { userId: '5', itemCode: '5', ItemName: 'Mineral Water', shortName: 'MW', price: 0.99, cardStatus: '✅ Available' },
                      { userId: '6', itemCode: '6', ItemName: 'Dal Tadka', shortName: 'DT', price: 7.99, cardStatus: '✅ Available' },
                    ].map((item, index) => (
                      <Col key={index}>
                        <Card
                          className="shadow-sm border-0 h-100"
                          style={{
                            borderRadius: '12px',
                            backgroundColor: '#fff',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            minHeight: '120px',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
                          }}
                        >
                          <Card.Body className="d-flex align-items-center p-2 p-md-3">
                            <div className="flex-grow-1">
                              <Card.Title
                                className="mb-1 text-wrap"
                                style={{ fontSize: '14px', fontWeight: '600', color: '#1a202c' }}
                              >
                                {item.ItemName}
                              </Card.Title>
                              <Card.Text style={{ fontSize: '12px', color: '#6b7280' }}>
                                {item.itemCode} | {item.shortName} <br />
                                ${item.price.toFixed(2)} <br />
                                {item.cardStatus}
                              </Card.Text>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
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

export default App;