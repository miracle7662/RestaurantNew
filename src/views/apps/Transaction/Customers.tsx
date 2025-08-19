import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import Swal from 'sweetalert2';
import { toast } from 'react-hot-toast';
import { Preloader } from '@/components/Misc/Preloader';
import { Button, Card, Stack, Table } from 'react-bootstrap';
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
  onClose: () => void; // Add this line
  onSuccess: () => void;
  customers: Customer[];
  setCustomers: (customers: Customer[]) => void;
}

// AddCustomerModal Component
const AddCustomerModal: React.FC<AddCustomerModalProps> = ({onClose, show,  onHide,  onSuccess, customers, setCustomers }) => {
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

  useEffect(() => {
    fetchStates(setStates, setStateId).catch((err) => toast.error('Error fetching states'));
    fetchCities(setCities, setCityid).catch((err) => toast.error('Error fetching cities'));
  }, []);

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
        onSuccess();
      
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
        className="modal-content"
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
            <div className="col-md-1">
              <label className="form-label" style={{ fontSize: '0.85rem' }}> Code *</label>
              <select
                className="form-control form-control-sm"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                disabled={loading}
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
                required
                tabIndex={1}
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
                maxLength={10}
                required
                tabIndex={2}
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
                required
                tabIndex={3}
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
                tabIndex={10}
              />
            </div>
          </div>

          {/* Third Row - Address1 and Address2 */}
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
                tabIndex={4}
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
                tabIndex={11}
              />
            </div>
          </div>

          {/* Fourth Row - State, City, Birthday, Anniversary */}
          <div className="row g-2 mb-2">
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
                onKeyDown={handleStateKeyDown}
                disabled={loading}
                style={{ fontSize: '0.85rem' }}
                tabIndex={5}
              />
              {showStateDropdown && (
                <div
                  ref={stateDropdownRef}
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
                    filteredStates.map((state, index) => (
                      <div
                        key={state.stateid}
                        onClick={() => handleStateSelect(state)}
                        onMouseEnter={() => setStateHighlightIndex(index)}
                        style={{
                          padding: '8px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          borderBottom: '1px solid #f0f0f0',
                          background: index === stateHighlightIndex ? '#e9ecef' : 'white',
                        }}
                        onMouseDown={(e) => e.preventDefault()}
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
                onKeyDown={handleCityKeyDown}
                disabled={loading}
                style={{ fontSize: '0.85rem' }}
                tabIndex={6}
              />
              {showCityDropdown && (
                <div
                  ref={cityDropdownRef}
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
                    filteredCities.map((city, index) => (
                      <div
                        key={city.cityid}
                        onClick={() => handleCitySelect(city)}
                        onMouseEnter={() => setCityHighlightIndex(index)}
                        style={{
                          padding: '8px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          borderBottom: '1px solid #f0f0f0',
                          background: index === cityHighlightIndex ? '#e9ecef' : 'white',
                        }}
                        onMouseDown={(e) => e.preventDefault()}
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
              <label className="form-label" style={{ fontSize: '0.85rem' }}>Birthday</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                disabled={loading}
                style={{ fontSize: '0.85rem' }}
                max="2025-08-01"
                tabIndex={12}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label" style={{ fontSize: '0.85rem' }}>Anniversary</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={anniversary}
                onChange={(e) => setAnniversary(e.target.value)}
                disabled={loading}
                style={{ fontSize: '0.85rem' }}
                max="2025-08-01"
                tabIndex={13}
              />
            </div>
          </div>

          {/* Fifth Row - Pincode */}
          <div className="row g-2 mb-2">
            <div className="col-md-6">
              <label className="form-label" style={{ fontSize: '0.85rem' }}>Pincode</label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Pincode"
                value={pincode}
                onChange={handlePincodeChange}
                disabled={loading}
                style={{ fontSize: '0.85rem' }}
                maxLength={6}
                tabIndex={7}
              />
            </div>
          </div>

          {/* Sixth Row - GST No and Aadhar No */}
          <div className="row g-2 mb-2">
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
                tabIndex={8}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label" style={{ fontSize: '0.85rem' }}>Aadhar No.</label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Aadhar"
                value={aadharNo}
                onChange={handleAadharChange}
                disabled={loading}
                style={{ fontSize: '0.85rem' }}
                maxLength={12}
                tabIndex={9}
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
                tabIndex={14}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label" style={{ fontSize: '0.85rem' }}>PAN No.</label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="PAN"
                value={panNo}
                onChange={handlePanChange}
                disabled={loading}
                style={{ fontSize: '0.85rem' }}
                maxLength={10}
                tabIndex={15}
              />
            </div>
          </div>

          {/* New Row - Create Wallet */}
          <div className="row g-2 mb-2">
            <div className="col-md-3">
              <label className="form-label" style={{ fontSize: '0.85rem' }}>Create Wallet</label>
              <input
                type="checkbox"
                className="form-check-input"
                checked={createWallet}
                onChange={(e) => setCreateWallet(e.target.checked)}
                disabled={loading}
                style={{ marginTop: '0.25rem' }}
                tabIndex={16}
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="d-flex justify-content-end mt-3">
            <button
              className="btn btn-outline-secondary btn-sm me-2"
              onClick={onHide}
              disabled={loading}
              style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}
              tabIndex={17}
            >
              Close
            </button>
            <button
              className="btn btn-outline-primary btn-sm me-2"
              onClick={resetForm}
              disabled={loading}
              style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}
              tabIndex={18}
            >
              Clear Form
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleSubmit}
              disabled={loading}
              style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}
              tabIndex={19}
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
                tabIndex={20}
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

// Main CustomerPage Component
const CustomerPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(true);
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
        console.log('API Response:', data); // Debug log
        setCustomers(Array.isArray(data) ? data : []);
        setFilteredCustomers(Array.isArray(data) ? data : []);
      } else {
        toast.error('Failed to fetch customer data');
        setCustomers([]);
        setFilteredCustomers([]);
      }
    } catch (err) {
      toast.error('Error fetching customer data');
      setCustomers([]);
      setFilteredCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [user]);

  // Handle search
  const handleSearch = useCallback(
    debounce((value: string) => {
      setSearchTerm(value);
      const filtered = (customers || []).filter((item) =>
        item.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredCustomers(filtered);
    }, 300),
    [customers]
  );



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
      {loading && <Preloader />}
      <AddCustomerModal
        show={showAddCustomerModal}
        onHide={() => setShowAddCustomerModal(false)}
        onClose={() => setShowAddCustomerModal(false)}
        onSuccess={fetchCustomers}
        customers={customers}
        setCustomers={setCustomers}
      />
    </>
  );
};

export default CustomerPage;