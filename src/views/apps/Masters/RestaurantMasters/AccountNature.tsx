import React, { useState, useEffect } from 'react';
import { Button, Card, Table, Modal, Form, Alert } from 'react-bootstrap';
import { toast } from 'react-hot-toast';
import { useAppContext } from '@/common/context/AppContext';

// Interfaces
interface AccountNatureItem {
  nature_id: number;
  accountnature: string;
  status: number;
  companyid: number;
  yearid: number;
  countryid: number;
  created_by_id: string;
  created_date: string;
  updated_by_id?: string;
  updated_date?: string;
}

interface AccountNatureModalProps {
  show: boolean;
  onHide: () => void;
  accountNature?: AccountNatureItem | null;
  onSuccess: () => void;
}

// Main Component
const AccountNature: React.FC = () => {
  const { session } = useAppContext();
  const [accountNatures, setAccountNatures] = useState<AccountNatureItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAccountNature, setSelectedAccountNature] = useState<AccountNatureItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState<keyof AccountNatureItem>('accountnature');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Check if required session data is available
  const isDisabled = !session.companyId || !session.yearId;

  // Fetch account natures
  const fetchAccountNatures = async () => {
    if (isDisabled) return;

    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        companyId: session.companyId!.toString(),
        yearId: session.yearId!.toString(),
      });
      const res = await fetch(`http://localhost:3001/api/accountnature?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Failed to fetch account natures' }));
        throw new Error(errorData.message || 'Failed to fetch account natures');
      }

      const data = await res.json();
      setAccountNatures(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch account natures';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isDisabled) {
      fetchAccountNatures();
    }
  }, [session.companyId, session.yearId]);

  // Log session values when they change
  useEffect(() => {
    if (session.userId) {
      console.log(`User ID received: ${session.userId}`);
    } else {
      console.warn('Warning: User ID is missing');
    }

    if (session.companyId) {
      console.log(`Company ID received: ${session.companyId}`);
    } else {
      console.warn('Warning: Company ID is missing');
    }

    if (session.yearId) {
      console.log(`Year ID received: ${session.yearId}`);
    } else {
      console.warn('Warning: Year ID is missing');
    }
  }, [session.userId, session.companyId, session.yearId]);

  // Handle delete
  const handleDelete = async (accountNature: AccountNatureItem) => {
    if (!window.confirm('Are you sure you want to delete this account nature?')) return;

    try {
      const params = new URLSearchParams({
        companyId: session.companyId!.toString(),
        yearId: session.yearId!.toString(),
      });
      const res = await fetch(`http://localhost:3001/api/accountnature/${accountNature.nature_id}?${params.toString()}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Failed to delete account nature' }));
        throw new Error(errorData.message || 'Failed to delete account nature');
      }

      toast.success('Account nature deleted successfully');
      fetchAccountNatures();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete account nature';
      toast.error(errorMessage);
    }
  };

  // Handle edit
  const handleEdit = (accountNature: AccountNatureItem) => {
    setSelectedAccountNature(accountNature);
    setShowEditModal(true);
  };

  // Filter and sort account natures
  const filteredAccountNatures = accountNatures.filter(accountNature =>
    accountNature.accountnature.toLowerCase().includes(searchTerm.toLowerCase()) ||
    accountNature.nature_id.toString().includes(searchTerm.toLowerCase()) ||
    accountNature.status.toString().includes(searchTerm.toLowerCase())
  );

  const sortedAccountNatures = [...filteredAccountNatures].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      const comparison = aValue.localeCompare(bValue);
      return sortDirection === 'asc' ? comparison : -comparison;
    }

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }

    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedAccountNatures.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAccountNatures = sortedAccountNatures.slice(startIndex, startIndex + itemsPerPage);

  // Handle sort
  const handleSort = (field: keyof AccountNatureItem) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Handle items per page change
  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  if (isDisabled) {
    return (
      <Card className="p-4">
        <Alert variant="warning">
          <h5>Access Restricted</h5>
          <p>Please select a company and year to access the Account Nature management page.</p>
        </Alert>
      </Card>
    );
  }



  return (
    <>
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Account Natures</h5>
          <Button variant="primary" onClick={() => setShowAddModal(true)}>
            Add Account Nature
          </Button>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {loading ? (
            <div className="text-center">Loading...</div>
          ) : (
            <>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center">
                  <Form.Select
                    value={itemsPerPage}
                    onChange={handleItemsPerPageChange}
                    className="me-2"
                    style={{ width: '100px' }}
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </Form.Select>
                  <span className="text-muted">per page</span>
                </div>
                <div className="d-flex align-items-center">
                  <Form.Control
                    type="text"
                    placeholder="Search by name, ID, or status..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="me-2"
                    style={{ width: '300px' }}
                  />
                </div>
              </div>

              <Table striped bordered hover responsive>
                <thead className='table-light'>
                  <tr>
                    <th onClick={() => handleSort('nature_id')} style={{ cursor: 'pointer' }}>
                      ID {sortField === 'nature_id' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('accountnature')} style={{ cursor: 'pointer' }}>
                      Name {sortField === 'accountnature' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>
                      Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedAccountNatures.map((accountNature) => (
                    <tr key={accountNature.nature_id}>
                      <td>{accountNature.nature_id}</td>
                      <td>{accountNature.accountnature}</td>
                      <td>
                        <span className={`badge ${accountNature.status === 1 ? 'bg-success' : 'bg-danger'}`}>
                          {accountNature.status === 1 ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2"
                          onClick={() => handleEdit(accountNature)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(accountNature)}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {paginatedAccountNatures.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center">
                        {searchTerm ? 'No account natures match your search' : 'No account natures found'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>

              {/* Pagination */}
              {sortedAccountNatures.length > 0 && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div className="text-muted">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, sortedAccountNatures.length)} of {sortedAccountNatures.length} entries
                  </div>
                  <div>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                      className="me-2"
                    >
                      Previous
                    </Button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                      return (
                        <Button
                          key={pageNum}
                          variant={pageNum === currentPage ? 'primary' : 'outline-secondary'}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className="me-1"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>

      <AccountNatureModal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        onSuccess={fetchAccountNatures}
      />
      <AccountNatureModal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        accountNature={selectedAccountNature}
        onSuccess={fetchAccountNatures}
      />
    </>
  );
};

// Modal Component for Add/Edit
const AccountNatureModal: React.FC<AccountNatureModalProps> = ({
  show,
  onHide,
  accountNature,
  onSuccess,
}) => {
  const { session } = useAppContext();
  const [formData, setFormData] = useState({
    accountnature: '',
    status: 1,
    countryid: 1,
  });
  const [loading, setLoading] = useState(false);

  const isEdit = !!accountNature;

  useEffect(() => {
    if (accountNature) {
      setFormData({
        accountnature: accountNature.accountnature,
        status: accountNature.status,
        countryid: accountNature.countryid,
      });
    } else {
      setFormData({
        accountnature: '',
        status: 1,
        countryid: 1,
      });
    }
  }, [accountNature]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['status'].includes(name)
        ? value === '' ? 1 : Number(value)
        : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        companyid: session.companyId,
        yearid: session.yearId,
        ...(isEdit
          ? {
              updated_by_id: session.userId,
              updated_date: new Date().toISOString(),
            }
          : {
              created_by_id: session.userId,
              created_date: new Date().toISOString(),
            }),
      };

      const params = new URLSearchParams({
        companyId: session.companyId!.toString(),
        yearId: session.yearId!.toString(),
      });

      const url = isEdit
        ? `http://localhost:3001/api/accountnature/${accountNature!.nature_id}?${params.toString()}`
        : `http://localhost:3001/api/accountnature?${params.toString()}`;

      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Failed to save account nature' }));
        throw new Error(errorData.message || 'Failed to save account nature');
      }

      toast.success(`Account nature ${isEdit ? 'updated' : 'created'} successfully`);
      onSuccess();
      onHide();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save account nature';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onHide();
    }
  };

  return (
    <Modal show={show} onHide={handleClose} backdrop="static" keyboard={!loading}>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton={!loading}>
          <Modal.Title>{isEdit ? 'Edit Account Nature' : 'Add Account Nature'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group controlId="accountnature" className="mb-3">
            <Form.Label>Account Nature</Form.Label>
            <Form.Control
              type="text"
              name="accountnature"
              value={formData.accountnature}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </Form.Group>

          <Form.Group controlId="status" className="mb-3">
            <Form.Label>Status</Form.Label>
            <Form.Select
              name="status"
              value={formData.status}
              onChange={handleChange}
              disabled={loading}
            >
              <option value={1}>Active</option>
              <option value={0}>Inactive</option>
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Saving...' : (isEdit ? 'Save Changes' : 'Add Account Nature')}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default AccountNature;