import { forwardRef, useImperativeHandle } from 'react';
import { Row } from 'react-bootstrap';
import { FormikProvider, useFormik } from 'formik';
import * as Yup from 'yup';
import FormikTextInput from '@/components/Common/FormikTextInput';
import FormikSelect from '@/components/Common/FormikSelect';

type SubscriptionPlan = {
  plan_id: number;
  plan_name: string;
  plan_duration_months: number;
  plan_amount: number;
  max_hotels: number;
  max_users: number;
  is_active: number;
};

type SubscriptionPlanFormData = {
  plan_name: string;
  plan_duration_months: number;
  plan_amount: number;
  max_hotels: number;
  max_users: number;
  is_active: number;
};

const defaultForm: SubscriptionPlanFormData = {
  plan_name: '',
  plan_duration_months: 1,
  plan_amount: 0,
  max_hotels: 1,
  max_users: 5,
  is_active: 1,
};

interface SubscriptionPlanFormProps {
  selectedItem?: SubscriptionPlan;
  onSave: (values: SubscriptionPlanFormData) => void;
  onCancel?: () => void;
}

const SubscriptionPlanForm = forwardRef<any, SubscriptionPlanFormProps>(
  ({ selectedItem, onSave }, ref) => {
    const formik = useFormik({
      enableReinitialize: true,
      initialValues: selectedItem
        ? {
            plan_name: selectedItem.plan_name,
            plan_duration_months: selectedItem.plan_duration_months,
            plan_amount: selectedItem.plan_amount,
            max_hotels: selectedItem.max_hotels,
            max_users: selectedItem.max_users,
            is_active: selectedItem.is_active,
          }
        : defaultForm,
      validationSchema: Yup.object({
        plan_name: Yup.string().required('Plan name is required'),
        plan_duration_months: Yup.number()
          .required('Duration is required')
          .min(1, 'Must be at least 1 month'),
        plan_amount: Yup.number()
          .required('Amount is required')
          .min(0, 'Amount cannot be negative'),
        max_hotels: Yup.number()
          .required('Max hotels is required')
          .min(1, 'Must be at least 1'),
        max_users: Yup.number()
          .required('Max users is required')
          .min(1, 'Must be at least 1'),
        is_active: Yup.number().required('Status is required'),
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
              label="Plan Name"
              name="plan_name"
              placeholder="Enter plan name"
              md={6}
            />

            <FormikTextInput
              label="Duration (months)"
              name="plan_duration_months"
              placeholder="e.g., 12"
              type="number"
              md={6}
            />

            <FormikTextInput
              label="Amount"
              name="plan_amount"
              placeholder="0.00"
              type="number"
              step="0.01"
              md={6}
            />

            <FormikTextInput
              label="Max Hotels"
              name="max_hotels"
              placeholder="1"
              type="number"
              md={6}
            />

            <FormikTextInput
              label="Max Users"
              name="max_users"
              placeholder="5"
              type="number"
              md={6}
            />

            <FormikSelect
              label="Status"
              name="is_active"
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
  }
);

export default SubscriptionPlanForm;