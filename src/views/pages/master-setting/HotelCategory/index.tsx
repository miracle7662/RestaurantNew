import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'
import Swal from 'sweetalert2'
import TitleHelmet from '@/components/Common/TitleHelmet'
import hotelCategoryApi from '@/common/hotel/hotelCategories'
import { Badge, Button, Card, Form, Table } from 'react-bootstrap'
import FormModal from '@/components/Common/models/FormModal'
import HotelCategoryForm from './HotelCategoryForm'

type HotelCategory = {
  hotelcategoryid: number
  category_type: string
  status: number
}

type HotelCategoryFormData = {
  category_type: string
  status: number
}

const defaultForm: HotelCategoryFormData = {
  category_type: '',
  status: 1,
}

const HotelCategoryMaster = () => {
  const [hotelCategories, setHotelCategories] = useState<HotelCategory[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<HotelCategory | null>(null)
  const [form, setForm] = useState<HotelCategoryFormData>(defaultForm)
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const loadHotelCategories = async () => {
    setLoading(true)
    try {
      const response = await hotelCategoryApi.list()

      console.log("API response:", response)

      if (response.success) {
        setHotelCategories(Array.isArray(response.data) ? response.data : [])
      } else {
        toast.error(response.message || 'Failed to load hotel categories')
        setHotelCategories([])
      }
    } catch (error: any) {
      console.error('Failed to load hotel categories:', error)
      toast.error(error.message || 'Failed to load hotel categories')
      setHotelCategories([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHotelCategories()
  }, [])

  const filteredCategories = useMemo(() => {
    let result = hotelCategories

    // Apply search filter
    const query = search.trim().toLowerCase()
    if (query) {
      result = result.filter((category) =>
        [category.category_type].some((value) =>
          value.toLowerCase().includes(query),
        ),
      )
    }

    // Apply sorting
    if (sortField) {
      result = [...result].sort((a, b) => {
        const aValue = a[sortField as keyof HotelCategory] ?? ''
        const bValue = b[sortField as keyof HotelCategory] ?? ''
        
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
        return 0
      })
    }

    return result
  }, [hotelCategories, search, sortField, sortDirection])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredCategories.length / pageSize))
  }, [filteredCategories.length, pageSize])

  const paginatedCategories = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredCategories.slice(startIndex, startIndex + pageSize)
  }, [filteredCategories, currentPage, pageSize])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, pageSize])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const handleOpenAddModal = () => {
    setEditingCategory(null)
    setForm(defaultForm)
    setShowModal(true)
  }

  const handleOpenEditModal = (category: HotelCategory) => {
    setEditingCategory(category)
    setForm({
      category_type: category.category_type,
      status: category.status,
    })
    setShowModal(true)
  }
  console.log('form', form)

  const handleCloseModal = () => {
    if (saving) return
    setShowModal(false)
    setEditingCategory(null)
  }

  const handleChange = (event: React.ChangeEvent<any>) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (payload: any) => {
    if (!payload.category_type) {
      toast.error('Category type is required')
      return
    }

    setSaving(true)

    try {
      if (editingCategory) {
        const response = await hotelCategoryApi.update(
          editingCategory.hotelcategoryid,
          payload
        )

        if (response.success && response.data) {
          const updated = response.data

          setHotelCategories((prev) =>
            prev.map((item) =>
              item.hotelcategoryid === updated.hotelcategoryid ? updated : item
            )
          )

          toast.success('Hotel category updated')
        } else {
          toast.error(response.message || 'Update failed')
        }

      } else {
        const response = await hotelCategoryApi.create(payload)

        if (response.success && response.data) {
          const created = response.data

          setHotelCategories((prev) => [created, ...prev])

          toast.success('Hotel category added')
        } else {
          toast.error(response.message || 'Create failed')
        }
      }

      setShowModal(false)
      setEditingCategory(null)
      setForm(defaultForm)

    } catch (error) {
      console.error('Failed to save hotel category:', error)
      toast.error('Failed to save hotel category')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (category: HotelCategory) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `You will not be able to recover category "${category.category_type}"!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3E97FF',
      confirmButtonText: 'Yes, delete it!',
    })

    if (result.isConfirmed) {
      setDeletingId(category.hotelcategoryid)
      try {
        await hotelCategoryApi.remove(category.hotelcategoryid)
        setHotelCategories((prev) => prev.filter((item) => item.hotelcategoryid !== category.hotelcategoryid))
        toast.success('Hotel category deleted successfully')
      } catch (error) {
        console.error('Failed to delete hotel category:', error)
        toast.error(typeof error === 'string' ? error : 'Failed to delete hotel category')
      } finally {
        setDeletingId(null)
      }
    }
  }

  return (
    <>
      <TitleHelmet title="Hotel Category Master" />

      <Card className="mb-3">
        <Card.Body className="d-flex justify-content-between align-items-center">
          <div>
            <h4 className="mb-1">Hotel Category Master</h4>
            <p className="text-muted mb-0">Manage hotel categories and their information.</p>
          </div>
          <Button variant="danger" onClick={handleOpenAddModal}>
            <span className="me-1">+</span> Add Hotel Category
          </Button>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Form.Control
              type="text"
              placeholder="Search categories..."
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
                  onClick={() => handleSort('category_type')}
                  style={{ cursor: 'pointer' }}
                  className="sortable-header"
                >
                  Category Type
                  {sortField === 'category_type' && (
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
                    Loading hotel categories...
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center text-muted py-4">
                    No hotel categories found.
                  </td>
                </tr>
              ) : (
                paginatedCategories.map((category, index) => (
                  <tr key={category.hotelcategoryid}>
                    <td>{(currentPage - 1) * pageSize + index + 1}</td>
                    <td className="fw-semibold">{category.category_type}</td>
                    <td>
                      <Badge bg={category.status === 1 ? 'success' : 'secondary'}>
                        {category.status === 1 ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleOpenEditModal(category)}>
                          <i className="fi fi-rr-edit" />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(category)}
                          disabled={deletingId === category.hotelcategoryid}>
                          <i className="fi fi-rr-trash" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>

          {filteredCategories.length > 0 && (
            <div className="d-flex justify-content-between align-items-center mt-3">
              <Form.Select
                style={{ maxWidth: 80 }}
                value={pageSize}
                onChange={(event) => setPageSize(Number(event.target.value))}>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </Form.Select>
              <div className="d-flex align-items-center gap-2">
                <Button
                  variant="outline-light"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}>
                  {'<'}
                </Button>
                <Button variant="danger" size="sm">
                  {currentPage}
                </Button>
                <Button
                  variant="outline-light"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
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
        title={editingCategory ? 'Edit Hotel Category' : 'Add Hotel Category'}
        onSave={(values) => {
          handleSubmit(values)
        }}
        saving={saving}
        submitLabel={editingCategory ? 'Update' : 'Save'}
        Component={HotelCategoryForm}
        selectedItem={form}
      />
    </>
  )
}

export default HotelCategoryMaster