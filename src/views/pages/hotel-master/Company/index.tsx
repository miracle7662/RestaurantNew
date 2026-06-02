import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'
import Swal from 'sweetalert2'
import TitleHelmet from '@/components/Common/TitleHelmet'
import { Badge, Button, Card, Form, Table } from 'react-bootstrap'
import FormModal from '@/components/Common/models/FormModal'
import CompanyForm, { CompanyFormData } from './CompanyForm'
import CompanyService from '@/common/hotel/company'
import { useAuthContext } from '@/common/context/useAuthContext'

type Company = {
  company_id: number
  company_name: string
  establishment_date: string | null
  address: string | null
  state_id: number | null
  city_id: number | null
  country_id: number | null
  state_name?: string
  city_name?: string
  country_name?: string
  mobile1: string
  mobile2: string | null
  gst_no: string | null
  email: string | null
  website: string | null
  booking_contact_name: string | null
  booking_contact_mobile: string | null
  booking_contact_phone: string | null
  corresponding_contact_name: string | null
  corresponding_contact_mobile: string | null
  corresponding_contact_phone: string | null
  credit_limit: number | null
  credit_allowed: number
  company_info: string | null
  have_discount: number
  status: number
  hotelid: number  // Changed from mst_hotelid to hotelid
  created_by_id: number | null
  created_at: string
  updated_by_id: number | null
  updated_at: string
}

const defaultForm: CompanyFormData = {
  company_name: '',
  establishment_date: '',
  address: '',
  state_id: null,
  city_id: null,
  country_id: null,
  mobile1: '',
  mobile2: '',
  gst_no: '',
  email: '',
  website: '',
  booking_contact_name: '',
  booking_contact_mobile: '',
  booking_contact_phone: '',
  corresponding_contact_name: '',
  corresponding_contact_mobile: '',
  corresponding_contact_phone: '',
  credit_limit: '',
  credit_allowed: 0,
  company_info: '',
  have_discount: 0,
  status: 1,
}

