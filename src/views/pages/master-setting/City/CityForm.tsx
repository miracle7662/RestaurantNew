import { forwardRef, useEffect, useImperativeHandle, useState, useCallback } from 'react'
import { Row, Col } from 'react-bootstrap'
import { FormikProvider, useFormik } from 'formik'
import * as Yup from 'yup'
import FormikTextInput from '@/components/Common/FormikTextInput'
import FormikSelect from '@/components/Common/FormikSelect'
import FormikCheckbox from '@/components/Common/FormikCheckbox' 
import countryApi from '@/common/hotel/countries'
import stateApi from '@/common/hotel/states'

type CityFormData = {
  city_name: string
  city_Code: string
  countryId: number
  stateId: number
  iscoastal: boolean | number
  status: number
}

const defaultForm: CityFormData = {
  city_name: '',
  city_Code: '',
  countryId: 0,
  stateId: 0,
  iscoastal: false,
  status: 1,
}

interface CityFormProps {
  selectedItem?: CityFormData
  onSave: (values: CityFormData) => void
  onCancel?: () => void
}

const CityForm = forwardRef<any, CityFormProps>(({ selectedItem, onSave }, ref) => {
  const [countries, setCountries] = useState<any[]>([])
  const [states, setStates] = useState<any[]>([])
  const [loadingCountries, setLoadingCountries] = useState(false)
  const [loadingStates, setLoadingStates] = useState(false)
  const [initialized, setInitialized] = useState(false)

  // Load countries on mount
  useEffect(() => {
    const loadCountries = async () => {
      setLoadingCountries(true)
      try {
        const response = await countryApi.list()
        if (response.success && Array.isArray(response.data)) {
          setCountries(response.data.filter((item: any) => item.status === 1))
        }
      } catch (error) {
        console.error('Failed to load countries:', error)
      } finally {
        setLoadingCountries(false)
      }
    }
    loadCountries()
  }, [])

  // Load states function
  const loadStates = useCallback(async (countryId: number) => {
    if (!countryId) {
      setStates([])
      return
    }
    setLoadingStates(true)
    try {
      const response = await stateApi.list({ countryid: countryId })
      if (response.success && Array.isArray(response.data)) {
        setStates(response.data.filter((item: any) => item.status === 1))
      }
    } catch (error) {
      console.error('Failed to load states:', error)
    } finally {
      setLoadingStates(false)
    }
  }, [])

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: selectedItem
      ? {
          city_name: selectedItem.city_name,
          city_Code: selectedItem.city_Code,
          countryId: selectedItem.countryId || 0,
          stateId: selectedItem.stateId || 0,
          iscoastal: selectedItem.iscoastal === 1 || selectedItem.iscoastal === true,
          status: selectedItem.status,
        }
      : defaultForm,
    validationSchema: Yup.object({
      city_name: Yup.string().required('City name is required'),
      city_Code: Yup.string().required('City code is required'),
      countryId: Yup.number().required('Country is required').min(1, 'Country is required'),
      stateId: Yup.number().required('State is required').min(1, 'State is required'),
      iscoastal: Yup.boolean(),
      status: Yup.number().required('Status is required'),
    }),
    onSubmit: (values) => {
      // Convert iscoastal back to number (0/1) for API
      const payload = {
        ...values,
        iscoastal: values.iscoastal ? 1 : 0,
      }
      onSave(payload)
    },
  })

  const { handleSubmit, setFieldValue, values } = formik

  // Load states when countryId changes in formik
  useEffect(() => {
    if (values.countryId && initialized) {
      loadStates(values.countryId)
    } else if (!values.countryId) {
      setStates([])
    }
  }, [values.countryId, initialized, loadStates])

  // Initialize on mount or when selectedItem changes
  useEffect(() => {
    const initializeForm = async () => {
      // If editing with countryId and stateId, load states
      if (selectedItem && selectedItem.countryId && selectedItem.stateId) {
        await loadStates(selectedItem.countryId)
        // Ensure form values are set correctly
        await setFieldValue('countryId', selectedItem.countryId)
        await setFieldValue('stateId', selectedItem.stateId)
      }
      setInitialized(true)
    }
    
    if (!initialized) {
      initializeForm()
    }
  }, [selectedItem, initialized, loadStates, setFieldValue])

  // When country changes, reset stateId
  const handleCountryChange = (value: string | number | null) => {
  const countryId = parseInt(value?.toString() || '', 10); // Use optional chaining and nullish coalescing to handle null values
    setFieldValue('countryId', countryId)
    setFieldValue('stateId', 0) // Reset state selection
    setStates([])
  }

  useImperativeHandle(ref, () => ({
    saveData: handleSubmit,
  }))

  return (
    <FormikProvider value={formik}>
      <form onSubmit={handleSubmit}>
        <Row className="g-3">
          <FormikTextInput
            label="City Name"
            name="city_name"
            placeholder="Enter city name"
            md={6}
          />

          <FormikTextInput
            label="City Code"
            name="city_Code"
            placeholder="Enter city code"
            md={6}
          />

          <FormikSelect
            label="Country"
            name="countryId"
            options={countries.map((c) => ({ label: c.country_name, value: c.countryid }))}
            onChange={handleCountryChange}
            md={6}
            isLoading={loadingCountries}
            placeholder="Select Country"
          />

          <FormikSelect
            label="State"
            name="stateId"
            options={states.map((s) => ({ label: s.state_name, value: s.stateid }))}
            disabled={!values.countryId || loadingStates}
            md={6}
            isLoading={loadingStates}
            placeholder={!values.countryId ? 'Select Country First' : 'Select State'}
          />

          <Col md={6}>
            <FormikCheckbox
              label="Is Coastal?"
              name="iscoastal"
            />
          </Col>

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

export default CityForm
