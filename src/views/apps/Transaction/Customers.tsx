import React, { useState, useEffect, useMemo, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { Preloader } from '@/components/Misc/Preloader';
import { Card } from 'react-bootstrap';
import TitleHelmet from '@/components/Common/TitleHelmet';
import { useAuthContext } from '@/common';
import {
  fetchStates,
  StateItem,
  fetchCities,
  CityItem,
} from '../../../utils/commonfunction';

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


// CustomersPage Component
const CustomersPage: React.FC = () => {
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
  const [states, setStates] = useState<StateItem[]>([]);
  const [cities, setCities] = useState<CityItem[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [stateSearch, setStateSearch] = useState<string>('');
  const [citySearch, setCitySearch] = useState<string>('');
  const [showStateDropdown, setShowStateDropdown] = useState<boolean>(false);
  const [showCityDropdown, setShowCityDropdown] = useState<boolean>(false);
  const stateDropdownRef = useRef<HTMLDivElement>(null);
  const cityDropdownRef = useRef<HTMLDivElement>(null);
  const [stateHighlightIndex, setStateHighlightIndex] = useState<number>(-1);
  const [cityHighlightIndex, setCityHighlightIndex] = useState<number>(-1);
  const [stateid, setStateId] = useState<number | null>(null);
  const [cityid, setCityid] = useState<number | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [, setFilteredCustomers] = useState<Customer[]>([]);

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

  useEffect(() => {
    fetchStates(setStates, setStateId).catch((err) => toast.error('Error fetching states'));
    fetchCities(setCities, setCityid).catch((err) => toast.error('Error fetching cities'));
  }, []);

  // Input handlers remain the same...
  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const mobileValue = e.target.value.replace(/\D/g, '');
    if (mobileValue.length <= 10) setMobile(mobileValue);
    setSearchTerm(mobileValue);
  };

  const handlePincodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pincodeValue = e.target.value.replace(/\D/g, '');
    if (pincodeValue.length <= 6) setPincode(pincodeValue);
  };

  const handleAadharChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const aadharValue = e.target.value.replace(/\D/g, '');
    if (aadharValue.length <= 12) setAadharNo(aadharValue);
  };

  const handlePanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const panValue = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
    if (panValue.length <= 10) setPanNo(panValue.toUpperCase());
  };

  const handleGstChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const gstValue = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
    if (gstValue.length <= 15) setGstNo(gstValue.toUpperCase());
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
    setStateHighlightIndex(-1);
    setCityHighlightIndex(-1);
  };

  const validateForm = () => {
    if (!name.trim()) {
      toast.error('Name is required');
      return false;
    }
    if (!mobile.trim()) {
      toast.error('Mobile is required');
      return false;
    }
    if (!countryCode.trim()) {
      toast.error('Country code is required');
      return false;
    }
    if (mobile && !/^\d{10}$/.test(mobile)) {
      toast.error('Mobile number must be exactly 10 digits');
      return false;
    }
    if (mail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
      toast.error('Please enter a valid email address');
      return false;
    }
    if (birthday && new Date(birthday) > new Date('2025-08-01')) {
      toast.error('Birthday cannot be in the future');
      return false;
    }
    if (anniversary && (!/^\d{4}-\d{2}-\d{2}$/.test(anniversary) || new Date(anniversary) > new Date('2025-08-01'))) {
      toast.error('Anniversary must be a valid date up to today');
      return false;
    }
    if (aadharNo && !/^\d{12}$/.test(aadharNo)) {
      toast.error('Aadhar number must be exactly 12 digits');
      return false;
    }
    if (panNo && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(panNo)) {
      toast.error('PAN number must be exactly 10 characters (e.g., ABCDE1234F)');
      return false;
    }
    if (pincode && !/^\d{6}$/.test(pincode)) {
      toast.error('Pincode must be exactly 6 digits');
      return false;
    }
    if (gstNo && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstNo)) {
      toast.error('GST number must be a valid 15-digit alphanumeric format (e.g., 22AAAAA0000A1Z5)');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
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
        res = await fetch(`http://localhost:3001/api/customer/${selectedCustomerId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('http://localhost:3001/api/customer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        const message = selectedCustomerId ? 'Customer updated successfully' : 'Customer added successfully';
        toast.success(message);
        const updatedCustomers = selectedCustomerId
          ? customers.map((c) => (c.customerid === selectedCustomerId ? { ...c, ...payload } : c))
          : [...customers, { ...payload, customerid: Date.now() } as Customer];
        setCustomers(updatedCustomers);
        resetForm();
      } else {
        const errorData = await res.json().catch(() => ({}));
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
    setStateHighlightIndex(-1);
    setCityHighlightIndex(-1);
  };

  const filteredCustomers = useMemo(() => {
    return (customers || []).filter(customer =>
      customer.mobile.includes(searchTerm)
    );
  }, [customers, searchTerm]);

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

  const handleStateSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStateSearch(e.target.value);
    setShowStateDropdown(true);
    setStateId(null);
    setStateHighlightIndex(-1);
  };

  const handleCitySearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCitySearch(e.target.value);
    setShowCityDropdown(true);
    setCityid(null);
    setCityHighlightIndex(-1);
  };

  const handleStateSelect = (state: StateItem) => {
    setStateId(state.stateid);
    setStateSearch(state.state_name);
    setShowStateDropdown(false);
    setStateHighlightIndex(-1);
  };

  const handleCitySelect = (city: CityItem) => {
    setCityid(city.cityid);
    setCitySearch(city.city_name);
    setShowCityDropdown(false);
    setCityHighlightIndex(-1);
  };

  const handleStateKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showStateDropdown || filteredStates.length === 0) return;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        setStateHighlightIndex((prev) => (prev > 0 ? prev - 1 : filteredStates.length - 1));
        break;
      case 'ArrowDown':
        e.preventDefault();
        setStateHighlightIndex((prev) => (prev < filteredStates.length - 1 ? prev + 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (stateHighlightIndex >= 0 && stateHighlightIndex < filteredStates.length) {
          handleStateSelect(filteredStates[stateHighlightIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowStateDropdown(false);
        setStateHighlightIndex(-1);
        break;
    }
  };

  const handleCityKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showCityDropdown || filteredCities.length === 0) return;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        setCityHighlightIndex((prev) => (prev > 0 ? prev - 1 : filteredCities.length - 1));
        break;
      case 'ArrowDown':
        e.preventDefault();
        setCityHighlightIndex((prev) => (prev < filteredCities.length - 1 ? prev + 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (cityHighlightIndex >= 0 && cityHighlightIndex < filteredCities.length) {
          handleCitySelect(filteredCities[cityHighlightIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowCityDropdown(false);
        setCityHighlightIndex(-1);
        break;
    }
  };

  return (
    <div className="d-flex flex-column" style={{ height: '100vh', overflow: 'hidden', background: '#f8f9fa' }}>
      <TitleHelmet title="Customers" />
      {loading && <Preloader />}
      
      <div className="container-fluid p-4 flex-grow-1 d-flex flex-column" style={{ overflow: 'auto' }}>
        <Card className="p-4 flex-grow-1 d-flex flex-column shadow-sm border-0" 
              style={{ 
                borderRadius: '12px', 
                minWidth: '600px', 
                background: 'white'
              }}>
          
          {/* Header Section */}
          <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
            <div>
              <h3 className="mb-1 fw-bold text-dark" style={{ fontSize: '1.4rem' }}>
                {selectedCustomerId ? 'Edit Customer' : 'Add New Customer'}
              </h3>
              <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
                {selectedCustomerId ? 'Update customer information' : 'Create a new customer profile'}
              </p>
            </div>
            {selectedCustomerId && (
              <span className="badge bg-primary px-3 py-2" style={{ fontSize: '0.8rem' }}>
                Editing Mode
              </span>
            )}
          </div>

          <div className="container-fluid flex-grow-1">
            {/* Compact Form Layout - No Scroll Required */}
            <div className="row g-3">
              
              {/* First Row: Country Code + Mobile + Name */}
              <div className="col-12">
                <div className="row g-3">
                  <div className="col-md-4">
                    <div className="d-flex align-items-center gap-2">
                      <label className="form-label fw-medium text-dark mb-0" style={{ fontSize: '0.85rem', whiteSpace: 'nowrap', minWidth: '100px' }}>
                        Country Code *
                      </label>
                      <select
                        className="form-control form-control-sm border-0 shadow-sm flex-grow-1"
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        disabled={loading}
                        style={{ 
                          padding: '0.5rem 0.5rem', 
                          fontSize: '0.85rem',
                          background: '#f8f9fa',
                          borderRadius: '8px',
                          height: '38px'
                        }}
                        required
                        tabIndex={1}
                      >
                        <option value="+91">+91 (IN)</option>
                        <option value="+1">+1 (US)</option>
                        <option value="+44">+44 (UK)</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="col-md-4">
                    <div className="d-flex align-items-center gap-2">
                      <label className="form-label fw-medium text-dark mb-0" style={{ fontSize: '0.85rem', whiteSpace: 'nowrap', minWidth: '100px' }}>
                        Mobile Number *
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-sm border-0 shadow-sm flex-grow-1"
                        placeholder="10-digit mobile"
                        value={mobile}
                        onChange={handleMobileChange}
                        disabled={loading}
                        style={{ 
                          fontSize: '0.85rem',
                          padding: '0.5rem 0.75rem',
                          background: '#f8f9fa',
                          borderRadius: '8px',
                          height: '38px'
                        }}
                        maxLength={10}
                        required
                        tabIndex={2}
                      />
                    </div>
                  </div>

                  <div className="col-md-4">
                    <div className="d-flex align-items-center gap-2">
                      <label className="form-label fw-medium text-dark mb-0" style={{ fontSize: '0.85rem', whiteSpace: 'nowrap', minWidth: '100px' }}>
                        Full Name *
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-sm border-0 shadow-sm flex-grow-1"
                        placeholder="Enter customer full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={loading}
                        style={{ 
                          fontSize: '0.85rem',
                          padding: '0.5rem 0.75rem',
                          background: '#f8f9fa',
                          borderRadius: '8px',
                          height: '38px'
                        }}
                        required
                        tabIndex={3}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Second Row: Email + Address Line 1 */}
              <div className="col-12">
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="d-flex align-items-center gap-2">
                      <label className="form-label fw-medium text-dark mb-0" style={{ fontSize: '0.85rem', whiteSpace: 'nowrap', minWidth: '100px' }}>
                        Email Address
                      </label>
                      <input
                        type="email"
                        className="form-control form-control-sm border-0 shadow-sm flex-grow-1"
                        placeholder="Enter email address"
                        value={mail}
                        onChange={(e) => setMail(e.target.value)}
                        disabled={loading}
                        style={{ 
                          fontSize: '0.85rem',
                          padding: '0.5rem 0.75rem',
                          background: '#f8f9fa',
                          borderRadius: '8px',
                          height: '38px'
                        }}
                        tabIndex={4}
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="d-flex align-items-center gap-2">
                      <label className="form-label fw-medium text-dark mb-0" style={{ fontSize: '0.85rem', whiteSpace: 'nowrap', minWidth: '100px' }}>
                        Address Line 1
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-sm border-0 shadow-sm flex-grow-1"
                        placeholder="Enter address line 1"
                        value={address1}
                        onChange={(e) => setAddress1(e.target.value)}
                        disabled={loading}
                        style={{ 
                          fontSize: '0.85rem',
                          padding: '0.5rem 0.75rem',
                          background: '#f8f9fa',
                          borderRadius: '8px',
                          height: '38px'
                        }}
                        tabIndex={5}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Third Row: Address Line 2 + State + City */}
              <div className="col-12">
                <div className="row g-3">
                  <div className="col-md-4">
                    <div className="d-flex align-items-center gap-2">
                      <label className="form-label fw-medium text-dark mb-0" style={{ fontSize: '0.85rem', whiteSpace: 'nowrap', minWidth: '100px' }}>
                        Address Line 2
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-sm border-0 shadow-sm flex-grow-1"
                        placeholder="Enter address line 2"
                        value={address2}
                        onChange={(e) => setAddress2(e.target.value)}
                        disabled={loading}
                        style={{ 
                          fontSize: '0.85rem',
                          padding: '0.5rem 0.75rem',
                          background: '#f8f9fa',
                          borderRadius: '8px',
                          height: '38px'
                        }}
                        tabIndex={6}
                      />
                    </div>
                  </div>

                  <div className="col-md-4 position-relative">
                    <div className="d-flex align-items-center gap-2 position-relative" style={{ flexWrap: 'nowrap' }}>
                      <label className="form-label fw-medium text-dark mb-0" style={{ fontSize: '0.85rem', whiteSpace: 'nowrap', minWidth: '100px' }}>
                        State
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-sm border-0 shadow-sm flex-grow-1"
                        placeholder="Search state"
                        value={stateSearch}
                        onChange={handleStateSearch}
                        onFocus={() => setShowStateDropdown(true)}
                        onBlur={() => setTimeout(() => setShowStateDropdown(false), 200)}
                        onKeyDown={handleStateKeyDown}
                        disabled={loading}
                        style={{ 
                          fontSize: '0.85rem',
                          padding: '0.5rem 0.75rem',
                          background: '#f8f9fa',
                          borderRadius: '8px',
                          height: '38px'
                        }}
                        tabIndex={7}
                      />
                    </div>
                    {showStateDropdown && (
                      <div
                        ref={stateDropdownRef}
                        className="shadow-sm border-0"
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          background: 'white',
                          border: '1px solid #e9ecef',
                          borderRadius: '8px',
                          maxHeight: '150px',
                          overflowY: 'auto',
                          zIndex: 1001,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        }}
                      >
                        {filteredStates.length > 0 ? (
                          filteredStates.map((state, index) => (
                            <div
                              key={state.stateid}
                              onClick={() => handleStateSelect(state)}
                              onMouseEnter={() => setStateHighlightIndex(index)}
                              style={{
                                padding: '0.5rem 1rem',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                borderBottom: '1px solid #f8f9fa',
                                background: index === stateHighlightIndex ? '#e7f1ff' : 'white',
                                transition: 'background-color 0.15s ease',
                              }}
                              onMouseDown={(e) => e.preventDefault()}
                            >
                              {state.state_name}
                            </div>
                          ))
                        ) : (
                          <div style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', color: '#6c757d' }}>
                            No states found
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="col-md-4 position-relative">
                    <div className="d-flex align-items-center gap-2 position-relative" style={{ flexWrap: 'nowrap' }}>
                      <label className="form-label fw-medium text-dark mb-0" style={{ fontSize: '0.85rem', whiteSpace: 'nowrap', minWidth: '100px' }}>
                        City
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-sm border-0 shadow-sm flex-grow-1"
                        placeholder="Search city"
                        value={citySearch}
                        onChange={handleCitySearch}
                        onFocus={() => setShowCityDropdown(true)}
                        onBlur={() => setTimeout(() => setShowCityDropdown(false), 200)}
                        onKeyDown={handleCityKeyDown}
                        disabled={loading}
                        style={{ 
                          fontSize: '0.85rem',
                          padding: '0.5rem 0.75rem',
                          background: '#f8f9fa',
                          borderRadius: '8px',
                          height: '38px'
                        }}
                        tabIndex={8}
                      />
                    </div>
                    {showCityDropdown && (
                      <div
                        ref={cityDropdownRef}
                        className="shadow-sm border-0"
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          background: 'white',
                          border: '1px solid #e9ecef',
                          borderRadius: '8px',
                          maxHeight: '150px',
                          overflowY: 'auto',
                          zIndex: 1001,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        }}
                      >
                        {filteredCities.length > 0 ? (
                          filteredCities.map((city, index) => (
                            <div
                              key={city.cityid}
                              onClick={() => handleCitySelect(city)}
                              onMouseEnter={() => setCityHighlightIndex(index)}
                              style={{
                                padding: '0.5rem 1rem',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                borderBottom: '1px solid #f8f9fa',
                                background: index === cityHighlightIndex ? '#e7f1ff' : 'white',
                                transition: 'background-color 0.15s ease',
                              }}
                              onMouseDown={(e) => e.preventDefault()}
                            >
                              {city.city_name}
                            </div>
                          ))
                        ) : (
                          <div style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', color: '#6c757d' }}>
                            No cities found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Fourth Row: Pincode + Birthday + Anniversary */}
              <div className="col-12">
                <div className="row g-3">
                  <div className="col-md-4">
                    <div className="d-flex align-items-center gap-2">
                      <label className="form-label fw-medium text-dark mb-0" style={{ fontSize: '0.85rem', whiteSpace: 'nowrap', minWidth: '100px' }}>
                        Pincode
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-sm border-0 shadow-sm flex-grow-1"
                        placeholder="6-digit pincode"
                        value={pincode}
                        onChange={handlePincodeChange}
                        disabled={loading}
                        style={{ 
                          fontSize: '0.85rem',
                          padding: '0.5rem 0.75rem',
                          background: '#f8f9fa',
                          borderRadius: '8px',
                          height: '38px'
                        }}
                        maxLength={6}
                        tabIndex={9}
                      />
                    </div>
                  </div>

                  <div className="col-md-4">
                    <div className="d-flex align-items-center gap-2">
                      <label className="form-label fw-medium text-dark mb-0" style={{ fontSize: '0.85rem', whiteSpace: 'nowrap', minWidth: '100px' }}>
                        Birthday
                      </label>
                      <input
                        type="date"
                        className="form-control form-control-sm border-0 shadow-sm flex-grow-1"
                        value={birthday}
                        onChange={(e) => setBirthday(e.target.value)}
                        disabled={loading}
                        style={{ 
                          fontSize: '0.85rem',
                          padding: '0.5rem 0.75rem',
                          background: '#f8f9fa',
                          borderRadius: '8px',
                          height: '38px'
                        }}
                        max="2025-08-01"
                        tabIndex={10}
                      />
                    </div>
                  </div>

                  <div className="col-md-4">
                    <div className="d-flex align-items-center gap-2">
                      <label className="form-label fw-medium text-dark mb-0" style={{ fontSize: '0.85rem', whiteSpace: 'nowrap', minWidth: '100px' }}>
                        Anniversary
                      </label>
                      <input
                        type="date"
                        className="form-control form-control-sm border-0 shadow-sm flex-grow-1"
                        value={anniversary}
                        onChange={(e) => setAnniversary(e.target.value)}
                        disabled={loading}
                        style={{ 
                          fontSize: '0.85rem',
                          padding: '0.5rem 0.75rem',
                          background: '#f8f9fa',
                          borderRadius: '8px',
                          height: '38px'
                        }}
                        max="2025-08-01"
                        tabIndex={11}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Fifth Row: GST + Aadhar + FSSAI + PAN */}
              <div className="col-12">
                <div className="row g-3">
                  <div className="col-md-3">
                    <div className="d-flex align-items-center gap-2">
                      <label className="form-label fw-medium text-dark mb-0" style={{ fontSize: '0.85rem', whiteSpace: 'nowrap', minWidth: '100px' }}>
                        GST Number
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-sm border-0 shadow-sm flex-grow-1"
                        placeholder="GST number"
                        value={gstNo}
                        onChange={handleGstChange}
                        disabled={loading}
                        style={{ 
                          fontSize: '0.85rem',
                          padding: '0.5rem 0.75rem',
                          background: '#f8f9fa',
                          borderRadius: '8px',
                          height: '38px'
                        }}
                        maxLength={15}
                        tabIndex={12}
                      />
                    </div>
                  </div>

                  <div className="col-md-3">
                    <div className="d-flex align-items-center gap-2">
                      <label className="form-label fw-medium text-dark mb-0" style={{ fontSize: '0.85rem', whiteSpace: 'nowrap', minWidth: '100px' }}>
                        Aadhar Number
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-sm border-0 shadow-sm flex-grow-1"
                        placeholder="12-digit Aadhar"
                        value={aadharNo}
                        onChange={handleAadharChange}
                        disabled={loading}
                        style={{ 
                          fontSize: '0.85rem',
                          padding: '0.5rem 0.75rem',
                          background: '#f8f9fa',
                          borderRadius: '8px',
                          height: '38px'
                        }}
                        maxLength={12}
                        tabIndex={13}
                      />
                    </div>
                  </div>

                  <div className="col-md-3">
                    <div className="d-flex align-items-center gap-2">
                      <label className="form-label fw-medium text-dark mb-0" style={{ fontSize: '0.85rem', whiteSpace: 'nowrap', minWidth: '100px' }}>
                        FSSAI License
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-sm border-0 shadow-sm flex-grow-1"
                        placeholder="FSSAI number"
                        value={fssai}
                        onChange={(e) => setFssai(e.target.value)}
                        disabled={loading}
                        style={{ 
                          fontSize: '0.85rem',
                          padding: '0.5rem 0.75rem',
                          background: '#f8f9fa',
                          borderRadius: '8px',
                          height: '38px'
                        }}
                        tabIndex={14}
                      />
                    </div>
                  </div>

                  <div className="col-md-3">
                    <div className="d-flex align-items-center gap-2">
                      <label className="form-label fw-medium text-dark mb-0" style={{ fontSize: '0.85rem', whiteSpace: 'nowrap', minWidth: '100px' }}>
                        PAN Number
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-sm border-0 shadow-sm flex-grow-1"
                        placeholder="PAN number"
                        value={panNo}
                        onChange={handlePanChange}
                        disabled={loading}
                        style={{ 
                          fontSize: '0.85rem',
                          padding: '0.5rem 0.75rem',
                          background: '#f8f9fa',
                          borderRadius: '8px',
                          height: '38px'
                        }}
                        maxLength={10}
                        tabIndex={15}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sixth Row: Create Wallet Checkbox */}
              <div className="col-12">
                <div className="form-check form-switch mt-2">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    checked={createWallet}
                    onChange={(e) => setCreateWallet(e.target.checked)}
                    disabled={loading}
                    style={{ 
                      width: '2.5em',
                      height: '1.25em'
                    }}
                    tabIndex={16}
                  />
                  <label className="form-check-label fw-medium text-dark ms-2" style={{ fontSize: '0.85rem' }}>
                    Create Wallet for Customer
                  </label>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
              <button
                className="btn btn-outline-secondary btn-sm px-3"
                onClick={resetForm}
                disabled={loading}
                style={{ 
                  padding: '0.5rem 1rem', 
                  fontSize: '0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #dee2e6'
                }}
                tabIndex={17}
              >
                Clear Form
              </button>
              <button
                className="btn btn-primary btn-sm px-4"
                onClick={handleSubmit}
                disabled={loading}
                style={{ 
                  padding: '0.5rem 1rem', 
                  fontSize: '0.85rem',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
                  border: 'none'
                }}
                tabIndex={18}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    {selectedCustomerId ? 'Updating...' : 'Adding...'}
                  </>
                ) : (
                  selectedCustomerId ? 'Update Customer' : 'Add Customer'
                )}
              </button>
            </div>
          </div>

          {/* Customer List Section */}
          <div className="mt-4 pt-3 border-top">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold text-dark mb-0" style={{ fontSize: '1.1rem' }}>
                Customer List
              </h5>
              <div className="col-md-4">
                <div className="input-group input-group-sm">
                  <span className="input-group-text border-0 bg-light">
                    <i className="bi bi-search" style={{ fontSize: '0.8rem' }}></i>
                  </span>
                  <input
                    type="text"
                    className="form-control form-control-sm border-0 shadow-sm"
                    placeholder="Search by mobile..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ 
                      fontSize: '0.85rem',
                      background: '#f8f9fa',
                      borderRadius: '8px'
                    }}
                    tabIndex={19}
                  />
                </div>
              </div>
            </div>

            <div 
              className="table-responsive border-0 shadow-sm rounded-3" 
              style={{
                maxHeight: '300px',
                overflowY: 'auto',
                background: 'white'
              }}
            >
              <table className="table table-hover table-sm mb-0">
                <thead style={{
                  position: 'sticky',
                  top: 0,
                  zIndex: 1,
                  backgroundColor: '#f8f9fa'
                }}>
                  <tr>
                    <th style={{ fontSize: '0.8rem', padding: '12px', whiteSpace: 'nowrap', fontWeight: '600', color: '#495057' }}>
                      #
                    </th>
                    <th style={{ fontSize: '0.8rem', padding: '12px', whiteSpace: 'nowrap', fontWeight: '600', color: '#495057' }}>
                      Customer Name
                    </th>
                    <th style={{ fontSize: '0.8rem', padding: '12px', whiteSpace: 'nowrap', fontWeight: '600', color: '#495057' }}>
                      Mobile
                    </th>
                    <th style={{ fontSize: '0.8rem', padding: '12px', whiteSpace: 'nowrap', fontWeight: '600', color: '#495057' }}>
                      Email
                    </th>
                    <th style={{ fontSize: '0.8rem', padding: '12px', whiteSpace: 'nowrap', fontWeight: '600', color: '#495057' }}>
                      City
                    </th>
                    <th style={{ fontSize: '0.8rem', padding: '12px', whiteSpace: 'nowrap', fontWeight: '600', color: '#495057' }}>
                      Address
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer, index) => (
                    <tr 
                      key={customer.customerid} 
                      onClick={() => handleCustomerClick(customer)} 
                      style={{ 
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease'
                      }}
                      className={selectedCustomerId === customer.customerid ? 'table-primary' : ''}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                      onMouseLeave={(e) => {
                        if (selectedCustomerId !== customer.customerid) {
                          e.currentTarget.style.backgroundColor = 'white';
                        }
                      }}
                    >
                      <td style={{ fontSize: '0.8rem', padding: '12px', whiteSpace: 'nowrap', borderBottom: '1px solid #f8f9fa' }}>
                        {index + 1}
                      </td>
                      <td style={{ fontSize: '0.8rem', padding: '12px', whiteSpace: 'nowrap', borderBottom: '1px solid #f8f9fa' }}>
                        <strong>{customer.name}</strong>
                      </td>
                      <td style={{ fontSize: '0.8rem', padding: '12px', whiteSpace: 'nowrap', borderBottom: '1px solid #f8f9fa' }}>
                        {customer.mobile}
                      </td>
                      <td style={{ fontSize: '0.8rem', padding: '12px', whiteSpace: 'nowrap', borderBottom: '1px solid #f8f9fa' }}>
                        {customer.mail || '-'}
                      </td>
                      <td style={{ fontSize: '0.8rem', padding: '12px', whiteSpace: 'nowrap', borderBottom: '1px solid #f8f9fa' }}>
                        {customer.city_name || '-'}
                      </td>
                      <td style={{ fontSize: '0.8rem', padding: '12px', whiteSpace: 'nowrap', borderBottom: '1px solid #f8f9fa' }}>
                        {customer.address1 || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CustomersPage;