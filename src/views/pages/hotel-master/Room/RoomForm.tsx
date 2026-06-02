// components/RoomForm.tsx
import { forwardRef, useImperativeHandle, useEffect, useState } from 'react'
import { Row, Col } from 'react-bootstrap'
import { FormikProvider, useFormik } from 'formik'
import * as Yup from 'yup'
import FormikTextInput from '@/components/Common/FormikTextInput'
import FormikSelect from '@/components/Common/FormikSelect'
import RoomCategoryService from '@/common/hotel/roomCategoryService'
import BlockService from '@/common/hotel/blocks'
import FloorService from '@/common/hotel/floors'
import DepartmentService from '@/common/hotel/departments'
import { useAuthContext } from '@/common/context/useAuthContext'

type RoomFormData = {
    room_id?: number
    room_no: string
    room_name: string
    display_name: string
    room_category_id: string
    room_ext_no: string
    room_status: string
    department_id?: string
    block_id?: string
    floor_id?: string
    hotelid?: number
    created_by_id?: number
    updated_by_id?: number
}

interface RoomFormProps {
    selectedItem?: RoomFormData
    onSave: (values: RoomFormData) => void
}

const RoomForm = forwardRef<any, RoomFormProps>(({ selectedItem, onSave }, ref) => {
    const { user } = useAuthContext()
    const hotelId = user?.hotel_id

    // Dropdown states
    const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([])
    const [blocks, setBlocks] = useState<Array<{ id: number; name: string }>>([])
    const [floors, setFloors] = useState<Array<{ id: number; name: string }>>([])
    const [departments, setDepartments] = useState<Array<{ id: number; name: string }>>([])
    const [loadingCategories, setLoadingCategories] = useState(false)
    const [loadingBlocks, setLoadingBlocks] = useState(false)
    const [loadingFloors, setLoadingFloors] = useState(false)
    const [loadingDepartments, setLoadingDepartments] = useState(false)

    // Fetch all dropdown data on mount
    useEffect(() => {
        if (!hotelId) return

        // Categories
        setLoadingCategories(true)
        RoomCategoryService.list({ hotelid: hotelId })
            .then((res) => {
                const data = Array.isArray(res.data) ? res.data : []
                setCategories(
                    data.map((cat: any) => ({
                        id: cat.room_category_id || cat.id,
                        name: cat.category_name || cat.name,
                    })),
                )
            })
            .catch(console.error)
            .finally(() => setLoadingCategories(false))

        // Blocks
        setLoadingBlocks(true)
        BlockService.list({ hotelid: hotelId })
            .then((res) => {
                const data = Array.isArray(res.data) ? res.data : []
                setBlocks(
                    data.map((block: any) => ({
                        id: block.block_id || block.id,
                        name: block.block_name || block.name,
                    })),
                )
            })
            .catch(console.error)
            .finally(() => setLoadingBlocks(false))

        // Floors
        setLoadingFloors(true)
        FloorService.list({ hotelid: hotelId })
            .then((res) => {
                const data = Array.isArray(res.data) ? res.data : []
                setFloors(
                    data.map((floor: any) => ({
                        id: floor.floor_id || floor.id,
                        name: floor.floor_name || floor.name,
                    })),
                )
            })
            .catch(console.error)
            .finally(() => setLoadingFloors(false))

        // Departments
        setLoadingDepartments(true)
        DepartmentService.list({ mst_hotelid: hotelId })
            .then((res) => {
                if (res.success) {
                    const data = Array.isArray(res.data) ? res.data : []
                    setDepartments(
                        data.map((dept: any) => ({
                            id: dept.department_id,
                            name: dept.department_name,
                        })),
                    )
                }
            })
            .catch(console.error)
            .finally(() => setLoadingDepartments(false))
    }, [hotelId])

    const formik = useFormik({
        enableReinitialize: true,
        initialValues: selectedItem
            ? {
                room_id: selectedItem.room_id,
                room_no: selectedItem.room_no,
                room_name: selectedItem.room_name,
                display_name: selectedItem.display_name || '',
                room_category_id: selectedItem.room_category_id?.toString() || '',
                room_ext_no: selectedItem.room_ext_no || '',
                room_status: selectedItem.room_status || 'available',
                department_id: selectedItem.department_id?.toString() || '',
                block_id: selectedItem.block_id?.toString() || '',
                floor_id: selectedItem.floor_id?.toString() || '',
                user_id: user?.id,
            }
            : {
                room_no: '',
                room_name: '',
                display_name: '',
                room_category_id: '',
                room_ext_no: '',
                room_status: 'available',
                department_id: '',
                block_id: '',
                floor_id: '',
                user_id: user?.id,
            },
        validationSchema: Yup.object({
            room_no: Yup.string().required('Room number is required'),
            room_name: Yup.string().required('Room name is required'),
            room_category_id: Yup.string().required('Category is required'),
        }),
        onSubmit: (values) => {
            const { user_id, ...payload } = values
            const roomPayload: RoomFormData = payload as RoomFormData
            if (selectedItem?.room_id) {
                if (user?.id) roomPayload.updated_by_id = user.id
            } else {
                if (user?.id) roomPayload.created_by_id = user.id
            }
            onSave(roomPayload)
        },
    })

    const { handleSubmit } = formik

    useImperativeHandle(ref, () => ({
        saveData: handleSubmit,
    }))

    // Options for selects
    const categoryOptions = categories.map((c) => ({ label: c.name, value: c.id.toString() }))
    const blockOptions = blocks.map((b) => ({ label: b.name, value: b.id.toString() }))
    const floorOptions = floors.map((f) => ({ label: f.name, value: f.id.toString() }))
    const departmentOptions = departments.map((d) => ({ label: d.name, value: d.id.toString() }))
    const statusOptions = [
        { label: 'Available', value: 'available' },
        { label: 'Occupied', value: 'occupied' },
        { label: 'Maintenance', value: 'maintenance' },
        { label: 'Cleaning', value: 'cleaning' },
        { label: 'Out of Service', value: 'out_of_service' },
        { label: 'Reservation', value: 'reserved' },
    ]

    return (
        <FormikProvider value={formik}>
            <form onSubmit={handleSubmit}>
                <Row className="g-0">
                    {/* Left Column */}
                    <Col md={6}>
                        <div className="p-1">
                            <Row className="align-items-center g-2 mb-1">
                                <Col md={4}>Room Number *</Col>
                                <Col md={8}>
                                    <FormikTextInput
                                        name="room_no"
                                        placeholder="Enter room number"
                                        className="w-100"
                                    />
                                </Col>
                            </Row>

                            <Row className="align-items-center g-2 mb-1">
                                <Col md={4}>Room Name *</Col>
                                <Col md={8}>
                                    <FormikTextInput
                                        name="room_name"
                                        placeholder="Enter room name"
                                        className="w-100"
                                    />
                                </Col>
                            </Row>

                            <Row className="align-items-center g-2 mb-1">
                                <Col md={4}>Display Name</Col>
                                <Col md={8}>
                                    <FormikTextInput
                                        name="display_name"
                                        placeholder="Enter display name"
                                        className="w-100"
                                    />
                                </Col>
                            </Row>

                            <Row className="align-items-center g-2 mb-1">
                                <Col md={4}>Extension No.</Col>
                                <Col md={8}>
                                    <FormikTextInput
                                        name="room_ext_no"
                                        placeholder="Enter extension number"
                                        className="w-100"
                                    />
                                </Col>
                            </Row>
                        </div>
                    </Col>

                    {/* Right Column */}
                    <Col md={6}>
                        <div className="p-1">
                            <Row className="align-items-center g-2 mb-1">
                                <Col md={4}>Category *</Col>
                                <Col md={8}>
                                    <FormikSelect
                                        name="room_category_id"
                                        options={categoryOptions}
                                        isLoading={loadingCategories}
                                        className="w-100"
                                    />
                                </Col>
                            </Row>

                            <Row className="align-items-center g-2 mb-1">
                                <Col md={4}>Department</Col>
                                <Col md={8}>
                                    <FormikSelect
                                        name="department_id"
                                        options={departmentOptions}
                                        isLoading={loadingDepartments}
                                        className="w-100"
                                    />
                                </Col>
                            </Row>

                            <Row className="align-items-center g-2 mb-1">
                                <Col md={4}>Block</Col>
                                <Col md={8}>
                                    <FormikSelect
                                        name="block_id"
                                        options={blockOptions}
                                        isLoading={loadingBlocks}
                                        className="w-100"
                                    />
                                </Col>
                            </Row>

                            <Row className="align-items-center g-2 mb-1">
                                <Col md={4}>Floor</Col>
                                <Col md={8}>
                                    <FormikSelect
                                        name="floor_id"
                                        options={floorOptions}
                                        isLoading={loadingFloors}
                                        className="w-100"
                                    />
                                </Col>
                            </Row>

                            <Row className="align-items-center g-2 mb-1">
                                <Col md={4}>Status</Col>
                                <Col md={8}>
                                    <FormikSelect name="room_status" options={statusOptions} className="w-100" />
                                </Col>
                            </Row>
                        </div>
                    </Col>
                </Row>
            </form>
        </FormikProvider>
    )
})

RoomForm.displayName = 'RoomForm'
export default RoomForm