import  { useRef } from 'react'
import { useField, useFormikContext } from 'formik'
import { Form, Col } from 'react-bootstrap'
import { toast } from 'react-hot-toast'

const FormikTextInput = ({
  label,
  name,
  placeholder,
  md = 1,
  className = 'mb-0',
  ...props
}: any) => {
  const [field, meta] = useField(name)
  const { validateForm } = useFormikContext<any>()
  const inputRef = useRef<HTMLInputElement>(null)

  const hasError = Boolean(meta.error)

  const showErrorToast = async () => {
    await validateForm()
    if (!meta.error || !inputRef.current) return

    const rect = inputRef.current.getBoundingClientRect()

    toast.custom(
      (t) => (
        <div
          style={{
            position: 'fixed',
            top: rect.top - 32, // 🔑 textbox ke upar
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

  return (
    <Form.Group as={Col} md={md} className={className}>
      {label && (
        <Form.Label
          style={{
            fontSize: '13px', // same as textbox
            marginBottom: '0px',
            fontWeight: 400,
          }}>
          {label}
        </Form.Label>
      )}
      <Form.Control
        ref={inputRef}
        {...field}
        {...props}
        placeholder={placeholder}
        isInvalid={hasError}
        style={{
          cursor: 'pointer',
          height: '33px',
          padding: '3px 6px',
          fontSize: '13px',
          border: hasError ? '1px solid #dc3545' : '1px solid #ced4da',
          boxShadow: 'none',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
        }}
        /* hover effect */
        onMouseEnter={(e) => {
          if (!hasError) {
            e.currentTarget.style.border = '1px solid #86b7fe'
          }
        }}
        onMouseLeave={(e) => {
          if (!hasError) {
            e.currentTarget.style.border = '1px solid #ced4da'
          }
        }}
        /* focus effect */
        onFocus={(e) => {
          if (!hasError) {
            e.currentTarget.style.border = '1px solid #86b7fe'
            e.currentTarget.style.boxShadow = '0 0 0 0.1rem rgba(13,110,253,.25)'
          }
        }}
        onBlur={(e) => {
          if (!hasError) {
            e.currentTarget.style.border = '1px solid #ced4da'
            e.currentTarget.style.boxShadow = 'none'
          }
        }}
        /* click near bootstrap icon area */
        onClick={() => {
          if (hasError) showErrorToast()
        }}
        /* typing = hide toast */
        onChangeCapture={() => toast.dismiss(name)}
      />
    </Form.Group>
  )
}

export default FormikTextInput
