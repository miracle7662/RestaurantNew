import { forwardRef, useImperativeHandle, useEffect, useState } from 'react'
import { Row, Col } from 'react-bootstrap'
import { FormikProvider, useFormik } from 'formik'
import * as Yup from 'yup'
import FormikTextInput from '@/components/Common/FormikTextInput'
import FormikCheckbox from '@/components/Common/FormikCheckbox'
import FormikSelect from '@/components/Common/FormikSelect'
import CityService from '@/common/api/cities'
import CountryService from '@/common/api/countries'
import StateService from '@/common/api/states'

export type CompanyFormData = {
  company_id?: number
  company_name: string
  establishment_date: string
  address: string
  state_id?: number | null
  city_id?: number | null
  country_id?: number | null
  mobile1: string
  mobile2: string
  gst_no: string
  email: string
  website: string
  booking_contact_name: string
  booking_contact_mobile: string
  booking_contact_phone: string
  corresponding_contact_name: string
  corresponding_contact_mobile: string
  corresponding_contact_phone: string
  credit_limit: string
  credit_allowed: number
  company_info: string
  have_discount: number
  status: number
  hotelid?: number
  created_by_id?: number
  updated_by_id?: number
}

const defaultForm: CompanyFormData = {
  company_name: '',
  establishment_date: '',
  address: '',
  state_id: null,
  city_id: null,
  country_id: null,
  mobile1: '',
  mobile2: '',
  gst_no: '',
  email: '',
  website: '',
  booking_contact_name: '',
  booking_contact_mobile: '',
  booking_contact_phone: '',
  corresponding_contact_name: '',
  corresponding_contact_mobile: '',
  corresponding_contact_phone: '',
  credit_limit: '',
  credit_allowed: 0,
  company_info: '',
  have_discount: 0,
  status: 1,
}

const formatDateForBackend = (dateString: string): string => {
  if (!dateString) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString
  
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ''
    return date.toISOString().split('T')[0]
  } catch {
    return ''
  }
}

interface CompanyFormProps {
  selectedItem?: CompanyFormData
  onSave: (values: CompanyFormData) => void
}

