// index.tsx
import { useEffect, useMemo, useState } from 'react'
import { toast, Toaster } from 'react-hot-toast'
import Swal from 'sweetalert2'
import TitleHelmet from '@/components/Common/TitleHelmet'
import { Badge, Button, Card, Form, Table } from 'react-bootstrap'
import FormModal from '@/components/Common/models/FormModal'
import GuestForm, { GuestFormData } from './GuestForm'
import GuestService from '@/common/hotel/guest'
import { useAuthContext } from '@/common/context/useAuthContext'
import Pagination from '@/components/Common/Pagination'

type Guest = {
  guest_id: number
  fragment_id: number | null
  fragment_name?: string
  name: string
  organisation: string | null
  address: string | null
  city_id: number | null
  city_name?: string
  state_id: number | null
  state_name?: string
  country_id: number | null
  country_name?: string
  occupation: string | null
  post_held: string | null
  phone: string | null
  mobile: string
  email: string | null
  website: string | null
  purpose: string | null
  purpose_name?: string
  arrived_from: string | null
  arrived_name?: string
  departure_to: string | null
  departure_name?: string
  birthday: string | null
  anniversary: string | null
  gender: string
  nationality_id: number | null
  nationality?: string
  guest_type: string | null
  guest_type_name?: string
  credit_allowed: number
  company_id: number | null
  company_name?: string
  discount_percent?: number
  status: number
  hotelid: number
  created_at: string
  updated_at: string
  documents?: GuestDocument[]
}

type GuestDocument = {
  document_id: number
  guest_id: number
  document_type: string
  document_no: string
  front_side: string | null
  front_side_url?: string | null
  back_side: string | null
  back_side_url?: string | null
  // guest_photo column — only populated for document_type = 'Guest Photo'
  guest_photo?: string | null
  guest_photo_url?: string | null
  created_at: string
  updated_at: string
}

const defaultForm: GuestFormData = {
  fragment_id: null,
  name: '',
  organisation: '',
  address: '',
  city_id: null,
  state_id: null,
  country_id: null,
  occupation: '',
  post_held: '',
  phone: '',
  mobile: '',
  email: '',
  website: '',
  purpose: '',
  arrived_from: '',
  departure_to: '',
  birthday: '',
  anniversary: '',
  gender: 'Male',
  nationality_id: null,
  guest_type: '',
  credit_allowed: 0,
  company_id: null,
  discount_percent: 0,
  status: 1,
  guest_photo: null,
  guest_photo_url: null,
  documents: [],
}

