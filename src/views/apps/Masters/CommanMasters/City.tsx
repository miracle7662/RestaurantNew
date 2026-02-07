import React, { useState, useEffect, useMemo } from 'react';
import { Card, Table, Badge, Button, Form, Pagination, Modal } from 'react-bootstrap';
import Swal from 'sweetalert2';
import { toast } from 'react-hot-toast';
import cityApi from '../../../../common/api/cities';

type City = {
  id: number;
  name: string;
  code: string;
  capital: string | null;
  state: string;
  country: string;
  status: 'Active' | 'Inactive';
};

type CityFormData = {
  name: string;
  code: string;
  capital: string;
  state: string;
  country: string;
  status: 'Active' | 'Inactive';
};

const City: React.FC = () => {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [editingCity, setEditingCity] = useState<City | null>(null);

  const fetchCities = async () => {
    setLoading(true);
    try {
      const response = await cityApi.list();
      const data: City[] = response.data.map((item: any) => ({
        id: item.cityid,
        name: item.city_name,
        code: item.city_code,
        capital: item.capital || null,
        state: item.state_name || '',
        country: item.country_name || '',
        status: item.status === 0 ? 'Active' : 'Inactive',
      }));
      setCities(data);
    } catch (error) {
      toast.error('Failed to fetch cities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCities();
  }, []);

  const filteredCities = useMemo(() => {
    return cities.filter(city =>
      city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      city.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (city.capital && city.capital.toLowerCase().includes(searchTerm.toLowerCase())) ||
      city.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
      city.country.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [cities, searchTerm]);

  const paginatedCities = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCities.slice(start, start + pageSize);
  }, [filteredCities, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredCities.length / pageSize);

  const handleAdd = () => {
    setEditingCity(null);
    setShowModal(true);
  };

  const handleEdit = (city: City) => {
    setEditingCity(city);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to recover this city!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
    });

    if (result.isConfirmed) {
      const originalCities = [...cities];
      setCities(cities.filter(c => c.id !== id));
      try {
        await cityApi.remove(id);
        toast.success('City deleted successfully');
      } catch (error) {
        setCities(originalCities);
        toast.error('Failed to delete city');
      }
    }
  };

  const handleSave = async (formData: CityFormData) => {
    const payload = {
      city_name: formData.name,
      city_code: formData.code,
      capital: formData.capital,
      state: formData.state,
      country: formData.country,
      status: formData.status === 'Active' ? 0 : 1,
      iscoastal: 0,
      created_by_id: 1,
      created_date: new Date().toISOString(),
      updated_by_id: 1,
      updated_date: new Date().toISOString(),
    };

    if (editingCity) {
      const originalCities = [...cities];
      const updatedCities = cities.map(c => c.id === editingCity.id ? { ...c, ...formData } : c);
      setCities(updatedCities);
      try {
        await cityApi.update(editingCity.id, payload);
        toast.success('City updated successfully');
        setShowModal(false);
      } catch (error) {
        setCities(originalCities);
        toast.error('Failed to update city');
      }
    } else {
      const newCity: City = {
        id: Date.now(), // Temporary ID
        ...formData,
      };
      setCities([newCity, ...cities]);
      try {
        const response = await cityApi.create(payload);
        const createdCity: City = {
          id: response.data.cityid,
          ...formData,
        };
        setCities(cities => cities.map(c => c.id === newCity.id ? createdCity : c));
        toast.success('City added successfully');
        setShowModal(false);
      } catch (error) {
        setCities(cities.filter(c => c.id !== newCity.id));
        toast.error('Failed to add city');
      }
    }
  };

  return (
    <div>
      <Card>
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h4>City Master</h4>
              <p className="mb-0">Manage cities in the system</p>
            </div>
            <Button variant="primary" onClick={handleAdd}>
              Add City
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          <Form.Group className="mb-3">
            <Form.Control
              type="text"
              placeholder="Search cities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Form.Group>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <>
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>City</th>
                    <th>Code</th>
                    <th>Capital</th>
                    <th>State</th>
                    <th>Country</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCities.map((city) => (
                    <tr key={city.id}>
                      <td>{city.name}</td>
                      <td>
                        <Badge bg="secondary">{city.code}</Badge>
                      </td>
                      <td>{city.capital || '-'}</td>
                      <td>{city.state}</td>
                      <td>{city.country}</td>
                      <td>
                        <Badge bg={city.status === 'Active' ? 'success' : 'danger'}>
                          {city.status}
                        </Badge>
                      </td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleEdit(city)}
                          className="me-2"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(city.id)}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <div className="d-flex justify-content-between align-items-center mt-3">
                <Form.Select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  style={{ width: 'auto' }}
                >
                  <option value={10}>10 per page</option>
                  <option value={20}>20 per page</option>
                  <option value={50}>50 per page</option>
                </Form.Select>
                <Pagination>
                  <Pagination.Prev
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  />
                  {Array.from({ length: totalPages }, (_, i) => (
                    <Pagination.Item
                      key={i + 1}
                      active={i + 1 === currentPage}
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </Pagination.Item>
                  ))}
                  <Pagination.Next
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  />
                </Pagination>
              </div>
            </>
          )}
        </Card.Body>
      </Card>
      <FormModal
        show={showModal}
        onHide={() => setShowModal(false)}
        title={editingCity ? 'Edit City' : 'Add City'}
      >
        <CityForm
          initialData={editingCity ? {
            name: editingCity.name,
            code: editingCity.code,
            capital: editingCity.capital || '',
            state: editingCity.state,
            country: editingCity.country,
            status: editingCity.status,
          } : undefined}
          onSave={handleSave}
          onCancel={() => setShowModal(false)}
        />
      </FormModal>
    </div>
  );
};

interface FormModalProps {
  show: boolean;
  onHide: () => void;
  title: string;
  children: React.ReactNode;
}

const FormModal: React.FC<FormModalProps> = ({ show, onHide, title, children }) => (
  <Modal show={show} onHide={onHide}>
    <Modal.Header closeButton>
      <Modal.Title>{title}</Modal.Title>
    </Modal.Header>
    <Modal.Body>{children}</Modal.Body>
  </Modal>
);

interface CityFormProps {
  initialData?: CityFormData;
  onSave: (data: CityFormData) => void;
  onCancel: () => void;
}

const CityForm: React.FC<CityFormProps> = ({ initialData, onSave, onCancel }) => {
  const [formData, setFormData] = useState<CityFormData>(
    initialData || {
      name: '',
      code: '',
      capital: '',
      state: '',
      country: '',
      status: 'Active',
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group className="mb-3">
        <Form.Label>Name</Form.Label>
        <Form.Control
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Code</Form.Label>
        <Form.Control
          type="text"
          value={formData.code}
          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
          required
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Capital</Form.Label>
        <Form.Control
          type="text"
          value={formData.capital}
          onChange={(e) => setFormData({ ...formData, capital: e.target.value })}
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>State</Form.Label>
        <Form.Control
          type="text"
          value={formData.state}
          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
          required
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Country</Form.Label>
        <Form.Control
          type="text"
          value={formData.country}
          onChange={(e) => setFormData({ ...formData, country: e.target.value })}
          required
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Status</Form.Label>
        <Form.Select
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Active' | 'Inactive' })}
        >
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </Form.Select>
      </Form.Group>
      <div className="d-flex justify-content-end">
        <Button variant="secondary" onClick={onCancel} className="me-2">
          Cancel
        </Button>
        <Button variant="primary" type="submit">
          Save
        </Button>
      </div>
    </Form>
  );
};

export default City;