const CompanyForm = forwardRef<any, CompanyFormProps>(({ selectedItem, onSave }, ref) => {
  const [cities, setCities] = useState<Array<{ id: number; name: string }>>([])
  const [states, setStates] = useState<Array<{ id: number; name: string }>>([])
  const [countries, setCountries] = useState<Array<{ id: number; name: string }>>([])
  const [loadingCities, setLoadingCities] = useState(false)
  const [loadingStates, setLoadingStates] = useState(false)
  const [loadingCountries, setLoadingCountries] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoadingCities(true)
      setLoadingStates(true)
      setLoadingCountries(true)

      try {
        const [citiesRes, statesRes, countriesRes] = await Promise.all([
          CityService.list(),
          StateService.list(),
          CountryService.list(),
        ])

        const normalize = (res: any, idField: string, nameField: string) => {
          let data: any[] = []
          if (res && Array.isArray(res)) data = res
          else if (res?.data && Array.isArray(res.data)) data = res.data
          else if (res?.data?.data && Array.isArray(res.data.data)) data = res.data.data
          return data
            .map((item: any) => ({
              id: item[idField] || item.id,
              name: item[nameField] || item.name,
            }))
            .filter((item: any) => item.name && item.id)
        }

        setCities(normalize(citiesRes, 'cityid', 'city_name'))
        setStates(normalize(statesRes, 'stateid', 'state_name'))
        setCountries(normalize(countriesRes, 'countryid', 'country_name'))
      } catch (error) {
        console.error('Failed to load location data:', error)
      } finally {
        setLoadingCities(false)
        setLoadingStates(false)
        setLoadingCountries(false)
      }
    }

    fetchData()
  }, [])

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: selectedItem
      ? {
          ...defaultForm,
          ...selectedItem,
          credit_limit: selectedItem.credit_limit?.toString() || '',
          credit_allowed: selectedItem.credit_allowed ? 1 : 0,
          have_discount: selectedItem.have_discount ? 1 : 0,
          establishment_date: selectedItem.establishment_date 
            ? formatDateForBackend(selectedItem.establishment_date)
            : '',
        }
      : defaultForm,
    validationSchema: Yup.object({
      company_name: Yup.string().required('Company name is required'),
      mobile1: Yup.string().required('Mobile 1 is required'),
      email: Yup.string().email('Invalid email'),
    }),
    onSubmit: (values) => {
      const formattedValues = {
        ...values,
        establishment_date: formatDateForBackend(values.establishment_date),
      }
      onSave(formattedValues)
    },
  })

  const { handleSubmit, values, setFieldValue } = formik

  useImperativeHandle(ref, () => ({
    saveData: handleSubmit,
  }))

  const toUppercaseExceptEmailWebsite = (field: string, value: string) => {
    if (field === 'email' || field === 'website') {
      return value
    }
    return value.toUpperCase()
  }

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFieldValue(name, checked ? 1 : 0)
  }

  const handleEnterKey = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key !== 'Enter') return
    const target = e.target as HTMLElement
    const tag = target.tagName.toLowerCase()
    if (tag === 'textarea' || tag === 'button') return
    if ((target as HTMLInputElement).type === 'submit') return

    e.preventDefault()

    const focusableSelectors = [
      'input:not([disabled]):not([readonly]):not([type="hidden"])',
      'select:not([disabled])',
      'textarea:not([disabled]):not([readonly])',
      '[tabindex]:not([tabindex="-1"]):not([disabled])',
    ].join(', ')

    const form = e.currentTarget
    const allFocusable = Array.from(form.querySelectorAll<HTMLElement>(focusableSelectors)).filter(
      (el) => {
        const style = window.getComputedStyle(el)
        return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null
      },
    )
    const currentIndex = allFocusable.indexOf(target)
    if (currentIndex !== -1 && currentIndex < allFocusable.length - 1) {
      allFocusable[currentIndex + 1].focus()
    }
  }

  return (
    <FormikProvider value={formik}>
      <form onSubmit={handleSubmit} onKeyDown={handleEnterKey}>
        <Row className="g-0">
          <Col md={7}>
            <div className="p-1 rounded mb-1">
              <Row className="align-items-center g-3 mb-2">
                <Col md={3}> Name</Col>
                <Col md={8}>
                  <FormikTextInput
                    name="company_name"
                    placeholder="Enter company name"
                    className="w-100"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setFieldValue('company_name', toUppercaseExceptEmailWebsite('company_name', e.target.value))
                    }}
                  />
                </Col>
              </Row>

              <Row className="align-items-center g-2 mb-2">
                <Col md={3}>Est. Date</Col>
                <Col md={4}>
                  <FormikTextInput 
                    name="establishment_date" 
                    type="date" 
                    className="w-100"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setFieldValue('establishment_date', e.target.value)
                    }}
                  />
                </Col>
              </Row>

              <Row className="align-items-center g-2 mb-2">
                <Col md={3}>Email</Col>
                <Col md={8}>
                  <FormikTextInput
                    name="email"
                    type="email"
                    placeholder="Enter email"
                    className="w-100"
                  />
                </Col>
              </Row>

              <Row className="align-items-center g-2 mb-2">
                <Col md={3}>Website</Col>
                <Col md={8}>
                  <FormikTextInput
                    name="website"
                    placeholder="Enter website"
                    className="w-100"
                  />
                </Col>
              </Row>

              <Row className="align-items-center g-2 mb-2">
                <Col md={3} className="pt-1">
                  Address
                </Col>
                <Col md={8}>
                  <FormikTextInput
                    name="address"
                    as="textarea"
                    placeholder="Enter address"
                    className="w-100"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setFieldValue('address', toUppercaseExceptEmailWebsite('address', e.target.value))
                    }}
                  />
                </Col>
              </Row>

              <Row className="align-items-center g-2 mb-2">
                <Col md={3} className="pt-1">
                  State
                </Col>
                <Col md={4}>
                  <FormikSelect
                    name="state_id"
                    options={states.map((s) => ({ label: s.name, value: s.id }))}
                    className="w-100"
                    isLoading={loadingStates}
                  />
                </Col>
              </Row>

              <Row className="align-items-center g-2 mb-2">
                <Col md={3} className="pt-1">
                  City
                </Col>
                <Col md={4}>
                  <FormikSelect
                    name="city_id"
                    options={cities.map((c) => ({ label: c.name, value: c.id }))}
                    className="w-100"
                    isLoading={loadingCities}
                  />
                </Col>
              </Row>

              <Row className="align-items-center g-2 mb-2">
                <Col md={3} className="pt-1">
                  Country
                </Col>
                <Col md={4}>
                  <FormikSelect
                    name="country_id"
                    options={countries.map((c) => ({ label: c.name, value: c.id }))}
                    className="w-100"
                    isLoading={loadingCountries}
                  />
                </Col>
              </Row>

              <Row className="align-items-center g-2 mb-2">
                <Col md={3} className="pt-1">
                  Mobile
                </Col>
                <Col md={4}>
                  <FormikTextInput
                    name="mobile1"
                    placeholder="Mobile number 1"
                    className="w-100"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setFieldValue('mobile1', toUppercaseExceptEmailWebsite('mobile1', e.target.value))
                    }}
                  />
                </Col>
                <Col md={4}>
                  <FormikTextInput
                    name="mobile2"
                    placeholder="Mobile number 2"
                    className="w-100"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setFieldValue('mobile2', toUppercaseExceptEmailWebsite('mobile2', e.target.value))
                    }}
                  />
                </Col>
              </Row>

              <Row className="align-items-center g-2 mb-2">
                <Col md={3}>GST No</Col>
                <Col md={4}>
                  <FormikTextInput
                    name="gst_no"
                    placeholder="Enter GST number"
                    className="w-100"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setFieldValue('gst_no', toUppercaseExceptEmailWebsite('gst_no', e.target.value))
                    }}
                  />
                </Col>
              </Row>
            </div>
          </Col>

          <Col md={5}>
            <div className="p-0">
              <div className="d-flex align-items-center mb-3">
                <div style={{ flex: 1, height: "1px", backgroundColor: "#6b6b6b" }}></div>
                <h6 className="mb-0 fw-normal px-3">Booking Contact Person</h6>
                <div style={{ flex: 1, height: "1px", backgroundColor: "#6b6b6b" }}></div>
              </div>
              <Row className="align-items-center g-2 mb-1">
                <Col md={2}>Name</Col>
                <Col md={10}>
                  <FormikTextInput
                    name="booking_contact_name"
                    placeholder="Enter booking contact name"
                    className="w-100"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setFieldValue('booking_contact_name', toUppercaseExceptEmailWebsite('booking_contact_name', e.target.value))
                    }}
                  />
                </Col>
              </Row>

              <Row className="align-items-center g-2 mb-1">
                <Col md={2} className="pt-1">
                  Mobile
                </Col>
                <Col md={5}>
                  <FormikTextInput
                    name="booking_contact_mobile"
                    placeholder="Mobile 1"
                    className="w-100"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setFieldValue('booking_contact_mobile', toUppercaseExceptEmailWebsite('booking_contact_mobile', e.target.value))
                    }}
                  />
                </Col>
                <Col md={5}>
                  <FormikTextInput
                    name="booking_contact_phone"
                    placeholder="Mobile 2"
                    className="w-100"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setFieldValue('booking_contact_phone', toUppercaseExceptEmailWebsite('booking_contact_phone', e.target.value))
                    }}
                  />
                </Col>
              </Row>
            </div>

            <div className="p-1">
              <div className="d-flex align-items-center mb-3">
                <div style={{ flex: 1, height: "1px", backgroundColor: "#6b6b6b" }}></div>
                <h6 className="mb-0 fw-normal px-3">Corresponding Contact Person</h6>
                <div style={{ flex: 1, height: "1px", backgroundColor: "#6b6b6b" }}></div>
              </div>

              <Row className="align-items-center g-2 mb-1">
                <Col md={2}>Name</Col>
                <Col md={10}>
                  <FormikTextInput
                    name="corresponding_contact_name"
                    placeholder="Enter contact name"
                    className="w-100"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setFieldValue('corresponding_contact_name', toUppercaseExceptEmailWebsite('corresponding_contact_name', e.target.value))
                    }}
                  />
                </Col>
              </Row>

              <Row className="align-items-center g-2 mb-1">
                <Col md={2} className="pt-1">
                  Mobile
                </Col>
                <Col md={5}>
                  <FormikTextInput
                    name="corresponding_contact_mobile"
                    placeholder="Mobile 1"
                    className="w-100"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setFieldValue('corresponding_contact_mobile', toUppercaseExceptEmailWebsite('corresponding_contact_mobile', e.target.value))
                    }}
                  />
                </Col>
                <Col md={5}>
                  <FormikTextInput
                    name="corresponding_contact_phone"
                    placeholder="Mobile 2"
                    className="w-100"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setFieldValue('corresponding_contact_phone', toUppercaseExceptEmailWebsite('corresponding_contact_phone', e.target.value))
                    }}
                  />
                </Col>
              </Row>
            </div>

            <div className="p-1">
              <div className="d-flex align-items-center mb-3">
                <div style={{ flex: 1, height: "1px", backgroundColor: "#6b6b6b" }}></div>
                <h6 className="mb-0 fw-normal px-3">Credit & Company Info</h6>
                <div style={{ flex: 1, height: "1px", backgroundColor: "#6b6b6b" }}></div>
              </div>

              <Row className="align-items-center g-2 mb-1">
                <Col md={4}>Credit Limit</Col>
                <Col md={8}>
                  <FormikTextInput
                    name="credit_limit"
                    placeholder="Enter credit limit"
                    className="w-100"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setFieldValue('credit_limit', toUppercaseExceptEmailWebsite('credit_limit', e.target.value))
                    }}
                  />
                </Col>
              </Row>

              <Row className="align-items-center g-2 mb-1">
                <Col md={4} className="pt-1">
                  Company Info
                </Col>
                <Col md={8}>
                  <FormikTextInput
                    name="company_info"
                    as="textarea"
                    rows={2}
                    placeholder="Enter company information"
                    className="w-100"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setFieldValue('company_info', toUppercaseExceptEmailWebsite('company_info', e.target.value))
                    }}
                  />
                </Col>
              </Row>

              <Row className="align-items-center g-2 mb-1">
                <Col md={4}>Status</Col>
                <Col md={8}>
                  <FormikSelect
                    name="status"
                    options={[
                      { label: 'Active', value: 1 },
                      { label: 'Inactive', value: 0 },
                    ]}
                    className="w-100"
                  />
                </Col>
              </Row>

              <div className="d-flex align-items-center gap-4 flex-nowrap">
                <div className="text-nowrap">
                  <FormikCheckbox
                    label="Credit Allowed"
                    name="credit_allowed"
                    checked={values.credit_allowed === 1}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleCheckboxChange('credit_allowed', e.target.checked)
                    }
                  />
                </div>

                <div className="text-nowrap">
                  <FormikCheckbox
                    label="Have Discount"
                    name="have_discount"
                    checked={values.have_discount === 1}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleCheckboxChange('have_discount', e.target.checked)
                    }
                  />
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </form>
    </FormikProvider>
  )
})

export default CompanyForm