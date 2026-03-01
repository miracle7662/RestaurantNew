import { useState, useEffect, useMemo } from "react";
import { toast } from "react-hot-toast";
import { useAuthContext } from "@/common";
import CustomerService, { Customer } from "../../../common/api/customers";

import {
  StateItem,
  CityItem,
  fetchStates,
  fetchCities,
} from "../../../utils/commonfunction";

interface CustomerFormData {
  mobile1: string;
  mobile2: string;
  email: string;
  
  name: string;
  add2: string;
  add1: string;
  gstin: string;
  aadharNo: string;
  city: string;
  pincode: string;
  fssai: string;
  panNo: string;
  customerType: string;
  status: string;
  state: string;
  birthday: string;
  anniversary: string;
}

interface LabelProps {
  children: React.ReactNode;
  required?: boolean;
}

const Label: React.FC<LabelProps> = ({ children, required = false }) => (
  <label className="form-label small fw-semibold mb-0 text-nowrap" style={{ width: "100px" }}>
    {children}
    {required && <span className="text-danger"> *</span>}
  </label>
);

interface FieldProps {
  label: string;
  name: keyof CustomerFormData;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
}

const Field: React.FC<FieldProps> = ({ label, name, type = "text", value, onChange, placeholder, required = false, disabled = false, children }) => (
  <div className="d-flex align-items-center mb-3">
    <Label required={required}>{label}</Label>
    {children ? (
      <select
        className="form-select form-select-sm"
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        style={{ marginLeft: "10px", flex: "1" }}
      >
        {children}
      </select>
    ) : (
      <input
        type={type}
        className="form-control form-control-sm"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        style={{ marginLeft: "10px", flex: "1" }}
      />
    )}
  </div>
);

interface PairedField {
  label: string;
  name: keyof CustomerFormData;
  type?: string;
  placeholder?: string;
  required?: boolean;
  max?: string;
}

interface PairedFieldsProps {
  fields: PairedField[];
  formData: CustomerFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  customOnChanges?: Partial<Record<keyof CustomerFormData, (e: React.ChangeEvent<HTMLInputElement>) => void>>;
  disabled?: boolean;
}

const PairedFields: React.FC<PairedFieldsProps> = ({ fields, formData, onChange, customOnChanges, disabled = false }) => (
  <div className="d-flex mb-3">
    {fields.map((field, index) => {
      const fieldOnChange = customOnChanges?.[field.name] || onChange;
      return (
        <div key={field.name} className="d-flex align-items-center" style={{ flex: "1" }}>
          <Label required={field.required}>{field.label}</Label>
          <input
            type={field.type}
            className="form-control form-control-sm"
            name={field.name}
            value={formData[field.name]}
            onChange={fieldOnChange}
            placeholder={field.placeholder}
            max={field.max}
            disabled={disabled}
            style={{ marginLeft: "10px", flex: "1" }}
          />
          {index === 0 && <div style={{ width: "20px" }}></div>}
        </div>
      );
    })}
  </div>
);

