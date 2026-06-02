import { forwardRef, useImperativeHandle } from 'react'
import { Row, Col } from 'react-bootstrap'
import { FormikProvider, useFormik } from 'formik'
import * as Yup from 'yup'
import FormikTextInput from '@/components/Common/FormikTextInput'
import FormikCheckbox from '@/components/Common/FormikCheckbox'
import FormSelect from '@/components/Common/FormikSelect'

type ComplimentaryFormType = {
  complimentary_id?: number
  item_name: string
  item_type: string
  description: string
  item_code: string
  uom: string
  hotel_id: string
  quantity_per_room: string
  availability_type: string
  start_date: string
  end_date: string
  day_of_week: string[]
  start_time: string
  end_time: string
  seasonal: number
  max_quantity_per_stay: string
  per_adult: number
  per_child: number
  min_stay_nights: string
  advance_booking_days: string
  guest_type: string
  loyalty_tier: string
  age_restriction: string
  delivery_method: string
  delivery_time: string
  instructions: string
  cost_price: string
  account_code: string
  taxable: number
  tax_rate: string
  status: number
  display_order: string
  terms_conditions: string
  display_on_website: number
  display_on_ota: number
  display_name: string
  highlight_feature: number
  track_usage: number
  requires_checkout_confirmation: number
}

interface ComplimentaryFormProps {
  selectedItem: ComplimentaryFormType
  onSave: (values: ComplimentaryFormType) => void
}