const GuestMaster = () => {
  const { user } = useAuthContext()
  const hotelId = user?.hotelid

  const [guests, setGuests] = useState<Guest[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null)
  const [form, setForm] = useState<GuestFormData>(defaultForm)
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const loadGuests = async () => {
    if (!hotelId) {
      toast.error('Hotel ID not found. Please login again.')
      return
    }
    setLoading(true)
    try {
      const response = await GuestService.listGuests({ hotelid: hotelId })
      if (response.success) {
        setGuests(Array.isArray(response.data) ? response.data : [])
      } else {
        toast.error(response.message || 'Failed to load guests')
      }
    } catch (error: any) {
      console.error('Failed to load guests:', error)
      toast.error(error.message || 'Failed to load guests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (hotelId) loadGuests()
  }, [hotelId])

  const filteredGuests = useMemo(() => {
    let result = guests
    const query = search.trim().toLowerCase()
    if (query) {
      result = result.filter(g =>
        [g.name, g.mobile, g.email, g.organisation, g.city_name, g.company_name]
          .some(val => val?.toLowerCase().includes(query))
      )
    }
    if (sortField) {
      result = [...result].sort((a, b) => {
        const aVal = a[sortField as keyof Guest] ?? ''
        const bVal = b[sortField as keyof Guest] ?? ''
        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
        return 0
      })
    }
    return result
  }, [guests, search, sortField, sortDirection])

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredGuests.length / pageSize)), [filteredGuests.length, pageSize])
  const paginatedGuests = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredGuests.slice(start, start + pageSize)
  }, [filteredGuests, currentPage, pageSize])

  useEffect(() => { setCurrentPage(1) }, [search, pageSize])
  useEffect(() => { if (currentPage > totalPages) setCurrentPage(totalPages) }, [currentPage, totalPages])

  const handleSort = (field: string) => {
    if (sortField === field) setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDirection('asc') }
  }

  const handleOpenAddModal = () => {
    setEditingGuest(null)
    setForm({ ...defaultForm, hotelid: hotelId, created_by_id: user?.id })
    setShowModal(true)
  }

  const handleOpenEditModal = async (guest: Guest) => {
    setEditingGuest(guest)
    let documents: GuestDocument[] = []
    let guestPhotoUrl: string | null = null
    let guestPhotoPath: string | null = null

    try {
      const docRes = await GuestService.listDocuments(guest.guest_id)
      if (docRes.success && docRes.data) {
        documents = docRes.data as GuestDocument[]

        // Separate the guest photo record from regular documents
        const guestPhotoDoc = documents.find(d => d.document_type === 'Guest Photo')
        if (guestPhotoDoc) {
          // guest_photo column holds the file path; guest_photo_url is the full URL
          guestPhotoUrl = (guestPhotoDoc as any).guest_photo_url || null
          guestPhotoPath = (guestPhotoDoc as any).guest_photo || null
        }
      }
    } catch (error) {
      console.error('Failed to load documents:', error)
    }

    // Filter out the "Guest Photo" record from the documents tab — it's shown in the Photo tab
    const regularDocs = documents.filter(d => d.document_type !== 'Guest Photo')

    setForm({
      guest_id: guest.guest_id,
      fragment_id: guest.fragment_id,
      name: guest.name,
      organisation: guest.organisation || '',
      address: guest.address || '',
      city_id: guest.city_id,
      state_id: guest.state_id,
      country_id: guest.country_id,
      occupation: guest.occupation || '',
      post_held: guest.post_held || '',
      phone: guest.phone || '',
      mobile: guest.mobile,
      email: guest.email || '',
      website: guest.website || '',
      purpose: guest.purpose || '',
      purpose_id: (guest as any).purpose_id,
      arrived_from: guest.arrived_from || '',
      arrived_id: (guest as any).arrived_id,
      departure_to: guest.departure_to || '',
      departure_id: (guest as any).departure_id,
      birthday: guest.birthday || '',
      anniversary: guest.anniversary || '',
      gender: guest.gender,
      nationality_id: guest.nationality_id,
      guest_type: guest.guest_type || '',
      guest_type_id: (guest as any).guest_type_id,
      credit_allowed: guest.credit_allowed,
      company_id: guest.company_id,
      discount_percent: guest.discount_percent ?? 0,
      status: guest.status,
      hotelid: hotelId,
      updated_by_id: user?.id,
      // ── Guest photo ───────────────────────────────────────────────
      guest_photo: guestPhotoUrl || guestPhotoPath,
      guest_photo_url: guestPhotoUrl,
      // ── Regular ID documents ──────────────────────────────────────
      documents: regularDocs.map(d => ({
        document_id: d.document_id,
        document_type: String(d.document_type),
        document_number: d.document_no,
        front_side: d.front_side,
        back_side: d.back_side,
        front_side_url: d.front_side_url,
        back_side_url: d.back_side_url,
      })),
    })
    setShowModal(true)
  }

  const handleCloseModal = () => {
    if (saving) return
    setShowModal(false)
    setEditingGuest(null)
  }

  const handleSubmit = async (payload: GuestFormData) => {
    if (!payload.name || !payload.phone) {
      toast.error('Name and Phone No.1 is required')
      return
    }
    if (!hotelId) {
      toast.error('Hotel ID not found')
      return
    }

    setSaving(true)
    try {
      const apiPayload = {
        ...payload,
        hotelid: hotelId,
        credit_allowed: payload.credit_allowed ? 1 : 0,
        discount_percent: payload.discount_percent || 0,
      }

      let savedGuest: Guest
      if (editingGuest) {
        const updatePayload = { ...apiPayload }
        delete updatePayload.created_by_id
        const response = await GuestService.updateGuest(editingGuest.guest_id, updatePayload)
        if (!response.success || !response.data) {
          toast.error(response.message || 'Update failed')
          return
        }
        savedGuest = response.data
        setGuests(prev => prev.map(g => g.guest_id === savedGuest.guest_id ? savedGuest : g))
        toast.success('Guest updated')
      } else {
        const response = await GuestService.createGuest(apiPayload)
        if (!response.success || !response.data) {
          toast.error(response.message || 'Create failed')
          return
        }
        savedGuest = response.data
        setGuests(prev => [savedGuest, ...prev])
        toast.success('Guest added')
      }

      // ── Upload guest photo if a new capture exists (new guest only) ──
      // For existing guests, the photo is uploaded immediately in GuestForm's handlePhotoCapture.
      // For new guests, we upload here after the guest record is created.
      if (!editingGuest && payload.guest_photo && payload.guest_photo.startsWith('data:')) {
        try {
          await GuestService.uploadGuestPhoto(savedGuest.guest_id, payload.guest_photo)
        } catch (photoErr) {
          console.error('Failed to upload guest photo:', photoErr)
          toast.error('Guest saved but photo upload failed')
        }
      }

      // ── Save regular (non-photo) ID documents ────────────────────────
      if (payload.documents && payload.documents.length > 0) {
        if (editingGuest) {
          // Delete and re-create all non-photo documents
          const existingDocs = await GuestService.listDocuments(savedGuest.guest_id)
          if (existingDocs.success && existingDocs.data) {
            for (const doc of existingDocs.data as GuestDocument[]) {
              // Skip the Guest Photo record — it is managed separately
              if (doc.document_type === 'Guest Photo') continue
              await GuestService.deleteDocument(savedGuest.guest_id, doc.document_id)
            }
          }
        }

        for (const doc of payload.documents) {
          if (doc.document_type && doc.document_number) {
            const docPayload: any = {
              document_type: doc.document_type,
              document_no: doc.document_number,
            }

            if (doc._temp_front instanceof File) docPayload.front_side = doc._temp_front
            if (doc._temp_back instanceof File)  docPayload.back_side  = doc._temp_back

            await GuestService.createDocument(savedGuest.guest_id, docPayload)
          }
        }
      }

      setShowModal(false)
      setEditingGuest(null)
      setForm(defaultForm)
      await loadGuests()
    } catch (error) {
      console.error('Failed to save guest:', error)
      toast.error('Failed to save guest')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (guest: Guest) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `You will not be able to recover guest "${guest.name}"!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3E97FF',
      confirmButtonText: 'Yes, delete it!',
    })

    if (result.isConfirmed) {
      setDeletingId(guest.guest_id)
      try {
        await GuestService.deleteGuest(guest.guest_id)
        setGuests(prev => prev.filter(g => g.guest_id !== guest.guest_id))
        toast.success('Guest deleted')
      } catch (error) {
        console.error('Failed to delete guest:', error)
        toast.error('Failed to delete guest')
      } finally {
        setDeletingId(null)
      }
    }
  }

  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <TitleHelmet title="Guest Master" />

      <Card className="mb-3">
        <Card.Body className="d-flex justify-content-between align-items-center">
          <div>
            <h4 className="mb-1">Guest Master</h4>
            <p className="text-muted mb-0">Manage guest master data.</p>
          </div>
          <Button variant="danger" onClick={handleOpenAddModal}>
            <span className="me-1">+</span> Add Guest
          </Button>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Form.Control
              type="text"
              placeholder="Search guests..."
              style={{ maxWidth: 320 }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Table hover responsive className="mb-0">
            <thead className="table-light">
              <tr>
                <th style={{ width: '60px' }}>#</th>
                <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                  Name{sortField === 'name' && <span className="ms-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                </th>
                <th>Organisation</th>
                <th>Mobile</th>
                <th>Email</th>
                <th>City</th>
                <th>Country</th>
                <th>Company</th>
                <th>Type</th>
                <th>Discount %</th>
                <th style={{ width: '120px' }}>Status</th>
                <th style={{ width: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {!hotelId ? (
                <tr><td colSpan={12} className="text-center text-muted py-4">Please login to view guests.</td></tr>
              ) : loading ? (
                <tr><td colSpan={12} className="text-center text-muted py-4">Loading guests...</td></tr>
              ) : filteredGuests.length === 0 ? (
                <tr><td colSpan={12} className="text-center text-muted py-4">No guests found.</td></tr>
              ) : (
                paginatedGuests.map((guest, idx) => (
                  <tr key={guest.guest_id}>
                    <td>{(currentPage - 1) * pageSize + idx + 1}</td>
                    <td className="fw-semibold">{guest.name}</td>
                    <td>{guest.organisation || '-'}</td>
                    <td>{guest.phone || '-'}</td>
                    <td>{guest.email || '-'}</td>
                    <td>{guest.city_name || '-'}</td>
                    <td>{guest.country_name || '-'}</td>
                    <td>{guest.company_id === 0 ? 'Self' : guest.company_name || '-'}</td>
                    <td>{guest.guest_type || '-'}</td>
                    <td>{guest.discount_percent ?? 0}%</td>
                    <td>
                      <Badge bg={guest.status === 1 ? 'success' : 'secondary'}>
                        {guest.status === 1 ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button variant="outline-primary" size="sm" onClick={() => handleOpenEditModal(guest)}>
                          <i className="fi fi-rr-edit" />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(guest)}
                          disabled={deletingId === guest.guest_id}>
                          <i className="fi fi-rr-trash" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>

          {filteredGuests.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
              onPageChange={setCurrentPage}
            />
          )}
        </Card.Body>
      </Card>

      <FormModal
        size="lg"
        show={showModal}
        onHide={handleCloseModal}
        title={editingGuest ? 'Edit Guest' : 'Add Guest'}
        onSave={handleSubmit}
        saving={saving}
        submitLabel={editingGuest ? 'Update' : 'Save'}
        Component={GuestForm}
        selectedItem={form}
      />
    </>
  )
}

export default GuestMaster