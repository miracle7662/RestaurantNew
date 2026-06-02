import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'
import Swal from 'sweetalert2'
import TitleHelmet from '@/components/Common/TitleHelmet'
import cityApi from '@/common/hotel/cities'
import { Badge, Button, Card, Form, Table } from 'react-bootstrap'
import FormModal from '@/components/Common/models/FormModal'
import CityForm from './CityForm'

type City = {
  cityid: number
  city_name: string
  city_Code: string
  stateId: number
  state_name: string
  countryid: number
  country_name: string
  iscoastal: number
  status: number
}

type CityFormData = {
  city_name: string
  city_Code: string
  countryId: number
  stateId: number
  iscoastal: number
  status: number
}

const defaultForm: CityFormData = {
  city_name: '',
  city_Code: '',
  countryId: 0,
  stateId: 0,
  iscoastal: 0,
  status: 1,
}

const CityMaster = () => {
  const [cities, setCities] = useState<City[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingCity, setEditingCity] = useState<City | null>(null)
  const [form, setForm] = useState<CityFormData>(defaultForm)
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const loadCities = async () => {
    setLoading(true)
    try {
      const response = await cityApi.list()
      if (response.success) {
        setCities(Array.isArray(response.data) ? response.data : [])
      } else {
        toast.error(response.message || 'Failed to load cities')
        setCities([])
      }
    } catch (error: any) {
      console.error('Failed to load cities:', error)
      toast.error(error.message || 'Failed to load cities')
      setCities([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCities()
  }, [])

  const filteredCities = useMemo(() => {
    let result = cities

    const query = search.trim().toLowerCase()
    if (query) {
      result = result.filter((city) =>
        [city.city_name, city.city_Code, city.state_name, city.country_name].some((value) =>
          value?.toLowerCase().includes(query)
        )
      )
    }

    if (sortField) {
      result = [...result].sort((a, b) => {
        let aValue: any = ''
        let bValue: any = ''
        if (sortField === 'state') {
          aValue = a.state_name
          bValue = b.state_name
        } else if (sortField === 'country') {
          aValue = a.country_name
          bValue = b.country_name
        } else {
          aValue = a[sortField as keyof City] ?? ''
          bValue = b[sortField as keyof City] ?? ''
        }
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
        return 0
      })
    }

    return result
  }, [cities, search, sortField, sortDirection])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredCities.length / pageSize))
  }, [filteredCities.length, pageSize])

  const paginatedCities = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredCities.slice(startIndex, startIndex + pageSize)
  }, [filteredCities, currentPage, pageSize])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, pageSize])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const handleOpenAddModal = () => {
    setEditingCity(null)
    setForm(defaultForm)
    setShowModal(true)
  }

  const handleOpenEditModal = (city: City) => {
    setEditingCity(city)
    setForm({
      city_name: city.city_name,
      city_Code: city.city_Code,
      countryId: city.countryid,
      stateId: city.stateId,
      iscoastal: city.iscoastal,
      status: city.status,
    })
    setShowModal(true)
  }

  const handleCloseModal = () => {
    if (saving) return
    setShowModal(false)
    setEditingCity(null)
  }

  const handleSubmit = async (payload: CityFormData) => {
    if (!payload.city_name || !payload.city_Code || !payload.stateId || !payload.countryId) {
      toast.error('City name, code, country and state are required')
      return
    }

    setSaving(true)

    try {
      if (editingCity) {
        const response = await cityApi.update(editingCity.cityid, payload)
        if (response.success && response.data) {
          setCities((prev) =>
            prev.map((item) => (item.cityid === response.data!.cityid ? response.data! : item))
          )
          toast.success('City updated')
        } else {
          toast.error(response.message || 'Update failed')
        }
      } else {
        const response = await cityApi.create(payload)
        if (response.success && response.data) {
          setCities((prev) => [response.data!, ...prev])
          toast.success('City added')
        } else {
          toast.error(response.message || 'Create failed')
        }
      }

      setShowModal(false)
      setEditingCity(null)
    } catch (error) {
      console.error('Failed to save city:', error)
      toast.error('Failed to save city')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (city: City) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `You will not be able to recover city "${city.city_name}"!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3E97FF',
      confirmButtonText: 'Yes, delete it!',
    })

    if (result.isConfirmed) {
      setDeletingId(city.cityid)
      try {
        await cityApi.remove(city.cityid)
        setCities((prev) => prev.filter((item) => item.cityid !== city.cityid))
        toast.success('City deleted successfully')
      } catch (error) {
        console.error('Failed to delete city:', error)
        toast.error(typeof error === 'string' ? error : 'Failed to delete city')
      } finally {
        setDeletingId(null)
      }
    }
  }

  return (
    <>
      <TitleHelmet title="City Master" />

      <Card className="mb-3">
        <Card.Body className="d-flex justify-content-between align-items-center">
          <div>
            <h4 className="mb-1">City Master</h4>
            <p className="text-muted mb-0">Manage cities and their information.</p>
          </div>
          <Button variant="danger" onClick={handleOpenAddModal}>
            <span className="me-1">+</span> Add City
          </Button>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Form.Control
              type="text"
              placeholder="Search cities..."
              style={{ maxWidth: 280 }}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <Table hover responsive className="mb-0">
            <thead className="table-light">
              <tr>
                <th style={{ width: '60px' }}>#</th>
                <th onClick={() => handleSort('city_name')} style={{ cursor: 'pointer' }}>
                  City
                  {sortField === 'city_name' && <span className="ms-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                </th>
                <th style={{ width: '140px' }}>Code</th>
                <th onClick={() => handleSort('state')} style={{ cursor: 'pointer' }}>
                  State
                  {sortField === 'state' && <span className="ms-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                </th>
                <th onClick={() => handleSort('country')} style={{ cursor: 'pointer' }}>
                  Country
                  {sortField === 'country' && <span className="ms-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                </th>
                <th style={{ width: '100px' }}>Coastal?</th>
                <th style={{ width: '120px' }}>Status</th>
                <th style={{ width: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center text-muted py-4">Loading cities...</td>
                </tr>
              ) : filteredCities.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-muted py-4">No cities found.</td>
                </tr>
              ) : (
                paginatedCities.map((city, index) => (
                  <tr key={city.cityid}>
                    <td>{(currentPage - 1) * pageSize + index + 1}</td>
                    <td className="fw-semibold">{city.city_name}</td>
                    <td>
                      <Badge bg="primary" className="px-3">{city.city_Code}</Badge>
                    </td>
                    <td>{city.state_name}</td>
                    <td>{city.country_name}</td>
                    <td>
                      <Badge bg={city.iscoastal === 1 ? 'info' : 'secondary'}>
                        {city.iscoastal === 1 ? 'Yes' : 'No'}
                      </Badge>
                    </td>
                    <td>
                      <Badge bg={city.status === 1 ? 'success' : 'secondary'}>
                        {city.status === 1 ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button variant="outline-primary" size="sm" onClick={() => handleOpenEditModal(city)}>
                          <i className="fi fi-rr-edit" />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(city)}
                          disabled={deletingId === city.cityid}>
                          <i className="fi fi-rr-trash" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>

          {filteredCities.length > 0 && (
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
                <Button variant="danger" size="sm">{currentPage}</Button>
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
        title={editingCity ? 'Edit City' : 'Add City'}
        onSave={handleSubmit}
        saving={saving}
        submitLabel={editingCity ? 'Update' : 'Save'}
        Component={CityForm}
        selectedItem={form}
      />
    </>
  )
}

export default CityMaster
