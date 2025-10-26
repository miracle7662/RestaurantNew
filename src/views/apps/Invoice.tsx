import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

const FormInput = ({ label, type = "text", value, onChange, error, required, placeholder, maxLength, pattern }) => (
  <div className="mb-3">
    <label className="form-label small fw-semibold">
      {label} {required && <span className="text-danger">*</span>}
    </label>
    <input
      type={type}
      className={`form-control form-control-sm ${error ? 'is-invalid' : ''}`}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      maxLength={maxLength}
      pattern={pattern}
    />
    {error && <div className="invalid-feedback">{error}</div>}
  </div>
);

const FormSelect = ({ label, value, onChange, options, error, required, placeholder }) => (
  <div className="mb-3">
    <label className="form-label small fw-semibold">
      {label} {required && <span className="text-danger">*</span>}
    </label>
    <select
      className={`form-select form-select-sm ${error ? 'is-invalid' : ''}`}
      value={value}
      onChange={onChange}
    >
      <option value="">{placeholder}</option>
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
    {error && <div className="invalid-feedback">{error}</div>}
  </div>
);

const CustomerForm = () => {
  const [formData, setFormData] = useState({
    countryCode: '+91',
    mobile: '',
    fullName: '',
    email: '',
    address1: '',
    address2: '',
    state: '',
    city: '',
    pincode: '',
    gst: '',
    aadhar: '',
    fssai: '',
    pan: '',
    birthday: '',
    anniversary: '',
    createWallet: false
  });

  const [errors, setErrors] = useState({});
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const countryCodes = [
    { value: '+91', label: '+91 IN' },
    { value: '+1', label: '+1 US' },
    { value: '+44', label: '+44 UK' },
    { value: '+61', label: '+61 AU' }
  ];

  const states = [
    { value: 'maharashtra', label: 'Maharashtra' },
    { value: 'delhi', label: 'Delhi' },
    { value: 'karnataka', label: 'Karnataka' },
    { value: 'tamil-nadu', label: 'Tamil Nadu' },
    { value: 'gujarat', label: 'Gujarat' },
    { value: 'rajasthan', label: 'Rajasthan' },
    { value: 'west-bengal', label: 'West Bengal' },
    { value: 'uttar-pradesh', label: 'Uttar Pradesh' }
  ];

  const cities = {
    'maharashtra': [
      { value: 'mumbai', label: 'Mumbai' },
      { value: 'pune', label: 'Pune' },
      { value: 'nagpur', label: 'Nagpur' }
    ],
    'delhi': [
      { value: 'new-delhi', label: 'New Delhi' },
      { value: 'dwarka', label: 'Dwarka' }
    ],
    'karnataka': [
      { value: 'bangalore', label: 'Bangalore' },
      { value: 'mysore', label: 'Mysore' }
    ],
    'tamil-nadu': [
      { value: 'chennai', label: 'Chennai' },
      { value: 'coimbatore', label: 'Coimbatore' }
    ],
    'gujarat': [
      { value: 'ahmedabad', label: 'Ahmedabad' },
      { value: 'surat', label: 'Surat' }
    ],
    'rajasthan': [
      { value: 'jaipur', label: 'Jaipur' },
      { value: 'udaipur', label: 'Udaipur' }
    ],
    'west-bengal': [
      { value: 'kolkata', label: 'Kolkata' }
    ],
    'uttar-pradesh': [
      { value: 'lucknow', label: 'Lucknow' },
      { value: 'noida', label: 'Noida' }
    ]
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      ...(field === 'state' && { city: '' })
    }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.mobile) newErrors.mobile = 'Mobile number is required';
    else if (!/^\d{10}$/.test(formData.mobile)) newErrors.mobile = 'Enter valid 10-digit mobile number';

    if (!formData.fullName) newErrors.fullName = 'Full name is required';

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Enter valid email address';
    }

    if (formData.pincode && !/^\d{6}$/.test(formData.pincode)) {
      newErrors.pincode = 'Enter valid 6-digit pincode';
    }

    if (formData.gst && !/^[0-9A-Z]{15}$/.test(formData.gst)) {
      newErrors.gst = 'GST must be 15 alphanumeric characters';
    }

    if (formData.aadhar && !/^\d{12}$/.test(formData.aadhar)) {
      newErrors.aadhar = 'Aadhar must be exactly 12 digits';
    }

    if (formData.pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan)) {
      newErrors.pan = 'Enter valid PAN (e.g., ABCDE1234F)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      const newCustomer = {
        id: customers.length + 1,
        name: formData.fullName,
        mobile: `${formData.countryCode} ${formData.mobile}`,
        email: formData.email || '-',
        city: cities[formData.state]?.find(c => c.value === formData.city)?.label || '-',
        address: formData.address1 || '-'
      };
      setCustomers([...customers, newCustomer]);
      handleClear();
      alert('Customer added successfully!');
    }
  };

  const handleClear = () => {
    setFormData({
      countryCode: '+91',
      mobile: '',
      fullName: '',
      email: '',
      address1: '',
      address2: '',
      state: '',
      city: '',
      pincode: '',
      gst: '',
      aadhar: '',
      fssai: '',
      pan: '',
      birthday: '',
      anniversary: '',
      createWallet: false
    });
    setErrors({});
  };

  const filteredCustomers = customers.filter(c =>
    c.mobile.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container-fluid p-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div className="card shadow-sm">
        <div className="card-header bg-white py-3">
          <h5 className="mb-0 fw-bold">Add New Customer</h5>
        </div>
        <div className="card-body">
          <div>
            {/* Basic Info */}
            <div className="mb-4">
              <h6 className="text-primary fw-bold mb-3">1️⃣ Basic Info</h6>
              <div className="row">
                <div className="col-lg-4 col-md-6">
                  <FormSelect
                    label="Country Code"
                    value={formData.countryCode}
                    onChange={(e) => handleChange('countryCode', e.target.value)}
                    options={countryCodes}
                    required
                    placeholder="Select country code"
                  />
                </div>
                <div className="col-lg-4 col-md-6">
                  <FormInput
                    label="Mobile Number"
                    value={formData.mobile}
                    onChange={(e) => handleChange('mobile', e.target.value.replace(/\D/g, ''))}
                    error={errors.mobile}
                    required
                    placeholder="Enter 10-digit mobile"
                    maxLength="10"
                  />
                </div>
                <div className="col-lg-4 col-md-6">
                  <FormInput
                    label="Full Name"
                    value={formData.fullName}
                    onChange={(e) => handleChange('fullName', e.target.value)}
                    error={errors.fullName}
                    required
                    placeholder="Enter full name"
                  />
                </div>
                <div className="col-lg-4 col-md-6">
                  <FormInput
                    label="Email Address"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    error={errors.email}
                    placeholder="Enter email address"
                  />
                </div>
              </div>
            </div>

            {/* Address Info */}
            <div className="mb-4">
              <h6 className="text-primary fw-bold mb-3">2️⃣ Address Info</h6>
              <div className="row">
                <div className="col-lg-4 col-md-6">
                  <FormInput
                    label="Address Line 1"
                    value={formData.address1}
                    onChange={(e) => handleChange('address1', e.target.value)}
                    placeholder="Building, street name"
                  />
                </div>
                <div className="col-lg-4 col-md-6">
                  <FormInput
                    label="Address Line 2"
                    value={formData.address2}
                    onChange={(e) => handleChange('address2', e.target.value)}
                    placeholder="Landmark, area"
                  />
                </div>
                <div className="col-lg-4 col-md-6">
                  <FormSelect
                    label="State"
                    value={formData.state}
                    onChange={(e) => handleChange('state', e.target.value)}
                    options={states}
                    placeholder="Select state"
                  />
                </div>
                <div className="col-lg-4 col-md-6">
                  <FormSelect
                    label="City"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    options={formData.state ? cities[formData.state] || [] : []}
                    placeholder="Select city"
                  />
                </div>
                <div className="col-lg-4 col-md-6">
                  <FormInput
                    label="Pincode"
                    value={formData.pincode}
                    onChange={(e) => handleChange('pincode', e.target.value.replace(/\D/g, ''))}
                    error={errors.pincode}
                    placeholder="Enter 6-digit pincode"
                    maxLength="6"
                  />
                </div>
              </div>
            </div>

            {/* Government IDs */}
            <div className="mb-4">
              <h6 className="text-primary fw-bold mb-3">3️⃣ Government IDs</h6>
              <div className="row">
                <div className="col-lg-4 col-md-6">
                  <FormInput
                    label="GST Number"
                    value={formData.gst}
                    onChange={(e) => handleChange('gst', e.target.value.toUpperCase())}
                    error={errors.gst}
                    placeholder="15-character GST"
                    maxLength="15"
                  />
                </div>
                <div className="col-lg-4 col-md-6">
                  <FormInput
                    label="Aadhar Number"
                    value={formData.aadhar}
                    onChange={(e) => handleChange('aadhar', e.target.value.replace(/\D/g, ''))}
                    error={errors.aadhar}
                    placeholder="12-digit Aadhar"
                    maxLength="12"
                  />
                </div>
                <div className="col-lg-4 col-md-6">
                  <FormInput
                    label="FSSAI License Number"
                    value={formData.fssai}
                    onChange={(e) => handleChange('fssai', e.target.value)}
                    placeholder="FSSAI license number"
                  />
                </div>
                <div className="col-lg-4 col-md-6">
                  <FormInput
                    label="PAN Number"
                    value={formData.pan}
                    onChange={(e) => handleChange('pan', e.target.value.toUpperCase())}
                    error={errors.pan}
                    placeholder="10-character PAN"
                    maxLength="10"
                  />
                </div>
              </div>
            </div>

            {/* Special Dates */}
            <div className="mb-4">
              <h6 className="text-primary fw-bold mb-3">4️⃣ Special Dates</h6>
              <div className="row">
                <div className="col-lg-4 col-md-6">
                  <FormInput
                    label="Birthday"
                    type="date"
                    value={formData.birthday}
                    onChange={(e) => handleChange('birthday', e.target.value)}
                    placeholder="dd-mm-yyyy"
                  />
                </div>
                <div className="col-lg-4 col-md-6">
                  <FormInput
                    label="Anniversary"
                    type="date"
                    value={formData.anniversary}
                    onChange={(e) => handleChange('anniversary', e.target.value)}
                    placeholder="dd-mm-yyyy"
                  />
                </div>
              </div>
            </div>

            {/* Wallet Toggle */}
            <div className="mb-4">
              <h6 className="text-primary fw-bold mb-3">5️⃣ Wallet</h6>
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="walletSwitch"
                  checked={formData.createWallet}
                  onChange={(e) => handleChange('createWallet', e.target.checked)}
                />
                <label className="form-check-label small" htmlFor="walletSwitch">
                  Create Wallet for Customer
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="d-flex gap-2">
              <button type="button" className="btn btn-primary btn-sm px-4" onClick={handleSubmit}>
                Add Customer
              </button>
              <button type="button" className="btn btn-outline-secondary btn-sm px-4" onClick={handleClear}>
                Clear Form
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Customer List */}
      <div className="card shadow-sm mt-4">
        <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center flex-wrap">
          <h5 className="mb-0 fw-bold">Customer List</h5>
          <input
            type="text"
            className="form-control form-control-sm w-auto mt-2 mt-md-0"
            placeholder="Search by mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ maxWidth: '250px' }}
          />
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover table-sm mb-0">
              <thead className="table-light">
                <tr>
                  <th className="small fw-semibold">#</th>
                  <th className="small fw-semibold">Customer Name</th>
                  <th className="small fw-semibold">Mobile</th>
                  <th className="small fw-semibold">Email</th>
                  <th className="small fw-semibold">City</th>
                  <th className="small fw-semibold">Address</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center text-muted py-4">
                      No customers added yet
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.id}>
                      <td className="small">{customer.id}</td>
                      <td className="small">{customer.name}</td>
                      <td className="small">{customer.mobile}</td>
                      <td className="small">{customer.email}</td>
                      <td className="small">{customer.city}</td>
                      <td className="small">{customer.address}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerForm;