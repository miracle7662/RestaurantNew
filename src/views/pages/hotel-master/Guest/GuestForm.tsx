// GuestForm.tsx
import { forwardRef, useImperativeHandle, useEffect, useState, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { Row, Col, Tabs, Tab, Button, Form, Modal } from 'react-bootstrap'
import { FormikProvider, useFormik, FieldArray } from 'formik'
import * as Yup from 'yup'
import CreatableSelect from 'react-select/creatable'
import FormikTextInput from '@/components/Common/FormikTextInput'
import FormSelect from '@/components/Common/FormikSelect'
import CountryService from '@/common/api/countries';
import StateService from '@/common/api/states';
import CityService from '@/common/api/cities';      
import NationalityService from '@/common/hotel/nationalities'
import FragmentService from '@/common/hotel/fragments'
import CompanyService from '@/common/hotel/company'
import GuestTypeService from '@/common/hotel/guestType'
import PurposeService from '@/common/hotel/purpose'
import ArrivedService from '@/common/hotel/arrived'
import DepartureService from '@/common/hotel/departure'
import DocumentTypeService, { DocumentType } from '@/common/hotel/documentType'
import { useAuthContext } from '@/common/context/useAuthContext'

export type GuestFormData = {
  guest_id?: number
  fragment_id?: number | null
  name: string
  organisation: string
  address: string
  city_id?: number | null
  state_id?: number | null
  country_id?: number | null
  occupation: string
  post_held: string
  phone: string
  mobile: string
  email: string
  website: string
  purpose_id?: number | null
  arrived_id?: number | null
  departure_id?: number | null
  guest_type_id?: number | null
  purpose: string
  arrived_from: string
  departure_to: string
  guest_type: string
  birthday: string
  anniversary: string
  gender: string
  nationality_id?: number | null
  credit_allowed: number
  company_id?: number | null
  discount_percent?: number
  hotelid?: number
  created_by_id?: number
  updated_by_id?: number
  status?: number
  documents?: Array<{
    document_id?: number
    document_type: string
    document_number: string
    front_side: string | File | null
    back_side: string | File | null
    front_side_url?: string | null
    back_side_url?: string | null
    _temp_front?: File
    _temp_back?: File
  }>
}

const defaultForm: GuestFormData = {
  fragment_id: null,
  name: '',
  organisation: '',
  address: '',
  city_id: null,
  state_id: null,
  country_id: null,
  occupation: '',
  post_held: '',
  phone: '',
  mobile: '',
  email: '',
  website: '',
  purpose: '',
  arrived_from: '',
  departure_to: '',
  birthday: '',
  anniversary: '',
  gender: 'Male',
  nationality_id: null,
  guest_type: '',
  credit_allowed: 0,
  company_id: null,
  discount_percent: 0,
  status: 1,
  documents: [],
}

interface GuestFormProps {
  selectedItem: GuestFormData
  onSave: (values: GuestFormData) => void
}

const GuestForm = forwardRef<any, GuestFormProps>(({ selectedItem, onSave }, ref) => {
  const { user: authUser } = useAuthContext()
  const [fragments, setFragments] = useState<Array<{ fragment_id: number; name: string }>>([])
  const [cities, setCities] = useState<Array<{ id: number; name: string }>>([])
  const [states, setStates] = useState<Array<{ id: number; name: string }>>([])
  const [countries, setCountries] = useState<Array<{ id: number; name: string }>>([])
  const [nationalities, setNationalities] = useState<
    Array<{ nationality_id: number; nationality: string }>
  >([])
  const [companies, setCompanies] = useState<Array<{ company_id: number; company_name: string }>>(
    [],
  )
  const [guestTypes, setGuestTypes] = useState<Array<{ id: number; name: string }>>([])
  const [purposes, setPurposes] = useState<Array<{ id: number; name: string }>>([])
  const [arrivedList, setArrivedList] = useState<Array<{ id: number; name: string }>>([])
  const [departureList, setDepartureList] = useState<Array<{ id: number; name: string }>>([])
  const [documentTypes, setDocumentTypes] = useState<
    Array<{ id: string; name: string; has_front?: number; has_back?: number }>
  >([])
  const [loadingDocTypes, setLoadingDocTypes] = useState(false)
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [activeTab, setActiveTab] = useState('information')
  const [defaultsSet, setDefaultsSet] = useState(false)

  // Preview modal state
  const [showPreview, setShowPreview] = useState(false)
  const [previewImage, setPreviewImage] = useState('')

  // Loading states
  const [loadingFragments, setLoadingFragments] = useState(false)
  const [loadingCities, setLoadingCities] = useState(false)
  const [loadingStates, setLoadingStates] = useState(false)
  const [loadingCountries, setLoadingCountries] = useState(false)
  const [loadingNationalities, setLoadingNationalities] = useState(false)
  const [loadingCompanies, setLoadingCompanies] = useState(false)
  const [loadingGuestTypes, setLoadingGuestTypes] = useState(false)
  const [loadingPurposes, setLoadingPurposes] = useState(false)
  const [loadingArrived, setLoadingArrived] = useState(false)
  const [loadingDeparture, setLoadingDeparture] = useState(false)
  const [isCreatingPurpose, setIsCreatingPurpose] = useState(false)
  const [isCreatingArrived, setIsCreatingArrived] = useState(false)
  const [isCreatingDeparture, setIsCreatingDeparture] = useState(false)

  // Fetch all reference data
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedItem.hotelid && !authUser?.hotelid) {
        console.warn('No hotel ID available, skipping data fetch')
        return
      }

      setLoadingFragments(true)
      setLoadingCities(true)
      setLoadingStates(true)
      setLoadingCountries(true)
      setLoadingNationalities(true)
      setLoadingCompanies(true)
      setLoadingGuestTypes(true)
      setLoadingPurposes(true)
      setLoadingArrived(true)
      setLoadingDeparture(true)

      try {
        const hotelId = selectedItem.hotelid || authUser?.hotelid

        const [
          fragmentsRes,
          citiesRes,
          statesRes,
          countriesRes,
          nationalitiesRes,
          companiesRes,
          guestTypesRes,
          purposesRes,
          arrivedRes,
          departureRes,
        ] = await Promise.all([
          FragmentService.list(),
          CityService.list(),
          StateService.list(),
          CountryService.list(),
          NationalityService.list(),
          CompanyService.list({ hotelid: hotelId }),
          GuestTypeService.list(),
          PurposeService.list(),
          ArrivedService.list(),
          DepartureService.list(),
        ])

        const normalize = (res: any, idField: string, nameField: string) => {
          let data: any[] = []
          if (res?.data && Array.isArray(res.data)) data = res.data
          else if (Array.isArray(res)) data = res
          else if (res?.data?.data && Array.isArray(res.data.data)) data = res.data.data
          return data
            .map((item: any) => ({
              id: item[idField] ?? item.id,
              name: item[nameField] ?? item.name,
            }))
            .filter((item) => item.name && item.id)
        }

        const fragmentsData = (fragmentsRes?.data || []).map((f: any) => ({
          fragment_id: f.fragment_id,
          name: f.name,
        }))
        setFragments(fragmentsData)
        
        setCities(normalize(citiesRes, 'cityid', 'city_name'))
        setStates(normalize(statesRes, 'stateid', 'state_name'))
        setCountries(normalize(countriesRes, 'countryid', 'country_name'))
        setNationalities(
          (nationalitiesRes?.data || []).map((n: any) => ({
            nationality_id: n.nationality_id,
            nationality: n.nationality,
          })),
        )
        setCompanies(
          (companiesRes?.data || []).map((c: any) => ({
            company_id: c.company_id,
            company_name: c.company_name,
          })),
        )
        setGuestTypes(
          (guestTypesRes?.data || []).map((t: any) => ({
            id: t.guest_type_id,
            name: t.guest_type_name,
          })),
        )
        setPurposes(
          (purposesRes?.data || []).map((p: any) => ({
            id: p.purpose_id,
            name: p.purpose_name,
          })),
        )
        setArrivedList(
          (arrivedRes?.data || []).map((a: any) => ({
            id: a.arrived_id,
            name: a.arrived_name,
          })),
        )
        setDepartureList(
          (departureRes?.data || []).map((d: any) => ({
            id: d.departure_id,
            name: d.departure_name,
          })),
        )
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setLoadingFragments(false)
        setLoadingCities(false)
        setLoadingStates(false)
        setLoadingCountries(false)
        setLoadingNationalities(false)
        setLoadingCompanies(false)
        setLoadingGuestTypes(false)
        setLoadingPurposes(false)
        setLoadingArrived(false)
        setLoadingDeparture(false)
      }
    }

    fetchData()
  }, [selectedItem.hotelid, authUser?.hotelid])

  // Fetch document types from API
  useEffect(() => {
    const fetchDocTypes = async () => {
      setLoadingDocTypes(true)
      try {
        const response = await DocumentTypeService.list({ status: 1 })
        if (response.success && response.data) {
          setDocumentTypes(
            response.data.map((dt: DocumentType) => ({
              id: String(dt.id),
              name: dt.document_type_name,
              has_front: dt.has_front,
              has_back: dt.has_back,
            }))
          )
        }
      } catch (error) {
        console.error('Failed to load document types:', error)
      } finally {
        setLoadingDocTypes(false)
      }
    }
    fetchDocTypes()
  }, [])

  // Ensure at least one document entry exists
  const initialDocuments =
    selectedItem.documents && selectedItem.documents.length > 0
      ? selectedItem.documents
      : [{ document_type: '', document_number: '', front_side: '', back_side: '' }]

  // Validation schema - both phone and mobile are required
  const validationSchema = Yup.object({
    name: Yup.string().required('!'),
    address: Yup.string().required('!'),
    phone: Yup.string().required('!'),
    discount_percent: Yup.number().min(0).max(100),
    documents: Yup.array().of(
      Yup.object().shape({
        document_type: Yup.string(),
        document_number: Yup.string().when('document_type', {
          is: (val: string) => !!val,
          then: (schema) => schema.required('!'),
          otherwise: (schema) => schema,
        }),
      })
    )
  })

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      ...defaultForm,
      ...selectedItem,
      fragment_id: selectedItem.fragment_id ?? null,
      city_id: selectedItem.city_id ?? null,
      state_id: selectedItem.state_id ?? null,
      country_id: selectedItem.country_id ?? null,
      nationality_id: selectedItem.nationality_id ?? null,
      company_id: selectedItem.company_id ?? null,
      discount_percent: selectedItem.discount_percent ?? 0,
      documents: initialDocuments,
    },
    validationSchema,
    validateOnChange: false,
    validateOnBlur: false,
    onSubmit: (values) => {
      onSave(values)
    },
  })

  const { handleSubmit, values, setFieldValue, errors, setTouched, validateForm } = formik

  // Reset submit attempted when modal opens
  useEffect(() => {
    setSubmitAttempted(false)
    setDefaultsSet(false) // Reset defaults flag when selectedItem changes (modal opens)
  }, [selectedItem])

  // Set default fragment "MR" when fragments are loaded and no fragment is selected (only for new guests)
  useEffect(() => {
    // Only set defaults if we haven't set them yet, and fragments/countries are loaded
    // Check if this is a new guest (no guest_id) or if fragment_id is null/undefined
    const isNewGuest = !selectedItem.guest_id
    const noFragmentSelected = !values.fragment_id
    
    if (!defaultsSet && fragments.length > 0 && isNewGuest && noFragmentSelected) {
      // Match MR case-insensitively: handles "MR", "Mr", "Mr.", "mr" etc.
      const mrFragment = fragments.find(f => f.name.replace(/\./g, '').trim().toUpperCase() === 'MR')
      if (mrFragment) {
        setFieldValue('fragment_id', mrFragment.fragment_id)
        console.log('Set default fragment to MR', mrFragment.fragment_id)
      } else if (fragments.length > 0) {
        // Fallback: select the first fragment if MR not found
        setFieldValue('fragment_id', fragments[0].fragment_id)
      }
    }
  }, [fragments, values.fragment_id, defaultsSet, setFieldValue, selectedItem.guest_id])

  // Set default country "India" when countries are loaded and no country is selected (only for new guests)
  useEffect(() => {
    const isNewGuest = !selectedItem.guest_id
    const noCountrySelected = !values.country_id
    
    if (!defaultsSet && countries.length > 0 && isNewGuest && noCountrySelected) {
      const indiaCountry = countries.find(c => c.name === "India")
      if (indiaCountry) {
        setFieldValue('country_id', indiaCountry.id)
        console.log('Set default country to India', indiaCountry.id)
      }
    }
    
    // Mark defaults as set after attempting to set both
    if (fragments.length > 0 && countries.length > 0 && !defaultsSet && isNewGuest) {
      setDefaultsSet(true)
    }
  }, [countries, values.country_id, fragments, defaultsSet, setFieldValue, selectedItem.guest_id])

  // Helper function to validate all fields and show errors on save attempt
  const validateAndSubmit = useCallback(async () => {
    setSubmitAttempted(true)
    
    const formErrors = await validateForm()
    
    if (Object.keys(formErrors).length > 0) {
      const allFields: any = {
        name: true,
        address: true,
        country_id: true,
        state_id: true,
        city_id: true,
        phone: true,
        mobile: false, // Don't show error icon on mobile field
        email: true,
      }
      
      if (values.documents) {
        values.documents.forEach((_, idx) => {
          allFields[`documents.${idx}.document_type`] = true
          allFields[`documents.${idx}.document_number`] = true
        })
      }
      
      setTouched(allFields, true)
      return false
    }
    
    return true
  }, [validateForm, setTouched, values.documents])

  useImperativeHandle(ref, () => ({
    saveData: async () => {
      const isValid = await validateAndSubmit()
      if (!isValid) return

      // Check if at least one complete document has been added
      const hasValidDoc = (formik.values.documents ?? []).some(
        (doc) => doc.document_type && doc.document_number
      )
      if (!hasValidDoc) {
        toast.error('Please add at least one document before saving.')
        return
      }

      handleSubmit()
    },
  }))

  // Helper to convert input to uppercase (except for email/website)
  const toUppercaseExceptEmailWebsite = (field: string, value: string) => {
    if (field === 'email' || field === 'website') {
      return value;
    }
    return value.toUpperCase();
  }

  const handleCreatePurpose = async (inputValue: string) => {
    const upperValue = inputValue.trim().toUpperCase()
    setIsCreatingPurpose(true)
    try {
      const response = await PurposeService.create({ purpose_name: upperValue })
      if (response.success && response.data) {
        const newPurpose = {
          id: response.data.purpose_id,
          name: response.data.purpose_name,
        }
        setPurposes((prev) => [...prev, newPurpose])
        setFieldValue('purpose', newPurpose.name)
        setFieldValue('purpose_id', newPurpose.id)
      } else {
        setFieldValue('purpose', upperValue)
      }
    } catch (error) {
      console.error('Error creating purpose:', error)
      setFieldValue('purpose', upperValue)
    } finally {
      setIsCreatingPurpose(false)
    }
  }

  const handleCreateArrived = async (inputValue: string) => {
    const upperValue = inputValue.trim().toUpperCase()
    setIsCreatingArrived(true)
    try {
      const response = await ArrivedService.create({ arrived_name: upperValue })
      if (response.success && response.data) {
        const newArrived = {
          id: response.data.arrived_id,
          name: response.data.arrived_name,
        }
        setArrivedList((prev) => [...prev, newArrived])
        setFieldValue('arrived_from', newArrived.name)
        setFieldValue('arrived_id', newArrived.id)
      } else {
        setFieldValue('arrived_from', upperValue)
      }
    } catch (error) {
      console.error('Error creating arrived:', error)
      setFieldValue('arrived_from', upperValue)
    } finally {
      setIsCreatingArrived(false)
    }
  }

  const handleCreateDeparture = async (inputValue: string) => {
    const upperValue = inputValue.trim().toUpperCase()
    setIsCreatingDeparture(true)
    try {
      const response = await DepartureService.create({ departure_name: upperValue })
      if (response.success && response.data) {
        const newDeparture = {
          id: response.data.departure_id,
          name: response.data.departure_name,
        }
        setDepartureList((prev) => [...prev, newDeparture])
        setFieldValue('departure_to', newDeparture.name)
        setFieldValue('departure_id', newDeparture.id)
      } else {
        setFieldValue('departure_to', upperValue)
      }
    } catch (error) {
      console.error('Error creating departure:', error)
      setFieldValue('departure_to', upperValue)
    } finally {
      setIsCreatingDeparture(false)
    }
  }

  const handleFileChange = (index: number, side: 'front' | 'back', file: File | null) => {
    if (!file) {
      setFieldValue(`documents.${index}.${side}_side`, '')
      setFieldValue(`documents.${index}._temp_${side}`, null)
      return
    }
    const previewUrl = URL.createObjectURL(file)
    setFieldValue(`documents.${index}.${side}_side`, previewUrl)
    setFieldValue(`documents.${index}._temp_${side}`, file)
  }

  const handleRemoveImage = (index: number, side: 'front' | 'back') => {
    setFieldValue(`documents.${index}.${side}_side`, '')
    setFieldValue(`documents.${index}._temp_${side}`, null)
  }

  const handlePreview = (src: string) => {
    setPreviewImage(src)
    setShowPreview(true)
  }

  const getImageSrc = (doc: any, side: 'front' | 'back') => {
    const value = doc[`${side}_side`];
    const tempValue = doc[`_temp_${side}`];
    const urlValue = doc[`${side}_side_url`];
    
    if (tempValue instanceof File) {
      return URL.createObjectURL(tempValue);
    }
    if (typeof value === 'string' && value.startsWith('blob:')) {
      return value;
    }
    if (urlValue && typeof urlValue === 'string') {
      return urlValue;
    }
    if (typeof value === 'string' && value) {
      return value;
    }
    return null;
  };

  // Helper to show error icon only after submit attempted
  const showErrorIcon = (fieldName: string) => {
    return submitAttempted && errors[fieldName as keyof typeof errors]
  }

  // Helper to show document error icon only after submit attempted
  const showDocumentErrorIcon = (index: number, fieldName: string) => {
    return submitAttempted && 
      errors.documents?.[index] && 
      (errors.documents[index] as any)?.[fieldName]
  }

  // Get selected fragment value for display
  

  return (
    <FormikProvider value={formik}>
      <form
        onSubmit={handleSubmit}
        onKeyDown={(e: React.KeyboardEvent<HTMLFormElement>) => {
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
          const allFocusable = Array.from(
            form.querySelectorAll<HTMLElement>(focusableSelectors),
          ).filter((el) => {
            const style = window.getComputedStyle(el)
            return (
              style.display !== 'none' &&
              style.visibility !== 'hidden' &&
              el.offsetParent !== null
            )
          })
          const currentIndex = allFocusable.indexOf(target)
          if (currentIndex !== -1 && currentIndex < allFocusable.length - 1) {
            allFocusable[currentIndex + 1].focus()
          }
        }}>
        <div style={{ position: 'relative' }}>
          {activeTab === 'document' && (
            <div style={{ position: 'absolute', top: 0, right: 0, zIndex: 10 }}>
              <FieldArray name="documents">
                {({ push }) => (
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => push({ document_type: '', document_number: '', front_side: '', back_side: '' })}>
                    + Add Document
                  </Button>
                )}
              </FieldArray>
            </div>
          )}
        <Tabs
          defaultActiveKey="information"
          id="guest-form-tabs"
          className="mb-3"
          mountOnEnter
          unmountOnExit
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k || 'information')}>
          {/* Detail Tab */}
          <Tab eventKey="information" title="Information">
            <div>
              <Row className="g-0">
                <Col md={7}>
                  <div className="p-1 rounded mb-1">
                    <Row className="align-items-center g-2 mb-1">
                      <Col md={3} className="pt-1">
                        Name <span className="text-danger">*</span>
                      </Col>
                      <Col md={2}>
                          <FormSelect
                            name="fragment_id"
                            options={fragments.map((f) => ({ label: f.name, value: f.fragment_id }))}
                            className="w-100"
                            isLoading={loadingFragments}
                            placeholder="Select"
                          />
                      </Col>
                      <Col md={6}>
                        <div className="position-relative">
                          <FormikTextInput 
                            name="name" 
                            placeholder="Full name" 
                            className="w-100" 
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              setFieldValue('name', toUppercaseExceptEmailWebsite('name', e.target.value))
                            }}
                          />
                          {showErrorIcon('name') && (
                            <span className="text-danger position-absolute" style={{ right: '10px', top: '8px', fontSize: '18px' }}>
                              !
                            </span>
                          )}
                        </div>
                      </Col>
                    </Row>

                    <Row className="align-items-center g-2 mb-1">
                      <Col md={3}>Organisation</Col>
                      <Col md={8}>
                        <FormikTextInput
                          name="organisation"
                          placeholder="Organisation"
                          className="w-100"
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            setFieldValue('organisation', toUppercaseExceptEmailWebsite('organisation', e.target.value))
                          }}
                        />
                      </Col>
                    </Row>

                    <Row className="align-items-center g-2 mb-1">
                      <Col md={3} className="pt-1">
                        Address <span className="text-danger">*</span>
                      </Col>
                      <Col md={8}>
                        <div className="position-relative">
                          <FormikTextInput
                            name="address"
                            as="textarea"
                            rows={2}
                            placeholder="Enter address"
                            className="w-100"
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              setFieldValue('address', toUppercaseExceptEmailWebsite('address', e.target.value))
                            }}
                          />
                          {showErrorIcon('address') && (
                            <span className="text-danger position-absolute" style={{ right: '10px', top: '8px', fontSize: '18px' }}>
                              !
                            </span>
                          )}
                        </div>
                      </Col>
                    </Row>

                    {/* Updated: Country, State, City, Gender - Reordered */}
                    <Row className="align-items-center g-2 mb-1">
                      <Col md={3} className="pt-1">
                        Country <span className="text-danger">*</span>
                      </Col>
                      <Col md={3}>
                        <div className="position-relative">
                          <FormSelect
                            name="country_id"
                            options={countries.map((c) => ({ label: c.name, value: c.id }))}
                            className="w-100"
                            isLoading={loadingCountries}
                            placeholder="Select"
                          />
                          {showErrorIcon('country_id') && (
                            <span className="text-danger position-absolute" style={{ right: '10px', top: '8px', fontSize: '18px' }}>
                              !
                            </span>
                          )}
                        </div>
                      </Col>
                      <Col md={2} className="pt-1">
                        State <span className="text-danger">*</span>
                      </Col>
                      <Col md={3}>
                        <div className="position-relative">
                          <FormSelect
                            name="state_id"
                            options={states.map((s) => ({ label: s.name, value: s.id }))}
                            className="w-100"
                            isLoading={loadingStates}
                            placeholder="Select"
                          />
                          {showErrorIcon('state_id') && (
                            <span className="text-danger position-absolute" style={{ right: '10px', top: '8px', fontSize: '18px' }}>
                              !
                            </span>
                          )}
                        </div>
                      </Col>
                    </Row>

                    <Row className="align-items-center g-2 mb-1">
                      <Col md={3} className="pt-1">
                        City <span className="text-danger">*</span>
                      </Col>
                      <Col md={3}>
                        <div className="position-relative">
                          <FormSelect
                            name="city_id"
                            options={cities.map((c) => ({ label: c.name, value: c.id }))}
                            className="w-100"
                            isLoading={loadingCities}
                            placeholder="Select"
                          />
                          {showErrorIcon('city_id') && (
                            <span className="text-danger position-absolute" style={{ right: '10px', top: '8px', fontSize: '18px' }}>
                              !
                            </span>
                          )}
                        </div>
                      </Col>
                      <Col md={2}>Gender</Col>
                      <Col md={3}>
                        <FormSelect
                          name="gender"
                          options={[
                            { label: 'Male', value: 'Male' },
                            { label: 'Female', value: 'Female' },
                          ]}
                          className="w-100"
                        />
                      </Col>
                    </Row>

                    <Row className="align-items-center g-2 mb-1">
                      <Col md={3}>Occupation</Col>
                      <Col md={8}>
                        <FormikTextInput
                          name="occupation"
                          placeholder="Occupation"
                          className="w-100"
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            setFieldValue('occupation', toUppercaseExceptEmailWebsite('occupation', e.target.value))
                          }}
                        />
                      </Col>
                    </Row>

                    <Row className="align-items-center g-2 mb-1">
                      <Col md={3}>Post Held</Col>
                      <Col md={8}>
                        <FormikTextInput
                          name="post_held"
                          placeholder="Post held"
                          className="w-100"
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            setFieldValue('post_held', toUppercaseExceptEmailWebsite('post_held', e.target.value))
                          }}
                        />
                      </Col>
                    </Row>

                    <Row className="align-items-center g-2 mb-1">
                      <Col md={3} className="pt-1">
                        Phone <span className="text-danger">*</span>
                      </Col>
                      <Col md={4}>
                        <div className="position-relative">
                          <FormikTextInput 
                            name="phone" 
                            placeholder="Phone no.1" 
                            className="w-100" 
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              setFieldValue('phone', toUppercaseExceptEmailWebsite('phone', e.target.value))
                            }}
                          />
                          {showErrorIcon('phone') && (
                            <span className="text-danger position-absolute" style={{ right: '10px', top: '8px', fontSize: '18px' }}>
                              !
                            </span>
                          )}
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className="position-relative">
                          <FormikTextInput 
                            name="mobile" 
                            placeholder="Phone no.2" 
                            className="w-100" 
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              setFieldValue('mobile', toUppercaseExceptEmailWebsite('mobile', e.target.value))
                            }}
                          />
                          {/* No error icon for mobile field - validation happens but no visual error */}
                        </div>
                      </Col>
                    </Row>

                    <Row className="align-items-center g-2 mb-1">
                      <Col md={3}>
                        Email <span className="text-danger">*</span>
                      </Col>
                      <Col md={8}>
                        <div className="position-relative">
                          <FormikTextInput
                            name="email"
                            type="email"
                            placeholder="Enter email"
                            className="w-100"
                          />
                          {showErrorIcon('email') && (
                            <span className="text-danger position-absolute" style={{ right: '10px', top: '8px', fontSize: '18px' }}>
                              !
                            </span>
                          )}
                        </div>
                      </Col>
                    </Row>

                    <Row className="align-items-center g-2 mb-1">
                      <Col md={3}>Website</Col>
                      <Col md={8}>
                        <FormikTextInput
                          name="website"
                          placeholder="Enter website"
                          className="w-100"
                        />
                      </Col>
                    </Row>
                  </div>
                </Col>

                <Col md={5}>
                  <div className="p-1">
                    <Row className="align-items-center g-2 mb-1">
                      <Col md={4}>Purpose</Col>
                      <Col md={8}>
                        <CreatableSelect
                          options={purposes.map((p) => ({ label: p.name, value: p.name }))}
                          isLoading={loadingPurposes || isCreatingPurpose}
                          value={
                            values.purpose ? { label: values.purpose, value: values.purpose } : null
                          }
                          onChange={(opt) => {
                            setFieldValue('purpose', opt?.value || '')
                            if (opt?.value) {
                              const selected = purposes.find(p => p.name === opt.value)
                              if (selected) {
                                setFieldValue('purpose_id', selected.id)
                              }
                            } else {
                              setFieldValue('purpose_id', null)
                            }
                          }}
                          onCreateOption={handleCreatePurpose}
                          placeholder="select purpose"
                          isClearable
                          isSearchable
                          menuPlacement="auto"
                          formatCreateLabel={(input) => `Create "${input}"`}
                        />
                      </Col>
                    </Row>

                    <Row className="align-items-center g-2 mb-1">
                      <Col md={4}>Arrived From</Col>
                      <Col md={8}>
                        <CreatableSelect
                          options={arrivedList.map((a) => ({ label: a.name, value: a.name }))}
                          isLoading={loadingArrived || isCreatingArrived}
                          value={
                            values.arrived_from
                              ? { label: values.arrived_from, value: values.arrived_from }
                              : null
                          }
                          onChange={(opt) => {
                            setFieldValue('arrived_from', opt?.value || '')
                            if (opt?.value) {
                              const selected = arrivedList.find(a => a.name === opt.value)
                              if (selected) {
                                setFieldValue('arrived_id', selected.id)
                              }
                            } else {
                              setFieldValue('arrived_id', null)
                            }
                          }}
                          onCreateOption={handleCreateArrived}
                          placeholder="select arrived from"
                          isClearable
                          isSearchable
                          menuPlacement="auto"
                          formatCreateLabel={(input) => `Create "${input}"`}
                        />
                      </Col>
                    </Row>

                    <Row className="align-items-center g-2 mb-1">
                      <Col md={4}>Departure To</Col>
                      <Col md={8}>
                        <CreatableSelect
                          options={departureList.map((d) => ({ label: d.name, value: d.name }))}
                          isLoading={loadingDeparture || isCreatingDeparture}
                          value={
                            values.departure_to
                              ? { label: values.departure_to, value: values.departure_to }
                              : null
                          }
                          onChange={(opt) => {
                            setFieldValue('departure_to', opt?.value || '')
                            if (opt?.value) {
                              const selected = departureList.find(d => d.name === opt.value)
                              if (selected) {
                                setFieldValue('departure_id', selected.id)
                              }
                            } else {
                              setFieldValue('departure_id', null)
                            }
                          }}
                          onCreateOption={handleCreateDeparture}
                          placeholder="select departure to"
                          isClearable
                          isSearchable
                          menuPlacement="auto"
                          formatCreateLabel={(input) => `Create "${input}"`}
                        />
                      </Col>
                    </Row>

                    <Row className="align-items-center g-2 mb-1">
                      <Col md={4}>Birthday</Col>
                      <Col md={8}>
                        <FormikTextInput name="birthday" type="date" className="w-100" />
                      </Col>
                    </Row>

                    <Row className="align-items-center g-2 mb-1">
                      <Col md={4}>Anniversary</Col>
                      <Col md={8}>
                        <FormikTextInput name="anniversary" type="date" className="w-100" />
                      </Col>
                    </Row>

                    <Row className="align-items-center g-2 mb-1">
                      <Col md={4}>Guest Type</Col>
                      <Col md={8}>
                        <CreatableSelect
                          options={guestTypes.map((t) => ({ label: t.name, value: t.name }))}
                          isLoading={loadingGuestTypes}
                          value={
                            values.guest_type ? { label: values.guest_type, value: values.guest_type } : null
                          }
                          onChange={(opt) => {
                            setFieldValue('guest_type', opt?.value || '')
                            if (opt?.value) {
                              const selected = guestTypes.find(t => t.name === opt.value)
                              if (selected) {
                                setFieldValue('guest_type_id', selected.id)
                              }
                            } else {
                              setFieldValue('guest_type_id', null)
                            }
                          }}
                          placeholder="select guest type"
                          isClearable
                          isSearchable
                          menuPlacement="auto"
                          formatCreateLabel={(input) => `Create "${input}"`}
                        />
                      </Col>
                    </Row>

                    <Row className="align-items-center g-2 mb-1">
                      <Col md={4}>Nationality</Col>
                      <Col md={8}>
                        <FormSelect
                          name="nationality_id"
                          options={nationalities.map((n) => ({
                            label: n.nationality,
                            value: n.nationality_id,
                          }))}
                          className="w-100"
                          isLoading={loadingNationalities}
                          placeholder="Select"
                        />
                      </Col>
                    </Row>

                    <Row className="align-items-center g-2 mb-1">
                      <Col md={4}>Company</Col>
                      <Col md={8}>
                        <CreatableSelect
                          options={companies.map((c) => ({
                            label: c.company_name,
                            value: c.company_id,
                          }))}
                          isLoading={loadingCompanies}
                          value={
                            companies.find((c) => c.company_id === values.company_id)
                              ? {
                                  label: companies.find((c) => c.company_id === values.company_id)!.company_name,
                                  value: values.company_id,
                                }
                              : null
                          }
                          onChange={(opt) => setFieldValue('company_id', opt?.value || null)}
                          placeholder="Select or search"
                          isClearable
                          isSearchable
                          menuPlacement="auto"
                        />
                      </Col>
                    </Row>

                    <Row className="align-items-center g-2 mb-1">
                      <Col md={4}>Discount %</Col>
                      <Col md={8}>
                        <FormikTextInput
                          name="discount_percent"
                          type="number"
                          min="0"
                          max="100"
                          placeholder="Discount percentage"
                          className="w-100"
                        />
                      </Col>
                    </Row>

                    <Row className="mb-1">
                      <Col md={7}>
                        <div className="d-flex align-items-center">
                          <input
                            type="checkbox"
                            className="me-1"
                            checked={values.credit_allowed === 1}
                            onChange={(e) =>
                              setFieldValue('credit_allowed', e.target.checked ? 1 : 0)
                            }
                          />
                          <span className="mb-0">Credit Allowed</span>
                        </div>
                      </Col>
                    </Row>
                  </div>
                </Col>
              </Row>
            </div>
          </Tab>

          {/* Document Tab */}
          <Tab eventKey="document" title="Document">
            <div style={{overflowY: 'auto' }} className="p-2">
              <FieldArray name="documents">
                {({ push, remove }) => (
                  <div>
                    {values.documents?.map((doc, index) => (
                      <div key={index} className="p-1 mb-1">
                        <Row className="align-items-stretch">
                          {/* LEFT : TYPE + NUMBER */}
                          <Col md={4} className="px-2">
                            <div
                              className="h-100 p-3 d-flex flex-column"
                              style={{
                                border: '1px solid #dee2e6',
                                borderRadius: '0.375rem',
                                minHeight: '350px',
                              }}>
                              <Row>
                                <Col md={12}>
                                  <Form.Label className="fw-bold">
                                    Document Type <span className="text-danger">*</span>
                                  </Form.Label>
                                  <div className="position-relative">
                                    <FormSelect
                                      name={`documents.${index}.document_type`}
                                      options={documentTypes.map((dt) => ({
                                        label: dt.name,
                                        value: dt.id,
                                      }))}
                                      isLoading={loadingDocTypes}
                                      className="w-100"
                                      placeholder="Select"
                                    />
                                    {showDocumentErrorIcon(index, 'document_type') && (
                                      <span className="text-danger position-absolute" style={{ right: '10px', top: '8px', fontSize: '18px' }}>
                                        !
                                      </span>
                                    )}
                                  </div>
                                </Col>

                                <Col md={12}>
                                  <Form.Label className="fw-bold mt-3">
                                    Document Number <span className="text-danger">*</span>
                                  </Form.Label>
                                  <div className="position-relative">
                                    <FormikTextInput
                                      name={`documents.${index}.document_number`}
                                      placeholder="Enter number"
                                      className="w-100"
                                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                        setFieldValue(`documents.${index}.document_number`, e.target.value.toUpperCase())
                                      }}
                                    />
                                    {showDocumentErrorIcon(index, 'document_number') && (
                                      <span className="text-danger position-absolute" style={{ right: '10px', top: '8px', fontSize: '18px' }}>
                                        !
                                      </span>
                                    )}
                                  </div>
                                </Col>
                                
                                <Col md={12} className="mt-3">
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => remove(index)}
                                    className="w-100">
                                    Remove Document
                                  </Button>
                                </Col>
                              </Row>
                            </div>
                          </Col>

                          {/* FRONT SIDE */}
                          {(() => {
                            const selectedDocType = documentTypes.find(dt => dt.id === doc.document_type);
                            const showFront = selectedDocType?.has_front === 1;
                            return showFront ? (
                              <Col md={4} className="px-2">
                                <div
                                  className="h-100 p-3 d-flex flex-column"
                                  style={{
                                    border: '1px dashed #6c757d',
                                    borderRadius: '0.375rem',
                                    position: 'relative',
                                    minHeight: '350px',
                                  }}>
                                  <Form.Label className="fw-bold">Front Side</Form.Label>

                                  <div className="flex-grow-1 d-flex align-items-center justify-content-center mb-3">
                                    <div
                                      style={{
                                        position: 'absolute',
                                        top: '5px',
                                        right: '5px',
                                        display: 'flex',
                                        gap: '4px',
                                        borderRadius: '4px',
                                        padding: '0px',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                        zIndex: 10,
                                      }}>
                                      {getImageSrc(doc, 'front') && (
                                        <>
                                          <Button
                                            variant="link"
                                            size="sm"
                                            onClick={() => handlePreview(getImageSrc(doc, 'front') || '')}
                                            style={{
                                              padding: '4px',
                                              color: '#000000',
                                              textDecoration: 'none',
                                            }}>
                                            <span style={{ fontSize: '15px' }}>⤢</span>
                                          </Button>
                                          <Button
                                            variant="link"
                                            size="sm"
                                            onClick={() => handleRemoveImage(index, 'front')}
                                            style={{
                                              padding: '4px',
                                              color: '#dc3545',
                                              textDecoration: 'none',
                                            }}>
                                            <span style={{ fontSize: '10px' }}>❌</span>
                                          </Button>
                                        </>
                                      )}
                                    </div>
                                    {getImageSrc(doc, 'front') ? (
                                      <div style={{ position: 'relative', display: 'inline-block' }}>
                                        <img
                                          src={getImageSrc(doc, 'front') || ''}
                                          alt="front"
                                          style={{
                                            maxWidth: '100%',
                                            maxHeight: '160px',
                                            objectFit: 'contain',
                                          }}
                                        />
                                      </div>
                                    ) : (
                                      <i
                                        className="bi bi-camera"
                                        style={{ fontSize: '3rem', color: '#adb5bd', opacity: 0.4 }}
                                      />
                                    )}
                                  </div>

                                  <div className="d-flex justify-content-center gap-2 mt-auto">
                                    <Button
                                      variant="outline-secondary"
                                      size="sm"
                                      onClick={() => {
                                        const input = document.getElementById(`front-upload-${index}`)
                                        if (input) {
                                          input.click()
                                        }
                                      }}>
                                      📁 Upload
                                    </Button>
                                  </div>

                                  <input
                                    type="file"
                                    id={`front-upload-${index}`}
                                    accept="image/*"
                                    hidden
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        handleFileChange(index, 'front', file);
                                      }
                                    }}
                                  />
                                </div>
                              </Col>
                            ) : null;
                          })()}

                          {/* BACK SIDE */}
                          {(() => {
                            const selectedDocType = documentTypes.find(dt => dt.id === doc.document_type);
                            const showBack = selectedDocType?.has_back === 1;
                            return showBack ? (
                              <Col md={4} className="px-2">
                                <div
                                  className="h-100 p-3 d-flex flex-column"
                                  style={{
                                    border: '1px dashed #6c757d',
                                    borderRadius: '0.375rem',
                                    position: 'relative',
                                    minHeight: '350px',
                                  }}>
                                  <Form.Label className="fw-bold">Back Side</Form.Label>

                                  <div className="flex-grow-1 d-flex align-items-center justify-content-center mb-3">
                                    <div
                                      style={{
                                        position: 'absolute',
                                        top: '5px',
                                        right: '5px',
                                        display: 'flex',
                                        gap: '4px',
                                        background: 'rgba(255,255,255,0.8)',
                                        borderRadius: '4px',
                                        padding: '0px',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                        zIndex: 10,
                                      }}>
                                      {getImageSrc(doc, 'back') && (
                                        <>
                                          <Button
                                            variant="link"
                                            size="sm"
                                            onClick={() => handlePreview(getImageSrc(doc, 'back') || '')}
                                            style={{
                                              padding: '4px',
                                              color: '#000000',
                                              textDecoration: 'none',
                                            }}>
                                            <span style={{ fontSize: '15px' }}>⤢</span>
                                          </Button>
                                          <Button
                                            variant="link"
                                            size="sm"
                                            onClick={() => handleRemoveImage(index, 'back')}
                                            style={{
                                              padding: '4px',
                                              color: '#dc3545',
                                              textDecoration: 'none',
                                            }}>
                                            <span style={{ fontSize: '10px' }}>❌</span>
                                          </Button>
                                        </>
                                      )}
                                    </div>
                                    {getImageSrc(doc, 'back') ? (
                                      <div style={{ position: 'relative', display: 'inline-block' }}>
                                        <img
                                          src={getImageSrc(doc, 'back') || ''}
                                          alt="back"
                                          style={{
                                            maxWidth: '100%',
                                            maxHeight: '160px',
                                            objectFit: 'contain',
                                          }}
                                        />
                                      </div>
                                    ) : (
                                      <i
                                        className="bi bi-camera"
                                        style={{ fontSize: '3rem', color: '#adb5bd', opacity: 0.4 }}
                                      />
                                    )}
                                  </div>

                                  <div className="d-flex justify-content-center gap-2 mt-auto">
                                    <Button
                                      variant="outline-secondary"
                                      size="sm"
                                      onClick={() => {
                                        const input = document.getElementById(`back-upload-${index}`)
                                        if (input) {
                                          input.click()
                                        }
                                      }}>
                                      📁 Upload
                                    </Button>
                                  </div>

                                  <input
                                    type="file"
                                    id={`back-upload-${index}`}
                                    accept="image/*"
                                    hidden
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        handleFileChange(index, 'back', file);
                                      }
                                    }}
                                  />
                                </div>
                              </Col>
                            ) : null;
                          })()}
                        </Row>
                      </div>
                    ))}
                    {submitAttempted && errors.documents && typeof errors.documents === 'string' && (
                      <div className="text-danger small mt-2 text-center"> At least one document is required</div>
                    )}
                  </div>
                )}
              </FieldArray>
            </div>
          </Tab>
        </Tabs>
        </div>

        {/* Preview Modal */}
        <Modal show={showPreview} onHide={() => setShowPreview(false)} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title>Document Preview</Modal.Title>
          </Modal.Header>
          <Modal.Body className="text-center">
            {previewImage && (
              <img src={previewImage} alt="Preview" style={{ maxWidth: '100%', maxHeight: '80vh' }} />
            )}
          </Modal.Body>
        </Modal>
      </form>
    </FormikProvider>
  )
})

export default GuestForm