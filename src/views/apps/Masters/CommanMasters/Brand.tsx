import React, { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Preloader } from '@/components/Misc/Preloader';
import { Button, Card, Stack, Table, Form, Pagination } from 'react-bootstrap';
import TitleHelmet from '@/components/Common/TitleHelmet';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table';
import {
  fetchMarkets,
  fetchStates,
  fetchHotelType,
  MarketItem,
  StateItem,
  HotelTypeItem,
} from '../../../../utils/commonfunction';
import { useAuthContext } from '@/common';

import Swal from 'sweetalert2';

// Define brand data type
interface HotelMastersItem {
  id: string;
  Hotel_name: string;
  hotel_name?: string; // Backend returns hotel_name (lowercase)
  hotelid: string; // Changed from Hotelid to hotelid to match backend
  Hotelid?: string; // Keep for backward compatibility
  marketid: string;
  market_name: string;
  short_name: string;
  phone: string;
  email: string;
  fssai_no: string;
  trn_gstno: string;
  panno: string;
  website: string;
  address: string;
  stateid: string;
  hoteltypeid: string;
  status: string;
  created_by_id: string;
  created_date: string;
  updated_by_id: string;
  updated_date: string;
  Masteruserid: string;
  image?: string | null;
}




// Register User Modal Component
interface RegisterUserModalProps {
  show: boolean;
  onHide: () => void;
  brand: HotelMastersItem | null;
  onSuccess: () => void;
}

