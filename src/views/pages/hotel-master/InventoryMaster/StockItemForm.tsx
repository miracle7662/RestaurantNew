// pages/InventoryManagement/StockItemForm.tsx
import { forwardRef, useImperativeHandle, useState, useEffect } from 'react';
import { Row, Col, Form } from 'react-bootstrap';
import { FormikProvider, useFormik } from 'formik';
import * as Yup from 'yup';
import FormikTextInput from '@/components/Common/FormikTextInput';
import FormikSelect from '@/components/Common/FormikSelect';
import { taxApi } from '@/common/hotel/index';
import { useAuthContext } from '@/common/context/useAuthContext';

interface StockItemFormData {
  item_id?: number;
  item_name: string;
  item_code: string;
  category: string;
  sub_category: string;
  unit: string;
  current_stock: number;
  minimum_stock: number;
  price: number;
  gst_percent: number;
  quantity_per_guest: number;
  is_auto_assign: boolean;
  is_returnable: boolean;
  hotelid?: number;
  // NOTE: Only ONE of these will be set per save — never both at once
  created_by_id?: number;
  updated_by_id?: number;
}

interface StockItemFormProps {
  selectedItem?: any;
  onSave: (values: StockItemFormData) => void;
}

const StockItemForm = forwardRef<any, StockItemFormProps>(({ selectedItem, onSave }, ref) => {
  const { user } = useAuthContext();
  const hotelId = user?.hotel_id;
  const userId = user?.id;

  const [taxList, setTaxList] = useState<any[]>([]);

  useEffect(() => {
    taxApi.list().then((res) => {
      const taxData = Array.isArray(res?.data) ? res.data : [];
      setTaxList(taxData);
    }).catch(console.error);
  }, []);

  const formatTaxLabel = (tax: any) => {
    const parts = [];
    if (tax.hotel_tax_value != null) parts.push(`${tax.hotel_tax_value}%`);
    if (tax.hotel_tax_name) parts.push(tax.hotel_tax_name);
    return parts.length > 0 ? parts.join(' - ') : 'N/A';
  };

  const taxOptions = taxList
    .filter((tax) => tax.hotel_taxid)
    .map((tax) => ({
      label: formatTaxLabel(tax),
      value: tax.hotel_tax_value?.toString() || '0',
    }));

  const categoryOptions = [
    { label: 'Complimentary (Water Bottle, Soap)', value: 'complimentary' },
    { label: 'Returnable (Towel, Blanket)', value: 'returnable' },
    { label: 'Chargeable (Snacks, Cold Drinks)', value: 'chargeable' },
  ];

  const unitOptions = [
    { label: 'Piece', value: 'piece' },
    { label: 'Bottle', value: 'bottle' },
    { label: 'Packet', value: 'packet' },
    { label: 'Set', value: 'set' },
    { label: 'Kg', value: 'kg' },
    { label: 'Liter', value: 'liter' },
  ];

  // ✅ Determine edit mode based on item_id — same as RoomForm/RoomMaster pattern
  const isEditing = !!selectedItem?.item_id;

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: isEditing
      ? {
          item_id: selectedItem.item_id,
          item_name: selectedItem.item_name || '',
          item_code: selectedItem.item_code || '',
          category: selectedItem.category || 'complimentary',
          sub_category: selectedItem.sub_category || '',
          unit: selectedItem.unit || 'piece',
          current_stock: selectedItem.current_stock || 0,
          minimum_stock: selectedItem.minimum_stock || 10,
          price: selectedItem.price || 0,
          gst_percent: selectedItem.gst_percent || 0,
          quantity_per_guest: selectedItem.quantity_per_guest || 1,
          is_auto_assign: selectedItem.is_auto_assign === 1,
          is_returnable: selectedItem.is_returnable === 1,
        }
      : {
          item_name: '',
          item_code: '',
          category: 'complimentary',
          sub_category: '',
          unit: 'piece',
          current_stock: 0,
          minimum_stock: 10,
          price: 0,
          gst_percent: 0,
          quantity_per_guest: 1,
          is_auto_assign: true,
          is_returnable: false,
        },
    validationSchema: Yup.object({
      item_name: Yup.string().required('Item name is required'),
      category: Yup.string().required('Category is required'),
      price: Yup.number().min(0, 'Price must be positive'),
      minimum_stock: Yup.number().min(0, 'Minimum stock must be positive'),
    }),
    onSubmit: (values) => {
      // ✅ FIXED: Mirror RoomMaster pattern exactly
      // - On CREATE: send created_by_id only (no updated_by_id)
      // - On UPDATE: send updated_by_id only (no created_by_id)
      const basePayload = {
        ...values,
        hotelid: hotelId,
      };

      if (isEditing) {
        onSave({
          ...basePayload,
          updated_by_id: userId,
          created_by_id: undefined,
        });
      } else {
        onSave({
          ...basePayload,
          created_by_id: userId,
          updated_by_id: undefined,
        });
      }
    },
  });

  const { handleSubmit, values, setFieldValue } = formik;

  useImperativeHandle(ref, () => ({
    saveData: handleSubmit,
  }));

  return (
    <FormikProvider value={formik}>
      <form onSubmit={handleSubmit}>
        <Row className="g-0">
          <Col md={6}>
            <div className="p-2">
              <Row className="align-items-center g-2 mb-2">
                <Col md={4}>Item Name *</Col>
                <Col md={8}>
                  <FormikTextInput name="item_name" placeholder="Enter item name" className="w-100" />
                </Col>
              </Row>

              <Row className="align-items-center g-2 mb-2">
                <Col md={4}>Item Code</Col>
                <Col md={8}>
                  <FormikTextInput name="item_code" placeholder="Enter item code" className="w-100" />
                </Col>
              </Row>

              <Row className="align-items-center g-2 mb-2">
                <Col md={4}>Category *</Col>
                <Col md={8}>
                  <FormikSelect name="category" options={categoryOptions} className="w-100" />
                </Col>
              </Row>

              <Row className="align-items-center g-2 mb-2">
                <Col md={4}>Sub Category</Col>
                <Col md={8}>
                  <FormikTextInput name="sub_category" placeholder="Enter sub category" className="w-100" />
                </Col>
              </Row>

              <Row className="align-items-center g-2 mb-2">
                <Col md={4}>Unit</Col>
                <Col md={8}>
                  <FormikSelect name="unit" options={unitOptions} className="w-100" />
                </Col>
              </Row>
            </div>
          </Col>

          <Col md={6}>
            <div className="p-2">
              <Row className="align-items-center g-2 mb-2">
                <Col md={4}>Current Stock</Col>
                <Col md={8}>
                  <FormikTextInput name="current_stock" type="number" placeholder="0" className="w-100" />
                </Col>
              </Row>

              <Row className="align-items-center g-2 mb-2">
                <Col md={4}>Minimum Stock</Col>
                <Col md={8}>
                  <FormikTextInput name="minimum_stock" type="number" placeholder="10" className="w-100" />
                </Col>
              </Row>

              <Row className="align-items-center g-2 mb-2">
                <Col md={4}>Price (₹)</Col>
                <Col md={8}>
                  <FormikTextInput name="price" type="number" step="0.01" placeholder="0.00" className="w-100" />
                </Col>
              </Row>

              <Row className="align-items-center g-2 mb-2">
                <Col md={4}>GST %</Col>
                <Col md={8}>
                  <FormikSelect name="gst_percent" options={taxOptions} className="w-100" placeholder="Select GST %" />
                </Col>
              </Row>
            </div>
          </Col>
        </Row>

        <hr className="my-2" />
        <h6 className="mb-2">Amenity Rules (For Check-in)</h6>

        <Row className="g-2 mb-2">
          <Col md={6}>
            <Form.Check
              type="checkbox"
              label="Auto-assign on check-in"
              checked={values.is_auto_assign}
              onChange={(e) => setFieldValue('is_auto_assign', e.target.checked)}
            />
          </Col>
          <Col md={6}>
            <Form.Check
              type="checkbox"
              label="Returnable item"
              checked={values.is_returnable}
              onChange={(e) => setFieldValue('is_returnable', e.target.checked)}
            />
          </Col>
        </Row>

        {values.is_auto_assign && (
          <Row className="g-2">
            <Col md={6}>
              <Form.Label className="fs-small fw-bold">Quantity Per Guest</Form.Label>
              <FormikTextInput name="quantity_per_guest" type="number" min="1" placeholder="1" className="w-100" />
            </Col>
          </Row>
        )}
      </form>
    </FormikProvider>
  );
});

StockItemForm.displayName = 'StockItemForm';
export default StockItemForm;