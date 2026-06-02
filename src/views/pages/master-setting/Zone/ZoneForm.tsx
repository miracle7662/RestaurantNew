import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Row } from 'react-bootstrap';
import { FormikProvider, useFormik } from 'formik';
import * as Yup from 'yup';
import FormikTextInput from '@/components/Common/FormikTextInput';
import FormikSelect from '@/components/Common/FormikSelect';
import cityApi from '@/common/hotel/cities'; // adjust import path

type ZoneFormData = {
  zonename: string;
  zonecode: string;
  cityid: number;
  description: string;
  status: number;
};

const defaultForm: ZoneFormData = {
  zonename: '',
  zonecode: '',
  cityid: 0,
  description: '',
  status: 1,
};

interface ZoneFormProps {
  selectedItem?: ZoneFormData;
  onSave: (values: ZoneFormData) => void;
  onCancel?: () => void;
}

const ZoneForm = forwardRef<any, ZoneFormProps>(({ selectedItem, onSave }, ref) => {
  const [cities, setCities] = useState<any[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);

  // Load cities on mount
  useEffect(() => {
    const loadCities = async () => {
      setLoadingCities(true);
      try {
        const response = await cityApi.list();
        if (response.success && Array.isArray(response.data)) {
          setCities(response.data.filter((item: any) => item.status === 1));
        }
      } catch (error) {
        console.error('Failed to load cities:', error);
      } finally {
        setLoadingCities(false);
      }
    };
    loadCities();
  }, []);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: selectedItem
      ? {
          zonename: selectedItem.zonename,
          zonecode: selectedItem.zonecode,
          cityid: selectedItem.cityid,
          description: selectedItem.description ?? '',
          status: selectedItem.status,
        }
      : defaultForm,
    validationSchema: Yup.object({
      zonename: Yup.string().required('Zone name is required'),
      zonecode: Yup.string().required('Zone code is required'),
      cityid: Yup.number().required('City is required').min(1, 'City is required'),
      description: Yup.string(),
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
            label="Zone Name"
            name="zonename"
            placeholder="Enter zone name"
            md={6}
          />

          <FormikTextInput
            label="Zone Code"
            name="zonecode"
            placeholder="Enter zone code"
            md={6}
          />

          <FormikSelect
            label="City"
            name="cityid"
            options={cities.map((city) => ({
              label: city.city_name,
              value: city.cityid,
            }))}
            md={6}
            isLoading={loadingCities}
            placeholder="Select City"
          />

          <FormikTextInput
            label="Description"
            name="description"
            placeholder="Enter description (optional)"
            md={6}
          />

          <FormikSelect
            label="Status"
            name="status"
            options={[
              { label: 'Active', value: 1 },
              { label: 'Inactive', value: 0 },
            ]}
            md={6}
          />
        </Row>
      </form>
    </FormikProvider>
  );
});

export default ZoneForm;