import React, { useState, useEffect, ChangeEvent } from 'react';
import { toast } from 'react-hot-toast';
import { useAuthContext } from '@/common';
import { Button, Modal, Form, Row, Col, Card, ToggleButton, Table, Navbar, Offcanvas } from 'react-bootstrap';
import {
  fetchKitchenCategory,
  fetchKitchenMainGroup,
  fetchKitchenSubCategory,
  fetchItemGroup,
  fetchItemMainGroup,
  fetchData,
  fetchunitmaster,
  KitchenCategoryItem,
  KitchenMainGroupItem,
  KitchenSubCategoryItem,
  ItemGroupItem,
  ItemMainGroupItem,
  TaxGroup,
  unitmasterItem,
} from '@/utils/commonfunction';

interface MenuItem {
  restitemid: number;
  hotelid: number | null;
  hotel_name: string | null;
  item_no: string | null;
  item_name: string;
  print_name: string | null;
  short_name: string | null;
  kitchen_category_id: number | null;
  kitchen_sub_category_id: number | null;
  kitchen_main_group_id: number | null;
  item_group_id: number | null;
  item_main_group_id: number | null;
  stock_unit: string | null;
  price: number;
  taxgroupid: number | null;
  is_runtime_rates: number;
  is_common_to_all_departments: number;
  item_description: string | null;
  item_hsncode: string | null;
  status: number;
  created_by_id: number | null;
  created_date: string | null;
  updated_by_id: number | null;
  updated_date: string | null;
  itemdetailsid: number | null;
  outletid: number | null;
  outlet_name: string | null;
  item_rate: number | null;
  unitid: number | null;
  servingunitid: number | null;
  IsConversion: number | null;
}

interface CardItem {
  userId: string;
  itemId: string;
  ItemName: string;
  aliasName: string;
  price: number;
  visits: number;
  cardStatus: string;
}

interface NewItem {
  outletRates: { outletid: number | undefined; outletName: string; rate: number; unitid: number | null; servingunitid: number | null; IsConversion: number }[];
}

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

interface ModalProps {
  show: boolean;
  onHide: () => void;
  onSuccess: () => void;
  setData: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  setCardItems: React.Dispatch<React.SetStateAction<CardItem[]>>;
  itemCategories: { [key in Category]: CardItem[] };
  setItemCategories: React.Dispatch<React.SetStateAction<{ [key in Category]: CardItem[] }>>;
  mstmenu?: MenuItem;
}

const getItemCategory = (itemGroupId: number | null, itemGroup: ItemGroupItem[]): Category => {
  if (!itemGroupId) return 'All';
  const group = itemGroup.find(g => g.item_groupid === itemGroupId);
  if (!group) return 'All';
  const cleanName = group.itemgroupname.replace(/\.\.\./, '').trim().toLowerCase();
  const categoryMap: Record<string, Category> = {
    'appetizers': 'Appetizers',
    'maincourse': 'MainCourse',
    'desserts': 'Desserts',
    'beverages': 'Beverages',
    'cocktails': 'Cocktails',
    'salads': 'Salads',
    'soups': 'Soups',
    'breakfast': 'Breakfast',
    'veganoptions': 'VeganOptions',
  };
  return categoryMap[cleanName] || 'All';
};

