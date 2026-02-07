import React from 'react';
import { Field, ErrorMessage } from 'formik';
import { Form } from 'react-bootstrap';

interface Option {
  value: string;
  label: string;
}

interface FormikSelectProps {
  name: string;
  label: string;
  options: Option[];
  className?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

const FormikSelect: React.FC<FormikSelectProps> = ({
  name,
  label,
  options,
  className = '',
  onChange,
}) => {
  return (
    <Form.Group className={className}>
      <Form.Label>
        {label} <span style={{ color: 'red' }}>*</span>
      </Form.Label>
      <Field name={name}>
        {({ field, form }: any) => (
          <Form.Select
            {...field}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              field.onChange(e);
              if (onChange) onChange(e);
            }}
            style={{ borderColor: '#ccc' }}
            isInvalid={form.touched[name] && form.errors[name]}
          >
            <option value="">Select {label.toLowerCase()}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Form.Select>
        )}
      </Field>
      <ErrorMessage name={name} component="div" className="invalid-feedback" />
    </Form.Group>
  );
};

export default FormikSelect;
