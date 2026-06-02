import React from 'react'
import { useField } from 'formik'
import { Form, Col } from 'react-bootstrap'

const FormikCheckbox = ({
  label,
  name,
  md = 4,
  className = 'mb-2',
  ...props
}: any) => {
  const [field, meta] = useField({ name, type: 'checkbox' })
  const hasError = Boolean(meta.error)

  return (
    <Form.Group as={Col} md={md} className={className}>
      <Form.Check
        {...field}
        {...props}
        type="checkbox"
        label={
          <span style={{ fontSize: '13px', fontWeight: 400 }}>
            {label}
          </span>
        }
        style={{
          fontSize: '13px',
        }}
      />

      <style>
        {`
          .form-check-input {
            border: ${hasError ? '1px solid #dc3545' : '1px solid #ced4da'};
            cursor: pointer;
          }
          .form-check-input:focus {
            box-shadow: 0 0 0 0.1rem rgba(13,110,253,.25);
            border-color: #86b7fe;
          }
        `}
      </style>
    </Form.Group>
  )
}

export default FormikCheckbox
