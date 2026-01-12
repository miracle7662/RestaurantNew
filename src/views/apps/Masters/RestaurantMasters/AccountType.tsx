import React, { useState, useEffect } from 'react';
import { Button, Card, Table, Modal, Form, Alert } from 'react-bootstrap';
import { toast } from 'react-hot-toast';
import { useAuthContext } from '@/common/context/useAuthContext';

// Interfaces
interface AccountTypeItem {
  AccID: number;
  AccName: string;
  UnderID: number | null;
  NatureOfC: number | null;
  status: number;
  hotelid: number;
  countryid: number;
  created_by_id: string;
  created_date: string;
  updated_by_id?: string;
  updated_date?: string;
}

interface AccountNatureItem {
  nature_id: number;
  accountnature: string;
  hotelid: number;
}

interface AccountTypeModalProps {
  show: boolean;
  onHide: () => void;
  accountType?: AccountTypeItem | null;
  onSuccess: () => void;
  accountNatures: AccountNatureItem[];
  accountTypes: AccountTypeItem[];
}

// Main Component
const AccountType: React.FC = () => {
  const { user } = useAuthContext();
  const session = {
    userId: user?.id,
    hotelid: user?.hotelid,
    token: user?.token,
  };
  const [accountTypes, setAccountTypes] = useState<AccountTypeItem[]>([]);
  const [accountNatures, setAccountNatures] = useState<AccountNatureItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAccountType, setSelectedAccountType] = useState<AccountTypeItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState<keyof AccountTypeItem>('AccName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Check if required session data is available
  const isDisabled = !user?.hotelid;

  // Fetch account types
  const fetchAccountTypes = async () => {
    if (isDisabled) return;

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`http://localhost:3001/api/accounttype`, {
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Failed to fetch account types' }));
        throw new Error(errorData.message || 'Failed to fetch account types');
      }

      const data = await res.json();
      setAccountTypes(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch account types';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Fetch account natures
  const fetchAccountNatures = async () => {
    if (isDisabled) return;

    try {
      const res = await fetch(`http://localhost:3001/api/accountnature`, {
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch account natures');
      }

      const data = await res.json();
      setAccountNatures(data);
    } catch (err) {
      console.error('Failed to fetch account natures:', err);
    }
  };

  useEffect(() => {
    if (!isDisabled) {
      fetchAccountTypes();
      fetchAccountNatures();
    }
  }, [session.hotelid]);

  // Log session values when they change
  useEffect(() => {
    if (session.userId) {
      console.log(`User ID received: ${session.userId}`);
    } else {
      console.warn('Warning: User ID is missing');
    }

    if (session.hotelid) {
      console.log(`Hotel ID received: ${session.hotelid}`);
    } else {
      console.warn('Warning: Hotel ID is missing');
    }
  }, [session.userId, session.hotelid]);

  // Handle delete
  const handleDelete = async (accountType: AccountTypeItem) => {
    if (!window.confirm('Are you sure you want to delete this account type?')) return;

    try {
      const res = await fetch(`http://localhost:3001/api/accounttype/${accountType.AccID}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Failed to delete account type' }));
        throw new Error(errorData.message || 'Failed to delete account type');
      }

      toast.success('Account type deleted successfully');
      fetchAccountTypes();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete account type';
      toast.error(errorMessage);
    }
  };

  // Handle edit
  const handleEdit = (accountType: AccountTypeItem) => {
    setSelectedAccountType(accountType);
    setShowEditModal(true);
  };

  // Filter and sort account types
  const filteredAccountTypes = accountTypes.filter(accountType =>
    accountType.AccName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (accountType.UnderID !== null && accountType.UnderID.toString().includes(searchTerm.toLowerCase())) ||
    (accountType.NatureOfC !== null && accountType.NatureOfC.toString().includes(searchTerm.toLowerCase())) ||
    accountType.status.toString().includes(searchTerm.toLowerCase())
  );

  const sortedAccountTypes = [...filteredAccountTypes].sort((a, b) => {
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
  const totalPages = Math.ceil(sortedAccountTypes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAccountTypes = sortedAccountTypes.slice(startIndex, startIndex + itemsPerPage);

  // Handle sort
  const handleSort = (field: keyof AccountTypeItem) => {
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
          <p>Please select a company and year to access the Account Type management page.</p>
        </Alert>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Account Types</h5>
          <Button variant="primary" onClick={() => setShowAddModal(true)}>
            Add Account Type
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
                    placeholder="Search by name, under ID, nature, or status..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="me-2"
                    style={{ width: '300px' }}
                  />
                </div>
              </div>

              <Table striped bordered hover responsive>
                <thead className="table-light">
                  <tr>
                    <th onClick={() => handleSort('AccID')} style={{ cursor: 'pointer' }}>
                      ID {sortField === 'AccID' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('AccName')} style={{ cursor: 'pointer' }}>
                      Name {sortField === 'AccName' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('UnderID')} style={{ cursor: 'pointer' }}>
                      Under ID {sortField === 'UnderID' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('NatureOfC')} style={{ cursor: 'pointer' }}>
                      Nature Of C {sortField === 'NatureOfC' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>
                      Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedAccountTypes.map((accountType) => (
                    <tr key={accountType.AccID}>
                      <td>{accountType.AccID}</td>
                      <td>{accountType.AccName}</td>
                      <td>
                        {accountType.UnderID !== null
                          ? accountTypes.find(a => a.AccID === accountType.UnderID)?.AccName || '-'
                          : '-'}
                      </td>
                      <td>
                        {accountType.NatureOfC !== null
                          ? accountNatures.find(n => n.nature_id === accountType.NatureOfC)?.accountnature || '-'
                          : '-'}
                      </td>
                      <td>
                        <span className={`badge ${accountType.status === 1 ? 'bg-success' : 'bg-danger'}`}>
                          {accountType.status === 1 ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2"
                          onClick={() => handleEdit(accountType)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(accountType)}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {paginatedAccountTypes.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center">
                        {searchTerm ? 'No account types match your search' : 'No account types found'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>

              {/* Pagination */}
              {sortedAccountTypes.length > 0 && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div className="text-muted">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, sortedAccountTypes.length)} of {sortedAccountTypes.length} entries
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

      <AccountTypeModal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        onSuccess={fetchAccountTypes}
        accountNatures={accountNatures}
        accountTypes={accountTypes}
      />
      <AccountTypeModal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        accountType={selectedAccountType}
        onSuccess={fetchAccountTypes}
        accountNatures={accountNatures}
        accountTypes={accountTypes}
      />
    </>
  );
};

// Modal Component for Add/Edit
const AccountTypeModal: React.FC<AccountTypeModalProps> = ({
  show,
  onHide,
  accountType,
  onSuccess,
  accountNatures,
  accountTypes,
}) => {
  const { user } = useAuthContext();
  const session = {
    userId: user?.id,
    hotelid: user?.hotelid,
    token: user?.token,
  };
  const [formData, setFormData] = useState({
    AccName: '',
    UnderID: null as number | null,
    NatureOfC: null as number | null,
    status: 1,
    countryid: 1,
  });
  const [loading, setLoading] = useState(false);

  const isEdit = !!accountType;

  useEffect(() => {
    if (accountType) {
      setFormData({
        AccName: accountType.AccName,
        UnderID: accountType.UnderID,
        NatureOfC: accountType.NatureOfC,
        status: accountType.status,
        countryid: accountType.countryid,
      });
    } else {
      setFormData({
        AccName: '',
        UnderID: accountTypes.length > 0 ? accountTypes[0].AccID : null,
        NatureOfC: null,
        status: 1,
        countryid: 1,
      });
    }
  }, [accountType, accountTypes]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['status', 'UnderID', 'NatureOfC'].includes(name)
        ? value === '' ? null : Number(value)
        : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        hotelid: session.hotelid,
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

      const url = isEdit
        ? `http://localhost:3001/api/accounttype/${accountType!.AccID}`
        : `http://localhost:3001/api/accounttype`;

      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Failed to save account type' }));
        throw new Error(errorData.message || 'Failed to save account type');
      }

      toast.success(`Account type ${isEdit ? 'updated' : 'created'} successfully`);
      onSuccess();
      onHide();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save account type';
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
          <Modal.Title>{isEdit ? 'Edit Account Type' : 'Add Account Type'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group controlId="AccName" className="mb-3">
            <Form.Label>Account Name</Form.Label>
            <Form.Control
              type="text"
              name="AccName"
              value={formData.AccName}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </Form.Group>

          <Form.Group controlId="UnderID" className="mb-3">
            <Form.Label>Under ID</Form.Label>
            <Form.Select
              name="UnderID"
              value={formData.UnderID === null ? '' : formData.UnderID}
              onChange={handleChange}
              disabled={loading}
            >
              {accountTypes.length === 0 && <option value="">No Account Types</option>}
              {accountTypes.map(acc => (
                <option key={acc.AccID} value={acc.AccID}>
                  {acc.AccName}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group controlId="NatureOfC" className="mb-3">
            <Form.Label>Nature Of C</Form.Label>
            <Form.Select
              name="NatureOfC"
              value={formData.NatureOfC === null ? '' : formData.NatureOfC}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="">Select Account Nature</option>
              {accountNatures.map(nature => (
                <option key={nature.nature_id} value={nature.nature_id}>
                  {nature.accountnature}
                </option>
              ))}
            </Form.Select>
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
            {loading ? 'Saving...' : (isEdit ? 'Save Changes' : 'Add Account Type')}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default AccountType;