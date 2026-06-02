import { forwardRef, useEffect, useState, useImperativeHandle, useRef, useCallback } from 'react'
import { Row } from 'react-bootstrap'
import { FormikProvider, useFormik } from 'formik'
import * as Yup from 'yup'
import { toast } from 'react-hot-toast'
import FormikTextInput from '@/components/Common/FormikTextInput'
import FormikSelect from '@/components/Common/FormikSelect'
import countryApi from '@/common/api/countries'
import stateApi from '@/common/api/states'
import CityService from '@/common/api/cities';
import hotelTaxApi from '@/common/hotel/taxes'

type TravelAgent = {
  agent_id: number
  agent_name: string
  agent_code: string | null
  contact_person: string | null
  mobile_no: string
  email: string | null
  address: string | null
  country_id: number | null
  country_name: string | null
  state_id: number | null
  state_name: string | null
  city_id: number | null
  city_name: string | null
  pincode: string | null
  gst_no: string | null
  pan_no: string | null
  commission_type: 'PERCENTAGE' | 'FIXED'
  commission_value: number
  service_fee: number
  cgst: number
  sgst: number
  igst: number
  cess: number
  tds: number
  tcs: number
  billing_type: 'PREPAID' | 'CREDIT'
  credit_days: number
  tax_id: number | null
  status: number
}

type TravelAgentFormData = {
  agent_name: string
  agent_code: string
  contact_person: string
  mobile_no: string
  email: string
  address: string
  country_id: number | null
  state_id: number | null
  city_id: number | null
  pincode: string
  gst_no: string
  pan_no: string
  commission_type: 'PERCENTAGE' | 'FIXED'
  commission_value: number
  service_fee: number
  cgst: number
  sgst: number
  igst: number
  cess: number
  tds: number
  tcs: number
  billing_type: 'PREPAID' | 'CREDIT'
  credit_days: number
  tax_id: number | null
  status: number
}

const defaultForm: TravelAgentFormData = {
  agent_name: '',
  agent_code: '',
  contact_person: '',
  mobile_no: '',
  email: '',
  address: '',
  country_id: null,
  state_id: null,
  city_id: null,
  pincode: '',
  gst_no: '',
  pan_no: '',
  commission_type: 'PERCENTAGE',
  commission_value: 0,
  service_fee: 0,
  cgst: 0,
  sgst: 0,
  igst: 0,
  cess: 0,
  tds: 0,
  tcs: 0,
  billing_type: 'PREPAID',
  credit_days: 0,
  tax_id: null,
  status: 1,
}

interface TravelAgentFormProps {
  selectedItem?: TravelAgent
  onSave: (values: TravelAgentFormData) => void
  onCancel?: () => void
}

