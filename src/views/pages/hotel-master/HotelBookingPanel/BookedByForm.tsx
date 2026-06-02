// components/BookedByForm.tsx
import { forwardRef, useImperativeHandle } from 'react';
import { Row } from 'react-bootstrap';
import { FormikProvider, useFormik } from 'formik';
import * as Yup from 'yup';
import FormikTextInput from '@/components/Common/FormikTextInput';
import FormSelect from '@/components/Common/FormikSelect';

export interface BookedBy {
  name: string;
  mobile1: string;
  mobile2: string;
  address: string;
  countryId: number | null;
  stateId: number | null;
  cityId: number | null;
  email: string;
  website: string;
}

interface BookedByFormProps {
  selectedItem: BookedBy;
  onSave: (values: BookedBy) => void;
  countryOptions: { label: string; value: string | number }[];
  stateOptions: { label: string; value: string | number }[];
  cityOptions: { label: string; value: string | number }[];
  loadingCountries?: boolean;
  loadingStates?: boolean;
  loadingCities?: boolean;
}

const BookedByForm = forwardRef<any, BookedByFormProps>(
  (
    {
      selectedItem,
      onSave,
      countryOptions,
      stateOptions,
      cityOptions,
      loadingCountries,
      loadingStates,
      loadingCities,
    },
    ref
  ) => {
    const formik = useFormik({
      enableReinitialize: true,
      initialValues: selectedItem,
      validationSchema: Yup.object({
        name: Yup.string().required('Name is required'),
        mobile1: Yup.string().required('Mobile 1 is required'),
        email: Yup.string().email('Invalid email'),
      }),
      onSubmit: (values) => {
        onSave(values);
      },
    });

    useImperativeHandle(ref, () => ({
      saveData: formik.handleSubmit,
    }));

    return (
      <FormikProvider value={formik}>
        <form onSubmit={formik.handleSubmit} style={{ marginBottom: '1px' }}>
          <Row className="g-2 mb-1" style={{ paddingBottom: '1px' }}>
            <FormikTextInput label="Name" name="name" required md={6} />
            <FormikTextInput label="Email" name="email" type="email" md={6} />
            <FormikTextInput label="Mobile 1" name="mobile1" required md={6} />
            <FormikTextInput label="Mobile 2" name="mobile2" md={6} />
            <FormikTextInput label="Website" name="website" md={12} />

            <FormSelect
              label="Country"
              name="countryId"
              options={countryOptions}
              isLoading={loadingCountries}
              md={4}
            />

            <FormSelect
              label="State"
              name="stateId"
              options={stateOptions}
              isLoading={loadingStates}
              md={4}
            />

            <FormSelect
              label="City"
              name="cityId"
              options={cityOptions}
              isLoading={loadingCities}
              md={4}
            />

            <FormikTextInput
              label="Address"
              name="address"
              as="textarea"
              rows={3}
              md={12}
            />
          </Row>
        </form>
      </FormikProvider>
    );
  }
);

BookedByForm.displayName = 'BookedByForm';
export default BookedByForm;