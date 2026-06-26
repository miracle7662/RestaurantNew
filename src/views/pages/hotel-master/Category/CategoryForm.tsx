import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { FormikProvider, useFormik } from 'formik';
import * as Yup from 'yup';
import { Button, Col, Form, Row, Table } from 'react-bootstrap';
import FormikTextInput from '@/components/Common/FormikTextInput';
import FormikSelect from '@/components/Common/FormikSelect';
import { taxApi, getDropdownOptions } from '@/common/hotel/index';
import DepartmentService from '@/common/hotel/departments';
import RoomCategoryService, { RoomCategoryPayload, ModeCharge } from '@/common/hotel/roomCategoryService';
import { useAuthContext } from '@/common/context/useAuthContext';

const yesNoOptions = [
  { label: 'Yes', value: 1 },
  { label: 'No', value: 0 },
];

interface Props {
  selectedItem?: RoomCategoryPayload | null;
  isEdit?: boolean;
  onSave: (values: RoomCategoryPayload) => void;
}

const defaultForm: RoomCategoryPayload = {
  category_no: '',
  category_name: '',
  department_id: undefined,
  print_name: '',
  display_seq: undefined,
  display_name: '',
  total_rooms: undefined,
  apply_date: '',
  max_limit: undefined,
  overbooking_no: undefined,
  status: 1,
  tariffs: [
    {
      id: `tariff-${Date.now()}`,
      no_of_pax: 1,
      room_tariff: 0,
      department_id: undefined,
      is_tax_applicable: 0,
      tax_type: '',
      discount_after: 0,
    },
  ],
  mode_charges: [],
};

