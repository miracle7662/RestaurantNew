import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import Swal from 'sweetalert2';
import { Badge, Button, Card, Form, Table } from 'react-bootstrap';
import TitleHelmet from '@/components/Common/TitleHelmet';
import FormModal from '@/components/Common/models/FormModal';
import RoomCategoryForm from './CategoryForm';
import { useAuthContext } from '@/common/context/useAuthContext';
import RoomCategoryService, { RoomCategory, RoomCategoryPayload } from '@/common/hotel/roomCategoryService';
import Pagination from '@/components/Common/Pagination';

const defaultForm: RoomCategoryPayload = {
  category_no: '',
  category_name: '',
  department_id: undefined,
  print_name: '',
  display_seq: undefined,
  display_name: '',
  total_rooms: undefined,
  apply_date: '',
  max_limit: undefined,
  overbooking_no: undefined,
  status: 1,
  tariffs: [
    {
      id: `tariff-${Date.now()}`,
      no_of_pax: 1,
      room_tariff: 0,
      department_id: undefined,
      is_tax_applicable: 0,
      tax_type: '',
      discount_after: 0,
    },
  ],
  mode_charges: [],
};

const RoomCategoryManagement = () => {
  const { user } = useAuthContext();
  const hotelId = user?.hotelid;

  const [categories, setCategories] = useState<RoomCategory[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<RoomCategory | null>(null);
  const [form, setForm] = useState<RoomCategoryPayload>(defaultForm);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Load categories
  const loadCategories = async () => {
    if (!hotelId) {
      toast.error('Hotel ID not found. Please login again.');
      return;
    }
    setLoading(true);
    try {
      const response = await RoomCategoryService.list({ hotelid: hotelId }); // Changed from mst_hotelid to hotelid
      if (response.success) {
        setCategories(Array.isArray(response.data) ? response.data : []);
      } else {
        toast.error(response.message || 'Failed to load categories');
        setCategories([]);
      }
    } catch (error: any) {
      console.error('Failed to load categories:', error);
      toast.error(error.message || 'Failed to load categories');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hotelId) {
      loadCategories();
    }
  }, [hotelId]);

  // Filter & sort
  const filteredCategories = useMemo(() => {
    let result = categories;
    const query = search.trim().toLowerCase();
    if (query) {
      result = result.filter((cat) =>
        [cat.category_no, cat.category_name, cat.print_name, cat.display_name]
          .some((val) => val?.toLowerCase().includes(query))
      );
    }

    if (sortField) {
      result = [...result].sort((a, b) => {
        const aVal = a[sortField as keyof RoomCategory] ?? '';
        const bVal = b[sortField as keyof RoomCategory] ?? '';
        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [categories, search, sortField, sortDirection]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredCategories.length / pageSize)),
    [filteredCategories.length, pageSize]
  );

  const paginatedCategories = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCategories.slice(start, start + pageSize);
  }, [filteredCategories, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  // Modal handlers
  const handleOpenAddModal = () => {
    setEditingCategory(null);
    setForm({ ...defaultForm, tariffs: [{ ...defaultForm.tariffs[0], id: `tariff-${Date.now()}` }] });
    setShowModal(true);
  };

  const handleOpenEditModal = async (category: RoomCategory) => {
    setLoading(true);
    try {
      const response = await RoomCategoryService.get(category.room_category_id);
      if (response.success && response.data) {
        const full = response.data;
        setEditingCategory(full);
        setForm({
          category_no: full.category_no,
          category_name: full.category_name,
          department_id: full.department_id,
          print_name: full.print_name || '',
          display_seq: full.display_seq,
          display_name: full.display_name || '',
          total_rooms: full.total_rooms,
          apply_date: full.apply_date || '',
          max_limit: full.max_limit,
          overbooking_no: full.overbooking_no,
          status: full.status,
          tariffs: (full.tariffs || []).map((t, idx) => ({
            ...t,
            id: `tariff-${idx}-${Date.now()}`,
          })),
          mode_charges: full.mode_charges || [],
        });
        setShowModal(true);
      } else {
        toast.error(response.message || 'Failed to load category details');
      }
    } catch (error) {
      console.error('Failed to load category details:', error);
      toast.error('Failed to load category details');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    if (saving) return;
    setShowModal(false);
    setEditingCategory(null);
  };

  const handleSubmit = async (payload: RoomCategoryPayload) => {
    if (!payload.category_no || !payload.category_name) {
      toast.error('Category No and Name are required');
      return;
    }
    if (!hotelId) {
      toast.error('Hotel ID not found. Please login again.');
      return;
    }

    setSaving(true);
    try {
      const userId = user?.id;
      const apiPayload = {
        ...payload,
        hotelid: hotelId, // Changed from mst_hotelid to hotelid
        created_by_id: userId,
        updated_by_id: userId,
      };

      if (editingCategory) {
        const updatePayload = { ...apiPayload };
        delete updatePayload.created_by_id; // only updated_by_id goes to backend
        const response = await RoomCategoryService.update(editingCategory.room_category_id, updatePayload);
        if (response.success && response.data) {
          setCategories((prev) =>
            prev.map((item) =>
              item.room_category_id === response.data!.room_category_id ? response.data! : item
            )
          );
          toast.success('Room category updated');
        } else {
          toast.error(response.message || 'Update failed');
        }
      } else {
        const response = await RoomCategoryService.create(apiPayload);
        if (response.success && response.data) {
          setCategories((prev) => [response.data!, ...prev]);
          toast.success('Room category created');
        } else {
          toast.error(response.message || 'Create failed');
        }
      }

      setShowModal(false);
      setEditingCategory(null);
      setForm(defaultForm);
    } catch (error) {
      console.error('Failed to save room category:', error);
      toast.error('Failed to save room category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category: RoomCategory) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `You will not be able to recover category "${category.category_name}"!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3E97FF',
      confirmButtonText: 'Yes, delete it!',
    });

    if (result.isConfirmed) {
      setDeletingId(category.room_category_id);
      try {
        await RoomCategoryService.remove(category.room_category_id);
        setCategories((prev) => prev.filter((item) => item.room_category_id !== category.room_category_id));
        toast.success('Room category deleted successfully');
      } catch (error) {
        console.error('Failed to delete room category:', error);
        toast.error(typeof error === 'string' ? error : 'Failed to delete room category');
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <>
      <TitleHelmet title="Room Categories" />

      <Card className="mb-3">
        <Card.Body className="d-flex justify-content-between align-items-center">
          <div>
            <h4 className="mb-1">Room Categories</h4>
            <p className="text-muted mb-0">Manage room categories and their tariff & mode charges.</p>
          </div>
          <Button variant="danger" onClick={handleOpenAddModal}>
            <span className="me-1">+</span> Add Category
          </Button>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Form.Control
              type="text"
              placeholder="Search categories..."
              style={{ maxWidth: 280 }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Table hover responsive className="mb-0">
            <thead className="table-light">
              <tr>
                <th style={{ width: '60px' }}>#</th>
                <th onClick={() => handleSort('category_no')} style={{ cursor: 'pointer' }}>
                  Category No {sortField === 'category_no' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('category_name')} style={{ cursor: 'pointer' }}>
                  Category Name {sortField === 'category_name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th>Department</th>
                <th>Print Name</th>
                <th>Total Rooms</th>
                <th style={{ width: '100px' }}>Status</th>
                <th style={{ width: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center text-muted py-4">Loading categories...</td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-muted py-4">No categories found.</td>
                </tr>
              ) : (
                paginatedCategories.map((cat, index) => (
                  <tr key={cat.room_category_id}>
                    <td>{(currentPage - 1) * pageSize + index + 1}</td>
                    <td className="fw-semibold">{cat.category_no}</td>
                    <td>{cat.category_name}</td>
                    <td>{cat.department_name || '-'}</td>
                    <td>{cat.print_name || '-'}</td>
                    <td>{cat.total_rooms || '-'}</td>
                    <td>
                      <Badge bg={cat.status === 1 ? 'success' : 'secondary'}>
                        {cat.status === 1 ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button variant="outline-primary" size="sm" onClick={() => handleOpenEditModal(cat)}>
                          <i className="fi fi-rr-edit" />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(cat)}
                          disabled={deletingId === cat.room_category_id}
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

          {filteredCategories.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
              onPageChange={setCurrentPage}
            />
          )}
        </Card.Body>
      </Card>

      <FormModal
        size="lg"
        show={showModal}
        onHide={handleCloseModal}
        title={editingCategory ? 'Edit Room Category' : 'Add Room Category'}
        onSave={handleSubmit}
        saving={saving}
        submitLabel={editingCategory ? 'Update' : 'Save'}
        Component={RoomCategoryForm}
        selectedItem={form}
        isEdit={!!editingCategory}
      />
    </>
  );
};

export default RoomCategoryManagement;