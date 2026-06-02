// src/views/pages/master-setting/RegistrationHotelUsers/RegistrationHotelUsersForm.tsx
import { forwardRef, useEffect, useState, useImperativeHandle, useRef } from 'react';
import { Row } from 'react-bootstrap'; // removed unused Col
import { FormikProvider, useFormik } from 'formik';
import * as Yup from 'yup';
import FormikTextInput from '@/components/Common/FormikTextInput';
import FormikSelect from '@/components/Common/FormikSelect';
import FormikCheckbox from '@/components/Common/FormikCheckbox';
import CountryService from '@/common/api/countries';
import StateService from '@/common/api/states';
import CityService from '@/common/api/cities';
import SubscriptionPlanService from '@/common/hotel/subscriptionPlans';

// Base type from API (numbers for checkbox fields)
type HotelRegistrationFormData = {
  mst_hotelid?: number;
  hotel_name: string;
  brand_name: string;
  email: string;
  password?: string;
  confirm_password?: string;
  mobile: string;
  whatsappno: string;
  address: string;
  cityid: number | null;
  stateid: number | null;
  countryid: number | null;
  latitude: number | null;
  longitude: number | null;
  description: string;
  username: string;
  self_online_booking_allow: number;   // number (0/1)
  partner_booking_allow: number;       // number (0/1)
  hotel_type: string;
  hotel_owner_name: string;
  hotel_owner_mobile: string;
  hotel_contact_person: string;
  hotel_contact_mobile: string;
  check_in_time: string;
  check_out_time: string;
  rating: number | null;
  status: number;
  hotel_gstno: string;
  hotel_pan_no: string;
  shop_act_no: string;
  fssai_no: string;
  hsn_code: string;
  sac_code: string;
  website: string;
  istaxable: number;                   // number (0/1)
  istaxinclude: number;                // number (0/1)
  subscription_id: number | null;
  subscription_validity: string;
};

// Form values type – boolean for checkbox fields
type HotelRegistrationFormValues = Omit<
  HotelRegistrationFormData,
  'self_online_booking_allow' | 'partner_booking_allow' | 'istaxable' | 'istaxinclude'
> & {
  self_online_booking_allow: boolean;
  partner_booking_allow: boolean;
  istaxable: boolean;
  istaxinclude: boolean;
};

const defaultForm: HotelRegistrationFormValues = {
  hotel_name: '',
  brand_name: '',
  email: '',
  password: '',
  confirm_password: '',
  mobile: '',
  whatsappno: '',
  address: '',
  cityid: null,
  stateid: null,
  countryid: null,
  latitude: null,
  longitude: null,
  description: '',
  username: '',
  self_online_booking_allow: false,
  partner_booking_allow: false,
  hotel_type: '',
  hotel_owner_name: '',
  hotel_owner_mobile: '',
  hotel_contact_person: '',
  hotel_contact_mobile: '',
  check_in_time: '00:00',
  check_out_time: '09:30',
  rating: null,
  status: 1,
  hotel_gstno: '',
  hotel_pan_no: '',
  shop_act_no: '',
  fssai_no: '',
  hsn_code: '',
  sac_code: '',
  website: '',
  istaxable: true,
  istaxinclude: false,
  subscription_id: null,
  subscription_validity: '',
};

interface HotelRegistrationFormProps {
  selectedItem?: HotelRegistrationFormData; // from API (numbers)
  onSave: (values: HotelRegistrationFormData) => void;
}