const RoomCategoryForm = forwardRef<any, Props>(({ selectedItem, isEdit, onSave }, ref) => {
  const { user } = useAuthContext();
  const hotelId = user?.hotelid;

  const [taxList, setTaxList] = useState<any[]>([]);
  const [modeMaster, setModeMaster] = useState<any[]>([]);
  const [departmentList, setDepartmentList] = useState<any[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  const formik = useFormik<RoomCategoryPayload>({
    enableReinitialize: true,
    initialValues: selectedItem || defaultForm,
    validationSchema: Yup.object({
      category_no: Yup.string().required('Category No is required'),
      category_name: Yup.string().required('Category Name is required'),
    }),
    onSubmit: onSave,
  });

  useImperativeHandle(ref, () => ({
    saveData: formik.handleSubmit,
  }));

  // Format tax label for dropdown
  const formatTaxLabel = (tax: any) => {
    const parts = [];
    if (tax.hotel_tax_value != null) parts.push(`${tax.hotel_tax_value}%`);
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  };

  const taxDropdownOptions = taxList
    .filter((tax) => tax.hotel_taxid)
    .map((tax) => ({
      label: formatTaxLabel(tax),
      value: tax.hotel_taxid.toString(),
    }));

  // Fetch dependencies
  useEffect(() => {
    taxApi.list().then((res) => setTaxList(Array.isArray(res?.data) ? res.data : [])).catch(console.error);

    if (hotelId) {
      setLoadingDepartments(true);
      DepartmentService.list({ hotelid: hotelId })  // Changed from mst_hotelid to hotelid
        .then((res) => {
          if (res.success) setDepartmentList(Array.isArray(res.data) ? res.data : []);
        })
        .catch(console.error)
        .finally(() => setLoadingDepartments(false));
    }

    RoomCategoryService.listModes().then((res) => setModeMaster(Array.isArray(res?.data) ? res.data : [])).catch(console.error);
  }, [hotelId]);

  // Initialize mode_charges when modeMaster changes
  useEffect(() => {
    if (modeMaster.length > 0 && (!selectedItem || selectedItem.mode_charges.length === 0)) {
      const mergedModeCharges: ModeCharge[] = modeMaster.map((mode) => {
        const existing = selectedItem?.mode_charges?.find((mc) => mc.mode_id === mode.id);
        return existing || {
          mode_id: mode.id,
          mode_name: mode.mode_name,
          charges: 0,
          department_id: undefined,
          is_tax_applicable: 0,
          tax_type: '',
          discount_after: 0,
          is_discount_apply: 0,
        };
      });
      formik.setFieldValue('mode_charges', mergedModeCharges);
    }
  }, [modeMaster, selectedItem]);

  // Add new tariff row
  const addTariffRow = () => {
    formik.setFieldValue('tariffs', [
      ...formik.values.tariffs,
      {
        id: `tariff-${Date.now()}`,
        no_of_pax: 1,
        room_tariff: 0,
        department_id: undefined,
        is_tax_applicable: 0,
        tax_type: '',
        discount_after: 0,
      },
    ]);
  };

  // Remove tariff row
  const removeTariffRow = (index: number) => {
    const newTariffs = formik.values.tariffs.filter((_, i) => i !== index);
    formik.setFieldValue('tariffs', newTariffs);
  };

  return (
    <FormikProvider value={formik}>
      <form onSubmit={formik.handleSubmit} className="p-3">
        {/* Basic Info – two columns */}
        <Row className="g-2 mt-0">
          <Col md={6}>
            <Row className="align-items-center g-2 mb-1">
              <Col md={4}><Form.Label className="mb-0 small fw-bold">Category No</Form.Label></Col>
              <Col md={8}>
                <FormikTextInput name="category_no" className="mb-0 w-100" required inputStyle={{ minHeight: '28px', padding: '3px 6px', fontSize: '14px' }} />
              </Col>
            </Row>
            <Row className="align-items-center g-2 mb-1">
              <Col md={4}><Form.Label className="mb-0 small fw-bold">Category Name</Form.Label></Col>
              <Col md={8}>
                <FormikTextInput name="category_name" className="mb-0 w-100" required inputStyle={{ minHeight: '28px', padding: '3px 6px', fontSize: '14px' }} />
              </Col>
            </Row>
            <Row className="align-items-center g-2 mb-1">
              <Col md={4}><Form.Label className="mb-0 small">Department</Form.Label></Col>
              <Col md={8}>
                <FormikSelect
                  name="department_id"
                  options={getDropdownOptions(departmentList, 'department_name', 'department_id')}
                  isLoading={loadingDepartments}
                  className="mb-0 w-100"
                  inputStyle={{ minHeight: '28px', padding: '3px 6px', fontSize: '14px' }}
                />
              </Col>
            </Row>
            <Row className="align-items-center g-2 mb-1">
              <Col md={4}><Form.Label className="mb-0 small">Print Name</Form.Label></Col>
              <Col md={8}>
                <FormikTextInput name="print_name" className="mb-0 w-100" inputStyle={{ minHeight: '28px', padding: '3px 6px', fontSize: '14px' }} />
              </Col>
            </Row>
            <Row className="align-items-center g-2 mb-1">
              <Col md={4}><Form.Label className="mb-0 small">Display Seq</Form.Label></Col>
              <Col md={8}>
                <FormikTextInput name="display_seq" type="number" className="mb-0 w-100" inputStyle={{ minHeight: '28px', padding: '3px 6px', fontSize: '14px' }} />
              </Col>
            </Row>
           <Row className="align-items-center g-2 mb-1">
  <Col md={4}>
    <Form.Label className="mb-0 small">Tax Type</Form.Label>
  </Col>
  <Col md={8}>
    <FormikSelect
      name="tax_type"
      className="mb-0 w-100"
      options={[
        { value: "Inclusive", label: "Tax Inclusive" },
        { value: "Exclusive", label: "Tax Exclusive" },
      ]}
    />
  </Col>
</Row>

          </Col>

          <Col md={6}>
            <Row className="align-items-center g-2 mb-1">
              <Col md={4}><Form.Label className="mb-0 small">Display Name</Form.Label></Col>
              <Col md={8}>
                <FormikTextInput name="display_name" className="mb-0 w-100" inputStyle={{ minHeight: '28px', padding: '3px 6px', fontSize: '14px' }} />
              </Col>
            </Row>
            <Row className="align-items-center g-2 mb-1">
              <Col md={4}><Form.Label className="mb-0 small">Total Rooms</Form.Label></Col>
              <Col md={8}>
                <FormikTextInput name="total_rooms" type="number" className="mb-0 w-100" inputStyle={{ minHeight: '28px', padding: '3px 6px', fontSize: '14px' }} />
              </Col>
            </Row>
            <Row className="align-items-center g-2 mb-1">
              <Col md={4}><Form.Label className="mb-0 small">Applicable From</Form.Label></Col>
              <Col md={8}>
                <FormikTextInput name="apply_date" type="date" className="mb-0 w-100" inputStyle={{ minHeight: '28px', padding: '3px 6px', fontSize: '14px' }} />
              </Col>
            </Row>
            <Row className="align-items-center g-2 mb-1">
              <Col md={4}><Form.Label className="mb-0 small">Max Limit</Form.Label></Col>
              <Col md={8}>
                <FormikTextInput name="max_limit" type="number" className="mb-0 w-100" inputStyle={{ minHeight: '28px', padding: '3px 6px', fontSize: '14px' }} />
              </Col>
            </Row>
            <Row className="align-items-center g-2 mb-1">
              <Col md={4}><Form.Label className="mb-0 small">Overbooking No</Form.Label></Col>
              <Col md={8}>
                <FormikTextInput name="overbooking_no" type="number" className="mb-0 w-100" inputStyle={{ minHeight: '28px', padding: '3px 6px', fontSize: '14px' }} />
              </Col>
            </Row>
            {/* Status field - only visible during edit mode */}
            {isEdit && (
              <Row className="align-items-center g-2 mb-1">
                <Col md={4}><Form.Label className="mb-0 small fw-bold">Status</Form.Label></Col>
                <Col md={8}>
                  <FormikSelect
                    name="status"
                    options={[
                      { label: 'Active', value: 1 },
                      { label: 'Inactive', value: 0 },
                    ]}
                    className="mb-0 w-100"
                    inputStyle={{ minHeight: '28px', padding: '3px 6px', fontSize: '14px' }}
                  />
                </Col>
              </Row>
            )}
          </Col>
        </Row>

        {/* Pax & Tariff Table */}
        <div className="d-flex justify-content-between align-items-center mt-4 mb-2">
          <h5 className="mb-0">Pax & Tariff</h5>
          <Button type="button" size="sm" variant="primary" onClick={addTariffRow}>
            + Add Pax Slab
          </Button>
        </div>

        <Table bordered responsive size="sm" className="mb-4 align-middle">
          <thead style={{ backgroundColor: '#e6f0ff' }}>
            <tr>
              <th className="text-center" style={{ width: '6%' }}>#</th>
              <th style={{ width: '12%' }}>No of Pax</th>
              <th style={{ width: '12%' }}>Tariff</th>
              <th style={{ width: '15%' }}>Department</th>
              <th className="text-center" style={{ width: '10%' }}>Apply Tax</th>
              <th style={{ width: '15%' }}>Tax %</th>
              <th className="text-center" style={{ width: '10%' }}>After Disc</th>
              <th className="text-center" style={{ width: '10%' }}></th>
            </tr>
          </thead>
          <tbody>
            {formik.values.tariffs.map((row, i) => (
              <tr key={row.id}>
                <td style={{ padding: '4px' }}>{i + 1}</td>
                <td style={{ padding: '4px' }}>
                  <FormikTextInput
                    name={`tariffs[${i}].no_of_pax`}
                    type="number"
                    className="form-control-sm mb-0 w-100"
                    inputStyle={{ padding: '4px 8px', fontSize: '14px' }}
                  />
                </td>
                <td style={{ padding: '4px' }}>
                  <FormikTextInput
                    name={`tariffs[${i}].room_tariff`}
                    type="number"
                    className="form-control-sm mb-0 w-100"
                    inputStyle={{ padding: '4px 8px', fontSize: '14px' }}
                  />
                </td>
                <td style={{ padding: '4px' }}>
                  <FormikSelect
                    name={`tariffs[${i}].department_id`}
                    options={getDropdownOptions(departmentList, 'department_name', 'department_id')}
                    className="mb-0 w-100"
                    inputStyle={{ padding: '4px 8px', fontSize: '14px' }}
                  />
                </td>
                <td style={{ padding: '4px' }}>
                  <FormikSelect
                    name={`tariffs[${i}].is_tax_applicable`}
                    options={yesNoOptions}
                    className="mb-0 w-100"
                    inputStyle={{ padding: '4px 8px', fontSize: '14px' }}
                  />
                </td>
                <td style={{ padding: '4px' }}>
                  <FormikSelect
                    name={`tariffs[${i}].tax_type`}
                    options={taxDropdownOptions}
                    className="mb-0 w-100"
                    inputStyle={{ padding: '4px 8px', fontSize: '14px' }}
                  />
                </td>
                <td style={{ padding: '4px' }}>
                  <FormikSelect
                    name={`tariffs[${i}].discount_after`}
                    options={yesNoOptions}
                    className="mb-0 w-100"
                    inputStyle={{ padding: '4px 8px', fontSize: '14px' }}
                  />
                </td>
                <td className="text-center">
                  <Button variant="danger" size="sm" onClick={() => removeTariffRow(i)}>Delete</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>

        {/* Mode Charges Table */}
        <div className="mt-4">
          <h6 className="fw-semibold mb-2">Mode Charges</h6>
          <Table bordered responsive size="sm" className="align-middle">
            <thead className="table-primary">
              <tr>
                <th style={{ width: '15%' }}>Mode</th>
                <th style={{ width: '15%' }}>Charges</th>
                <th style={{ width: '15%' }}>Department</th>
                <th className="text-center" style={{ width: '12%' }}>Apply Tax</th>
                <th style={{ width: '15%' }}>Tax %</th>
                <th className="text-center" style={{ width: '15%' }}>After Disc</th>
                <th className="text-center" style={{ width: '10%' }}>Apply</th>
              </tr>
            </thead>
            <tbody>
              {formik.values.mode_charges.map((modeCharge, idx) => (
                <tr key={modeCharge.mode_id}>
                  <td className="fw-semibold bg-primary bg-opacity-25">{modeCharge.mode_name}</td>
                  <td style={{ padding: '4px' }}>
                    <FormikTextInput
                      name={`mode_charges[${idx}].charges`}
                      type="number"
                      className="form-control-sm mb-0 w-100"
                      inputStyle={{ height: '28px', fontSize: '12px', padding: '2px 6px' }}
                    />
                  </td>
                  <td style={{ padding: '4px' }}>
                    <FormikSelect
                      name={`mode_charges[${idx}].department_id`}
                      options={getDropdownOptions(departmentList, 'department_name', 'department_id')}
                      className="mb-0 w-100"
                      inputStyle={{ padding: '4px 8px', fontSize: '12px' }}
                    />
                  </td>
                  <td style={{ padding: '4px' }}>
                    <FormikSelect
                      name={`mode_charges[${idx}].is_tax_applicable`}
                      options={yesNoOptions}
                      className="mb-0 w-100"
                      inputStyle={{ padding: '4px 8px', fontSize: '12px' }}
                    />
                  </td>
                  <td style={{ padding: '4px' }}>
                    <FormikSelect
                      name={`mode_charges[${idx}].tax_type`}
                      options={taxDropdownOptions}
                      className="mb-0 w-100"
                      inputStyle={{ padding: '4px 8px', fontSize: '12px' }}
                    />
                  </td>
                  <td style={{ padding: '4px' }}>
                    <FormikSelect
                      name={`mode_charges[${idx}].discount_after`}
                      options={yesNoOptions}
                      className="mb-0 w-100"
                      inputStyle={{ padding: '4px 8px', fontSize: '12px' }}
                    />
                  </td>
                  <td style={{ padding: '4px' }}>
                    <FormikSelect
                      name={`mode_charges[${idx}].is_discount_apply`}
                      options={yesNoOptions}
                      className="mb-0 w-100"
                      inputStyle={{ padding: '4px 8px', fontSize: '12px' }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </form>
    </FormikProvider>
  );
});

export default RoomCategoryForm;