const ComplimentaryForm = forwardRef<any, ComplimentaryFormProps>(({ selectedItem, onSave }, ref) => {
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: selectedItem,
    validationSchema: Yup.object({
      item_name: Yup.string().required('Item name is required'),
      item_type: Yup.string().required('Item type is required'),
      hotel_id: Yup.string().required('Hotel is required'),
      quantity_per_room: Yup.string().required('Quantity per room is required'),
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
        <Row className="g-1">
          {/* Left Section */}
          <Col md={7}>
            <div className="p-1 rounded mb-1">
              {/* Basic Information Section */}
              <div className="border p-3 rounded mb-9">
                <h6 className="mb-9 border-bottom pb-2">Basic Information</h6>
                
                <Row className="align-items-center mb-9">
                  <Col md={4}>Item Name :</Col>
                  <Col md={8}>
                    <FormikTextInput
                      name="item_name"
                      placeholder="Enter item name"
                      className="w-100"
                    />
                  </Col>
                </Row>

                <Row className="align-items-center mb-9">
                  <Col md={4}>Item Type :</Col>
                  <Col md={8}>
                    <FormSelect
                      name="item_type"
                      options={[
                        { label: 'Food', value: 'food' },
                        { label: 'Beverage', value: 'beverage' },
                        { label: 'Service', value: 'service' },
                        { label: 'Amenity', value: 'amenity' },
                        { label: 'Other', value: 'other' },
                      ]}
                      className="w-100"
                    />
                  </Col>
                </Row>

                <Row className="mb-9">
                  <Col md={4} className="pt-1">
                    Description :
                  </Col>
                  <Col md={8}>
                    <FormikTextInput
                      name="description"
                      rows={2}
                      placeholder="Enter description"
                      className="w-100"
                    />
                  </Col>
                </Row>

                <Row className="align-items-center mb-9">
                  <Col md={4}>Item Code :</Col>
                  <Col md={8}>
                    <FormikTextInput
                      name="item_code"
                      placeholder="Enter item code"
                      className="w-100"
                    />
                  </Col>
                </Row>

                <Row className="align-items-center">
                  <Col md={4}>UOM :</Col>
                  <Col md={8}>
                    <FormSelect
                      name="uom"
                      options={[
                        { label: 'Piece', value: 'piece' },
                        { label: 'Hour', value: 'hour' },
                        { label: 'Day', value: 'day' },
                        { label: 'Liter', value: 'liter' },
                        { label: 'Kilogram', value: 'kg' },
                        { label: 'Portion', value: 'portion' },
                      ]}
                      className="w-100"
                    />
                  </Col>
                </Row>
              </div>

              {/* Hotel & Quantity Section */}
              <div className="border p-3 rounded mb-9">
                <h6 className="mb-9 border-bottom pb-2">Hotel & Quantity</h6>
                
                <Row className="align-items-center mb-9">
                  <Col md={4}>Hotel :</Col>
                  <Col md={8}>
                    <FormikTextInput
                      name="hotel_id"
                      placeholder="Enter hotel ID"
                      className="w-100"
                    />
                  </Col>
                </Row>

                <Row className="align-items-center mb-9">
                  <Col md={4}>Quantity Per Room :</Col>
                  <Col md={8}>
                    <FormikTextInput
                      name="quantity_per_room"
                      type="number"
                      placeholder="Enter quantity"
                      className="w-100"
                    />
                  </Col>
                </Row>

                <Row className="align-items-center mb-9">
                  <Col md={4}>Max Quantity Per Stay :</Col>
                  <Col md={8}>
                    <FormikTextInput
                      name="max_quantity_per_stay"
                      type="number"
                      placeholder="Enter max quantity"
                      className="w-100"
                    />
                  </Col>
                </Row>

                <Row className="align-items-center">
                  <Col md={{ span: 8, offset: 4 }}>
                    <div className="d-flex gap-3">
                      <FormikCheckbox label="Per Adult" name="per_adult" />
                      <FormikCheckbox label="Per Child" name="per_child" />
                    </div>
                  </Col>
                </Row>
              </div>

              {/* Availability & Timing Section */}
              <div className="border p-3 rounded">
                <h6 className="mb-9 border-bottom pb-2">Availability & Timing</h6>
                
                <Row className="align-items-center mb-9">
                  <Col md={4}>Availability Type :</Col>
                  <Col md={8}>
                    <FormSelect
                      name="availability_type"
                      options={[
                        { label: 'Always Available', value: 'always' },
                        { label: 'Time-based', value: 'time_based' },
                        { label: 'Conditional', value: 'conditional' },
                      ]}
                      className="w-100"
                    />
                  </Col>
                </Row>

                <Row className="align-items-center mb-9">
                  <Col md={4}>Start Date :</Col>
                  <Col md={8}>
                    <FormikTextInput
                      name="start_date"
                      type="date"
                      className="w-100"
                    />
                  </Col>
                </Row>

                <Row className="align-items-center mb-9">
                  <Col md={4}>End Date :</Col>
                  <Col md={8}>
                    <FormikTextInput
                      name="end_date"
                      type="date"
                      className="w-100"
                    />
                  </Col>
                </Row>

                <Row className="align-items-center mb-9">
                  <Col md={4}>Seasonal :</Col>
                  <Col md={8}>
                    <div className="d-flex gap-3">
                      <FormikCheckbox label="Seasonal Offering" name="seasonal" />
                    </div>
                  </Col>
                </Row>

                <Row className="align-items-center mb-9">
                  <Col md={4}>Start Time :</Col>
                  <Col md={8}>
                    <FormikTextInput
                      name="start_time"
                      type="time"
                      className="w-100"
                    />
                  </Col>
                </Row>

                <Row className="align-items-center">
                  <Col md={4}>End Time :</Col>
                  <Col md={8}>
                    <FormikTextInput
                      name="end_time"
                      type="time"
                      className="w-100"
                    />
                  </Col>
                </Row>
              </div>
            </div>
          </Col>

          {/* Right Section */}
          <Col md={5}>
            {/* Eligibility & Conditions Section */}
            <div className="border p-3 rounded mb-9">
              <h6 className="mb-9 border-bottom pb-2">Eligibility & Conditions</h6>
              
              <Row className="align-items-center mb-9">
                <Col md={5}>Min Stay Nights :</Col>
                <Col md={7}>
                  <FormikTextInput
                    name="min_stay_nights"
                    type="number"
                    placeholder="Enter nights"
                    className="w-100"
                  />
                </Col>
              </Row>

              <Row className="align-items-center mb-9">
                <Col md={5}>Advance Booking Days :</Col>
                <Col md={7}>
                  <FormikTextInput
                    name="advance_booking_days"
                    type="number"
                    placeholder="Enter days"
                    className="w-100"
                  />
                </Col>
              </Row>

              <Row className="align-items-center mb-9">
                <Col md={5}>Guest Type :</Col>
                <Col md={7}>
                  <FormSelect
                    name="guest_type"
                    options={[
                      { label: 'All Guests', value: 'all' },
                      { label: 'New Guests', value: 'new' },
                      { label: 'Returning Guests', value: 'returning' },
                      { label: 'VIP Only', value: 'vip' },
                    ]}
                    className="w-100"
                  />
                </Col>
              </Row>

              <Row className="align-items-center mb-9">
                <Col md={5}>Loyalty Tier :</Col>
                <Col md={7}>
                  <FormikTextInput
                    name="loyalty_tier"
                    placeholder="Enter tier"
                    className="w-100"
                  />
                </Col>
              </Row>

              <Row className="align-items-center">
                <Col md={5}>Age Restriction :</Col>
                <Col md={7}>
                  <FormikTextInput
                    name="age_restriction"
                    placeholder="e.g., 18+, 21+"
                    className="w-100"
                  />
                </Col>
              </Row>
            </div>

            {/* Delivery & Fulfillment Section */}
            <div className="border p-3 rounded mb-9">
              <h6 className="mb-9 border-bottom pb-2">Delivery & Fulfillment</h6>
              
              <Row className="align-items-center mb-9">
                <Col md={5}>Delivery Method :</Col>
                <Col md={7}>
                  <FormSelect
                    name="delivery_method"
                    options={[
                      { label: 'In-room', value: 'in_room' },
                      { label: 'Restaurant', value: 'restaurant' },
                      { label: 'Reception', value: 'reception' },
                      { label: 'Bar', value: 'bar' },
                      { label: 'Spa', value: 'spa' },
                    ]}
                    className="w-100"
                  />
                </Col>
              </Row>

              <Row className="align-items-center mb-9">
                <Col md={5}>Delivery Time :</Col>
                <Col md={7}>
                  <FormikTextInput
                    name="delivery_time"
                    type="time"
                    className="w-100"
                  />
                </Col>
              </Row>

              <Row className="mb-9">
                <Col md={12}>
                  <FormikTextInput
                    name="instructions"
                    rows={2}
                    placeholder="Enter special instructions"
                    className="w-100"
                  />
                </Col>
              </Row>
            </div>

            {/* Cost & Accounting Section */}
            <div className="border p-3 rounded mb-9">
              <h6 className="mb-9 border-bottom pb-2">Cost & Accounting</h6>
              
              <Row className="align-items-center mb-9">
                <Col md={5}>Cost Price :</Col>
                <Col md={7}>
                  <FormikTextInput
                    name="cost_price"
                    type="number"
                    placeholder="Enter cost"
                    step="0.01"
                    className="w-100"
                  />
                </Col>
              </Row>

              <Row className="align-items-center mb-9">
                <Col md={5}>Account Code :</Col>
                <Col md={7}>
                  <FormikTextInput
                    name="account_code"
                    placeholder="Enter GL code"
                    className="w-100"
                  />
                </Col>
              </Row>

              <Row className="align-items-center mb-9">
                <Col md={5}>Tax Rate % :</Col>
                <Col md={7}>
                  <FormikTextInput
                    name="tax_rate"
                    type="number"
                    placeholder="Enter tax rate"
                    step="0.01"
                    className="w-100"
                  />
                </Col>
              </Row>

              <Row className="align-items-center">
                <Col md={{ span: 7, offset: 5 }}>
                  <div className="d-flex gap-3">
                    <FormikCheckbox label="Taxable" name="taxable" />
                  </div>
                </Col>
              </Row>
            </div>

            {/* Status & Display Section */}
            <div className="border p-3 rounded">
              <h6 className="mb-9 border-bottom pb-2">Status & Display</h6>
              
              <Row className="align-items-center mb-9">
                <Col md={5}>Status :</Col>
                <Col md={7}>
                  <FormSelect
                    name="status"
                    options={[
                      { label: 'Active', value: 1 },
                      { label: 'Inactive', value: 0 },
                    ]}
                    className="w-100"
                  />
                </Col>
              </Row>

              <Row className="align-items-center mb-9">
                <Col md={5}>Display Order :</Col>
                <Col md={7}>
                  <FormikTextInput
                    name="display_order"
                    type="number"
                    placeholder="Enter order"
                    className="w-100"
                  />
                </Col>
              </Row>

              <Row className="align-items-center mb-9">
                <Col md={5}>Display Name :</Col>
                <Col md={7}>
                  <FormikTextInput
                    name="display_name"
                    placeholder="Name shown to guests"
                    className="w-100"
                  />
                </Col>
              </Row>

              <Row className="align-items-center mb-9">
                <Col md={{ span: 7, offset: 5 }}>
                  <div className="d-flex flex-column gap-2">
                    <FormikCheckbox label="Display on Website" name="display_on_website" />
                    <FormikCheckbox label="Display on OTA" name="display_on_ota" />
                    <FormikCheckbox label="Highlight Feature" name="highlight_feature" />
                    <FormikCheckbox label="Track Usage" name="track_usage" />
                    <FormikCheckbox label="Requires Checkout Confirmation" name="requires_checkout_confirmation" />
                  </div>
                </Col>
              </Row>

              <Row className="mb-9">
                <Col md={12}>
                  <FormikTextInput
                    name="terms_conditions"
                    rows={3}
                    placeholder="Enter terms and conditions"
                    className="w-100"
                  />
                </Col>
              </Row>

              <Row>
                <Col md={12}>
                  <div className="d-flex justify-content-center gap-3">
                    <button type="button" className="btn btn-outline-secondary">
                      CANCEL
                    </button>
                    <button type="submit" className="btn btn-primary">
                      SAVE
                    </button>
                  </div>
                </Col>
              </Row>
            </div>
          </Col>
        </Row>
      </form>
    </FormikProvider>
  )
})

export default ComplimentaryForm