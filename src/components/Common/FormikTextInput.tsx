import React from 'react';
import { Field, ErrorMessage } from 'formik';
import { Form } from 'react-bootstrap';

interface FormikTextInputProps {
  name: string;
  label: string;
  placeholder: string;
  className?: string;
  maxLength?: number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const FormikTextInput: React.FC<FormikTextInputProps> = ({
  name,
  label,
  placeholder,
  className = '',
  maxLength,
  onChange,
}) => {
  return (
    <Form.Group className={className}>
      <Form.Label>
        {label} <span style={{ color: 'red' }}>*</span>
      </Form.Label>
      <Field name={name}>
        {({ field, form }: any) => (
          <Form.Control
            {...field}
            type="text"
            placeholder={placeholder}
            maxLength={maxLength}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              field.onChange(e);
              if (onChange) onChange(e);
            }}
            style={{ borderColor: '#ccc' }}
            isInvalid={form.touched[name] && form.errors[name]}
          />
        )}
      </Field>
      <ErrorMessage name={name} component="div" className="invalid-feedback" />
    </Form.Group>
  );
};

export default FormikTextInput;
