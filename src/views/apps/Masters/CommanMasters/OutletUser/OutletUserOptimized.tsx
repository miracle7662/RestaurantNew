import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button, Modal, Form, Row, Col, Card, Tabs, Tab, Pagination, Stack, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useAuthContext } from '@/common';
import outletUserService, { OutletUserData, HotelAdminData } from '@/common/api/outletUser';
import { fetchDesignation, fetchUserType, fetchOutletsForDropdown } from '@/utils/commonfunction';
import { OutletData } from '@/common/api/outlet';
import Select from 'react-select';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table';

interface CombinedUser {
  userid?: number;
  username: string;
  full_name: string;
  role_level: string;
  outlet_name?: string;
  email: string;
  phone?: string;
  designation?: string;
  user_type?: string;
  status: number;
  created_date?: string;
  is_admin_row?: boolean;
  hotel_name?: string;
  brand_name?: string;
  last_login?: string;
  outletids?: number[];
}

const OutletUserList: React.FC = () => {
  const { user } = useAuthContext();
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'Add Outlet User' | 'Edit Outlet User' | 'Edit Hotel Admin'>('Add Outlet User');
  const [selectedUser, setSelectedUser] = useState<OutletUserData | null>(null);
  const [selectedHotelAdmin, setSelectedHotelAdmin] = useState<HotelAdminData | null>(null);
  const [outletUsers, setOutletUsers] = useState<OutletUserData[]>([]);
  const [hotelAdmins, setHotelAdmins] = useState<HotelAdminData[]>([]);
  const [loading, setLoading] = useState(true);
  const [outlets, setOutlets] = useState<OutletData[]>([]);
  const [designations, setDesignations] = useState<Array<{ designationid: number; Designation: string }>>([]);
  const [userTypes, setUserTypes] = useState<Array<{ usertypeid: number; User_type: string }>>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    phone: '',
    selectedOutlet: [] as number[],
    selectedDesignation: null as number | null,
    selectedUserType: null as number | null,
    shiftTime: '',
    macAddress: '',
    assignWarehouse: '',
    languagePreference: 'English',
    address: '',
    city: '',
    subLocality: '',
    webAccess: false,
    selfOrder: true,
    captainApp: true,
    kdsApp: true,
    captainOldKotAccess: 'Enabled',
    verifyMacIp: false,
    status: true,
  });

  // Fetch data
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchOutletUsers(),
        user?.role_level === 'superadmin' || user?.role_level === 'brand_admin' ? fetchHotelAdmins() : Promise.resolve(),
        fetchMasterData()
      ]);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchOutletUsers = useCallback(async () => {
    const params: any = {
      currentUserId: user?.userid,
      roleLevel: user?.role_level,
      hotelid: user?.hotelid
    };
    if (user?.role_level === 'hotel_admin' && user?.userid) {
      params.created_by_id = user.userid;
    }
    const response = await outletUserService.getOutletUsers(params);
    if (response?.data) {
      setOutletUsers(response.data.filter((u: any) => u.role_level === 'outlet_user'));
    }
  }, [user]);

  const fetchHotelAdmins = useCallback(async () => {
    const response = await outletUserService.getHotelAdmins({
      currentUserId: user?.userid,
      roleLevel: user?.role_level,
      hotelid: user?.hotelid
    });
    if (response?.data) {
      setHotelAdmins(response.data);
    }
  }, [user]);

      const fetchMasterData = useCallback(async () => {
        await Promise.all([
          fetchOutletsForDropdown(user, setOutlets, () => {}),
          fetchDesignation(setDesignations, () => {}),
          fetchUserType(setUserTypes, () => {})
        ]);
      }, [user]);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData({
      username: '',
      email: '',
      password: '',
      fullName: '',
      phone: '',
      selectedOutlet: [],
      selectedDesignation: null,
      selectedUserType: null,
      shiftTime: '',
      macAddress: '',
      assignWarehouse: '',
      languagePreference: 'English',
      address: '',
      city: '',
      subLocality: '',
      webAccess: false,
      selfOrder: true,
      captainApp: true,
      kdsApp: true,
      captainOldKotAccess: 'Enabled',
      verifyMacIp: false,
      status: true,
    });
  }, []);

  // Modal handlers
  const handleShowModal = useCallback((type: 'Add Outlet User' | 'Edit Outlet User' | 'Edit Hotel Admin', userData?: any) => {
    setModalType(type);
    resetForm();
    
    if (userData) {
      if (type === 'Edit Hotel Admin') {
        setSelectedHotelAdmin(userData);
        setFormData(prev => ({
          ...prev,
          fullName: userData.full_name || '',
          phone: userData.phone || '',
          status: userData.status === 0,
        }));
      } else {
        setSelectedUser(userData);
        setFormData(prev => ({
          ...prev,
          username: userData.username || '',
          email: userData.email || '',
          fullName: userData.full_name || '',
          phone: userData.phone || '',
          selectedOutlet: userData.outletids || [],
          selectedDesignation: userData.designation ? parseInt(userData.designation) : null,
          selectedUserType: userData.user_type ? parseInt(userData.user_type) : null,
          shiftTime: userData.shift_time || '',
          macAddress: userData.mac_address || '',
          assignWarehouse: userData.assign_warehouse || '',
          languagePreference: userData.language_preference || 'English',
          address: userData.address || '',
          city: userData.city || '',
          subLocality: userData.sub_locality || '',
          webAccess: userData.web_access || false,
          selfOrder: userData.self_order !== false,
          captainApp: userData.captain_app !== false,
          kdsApp: userData.kds_app !== false,
          captainOldKotAccess: userData.captain_old_kot_access || 'Enabled',
          verifyMacIp: userData.verify_mac_ip || false,
          status: userData.status === 0,
        }));
      }
    }
    
    setShowModal(true);
  }, [resetForm]);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setSelectedUser(null);
    setSelectedHotelAdmin(null);
    resetForm();
  }, [resetForm]);

  // Form handlers
  const handleFormChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (modalType === 'Edit Hotel Admin') {
      if (!formData.fullName.trim()) {
        toast.error('Please enter full name');
        return;
      }

      const hotelAdminData: HotelAdminData = {
        full_name: formData.fullName.trim(),
        phone: formData.phone?.trim(),
        status: formData.status ? 0 : 1,
      };

      try {
        await outletUserService.updateHotelAdmin(selectedHotelAdmin!.userid!, hotelAdminData);
        toast.success('Hotel admin updated successfully!');
        fetchHotelAdmins();
        handleCloseModal();
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to update hotel admin');
      }
    } else {
      if (!formData.username.trim() || formData.username.trim().length < 3) {
        toast.error('Please enter a valid username (minimum 3 characters)');
        return;
      }
      
      if (!formData.selectedOutlet.length) {
        toast.error('Please select at least one outlet');
        return;
      }

      const userData: OutletUserData = {
        username: formData.username.trim(),
        email: formData.email?.trim(),
        password: modalType === 'Add Outlet User' ? formData.password : undefined,
        full_name: formData.fullName.trim(),
        phone: formData.phone?.trim(),
        role_level: 'outlet_user',
        outletids: formData.selectedOutlet,
        designation: formData.selectedDesignation?.toString(),
        user_type: formData.selectedUserType?.toString(),
        shift_time: formData.shiftTime?.trim(),
        mac_address: formData.macAddress?.trim(),
        assign_warehouse: formData.assignWarehouse?.trim(),
        language_preference: formData.languagePreference,
        address: formData.address?.trim(),
        city: formData.city?.trim(),
        sub_locality: formData.subLocality?.trim(),
        web_access: formData.webAccess,
        self_order: formData.selfOrder,
        captain_app: formData.captainApp,
        kds_app: formData.kdsApp,
        captain_old_kot_access: formData.captainOldKotAccess,
        verify_mac_ip: formData.verifyMacIp,
        hotelid: user?.hotelid,
        parent_user_id: user?.userid || 1,
        status: formData.status ? 0 : 1,
        created_by_id: user?.userid || 1,
      };

      try {
        if (modalType === 'Edit Outlet User' && selectedUser) {
          await outletUserService.updateOutletUser(selectedUser.userid!, userData);
          toast.success('Outlet user updated successfully!');
        } else {
          await outletUserService.createOutletUser(userData);
          toast.success('Outlet user added successfully!');
        }
        fetchOutletUsers();
        handleCloseModal();
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to save outlet user');
      }
    }
  }, [modalType, formData, selectedUser, selectedHotelAdmin, user, fetchOutletUsers, fetchHotelAdmins, handleCloseModal]);

  const handleDeleteUser = useCallback(async (userId: number) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await outletUserService.deleteOutletUser(userId, { updated_by_id: user?.userid || 0 });
        toast.success('User deleted successfully!');
        fetchOutletUsers();
      } catch (error) {
        toast.error('Failed to delete user');
      }
    }
  }, [user, fetchOutletUsers]);

  // Table data
  const combinedUserList = useMemo(() => {
    return user?.role_level === 'hotel_admin'
      ? [
          {
            ...user,
            full_name: user.full_name || user.username,
            role_level: 'hotel_admin',
            outlet_name: '-',
            designation: '-',
            user_type: '-',
            is_admin_row: true,
          },
          ...outletUsers
        ]
      : outletUsers;
  }, [user, outletUsers]);

  // Table columns
  const outletUserColumns = useMemo<ColumnDef<CombinedUser>[]>(() => [
    {
      id: 'srNo',
      header: '#',
      size: 50,
      cell: ({ row }) => <span className="text-center d-block">{row.index + 1}</span>,
    },
    {
      accessorKey: 'full_name',
      header: 'Name',
      size: 150,
      cell: (info) => (
        <div className="text-center">
          <strong>{info.getValue<string>()}</strong>
          {info.row.original.is_admin_row && (
            <span className="badge bg-warning text-dark ms-2">Admin</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'role_level',
      header: 'Role',
      size: 100,
      cell: (info) => (
        <div className="text-center">
          <span className={`badge ${info.row.original.is_admin_row ? 'bg-warning' : 'bg-info'}`}>
            {info.row.original.is_admin_row ? 'Admin' : 'User'}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'outlet_name',
      header: 'Outlet',
      size: 100,
      cell: (info) => <span className="text-center d-block">{info.getValue<string>() || '-'}</span>,
    },
    {
      accessorKey: 'username',
      header: 'Username',
      size: 100,
      cell: (info) => <span className="text-center d-block">{info.getValue<string>()}</span>,
    },
    {
      accessorKey: 'email',
      header: 'Email',
      size: 150,
      cell: (info) => <span className="text-center d-block">{info.getValue<string>()}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 80,
      cell: (info) => {
        const statusValue = info.getValue<number>();
        return (
          <div className="text-center">
            <span className={`badge ${statusValue === 0 ? 'bg-success' : 'bg-danger'}`}>
              {statusValue === 0 ? 'Active' : 'Inactive'}
            </span>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      size: 100,
      cell: ({ row }) => (
        <div className="d-flex gap-1 justify-content-center">
          {row.original.is_admin_row ? (
            <span className="text-muted">-</span>
          ) : (
            <>
              <Button 
                size="sm" 
                variant="primary"
                onClick={() => handleShowModal('Edit Outlet User', row.original)}
                title="Edit User"
              >
                <i className="fi fi-rr-edit"></i>
              </Button>
              <Button 
                size="sm" 
                variant="danger"
                onClick={() => handleDeleteUser(row.original.userid!)}
                title="Delete User"
              >
                <i className="fi fi-rr-trash"></i>
              </Button>
            </>
          )}
        </div>
      ),
    },
  ], [handleShowModal, handleDeleteUser]);

  const hotelAdminColumns = useMemo<ColumnDef<HotelAdminData>[]>(() => [
    {
      id: 'srNo',
      header: '#',
      size: 50,
      cell: ({ row }) => <span className="text-center d-block">{row.index + 1}</span>,
    },
    {
      accessorKey: 'full_name',
      header: 'Name',
      size: 150,
      cell: (info) => (
        <div className="text-center">
          <strong>{info.getValue<string>()}</strong>
          <span className="badge bg-warning text-dark ms-2">Hotel Admin</span>
        </div>
      ),
    },
    {
      accessorKey: 'username',
      header: 'Username',
      size: 100,
      cell: (info) => <span className="text-center d-block">{info.getValue<string>()}</span>,
    },
    {
      accessorKey: 'email',
      header: 'Email',
      size: 150,
      cell: (info) => <span className="text-center d-block">{info.getValue<string>()}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 80,
      cell: (info) => {
        const statusValue = info.getValue<number>();
        return (
          <div className="text-center">
            <span className={`badge ${statusValue === 0 ? 'bg-success' : 'bg-danger'}`}>
              {statusValue === 0 ? 'Active' : 'Inactive'}
            </span>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      size: 100,
      cell: ({ row }) => (
        <div className="d-flex gap-1 justify-content-center">
          <Button 
            size="sm" 
            variant="primary"
            onClick={() => handleShowModal('Edit Hotel Admin', row.original)}
            title="Edit Admin"
          >
            <i className="fi fi-rr-edit"></i>
          </Button>
        </div>
      ),
    },
  ], [handleShowModal]);

  // Tables
  const outletUserTable = useReactTable({
    data: combinedUserList,
    columns: outletUserColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: { pagination: { pageSize: 10 } },
    state: { globalFilter: searchTerm },
  });

  const hotelAdminTable = useReactTable({
    data: hotelAdmins,
    columns: hotelAdminColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: { pagination: { pageSize: 10 } },
    state: { globalFilter: searchTerm },
  });

  if (loading) {
    return (
      <Stack className="align-items-center justify-content-center flex-grow-1 h-100">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Stack>
    );
  }

  return (
    <div className="container-fluid p-3">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="h4 mb-0">
          {user?.role_level === 'hotel_admin' ? 'Outlet Users' : 'Outlet Users & Hotel Admins'}
        </h2>
        <Button
          variant="success"
          onClick={() => handleShowModal('Add Outlet User')}
          className="d-flex align-items-center gap-2"
        >
          <i className="fi fi-rr-plus"></i>
          Add Outlet User
        </Button>
      </div>

      {(user?.role_level === 'superadmin' || user?.role_level === 'brand_admin') ? (
        <Tabs defaultActiveKey="hotel-admins" className="mb-3">
          <Tab eventKey="hotel-admins" title={`Hotel Admins (${hotelAdmins.length})`}>
            <Card>
              <Card.Body>
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      {hotelAdminTable.getHeaderGroups().map(headerGroup => (
                        <tr key={headerGroup.id}>
                          {headerGroup.headers.map(header => (
                            <th key={header.id} style={{ width: header.column.columnDef.size }}>
                              {flexRender(header.column.columnDef.header, header.getContext())}
                            </th>
                          ))}
                        </tr>
                      ))}
                    </thead>
                    <tbody>
                      {hotelAdminTable.getRowModel().rows.map(row => (
                        <tr key={row.id}>
                          {row.getVisibleCells().map(cell => (
                            <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <PaginationControls table={hotelAdminTable} />
              </Card.Body>
            </Card>
          </Tab>

          <Tab eventKey="outlet-users" title={`Outlet Users (${combinedUserList.length})`}>
            <Card>
              <Card.Body>
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      {outletUserTable.getHeaderGroups().map(headerGroup => (
                        <tr key={headerGroup.id}>
                          {headerGroup.headers.map(header => (
                            <th key={header.id} style={{ width: header.column.columnDef.size }}>
                              {flexRender(header.column.columnDef.header, header.getContext())}
                            </th>
                          ))}
                        </tr>
                      ))}
                    </thead>
                    <tbody>
                      {outletUserTable.getRowModel().rows.map(row => (
                        <tr key={row.id}>
                          {row.getVisibleCells().map(cell => (
                            <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <PaginationControls table={outletUserTable} />
              </Card.Body>
            </Card>
          </Tab>
        </Tabs>
      ) : (
        <Card>
          <Card.Body>
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  {outletUserTable.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                        <th key={header.id} style={{ width: header.column.columnDef.size }}>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {outletUserTable.getRowModel().rows.map(row => (
                    <tr key={row.id} className={row.original.is_admin_row ? 'table-primary' : ''}>
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <PaginationControls table={outletUserTable} />
          </Card.Body>
        </Card>
      )}

      {/* Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{modalType}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            {modalType === 'Edit Hotel Admin' ? (
              <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Full Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleFormChange('fullName', e.target.value)}
                    placeholder="Enter full name"
                  />
                </Form.Group>
              </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Phone</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.phone}
                      onChange={(e) => handleFormChange('phone', e.target.value)}
                      placeholder="Enter phone"
                    />
                  </Form.Group>
                </Col>
              </Row>
            ) : (
              <>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Username *</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.username}
                        onChange={(e) => handleFormChange('username', e.target.value)}
                        placeholder="Enter username"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email *</Form.Label>
                      <Form.Control
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleFormChange('email', e.target.value)}
                        placeholder="Enter email"
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Password {modalType === 'Add Outlet User' && '*'}</Form.Label>
                      <Form.Control
                        type="password"
                        value={formData.password}
                        onChange={(e) => handleFormChange('password', e.target.value)}
                        placeholder={modalType === 'Add Outlet User' ? "Enter password" : "Leave blank to keep current"}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Full Name *</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => handleFormChange('fullName', e.target.value)}
                        placeholder="Enter full name"
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Phone</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.phone}
                        onChange={(e) => handleFormChange('phone', e.target.value)}
                        placeholder="Enter phone"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Select Outlet *</Form.Label>
                      <Select
                        options={outlets.map(o => ({ value: o.outletid!, label: o.outlet_name! }))}
                        isMulti
                        value={outlets.filter(o => formData.selectedOutlet.includes(o.outletid!)).map(o => ({ value: o.outletid!, label: o.outlet_name! }))}
                        onChange={(selected) => handleFormChange('selectedOutlet', selected.map(s => s.value))}
                        placeholder="Select outlets"
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </>
            )}
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Check
                    type="switch"
                    checked={formData.status}
                    onChange={(e) => handleFormChange('status', e.target.checked)}
                    label="Active"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleSubmit}>
            {modalType.includes('Edit') ? 'Update' : 'Create'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

// Pagination component
const PaginationControls: React.FC<{ table: any }> = ({ table }) => {
  const pageCount = table.getPageCount();
  const currentPage = table.getState().pagination.pageIndex;
  
  return (
    <Stack direction="horizontal" className="justify-content-between align-items-center mt-3">
      <div>
        <Form.Select
          value={table.getState().pagination.pageSize}
          onChange={(e) => table.setPageSize(Number(e.target.value))}
          style={{ width: '100px', display: 'inline-block', marginRight: '10px' }}
        >
          <option value="5">5</option>
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
        </Form.Select>
        <span className="text-muted">
          Showing {table.getRowModel().rows.length} of {table.getCoreRowModel().rows.length} entries
        </span>
      </div>
      <Pagination>
        <Pagination.Prev
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        />
        {Array.from({ length: Math.min(5, pageCount) }, (_, i) => {
          const pageIndex = Math.max(0, Math.min(currentPage - 2 + i, pageCount - 1));
          return (
            <Pagination.Item
              key={pageIndex}
              active={pageIndex === currentPage}
              onClick={() => table.setPageIndex(pageIndex)}
            >
              {pageIndex + 1}
            </Pagination.Item>
          );
        })}
        <Pagination.Next
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        />
      </Pagination>
    </Stack>
  );
};

export default OutletUserList;
