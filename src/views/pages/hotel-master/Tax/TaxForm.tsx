import { forwardRef, useImperativeHandle } from 'react'
import { Row } from 'react-bootstrap'
import { FormikProvider, useFormik } from 'formik'
import * as Yup from 'yup'
import FormikTextInput from '@/components/Common/FormikTextInput'
import FormikSelect from '@/components/Common/FormikSelect'

type Tax = {
  hotel_taxid: number
  hotel_tax_value: number | null
  hotel_cgst: number | null
  hotel_sgst: number | null
  hotel_igst: number | null
  hotel_cess: number | null
  status: number
}

type TaxFormData = {
  hotel_tax_value: string
  hotel_cgst: string
  hotel_sgst: string
  hotel_igst: string
  hotel_cess: string
  status: number
}

type TaxPayload = {
  hotel_tax_value: number | null
  hotel_cgst: number | null
  hotel_sgst: number | null
  hotel_igst: number | null
  hotel_cess: number | null
  status: number
}

const defaultForm: TaxFormData = {
  hotel_tax_value: '',
  hotel_cgst: '',
  hotel_sgst: '',
  hotel_igst: '',
  hotel_cess: '',
  status: 1,
}

interface TaxFormProps {
  selectedItem?: Tax
  onSave: (values: TaxPayload) => void
  onCancel?: () => void
}

const TaxForm = forwardRef<any, TaxFormProps>(({ selectedItem, onSave }, ref) => {
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: selectedItem
      ? {
          hotel_tax_value: selectedItem.hotel_tax_value === null ? '' : String(selectedItem.hotel_tax_value),
          hotel_cgst: selectedItem.hotel_cgst === null ? '' : String(selectedItem.hotel_cgst),
          hotel_sgst: selectedItem.hotel_sgst === null ? '' : String(selectedItem.hotel_sgst),
          hotel_igst: selectedItem.hotel_igst === null ? '' : String(selectedItem.hotel_igst),
          hotel_cess: selectedItem.hotel_cess === null ? '' : String(selectedItem.hotel_cess),
          status: selectedItem.status,
        }
      : defaultForm,
    validationSchema: Yup.object({
      hotel_tax_value: Yup.string(),
      hotel_cgst: Yup.string(),
      hotel_sgst: Yup.string(),
      hotel_igst: Yup.string(),
      hotel_cess: Yup.string(),
      status: Yup.number().oneOf([0, 1], 'Invalid status').required(),
    }),
    onSubmit: (values) => {
      const parseNumber = (value: any) => {
        if (value == null) return null
        const str = String(value).trim()
        if (!str) return null
        const num = Number(str)
        return Number.isNaN(num) ? null : num
      }

      const payload = {
        ...values,
        hotel_tax_value: parseNumber(values.hotel_tax_value),
        hotel_cgst: parseNumber(values.hotel_cgst),
        hotel_sgst: parseNumber(values.hotel_sgst),
        hotel_igst: parseNumber(values.hotel_igst),
        hotel_cess: parseNumber(values.hotel_cess),
      }
      onSave(payload)
    },
  })
  const { handleSubmit } = formik

  useImperativeHandle(ref, () => ({
    saveData: handleSubmit,
  }))

  return (
    <FormikProvider value={formik}>
      <form onSubmit={handleSubmit}>
        <Row className="g-3">
          <FormikTextInput
            label="Tax Value"
            name="hotel_tax_value"
            placeholder="Enter tax value"
            type="number"
            step="0.01"
            md={6}
          />

          <FormikTextInput
            label="CGST"
            name="hotel_cgst"
            placeholder="Enter CGST"
            type="number"
            step="0.01"
            md={6}
          />

          <FormikTextInput
            label="SGST"
            name="hotel_sgst"
            placeholder="Enter SGST"
            type="number"
            step="0.01"
            md={6}
          />

          <FormikTextInput
            label="IGST"
            name="hotel_igst"
            placeholder="Enter IGST"
            type="number"
            step="0.01"
            md={6}
          />

          <FormikTextInput
            label="CESS"
            name="hotel_cess"
            placeholder="Enter CESS"
            type="number"
            step="0.01"
            md={6}
          />

          <FormikSelect
            label="Status"
            name="status"
            options={[
              { label: 'Active', value: 1 },
              { label: 'Inactive', value: 0 },
            ]}
            md={3}
          />
        </Row>
      </form>
    </FormikProvider>
  )
})

export default TaxForm