// Debounce utility function
const debounce = (func: (...args: any[]) => void, wait: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};
const RegisterUserModal: React.FC<RegisterUserModalProps> = ({ show, onHide, brand, onSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingHotelData, setFetchingHotelData] = useState(false);
  const [hotelData, setHotelData] = useState<any>(null);

  // Fetch hotel data when modal opens
  useEffect(() => {
    if (show && brand) {
      fetchHotelData();
    }
  }, [show, brand]);

  const fetchHotelData = async () => {
    if (!brand) return;
    
    console.log('Brand object:', brand);
    console.log('Brand.hotelid:', brand.hotelid);
    console.log('Brand.hotelid:', brand.hotelid);
    
    setFetchingHotelData(true);
    try {
      // The backend returns 'Hotelid' (uppercase), so we should use that
      const hotelid = brand.hotelid || brand.hotelid;
      console.log('Using hotel ID:', hotelid);
      
      if (!hotelid) {
        console.error('No hotel ID found in brand object');
        toast.error('No hotel ID found');
        return;
      }
      
      const res = await fetch(`http://localhost:3001/api/HotelMasters/${hotelid}`);
      console.log('Response status:', res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log('Fetched hotel data:', data);
        setHotelData(data);
      } else {
        const errorText = await res.text();
        console.error('Failed to fetch hotel data. Status:', res.status, 'Response:', errorText);
        toast.error(`Failed to fetch hotel data: ${res.status}`);
      }
    } catch (err) {
      console.error('Error fetching hotel data:', err);
      toast.error('Error fetching hotel data');
    } finally {
      setFetchingHotelData(false);
    }
  };

  const handleSubmit = async () => {
    if (!brand || !username || !password) {
      toast.error('Please fill all required fields');
      return;
    }

    // Use hotelData if available, otherwise fall back to brand data
    const hotelInfo = hotelData || brand;
    if (!hotelInfo) {
      toast.error('Hotel data not available');
      return;
    }

    setLoading(true);
    try {
      // Ensure we have valid integer IDs for foreign key constraints
      const hotelid = parseInt(hotelInfo.hotelid || hotelInfo.hotelid);
      if (!hotelid || isNaN(hotelid)) {
        toast.error('Invalid hotel ID. Please try again.');
        return;
      }

      const payload = {
        username,
        email: hotelInfo.email || '',
        password,
        full_name: `${hotelInfo.hotel_name || hotelInfo.hotel_name} Admin`,
        phone: hotelInfo.phone || '',
        role_level: 'hotel_admin',
        brand_id: hotelid,
        hotelid: hotelid, // Changed from hotel_id to hotelid
        parent_user_id: 1, // SuperAdmin ID as parent
        created_by_id: 1 // SuperAdmin ID
      };

      console.log('Creating user with payload:', payload);

      const res = await fetch('http://localhost:3001/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success('Hotel Admin created successfully!');
        toast.success(`Username: ${username}, Password: ${password}`);
        setUsername('');
        setPassword('');
        onSuccess();
        onHide();
      } else {
        const error = await res.json();
        toast.error(error.message || 'Failed to create user');
      }
    } catch (err) {
      console.error('Error creating user:', err);
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (!show || !brand) return null;

  return (
    <div
      className="modal"
      style={{
        display: show ? 'block' : 'none',
        background: 'rgba(0,0,0,0.5)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1050
      }}
    >
      <div
        className="modal-content"
        style={{
          background: 'white',
          padding: '20px',
          maxWidth: '500px',
          margin: '100px auto',
          borderRadius: '8px'
        }}
      >
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">Register User for {brand?.hotel_name || brand?.hotel_name}</h5>
          <button className="btn-close" onClick={onHide} disabled={loading || fetchingHotelData}></button>
        </div>

        {fetchingHotelData && (
          <div className="text-center mb-3">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading hotel data...</span>
            </div>
            <p className="mt-2">Loading hotel data...</p>
          </div>
        )}

        <div className="mb-3">
          <label className="form-label">
            Hotel Name
          </label>
          <input
            type="text"
            className="form-control"
            value={hotelData?.hotel_name || hotelData?.Hotel_name || brand?.hotel_name || brand?.Hotel_name || ''}
            readOnly
            style={{ backgroundColor: '#f8f9fa' }}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">
            Email
          </label>
          <input
            type="email"
            className="form-control"
            value={hotelData?.email || ''}
            readOnly
            style={{ backgroundColor: '#f8f9fa' }}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">
            Phone
          </label>
          <input
            type="text"
            className="form-control"
            value={hotelData?.phone || ''}
            readOnly
            style={{ backgroundColor: '#f8f9fa' }}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">
            Username <span style={{ color: 'red' }}>*</span>
          </label>
          <input
            type="text"
            className="form-control"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            disabled={loading || fetchingHotelData}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">
            Password <span style={{ color: 'red' }}>*</span>
          </label>
          <input
            type="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            disabled={loading || fetchingHotelData}
          />
        </div>

        <div className="alert alert-info">
          <i className="fi fi-rr-info me-2"></i>
          This will create a Hotel Admin user for {hotelData?.hotel_name || hotelData?.Hotel_name || brand?.hotel_name || brand?.Hotel_name} with the following details:
          <ul className="mt-2 mb-0">
            <li><strong>Email:</strong> {hotelData?.email || 'Not available'}</li>
            <li><strong>Phone:</strong> {hotelData?.phone || 'Not available'}</li>
            <li><strong>Hotel ID:</strong> {hotelData?.hotelid || brand?.hotelid || brand?.hotelid}</li>
          </ul>
        </div>

        <div className="d-flex justify-content-end gap-2">
          <button className="btn btn-secondary" onClick={onHide} disabled={loading || fetchingHotelData}>
            Cancel
          </button>
          <button className="btn btn-success" onClick={handleSubmit} disabled={loading || fetchingHotelData || !hotelData}>
            {loading ? 'Creating...' : 'Register User'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Main BrandList component
const BrandList: React.FC = () => {
  const { user } = useAuthContext();
  const [, setHotelMastersItem] = useState<HotelMastersItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showAddBrandModal, setShowAddBrandModal] = useState(false);
  const [showEditBrandModal, setShowEditBrandModal] = useState(false);
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showDigitalOrderModal, setShowDigitalOrderModal] = useState(false);
  const [showUserManagementModal, setShowUserManagementModal] = useState(false);
  const [showRegisterUserModal, setShowRegisterUserModal] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<HotelMastersItem | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredHotelMasters, setFilteredHotelMasters] = useState<HotelMastersItem[]>([]);
  const [, setShowEditModal] = useState(false);
  const [selectedHotelMasters, setSelectedHotelMasters] = useState<HotelMastersItem | null>(null);



  const fetchHotelMasters = useCallback(async () => {
    try {
      setLoading(true);
      
      // Build query parameters based on user role
      const params = new URLSearchParams();
      if (user?.role_level) {
        params.append('role_level', user.role_level);
      }
      if (user?.role_level === 'hotel_admin' && user?.hotelid) {
        params.append('hotelid', user.hotelid.toString());
      }
      
      const url = `http://localhost:3001/api/HotelMasters${params.toString() ? `?${params.toString()}` : ''}`;
      console.log('Fetching hotels with URL:', url);
      
      const res = await fetch(url);
      const data = await res.json();
      console.log('Fetched HotelMasters:', data); // Debug log to inspect backend data
      console.log('Sample hotel data:', data[0]); // Log first item to see structure
      setHotelMastersItem(data);
      setFilteredHotelMasters(data);
    } catch (err) {
      toast.error('Failed to fetch HotelMasters');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    console.log('Current user:', user);
    if (user) {
      fetchHotelMasters();
    }
  }, [user, fetchHotelMasters]);

  const columns = React.useMemo<ColumnDef<HotelMastersItem>[]>(
    () => [
      {
        id: 'srNo',
        header: 'Sr No',
        size: 80,
        cell: ({ row }) => <span>{row.index + 1}</span>,
      },
      {
        accessorKey: 'image',
        header: 'Logo',
        size: 200,
        cell: (info) => <div style={{ textAlign: 'center' }}>{info.getValue<string>() || '-'}</div>,
      },
      {
        accessorKey: 'hotel_name',
        header: 'Hotel_name ',
        size: 200,
        cell: (info) => <div style={{ textAlign: 'center' }}>{info.getValue<string>() || '-'}</div>,
      },
      {
        accessorKey: 'short_name',
        header: 'Short Name',
        size: 150,
        cell: (info) => <div style={{ textAlign: 'center' }}>{info.getValue<string>() || '-'}</div>,
      },
      {
        accessorKey: 'marketid',
        header: 'Market Id',
        size: 150,
        cell: (info) => <div style={{ textAlign: 'center' }}>{info.getValue<string>() || '-'}</div>,
      },
      {
        accessorKey: 'market_name',
        header: 'Market Name',
        size: 150,
        cell: (info) => <div style={{ textAlign: 'center' }}>{info.getValue<string>() || '-'}</div>,
      },
      {
        accessorKey: 'digitalmenulink',
        header: 'Digital Menu Link',
        size: 150,
        cell: (info) => <div style={{ textAlign: 'center' }}>{info.getValue<string>() || '-'}</div>,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 150,
        cell: (info) => {
          const statusValue = info.getValue<string | number>();
          console.log('Status value:', statusValue, typeof statusValue); // Debug log
          return <div style={{ textAlign: 'center' }}>{statusValue == '0' || statusValue === 0 ? 'Active' : 'Inactive'}</div>;
        },
      },
      {
        id: 'actions',
        header: () => <div style={{ textAlign: 'center' }}>Action</div>,
        size: 200,
        cell: ({ row }) => (
          <div className="d-flex gap-2 justify-content-center">
            {/* Edit button - available for both superadmin and hotel_admin */}
            <button
              className="btn btn-sm btn-primary"
              onClick={() => {
                handleEditClick(row.original);
                setShowEditBrandModal(true);
              }}
              title="Edit Brand"
              disabled={loading}
            >
              <i className="fi fi-rr-edit"></i>
            </button>
            
            {/* SuperAdmin only buttons */}
            {user?.role_level === 'superadmin' && (
              <>
                <button
                  className="btn btn-sm btn-info"
                  onClick={() => {
                    setSelectedBrand(row.original);
                    setShowBannerModal(true);
                  }}
                  title="Upload/Delete Banner"
                  disabled={loading}
                >
                  <i className="fi fi-rr-picture"></i>
                </button>
                <button
                  className="btn btn-sm btn-warning"
                  onClick={() => {
                    setSelectedBrand(row.original);
                    setShowSettingsModal(true);
                  }}
                  title="Settings"
                  disabled={loading}
                >
                  <i className="fi fi-rr-settings"></i>
                </button>
                <button
                  className="btn btn-sm btn-success"
                  onClick={() => {
                    setSelectedBrand(row.original);
                    setShowDigitalOrderModal(true);
                  }}
                  title="Digital Order"
                  disabled={loading}
                >
                  <i className="fi fi-rr-digital-tachograph"></i>
                </button>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedBrand(row.original);
                    setShowUserManagementModal(true);
                  }}
                  title="Manage Users"
                  disabled={loading}
                >
                  <i className="fi fi-rr-users"></i>
                </button>
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => {
                    setSelectedBrand(row.original);
                    setShowRegisterUserModal(true);
                  }}
                  title="Register User for Brand"
                  disabled={loading}
                >
                  <i className="fi fi-rr-user-add"></i>
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDeleteHotelMasters(row.original)}
                  title="Delete Brand"
                  disabled={loading}
                >
                  <i className="fi fi-rr-trash"></i>
                </button>
              </>
            )}
          </div>
        ),
      },
    ],
    [loading, user]
  );

  const table = useReactTable({
    data: filteredHotelMasters,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const handleEditClick = (HotelMasters: HotelMastersItem) => {
    setSelectedHotelMasters(HotelMasters);
    setShowEditModal(true);
  };

  const handleDeleteHotelMasters = async (HotelMasters: HotelMastersItem) => {
    const res = await Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to recover this HotelMasters!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3E97FF',
      confirmButtonText: 'Yes, delete it!',
    });
    if (res.isConfirmed) {
      try {
        await fetch(`http://localhost:3001/api/HotelMasters/${HotelMasters.Hotelid || HotelMasters.hotelid}`, { method: 'DELETE' });
        toast.success('Deleted successfully');
        fetchHotelMasters();
        setSelectedHotelMasters(null);
      } catch {
        toast.error('Failed to delete');
      }
    }
  };

    const handleSearch = useCallback(
      debounce((value: string) => {
        table.setGlobalFilter(value);
      }, 300),
      [table]
    );
    const onSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    handleSearch(value);
  };


   const getPaginationItems = () => {
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


  
return (
    <>
      <TitleHelmet title="Brand List" />
      <Card className="m-1">
        <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
          <h4 className="mb-0">
            Brand List
            {user?.role_level === 'hotel_admin' && (
              <span className="text-muted ms-2">(Your Hotel)</span>
            )}
          </h4>
          {user?.role_level === 'superadmin' && (
            <Button variant="success" onClick={() => setShowAddBrandModal(true)} disabled={loading}>
              <i className="bi bi-plus"></i> Add Brand
            </Button>
          )}
        </div>
        <div className="p-3">
          <div className="mb-3">
            <input
              type="text"
              className="form-control rounded-pill"
              placeholder="Search..."
              value={searchTerm}
              onChange={onSearchChange}
              style={{ width: '350px', borderColor: '#ccc', borderWidth: '2px' }}
            />
          </div>
          {loading ? (
            <Stack className="align-items-center justify-content-center flex-grow-1 h-100">
              <Preloader />
            </Stack>
          ) : (
            <>
              <Table responsive>
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          style={{ width: header.column.columnDef.size, textAlign: header.id === 'actions' ? 'left' : 'center' }}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row) => (
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
                    Showing {table.getRowModel().rows.length} of {filteredHotelMasters.length} entries
                  </span>
                </div>
                <Pagination>
                  <Pagination.Prev
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  />
                  {getPaginationItems()}
                  <Pagination.Next
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  />
                </Pagination>
              </Stack>
            </>
          )}
        </div>
      </Card>
      <AddHotelMastersModal
        show={showAddBrandModal}
        onHide={() => setShowAddBrandModal(false)}
        onSuccess={fetchHotelMasters}
      />
      <EditHotelMastersModal
        show={showEditBrandModal}
        onHide={() => setShowEditBrandModal(false)}
        HotelMasters={selectedHotelMasters}
        onSuccess={fetchHotelMasters}
        onUpdateSelectedHotelMasters={setSelectedHotelMasters}
      />
      <BannerManagementModal show={showBannerModal} onHide={() => setShowBannerModal(false)} brandId={selectedBrand?.id || ''} />
      <SettingsModal show={showSettingsModal} onHide={() => setShowSettingsModal(false)} brandId={selectedBrand?.id || ''} />
      <DigitalOrderModal show={showDigitalOrderModal} onHide={() => setShowDigitalOrderModal(false)} brandId={selectedBrand?.id || ''} />
      <UserManagementModal 
        show={showUserManagementModal} 
        onHide={() => setShowUserManagementModal(false)} 
        brand={selectedBrand}
        onSuccess={fetchHotelMasters}
      />
      <RegisterUserModal
        show={showRegisterUserModal}
        onHide={() => setShowRegisterUserModal(false)}
        brand={selectedBrand}
        onSuccess={fetchHotelMasters}
      />
    </>
  );
};


