// src/views/pages/master-setting/RegistrationHotelUsers/index.tsx
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import Swal from 'sweetalert2';
import TitleHelmet from '@/components/Common/TitleHelmet';
import hotelRegistrationApi from '@/common/hotel/hotelRegistrations';
import { Badge, Button, Card, Form, Table } from 'react-bootstrap';
import FormModal from '@/components/Common/models/FormModal';
import HotelRegistrationForm from './RegistrationHotelUsersForm';

// Removed unused useAuthContext import

type HotelRegistration = {
  mst_hotelid: number;
  hotel_name: string;
  email: string;
  mobile: string | null;
  status: number;
  // other fields omitted for list view
};

type HotelRegistrationFormData = {
  mst_hotelid?: number;
  hotel_name: string;
  email: string;
  password?: string;
  // all other fields...
  [key: string]: any;
};

const defaultForm: HotelRegistrationFormData = {
  hotel_name: '',
  email: '',
  // ...
};

const HotelRegistrationMaster = () => {
  const [registrations, setRegistrations] = useState<HotelRegistration[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingHotel, setEditingHotel] = useState<HotelRegistrationFormData | null>(null);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [fetchingHotel, setFetchingHotel] = useState(false);

  const loadRegistrations = async () => {
    setLoading(true);
    try {
      const response = await hotelRegistrationApi.list({ q: search || undefined });
      if (response.success) {
        setRegistrations(Array.isArray(response.data) ? response.data : []);
      } else {
        toast.error(response.message || 'Failed to load hotels');
        setRegistrations([]);
      }
    } catch (error: any) {
      console.error('Failed to load hotels:', error);
      toast.error(error.message || 'Failed to load hotels');
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRegistrations();
  }, [search]);

  // Filter, sort, pagination logic (same as before)
  const filteredRegistrations = useMemo(() => {
    let result = registrations;
    if (search) {
      const query = search.toLowerCase();
      result = result.filter(
        (h) =>
          h.hotel_name.toLowerCase().includes(query) ||
          h.email.toLowerCase().includes(query) ||
          (h.mobile && h.mobile.includes(query))
      );
    }
    if (sortField) {
      result = [...result].sort((a, b) => {
        const aVal = a[sortField as keyof HotelRegistration] ?? '';
        const bVal = b[sortField as keyof HotelRegistration] ?? '';
        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [registrations, search, sortField, sortDirection]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredRegistrations.length / pageSize)),
    [filteredRegistrations.length, pageSize]
  );

  const paginatedRegistrations = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRegistrations.slice(start, start + pageSize);
  }, [filteredRegistrations, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleOpenAddModal = () => {
    setEditingHotel(null);
    setShowModal(true);
  };

  // Modified: fetch full hotel data and convert null to undefined for password
  const handleOpenEditModal = async (hotel: HotelRegistration) => {
    setFetchingHotel(true);
    try {
      const response = await hotelRegistrationApi.get(hotel.mst_hotelid);
      if (response.success && response.data) {
        // Convert password: null -> undefined to match form type
        const hotelData = { ...response.data, password: response.data.password ?? undefined };
        setEditingHotel(hotelData);
        setShowModal(true);
      } else {
        toast.error(response.message || 'Failed to load hotel details');
      }
    } catch (error) {
      console.error('Failed to load hotel details:', error);
      toast.error('Failed to load hotel details');
    } finally {
      setFetchingHotel(false);
    }
  };

  const handleCloseModal = () => {
    if (saving) return;
    setShowModal(false);
    setEditingHotel(null);
  };

  const handleSubmit = async (payload: HotelRegistrationFormData) => {
    if (!payload.hotel_name || !payload.email) {
      toast.error('Hotel name and email are required');
      return;
    }

    setSaving(true);
    try {
      // Remove confirm_password if present (it's not needed in backend)
      const { confirm_password, ...cleanPayload } = payload;

      if (editingHotel) {
        const response = await hotelRegistrationApi.update(editingHotel.mst_hotelid!, cleanPayload);
        if (response.success && response.data) {
          setRegistrations((prev) =>
            prev.map((item) =>
              item.mst_hotelid === response.data!.mst_hotelid ? response.data! : item
            )
          );
          toast.success('Hotel updated successfully');
        } else {
          toast.error(response.message || 'Update failed');
        }
      } else {
        const response = await hotelRegistrationApi.create(cleanPayload);
        if (response.success && response.data) {
          setRegistrations((prev) => [response.data!, ...prev]);
          toast.success('Hotel added successfully');
        } else {
          toast.error(response.message || 'Create failed');
        }
      }
      setShowModal(false);
      setEditingHotel(null);
    } catch (error) {
      console.error('Failed to save hotel:', error);
      toast.error('Failed to save hotel');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (hotel: HotelRegistration) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `You will not be able to recover hotel "${hotel.hotel_name}"!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3E97FF',
      confirmButtonText: 'Yes, delete it!',
    });

    if (result.isConfirmed) {
      setDeletingId(hotel.mst_hotelid);
      try {
        await hotelRegistrationApi.remove(hotel.mst_hotelid);
        setRegistrations((prev) => prev.filter((item) => item.mst_hotelid !== hotel.mst_hotelid));
        toast.success('Hotel deleted successfully');
      } catch (error) {
        console.error('Failed to delete hotel:', error);
        toast.error(typeof error === 'string' ? error : 'Failed to delete hotel');
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <>
      <TitleHelmet title="Hotel Registration Master" />
      <Card className="mb-3">
        <Card.Body className="d-flex justify-content-between align-items-center">
          <div>
            <h4 className="mb-1">Hotel Registration Master</h4>
            <p className="text-muted mb-0">Manage hotels and their information.</p>
          </div>
          <Button variant="danger" onClick={handleOpenAddModal}>
            <span className="me-1">+</span> Add Hotel
          </Button>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Form.Control
              type="text"
              placeholder="Search hotels..."
              style={{ maxWidth: 280 }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Table hover responsive className="mb-0">
            <thead className="table-light">
              <tr>
                <th style={{ width: '60px' }}>#</th>
                <th onClick={() => handleSort('hotel_name')} style={{ cursor: 'pointer' }}>
                  Hotel Name {sortField === 'hotel_name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('email')} style={{ cursor: 'pointer' }}>
                  Email {sortField === 'email' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('mobile')} style={{ cursor: 'pointer' }}>
                  Mobile {sortField === 'mobile' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{ width: '120px' }}>Status</th>
                <th style={{ width: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-4">
                    Loading hotels...
                  </td>
                </tr>
              ) : filteredRegistrations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-4">
                    No hotels found.
                  </td>
                </tr>
              ) : (
                paginatedRegistrations.map((hotel, index) => (
                  <tr key={hotel.mst_hotelid}>
                    <td>{(currentPage - 1) * pageSize + index + 1}</td>
                    <td className="fw-semibold">{hotel.hotel_name}</td>
                    <td>{hotel.email}</td>
                    <td>{hotel.mobile || '—'}</td>
                    <td>
                      <Badge bg={hotel.status === 1 ? 'success' : 'secondary'}>
                        {hotel.status === 1 ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleOpenEditModal(hotel)}
                          disabled={fetchingHotel}
                        >
                          <i className="fi fi-rr-edit" />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(hotel)}
                          disabled={deletingId === hotel.mst_hotelid}
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

          {filteredRegistrations.length > 0 && (
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
                <Button variant="danger" size="sm">
                  {currentPage}
                </Button>
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
        </Card.Body>
      </Card>

      <FormModal
        show={showModal}
        onHide={handleCloseModal}
        title={editingHotel ? 'Edit Hotel' : 'Add Hotel'}
        onSave={handleSubmit}
        saving={saving}
        submitLabel={editingHotel ? 'Update' : 'Save'}
        Component={HotelRegistrationForm}
        selectedItem={editingHotel || defaultForm}
      />
    </>
  );
};

export default HotelRegistrationMaster;