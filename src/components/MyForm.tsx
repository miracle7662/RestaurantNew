import React, { forwardRef, useImperativeHandle } from 'react';
import { Formik, Form } from 'formik';
import { Row } from 'react-bootstrap';
import { myFormValidationSchema } from '@/common/validators';
import FormikTextInput from './Common/FormikTextInput';
import FormikSelect from './Common/FormikSelect';

interface MyFormValues {
  country_name: string;
  country_code: string;
  country_capital: string;
  status: string;
}

interface MyFormProps {
  initialValues: MyFormValues;
  onSave: (values: MyFormValues) => void;
}

export interface MyFormRef {
  saveData: () => void;
}

const MyForm = forwardRef<MyFormRef, MyFormProps>(({ initialValues, onSave }, ref) => {
  const formikRef = React.useRef<any>(null);

  useImperativeHandle(ref, () => ({
    saveData: () => {
      if (formikRef.current) {
        formikRef.current.submitForm();
      }
    },
  }));

  return (
    <Formik
      innerRef={formikRef}
      initialValues={initialValues}
      validationSchema={myFormValidationSchema}
      onSubmit={onSave}
      enableReinitialize={true}
    >
      {({ values, setFieldValue }) => (
        <Form>
          <Row className="g-3">
            <div className="col-md-6">
              <FormikTextInput
                name="country_name"
                label="Country Name"
                placeholder="Enter country name"
              />
            </div>
            <div className="col-md-6">
              <FormikTextInput
                name="country_code"
                label="Country Code"
                placeholder="Enter country code"
                maxLength={3}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^[0-9]*$/.test(value)) {
                    setFieldValue('country_code', value);
                  }
                }}
              />
            </div>
            <div className="col-md-6">
              <FormikTextInput
                name="country_capital"
                label="Capital City"
                placeholder="Enter capital city"
              />
            </div>
            <div className="col-md-6">
              <FormikSelect
                name="status"
                label="Status"
                options={[
                  { value: 'Active', label: 'Active' },
                  { value: 'Inactive', label: 'Inactive' },
                ]}
                onChange={(e) => {
                  setFieldValue('status', e.target.value);
                }}
              />
            </div>
          </Row>
        </Form>
      )}
    </Formik>
  );
});

MyForm.displayName = 'MyForm';

export default MyForm;
