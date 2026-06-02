// pages/InventoryManagement/index.tsx
import { useState, useEffect } from 'react';
import { Card, Nav, Badge, Alert } from 'react-bootstrap';
import TitleHelmet  from '@/components/Common/TitleHelmet';
import StockService from '@/common/hotel/stock';
import { useAuthContext } from '@/common/context/useAuthContext';

// Import sub-components
import StockItemsList from './StockItemsList';
import PurchaseEntry from './PurchaseEntry';
import StockTransactions from './StockTransactions';
import ReportsPanel from './ReportsPanel';

const InventoryManagement = () => {
  const { user } = useAuthContext();
  const hotelId = user?.hotelid;
  
  const [activeTab, setActiveTab] = useState('items');
  const [lowStockAlerts, setLowStockAlerts] = useState<any[]>([]);

  useEffect(() => {
    if (hotelId) {
      fetchLowStockAlerts();
    }
  }, [hotelId]);

  const fetchLowStockAlerts = async () => {
    if (!hotelId) return;
    try {
      const res = await StockService.getLowStockAlerts({ hotelid: hotelId });
      if (res.success && res.data) {
        setLowStockAlerts(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch low stock alerts:', error);
    }
  };

  const tabs = [
    { key: 'items', label: 'Stock Items', icon: 'fi fi-rr-boxes' },
    { key: 'purchase', label: 'Purchase Entry', icon: 'fi fi-rr-shopping-cart' },
    { key: 'transactions', label: 'Transactions', icon: 'fi fi-rr-chart-histogram' },
    { key: 'reports', label: 'Reports', icon: 'fi fi-rr-chart-line' },
  ];

  if (!hotelId) {
    return (
      <>
        <TitleHelmet title="Inventory Management" />
        <Card className="m-3">
          <Card.Body>
            <Alert variant="danger">
              Hotel ID not found in session. Please select/assign a hotel before opening Inventory Master.
            </Alert>
          </Card.Body>
        </Card>
      </>
    );
  }

  return (
    <>
      <TitleHelmet title="Inventory Management" />

      <Card className="mb-3">
        <Card.Body className="d-flex justify-content-between align-items-center">
          <div>
            <h4 className="mb-1">Inventory Management</h4>
            <p className="text-muted mb-0">Manage stock items, purchases, and track inventory.</p>
          </div>
          {lowStockAlerts.length > 0 && (
            <Badge bg="danger" className="p-2">
              <i className="fi fi-rr-bell me-1"></i>
              {lowStockAlerts.length} Low Stock Alert(s)
            </Badge>
          )}
        </Card.Body>
      </Card>

      {/* Low Stock Alert Banner */}
      {lowStockAlerts.length > 0 && (
        <Alert variant="warning" className="mb-3" onClose={() => setLowStockAlerts([])} dismissible>
          <div className="d-flex align-items-center">
            <i className="fi fi-rr-bell fs-5 me-3"></i>
            <div>
              <strong>Low Stock Alert!</strong>
              <ul className="mb-0 ms-3">
                {lowStockAlerts.slice(0, 3).map((item) => (
                  <li key={item.item_id}>
                    {item.item_name} - Only {item.current_stock} left (Min: {item.minimum_stock})
                  </li>
                ))}
                {lowStockAlerts.length > 3 && (
                  <li>+{lowStockAlerts.length - 3} more items</li>
                )}
              </ul>
            </div>
          </div>
        </Alert>
      )}

      <Card>
        <Card.Body>
          <Nav variant="tabs" activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'items')} className="mb-3">
            {tabs.map((tab) => (
              <Nav.Item key={tab.key}>
                <Nav.Link eventKey={tab.key}>
                  <i className={`${tab.icon} me-2`}></i>
                  {tab.label}
                </Nav.Link>
              </Nav.Item>
            ))}
          </Nav>

          <div className="mt-3">
            {activeTab === 'items' && <StockItemsList onLowStockRefresh={fetchLowStockAlerts} />}
            {activeTab === 'purchase' && <PurchaseEntry onPurchaseComplete={fetchLowStockAlerts} />}
            {activeTab === 'transactions' && <StockTransactions />}
            {activeTab === 'reports' && <ReportsPanel />}
          </div>
        </Card.Body>
      </Card>
    </>
  );
};

export default InventoryManagement;