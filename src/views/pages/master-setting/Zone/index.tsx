import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import Swal from 'sweetalert2';
import TitleHelmet from '@/components/Common/TitleHelmet';
import zoneApi from '@/common/hotel/zones'; // adjust import path
import { Badge, Button, Card, Form, Table } from 'react-bootstrap';
import FormModal from '@/components/Common/models/FormModal';
import ZoneForm from './ZoneForm';

type Zone = {
  zoneid: number;
  zonename: string;
  zonecode: string;
  cityid: number;
  city_name: string;
  description?: string;
  status: number;
};

type ZoneFormData = {
  zonename: string;
  zonecode: string;
  cityid: number;
  description: string;
  status: number;
};

const defaultForm: ZoneFormData = {
  zonename: '',
  zonecode: '',
  cityid: 0,
  description: '',
  status: 1,
};

const ZoneMaster = () => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [form, setForm] = useState<ZoneFormData>(defaultForm);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const loadZones = async () => {
    setLoading(true);
    try {
      const response = await zoneApi.list();
      if (response.success) {
        setZones(Array.isArray(response.data) ? response.data : []);
      } else {
        toast.error(response.message || 'Failed to load zones');
        setZones([]);
      }
    } catch (error: any) {
      console.error('Failed to load zones:', error);
      toast.error(error.message || 'Failed to load zones');
      setZones([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadZones();
  }, []);

  const filteredZones = useMemo(() => {
    let result = zones;

    const query = search.trim().toLowerCase();
    if (query) {
      result = result.filter((zone) =>
        [zone.zonename, zone.zonecode, zone.city_name, zone.description].some((value) =>
          value?.toLowerCase().includes(query)
        )
      );
    }

    if (sortField) {
      result = [...result].sort((a, b) => {
        let aValue: any = '';
        let bValue: any = '';
        if (sortField === 'city') {
          aValue = a.city_name;
          bValue = b.city_name;
        } else {
          aValue = a[sortField as keyof Zone] ?? '';
          bValue = b[sortField as keyof Zone] ?? '';
        }
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [zones, search, sortField, sortDirection]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredZones.length / pageSize));
  }, [filteredZones.length, pageSize]);

  const paginatedZones = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredZones.slice(startIndex, startIndex + pageSize);
  }, [filteredZones, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleOpenAddModal = () => {
    setEditingZone(null);
    setForm(defaultForm);
    setShowModal(true);
  };

  const handleOpenEditModal = (zone: Zone) => {
    setEditingZone(zone);
    setForm({
      zonename: zone.zonename,
      zonecode: zone.zonecode,
      cityid: zone.cityid,
      description: zone.description ?? '',
      status: zone.status,
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    if (saving) return;
    setShowModal(false);
    setEditingZone(null);
  };

  const handleSubmit = async (payload: ZoneFormData) => {
    if (!payload.zonename || !payload.zonecode || !payload.cityid) {
      toast.error('Zone name, code, and city are required');
      return;
    }

    setSaving(true);

    try {
      if (editingZone) {
        const response = await zoneApi.update(editingZone.zoneid, payload);
        if (response.success && response.data) {
          setZones((prev) =>
            prev.map((item) => (item.zoneid === response.data!.zoneid ? response.data! : item))
          );
          toast.success('Zone updated');
        } else {
          toast.error(response.message || 'Update failed');
        }
      } else {
        const response = await zoneApi.create(payload);
        if (response.success && response.data) {
          setZones((prev) => [response.data!, ...prev]);
          toast.success('Zone added');
        } else {
          toast.error(response.message || 'Create failed');
        }
      }

      setShowModal(false);
      setEditingZone(null);
    } catch (error) {
      console.error('Failed to save zone:', error);
      toast.error('Failed to save zone');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (zone: Zone) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `You will not be able to recover zone "${zone.zonename}"!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3E97FF',
      confirmButtonText: 'Yes, delete it!',
    });

    if (result.isConfirmed) {
      setDeletingId(zone.zoneid);
      try {
        await zoneApi.remove(zone.zoneid);
        setZones((prev) => prev.filter((item) => item.zoneid !== zone.zoneid));
        toast.success('Zone deleted successfully');
      } catch (error) {
        console.error('Failed to delete zone:', error);
        toast.error(typeof error === 'string' ? error : 'Failed to delete zone');
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <>
      <TitleHelmet title="Zone Master" />

      <Card className="mb-3">
        <Card.Body className="d-flex justify-content-between align-items-center">
          <div>
            <h4 className="mb-1">Zone Master</h4>
            <p className="text-muted mb-0">Manage zones and their information.</p>
          </div>
          <Button variant="danger" onClick={handleOpenAddModal}>
            <span className="me-1">+</span> Add Zone
          </Button>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Form.Control
              type="text"
              placeholder="Search zones..."
              style={{ maxWidth: 280 }}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <Table hover responsive className="mb-0">
            <thead className="table-light">
              <tr>
                <th style={{ width: '60px' }}>#</th>
                <th onClick={() => handleSort('zonename')} style={{ cursor: 'pointer' }}>
                  Zone Name
                  {sortField === 'zonename' && <span className="ms-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                </th>
                <th style={{ width: '140px' }}>Zone Code</th>
                <th onClick={() => handleSort('city')} style={{ cursor: 'pointer' }}>
                  City
                  {sortField === 'city' && <span className="ms-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                </th>
                <th>Description</th>
                <th style={{ width: '120px' }}>Status</th>
                <th style={{ width: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted py-4">Loading zones...</td>
                </tr>
              ) : filteredZones.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted py-4">No zones found.</td>
                </tr>
              ) : (
                paginatedZones.map((zone, index) => (
                  <tr key={zone.zoneid}>
                    <td>{(currentPage - 1) * pageSize + index + 1}</td>
                    <td className="fw-semibold">{zone.zonename}</td>
                    <td>
                      <Badge bg="primary" className="px-3">{zone.zonecode}</Badge>
                    </td>
                    <td>{zone.city_name}</td>
                    <td>{zone.description || '-'}</td>
                    <td>
                      <Badge bg={zone.status === 1 ? 'success' : 'secondary'}>
                        {zone.status === 1 ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button variant="outline-primary" size="sm" onClick={() => handleOpenEditModal(zone)}>
                          <i className="fi fi-rr-edit" />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(zone)}
                          disabled={deletingId === zone.zoneid}>
                          <i className="fi fi-rr-trash" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>

          {filteredZones.length > 0 && (
            <div className="d-flex justify-content-between align-items-center mt-3">
              <Form.Select
                style={{ maxWidth: 80 }}
                value={pageSize}
                onChange={(event) => setPageSize(Number(event.target.value))}>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </Form.Select>
              <div className="d-flex align-items-center gap-2">
                <Button
                  variant="outline-light"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}>
                  {'<'}
                </Button>
                <Button variant="danger" size="sm">{currentPage}</Button>
                <Button
                  variant="outline-light"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}>
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
        title={editingZone ? 'Edit Zone' : 'Add Zone'}
        onSave={handleSubmit}
        saving={saving}
        submitLabel={editingZone ? 'Update' : 'Save'}
        Component={ZoneForm}
        selectedItem={form}
      />
    </>
  );
};

export default ZoneMaster;