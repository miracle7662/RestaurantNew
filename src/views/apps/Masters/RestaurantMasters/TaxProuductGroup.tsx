import React, { useState, useEffect } from 'react';
import { Card, Col, Row, Button, Form, Table, Modal, Alert } from 'react-bootstrap';
import { useAuthContext } from '../../../../common/context/useAuthContext';
import { fetchBrands } from '@/utils/commonfunction';
import taxGroupsService from '../../../../common/api/taxgroups';
import PaginationComponent from '@/components/Common/PaginationComponent';

interface TaxGroup {
  taxgroupid: number;
  taxgroup_name: string;
  hotelid: number;
  outletid: number;
  hotel_name: string;
  status: number;
  created_by_id: number;
  created_date: string;
  created_by?: string; // Optional, if you want to show created by user name
}

const TaxProductGroup: React.FC = () => {
  const { user } = useAuthContext();
  const [taxGroups, setTaxGroups] = useState<TaxGroup[]>([]);
  const [filteredTaxGroups, setFilteredTaxGroups] = useState<TaxGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [brands, setBrands] = useState<Array<{ hotelid: number; hotel_name: string }>>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [formData, setFormData] = useState({
    taxgroup_name: '',
    hotelid: '',
    status: '1'

  });

  // Fetch tax groups and hotels
const fetchData = async () => {
  setLoading(true);
  setError('');

  try {
    // Fetch tax groups
    const taxGroupsRes = await taxGroupsService.list();
    const taxGroupsData = taxGroupsRes.data.taxGroups ?? []; // data is { taxGroups: [...], count: X }
    setTaxGroups(taxGroupsData);
    setFilteredTaxGroups(taxGroupsData);

    // Fetch brands/hotels
    if (user) {
      await fetchBrands(user, setBrands);
    }

  } catch (err: any) {
    console.error('Error fetching data:', err);
    setError('Failed to fetch data');
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchData();
  }, [user]);

  // Handle search input
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    const filtered = taxGroups.filter(
      (group) =>
        group.taxgroup_name.toLowerCase().includes(value.toLowerCase()) ||
        group.hotel_name.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredTaxGroups(filtered);
    setCurrentPage(1); // Reset to first page on search
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      taxgroup_name: '',
      hotelid: '',
      status: '1',

    });
    setEditingId(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.taxgroup_name || !formData.hotelid || formData.status === '') {
      setError('Please fill all required fields');
      return;
    }

    // Validate hotelid is a valid number
    const hotelIdNum = parseInt(formData.hotelid);
    if (isNaN(hotelIdNum)) {
      setError('Please select a valid hotel');
      return;
    }

    // Validate status is 0 or 1
    const statusNum = parseInt(formData.status);
    if (statusNum !== 0 && statusNum !== 1) {
      setError('Please select a valid status');
      return;
    }

    try {
      let payload;
      if (editingId) {
        payload = {
          ...formData,
          taxgroup_name: formData.taxgroup_name.toString(),
          hotelid: hotelIdNum,
          status: statusNum,
          updated_by_id: user?.id ?? 1,
          updated_date: new Date().toISOString()
        };
        await taxGroupsService.update(editingId, payload);
        setSuccess('Tax group updated successfully');
      } else {
        payload = {
          ...formData,
          taxgroup_name: formData.taxgroup_name.toString(),
          hotelid: hotelIdNum,
          status: statusNum,
          created_by_id: user?.id ?? 1,
          created_date: new Date().toISOString()
        };
        await taxGroupsService.create(payload);
        setSuccess('Tax group created successfully');
      }

      setShowModal(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (taxGroup: TaxGroup) => {
    setFormData({
      taxgroup_name: taxGroup.taxgroup_name,
      hotelid: taxGroup.hotelid.toString(),
      status: taxGroup.status.toString()
    });
    setEditingId(taxGroup.taxgroupid);
    setShowModal(true);
  };
  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this tax group?')) {
      try {
        await taxGroupsService.remove(id);
        setSuccess('Tax group deleted successfully');
        fetchData();
      } catch (err) {
        setError('Failed to delete tax group');
      }
    }
  };

  const getStatusBadge = (status: number) => {
    return status === 1 ? (
      <span className="badge bg-success">Active</span>
    ) : (
      <span className="badge bg-danger">Inactive</span>
    );
  };

  // Pagination logic
  const totalItems = filteredTaxGroups.length;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentItems = filteredTaxGroups.slice(startIndex, endIndex);

  return (
    <div className="flex-grow-1 p-4" style={{ overflowY: 'auto' }}>


      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {error && !showModal && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Row>
        <Col>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center py-1 px-2 m-0">
              <h5 className="mb-0">Tax Groups</h5>
              <Button
                variant="primary"
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
              >
                Add New Tax Group
              </Button>
            </Card.Header>
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Control
                  type="text"
                  className="form-control rounded-pill"
                  placeholder="Search by tax group name or hotel..."
                  value={searchTerm}
                  onChange={handleSearch}
                  style={{ maxWidth: '300px' }}
                />
              </Form.Group>
              {loading ? (
                <div className="text-center">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <>
                  <Table responsive hover className="mb-4">
                    <thead className="bg-light">
                      <tr>
                        <th>ID</th>
                        <th>Tax Group Name</th>
                        <th>Hotel</th>
                        <th>Status</th>
                        <th>Created By</th>
                        <th>Created Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(currentItems) && currentItems.length > 0 ? (
                        currentItems.map((group) => (
                          <tr key={group.taxgroupid}>
                            <td>{group.taxgroupid}</td>
                            <td>{group.taxgroup_name}</td>
                            <td>{group.hotel_name}</td>
                            <td>{getStatusBadge(group.status)}</td>
                            <td>{group.created_by}</td>
                            <td>{new Date(group.created_date).toLocaleDateString()}</td>
                            <td>
                              <Button
                                variant="warning"
                                size="sm"
                                className="me-2"
                                onClick={() => handleEdit(group)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleDelete(group.taxgroupid)}
                              >
                                Delete
                              </Button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="text-center">
                            {loading ? 'Loading...' : 'No tax groups found'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                  <PaginationComponent
                    totalItems={totalItems}
                    pageSize={pageSize}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
                  />
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingId ? 'Edit Tax Group' : 'Add New Tax Group'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && showModal && (
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tax Group Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="taxgroup_name"
                    value={formData.taxgroup_name}
                    onChange={handleInputChange}
                    placeholder="Enter tax group name"
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Hotel <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="hotelid"
                    value={formData.hotelid}
                    onChange={handleInputChange}
                    disabled={loading}
                  >
                    <option value="">Select Hotel</option>
                    {brands.map((brand) => (
                      <option key={brand.hotelid} value={brand.hotelid}>
                        {brand.hotel_name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="1">Active</option>
                    <option value="0">Inactive</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <div className="text-end">
              <Button variant="secondary" onClick={() => setShowModal(false)} className="me-2">
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                {editingId ? 'Update' : 'Create'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default TaxProductGroup;