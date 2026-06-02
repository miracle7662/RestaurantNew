import { forwardRef, useImperativeHandle } from 'react'
import { Row } from 'react-bootstrap'
import { FormikProvider, useFormik } from 'formik'
import * as Yup from 'yup'
import FormikTextInput from '@/components/Common/FormikTextInput'
import FormikSelect from '@/components/Common/FormikSelect'

type FeatureFormData = {
  feature: string
  description: string
  status: number
}

const defaultForm: FeatureFormData = {
  feature: '',
  description: '',
  status: 1,
}

interface FeatureFormProps {
  selectedItem?: FeatureFormData
  onSave: (values: FeatureFormData) => void
  onCancel?: () => void
}

const FeatureForm = forwardRef<any, FeatureFormProps>(({ selectedItem, onSave }, ref) => {
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: selectedItem
      ? {
          feature: selectedItem.feature,
          description: selectedItem.description || '',
          status: selectedItem.status,
        }
      : defaultForm,
    validationSchema: Yup.object({
      feature: Yup.string().required('Feature name is required'),
      description: Yup.string(),
      status: Yup.number().required('Status is required'),
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
            label="Feature Name"
            name="feature"
            placeholder="Enter feature name"
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

          <FormikTextInput
            label="Description"
            type="textarea"
            name="description"
            placeholder="Enter description"
            rows={3}
            md={12}
          />

          
        </Row>
      </form>
    </FormikProvider>
  )
})

export default FeatureForm