import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'
import Swal from 'sweetalert2'
import TitleHelmet from '@/components/Common/TitleHelmet'
import hotelTypeApi from '@/common/hotel/hotelTypes'
import { Badge, Button, Card, Form, Table } from 'react-bootstrap'
import FormModal from '@/components/Common/models/FormModal'
import HotelTypeForm from './HotelTypeForm'

type HotelType = {
  hoteltypeid: number
  hotel_type: string
  status: number
}

type HotelTypeFormData = {
  hotel_type: string
  status: number
}

const defaultForm: HotelTypeFormData = {
  hotel_type: '',
  status: 1,
}

const HotelTypeMaster = () => {
  const [hotelTypes, setHotelTypes] = useState<HotelType[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<HotelType | null>(null)
  const [form, setForm] = useState<HotelTypeFormData>(defaultForm)
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const loadHotelTypes = async () => {
    setLoading(true)
    try {
      const response = await hotelTypeApi.list()

      if (response.success) {
        const normalized = Array.isArray(response.data)
          ? response.data.map((item: HotelType) => ({
              ...item,
              status: Number(item.status),
            }))
          : []
        setHotelTypes(normalized)
      } else {
        toast.error(response.message || 'Failed to load hotel types')
        setHotelTypes([])
      }
    } catch (error: any) {
      console.error('Failed to load hotel types:', error)
      toast.error(error.message || 'Failed to load hotel types')
      setHotelTypes([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHotelTypes()
  }, [])

  const filteredItems = useMemo(() => {
    let result = hotelTypes

    const query = search.trim().toLowerCase()
    if (query) {
      result = result.filter((item) =>
        item.hotel_type.toLowerCase().includes(query)
      )
    }

    if (sortField) {
      result = [...result].sort((a, b) => {
        const aValue = a[sortField as keyof HotelType] ?? ''
        const bValue = b[sortField as keyof HotelType] ?? ''

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
        return 0
      })
    }

    return result
  }, [hotelTypes, search, sortField, sortDirection])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredItems.length / pageSize))
  }, [filteredItems.length, pageSize])

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredItems.slice(startIndex, startIndex + pageSize)
  }, [filteredItems, currentPage, pageSize])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, pageSize])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const handleOpenAddModal = () => {
    setEditingItem(null)
    setForm(defaultForm)
    setShowModal(true)
  }

  const handleOpenEditModal = (item: HotelType) => {
    setEditingItem(item)
    setForm({
      hotel_type: item.hotel_type,
      status: Number(item.status),
    })
    setShowModal(true)
  }

  const handleCloseModal = () => {
    if (saving) return
    setShowModal(false)
    setEditingItem(null)
  }

  const handleSubmit = async (payload: HotelTypeFormData) => {
    if (!payload.hotel_type) {
      toast.error('Hotel type is required')
      return
    }

    setSaving(true)

    try {
      if (editingItem) {
        const response = await hotelTypeApi.update(
          editingItem.hoteltypeid,
          payload
        )

        if (response.success && response.data) {
          const updated = { ...response.data, status: Number(response.data.status) }
          setHotelTypes((prev) =>
            prev.map((item) =>
              item.hoteltypeid === updated.hoteltypeid ? updated : item
            )
          )
          toast.success('Hotel type updated')
        } else {
          toast.error(response.message || 'Update failed')
        }
      } else {
        const response = await hotelTypeApi.create(payload)

        if (response.success && response.data) {
          const created = { ...response.data, status: Number(response.data.status) }
          setHotelTypes((prev) => [created, ...prev])
          toast.success('Hotel type added')
        } else {
          toast.error(response.message || 'Create failed')
        }
      }

      setShowModal(false)
      setEditingItem(null)
      setForm(defaultForm)
    } catch (error) {
      console.error('Failed to save hotel type:', error)
      toast.error('Failed to save hotel type')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (item: HotelType) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `You will not be able to recover hotel type "${item.hotel_type}"!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3E97FF',
      confirmButtonText: 'Yes, delete it!',
    })

    if (result.isConfirmed) {
      setDeletingId(item.hoteltypeid)
      try {
        await hotelTypeApi.remove(item.hoteltypeid)
        setHotelTypes((prev) => prev.filter((i) => i.hoteltypeid !== item.hoteltypeid))
        toast.success('Hotel type deleted successfully')
      } catch (error) {
        console.error('Failed to delete hotel type:', error)
        toast.error(typeof error === 'string' ? error : 'Failed to delete hotel type')
      } finally {
        setDeletingId(null)
      }
    }
  }

  return (
    <>
      <TitleHelmet title="Hotel Type Master" />

      <Card className="mb-3">
        <Card.Body className="d-flex justify-content-between align-items-center">
          <div>
            <h4 className="mb-1">Hotel Type Master</h4>
            <p className="text-muted mb-0">Manage hotel types and their information.</p>
          </div>
          <Button variant="danger" onClick={handleOpenAddModal}>
            <span className="me-1">+</span> Add Hotel Type
          </Button>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Form.Control
              type="text"
              placeholder="Search hotel types..."
              style={{ maxWidth: 280 }}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <Table hover responsive className="mb-0">
            <thead className="table-light">
              <tr>
                <th style={{ width: '60px' }}>#</th>
                <th
                  onClick={() => handleSort('hotel_type')}
                  style={{ cursor: 'pointer' }}
                  className="sortable-header"
                >
                  Hotel Type
                  {sortField === 'hotel_type' && (
                    <span className="ms-1">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </th>
                <th style={{ width: '120px' }}>Status</th>
                <th style={{ width: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="text-center text-muted py-4">
                    Loading hotel types...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center text-muted py-4">
                    No hotel types found.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item, index) => (
                  <tr key={item.hoteltypeid}>
                    <td>{(currentPage - 1) * pageSize + index + 1}</td>
                    <td className="fw-semibold">{item.hotel_type}</td>
                    <td>
                      <Badge bg={item.status === 1 ? 'success' : 'secondary'}>
                        {item.status === 1 ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleOpenEditModal(item)}
                        >
                          <i className="fi fi-rr-edit" />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(item)}
                          disabled={deletingId === item.hoteltypeid}
                        >
                          <i className="fi fi-rr-trash" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>

          {filteredItems.length > 0 && (
            <div className="d-flex justify-content-between align-items-center mt-3">
              <Form.Select
                style={{ maxWidth: 80 }}
                value={pageSize}
                onChange={(event) => setPageSize(Number(event.target.value))}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </Form.Select>
              <div className="d-flex align-items-center gap-2">
                <Button
                  variant="outline-light"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  {'<'}
                </Button>
                <Button variant="danger" size="sm">
                  {currentPage}
                </Button>
                <Button
                  variant="outline-light"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
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
        title={editingItem ? 'Edit Hotel Type' : 'Add Hotel Type'}
        onSave={handleSubmit}
        saving={saving}
        submitLabel={editingItem ? 'Update' : 'Save'}
        Component={HotelTypeForm}
        selectedItem={form}
      />
    </>
  )
}

export default HotelTypeMaster