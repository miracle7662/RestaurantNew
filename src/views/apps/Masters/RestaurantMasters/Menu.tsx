import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuthContext } from '@/common';
import { OutletData } from "@/common/api/outlet";
import MenuService from '@/common/api/menu';
import TableDepartmentService from '@/common/api/tabledepartment';

import { Button, Modal, Form, Row, Col, Card, Table, Navbar, Offcanvas, Tab, Nav } from 'react-bootstrap';
import {
  fetchKitchenCategory,
  fetchKitchenMainGroup,
  fetchKitchenSubCategory,
  fetchItemGroup,
  fetchItemMainGroup,
  fetchData,
  fetchunitmaster,
  fetchBrands,
  fetchOutletsForDropdown,
  fetchWarehouses,
  KitchenCategoryItem,
  KitchenMainGroupItem,
  KitchenSubCategoryItem,
  ItemGroupItem,
  ItemMainGroupItem,
  TaxGroup,
  unitmasterItem,
  WarehouseItem,
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
  itemgroupname: string | null;
  groupname: string | null;
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
  unitid:  number | null;
  servingunitid: number | null;
  IsConversion: number | null;
  // 🔥 NEW STOCK FIELDS + RAW MATERIALS 🔥
  is_ingredients_required?: number;
  consume_on_bill?: number;
  reverse_stock_cancel_kot?: number;
  allow_negative_stock?: number;
  opening_stock_quantity?: number;
  opening_stock_unit_id?: number | null;
  // 🔥 NEW RAW MATERIALS FIELDS 🔥
  consume_raw_materials_on_bill?: number;
  consume_raw_materials_on_kot?: number;
  store_name?: number | null;
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

interface DepartmentRate {
  departmentid: number;
  departmentName: string;
  rate: number;
  half_rate: number;
  full_rate: number;
  unitid: number | null;
  servingunitid: number | null;
  IsConversion: number;
  variant_rates: { [variant_value_id: number]: number };
  taxgroupid: number | null;
   value_name: string | null;
}

interface NewItem {
  departmentRates: DepartmentRate[];
}

interface DepartmentItem {
  departmentid: number;
  department_name: string;
  outletid: number;
}

interface VariantValue {
  variant_value_id: number;
  value_name: string;
  sort_order: number;
  active: number;
}

interface VariantType {
  variant_type_id: number;
  variant_type_name: string;
  hotelid: number | null;
  outletid: number | null;
  sort_order: number;
  active: number;
  values: VariantValue[];
}

interface ModalProps {
  show: boolean;
  onHide: () => void;
  onSuccess: () => void;
  setData: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  setCardItems: React.Dispatch<React.SetStateAction<CardItem[]>>;
  mstmenu?: MenuItem;
  variantTypes: VariantType[];
}

interface ItemModalProps extends ModalProps {
  isEdit: boolean;
}



const Menu: React.FC = () => {
  const [data, setData] = useState<MenuItem[]>([]);
  const [cardItems, setCardItems] = useState<CardItem[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [globalFilter, setGlobalFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [, setOutlets] = useState<OutletData[]>([]);
  const [, setBrands] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]); // State for sidebar menu items
  const [selectedItemGroup, setSelectedItemGroup] = useState<number | null>(null); // State for selected item group filter
  const [error, setError] = useState<string | null>(null); // State for error handling
  const [variantTypes, setVariantTypes] = useState<VariantType[]>([]); // State for variant types
  const [showImportModal, setShowImportModal] = useState(false); // Import modal state
  const [importing, setImporting] = useState(false); // Import loading state
  const { user } = useAuthContext();


  const fetchMenu = async () => {
    try {
      setLoading(true);
      const response = await MenuService.list({
        hotelid: user?.hotelid,
        outletid: user?.outletid
      });
      
      if (response.success) {
        const menuData = response.data || [];
        setData(menuData);
        setMenuItems(menuData);

        const updatedCardItems = menuData.map((item) => ({
          userId: String(item.restitemid),
          itemId: item.item_no || '',
          ItemName: item.item_name,
          aliasName: item.short_name || '',
          price: item.price || 0,
          visits: 0,
          cardStatus: item.status === 1 ? '✅ Available' : '❌ Unavailable',
        }));

        setCardItems(updatedCardItems);
      }
    } catch (err) {
      // console.error('Fetch Menu error:', err);
      toast.error('Failed to fetch menu');
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuItems = async (hotelid?: number, outletid?: number) => {
    try {
      setLoading(true);
      setError(null);

      const response = await MenuService.list({ hotelid, outletid });
      
      if (response.success) {
        // console.log('Fetched menu items:', response.data);
        setMenuItems(response.data || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch menu items');
      toast.error('Failed to fetch Menu Items');
      // console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
    fetchOutletsForDropdown(user, setOutlets, setLoading);
    fetchBrands(user, setBrands);
    fetchMenuItems(user?.hotelid, user?.outletid); // Fetch menu items for sidebar
    fetchVariantTypes(); // Fetch variant types
  }, [user]);

  // Fetch variant types from API
  const fetchVariantTypes = async () => {
    try {
      const response = await MenuService.getVariantTypes();
      if (response.success) {
        setVariantTypes(response.data || []);
        // console.log('Fetched variant types:', response.data);
      }
    } catch (err) {
      // console.error('Error fetching variant types:', err);
    }
  };

  const handleEditItem = (item: MenuItem) => {
    setEditItem(item);
    setShowEditModal(true);
  };

  // Updated handleToggleStatus function in Menu.tsx
  const handleToggleStatus = async (itemId: string) => {
    const item = data.find((p) => p.restitemid === Number(itemId));
    if (item) {
      const newStatus = item.status === 1 ? 0 : 1;
      try {
        const response = await MenuService.updateStatus(Number(itemId), newStatus, user?.id);
        if (response.success) {
          // Update local state after successful API call
          const updatedItem = { ...item, status: newStatus };
          setData((prev) => prev.map((i) => (i.restitemid === Number(itemId) ? updatedItem : i)));
          setCardItems((prev) =>
            prev.map((card) =>
              card.userId === itemId
                ? { ...card, cardStatus: newStatus === 1 ? '✅ Available' : '❌ Unavailable' }
                : card
            )
          );
          toast.success('Status updated successfully');
        }
      } catch (err) {
        // console.error('Error updating status:', err);
        toast.error('Failed to update status');
      }
    }
  };

  // Updated handleToggleGroupStatus function in Menu.tsx
  const handleToggleGroupStatus = async (groupId: number) => {
    const groupItems = menuItems.filter(item => item.item_group_id === groupId);
    if (groupItems.length > 0) {
      const currentStatus = groupItems[0].status;
      const newStatus = currentStatus === 1 ? 0 : 1;
      try {
        // Update all items in the group
        const promises = groupItems.map(item =>
          MenuService.updateStatus(item.restitemid, newStatus, user?.id)
        );
        const responses = await Promise.all(promises);
        
        // Check if all updates were successful
        const allSuccess = responses.every(res => res.success);
        if (!allSuccess) {
          throw new Error('Failed to update some items');
        }
        
        // Update local state after successful API calls
        const updatedItems = menuItems.map((item) =>
          item.item_group_id === groupId ? { ...item, status: newStatus } : item
        );
        setMenuItems(updatedItems);
        const updatedData = data.map((item) =>
          updatedItems.find((ui) => ui.restitemid === item.restitemid)
            ? { ...item, status: updatedItems.find((ui) => ui.restitemid === item.restitemid)!.status }
            : item
        );
        setData(updatedData);
        setCardItems((prev) =>
          prev.map((card) => {
            const updatedItem = updatedData.find((item) => item.restitemid === Number(card.userId));
            return updatedItem
              ? {
                ...card,
                cardStatus: updatedItem.status === 1 ? '✅ Available' : '❌ Unavailable',
              }
              : card;
          })
        );
        toast.success('Group status updated successfully');
      } catch (err) {
        // console.error('Error updating group status:', err);
        toast.error('Failed to update group status');
      }
    }
  };

  const handleSuccess = () => {
    fetchMenu();
    fetchMenuItems(user?.hotelid, user?.outletid);
  };

  // Handle import menu items from Excel
  const handleImport = async (file: File) => {
    if (!user?.hotelid) {
      toast.error('Hotel ID is required for import');
      return;
    }
    
    setImporting(true);
    try {
      const response = await MenuService.importMenu(
        file, 
        Number(user.hotelid), 
        user.outletid ? Number(user.outletid) : undefined,
        user.id
      );
      
      if (response.success) {
        toast.success(`Successfully imported ${response.data?.imported || 0} items`);
        if (response.data?.errors && response.data.errors.length > 0) {
          // console.warn('Import errors:', response.data.errors);
        }
        handleSuccess();
        setShowImportModal(false);
      } else {
        toast.error(response.message || 'Failed to import menu items');
      }
    } catch (err: any) {
      // console.error('Import error:', err);
      toast.error(err.message || 'Failed to import menu items');
    } finally {
      setImporting(false);
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
            <Button
              variant="outline-success"
              size="sm"
              onClick={async () => {
                try {
                  const response: any = await MenuService.exportMenu(user?.hotelid, user?.outletid);
                  const url = window.URL.createObjectURL(new Blob([response.data]));
                  const link = document.createElement('a');
                  link.href = url;
                  link.setAttribute('download', 'menu_items_export.xlsx');
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                  toast.success('Menu exported successfully');
                } catch (err: any) {
                  // console.error('Export error:', err);
                  toast.error('Failed to export menu');
                }
              }}
              style={{ borderRadius: '8px', padding: '6px 16px', fontSize: '14px', fontWeight: '500' }}
              title="Export Menu"
            >
              Export
            </Button>
            <Button
              variant="outline-info"
              size="sm"
              onClick={() => setShowImportModal(true)}
              style={{ borderRadius: '8px', padding: '6px 16px', fontSize: '14px', fontWeight: '500' }}
              title="Import Menu"
            >
              Import
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
            ) : menuItems.length === 0 ? (
              <p className="text-muted">No item groups available.</p>
            ) : (
              <Table striped bordered hover size="sm" style={{ marginBottom: 0, tableLayout: 'fixed', width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ width: '70%', padding: '8px', backgroundColor: '#f8f9fa', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Item Group</th>
                    <th style={{ width: '30%', padding: '8px', backgroundColor: '#f8f9fa', fontWeight: '600', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    style={{ backgroundColor: !data.length ? '#e9ecef' : 'transparent', color: '#2d3748' }}
                    onClick={() => {
                      setSelectedItemGroup(null);
                      setShowSidebar(false);
                    }}
                  >
                    <td style={{ padding: '8px', verticalAlign: 'middle', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>All</td>
                    <td style={{ padding: '8px', verticalAlign: 'middle', textAlign: 'center' }}>
                      <Button
                        variant="outline-success"
                        size="sm"
                        disabled
                        style={{ borderRadius: '15px', width: '40px', height: '20px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', backgroundColor: '#28a745' }}
                      >
                        <div style={{ width: '16px', height: '16px', backgroundColor: 'white', borderRadius: '50%', margin: '2px' }} />
                      </Button>
                    </td>
                  </tr>
                  {Array.from(new Set(menuItems
                    .filter((item) => item.item_group_id !== null)
                    .map(item => item.item_group_id as number)))
                    .map(groupId => {
                      const groupItems = menuItems.filter(item => item.item_group_id === groupId);
                      const groupName = groupItems[0].groupname || `Group ${groupId}`;
                      const groupStatus = groupItems[0].status; // Use the status of the first item, assuming all are the same after toggle
                      return (
                        <tr
                          key={groupId}
                          style={{ backgroundColor: groupStatus === 0 ? '#e9ecef' : 'transparent', color: '#2d3748' }}
                          onClick={() => {
                            setSelectedItemGroup(groupId);
                            setShowSidebar(false);
                          }}
                        >
                          <td style={{ padding: '8px', verticalAlign: 'middle', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {groupName}
                          </td>
                          <td style={{ padding: '8px', verticalAlign: 'middle', textAlign: 'center' }}>
                            <Button
                              variant="outline-success"
                              size="sm"
                              onClick={() => handleToggleGroupStatus(groupId)}
                              style={{
                                borderRadius: '15px',
                                width: '40px',
                                height: '20px',
                                padding: '0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: groupStatus === 0 ? 'flex-start' : 'flex-end',
                                backgroundColor: groupStatus === 0 ? '#6c757d' : '#28a745',
                                border: 'none',
                              }}
                            >
                              <div style={{ width: '16px', height: '16px', backgroundColor: 'white', borderRadius: '50%', margin: '2px' }} />
                            </Button>
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
              {cardItems.filter(item => selectedItemGroup === null || data.find(d => d.restitemid === Number(item.userId))?.item_group_id === selectedItemGroup).map((item, index) => {
                const menuItem = data.find((p) => p.restitemid === Number(item.userId));
                const isActive = item.cardStatus === '✅ Available';
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
                          <Button
                            variant="outline-success"
                            size="sm"
                            onClick={() => menuItem && handleToggleStatus(item.userId)}
                            style={{
                              borderRadius: '15px',
                              width: '40px',
                              height: '20px',
                              padding: '0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: isActive ? 'flex-end' : 'flex-start',
                              backgroundColor: isActive ? '#28a745' : '#6c757d',
                              border: 'none',
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
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </div>
        </div>

        <ItemModal
          show={showAddModal}
          onHide={() => setShowAddModal(false)}
          onSuccess={handleSuccess}
          setData={setData}
          setCardItems={setCardItems}
          variantTypes={variantTypes}
          isEdit={false}
        />
        <ItemModal
          show={showEditModal}
          onHide={() => setShowEditModal(false)}
          onSuccess={handleSuccess}
          setData={setData}
          setCardItems={setCardItems}
          mstmenu={editItem ?? undefined}
          variantTypes={variantTypes}
          isEdit={true}
        />

        {/* Import Modal */}
        <Modal show={showImportModal} onHide={() => setShowImportModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Import Menu Items</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Select Excel File</Form.Label>
                <Form.Control
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e: any) => {
                    const file = e.target.files[0];
                    if (file) {
                      handleImport(file);
                    }
                  }}
                />
                <Form.Text className="text-muted">
                  Download sample template: 
                  <Button 
                    variant="link" 
                    size="sm" 
                  onClick={async () => {
                      try {
                        const response: any = await MenuService.downloadSampleTemplate();
                        // Handle blob response - HttpClient interceptor returns response.data
                        const blob = response instanceof Blob ? response : response.data;
                        const url = window.URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.setAttribute('download', 'menu_import_template.xlsx');
                        document.body.appendChild(link);
                        link.click();
                        link.remove();
                        window.URL.revokeObjectURL(url);
                        toast.success('Template downloaded successfully');
                      } catch (err) {
                        // console.error('Template download error:', err);
                        toast.error('Failed to download template');
                      }
                    }}
                  >
                    Download Template
                  </Button>
                </Form.Text>
              </Form.Group>
              {importing && (
                <div className="text-center my-3">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2">Importing menu items...</p>
                </div>
              )}
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowImportModal(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
};
const ItemModal: React.FC<ItemModalProps> = ({ show, onHide, onSuccess, setData, setCardItems, mstmenu, variantTypes, isEdit }) => {
  const [selectedOutlet, setSelectedOutlet] = useState<number | null>(mstmenu?.outletid || null);
  const [selectedBrand, setSelectedBrand] = useState<number | null>(mstmenu?.hotelid || null);
  const [itemNo, setItemNo] = useState<string | null>(mstmenu?.item_no || null);
  const [itemName, setItemName] = useState(mstmenu?.item_name || '');
  const [printName, setPrintName] = useState<string | null>(mstmenu?.print_name || null);
  const [shortName, setShortName] = useState<string | null>(mstmenu?.short_name || null);
  const [kitchenCategoryId, setKitchenCategoryId] = useState<number | null>(mstmenu?.kitchen_category_id || null);
  const [kitchenSubCategoryId, setKitchenSubCategoryId] = useState<number | null>(mstmenu?.kitchen_sub_category_id || null);
  const [kitchenMainGroupId, setKitchenMainGroupId] = useState<number | null>(mstmenu?.kitchen_main_group_id || null);
  const [itemMainGroupId, setItemMainGroupId] = useState<number | null>(mstmenu?.item_main_group_id || null);
  const [itemGroupId, setItemGroupId] = useState<number | null>(mstmenu?.item_group_id || null);
  const [stockUnit, setStockUnit] = useState<number | null>(mstmenu?.stock_unit ? Number(mstmenu.stock_unit) : null);
  const [price, setPrice] = useState<string>(mstmenu?.price ? mstmenu.price.toString() : '');
  const [taxgroupid, setTaxgroupid] = useState<number | null>(mstmenu?.taxgroupid || null);
  
  const [runtimeRates, setRuntimeRates] = useState(!!mstmenu?.is_runtime_rates);
  const [isCommonToAllDepartments, setIsCommonToAllDepartments] = useState(!!mstmenu?.is_common_to_all_departments);
  const [itemDescription, setItemDescription] = useState<string | null>(mstmenu?.item_description || null);
  const [itemHsncode, setItemHsncode] = useState<string | null>(mstmenu?.item_hsncode || null);
  const [status, setStatus] = useState<number>(mstmenu?.status ?? 1);
  const [newItem, setNewItem] = useState<NewItem>({
    departmentRates: [],
  });
  const [kitchenCategory, setKitchenCategory] = useState<KitchenCategoryItem[]>([]);
  const [kitchenSubCategory, setKitchenSubCategory] = useState<KitchenSubCategoryItem[]>([]);
  const [itemGroup, setItemGroup] = useState<ItemGroupItem[]>([]);
  const [kitchenMainGroup, setKitchenMainGroup] = useState<KitchenMainGroupItem[]>([]);
  const [itemMainGroup, setItemMainGroup] = useState<ItemMainGroupItem[]>([]);
  const [brands, setBrands] = useState<Array<{ hotelid: number; hotel_name: string }>>([]);
  const [outlets, setOutlets] = useState<OutletData[]>([]);
  const [outletsLoaded, setOutletsLoaded] = useState(false);
  const [taxGroups, setTaxGroups] = useState<TaxGroup[]>([]);
  const [stockUnits, setStockUnits] = useState<unitmasterItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuthContext();

  // Fetch max item number when Add modal opens
  const fetchMaxItemNo = async () => {
    try {
      const hotelid = user?.hotelid || selectedBrand;
      const response = await MenuService.getMaxItemNo(hotelid ? Number(hotelid) : undefined);
      if (response.success) {
        setItemNo(response.data?.nextItemNo || null);
      }
    } catch (err) {
      // console.error('Error fetching max item number:', err);
    }
  };

  useEffect(() => {
    const resetForm = async () => {
      setSelectedOutlet(user?.outletid ? Number(user.outletid) : null);
      setSelectedBrand(user?.hotelid ? Number(user.hotelid) : null);
      setItemNo(null);
      setItemName('');
      setPrintName(null);
      setShortName(null);
      setKitchenCategoryId(null);
      setKitchenSubCategoryId(null);
      setKitchenMainGroupId(null);
      setItemGroupId(null);
      setItemMainGroupId(null);
      setStockUnit(null);
      setPrice('');
      setTaxgroupid(null);
      setRuntimeRates(false);
      setIsCommonToAllDepartments(false);
      setItemDescription(null);
      setItemHsncode(null);
      setStatus(1);
      setNewItem({ departmentRates: [] });

      // 🔥 RESET NEW STOCK FIELDS + RAW MATERIALS 🔥
      setIsIngredientsRequired(false);
      setConsumeOnBill(true);
      setReverseStockCancelKot(false);
      setAllowNegativeStock(false);
      setOpeningStockQuantity(0);
      setOpeningStockUnitId(null);
      setConsumeRawOnBill(false);
      setConsumeRawOnKot(false);
      setStoreNameId(null);
      
      // Fetch max item number for auto-generation when adding new item
      if (!isEdit) {
        await fetchMaxItemNo();
      }
    };

    if (show && !isEdit) {
      resetForm();
    }
  }, [show, isEdit, user]);

  useEffect(() => {
    if (mstmenu && isEdit) {
      setSelectedOutlet(mstmenu.outletid || null);
      setSelectedBrand(mstmenu.hotelid || null);
      setItemNo(mstmenu.item_no || null);
      setItemName(mstmenu.item_name || '');
      setPrintName(mstmenu.print_name || null);
      setShortName(mstmenu.short_name || null);
      setKitchenCategoryId(mstmenu.kitchen_category_id || null);
      setKitchenSubCategoryId(mstmenu.kitchen_sub_category_id || null);
      setKitchenMainGroupId(mstmenu.kitchen_main_group_id || null);
      setItemGroupId(mstmenu.item_group_id || null);
      setItemMainGroupId(mstmenu.item_main_group_id || null);
      setStockUnit(mstmenu.stock_unit ? Number(mstmenu.stock_unit) : null);
      setPrice(mstmenu.price ? mstmenu.price.toString() : '');
      setTaxgroupid(mstmenu.taxgroupid || null);
      setRuntimeRates(!!mstmenu.is_runtime_rates);
      setIsCommonToAllDepartments(!!mstmenu.is_common_to_all_departments);
      setItemDescription(mstmenu.item_description || null);
      setItemHsncode(mstmenu.item_hsncode || null);
      setStatus(mstmenu.status ?? 1);

      // 🔥 FIXED: Load NEW STOCK FIELDS FROM API RESPONSE (0→false, 1→true) 🔥
      // console.log('Loading stock fields:', {
      //   is_ingredients_required: mstmenu?.is_ingredients_required,
      //   consume_on_bill: mstmenu?.consume_on_bill,
      //   reverse_stock_cancel_kot: mstmenu?.reverse_stock_cancel_kot,
      //   allow_negative_stock: mstmenu?.allow_negative_stock
      // });
      setIsIngredientsRequired(mstmenu?.is_ingredients_required === 1);
      setConsumeOnBill(mstmenu?.consume_on_bill === 1);
      setReverseStockCancelKot(mstmenu?.reverse_stock_cancel_kot === 1);
      setAllowNegativeStock(mstmenu?.allow_negative_stock === 1);
      setOpeningStockQuantity(mstmenu?.opening_stock_quantity || 0);
      setOpeningStockUnitId(mstmenu?.opening_stock_unit_id || null);
      // 🔥 NEW RAW MATERIALS FIELDS 🔥
      setConsumeRawOnBill(mstmenu?.consume_raw_materials_on_bill === 1);
      setConsumeRawOnKot(mstmenu?.consume_raw_materials_on_kot === 1);
      setStoreNameId(mstmenu?.store_name || null);
    }
  }, [mstmenu, isEdit]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const uniqueOutletsCallback = (data: OutletData[]) => {
          const uniqueOutlets = Array.from(
            new Map(data.map((outlet) => [outlet.outletid, outlet])).values()
          );
          setOutlets(uniqueOutlets);
          setOutletsLoaded(true);
          if (user?.outletid && !mstmenu) {
            setSelectedOutlet(Number(user.outletid));
          }
        };
        await Promise.all([
          fetchKitchenCategory(setKitchenCategory, setKitchenCategoryId, mstmenu?.kitchen_category_id?.valueOf() ?? undefined),
          fetchKitchenMainGroup(setKitchenMainGroup, setKitchenMainGroupId, mstmenu?.kitchen_main_group_id?.toString()),
          fetchKitchenSubCategory(setKitchenSubCategory, setKitchenSubCategoryId, mstmenu?.kitchen_sub_category_id?.toString()),
          fetchItemGroup(setItemGroup, setItemGroupId, mstmenu?.item_group_id?.toString(), user?.hotelid),

          fetchItemMainGroup(setItemMainGroup, setItemMainGroupId, mstmenu?.item_main_group_id?.toString(), user?.hotelid),
          fetchBrands(user, setBrands),
          fetchData(setTaxGroups, setTaxgroupid, mstmenu?.taxgroupid?.toString()),
          fetchunitmaster(setStockUnits, setStockUnit, mstmenu?.stock_unit?.toString()),
          fetchOutletsForDropdown(user, uniqueOutletsCallback, setLoading),
          fetchWarehouses(setWarehouses, setLoading),
        ]);
      } catch (err) {
        // console.error('Error loading data:', err);
        toast.error('Failed to load dropdown data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user, mstmenu]);

  const [selectedVariantType, setSelectedVariantType] = useState<string>("");
  const [showVariantValueModal, setShowVariantValueModal] = useState<boolean>(false);
  const [selectedVariantValues, setSelectedVariantValues] = useState<number[]>([]);
// 🔥 NEW STOCK FIELDS + RAW MATERIALS STATE 🔥
  const [isIngredientsRequired, setIsIngredientsRequired] = useState(false);
  const [consumeOnBill, setConsumeOnBill] = useState(true);
  const [reverseStockCancelKot, setReverseStockCancelKot] = useState(false);
  const [allowNegativeStock, setAllowNegativeStock] = useState(false);
  const [openingStockQuantity, setOpeningStockQuantity] = useState(0);
  const [openingStockUnitId, setOpeningStockUnitId] = useState<number | null>(null);
  // 🔥 NEW RAW MATERIALS FIELDS 🔥
  const [consumeRawOnBill, setConsumeRawOnBill] = useState(false);
  const [consumeRawOnKot, setConsumeRawOnKot] = useState(false);
  const [storeNameId, setStoreNameId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>('multiplePrice');

  useEffect(() => {
    const fetchDepartmentsForOutlet = async () => {
      if (selectedOutlet === null && selectedBrand === null) {
        setDepartments([]);
        setNewItem((prev) => ({ ...prev, departmentRates: [] }));
        return;
      }
      setLoading(true);
      try {
        // If "Is Common to All Departments" is checked, fetch by hotelid
        // Otherwise, fetch by outletid
        let deptResponse;
        if (isCommonToAllDepartments && selectedBrand) {
          deptResponse = await TableDepartmentService.list({ hotelid: selectedBrand });
        } else if (selectedOutlet) {
          deptResponse = await TableDepartmentService.list({ outletid: selectedOutlet });
        } else {
          setDepartments([]);
          setNewItem((prev) => ({ ...prev, departmentRates: [] }));
          return;
        }

        if (deptResponse.success) {
          const formattedDepartments: DepartmentItem[] = deptResponse.data.map((item) => ({
            departmentid: item.departmentid,
            department_name: item.department_name,
            outletid: item.outletid,
          }));
          setDepartments(formattedDepartments);

          // Filter departments based on the mode
          let filteredDepartments: DepartmentItem[] = [];
          if (isCommonToAllDepartments && selectedBrand) {
            // Show all hotel departments when "Is Common to All Departments" is checked
            filteredDepartments = formattedDepartments;
          } else if (selectedOutlet) {
            // Show only selected outlet departments
            filteredDepartments = formattedDepartments.filter(
              (dept) => Number(dept.outletid) === selectedOutlet
            );
          }

          let initialDepartmentRates: DepartmentRate[] = [];
          
          // Create a map of existing department rates for quick lookup
          const existingRatesMap: { [deptId: number]: any } = {};
          
          if (isEdit && mstmenu?.restitemid) {
            try {
              const itemDetailsResponse = await MenuService.getById(mstmenu.restitemid);
              
              if (itemDetailsResponse.success) {
                const itemDetails = itemDetailsResponse.data;
                
                // console.log('Item details fetched:', itemDetails);
                
                // Extract variant values from department_details
                const existingVariantValueIds: number[] = [];
                if (itemDetails.department_details) {
                  itemDetails.department_details.forEach((detail: any) => {
                    if (detail.variant_value_id && !existingVariantValueIds.includes(detail.variant_value_id)) {
                      existingVariantValueIds.push(detail.variant_value_id);
                    }
                  });
                }
                
                // Set selected variant values if any
                if (existingVariantValueIds.length > 0) {
                  setSelectedVariantValues(existingVariantValueIds);
                  
                  // Try to find the variant type from the variant values
                  for (const vt of variantTypes) {
                    const matchingValue = vt.values.find(v => existingVariantValueIds.includes(v.variant_value_id));
                    if (matchingValue) {
                      setSelectedVariantType(vt.variant_type_name);
                      break;
                    }
                  }
                }
                
                // Group department details by departmentid to create variant_rates
                if (itemDetails.department_details) {
                  itemDetails.department_details.forEach((detail: any) => {
                    const deptId = detail.departmentid;
                    if (!existingRatesMap[deptId]) {
                      existingRatesMap[deptId] = {
                        departmentid: deptId,
                        departmentName: detail.department_name || '',
                        rate: 0,
                        half_rate: 0,
                        full_rate: 0,
                        unitid: detail.unitid || null,
                        servingunitid: detail.servingunitid || null,
                        IsConversion: detail.IsConversion || 0,
                        taxgroupid: detail.taxgroupid || null,
                        variant_rates: {},
                        value_name: null,
                      };
                    }
                    // If variant, add to variant_rates
                    if (detail.variant_value_id) {
                      existingRatesMap[deptId].variant_rates[detail.variant_value_id] = detail.item_rate;
                      existingRatesMap[deptId].value_name = detail.variant_value_name;
                    } else {
                      // For simple products
                      existingRatesMap[deptId].rate = detail.item_rate || 0;
                    }
                  });
                }
              }
            } catch (err) {
              // console.error('Error fetching item details:', err);
              toast.error('Failed to load existing department rates');
            }
          }

          // Show ALL departments from filteredDepartments, including those with null/0 values
          initialDepartmentRates = filteredDepartments.map((dept: DepartmentItem) => {
            const existingRate = existingRatesMap[dept.departmentid];
            if (existingRate) {
              return {
                departmentid: existingRate.departmentid,
                departmentName: existingRate.departmentName || dept.department_name,
                rate: existingRate.rate || 0,
                half_rate: existingRate.half_rate || 0,
                full_rate: existingRate.full_rate || 0,
                unitid: existingRate.unitid || null,
                servingunitid: existingRate.servingunitid || null,
                IsConversion: existingRate.IsConversion || 0,
                taxgroupid: existingRate.taxgroupid || null,
                variant_rates: existingRate.variant_rates || {},
                value_name: existingRate.value_name || null,
              };
            }
            // Default values for departments without saved rates
            return {
              departmentid: dept.departmentid,
              departmentName: dept.department_name,
              rate: 0,
              half_rate: 0,
              full_rate: 0,
              unitid: null,
              servingunitid: null,
              IsConversion: 0,
              variant_rates: {},
              value_name: null,
              taxgroupid: null,
            };
          });

          setNewItem((prev) => ({
            ...prev,
            departmentRates: initialDepartmentRates,
          }));
        } else {
          toast.error(deptResponse.message || 'Failed to fetch departments');
          setDepartments([]);
          setNewItem((prev) => ({ ...prev, departmentRates: [] }));
        }
      } catch (err) {
        // console.error('Error fetching departments:', err);
        toast.error('Failed to fetch departments');
        setDepartments([]);
        setNewItem((prev) => ({ ...prev, departmentRates: [] }));
      } finally {
        setLoading(false);
      }
    };
    fetchDepartmentsForOutlet();
  }, [selectedOutlet, selectedBrand, user, isEdit, mstmenu, isCommonToAllDepartments, variantTypes]);


  // Helper to get current variant type object
  const getCurrentVariantType = () => {
    return variantTypes.find(vt => vt.variant_type_name === selectedVariantType);
  };

  const handleSubmit = async () => {
    if (!itemName || !price || !selectedBrand || !selectedOutlet) {
      toast.error('Please fill in all required fields: Item Name, Price, Hotel, and Outlet');
      return;
    }
    if (isNaN(parseFloat(price)) || parseFloat(price) < 0) {
      toast.error('Price must be a valid non-negative number');
      return;
    }

    // Determine if this is a variant product
    const isVariantProduct = selectedVariantType && selectedVariantType !== "simple" && selectedVariantValues.length > 0;
    
    // Get the variant type ID
    const currentVariantType = getCurrentVariantType();
    const variantTypeId = isVariantProduct && currentVariantType ? currentVariantType.variant_type_id : null;

    setLoading(true);
    
// Build department details based on product type
    let departmentDetailsPayload;
    if (isVariantProduct) {
      // For variant products: send variant_rates for each department
      departmentDetailsPayload = newItem.departmentRates.map(({ departmentid, rate, unitid, IsConversion, servingunitid, variant_rates, taxgroupid }) => ({
        restitemid: isEdit && mstmenu ? mstmenu.restitemid : 0,
        departmentid,
        department_name: departments.find((d) => d.departmentid === departmentid)?.department_name || '',
        item_rate: rate || 0, // fallback rate
        unitid: unitid ?? stockUnit ?? 0,
      
        servingunitid: servingunitid ?? 0,
        IsConversion,
        variant_rates: variant_rates || {}, // Object with variant_value_id -> rate mapping
        value_name: variant_rates ? Object.keys(variant_rates)[0] : null,

        taxgroupid: taxgroupid ?? 0
      }));
    } else {
      // For simple products: send regular rate
      departmentDetailsPayload = newItem.departmentRates.map(({ departmentid, rate, unitid, servingunitid, IsConversion, taxgroupid }) => ({
        restitemid: isEdit && mstmenu ? mstmenu.restitemid : 0,
        departmentid,
        department_name: departments.find((d) => d.departmentid === departmentid)?.department_name || '',
        item_rate: rate && rate > 0 ? rate : parseFloat(price),
        unitid: unitid ?? stockUnit ?? 0,
        servingunitid: servingunitid ?? 0,
        IsConversion,
        taxgroupid: taxgroupid ?? 0
      }));
    }

    const payload = {
      hotelid: selectedBrand,
      outletid: selectedOutlet,
      item_no: itemNo,
      item_name: itemName,
      print_name: printName,
      short_name: shortName,
      kitchen_category_id: kitchenCategoryId,
      kitchen_sub_category_id: kitchenSubCategoryId,
      kitchen_main_group_id: kitchenMainGroupId,
      item_main_group_id: itemMainGroupId,
      item_group_id: itemGroupId,
      stock_unit: stockUnit,
      price: parseFloat(price),
      taxgroupid,
      is_runtime_rates: runtimeRates ? 1 : 0,
      is_common_to_all_departments: isCommonToAllDepartments ? 1 : 0,
      item_description: itemDescription,
      item_hsncode: itemHsncode,
      status,
      updated_by_id: user?.id || 2,
      created_by_id: user?.id || 2,
      // 🔥 NEW STOCK FIELDS - send user selections as 1/0 🔥
      is_ingredients_required: isIngredientsRequired ? 1 : 0,
      consume_on_bill: consumeOnBill ? 1 : 0,
      reverse_stock_cancel_kot: reverseStockCancelKot ? 1 : 0,
      allow_negative_stock: allowNegativeStock ? 1 : 0,
      opening_stock_quantity: openingStockQuantity || 0,
      opening_stock_unit_id: openingStockUnitId || null,
      // 🔥 NEW RAW MATERIALS FIELDS 🔥
      consume_raw_materials_on_bill: consumeRawOnBill ? 1 : 0,
      consume_raw_materials_on_kot: consumeRawOnKot ? 1 : 0,
      store_name: storeNameId,
      // Variant information
      variant_type_id: variantTypeId,
      variant_values: isVariantProduct ? selectedVariantValues : [],
      // Department details
      department_details: departmentDetailsPayload,
    };

    try {
      let response;
      if (isEdit && mstmenu) {
        response = await MenuService.update(mstmenu.restitemid, payload);
      } else {
        response = await MenuService.create(payload);
      }

      if (!response.success) {
        toast.error(`Failed to ${isEdit ? 'update' : 'add'} item: ${response.message || 'Unknown error'}`);
        return;
      }

      const updatedItem = response.data;
      toast.success(`Item ${isEdit ? 'updated' : 'added'} successfully`);

      const updatedCardItem = {
        userId: String(updatedItem.restitemid),
        itemId: updatedItem.item_no || '',
        ItemName: updatedItem.item_name,
        aliasName: updatedItem.short_name || '',
        price: updatedItem.price || 0,
        visits: 0,
        cardStatus: updatedItem.status === 1 ? '✅ Available' : '❌ Unavailable',
      };

      setData((prev) =>
        isEdit
          ? prev.map((item) => (item.restitemid === updatedItem.restitemid ? updatedItem : item))
          : [...prev, updatedItem]
      );

      setCardItems((prev) =>
        isEdit
          ? prev.map((item) => (item.userId === String(updatedItem.restitemid) ? updatedCardItem : item))
          : [...prev, updatedCardItem]
      );

      onSuccess();

      // If editing, close modal. If adding new item, keep modal open and reset item-specific fields
      if (isEdit) {
        onHide();
      } else {
        // Reset item-specific fields but keep common fields (outlet, brand, categories, etc.)
        setItemName('');
        setPrintName(null);
        setShortName(null);
        setItemDescription(null);
        setItemHsncode(null);
        setPrice('');
        // Note: Item Main Group, Item Group, Kitchen Main Group, Kitchen Category, Kitchen Sub Category
        // are kept as per requirement - only reset when modal is closed
        
        // Reset department rates - keep the departments but reset rates
        setNewItem((prev) => ({
          ...prev,
          departmentRates: prev.departmentRates.map((dr) => ({
            ...dr,
            rate: 0,
            half_rate: 0,
            full_rate: 0,
            variant_rates: {},
            value_name: null,
          })),
        }));
        
        // Generate new item number for the next item
        await fetchMaxItemNo();
      }
    } catch (err: any) {
      // console.error(`${isEdit ? 'Update' : 'Add'} Item error:`, err);
      toast.error(`Failed to ${isEdit ? 'update' : 'add'} item: ${err.message || 'Unexpected error occurred'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" centered className="modern-pos-modal">
      {/* Gradient Header - Reduced Height */}
      <div className="modal-header-gradient">
        <div className="w-100 d-flex justify-content-between align-items-center px-3 py-2">
          <h5 className="modal-title text-dark fw-bold mb-0">
            <i className="fi fi-rr-utensils me-2" style={{ color: '#3b82f6' }}></i>
            {isEdit ? 'Edit Item' : 'Add New Item'}
          </h5>
          <button type="button" className="btn-close btn-close-dark" onClick={onHide} aria-label="Close"></button>
        </div>
      </div>
      
      <Modal.Body className="bg-light p-2">
        <Form>
{/* Section 1: Basic Information */}
          <Card className="mb-3 border-0 shadow-sm" style={{ borderRadius: '12px', backgroundColor: '#ffffff' }}>
            <Card.Body className="p-3">
              <Row className="g-3">
                {/* Row 1 - 3 fields */}
                <Col xs={12} md={4}>
                  <Row className="align-items-center">
                    <Col xs={4} md={4}>
                      <Form.Group className="mb-0">
                        <Form.Label className="text-muted small fw-medium mb-0 d-block">Item Number</Form.Label>
                      </Form.Group>
                    </Col>
                    <Col xs={8} md={8}>
                      <Form.Control
                        type="text"
                        value={itemNo ?? ''}
                        onChange={(e) => setItemNo(e.target.value || null)}
                        placeholder="Auto-generated"
                        className="border-0 shadow-sm rounded-3"
                        style={{ backgroundColor: '#ffffff' }}
                      />
                    </Col>
                  </Row>
                </Col>
                <Col xs={12} md={4}>
                  <Row className="align-items-center">
                    <Col xs={4} md={4}>
                      <Form.Group className="mb-0">
                        <Form.Label className="text-muted small fw-medium mb-0 d-block">Outlet <span className="text-danger">*</span></Form.Label>
                      </Form.Group>
                    </Col>
                    <Col xs={8} md={8}>
                      <Form.Select
                        value={selectedOutlet || ''}
                        onChange={(e) => setSelectedOutlet(e.target.value ? Number(e.target.value) : null)}
                        disabled={loading || !outletsLoaded}
                        className="border-0 shadow-sm rounded-3"
                        style={{ backgroundColor: '#ffffff' }}
                        required
                      >
                        <option value="">Select Outlet</option>
                        {outlets.map((outlet) => (
                          <option key={outlet.outletid} value={outlet.outletid}>
                            {outlet.outlet_name}
                          </option>
                        ))}
                      </Form.Select>
                    </Col>
                  </Row>
                </Col>
                <Col xs={12} md={4}>
                  <Row className="align-items-center">
                    <Col xs={4} md={4}>
                      <Form.Group className="mb-0">
                        <Form.Label className="text-muted small fw-medium mb-0 d-block">Hotel / Brand <span className="text-danger">*</span></Form.Label>
                      </Form.Group>
                    </Col>
                    <Col xs={8} md={8}>
                      <Form.Select
                        value={selectedBrand || ''}
                        onChange={(e) => setSelectedBrand(e.target.value ? Number(e.target.value) : null)}
                        disabled={loading}
                        className="border-0 shadow-sm rounded-3"
                        style={{ backgroundColor: '#ffffff' }}
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
                  </Row>
                </Col>
              </Row>
            </Card.Body>
          </Card>

{/* Section 2: Item Details */}
          <Card className="mb-3 border-0 shadow-sm" style={{ borderRadius: '12px', backgroundColor: '#ffffff' }}>
            <Card.Body className="p-3">
              <Row className="g-3">
                {/* Row 1 - Item Name (wider), Print Name, Short Name */}
                <Col xs={12} md={5}>
                  <Row className="align-items-center">
                    <Col xs={3} md={3}>
                      <Form.Group className="mb-0">
                        <Form.Label className="text-muted small fw-medium mb-0 d-block">Item Name <span className="text-danger">*</span></Form.Label>
                      </Form.Group>
                    </Col>
                    <Col xs={8} md={8}>
                      <Form.Control
                        type="text"
                        value={itemName}
                        onChange={(e) => setItemName(e.target.value)}
                        placeholder="Enter item name"
                        className="border-0 shadow-sm rounded-3"
                        style={{ backgroundColor: '#ffffff' }}
                        required
                      />
                    </Col>
                  </Row>
                </Col>
                <Col xs={12} md={4}>
                  <Row className="align-items-center">
                    <Col xs={3} md={3}>
                      <Form.Group className="mb-0">
                        <Form.Label className="text-muted small fw-medium mb-0 d-block">Print Name</Form.Label>
                      </Form.Group>
                    </Col>
                    <Col xs={8} md={8}>
                      <Form.Control
                        type="text"
                        value={printName ?? ''}
                        onChange={(e) => setPrintName(e.target.value || null)}
                        placeholder="Name for print"
                        className="border-0 shadow-sm rounded-3"
                        style={{ backgroundColor: '#ffffff' }}
                      />
                    </Col>
                  </Row>
                </Col>
                <Col xs={12} md={3}>
                  <Row className="align-items-center">
                    <Col xs={4} md={4}>
                      <Form.Group className="mb-0">
                        <Form.Label className="text-muted small fw-medium mb-0 d-block">Short Name</Form.Label>
                      </Form.Group>
                    </Col>
                    <Col xs={8} md={8}>
                      <Form.Control
                        type="text"
                        value={shortName ?? ''}
                        onChange={(e) => setShortName(e.target.value || null)}
                        placeholder="Short name"
                        className="border-0 shadow-sm rounded-3"
                        style={{ backgroundColor: '#ffffff' }}
                      />
                    </Col>
                  </Row>
                </Col>
                {/* Row 2 - 3 fields: Description, HSN Code, Base Price */}
                <Col xs={12} md={5}>
                  <Row className="align-items-center">
                    <Col xs={3} md={3}>
                      <Form.Group className="mb-0">
                        <Form.Label className="text-muted small fw-medium mb-0 d-block">Description</Form.Label>
                      </Form.Group>
                    </Col>
                    <Col xs={8} md={8}>
                      <Form.Control
                        as="textarea"
                        rows={1}
                        value={itemDescription ?? ''}
                        onChange={(e) => setItemDescription(e.target.value || null)}
                        placeholder="Item description"
                        className="border-0 shadow-sm rounded-3"
                        style={{ backgroundColor: '#ffffff' }}
                      />
                    </Col>
                  </Row>
                </Col>
                <Col xs={12} md={3}>
                  <Row className="align-items-center">
                    <Col xs={4} md={4}>
                      <Form.Group className="mb-0">
                        <Form.Label className="text-muted small fw-medium mb-0 d-block">HSN Code</Form.Label>
                      </Form.Group>
                    </Col>
                    <Col xs={8} md={8}>
                      <Form.Control
                        type="text"
                        value={itemHsncode ?? ''}
                        onChange={(e) => setItemHsncode(e.target.value || null)}
                        placeholder="HSN code"
                        className="border-0 shadow-sm rounded-3"
                        style={{ backgroundColor: '#ffffff' }}
                      />
                    </Col>
                  </Row>
                </Col>
                <Col xs={12} md={2}>
                  <Row className="align-items-center">
                    <Col xs={4} md={4}>
                      <Form.Group className="mb-0">
                        <Form.Label className="text-muted small fw-medium mb-0 d-block">Base Price </Form.Label>
                      </Form.Group>
                    </Col>
                    <Col xs={8} md={8}>
                      <Form.Control
                        type="number"
                        step="0.01"
                        min="0"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="0.00"
                        className="border-0 shadow-sm rounded-3"
                        style={{ backgroundColor: '#ffffff' }}
                        required
                      />
                    </Col>
                  </Row>
                </Col>
                <Col xs={12} md={2}>
                  <Row className="align-items-center">
                    <Col xs={4} md={4}>
                      <Form.Group className="mb-0">
                        <Form.Label className="text-muted small fw-medium mb-0 d-block">Tax Group</Form.Label>
                      </Form.Group>
                    </Col>
                    <Col xs={8} md={8}>
                      <Form.Select
                        value={taxgroupid ?? ''}
                        onChange={(e) => setTaxgroupid(e.target.value ? Number(e.target.value) : null)}
                        className="border-0 shadow-sm rounded-3"
                        style={{ backgroundColor: '#f8fafc' }}
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
                  </Row>
                </Col>
              </Row>
            </Card.Body>
          </Card>

{/* Section 3: Category & Classification */}
          <Card className="mb-3 border-0 shadow-sm" style={{ borderRadius: '12px', backgroundColor: '#ffffff' }}>
            <Card.Body className="p-3">
              <Row className="g-3">
                {/* Row 1 - 2 fields: Item Main Group, Item Group */}
                <Col xs={12} md={5}>
                  <Row className="align-items-center">
                    <Col xs={3} md={3}>
                      <Form.Group className="mb-0">
                        <Form.Label className="text-muted small fw-medium mb-0 d-block">Item Main Group</Form.Label>
                      </Form.Group>
                    </Col>
                    <Col xs={8} md={8}>
                      <Form.Select
                        value={itemMainGroupId ?? ''}
                        onChange={(e) => setItemMainGroupId(e.target.value === '' ? null : Number(e.target.value))}
                        className="border-0 shadow-sm rounded-3"
                        style={{ backgroundColor: '#f8fafc' }}
                        disabled={loading}
                      >
                        <option value="">Select Main Group</option>
                        {itemMainGroup.filter((group) => String(group.status) === '0').map((group) => (
                          <option key={group.item_maingroupid} value={group.item_maingroupid}>
                            {group.item_group_name}
                          </option>
                        ))}
                      </Form.Select>
                    </Col>
                  </Row>
                </Col>
                <Col xs={12} md={4}>
                  <Row className="align-items-center">
                    <Col xs={3} md={3}>
                      <Form.Group className="mb-0">
                        <Form.Label className="text-muted small fw-medium mb-0 d-block">Item Group</Form.Label>
                      </Form.Group>
                    </Col>
                    <Col xs={8} md={8}>
                      <Form.Select
                        value={itemGroupId ?? ''}
                        onChange={(e) => setItemGroupId(e.target.value === '' ? null : Number(e.target.value))}
                        className="border-0 shadow-sm rounded-3"
                        style={{ backgroundColor: '#f8fafc' }}
                        disabled={loading}
                      >
                        <option value="">Select Group</option>
                        {itemGroup.filter((group) => String(group.status) === '0').map((group) => (
                          <option key={group.item_groupid} value={group.item_groupid}>
                            {group.itemgroupname}
                          </option>
                        ))}
                      </Form.Select>
                    </Col>
                  </Row>
                </Col>
                {/* Row 2 - 3 fields: Kitchen Main Group, Kitchen Category, Kitchen Sub Category */}
                <Col xs={12} md={5}>
                  <Row className="align-items-center">
                    <Col xs={3} md={3}>
                      <Form.Group className="mb-0">
                        <Form.Label className="text-muted small fw-medium mb-0 d-block">Kitchen Main Group</Form.Label>
                      </Form.Group>
                    </Col>
                    <Col xs={8} md={8}>
                      <Form.Select
                        value={kitchenMainGroupId ?? ''}
                        onChange={(e) => setKitchenMainGroupId(e.target.value === '' ? null : Number(e.target.value))}
                        className="border-0 shadow-sm rounded-3"
                        style={{ backgroundColor: '#f8fafc' }}
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
                  </Row>
                </Col>
                <Col xs={12} md={3}>
                  <Row className="align-items-center">
                    <Col xs={4} md={4}>
                      <Form.Group className="mb-0">
                        <Form.Label className="text-muted small fw-medium mb-0 d-block">Kitchen Category</Form.Label>
                      </Form.Group>
                    </Col>
                    <Col xs={8} md={8}>
                      <Form.Select
                        value={kitchenCategoryId ?? ''}
                        onChange={(e) => setKitchenCategoryId(e.target.value === '' ? null : Number(e.target.value))}
                        className="border-0 shadow-sm rounded-3"
                        style={{ backgroundColor: '#f8fafc' }}
                        disabled={loading}
                      >
                        <option value="">Select Category</option>
                        {kitchenCategory.filter((category) => String(category.status) === '0').map((category) => (
                          <option key={category.kitchencategoryid} value={category.kitchencategoryid}>
                            {category.Kitchen_Category}
                          </option>
                        ))}
                      </Form.Select>
                    </Col>
                  </Row>
                </Col>
                <Col xs={12} md={4}>
                  <Row className="align-items-center">
                    <Col xs={4} md={4}>
                      <Form.Group className="mb-0">
                        <Form.Label className="text-muted small fw-medium mb-0 d-block">Kitchen Sub Category</Form.Label>
                      </Form.Group>
                    </Col>
                    <Col xs={8} md={8}>
                      <Form.Select
                        value={kitchenSubCategoryId ?? ''}
                        onChange={(e) => setKitchenSubCategoryId(e.target.value === '' ? null : Number(e.target.value))}
                        className="border-0 shadow-sm rounded-3"
                        style={{ backgroundColor: '#f8fafc' }}
                        disabled={loading}
                      >
                        <option value="">Select Sub Category</option>
                        {kitchenSubCategory.filter((subCategory) => String(subCategory.status) === '0').map((subCategory) => (
                          <option key={subCategory.kitchensubcategoryid} value={subCategory.kitchensubcategoryid}>
                            {subCategory.Kitchen_sub_category}
                          </option>
                        ))}
                      </Form.Select>
                    </Col>
                  </Row>
                </Col>
              </Row>
            </Card.Body>
          </Card>

{/* Section 4: Pricing Details */}
          <Card className="mb-4 border-0 shadow-sm" style={{ borderRadius: '12px', backgroundColor: '#ffffff' }}>
            <Card.Body className="p-2" style={{ maxHeight: '400px', overflowX: 'auto', overflowY: 'hidden' }}>
              {/* Header removed as per request */}

              {/* Vertical Tabs Layout */}
              <div className="d-flex">
                <Nav variant="pills" className="flex-column" style={{ minWidth: '140px', borderRight: '1px solid #dee2e6' }}>
                  <Nav.Item>
                    <Nav.Link 
                      eventKey="multiplePrice" 
                      onClick={() => setActiveTab('multiplePrice')}
                      className={activeTab === 'multiplePrice' ? 'active' : ''}
                      style={{ cursor: 'pointer' }}
                    >
                      Multiple Price
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link 
                      eventKey="stock" 
                      onClick={() => setActiveTab('stock')}
                      className={activeTab === 'stock' ? 'active' : ''}
                      style={{ cursor: 'pointer' }}
                    >
                      Stock
                    </Nav.Link>
                  </Nav.Item>
                </Nav>
                
                <Tab.Content className="flex-grow-1 ps-3">
                  <Tab.Pane eventKey="multiplePrice" active={activeTab === 'multiplePrice'}>
              

                  {/* Variant Type Selector - Using fetched variantTypes */}
                  <div className="row mb-3 align-items-center">
                    <div className="col-md-4">
                      <Form.Select
                        value={selectedVariantType}
                        onChange={(e) => {
                          const value = e.target.value;
                          setSelectedVariantType(value);
                          setSelectedVariantValues([]);

                          // Only open modal if real variant selected
                          if (value && value !== "simple") {
                            setShowVariantValueModal(true);
                          }
                        }}
                        className="rounded-lg"
                      >
                        <option value="">Select Variant Type</option>

                        {/* ✅ NEW: Simple Product Option */}
                        <option value="simple">Simple Product </option>

                        {variantTypes.map((vt) => (
                          <option key={vt.variant_type_id} value={vt.variant_type_name}>
                            {vt.variant_type_name}
                          </option>
                        ))}
                      </Form.Select>
                    </div>
                    {selectedVariantValues.length > 0 && (
                      <div className="col-md-3">
                        <span className="text-muted small">
                          {selectedVariantValues.length} column(s) selected
                          <p className="text-sm text-gray-600 mb-3">
                    Define department-wise multiple pricing
                  </p>
                        </span>
                        
                      </div>
                    )}
                    <div className="col-md-5">
                      <Row>
                        <Col xs={6}>
                          <label className="d-flex align-items-center gap-2 cursor-pointer p-2 rounded" style={{ backgroundColor: '#f8fafc' }}>
                            <Form.Check type="checkbox" checked={runtimeRates} onChange={(e) => setRuntimeRates(e.target.checked)} className="mt-0" />
                            <span className="text-dark small">Runtime Rates</span>
                          </label>
                        </Col>
                        <Col xs={6}>
                          <label className="d-flex align-items-center gap-2 cursor-pointer p-2 rounded" style={{ backgroundColor: '#f8fafc' }}>
                            <Form.Check type="checkbox" checked={isCommonToAllDepartments} onChange={(e) => setIsCommonToAllDepartments(e.target.checked)} className="mt-0" />
                            <span className="text-dark small">Is Common to All Departments</span>
                          </label>
                        </Col>
                      </Row>
                    </div>
                  </div>

                  

                  <div className="table-responsive">
                    <Table bordered hover size="sm" className="mb-0">
                      <thead style={{ backgroundColor: '#e3f2fd' }}>
                        <tr>
                          <th style={{ padding: '4px 8px' }}>Department</th>

                          {/* ===== SIMPLE MODE ===== */}
                          {(!selectedVariantType || selectedVariantType === "simple") && (
                            <th style={{ padding: '4px 8px' }}>Price</th>
                          )}

                          {/* ===== VARIANT MODE WITH SELECTED COLUMNS ===== */}
                          {selectedVariantType &&
                            selectedVariantType !== "simple" &&
                            selectedVariantValues.length > 0 &&
                            variantTypes
                              .find((vt) => vt.variant_type_name === selectedVariantType)
                              ?.values
                              .filter((value) =>
                                selectedVariantValues.includes(value.variant_value_id)
                              )
                              .map((value) => (
                                <th key={value.variant_value_id} style={{ padding: '4px 8px' }}>{value.value_name}</th>
                              ))}

                          {/* ===== VARIANT MODE BUT NO VALUES SELECTED ===== */}
                          {selectedVariantType &&
                            selectedVariantType !== "simple" &&
                            selectedVariantValues.length === 0 && (
                              <th className="text-muted text-center" style={{ padding: '4px 8px' }}>
                                Select columns to display
                              </th>
                            )}

                          <th style={{ padding: '4px 8px' }}>Tax Group</th>

                        </tr>
                      </thead>

                      <tbody>
                        {newItem.departmentRates.length > 0 ? (
                          newItem.departmentRates.map((deptRate, deptIndex) => {

                            const isSimpleMode =
                              !selectedVariantType || selectedVariantType === "simple";

                            const selectedVariantObject = variantTypes.find(
                              (vt) => vt.variant_type_name === selectedVariantType
                            );

                            const activeVariantValues =
                              selectedVariantObject?.values.filter((value) =>
                                selectedVariantValues.includes(value.variant_value_id)
                              ) || [];

                            return (
                              <tr key={`multi-${deptRate.departmentid}-${deptIndex}`}>

                                {/* Department */}
                                <td style={{ padding: '4px 8px' }}>{deptRate.departmentName}</td>

                                {/* ================= SIMPLE MODE ================= */}
                                {isSimpleMode && (
                                  <td style={{ padding: '4px 8px' }}>
                                    <Form.Control
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      placeholder="0.00"
                                      className="rounded-lg py-1"
                                      value={deptRate.rate || ''}
                                      onChange={(e) => {
                                        const newRate = parseFloat(e.target.value) || 0;
                                        setNewItem((prev) => ({
                                          ...prev,
                                          departmentRates: prev.departmentRates.map((dr) =>
                                            dr.departmentid === deptRate.departmentid
                                              ? { ...dr, rate: newRate }
                                              : dr
                                          ),
                                        }));
                                      }}
                                    />
                                  </td>
                                )}

                                {/* ================= VARIANT MODE ================= */}
                                {!isSimpleMode && activeVariantValues.length > 0 &&
                                  activeVariantValues.map((value) => (
                                    <td key={value.variant_value_id} style={{ padding: '4px 8px' }}>
                                      <Form.Control
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                        className="rounded-lg py-1"
                                        value={deptRate.variant_rates?.[value.variant_value_id] ?? ''}
                                        onChange={(e) => {
                                          const newRate = parseFloat(e.target.value) || 0;
                                          setNewItem((prev) => ({
                                            ...prev,
                                            departmentRates: prev.departmentRates.map((dr) =>
                                              dr.departmentid === deptRate.departmentid
                                                ? { 
                                                    ...dr, 
                                                    variant_rates: {
                                                      ...(dr.variant_rates || {}),
                                                      [value.variant_value_id]: newRate
                                                    }
                                                  }
                                                : dr
                                            ),
                                          }));
                                        }}
                                      />
                                    </td>
                                  ))}

                                {/* If Variant Selected but No Columns Chosen */}
                                {!isSimpleMode && activeVariantValues.length === 0 && (
                                  <td className="text-muted text-center" style={{ padding: '4px 8px' }}>—</td>
                                )}

{/* Tax Group */}
                                <td style={{ padding: '4px 8px' }}>
                                  <Form.Select 
                                    className="rounded-lg py-1"
                                    value={deptRate.taxgroupid ?? ''}
                                    onChange={(e) => {
                                      setNewItem((prev) => ({
                                        ...prev,
                                        departmentRates: prev.departmentRates.map((dr) =>
                                          dr.departmentid === deptRate.departmentid
                                            ? { ...dr, taxgroupid: e.target.value ? Number(e.target.value) : null }
                                            : dr
                                        ),
                                      }));
                                    }}
                                  >
                                    <option value="">Select</option>
                                    {taxGroups.map((tg) => (
                                      <option key={tg.taxgroupid} value={tg.taxgroupid}>
                                        {tg.taxgroup_name}
                                      </option>
                                    ))}
                                  </Form.Select>
                                </td>



                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={6} className="text-center py-3">
                              No departments found. Please select an outlet first.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </div>

                  {/* Small Modal for Variant Value Selection */}
                  <Modal
                    show={showVariantValueModal}
                    onHide={() => setShowVariantValueModal(false)}
                    size="sm"
                    centered
                  >
                    <Modal.Header closeButton className="py-2">
                      <Modal.Title className="fs-6">Select Variant Values</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="py-2">
                      {selectedVariantType && (
                        <div>
                          {variantTypes.filter(vt => vt.variant_type_name === selectedVariantType)[0]?.values.map((value) => (
                            <Form.Check
                              key={value.variant_value_id}
                              type="checkbox"
                              id={`variant-${value.variant_value_id}`}
                              label={value.value_name}
                              checked={selectedVariantValues.includes(value.variant_value_id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedVariantValues([...selectedVariantValues, value.variant_value_id]);
                                } else {
                                  setSelectedVariantValues(selectedVariantValues.filter(id => id !== value.variant_value_id));
                                }
                              }}
                              className="mb-2"
                            />
                          ))}
                        </div>
                      )}
                    </Modal.Body>
                    <Modal.Footer className="py-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowVariantValueModal(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setShowVariantValueModal(false)}
                      >
                        Apply
                      </Button>
                    </Modal.Footer>
                  </Modal>
                  </Tab.Pane>

                  <Tab.Pane eventKey="stock" active={activeTab === 'stock'}>

                  {/* ================= DECIDE INGREDIENTS ================= */}
                  <Row className="mb-3">
                    <Col xs={12}>
                      <Form.Check
                        type="checkbox"
                        checked={isIngredientsRequired}
                        onChange={(e) => setIsIngredientsRequired(e.target.checked)}
                        label="Decide Ingredients for This Item"
                      />
                    </Col>
                  </Row>

                  {/* ================= STORE NAME ================= */}
                  <Row className="mb-3 align-items-center">
                    <Col xs={12} md={2}>
                      <Form.Label className="mb-0">Store Name</Form.Label>
                    </Col>

                    <Col xs={12} md={4}>
                      <Form.Select 
                        className="rounded-lg"
                        value={storeNameId || ''}
                        onChange={(e) => setStoreNameId(e.target.value ? Number(e.target.value) : null)}
                      >
                        <option value="">Select Store</option>
                        {warehouses.map((warehouse) => (
                          <option key={warehouse.warehouseid} value={warehouse.warehouseid}>
                            {warehouse.warehouse_name}
                          </option>
                        ))}
                      </Form.Select>
                    </Col>
                  </Row>

                  {/* ================= OPENING STOCK ================= */}
                  <Row className="mb-3 align-items-center">

                    <Col xs={12} md={2}>
                      <Form.Label className="mb-0">Opening Stock</Form.Label>
                    </Col>

                  {/* Opening Quantity */}
                  <Col xs={6} md={2}>
                    <Form.Control
                      type="number"
                      placeholder="0"
                      value={openingStockQuantity}
                      onChange={(e) => setOpeningStockQuantity(Number(e.target.value))}
                    />
                  </Col>

                    {/* Unit Dropdown (Fetch from DB) */}
                    <Col xs={6} md={2}>
                      <Form.Select
                        value={stockUnit ?? ""}
                        onChange={(e) =>
                          setStockUnit(e.target.value ? Number(e.target.value) : null)
                        }
                      >
                        <option value="">Select Unit</option>

                        {stockUnits.map((unit) => (
                          <option key={unit.unitid} value={unit.unitid}>
                            {unit.unit_name}
                          </option>
                        ))}

                      </Form.Select>
                    </Col>

                  </Row>

                  {/* ================= CONSUME RAW MATERIALS BOX ================= */}
                  <Row className="mb-3">
                    <Col xs={12} md={6}>
                      <fieldset className="border p-3 rounded">
                        <legend className="float-none w-auto px-2 small">
                          Consume Raw Materials
                        </legend>

                        <Form.Check
                          type="radio"
                          name="consumeRawType"
                          label="Consume Raw Materials on Bill"
                          checked={consumeRawOnBill}
                          onChange={(e) => {
                            setConsumeRawOnBill(e.target.checked);
                            if (e.target.checked) setConsumeRawOnKot(false);
                          }}
                          className="mb-2"
                        />

                        <Form.Check
                          type="radio"
                          name="consumeRawType"
                          label="Consume Raw Materials on KOT"
                          checked={consumeRawOnKot}
                          onChange={(e) => {
                            setConsumeRawOnKot(e.target.checked);
                            if (e.target.checked) setConsumeRawOnBill(false);
                          }}
                        />
                      </fieldset>
                    </Col>
                  </Row>

                  {/* ================= OTHER OPTIONS ================= */}
                  <Row>
                    <Col xs={12} md={6}>
                      <Form.Check
                        type="checkbox"
                        checked={reverseStockCancelKot}
                        onChange={(e) => setReverseStockCancelKot(e.target.checked)}
                        label="Reverse Stock During Cancel KOT"
                        className="mb-2"
                      />
                    </Col>

                    <Col xs={12} md={6}>
                      <Form.Check
                        type="checkbox"
                        checked={allowNegativeStock}
                        onChange={(e) => setAllowNegativeStock(e.target.checked)}
                        label="Allow Negative Raw Material Stock"
                      />
                    </Col>
                  </Row>
                  </Tab.Pane>
                </Tab.Content>
              </div>
            </Card.Body>
          </Card>

        </Form>
      </Modal.Body>

      {/* Footer - Status Label Left, Dropdown Right */}
      <div className="modal-footer bg-white px-3 py-2 border-top">
        <div className="d-flex align-items-center justify-content-between w-100">
          <div className="d-flex align-items-center">
            <span className="text-sm font-medium text-gray-700 me-2">Status:</span>
            <Form.Select
              value={status === 1 ? 'Active' : 'Inactive'}
              onChange={(e) => setStatus(e.target.value === 'Active' ? 1 : 0)}
              className="rounded-lg"
              style={{ width: '120px' }}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </Form.Select>
          </div>
          <div className="d-flex gap-2">
            <Button
              variant="outline-secondary"
              onClick={onHide}
              disabled={loading}
              className="px-3"
              style={{ borderRadius: '8px', fontWeight: '500' }}
            >
              <i className="fi fi-rr-cross me-1"></i>
              Cancel
            </Button>
            <Button
              variant="success"
              onClick={handleSubmit}
              disabled={loading}
              className="px-3"
              style={{ borderRadius: '8px', fontWeight: '500', backgroundColor: '#16a34a', borderColor: '#16a34a' }}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                  Saving...
                </>
              ) : (
                <>
                  <i className="fi fi-rr-check me-1"></i>
                  Save Item
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style>{`
        .modern-pos-modal .modal-content {
          border: none;
          border-radius: 16px;
          overflow: hidden;
        }
        
        .modal-header-gradient {
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .form-control:focus, .form-select:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        .btn-success:hover {
          background-color: #15803d !important;
          border-color: #15803d !important;
        }
      `}</style>
    </Modal>
  );
};

export default Menu;
