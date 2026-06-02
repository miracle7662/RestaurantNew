import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'
import Swal from 'sweetalert2'
import TitleHelmet from '@/components/Common/TitleHelmet'
import floorApi from '@/common/hotel/floors'
import { Badge, Button, Card, Form, Table } from 'react-bootstrap'
import FormModal from '@/components/Common/models/FormModal'
import FloorForm from './FloorForm'
import { useAuthContext } from '@/common/context/useAuthContext'

type Floor = {
  floor_id: number
  floor_name: string
  floor_number: number
  hotelid: number  // Changed from mst_hotelid to hotelid
  status: number
  created_by_id: number | null
  created_date: string
  updated_by_id: number | null
  updated_date: string
}

type FloorFormData = {
  floor_id?: number
  floor_name: string
  floor_number: string
  status: number
}

const defaultForm: FloorFormData = {
  floor_name: '',
  floor_number: '',
  status: 1,
}

const FloorMaster = () => {
  const { user } = useAuthContext()
  const hotelid = user?.hotelid  // Changed from mst_hotelid to hotelid

  const [floors, setFloors] = useState<Floor[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingFloor, setEditingFloor] = useState<Floor | null>(null)
  const [form, setForm] = useState<FloorFormData>(defaultForm)
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const loadFloors = async () => {
    if (!hotelid) {
      toast.error('Hotel ID not found. Please login again.')
      return
    }
    setLoading(true)
    try {
      const response = await floorApi.list({ hotelid: hotelid })  // Changed from mst_hotelid to hotelid
      if (response.success) {
        setFloors(Array.isArray(response.data) ? response.data : [])
      } else {
        toast.error(response.message || 'Failed to load floors')
        setFloors([])
      }
    } catch (error: any) {
      console.error('Failed to load floors:', error)
      toast.error(error.message || 'Failed to load floors')
      setFloors([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (hotelid) {
      loadFloors()
    }
  }, [hotelid])

  const filteredFloors = useMemo(() => {
    let result = floors

    const query = search.trim().toLowerCase()
    if (query) {
      result = result.filter((floor) =>
        [floor.floor_name, floor.floor_number.toString()].some((value) =>
          value.toLowerCase().includes(query),
        ),
      )
    }

    if (sortField) {
      result = [...result].sort((a, b) => {
        const aValue = a[sortField as keyof Floor] ?? ''
        const bValue = b[sortField as keyof Floor] ?? ''
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
        return 0
      })
    }

    return result
  }, [floors, search, sortField, sortDirection])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredFloors.length / pageSize)),
    [filteredFloors.length, pageSize],
  )

  const paginatedFloors = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredFloors.slice(start, start + pageSize)
  }, [filteredFloors, currentPage, pageSize])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, pageSize])

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const handleOpenAddModal = () => {
    setEditingFloor(null)
    setForm(defaultForm)
    setShowModal(true)
  }

  const handleOpenEditModal = (floor: Floor) => {
    setEditingFloor(floor)
    setForm({
      floor_id: floor.floor_id,
      floor_name: floor.floor_name,
      floor_number: floor.floor_number.toString(),
      status: floor.status,
    })
    setShowModal(true)
  }

  const handleCloseModal = () => {
    if (saving) return
    setShowModal(false)
    setEditingFloor(null)
  }

  const handleSubmit = async (payload: FloorFormData) => {
    if (!payload.floor_name || !payload.floor_number) {
      toast.error('Floor name and number are required')
      return
    }

    if (!hotelid) {
      toast.error('Hotel ID not found. Please login again.')
      return
    }

    setSaving(true)

    try {
      const userId = user?.id

      // Ensure status is a number
      const apiPayload = {
        floor_name: payload.floor_name,
        floor_number: parseInt(payload.floor_number) || 0,
        status: Number(payload.status),
        hotelid: hotelid,  // Changed from mst_hotelid to hotelid
        created_by_id: userId,
        updated_by_id: userId,
      }

      if (editingFloor) {
        const updatePayload = { ...apiPayload }
        delete updatePayload.created_by_id

        const response = await floorApi.update(editingFloor.floor_id, updatePayload)
        if (response.success && response.data) {
          setFloors((prev) =>
            prev.map((item) => (item.floor_id === response.data!.floor_id ? response.data! : item)),
          )
          toast.success('Floor updated successfully')
        } else {
          toast.error(response.message || 'Update failed')
        }
      } else {
        const response = await floorApi.create(apiPayload)
        if (response.success && response.data) {
          setFloors((prev) => [response.data!, ...prev])
          toast.success('Floor added successfully')
        } else {
          toast.error(response.message || 'Create failed')
        }
      }

      setShowModal(false)
      setEditingFloor(null)
      setForm(defaultForm)
    } catch (error) {
      console.error('Failed to save floor:', error)
      toast.error('Failed to save floor')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (floor: Floor) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `You will not be able to recover floor "${floor.floor_name}"!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3E97FF',
      confirmButtonText: 'Yes, delete it!',
    })

    if (result.isConfirmed) {
      setDeletingId(floor.floor_id)
      try {
        await floorApi.remove(floor.floor_id)
        setFloors((prev) => prev.filter((item) => item.floor_id !== floor.floor_id))
        toast.success('Floor deleted successfully')
      } catch (error) {
        console.error('Failed to delete floor:', error)
        toast.error(typeof error === 'string' ? error : 'Failed to delete floor')
      } finally {
        setDeletingId(null)
      }
    }
  }

  return (
    <>
      <TitleHelmet title="Floor Master" />

      <Card className="mb-3">
        <Card.Body className="d-flex justify-content-between align-items-center">
          <div>
            <h4 className="mb-1">Floor Master</h4>
            <p className="text-muted mb-0">Manage floors and their information.</p>
          </div>
          <Button variant="danger" onClick={handleOpenAddModal}>
            <span className="me-1">+</span> Add Floor
          </Button>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Form.Control
              type="text"
              placeholder="Search floors..."
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
                  onClick={() => handleSort('floor_name')}
                  style={{ cursor: 'pointer' }}
                  className="sortable-header">
                  Floor Name
                  {sortField === 'floor_name' && (
                    <span className="ms-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th
                  onClick={() => handleSort('floor_number')}
                  style={{ cursor: 'pointer' }}
                  className="sortable-header">
                  Floor Number
                  {sortField === 'floor_number' && (
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
                    Loading floors...
                  </td>
                </tr>
              ) : filteredFloors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-muted py-4">
                    No floors found.
                  </td>
                </tr>
              ) : (
                paginatedFloors.map((floor, index) => (
                  <tr key={floor.floor_id}>
                    <td>{(currentPage - 1) * pageSize + index + 1}</td>
                    <td className="fw-semibold">{floor.floor_name}</td>
                    <td>{floor.floor_number}</td>
                    <td>
                      <Badge bg={floor.status === 1 ? 'success' : 'secondary'}>
                        {floor.status === 1 ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleOpenEditModal(floor)}>
                          <i className="fi fi-rr-edit" />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(floor)}
                          disabled={deletingId === floor.floor_id}>
                          <i className="fi fi-rr-trash" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>

          {filteredFloors.length > 0 && (
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
        title={editingFloor ? 'Edit Floor' : 'Add Floor'}
        onSave={handleSubmit}
        saving={saving}
        submitLabel={editingFloor ? 'Update' : 'Save'}
        Component={FloorForm}
        selectedItem={form}
      />
    </>
  )
}

export default FloorMaster