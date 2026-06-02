// pages/InventoryManagement/StockItemsList.tsx
import { useState, useEffect, useMemo } from 'react';
import { Button, Table, Badge, Form } from 'react-bootstrap';
import FormModal from '@/components/Common/models/FormModal';
import StockItemForm from './StockItemForm';
import StockService from '@/common/hotel/stock';
import { useAuthContext } from '@/common/context/useAuthContext';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

interface StockItem {
  item_id: number;
  item_name: string;
  item_code: string;
  category: string;
  sub_category: string;
  unit: string;
  current_stock: number;
  minimum_stock: number;
  price: number;
  gst_percent: number;
  quantity_per_guest?: number;
  is_auto_assign?: number;
  is_returnable?: number;
  status: number;
}

interface StockItemsListProps {
  onLowStockRefresh?: () => void;
}

const StockItemsList = ({ onLowStockRefresh }: StockItemsListProps) => {
  const { user } = useAuthContext();
  const hotelId = user?.hotel_id;

  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    if (hotelId) loadItems();
  }, [hotelId]);

  const loadItems = async () => {
    if (!hotelId) return;
    setLoading(true);
    try {
      const res = await StockService.getItems({ hotelid: hotelId });
      if (res.success && res.data) {
        const uniqueItems = res.data.filter((item: StockItem, index: number, self: StockItem[]) =>
          index === self.findIndex((i) => i.item_id === item.item_id)
        );
        setItems(uniqueItems);
      }
    } catch (error) {
      console.error('Failed to load items:', error);
      toast.error('Failed to load stock items');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'complimentary': return <Badge bg="success">Complimentary</Badge>;
      case 'returnable':    return <Badge bg="primary">Returnable</Badge>;
      case 'chargeable':    return <Badge bg="warning">Chargeable</Badge>;
      default:              return <Badge bg="secondary">{category}</Badge>;
    }
  };

  const getStockStatusBadge = (current: number, min: number) => {
    if (current <= min && min > 0)          return <Badge bg="danger">Low Stock ({current})</Badge>;
    if (current <= min * 2 && min > 0)      return <Badge bg="warning">Stock Low ({current})</Badge>;
    return <Badge bg="info">In Stock ({current})</Badge>;
  };

  // Filtering & Sorting
  const filteredItems = useMemo(() => {
    let result = items;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((item) =>
        item.item_name.toLowerCase().includes(q) ||
        (item.item_code && item.item_code.toLowerCase().includes(q))
      );
    }

    if (categoryFilter !== 'all') {
      result = result.filter((item) => item.category === categoryFilter);
    }

    if (sortField) {
      result = [...result].sort((a, b) => {
        const aVal = a[sortField as keyof StockItem] ?? '';
        const bVal = b[sortField as keyof StockItem] ?? '';
        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [items, search, categoryFilter, sortField, sortDirection]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Pagination
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredItems.length / pageSize)),
    [filteredItems.length, pageSize]
  );

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  useEffect(() => { setCurrentPage(1); }, [search, pageSize, categoryFilter]);
  useEffect(() => { if (currentPage > totalPages) setCurrentPage(totalPages); }, [currentPage, totalPages]);

  // ✅ FIXED: handleSaveItem mirrors RoomMaster's handleSubmit exactly
  // - The form (StockItemForm) already sets ONLY created_by_id OR updated_by_id
  // - Here we just ensure hotelid is attached and quantity_per_guest is set correctly,
  //   then call the right API (create vs update) based on editingItem
  const handleSaveItem = async (formData: any) => {
    if (!hotelId) {
      toast.error('Hotel ID not found. Please login again.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...formData,
        hotelid: hotelId,
        quantity_per_guest: formData.is_auto_assign ? formData.quantity_per_guest : 0,
      };

      if (editingItem) {
        // UPDATE — created_by_id must NOT be in the payload (form already cleared it)
        await StockService.updateItem(editingItem.item_id, payload);
        toast.success('Item updated successfully');
      } else {
        // CREATE — updated_by_id must NOT be in the payload (form already cleared it)
        await StockService.createItem(payload);
        toast.success('Item added successfully');
      }

      await loadItems();
      if (onLowStockRefresh) onLowStockRefresh();
      setShowModal(false);
      setEditingItem(null);
    } catch (error: any) {
      console.error('Failed to save item:', error);
      toast.error(error.message || 'Failed to save item');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: StockItem) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `You will not be able to recover item "${item.item_name}"!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3E97FF',
      confirmButtonText: 'Yes, delete it!',
    });

    if (result.isConfirmed) {
      setDeletingId(item.item_id);
      try {
        await StockService.deleteItem(item.item_id);
        toast.success('Item deleted successfully');
        await loadItems();
        if (onLowStockRefresh) onLowStockRefresh();
      } catch (error) {
        console.error('Failed to delete item:', error);
        toast.error('Failed to delete item');
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleEdit = (item: StockItem) => {
    setEditingItem(item);
    setShowModal(true);
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setShowModal(true);
  };

  const categories = [
    { value: 'all',           label: 'All Categories' },
    { value: 'complimentary', label: 'Complimentary' },
    { value: 'returnable',    label: 'Returnable' },
    { value: 'chargeable',    label: 'Chargeable' },
  ];

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="d-flex gap-2">
          <Form.Control
            type="text"
            placeholder="Search by name or code..."
            style={{ width: '250px' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Form.Select
            style={{ width: '180px' }}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </Form.Select>
        </div>
        <Button variant="danger" onClick={handleAddNew}>
          <span className="me-1">+</span> Add Item
        </Button>
      </div>

      <Table hover responsive className="mb-0">
        <thead className="table-light">
          <tr>
            <th style={{ width: '60px' }}>#</th>
            <th onClick={() => handleSort('item_code')} style={{ cursor: 'pointer' }}>
              Item Code {sortField === 'item_code' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('item_name')} style={{ cursor: 'pointer' }}>
              Item Name {sortField === 'item_name' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th>Category</th>
            <th>Unit</th>
            <th>Stock</th>
            <th>Price</th>
            <th>GST%</th>
            <th>Per Guest</th>
            <th style={{ width: '120px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={10} className="text-center text-muted py-4">Loading items...</td>
            </tr>
          ) : paginatedItems.length === 0 ? (
            <tr>
              <td colSpan={10} className="text-center text-muted py-4">
                {search ? 'No items match your search.' : 'No items found. Add your first item!'}
              </td>
            </tr>
          ) : (
            paginatedItems.map((item, index) => (
              <tr key={item.item_id}>
                <td>{(currentPage - 1) * pageSize + index + 1}</td>
                <td>{item.item_code || '-'}</td>
                <td className="fw-semibold">{item.item_name}</td>
                <td>{getCategoryBadge(item.category)}</td>
                <td>{item.unit || 'piece'}</td>
                <td>{getStockStatusBadge(item.current_stock, item.minimum_stock)}</td>
                <td>₹{(Number(item.price) || 0).toFixed(2)}</td>
                <td>{item.gst_percent || 0}%</td>
                <td>
                  {item.quantity_per_guest && item.is_auto_assign ? (
                    <Badge bg="info">{item.quantity_per_guest} per guest</Badge>
                  ) : (
                    <Badge bg="secondary">Manual</Badge>
                  )}
                </td>
                <td>
                  <div className="d-flex gap-2">
                    <Button variant="outline-primary" size="sm" onClick={() => handleEdit(item)}>
                      <i className="fi fi-rr-edit" />
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleDelete(item)}
                      disabled={deletingId === item.item_id}
                    >
                      <i className="fi fi-rr-trash" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>

      {filteredItems.length > 0 && (
        <div className="d-flex justify-content-between align-items-center mt-3">
          <Form.Select
            style={{ maxWidth: 80 }}
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </Form.Select>
          <div className="d-flex align-items-center gap-2">
            <Button
              variant="outline-light"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              {'<'}
            </Button>
            <Button variant="danger" size="sm">{currentPage}</Button>
            <Button
              variant="outline-light"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              {'>'}
            </Button>
          </div>
        </div>
      )}

      <FormModal
        size="lg"
        show={showModal}
        onHide={() => {
          setShowModal(false);
          setEditingItem(null);
        }}
        title={editingItem ? 'Edit Stock Item' : 'Add Stock Item'}
        onSave={handleSaveItem}
        saving={saving}
        submitLabel={editingItem ? 'Update' : 'Save'}
        Component={StockItemForm}
        selectedItem={editingItem || undefined}
      />
    </>
  );
};

export default StockItemsList;