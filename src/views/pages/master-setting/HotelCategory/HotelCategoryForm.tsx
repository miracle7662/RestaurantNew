import { forwardRef, useImperativeHandle } from 'react'
import { Row } from 'react-bootstrap'
import { FormikProvider, useFormik } from 'formik'
import * as Yup from 'yup'
import FormikTextInput from '@/components/Common/FormikTextInput'
import FormikSelect from '@/components/Common/FormikSelect'

type HotelCategory = {
  hotelcategoryid: number
  category_type: string
  status: number
}

type HotelCategoryFormData = {
  category_type: string
  status: number
}

const defaultForm: HotelCategoryFormData = {
  category_type: '',
  status: 1,
}

interface HotelCategoryFormProps {
  selectedItem?: HotelCategoryFormData
  onSave: (values: HotelCategoryFormData) => void
  onCancel?: () => void
}

const HotelCategoryForm = forwardRef<any, HotelCategoryFormProps>(({ selectedItem, onSave }, ref) => {
  console.log('selectedItem', selectedItem)
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: selectedItem
      ? {
          category_type: selectedItem.category_type,
          status: selectedItem.status,
        }
      : defaultForm,
    validationSchema: Yup.object({
      category_type: Yup.string().required('Category type is required'),
      status: Yup.number().required('Status is required'),
    }),
    onSubmit: (values) => {
      console.log('values', values)
      onSave(values)
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
            label="Category Type"
            name="category_type"
            placeholder="Enter category type (e.g., Luxury, Budget, Resort)"
            md={12}
          />

          <FormikSelect
            label="Status"
            name="status"
            options={[
              { label: 'Active', value: 1 },
              { label: 'Inactive', value: 0 },
            ]}
            md={12}
          />
        </Row>
      </form>
    </FormikProvider>
  )
})

export default HotelCategoryForm