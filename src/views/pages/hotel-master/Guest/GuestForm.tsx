// GuestForm.tsx
import { forwardRef, useImperativeHandle, useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { toast } from 'react-hot-toast'
import { Row, Col, Tabs, Tab, Button, Form, Modal } from 'react-bootstrap'
import { FormikProvider, useFormik, FieldArray } from 'formik'
import * as Yup from 'yup'
import CreatableSelect from 'react-select/creatable'
import FormikTextInput from '@/components/Common/FormikTextInput'
import FormSelect from '@/components/Common/FormikSelect'
import CityService from '@/common/api/cities'
import CountryService from '@/common/api/countries'
import StateService from '@/common/api/states'
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
  // Guest photo captured via camera — stored as base64 dataUrl (new) or URL (existing)
  guest_photo?: string | null
  guest_photo_url?: string | null
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
  company_id: 0,
  discount_percent: 0,
  status: 1,
  guest_photo: null,
  guest_photo_url: null,
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
  const SELF_COMPANY_ID = 0
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
  const addressEnterCount = useRef(0)

  // Guest photo states
  
  const [uploadingPhoto, ] = useState(false)

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
      if (!selectedItem.hotelid && !authUser?.hotelid) return

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

  // Fetch document types
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

  const initialDocuments = useMemo(
    () =>
      selectedItem.documents && selectedItem.documents.length > 0
        ? selectedItem.documents
        : [{ document_type: '', document_number: '', front_side: '', back_side: '' }],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedItem.guest_id]
  )

  const validationSchema = Yup.object({
    name: Yup.string().required('!'),
    address: Yup.string().required('!'),
    phone: Yup.string().required('!'),
    discount_percent: Yup.number().min(0).max(100),
    documents: Yup.array().of(
      Yup.object().shape({
        document_type: Yup.string().required('!'),
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
      company_id: selectedItem.company_id ?? 0,
      discount_percent: selectedItem.discount_percent ?? 0,
      guest_photo: selectedItem.guest_photo ?? null,
      guest_photo_url: selectedItem.guest_photo_url ?? null,
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

  useEffect(() => {
    setSubmitAttempted(false)
    setDefaultsSet(false)
    addressEnterCount.current = 0
  }, [selectedItem])

  useEffect(() => {
    const isNewGuest = !selectedItem.guest_id
    const noFragmentSelected = !values.fragment_id

    if (!defaultsSet && fragments.length > 0 && isNewGuest && noFragmentSelected) {
      const mrFragment = fragments.find(f => f.name.replace(/\./g, '').trim().toUpperCase() === 'MR')
      if (mrFragment) {
        setFieldValue('fragment_id', mrFragment.fragment_id)
      } else if (fragments.length > 0) {
        setFieldValue('fragment_id', fragments[0].fragment_id)
      }
    }
  }, [fragments, values.fragment_id, defaultsSet, setFieldValue, selectedItem.guest_id])

  useEffect(() => {
    const isNewGuest = !selectedItem.guest_id
    const noCountrySelected = !values.country_id

    if (!defaultsSet && countries.length > 0 && isNewGuest && noCountrySelected) {
      const indiaCountry = countries.find(c => c.name === 'India')
      if (indiaCountry) {
        setFieldValue('country_id', indiaCountry.id)
      }
    }

    if (fragments.length > 0 && countries.length > 0 && !defaultsSet && isNewGuest) {
      setDefaultsSet(true)
    }
  }, [countries, values.country_id, fragments, defaultsSet, setFieldValue, selectedItem.guest_id])

  useEffect(() => {
    const isNewGuest = !selectedItem.guest_id
    const noNationalitySelected = !values.nationality_id
    if (nationalities.length > 0 && isNewGuest && noNationalitySelected) {
      const indianNationality = nationalities.find(
        (n) => n.nationality.toLowerCase() === 'indian'
      )
      if (indianNationality) {
        setFieldValue('nationality_id', indianNationality.nationality_id)
      }
    }
  }, [nationalities, values.nationality_id, selectedItem.guest_id, setFieldValue])

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
      handleSubmit()
    },
  }))

  const toUppercaseExceptEmailWebsite = (field: string, value: string) => {
    if (field === 'email' || field === 'website') return value
    return value.toUpperCase()
  }

  const handleCreatePurpose = async (inputValue: string) => {
    const upperValue = inputValue.trim().toUpperCase()
    setIsCreatingPurpose(true)
    try {
      const response = await PurposeService.create({ purpose_name: upperValue })
      if (response.success && response.data) {
        const newPurpose = { id: response.data.purpose_id, name: response.data.purpose_name }
        setPurposes((prev) => [...prev, newPurpose])
        setFieldValue('purpose', newPurpose.name)
        setFieldValue('purpose_id', newPurpose.id)
      } else {
        setFieldValue('purpose', upperValue)
      }
    } catch (error) {
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
        const newArrived = { id: response.data.arrived_id, name: response.data.arrived_name }
        setArrivedList((prev) => [...prev, newArrived])
        setFieldValue('arrived_from', newArrived.name)
        setFieldValue('arrived_id', newArrived.id)
      } else {
        setFieldValue('arrived_from', upperValue)
      }
    } catch (error) {
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
        const newDeparture = { id: response.data.departure_id, name: response.data.departure_name }
        setDepartureList((prev) => [...prev, newDeparture])
        setFieldValue('departure_to', newDeparture.name)
        setFieldValue('departure_id', newDeparture.id)
      } else {
        setFieldValue('departure_to', upperValue)
      }
    } catch (error) {
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

  const handleRemovePhoto = useCallback(async () => {
    try {
      if (selectedItem.guest_id) {
        const GuestService = (await import('@/common/hotel/guest')).default
        await GuestService.deleteGuestPhoto(selectedItem.guest_id)
        toast.success('Guest photo removed')
      }
      setFieldValue('guest_photo', null)
      setFieldValue('guest_photo_url', null)
    } catch (error) {
      console.error('Failed to remove guest photo:', error)
      toast.error('Failed to remove photo')
    }
  }, [selectedItem.guest_id, setFieldValue])

  // Current photo URL to display (prefer server URL, fallback to captured dataUrl)
  const currentPhotoSrc = values.guest_photo_url || values.guest_photo || null

  const getImageSrc = (doc: any, side: 'front' | 'back') => {
    const value = doc[`${side}_side`]
    const tempValue = doc[`_temp_${side}`]
    const urlValue = doc[`${side}_side_url`]

    if (tempValue instanceof File) return URL.createObjectURL(tempValue)
    if (typeof value === 'string' && value.startsWith('blob:')) return value
    if (urlValue && typeof urlValue === 'string') return urlValue
    if (typeof value === 'string' && value) return value
    return null
  }

  const showErrorIcon = (fieldName: string) =>
    submitAttempted && errors[fieldName as keyof typeof errors]

  const showDocumentErrorIcon = (index: number, fieldName: string) =>
    submitAttempted &&
    errors.documents?.[index] &&
    (errors.documents[index] as any)?.[fieldName]

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

            {/* ── INFORMATION TAB ─────────────────────────────────────────── */}
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
                              <span className="text-danger position-absolute" style={{ right: '10px', top: '8px', fontSize: '18px' }}>!</span>
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
                              onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                                if (e.key === 'Enter') {
                                  addressEnterCount.current += 1
                                  if (addressEnterCount.current >= 3) {
                                    e.preventDefault()
                                    addressEnterCount.current = 0
                                    const form = (e.target as HTMLElement).closest('form')
                                    if (form) {
                                      const focusableSelectors = [
                                        'input:not([disabled]):not([readonly]):not([type="hidden"])',
                                        'select:not([disabled])',
                                        'textarea:not([disabled]):not([readonly])',
                                        '[tabindex]:not([tabindex="-1"]):not([disabled])',
                                      ].join(', ')
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
                                      const currentIndex = allFocusable.indexOf(e.target as HTMLElement)
                                      if (currentIndex !== -1 && currentIndex < allFocusable.length - 1) {
                                        allFocusable[currentIndex + 1].focus()
                                      }
                                    }
                                  }
                                } else {
                                  addressEnterCount.current = 0
                                }
                              }}
                            />
                            {showErrorIcon('address') && (
                              <span className="text-danger position-absolute" style={{ right: '10px', top: '8px', fontSize: '18px' }}>!</span>
                            )}
                          </div>
                        </Col>
                      </Row>

                      <Row className="align-items-center g-2 mb-1">
                        <Col md={3} className="pt-1">Country <span className="text-danger">*</span></Col>
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
                              <span className="text-danger position-absolute" style={{ right: '10px', top: '8px', fontSize: '18px' }}>!</span>
                            )}
                          </div>
                        </Col>
                        <Col md={2} className="pt-1">State <span className="text-danger">*</span></Col>
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
                              <span className="text-danger position-absolute" style={{ right: '10px', top: '8px', fontSize: '18px' }}>!</span>
                            )}
                          </div>
                        </Col>
                      </Row>

                      <Row className="align-items-center g-2 mb-1">
                        <Col md={3} className="pt-1">City <span className="text-danger">*</span></Col>
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
                              <span className="text-danger position-absolute" style={{ right: '10px', top: '8px', fontSize: '18px' }}>!</span>
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
                        <Col md={3} className="pt-1">Phone <span className="text-danger">*</span></Col>
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
                              <span className="text-danger position-absolute" style={{ right: '10px', top: '8px', fontSize: '18px' }}>!</span>
                            )}
                          </div>
                        </Col>
                        <Col md={4}>
                          <FormikTextInput
                            name="mobile"
                            placeholder="Phone no.2"
                            className="w-100"
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              setFieldValue('mobile', toUppercaseExceptEmailWebsite('mobile', e.target.value))
                            }}
                          />
                        </Col>
                      </Row>

                      <Row className="align-items-center g-2 mb-1">
                        <Col md={3}>Email</Col>
                        <Col md={8}>
                          <div className="position-relative">
                            <FormikTextInput
                              name="email"
                              type="email"
                              placeholder="Enter email"
                              className="w-100"
                            />
                            {showErrorIcon('email') && (
                              <span className="text-danger position-absolute" style={{ right: '10px', top: '8px', fontSize: '18px' }}>!</span>
                            )}
                          </div>
                        </Col>
                      </Row>

                      <Row className="align-items-center g-2 mb-1">
                        <Col md={3}>Website</Col>
                        <Col md={8}>
                          <FormikTextInput name="website" placeholder="Enter website" className="w-100" />
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
                            value={values.purpose ? { label: values.purpose, value: values.purpose } : null}
                            onChange={(opt) => {
                              setFieldValue('purpose', opt?.value || '')
                              if (opt?.value) {
                                const selected = purposes.find(p => p.name === opt.value)
                                if (selected) setFieldValue('purpose_id', selected.id)
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
                            value={values.arrived_from ? { label: values.arrived_from, value: values.arrived_from } : null}
                            onChange={(opt) => {
                              setFieldValue('arrived_from', opt?.value || '')
                              if (opt?.value) {
                                const selected = arrivedList.find(a => a.name === opt.value)
                                if (selected) setFieldValue('arrived_id', selected.id)
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
                            value={values.departure_to ? { label: values.departure_to, value: values.departure_to } : null}
                            onChange={(opt) => {
                              setFieldValue('departure_to', opt?.value || '')
                              if (opt?.value) {
                                const selected = departureList.find(d => d.name === opt.value)
                                if (selected) setFieldValue('departure_id', selected.id)
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
                            value={values.guest_type ? { label: values.guest_type, value: values.guest_type } : null}
                            onChange={(opt) => {
                              setFieldValue('guest_type', opt?.value || '')
                              if (opt?.value) {
                                const selected = guestTypes.find(t => t.name === opt.value)
                                if (selected) setFieldValue('guest_type_id', selected.id)
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
                            options={[
                              { label: 'Self', value: SELF_COMPANY_ID },
                              ...companies.map((c) => ({ label: c.company_name, value: c.company_id })),
                            ]}
                            isLoading={loadingCompanies}
                            value={
                              values.company_id === SELF_COMPANY_ID
                                ? { label: 'Self', value: SELF_COMPANY_ID }
                                : values.company_id !== null && values.company_id !== undefined
                                ? companies.find((c) => c.company_id === values.company_id)
                                  ? {
                                      label: companies.find((c) => c.company_id === values.company_id)!.company_name,
                                      value: values.company_id,
                                    }
                                  : null
                                : { label: 'Self', value: SELF_COMPANY_ID }
                            }
                            onChange={(opt) => setFieldValue('company_id', opt?.value ?? SELF_COMPANY_ID)}
                            placeholder="Select or search"
                            isClearable={false}
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
                              onChange={(e) => setFieldValue('credit_allowed', e.target.checked ? 1 : 0)}
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

            {/* ── DOCUMENT TAB ─────────────────────────────────────────────── */}
            <Tab eventKey="document" title="Document">
              <div style={{ overflowY: 'auto' }} className="p-2">
                <FieldArray name="documents">
                  {({ push, remove }) => (
                    <div>
                      {values.documents?.map((doc, index) => (
                        <div key={doc.document_id ?? `new-${index}`} className="p-1 mb-1">
                          <Row className="align-items-stretch">
                            {/* Doc type + number + remove */}
                            <Col md={4} className="px-2">
                              <div
                                className="h-100 p-3 d-flex flex-column"
                                style={{
                                  border: '1px dashed #6c757d',
                                  borderRadius: '0.375rem',
                                  position: 'relative',
                                  minHeight: '350px',
                                }}>
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                  <Form.Label className="fw-bold mb-0">Document {index + 1}</Form.Label>
                                  {values.documents && values.documents.length > 1 && (
                                    <Button
                                      variant="link"
                                      size="sm"
                                      className="text-danger p-0"
                                      onClick={() => remove(index)}>
                                      ✕ Remove
                                    </Button>
                                  )}
                                </div>

                                <div className="mb-2">
                                  <Form.Label className="small mb-1">Document Type</Form.Label>
                                  <div className="position-relative">
                                    <Form.Select
                                      value={doc.document_type || ''}
                                      onChange={(e) => {
                                        setFieldValue(`documents.${index}.document_type`, e.target.value)
                                      }}
                                      isInvalid={showDocumentErrorIcon(index, 'document_type') as boolean}>
                                      <option value="">-- Select Type --</option>
                                      {loadingDocTypes
                                        ? <option disabled>Loading...</option>
                                        : documentTypes.map((dt) => (
                                            <option key={dt.id} value={dt.id}>{dt.name}</option>
                                          ))
                                      }
                                    </Form.Select>
                                    {showDocumentErrorIcon(index, 'document_type') && (
                                      <span className="text-danger position-absolute" style={{ right: '35px', top: '8px', fontSize: '16px' }}>!</span>
                                    )}
                                  </div>
                                </div>

                                <div className="mb-2">
                                  <Form.Label className="small mb-1">Document Number</Form.Label>
                                  <div className="position-relative">
                                    <Form.Control
                                      type="text"
                                      placeholder="Enter document number"
                                      value={doc.document_number || ''}
                                      onChange={(e) =>
                                        setFieldValue(`documents.${index}.document_number`, e.target.value.toUpperCase())
                                      }
                                      isInvalid={showDocumentErrorIcon(index, 'document_number') as boolean}
                                    />
                                    {showDocumentErrorIcon(index, 'document_number') && (
                                      <span className="text-danger position-absolute" style={{ right: '10px', top: '8px', fontSize: '16px' }}>!</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </Col>

                            {/* Front side */}
                            {(() => {
                              const selectedDocType = documentTypes.find(dt => dt.id === doc.document_type)
                              const showFront = !selectedDocType || selectedDocType?.has_front === 1
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
                                          background: 'rgba(255,255,255,0.8)',
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
                                              style={{ padding: '4px', color: '#000000', textDecoration: 'none' }}>
                                              <span style={{ fontSize: '15px' }}>⤢</span>
                                            </Button>
                                            <Button
                                              variant="link"
                                              size="sm"
                                              onClick={() => handleRemoveImage(index, 'front')}
                                              style={{ padding: '4px', color: '#dc3545', textDecoration: 'none' }}>
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
                                            style={{ maxWidth: '100%', maxHeight: '160px', objectFit: 'contain' }}
                                          />
                                        </div>
                                      ) : (
                                        <i className="bi bi-camera" style={{ fontSize: '3rem', color: '#adb5bd', opacity: 0.4 }} />
                                      )}
                                    </div>

                                    <div className="d-flex justify-content-center gap-2 mt-auto">
                                      <Button
                                        variant="outline-secondary"
                                        size="sm"
                                        onClick={() => document.getElementById(`front-upload-${index}`)?.click()}>
                                        📁 Upload
                                      </Button>
                                      <Button
                                        variant="outline-info"
                                        size="sm"
                                        onClick={() => document.getElementById(`front-scan-${index}`)?.click()}>
                                        📷 Scan
                                      </Button>
                                    </div>

                                    <input
                                      type="file"
                                      id={`front-upload-${index}`}
                                      accept="image/*"
                                      hidden
                                      onChange={(e) => {
                                        const file = e.target.files?.[0]
                                        if (file) handleFileChange(index, 'front', file)
                                      }}
                                    />
                                    <input
                                      type="file"
                                      id={`front-scan-${index}`}
                                      accept="image/*"
                                      capture="environment"
                                      hidden
                                      onChange={(e) => {
                                        const file = e.target.files?.[0]
                                        if (file) handleFileChange(index, 'front', file)
                                      }}
                                    />
                                  </div>
                                </Col>
                              ) : null
                            })()}

                            {/* Back side */}
                            {(() => {
                              const selectedDocType = documentTypes.find(dt => dt.id === doc.document_type)
                              const showBack = selectedDocType?.has_back === 1
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
                                              style={{ padding: '4px', color: '#000000', textDecoration: 'none' }}>
                                              <span style={{ fontSize: '15px' }}>⤢</span>
                                            </Button>
                                            <Button
                                              variant="link"
                                              size="sm"
                                              onClick={() => handleRemoveImage(index, 'back')}
                                              style={{ padding: '4px', color: '#dc3545', textDecoration: 'none' }}>
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
                                            style={{ maxWidth: '100%', maxHeight: '160px', objectFit: 'contain' }}
                                          />
                                        </div>
                                      ) : (
                                        <i className="bi bi-camera" style={{ fontSize: '3rem', color: '#adb5bd', opacity: 0.4 }} />
                                      )}
                                    </div>

                                    <div className="d-flex justify-content-center gap-2 mt-auto">
                                      <Button
                                        variant="outline-secondary"
                                        size="sm"
                                        onClick={() => document.getElementById(`back-upload-${index}`)?.click()}>
                                        📁 Upload
                                      </Button>
                                      <Button
                                        variant="outline-info"
                                        size="sm"
                                        onClick={() => document.getElementById(`back-scan-${index}`)?.click()}>
                                        📷 Scan
                                      </Button>
                                    </div>

                                    <input
                                      type="file"
                                      id={`back-upload-${index}`}
                                      accept="image/*"
                                      hidden
                                      onChange={(e) => {
                                        const file = e.target.files?.[0]
                                        if (file) handleFileChange(index, 'back', file)
                                      }}
                                    />
                                    <input
                                      type="file"
                                      id={`back-scan-${index}`}
                                      accept="image/*"
                                      capture="environment"
                                      hidden
                                      onChange={(e) => {
                                        const file = e.target.files?.[0]
                                        if (file) handleFileChange(index, 'back', file)
                                      }}
                                    />
                                  </div>
                                </Col>
                              ) : null
                            })()}
                          </Row>
                        </div>
                      ))}
                      {submitAttempted && errors.documents && typeof errors.documents === 'string' && (
                        <div className="text-danger small mt-2 text-center">At least one document is required</div>
                      )}
                    </div>
                  )}
                </FieldArray>
              </div>
            </Tab>

            {/* ── GUEST PHOTO TAB ──────────────────────────────────────────── */}
            <Tab eventKey="photo" title="Guest Photo">
              <div className="p-3">
                <div className="d-flex flex-column align-items-center">

                  {/* Photo display area */}
                  <div
                    style={{
                      width: '280px',
                      height: '320px',
                      border: '2px dashed #0d6efd',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#f0f4ff',
                      position: 'relative',
                      overflow: 'hidden',
                      cursor: currentPhotoSrc ? 'pointer' : 'default',
                    }}
                    onClick={() => currentPhotoSrc && handlePreview(currentPhotoSrc)}>
                    {currentPhotoSrc ? (
                      <img
                        src={currentPhotoSrc}
                        alt="Guest Photo"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: '10px',
                        }}
                      />
                    ) : (
                      <div className="text-center text-muted">
                        <i className="bi bi-person-bounding-box" style={{ fontSize: '4rem', color: '#adb5bd' }} />
                        <p className="mt-2 small">No photo captured yet</p>
                      </div>
                    )}
                  </div>

                  {currentPhotoSrc && (
                    <p className="text-muted small mt-2">
                      Click on the photo to preview full size
                    </p>
                  )}

                  {/* Remove Photo button — shown only when a photo exists */}
                  {currentPhotoSrc && (
                    <Button
                      variant="outline-danger"
                      size="sm"
                      className="mt-2"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemovePhoto()
                      }}
                      disabled={uploadingPhoto}>
                      ❌ Remove Photo
                    </Button>
                  )}
                </div>
              </div>
            </Tab>

          </Tabs>
        </div>

        {/* Document Preview Modal */}
        <Modal show={showPreview} onHide={() => setShowPreview(false)} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title>Preview</Modal.Title>
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