import React, { useState, useEffect, ChangeEvent } from 'react';
import { toast } from 'react-hot-toast';
import { useAuthContext } from '@/common';

import {
  ExpandedState,
  SortingState,
  ColumnDef,
} from '@tanstack/react-table';
import { Button, Modal, Form, Row, Col, Card, ToggleButton, Table, Navbar, Offcanvas } from 'react-bootstrap';
import {
  fetchKitchenCategory,
  fetchKitchenMainGroup,
  fetchKitchenSubCategory,
  fetchItemGroup,
  fetchItemMainGroup,
  KitchenCategoryItem,
  KitchenMainGroupItem,
  KitchenSubCategoryItem,
  ItemGroupItem,
  ItemMainGroupItem,
} from '@/utils/commonfunction';
import { fetchOutletsForDropdown } from '@/utils/commonfunction'; // 
import  { OutletData } from '@/common/api/outlet';
import { fetchBrands } from '@/utils/commonfunction';

// Define interfaces
interface MenuItem {
  menuid: number;
  outlet_id: number | null;
  hotel_name_id: number | null;
  item_no: string | null;
  item_name: string;
  print_name?: string | null;
  short_name?: string | null;
  kitchen_category_id: number | null;
  kitchen_sub_category_id: number | null;
  kitchen_main_group_id: number | null;
  item_group_id: number | null;
  item_main_group_id: number | null;
  stock_unit: string | null;
  price: number;
  tax?: number | null;
  runtime_rates: boolean;
  is_common_to_all_departments: boolean;
  status?: number | string;
  created_by_id?: number | null;
  created_date?: string | null;
  updated_by_id?: number | null;
  updated_date?: string | null;
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
  outletRates: { outletid: number | undefined; outletName: string; rate: number; }[]
}

