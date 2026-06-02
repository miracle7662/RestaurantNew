// pages/BlockMaster/index.tsx
import { useEffect, useMemo, useState, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import Swal from 'sweetalert2'
import TitleHelmet from '@/components/Common/TitleHelmet'
import blockApi from '@/common/hotel/blocks'
import { Badge, Button, Card, Form, Table } from 'react-bootstrap'
import FormModal from '@/components/Common/models/FormModal'
import BlockForm from './BlockForm'
import { useAuthContext } from '@/common/context/useAuthContext'

type Block = {
    block_id: number
    block_name: string
    display_name: string
    hotelid: number  // Changed from mst_hotelid to hotelid
    status: number
    created_by_id: number | null
    created_date: string
    updated_by_id: number | null
    updated_date: string
}

type BlockFormData = {
    block_id?: number
    block_name: string
    display_name: string
    status: number
}

const defaultForm: BlockFormData = {
    block_name: '',
    display_name: '',
    status: 1,
}

const BlockMaster = () => {
    const { user } = useAuthContext()
    const hotelId = user?.hotelid

    const [blocks, setBlocks] = useState<Block[]>([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [deletingId, setDeletingId] = useState<number | null>(null)
    const [showModal, setShowModal] = useState(false)
    const [editingBlock, setEditingBlock] = useState<Block | null>(null)
    const [form, setForm] = useState<BlockFormData>(defaultForm)
    const [pageSize, setPageSize] = useState(10)
    const [currentPage, setCurrentPage] = useState(1)
    const [sortField, setSortField] = useState<string | null>(null)
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

    const loadBlocks = useCallback(async () => {
        if (!hotelId) {
            toast.error('Hotel ID not found. Please login again.')
            return
        }
        setLoading(true)
        try {
            // Changed parameter from mst_hotelid to hotelid
            const response = await blockApi.list({ hotelid: hotelId })
            if (response.success) {
                const blocksData = Array.isArray(response.data) ? response.data : []
                const normalizedBlocks = blocksData.map((block: any) => ({
                    ...block,
                    status: Number(block.status)
                }))
                setBlocks(normalizedBlocks)
            } else {
                toast.error(response.message || 'Failed to load blocks')
                setBlocks([])
            }
        } catch (error: any) {
            console.error('Failed to load blocks:', error)
            toast.error(error.message || 'Failed to load blocks')
            setBlocks([])
        } finally {
            setLoading(false)
        }
    }, [hotelId])

    useEffect(() => {
        if (hotelId) {
            loadBlocks()
        }
    }, [hotelId, loadBlocks])

    const filteredBlocks = useMemo(() => {
        let result = blocks

        const query = search.trim().toLowerCase()
        if (query) {
            result = result.filter((block) =>
                [block.block_name, block.display_name].some((value) =>
                    value.toLowerCase().includes(query),
                ),
            )
        }

        if (sortField) {
            result = [...result].sort((a, b) => {
                const aValue = a[sortField as keyof Block] ?? ''
                const bValue = b[sortField as keyof Block] ?? ''
                if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
                if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
                return 0
            })
        }

        return result
    }, [blocks, search, sortField, sortDirection])

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortDirection('asc')
        }
    }

    const totalPages = useMemo(
        () => Math.max(1, Math.ceil(filteredBlocks.length / pageSize)),
        [filteredBlocks.length, pageSize],
    )

    const paginatedBlocks = useMemo(() => {
        const start = (currentPage - 1) * pageSize
        return filteredBlocks.slice(start, start + pageSize)
    }, [filteredBlocks, currentPage, pageSize])

    useEffect(() => {
        setCurrentPage(1)
    }, [search, pageSize])

    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(totalPages)
    }, [currentPage, totalPages])

    const handleOpenAddModal = () => {
        setEditingBlock(null)
        setForm(defaultForm)
        setShowModal(true)
    }

    const handleOpenEditModal = (block: Block) => {
        setEditingBlock(block)
        setForm({
            block_id: block.block_id,
            block_name: block.block_name,
            display_name: block.display_name,
            status: block.status,
        })
        setShowModal(true)
    }

    const handleCloseModal = () => {
        if (saving) return
        setShowModal(false)
        setEditingBlock(null)
    }

    const handleSubmit = async (payload: BlockFormData) => {
        if (!payload.block_name || !payload.display_name) {
            toast.error('Block name and display name are required')
            return
        }

        if (!hotelId) {
            toast.error('Hotel ID not found. Please login again.')
            return
        }

        setSaving(true)

        try {
            const userId = user?.id
            const status = Number(payload.status)

            // Changed mst_hotelid to hotelid
            const apiPayload = {
                block_name: payload.block_name,
                display_name: payload.display_name,
                status: status,
                hotelid: hotelId,  // Changed from mst_hotelid to hotelid
                created_by_id: userId,
                updated_by_id: userId,
            }

            if (editingBlock) {
                const updatePayload = { ...apiPayload }
                delete updatePayload.created_by_id

                const response = await blockApi.update(editingBlock.block_id, updatePayload)
                if (response.success && response.data) {
                    const updatedBlock = {
                        ...response.data,
                        status: Number(response.data.status),
                    }

                    setBlocks((prev) => {
                        const newBlocks = prev.map((item) =>
                            item.block_id === updatedBlock.block_id ? updatedBlock : item
                        )
                        return [...newBlocks]
                    })

                    toast.success('Block updated successfully')
                } else {
                    toast.error(response.message || 'Update failed')
                }
            } else {
                const response = await blockApi.create(apiPayload)
                if (response.success && response.data) {
                    const newBlock = {
                        ...response.data,
                        status: Number(response.data.status),
                    }

                    setBlocks((prev) => [newBlock, ...prev])
                    toast.success('Block added successfully')
                } else {
                    toast.error(response.message || 'Create failed')
                }
            }

            setShowModal(false)
            setEditingBlock(null)
            setForm(defaultForm)
        } catch (error) {
            console.error('Failed to save block:', error)
            toast.error('Failed to save block')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (block: Block) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: `You will not be able to recover block "${block.block_name}"!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3E97FF',
            confirmButtonText: 'Yes, delete it!',
        })

        if (result.isConfirmed) {
            setDeletingId(block.block_id)
            try {
                await blockApi.remove(block.block_id)
                setBlocks((prev) => prev.filter((item) => item.block_id !== block.block_id))
                toast.success('Block deleted successfully')
            } catch (error) {
                console.error('Failed to delete block:', error)
                toast.error(typeof error === 'string' ? error : 'Failed to delete block')
            } finally {
                setDeletingId(null)
            }
        }
    }

    const getStatusText = (status: number) => {
        return status === 1 ? 'Active' : 'Inactive'
    }

    const getStatusBadgeColor = (status: number) => {
        return status === 1 ? 'success' : 'secondary'
    }

    return (
        <>
            <TitleHelmet title="Block Master" />

            <Card className="mb-3">
                <Card.Body className="d-flex justify-content-between align-items-center">
                    <div>
                        <h4 className="mb-1">Block Master</h4>
                        <p className="text-muted mb-0">Manage blocks and their information.</p>
                    </div>
                    <Button variant="danger" onClick={handleOpenAddModal}>
                        <span className="me-1">+</span> Add Block
                    </Button>
                </Card.Body>
            </Card>

            <Card>
                <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <Form.Control
                            type="text"
                            placeholder="Search blocks..."
                            style={{ maxWidth: 280 }}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <Table hover responsive className="mb-0">
                        <thead className="table-light">
                            <tr>
                                <th style={{ width: '60px' }}>#</th>
                                <th
                                    onClick={() => handleSort('block_name')}
                                    style={{ cursor: 'pointer' }}
                                    className="sortable-header">
                                    Block Name
                                    {sortField === 'block_name' && (
                                        <span className="ms-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                    )}
                                </th>
                                <th
                                    onClick={() => handleSort('display_name')}
                                    style={{ cursor: 'pointer' }}
                                    className="sortable-header">
                                    Display Name
                                    {sortField === 'display_name' && (
                                        <span className="ms-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                    )}
                                </th>
                                <th style={{ width: '120px' }}>Status</th>
                                <th style={{ width: '120px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="text-center text-muted py-4">
                                        Loading blocks...
                                    </td>
                                </tr>
                            ) : filteredBlocks.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center text-muted py-4">
                                        No blocks found.
                                    </td>
                                </tr>
                            ) : (
                                paginatedBlocks.map((block, index) => (
                                    <tr key={block.block_id}>
                                        <td>{(currentPage - 1) * pageSize + index + 1}</td>
                                        <td className="fw-semibold">{block.block_name}</td>
                                        <td>{block.display_name}</td>
                                        <td>
                                            <Badge bg={getStatusBadgeColor(block.status)}>
                                                {getStatusText(block.status)}
                                            </Badge>
                                        </td>
                                        <td>
                                            <div className="d-flex gap-2">
                                                <Button
                                                    variant="outline-primary"
                                                    size="sm"
                                                    onClick={() => handleOpenEditModal(block)}>
                                                    <i className="fi fi-rr-edit" />
                                                </Button>
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    onClick={() => handleDelete(block)}
                                                    disabled={deletingId === block.block_id}>
                                                    <i className="fi fi-rr-trash" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </Table>

                    {filteredBlocks.length > 0 && (
                        <div className="d-flex justify-content-between align-items-center mt-3">
                            <Form.Select
                                style={{ maxWidth: 80 }}
                                value={pageSize}
                                onChange={(e) => setPageSize(Number(e.target.value))}>
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </Form.Select>
                            <div className="d-flex align-items-center gap-2">
                                <Button
                                    variant="outline-light"
                                    size="sm"
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}>
                                    {'<'}
                                </Button>
                                <Button variant="danger" size="sm">
                                    {currentPage}
                                </Button>
                                <Button
                                    variant="outline-light"
                                    size="sm"
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}>
                                    {'>'}
                                </Button>
                            </div>
                        </div>
                    )}
                </Card.Body>
            </Card>

            <FormModal
                show={showModal}
                onHide={handleCloseModal}
                title={editingBlock ? 'Edit Block' : 'Add Block'}
                onSave={handleSubmit}
                saving={saving}
                submitLabel={editingBlock ? 'Update' : 'Save'}
                Component={BlockForm}
                selectedItem={form}
            />
        </>
    )
}

export default BlockMaster