// components/BlockForm.tsx
import { forwardRef, useImperativeHandle } from 'react'
import { Row } from 'react-bootstrap'
import { FormikProvider, useFormik } from 'formik'
import * as Yup from 'yup'
import FormikTextInput from '@/components/Common/FormikTextInput'
import FormikSelect from '@/components/Common/FormikSelect'
import { useAuthContext } from '@/common/context/useAuthContext'

type BlockFormData = {
    block_id?: number
    block_name: string
    display_name: string
    status: number
    created_by_id?: number
    updated_by_id?: number
    user_id?: number
}

const defaultForm: BlockFormData = {
    block_name: '',
    display_name: '',
    status: 1,
}

interface BlockFormProps {
    selectedItem?: BlockFormData
    onSave: (values: BlockFormData) => void
}

const BlockForm = forwardRef<any, BlockFormProps>(({ selectedItem, onSave }, ref) => {
    const { user } = useAuthContext()

    const formik = useFormik({
        enableReinitialize: true,
        initialValues: selectedItem
            ? {
                block_id: selectedItem.block_id,
                block_name: selectedItem.block_name,
                display_name: selectedItem.display_name,
                status: selectedItem.status,
                user_id: user?.id,
            }
            : { ...defaultForm, user_id: user?.id },
        validationSchema: Yup.object({
            block_name: Yup.string().required('Block name is required'),
            display_name: Yup.string().required('Display name is required'),
            status: Yup.number().required('Status is required'),
        }),
        onSubmit: (values) => {
            const { user_id, ...payload } = values
            if (selectedItem?.block_id) {
                // Update mode - set updated_by_id
                if (user?.id) {
                    payload.updated_by_id = user.id
                }
            } else {
                // Create mode - set created_by_id
                if (user?.id) {
                    payload.created_by_id = user.id
                }
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
                        label="Block Name"
                        name="block_name"
                        placeholder="Enter block name"
                        md={6}
                    />

                    <FormikTextInput
                        label="Display Name"
                        name="display_name"
                        placeholder="Enter display name"
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
    )
})

export default BlockForm