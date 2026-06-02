import { forwardRef, useImperativeHandle } from 'react'
import { Row } from 'react-bootstrap'
import { FormikProvider, useFormik } from 'formik'
import * as Yup from 'yup'
import FormikTextInput from '@/components/Common/FormikTextInput'
import FormikSelect from '@/components/Common/FormikSelect'

type HotelType = {
  hoteltypeid: number
  hotel_type: string
  status: number
}

type HotelTypeFormData = {
  hotel_type: string
  status: number
}

const defaultForm: HotelTypeFormData = {
  hotel_type: '',
  status: 1,
}

interface HotelTypeFormProps {
  selectedItem?: HotelType
  onSave: (values: HotelTypeFormData) => void
  onCancel?: () => void
}

const HotelTypeForm = forwardRef<any, HotelTypeFormProps>(({ selectedItem, onSave }, ref) => {
  console.log('selectedItem', selectedItem)
  
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: selectedItem
      ? {
          hotel_type: selectedItem.hotel_type,
          status: Number(selectedItem.status),
        }
      : defaultForm,
    validationSchema: Yup.object({
      hotel_type: Yup.string().required('Hotel type is required'),
      status: Yup.number().oneOf([0, 1], 'Invalid status').required('Status is required'),
    }),
    onSubmit: (values) => {
      console.log('values', values)
      onSave({ ...values, status: Number(values.status) })
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
            label="Hotel Type"
            name="hotel_type"
            placeholder="Enter hotel type"
            md={8}
          />

          <FormikSelect
            label="Status"
            name="status"
            options={[
              { label: 'Active', value: 1 },
              { label: 'Inactive', value: 0 },
            ]}
            md={4}
          />
        </Row>
      </form>
    </FormikProvider>
  )
})

export default HotelTypeForm