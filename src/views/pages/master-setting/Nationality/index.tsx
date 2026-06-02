import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'
import Swal from 'sweetalert2'
import TitleHelmet from '@/components/Common/TitleHelmet'
import nationalityApi from '@/common/hotel/nationalities'
import { Badge, Button, Card, Form, Table } from 'react-bootstrap'
import FormModal from '@/components/Common/models/FormModal'
import NationalityForm from './NationalityForm'

type Nationality = {
  nationality_id: number
  nationality: string
  nationality_code: string
  status: string
}

type NationalityFormData = {
  nationality: string
  nationality_code: string
  status: string
}

const defaultForm: NationalityFormData = {
  nationality: '',
  nationality_code: '',
  status: 'Active',
}

const NationalityMaster = () => {
  const [nationalities, setNationalities] = useState<Nationality[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingNationality, setEditingNationality] = useState<Nationality | null>(null)
  const [form, setForm] = useState<NationalityFormData>(defaultForm)
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const loadNationalities = async () => {
    setLoading(true)
    try {
      const response = await nationalityApi.list()

      console.log('API response:', response)

      if (response.success) {
        const nationalityData = Array.isArray(response.data) ? response.data : []
        setNationalities(nationalityData)
      } else {
        toast.error(response.message || 'Failed to load nationalities')
        setNationalities([])
      }
    } catch (error: any) {
      console.error('Failed to load nationalities:', error)
      toast.error(error.message || 'Failed to load nationalities')
      setNationalities([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNationalities()
  }, [])

  const filteredNationalities = useMemo(() => {
    let result = nationalities

    const query = search.trim().toLowerCase()
    if (query) {
      result = result.filter((item) =>
        [item.nationality, item.nationality_code, item.status].some((value) =>
          value.toLowerCase().includes(query),
        ),
      )
    }

    if (sortField) {
      result = [...result].sort((a, b) => {
        const aValue = a[sortField as keyof Nationality] ?? ''
        const bValue = b[sortField as keyof Nationality] ?? ''

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
        return 0
      })
    }

    return result
  }, [nationalities, search, sortField, sortDirection])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredNationalities.length / pageSize))
  }, [filteredNationalities.length, pageSize])

  const paginatedNationalities = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredNationalities.slice(startIndex, startIndex + pageSize)
  }, [filteredNationalities, currentPage, pageSize])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, pageSize])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const handleOpenAddModal = () => {
    setEditingNationality(null)
    setForm(defaultForm)
    setShowModal(true)
  }

  const handleOpenEditModal = (nationality: Nationality) => {
    setEditingNationality(nationality)
    setForm({
      nationality: nationality.nationality,
      nationality_code: nationality.nationality_code,
      status: nationality.status,
    })
    setShowModal(true)
  }

  const handleCloseModal = () => {
    if (saving) return
    setShowModal(false)
    setEditingNationality(null)
  }

  const handleSubmit = async (payload: NationalityFormData) => {
    if (!payload.nationality || !payload.nationality_code) {
      toast.error('Nationality name and code are required')
      return
    }

    setSaving(true)

    try {
      if (editingNationality) {
        const response = await nationalityApi.update(
          editingNationality.nationality_id,
          payload
        )

        if (response.success && response.data) {
          const updated = response.data

          setNationalities((prev) =>
            prev.map((item) =>
              item.nationality_id === updated.nationality_id ? updated : item
            )
          )

          toast.success('Nationality updated successfully')
        } else {
          toast.error(response.message || 'Update failed')
        }
      } else {
        const response = await nationalityApi.create(payload)

        if (response.success && response.data) {
          const created = response.data

          setNationalities((prev) => [created, ...prev])

          toast.success('Nationality added successfully')
        } else {
          toast.error(response.message || 'Create failed')
        }
      }

      setShowModal(false)
      setEditingNationality(null)
      setForm(defaultForm)
    } catch (error) {
      console.error('Failed to save nationality:', error)
      toast.error('Failed to save nationality')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (nationality: Nationality) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `You will not be able to recover nationality "${nationality.nationality}"!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3E97FF',
      confirmButtonText: 'Yes, delete it!',
    })

    if (result.isConfirmed) {
      setDeletingId(nationality.nationality_id)
      try {
        await nationalityApi.remove(nationality.nationality_id)
        setNationalities((prev) => prev.filter((item) => item.nationality_id !== nationality.nationality_id))
        toast.success('Nationality deleted successfully')
      } catch (error) {
        console.error('Failed to delete nationality:', error)
        toast.error(typeof error === 'string' ? error : 'Failed to delete nationality')
      } finally {
        setDeletingId(null)
      }
    }
  }

  return (
    <>
      <TitleHelmet title="Nationality Master" />

      <Card className="mb-3">
        <Card.Body className="d-flex justify-content-between align-items-center">
          <div>
            <h4 className="mb-1">Nationality Master</h4>
            <p className="text-muted mb-0">Manage nationalities and their information.</p>
          </div>
          <Button variant="danger" onClick={handleOpenAddModal}>
            <span className="me-1">+</span> Add Nationality
          </Button>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Form.Control
              type="text"
              placeholder="Search nationalities..."
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
                  onClick={() => handleSort('nationality')}
                  style={{ cursor: 'pointer' }}
                  className="sortable-header"
                >
                  Nationality
                  {sortField === 'nationality' && (
                    <span className="ms-1">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </th>
                <th style={{ width: '140px' }}>Code</th>
                <th style={{ width: '120px' }}>Status</th>
                <th style={{ width: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center text-muted py-4">
                    Loading nationalities...
                  </td>
                </tr>
              ) : filteredNationalities.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-muted py-4">
                    No nationalities found.
                  </td>
                </tr>
              ) : (
                paginatedNationalities.map((nationality, index) => (
                  <tr key={nationality.nationality_id}>
                    <td>{(currentPage - 1) * pageSize + index + 1}</td>
                    <td className="fw-semibold">{nationality.nationality}</td>
                    <td>
                      <Badge bg="primary" className="px-3">
                        {nationality.nationality_code}
                      </Badge>
                    </td>
                    <td>
                      <Badge bg={nationality.status === 'Active' ? 'success' : 'secondary'}>
                        {nationality.status}
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleOpenEditModal(nationality)}
                        >
                          <i className="fi fi-rr-edit" />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(nationality)}
                          disabled={deletingId === nationality.nationality_id}
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

          {filteredNationalities.length > 0 && (
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
        title={editingNationality ? 'Edit Nationality' : 'Add Nationality'}
        onSave={(values) => {
          handleSubmit(values)
        }}
        saving={saving}
        submitLabel={editingNationality ? 'Update' : 'Save'}
        Component={NationalityForm}
        selectedItem={form}
      />
    </>
  )
}

export default NationalityMaster