import { forwardRef, useImperativeHandle } from 'react'
import { Row } from 'react-bootstrap'
import { FormikProvider, useFormik } from 'formik'
import * as Yup from 'yup'
import FormikTextInput from '@/components/Common/FormikTextInput'
import FormikSelect from '@/components/Common/FormikSelect'

type NationalityFormData = {
  nationality: string
  nationality_code: string
  status: string
}

const defaultForm: NationalityFormData = {
  nationality: '',
  nationality_code: '',
  status: 'Active',
}

interface NationalityFormProps {
  selectedItem?: NationalityFormData
  onSave: (values: NationalityFormData) => void
  onCancel?: () => void
}

const NationalityForm = forwardRef<any, NationalityFormProps>(({ selectedItem, onSave }, ref) => {
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: selectedItem
      ? {
          nationality: selectedItem.nationality,
          nationality_code: selectedItem.nationality_code,
          status: selectedItem.status,
        }
      : defaultForm,
    validationSchema: Yup.object({
      nationality: Yup.string().required('Nationality name is required'),
      nationality_code: Yup.string().required('Nationality code is required'),
      status: Yup.string().required('Status is required'),
    }),
    onSubmit: (values) => {
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
            label="Nationality"
            name="nationality"
            placeholder="Enter nationality"
            md={6}
          />

          <FormikTextInput
            label="Nationality Code"
            name="nationality_code"
            placeholder="Enter code"
            md={6}
          />

          <FormikSelect
            label="Status"
            name="status"
            options={[
              { label: 'Active', value: 'Active' },
              { label: 'Inactive', value: 'Inactive' },
            ]}
          />
        </Row>
      </form>
    </FormikProvider>
  )
})

export default NationalityForm