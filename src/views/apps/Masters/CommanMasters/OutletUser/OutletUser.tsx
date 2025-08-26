import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button, Modal, Form, Row, Col, Table, Tabs, Tab, Pagination, Stack } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useAuthContext } from '@/common';
import { getOutletUsers, createOutletUser, updateOutletUser, deleteOutletUser, getHotelAdmins, OutletUser, HotelAdmin } from '@/common/api/outletUser';
import { fetchDesignation, fetchUserType, fetchOutlets } from '@/utils/commonfunction';
import { OutletData } from '@/common/api/outlet';
import Select, { MultiValue } from 'react-select';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table';
import { Preloader } from '@/components/Misc/Preloader';

interface Option {
  value: number;
  label: string;
}

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

// Debounce utility function
const debounce = (func: (...args: any[]) => void, wait: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const OutletUserList: React.FC = () => {
  const { user } = useAuthContext();
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedUser, setSelectedUser] = useState<OutletUserData | null>(null);
  const [selectedHotelAdmin, setSelectedHotelAdmin] = useState<HotelAdminData | null>(null);
  const [outletUsers, setOutletUsers] = useState<OutletUserData[]>([]);
  const [hotelAdmins, setHotelAdmins] = useState<HotelAdminData[]>([]);
  const [loading, setLoading] = useState(true);
  const [outlets, setOutlets] = useState<OutletData[]>([]);
  const [designations, setDesignations] = useState<Array<{ designationid: number; Designation: string }>>([]);
  const [userTypes, setUserTypes] = useState<Array<{ usertypeid: number; User_type: string }>>([]);
  const [designationid, setDesignationId] = useState<number | null>(null);
  const [usertypeid, setUserTypeId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [selectedOutlet, setSelectedOutlet] = useState<number[] | null>(null);
  const [selectedDesignation, setSelectedDesignation] = useState<number | null>(null);
  const [selectedUserType, setSelectedUserType] = useState<number | null>(null);
  const [shiftTime, setShiftTime] = useState<string>('');
  const [macAddress, setMacAddress] = useState<string>('');
  const [assignWarehouse, setAssignWarehouse] = useState<string>('');
  const [languagePreference, setLanguagePreference] = useState<string>('English');
  const [address, setAddress] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [subLocality, setSubLocality] = useState<string>('');
  const [webAccess, setWebAccess] = useState<boolean>(false);
  const [selfOrder, setSelfOrder] = useState<boolean>(true);
  const [captainApp, setCaptainApp] = useState<boolean>(true);
  const [kdsApp, setKdsApp] = useState<boolean>(true);
  const [captainOldKotAccess, setCaptainOldKotAccess] = useState<string>('Enabled');
  const [verifyMacIp, setVerifyMacIp] = useState<boolean>(false);
  const [status, setStatus] = useState<boolean>(true);

  useEffect(() => {
    console.log('Current user in OutletUserList:', user);
    console.log('Environment:', {
      isElectron: typeof window !== 'undefined' && window.process && window.process.versions && window.process.versions.electron,
      userAgent: navigator.userAgent,
      location: window.location.href
    });
    
    fetchOutletUsers();
    if (user?.role_level === 'superadmin' || user?.role_level === 'brand_admin') {
      fetchHotelAdmins();
    }
    fetchMasterData();
  }, [user]);

  const fetchMasterData = async () => {
    try {
      console.log('Fetching master data...');
      await fetchOutlets(user, setOutlets, setLoading);
      console.log('Fetched outlets:', outlets);
      fetchDesignation(setDesignations, setDesignationId);
      fetchUserType(setUserTypes, setUserTypeId);
    } catch (error) {
      console.error('Error fetching master data:', error);
      toast.error('Failed to fetch master data. Please check if the backend server is running.'); 
      console.error('Error details:', error);
    }
  };

  const fetchOutletUsers = async () => {
    try {
      setLoading(true);
      console.log('Fetching outlet users...');
      const params: any = {
        currentUserId: user?.userid,
        roleLevel: user?.role_level,
        hotelid: user?.hotelid
      };
      if (user?.role_level === 'hotel_admin' && typeof user?.userid === 'number') {
        params.created_by_id = user.userid;
      }
      const response = await outletUserService.getOutletUsers(params);
      console.log('Outlet users response:', response);
      if (response && response.data) {
        const outletUsersOnly = response.data.filter((user: any) => user.role_level === 'outlet_user');
        setOutletUsers(outletUsersOnly);
      } else {
        console.error('Invalid response format:', response);
        toast.error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error fetching outlet users:', error);
      toast.error('Failed to fetch outlet users. Please check if the backend server is running.'); 
      console.error('Error details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHotelAdmins = async () => {
    try {
      console.log('Fetching hotel admins...');
      const response = await outletUserService.getHotelAdmins({
        currentUserId: user?.userid,
        roleLevel: user?.role_level,
        hotelid: user?.hotelid
      });
      console.log('Hotel admins response:', response);
      if (response && response.data) {
        setHotelAdmins(response.data);
      } else {
        console.error('Invalid hotel admins response format:', response);
      }
    } catch (error) {
      console.error('Error fetching hotel admins:', error);
      toast.error('Failed to fetch hotel admins. Please check if the backend server is running.'); 
      console.error('Error details:', error);
    }
  };

  const resetFormFields = () => {
    setUsername('');
    setEmail('');
    setPassword('');
    setFullName('');
    setPhone('');
    setSelectedOutlet(null);
    setSelectedDesignation(null);
    setSelectedUserType(null);
    setShiftTime('');
    setMacAddress('');
    setAssignWarehouse('');
    setLanguagePreference('English');
    setAddress('');
    setCity('');
    setSubLocality('');
    setWebAccess(false);
    setSelfOrder(true);
    setCaptainApp(true);
    setKdsApp(true);
    setCaptainOldKotAccess('Enabled');
    setVerifyMacIp(false);
    setStatus(true);
  };

  const handleShowModal = (type: string, user?: OutletUserData | HotelAdminData) => {
    try {
      setModalType(type);
      setSelectedUser(user as OutletUserData || null);
      setSelectedHotelAdmin(user as HotelAdminData || null);

      // Reset form fields first to prevent state conflicts
      resetFormFields();

      if (user && type === 'Edit Outlet User') {
        loadUserDataIntoForm(user as OutletUserData);
      } else if (user && type === 'Edit Hotel Admin') {
        loadHotelAdminDataIntoForm(user as HotelAdminData);
      }

      // Use setTimeout to prevent blocking the main thread
      setTimeout(() => {
        setShowModal(true);
      }, 50);
    } catch (error) {
      console.error('Error opening modal:', error);
      toast.error('Failed to open modal. Please try again.');
    }
  };

  const loadUserDataIntoForm = (user: OutletUserData) => {
    setUsername(user.username || '');
    setEmail(user.email || '');
    setFullName(user.full_name || '');
    setPhone(user.phone || '');
    setSelectedOutlet(user.outletids ? (Array.isArray(user.outletids) ? user.outletids : (user.outletids as string).split(',').map(Number)) : null);
    setShiftTime(user.shift_time || '');
    setMacAddress(user.mac_address || '');
    setAssignWarehouse(user.assign_warehouse || '');
    setLanguagePreference(user.language_preference || 'English');
    setAddress(user.address || '');
    setCity(user.city || '');
    setSubLocality(user.sub_locality || '');
    setWebAccess(user.web_access || false);
    setSelfOrder(user.self_order || true);
    setCaptainApp(user.captain_app || true);
    setKdsApp(user.kds_app || true);
    setCaptainOldKotAccess(user.captain_old_kot_access || 'Enabled');
    setVerifyMacIp(user.verify_mac_ip || false);
    setStatus(user.status === 0);
  };

  const loadHotelAdminDataIntoForm = (hotelAdmin: HotelAdminData) => {
    setUsername(hotelAdmin.username || '');
    setEmail(hotelAdmin.email || '');
    setFullName(hotelAdmin.full_name || '');
    setPhone(hotelAdmin.phone || '');
    setStatus(hotelAdmin.status === 0);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalType('');
    setSelectedUser(null);
    setSelectedHotelAdmin(null);
    resetFormFields();
    setSearchTerm('');
  };

  const handleDeleteUser = async (userId: number) => {
    if (window.confirm('Are you sure you want to delete this outlet user? This action cannot be undone.')) {
      try {
        await outletUserService.deleteOutletUser(userId, { updated_by_id: user?.userid || 0 });
        toast.success('Outlet user deleted successfully!');
        fetchOutletUsers();
      } catch (error) {
        console.error('Error deleting outlet user:', error);
        toast.error('Failed to delete outlet user');
      }
    }
  };

  const outletOptions: Option[] = outlets.map((outlet) => ({
    value: outlet.outletid as number,
    label: `${outlet.outlet_name} (${outlet.outlet_code})`,
  }));

  const handleOutletChange = (selected: MultiValue<Option>) => {
    setSelectedOutlet(selected.length > 0 ? selected.map((option) => option.value) : []);
  };

  const handleModalSubmit = async () => {
    console.log('Starting handleModalSubmit...', { modalType, user });
    console.log('Form data:', { username, email, password, fullName, selectedOutlet });

    if (modalType === 'Edit Hotel Admin') {
      if (!fullName) {
        toast.error('Please enter full name');
        console.warn('Validation failed: Full name is missing');
        return;
      }

      const hotelAdminData: HotelAdminData = {
        full_name: fullName,
        phone,
        status: status ? 0 : 1,
      };

      try {
        console.log('Updating hotel admin:', { userid: selectedHotelAdmin?.userid, data: hotelAdminData });
        if (selectedHotelAdmin) {
          const response = await outletUserService.updateHotelAdmin(selectedHotelAdmin.userid!, hotelAdminData);
          console.log('Update hotel admin response:', response.data);
          toast.success('Hotel admin updated successfully!');
        }
        fetchHotelAdmins();
        handleCloseModal();
      } catch (error: any) {
        console.error('Error updating hotel admin:', error, error.response?.data);
        toast.error(error.response?.data?.message || 'Failed to update hotel admin');
      }
    } else {
      if (!username || username.length < 3) {
        toast.error('Please enter a valid username (minimum 3 characters)');
        console.warn('Validation failed: Invalid username', { username });
        return;
      }
      if (!Array.isArray(selectedOutlet)) {
        console.error('selectedOutlet is not an array:', selectedOutlet);
        toast.error('Internal error: Outlet selection is invalid');
        return;
      }
      const selectedOutletData = outlets.filter((outlet) => selectedOutlet.includes(outlet.outletid ?? 0));
      if (selectedOutletData.length !== selectedOutlet.length) {
        toast.error('One or more selected outlets are invalid or not available. Please choose valid outlets.');
        console.warn('Validation failed: Invalid outlets selected', { selectedOutlet, outlets });
        return;
      }

      const parentUserId = user?.id || 1;
      const createdById = user?.id || 1;
      console.log('Using parent_user_id:', parentUserId, 'created_by_id:', createdById);
      if (!parentUserId || !createdById) {
        toast.error('Unable to determine user identity. Please ensure you are logged in.');
        console.error('Validation failed: Invalid user identity', { user, parentUserId, createdById });
        return;
      }

      const userData: OutletUserData = {
        username,
        email,
        password: modalType === 'Add Outlet User' ? password : undefined,
        full_name: fullName,
        phone,
        role_level: 'outlet_user',
        outletids: selectedOutlet,
        designation: selectedDesignation?.toString(),
        user_type: selectedUserType?.toString(),
        shift_time: shiftTime,
        mac_address: macAddress,
        assign_warehouse: assignWarehouse,
        language_preference: languagePreference,
        address,
        city,
        sub_locality: subLocality,
        web_access: webAccess,
        self_order: selfOrder,
        captain_app: captainApp,
        kds_app: kdsApp,
        captain_old_kot_access: captainOldKotAccess,
        verify_mac_ip: verifyMacIp,
        hotelid: user?.hotelid || selectedOutletData[0]?.hotelid,
        parent_user_id: parentUserId,
        status: status ? 0 : 1,
        created_by_id: createdById,
      };

      console.log('Submitting userData to backend:', JSON.stringify(userData, null, 2));

      try {
        if (modalType === 'Edit Outlet User' && selectedUser) {
          console.log(`Updating outlet user with userid: ${selectedUser.userid}`);
          const response = await outletUserService.updateOutletUser(selectedUser.userid!, userData);
          console.log('Update response:', response.data);
          toast.success('Outlet user updated successfully!');
        } else {
          console.log('Creating new outlet user');
          const response = await outletUserService.createOutletUser(userData);
          console.log('Create response:', response.data);
          toast.success('Outlet user added successfully!');
        }
        fetchOutletUsers();
        handleCloseModal();
      } catch (error: any) {
        console.error('Error saving outlet user:', error);
        const errorMessage = error.response?.data?.message || (modalType === 'Edit Outlet User' ? 'Failed to update outlet user' : 'Failed to add outlet user');
        const invalidOutletIds = error.response?.data?.invalidOutletIds || [];
        console.error('Error details:', { message: errorMessage, invalidOutletIds, sentOutletIds: selectedOutlet, response: error.response?.data });
        toast.error(`${errorMessage}${invalidOutletIds.length > 0 ? ` (Invalid Outlet IDs: ${invalidOutletIds.join(', ')})` : ''}`);
      }
    }
  };

  // Define columns for hotel admins table
  const hotelAdminColumns = useMemo<ColumnDef<HotelAdminData>[]>(() => [
    {
      id: 'srNo',
      header: 'Sr No',
      size: 50,
      cell: ({ row }) => <div style={{ textAlign: 'center' }}>{row.index + 1}</div>,
    },
    {
      accessorKey: 'full_name',
      header: 'Name',
      size: 150,
      cell: (info) => (
        <div style={{ textAlign: 'center' }}>
          <strong>{info.getValue<string>()}</strong>
          <span className="badge bg-warning text-dark ms-2">Hotel Admin</span>
        </div>
      ),
    },
    {
      accessorKey: 'username',
      header: 'Username',
      size: 100,
      cell: (info) => <div style={{ textAlign: 'center' }}>{info.getValue<string>()}</div>,
    },
    {
      accessorKey: 'email',
      header: 'Email',
      size: 150,
      cell: (info) => <div style={{ textAlign: 'center' }}>{info.getValue<string>()}</div>,
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      size: 100,
      cell: (info) => <div style={{ textAlign: 'center' }}>{info.getValue<string>() || 'N/A'}</div>,
    },
    {
      accessorKey: 'hotel_name',
      header: 'Hotel Name',
      size: 100,
      cell: (info) => <div style={{ textAlign: 'center' }}>{info.getValue<string>() || 'N/A'}</div>,
    },
    {
      accessorKey: 'brand_name',
      header: 'Brand Name',
      size: 100,
      cell: (info) => <div style={{ textAlign: 'center' }}>{info.getValue<string>() || 'N/A'}</div>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 80,
      cell: (info) => {
        const statusValue = info.getValue<number>();
        return (
          <div style={{ textAlign: 'center' }}>
            <span className={`badge ${statusValue === 0 ? 'bg-success' : 'bg-danger'}`}>
              {statusValue === 0 ? 'Active' : 'Inactive'}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'last_login',
      header: 'Last Login',
      size: 100,
      cell: (info) => <div style={{ textAlign: 'center' }}>{info.getValue<string>() || 'Never'}</div>,
    },
    {
      accessorKey: 'created_date',
      header: 'Created Date',
      size: 100,
      cell: (info) => <div style={{ textAlign: 'center' }}>{info.getValue<string>() || 'N/A'}</div>,
    },
    {
      id: 'actions',
      header: () => <div style={{ textAlign: 'center' }}>Action</div>,
      size: 100,
      cell: ({ row }) => (
        <div className="d-flex gap-2 justify-content-center">
          <button
            className="btn btn-sm btn-primary"
            title="Edit Hotel Admin"
            onClick={() => handleShowModal('Edit Hotel Admin', row.original)}
          >
            <i className="fi fi-rr-edit"></i>
          </button>
        </div>
      ),
    },
  ], []);

  // Define columns for outlet users table
  const outletUserColumns = useMemo<ColumnDef<CombinedUser>[]>(() => [
    {
      id: 'srNo',
      header: 'Sr No',
      size: 50,
      cell: ({ row }) => <div style={{ textAlign: 'center' }}>{row.index + 1}</div>,
    },
    {
      accessorKey: 'full_name',
      header: 'Name',
      size: 150,
      cell: (info) => (
        <div style={{ textAlign: 'center' }}>
          <strong>{info.getValue<string>()}</strong>
          {info.row.original.is_admin_row && (
            <span className="badge bg-warning text-dark ms-2">Hotel Admin (You)</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'role_level',
      header: 'Role',
      size: 100,
      cell: (info) => (
        <div style={{ textAlign: 'center' }}>
          <span className={`badge ${info.row.original.is_admin_row ? 'bg-warning text-dark' : 'bg-info'}`}>
            {info.row.original.is_admin_row ? 'Hotel Admin' : 'Outlet User'}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'outlet_name',
      header: 'Outlet Name',
      size: 100,
      cell: (info) => <div style={{ textAlign: 'center' }}>{info.getValue<string>() || '-'}</div>,
    },
    {
      accessorKey: 'username',
      header: 'Username',
      size: 100,
      cell: (info) => <div style={{ textAlign: 'center' }}>{info.getValue<string>()}</div>,
    },
    {
      accessorKey: 'email',
      header: 'Email',
      size: 150,
      cell: (info) => <div style={{ textAlign: 'center' }}>{info.getValue<string>()}</div>,
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      size: 100,
      cell: (info) => <div style={{ textAlign: 'center' }}>{info.getValue<string>() || '-'}</div>,
    },
    {
      accessorKey: 'designation',
      header: 'Designation',
      size: 100,
      cell: (info) => <div style={{ textAlign: 'center' }}>{info.getValue<string>() || '-'}</div>,
    },
    {
      accessorKey: 'user_type',
      header: 'User Type',
      size: 100,
      cell: (info) => <div style={{ textAlign: 'center' }}>{info.getValue<string>() || '-'}</div>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 80,
      cell: (info) => {
        const statusValue = info.getValue<number>();
        return (
          <div style={{ textAlign: 'center' }}>
            <span className={`badge ${statusValue === 0 ? 'bg-success' : 'bg-danger'}`}>
              {statusValue === 0 ? 'Active' : 'Inactive'}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'created_date',
      header: 'Created Date',
      size: 100,
      cell: (info) => <div style={{ textAlign: 'center' }}>{info.getValue<string>() || '-'}</div>,
    },
    {
      id: 'actions',
      header: () => <div style={{ textAlign: 'center' }}>Action</div>,
      size: 100,
      cell: ({ row }) => (
        <div className="d-flex gap-2 justify-content-center">
          {row.original.is_admin_row ? (
            <span className="text-muted">-</span>
          ) : (
            <>
              <button
                className="btn btn-sm btn-primary"
                title="Edit User"
                onClick={() => handleShowModal('Edit Outlet User', row.original)}
              >
                <i className="fi fi-rr-edit"></i>
              </button>
              <button
                className="btn btn-sm btn-danger"
                title="Delete User"
                onClick={() => handleDeleteUser(row.original.userid!)}
              >
                <i className="fi fi-rr-trash"></i>
              </button>
            </>
          )}
        </div>
      ),
    },
  ], []);

  // Combined user list for hotel_admin role
  const combinedUserList = user?.role_level === 'hotel_admin'
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

  // Initialize react-table for outlet users
  const outletUserTable = useReactTable({
    data: combinedUserList,
    columns: outletUserColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
    state: {
      globalFilter: searchTerm,
    },
  });

  // Initialize react-table for hotel admins
  const hotelAdminTable = useReactTable({
    data: hotelAdmins,
    columns: hotelAdminColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
    state: {
      globalFilter: searchTerm,
    },
  });

  // const handleSearch = useCallback(
  //   debounce((value: string) => {
  //     outletUserTable.setGlobalFilter(value);
  //     hotelAdminTable.setGlobalFilter(value);
  //   }, 300),
  //   [outletUserTable, hotelAdminTable]
  // );

  // const onSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const value = e.target.value;
  //   setSearchTerm(value);
  //   handleSearch(value);
  // };

  const getPaginationItems = (table: any) => {
    const items = [];
    const maxPagesToShow = 5;
    const pageIndex = table.getState().pagination.pageIndex;
    const totalPages = table.getPageCount();
    let startPage = Math.max(0, pageIndex - Math.floor(maxPagesToShow / 2));
    const endPage = Math.min(totalPages - 1, startPage + maxPagesToShow - 1);

    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(0, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <Pagination.Item
          key={i}
          active={i === pageIndex}
          onClick={() => table.setPageIndex(i)}
        >
          {i + 1}
        </Pagination.Item>
      );
    }
    return items;
  };

  if (loading) {
    return (
      <Stack className="align-items-center justify-content-center flex-grow-1 h-100">
        <Preloader />
      </Stack>
    );
  }

  return (
    <div className="m-1">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>
          {user?.role_level === 'hotel_admin' ? 'Outlet Users' : 'Outlet Users & Hotel Admins'}
        </h4>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        
          <div className="form-check form-check-inline">
            <input className="form-check-input" type="checkbox" id="showDeactivated" style={{ borderColor: '#333' }} />
            <label className="form-check-label" htmlFor="showDeactivated">
              Show Deactivated
            </label>
          </div>
          <button
            className="btn btn-success"
            onClick={() => handleShowModal('Add Outlet User')}
          >
            + Add Outlet User
          </button>
        </div>
      </div>

      {(user?.role_level === 'superadmin' || user?.role_level === 'brand_admin') ? (
        <Tabs defaultActiveKey="hotel-admins" className="mb-3">
          <Tab eventKey="hotel-admins" title="Hotel Admins">
            <div className="mb-3">
              <small className="text-muted">
                <i className="fi fi-rr-info me-1"></i>
                Hotel Admins manage the overall hotel operations and have access to all outlets under their hotel.
              </small>
            </div>

            <div className="flex-grow-1" style={{ overflowY: 'auto' }}>
              <Table responsive hover className="table table-bordered table-hover mb-4">
                <thead className="thead-light">
                  {hotelAdminTable.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th key={header.id} style={{ width: header.column.columnDef.size, textAlign: header.id === 'actions' ? 'left' : 'center' }}>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {hotelAdminTable.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="table-primary">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} style={{ textAlign: cell.column.id === 'actions' ? 'left' : 'center' }}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </Table>
              <Stack direction="horizontal" className="justify-content-between align-items-center">
                <div>
                  <Form.Select
                    value={hotelAdminTable.getState().pagination.pageSize}
                    onChange={(e) => hotelAdminTable.setPageSize(Number(e.target.value))}
                    style={{ width: '100px', display: 'inline-block', marginRight: '10px' }}
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                  </Form.Select>
                  <span className="text-muted">
                    Showing {hotelAdminTable.getRowModel().rows.length} of {hotelAdmins.length} entries
                  </span>
                </div>
                <Pagination>
                  <Pagination.Prev
                    onClick={() => hotelAdminTable.previousPage()}
                    disabled={!hotelAdminTable.getCanPreviousPage()}
                  />
                  {getPaginationItems(hotelAdminTable)}
                  <Pagination.Next
                    onClick={() => hotelAdminTable.nextPage()}
                    disabled={!hotelAdminTable.getCanNextPage()}
                  />
                </Pagination>
              </Stack>
            </div>
          </Tab>

          <Tab eventKey="outlet-users" title="Outlet Users">
            <div className="mb-3">
              <small className="text-muted">
                <i className="fi fi-rr-info me-1"></i>
                Outlet Users are staff members who work at specific outlets and have limited access based on their role.
              </small>
            </div>

            <div className="flex-grow-1" style={{ overflowY: 'auto' }}>
              <Table responsive hover className="table table-bordered table-hover mb-4">
                <thead className="thead-light">
                  {outletUserTable.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th key={header.id} style={{ width: header.column.columnDef.size, textAlign: header.id === 'actions' ? 'left' : 'center' }}>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {outletUserTable.getRowModel().rows.map((row) => (
                    <tr key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} style={{ textAlign: cell.column.id === 'actions' ? 'left' : 'center' }}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </Table>
              <Stack direction="horizontal" className="justify-content-between align-items-center">
                <div>
                  <Form.Select
                    value={outletUserTable.getState().pagination.pageSize}
                    onChange={(e) => outletUserTable.setPageSize(Number(e.target.value))}
                    style={{ width: '100px', display: 'inline-block', marginRight: '10px' }}
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                  </Form.Select>
                  <span className="text-muted">
                    Showing {outletUserTable.getRowModel().rows.length} of {combinedUserList.length} entries
                  </span>
                </div>
                <Pagination>
                  <Pagination.Prev
                    onClick={() => outletUserTable.previousPage()}
                    disabled={!outletUserTable.getCanPreviousPage()}
                  />
                  {getPaginationItems(outletUserTable)}
                  <Pagination.Next
                    onClick={() => outletUserTable.nextPage()}
                    disabled={!outletUserTable.getCanNextPage()}
                  />
                </Pagination>
              </Stack>
            </div>
          </Tab>
        </Tabs>
      ) : (
        <div>
          <div className="mb-3">
            <small className="text-muted">
              <i className="fi fi-rr-info me-1"></i>
              Outlet Users are staff members who work at specific outlets under your hotel. Your admin account is shown at the top.
            </small>
          </div>

          <div className="flex-grow-1" style={{ overflowY: 'auto' }}>
            <Table responsive hover className="table table-bordered table-hover mb-4">
              <thead className="thead-light">
                {outletUserTable.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} style={{ width: header.column.columnDef.size, textAlign: header.id === 'actions' ? 'left' : 'center' }}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {outletUserTable.getRowModel().rows.map((row) => (
                  <tr key={row.id} className={row.original.is_admin_row ? 'table-primary' : ''}>
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} style={{ textAlign: cell.column.id === 'actions' ? 'left' : 'center' }}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </Table>
            <Stack direction="horizontal" className="justify-content-between align-items-center">
              <div>
                <Form.Select
                  value={outletUserTable.getState().pagination.pageSize}
                  onChange={(e) => outletUserTable.setPageSize(Number(e.target.value))}
                  style={{ width: '100px', display: 'inline-block', marginRight: '10px' }}
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </Form.Select>
                <span className="text-muted">
                  Showing {outletUserTable.getRowModel().rows.length} of {combinedUserList.length} entries
                </span>
              </div>
              <Pagination>
                <Pagination.Prev
                  onClick={() => outletUserTable.previousPage()}
                  disabled={!outletUserTable.getCanPreviousPage()}
                />
                {getPaginationItems(outletUserTable)}
                <Pagination.Next
                  onClick={() => outletUserTable.nextPage()}
                  disabled={!outletUserTable.getCanNextPage()}
                />
              </Pagination>
            </Stack>
          </div>
        </div>
      )}

      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{modalType}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            {modalType === 'Edit Hotel Admin' ? (
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group controlId="fullName">
                    <Form.Label>
                      Full Name <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter Full Name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="phone">
                    <Form.Label>Phone</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter Phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </Form.Group>
                </Col>
              </Row>
            ) : (
              <>
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group controlId="username">
                      <Form.Label>
                        Username <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="email">
                      <Form.Label>
                        Email <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="email"
                        placeholder="Enter Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group controlId="password">
                      <Form.Label>
                        Password {modalType === 'Add Outlet User' && <span className="text-danger">*</span>}
                      </Form.Label>
                      <Form.Control
                        type="password"
                        placeholder={modalType === 'Add Outlet User' ? "Enter Password" : "Leave blank to keep current"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="fullName">
                      <Form.Label>
                        Full Name <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter Full Name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group controlId="phone">
                      <Form.Label>Phone</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter Phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="outlet">
                      <Form.Label>
                        Select Outlet <span className="text-danger">*</span>
                      </Form.Label>
                      <Select
                        options={outletOptions}
                        isMulti
                        onChange={handleOutletChange}
                        value={outletOptions.filter((option) => selectedOutlet?.includes(option.value))}
                        className="basic-multi-select"
                        classNamePrefix="select"
                        placeholder="Select Outlets"
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group controlId="designation">
                      <Form.Label>Designation</Form.Label>
                      <Form.Select
                        value={selectedDesignation || ''}
                        onChange={(e) => setSelectedDesignation(e.target.value ? Number(e.target.value) : null)}
                      >
                        <option value="">Select Designation</option>
                        {designations.map((designation) => (
                          <option key={designation.designationid} value={designation.designationid}>
                            {designation.Designation}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="userType">
                      <Form.Label>User Type</Form.Label>
                      <Form.Select
                        value={selectedUserType || ''}
                        onChange={(e) => setSelectedUserType(e.target.value ? Number(e.target.value) : null)}
                      >
                        <option value="">Select User Type</option>
                        {userTypes.map((userType) => (
                          <option key={userType.usertypeid} value={userType.usertypeid}>
                            {userType.User_type}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group controlId="shiftTime">
                      <Form.Label>Shift Time</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter Shift Time"
                        value={shiftTime}
                        onChange={(e) => setShiftTime(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="macAddress">
                      <Form.Label>MAC Address</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter MAC Address"
                        value={macAddress}
                        onChange={(e) => setMacAddress(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group controlId="assignWarehouse">
                      <Form.Label>Assign Warehouse</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter Warehouse"
                        value={assignWarehouse}
                        onChange={(e) => setAssignWarehouse(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="languagePreference">
                      <Form.Label>Language Preference</Form.Label>
                      <Form.Select
                        value={languagePreference}
                        onChange={(e) => setLanguagePreference(e.target.value)}
                      >
                        <option value="English">English</option>
                        <option value="Hindi">Hindi</option>
                        <option value="Arabic">Arabic</option>
                        <option value="French">French</option>
                        <option value="Spanish">Spanish</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col md={12}>
                    <Form.Group controlId="address">
                      <Form.Label>Address</Form.Label>
                      <Form.Control
                        as="textarea"
                        placeholder="Enter Address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group controlId="city">
                      <Form.Label>City</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter City"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="subLocality">
                      <Form.Label>Sub Locality</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter Sub Locality"
                        value={subLocality}
                        onChange={(e) => setSubLocality(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group controlId="webAccess">
                      <Form.Label>Web Access</Form.Label>
                      <Form.Check
                        type="switch"
                        checked={webAccess}
                        onChange={(e) => setWebAccess(e.target.checked)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="selfOrder">
                      <Form.Label>Self Order</Form.Label>
                      <Form.Check
                        type="switch"
                        checked={selfOrder}
                        onChange={(e) => setSelfOrder(e.target.checked)}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group controlId="captainApp">
                      <Form.Label>Captain App</Form.Label>
                      <Form.Check
                        type="switch"
                        checked={captainApp}
                        onChange={(e) => setCaptainApp(e.target.checked)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="kdsApp">
                      <Form.Label>KDS App</Form.Label>
                      <Form.Check
                        type="switch"
                        checked={kdsApp}
                        onChange={(e) => setKdsApp(e.target.checked)}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group controlId="captainOldKotAccess">
                      <Form.Label>Captain Old KOT Access</Form.Label>
                      <Form.Select
                        value={captainOldKotAccess}
                        onChange={(e) => setCaptainOldKotAccess(e.target.value)}
                      >
                        <option value="Enabled">Enabled</option>
                        <option value="Disabled">Disabled</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="verifyMacIp">
                      <Form.Label>Verify MAC/IP</Form.Label>
                      <Form.Check
                        type="switch"
                        checked={verifyMacIp}
                        onChange={(e) => setVerifyMacIp(e.target.checked)}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </>
            )}
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group controlId="status">
                  <Form.Label>Status</Form.Label>
                  <Form.Check
                    type="switch"
                    checked={status}
                    onChange={(e) => setStatus(e.target.checked)}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="danger" onClick={handleCloseModal}>
            Close
          </Button>
          <Button variant="success" onClick={handleModalSubmit}>
            {modalType === 'Edit Outlet User' || modalType === 'Edit Hotel Admin' ? 'Update' : 'Create'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default OutletUserList;