import { forwardRef, useImperativeHandle } from 'react';
import { Row } from 'react-bootstrap';
import { FormikProvider, useFormik } from 'formik';
import * as Yup from 'yup';
import FormikTextInput from '@/components/Common/FormikTextInput';
import FormikSelect from '@/components/Common/FormikSelect';

type HotelTaxFormData = {
  hotel_tax_value: string;
  hotel_cgst: string;
  hotel_sgst: string;
  hotel_igst: string;
  hotel_cess: string;
  status: number;
};

const defaultForm: HotelTaxFormData = {
  hotel_tax_value: '',
  hotel_cgst: '',
  hotel_sgst: '',
  hotel_igst: '',
  hotel_cess: '',
  status: 1,
};

interface HotelTaxFormProps {
  selectedItem?: HotelTaxFormData;
  onSave: (values: HotelTaxFormData) => void;
  onCancel?: () => void;
}

const HotelTaxForm = forwardRef<any, HotelTaxFormProps>(({ selectedItem, onSave }, ref) => {
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: selectedItem
      ? {
          hotel_tax_value: selectedItem.hotel_tax_value,
          hotel_cgst: selectedItem.hotel_cgst,
          hotel_sgst: selectedItem.hotel_sgst,
          hotel_igst: selectedItem.hotel_igst,
          hotel_cess: selectedItem.hotel_cess,
          status: selectedItem.status,
        }
      : defaultForm,
    validationSchema: Yup.object({
      hotel_tax_value: Yup.number()
        .typeError('Must be a number')
        .required('Tax value is required'),
      hotel_cgst: Yup.number()
        .typeError('Must be a number')
        .required('CGST is required'),
      hotel_sgst: Yup.number()
        .typeError('Must be a number')
        .required('SGST is required'),
      hotel_igst: Yup.number()
        .typeError('Must be a number')
        .required('IGST is required'),
      hotel_cess: Yup.number()
        .typeError('Must be a number')
        .required('CESS is required'),
      status: Yup.number().required('Status is required'),
    }),
    onSubmit: (values) => {
      onSave(values);
    },
  });

  const { handleSubmit } = formik;

  useImperativeHandle(ref, () => ({
    saveData: handleSubmit,
  }));

  return (
    <FormikProvider value={formik}>
      <form onSubmit={handleSubmit}>
        <Row className="g-3">
          <FormikTextInput
            label="Tax Value"
            name="hotel_tax_value"
            type="number"
            placeholder="Enter tax value"
            md={6}
          />

          <FormikTextInput
            label="CGST"
            name="hotel_cgst"
            type="number"
            placeholder="Enter CGST"
            md={6}
          />

          <FormikTextInput
            label="SGST"
            name="hotel_sgst"
            type="number"
            placeholder="Enter SGST"
            md={6}
          />

          <FormikTextInput
            label="IGST"
            name="hotel_igst"
            type="number"
            placeholder="Enter IGST"
            md={6}
          />

          <FormikTextInput
            label="CESS"
            name="hotel_cess"
            type="number"
            placeholder="Enter CESS"
            md={6}
          />

          <FormikSelect
            label="Status"
            name="status"
            options={[
              { label: 'Active', value: 1 },
              { label: 'Inactive', value: 0 },
            ]}
          />
        </Row>
      </form>
    </FormikProvider>
  );
});

export default HotelTaxForm;