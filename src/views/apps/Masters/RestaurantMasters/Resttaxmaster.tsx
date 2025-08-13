import React, { useState, useEffect } from 'react';
import { Card, Col, Row, Button, Form, Table, Modal, Alert, Pagination } from 'react-bootstrap';
import axios from 'axios';
import { useAuthContext } from '@/common/context/useAuthContext';
import { fetchBrands, fetchOutletsForDropdown } from '@/utils/commonfunction';
import { OutletData } from '@/common/api/outlet';

interface RestTaxMaster {
  resttaxid: number;
  hotelid: number;
  hotel_name: string;
  outletid: number | null;
  isapplicablealloutlet: number;
  resttax_name: string;
  resttax_value: number;
  restcgst: number;
  restsgst: number;
  restigst: number;
  taxgroupid: number;
  taxgroup_name: string;
  status: number;
  created_by_id: string;
  created_date: string;
  username?: string;
}

interface Brand {
  hotelid: number;
  hotel_name: string;
}

interface TaxGroup {
  taxgroupid: number;
  taxgroup_name: string;
}

const RestTaxMaster: React.FC = () => {
  const { user } = useAuthContext();
  const [restTaxes, setRestTaxes] = useState<RestTaxMaster[]>([]);
  const [filteredRestTaxes, setFilteredRestTaxes] = useState<RestTaxMaster[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [taxGroups, setTaxGroups] = useState<TaxGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [outlets, setOutlets] = useState<OutletData[]>([]);
  const [selectedOutlet, setSelectedOutlet] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const [formData, setFormData] = useState({
    hotelid: '',
    outletid: '',
    isapplicablealloutlet: false,
    resttax_name: '',
    resttax_value: '',
    restcgst: '',
    restsgst: '',
    restigst: '',
    taxgroupid: '',
    status: '1',
  });

  // Fetch data for rest taxes, brands, and tax groups
  const fetchData = async () => {
    try {
      setLoading(true);
      const restTaxesRes = await axios.get('/api/resttaxmaster');
      console.log('Fetched rest taxes:', restTaxesRes.data);
      const taxes = Array.isArray(restTaxesRes.data) ? restTaxesRes.data : [];
      setRestTaxes(taxes);
      setFilteredRestTaxes(taxes);

      await fetchBrands(user, setBrands);
      console.log('Fetched brands:', brands);

      const taxGroupsRes = await axios.get('/api/taxgroup');
      console.log('Fetched tax groups:', taxGroupsRes.data);
      setTaxGroups(Array.isArray(taxGroupsRes.data.data?.taxGroups) ? taxGroupsRes.data.data.taxGroups : []);
    } catch (err: any) {
      setError('Failed to fetch data: ' + (err.response?.data?.message || err.message));
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchOutletsForDropdown(user, setOutlets, setLoading);
  }, [user]);

  // Handle search input
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    const filtered = restTaxes.filter(
      (tax) =>
        tax.resttax_name.toLowerCase().includes(value.toLowerCase()) ||
        tax.hotel_name.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredRestTaxes(filtered);
    setCurrentPage(1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const resetForm = () => {
    setFormData({
      hotelid: '',
      outletid: '',
      isapplicablealloutlet: false,
      resttax_name: '',
      resttax_value: '',
      restcgst: '',
      restsgst: '',
      restigst: '',
      taxgroupid: '',
      status: '1',
    });
    setEditingId(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.resttax_name || !formData.hotelid || !formData.taxgroupid || !formData.status) {
      setError('Please fill all required fields (Tax Name, Hotel, Tax Group, Status)');
      return;
    }

    const hotelIdNum = parseInt(formData.hotelid);
    const taxGroupIdNum = parseInt(formData.taxgroupid);
    const taxValueNum = parseFloat(formData.resttax_value) || 0;
    const cgstNum = parseFloat(formData.restcgst) || 0;
    const sgstNum = parseFloat(formData.restsgst) || 0;
    const igstNum = parseFloat(formData.restigst) || 0;
    const statusNum = parseInt(formData.status);

    if (isNaN(hotelIdNum) || isNaN(taxGroupIdNum)) {
      setError('Please select a valid hotel and tax group');
      return;
    }

    if (isNaN(taxValueNum)) {
      setError('Please enter a valid tax value');
      return;
    }

    const payload = {
      hotelid: hotelIdNum,
      outletid: formData.outletid ? parseInt(formData.outletid) : null,
      isapplicablealloutlet: formData.isapplicablealloutlet ? 1 : 0,
      resttax_name: formData.resttax_name,
      resttax_value: taxValueNum,
      restcgst: cgstNum,
      restsgst: sgstNum,
      restigst: igstNum,
      taxgroupid: taxGroupIdNum,
      status: statusNum,
      [editingId ? 'updated_by_id' : 'created_by_id']: user?.id ?? 1,
    };

    try {
      console.log('Submitting payload:', payload);
      let response;
      if (editingId) {
        response = await axios.put(`/api/resttaxmaster/${editingId}`, payload);
        setSuccess('Rest tax updated successfully');
      } else {
        response = await axios.post('/api/resttaxmaster', payload);
        setSuccess('Rest tax created successfully');
      }
      console.log('Server response:', response.data);
      setShowModal(false);
      resetForm();
      await fetchData();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Operation failed';
      setError(errorMessage);
      console.error('Submit error:', err);
    }
  };

  const handleEdit = (restTax: RestTaxMaster) => {
    setFormData({
      hotelid: restTax.hotelid.toString(),
      outletid: restTax.outletid?.toString() || '',
      isapplicablealloutlet: restTax.isapplicablealloutlet === 1,
      resttax_name: restTax.resttax_name,
      resttax_value: restTax.resttax_value.toString(),
      restcgst: restTax.restcgst.toString(),
      restsgst: restTax.restsgst.toString(),
      restigst: restTax.restigst.toString(),
      taxgroupid: restTax.taxgroupid.toString(),
      status: restTax.status.toString(),
    });
    setEditingId(restTax.resttaxid);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this rest tax?')) {
      try {
        const response = await axios.delete(`/api/resttaxmaster/${id}`);
        console.log('Delete response:', response.data);
        setSuccess('Rest tax deleted successfully');
        await fetchData();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete rest tax');
        console.error('Delete error:', err);
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
  const totalItems = filteredRestTaxes.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentItems = filteredRestTaxes.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(parseInt(e.target.value));
    setCurrentPage(1);
  };

  const getPaginationItems = () => {
    const items = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <Pagination.Item
          key={i}
          active={i === currentPage}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </Pagination.Item>
      );
    }
    return items;
  };

  return (
    <div className="container-fluid" style={{ overflowY: 'auto' }}>
      
      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Row>
        <Col>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center py-1 px-2 m-0">
              <h5 className="mb-0">Rest Taxes</h5>
              <Button
                variant="primary"
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
              >
                Add New Rest Tax
              </Button>
            </Card.Header>
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Control
                  type="text"
                  className="form-control rounded-pill"
                  placeholder="Search by tax name or hotel..."
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
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Tax Name</th>
                        <th>Hotel</th>
                        <th>Tax Group</th>
                        <th>Tax Value</th>
                        <th>CGST</th>
                        <th>SGST</th>
                        <th>IGST</th>
                        <th>Status</th>
                        <th>Created By</th>
                        <th>Created Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.length > 0 ? (
                        currentItems.map((tax) => (
                          <tr key={tax.resttaxid}>
                            <td>{tax.resttaxid}</td>
                            <td>{tax.resttax_name}</td>
                            <td>{tax.hotel_name}</td>
                            <td>{tax.taxgroup_name}</td>
                            <td>{tax.resttax_value}%</td>
                            <td>{tax.restcgst}%</td>
                            <td>{tax.restsgst}%</td>
                            <td>{tax.restigst}%</td>
                            <td>{getStatusBadge(tax.status)}</td>
                            <td>{tax.username}</td>
                            <td>{new Date(tax.created_date).toLocaleDateString()}</td>
                            <td>
                              <Button
                                variant="warning"
                                size="sm"
                                className="me-2"
                                onClick={() => handleEdit(tax)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleDelete(tax.resttaxid)}
                              >
                                Delete
                              </Button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={12} className="text-center">
                            {loading ? 'Loading...' : 'No rest taxes found'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <Form.Select
                        value={pageSize}
                        onChange={handlePageSizeChange}
                        style={{ width: '100px', display: 'inline-block', marginRight: '10px' }}
                      >
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="50">50</option>
                      </Form.Select>
                      <span className="text-muted">
                        Showing {currentItems.length} of {totalItems} entries
                      </span>
                    </div>
                    <Pagination>
                      <Pagination.Prev
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      />
                      {getPaginationItems()}
                      <Pagination.Next
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      />
                    </Pagination>
                  </div>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingId ? 'Edit Rest Tax' : 'Add New Rest Tax'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Hotel <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="hotelid"
                    value={formData.hotelid}
                    onChange={handleInputChange}
                    required
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
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Outlet</Form.Label>
                  <Form.Select
                    className="form-control"
                    value={selectedOutlet || ''}
                    onChange={(e) => setSelectedOutlet(e.target.value ? Number(e.target.value) : null)}
                    disabled={loading}
                  >
                    <option value="">Select Outlet</option>
                    {outlets.map((outlet) => (
                      <option key={outlet.outletid} value={outlet.outletid}>
                        {outlet.outlet_name} ({outlet.outlet_code})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    name="isapplicablealloutlet"
                    label="Applicable to All Outlets"
                    checked={formData.isapplicablealloutlet}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tax Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="resttax_name"
                    value={formData.resttax_name}
                    onChange={handleInputChange}
                    placeholder="Enter tax name"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tax Value (%) <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="number"
                    name="resttax_value"
                    value={formData.resttax_value}
                    onChange={handleInputChange}
                    placeholder="Enter tax value"
                    step="0.01"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>CGST (%)</Form.Label>
                  <Form.Control
                    type="number"
                    name="restcgst"
                    value={formData.restcgst}
                    onChange={handleInputChange}
                    placeholder="Enter CGST"
                    step="0.01"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>SGST (%)</Form.Label>
                  <Form.Control
                    type="number"
                    name="restsgst"
                    value={formData.restsgst}
                    onChange={handleInputChange}
                    placeholder="Enter SGST"
                    step="0.01"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>IGST (%)</Form.Label>
                  <Form.Control
                    type="number"
                    name="restigst"
                    value={formData.restigst}
                    onChange={handleInputChange}
                    placeholder="Enter IGST"
                    step="0.01"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tax Group <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="taxgroupid"
                    value={formData.taxgroupid}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Tax Group</option>
                    {taxGroups.map((group) => (
                      <option key={group.taxgroupid} value={group.taxgroupid}>
                        {group.taxgroup_name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
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

export default RestTaxMaster;