import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import Swal from 'sweetalert2';
import TitleHelmet from '@/components/Common/TitleHelmet';
import subscriptionPlanApi from '@/common/hotel/subscriptionPlans';
import { Badge, Button, Card, Form, Table } from 'react-bootstrap';
import FormModal from '@/components/Common/models/FormModal';
import SubscriptionPlanForm from './PackageForm';

type SubscriptionPlan = {
  plan_id: number;
  plan_name: string;
  plan_duration_months: number;
  plan_amount: number;
  max_hotels: number;
  max_users: number;
  is_active: number;
};

type SubscriptionPlanFormData = {
  plan_name: string;
  plan_duration_months: number;
  plan_amount: number;
  max_hotels: number;
  max_users: number;
  is_active: number;
};

const defaultForm: SubscriptionPlanFormData = {
  plan_name: '',
  plan_duration_months: 1,
  plan_amount: 0,
  max_hotels: 1,
  max_users: 5,
  is_active: 1,
};

const SubscriptionPlanMaster = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [form, setForm] = useState<SubscriptionPlanFormData>(defaultForm);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const loadPlans = async () => {
    setLoading(true);
    try {
      const response = await subscriptionPlanApi.list();

      if (response.success) {
        setPlans(
          Array.isArray(response.data)
            ? response.data.map((plan) => ({
                ...plan,
                plan_amount: Number(plan.plan_amount) || 0
              }))
            : []
        );
      } else {
        toast.error(response.message || 'Failed to load subscription plans');
        setPlans([]);
      }
    } catch (error: any) {
      console.error('Failed to load subscription plans:', error);
      toast.error(error.message || 'Failed to load subscription plans');
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const filteredPlans = useMemo(() => {
    let result = plans;

    const query = search.trim().toLowerCase();
    if (query) {
      result = result.filter((plan) =>
        [plan.plan_name, String(plan.plan_amount), String(plan.plan_duration_months)].some((value) =>
          value.toLowerCase().includes(query)
        )
      );
    }

    if (sortField) {
      result = [...result].sort((a, b) => {
        const aValue = a[sortField as keyof SubscriptionPlan] ?? '';
        const bValue = b[sortField as keyof SubscriptionPlan] ?? '';
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [plans, search, sortField, sortDirection]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredPlans.length / pageSize)),
    [filteredPlans.length, pageSize]
  );

  const paginatedPlans = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredPlans.slice(startIndex, startIndex + pageSize);
  }, [filteredPlans, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleOpenAddModal = () => {
    setEditingPlan(null);
    setForm(defaultForm);
    setShowModal(true);
  };

  const handleOpenEditModal = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setForm({
      plan_name: plan.plan_name,
      plan_duration_months: plan.plan_duration_months,
      plan_amount: plan.plan_amount,
      max_hotels: plan.max_hotels,
      max_users: plan.max_users,
      is_active: plan.is_active,
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    if (saving) return;
    setShowModal(false);
    setEditingPlan(null);
  };

  const handleSubmit = async (payload: any) => {
    if (!payload.plan_name || !payload.plan_duration_months || !payload.plan_amount) {
      toast.error('Please fill all required fields');
      return;
    }

    setSaving(true);

    try {
      if (editingPlan) {
        const response = await subscriptionPlanApi.update(editingPlan.plan_id, payload);

        if (response.success && response.data) {
          const updated = response.data;
          setPlans((prev) =>
            prev.map((item) => (item.plan_id === updated.plan_id ? updated : item))
          );
          toast.success('Subscription plan updated');
        } else {
          toast.error(response.message || 'Update failed');
        }
      } else {
        const response = await subscriptionPlanApi.create(payload);

        if (response.success && response.data) {
          const created = response.data;
          setPlans((prev) => [created, ...prev]);
          toast.success('Subscription plan added');
        } else {
          toast.error(response.message || 'Create failed');
        }
      }

      setShowModal(false);
      setEditingPlan(null);
      setForm(defaultForm);
    } catch (error) {
      console.error('Failed to save subscription plan:', error);
      toast.error('Failed to save subscription plan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (plan: SubscriptionPlan) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `You will not be able to recover plan "${plan.plan_name}"!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3E97FF',
      confirmButtonText: 'Yes, delete it!',
    });

    if (result.isConfirmed) {
      setDeletingId(plan.plan_id);
      try {
        await subscriptionPlanApi.remove(plan.plan_id);
        setPlans((prev) => prev.filter((item) => item.plan_id !== plan.plan_id));
        toast.success('Subscription plan deleted successfully');
      } catch (error) {
        console.error('Failed to delete subscription plan:', error);
        toast.error(typeof error === 'string' ? error : 'Failed to delete subscription plan');
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <>
      <TitleHelmet title="Subscription Plan Master" />

      <Card className="mb-3">
        <Card.Body className="d-flex justify-content-between align-items-center">
          <div>
            <h4 className="mb-1">Subscription Plan Master</h4>
            <p className="text-muted mb-0">Manage subscription plans and their details.</p>
          </div>
          <Button variant="danger" onClick={handleOpenAddModal}>
            <span className="me-1">+</span> Add Plan
          </Button>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Form.Control
              type="text"
              placeholder="Search plans..."
              style={{ maxWidth: 280 }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Table hover responsive className="mb-0">
            <thead className="table-light">
              <tr>
                <th style={{ width: '60px' }}>#</th>
                <th
                  onClick={() => handleSort('plan_name')}
                  style={{ cursor: 'pointer' }}
                  className="sortable-header"
                >
                  Plan Name
                  {sortField === 'plan_name' && (
                    <span className="ms-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th
                  onClick={() => handleSort('plan_duration_months')}
                  style={{ cursor: 'pointer' }}
                  className="sortable-header"
                >
                  Duration (months)
                  {sortField === 'plan_duration_months' && (
                    <span className="ms-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th
                  onClick={() => handleSort('plan_amount')}
                  style={{ cursor: 'pointer' }}
                  className="sortable-header"
                >
                  Amount
                  {sortField === 'plan_amount' && (
                    <span className="ms-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th>Max Hotels</th>
                <th>Max Users</th>
                <th style={{ width: '120px' }}>Status</th>
                <th style={{ width: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center text-muted py-4">
                    Loading subscription plans...
                  </td>
                </tr>
              ) : filteredPlans.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-muted py-4">
                    No subscription plans found.
                  </td>
                </tr>
              ) : (
                paginatedPlans.map((plan, index) => (
                  <tr key={plan.plan_id}>
                    <td>{(currentPage - 1) * pageSize + index + 1}</td>
                    <td className="fw-semibold">{plan.plan_name}</td>
                    <td>{plan.plan_duration_months}</td>
                    <td>₹{Number(plan.plan_amount || 0).toFixed(2)}</td>
                    <td>{plan.max_hotels}</td>
                    <td>{plan.max_users}</td>
                    <td>
                      <Badge bg={plan.is_active === 1 ? 'success' : 'secondary'}>
                        {plan.is_active === 1 ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleOpenEditModal(plan)}
                        >
                          <i className="fi fi-rr-edit" />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(plan)}
                          disabled={deletingId === plan.plan_id}
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

          {filteredPlans.length > 0 && (
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
        title={editingPlan ? 'Edit Subscription Plan' : 'Add Subscription Plan'}
        onSave={handleSubmit}
        saving={saving}
        submitLabel={editingPlan ? 'Update' : 'Save'}
        Component={SubscriptionPlanForm}
        selectedItem={form}
      />
    </>
  );
};

export default SubscriptionPlanMaster;