import React, { useRef } from 'react'
import { useField, useFormikContext } from 'formik'
import { Form, Col } from 'react-bootstrap'
import { toast, Toast } from 'react-hot-toast'

interface Option {
  label: string
  value: string | number
}

interface FormikSelectProps {
  label?: string
  name: string
  options: Option[]
  md?: number | string
  className?: string
  placeholder?: string
  onChange?: (value: string | number | null) => void
  disabled?: boolean
  label2?: string | undefined
  inputStyle?: React.CSSProperties
  size?: 'sm' | 'lg'
  isLoading?: boolean
}

const FormikSelect: React.FC<FormikSelectProps> = ({
  label,
  name,
  options,
  md = 6,
  className = 'mb-0',
  placeholder = 'Select',
  onChange,
  disabled = false,
  inputStyle,
  size,
  isLoading = false,
}) => {
  const [field, meta] = useField(name)
  const { validateForm } = useFormikContext<any>()
  const selectRef = useRef<HTMLSelectElement>(null)

  // Handle null/undefined values - convert to empty string to avoid React warning
  const fieldValue = field.value === null || field.value === undefined ? '' : field.value

  const hasError = Boolean(meta.error)

  const showErrorToast = async () => {
    await validateForm()
    if (!meta.error || !selectRef.current) return

    const rect = selectRef.current.getBoundingClientRect()

    toast.custom(
      (t: Toast) => (
        <div
          style={{
            position: 'fixed',
            top: rect.top - 32,
            left: rect.left,
            background: '#dc3545',
            color: '#fff',
            padding: '6px 10px',
            borderRadius: '4px',
            fontSize: '12px',
            whiteSpace: 'nowrap',
            zIndex: 9999,
          }}
          onClick={() => toast.dismiss(t.id)}>
          {meta.error}
        </div>
      ),
      {
        id: name,
        duration: 2000,
      },
    )
  }

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    field.onChange(e)
    if (onChange) {
      // Convert empty string to null
      const value = e.target.value === '' ? null : e.target.value
      onChange(value)
    }
    toast.dismiss(name) // Hide toast when value changes
  }

  return (
    <Form.Group as={Col} md={md} className={className}>
      {label && (
        <Form.Label
          style={{
            fontSize: '13px',
            marginBottom: '4px',
            fontWeight: 400,
          }}>
          {label}
        </Form.Label>
      )}

      <Form.Select
        ref={selectRef}
        name={field.name}
        value={fieldValue}
        size={size}
        onChange={handleChange}
        isInvalid={hasError}
        disabled={disabled || isLoading}
        style={{
          ...inputStyle,
          cursor: 'pointer',
          height: '33px',
          padding: '3px 6px',
          fontSize: '13px',
          border: hasError
            ? '1px solid #dc3545'
            : '1px solid #ced4da',
          boxShadow: 'none',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
        }}
        /* hover effect */
        onMouseEnter={e => {
          if (!hasError) {
            e.currentTarget.style.border = '1px solid #86b7fe'
          }
        }}
        onMouseLeave={e => {
          if (!hasError) {
            e.currentTarget.style.border = '1px solid #ced4da'
          }
        }}
        /* focus effect */
        onFocus={e => {
          if (!hasError) {
            e.currentTarget.style.border = '1px solid #86b7fe'
            e.currentTarget.style.boxShadow =
              '0 0 0 0.1rem rgba(13,110,253,.25)'
          }
        }}
        onBlur={e => {
          if (!hasError) {
            e.currentTarget.style.border = '1px solid #ced4da'
            e.currentTarget.style.boxShadow = 'none'
          }
        }}
        /* click to show error toast */
        onClick={() => {
          if (hasError && !isLoading) showErrorToast()
        }}
      >
        <option value="">{isLoading ? 'Loading...' : placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Form.Select>

      {hasError && <Form.Control.Feedback type="invalid">{meta.error}</Form.Control.Feedback>}
    </Form.Group>
  )
}

export default FormikSelect
