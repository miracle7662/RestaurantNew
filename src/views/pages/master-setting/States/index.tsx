import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'
import Swal from 'sweetalert2'
import TitleHelmet from '@/components/Common/TitleHelmet'
import stateApi from '@/common/hotel/states'
import countryApi from '@/common/hotel/countries'
import { Badge, Button, Card, Form, Table } from 'react-bootstrap'
import FormModal from '@/components/Common/models/FormModal'
import StateForm from './StateForm'

type State = {
  stateid: number
  state_name: string
  state_code: string
  state_capital?: string
  countryid: number
  status: number
}

type StateFormData = {
  state_name: string
  state_code: string
  state_capital: string
  countryid: number
  status: number
}

const defaultForm: StateFormData = {
  state_name: '',
  state_code: '',
  state_capital: '',
  countryid: 0,
  status: 1,
}

const StateMaster = () => {
  const [states, setStates] = useState<State[]>([])
  const [countries, setCountries] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingState, setEditingState] = useState<State | null>(null)
  const [form, setForm] = useState<StateFormData>(defaultForm)
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const loadStates = async () => {
    setLoading(true)
    try {
      const response = await stateApi.list()

      console.log("API response:", response)

      if (response.success) {
        setStates(Array.isArray(response.data) ? response.data : [])
      } else {
        toast.error(response.message || 'Failed to load states')
        setStates([])
      }
    } catch (error: any) {
      console.error('Failed to load states:', error)
      toast.error(error.message || 'Failed to load states')
      setStates([])
    } finally {
      setLoading(false)
    }
  }

  const loadCountries = async () => {
    try {
      const response = await countryApi.list()
      if (response.success && Array.isArray(response.data)) {
        setCountries(response.data)
      }
    } catch (error) {
      console.error('Failed to load countries:', error)
    }
  }

  useEffect(() => {
    loadStates()
    loadCountries()
  }, [])

  const getCountryName = (countryid: number) => {
    const country = countries.find(c => c.countryid === countryid)
    return country ? country.country_name : '-'
  }

  const filteredStates = useMemo(() => {
    let result = states

    // Apply search filter
    const query = search.trim().toLowerCase()
    if (query) {
      result = result.filter((state) =>
        [state.state_name, state.state_code, state.state_capital ?? '', getCountryName(state.countryid)].some((value) =>
          value.toLowerCase().includes(query),
        ),
      )
    }

    // Apply sorting
    if (sortField) {
      result = [...result].sort((a, b) => {
        let aValue: any = ''
        let bValue: any = ''
        
        if (sortField === 'countryid') {
          aValue = getCountryName(a.countryid)
          bValue = getCountryName(b.countryid)
        } else {
          aValue = a[sortField as keyof State] ?? ''
          bValue = b[sortField as keyof State] ?? ''
        }
        
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
        return 0
      })
    }

    return result
  }, [states, search, sortField, sortDirection, countries])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredStates.length / pageSize))
  }, [filteredStates.length, pageSize])

  const paginatedStates = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredStates.slice(startIndex, startIndex + pageSize)
  }, [filteredStates, currentPage, pageSize])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, pageSize])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const handleOpenAddModal = () => {
    setEditingState(null)
    setForm(defaultForm)
    setShowModal(true)
  }

  const handleOpenEditModal = (state: State) => {
    setEditingState(state)
    setForm({
      state_name: state.state_name,
      state_code: state.state_code,
      state_capital: state.state_capital ?? '',
      countryid: state.countryid,
      status: state.status,
    })
    setShowModal(true)
  }
  console.log('form', form)

  const handleCloseModal = () => {
    if (saving) return
    setShowModal(false)
    setEditingState(null)
  }

  const handleChange = (event: React.ChangeEvent<any>) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

const handleSubmit = async (payload: any) => {
  if (!payload.state_name || !payload.state_code || !payload.countryid) {
    toast.error('State name, code, and country are required')
    return
  }

  setSaving(true)

  try {
    let response

    if (editingState) {
      response = await stateApi.update(editingState.stateid, payload)

      if (!response.success) {
        toast.error(response.message || 'Update failed')
        return
      }

      toast.success('State updated')
    } else {
      response = await stateApi.create(payload)

      if (!response.success) {
        toast.error(response.message || 'Create failed')
        return
      }

      toast.success('State added')
    }

    // ✅ CRITICAL FIX (reload fresh data)
    await loadStates()

    setShowModal(false)
    setEditingState(null)
    setForm(defaultForm)

  } catch (error) {
    console.error('Failed to save state:', error)
    toast.error('Failed to save state')
  } finally {
    setSaving(false)
  }
}

const handleDelete = async (state: State) => {
  const result = await Swal.fire({
    title: 'Are you sure?',
    text: `You will not be able to recover state "${state.state_name}"!`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3E97FF',
    confirmButtonText: 'Yes, delete it!',
  })

  if (!result.isConfirmed) return

  setDeletingId(state.stateid)

  try {
    await stateApi.remove(state.stateid)

    toast.success('State deleted successfully')

    // ✅ reload list instead of manual filter
    await loadStates()

  } catch (error) {
    console.error('Failed to delete state:', error)
    toast.error('Failed to delete state')
  } finally {
    setDeletingId(null)
  }
}

  return (
    <>
      <TitleHelmet title="State Master" />

      <Card className="mb-3">
        <Card.Body className="d-flex justify-content-between align-items-center">
          <div>
            <h4 className="mb-1">State Master</h4>
            <p className="text-muted mb-0">Manage states and their information.</p>
          </div>
          <Button variant="danger" onClick={handleOpenAddModal}>
            <span className="me-1">+</span> Add State
          </Button>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Form.Control
              type="text"
              placeholder="Search states..."
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
                  onClick={() => handleSort('state_name')}
                  style={{ cursor: 'pointer' }}
                  className="sortable-header"
                >
                  State
                  {sortField === 'state_name' && (
                    <span className="ms-1">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </th>
                <th style={{ width: '140px' }}>Code</th>
                <th>Capital</th>
                <th 
                  onClick={() => handleSort('countryid')}
                  style={{ cursor: 'pointer' }}
                  className="sortable-header"
                >
                  Country
                  {sortField === 'countryid' && (
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
                  <td colSpan={7} className="text-center text-muted py-4">
                    Loading states...
                  </td>
                </tr>
              ) : filteredStates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted py-4">
                    No states found.
                  </td>
                </tr>
              ) : (
                paginatedStates.map((state, index) => (
                  <tr key={state.stateid}>
                    <td>{(currentPage - 1) * pageSize + index + 1}</td>
                    <td className="fw-semibold">{state.state_name}</td>
                    <td>
                      <Badge bg="primary" className="px-3">
                        {state.state_code}
                      </Badge>
                    </td>
                    <td>{state.state_capital || '-'}</td>
                    <td>{getCountryName(state.countryid)}</td>
                    <td>
                      <Badge bg={state.status === 1 ? 'success' : 'secondary'}>
                        {state.status === 1 ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleOpenEditModal(state)}>
                          <i className="fi fi-rr-edit" />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(state)}
                          disabled={deletingId === state.stateid}>
                          <i className="fi fi-rr-trash" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>

          {filteredStates.length > 0 && (
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
        title={editingState ? 'Edit State' : 'Add State'}
        onSave={(values) => {
          handleSubmit(values)
        }}
        saving={saving}
        submitLabel={editingState ? 'Update' : 'Save'}
        Component={StateForm}
        selectedItem={form}
      />
    </>
  )
}

export default StateMaster
