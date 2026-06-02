import React, { forwardRef, useImperativeHandle, useState, useEffect } from 'react';
import { Row } from 'react-bootstrap';

interface MyFormValues {
  country_name: string;
  country_code: string;
  country_capital: string;
  status: string;
}

interface MyFormProps {
  initialValues: MyFormValues;
  onSave: (values: MyFormValues) => void;
}

export interface MyFormRef {
  saveData: () => void;
}

const MyForm = forwardRef<MyFormRef, MyFormProps>(({ initialValues, onSave }, ref) => {
  const [formData, setFormData] = useState<MyFormValues>(initialValues);
  const [errors, setErrors] = useState({
    country_name: '',
    country_code: '',
    country_capital: '',
    status: ''
  });

  useEffect(() => {
    setFormData(initialValues);
    setErrors({
      country_name: '',
      country_code: '',
      country_capital: '',
      status: ''
    });
  }, [initialValues]);

  const validateForm = (): boolean => {
    const newErrors = {
      country_name: '',
      country_code: '',
      country_capital: '',
      status: ''
    };
    let isValid = true;

    if (!formData.country_name.trim()) {
      newErrors.country_name = 'Country name is required';
      isValid = false;
    }

    if (!formData.country_code.trim()) {
      newErrors.country_code = 'Country code is required';
      isValid = false;
    } else if (formData.country_code.length > 3) {
      newErrors.country_code = 'Country code must be at most 3 characters';
      isValid = false;
    }

    if (!formData.country_capital.trim()) {
      newErrors.country_capital = 'Capital city is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'country_code') {
      if (/^[0-9]*$/.test(value)) {
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors.country_code) {
          setErrors(prev => ({ ...prev, country_code: '' }));
        }
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      if (errors[name as keyof typeof errors]) {
        setErrors(prev => ({ ...prev, [name]: '' }));
      }
    }
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSave(formData);
    }
  };

  useImperativeHandle(ref, () => ({
    saveData: () => {
      handleSubmit();
    },
  }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
      <Row className="g-3">
        <div className="col-md-6">
          <label htmlFor="country_name" className="form-label">
            Country Name <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            id="country_name"
            name="country_name"
            className={`form-control ${errors.country_name ? 'is-invalid' : ''}`}
            placeholder="Enter country name"
            value={formData.country_name}
            onChange={handleChange}
          />
          {errors.country_name && (
            <div className="invalid-feedback">{errors.country_name}</div>
          )}
        </div>

        <div className="col-md-6">
          <label htmlFor="country_code" className="form-label">
            Country Code <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            id="country_code"
            name="country_code"
            className={`form-control ${errors.country_code ? 'is-invalid' : ''}`}
            placeholder="Enter country code"
            maxLength={3}
            value={formData.country_code}
            onChange={handleChange}
          />
          {errors.country_code && (
            <div className="invalid-feedback">{errors.country_code}</div>
          )}
        </div>

        <div className="col-md-6">
          <label htmlFor="country_capital" className="form-label">
            Capital City <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            id="country_capital"
            name="country_capital"
            className={`form-control ${errors.country_capital ? 'is-invalid' : ''}`}
            placeholder="Enter capital city"
            value={formData.country_capital}
            onChange={handleChange}
          />
          {errors.country_capital && (
            <div className="invalid-feedback">{errors.country_capital}</div>
          )}
        </div>

        <div className="col-md-6">
          <label htmlFor="status" className="form-label">Status</label>
          <select
            id="status"
            name="status"
            className={`form-select ${errors.status ? 'is-invalid' : ''}`}
            value={formData.status}
            onChange={handleChange}
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          {errors.status && (
            <div className="invalid-feedback">{errors.status}</div>
          )}
        </div>
      </Row>
    </form>
  );
});

MyForm.displayName = 'MyForm';

export default MyForm;