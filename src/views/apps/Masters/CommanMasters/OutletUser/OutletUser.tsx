import React, { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Col,
  Row,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  Label,
  Input,
  Table,
  Badge,
  Spinner,
  ButtonGroup
} from 'reactstrap';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaEdit, FaTrash, FaPlus, FaEye, FaSearch } from 'react-icons/fa';
import { useAuthContext } from '@/common';
import { 
  getOutletUsers, 
  createOutletUser, 
  updateOutletUser, 
  deleteOutletUser, 
  getOutletsForDropdown,
  getHotelAdmins,
  OutletUser as OutletUserType
} from '../../../../../common/api/outletUser';

interface OutletUser {
  userid: number;
  username: string;
  email: string;
  full_name: string;
  phone: string;
  role_level: string;
  status: number;
  hotel_name: string;
  outlet_name: string;
  outletids: number[];
  designation: string;
  user_type: string;
  shift_time: string;
  mac_address: string;
  assign_warehouse: string;
  language_preference: string;
  address: string;
  city: string;
  sub_locality: string;
  web_access: boolean;
  self_order: boolean;
  captain_app: boolean;
  kds_app: boolean;
  captain_old_kot_access: boolean;
  verify_mac_ip: boolean;
  parent_user_id: number;
  created_by_id: number;
  hotelid: number;
  password?: string;
}

interface Outlet {
  outletid: number;
  outlet_name: string;
  outlet_code: string;
  brand_name: string;
}

interface HotelAdmin {
  userid: number;
  username: string;
  full_name: string;
  hotel_name: string;
}

