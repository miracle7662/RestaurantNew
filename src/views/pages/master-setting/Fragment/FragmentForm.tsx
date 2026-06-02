import { forwardRef, useImperativeHandle } from 'react'
import { Row } from 'react-bootstrap'
import { FormikProvider, useFormik } from 'formik'
import * as Yup from 'yup'
import FormikTextInput from '@/components/Common/FormikTextInput'
import FormikSelect from '@/components/Common/FormikSelect'

type FragmentFormData = {
  name: string
  status: number
}

const defaultForm: FragmentFormData = {
  name: '',
  status: 1,
}

interface FragmentFormProps {
  selectedItem?: FragmentFormData
  onSave: (values: FragmentFormData) => void
  onCancel?: () => void
}

const FragmentForm = forwardRef<any, FragmentFormProps>(({ selectedItem, onSave }, ref) => {
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: selectedItem || defaultForm,
    validationSchema: Yup.object({
      name: Yup.string().required('Fragment name is required'),
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
            label="Fragment Name"
            name="name"
            placeholder="Enter fragment name"
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

export default FragmentForm