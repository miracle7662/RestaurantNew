import * as Yup from 'yup';

export const myFormValidationSchema = Yup.object().shape({
  country_name: Yup.string().required('Country name is required'),
  country_code: Yup.string()
    .required('Country code is required')
    .max(3, 'Country code must be at most 3 characters')
    .matches(/^[0-9]+$/, 'Country code must be numbers only'),
  country_capital: Yup.string().required('Capital city is required'),
  status: Yup.string()
    .required('Status is required')
    .oneOf(['Active', 'Inactive'], 'Status must be Active or Inactive'),
});

export const cityFormValidationSchema = Yup.object().shape({
  city_name: Yup.string().required('City name is required'),
  city_code: Yup.string()
    .required('City code is required')
    .max(4, 'City code must be at most 4 characters')
    .matches(/^[A-Z0-9]+$/, 'City code must be uppercase letters and numbers only'),
  stateId: Yup.number().required('State is required').positive('Invalid state'),
  status: Yup.string()
    .required('Status is required')
    .oneOf(['Active', 'Inactive'], 'Status must be Active or Inactive'),
});

export const stateFormValidationSchema = Yup.object().shape({
  state_name: Yup.string().required('State name is required'),
  state_code: Yup.string()
    .required('State code is required')
    .max(4, 'State code must be at most 4 characters')
    .matches(/^[A-Z0-9]+$/, 'State code must be uppercase letters and numbers only'),
  state_capital: Yup.string().required('Capital city is required'),
  countryId: Yup.number().required('Country is required').positive('Invalid country'),
  status: Yup.string()
    .required('Status is required')
    .oneOf(['Active', 'Inactive'], 'Status must be Active or Inactive'),
});