interface AddHotelMastersModalProps {
  show: boolean;
  onHide: () => void;
  onSuccess: () => void;
}

const AddHotelMastersModal: React.FC<AddHotelMastersModalProps> = ({ show, onHide, onSuccess }) => {
  const [hotel_name, setHotelName] = useState<string>('');
  const [short_name, setShortName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [fssai_no, setFssaiNo] = useState<string>('');
  const [trn_gstno, setTrnGstNo] = useState<string>('');
  const [panno, setPanNo] = useState<string>('');
  const [image, setImage] = useState<File | null>(null);
  const [website, setWebsite] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [status, setStatus] = useState('Active'); // Default to 'Active'

  const [markets, setMarkets] = useState<MarketItem[]>([]);
  const [, setMarketName] = useState<string>('');
  const [marketid, setMarketId] = useState<number | null>(null);

  const [states, setStates] = useState<StateItem[]>([]);
  const [stateid, setStateId] = useState<number | null>(null);

  const [hoteltype, setHoteltype] = useState<HotelTypeItem[]>([]);
  const [hoteltypeid, setHoteltypeid] = useState<number | null>(null);



  // Fetch states and markets when modal opens
  useEffect(() => {
    if (show) {
      fetchMarkets(setMarkets, setMarketId, marketid ?? undefined);
      fetchStates(setStates, setStateId, stateid ?? undefined);
      fetchHotelType(setHoteltype, setHoteltypeid, hoteltypeid ?? undefined);
    }
  }, [show]);



  const handleAdd = async () => {
    if (!hotel_name || !short_name || !phone || !fssai_no || !trn_gstno || !panno || !website || !address || !status) {
      toast.error('HotelMasters details are required');
      return;
    }

    setLoading(true);
    try {
      const statusValue = status === 'Active' ? 0 : 1;
      const currentDate = new Date().toISOString(); // Timestamp: e.g., 2025-07-01T04:00:00.000Z
      const payload = {
        hotel_name,
        marketid,
        short_name,
        phone,
        email,
        fssai_no,
        trn_gstno,
        panno,
        website,
        address,
        stateid,
        hoteltypeid,
        status: statusValue,
        created_by_id: 1, // Default to null (or 0 if backend requires)
        created_date: currentDate,
      };
      console.log('Sending to backend:', payload); // Debug log
      const res = await fetch('http://localhost:3001/api/HotelMasters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success('HotelMasters added successfully');
        setHotelName(''); setShortName(''); setMarketName(''); setPhone(''); setEmail(''); setFssaiNo(''); setTrnGstNo(''); setPanNo(''); setImage(null); setWebsite(''); setAddress('');
        setStatus('Active'); // Reset to 'Active' after successful add
        onSuccess();
        onHide();
      } else {
        const errorData = await res.json();
        console.log('Backend error:', errorData); // Debug log
        toast.error('Failed to add HotelMasters');
      }
    } catch (err) {
      console.error('Add HotelMasters error:', err); // Debug log
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  if (!show) return null;

 return (
    <div
      className="modal"
      style={{
        display: show ? 'block' : 'none',
        background: 'rgba(0,0,0,0.5)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      <div
        className="modal-content"
        style={{
          background: 'white',
          padding: '20px',
          maxWidth: '800px',
          margin: '100px auto',
          borderRadius: '8px',
        }}
      >
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">Add Hotel</h5>
          <button className="btn-close" onClick={onHide} disabled={loading}></button>
        </div>
        <div className="row mb-3">
          <div className="col-md-6">
            <label className="form-label">
              Market Name <span style={{ color: 'red' }}>*</span>
            </label>
            <select
              className="form-control"
              value={marketid ?? ''}
              onChange={(e) => {
                const value = e.target.value;
                setMarketId(value === '' ? null : Number(value));
              }}
              disabled={loading}
            >
              <option value="">Select a market</option>
              {markets.map((market) => (
                <option key={market.marketid} value={market.marketid}>
                  {market.market_name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label">
              Hotel Type <span style={{ color: 'red' }}>*</span>
            </label>
            <select
              className="form-control"
              value={hoteltypeid ?? ''}
              onChange={(e) => {
                const value = e.target.value;
                setHoteltypeid(value === '' ? null : Number(value));
              }}
             
            >
              <option value="">Select a hotel type</option>
              {hoteltype.map((hoteltype) => (
                <option key={hoteltype.hoteltypeid} value={hoteltype.hoteltypeid}>
                  {hoteltype.hotel_type}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="d-flex">
          <div className="col-md-6 pe-3">
            <div className="mb-3">
              <label className="form-label">
                Hotel Name <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                className="form-control"
                value={hotel_name}
                onChange={(e) => setHotelName(e.target.value)}
                placeholder="ENTER HOTEL NAME"
                disabled={loading}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">
                State Name <span style={{ color: 'red' }}>*</span>
              </label>
              <select
                className="form-control"
                value={stateid ?? ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setStateId(value === '' ? null : Number(value));
                }}
                disabled={loading}
              >
                <option value="">Select a state</option>
                {states.map((state) => (
                  <option key={state.stateid} value={state.stateid}>
                    {state.state_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label">Phone</label>
              <input
                type="text"
                className="form-control"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="PHONE"
                disabled={loading}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">FSSAI NO</label>
              <input
                type="text"
                className="form-control"
                value={fssai_no}
                onChange={(e) => setFssaiNo(e.target.value)}
                placeholder="FSSAI NO"
                disabled={loading}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">PAN No.</label>
              <input
                type="text"
                className="form-control"
                value={panno}
                onChange={(e) => setPanNo(e.target.value)}
                placeholder="PAN NO."
                disabled={loading}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">TRN / GST NO.</label>
              <input
                type="text"
                className="form-control"
                value={trn_gstno}
                onChange={(e) => setTrnGstNo(e.target.value)}
                placeholder="TRN / GST NO."
                disabled={loading}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">
                Status <span style={{ color: 'red' }}>*</span>
              </label>
              <select
                className="form-control"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={loading}
              >
                <option value="0">Active</option>
                <option value="1">Inactive</option>
              </select>
            </div>
          </div>
          <div className="col-md-6 ps-3">
            <div className="mb-3">
              <label className = "form-label">
                Short Name <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                className="form-control"
                value={short_name}
                onChange={(e) => setShortName(e.target.value)}
                placeholder="ENTER SHORT NAME"
                disabled={loading}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Address</label>
              <textarea
                className="form-control"
                style={{ resize: 'vertical' }}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="ADDRESS"
                rows={4}
                disabled={loading}
              ></textarea>
            </div>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="EMAIL"
                disabled={loading}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Website</label>
              <input
                type="text"
                className="form-control"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="WEBSITE"
                disabled={loading}

              />
            </div>
           
            <div className="mb-3">
              <label className="form-label">Image</label>
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  value={image ? image.name : ''}
                  placeholder="Choose a File or Drop it Here"
                  readOnly
                  disabled={loading}
                />
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => document.getElementById('fileInputAdd')?.click()}
                  disabled={loading}
                >
                  Browse
                </button>
                <input
                  id="fileInputAdd"
                  type="file"
                  hidden
                  onChange={(e) => handleImageChange(e)}
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="d-flex justify-content-end mt-4">
          <button className="btn btn-success me-2" onClick={handleAdd} disabled={loading}>
            {loading ? 'Adding...' : 'Create'}
          </button>
          <button className="btn btn-danger" onClick={onHide} disabled={loading}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
interface EditHotelMastersModalProps {
  show: boolean;
  onHide: () => void;
  HotelMasters: HotelMastersItem | null;
  onSuccess: () => void;
  onUpdateSelectedHotelMasters: (HotelMasters: HotelMastersItem) => void;
}

const EditHotelMastersModal: React.FC<EditHotelMastersModalProps> = ({ show, onHide, HotelMasters, onSuccess, onUpdateSelectedHotelMasters }) => {
  const [hotel_name, setHotelName] = useState<string>('');
  const [short_name, setShortName] = useState<string>('');
  const [marketid, setMarketid] = useState<number | null>(null);
  const [, setHotelid] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [fssai_no, setFssaiNo] = useState<string>('');
  const [trn_gstno, setTrnGstNo] = useState<string>('');
  const [panno, setPanNo] = useState<string>('');
  const [image, setImage] = useState<File | null>(null);
  const [website, setWebsite] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [stateid, setStateId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [status, setStatus] = useState('active'); // Default to 'Active'
  const [markets, setMarkets] = useState<MarketItem[]>([]);
  const [states, setStates] = useState<StateItem[]>([]);
  const [hoteltype, setHoteltype] = useState<HotelTypeItem[]>([]);
  const [hoteltypeid, setHoteltypeid] = useState<number | null>(null);







  useEffect(() => {
    if (HotelMasters) {
      setHotelName(HotelMasters.hotel_name || '');
      setShortName(HotelMasters.short_name || '');
      setMarketid(Number(HotelMasters.marketid) || 0); // or undefined, depending on useState default
      setHotelid(HotelMasters.hotelid ||  '');
      setPhone(HotelMasters.phone || '');
      setEmail(HotelMasters.email || '');
      setFssaiNo(HotelMasters.fssai_no || '');
      setTrnGstNo(HotelMasters.trn_gstno || '');
      setPanNo(HotelMasters.panno || '');
      setImage(null);
      setWebsite(HotelMasters.website || '');
      setAddress(HotelMasters.address || '');
      setHoteltypeid(Number(HotelMasters.hoteltypeid) || 0);
      setStateId(Number(HotelMasters.stateid) || 0); // fallback to 0 if falsy
      setStatus(String(HotelMasters.status) === '0' ? 'Active' : 'Inactive');
      console.log('Edit HotelMasters status:', HotelMasters.status, typeof HotelMasters.status); // Debug log

    }
  }, [HotelMasters]);

  // Fetch states and markets when modal opens
  useEffect(() => {
    if (show) {
      fetchMarkets(setMarkets, setMarketid, marketid ?? undefined);
      fetchStates(setStates, setStateId, stateid ?? undefined);
      fetchHotelType(setHoteltype, setHoteltypeid, hoteltypeid ?? undefined);
    }
  }, [show]);


  const handleEdit = async () => {
    if (!hotel_name || !short_name || !marketid || !phone || !email || !fssai_no || !trn_gstno || !panno || !website || !address || !stateid || !hoteltypeid || !status || !HotelMasters) {
      toast.error('All required fields must be filled');
      setLoading(false);
      return;
    }

    const hotelId = HotelMasters?.hotelid || HotelMasters?.hotelid;
    if (!hotelId || isNaN(Number(hotelId))) {
      toast.error('Invalid Hotel ID');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const statusValue = status === 'Active' ? 0 : 1; // Convert status to numeric value
      const currentDate = new Date().toISOString();
      const payload = {
        hotel_name,
        marketid,
        short_name,
        phone,
        email,
        fssai_no,
        trn_gstno,
        panno,
        website,
        address,
        stateid,
        hoteltypeid,
        status: statusValue,
        hotelid: hotelId,
        updated_by_id: '2',
        updated_date: currentDate,
      };

      console.log('Sending to backend:', payload); // Debug payload
      const res = await fetch(`http://localhost:3001/api/HotelMasters/${hotelId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const text = await res.text(); // Get raw response
      console.log('Raw response:', text); // Debug raw response

      if (!res.ok) {
        let errorData;
        try {
          errorData = JSON.parse(text);
        } catch (e) {
          console.error('Failed to parse response as JSON:', text);
          toast.error('Server returned an invalid response');
          setLoading(false);
          return;
        }
        console.error('Backend error:', errorData);
        toast.error(`Failed to update HotelMasters: ${errorData.message || 'Unknown error'}`);
        setLoading(false);
        return;
      }

      toast.success('HotelMasters updated successfully');
      const updatedHotelMasters = {
        ...HotelMasters,
        hotel_name,
        status: statusValue.toString(),
        updated_by_id: '2',
        updated_date: currentDate,
        hotelid: hotelId,

      };
      onUpdateSelectedHotelMasters(updatedHotelMasters);
      onSuccess();
      onHide();
    } catch (err) {
      if (err instanceof Error) {
        console.error('Edit HotelMasters error:', err.message, err.stack);
        toast.error('Something went wrong: ' + err.message);
      } else {
        console.error('Edit HotelMasters error:', err);
        toast.error('Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  };
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  if (!show || !HotelMasters) return null;



  return (
    <div
      className="modal"
      style={{
        display: show ? 'block' : 'none',
        background: 'rgba(0,0,0,0.5)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      <div
        className="modal-content"
        style={{
          background: 'white',
          padding: '20px',
          maxWidth: '800px',
          margin: '100px auto',
          borderRadius: '8px',
        }}
      >
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">{HotelMasters ? 'Edit Hotel' : 'Add Hotel'}</h5>
          <button className="btn-close" onClick={onHide} disabled={loading}></button>
        </div>
        <div className="row mb-3">
          <div className="col-md-6">
            <label className="form-label">
              Market Name <span style={{ color: 'red' }}>*</span>
            </label>
            <select
              className="form-control"
              value={marketid ?? ''}
              onChange={(e) => {
                const value = e.target.value;
                setMarketid(value === '' ? null : Number(value));
              }}
              disabled={loading}
            >
              <option value="">Select a market</option>
              {markets.map((market) => (
                <option key={market.marketid} value={market.marketid}>
                  {market.market_name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label">
              Hotel Type <span style={{ color: 'red' }}>*</span>
            </label>
            <select
              className="form-control"
              value={hoteltypeid ?? ''}
              onChange={(e) => {
                const value = e.target.value;
                setHoteltypeid(value === '' ? null : Number(value));
              }}
              disabled={loading}
            >
              <option value="">Select a hotel type</option>
              {hoteltype.map((hoteltype) => (
                <option key={hoteltype.hoteltypeid} value={hoteltype.hoteltypeid}>
                  {hoteltype.hotel_type}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="d-flex">
          <div className="col-md-6 pe-3">
            <div className="mb-3">
              <label className="form-label">
                Hotel Name <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                className="form-control"
                value={hotel_name}
                onChange={(e) => setHotelName(e.target.value)}
                placeholder="ENTER HOTEL NAME"
                disabled={loading}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">
                State Name <span style={{ color: 'red' }}>*</span>
              </label>
              <select
                className="form-control"
                value={stateid ?? ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setStateId(value === '' ? null : Number(value));
                }}
                disabled={loading}
              >
                <option value="">Select a state</option>
                {states.map((state) => (
                  <option key={state.stateid} value={state.stateid}>
                    {state.state_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label">Phone</label>
              <input
                type="text"
                className="form-control"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="PHONE"
                disabled={loading}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">FSSAI NO</label>
              <input
                type="text"
                className="form-control"
                value={fssai_no}
                onChange={(e) => setFssaiNo(e.target.value)}
                placeholder="FSSAI NO"
                disabled={loading}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">PAN No.</label>
              <input
                type="text"
                className="form-control"
                value={panno}
                onChange={(e) => setPanNo(e.target.value)}
                placeholder="PAN NO."
                disabled={loading}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">TRN / GST NO.</label>
              <input
                type="text"
                className="form-control"
                value={trn_gstno}
                onChange={(e) => setTrnGstNo(e.target.value)}
                placeholder="TRN / GST NO."
                disabled={loading}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">
                Status <span style={{ color: 'red' }}>*</span>
              </label>
              <select
                className="form-control"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={loading}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="col-md-6 ps-3">
            <div className="mb-3">
              <label className="form-label">
                Short Name <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                className="form-control"
                value={short_name}
                onChange={(e) => setShortName(e.target.value)}
                placeholder="ENTER SHORT NAME"
                disabled={loading}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Address</label>
              <textarea
                className="form-control"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="ADDRESS"
                rows={4}
                disabled={loading}
                style={{ resize: 'vertical' }}
              ></textarea>
            </div>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="EMAIL"
                disabled={loading}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Website</label>
              <input
                type="text"
                className="form-control"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="WEBSITE"
                disabled={loading}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Image</label>
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  value={image ? image.name : HotelMasters?.image || ''}
                  placeholder="Choose a File or Drop it Here"
                  readOnly
                  disabled={loading}
                />
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => document.getElementById(HotelMasters ? 'fileInputEdit' : 'fileInputAdd')?.click()}
                  disabled={loading}
                >
                  Browse
                </button>
                <input
                  id={HotelMasters ? 'fileInputEdit' : 'fileInputAdd'}
                  type="file"
                  hidden
                  onChange={handleImageChange}
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="d-flex justify-content-end mt-4">
          <button
            className="btn btn-success me-2"
            onClick={handleEdit}
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Save'}
          </button>
          <button className="btn btn-danger" onClick={onHide} disabled={loading}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
const BannerManagementModal: React.FC<{
  show: boolean;
  onHide: () => void;
  brandId: string;
}> = ({ show, onHide, brandId }) => {
  const [file, setFile] = useState<File | null>(null);

  if (!show) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return toast.error('Please select a file.');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('brand_id', brandId);
    // You may want to implement the actual upload logic here
    toast.success('Banner uploaded (mock)');
  };

  return (
    <div
      className="modal"
      style={{ display: 'block', background: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div
        className="modal-content"
        style={{ background: 'white', padding: '20px', maxWidth: '600px', margin: '100px auto', borderRadius: '8px' }}
      >
        <div className="d-flex justify-content-between align-items-center mb-3" style={{ background: '#f5f5f5', padding: '10px' }}>
          <h5 className="mb-0">Banner Add / Update</h5>
          <button className="btn-close" style={{ color: 'green' }} onClick={onHide}></button>
        </div>
        <p style={{ color: 'red', marginBottom: '20px' }}>Banner upload limit: 5 and Image size: 600x400</p>
        <div className="input-group mb-3">
          <input
            type="text"
            className="form-control"
            value={file ? file.name : ''}
            placeholder="Choose a File or Drop it Here"
            readOnly
            style={{ borderColor: 'red' }}
          />
          <button
            className="btn btn-outline-secondary"
            onClick={() => document.getElementById('fileInputBanner')?.click()}
          >
            Browse
          </button>
          <input id="fileInputBanner" type="file" hidden onChange={handleFileChange} />
        </div>
        <div className="d-flex justify-content-end">
          <button className="btn btn-success me-2" onClick={handleUpload}>
            Upload
          </button>
          <button className="btn btn-danger" onClick={onHide}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const SettingsModal: React.FC<{
  show: boolean;
  onHide: () => void;
  brandId: string;
}> = ({ show, onHide, brandId }) => {
  const [pickup, setPickup] = useState(false);
  const [delivery, setDelivery] = useState(false);
  const [selectOutlet, setSelectOutlet] = useState(true);
  const [allowMultipleTax, setAllowMultipleTax] = useState(false);
  const [addressType, setAddressType] = useState('manual');
  const [enableLoyalty, setEnableLoyalty] = useState(false);

  if (!show) return null;

  const handleUpdate = () => {
    toast.success('Settings updated (mock)');
    onHide();
  };

  return (
    <div
      className="modal"
      style={{ display: 'block', background: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div
        className="modal-content"
        style={{ background: 'white', padding: '20px', maxWidth: '600px', margin: '100px auto', borderRadius: '8px' }}
      >
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">Settings</h5>
          <button className="btn-close" style={{ color: 'green' }} onClick={onHide}></button>
        </div>
        <div className="mb-3">
          <div className="form-check form-switch mb-2">
            <input
              className="form-check-input"
              type="checkbox"
              checked={pickup}
              onChange={(e) => setPickup(e.target.checked)}
            />
            <label className="form-check-label">Pickup</label>
          </div>
          <div className="form-check form-switch mb-2">
            <input
              className="form-check-input"
              type="checkbox"
              checked={delivery}
              onChange={(e) => setDelivery(e.target.checked)}
            />
            <label className="form-check-label">Delivery</label>
          </div>
          <div className="form-check form-switch mb-2">
            <input
              className="form-check-input"
              type="checkbox"
              checked={selectOutlet}
              onChange={(e) => setSelectOutlet(e.target.checked)}
            />
            <label className="form-check-label">Select Outlet Manually</label>
          </div>
          <div className="form-check form-switch mb-2">
            <input
              className="form-check-input"
              type="checkbox"
              checked={allowMultipleTax}
              onChange={(e) => setAllowMultipleTax(e.target.checked)}
            />
            <label className="form-check-label">Allow Multiple Tax</label>
          </div>
          <div className="mb-2">
            <label className="form-label">Address Selection Type</label>
            <div className="form-check">
              <input
                className="form-check-input"
                type="radio"
                name="addressType"
                value="manual"
                checked={addressType === 'manual'}
                onChange={(e) => setAddressType(e.target.value)}
              />
              <label className="form-check-label">Manually Select Address</label>
            </div>
            <div className="form-check">
              <input
                className="form-check-input"
                type="radio"
                name="addressType"
                value="map"
                checked={addressType === 'map'}
                onChange={(e) => setAddressType(e.target.value)}
              />
              <label className="form-check-label">Map Location</label>
            </div>
          </div>
          <hr />
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              checked={enableLoyalty}
              onChange={(e) => setEnableLoyalty(e.target.checked)}
            />
            <label className="form-check-label">Enable Loyalty</label>
          </div>
        </div>
        <div className="d-flex justify-content-end">
          <button className="btn btn-success me-2" onClick={handleUpdate}>
            Update
          </button>
          <button className="btn btn-danger" onClick={onHide}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const DigitalOrderModal: React.FC<{
  show: boolean;
  onHide: () => void;
  brandId: string;
}> = ({ show, onHide, brandId }) => {
  const [themePreset, setThemePreset] = useState('');
  const [webPageColor, setWebPageColor] = useState('#000000');
  const [headerColor, setHeaderColor] = useState('#000000');
  const [itemColor, setItemColor] = useState('#000000');
  const [fontStyle, setFontStyle] = useState('');
  const [buttonColor, setButtonColor] = useState('#000000');
  const [categoryColor, setCategoryColor] = useState('#000000');

  if (!show) return null;

  const handleSubmit = () => {
    toast.success('Theme settings saved (mock)');
  };

  return (
    <div
      className="modal"
      style={{ display: 'block', background: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div
        className="modal-content"
        style={{ background: 'white', padding: '20px', maxWidth: '800px', margin: '100px auto', borderRadius: '8px' }}
      >
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">Themes Settings</h5>
          <div>
            <button className="btn btn-dark me-2">Google Font Link</button>
            <button className="btn btn-dark">Color Reference</button>
          </div>
        </div>
        <div className="row mb-3">
          <div className="col-md-6">
            <label className="form-label">Theme Presets</label>
            <select
              className="form-control"
              value={themePreset}
              onChange={(e) => setThemePreset(e.target.value)}
            >
              <option value="">Select Preset</option>
              <option value="preset1">Preset 1</option>
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label">Main Background Color:</label>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="text"
                className="form-control"
                value="Web Page Color"
                readOnly
                style={{ backgroundColor: '#f0f0f0', marginRight: '10px' }}
              />
              <input
                type="color"
                value={webPageColor}
                onChange={(e) => setWebPageColor(e.target.value)}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: 'none',
                  padding: '0',
                  cursor: 'pointer',
                  background: 'transparent',
                }}
              />
            </div>
          </div>
        </div>
        <div className="row mb-3">
          <div className="col-md-6">
            <label className="form-label">Background Color:</label>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="text"
                className="form-control"
                value="Header / Slider / Items"
                readOnly
                style={{ backgroundColor: '#f0f0f0', marginRight: '10px' }}
              />
              <input
                type="color"
                value={headerColor}
                onChange={(e) => setHeaderColor(e.target.value)}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: 'none',
                  padding: '0',
                  cursor: 'pointer',
                  background: 'transparent',
                }}
              />
            </div>
          </div>
          <div className="col-md-6">
            <label className="form-label">Font / Text Color:</label>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="text"
                className="form-control"
                value="Item / Price / Desc"
                readOnly
                style={{ backgroundColor: '#f0f0f0', marginRight: '10px' }}
              />
              <input
                type="color"
                value={itemColor}
                onChange={(e) => setItemColor(e.target.value)}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: 'none',
                  padding: '0',
                  cursor: 'pointer',
                  background: 'transparent',
                }}
              />
            </div>
          </div>
        </div>
        <div className="row mb-3">
          <div className="col-md-6">
            <label className="form-label">Google Font Style:</label>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="text"
                className="form-control"
                value={fontStyle}
                onChange={(e) => setFontStyle(e.target.value)}
                placeholder="Google Font"
                style={{ marginRight: '10px' }}
              />
              <span style={{ marginLeft: '10px' }}>Font Style</span>
            </div>
          </div>
          <div className="col-md-6">
            <label className="form-label">Primary Color:</label>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="text"
                className="form-control"
                value="Image Placeholder / Button Color"
                readOnly
                style={{ backgroundColor: '#f0f0f0', marginRight: '10px' }}
              />
              <input
                type="color"
                value={buttonColor}
                onChange={(e) => setButtonColor(e.target.value)}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: 'none',
                  padding: '0',
                  cursor: 'pointer',
                  background: 'transparent',
                }}
              />
            </div>
          </div>
        </div>
        <div className="row mb-3">
          <div className="col-md-6">
            <label className="form-label">Secondary Color:</label>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="text"
                className="form-control"
                value="Category Color"
                readOnly
                style={{ backgroundColor: '#f0f0f0', marginRight: '10px' }}
              />
              <input
                type="color"
                value={categoryColor}
                onChange={(e) => setCategoryColor(e.target.value)}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: 'none',
                  padding: '0',
                  cursor: 'pointer',
                  background: 'transparent',
                }}
              />
            </div>
          </div>
        </div>
        <div className="d-flex justify-content-end">
          <button className="btn btn-success me-2" onClick={handleSubmit}>
            Submit
          </button>
          <button className="btn btn-dark" onClick={onHide}>
            Back
          </button>
        </div>
      </div>
    </div>
  );
};

// User Management Modal Component
interface UserManagementModalProps {
  show: boolean;
  onHide: () => void;
  brand: HotelMastersItem | null;
  onSuccess: () => void;
}

const UserManagementModal: React.FC<UserManagementModalProps> = ({ show, onHide, brand, onSuccess }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch users for this brand
  const fetchUsers = async () => {
    if (!brand) return;
    
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:3001/api/users?brand_id=${brand.hotelid || brand.hotelid}`);
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (show && brand) {
      fetchUsers();
    }
  }, [show, brand]);

  if (!show || !brand) return null;

  return (
    <div
      className="modal"
      style={{
        display: show ? 'block' : 'none',
        background: 'rgba(0,0,0,0.5)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      <div
        className="modal-content"
        style={{
          background: 'white',
          padding: '20px',
          maxWidth: '1000px',
          margin: '50px auto',
          borderRadius: '8px',
          maxHeight: '80vh',
          overflow: 'auto'
        }}
      >
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">User Management - {brand.Hotel_name}</h5>
          <button className="btn-close" onClick={onHide}></button>
        </div>

        <div className="mb-3">
          <button 
            className="btn btn-success"
            onClick={() => setShowAddUserModal(true)}
          >
            <i className="bi bi-plus"></i> Add Hotel Admin
          </button>
        </div>

        {loading ? (
          <div className="text-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.userid}>
                    <td>{user.username}</td>
                    <td>{user.full_name}</td>
                    <td>{user.email}</td>
                    <td>{user.role_level}</td>
                    <td>
                      <span className={`badge ${user.is_active ? 'bg-success' : 'bg-danger'}`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-sm btn-warning me-1">
                        <i className="fi fi-rr-edit"></i>
                      </button>
                      <button className="btn btn-sm btn-danger">
                        <i className="fi fi-rr-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-muted">
                      No users found for this hotel
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="d-flex justify-content-end mt-3">
          <button className="btn btn-secondary" onClick={onHide}>
            Close
          </button>
        </div>
      </div>

      {/* Add User Modal */}
      <AddUserModal
        show={showAddUserModal}
        onHide={() => setShowAddUserModal(false)}
        brand={brand}
        onSuccess={() => {
          fetchUsers();
          onSuccess();
        }}
      />
    </div>
  );
};

// Add User Modal Component
interface AddUserModalProps {
  show: boolean;
  onHide: () => void;
  brand: HotelMastersItem | null;
  onSuccess: () => void;
}

const AddUserModal: React.FC<AddUserModalProps> = ({ show, onHide, brand, onSuccess }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!brand || !username || !email || !password || !fullName) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      // Ensure we have valid integer IDs for foreign key constraints
      const hotelId = parseInt(brand.hotelid || brand.hotelid);
      if (!hotelId || isNaN(hotelId)) {
        toast.error('Invalid hotel ID. Please try again.');
        return;
      }

      const payload = {
        username,
        email,
        password,
        full_name: fullName,
        phone,
        role_level: 'hotel_admin',
        brand_id: hotelId,
        hotelid: hotelId, // Changed from hotel_id to hotelid
        created_by_id: 1 // SuperAdmin ID
      };

      const res = await fetch('http://localhost:3001/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success('Hotel Admin created successfully!');
        toast.success(`Username: ${username}, Password: ${password}`);
        setUsername('');
        setEmail('');
        setPassword('');
        setFullName('');
        setPhone('');
        onSuccess();
        onHide();
      } else {
        const error = await res.json();
        toast.error(error.message || 'Failed to create user');
      }
    } catch (err) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (!show || !brand) return null;

  return (
    <div
      className="modal"
      style={{
        display: show ? 'block' : 'none',
        background: 'rgba(0,0,0,0.5)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1050
      }}
    >
      <div
        className="modal-content"
        style={{
          background: 'white',
          padding: '20px',
          maxWidth: '500px',
          margin: '100px auto',
          borderRadius: '8px'
        }}
      >
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">Add Hotel Admin - {brand.Hotel_name}</h5>
          <button className="btn-close" onClick={onHide}></button>
        </div>

        <div className="mb-3">
          <label className="form-label">
            Username <span style={{ color: 'red' }}>*</span>
          </label>
          <input
            type="text"
            className="form-control"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            disabled={loading}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">
            Full Name <span style={{ color: 'red' }}>*</span>
          </label>
          <input
            type="text"
            className="form-control"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter full name"
            disabled={loading}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">
            Email <span style={{ color: 'red' }}>*</span>
          </label>
          <input
            type="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email"
            disabled={loading}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">
            Password <span style={{ color: 'red' }}>*</span>
          </label>
          <input
            type="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            disabled={loading}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Phone</label>
          <input
            type="text"
            className="form-control"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter phone number"
            disabled={loading}
          />
        </div>

        <div className="d-flex justify-content-end gap-2">
          <button className="btn btn-secondary" onClick={onHide} disabled={loading}>
            Cancel
          </button>
          <button className="btn btn-success" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Creating...' : 'Create Hotel Admin'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BrandList;