import React, { useRef } from 'react'
import { Modal, Button } from 'react-bootstrap'

interface FormModalProps {
  show: boolean
  onHide: () => void
  title: string

  // optional hooks
  onSave?: (data?: any) => void
  onFail?: (error?: any) => void
  onCancel?: () => void

  saving?: boolean
  submitLabel?: string
  cancelLabel?: string

  Component: React.ElementType
  componentProps?: any
  size?: 'sm' | 'lg' | 'xl'
  centered?: boolean
  selectedItem?: any
  isEdit?: boolean
}

const FormModal: React.FC<FormModalProps> = ({
  show,
  onHide,
  title,
  onSave,
  onFail,
  onCancel,
  Component,
  componentProps = {},
  saving = false,
  submitLabel,
  cancelLabel,
  size,
  centered,
  selectedItem,
  ...props
}) => {
  const childRef = useRef<any>(null)

  const handleSaveClick = () => {
    childRef.current?.saveData() // trigger Formik submit
  }

  const handleClose = () => {
    onCancel?.()
    onHide()
  }

  return (
    <Modal show={show} onHide={handleClose} size={size} centered={centered}>
      <Modal.Header closeButton className="py-1">
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ maxHeight: '75vh', overflowY: 'auto', padding: '10px', marginTop: '5px', marginLeft: '10px', marginRight: '10px' }}>
        <Component
          ref={childRef}
          {...componentProps}
          onSave={(data: any) => {
            onSave?.(data) // send data to parent - parent will handle modal close
          }}
          onFail={(err: any) => {
            onFail?.(err)
          }}
          {...props}
          selectedItem={selectedItem}
        />
      </Modal.Body>

      <Modal.Footer className="py-1">
        <Button variant="secondary" onClick={handleClose}>
          {cancelLabel || 'Cancel'}
        </Button>
        <Button variant="primary" onClick={handleSaveClick} disabled={saving}>
          {saving ? 'Saving...' : submitLabel || 'Save'}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default FormModal
