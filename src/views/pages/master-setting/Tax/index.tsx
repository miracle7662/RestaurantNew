import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import Swal from 'sweetalert2';
import TitleHelmet from '@/components/Common/TitleHelmet';
import hotelTaxApi from '@/common/hotel/taxes';
import { Badge, Button, Card, Form, Table } from 'react-bootstrap';
import FormModal from '@/components/Common/models/FormModal';
import HotelTaxForm from './TaxForm';

type HotelTax = {
  hotel_taxid: number;
  hotel_tax_value: number;
  hotel_cgst: number;
  hotel_sgst: number;
  hotel_igst: number;
  hotel_cess: number;
  status: number;
};

type HotelTaxFormData = {
  hotel_tax_value: string;
  hotel_cgst: string;
  hotel_sgst: string;
  hotel_igst: string;
  hotel_cess: string;
  status: number;
};

const defaultForm: HotelTaxFormData = {
  hotel_tax_value: '',
  hotel_cgst: '',
  hotel_sgst: '',
  hotel_igst: '',
  hotel_cess: '',
  status: 1,
};

const HotelTaxMaster = () => {
  const [taxes, setTaxes] = useState<HotelTax[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingTax, setEditingTax] = useState<HotelTax | null>(null);
  const [form, setForm] = useState<HotelTaxFormData>(defaultForm);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const loadTaxes = async () => {
    setLoading(true);
    try {
      const response = await hotelTaxApi.list();

      if (response.success) {
        // Ensure status is number and data is array
        const taxData = Array.isArray(response.data) ? response.data : [];
        setTaxes(taxData);
      } else {
        toast.error(response.message || 'Failed to load hotel taxes');
        setTaxes([]);
      }
    } catch (error: any) {
      console.error('Failed to load hotel taxes:', error);
      toast.error(error.message || 'Failed to load hotel taxes');
      setTaxes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTaxes();
  }, []);

  const filteredTaxes = useMemo(() => {
    let result = taxes;

    // Apply search filter
    const query = search.trim().toLowerCase();
    if (query) {
      result = result.filter((tax) =>
        [tax.hotel_tax_value.toString(), tax.hotel_cgst.toString(), tax.hotel_sgst.toString(), tax.hotel_igst.toString(), tax.hotel_cess.toString()].some((value) =>
          value.toLowerCase().includes(query)
        )
      );
    }

    // Apply sorting
    if (sortField) {
      result = [...result].sort((a, b) => {
        const aValue = a[sortField as keyof HotelTax] ?? '';
        const bValue = b[sortField as keyof HotelTax] ?? '';
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [taxes, search, sortField, sortDirection]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredTaxes.length / pageSize));
  }, [filteredTaxes.length, pageSize]);

  const paginatedTaxes = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredTaxes.slice(startIndex, startIndex + pageSize);
  }, [filteredTaxes, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleOpenAddModal = () => {
    setEditingTax(null);
    setForm(defaultForm);
    setShowModal(true);
  };

  const handleOpenEditModal = (tax: HotelTax) => {
    setEditingTax(tax);
    setForm({
      hotel_tax_value: tax.hotel_tax_value.toString(),
      hotel_cgst: tax.hotel_cgst.toString(),
      hotel_sgst: tax.hotel_sgst.toString(),
      hotel_igst: tax.hotel_igst.toString(),
      hotel_cess: tax.hotel_cess.toString(),
      status: tax.status,
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    if (saving) return;
    setShowModal(false);
    setEditingTax(null);
  };

  const handleSubmit = async (payload: HotelTaxFormData) => {
    // Convert string inputs to numbers and ensure status is number
    const data = {
      hotel_tax_value: parseFloat(payload.hotel_tax_value),
      hotel_cgst: parseFloat(payload.hotel_cgst),
      hotel_sgst: parseFloat(payload.hotel_sgst),
      hotel_igst: parseFloat(payload.hotel_igst),
      hotel_cess: parseFloat(payload.hotel_cess),
      status: Number(payload.status), // Ensure status is number
    };

    setSaving(true);
    try {
      if (editingTax) {
        const response = await hotelTaxApi.update(editingTax.hotel_taxid, data);
        if (response.success && response.data) {
          setTaxes((prev) =>
            prev.map((item) => 
              item.hotel_taxid === response.data!.hotel_taxid 
                ? { ...response.data!, status: Number(response.data!.status) } 
                : item
            )
          );
          toast.success('Hotel tax updated successfully');
        } else {
          toast.error(response.message || 'Update failed');
        }
      } else {
        const response = await hotelTaxApi.create(data);
        if (response.success && response.data) {
          const newTax = { ...response.data!, status: Number(response.data!.status) };
          setTaxes((prev) => [newTax, ...prev]);
          toast.success('Hotel tax added successfully');
        } else {
          toast.error(response.message || 'Create failed');
        }
      }
      setShowModal(false);
      setEditingTax(null);
      setForm(defaultForm);
    } catch (error) {
      console.error('Failed to save hotel tax:', error);
      toast.error('Failed to save hotel tax');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (tax: HotelTax) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `You will not be able to recover this tax record!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3E97FF',
      confirmButtonText: 'Yes, delete it!',
    });

    if (result.isConfirmed) {
      setDeletingId(tax.hotel_taxid);
      try {
        await hotelTaxApi.remove(tax.hotel_taxid);
        setTaxes((prev) => prev.filter((item) => item.hotel_taxid !== tax.hotel_taxid));
        toast.success('Hotel tax deleted successfully');
      } catch (error) {
        console.error('Failed to delete hotel tax:', error);
        toast.error(typeof error === 'string' ? error : 'Failed to delete hotel tax');
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <>
      <TitleHelmet title="Hotel Tax Master" />

      <Card className="mb-3">
        <Card.Body className="d-flex justify-content-between align-items-center">
          <div>
            <h4 className="mb-1">Hotel Tax Master</h4>
            <p className="text-muted mb-0">Manage hotel tax rates.</p>
          </div>
          <Button variant="danger" onClick={handleOpenAddModal}>
            <span className="me-1">+</span> Add Tax
          </Button>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Form.Control
              type="text"
              placeholder="Search taxes..."
              style={{ maxWidth: 280 }}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <Table hover responsive className="mb-0">
            <thead className="table-light">
              <tr>
                <th style={{ width: '60px' }}>#</th>
                <th onClick={() => handleSort('hotel_tax_value')} style={{ cursor: 'pointer' }}>
                  Tax Value
                  {sortField === 'hotel_tax_value' && (
                    <span className="ms-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th onClick={() => handleSort('hotel_cgst')} style={{ cursor: 'pointer' }}>
                  CGST
                  {sortField === 'hotel_cgst' && (
                    <span className="ms-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th onClick={() => handleSort('hotel_sgst')} style={{ cursor: 'pointer' }}>
                  SGST
                  {sortField === 'hotel_sgst' && (
                    <span className="ms-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th onClick={() => handleSort('hotel_igst')} style={{ cursor: 'pointer' }}>
                  IGST
                  {sortField === 'hotel_igst' && (
                    <span className="ms-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th onClick={() => handleSort('hotel_cess')} style={{ cursor: 'pointer' }}>
                  CESS
                  {sortField === 'hotel_cess' && (
                    <span className="ms-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th style={{ width: '120px' }}>Status</th>
                <th style={{ width: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center text-muted py-4">
                    Loading taxes...
                  </td>
                </tr>
              ) : filteredTaxes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-muted py-4">
                    No taxes found.
                  </td>
                </tr>
              ) : (
                paginatedTaxes.map((tax, index) => (
                  <tr key={tax.hotel_taxid}>
                    <td>{(currentPage - 1) * pageSize + index + 1}</td>
                    <td>{tax.hotel_tax_value}</td>
                    <td>{tax.hotel_cgst}</td>
                    <td>{tax.hotel_sgst}</td>
                    <td>{tax.hotel_igst}</td>
                    <td>{tax.hotel_cess}</td>
                    <td>
                      <Badge bg={tax.status === 1 ? 'success' : 'secondary'}>
                        {tax.status === 1 ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button variant="outline-primary" size="sm" onClick={() => handleOpenEditModal(tax)}>
                          <i className="fi fi-rr-edit" />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(tax)}
                          disabled={deletingId === tax.hotel_taxid}
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

          {filteredTaxes.length > 0 && (
            <div className="d-flex justify-content-between align-items-center mt-3">
              <Form.Select
                style={{ maxWidth: 80 }}
                value={pageSize}
                onChange={(event) => setPageSize(Number(event.target.value))}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </Form.Select>
              <div className="d-flex align-items-center gap-2">
                <Button
                  variant="outline-light"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
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
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
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
        title={editingTax ? 'Edit Hotel Tax' : 'Add Hotel Tax'}
        onSave={handleSubmit}
        saving={saving}
        submitLabel={editingTax ? 'Update' : 'Save'}
        Component={HotelTaxForm}
        selectedItem={form}
      />
    </>
  );
};

export default HotelTaxMaster;