const Menu: React.FC = () => {
  const [data, setData] = useState<MenuItem[]>([]);
  const [cardItems, setCardItems] = useState<CardItem[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [globalFilter, setGlobalFilter] = useState<string>('');
  const [showSidebar, setShowSidebar] = useState(false);
  const [itemGroup, setItemGroup] = useState<ItemGroupItem[]>([]);
  const [itemGroupId, setItemGroupId] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [outlets, setOutlets] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const { user } = useAuthContext();

  const [itemCategories, setItemCategories] = useState<{ [key in Category]: CardItem[] }>({
    All: [],
    Appetizers: [],
    MainCourse: [],
    Desserts: [],
    Beverages: [],
    Cocktails: [],
    Salads: [],
    Soups: [],
    Breakfast: [],
    VeganOptions: [],
  });

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:3001/api/menu');
      if (!res.ok) throw new Error('Failed to fetch menu');
      const menuData: MenuItem[] = await res.json();
      setData(menuData);

      const updatedCardItems = menuData.map((item) => ({
        userId: String(item.restitemid),
        itemId: item.item_no || '',
        ItemName: item.item_name,
        aliasName: item.short_name || '',
        price: item.price || 0,
        visits: 0,
        cardStatus: item.status === 1 ? '✅ Available' : '❌ Unavailable',
      }));

      const updatedCategories: { [key in Category]: CardItem[] } = {
        All: updatedCardItems,
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
      menuData.forEach((item) => {
        const category = getItemCategory(item.item_group_id, itemGroup);
        const cardItem = updatedCardItems.find((ci) => ci.userId === String(item.restitemid));
        if (cardItem && category !== 'All') {
          updatedCategories[category].push(cardItem);
        }
      });
      setItemCategories(updatedCategories);
      setCardItems(updatedCategories[selectedCategory] || updatedCardItems);
    } catch (err) {
      console.error('Fetch Menu error:', err);
      toast.error('Failed to fetch menu');
      setError('Failed to fetch menu');
    } finally {
      setLoading(false);
    }
  };

  
  useEffect(() => {
    fetchMenu();
    fetchItemGroup(setItemGroup, setItemGroupId).catch(() => toast.error('Failed to fetch item groups'));
    // Removed fetchOutletsForDropdown call due to missing function
    // You may implement or replace this with appropriate function
    // setOutlets([]); // Clear outlets or fetch from another source if available
    // Removed fetchBrands call due to missing function
    // setBrands([]); // Clear brands or fetch from another source if available
  }, []);

  const handleCategoryClick = (group: ItemGroupItem) => {
    const category = getItemCategory(group.item_groupid, itemGroup);
    setSelectedCategory(category);
    setItemGroupId(group.item_groupid);
    setCardItems(itemCategories[category] || []);
    setShowSidebar(false);
  };

  const handleEditItem = (item: MenuItem) => {
    setEditItem(item);
    setShowEditModal(true);
  };

  const updateStatusInDatabase = async (restitemid: number, newStatus: number) => {
    try {
      const item = data.find((item) => item.restitemid === restitemid);
      if (!item) {
        toast.error('Item not found');
        return;
      }
      const res = await fetch(`http://localhost:3001/api/menu/${restitemid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...item, status: newStatus, updated_by_id: user?.id || 2 }),
      });
      if (!res.ok) {
        toast.error(`Server error (${res.status})`);
        return;
      }
      setData((prev) =>
        prev.map((item) =>
          item.restitemid === restitemid ? { ...item, status: newStatus, updated_by_id: user?.id || 2, updated_date: new Date().toISOString() } : item
        )
      );
      toast.success('Status updated successfully');
    } catch (err: any) {
      toast.error(`Failed to update status: ${err.message}`);
    }
  };

  return (
    <div style={{ backgroundColor: '#f4f6f9', minHeight: '100vh' }}>
      <Navbar bg="white" expand="lg" className="shadow-sm border-bottom py-2" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
        <div className="container-fluid px-3 bg-transparent">
          <div className="d-flex align-items-center">
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => window.history.back()}
              className="me-2"
              style={{ borderRadius: '8px', padding: '6px 12px', fontSize: '14px', fontWeight: '500' }}
            >
              ←
            </Button>
            <Navbar.Brand className="d-lg-none">
              <Button
                variant="link"
                onClick={() => setShowSidebar(true)}
                className="p-0"
                style={{ color: '#1a202c' }}
              >
                <i className="bi bi-list" style={{ fontSize: '24px' }}></i>
              </Button>
            </Navbar.Brand>
          </div>
          <h5 className="mb-0 flex-grow-1 text-center text-lg-start">Items Management</h5>
          <div className="d-flex flex-column flex-lg-row align-items-center gap-2 mt-2 mt-lg-0">
            <Form.Control
              type="text"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Search by Item"
              className="rounded-lg"
              style={{ width: '100%', maxWidth: '200px', border: '1px solid #d1d5db', padding: '6px 12px', fontSize: '14px', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)' }}
            />
            <Form.Control
              type="text"
              placeholder="Search by Code"
              className="rounded-lg"
              style={{ width: '100%', maxWidth: '200px', border: '1px solid #d1d5db', padding: '6px 12px', fontSize: '14px', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)' }}
            />
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowAddModal(true)}
              className="w-100 w-lg-auto"
              style={{ borderRadius: '8px', padding: '6px 16px', fontSize: '14px', fontWeight: '500', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}
            >
              Add Item
            </Button>
          </div>
        </div>
      </Navbar>

      <div className="d-flex flex-column flex-lg-row">
        <Offcanvas
          show={showSidebar}
          onHide={() => setShowSidebar(false)}
          responsive="lg"
          placement="start"
          className="bg-white shadow-sm border-end"
          style={{ width: '250px', minWidth: '250px', maxWidth: '250px', overflowX: 'hidden' }}
        >
          <Offcanvas.Header closeButton className="border-bottom">
            <Offcanvas.Title as="h6" className="fw-bold mb-0">Item Groups</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body className="p-3" style={{ overflowY: 'auto', overflowX: 'hidden' }}>
            {loading ? (
              <p className="text-muted">Loading item groups...</p>
            ) : error ? (
              <p className="text-muted">Error: {error}</p>
            ) : (
              <Table striped bordered hover size="sm" style={{ marginBottom: 0, tableLayout: 'fixed', width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ width: '70%', padding: '8px', backgroundColor: '#f8f9fa', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Item Name</th>
                    <th style={{ width: '30%', padding: '8px', backgroundColor: '#f8f9fa', fontWeight: '600', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    style={{ backgroundColor: selectedCategory === 'All' ? '#e9ecef' : 'transparent', color: '#2d3748' }}
                    onClick={() => {
                      setSelectedCategory('All');
                      setItemGroupId(null);
                      setCardItems(itemCategories['All']);
                      setShowSidebar(false);
                    }}
                  >
                    <td style={{ padding: '8px', verticalAlign: 'middle', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>All</td>
                    <td style={{ padding: '8px', verticalAlign: 'middle', textAlign: 'center' }}>
                      <ToggleButton
                        id="sidebar-toggle-all"
                        type="checkbox"
                        variant="outline-success"
                        checked={true}
                        disabled={true}
                        value="1"
                        size="sm"
                        style={{ borderRadius: '15px', width: '40px', height: '20px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', backgroundColor: '#28a745' }}
                      >
                        <div style={{ width: '16px', height: '16px', backgroundColor: 'white', borderRadius: '50%', margin: '2px' }} />
                      </ToggleButton>
                    </td>
                  </tr>
                  {itemGroup.map((group) => {
                    const category = getItemCategory(group.item_groupid, itemGroup);
                    const isSelected = itemGroupId === group.item_groupid;
                    const isAvailable = data.some((item) => item.item_group_id === group.item_groupid && item.status === 0);

                    return (
                      <tr
                        key={group.item_groupid}
                        style={{ backgroundColor: isSelected ? '#e9ecef' : 'transparent', color: '#2d3748' }}
                        onClick={() => handleCategoryClick(group)}
                      >
                        <td style={{ padding: '8px', verticalAlign: 'middle', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{group.itemgroupname}</td>
                        <td style={{ padding: '8px', verticalAlign: 'middle', textAlign: 'center' }}>
                          <ToggleButton
                            id={`sidebar-toggle-${group.item_groupid}`}
                            type="checkbox"
                            variant="outline-success"
                            checked={isAvailable}
                            value="1"
                            onChange={() => {
                              const updatedStatus = isAvailable ? '❌ Unavailable' : '✅ Available';
                              const statusValue = updatedStatus === '✅ Available' ? 0 : 1;
                              setData((prevData) =>
                                prevData.map((d) =>
                                  d.item_group_id === group.item_groupid ? { ...d, status: statusValue } : d
                                )
                              );
                              setCardItems((prevCardItems) =>
                                prevCardItems.map((item) =>
                                  itemCategories[category].some((catItem) => catItem.userId === item.userId)
                                    ? { ...item, cardStatus: updatedStatus }
                                    : item
                                )
                              );
                              setItemCategories((prev) => ({
                                ...prev,
                                All: prev.All.map((item) =>
                                  itemCategories[category].some((catItem) => catItem.userId === item.userId)
                                    ? { ...item, cardStatus: updatedStatus }
                                    : item
                                ),
                                [category]: prev[category].map((item) => ({
                                  ...item,
                                  cardStatus: updatedStatus,
                                })),
                              }));
                              data
                                .filter((d) => d.item_group_id === group.item_groupid)
                                .forEach((item) => updateStatusInDatabase(item.restitemid, statusValue));
                            }}
                            size="sm"
                            style={{
                              borderRadius: '15px',
                              width: '40px',
                              height: '20px',
                              padding: '0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: isAvailable ? 'flex-end' : 'flex-start',
                              backgroundColor: isAvailable ? '#28a745' : '#6c757d',
                            }}
                          >
                            <div style={{ width: '16px', height: '16px', backgroundColor: 'white', borderRadius: '50%', margin: '2px' }} />
                          </ToggleButton>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            )}
          </Offcanvas.Body>
        </Offcanvas>
        <div className="flex-grow-1 p-3">
          <div style={{ maxHeight: 'calc(100vh - 80px)', paddingRight: '10px' }}>
            <Row xs={1} sm={2} md={3} lg={4} className="g-3 mb-4">
              {cardItems.map((item, index) => {
                const menuItem = data.find((p) => p.restitemid === Number(item.userId));
                return (
                  <Col key={index}>
                    <Card
                      className="shadow-sm border-0 h-100"
                      style={{ borderRadius: '12px', backgroundColor: '#fff', transition: 'transform 0.2s, box-shadow 0.2s', minHeight: '120px' }}
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
                        <div className="me-2 me-md-3">
                          <i className="fi fi-rr-coffee" style={{ fontSize: '18px', color: '#3b82f6' }}></i>
                        </div>
                        <div className="flex-grow-1">
                          <Card.Title className="mb-1 text-wrap" style={{ fontSize: '14px', fontWeight: '600', color: '#1a202c' }}>
                            {item.ItemName} ({item.aliasName})
                          </Card.Title>
                          <Card.Text style={{ fontSize: '12px', color: '#6b7280' }}>
                            {item.itemId} <br /> ₹{item.price} <br /> ({item.visits} visits)
                          </Card.Text>
                        </div>
                        <div className="d-flex flex-column align-items-center gap-2">
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => menuItem && handleEditItem(menuItem)}
                            title="Edit Item"
                            style={{ border: 'none', background: 'transparent', padding: '4px', color: '#6b7280' }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" className="bi bi-pencil-square" viewBox="0 0 16 16">
                              <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z" />
                              <path fillRule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z" />
                            </svg>
                          </Button>
                          <ToggleButton
                            id={`card-toggle-${item.userId}`}
                            type="checkbox"
                            variant="outline-success"
                            checked={item.cardStatus === '✅ Available'}
                            value="1"
                            onChange={() => {
                              const updatedStatus = item.cardStatus === '✅ Available' ? '❌ Unavailable' : '✅ Available';
                              setCardItems((prev) =>
                                prev.map((cardItem) =>
                                  cardItem.userId === item.userId ? { ...cardItem, cardStatus: updatedStatus } : cardItem
                                )
                              );
                              if (menuItem) {
                                setData((prevData) =>
                                  prevData.map((d) =>
                                    d.restitemid === menuItem.restitemid ? { ...d, status: updatedStatus === '✅ Available' ? 0 : 1 } : d
                                  )
                                );
                                updateStatusInDatabase(menuItem.restitemid, updatedStatus === '✅ Available' ? 0 : 1);
                              }
                            }}
                            size="sm"
                            style={{
                              borderRadius: '15px',
                              width: '36px',
                              height: '18px',
                              padding: '0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: item.cardStatus === '✅ Available' ? 'flex-end' : 'flex-start',
                              backgroundColor: item.cardStatus === '✅ Available' ? '#28a745' : '#6c757d',
                            }}
                          >
                            <div style={{ width: '14px', height: '14px', backgroundColor: 'white', borderRadius: '50%', margin: '2px' }} />
                          </ToggleButton>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </div>
        </div>

        <AddItemModal
          show={showAddModal}
          onHide={() => setShowAddModal(false)}
          onSuccess={fetchMenu}
          setData={setData}
          setCardItems={setCardItems}
          itemCategories={itemCategories}
          setItemCategories={setItemCategories}
        />
        <EditItemModal
          show={showEditModal}
          onHide={() => setShowEditModal(false)}
          onSuccess={fetchMenu}
          setData={setData}
          setCardItems={setCardItems}
          mstmenu={editItem ?? undefined}
          itemCategories={itemCategories}
          setItemCategories={setItemCategories}
        />
      </div>
    </div>
  );
};

const AddItemModal: React.FC<ModalProps> = ({ show, onHide, onSuccess, setData, setCardItems, itemCategories, setItemCategories }) => {
  const [selectedOutlet, setSelectedOutlet] = useState<number | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<number | null>(null);
  const [itemNo, setItemNo] = useState<string | null>(null);
  const [itemName, setItemName] = useState('');
  const [printName, setPrintName] = useState<string | null>(null);
  const [shortName, setShortName] = useState<string | null>(null);
  const [kitchenCategoryId, setKitchenCategoryId] = useState<number | null>(null);
  const [kitchenSubCategoryId, setKitchenSubCategoryId] = useState<number | null>(null);
  const [kitchenMainGroupId, setKitchenMainGroupId] = useState<number | null>(null);
  const [itemGroupId, setItemGroupId] = useState<number | null>(null);
  const [itemMainGroupId, setItemMainGroupId] = useState<number | null>(null);
  const [stockUnit, setStockUnit] = useState<string | null>(null);
  const [price, setPrice] = useState<string>('');
  const [taxgroupid, setTaxgroupid] = useState<number | null>(null);
  const [runtimeRates, setRuntimeRates] = useState(false);
  const [isCommonToAllDepartments, setIsCommonToAllDepartments] = useState(false);
  const [itemDescription, setItemDescription] = useState<string | null>(null);
  const [itemHsncode, setItemHsncode] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<NewItem>({ outletRates: [] });
  const [kitchenCategory, setKitchenCategory] = useState<KitchenCategoryItem[]>([]);
  const [kitchenSubCategory, setKitchenSubCategory] = useState<KitchenSubCategoryItem[]>([]);
  const [kitchenMainGroup, setKitchenMainGroup] = useState<KitchenMainGroupItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [itemGroup, setItemGroup] = useState<ItemGroupItem[]>([]);
  const [itemMainGroup, setItemMainGroup] = useState<ItemMainGroupItem[]>([]);
  const [brands, setBrands] = useState<Array<{ hotelid: number; hotel_name: string }>>([]);
  const [outlets, setOutlets] = useState<OutletData[]>([]);
  const [outletsLoaded, setOutletsLoaded] = useState(false);
  const [taxGroups, setTaxGroups] = useState<TaxGroup[]>([]);
  const [stockUnits, setStockUnits] = useState<unitmasterItem[]>([]);
  const { user } = useAuthContext();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          fetchKitchenCategory(setKitchenCategory, setKitchenCategoryId, undefined),
          fetchKitchenMainGroup(setKitchenMainGroup, setKitchenMainGroupId),
          fetchKitchenSubCategory(setKitchenSubCategory, setKitchenSubCategoryId),
          fetchItemGroup(setItemGroup, setItemGroupId),
          fetchItemMainGroup(setItemMainGroup, setItemMainGroupId),
          fetchBrands(user, setBrands),
          fetchData(setTaxGroups, setTaxgroupid),
          fetchunitmaster(setStockUnits),
          fetchOutletsForDropdown(user, (data) => {
            const uniqueOutlets = Array.from(
              new Map(data.map((outlet) => [outlet.outletid, outlet])).values()
            );
            setOutlets(uniqueOutlets);
            setOutletsLoaded(true);
          }, setLoading),
        ]);
      } catch (err) {
        console.error('Error loading data:', err);
        toast.error('Failed to load dropdown data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  const handleAddOutletRate = () => {
    if (!outletsLoaded) {
      toast.error('Outlets are still loading, please wait');
      return;
    }
    if (!selectedOutlet) {
      toast.error('Please select an outlet');
      return;
    }
    const outlet = outlets.find((o) => o.outletid === selectedOutlet);
    if (!outlet) {
      toast.error('Invalid outlet selected');
      return;
    }
    if (newItem.outletRates.some((rate) => rate.outletid === selectedOutlet)) {
      toast.error('This outlet is already added');
      return;
    }
    setNewItem((prev) => ({
      outletRates: [
        ...prev.outletRates,
        {
          outletid: selectedOutlet,
          outletName: outlet.outlet_name || `Outlet ${selectedOutlet}`,
          rate: 0,
          unitid: null,
          servingunitid: null,
          IsConversion: 0,
        },
      ],
    }));
    setSelectedOutlet(null);
  };

  const handleRemoveOutletRate = (outletid: number | undefined) => {
    setNewItem((prev) => ({
      outletRates: prev.outletRates.filter((rate) => rate.outletid !== outletid),
    }));
  };

  const handleAddItem = async () => {
    if (!itemName || !price || !selectedBrand) {
      toast.error('Please fill in all required fields: Item Name, Price, and Hotel');
      return;
    }
    if (isNaN(parseFloat(price)) || parseFloat(price) < 0) {
      toast.error('Price must be a valid non-negative number');
      return;
    }
    setLoading(true);
    const payload = {
      hotelid: selectedBrand,
      item_no: itemNo,
      item_name: itemName,
      print_name: printName,
      short_name: shortName,
      kitchen_category_id: kitchenCategoryId,
      kitchen_sub_category_id: kitchenSubCategoryId,
      kitchen_main_group_id: kitchenMainGroupId,
      item_group_id: itemGroupId,
      item_main_group_id: itemMainGroupId,
      stock_unit: stockUnit,
      price: parseFloat(price),
      taxgroupid: taxgroupid,
      is_runtime_rates: runtimeRates ? 1 : 0,
      is_common_to_all_departments: isCommonToAllDepartments ? 1 : 0,
      item_description: itemDescription,
      item_hsncode: itemHsncode,
      created_by_id: user?.id || 2,
      outlet_details: newItem.outletRates.map(({ outletid, rate, unitid, servingunitid, IsConversion }) => ({
        outlet_name: outlets.find((o) => o.outletid === outletid)?.outlet_name || '',
        outletid,
        item_rate: rate,
        unitid,
        servingunitid,
        IsConversion,
      })),
    };

    try {
      const res = await fetch('http://localhost:3001/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        toast.error(`Failed to add item: ${errorData.message || 'Unknown error'}`);
        return;
      }

      const addedItem: MenuItem = await res.json();
      toast.success('Item added successfully');

      setData((prev) => [...prev, addedItem]);

      const newCardItem = {
        userId: String(addedItem.restitemid),
        itemId: addedItem.item_no || '',
        ItemName: addedItem.item_name,
        aliasName: addedItem.short_name || '',
        price: addedItem.price || 0,
        visits: 0,
        cardStatus: addedItem.status === 1 ? '✅ Available' : '❌ Unavailable',
      };

      const category = getItemCategory(addedItem.item_group_id, itemGroup);
      setCardItems((prev) => [...prev, newCardItem]);
      setItemCategories((prev) => ({
        ...prev,
        All: [...prev.All, newCardItem],
        [category]: category !== 'All' ? [...prev[category], newCardItem] : prev[category],
      }));

      onSuccess();
      onHide();
    } catch (err: any) {
      console.error('Add Item error:', err);
      toast.error(`Failed to add item: ${err.message || 'Please check server status.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered className="shadow-lg">
      <Modal.Header closeButton className="bg-white border-bottom-0 py-1">
        <Modal.Title className="fs-5 fw-semibold text-gray-800">Add Item</Modal.Title>
      </Modal.Header>
      <Modal.Body className="bg-white p-3 p-md-3">
        <Form>
          <Row className="mb-3">
            <Col xs={12} sm={6}>
              <Form.Group as={Row} className="align-items-center">
                <Form.Label column sm={4} className="text-sm font-medium text-gray-700">Outlet</Form.Label>
                <Col sm={8}>
                  <Form.Select
                    value={selectedOutlet || ''}
                    onChange={(e) => setSelectedOutlet(e.target.value ? Number(e.target.value) : null)}
                    disabled={loading || !outletsLoaded}
                    className="rounded-lg"
                  >
                    <option value="">Select an outlet</option>
                    {outlets.map((outlet) => (
                      <option key={outlet.outletid} value={outlet.outletid}>
                        {outlet.outlet_name}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
              </Form.Group>
            </Col>
            <Col xs={12} sm={6}>
              <Form.Group as={Row} className="align-items-center">
                <Form.Label column sm={4} className="text-sm font-medium text-gray-700">Hotel Name</Form.Label>
                <Col sm={8}>
                  <Form.Select
                    value={selectedBrand || ''}
                    onChange={(e) => setSelectedBrand(e.target.value ? Number(e.target.value) : null)}
                    disabled={loading}
                    className="rounded-lg"
                    required
                  >
                    <option value="">Select Hotel</option>
                    {brands.map((brand) => (
                      <option key={brand.hotelid} value={brand.hotelid}>
                        {brand.hotel_name}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
              </Form.Group>
            </Col>
          </Row>
          <Row className="mb-3">
            <Col xs={12} sm={6}>
              <Form.Group as={Row} className="align-items-center">
                <Form.Label column sm={4} className="text-sm font-medium text-gray-700">Item Number</Form.Label>
                <Col sm={8}>
                  <Form.Control
                    type="text"
                    value={itemNo ?? ''}
                    onChange={(e) => setItemNo(e.target.value || null)}
                    placeholder="Enter item number"
                    className="rounded-lg"
                  />
                </Col>
              </Form.Group>
            </Col>
            <Col xs={12} sm={6}>
              <Form.Group as={Row} className="align-items-center">
                <Form.Label column sm={4} className="text-sm font-medium text-gray-700">Item Name</Form.Label>
                <Col sm={8}>
                  <Form.Control
                    type="text"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="Enter item name"
                    className="rounded-lg"
                    required
                  />
                </Col>
              </Form.Group>
            </Col>
          </Row>
          <Row className="mb-3">
            <Col xs={12} sm={6}>
              <Form.Group as={Row} className="align-items-center">
                <Form.Label column sm={4} className="text-sm font-medium text-gray-700">Print Name</Form.Label>
                <Col sm={8}>
                  <Form.Control
                    type="text"
                    value={printName ?? ''}
                    onChange={(e) => setPrintName(e.target.value || null)}
                    placeholder="Enter print name"
                    className="rounded-lg"
                  />
                </Col>
              </Form.Group>
            </Col>
            <Col xs={12} sm={6}>
              <Form.Group as={Row} className="align-items-center">
                <Form.Label column sm={4} className="text-sm font-medium text-gray-700">Short Name</Form.Label>
                <Col sm={8}>
                  <Form.Control
                    type="text"
                    value={shortName ?? ''}
                    onChange={(e) => setShortName(e.target.value || null)}
                    placeholder="Enter short name"
                    className="rounded-lg"
                  />
                </Col>
              </Form.Group>
            </Col>
          </Row>
          <Row className="mb-3">
            <Col xs={12} sm={4}>
              <Form.Group as={Row} className="align-items-center">
                <Form.Label column sm={6} className="text-sm font-medium text-gray-700">Kitchen Main Group</Form.Label>
                <Col sm={6}>
                  <Form.Select
                    value={kitchenMainGroupId ?? ''}
                    onChange={(e) => setKitchenMainGroupId(e.target.value === '' ? null : Number(e.target.value))}
                    className="rounded-lg"
                    disabled={loading}
                  >
                    <option value="">Select Kitchen Main Group</option>
                    {kitchenMainGroup.filter((group) => String(group.status) === '0').map((group) => (
                      <option key={group.kitchenmaingroupid} value={group.kitchenmaingroupid}>
                        {group.Kitchen_main_Group}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
              </Form.Group>
            </Col>
            <Col xs={12} sm={4}>
              <Form.Group as={Row} className="align-items-center">
                <Form.Label column sm={6} className="text-sm font-medium text-gray-700">Kitchen Category</Form.Label>
                <Col sm={6}>
                  <Form.Select
                    value={kitchenCategoryId ?? ''}
                    onChange={(e) => setKitchenCategoryId(e.target.value === '' ? null : Number(e.target.value))}
                    className="rounded-lg"
                    disabled={loading}
                  >
                    <option value="">Select Kitchen Category</option>
                    {kitchenCategory.filter((category) => String(category.status) === '0').map((category) => (
                      <option key={category.kitchencategoryid} value={category.kitchencategoryid}>
                        {category.Kitchen_Category}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
              </Form.Group>
            </Col>
            <Col xs={12} sm={4}>
              <Form.Group as={Row} className="align-items-center">
                <Form.Label column sm={6} className="text-sm font-medium text-gray-700">Kitchen Sub Category</Form.Label>
                <Col sm={6}>
                  <Form.Select
                    value={kitchenSubCategoryId ?? ''}
                    onChange={(e) => setKitchenSubCategoryId(e.target.value === '' ? null : Number(e.target.value))}
                    className="rounded-lg"
                    disabled={loading}
                  >
                    <option value="">Select Kitchen Sub Category</option>
                    {kitchenSubCategory.filter((subCategory) => String(subCategory.status) === '0').map((subCategory) => (
                      <option key={subCategory.kitchensubcategoryid} value={subCategory.kitchensubcategoryid}>
                        {subCategory.Kitchen_sub_category}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
              </Form.Group>
            </Col>
          </Row>
          <Row className="mb-3">
            <Col xs={12} sm={6}>
              <Form.Group as={Row} className="align-items-center">
                <Form.Label column sm={4} className="text-sm font-medium text-gray-700">Item Main Group</Form.Label>
                <Col sm={8}>
                  <Form.Select
                    value={itemMainGroupId ?? ''}
                    onChange={(e) => setItemMainGroupId(e.target.value === '' ? null : Number(e.target.value))}
                    className="rounded-lg"
                    disabled={loading}
                  >
                    <option value="">Select Item Main Group</option>
                    {itemMainGroup.filter((group) => String(group.status) === '0').map((group) => (
                      <option key={group.item_maingroupid} value={group.item_maingroupid}>
                        {group.item_group_name}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
              </Form.Group>
            </Col>
            <Col xs={12} sm={6}>
              <Form.Group as={Row} className="align-items-center">
                <Form.Label column sm={4} className="text-sm font-medium text-gray-700">Item Group</Form.Label>
                <Col sm={8}>
                  <Form.Select
                    value={itemGroupId ?? ''}
                    onChange={(e) => setItemGroupId(e.target.value === '' ? null : Number(e.target.value))}
                    className="rounded-lg"
                    disabled={loading}
                  >
                    <option value="">Select Item Group</option>
                    {itemGroup.filter((group) => String(group.status) === '0').map((group) => (
                      <option key={group.item_groupid} value={group.item_groupid}>
                        {group.itemgroupname}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
              </Form.Group>
            </Col>
          </Row>
          <Row className="mb-3">
            <Col xs={12} sm={6}>
              <Form.Group as={Row} className="align-items-center">
                <Form.Label column sm={4} className="text-sm font-medium text-gray-700">Stock Unit</Form.Label>
                <Col sm={8}>
                  <Form.Select
                    value={stockUnit ?? ''}
                    onChange={(e) => setStockUnit(e.target.value || null)}
                    className="rounded-lg"
                    disabled={loading}
                  >
                    <option value="">Select Stock Unit</option>
                    {stockUnits.map((unit) => (
                      <option key={unit.unitid} value={unit.unitid}>
                        {unit.unit_name}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
              </Form.Group>
            </Col>
            <Col xs={12} sm={6}>
              <Form.Group as={Row} className="align-items-center">
                <Form.Label column sm={4} className="text-sm font-medium text-gray-700">Price</Form.Label>
                <Col sm={8}>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Enter price"
                    className="rounded-lg"
                    required
                  />
                </Col>
              </Form.Group>
            </Col>
          </Row>
          <Row className="mb-3">
            <Col xs={12} sm={6}>
              <Form.Group as={Row} className="align-items-center">
                <Form.Label column sm={4} className="text-sm font-medium text-gray-700">Tax Group</Form.Label>
                <Col sm={8}>
                  <Form.Select
                    value={taxgroupid ?? ''}
                    onChange={(e) => setTaxgroupid(e.target.value === '' ? null : Number(e.target.value))}
                    className="rounded-lg"
                    disabled={loading}
                  >
                    <option value="">Select Tax Group</option>
                    {taxGroups.map((tg) => (
                      <option key={tg.taxgroupid} value={tg.taxgroupid}>
                        {tg.taxgroup_name}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
              </Form.Group>
            </Col>
          </Row>
          <Row className="mb-3">
            <Col xs={12} sm={6}>
              <Form.Group as={Row} className="align-items-center">
                <Form.Label column sm={4} className="text-sm font-medium text-gray-700">Item Description</Form.Label>
                <Col sm={8}>
                  <Form.Control
                    type="text"
                    value={itemDescription ?? ''}
                    onChange={(e) => setItemDescription(e.target.value || null)}
                    placeholder="Enter item description"
                    className="rounded-lg"
                  />
                </Col>
              </Form.Group>
            </Col>
            <Col xs={12} sm={6}>
              <Form.Group as={Row} className="align-items-center">
                <Form.Label column sm={4} className="text-sm font-medium text-gray-700">HSN Code</Form.Label>
                <Col sm={8}>
                  <Form.Control
                    type="text"
                    value={itemHsncode ?? ''}
                    onChange={(e) => setItemHsncode(e.target.value || null)}
                    placeholder="Enter HSN code"
                    className="rounded-lg"
                  />
                </Col>
              </Form.Group>
            </Col>
          </Row>
          <Row className="mb-3">
            <Col xs={12} sm={6}>
              <Form.Group as={Row} className="align-items-center">
                <Col sm={12}>
                  <label className="d-flex align-items-center gap-2 cursor-pointer">
                    <Form.Check
                      type="checkbox"
                      checked={runtimeRates}
                      onChange={(e) => setRuntimeRates(e.target.checked)}
                      className="mt-0"
                    />
                    <span className="text-sm text-gray-700">Runtime Rates</span>
                  </label>
                </Col>
              </Form.Group>
            </Col>
            <Col xs={12} sm={6}>
              <Form.Group as={Row} className="align-items-center">
                <Col sm={12}>
                  <label className="d-flex align-items-center gap-2 cursor-pointer">
                    <Form.Check
                      type="checkbox"
                      checked={isCommonToAllDepartments}
                      onChange={(e) => setIsCommonToAllDepartments(e.target.checked)}
                      className="mt-0"
                    />
                    <span className="text-sm text-gray-600">Is Common to All Departments</span>
                  </label>
                </Col>
              </Form.Group>
            </Col>
          </Row>
          <Row className="mb-3">
            <Col sm={12}>
              <Button
                variant="outline-primary"
                onClick={handleAddOutletRate}
                disabled={loading || !outletsLoaded}
                style={{ borderRadius: '8px', padding: '6px 16px', fontSize: '14px', fontWeight: '500' }}
              >
                Add Outlet Rate
              </Button>
            </Col>
          </Row>
          <Row className="mb-3">
            <Col sm={10}>
              <div style={{ 
                maxHeight: '150px', 
                overflowY: 'auto', 
                width: '100%', 
                border: '1px solid #dee2e6', 
                borderRadius: '4px',
                scrollbarWidth: 'thin',
                scrollbarColor: '#adb5bd #f8f9fa'
              }}>
                <style>
                  {`
                    div::-webkit-scrollbar {
                      width: 8px;
                    }
                    div::-webkit-scrollbar-track {
                      background: #f8f9fa;
                      borderRadius: 4px;
                    }
                    div::-webkit-scrollbar-thumb {
                      background: #adb5bd;
                      borderRadius: 4px;
                    }
                    div::-webkit-scrollbar-thumb:hover {
                      background: #6c757d;
                    }
                  `}
                </style>
                <Table bordered size="sm" className="m-0">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="text-sm font-medium text-gray-700 py-2">Outlet Name</th>
                      <th className="text-sm font-medium text-gray-700 py-2">Rate</th>
                      <th className="text-sm font-medium text-gray-700 py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {newItem.outletRates.map((outlet, index) => (
                      <tr key={`outlet-${outlet.outletid}-${index}`}>
                        <td className="text-sm text-gray-600 py-2">{outlet.outletName}</td>
                        <td>
                          <Form.Control
                            type="number"
                            step="0.01"
                            min="0"
                            value={outlet.rate}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => {
                              const updatedRates = [...newItem.outletRates];
                              updatedRates[index] = {
                                ...updatedRates[index],
                                rate: e.target.value ? parseFloat(e.target.value) : 0,
                              };
                              setNewItem({ outletRates: updatedRates });
                            }}
                            placeholder="Enter rate"
                            className="rounded-lg"
                          />
                        </td>
                        <td>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleRemoveOutletRate(outlet.outletid)}
                            title="Remove Outlet"
                          >
                            Remove
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Col>
          </Row>
          <Row className="mb-3 align-items-center">
            <Col xs={12} sm={4}></Col>
            <Col xs={12} sm={4}></Col>
            <Col xs={12} sm={4} className="d-flex justify-content-end gap-2">
              <Button
                variant="secondary"
                onClick={onHide}
                disabled={loading}
                style={{ borderRadius: '8px', padding: '6px 16px', fontSize: '14px', fontWeight: '500', backgroundColor: '#e5e7eb', borderColor: '#e5e7eb', color: '#1a202c' }}
              >
                Back
              </Button>
              <Button
                variant="primary"
                onClick={handleAddItem}
                disabled={loading}
                style={{ borderRadius: '8px', padding: '6px 16px', fontSize: '14px', fontWeight: '500', backgroundColor: '#3b82f6', borderColor: '#3b82f6' }}
              >
                {loading ? 'Saving...' : 'Add Item'}
              </Button>
            </Col>
          </Row>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

const EditItemModal: React.FC<ModalProps> = ({
  show,
  onHide,
  onSuccess,
  mstmenu,
  setData,
  setCardItems,
  itemCategories,
  setItemCategories,
}) => {
  const [selectedOutlet, setSelectedOutlet] = useState<number | null>(mstmenu?.outletid || null);
  const [selectedBrand, setSelectedBrand] = useState<number | null>(mstmenu?.hotelid || null);
  const [itemNo, setItemNo] = useState<string | null>(mstmenu?.item_no || null);
  const [itemName, setItemName] = useState(mstmenu?.item_name || '');
  const [printName, setPrintName] = useState<string | null>(mstmenu?.print_name || null);
  const [shortName, setShortName] = useState<string | null>(mstmenu?.short_name || null);
  const [kitchenCategoryId, setKitchenCategoryId] = useState<number | null>(mstmenu?.kitchen_category_id || null);
  const [kitchenSubCategoryId, setKitchenSubCategoryId] = useState<number | null>(mstmenu?.kitchen_sub_category_id || null);
  const [kitchenMainGroupId, setKitchenMainGroupId] = useState<number | null>(mstmenu?.kitchen_main_group_id || null);
  const [itemGroupId, setItemGroupId] = useState<number | null>(mstmenu?.item_group_id || null);
  const [itemMainGroupId, setItemMainGroupId] = useState<number | null>(mstmenu?.item_main_group_id || null);
  const [stockUnit, setStockUnit] = useState<number | null>(mstmenu?.stock_unit ? Number(mstmenu.stock_unit) : null);
  const [price, setPrice] = useState<string>(mstmenu?.price ? mstmenu.price.toString() : '');
  const [taxgroupid, setTaxgroupid] = useState<number | null>(mstmenu?.taxgroupid || null);
  const [runtimeRates, setRuntimeRates] = useState(mstmenu?.is_runtime_rates === 1);
  const [isCommonToAllDepartments, setIsCommonToAllDepartments] = useState(mstmenu?.is_common_to_all_departments === 1);
  const [itemDescription, setItemDescription] = useState<string | null>(mstmenu?.item_description || null);
  const [itemHsncode, setItemHsncode] = useState<string | null>(mstmenu?.item_hsncode || null);
  const [status, setStatus] = useState<string>(mstmenu?.status === 1 ? 'Active' : 'Inactive');
  const [newItem, setNewItem] = useState<NewItem>({
    outletRates: mstmenu && mstmenu.outletid
      ? [{
          outletid: mstmenu.outletid,
          outletName: mstmenu.outlet_name || `Outlet ${mstmenu.outletid}`,
          rate: mstmenu.item_rate || 0,
          unitid: mstmenu.unitid ? Number(mstmenu.unitid) : null,
          servingunitid: mstmenu.servingunitid ? Number(mstmenu.servingunitid) : null,
          IsConversion: mstmenu.IsConversion || 0,
        }]
      : [],
  });
  const [kitchenCategory, setKitchenCategory] = useState<KitchenCategoryItem[]>([]);
  const [kitchenSubCategory, setKitchenSubCategory] = useState<KitchenSubCategoryItem[]>([]);
  const [kitchenMainGroup, setKitchenMainGroup] = useState<KitchenMainGroupItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [itemGroup, setItemGroup] = useState<ItemGroupItem[]>([]);
  const [itemMainGroup, setItemMainGroup] = useState<ItemMainGroupItem[]>([]);
  const [brands, setBrands] = useState<Array<{ hotelid: number; hotel_name: string }>>([]);
  const [outlets, setOutlets] = useState<OutletData[]>([]);
  const [outletsLoaded, setOutletsLoaded] = useState(false);
  const [taxGroups, setTaxGroups] = useState<TaxGroup[]>([]);
  const [stockUnits, setStockUnits] = useState<unitmasterItem[]>([]);
  const { user } = useAuthContext();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          fetchKitchenCategory(setKitchenCategory, setKitchenCategoryId, mstmenu?.kitchen_category_id),
          fetchKitchenMainGroup(setKitchenMainGroup, setKitchenMainGroupId, mstmenu?.kitchen_main_group_id?.toString()),
          fetchKitchenSubCategory(setKitchenSubCategory, setKitchenSubCategoryId, mstmenu?.kitchen_sub_category_id?.toString()),
          fetchItemGroup(setItemGroup, setItemGroupId, mstmenu?.item_group_id?.toString()),
          fetchItemMainGroup(setItemMainGroup, setItemMainGroupId, mstmenu?.item_main_group_id?.toString()),
          fetchBrands(user, setBrands),
          fetchData(setTaxGroups, setTaxgroupid, mstmenu?.taxgroupid?.toString()),
          fetchunitmaster(setStockUnits, setStockUnit, mstmenu?.stock_unit?.toString()),
          fetchOutletsForDropdown(user, (data) => {
            const uniqueOutlets = Array.from(
              new Map(data.map((outlet) => [outlet.outletid, outlet])).values()
            );
            setOutlets(uniqueOutlets);
            setOutletsLoaded(true);
          }, setLoading),
        ]);
      } catch (err) {
        console.error('Error loading data:', err);
        toast.error('Failed to load dropdown data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user, mstmenu]);

  const handleAddOutletRate = () => {
    if (!outletsLoaded) {
      toast.error('Outlets are still loading, please wait');
      return;
    }
    if (!selectedOutlet) {
      toast.error('Please select an outlet');
      return;
    }
    const outlet = outlets.find((o) => o.outletid === selectedOutlet);
    if (!outlet) {
      toast.error('Invalid outlet selected');
      return;
    }
    if (newItem.outletRates.some((rate) => rate.outletid === selectedOutlet)) {
      toast.error('This outlet is already added');
      return;
    }
    setNewItem((prev) => ({
      outletRates: [
        ...prev.outletRates,
        {
          outletid: selectedOutlet,
          outletName: outlet.outlet_name || `Outlet ${selectedOutlet}`,
          rate: 0,
          unitid: null,
          servingunitid: null,
          IsConversion: 0,
        },
      ],
    }));
    setSelectedOutlet(null);
  };

  const handleRemoveOutletRate = (outletid: number | undefined) => {
    setNewItem((prev) => ({
      outletRates: prev.outletRates.filter((rate) => rate.outletid !== outletid),
    }));
  };

  const handleUpdate = async () => {
    if (!mstmenu || !itemName || !price || !selectedBrand) {
      toast.error('Please fill in all required fields: Item Name, Price, and Hotel');
      return;
    }
    if (isNaN(parseFloat(price)) || parseFloat(price) < 0) {
      toast.error('Price must be a valid non-negative number');
      return;
    }
    setLoading(true);
    const statusValue = status === 'Active' ? 1 : 0;

    const payload = {
      hotelid: selectedBrand,
      item_no: itemNo,
      item_name: itemName,
      print_name: printName,
      short_name: shortName,
      kitchen_category_id: kitchenCategoryId,
      kitchen_sub_category_id: kitchenSubCategoryId,
      kitchen_main_group_id: kitchenMainGroupId,
      item_group_id: itemGroupId,
      item_main_group_id: itemMainGroupId,
      stock_unit: stockUnit,
      price: parseFloat(price),
      taxgroupid,
      is_runtime_rates: runtimeRates ? 1 : 0,
      is_common_to_all_departments: isCommonToAllDepartments ? 1 : 0,
      item_description: itemDescription,
      item_hsncode: itemHsncode,
      status: statusValue,
      updated_by_id: user?.id || 2,
      outlet_details: newItem.outletRates.map(({ outletid, rate, unitid, servingunitid, IsConversion }) => ({
        outletid,
        outlet_name: outlets.find((o) => o.outletid === outletid)?.outlet_name || '',
        item_rate: rate,
        unitid,
        servingunitid,
        IsConversion,
      })),
    };

    try {
      const res = await fetch(`http://localhost:3001/api/menu/${mstmenu.restitemid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        toast.error(`Failed to update item: ${errorData.message || `HTTP ${res.status}`}`);
        return;
      }

      const updatedItem: MenuItem = await res.json();

      toast.success('Item updated successfully');

      const oldCategory = getItemCategory(mstmenu.item_group_id, itemGroup);
      const newCategory = getItemCategory(payload.item_group_id, itemGroup);

      const updatedCardItem = {
        userId: String(mstmenu.restitemid),
        itemId: payload.item_no || '',
        ItemName: payload.item_name,
        aliasName: payload.short_name || '',
        price: payload.price || 0,
        visits: itemCategories.All.find((item) => item.userId === String(mstmenu.restitemid))?.visits || 0,
        cardStatus: statusValue === 1 ? '✅ Available' : '❌ Unavailable',
      };

      setCardItems((prev) =>
        prev.map((item) => (item.userId === String(mstmenu.restitemid) ? updatedCardItem : item))
      );

      setItemCategories((prev) => {
        const updatedCategories = { ...prev };
        if (oldCategory !== newCategory && oldCategory !== 'All') {
          updatedCategories[oldCategory] = updatedCategories[oldCategory].filter(
            (item) => item.userId !== String(mstmenu.restitemid)
          );
        }
        updatedCategories.All = updatedCategories.All.map((item) =>
          item.userId === String(mstmenu.restitemid) ? updatedCardItem : item
        );
        if (newCategory !== 'All') {
          updatedCategories[newCategory] = updatedCategories[newCategory]
            .filter((item) => item.userId !== String(mstmenu.restitemid))
            .concat(updatedCardItem);
        }
        return updatedCategories;
      });

      setData((prev) =>
        prev.map((item) => (item.restitemid === mstmenu.restitemid ? { ...updatedItem } : item))
      );

      onSuccess();
      onHide();
    } catch (err: any) {
      console.error('Update Item error:', err);
      toast.error(`Failed to update item: ${err.message || 'Unexpected error occurred'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!show || !mstmenu) return null;

  return (
    <Modal show={show} onHide={onHide} size="lg" centered className="shadow-lg">
      <Modal.Header closeButton className="bg-white border-bottom-0 py-1">
        <Modal.Title className="fs-5 fw-semibold text-gray-800">Edit Item</Modal.Title>
      </Modal.Header>
      <Modal.Body className="bg-white p-3 p-md-3">
        <Form>
          <Row className="mb-3">
            <Col xs={12} sm={6}>
              <Form.Group as={Row} className="align-items-center">
                <Form.Label column sm={4} className="text-sm font-medium text-gray-700">Outlet</Form.Label>
                <Col sm={8}>
                  <Form.Select
                    value={selectedOutlet || ''}
                    onChange={(e) => setSelectedOutlet(e.target.value ? Number(e.target.value) : null)}
                    disabled={loading || !outletsLoaded}
                    className="rounded-lg"
                  >
                    <option value="">Select an outlet</option>
                    {outlets.map((outlet) => (
                      <option key={outlet.outletid} value={outlet.outletid}>
                        {outlet.outlet_name}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
              </Form.Group>
            </Col>
            <Col xs={12} sm={6}>
              <Form.Group as={Row} className="align-items-center">
                <Form.Label column sm={4} className="text-sm font-medium text-gray-700">Hotel Name</Form.Label>
                <Col sm={8}>
                  <Form.Select
                    value={selectedBrand || ''}
                    onChange={(e) => setSelectedBrand(e.target.value ? Number(e.target.value) : null)}
                    disabled={loading}
                    className="rounded-lg"
                    required
                  >
                    <option value="">Select Hotel</option>
                    {brands.map((brand) => (
                      <option key={brand.hotelid} value={brand.hotelid}>
                        {brand.hotel_name}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
              </Form.Group>
            </Col>
          </Row>
          <Row className="mb-3">
            <Col xs={12} sm={6}>
              <Form.Group as={Row} className="align-items-center">
                <Form.Label column sm={4} className="text-sm font-medium text-gray-700">Item Number</Form.Label>
                <Col sm={8}>
                  <Form.Control
                    type="text"
                    value={itemNo ?? ''}
                    onChange={(e) => setItemNo(e.target.value || null)}
                    placeholder="Enter item number"
                    className="rounded-lg"
                  />
                </Col>
              </Form.Group>
            </Col>
            <Col xs={12} sm={6}>
              <Form.Group as={Row} className="align-items-center">
                <Form.Label column sm={4} className="text-sm font-medium text-gray-700">Item Name</Form.Label>
                <Col sm={8}>
                  <Form.Control
                    type="text"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="Enter item name"
                    className="rounded-lg"
                    required
                  />
                </Col>
              </Form.Group>
            </Col>
          </Row>
          <Row className="mb-3">
            <Col xs={12} sm={6}>
              <Form.Group as={Row} className="align-items-center">
                <Form.Label column sm={4} className="text-sm font-medium text-gray-700">Print Name</Form.Label>
                <Col sm={8}>
                  <Form.Control
                    type="text"
                    value={printName ?? ''}
                    onChange={(e) => setPrintName(e.target.value || null)}
                    placeholder="Enter print name"
                    className="rounded-lg"
                  />
                </Col>
              </Form.Group>
            </Col>
            <Col xs={12} sm={6}>
              <Form.Group as={Row} className="align-items-center">
                <Form.Label column sm={4} className="text-sm font-medium text-gray-700">Short Name</Form.Label>
                <Col sm={8}>
                  <Form.Control
                    type="text"
                    value={shortName ?? ''}
                    onChange={(e) => setShortName(e.target.value || null)}
                    placeholder="Enter short name"
                    className="rounded-lg"
                  />
                </Col>
              </Form.Group>
            </Col>
          </Row>
          <Row className="mb-3">
            <Col xs={12} sm={4}>
              <Form.Group as={Row} className="align-items-center">
                <Form.Label column sm={6} className="text-sm font-medium text-gray-700">Kitchen Main Group</Form.Label>
                <Col sm={6}>
                  <Form.Select
                    value={kitchenMainGroupId ?? ''}
                    onChange={(e) => setKitchenMainGroupId(e.target.value === '' ? null : Number(e.target.value))}
                    className="rounded-lg"
                    disabled={loading}
                  >
                    <option value="">Select Kitchen Main Group</option>
                    {kitchenMainGroup.filter((group) => String(group.status) === '0').map((group) => (
                      <option key={group.kitchenmaingroupid} value={group.kitchenmaingroupid}>
                        {group.Kitchen_main_Group}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
              </Form.Group>
            </Col>
            <Col xs={12} sm={4}>
              <Form.Group as={Row} className="align-items-center">
                <Form.Label column sm={6} className="text-sm font-medium text-gray-700">Kitchen Category</Form.Label>
                <Col sm={6}>
                  <Form.Select
                    value={kitchenCategoryId ?? ''}
                    onChange={(e) => setKitchenCategoryId(e.target.value === '' ? null : Number(e.target.value))}
                    className="rounded-lg"
                    disabled={loading}
                  >
                    <option value="">Select Kitchen Category</option>
                    {kitchenCategory.filter((category) => String(category.status) === '0').map((category) => (
                      <option key={category.kitchencategoryid} value={category.kitchencategoryid}>
                        {category.Kitchen_Category}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
              </Form.Group>
            </Col>
            <Col xs={12} sm={4}>
              <Form.Group as={Row} className="align-items-center">
                <Form.Label column sm={6} className="text-sm font-medium text-gray-700">Kitchen Sub Category</Form.Label>
                <Col sm={6}>
                  <Form.Select
                    value={kitchenSubCategoryId ?? ''}
                    onChange={(e) => setKitchenSubCategoryId(e.target.value === '' ? null : Number(e.target.value))}
                    className="rounded-lg"
                    disabled={loading}
                  >
                    <option value="">Select Kitchen Sub Category</option>
                    {kitchenSubCategory.filter((subCategory) => String(subCategory.status) === '0').map((subCategory) => (
                      <option key={subCategory.kitchensubcategoryid} value={subCategory.kitchensubcategoryid}>
                        {subCategory.Kitchen_sub_category}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
              </Form.Group>
            </Col>
          </Row>
          <Row className="mb-3">
            <Col xs={12} sm={6}>
              <Form.Group as={Row} className="align-items-center">
                <Form.Label column sm={4} className="text-sm font-medium text-gray-700">Item Main Group</Form.Label>
                <Col sm={8}>
                  <Form.Select
                    value={itemMainGroupId ?? ''}
                    onChange={(e) => setItemMainGroupId(e.target.value === '' ? null : Number(e.target.value))}
                    className="rounded-lg"
                    disabled={loading}
                  >
                    <option value="">Select Item Main Group</option>
                    {itemMainGroup.filter((group) => String(group.status) === '0').map((group) => (
                      <option key={group.item_maingroupid} value={group.item_maingroupid}>
                        {group.item_group_name}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
              </Form.Group>
            </Col>
            <Col xs={12} sm={6}>
              <Form.Group as={Row} className="align-items-center">
                <Form.Label column sm={4} className="text-sm font-medium text-gray-700">Item Group</Form.Label>
                <Col sm={8}>
                  <Form.Select
                    value={itemGroupId ?? ''}
                    onChange={(e) => setItemGroupId(e.target.value === '' ? null : Number(e.target.value))}
                    className="rounded-lg"
                    disabled={loading}
                  >
                    <option value="">Select Item Group</option>
                    {itemGroup.filter((group) => String(group.status) === '0').map((group) => (
                      <option key={group.item_groupid} value={group.item_groupid}>
                        {group.itemgroupname}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
              </Form.Group>
            </Col>
          </Row>
          <Row className="mb-3">
            <Col xs={12} sm={6}>
              <Form.Group as={Row} className="align-items-center">
                <Form.Label column sm={4} className="text-sm font-medium text-gray-700">Stock Unit</Form.Label>
                <Col sm={8}>
                  <Form.Select
                    value={stockUnit ?? ''}
                    onChange={(e) => setStockUnit(e.target.value ? Number(e.target.value) : null)}
                    className="rounded-lg"
                    disabled={loading}
                  >
                    <option value="">Select Stock Unit</option>
                    {stockUnits.map((unit) => (
                      <option key={unit.unitid} value={unit.unitid}>
                        {unit.unit_name}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
              </Form.Group>
            </Col>
            <Col xs={12} sm={6}>
              <Form.Group as={Row} className="align-items-center">
                <Form.Label column sm={4} className="text-sm font-medium text-gray-700">Price</Form.Label>
                <Col sm={8}>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Enter price"
                    className="rounded-lg"
                    required
                  />
                </Col>
              </Form.Group>
            </Col>
          </Row>
          <Row className="mb-3">
            <Col xs={12} sm={6}>
              <Form.Group as={Row} className="align-items-center">
                <Form.Label column sm={4} className="text-sm font-medium text-gray-700">Tax Group</Form.Label>
                <Col sm={8}>
                  <Form.Select
  value={taxgroupid ?? ''}
  onChange={(e) => setTaxgroupid(e.target.value ? Number(e.target.value) : null)}
  className="rounded-lg"
  disabled={loading}
>
  <option value="">Select Tax Group</option>
  {taxGroups.map((taxGroup) => (
    <option key={taxGroup.taxgroupid} value={taxGroup.taxgroupid}>
      {taxGroup.taxgroup_name}
    </option>
  ))}
</Form.Select>
                </Col>
              </Form.Group>
            </Col>
          </Row>
          <Row className="mb-3">
            <Col xs={12} sm={6}>
              <Form.Group as={Row} className="align-items-center">
                <Form.Label column sm={4} className="text-sm font-medium text-gray-700">Item Description</Form.Label>
                <Col sm={8}>
                  <Form.Control
                    type="text"
                    value={itemDescription ?? ''}
                    onChange={(e) => setItemDescription(e.target.value || null)}
                    placeholder="Enter item description"
                    className="rounded-lg"
                  />
                </Col>
              </Form.Group>
            </Col>
            <Col xs={12} sm={6}>
              <Form.Group as={Row} className="align-items-center">
                <Form.Label column sm={4} className="text-sm font-medium text-gray-700">HSN Code</Form.Label>
                <Col sm={8}>
                  <Form.Control
                    type="text"
                    value={itemHsncode ?? ''}
                    onChange={(e) => setItemHsncode(e.target.value || null)}
                    placeholder="Enter HSN code"
                    className="rounded-lg"
                  />
                </Col>
              </Form.Group>
            </Col>
          </Row>
          <Row className="mb-3">
            <Col xs={12} sm={6}>
              <Form.Group as={Row} className="align-items-center">
                <Col sm={12}>
                  <label className="d-flex align-items-center gap-2 cursor-pointer">
                    <Form.Check
                      type="checkbox"
                      checked={runtimeRates}
                      onChange={(e) => setRuntimeRates(e.target.checked)}
                      className="mt-0"
                    />
                    <span className="text-sm text-gray-700">Runtime Rates</span>
                  </label>
                </Col>
              </Form.Group>
            </Col>
            <Col xs={12} sm={6}>
              <Form.Group as={Row} className="align-items-center">
                <Col sm={12}>
                  <label className="d-flex align-items-center gap-2 cursor-pointer">
                    <Form.Check
                      type="checkbox"
                      checked={isCommonToAllDepartments}
                      onChange={(e) => setIsCommonToAllDepartments(e.target.checked)}
                      className="mt-0"
                    />
                    <span className="text-sm text-gray-600">Is Common to All Departments</span>
                  </label>
                </Col>
              </Form.Group>
            </Col>
          </Row>
          <Row className="mb-3">
            <Col sm={12}>
              <Button
                variant="outline-primary"
                onClick={handleAddOutletRate}
                disabled={loading || !outletsLoaded}
                style={{ borderRadius: '8px', padding: '6px 16px', fontSize: '14px', fontWeight: '500' }}
              >
                Add Outlet Rate
              </Button>
            </Col>
          </Row>
          <Row className="mb-3">
            <Col sm={12}>
              <div style={{ 
                maxHeight: '150px', 
                overflowY: 'auto', 
                width: '100%', 
                border: '1px solid #dee2e6', 
                borderRadius: '4px',
                scrollbarWidth: 'thin',
                scrollbarColor: '#adb5bd #f8f9fa'
              }}>
                <style>
                  {`
                    div::-webkit-scrollbar {
                      width: 8px;
                    }
                    div::-webkit-scrollbar-track {
                      background: #f8f9fa;
                      borderRadius: 4px;
                    }
                    div::-webkit-scrollbar-thumb {
                      background: #adb5bd;
                      borderRadius: 4px;
                    }
                    div::-webkit-scrollbar-thumb:hover {
                      background: #6c757d;
                    }
                  `}
                </style>
                <Table bordered size="sm" className="m-0">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="text-sm font-medium text-gray-700 py-2">Outlet Name</th>
                      <th className="text-sm font-medium text-gray-700 py-2">Rate</th>
                      <th className="text-sm font-medium text-gray-700 py-2">Unit</th>
                      <th className="text-sm font-medium text-gray-700 py-2">Serving Unit</th>
                      <th className="text-sm font-medium text-gray-700 py-2">Conversion</th>
                      <th className="text-sm font-medium text-gray-700 py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {newItem.outletRates.map((outlet, index) => (
                      <tr key={`outlet-${outlet.outletid}-${index}`}>
                        <td className="text-sm text-gray-600 py-2">{outlet.outletName}</td>
                        <td>
                          <Form.Control
                            type="number"
                            step="0.01"
                            min="0"
                            value={outlet.rate}
                            onChange={(e) => {
                              const updatedRates = [...newItem.outletRates];
                              updatedRates[index] = { ...updatedRates[index], rate: e.target.value ? parseFloat(e.target.value) : 0 };
                              setNewItem({ outletRates: updatedRates });
                            }}
                            placeholder="Enter rate"
                            className="rounded-lg"
                          />
                        </td>
                        <td>
                          <Form.Select
                            value={outlet.unitid ?? ''}
                            onChange={(e) => {
                              const updatedRates = [...newItem.outletRates];
                              updatedRates[index] = { ...updatedRates[index], unitid: e.target.value ? Number(e.target.value) : null };
                              setNewItem({ outletRates: updatedRates });
                            }}
                            className="rounded-lg"
                          >
                            <option value="">Select Unit</option>
                            {stockUnits.map((unit) => (
                              <option key={unit.unitid} value={unit.unitid}>
                                {unit.unit_name}
                              </option>
                            ))}
                          </Form.Select>
                        </td>
                        <td>
                          <Form.Select
                            value={outlet.servingunitid ?? ''}
                            onChange={(e) => {
                              const updatedRates = [...newItem.outletRates];
                              updatedRates[index] = { ...updatedRates[index], servingunitid: e.target.value ? Number(e.target.value) : null };
                              setNewItem({ outletRates: updatedRates });
                            }}
                            className="rounded-lg"
                          >
                            <option value="">Select Serving Unit</option>
                            {stockUnits.map((unit) => (
                              <option key={unit.unitid} value={unit.unitid}>
                                {unit.unit_name}
                              </option>
                            ))}
                          </Form.Select>
                        </td>
                        <td>
                          <Form.Check
                            type="checkbox"
                            checked={outlet.IsConversion === 1}
                            onChange={(e) => {
                              const updatedRates = [...newItem.outletRates];
                              updatedRates[index] = { ...updatedRates[index], IsConversion: e.target.checked ? 1 : 0 };
                              setNewItem({ outletRates: updatedRates });
                            }}
                          />
                        </td>
                        <td>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleRemoveOutletRate(outlet.outletid)}
                            title="Remove Outlet"
                          >
                            Remove
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Col>
          </Row>
          <Row className="mb-3 align-items-center">
            <Col xs={12} sm={4}>
              <Form.Group as={Row} className="align-items-center">
                <Form.Label column sm={6} className="text-sm font-medium text-gray-700">Status</Form.Label>
                <Col sm={6}>
                  <Form.Select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="rounded-lg"
                  >
                    <option value="Active">✅ Available</option>
                    <option value="Inactive">❌ Unavailable</option>
                  </Form.Select>
                </Col>
              </Form.Group>
            </Col>
            <Col xs={12} sm={4}></Col>
            <Col xs={12} sm={4} className="d-flex justify-content-end gap-2">
              <Button
                variant="secondary"
                onClick={onHide}
                disabled={loading}
                style={{ borderRadius: '8px', padding: '6px 16px', fontSize: '14px', fontWeight: '500', backgroundColor: '#e5e7eb', borderColor: '#e5e7eb', color: '#1a202c' }}
              >
                Back
              </Button>
              <Button
                variant="primary"
                onClick={handleUpdate}
                disabled={loading}
                style={{ borderRadius: '8px', padding: '6px 16px', fontSize: '14px', fontWeight: '500', backgroundColor: '#3b82f6', borderColor: '#3b82f6' }}
              >
                {loading ? 'Saving...' : 'Save Item'}
              </Button>
            </Col>
          </Row>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default Menu;