function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [formData, setFormData] = useState<CustomerFormData>({
    mobile1: "",
    mobile2: "",
    email: "",
    name: "",
    add2: "",
    add1: "",
    gstin: "",
    aadharNo: "",
    city: "",
    pincode: "",
    fssai: "",
    panNo: "",
    state: "",
    birthday: "",
    anniversary: "",
    customerType: "Regular",
    status: "",
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [states, setStates] = useState<StateItem[]>([]);
  const [cities, setCities] = useState<CityItem[]>([]);
  const [stateid, setStateId] = useState<number | null>(null);
  const [cityid, setCityId] = useState<number | null>(null);
  const { user } = useAuthContext();
  const todayStr = new Date().toISOString().split('T')[0];

  // Fetch customer data (READ)
 const fetchCustomers = async () => {
  setLoading(true);
  try {
    const response = await CustomerService.list();

    // ✅ Extract actual customer array - with guard for undefined
    setCustomers(response.data || []);

  } catch (err) {
    toast.error('Error fetching customer data');
  } finally {
    setLoading(false);
  }
};

  // Fetch hotelmaster data for default state and city
  

  useEffect(() => {
    if (user) {
      fetchCustomers();    
    }
  }, [user]);

  useEffect(() => {
    fetchStates(setStates, () => {});
  }, []);

  useEffect(() => {
    if (stateid) {
      fetchCities(stateid, setCities, () => {});
    } else {
      setCities([]);
    }
  }, [stateid]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleMobile1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const mobileValue = e.target.value.replace(/\D/g, '');
    if (mobileValue.length <= 10) setFormData({ ...formData, mobile1: mobileValue });
  };

  const handleMobile2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const mobileValue = e.target.value.replace(/\D/g, '');
    if (mobileValue.length <= 10) setFormData({ ...formData, mobile2: mobileValue });
  };

  const handlePincodeChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
) => {
  if (e.target instanceof HTMLInputElement) {
    const pincodeValue = e.target.value.replace(/\D/g, '');
    if (pincodeValue.length <= 6) {
      setFormData({ ...formData, pincode: pincodeValue });
    }
  }
};


  const handleAadharChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const aadharValue = e.target.value.replace(/\D/g, '');
    if (aadharValue.length <= 12) setFormData({ ...formData, aadharNo: aadharValue });
  };

  const handlePanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const panValue = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (panValue.length <= 10) setFormData({ ...formData, panNo: panValue });
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return false;
    }
    if (!formData.mobile1.trim()) {
      toast.error('Mobile is required');
      return false;
    }
    if (formData.mobile1 && !/^\d{10}$/.test(formData.mobile1)) {
      toast.error('Mobile number must be exactly 10 digits');
      return false;
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }
    if (formData.birthday && new Date(formData.birthday) > new Date()) {
      toast.error('Birthday cannot be in the future');
      return false;
    }
    if (formData.anniversary && new Date(formData.anniversary) > new Date()) {
      toast.error('Anniversary cannot be in the future');
      return false;
    }
    if (formData.aadharNo && !/^\d{12}$/.test(formData.aadharNo)) {
      toast.error('Aadhar number must be exactly 12 digits');
      return false;
    }
    if (formData.panNo && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(formData.panNo)) {
      toast.error('PAN number must be exactly 10 characters (e.g., ABCDE1234F)');
      return false;
    }
    if (formData.pincode && !/^\d{6}$/.test(formData.pincode)) {
      toast.error('Pincode must be exactly 6 digits');
      return false;
    }
    if (formData.gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gstin)) {
      toast.error('GST number must be a valid 15-digit alphanumeric format (e.g., 22AAAAA0000A1Z5)');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      const currentDate = new Date().toISOString();
      const statusValue = formData.status === 'Active' ? 0 : (formData.status === 'Inactive' ? 1 : 0);
      const payload = {
        name: formData.name,
        countryCode: '+91',
        mobile: formData.mobile1,
        mail: formData.email,
        cityid: cityid?.toString() ?? '',
        city_name: formData.city,
        address1: formData.add1,
        address2: formData.add2 || undefined,
        stateid: stateid?.toString() ?? '',
        state_name: formData.state,
        pincode: formData.pincode || undefined,
        gstNo: formData.gstin || undefined,
        fssai: formData.fssai || undefined,
        panNo: formData.panNo || undefined,
        aadharNo: formData.aadharNo || undefined,
        birthday: formData.birthday || undefined,
        anniversary: formData.anniversary || undefined,
        customerType: formData.customerType,
        status: statusValue,
        created_by_id: selectedCustomerId ? undefined : user?.id || 1,
        created_date: selectedCustomerId ? undefined : currentDate,
        updated_by_id: user?.id || 1,
        updated_date: currentDate,
      };
      const response = selectedCustomerId
  ? await CustomerService.update(selectedCustomerId, payload)
  : await CustomerService.create(payload);

   const customerData = response.data;
      const message = selectedCustomerId ? 'Customer updated successfully' : 'Customer added successfully';
      toast.success(message);
      if (selectedCustomerId) {
        setCustomers((prev) => prev.map((c) => (c.customerid === selectedCustomerId ? customerData : c)));
      } else {
        setCustomers((prev) => [...prev, customerData]);
      }
      handleClear();
    } catch (err) {
      toast.error(`Error ${selectedCustomerId ? 'updating' : 'adding'} customer`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomerId(customer.customerid);
    setFormData({
      mobile1: customer.mobile || '',
      mobile2: '',
      email: customer.mail || '',
      name: customer.name || '',
      add2: customer.address2 || '',
      add1: customer.address1 || '',
      gstin: customer.gstNo || '',
      aadharNo: customer.aadharNo || '',
      city: customer.city_name || '',
      pincode: customer.pincode || '',
      fssai: customer.fssai || '',
      panNo: customer.panNo || '',
      state: customer.state_name || '',
      customerType: customer.customerType || 'Regular',
      status: customer.status === 0 ? 'Active' : 'Inactive',
      birthday: customer.birthday || '',
      anniversary: customer.anniversary || '',
    });
    setStateId(customer.stateid ? Number(customer.stateid) : null);
    setCityId(customer.cityid ? Number(customer.cityid) : null);
  };

  const handleClear = () => {
    setFormData({
      mobile1: "",
      mobile2: "",
      email: "",
      name: "",
      add2: "",
      add1: "",
      gstin: "",
      aadharNo: "",
      city: "",
      pincode: "",
      fssai: "",
      panNo: "",
      state: "",
      customerType: "Regular",
      status: "",
      birthday: "",
      anniversary: "",
    });
    setSelectedCustomerId(null);
    setStateId(null);
    setCityId(null);
  };

  const filteredCustomers = useMemo(() => {
    if (!customers || !Array.isArray(customers)) {
      return [];
    }
    return customers.filter((customer) =>
      customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.mobile?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [customers, searchTerm]);

  const customOnChanges = {
    pincode: handlePincodeChange,
    aadharNo: handleAadharChange,
    panNo: handlePanChange,
  };

  return (
    <div
      className="container py-1"
      style={{
        backgroundColor: "#f2f2f2",
        minHeight: "100vh",
        maxWidth: "1100px",
      }}
    >
      <div className="card shadow-sm border-0 bg-white">
        <div className="card-header bg-white border-bottom py-2">
          <h5 className="mb-0 text-primary fw-semibold">
            {selectedCustomerId ? 'Edit Customer' : 'Add New Customer'}
          </h5>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row">
              {/* Left Column */}
              <div className="col-md-6">
                <div className="pe-3">
                  <div className="d-flex align-items-center mb-3">
                    <Label required>Mobile No</Label>
                    <div className="d-flex" style={{ flex: "1", marginLeft: "10px" }}>
                      <div className="input-group input-group-sm" style={{ flex: "1", marginRight: "5px" }}>
                        <span className="input-group-text" style={{ width: "60px", backgroundColor: "#f8f9fa", borderRight: "none" }}>+91</span>
                        <input
                          type="tel"
                          className="form-control form-control-sm"
                          name="mobile1"
                          value={formData.mobile1}
                          onChange={handleMobile1Change}
                          placeholder="Enter mobile number 1"
                          required
                          disabled={loading}
                          style={{ borderLeft: "none" }}
                        />
                      </div>
                      <input
                        type="tel"
                        className="form-control form-control-sm"
                        name="mobile2"
                        value={formData.mobile2}
                        onChange={handleMobile2Change}
                        placeholder="Enter mobile number 2"
                        disabled={loading}
                        style={{ flex: "1", marginLeft: "5px" }}
                      />
                    </div>
                  </div>
                  <Field
                    label="Name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter name"
                    required
                    disabled={loading}
                  />
                  <Field
                    label="Address 1"
                    name="add1"
                    value={formData.add1}
                    onChange={handleInputChange}
                    placeholder="Enter address"
                    disabled={loading}
                  />
                  <Field
                    label="State"
                    name="state"
                    value={formData.state}
                    onChange={(e) => {
                      const selectedState = states?.find(s => s.state_name === e.target.value);
                      setStateId(selectedState ? selectedState.stateid : null);
                      setFormData(prev => ({ ...prev, state: e.target.value, city: '' }));
                      setCityId(null);
                    }}
                    disabled={loading}
                  >
                    <option value="">Select State</option>
                    {Array.isArray(states) && states.map(state => (
                      <option key={state.stateid} value={state.state_name}>{state.state_name}</option>
                    ))}
                  </Field>
                  <Field
                    label="City"
                    name="city"
                    value={formData.city}
                    onChange={(e) => {
                      const selectedCity = cities?.find(c => c.city_name === e.target.value);
                      setCityId(selectedCity ? selectedCity.cityid : null);
                      setFormData(prev => ({ ...prev, city: e.target.value }));
                    }}
                    disabled={loading || !stateid}
                  >
                    <option value="">Select City</option>
                    {Array.isArray(cities) && cities.map(city => (
                      <option key={city.cityid} value={city.city_name}>{city.city_name}</option>
                    ))}
                  </Field>
                  <Field
                    label="Pincode"
                    name="pincode"
                    value={formData.pincode}
                    onChange={customOnChanges.pincode}
                    placeholder="Pincode"
                    disabled={loading}
                  />

                  <PairedFields
                    fields={[
                      { label: "Birthday", name: "birthday", type: "date", max: todayStr },
                      { label: "Anniversary", name: "anniversary", type: "date", max: todayStr },
                    ]}
                    formData={formData}
                    onChange={handleInputChange}
                    disabled={loading}
                  />

                  <Field
                    label="GSTIN"
                    name="gstin"
                    value={formData.gstin}
                    onChange={handleInputChange}
                    placeholder="Enter GSTIN"
                    disabled={loading}
                  />
                </div>
              </div>
              {/* Right Column */}
              <div className="col-md-6">
                <div className="ps-3">
                  <Field
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter email"
                    disabled={loading}
                  />
                  <Field
                    label="Address 2"
                    name="add2"
                    value={formData.add2}
                    onChange={handleInputChange}
                    placeholder="Enter address"
                    disabled={loading}
                  />
                  <Field
                    label="Aadhar No"
                    name="aadharNo"
                    value={formData.aadharNo}
                    onChange={handleInputChange}
                    placeholder="Enter Aadhar No"
                    disabled={loading}
                  />
                  <Field
                    label="FSSAI"
                    name="fssai"
                    value={formData.fssai}
                    onChange={handleInputChange}
                    placeholder="Enter FSSAI No"
                    disabled={loading}
                  />

                  <Field
                    label="PAN No"
                    name="panNo"
                    value={formData.panNo}
                    onChange={handleInputChange}
                    placeholder="Enter PAN No"
                    disabled={loading}
                  />
                  <Field
                    label="Customer Type"
                    name="customerType"
                    value={formData.customerType}
                    onChange={handleInputChange}
                    disabled={loading}
                  >
                    <option value="">Select Type</option>
                    <option value="Customer">Customer</option>
                    <option value="Regular">Regular</option>
                  </Field>

                  <Field
                    label="Status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    disabled={loading}
                  >
                    <option value="">Select Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </Field>

                </div>
              </div>
            </div>
            <div className="text-end mt-4">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm me-2"
                onClick={handleClear}
                disabled={loading}
              >
                Clear
              </button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
                {loading
                  ? selectedCustomerId
                    ? 'Updating...'
                    : 'Adding...'
                  : selectedCustomerId
                    ? 'Update Customer'
                    : 'Add Customer'}
              </button>
            </div>
          </form>
        </div>
      </div>
      {/* Customer List Section */}
      <div
        className="card shadow-sm border-0 mt-2"
        style={{ maxHeight: "calc(100vh - 300px)" }}
      >
        <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center m-0 py-2">
          <h6 className="mb-0 text-secondary fw-semibold">Customer List</h6>
          <div className="d-flex align-items-center">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="🔍 Search by name or mobile..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: "250px" }}
            />
          </div>
        </div>

        {/* 👇 Scroll only here */}
        <div className="table-responsive" style={{ maxHeight: "200px", overflowY: "auto" }}>
          <table
            className="table table-sm table-hover align-middle mb-0"
            style={{ tableLayout: "fixed", width: "100%" }}
          >
            <thead className="table-light" style={{ position: "sticky", top: 0, zIndex: 10, backgroundColor: "light" }}>
              <tr>
                <th style={{ width: "50px", position: "sticky", left: 0, backgroundColor: "light", zIndex: 11 }}>#</th>
                <th style={{ width: "120px" }}>Name</th>
                <th style={{ width: "100px" }}>Mobile</th>
                <th style={{ width: "150px" }}>Email</th>
                <th style={{ width: "100px" }}>City</th>
                <th style={{ width: "100px" }}>State</th>
                <th style={{ width: "80px" }}>Type</th>
                <th style={{ width: "100px", position: "sticky", right: 0, backgroundColor: "light", zIndex: 11 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-muted py-4">
                    {searchTerm ? "No matching customers" : "No customers added yet"}
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c, i) => (
                  <tr key={c.customerid}>
                    <td className="text-muted" style={{ position: "sticky", left: 0, backgroundColor: "white", zIndex: 1 }}>
                      {i + 1}
                    </td>
                    <td className="fw-semibold" style={{ wordBreak: "break-word" }}>{c.name}</td>
                    <td style={{ wordBreak: "break-word" }}>{c.mobile || "-"}</td>
                    <td style={{ wordBreak: "break-word" }}>{c.mail || "-"}</td>
                    <td>{c.city_name || "-"}</td>
                    <td>{c.state_name || "-"}</td>
                    <td>{c.customerType || "-"}</td>
                    <td style={{ position: "sticky", right: 0, backgroundColor: "white", zIndex: 1 }}>
                      <button
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => handleEdit(c)}
                        disabled={loading}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>

  );
}

export default Customers;
