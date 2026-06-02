import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'
import Swal from 'sweetalert2'
import TitleHelmet from '@/components/Common/TitleHelmet'
import travelAgentApi from '@/common/hotel/travelagent' // adjust path
import { Badge, Button, Card, Form, Table } from 'react-bootstrap'
import FormModal from '@/components/Common/models/FormModal'
import TravelAgentForm from './travelagentform'
import type { TravelAgentPayload } from '@/common/hotel/travelagent'


type TravelAgent = {
  agent_id: number
  agent_name: string
  agent_code: string | null
  contact_person: string | null
  mobile_no: string
  email: string | null
  address: string | null
  country_id: number | null
  country_name: string | null
  state_id: number | null
  state_name: string | null
  city_id: number | null
  city_name: string | null
  pincode: string | null
  gst_no: string | null
  pan_no: string | null
  commission_type: 'PERCENTAGE' | 'FIXED'
  commission_value: number
  service_fee: number
  cgst: number
  sgst: number
  igst: number
  cess: number
  tds: number
  tcs: number
  billing_type: 'PREPAID' | 'CREDIT'
  credit_days: number
  status: number
}

type TravelAgentFormData = {
  agent_name: string
  agent_code: string
  contact_person: string
  mobile_no: string
  email: string
  address: string
  country_id: number | null
  state_id: number | null
  city_id: number | null
  pincode: string
  gst_no: string
  pan_no: string
  commission_type: 'PERCENTAGE' | 'FIXED'
  commission_value: number
  service_fee: number
  cgst: number
  sgst: number
  igst: number
  cess: number
  tds: number
  tcs: number
  billing_type: 'PREPAID' | 'CREDIT'
  credit_days: number
  status: number
}