const OutletUser: React.FC = () => {
  const [users, setUsers] = useState<OutletUser[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [hotelAdmins, setHotelAdmins] = useState<HotelAdmin[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedUser, setSelectedUser] = useState<OutletUser | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<OutletUser | null>(null);

  const { user } = useAuthContext();
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<OutletUser>();

  useEffect(() => {
    if (user) {
      fetchUsers();
      fetchOutlets();
      fetchHotelAdmins();
    }
  }, [user]);

  const fetchUsers = async () => {
    setLoading(true);
    console.log('Fetching outlet users...');
    try {
      // Prepare parameters for the API call
      const params: any = {
        currentUserId: user?.userid,
        roleLevel: user?.role_level,
        hotelid: user?.hotelid
      };
      
      console.log('API parameters:', params);
      const response = await getOutletUsers(params);
      console.log('Response from getOutletUsers:', response);
      setUsers(response.data || response);
    } catch (error) {
      toast.error('Failed to fetch users');
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOutlets = async () => {
    try {
      const params: any = {
        currentUserId: user?.userid,
        roleLevel: user?.role_level,
        hotelid: user?.hotelid
      };
      const response = await getOutletsForDropdown(params);
      setOutlets(response.data || response);
    } catch (error) {
      console.error('Error fetching outlets:', error);
    }
  };

  const fetchHotelAdmins = async () => {
    try {
      const params: any = {
        currentUserId: user?.userid,
        roleLevel: user?.role_level,
        hotelid: user?.hotelid
      };
      const response = await getHotelAdmins(params);
      setHotelAdmins(response.data || response);
    } catch (error) {
      console.error('Error fetching hotel admins:', error);
    }
  };

  const handleCreate = () => {
    setModalMode('create');
    setSelectedUser(null);
    reset();
    setModalOpen(true);
  };

  const handleEdit = (user: OutletUser) => {
    setModalMode('edit');
    setSelectedUser(user);
    reset(user);
    setModalOpen(true);
  };

  const handleView = (user: OutletUser) => {
    setModalMode('view');
    setSelectedUser(user);
    setModalOpen(true);
  };

  const handleDelete = (user: OutletUser) => {
    setUserToDelete(user);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    try {
      await deleteOutletUser(userToDelete.userid);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to delete user');
      console.error('Error deleting user:', error);
    } finally {
      setDeleteModalOpen(false);
      setUserToDelete(null);
    }
  };

  const onSubmit = async (data: OutletUser) => {
    try {
      if (modalMode === 'create') {
        await createOutletUser({
          ...data,
          outletids: data.outletids || [],
          role_level: 'outlet_user',
          status: 1,
          hotelid: user?.hotelid
        });
        toast.success('User created successfully');
      } else if (modalMode === 'edit' && selectedUser) {
        await updateOutletUser(selectedUser.userid, {
          ...data,
          outletids: data.outletids || [],
          hotelid: user?.hotelid
        });
        toast.success('User updated successfully');
      }
      setModalOpen(false);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to save user');
      console.error('Error saving user:', error);
    }
  };

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: number) => {
    return status === 1 ? (
      <Badge color="success" className="me-1">Active</Badge>
    ) : (
      <Badge color="danger" className="me-1">Inactive</Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'superadmin':
        return <Badge color="primary">Super Admin</Badge>;
      case 'hotel_admin':
        return <Badge color="info">Hotel Admin</Badge>;
      case 'outlet_user':
        return <Badge color="warning">Outlet User</Badge>;
      default:
        return <Badge color="secondary">{role}</Badge>;
    }
  };

  return (
    <React.Fragment>
      <div className="page-content">
        <div className="container-fluid">
          <Row>
            <Col lg={12}>
              <Card>
                <CardHeader className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Outlet User Management</h5>
                  <div className="d-flex gap-2">
                    <div className="search-box">
                      <Input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="form-control"
                      />
                      <FaSearch className="search-icon" />
                    </div>
                    <Button color="primary" onClick={handleCreate}>
                      <FaPlus className="me-1" /> Add User
                    </Button>
                  </div>
                </CardHeader>
                <CardBody>
                  {loading ? (
                    <div className="text-center">
                      <Spinner color="primary" />
                    </div>
                  ) : (
                    <Table responsive hover className="table-nowrap">
                      <thead className="table-light">
                        <tr>
                          <th>ID</th>
                          <th>Full Name</th>
                          <th>Username</th>
                          <th>Email</th>
                          <th>Phone</th>
                          <th>Hotel</th>
                          <th>Outlets</th>
                          <th>Role</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((user) => (
                          <tr key={user.userid}>
                            <td>{user.userid}</td>
                            <td>{user.full_name}</td>
                            <td>{user.username}</td>
                            <td>{user.email}</td>
                            <td>{user.phone}</td>
                            <td>{user.hotel_name}</td>
                            <td>{user.outlet_name}</td>
                            <td>{getRoleBadge(user.role_level)}</td>
                            <td>{getStatusBadge(user.status)}</td>
                            <td>
                              <ButtonGroup size="sm">
                                <Button
                                  color="info"
                                  onClick={() => handleView(user)}
                                  title="View"
                                >
                                  <FaEye />
                                </Button>
                                <Button
                                  color="warning"
                                  onClick={() => handleEdit(user)}
                                  title="Edit"
                                >
                                  <FaEdit />
                                </Button>
                                <Button
                                  color="danger"
                                  onClick={() => handleDelete(user)}
                                  title="Delete"
                                >
                                  <FaTrash />
                                </Button>
                              </ButtonGroup>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </CardBody>
              </Card>
            </Col>
          </Row>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} toggle={() => setModalOpen(!modalOpen)} size="lg">
        <ModalHeader toggle={() => setModalOpen(!modalOpen)}>
          {modalMode === 'create' ? 'Add Outlet User' : modalMode === 'edit' ? 'Edit Outlet User' : 'View Outlet User'}
        </ModalHeader>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label>Full Name *</Label>
                  <Input
                    type="text"
                    {...register('full_name', { required: 'Full name is required' })}
                    readOnly={modalMode === 'view'}
                  />
                  {errors.full_name && <span className="text-danger">{errors.full_name.message}</span>}
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label>Username *</Label>
                  <Input
                    type="text"
                    {...register('username', { required: 'Username is required' })}
                    readOnly={modalMode === 'view'}
                  />
                  {errors.username && <span className="text-danger">{errors.username.message}</span>}
                </FormGroup>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    {...register('email', { 
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    readOnly={modalMode === 'view'}
                  />
                  {errors.email && <span className="text-danger">{errors.email.message}</span>}
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label>Phone</Label>
                  <Input
                    type="text"
                    {...register('phone')}
                    readOnly={modalMode === 'view'}
                  />
                </FormGroup>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label>Password {modalMode === 'create' && '*'}</Label>
                  <Input
                    type="password"
                    {...register('password', modalMode === 'create' ? { required: 'Password is required' } : {})}
                    readOnly={modalMode === 'view'}
                  />
                  {errors.password && <span className="text-danger">{errors.password.message}</span>}
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label>Designation</Label>
                  <Input
                    type="text"
                    {...register('designation')}
                    readOnly={modalMode === 'view'}
                  />
                </FormGroup>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label>User Type</Label>
                  <Input
                    type="select"
                    {...register('user_type')}
                    readOnly={modalMode === 'view'}
                  >
                    <option value="">Select Type</option>
                    <option value="manager">Manager</option>
                    <option value="cashier">Cashier</option>
                    <option value="waiter">Waiter</option>
                    <option value="captain">Captain</option>
                    <option value="chef">Chef</option>
                  </Input>
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label>Shift Time</Label>
                  <Input
                    type="text"
                    {...register('shift_time')}
                    readOnly={modalMode === 'view'}
                  />
                </FormGroup>
              </Col>
            </Row>
            <Row>
              <Col md={12}>
                <FormGroup>
                  <Label>Outlets *</Label>
                  <Input
                    type="select"
                    multiple
                    {...register('outletids', { required: 'At least one outlet is required' })}
                    readOnly={modalMode === 'view'}
                  >
                    {outlets.map(outlet => (
                      <option key={outlet.outletid} value={outlet.outletid}>
                        {outlet.outlet_name} ({outlet.brand_name})
                      </option>
                    ))}
                  </Input>
                  {errors.outletids && <span className="text-danger">{errors.outletids.message}</span>}
                </FormGroup>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label>Parent User (Hotel Admin)</Label>
                  <Input
                    type="select"
                    {...register('parent_user_id')}
                    readOnly={modalMode === 'view'}
                  >
                    <option value="">Select Parent User</option>
                    {hotelAdmins.map(admin => (
                      <option key={admin.userid} value={admin.userid}>
                        {admin.full_name} ({admin.hotel_name})
                      </option>
                    ))}
                  </Input>
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label>Status</Label>
                  <Input
                    type="select"
                    {...register('status')}
                    readOnly={modalMode === 'view'}
                  >
                    <option value={1}>Active</option>
                    <option value={0}>Inactive</option>
                  </Input>
                </FormGroup>
              </Col>
            </Row>
          </ModalBody>
          <ModalFooter>
            {modalMode !== 'view' && (
              <>
                <Button color="secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button color="primary" type="submit">
                  {modalMode === 'create' ? 'Create' : 'Update'}
                </Button>
              </>
            )}
            {modalMode === 'view' && (
              <Button color="secondary" onClick={() => setModalOpen(false)}>
                Close
              </Button>
            )}
          </ModalFooter>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModalOpen} toggle={() => setDeleteModalOpen(!deleteModalOpen)}>
        <ModalHeader toggle={() => setDeleteModalOpen(!deleteModalOpen)}>
          Confirm Delete
        </ModalHeader>
        <ModalBody>
          Are you sure you want to delete the user <strong>{userToDelete?.full_name}</strong>?
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setDeleteModalOpen(false)}>
            Cancel
          </Button>
          <Button color="danger" onClick={confirmDelete}>
            Delete
          </Button>
        </ModalFooter>
      </Modal>
    </React.Fragment>
  );
};

export default OutletUser;