const HotelRegistrationForm = forwardRef<any, HotelRegistrationFormProps>(
  ({ selectedItem, onSave }, ref) => {
    // Dropdown data
    const [countries, setCountries] = useState<{ label: string; value: number }[]>([]);
    const [states, setStates] = useState<{ label: string; value: number }[]>([]);
    const [cities, setCities] = useState<{ label: string; value: number }[]>([]);
    const [subscriptionPlans, setSubscriptionPlans] = useState<{ label: string; value: number }[]>(
      []
    );

    // Flag to track initial mount (prevent clearing dependent fields on first load)
    const isInitialMount = useRef(true);

    // Load countries and subscription plans on mount
    useEffect(() => {
      const fetchCountries = async () => {
        try {
          const res = await CountryService.list();
          if (res.success) {
            setCountries(
              res.data.map((c: any) => ({ label: c.country_name, value: c.countryid }))
            );
          }
        } catch (error) {
          console.error('Failed to load countries', error);
        }
      };

      const fetchSubscriptionPlans = async () => {
        try {
          const res = await SubscriptionPlanService.list();
          if (res.success) {
            setSubscriptionPlans(
              res.data.map((p: any) => ({ label: p.plan_name, value: p.plan_id }))
            );
          }
        } catch (error) {
          console.error('Failed to load subscription plans', error);
        }
      };

      fetchCountries();
      fetchSubscriptionPlans();
    }, []);

    // Load states when country changes
    const loadStates = async (countryId: number) => {
      try {
        const res = await StateService.list({ countryid: countryId });
        if (res.success) {
          setStates(res.data.map((s: any) => ({ label: s.state_name, value: s.stateid })));
        } else {
          setStates([]);
        }
      } catch (error) {
        console.error('Failed to load states', error);
        setStates([]);
      }
    };

    // Load cities when state changes
    const loadCities = async (stateId: number) => {
      try {
        const res = await CityService.list({ stateId });
        if (res.success) {
          setCities(res.data.map((c: any) => ({ label: c.city_name, value: c.cityid })));
        } else {
          setCities([]);
        }
      } catch (error) {
        console.error('Failed to load cities', error);
        setCities([]);
      }
    };

    // Convert API data (numbers) to form values (booleans)
    const getFormInitialValues = (item?: HotelRegistrationFormData): HotelRegistrationFormValues => {
      if (item) {
        return {
          ...item,
          password: '', // clear password for edit
          confirm_password: '',
          self_online_booking_allow: item.self_online_booking_allow === 1,
          partner_booking_allow: item.partner_booking_allow === 1,
          istaxable: item.istaxable === 1,
          istaxinclude: item.istaxinclude === 1,
        };
      }
      return { ...defaultForm };
    };

    const formik = useFormik<HotelRegistrationFormValues>({
      enableReinitialize: true,
      initialValues: getFormInitialValues(selectedItem),
      validationSchema: Yup.object({
        hotel_name: Yup.string().required('Hotel name is required'),
        email: Yup.string().email('Invalid email').required('Email is required'),
        // Password: required only for new hotel (no mst_hotelid)
        password: Yup.string()
          .min(6, 'Password must be at least 6 characters')
          .test('password-required', 'Password is required', function (value) {
            // If editing (mst_hotelid exists), password is optional
            if (this.parent.mst_hotelid) return true;
            // For new hotel, password must be present and non-empty
            return !!value && value.trim().length > 0;
          }),
        confirm_password: Yup.string()
          .oneOf([Yup.ref('password')], 'Passwords must match')
          .test('confirm-password-required', 'Confirm password is required', function (value) {
            if (this.parent.mst_hotelid) return true;
            return !!value && value.trim().length > 0;
          }),
      }),
      onSubmit: (values) => {
        // Remove confirm_password and convert booleans to numbers
        const { confirm_password, ...payload } = values;
        const apiPayload: HotelRegistrationFormData = {
          ...payload,
          self_online_booking_allow: payload.self_online_booking_allow ? 1 : 0,
          partner_booking_allow: payload.partner_booking_allow ? 1 : 0,
          istaxable: payload.istaxable ? 1 : 0,
          istaxinclude: payload.istaxinclude ? 1 : 0,
          status: Number(payload.status),
        };
        // If editing and no new password provided, remove password from payload
        if (apiPayload.mst_hotelid && !apiPayload.password) {
          delete apiPayload.password;
        }
        onSave(apiPayload);
      },
      validateOnChange: true,
      validateOnBlur: true,
    });

    const { handleSubmit, setFieldValue, values } = formik;

    // Handle country change – load states and reset state/city only on user change (not initial)
    useEffect(() => {
      if (values.countryid) {
        loadStates(values.countryid);
        if (!isInitialMount.current) {
          setFieldValue('stateid', '');
          setFieldValue('cityid', '');
        }
      } else {
        setStates([]);
        setCities([]);
      }
    }, [values.countryid, setFieldValue]);

    // Handle state change – load cities and reset city only on user change
    useEffect(() => {
      if (values.stateid) {
        loadCities(values.stateid);
        if (!isInitialMount.current) {
          setFieldValue('cityid', null);
        }
      } else {
        setCities([]);
      }
    }, [values.stateid, setFieldValue]);

    // Mark initial mount as complete after first render
    useEffect(() => {
      isInitialMount.current = false;
    }, []);

    useImperativeHandle(ref, () => ({
      saveData: handleSubmit,
    }));

    return (
      <FormikProvider value={formik}>
        <form onSubmit={handleSubmit}>
          <Row className="g-3">
            <FormikTextInput
              label="Hotel Name"
              name="hotel_name"
              placeholder="Enter hotel name"
              md={6}
            />
            <FormikTextInput label="Brand Name" name="brand_name" placeholder="Enter brand name" md={6} />

            <FormikTextInput label="Email" name="email" type="email" placeholder="Enter email" md={6} />
            <FormikTextInput label="Mobile" name="mobile" placeholder="Mobile number" md={6} />
            {!values.mst_hotelid && (
              <>
                <FormikTextInput
                  label="Password"
                  name="password"
                  type="password"
                  placeholder="Enter password"
                  md={6}
                />
                <FormikTextInput
                  label="Confirm Password"
                  name="confirm_password"
                  type="password"
                  placeholder="Confirm password"
                  md={6}
                />
              </>
            )}

             <FormikTextInput label="Username" name="username" placeholder="Username" md={6} />
            <FormikTextInput label="WhatsApp No" name="whatsappno" placeholder="WhatsApp number" md={6} />

            <FormikTextInput label="Address" name="address" placeholder="Address" md={12} as="textarea" />

            <FormikSelect
              label="Country"
              name="countryid"
              options={countries}
              md={4}
              placeholder="Select country"
            />
            <FormikSelect
              label="State"
              name="stateid"
              options={states}
              md={4}
              placeholder="Select state"
              disabled={!values.countryid}
            />
            <FormikSelect
              label="City"
              name="cityid"
              options={cities}
              md={4}
              placeholder="Select city"
              disabled={!values.stateid}
            />

            <FormikTextInput 
            label="Latitude" 
            name="latitude" 
            type="number" 
            placeholder="Latitude" 
            md={6} />

            <FormikTextInput
              label="Longitude"
              name="longitude"
              type="number"
              placeholder="Longitude"
              md={6}
            />
            <FormikTextInput
              label="Description"
              name="description"
              placeholder="Description"
              md={12}
              as="textarea"
            />

           

            <FormikCheckbox
              label="Self Online Booking Allow"
              name="self_online_booking_allow"
              md={6}
              custom="true"
            />
            <FormikCheckbox label="Partner Booking Allow" name="partner_booking_allow" md={6}/>

            <FormikTextInput label="Hotel Type" name="hotel_type" placeholder="Hotel type" md={6} />
            <FormikTextInput
              label="Hotel Owner Name"
              name="hotel_owner_name"
              placeholder="Owner name"
              md={6}
            />
            <FormikTextInput
              label="Hotel Owner Mobile"
              name="hotel_owner_mobile"
              placeholder="Owner mobile"
              md={6}
            />
            <FormikTextInput
              label="Hotel Contact Person"
              name="hotel_contact_person"
              placeholder="Contact person"
              md={6}
            />
            <FormikTextInput
              label="Hotel Contact Mobile"
              name="hotel_contact_mobile"
              placeholder="Contact mobile"
              md={6}
            />

            <FormikTextInput
              label="Check-in Time"
              name="check_in_time"
              type="time"
              placeholder="HH:MM"
              md={3}
            />
            <FormikTextInput
              label="Check-out Time"
              name="check_out_time"
              type="time"
              placeholder="HH:MM"
              md={3}
            />
            <FormikTextInput 
            label="Rating" 
            name="rating" 
            type="number" 
            placeholder="Rating" 
            md={4} />

            <FormikSelect
              label="Status"
              name="status"
              options={[
                { label: 'Active', value: 1 },
                { label: 'Inactive', value: 0 },
              ]}
              md={4}
            />

            <FormikTextInput label="GST No" name="hotel_gstno" placeholder="GST number" md={4} />
            <FormikTextInput label="PAN No" name="hotel_pan_no" placeholder="PAN number" md={4} />
            <FormikTextInput label="Shop Act No" name="shop_act_no" placeholder="Shop act number" md={4} />
            <FormikTextInput label="FSSAI No" name="fssai_no" placeholder="FSSAI number" md={4} />
            <FormikTextInput label="HSN Code" name="hsn_code" placeholder="HSN code" md={4} />
            <FormikTextInput label="SAC Code" name="sac_code" placeholder="SAC code" md={4} />
            <FormikTextInput label="Website" name="website" placeholder="Website URL" md={4} />

            <FormikCheckbox label="Taxable" name="istaxable" md={6} />
            <FormikCheckbox label="Tax Include" name="istaxinclude" md={6} />

            <FormikSelect
              label="Subscription Plan"
              name="subscription_id"
              options={subscriptionPlans}
              md={6}
              placeholder="Select plan"
            />
            <FormikTextInput
              label="Subscription Validity"
              name="subscription_validity"
              type="date"
              placeholder="YYYY-MM-DD"
              md={6}
            />
          </Row>
        </form>
      </FormikProvider>
    );
  }
);

export default HotelRegistrationForm;