import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'
import Swal from 'sweetalert2'
import TitleHelmet from '@/components/Common/TitleHelmet'
import featureApi from '@/common/hotel/features'
import { Badge, Button, Card, Form, Table } from 'react-bootstrap'
import FormModal from '@/components/Common/models/FormModal'
import FeatureForm from './FeatureForm'

type Feature = {
  feature_id: number
  feature: string
  description?: string
  status: number
}

type FeatureFormData = {
  feature: string
  description: string
  status: number
}

const defaultForm: FeatureFormData = {
  feature: '',
  description: '',
  status: 1,
}

const FeatureMaster = () => {
  const [features, setFeatures] = useState<Feature[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null)
  const [form] = useState<FeatureFormData>(defaultForm)
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const loadFeatures = async () => {
    setLoading(true)
    try {
      const response = await featureApi.list()
      if (response.success) {
        setFeatures(Array.isArray(response.data) ? response.data : [])
      } else {
        toast.error(response.message || 'Failed to load features')
        setFeatures([])
      }
    } catch (error: any) {
      console.error('Failed to load features:', error)
      toast.error(error.message || 'Failed to load features')
      setFeatures([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFeatures()
  }, [])

  const filteredFeatures = useMemo(() => {
    let result = features
    const query = search.trim().toLowerCase()
    if (query) {
      result = result.filter((item) =>
        [item.feature, item.description ?? ''].some((val) =>
          val.toLowerCase().includes(query)
        )
      )
    }
    if (sortField) {
      result = [...result].sort((a, b) => {
        const aValue = a[sortField as keyof Feature] ?? ''
        const bValue = b[sortField as keyof Feature] ?? ''
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
        return 0
      })
    }
    return result
  }, [features, search, sortField, sortDirection])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredFeatures.length / pageSize)), [filteredFeatures.length, pageSize])
  const paginatedFeatures = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredFeatures.slice(start, start + pageSize)
  }, [filteredFeatures, currentPage, pageSize])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, pageSize])

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const handleOpenAddModal = () => {
    setEditingFeature(null)
    setShowModal(true)
  }

  const handleOpenEditModal = (feature: Feature) => {
    setEditingFeature(feature)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    if (saving) return
    setShowModal(false)
    setEditingFeature(null)
  }

  const handleSubmit = async (payload: any) => {
    if (!payload.feature) {
      toast.error('Feature name is required')
      return
    }

    setSaving(true)
    try {
      if (editingFeature) {
        const response = await featureApi.update(editingFeature.feature_id, payload)
        if (response.success && response.data) {
          setFeatures(prev => prev.map(item => item.feature_id === response.data!.feature_id ? response.data! : item))
          toast.success('Feature updated')
        } else {
          toast.error(response.message || 'Update failed')
        }
      } else {
        const response = await featureApi.create(payload)
        if (response.success && response.data) {
          setFeatures(prev => [response.data!, ...prev])
          toast.success('Feature added')
        } else {
          toast.error(response.message || 'Create failed')
        }
      }
      setShowModal(false)
      setEditingFeature(null)
    } catch (error) {
      console.error('Failed to save feature:', error)
      toast.error('Failed to save feature')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (feature: Feature) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `You will not be able to recover feature "${feature.feature}"!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3E97FF',
      confirmButtonText: 'Yes, delete it!',
    })

    if (result.isConfirmed) {
      setDeletingId(feature.feature_id)
      try {
        await featureApi.remove(feature.feature_id)
        setFeatures(prev => prev.filter(item => item.feature_id !== feature.feature_id))
        toast.success('Feature deleted successfully')
      } catch (error) {
        console.error('Failed to delete feature:', error)
        toast.error(typeof error === 'string' ? error : 'Failed to delete feature')
      } finally {
        setDeletingId(null)
      }
    }
  }

  return (
    <>
      <TitleHelmet title="Feature Master" />

      <Card className="mb-3">
        <Card.Body className="d-flex justify-content-between align-items-center">
          <div>
            <h4 className="mb-1">Feature Master</h4>
            <p className="text-muted mb-0">Manage features and their descriptions.</p>
          </div>
          <Button variant="danger" onClick={handleOpenAddModal}>
            <span className="me-1">+</span> Add Feature
          </Button>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Form.Control
              type="text"
              placeholder="Search features..."
              style={{ maxWidth: 280 }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Table hover responsive className="mb-0">
            <thead className="table-light">
              <tr>
                <th style={{ width: '60px' }}>#</th>
                <th onClick={() => handleSort('feature')} style={{ cursor: 'pointer' }}>
                  Feature
                  {sortField === 'feature' && <span className="ms-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                </th>
                <th>Description</th>
                <th style={{ width: '120px' }}>Status</th>
                <th style={{ width: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center text-muted py-4">Loading features...</td></tr>
              ) : filteredFeatures.length === 0 ? (
                <tr><td colSpan={5} className="text-center text-muted py-4">No features found.</td></tr>
              ) : (
                paginatedFeatures.map((item, index) => (
                  <tr key={item.feature_id}>
                    <td>{(currentPage - 1) * pageSize + index + 1}</td>
                    <td className="fw-semibold">{item.feature}</td>
                    <td>{item.description || '-'}</td>
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
                        <Button variant="outline-danger" size="sm" onClick={() => handleDelete(item)} disabled={deletingId === item.feature_id}>
                          <i className="fi fi-rr-trash" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>

          {filteredFeatures.length > 0 && (
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
        title={editingFeature ? 'Edit Feature' : 'Add Feature'}
        onSave={handleSubmit}
        saving={saving}
        submitLabel={editingFeature ? 'Update' : 'Save'}
        Component={FeatureForm}
        selectedItem={editingFeature || form}
      />
    </>
  )
}

export default FeatureMaster