interface Props {
  user: any; // Replace with proper user type
  newItem: NewItem;
  setNewItem: (item: NewItem) => void;
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

// Helper function to map item_group_id to Category
const getItemCategory = (itemGroupId: number | null, itemGroup: ItemGroupItem[]): Category => {
  if (!itemGroupId) return 'All';
  const group = itemGroup.find(g => g.item_groupid === itemGroupId);
  if (!group) return 'All';
  const cleanName = group.itemgroupname.replace(/\.\.\./, '').trim();
  switch (cleanName) {
    case 'Appetizers': return 'Appetizers';
    case 'MainCourse': return 'MainCourse';
    case 'Desserts': return 'Desserts';
    case 'Beverages': return 'Beverages';
    case 'Cocktails': return 'Cocktails';
    case 'Salads': return 'Salads';
    case 'Soups': return 'Soups';
    case 'Breakfast': return 'Breakfast';
    case 'VeganOptions': return 'VeganOptions';
    default: return 'All';
  }
};

const Menu: React.FC = () => {
  const [data, setData] = useState<MenuItem[]>([]);
  const [cardItems, setCardItems] = useState<CardItem[]>([]);
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [sorting, setSorting] = useState<SortingState>([]);
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
      const res = await fetch('http://localhost:3001/api/Menu');
      if (!res.ok) throw new Error('Failed to fetch menu');
      const menuData: MenuItem[] = await res.json();
      console.log('Fetched MenuItem:', menuData);
      setData(menuData);

      const updatedCardItems = menuData.map((item) => ({
        userId: String(item.menuid),
        itemId: item.item_no || '',
        ItemName: item.item_name,
        aliasName: item.short_name || '',
        price: item.price || 0,
        visits: 0,
        cardStatus: item.status === 0 ? '✅ Available' : '❌ Unavailable',
      }));
      setCardItems(updatedCardItems);

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
        if (category !== 'All') {
          const cardItem = updatedCardItems.find(ci => ci.userId === String(item.menuid));
          if (cardItem) {
            updatedCategories[category].push(cardItem);
          }
        }
      });
      setItemCategories(updatedCategories);
      console.log('Updated itemCategories:', updatedCategories);

      if (!updatedCategories[selectedCategory].length && selectedCategory !== 'All') {
        setSelectedCategory('All');
        setCardItems(updatedCardItems);
      }
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
    fetchItemGroup(setItemGroup, setItemGroupId).catch(() => {
      toast.error('Failed to fetch item groups');
    });
  }, []);

  const columns = React.useMemo<ColumnDef<MenuItem>[]>(
    () => [
      {
        accessorKey: 'item_name',
        header: 'Item Name',
        cell: ({ row, getValue }) => (
          <div style={{ paddingLeft: `${row.depth * 2}rem` }}>{getValue<string>()}</div>
        ),
        enableSorting: true,
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <span>{row.original.status === 0 ? '✅ Available' : '❌ Unavailable'}</span>
        ),
      },
    ],
    []
  );

  const handleEditItem = (item: MenuItem) => {
    setEditItem(item);
    setShowEditModal(true);
  };

  const updateStatusInDatabase = async (menuid: number, newStatus: number) => {
    try {
      const item = data.find((item) => item.menuid === menuid);
      if (!item) {
        toast.error('Item not found');
        return;
      }

      const res = await fetch(`http://localhost:3001/api/Menu/${menuid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...item, status: newStatus, updated_by_id: 2, updated_date: new Date().toISOString() }),
      });

      if (!res.ok) {
        toast.error(`Server error (${res.status})`);
        return;
      }

      setData((prev) =>
        prev.map((item) =>
          item.menuid === menuid
            ? { ...item, status: newStatus, updated_by_id: 2, updated_date: new Date().toISOString() }
            : item
        )
      );
      toast.success('Status updated successfully');
    } catch (err: any) {
      toast.error(`Failed to update status: ${err.message}`);
    }
  };
  return (
    <div style={{ backgroundColor: '#f4f6f9', minHeight: '100vh' }}>
      <Navbar
        bg="white"
        expand="lg"
        className="shadow-sm border-bottom py-2"
        style={{ position: 'sticky', top: 0, zIndex: 10 }}
      >
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
          <Navbar.Collapse id="navbar-actions" className="justify-content-end">
            <div className="d-flex flex-column flex-lg-row align-items-center gap-2 mt-2 mt-lg-0">
              <Form.Control
                type="text"
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Search by Item"
                className="rounded-lg"
                style={{
                  width: '100%',
                  maxWidth: '200px',
                  border: '1px solid #d1d5db',
                  padding: '6px 12px',
                  fontSize: '14px',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                }}
              />
              <Form.Control
                type="text"
                placeholder="Search by Code"
                className="rounded-lg"
                style={{
                  width: '100%',
                  maxWidth: '200px',
                  border: '1px solid #d1d5db',
                  padding: '6px 12px',
                  fontSize: '14px',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                }}
              />
              <div className="d-flex gap-2 w-100 w-lg-auto">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowAddModal(true)}
                  className="w-100 w-lg-auto"
                  style={{
                    borderRadius: '8px',
                    padding: '6px 16px',
                    fontSize: '14px',
                    fontWeight: '500',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  Add Item
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-100 w-lg-auto"
                  style={{
                    borderRadius: '8px',
                    padding: '6px 16px',
                    fontSize: '14px',
                    fontWeight: '500',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  Load Menu
                </Button>
              </div>
            </div>
          </Navbar.Collapse>
        </div>
      </Navbar>

      <div className="d-flex flex-column flex-lg-row">
        <Offcanvas
          show={showSidebar}
          onHide={() => setShowSidebar(false)}
          responsive="lg"
          placement="start"
          className="bg-white shadow-sm border-end"
          style={{ width: '250px' }}
        >
          <Offcanvas.Header closeButton className="border-bottom">
            <Offcanvas.Title as="h6" className="fw-bold mb-0">Item Groups</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body className="p-3">
            {loading ? (
              <p className="text-muted">Loading item groups...</p>
            ) : error ? (
              <p className="text-muted">Error: {error}</p>
            ) : (
              <Table striped bordered hover size="sm" style={{ marginBottom: 0 }}>
                <thead>
                  <tr>
                    <th style={{ width: '70%', padding: '8px', backgroundColor: '#f8f9fa', fontWeight: '600' }}>Item Name</th>
                    <th style={{ width: '30%', padding: '8px', backgroundColor: '#f8f9fa', fontWeight: '600', textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    style={{
                      cursor: 'pointer',
                      backgroundColor: selectedCategory === 'All' ? '#e9ecef' : 'transparent',
                      transition: 'background-color 0.2s',
                    }}
                    onClick={() => {
                      setSelectedCategory('All');
                      setItemGroupId(null);
                      setCardItems(itemCategories['All']);
                      setShowSidebar(false);
                    }}
                    onMouseEnter={(e) => {
                      if (selectedCategory !== 'All') e.currentTarget.style.backgroundColor = '#f1f3f5';
                    }}
                    onMouseLeave={(e) => {
                      if (selectedCategory !== 'All') e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <td style={{ padding: '8px', verticalAlign: 'middle', color: '#2d3748' }}>All</td>
                    <td style={{ padding: '8px', verticalAlign: 'middle', textAlign: 'center' }}>
                      <ToggleButton
                        id="sidebar-toggle-all"
                        type="checkbox"
                        variant="outline-success"
                        checked={cardItems.every((item) => item.cardStatus === '✅ Available')}
                        value="1"
                        onChange={() => {
                          const updatedStatus = cardItems.every((item) => item.cardStatus === '✅ Available') ? '❌ Unavailable' : '✅ Available';
                          setCardItems((prev) => prev.map((item) => ({ ...item, cardStatus: updatedStatus })));
                          data.forEach((item) => updateStatusInDatabase(item.menuid, updatedStatus === '✅ Available' ? 0 : 1));
                        }}
                        size="sm"
                        style={{
                          borderRadius: '15px',
                          width: '40px',
                          height: '20px',
                          padding: '0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: cardItems.every((item) => item.cardStatus === '✅ Available') ? 'flex-end' : 'flex-start',
                          backgroundColor: cardItems.every((item) => item.cardStatus === '✅ Available') ? '#28a745' : '#6c757d',
                        }}
                      >
                        <div
                          style={{
                            width: '16px',
                            height: '16px',
                            backgroundColor: 'white',
                            borderRadius: '50%',
                            margin: '2px',
                          }}
                        />
                      </ToggleButton>
                    </td>
                  </tr>
                  {itemGroup.map((group) => {
                    const normalizedCategory = getItemCategory(group.item_groupid, itemGroup);
                    const isSelected = itemGroupId === group.item_groupid;
                    const isAvailable = data.some((item) => item.item_group_id === group.item_groupid && item.status === 0);

                    return (
                      <tr
                        key={group.item_groupid}
                        style={{
                          cursor: 'pointer',
                          backgroundColor: isSelected ? '#e9ecef' : 'transparent',
                          transition: 'background-color 0.2s',
                        }}
                        onClick={() => {
                          setSelectedCategory(normalizedCategory);
                          setItemGroupId(group.item_groupid);
                          setCardItems(itemCategories[normalizedCategory] || []);
                          setShowSidebar(false);
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) e.currentTarget.style.backgroundColor = '#f1f3f5';
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <td style={{ padding: '8px', verticalAlign: 'middle', color: '#2d3748' }}>{group.itemgroupname}</td>
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
                              // Update data state
                              setData((prevData) =>
                                prevData.map((d) =>
                                  d.item_group_id === group.item_groupid ? { ...d, status: statusValue } : d
                                )
                              );
                              // Update cardItems state
                              setCardItems((prevCardItems) =>
                                prevCardItems.map((item) =>
                                  itemCategories[normalizedCategory].some((catItem) => catItem.userId === item.userId)
                                    ? { ...item, cardStatus: updatedStatus }
                                    : item
                                )
                              );
                              // Update itemCategories state
                              setItemCategories((prev) => ({
                                ...prev,
                                All: prev.All.map((item) =>
                                  itemCategories[normalizedCategory].some((catItem) => catItem.userId === item.userId)
                                    ? { ...item, cardStatus: updatedStatus }
                                    : item
                                ),
                                [normalizedCategory]: prev[normalizedCategory].map((item) => ({
                                  ...item,
                                  cardStatus: updatedStatus,
                                })),
                              }));
                              // Update database
                              data
                                .filter((d) => d.item_group_id === group.item_groupid)
                                .forEach((item) => updateStatusInDatabase(item.menuid, statusValue));
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
                            <div
                              style={{
                                width: '16px',
                                height: '16px',
                                backgroundColor: 'white',
                                borderRadius: '50%',
                                margin: '2px',
                              }}
                            />
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
              {(itemCategories[selectedCategory] || []).map((item, index) => {
                const menuItem = data.find((p) => p.menuid === Number(item.userId));
                return (
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
                        <div className="me-2 me-md-3">
                          <i className="fi fi-rr-coffee" style={{ fontSize: '18px', color: '#3b82f6' }}></i>
                        </div>
                        <div className="flex-grow-1">
                          <Card.Title
                            className="mb-1 text-wrap"
                            style={{ fontSize: '14px', fontWeight: '600', color: '#1a202c' }}
                          >
                            {item.ItemName} ({item.aliasName})
                          </Card.Title>
                          <Card.Text style={{ fontSize: '12px', color: '#6b7280' }}>
                            {item.itemId} <br />
                            ₹{item.price} <br />
                            ({item.visits} visits)
                          </Card.Text>
                        </div>
                        <div className="d-flex flex-column align-items-center gap-2">
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => {
                              if (menuItem) handleEditItem(menuItem);
                              else toast.error('Item not found for editing');
                            }}
                            title="Edit Item"
                            style={{ border: 'none', background: 'transparent', padding: '4px', color: '#6b7280' }}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="14"
                              height="14"
                              fill="currentColor"
                              className="bi bi-pencil-square"
                              viewBox="0 0 16 16"
                            >
                              <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z" />
                              <path
                                fillRule="evenodd"
                                d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"
                              />
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
                              setCardItems((prevCardItems) =>
                                prevCardItems.map((cardItem) =>
                                  cardItem.userId === item.userId ? { ...cardItem, cardStatus: updatedStatus } : cardItem
                                )
                              );
                              if (menuItem) {
                                setData((prevData) =>
                                  prevData.map((d) =>
                                    d.menuid === menuItem.menuid ? { ...d, status: updatedStatus === '✅ Available' ? 0 : 1 } : d
                                  )
                                );
                                updateStatusInDatabase(menuItem.menuid, updatedStatus);
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
                            <div
                              style={{
                                width: '14px',
                                height: '14px',
                                backgroundColor: 'white',
                                borderRadius: '50%',
                                margin: '2px',
                              }}
                            />
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
  );
};

const AddItemModal: React.FC<ModalProps> = ({ show, onHide, onSuccess, setData, setCardItems, itemCategories, setItemCategories }) => {
  const [outlet_id, setoutletid] = useState<string | null>(null);
  const [hotel_name_id, sethotelnameid] = useState<string | null>(null);
  const [item_no, setitemno] = useState<string | null>(null);
  const [item_name, setitemname] = useState('');
  const [print_name, setprintname] = useState<string | null>(null);
  const [short_name, setshortname] = useState<string | null>(null);
  const [kitchenCategory, setKitchenCategory] = useState<KitchenCategoryItem[]>([]);
  const [kitchen_category_id, setkitchencategoryid] = useState<number | null>(null);
  const [kitchenSubCategory, setKitchenSubCategory] = useState<KitchenSubCategoryItem[]>([]);
  const [kitchen_sub_category_id, setKitchenSubCategoryid] = useState<number | null>(null);
  const [kitchenMainGroup, setKitchenMainGroup] = useState<KitchenMainGroupItem[]>([]);
  const [kitchen_main_group_id, setkitchenmaingroupid] = useState<number | null>(null);
  const [item_group, setitemgroup] = useState<ItemGroupItem[]>([]);
  const [item_group_id, setitemgroupid] = useState<number | null>(null);
  const [ItemMainGroup, setItemMainGroup] = useState<ItemMainGroupItem[]>([]);
  const [item_maingroupid, setitemmaingroupid] = useState<number | null>(null);
  const [stock_unit, setstockunit] = useState<string | null>(null);
  const [price, setprice] = useState('');
  const [tax, settax] = useState<number | null>(null);
  const [runtime_rates, setruntimerates] = useState(false);
  const [is_common_to_all_departments, setiscommontoalldepartments] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('Active');
  const [outlets, setOutlets] = useState<OutletData[]>([]);
  const [selectedOutlet, setSelectedOutlet] = useState<number | null>(null);
  const { user } = useAuthContext();
  const [newItem, setNewItem] = useState<NewItem>({ outletRates: [] });
  const [brands, setBrands] = useState<Array<{ hotelid: number; hotel_name: string }>>([]);
  const [selectedBrand, setSelectedBrand] = useState<number | null>(null);
  
  

  const taxOptions = [
    { value: 0, label: '0%' },
    { value: 5, label: '5%' },
    { value: 12, label: '12%' },
    { value: 18, label: '18%' },
    { value: 28, label: '28%' },
  ];

  // Fetch data
  useEffect(() => {
    fetchKitchenCategory(setKitchenCategory, setkitchencategoryid, kitchen_category_id ?? undefined);
    fetchKitchenMainGroup(setKitchenMainGroup, setkitchenmaingroupid);
    fetchKitchenSubCategory(setKitchenSubCategory, setKitchenSubCategoryid);
    fetchItemGroup(setitemgroup, setitemgroupid);
    fetchItemMainGroup(setItemMainGroup, setitemmaingroupid);
    fetchOutletsForDropdown(user, setOutlets, setLoading);
    fetchBrands(user, setBrands);
  }, [kitchen_category_id, user]);

  const handleOutletChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedOutlet(Number(e.target.value));
  };

  // Initialize outletRates when outlets are fetched
  useEffect(() => {
    if (outlets.length > 0 && newItem.outletRates.length === 0) {
      const initialOutletRates = outlets.map((outlet) => ({
        outletid: outlet.outletid,
        outletName: outlet.outlet_name,
        rate: 0,
      }));
      setNewItem({ outletRates: initialOutletRates });
    }
  }, [outlets, newItem.outletRates.length]);

  const getCategoryFromItemGroupId = (itemGroupId: number | null): Category => {
    if (!itemGroupId) return 'All';
    const group = item_group.find((g) => g.item_groupid === itemGroupId);
    if (!group) return 'All';
    const cleanName = group.itemgroupname.replace(/\.\.\./, '').trim();
    switch (cleanName) {
      case 'Appetizers':
        return 'Appetizers';
      case 'MainCourse':
        return 'MainCourse';
      case 'Desserts':
        return 'Desserts';
      case 'Beverages':
        return 'Beverages';
      case 'Cocktails':
        return 'Cocktails';
      case 'Salads':
        return 'Salads';
      case 'Soups':
        return 'Soups';
      case 'Breakfast':
        return 'Breakfast';
      case 'VeganOptions':
        return 'VeganOptions';
      default:
        return 'All';
    }
  };

  const handleAdd = async () => {
    if (!item_name || item_name.trim() === '') {
      toast.error('Item Name is required');
      return;
    }
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) < 0) {
      toast.error('Price is required and must be a valid non-negative number');
      return;
    }
    if (!status) {
      toast.error('Status is required');
      return;
    }

    setLoading(true);
    try {
      const statusValue = status === 'Active' ? 0 : 1;
      const currentDate = new Date().toISOString();
      const payload = {
        outlet_id: outlet_id ? parseInt(outlet_id) : null,
        hotel_name_id: hotel_name_id ? parseInt(hotel_name_id) : null,
        item_no: item_no || null,
        item_name: item_name.trim(),
        print_name: print_name || null,
        short_name: short_name || null,
        kitchen_category_id,
        kitchen_sub_category_id,
        kitchen_main_group_id,
        item_group_id,
        item_main_group_id: item_maingroupid,
        stock_unit: stock_unit || null,
        price: parseFloat(price).toFixed(2),
        tax: tax !== null ? tax : null,
        runtime_rates: runtime_rates ? 1 : 0,
        is_common_to_all_departments: is_common_to_all_departments ? 1 : 0,
        status: statusValue,
        created_by_id: 1,
        created_date: currentDate,
        outletRates: newItem.outletRates.map(({ outletid, rate }) => ({ outletid, rate })), // Send outlet rates to backend
      };
      console.log('Sending to backend:', JSON.stringify(payload, null, 2));

      const res = await fetch('http://localhost:3001/api/Menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get('Content-Type');
      console.log('Response status:', res.status, 'Content-Type:', contentType);

      if (!res.ok) {
        const text = await res.text();
        console.error('Server response:', text.slice(0, 200));
        if (contentType?.includes('application/json')) {
          try {
            const errorData = JSON.parse(text);
            toast.error(`Failed to add item: ${errorData.error || errorData.message || 'Unknown error'}`);
          } catch (jsonErr) {
            console.error('JSON parse error:', jsonErr);
            toast.error('Server returned invalid JSON.');
          }
        } else {
          toast.error(`Server error (${res.status}): Check backend logs for details.`);
        }
        return;
      }

      const newItemResponse = await res.json();
      console.log('Received new item:', newItemResponse);
      toast.success('Item added successfully');
      setData((prev) => [...prev, newItemResponse]);
      const newCardItem = {
        userId: String(newItemResponse.menuid),
        itemId: newItemResponse.item_no || '',
        ItemName: newItemResponse.item_name,
        aliasName: newItemResponse.short_name || '',
        price: parseFloat(newItemResponse.price) || 0,
        visits: 0,
        cardStatus: newItemResponse.status === 0 ? '✅ Available' : '❌ Unavailable',
      };
      setCardItems((prev) => [...prev, newCardItem]);

      const category = getCategoryFromItemGroupId(newItemResponse.item_group_id);
      setItemCategories((prev) => ({
        ...prev,
        All: [...prev.All, newCardItem],
        [category]: [...(prev[category] || []), newCardItem],
      }));
      console.log('Updated itemCategories:', itemCategories);

      // Reset form
      setoutletid(null);
      sethotelnameid(null);
      setitemno(null);
      setitemname('');
      setprintname(null);
      setshortname(null);
      setkitchencategoryid(null);
      setKitchenSubCategoryid(null);
      setkitchenmaingroupid(null);
      setitemgroupid(null);
      setitemmaingroupid(null);
      setstockunit(null);
      setprice('');
      settax(null);
      setruntimerates(false);
      setiscommontoalldepartments(false);
      setStatus('Active');
      setSelectedOutlet(null);
      setNewItem({ outletRates: [] });
      onSuccess();
      onHide();
    } catch (err: any) {
      console.error('Add Item error:', err.message, err.stack);
      toast.error(`Failed to add item: ${err.message || 'Please check server status.'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;
  return (
    <Modal show={show} onHide={onHide} size="lg" centered className="shadow-lg">
      <Modal.Header closeButton className="bg-white border-bottom-0 py-1">
        <Modal.Title className="fs-5 fw-semibold text-gray-800">Add Item</Modal.Title>
      </Modal.Header>
      <Modal.Body className="bg-white p-3 p-md-3">
        <Form>
          <Row className="mb-3">
            <Col xs={12} sm={6} className="mb-3 mb-sm-0">
              <Form.Group as={Row} className="align-items-center">
                <Form.Label column sm={4} className="text-sm font-medium text-gray-700">
                  Outlet
                </Form.Label>
                <Col sm={8}>
                <select
                    className="form-control rounded-lg"
                    value={selectedOutlet || ''}
            onChange={handleOutletChange}
            disabled={loading}
          >
            <option value="">Select an outlet</option>
            {outlets.map((outlet) => (
              <option key={outlet.outletid} value={outlet.outletid}>
                {outlet.outlet_name} ({outlet.brand_name})
              </option>
            ))}
                  </select>
                </Col>
              </Form.Group>
            </Col>
            <Col xs={12} sm={6}>
              <Form.Group as={Row} className="align-items-center">
                <Form.Label column sm={4} className="text-sm font-medium text-gray-700">
                  Hotel Name
                </Form.Label>
                <Col sm={8}>
                  <Form.Select
                   value={selectedBrand || ''}
            onChange={(e) => setSelectedBrand(e.target.value ? Number(e.target.value) : null)}
            disabled={loading}
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
                <Form.Label column sm={4} className="text-sm font-medium text-gray-700">
                  Item Number
                </Form.Label>
                <Col sm={8}>
                  <Form.Control
                    type="text"
                    value={item_no ?? ''}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setitemno(e.target.value || null)}
                    placeholder="Enter item number"
                    className="rounded-lg"
                  />
                </Col>
              </Form.Group>
            </Col>
            <Col xs={12} sm={6}>
              <Form.Group as={Row} className="align-items-center">
                <Form.Label column sm={4} className="text-sm font-medium text-gray-700">
                  Item Name
                </Form.Label>
                <Col sm={8}>
                  <Form.Control
                    type="text"
                    value={item_name}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setitemname(e.target.value)}
                    placeholder="Enter item name"
                    className="rounded-lg"
                    required
                  />
                </Col>
              </Form.Group>
            </Col>
          </Row>
          <Row className="mb-3">
            <Col xs={12} sm={6} className="mb-3 mb-sm-0">
              <Form.Group as={Row} className="align-items-center">
                <Form.Label column sm={4} className="text-sm font-medium text-gray-700">
                  Print Name
                </Form.Label>
                <Col sm={8}>
                  <Form.Control
                    type="text"
                    value={print_name ?? ''}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setprintname(e.target.value || null)}
                    placeholder="Enter print name"
                    className="rounded-lg"
                  />
                </Col>
              </Form.Group>
            </Col>
            <Col xs={12} sm={6}>
              <Form.Group as={Row} className="align-items-center">
                <Form.Label column sm={4} className="text-sm font-medium text-gray-700">
                  Short Name
                </Form.Label>
                <Col sm={8}>
                  <Form.Control
                    type="text"
                    value={short_name ?? ''}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setshortname(e.target.value || null)}
                    placeholder="Enter short name"
                    className="rounded-lg"
                  />
                </Col>
              </Form.Group>
            </Col>
          </Row>
          <Row className="mb-3">
            <Col xs={12} sm={4} className="mb-3 mb-sm-0">
              <Form.Group as={Row} className="align-items-center">
                <Form.Label column sm={6} className="text-sm font-medium text-gray-700">
                  Kitchen Main Group
                </Form.Label>
                <Col sm={6}>
                  <Form.Select
                    value={kitchen_main_group_id ?? ''}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                      const value = e.target.value;
                      setkitchenmaingroupid(value === '' ? null : Number(value));
                    }}
                    className="rounded-lg"
                    disabled={loading}
                  >
                    <option value="">Select Kitchen Main Group</option>
                    {kitchenMainGroup
                      .filter((group) => String(group.status) === '0')
                      .map((group) => (
                        <option key={group.kitchenmaingroupid} value={group.kitchenmaingroupid}>
                          {group.Kitchen_main_Group}
                        </option>
                      ))}
                  </Form.Select>
                </Col>
              </Form.Group>
            </Col>
            <Col xs={12} sm={4} className="mb-3 mb-sm-0">
              <Form.Group as={Row} className="align-items-center">
                <Form.Label column sm={6} className="text-sm font-medium text-gray-700">
                  Kitchen Category
                </Form.Label>
                <Col sm={6}>
                  <Form.Select
                    value={kitchen_category_id ?? ''}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                      const value = e.target.value;
                      setkitchencategoryid(value === '' ? null : Number(value));
                    }}
                    className="rounded-lg"
                    disabled={loading}
                  >
                    <option value="">Select Kitchen Category</option>
                    {kitchenCategory
                      .filter((category) => String(category.status) === '0')
                      .map((category) => (
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
                <Form.Label column sm={6} className="text-sm font-medium text-gray-700">
                  Kitchen Sub Category
                </Form.Label>
                <Col sm={6}>
                  <Form.Select
                    value={kitchen_sub_category_id ?? ''}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                      const value = e.target.value;
                      setKitchenSubCategoryid(value === '' ? null : Number(value));
                    }}
                    className="rounded-lg"
                    disabled={loading}
                  >
                    <option value="">Select Kitchen Sub Category</option>
                    {kitchenSubCategory
                      .filter((subCategory) => String(subCategory.status) === '0')
                      .map((subCategory) => (
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
            <Col xs={12} sm={6} className="mb-3 mb-sm-0">
              <Form.Group as={Row} className="align-items-center">
                <Form.Label column sm={4} className="text-sm font-medium text-gray-700">
                  Item Main Group
                </Form.Label>
                <Col sm={8}>
                  <Form.Select
                    value={item_maingroupid ?? ''}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                      const value = e.target.value;
                      setitemmaingroupid(value === '' ? null : Number(value));
                    }}
                    className="rounded-lg"
                    disabled={loading}
                  >
                    <option value="">Select Item Main Group</option>
                    {ItemMainGroup
                      .filter((group) => String(group.status) === '0')
                      .map((group) => (
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
                <Form.Label column sm={4} className="text-sm font-medium text-gray-700">
                  Item Group
                </Form.Label>
                <Col sm={8}>
                  <Form.Select
                    value={item_group_id ?? ''}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                      const value = e.target.value;
                      setitemgroupid(value === '' ? null : Number(value));
                    }}
                    className="rounded-lg"
                    disabled={loading}
                  >
                    <option value="">Select Item Group</option>
                    {item_group
                      .filter((group) => String(group.status) === '0')
                      .map((group) => (
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
                <Form.Label column sm={4} className="text-sm font-medium text-gray-700">
                  Stock Unit
                </Form.Label>
                <Col sm={8}>
                  <Form.Select
                    value={stock_unit ?? ''}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setstockunit(e.target.value || null)}
                    className="rounded-lg"
                  >
                    <option value="">Select Stock Unit</option>
                    <option value="Piece">Piece</option>
                    <option value="Kg">Kg</option>
                    <option value="Liter">Liter</option>
                    <option value="Unit">Unit</option>
                  </Form.Select>
                </Col>
              </Form.Group>
            </Col>
            <Col xs={12} sm={6}>
              <Form.Group as={Row} className="align-items-center">
                <Form.Label column sm={4} className="text-sm font-medium text-gray-700">
                  Price
                </Form.Label>
                <Col sm={8}>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    value={price}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setprice(e.target.value)}
                    placeholder="Enter price (e.g., 10.99)"
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
                <Form.Label column sm={4} className="text-sm font-medium text-gray-700">
                  Tax (%)
                </Form.Label>
                <Col sm={8}>
                  <Form.Select
                    value={tax ?? ''}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                      const value = e.target.value;
                      settax(value === '' ? null : parseFloat(value));
                    }}
                    className="rounded-lg"
                  >
                    <option value="">Select Tax</option>
                    {taxOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
              </Form.Group>
            </Col>
          </Row>
          <Row className="mb-3">
            <Col xs={12} sm={6} className="mb-3 mb-sm-0">
              <Form.Group as={Row} className="align-items-center">
                <Col sm={12}>
                  <label className="d-flex align-items-center gap-2 cursor-pointer">
                    <Form.Check
                      type="checkbox"
                      checked={runtime_rates}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setruntimerates(e.target.checked)}
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
                      checked={is_common_to_all_departments}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setiscommontoalldepartments(e.target.checked)}
                      className="mt-0"
                    />
                    <span className="text-sm text-gray-600">Is Common to All Departments</span>
                  </label>
                </Col>
              </Form.Group>
            </Col>
          </Row>
          {/* Outlet Rates Table */}
         
            <Row className="mb-3 ">
              <Col sm={10}>
                <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                  <Table bordered size="sm" className="m-0">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="text-sm font-medium text-gray-700 py-2">Outlet Name</th>
                        <th className="text-sm font-medium text-gray-700 py-2">Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {newItem.outletRates.map((outlet, index) => (
                        <tr key={outlet.outletid}>
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
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Col>
            </Row>
    
          <Row className="mb-3 align-items-center">
            <Col xs={12} sm={4} className="mb-3 mb-sm-0">
              <Form.Group as={Row} className="align-items-center">
                <Form.Label column sm={6} className="text-sm font-medium text-gray-700">
                  Status
                </Form.Label>
                <Col sm={6}>
                  <Form.Select
                    value={status}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setStatus(e.target.value)}
                    className="rounded-lg"
                  >
                    <option value="Active">✅ Available</option>
                    <option value="Inactive">❌ Unavailable</option>
                  </Form.Select>
                </Col>
              </Form.Group>
            </Col>
            <Col xs={12} sm={4} className="mb-3 mb-sm-0"></Col>
            <Col xs={12} sm={4} className="d-flex justify-content-end gap-2">
              <Button
                variant="secondary"
                onClick={onHide}
                disabled={loading}
                style={{
                  borderRadius: '8px',
                  padding: '6px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  backgroundColor: '#e5e7eb',
                  borderColor: '#e5e7eb',
                  color: '#1a202c',
                }}
              >
                Back
              </Button>
              <Button
                variant="primary"
                onClick={handleAdd}
                disabled={loading}
                style={{
                  borderRadius: '8px',
                  padding: '6px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  backgroundColor: '#3b82f6',
                  borderColor: '#3b82f6',
                }}
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


// Helper function to map item_group_id to Category
const getCategoryFromItemGroupId = (itemGroupId: number | null, itemGroup: ItemGroupItem[]): Category => {
  if (!itemGroupId) return 'All';
  const group = itemGroup.find(g => g.item_groupid === itemGroupId);
  if (!group) return 'All';
  const cleanName = group.itemgroupname.replace(/\.\.\./, '').trim();
  switch (cleanName) {
    case 'Appetizers': return 'Appetizers';
    case 'MainCourse': return 'MainCourse';
    case 'Desserts': return 'Desserts';
    case 'Beverages': return 'Beverages';
    case 'Cocktails': return 'Cocktails';
    case 'Salads': return 'Salads';
    case 'Soups': return 'Soups';
    case 'Breakfast': return 'Breakfast';
    case 'VeganOptions': return 'VeganOptions';
    default: return 'All';
  }
};
const EditItemModal: React.FC<ModalProps> = ({
  show,
  onHide,
  onSuccess,
  setData,
  setCardItems,
  mstmenu,
  itemCategories,
  setItemCategories,
}) => {
  const [outlet_id, setoutletid] = useState<string | null>(null);
  const [hotel_name_id, sethotelnameid] = useState<string | null>(null);
  const [item_no, setitemno] = useState<string | null>(null);
  const [item_name, setitemname] = useState('');
  const [print_name, setprintname] = useState<string | null>(null);
  const [short_name, setshortname] = useState<string | null>(null);
  const [kitchenCategory, setKitchenCategory] = useState<KitchenCategoryItem[]>([]);
  const [kitchen_category_id, setkitchencategoryid] = useState<number | null>(null);
  const [kitchenSubCategory, setKitchenSubCategory] = useState<KitchenSubCategoryItem[]>([]);
  const [kitchen_sub_category_id, setKitchenSubCategoryid] = useState<number | null>(null);
  const [kitchenMainGroup, setKitchenMainGroup] = useState<KitchenMainGroupItem[]>([]);
  const [kitchen_main_group_id, setkitchenmaingroupid] = useState<number | null>(null);
  const [item_group, setitemgroup] = useState<ItemGroupItem[]>([]);
  const [item_group_id, setitemgroupid] = useState<number | null>(null);
  const [ItemMainGroup, setItemMainGroup] = useState<ItemMainGroupItem[]>([]);
  const [item_maingroupid, setitemmaingroupid] = useState<number | null>(null);
  const [stock_unit, setstockunit] = useState<string | null>(null);
  const [price, setprice] = useState('');
  const [tax, settax] = useState<number | null>(null);
  const [runtime_rates, setruntimerates] = useState(false);
  const [is_common_to_all_departments, setiscommontoalldepartments] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('Active');
  const [outlets, setOutlets] = useState<OutletData[]>([]);
  const [selectedOutlet, setSelectedOutlet] = useState<number | null>(null);
  const { user } = useAuthContext();
  const [newItem, setNewItem] = useState<NewItem>({ outletRates: [] });
  const [selectedBrand, setSelectedBrand] = useState<number | null>(null);
  const [brands, setBrands] = useState<Array<{ hotelid: number; hotel_name: string }>>([]);


  const taxOptions = [
    { value: 0, label: '0%' },
    { value: 5, label: '5%' },
    { value: 12, label: '12%' },
    { value: 18, label: '18%' },
    { value: 28, label: '28%' },
  ];

  // Load existing item data
  useEffect(() => {
    if (mstmenu) {
      setoutletid(mstmenu.outlet_id ? String(mstmenu.outlet_id) : null);
      sethotelnameid(mstmenu.hotel_name_id ? String(mstmenu.hotel_name_id) : null);
      setitemno(mstmenu.item_no || null);
      setitemname(mstmenu.item_name || '');
      setprintname(mstmenu.print_name || null);
      setshortname(mstmenu.short_name || null);
      setkitchencategoryid(mstmenu.kitchen_category_id ?? null);
      setKitchenSubCategoryid(mstmenu.kitchen_sub_category_id ?? null);
      setkitchenmaingroupid(mstmenu.kitchen_main_group_id ?? null);
      setitemgroupid(mstmenu.item_group_id ?? null);
      setitemmaingroupid(mstmenu.item_main_group_id ?? null);
      setstockunit(mstmenu.stock_unit || null);
      setprice(mstmenu.price ? String(mstmenu.price) : '');
      settax(mstmenu.tax ?? null);
      setruntimerates(mstmenu.runtime_rates || false);
      setiscommontoalldepartments(mstmenu.is_common_to_all_departments || false);
      setStatus(mstmenu.status === 0 ? 'Active' : 'Inactive');
      setSelectedOutlet(mstmenu.outlet_id || null);

      // Initialize outletRates with existing rates (if available)
      // Assuming mstmenu.outletRates is not provided; initialize with 0
      // If backend provides outletRates, map them here
      setNewItem({
        outletRates: outlets.length > 0
          ? outlets.map((outlet) => ({
              outletid: outlet.outletid,
              outletName: outlet.outlet_name,
              rate: 0, // Replace with actual rate if available in mstmenu
            }))
          : [],
      });
    }
  }, [mstmenu, outlets]);

  // Fetch data
  useEffect(() => {
    fetchKitchenCategory(setKitchenCategory, setkitchencategoryid, kitchen_category_id ?? undefined);
    fetchKitchenMainGroup(setKitchenMainGroup, setkitchenmaingroupid);
    fetchKitchenSubCategory(setKitchenSubCategory, setKitchenSubCategoryid);
    fetchItemGroup(setitemgroup, setitemgroupid);
    fetchItemMainGroup(setItemMainGroup, setitemmaingroupid);
   fetchOutletsForDropdown(user, setOutlets, setLoading);
    fetchBrands(user, setBrands);
  }, [kitchen_category_id, user]);

  const handleOutletChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedOutlet(Number(e.target.value));
  };

  // Initialize outletRates when outlets are fetched
  useEffect(() => {
    if (outlets.length > 0 && newItem.outletRates.length === 0) {
      const initialOutletRates = outlets.map((outlet) => ({
        outletid: outlet.outletid,
        outletName: outlet.outlet_name,
        rate: 0, // Default rate; replace with actual rate if available
      }));
      setNewItem({ outletRates: initialOutletRates });
    }
  }, [outlets, newItem.outletRates.length]);

  const handleUpdate = async () => {
    if (!mstmenu) {
      toast.error('No item selected for editing');
      return;
    }
    if (!item_name || item_name.trim() === '') {
      toast.error('Item Name is required');
      return;
    }
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) < 0) {
      toast.error('Price is required and must be a valid non-negative number');
      return;
    }
    if (!status) {
      toast.error('Status is required');
      return;
    }

    setLoading(true);
    try {
      const statusValue = status === 'Active' ? 0 : 1;
      const currentDate = new Date().toISOString();
      const payload = {
        outlet_id: outlet_id ? parseInt(outlet_id) : null,
        hotel_name_id: hotel_name_id ? parseInt(hotel_name_id) : null,
        item_no: item_no || null,
        item_name: item_name.trim(),
        print_name: print_name || null,
        short_name: short_name || null,
        kitchen_category_id,
        kitchen_sub_category_id,
        kitchen_main_group_id,
        item_group_id,
        item_main_group_id: item_maingroupid,
        stock_unit: stock_unit || null,
        price: parseFloat(price).toFixed(2),
        tax: tax !== null ? tax : null,
        runtime_rates: runtime_rates ? 1 : 0,
        is_common_to_all_departments: is_common_to_all_departments ? 1 : 0,
        status: statusValue,
        updated_by_id: 2,
        updated_date: currentDate,
        outletRates: newItem.outletRates.map(({ outletid, rate }) => ({ outletid, rate })), // Send outlet rates to backend
      };
      console.log('Sending to backend:', JSON.stringify(payload, null, 2));

      const res = await fetch(`http://localhost:3001/api/Menu/${mstmenu.menuid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get('Content-Type');
      console.log('Response status:', res.status, 'Content-Type:', contentType);

      if (!res.ok) {
        const text = await res.text();
        console.error('Server response:', text.slice(0, 200));
        if (contentType?.includes('application/json')) {
          try {
            const errorData = JSON.parse(text);
            toast.error(`Failed to update item: ${errorData.error || errorData.message || 'Unknown error'}`);
          } catch (jsonErr) {
            console.error('JSON parse error:', jsonErr);
            toast.error('Server returned invalid JSON.');
          }
        } else {
          toast.error(`Server error (${res.status}): Check backend logs for details.`);
        }
        return;
      }

      const updatedItem = await res.json();
      console.log('Received updated item:', updatedItem);
      toast.success('Item updated successfully');

      // Update data state
      // setData((prev) =>
      //   prev.map((item) =>
      //     item.menuid === mstmenu.menuid ? { ...item, ...payload, menuid: mstmenu.menuid } : item
      //   )
      // );

      // Determine old and new categories
     const oldCategory = getCategoryFromItemGroupId(mstmenu.item_group_id);
     const newCategory = getCategoryFromItemGroupId(payload.item_group_id);

      // Update cardItems
      const updatedCardItem = {
        userId: String(mstmenu.menuid),
        itemId: payload.item_no || '',
        ItemName: payload.item_name,
        aliasName: payload.short_name || '',
        price: parseFloat(payload.price) || 0,
        visits: itemCategories.All.find((item) => item.userId === String(mstmenu.menuid))?.visits || 0,
        cardStatus: statusValue === 0 ? '✅ Available' : '❌ Unavailable',
      };

      setCardItems((prev) =>
        prev.map((item) => (item.userId === String(mstmenu.menuid) ? updatedCardItem : item))
      );

      // Update itemCategories
      setItemCategories((prev) => {
        const updatedCategories = { ...prev };
        if (oldCategory !== newCategory && oldCategory !== 'All') {
          updatedCategories[oldCategory] = updatedCategories[oldCategory].filter(
            (item) => item.userId !== String(mstmenu.menuid)
          );
        }
        updatedCategories.All = updatedCategories.All.map((item) =>
          item.userId === String(mstmenu.menuid) ? updatedCardItem : item
        );
        if (newCategory !== 'All') {
          const existsInNewCategory = updatedCategories[newCategory].some(
            (item) => item.userId === String(mstmenu.menuid)
          );
          if (existsInNewCategory) {
            updatedCategories[newCategory] = updatedCategories[newCategory].map((item) =>
              item.userId === String(mstmenu.menuid) ? updatedCardItem : item
            );
          } else {
            updatedCategories[newCategory] = [...updatedCategories[newCategory], updatedCardItem];
          }
        }
        console.log('Updated itemCategories:', updatedCategories);
        return updatedCategories;
      });

      onSuccess();
      onHide();
    } catch (err: any) {
      console.error('Update Item error:', err.message, err.stack);
      toast.error(`Failed to update item: ${err.message || 'Please check server status.'}`);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to map item_group_id to Category
  const getCategoryFromItemGroupId = (itemGroupId: number | null): Category => {
    if (!itemGroupId) return 'All';
    const group = item_group.find((g) => g.item_groupid === itemGroupId);
    if (!group) return 'All';
    const cleanName = group.itemgroupname.replace(/\.\.\./, '').trim();
    switch (cleanName) {
      case 'Appetizers':
        return 'Appetizers';
      case 'MainCourse':
        return 'MainCourse';
      case 'Desserts':
        return 'Desserts';
      case 'Beverages':
        return 'Beverages';
      case 'Cocktails':
        return 'Cocktails';
      case 'Salads':
        return 'Salads';
      case 'Soups':
        return 'Soups';
      case 'Breakfast':
        return 'Breakfast';
      case 'VeganOptions':
        return 'VeganOptions';
      default:
        return 'All';
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
            <Col xs={12} sm={6} className="mb-3 mb-sm-0">
              <Form.Group as={Row} className="align-items-center">
                <Form.Label column sm={4} className="text-sm font-medium text-gray-700">
                  Outlet
                </Form.Label>
                <Col sm={8}>
                  <select
                    className="form-control rounded-lg"
                    value={selectedOutlet || ''}
            onChange={handleOutletChange}
            disabled={loading}
          >
            <option value="">Select an outlet</option>
            {outlets.map((outlet) => (
              <option key={outlet.outletid} value={outlet.outletid}>
                {outlet.outlet_name} ({outlet.brand_name})
              </option>
            ))}
                  </select>
                </Col>
              </Form.Group>
            </Col>
            <Col xs={12} sm={6}>
              <Form.Group as={Row} className="align-items-center">
                <Form.Label column sm={4} className="text-sm font-medium text-gray-700">
                  Hotel Name
                </Form.Label>
                <Col sm={8}>
                  <Form.Select
                     value={selectedBrand || ''}
            onChange={(e) => setSelectedBrand(e.target.value ? Number(e.target.value) : null)}
            disabled={loading}
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
                <Form.Label column sm={4} className="text-sm font-medium text-gray-700">
                  Item Number
                </Form.Label>
                <Col sm={8}>
                  <Form.Control
                    type="text"
                    value={item_no ?? ''}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setitemno(e.target.value || null)}
                    placeholder="Enter item number"
                    className="rounded-lg"
                  />
                </Col>
              </Form.Group>
            </Col>
            <Col xs={12} sm={6}>
              <Form.Group as={Row} className="align-items-center">
                <Form.Label column sm={4} className="text-sm font-medium text-gray-700">
                  Item Name
                </Form.Label>
                <Col sm={8}>
                  <Form.Control
                    type="text"
                    value={item_name}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setitemname(e.target.value)}
                    placeholder="Enter item name"
                    className="rounded-lg"
                    required
                  />
                </Col>
              </Form.Group>
            </Col>
          </Row>
          <Row className="mb-3">
            <Col xs={12} sm={6} className="mb-3 mb-sm-0">
              <Form.Group as={Row} className="align-items-center">
                <Form.Label column sm={4} className="text-sm font-medium text-gray-700">
                  Print Name
                </Form.Label>
                <Col sm={8}>
                  <Form.Control
                    type="text"
                    value={print_name ?? ''}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setprintname(e.target.value || null)}
                    placeholder="Enter print name"
                    className="rounded-lg"
                  />
                </Col>
              </Form.Group>
            </Col>
            <Col xs={12} sm={6}>
              <Form.Group as={Row} className="align-items-center">
                <Form.Label column sm={4} className="text-sm font-medium text-gray-700">
                  Short Name
                </Form.Label>
                <Col sm={8}>
                  <Form.Control
                    type="text"
                    value={short_name ?? ''}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setshortname(e.target.value || null)}
                    placeholder="Enter short name"
                    className="rounded-lg"
                  />
                </Col>
              </Form.Group>
            </Col>
          </Row>
          <Row className="mb-3">
            <Col xs={12} sm={4} className="mb-3 mb-sm-0">
              <Form.Group as={Row} className="align-items-center">
                <Form.Label column sm={6} className="text-sm font-medium text-gray-700">
                  Kitchen Main Group
                </Form.Label>
                <Col sm={6}>
                  <Form.Select
                    value={kitchen_main_group_id ?? ''}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                      const value = e.target.value;
                      setkitchenmaingroupid(value === '' ? null : Number(value));
                    }}
                    className="rounded-lg"
                    disabled={loading}
                  >
                    <option value="">Select Kitchen Main Group</option>
                    {kitchenMainGroup
                      .filter((group) => String(group.status) === '0')
                      .map((group) => (
                        <option key={group.kitchenmaingroupid} value={group.kitchenmaingroupid}>
                          {group.Kitchen_main_Group}
                        </option>
                      ))}
                  </Form.Select>
                </Col>
              </Form.Group>
            </Col>
            <Col xs={12} sm={4} className="mb-3 mb-sm-0">
              <Form.Group as={Row} className="align-items-center">
                <Form.Label column sm={6} className="text-sm font-medium text-gray-700">
                  Kitchen Category
                </Form.Label>
                <Col sm={6}>
                  <Form.Select
                    value={kitchen_category_id ?? ''}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                      const value = e.target.value;
                      setkitchencategoryid(value === '' ? null : Number(value));
                    }}
                    className="rounded-lg"
                    disabled={loading}
                  >
                    <option value="">Select Kitchen Category</option>
                    {kitchenCategory
                      .filter((category) => String(category.status) === '0')
                      .map((category) => (
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
                <Form.Label column sm={6} className="text-sm font-medium text-gray-700">
                  Kitchen Sub Category
                </Form.Label>
                <Col sm={6}>
                  <Form.Select
                    value={kitchen_sub_category_id ?? ''}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                      const value = e.target.value;
                      setKitchenSubCategoryid(value === '' ? null : Number(value));
                    }}
                    className="rounded-lg"
                    disabled={loading}
                  >
                    <option value="">Select Kitchen Sub Category</option>
                    {kitchenSubCategory
                      .filter((subCategory) => String(subCategory.status) === '0')
                      .map((subCategory) => (
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
            <Col xs={12} sm={6} className="mb-3 mb-sm-0">
              <Form.Group as={Row} className="align-items-center">
                <Form.Label column sm={4} className="text-sm font-medium text-gray-700">
                  Item Main Group
                </Form.Label>
                <Col sm={8}>
                  <Form.Select
                    value={item_maingroupid ?? ''}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                      const value = e.target.value;
                      setitemmaingroupid(value === '' ? null : Number(value));
                    }}
                    className="rounded-lg"
                    disabled={loading}
                  >
                    <option value="">Select Item Main Group</option>
                    {ItemMainGroup
                      .filter((group) => String(group.status) === '0')
                      .map((group) => (
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
                <Form.Label column sm={4} className="text-sm font-medium text-gray-700">
                  Item Group
                </Form.Label>
                <Col sm={8}>
                  <Form.Select
                    value={item_group_id ?? ''}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                      const value = e.target.value;
                      setitemgroupid(value === '' ? null : Number(value));
                    }}
                    className="rounded-lg"
                    disabled={loading}
                  >
                    <option value="">Select Item Group</option>
                    {item_group
                      .filter((group) => String(group.status) === '0')
                      .map((group) => (
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
                <Form.Label column sm={4} className="text-sm font-medium text-gray-700">
                  Stock Unit
                </Form.Label>
                <Col sm={8}>
                  <Form.Select
                    value={stock_unit ?? ''}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setstockunit(e.target.value || null)}
                    className="rounded-lg"
                  >
                    <option value="">Select Stock Unit</option>
                    <option value="Piece">Piece</option>
                    <option value="Kg">Kg</option>
                    <option value="Liter">Liter</option>
                    <option value="Unit">Unit</option>
                  </Form.Select>
                </Col>
              </Form.Group>
            </Col>
            <Col xs={12} sm={6}>
              <Form.Group as={Row} className="align-items-center">
                <Form.Label column sm={4} className="text-sm font-medium text-gray-700">
                  Price
                </Form.Label>
                <Col sm={8}>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    value={price}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setprice(e.target.value)}
                    placeholder="Enter price (e.g., 10.99)"
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
                <Form.Label column sm={4} className="text-sm font-medium text-gray-700">
                  Tax (%)
                </Form.Label>
                <Col sm={8}>
                  <Form.Select
                    value={tax ?? ''}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                      const value = e.target.value;
                      settax(value === '' ? null : parseFloat(value));
                    }}
                    className="rounded-lg"
                  >
                    <option value="">Select Tax</option>
                    {taxOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
              </Form.Group>
            </Col>
          </Row>
          <Row className="mb-3">
            <Col xs={12} sm={6} className="mb-3 mb-sm-0">
              <Form.Group as={Row} className="align-items-center">
                <Col sm={12}>
                  <label className="d-flex align-items-center gap-2 cursor-pointer">
                    <Form.Check
                      type="checkbox"
                      checked={runtime_rates}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setruntimerates(e.target.checked)}
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
                      checked={is_common_to_all_departments}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setiscommontoalldepartments(e.target.checked)}
                      className="mt-0"
                    />
                    <span className="text-sm text-gray-600">Is Common to All Departments</span>
                  </label>
                </Col>
              </Form.Group>
            </Col>
          </Row>
          {/* Outlet Rates Table */}
         
            <Row className="mb-3">
              <Col sm={10}>
                <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                  <Table bordered size="sm" className="m-0">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="text-sm font-medium text-gray-700 py-2">Outlet Name</th>
                        <th className="text-sm font-medium text-gray-700 py-2">Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {newItem.outletRates.map((outlet, index) => (
                        <tr key={outlet.outletid}>
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
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Col>
            </Row>
         
          <Row className="mb-3 align-items-center">
            <Col xs={12} sm={4} className="mb-3 mb-sm-0">
              <Form.Group as={Row} className="align-items-center">
                <Form.Label column sm={6} className="text-sm font-medium text-gray-700">
                  Status
                </Form.Label>
                <Col sm={6}>
                  <Form.Select
                    value={status}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setStatus(e.target.value)}
                    className="rounded-lg"
                  >
                    <option value="Active">✅ Available</option>
                    <option value="Inactive">❌ Unavailable</option>
                  </Form.Select>
                </Col>
              </Form.Group>
            </Col>
            <Col xs={12} sm={4} className="mb-3 mb-sm-0"></Col>
            <Col xs={12} sm={4} className="d-flex justify-content-end gap-2">
              <Button
                variant="secondary"
                onClick={onHide}
                disabled={loading}
                style={{
                  borderRadius: '8px',
                  padding: '6px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  backgroundColor: '#e5e7eb',
                  borderColor: '#e5e7eb',
                  color: '#1a202c',
                }}
              >
                Back
              </Button>
              <Button
                variant="primary"
                onClick={handleUpdate}
                disabled={loading}
                style={{
                  borderRadius: '8px',
                  padding: '6px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  backgroundColor: '#3b82f6',
                  borderColor: '#3b82f6',
                }}
              >
                {loading ? 'Saving...' : 'Update Item'}
              </Button>
            </Col>
          </Row>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default Menu; 