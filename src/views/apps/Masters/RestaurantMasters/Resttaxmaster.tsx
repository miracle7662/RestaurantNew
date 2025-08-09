import React, { useState, useEffect } from 'react';
import { Card, Col, Row, Button, Form, Table, Modal, Alert } from 'react-bootstrap';
import axios from 'axios';
import { useAuthContext } from '@/common/context/useAuthContext';
import { fetchBrands } from '@/utils/commonfunction';
import { OutletData } from '@/common/api/outlet';
import { fetchOutletsForDropdown } from '@/utils/commonfunction';



interface RestTaxMaster {
  resttaxid: number;
  hotelid: number;
  hotel_name: string;
  outletid: number | null;
  isapplicablealloutlet: number; // Changed to number to match SQLite (0 or 1)
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
  username?: string; // Optional, if you want to show created by user name
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
  const [brands, setBrands] = useState<Brand[]>([]);
  const [taxGroups, setTaxGroups] = useState<TaxGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [outlets, setOutlets] = useState<OutletData[]>([]);
    const [selectedOutlet, setSelectedOutlet] = useState<number | null>(null);
  
  
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
      // Fetch rest taxes
      const restTaxesRes = await axios.get('/api/resttaxmaster');
      console.log('Fetched rest taxes:', restTaxesRes.data); // Debug log
      setRestTaxes(Array.isArray(restTaxesRes.data) ? restTaxesRes.data : []);

      // Fetch brands
      await fetchBrands(user, setBrands);
      console.log('Fetched brands:', brands); // Debug log

      // Fetch tax groups
      const taxGroupsRes = await axios.get('/api/taxgroup');
      console.log('Fetched tax groups:', taxGroupsRes.data); // Debug log
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

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
  const { name, value, type, checked } = e.target as HTMLInputElement;
  setFormData((prev) => ({
    ...prev,
    [name]: type === 'checkbox' ? checked : value,
  }));
};

  // Reset form to initial state
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

  // Handle form submission for create/update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate required fields
    if (!formData.resttax_name || !formData.hotelid || !formData.taxgroupid || !formData.status) {
      setError('Please fill all required fields (Tax Name, Hotel, Tax Group, Status)');
      return;
    }

    // Validate numeric fields
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

    if (statusNum !== 0 && statusNum !== 1) {
      setError('Please select a valid status');
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
      console.log('Submitting payload:', payload); // Debug log
      let response;
      if (editingId) {
        response = await axios.put(`/api/resttaxmaster/${editingId}`, payload);
        setSuccess('Rest tax updated successfully');
      } else {
        response = await axios.post('/api/resttaxmaster', payload);
        setSuccess('Rest tax created successfully');
      }
      console.log('Server response:', response.data); // Debug log
      setShowModal(false);
      resetForm();
      await fetchData(); // Refresh data after save
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Operation failed';
      setError(errorMessage);
      console.error('Submit error:', err);
    }
  };

  // Handle edit button click
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

  // Handle delete button click
  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this rest tax?')) {
      try {
        const response = await axios.delete(`/api/resttaxmaster/${id}`);
        console.log('Delete response:', response.data); // Debug log
        setSuccess('Rest tax deleted successfully');
        await fetchData();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete rest tax');
        console.error('Delete error:', err);
      }
    }
  };

  // Status badge for table
  const getStatusBadge = (status: number) => {
    return status === 1 ? (
      <span className="badge bg-success">Active</span>
    ) : (
      <span className="badge bg-danger">Inactive</span>
    );
  };

  return (
    <div className="container-fluid">
      <Row>
        <Col>
          <h2 className="page-title">Rest Tax Master Management</h2>
        </Col>
      </Row>

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
            <Card.Header className="d-flex justify-content-between align-items-center">
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
              {loading ? (
                <div className="text-center">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <Table responsive hover>
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
                    {restTaxes.length > 0 ? (
                      restTaxes.map((tax) => (
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
                          No rest taxes found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
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