const TravelAgentMaster = () => {
  const [agents, setAgents] = useState<TravelAgent[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingAgent, setEditingAgent] = useState<TravelAgent | null>(null)
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const loadAgents = async () => {
    setLoading(true)
    try {
      const response = await travelAgentApi.list()
      console.log("API response:", response)

      if (response.success) {
        const normalizedData = Array.isArray(response.data) ? response.data : []
        setAgents(normalizedData)
      } else {
        toast.error(response.message || 'Failed to load travel agents')
        setAgents([])
      }
    } catch (error: any) {
      console.error('Failed to load travel agents:', error)
      toast.error(error.message || 'Failed to load travel agents')
      setAgents([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAgents()
  }, [])

  const filteredAgents = useMemo(() => {
    let result = agents

    const query = search.trim().toLowerCase()
    if (query) {
      result = result.filter((agent) =>
        [agent.agent_name, agent.agent_code, agent.mobile_no, agent.email].some((value) =>
          value?.toLowerCase().includes(query)
        )
      )
    }

    if (sortField) {
      result = [...result].sort((a, b) => {
        const aValue = a[sortField as keyof TravelAgent] ?? ''
        const bValue = b[sortField as keyof TravelAgent] ?? ''
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
        return 0
      })
    }

    return result
  }, [agents, search, sortField, sortDirection])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredAgents.length / pageSize))
  }, [filteredAgents.length, pageSize])

  const paginatedAgents = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredAgents.slice(startIndex, startIndex + pageSize)
  }, [filteredAgents, currentPage, pageSize])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, pageSize])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const handleOpenAddModal = () => {
    setEditingAgent(null)
    setShowModal(true)
  }

  const handleOpenEditModal = (agent: TravelAgent) => {
    setEditingAgent(agent)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    if (saving) return
    setShowModal(false)
    setEditingAgent(null)
  }

  const handleSubmit = async (payload: TravelAgentFormData) => {
    if (!payload.agent_name || !payload.mobile_no) {
      toast.error('Agent name and mobile number are required')
      return
    }

    setSaving(true)

    try {
      const normalizedPayload: TravelAgentPayload = {
        ...payload,
        commission_type:
          payload.commission_type === 'PERCENTAGE' || payload.commission_type === 'FIXED'
            ? payload.commission_type
            : undefined,
      }

      if (editingAgent) {
        const response = await travelAgentApi.update(editingAgent.agent_id, normalizedPayload)

        if (response.success) {
          toast.success('Travel agent updated successfully')
          await loadAgents() // Reload full list so country_name, state_name, city_name are populated
        } else {
          toast.error(response.message || 'Update failed')
          return
        }
      } else {
        const response = await travelAgentApi.create(normalizedPayload)

        if (response.success) {
          toast.success('Travel agent added successfully')
          await loadAgents() // Reload full list so country_name, state_name, city_name are populated
        } else {
          toast.error(response.message || 'Create failed')
          return
        }
      }

      setShowModal(false)
      setEditingAgent(null)
    } catch (error) {
      console.error('Failed to save travel agent:', error)
      toast.error('Failed to save travel agent')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (agent: TravelAgent) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `You will not be able to recover travel agent "${agent.agent_name}"!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3E97FF',
      confirmButtonText: 'Yes, delete it!',
    })

    if (result.isConfirmed) {
      setDeletingId(agent.agent_id)
      try {
        await travelAgentApi.remove(agent.agent_id)
        setAgents((prev) => prev.filter((item) => item.agent_id !== agent.agent_id))
        toast.success('Travel agent deleted successfully')
      } catch (error) {
        console.error('Failed to delete travel agent:', error)
        toast.error(typeof error === 'string' ? error : 'Failed to delete travel agent')
      } finally {
        setDeletingId(null)
      }
    }
  }

  return (
    <>
      <TitleHelmet title="Travel Agent Master" />

      <Card className="mb-3">
        <Card.Body className="d-flex justify-content-between align-items-center">
          <div>
            <h4 className="mb-1">Travel Agent Master</h4>
            <p className="text-muted mb-0">Manage travel agents and their information.</p>
          </div>
          <Button variant="danger" onClick={handleOpenAddModal}>
            <span className="me-1">+</span> Add Travel Agent
          </Button>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Form.Control
              type="text"
              placeholder="Search travel agents..."
              style={{ maxWidth: 280 }}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <Table hover responsive className="mb-0">
            <thead className="table-light">
              <tr>
                <th style={{ width: '60px' }}>#</th>
                <th onClick={() => handleSort('agent_name')} style={{ cursor: 'pointer' }}>
                  Agent Name
                  {sortField === 'agent_name' && (
                    <span className="ms-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th style={{ width: '140px' }}>Code</th>
                <th>Contact Person</th>
                <th>Mobile</th>
                <th>Country</th>
                <th>State</th>
                <th>City</th>
                <th style={{ width: '120px' }}>Status</th>
                <th style={{ width: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="text-center text-muted py-4">
                    Loading travel agents...
                  </td>
                </tr>
              ) : filteredAgents.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center text-muted py-4">
                    No travel agents found.
                  </td>
                </tr>
              ) : (
                paginatedAgents.map((agent, index) => (
                  <tr key={agent.agent_id}>
                    <td>{(currentPage - 1) * pageSize + index + 1}</td>
                    <td className="fw-semibold">{agent.agent_name}</td>
                    <td>
                      <Badge bg="primary" className="px-3">
                        {agent.agent_code || '-'}
                      </Badge>
                    </td>
                    <td>{agent.contact_person || '-'}</td>
                    <td>{agent.mobile_no}</td>
                    <td>{agent.country_name || '-'}</td>
                    <td>{agent.state_name || '-'}</td>
                    <td>{agent.city_name || '-'}</td>
                    <td>
                      <Badge bg={agent.status === 1 ? 'success' : 'secondary'}>
                        {agent.status === 1 ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleOpenEditModal(agent)}>
                          <i className="fi fi-rr-edit" />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(agent)}
                          disabled={deletingId === agent.agent_id}>
                          <i className="fi fi-rr-trash" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>

          {filteredAgents.length > 0 && (
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
        title={editingAgent ? 'Edit Travel Agent' : 'Add Travel Agent'}
        onSave={(values) => {
          handleSubmit(values as TravelAgentFormData)
        }}
        saving={saving}
        submitLabel={editingAgent ? 'Update' : 'Save'}
        Component={TravelAgentForm}
        selectedItem={editingAgent}
      />
    </>
  )
}

export default TravelAgentMaster