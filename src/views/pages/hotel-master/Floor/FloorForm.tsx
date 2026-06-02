import { forwardRef, useImperativeHandle } from 'react'
import { Row } from 'react-bootstrap'
import { FormikProvider, useFormik } from 'formik'
import * as Yup from 'yup'
import FormikTextInput from '@/components/Common/FormikTextInput'
import FormikSelect from '@/components/Common/FormikSelect'
import { useAuthContext } from '@/common/context/useAuthContext'

type FloorFormData = {
  floor_id?: number
  floor_name: string
  floor_number: string
  status: number
  created_by_id?: number
  updated_by_id?: number
  user_id?: number
}

const defaultForm: FloorFormData = {
  floor_name: '',
  floor_number: '',
  status: 1,
}

interface FloorFormProps {
  selectedItem?: FloorFormData
  onSave: (values: FloorFormData) => void
}

const FloorForm = forwardRef<any, FloorFormProps>(({ selectedItem, onSave }, ref) => {
  const { user } = useAuthContext()
  
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: selectedItem
      ? {
          floor_id: selectedItem.floor_id,
          floor_name: selectedItem.floor_name,
          floor_number: selectedItem.floor_number,
          status: selectedItem.status,
          user_id: user?.id,
        }
      : { ...defaultForm, user_id: user?.id },
    validationSchema: Yup.object({
      floor_name: Yup.string().required('Floor name is required'),
      floor_number: Yup.string().required('Floor number is required'),
      status: Yup.number().required('Status is required'),
    }),
    onSubmit: (values) => {
      const { user_id, ...payload } = values
      
      // Ensure status is a number
      payload.status = Number(values.status)
      
      if (selectedItem?.floor_id) {
        // Update mode - set updated_by_id
        if (user?.id) {
          payload.updated_by_id = user.id
        }
      } else {
        // Create mode - set created_by_id
        if (user?.id) {
          payload.created_by_id = user.id
        }
      }
      onSave(payload)
    },
  })
  const { handleSubmit } = formik

  useImperativeHandle(ref, () => ({
    saveData: handleSubmit,
  }))

  return (
    <FormikProvider value={formik}>
      <form onSubmit={handleSubmit}>
        <Row className="g-3">
          <FormikTextInput
            label="Floor Name"
            name="floor_name"
            placeholder="Enter floor name"
            md={6}
          />

          <FormikTextInput
            label="Floor Number"
            name="floor_number"
            placeholder="Enter floor number"
            md={6}
          />

          <FormikSelect
            label="Status"
            name="status"
            options={[
              { label: 'Active', value: 1 },
              { label: 'Inactive', value: 0 },
            ]}
            md={6}
          />
        </Row>
      </form>
    </FormikProvider>
  )
})

export default FloorForm