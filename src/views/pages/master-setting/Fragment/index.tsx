import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'
import Swal from 'sweetalert2'
import TitleHelmet from '@/components/Common/TitleHelmet'
import fragmentApi from '@/common/hotel/fragments'
import { Badge, Button, Card, Form, Table } from 'react-bootstrap'
import FormModal from '@/components/Common/models/FormModal'
import FragmentForm from './FragmentForm'

type Fragment = {
  fragment_id: number
  name: string
  status: number
}

type FragmentFormData = {
  name: string
  status: number
}

const defaultForm: FragmentFormData = {
  name: '',
  status: 1,
}

const FragmentMaster = () => {
  const [fragments, setFragments] = useState<Fragment[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingFragment, setEditingFragment] = useState<Fragment | null>(null)
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Load fragments from server
  const loadFragments = async () => {
    setLoading(true)
    try {
      const response = await fragmentApi.list()
      if (response.success) {
        setFragments(Array.isArray(response.data) ? response.data : [])
      } else {
        toast.error(response.message || 'Failed to load fragments')
        setFragments([])
      }
    } catch (error: any) {
      console.error('Failed to load fragments:', error)
      toast.error(error.message || 'Failed to load fragments')
      setFragments([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFragments()
  }, [])

  // Filter and sort logic
  const filteredFragments = useMemo(() => {
    let result = fragments
    const query = search.trim().toLowerCase()
    if (query) {
      result = result.filter((item) =>
        item.name.toLowerCase().includes(query)
      )
    }
    if (sortField) {
      result = [...result].sort((a, b) => {
        const aValue = a[sortField as keyof Fragment] ?? ''
        const bValue = b[sortField as keyof Fragment] ?? ''
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
        return 0
      })
    }
    return result
  }, [fragments, search, sortField, sortDirection])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredFragments.length / pageSize)), [filteredFragments.length, pageSize])
  const paginatedFragments = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredFragments.slice(start, start + pageSize)
  }, [filteredFragments, currentPage, pageSize])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, pageSize])

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const handleOpenAddModal = () => {
    setEditingFragment(null)
    setShowModal(true)
  }

  const handleOpenEditModal = (fragment: Fragment) => {
    setEditingFragment(fragment)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    if (saving) return
    setShowModal(false)
    setEditingFragment(null)
  }

  // Save handler – reloads the list after successful operation
  const handleSubmit = async (payload: any) => {
    if (!payload.name) {
      toast.error('Fragment name is required')
      return
    }

    setSaving(true)
    try {
      if (editingFragment) {
        const response = await fragmentApi.update(editingFragment.fragment_id, payload)
        if (response.success) {
          toast.success('Fragment updated')
        } else {
          toast.error(response.message || 'Update failed')
          return
        }
      } else {
        const response = await fragmentApi.create(payload)
        if (response.success) {
          toast.success('Fragment added')
        } else {
          toast.error(response.message || 'Create failed')
          return
        }
      }

      // Reload the list to reflect changes (including status)
      await loadFragments()
      setShowModal(false)
      setEditingFragment(null)
    } catch (error) {
      console.error('Failed to save fragment:', error)
      toast.error('Failed to save fragment')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (fragment: Fragment) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `You will not be able to recover fragment "${fragment.name}"!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3E97FF',
      confirmButtonText: 'Yes, delete it!',
    })

    if (result.isConfirmed) {
      setDeletingId(fragment.fragment_id)
      try {
        await fragmentApi.remove(fragment.fragment_id)
        // Reload list after deletion
        await loadFragments()
        toast.success('Fragment deleted successfully')
      } catch (error) {
        console.error('Failed to delete fragment:', error)
        toast.error(typeof error === 'string' ? error : 'Failed to delete fragment')
      } finally {
        setDeletingId(null)
      }
    }
  }

  return (
    <>
      <TitleHelmet title="Fragment Master" />

      <Card className="mb-3">
        <Card.Body className="d-flex justify-content-between align-items-center">
          <div>
            <h4 className="mb-1">Fragment Master</h4>
            <p className="text-muted mb-0">Manage fragments used in guest records.</p>
          </div>
          <Button variant="danger" onClick={handleOpenAddModal}>
            <span className="me-1">+</span> Add Fragment
          </Button>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Form.Control
              type="text"
              placeholder="Search fragments..."
              style={{ maxWidth: 280 }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Table hover responsive className="mb-0">
            <thead className="table-light">
              <tr>
                <th style={{ width: '60px' }}>#</th>
                <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                  Fragment Name
                  {sortField === 'name' && <span className="ms-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                </th>
                <th style={{ width: '120px' }}>Status</th>
                <th style={{ width: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="text-center text-muted py-4">Loading fragments...</td></tr>
              ) : filteredFragments.length === 0 ? (
                <tr><td colSpan={4} className="text-center text-muted py-4">No fragments found.</td></tr>
              ) : (
                paginatedFragments.map((item, index) => (
                  <tr key={item.fragment_id}>
                    <td>{(currentPage - 1) * pageSize + index + 1}</td>
                    <td className="fw-semibold">{item.name}</td>
                    <td>
                      <Badge bg={item.status === 1 ? 'success' : 'secondary'}>
                        {item.status === 1 ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button variant="outline-primary" size="sm" onClick={() => handleOpenEditModal(item)}>
                          <i className="fi fi-rr-edit" />
                        </Button>
                        <Button variant="outline-danger" size="sm" onClick={() => handleDelete(item)} disabled={deletingId === item.fragment_id}>
                          <i className="fi fi-rr-trash" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>

          {filteredFragments.length > 0 && (
            <div className="d-flex justify-content-between align-items-center mt-3">
              <Form.Select style={{ maxWidth: 80 }} value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </Form.Select>
              <div className="d-flex align-items-center gap-2">
                <Button variant="outline-light" size="sm" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>
                  {'<'}
                </Button>
                <Button variant="danger" size="sm">{currentPage}</Button>
                <Button variant="outline-light" size="sm" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}>
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
        title={editingFragment ? 'Edit Fragment' : 'Add Fragment'}
        onSave={handleSubmit}
        saving={saving}
        submitLabel={editingFragment ? 'Update' : 'Save'}
        Component={FragmentForm}
        selectedItem={editingFragment || defaultForm}
      />
    </>
  )
}

export default FragmentMaster