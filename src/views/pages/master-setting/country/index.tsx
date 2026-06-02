import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'
import Swal from 'sweetalert2'
import TitleHelmet from '@/components/Common/TitleHelmet'
import countryApi from '@/common/api/countries'
import { Badge, Button, Card, Form, Row, Col, Table } from 'react-bootstrap'
import FormModal from '@/components/Common/models/FormModal'
import CountryForm from './CountryForm'

type Country = {
  countryid: number
  country_name: string
  country_code: string
  country_capital?: string
  status: number
}

type CountryForm = {
  country_name: string
  country_code: string
  country_capital: string
  status: number
}

const defaultForm: CountryForm = {
  country_name: '',
  country_code: '',
  country_capital: '',
  status: 1,
}

const CountryMaster = () => {
  const [countries, setCountries] = useState<Country[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingCountry, setEditingCountry] = useState<Country | null>(null)
  const [form, setForm] = useState<CountryForm>(defaultForm)
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const loadCountries = async () => {
    setLoading(true)
    try {
      const response = await countryApi.list()

      console.log("API response:", response)

      if (response.success) {
        // Ensure response.data is always an array and normalize status values
        const normalizedData = Array.isArray(response.data) 
          ? response.data.map((country: any) => ({
              ...country,
              status: typeof country.status === 'boolean' 
                ? (country.status ? 1 : 0) 
                : Number(country.status)
            }))
          : []
        
        setCountries(normalizedData)
      } else {
        toast.error(response.message || 'Failed to load countries')
        setCountries([])
      }

    } catch (error: any) {
      console.error('Failed to load countries:', error)
      toast.error(error.message || 'Failed to load countries')
      setCountries([])
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    loadCountries()
  }, [])

  const filteredCountries = useMemo(() => {
    let result = countries

    // Apply search filter
    const query = search.trim().toLowerCase()
    if (query) {
      result = result.filter((country) =>
        [country.country_name, country.country_code, country.country_capital ?? ''].some((value) =>
          value.toLowerCase().includes(query),
        ),
      )
    }

    // Apply sorting
    if (sortField) {
      result = [...result].sort((a, b) => {
        const aValue = a[sortField as keyof Country] ?? ''
        const bValue = b[sortField as keyof Country] ?? ''
        
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
        return 0
      })
    }

    return result
  }, [countries, search, sortField, sortDirection])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredCountries.length / pageSize))
  }, [filteredCountries.length, pageSize])

  const paginatedCountries = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredCountries.slice(startIndex, startIndex + pageSize)
  }, [filteredCountries, currentPage, pageSize])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, pageSize])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const handleOpenAddModal = () => {
    setEditingCountry(null)
    setForm(defaultForm)
    setShowModal(true)
  }

  const handleOpenEditModal = (country: Country) => {
    setEditingCountry(country)
    setForm({
      country_name: country.country_name,
      country_code: country.country_code,
      country_capital: country.country_capital ?? '',
      status: country.status,
    })
    setShowModal(true)
  }
  
  console.log('form', form)

  const handleCloseModal = () => {
    if (saving) return
    setShowModal(false)
    setEditingCountry(null)
  }

  const handleChange = (event: React.ChangeEvent<any>) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (payload: any) => {
    if (!payload.country_name || !payload.country_code) {
      toast.error('Country name and code are required')
      return
    }

    setSaving(true)

    try {
      if (editingCountry) {
        const response = await countryApi.update(
          editingCountry.countryid,
          payload
        )

        if (response.success && response.data) {
          const updated = response.data
          
          // Ensure the status is properly handled (convert to number if needed)
          const updatedCountry = {
            ...updated,
            status: typeof updated.status === 'boolean' 
              ? (updated.status ? 1 : 0) 
              : Number(updated.status)
          }

          setCountries((prev) =>
            prev.map((item) =>
              item.countryid === updatedCountry.countryid ? updatedCountry : item
            )
          )

          toast.success('Country updated successfully')
        } else {
          toast.error(response.message || 'Update failed')
        }

      } else {
        const response = await countryApi.create(payload)

        if (response.success && response.data) {
          const created = response.data
          
          // Ensure the status is properly handled for new records too
          const createdCountry = {
            ...created,
            status: typeof created.status === 'boolean' 
              ? (created.status ? 1 : 0) 
              : Number(created.status)
          }

          setCountries((prev) => [createdCountry, ...prev])

          toast.success('Country added successfully')
        } else {
          toast.error(response.message || 'Create failed')
        }
      }

      setShowModal(false)
      setEditingCountry(null)
      setForm(defaultForm)

    } catch (error) {
      console.error('Failed to save country:', error)
      toast.error('Failed to save country')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (country: Country) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `You will not be able to recover country "${country.country_name}"!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3E97FF',
      confirmButtonText: 'Yes, delete it!',
    })

    if (result.isConfirmed) {
      setDeletingId(country.countryid)
      try {
        await countryApi.remove(country.countryid)
        setCountries((prev) => prev.filter((item) => item.countryid !== country.countryid))
        toast.success('Country deleted successfully')
      } catch (error) {
        console.error('Failed to delete country:', error)
        toast.error(typeof error === 'string' ? error : 'Failed to delete country')
      } finally {
        setDeletingId(null)
      }
    }
  }

  return (
    <>
      <TitleHelmet title="Country Master" />

      <Card className="mb-3">
        <Card.Body className="d-flex justify-content-between align-items-center">
          <div>
            <h4 className="mb-1">Country Master</h4>
            <p className="text-muted mb-0">Manage countries and their information.</p>
          </div>
          <Button variant="danger" onClick={handleOpenAddModal}>
            <span className="me-1">+</span> Add Country
          </Button>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Form.Control
              type="text"
              placeholder="Search countries..."
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
                  onClick={() => handleSort('country_name')}
                  style={{ cursor: 'pointer' }}
                  className="sortable-header"
                >
                  Country
                  {sortField === 'country_name' && (
                    <span className="ms-1">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </th>
                <th style={{ width: '140px' }}>Code</th>
                <th>Capital</th>
                <th style={{ width: '120px' }}>Status</th>
                <th style={{ width: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-4">
                    Loading countries...
                  </td>
                </tr>
              ) : filteredCountries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-4">
                    No countries found.
                  </td>
                </tr>
              ) : (
                paginatedCountries.map((country, index) => (
                  <tr key={country.countryid}>
                    <td>{(currentPage - 1) * pageSize + index + 1}</td>
                    <td className="fw-semibold">{country.country_name}</td>
                    <td>
                      <Badge bg="primary" className="px-3">
                        {country.country_code}
                      </Badge>
                    </td>
                    <td>{country.country_capital || '-'}</td>
                    <td>
                      <Badge bg={country.status === 1 ? 'success' : 'secondary'}>
                        {country.status === 1 ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleOpenEditModal(country)}>
                          <i className="fi fi-rr-edit" />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(country)}
                          disabled={deletingId === country.countryid}>
                          <i className="fi fi-rr-trash" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>

          {filteredCountries.length > 0 && (
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
        title={editingCountry ? 'Edit Country' : 'Add Country'}
        onSave={(values) => {
          handleSubmit(values)
        }}
        saving={saving}
        submitLabel={editingCountry ? 'Update' : 'Save'}
        Component={CountryForm}
        selectedItem={editingCountry} // Changed from 'form' to 'editingCountry'
      />
    </>
  )
}

export default CountryMaster