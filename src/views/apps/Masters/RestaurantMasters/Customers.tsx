import React, { useState, useCallback, useEffect, useMemo } from 'react';
import Swal from 'sweetalert2';
import { toast } from 'react-hot-toast';
import { Preloader } from '@/components/Misc/Preloader';
import { Button, Card, Stack, Table } from 'react-bootstrap';
import TitleHelmet from '@/components/Common/TitleHelmet';
import { useAuthContext } from '@/common';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table';
import {
  fetchStates,
  StateItem,
  fetchCities,
  CityItem,
} from '../../../../utils/commonfunction';

// Define the Customer interface
interface Customer {
  customerid: number;
  name: string;
  countryCode: string;
  mobile: string;
  mail: string;
  cityid: string;
  city_name: string;
  address1: string;
  address2?: string;
  stateid: string;
  state_name: string;
  pincode?: string;
  gstNo?: string;
  fssai?: string;
  panNo?: string;
  aadharNo?: string;
  birthday?: string;
  anniversary?: string;
  createWallet?: boolean;
  created_by_id?: number;
  created_date?: string;
  updated_by_id?: number;
  updated_date?: string;
}

// Debounce utility function
const debounce = (func: (...args: any[]) => void, wait: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// AddCustomerModal Props
interface AddCustomerModalProps {
  show: boolean;
  onHide: () => void;
  onSuccess: () => void;
}

// EditCustomerModal Props
interface EditCustomerModalProps {
  show: boolean;
  onHide: () => void;
  mstcustomer: Customer | null;
  onSuccess: () => void;
  onUpdateSelectedCustomer: (mstcustomer: Customer) => void;
}

// Main CustomerPage Component
const CustomerPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showEditCustomerModal, setShowEditCustomerModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const { user } = useAuthContext();

  // Fetch customer data (READ)
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/customer', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
        setFilteredCustomers(data);
      } else {
        toast.error('Failed to fetch customer data');
      }
    } catch (err) {
      toast.error('Error fetching customer data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [user]);

  // Define table columns
  const columns = useMemo<ColumnDef<Customer>[]>(
    () => [
      {
        id: 'srNo',
        header: 'Sr No',
        size: 50,
        cell: ({ row }) => <div style={{ textAlign: 'center' }}>{row.index + 1}</div>,
      },
      {
        accessorKey: 'name',
        header: 'Name',
        size: 150,
        cell: (info) => <span>{info.getValue<string>()}</span>,
      },
      {
        accessorKey: 'mobile',
        header: 'Mobile',
        size: 150,
        cell: (info) => <span>{info.getValue<string>()}</span>,
      },
      {
        accessorKey: 'mail',
        header: 'Email',
        size: 200,
        cell: (info) => <span>{info.getValue<string>()}</span>,
      },
      {
        accessorKey: 'city_name',
        header: 'City',
        size: 150,
        cell: (info) => <span>{info.getValue<string>()}</span>,
      },
      {
        accessorKey: 'address1',
        header: 'Address 1',
        size: 200,
        cell: (info) => <span>{info.getValue<string>()}</span>,
      },
      {
        id: 'actions',
        header: 'Action',
        size: 100,
        cell: ({ row }) => (
          <div className="d-flex gap-2 justify-content-end">
            <button
              className="btn btn-sm btn-success"
              style={{ padding: '4px 8px' }}
              onClick={() => handleEditClick(row.original)}
            >
              <i className="fi fi-rr-edit"></i>
            </button>
            <button
              className="btn btn-sm btn-danger"
              onClick={() => handleDeleteCustomer(row.original)}
              style={{ padding: '4px 8px' }}
            >
              <i className="fi fi-rr-trash"></i>
            </button>
          </div>
        ),
      },
    ],
    []
  );

  // Initialize react-table
  const table = useReactTable({
    data: filteredCustomers,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  // Handle search
  const handleSearch = useCallback(
    debounce((value: string) => {
      setSearchTerm(value);
      const filtered = customers.filter((item) =>
        item.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredCustomers(filtered);
    }, 300),
    [customers]
  );

  // Handle edit button click
  const handleEditClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowEditCustomerModal(true);
  };

  // Handle delete operation (DELETE)
  const handleDeleteCustomer = async (customer: Customer) => {
    const res = await Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to recover this customer!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3E97FF',
      confirmButtonText: 'Yes, delete it!',
    });
    if (res.isConfirmed) {
      try {
        const response = await fetch(
          `http://localhost:3001/api/customer/${customer.customerid}`,
          {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
          }
        );
        if (response.ok) {
          toast.success('Customer deleted successfully');
          fetchCustomers();
          setSelectedCustomer(null);
        } else {
          toast.error('Failed to delete customer');
        }
      } catch {
        toast.error('Error deleting customer');
      }
    }
  };

  return (
    <>
      <TitleHelmet title="Customer Management" />
      <Card className="m-1">
        <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
          <h4 className="mb-0">Customer Management</h4>
          <div style={{ display: 'flex', gap: '4px' }}>
            <Button variant="success" className="me-1" onClick={() => setShowAddCustomerModal(true)}>
              <i className="bi bi-plus"></i> Add New
            </Button>
            <Button variant="primary" className="me-1">
              <i className="bi bi-upload"></i> Upload Customers
            </Button>
            <Button variant="primary">
              <i className="bi bi-download"></i> Download Customer Format
            </Button>
          </div>
        </div>
        <div className="p-3">
          <div className="mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="Search by Name"
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          {loading ? (
            <Stack className="align-items-center justify-content-center flex-grow-1 h-100">
              <Preloader />
            </Stack>
          ) : (
            <div style={{ width: '100%', overflowX: 'auto' }}>
              <Table responsive className="mb-0" style={{ tableLayout: 'auto', width: '100%' }}>
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          colSpan={header.colSpan}
                          style={{
                            width: header.column.columnDef.size,
                            whiteSpace: 'normal',
                            padding: '8px',
                            textAlign: header.id === 'actions' ? 'right' : 'center',
                          }}
                        >
                          {header.isPlaceholder ? null : (
                            <div>
                              {flexRender(header.column.columnDef.header, header.getContext())}
                            </div>
                          )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row) => (
                    <tr key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          style={{
                            whiteSpace: 'normal',
                            padding: '8px',
                            textAlign: cell.column.id === 'actions' ? 'right' : 'center',
                          }}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </div>
      </Card>
      <AddCustomerModal
        show={showAddCustomerModal}
        onHide={() => setShowAddCustomerModal(false)}
        onSuccess={fetchCustomers}
      />
      <EditCustomerModal
        show={showEditCustomerModal}
        onHide={() => {
          setShowEditCustomerModal(false);
          setSelectedCustomer(null);
        }}
        mstcustomer={selectedCustomer}
        onSuccess={fetchCustomers}
        onUpdateSelectedCustomer={setSelectedCustomer}
      />
    </>
  );
};

const AddCustomerModal: React.FC<AddCustomerModalProps> = ({ show, onHide, onSuccess }) => {
  const [name, setName] = useState<string>('');
  const [countryCode, setCountryCode] = useState<string>('+91');
  const [mobile, setMobile] = useState<string>('');
  const [mail, setMail] = useState<string>('');
  const [address1, setAddress1] = useState<string>('');
  const [address2, setAddress2] = useState<string>('');
  const [pincode, setPincode] = useState<string>('');
  const [gstNo, setGstNo] = useState<string>('');
  const [fssai, setFssai] = useState<string>('');
  const [panNo, setPanNo] = useState<string>('');
  const [aadharNo, setAadharNo] = useState<string>('');
  const [birthday, setBirthday] = useState<string>('');
  const [anniversary, setAnniversary] = useState<string>('');
  const [createWallet, setCreateWallet] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const { user } = useAuthContext();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stateid, setStateId] = useState<number | null>(null);
  const [states, setStates] = useState<StateItem[]>([]);
  const [cityid, setCityid] = useState<number | null>(null);
  const [cities, setCities] = useState<CityItem[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [stateSearch, setStateSearch] = useState<string>('');
  const [citySearch, setCitySearch] = useState<string>('');
  const [showStateDropdown, setShowStateDropdown] = useState<boolean>(false);
  const [showCityDropdown, setShowCityDropdown] = useState<boolean>(false);

  useEffect(() => {
    fetchStates(setStates, setStateId);
    fetchCities(setCities, setCityid);
    const fetchCustomers = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/customer');
        if (res.ok) {
          const data = await res.json();
          setCustomers(data);
        }
      } catch (err) {
        toast.error('Error fetching customers');
      }
    };
    fetchCustomers();
  }, []);

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const mobileValue = e.target.value;
    setMobile(mobileValue);
    setSearchTerm(mobileValue);
  };

  const resetForm = () => {
    setName('');
    setCountryCode('+91');
    setMobile('');
    setMail('');
    setAddress1('');
    setAddress2('');
    setPincode('');
    setGstNo('');
    setFssai('');
    setPanNo('');
    setAadharNo('');
    setBirthday('');
    setAnniversary('');
    setCreateWallet(false);
    setSearchTerm('');
    setStateId(null);
    setCityid(null);
    setSelectedCustomerId(null);
    setStateSearch('');
    setCitySearch('');
    setShowStateDropdown(false);
    setShowCityDropdown(false);
  };

  const handleSubmit = async () => {
    if (!name || !mobile || !mail || cityid === null || !address1) {
      toast.error('Please fill all required fields: Name, Mobile, Email, City, Address 1');
      return;
    }
    setLoading(true);
    try {
      const currentDate = new Date().toISOString();
      const payload = {
        name,
        countryCode,
        mobile,
        mail,
        cityid: cityid?.toString() ?? '',
        city_name: cities.find((c) => c.cityid === cityid)?.city_name || '',
        address1,
        address2: address2 || undefined,
        stateid: stateid?.toString() ?? '',
        state_name: states.find((s) => s.stateid === stateid)?.state_name || '',
        pincode: pincode || undefined,
        gstNo: gstNo || undefined,
        fssai: fssai || undefined,
        panNo: panNo || undefined,
        aadharNo: aadharNo || undefined,
        birthday: birthday || undefined,
        anniversary: anniversary || undefined,
        createWallet,
        created_by_id: selectedCustomerId ? undefined : user?.id || 1,
        created_date: selectedCustomerId ? undefined : currentDate,
        updated_by_id: user?.id || 1,
        updated_date: currentDate,
      };

      let res;
      if (selectedCustomerId) {
        // Update existing customer
        res = await fetch(`http://localhost:3001/api/customer/${selectedCustomerId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        // Add new customer
        res = await fetch('http://localhost:3001/api/customer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        const message = selectedCustomerId ? 'Customer updated successfully' : 'Customer added successfully';
        toast.success(message);
        resetForm();
        onSuccess();
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || `Failed to ${selectedCustomerId ? 'update' : 'add'} customer`);
      }
    } catch (err) {
      toast.error(`Error ${selectedCustomerId ? 'updating' : 'adding'} customer`);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerClick = (customer: Customer) => {
    setSelectedCustomerId(customer.customerid);
    setName(customer.name || '');
    setCountryCode(customer.countryCode || '+91');
    setMobile(customer.mobile || '');
    setMail(customer.mail || '');
    setAddress1(customer.address1 || '');
    setAddress2(customer.address2 || '');
    setStateId(customer.stateid ? Number(customer.stateid) : null);
    setCityid(customer.cityid ? Number(customer.cityid) : null);
    setPincode(customer.pincode || '');
    setGstNo(customer.gstNo || '');
    setFssai(customer.fssai || '');
    setPanNo(customer.panNo || '');
    setAadharNo(customer.aadharNo || '');
    setBirthday(customer.birthday || '');
    setAnniversary(customer.anniversary || '');
    setCreateWallet(customer.createWallet || false);
    setSearchTerm(customer.mobile || '');
    setStateSearch(customer.state_name || '');
    setCitySearch(customer.city_name || '');
    setShowStateDropdown(false);
    setShowCityDropdown(false);
  };

  const filteredCustomers = customers.filter(customer =>
    customer.mobile.includes(searchTerm)
  );

  // Filter and sort states based on search input
  const filteredStates = useMemo(() => {
    if (!stateSearch) return states.filter((s) => String(s.status) === '0');
    const lowerSearch = stateSearch.toLowerCase();
    const filtered = states.filter(
      (s) => String(s.status) === '0' && s.state_name.toLowerCase().includes(lowerSearch)
    );
    return filtered.sort((a, b) => {
      const aName = a.state_name.toLowerCase();
      const bName = b.state_name.toLowerCase();
      if (aName.startsWith(lowerSearch) && !bName.startsWith(lowerSearch)) return -1;
      if (!aName.startsWith(lowerSearch) && bName.startsWith(lowerSearch)) return 1;
      return aName.localeCompare(bName);
    });
  }, [states, stateSearch]);

  // Filter and sort cities based on search input
  const filteredCities = useMemo(() => {
    if (!citySearch) return cities.filter((c) => String(c.status) === '0');
    const lowerSearch = citySearch.toLowerCase();
    const filtered = cities.filter(
      (c) => String(c.status) === '0' && c.city_name.toLowerCase().includes(lowerSearch)
    );
    return filtered.sort((a, b) => {
      const aName = a.city_name.toLowerCase();
      const bName = b.city_name.toLowerCase();
      if (aName.startsWith(lowerSearch) && !bName.startsWith(lowerSearch)) return -1;
      if (!aName.startsWith(lowerSearch) && bName.startsWith(lowerSearch)) return 1;
      return aName.localeCompare(bName);
    });
  }, [cities, citySearch]);

  // Handle state input change
  const handleStateSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStateSearch(e.target.value);
    setShowStateDropdown(true);
    setStateId(null); // Reset stateid until an option is selected
  };

  // Handle city input change
  const handleCitySearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCitySearch(e.target.value);
    setShowCityDropdown(true);
    setCityid(null); // Reset cityid until an option is selected
  };

  // Handle state selection from dropdown
  const handleStateSelect = (state: StateItem) => {
    setStateId(state.stateid);
    setStateSearch(state.state_name);
    setShowStateDropdown(false);
  };

  // Handle city selection from dropdown
  const handleCitySelect = (city: CityItem) => {
    setCityid(city.cityid);
    setCitySearch(city.city_name);
    setShowCityDropdown(false);
  };

  if (!show) return null;

  return (
    <div
      className="modal"
      style={{
        display: 'block',
        background: 'rgba(0,0,0,0.5)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
      }}
    >
      <div
        className="modal-content bg-white"
        style={{
          padding: '20px',
          width: '60%',
          minWidth: '600px',
          margin: '30px auto',
          borderRadius: '8px',
        }}
      >
        <h3 className="mb-4" style={{ fontSize: '1.2rem' }}>
          {selectedCustomerId ? 'Edit Customer' : 'Add New Customer'}
        </h3>

        <div className="container-fluid">
          {/* First Row - Country Code and Mobile */}
          <div className="row g-2 mb-2">
            <div className="col-md-2">
              <label className="form-label" style={{ fontSize: '0.85rem' }}>Country Code</label>
              <select
                className="form-control form-control-sm"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                disabled={loading}
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
              >
                <option value="+91">+91</option>
                <option value="+1">+1</option>
                <option value="+44">+44</option>
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label" style={{ fontSize: '0.85rem' }}>Mobile *</label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Mobile number"
                value={mobile}
                onChange={handleMobileChange}
                disabled={loading}
                style={{ fontSize: '0.85rem' }}
              />
            </div>
          </div>

          {/* Second Row - Name and Email */}
          <div className="row g-2 mb-2">
            <div className="col-md-6">
              <label className="form-label" style={{ fontSize: '0.85rem' }}>Name *</label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                style={{ fontSize: '0.85rem' }}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label" style={{ fontSize: '0.85rem' }}>Email</label>
              <input
                type="email"
                className="form-control form-control-sm"
                placeholder="Email"
                value={mail}
                onChange={(e) => setMail(e.target.value)}
                disabled={loading}
                style={{ fontSize: '0.85rem' }}
              />
            </div>
          </div>

          {/* Address Fields */}
          <div className="row g-2 mb-2">
            <div className="col-md-6">
              <label className="form-label" style={{ fontSize: '0.85rem' }}>Address 1</label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Address line 1"
                value={address1}
                onChange={(e) => setAddress1(e.target.value)}
                disabled={loading}
                style={{ fontSize: '0.85rem' }}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label" style={{ fontSize: '0.85rem' }}>Address 2</label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Address line 2"
                value={address2}
                onChange={(e) => setAddress2(e.target.value)}
                disabled={loading}
                style={{ fontSize: '0.85rem' }}
              />
            </div>
          </div>

          {/* Location Fields */}
          <div className="row g-2 mb-2">
            <div className="col-md-3">
              <label className="form-label" style={{ fontSize: '0.85rem' }}>Birthday</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                disabled={loading}
                style={{ fontSize: '0.85rem' }}
              />
            </div>

            <div className="col-md-3">
              <label className="form-label" style={{ fontSize: '0.85rem' }}>State</label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Search state"
                value={stateSearch}
                onChange={handleStateSearch}
                onFocus={() => setShowStateDropdown(true)}
                onBlur={() => setTimeout(() => setShowStateDropdown(false), 200)}
                disabled={loading}
                style={{ fontSize: '0.85rem' }}
              />
              {showStateDropdown && (
                <div
                  style={{
                    position: 'absolute',
                    background: 'white',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                    maxHeight: '150px',
                    overflowY: 'auto',
                    width: 'calc(25% - 8px)',
                    zIndex: 1001,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  }}
                >
                  {filteredStates.length > 0 ? (
                    filteredStates.map((state) => (
                      <div
                        key={state.stateid}
                        onClick={() => handleStateSelect(state)}
                        style={{
                          padding: '8px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          borderBottom: '1px solid #f0f0f0',
                          background: state.stateid === stateid ? '#e9ecef' : 'white',
                        }}
                        onMouseDown={(e) => e.preventDefault()} // Prevent blur on click
                      >
                        {state.state_name}
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '8px', fontSize: '0.85rem', color: '#6c757d' }}>
                      No states found
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="col-md-3">
              <label className="form-label" style={{ fontSize: '0.85rem' }}>City</label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Search city"
                value={citySearch}
                onChange={handleCitySearch}
                onFocus={() => setShowCityDropdown(true)}
                onBlur={() => setTimeout(() => setShowCityDropdown(false), 200)}
                disabled={loading}
                style={{ fontSize: '0.85rem' }}
              />
              {showCityDropdown && (
                <div
                  style={{
                    position: 'absolute',
                    background: 'white',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                    maxHeight: '150px',
                    overflowY: 'auto',
                    width: 'calc(25% - 8px)',
                    zIndex: 1001,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  }}
                >
                  {filteredCities.length > 0 ? (
                    filteredCities.map((city) => (
                      <div
                        key={city.cityid}
                        onClick={() => handleCitySelect(city)}
                        style={{
                          padding: '8px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          borderBottom: '1px solid #f0f0f0',
                          background: city.cityid === cityid ? '#e9ecef' : 'white',
                        }}
                        onMouseDown={(e) => e.preventDefault()} // Prevent blur on click
                      >
                        {city.city_name}
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '8px', fontSize: '0.85rem', color: '#6c757d' }}>
                      No cities found
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="col-md-3">
              <label className="form-label" style={{ fontSize: '0.85rem' }}>Pincode</label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Pincode"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                disabled={loading}
                style={{ fontSize: '0.85rem' }}
              />
            </div>
          </div>

          {/* Document Fields */}
          <div className="row g-2 mb-2">
            <div className="col-md-3">
              <label className="form-label" style={{ fontSize: '0.85rem' }}>Anniversary</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={anniversary}
                onChange={(e) => setAnniversary(e.target.value)}
                disabled={loading}
                style={{ fontSize: '0.85rem' }}
              />
            </div>

            <div className="col-md-3">
              <label className="form-label" style={{ fontSize: '0.85rem' }}>Aadhar No.</label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Aadhar"
                value={aadharNo}
                onChange={(e) => setAadharNo(e.target.value)}
                disabled={loading}
                style={{ fontSize: '0.85rem' }}
              />
            </div>

            <div className="col-md-3">
              <label className="form-label" style={{ fontSize: '0.85rem' }}>GST No.</label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="GST"
                value={gstNo}
                onChange={(e) => setGstNo(e.target.value)}
                disabled={loading}
                style={{ fontSize: '0.85rem' }}
              />
            </div>

            <div className="col-md-3">
              <label className="form-label" style={{ fontSize: '0.85rem' }}>FSSAI</label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="FSSAI"
                value={fssai}
                onChange={(e) => setFssai(e.target.value)}
                disabled={loading}
                style={{ fontSize: '0.85rem' }}
              />
            </div>
          </div>

          {/* Last Row */}
          <div className="row g-2 mb-2">
            <div className="col-md-3">
              <label className="form-label" style={{ fontSize: '0.85rem' }}>PAN No.</label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="PAN"
                value={panNo}
                onChange={(e) => setPanNo(e.target.value)}
                disabled={loading}
                style={{ fontSize: '0.85rem' }}
              />
            </div>

            <div className="col-md-3 d-flex align-items-end">
              <div className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={createWallet}
                  onChange={(e) => setCreateWallet(e.target.checked)}
                  disabled={loading}
                  style={{ marginTop: '0' }}
                />
                <label className="form-check-label ms-2" style={{ fontSize: '0.85rem' }}>Create Wallet</label>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="d-flex justify-content-end mt-3">
            <button
              className="btn btn-outline-secondary btn-sm me-2"
              onClick={onHide}
              disabled={loading}
              style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}
            >
              Close
            </button>
            <button
              className="btn btn-outline-primary btn-sm me-2"
              onClick={resetForm}
              disabled={loading}
              style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}
            >
              Clear Form
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleSubmit}
              disabled={loading}
              style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}
            >
              {loading ? (selectedCustomerId ? 'Updating...' : 'Adding...') : (selectedCustomerId ? 'Update' : 'Add')}
            </button>
          </div>
        </div>

        {/* Customer List Section with scroll */}
        <div className="mt-3" style={{ fontSize: '0.85rem' }}>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h5 style={{ fontSize: '1rem' }}>Customer List</h5>
            <div className="col-md-4">
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Search by mobile..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ fontSize: '0.85rem' }}
              />
            </div>
          </div>

          <div className="table-responsive" style={{
            maxHeight: '150px',
            overflowY: 'auto',
            border: '1px solid #dee2e6',
            borderRadius: '4px'
          }}>
            <table className="table table-bordered table-sm mb-0">
              <thead style={{
                top: 0,
                background: '#f8f9fa',
                zIndex: 1,
                boxShadow: '0 2px 2px -1px rgba(0, 0, 0, 0.1)'
              }}>
                <tr>
                  <th style={{
                    fontSize: '0.85rem',
                    padding: '8px',
                    whiteSpace: 'nowrap',
                    position: 'sticky',
                    left: 0,
                    background: '#f8f9fa',
                    zIndex: 2
                  }}>Sr No</th>
                  <th style={{ fontSize: '0.85rem', padding: '8px', whiteSpace: 'nowrap' }}>C NAME</th>
                  <th style={{ fontSize: '0.85rem', padding: '8px', whiteSpace: 'nowrap' }}>MOBILE</th>
                  <th style={{ fontSize: '0.85rem', padding: '8px', whiteSpace: 'nowrap' }}>MAIL</th>
                  <th style={{ fontSize: '0.85rem', padding: '8px', whiteSpace: 'nowrap' }}>CITY</th>
                  <th style={{ fontSize: '0.85rem', padding: '8px', whiteSpace: 'nowrap' }}>ADDRESS 1</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer, index) => (
                  <tr key={customer.customerid} onClick={() => handleCustomerClick(customer)} style={{ cursor: 'pointer' }}>
                    <td style={{
                      fontSize: '0.85rem',
                      padding: '8px',
                      whiteSpace: 'nowrap',
                      position: 'sticky',
                      left: 0,
                      background: 'white',
                      zIndex: 1
                    }}>{index + 1}</td>
                    <td style={{ fontSize: '0.85rem', padding: '8px', whiteSpace: 'nowrap' }}>{customer.name}</td>
                    <td style={{ fontSize: '0.85rem', padding: '8px', whiteSpace: 'nowrap' }}>{customer.mobile}</td>
                    <td style={{ fontSize: '0.85rem', padding: '8px', whiteSpace: 'nowrap' }}>{customer.mail || '-'}</td>
                    <td style={{ fontSize: '0.85rem', padding: '8px', whiteSpace: 'nowrap' }}>{customer.city_name || '-'}</td>
                    <td style={{ fontSize: '0.85rem', padding: '8px', whiteSpace: 'nowrap' }}>{customer.address1 || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const EditCustomerModal: React.FC<EditCustomerModalProps> = ({
  show,
  onHide,
  mstcustomer,
  onSuccess,
  onUpdateSelectedCustomer,
}) => {
  const [name, setName] = useState<string>('');
  const [countryCode, setCountryCode] = useState<string>('+91');
  const [mobile, setMobile] = useState<string>('');
  const [mail, setMail] = useState<string>('');
  const [cityid, setCityid] = useState<number | null>(null);
  const [address1, setAddress1] = useState<string>('');
  const [address2, setAddress2] = useState<string>('');
  const [stateid, setStateId] = useState<number | null>(null);
  const [pincode, setPincode] = useState<string>('');
  const [gstNo, setGstNo] = useState<string>('');
  const [fssai, setFssai] = useState<string>('');
  const [panNo, setPanNo] = useState<string>('');
  const [aadharNo, setAadharNo] = useState<string>('');
  const [birthday, setBirthday] = useState<string>('');
  const [anniversary, setAnniversary] = useState<string>('');
  const [createWallet, setCreateWallet] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const { user } = useAuthContext();
  const [states, setStates] = useState<StateItem[]>([]);
  const [cities, setCities] = useState<CityItem[]>([]);

  // Fetch states and cities
  useEffect(() => {
    fetchStates(setStates, setStateId);
    fetchCities(setCities, setCityid);
  }, []);

  // Initialize form fields when mstcustomer changes
  useEffect(() => {
    if (mstcustomer) {
      setName(mstcustomer.name || '');
      setCountryCode(mstcustomer.countryCode || '+91');
      setMobile(mstcustomer.mobile || '');
      setMail(mstcustomer.mail || '');
      setCityid(mstcustomer.cityid ? Number(mstcustomer.cityid) : null);
      setAddress1(mstcustomer.address1 || '');
      setAddress2(mstcustomer.address2 || '');
      setStateId(mstcustomer.stateid ? Number(mstcustomer.stateid) : null);
      setPincode(mstcustomer.pincode || '');
      setGstNo(mstcustomer.gstNo || '');
      setFssai(mstcustomer.fssai || '');
      setPanNo(mstcustomer.panNo || '');
      setAadharNo(mstcustomer.aadharNo || '');
      setBirthday(mstcustomer.birthday || '');
      setAnniversary(mstcustomer.anniversary || '');
      setCreateWallet(mstcustomer.createWallet || false);
    }
  }, [mstcustomer]);

  // Handle form submission (UPDATE)
  const handleEdit = async () => {
    if (!mstcustomer || !name || !mobile || !mail || cityid === null || !address1) {
      toast.error('Please fill all required fields: Name, Mobile, Email, City, Address 1');
      return;
    }

    setLoading(true);
    try {
      const currentDate = new Date().toISOString();
      const payload: Customer = {
        customerid: mstcustomer.customerid,
        name,
        countryCode,
        mobile,
        mail,
        cityid: cityid.toString(),
        city_name: cities.find((c) => c.cityid === cityid)?.city_name || '',
        address1,
        address2: address2 || undefined,
        stateid: stateid?.toString() || '',
        state_name: states.find((s) => s.stateid === stateid)?.state_name || '',
        pincode: pincode || undefined,
        gstNo: gstNo || undefined,
        fssai: fssai || undefined,
        panNo: panNo || undefined,
        aadharNo: aadharNo || undefined,
        birthday: birthday || undefined,
        anniversary: anniversary || undefined,
        createWallet,
        updated_by_id: user?.id || 1,
        updated_date: currentDate,
      };

      const res = await fetch(`http://localhost:3001/api/customer/${mstcustomer.customerid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success('Customer updated successfully');
        onSuccess();
        onUpdateSelectedCustomer(payload);
        onHide();
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || 'Failed to update customer');
      }
    } catch (err) {
      toast.error('Error updating customer');
    } finally {
      setLoading(false);
    }
  };

  if (!show || !mstcustomer) return null;

  return (
    <div
      className="modal"
      style={{
        display: 'block',
        background: 'rgba(0,0,0,0.5)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1050,
      }}
    >
      <div
        className="modal-content"
        style={{
          background: 'white',
          padding: '20px',
          width: '80%',
          maxWidth: '800px',
          margin: '50px auto',
          borderRadius: '8px',
        }}
      >
        <h3>Edit Customer</h3>

        <div className="container-fluid">
          <div className="row g-3">
            {/* First Row */}
            <div className="col-md-3">
              <label className="form-label">Name <span className="text-danger">*</span></label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="col-md-3">
              <label className="form-label">Country Code</label>
              <select
                className="form-control"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                disabled={loading}
              >
                <option value="+91">India +91</option>
                <option value="+1">USA +1</option>
                <option value="+44">UK +44</option>
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label">Mobile <span className="text-danger">*</span></label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter mobile number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="col-md-3">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                placeholder="Enter email"
                value={mail}
                onChange={(e) => setMail(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Second Row */}
            <div className="col-md-3">
              <label className="form-label">Birthday</label>
              <input
                type="date"
                className="form-control"
                placeholder="dd-mm-yyyy"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="col-md-3">
              <label className="form-label">State</label>
              <select
                className="form-control"
                value={stateid ?? ''}
                onChange={(e) => setStateId(e.target.value === '' ? null : Number(e.target.value))}
                disabled={loading}
              >
                <option value="">Enter state</option>
                {states.filter((s) => String(s.status) === '0').map((s) => (
                  <option key={s.stateid} value={s.stateid}>{s.state_name}</option>
                ))}
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label">City</label>
              <select
                className="form-control"
                value={cityid ?? ''}
                onChange={(e) => setCityid(e.target.value === '' ? null : Number(e.target.value))}
                disabled={loading}
              >
                <option value="">Enter city</option>
                {cities.filter((city) => String(city.status) === '0').map((city) => (
                  <option key={city.cityid} value={city.cityid}>{city.city_name}</option>
                ))}
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label">Pincode</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter pincode"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Third Row */}
            <div className="col-md-3">
              <label className="form-label">GST No.</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter GST number"
                value={gstNo}
                onChange={(e) => setGstNo(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="col-md-3">
              <label className="form-label">FSSAI</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter FSSAI"
                value={fssai}
                onChange={(e) => setFssai(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="col-md-3">
              <label className="form-label">PAN No.</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter PAN number"
                value={panNo}
                onChange={(e) => setPanNo(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="col-md-3">
              <label className="form-label">Aadhar No.</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter Aadhar number"
                value={aadharNo}
                onChange={(e) => setAadharNo(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Fourth Row */}
            <div className="col-md-3">
              <label className="form-label">Anniversary</label>
              <input
                type="date"
                className="form-control"
                placeholder="dd-mm-yyyy"
                value={anniversary}
                onChange={(e) => setAnniversary(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="col-md-3 d-flex align-items-center">
              <div className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={createWallet}
                  onChange={(e) => setCreateWallet(e.target.checked)}
                  disabled={loading}
                />
                <label className="form-check-label ms-2">Create Wallet</label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="d-flex justify-content-end mt-4">
            <button
              className="btn btn-outline-secondary me-2"
              onClick={onHide}
              disabled={loading}
            >
              Exit
            </button>
            <button
              className="btn btn-primary"
              onClick={handleEdit}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerPage;