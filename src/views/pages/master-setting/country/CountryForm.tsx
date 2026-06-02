import { forwardRef, useImperativeHandle } from 'react'
import { Row } from 'react-bootstrap'
import { FormikProvider, useFormik } from 'formik'
import * as Yup from 'yup'
import FormikTextInput from '@/components/Common/FormikTextInput'
import FormikSelect from '@/components/Common/FormikSelect'

type Country = {
  countryid: number
  country_name: string
  country_code: string
  country_capital: string | null
  status: number
}

type CountryFormData = {
  country_name: string
  country_code: string
  country_capital: string
  status: number
}

const defaultForm: CountryFormData = {
  country_name: '',
  country_code: '',
  country_capital: '',
  status: 1,
}

interface CountryFormProps {
  selectedItem?: Country
  onSave: (values: CountryFormData) => void
  onCancel?: () => void
}

const CountryForm = forwardRef<any, CountryFormProps>(({ selectedItem, onSave }, ref) => {
  console.log('selectedItem', selectedItem)
  
  // Ensure status is properly converted to number
  const initialValues = selectedItem
    ? {
        country_name: selectedItem.country_name,
        country_code: selectedItem.country_code,
        country_capital: selectedItem.country_capital ?? '',
        status: typeof selectedItem.status === 'boolean' 
          ? (selectedItem.status ? 1 : 0) 
          : Number(selectedItem.status),
      }
    : defaultForm

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: initialValues,
    validationSchema: Yup.object({
      country_name: Yup.string().required('Country name is required'),
      country_code: Yup.string().required('Country code is required'),
      country_capital: Yup.string(),
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
            label="Country Name"
            name="country_name"
            placeholder="Enter country name"
            md={6}
          />

          <FormikTextInput
            label="Country Code"
            name="country_code"
            placeholder="Enter country code"
            md={6}
          />

          <FormikTextInput label="Capital" name="country_capital" placeholder="Enter capital" md={6} />

          <FormikSelect
            label="Status"
            name="status"
            options={[
              { label: 'Active', value: 1 },
              { label: 'Inactive', value: 0 },
            ]}
          />
        </Row>
      </form>
    </FormikProvider>
  )
})

export default CountryForm