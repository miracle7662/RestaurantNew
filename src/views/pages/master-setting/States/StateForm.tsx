import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { Row } from 'react-bootstrap'
import { FormikProvider, useFormik } from 'formik'
import * as Yup from 'yup'
import FormikTextInput from '@/components/Common/FormikTextInput'
import FormikSelect from '@/components/Common/FormikSelect'
import countryApi from '@/common/hotel/countries'

type StateFormData = {
  state_name: string
  state_code: string
  state_capital: string
  countryid: number
  status: number
}

const defaultForm: StateFormData = {
  state_name: '',
  state_code: '',
  state_capital: '',
  countryid: 0,
  status: 1,
}

interface StateFormProps {
  selectedItem?: StateFormData
  onSave: (values: StateFormData) => void
  onCancel?: () => void
}

const StateForm = forwardRef<any, StateFormProps>(({ selectedItem, onSave }, ref) => {
  const [countries, setCountries] = useState<any[]>([])

  useEffect(() => {
    const loadCountries = async () => {
      try {
        const response = await countryApi.list()
        if (response.success && Array.isArray(response.data)) {
          setCountries(response.data.filter((item: any) => item.status === 1))
        }
      } catch (error) {
        console.error('Failed to load countries:', error)
      }
    }
    loadCountries()
  }, [])

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: selectedItem
      ? {
          state_name: selectedItem.state_name,
          state_code: selectedItem.state_code,
          state_capital: selectedItem.state_capital ?? '',
          countryid: selectedItem.countryid,
          status: selectedItem.status,
        }
      : defaultForm,
    validationSchema: Yup.object({
      state_name: Yup.string().required('State name is required'),
      state_code: Yup.string().required('State code is required'),
      state_capital: Yup.string(),
      countryid: Yup.number().required('Country is required').min(1, 'Country is required'),
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
            label="State Name"
            name="state_name"
            placeholder="Enter state name"
            md={6}
          />

          <FormikTextInput
            label="State Code"
            name="state_code"
            placeholder="Enter state code"
            md={6}
          />

          <FormikTextInput label="Capital" name="state_capital" placeholder="Enter capital" md={6} />

          <FormikSelect
            label="Country"
            name="countryid"
            options={countries.map((country: any) => ({
              label: country.country_name,
              value: country.countryid,
            }))}
            md={6}
          />

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

export default StateForm