const TravelAgentForm = forwardRef<any, TravelAgentFormProps>(({ selectedItem, onSave }, ref) => {
  const [countries, setCountries] = useState<{ label: string; value: number }[]>([])
  const [states, setStates] = useState<{ label: string; value: number }[]>([])
  const [cities, setCities] = useState<{ label: string; value: number }[]>([])
  const [taxes, setTaxes] = useState<any[]>([])

  const prevCountryId = useRef<number | null>(null)
  const prevStateId = useRef<number | null>(null)

  // Load countries
  useEffect(() => {
    const loadCountries = async () => {
      try {
        const response = await countryApi.list()
        if (response.success && Array.isArray(response.data)) {
          const options = response.data.map((c: any) => ({
            label: c.country_name,
            value: c.countryid,
          }))
          setCountries(options)
        }
      } catch (error) {
        console.error('Failed to load countries', error)
      }
    }
    loadCountries()
  }, [])

  // Load taxes
  useEffect(() => {
    const loadTaxes = async () => {
      try {
        const response = await hotelTaxApi.list()
        if (response.success && Array.isArray(response.data)) {
          setTaxes(response.data)
        }
      } catch (error) {
        console.error('Failed to load taxes', error)
      }
    }
    loadTaxes()
  }, [])

  const loadStates = async (countryId: number | null) => {
    if (!countryId) {
      setStates([])
      return
    }
    try {
      const response = await stateApi.list({ countryid: countryId })
      if (response.success && Array.isArray(response.data)) {
        const options = response.data.map((s: any) => ({
          label: s.state_name,
          value: s.stateid,
        }))
        setStates(options)
      }
    } catch (error) {
      console.error('Failed to load states', error)
    }
  }

  const loadCities = async (stateId: number | null) => {
    if (!stateId) {
      setCities([])
      return
    }
    try {
      const response = await CityService.list({ stateId: stateId })
      if (response.success && Array.isArray(response.data)) {
        const options = response.data.map((c: any) => ({
          label: c.city_name,
          value: c.cityid,
        }))
        setCities(options)
      }
    } catch (error) {
      console.error('Failed to load cities', error)
    }
  }

  const initialValues = selectedItem
    ? {
        agent_name: selectedItem.agent_name,
        agent_code: selectedItem.agent_code ?? '',
        contact_person: selectedItem.contact_person ?? '',
        mobile_no: selectedItem.mobile_no,
        email: selectedItem.email ?? '',
        address: selectedItem.address ?? '',
        country_id: selectedItem.country_id,
        state_id: selectedItem.state_id,
        city_id: selectedItem.city_id,
        pincode: selectedItem.pincode ?? '',
        gst_no: selectedItem.gst_no ?? '',
        pan_no: selectedItem.pan_no ?? '',
        commission_type: selectedItem.commission_type,
        commission_value: selectedItem.commission_value,
        service_fee: selectedItem.service_fee,
        cgst: selectedItem.cgst,
        sgst: selectedItem.sgst,
        igst: selectedItem.igst,
        cess: selectedItem.cess,
        tds: selectedItem.tds,
        tcs: selectedItem.tcs,
        billing_type: selectedItem.billing_type,
        credit_days: selectedItem.credit_days,
        tax_id: selectedItem.tax_id ?? null,
        status: selectedItem.status,
      }
    : defaultForm

  // Validation schema
  const validationSchema = Yup.object({
    agent_name: Yup.string().required('Agent name is required'),
    mobile_no: Yup.string().required('Mobile number is required'),
    status: Yup.number().required('Status is required'),
  })

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: initialValues,
    validationSchema: validationSchema,
    validateOnChange: false,
    validateOnBlur: false,
    onSubmit: (values) => {
      onSave(values)
    },
  })

  const { handleSubmit, values, setFieldValue, setTouched, validateForm } = formik

  // Helper function to validate all fields and show errors on save attempt
  const validateAndSubmit = useCallback(async () => {
    const formErrors = await validateForm()
    
    if (Object.keys(formErrors).length > 0) {
      // Set touched for required fields
      const allFields: any = {
        agent_name: true,
        mobile_no: true,
        status: true,
      }
      setTouched(allFields, true)
      toast.error('Please fill in all required fields')
      return false
    }
    
    return true
  }, [validateForm, setTouched])

  useImperativeHandle(ref, () => ({
    saveData: async () => {
      const isValid = await validateAndSubmit()
      if (!isValid) return
      handleSubmit()
    },
  }))

  // Country change: load states only if country changed
  useEffect(() => {
    if (values.country_id !== prevCountryId.current) {
      prevCountryId.current = values.country_id
      if (prevCountryId.current !== null && selectedItem?.country_id !== values.country_id) {
        setFieldValue('state_id', null)
        setFieldValue('city_id', null)
      }
      loadStates(values.country_id)
    }
  }, [values.country_id, setFieldValue, selectedItem])

  // State change: load cities only if state changed
  useEffect(() => {
    if (values.state_id !== prevStateId.current) {
      prevStateId.current = values.state_id
      if (prevStateId.current !== null && selectedItem?.state_id !== values.state_id) {
        setFieldValue('city_id', null)
      }
      loadCities(values.state_id)
    }
  }, [values.state_id, setFieldValue, selectedItem])

  // Load initial states and cities when editing
  useEffect(() => {
    if (selectedItem) {
      if (selectedItem.country_id) loadStates(selectedItem.country_id)
      if (selectedItem.state_id) loadCities(selectedItem.state_id)
    }
  }, [selectedItem])

  // Auto-fill tax fields when tax selection changes
  useEffect(() => {
    if (values.tax_id && taxes.length > 0) {
      const selectedTax = taxes.find(
        (t) => Number(t.hotel_taxid) === Number(values.tax_id)
      )
      if (selectedTax) {
        setFieldValue('cgst', Number(selectedTax.hotel_cgst) || 0)
        setFieldValue('sgst', Number(selectedTax.hotel_sgst) || 0)
        setFieldValue('igst', Number(selectedTax.hotel_igst) || 0)
        setFieldValue('cess', Number(selectedTax.hotel_cess) || 0)
      }
    } else {
      setFieldValue('cgst', 0)
      setFieldValue('sgst', 0)
      setFieldValue('igst', 0)
      setFieldValue('cess', 0)
    }
  }, [values.tax_id, taxes])

  // Helper to convert input to uppercase
  const toUppercase = (value: string) => {
    return value.toUpperCase()
  }

  return (
    <FormikProvider value={formik}>
      <form onSubmit={handleSubmit}>
        <Row className="g-3">
          <FormikTextInput
            label="Agent Name"
            name="agent_name"
            placeholder="Enter agent name"
            md={6}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setFieldValue('agent_name', toUppercase(e.target.value))
            }}
          />
          <FormikTextInput
            label="Agent Code"
            name="agent_code"
            placeholder="Enter agent code"
            md={6}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setFieldValue('agent_code', toUppercase(e.target.value))
            }}
          />
          <FormikTextInput
            label="Contact Person Name"
            name="contact_person"
            placeholder="Enter contact person"
            md={6}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setFieldValue('contact_person', toUppercase(e.target.value))
            }}
          />
          <FormikTextInput
            label="Mobile No"
            name="mobile_no"
            placeholder="Enter mobile number"
            md={6}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setFieldValue('mobile_no', e.target.value)
            }}
          />
          <FormikTextInput
            label="Email"
            name="email"
            placeholder="Enter email"
            md={6}
            type="email"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setFieldValue('email', e.target.value.toLowerCase())
            }}
          />
          <FormikTextInput
            label="Address"
            name="address"
            placeholder="Enter address"
            as="textarea"
            rows={3}
            md={12}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setFieldValue('address', toUppercase(e.target.value))
            }}
          />
          <FormikSelect
            label="Country"
            name="country_id"
            options={countries}
            placeholder="Select country"
            md={4}
          />
          <FormikSelect
            label="State"
            name="state_id"
            options={states}
            placeholder="Select state"
            md={4}
            disabled={!values.country_id}
          />
          <FormikSelect
            label="City"
            name="city_id"
            options={cities}
            placeholder="Select city"
            md={4}
            disabled={!values.state_id}
          />
          <FormikTextInput 
            label="Pincode" 
            name="pincode" 
            placeholder="Enter pincode" 
            md={4}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setFieldValue('pincode', e.target.value)
            }}
          />
          <FormikTextInput 
            label="GST No" 
            name="gst_no" 
            placeholder="Enter GST number" 
            md={4}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setFieldValue('gst_no', toUppercase(e.target.value))
            }}
          />
          <FormikTextInput 
            label="PAN No" 
            name="pan_no" 
            placeholder="Enter PAN number" 
            md={4}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setFieldValue('pan_no', toUppercase(e.target.value))
            }}
          />
          <FormikSelect
            label="Commission Type"
            name="commission_type"
            options={[
              { label: 'Percentage', value: 'PERCENTAGE' },
              { label: 'Fixed', value: 'FIXED' },
            ]}
            md={4}
          />
          <FormikTextInput
            label="Commission Value"
            name="commission_value"
            placeholder="Enter commission value"
            type="number"
            md={4}
          />
          <FormikTextInput
            label="Service Fee"
            name="service_fee"
            placeholder="Enter service fee"
            type="number"
            md={4}
          />
          <FormikSelect
            label="Tax Rate"
            name="tax_id"
            options={taxes.map((t) => ({
              label: t.hotel_tax_value.toString(),
              value: t.hotel_taxid,
            }))}
            placeholder="Select tax rate"
            md={4}
          />
          <FormikTextInput
            label="CGST (%)"
            name="cgst"
            placeholder="Enter CGST"
            type="number"
            step="0.01"
            md={3}
          />
          <FormikTextInput
            label="SGST (%)"
            name="sgst"
            placeholder="Enter SGST"
            type="number"
            step="0.01"
            md={3}
          />
          <FormikTextInput
            label="IGST (%)"
            name="igst"
            placeholder="Enter IGST"
            type="number"
            step="0.01"
            md={3}
          />
          <FormikTextInput
            label="CESS (%)"
            name="cess"
            placeholder="Enter CESS"
            type="number"
            step="0.01"
            md={3}
          />
          <FormikTextInput
            label="TDS (%)"
            name="tds"
            placeholder="Enter TDS"
            type="number"
            step="0.01"
            md={3}
          />
          <FormikTextInput
            label="TCS (%)"
            name="tcs"
            placeholder="Enter TCS"
            type="number"
            step="0.01"
            md={3}
          />
          <FormikSelect
            label="Billing Type"
            name="billing_type"
            options={[
              { label: 'Prepaid', value: 'PREPAID' },
              { label: 'Credit', value: 'CREDIT' },
            ]}
            md={3}
          />
          <FormikTextInput
            label="Credit Days"
            name="credit_days"
            placeholder="Enter credit days"
            type="number"
            md={3}
          />
          <FormikSelect
            label="Status"
            name="status"
            options={[
              { label: 'Active', value: 1 },
              { label: 'Inactive', value: 0 },
            ]}
            md={3}
          />
        </Row>
      </form>
    </FormikProvider>
  )
})

export default TravelAgentForm