const CompanyMaster = () => {
  const { user } = useAuthContext()
  const hotelId = user?.hotel_id

  const [companies, setCompanies] = useState<Company[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [form, setForm] = useState<CompanyFormData>(defaultForm)
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const loadCompanies = async () => {
    if (!hotelId) {
      toast.error('Hotel ID not found. Please login again.')
      return
    }
    setLoading(true)
    try {
      const response = await CompanyService.list({ hotelid: hotelId }) // Changed from mst_hotelid to hotelid
      if (response.success) {
        setCompanies(Array.isArray(response.data) ? response.data : [])
      } else {
        toast.error(response.message || 'Failed to load companies')
        setCompanies([])
      }
    } catch (error: any) {
      console.error('Failed to load companies:', error)
      toast.error(error.message || 'Failed to load companies')
      setCompanies([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (hotelId) {
      loadCompanies()
    }
  }, [hotelId])

  const filteredCompanies = useMemo(() => {
    let result = companies

    const query = search.trim().toLowerCase()
    if (query) {
      result = result.filter((company) =>
        [
          company.company_name,
          company.mobile1,
          company.email,
          company.state_name,
          company.city_name,
        ].some((value) => value?.toLowerCase().includes(query))
      )
    }

    if (sortField) {
      result = [...result].sort((a, b) => {
        const aValue = a[sortField as keyof Company] ?? ''
        const bValue = b[sortField as keyof Company] ?? ''
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
        return 0
      })
    }

    return result
  }, [companies, search, sortField, sortDirection])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredCompanies.length / pageSize)),
    [filteredCompanies.length, pageSize]
  )

  const paginatedCompanies = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredCompanies.slice(start, start + pageSize)
  }, [filteredCompanies, currentPage, pageSize])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, pageSize])

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const handleOpenAddModal = () => {
    setEditingCompany(null)
    setForm({
      ...defaultForm,
      hotelid: hotelId, // Changed from mst_hotelid to hotelid
      created_by_id: user?.id,
    })
    setShowModal(true)
  }

  const handleOpenEditModal = (company: Company) => {
    setEditingCompany(company)
    setForm({
      company_id: company.company_id,
      company_name: company.company_name,
      establishment_date: company.establishment_date || '',
      address: company.address || '',
      state_id: company.state_id,
      city_id: company.city_id,
      country_id: company.country_id,
      mobile1: company.mobile1,
      mobile2: company.mobile2 || '',
      gst_no: company.gst_no || '',
      email: company.email || '',
      website: company.website || '',
      booking_contact_name: company.booking_contact_name || '',
      booking_contact_mobile: company.booking_contact_mobile || '',
      booking_contact_phone: company.booking_contact_phone || '',
      corresponding_contact_name: company.corresponding_contact_name || '',
      corresponding_contact_mobile: company.corresponding_contact_mobile || '',
      corresponding_contact_phone: company.corresponding_contact_phone || '',
      credit_limit: company.credit_limit?.toString() || '',
      credit_allowed: company.credit_allowed,
      company_info: company.company_info || '',
      have_discount: company.have_discount,
      status: company.status,
      hotelid: hotelId, // Changed from mst_hotelid to hotelid
      updated_by_id: user?.id,
    })
    setShowModal(true)
  }

  const handleCloseModal = () => {
    if (saving) return
    setShowModal(false)
    setEditingCompany(null)
  }

  const handleSubmit = async (payload: CompanyFormData) => {
    if (!payload.company_name || !payload.mobile1) {
      toast.error('Company name and mobile 1 are required')
      return
    }

    if (!hotelId) {
      toast.error('Hotel ID not found. Please login again.')
      return
    }

    setSaving(true)

    try {
      const apiPayload = {
        ...payload,
        hotelid: hotelId, // Changed from mst_hotelid to hotelid
        created_by_id: payload.created_by_id || user?.id,
        updated_by_id: payload.updated_by_id || user?.id,
        // Ensure checkbox values are properly converted to numbers
        credit_allowed: payload.credit_allowed === 1 ? 1 : 0,
        have_discount: payload.have_discount === 1 ? 1 : 0,
        credit_limit: payload.credit_limit ? parseFloat(payload.credit_limit) : 0,
      }

      if (editingCompany) {
        const updatePayload = { ...apiPayload }
        delete updatePayload.created_by_id

        const response = await CompanyService.update(editingCompany.company_id, updatePayload)
        if (response.success && response.data) {
          setCompanies((prev) =>
            prev.map((item) =>
              item.company_id === response.data!.company_id ? response.data! : item
            )
          )
          toast.success('Company updated successfully')
        } else {
          toast.error(response.message || 'Update failed')
        }
      } else {
        const response = await CompanyService.create(apiPayload)
        if (response.success && response.data) {
          setCompanies((prev) => [response.data!, ...prev])
          toast.success('Company added successfully')
        } else {
          toast.error(response.message || 'Create failed')
        }
      }

      setShowModal(false)
      setEditingCompany(null)
      setForm(defaultForm)
    } catch (error) {
      console.error('Failed to save company:', error)
      toast.error('Failed to save company')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (company: Company) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `You will not be able to recover company "${company.company_name}"!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3E97FF',
      confirmButtonText: 'Yes, delete it!',
    })

    if (result.isConfirmed) {
      setDeletingId(company.company_id)
      try {
        await CompanyService.remove(company.company_id)
        setCompanies((prev) => prev.filter((item) => item.company_id !== company.company_id))
        toast.success('Company deleted successfully')
      } catch (error) {
        console.error('Failed to delete company:', error)
        toast.error(typeof error === 'string' ? error : 'Failed to delete company')
      } finally {
        setDeletingId(null)
      }
    }
  }

  return (
    <>
      <TitleHelmet title="Company Master" />

      <Card className="mb-3">
        <Card.Body className="d-flex justify-content-between align-items-center">
          <div>
            <h4 className="mb-1">Company Master</h4>
            <p className="text-muted mb-0">Manage company master data.</p>
          </div>
          <Button variant="danger" onClick={handleOpenAddModal}>
            <span className="me-1">+</span> Add Company
          </Button>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Form.Control
              type="text"
              placeholder="Search companies..."
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
                  onClick={() => handleSort('company_name')}
                  style={{ cursor: 'pointer' }}
                  className="sortable-header"
                >
                  Name
                  {sortField === 'company_name' && (
                    <span className="ms-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th>State</th>
                <th>City</th>
                <th>Country</th>
                <th>Mobile 1</th>
                <th>Email</th>
                <th style={{ width: '120px' }}>Status</th>
                <th style={{ width: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center text-muted py-4">
                    Loading companies...
                  </td>
                </tr>
              ) : filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center text-muted py-4">
                    No companies found.
                  </td>
                </tr>
              ) : (
                paginatedCompanies.map((company, index) => (
                  <tr key={company.company_id}>
                    <td>{(currentPage - 1) * pageSize + index + 1}</td>
                    <td className="fw-semibold">{company.company_name}</td>
                    <td>{company.state_name || '-'}</td>
                    <td>{company.city_name || '-'}</td>
                    <td>{company.country_name || '-'}</td>
                    <td>{company.mobile1 || '-'}</td>
                    <td>{company.email || '-'}</td>
                    <td>
                      <Badge bg={company.status === 1 ? 'success' : 'secondary'}>
                        {company.status === 1 ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleOpenEditModal(company)}
                        >
                          <i className="fi fi-rr-edit" />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(company)}
                          disabled={deletingId === company.company_id}
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

          {filteredCompanies.length > 0 && (
            <div className="d-flex justify-content-between align-items-center mt-3">
              <Form.Select
                style={{ maxWidth: 80 }}
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </Form.Select>
              <div className="d-flex align-items-center gap-2">
                <Button
                  variant="outline-light"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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
        size="lg"
        show={showModal}
        onHide={handleCloseModal}
        title={editingCompany ? 'Edit Company' : 'Add Company'}
        onSave={handleSubmit}
        saving={saving}
        submitLabel={editingCompany ? 'Update' : 'Save'}
        Component={CompanyForm}
        selectedItem={form}
      />
    </>
  )
}

export default CompanyMaster