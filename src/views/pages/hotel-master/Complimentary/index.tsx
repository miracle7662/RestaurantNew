import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'
import Swal from 'sweetalert2'
import TitleHelmet from '@/components/Common/TitleHelmet';
import Pagination from '@/components/Common/Pagination';  
import { Badge, Button, Card, Form, Table } from 'react-bootstrap'
import FormModal from '@/components/Common/models/FormModal'
import ComplimentaryForm from './ComplimentaryForm'

type Complimentary = {
  complimentary_id: number
  item_name: string
  item_type: string
  description?: string
  item_code?: string
  uom?: string
  hotel_id: number
  hotel_name?: string
  quantity_per_room: number
  availability_type: string
  cost_price?: number
  status: number
  display_on_website: number
  display_on_ota: number
  display_name?: string
  created_at?: string
  updated_at?: string
}

type ComplimentaryFormData = {
  complimentary_id?: number
  item_name: string
  item_type: string
  description: string
  item_code: string
  uom: string
  hotel_id: string
  quantity_per_room: string
  availability_type: string
  start_date: string
  end_date: string
  day_of_week: string[]
  start_time: string
  end_time: string
  seasonal: number
  max_quantity_per_stay: string
  per_adult: number
  per_child: number
  min_stay_nights: string
  advance_booking_days: string
  guest_type: string
  loyalty_tier: string
  age_restriction: string
  delivery_method: string
  delivery_time: string
  instructions: string
  cost_price: string
  account_code: string
  taxable: number
  tax_rate: string
  status: number
  display_order: string
  terms_conditions: string
  display_on_website: number
  display_on_ota: number
  display_name: string
  highlight_feature: number
  track_usage: number
  requires_checkout_confirmation: number
}

const defaultForm: ComplimentaryFormData = {
  item_name: '',
  item_type: '',
  description: '',
  item_code: '',
  uom: '',
  hotel_id: '',
  quantity_per_room: '',
  availability_type: 'always',
  start_date: '',
  end_date: '',
  day_of_week: [],
  start_time: '',
  end_time: '',
  seasonal: 0,
  max_quantity_per_stay: '',
  per_adult: 0,
  per_child: 0,
  min_stay_nights: '',
  advance_booking_days: '',
  guest_type: 'all',
  loyalty_tier: '',
  age_restriction: '',
  delivery_method: 'in_room',
  delivery_time: '',
  instructions: '',
  cost_price: '',
  account_code: '',
  taxable: 0,
  tax_rate: '',
  status: 1,
  display_order: '',
  terms_conditions: '',
  display_on_website: 1,
  display_on_ota: 1,
  display_name: '',
  highlight_feature: 0,
  track_usage: 0,
  requires_checkout_confirmation: 0,
}

// Mock data for complimentary items
const mockComplimentary: Complimentary[] = [
  {
    complimentary_id: 1,
    item_name: 'Welcome Drink',
    item_type: 'beverage',
    description: 'Complimentary welcome drink on arrival',
    item_code: 'WD001',
    uom: 'piece',
    hotel_id: 1,
    hotel_name: 'Grand Hotel',
    quantity_per_room: 2,
    availability_type: 'always',
    cost_price: 5.99,
    status: 1,
    display_on_website: 1,
    display_on_ota: 1,
    display_name: 'Welcome Cocktail',
    created_at: '2023-01-15',
    updated_at: '2023-12-01',
  },
  {
    complimentary_id: 2,
    item_name: 'Breakfast Buffet',
    item_type: 'food',
    description: 'Complimentary breakfast for all guests',
    item_code: 'BF001',
    uom: 'portion',
    hotel_id: 2,
    hotel_name: 'Seaside Resort',
    quantity_per_room: 1,
    availability_type: 'time_based',
    cost_price: 12.50,
    status: 1,
    display_on_website: 1,
    display_on_ota: 0,
    display_name: 'Free Breakfast',
    created_at: '2023-02-10',
    updated_at: '2023-11-15',
  },
  {
    complimentary_id: 3,
    item_name: 'Airport Transfer',
    item_type: 'service',
    description: 'Free airport pickup and drop',
    item_code: 'AT001',
    uom: 'service',
    hotel_id: 1,
    hotel_name: 'Grand Hotel',
    quantity_per_room: 1,
    availability_type: 'conditional',
    cost_price: 25.00,
    status: 0,
    display_on_website: 1,
    display_on_ota: 1,
    display_name: 'Airport Shuttle',
    created_at: '2023-03-05',
    updated_at: '2023-10-20',
  },
  {
    complimentary_id: 4,
    item_name: 'Spa Access',
    item_type: 'amenity',
    description: 'Complimentary access to spa facilities',
    item_code: 'SA001',
    uom: 'hour',
    hotel_id: 3,
    hotel_name: 'Mountain View',
    quantity_per_room: 2,
    availability_type: 'always',
    cost_price: 15.00,
    status: 1,
    display_on_website: 1,
    display_on_ota: 1,
    display_name: 'Free Spa',
    created_at: '2023-04-12',
    updated_at: '2023-09-18',
  },
  {
    complimentary_id: 5,
    item_name: 'WiFi Access',
    item_type: 'service',
    description: 'Free high-speed WiFi',
    item_code: 'WF001',
    uom: 'day',
    hotel_id: 2,
    hotel_name: 'Seaside Resort',
    quantity_per_room: 1,
    availability_type: 'always',
    cost_price: 3.50,
    status: 1,
    display_on_website: 1,
    display_on_ota: 1,
    display_name: 'Free WiFi',
    created_at: '2023-05-20',
    updated_at: '2023-08-25',
  },
]

const ComplimentaryMaster = () => {
  const [complimentaryItems, setComplimentaryItems] = useState<Complimentary[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Complimentary | null>(null)
  const [form, setForm] = useState<ComplimentaryFormData>(defaultForm)
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  const loadComplimentaryItems = async () => {
    setLoading(true)
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))
      setComplimentaryItems([...mockComplimentary])
    } catch (error) {
      console.error('Failed to load complimentary items:', error)
      toast.error('Failed to load complimentary items')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadComplimentaryItems()
  }, [])

  const filteredComplimentary = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return complimentaryItems
    return complimentaryItems.filter((item) =>
      [item.item_name, item.description, item.hotel_name, item.item_code, item.display_name]
        .map((value) => (value ?? '').toLowerCase())
        .some((value) => value.includes(query)),
    )
  }, [complimentaryItems, search])

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredComplimentary.length / pageSize))
  }, [filteredComplimentary.length, pageSize])

  const paginatedComplimentary = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredComplimentary.slice(startIndex, startIndex + pageSize)
  }, [filteredComplimentary, currentPage, pageSize])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, pageSize])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const handleOpenAddModal = () => {
    setEditing(null)
    setForm(defaultForm)
    setShowModal(true)
  }

  const handleOpenEditModal = (complimentary: Complimentary) => {
    setEditing(complimentary)
    setForm({
      complimentary_id: complimentary.complimentary_id,
      item_name: complimentary.item_name ?? '',
      item_type: complimentary.item_type ?? '',
      description: complimentary.description ?? '',
      item_code: complimentary.item_code ?? '',
      uom: complimentary.uom ?? '',
      hotel_id: complimentary.hotel_id ? String(complimentary.hotel_id) : '',
      quantity_per_room: complimentary.quantity_per_room ? String(complimentary.quantity_per_room) : '',
      availability_type: complimentary.availability_type ?? 'always',
      start_date: '',
      end_date: '',
      day_of_week: [],
      start_time: '',
      end_time: '',
      seasonal: 0,
      max_quantity_per_stay: '',
      per_adult: 0,
      per_child: 0,
      min_stay_nights: '',
      advance_booking_days: '',
      guest_type: 'all',
      loyalty_tier: '',
      age_restriction: '',
      delivery_method: 'in_room',
      delivery_time: '',
      instructions: '',
      cost_price: complimentary.cost_price ? String(complimentary.cost_price) : '',
      account_code: '',
      taxable: 0,
      tax_rate: '',
      status: complimentary.status ?? 1,
      display_order: '',
      terms_conditions: '',
      display_on_website: complimentary.display_on_website ?? 1,
      display_on_ota: complimentary.display_on_ota ?? 1,
      display_name: complimentary.display_name ?? '',
      highlight_feature: 0,
      track_usage: 0,
      requires_checkout_confirmation: 0,
    })
    setShowModal(true)
  }

  const handleCloseModal = () => {
    if (saving) return
    setShowModal(false)
    setEditing(null)
  }

  const handleSubmit = async (payload: ComplimentaryFormData) => {
    if (!payload.item_name) {
      toast.error('Item name is required')
      return
    }

    if (!payload.item_type) {
      toast.error('Item type is required')
      return
    }

    if (!payload.hotel_id) {
      toast.error('Hotel is required')
      return
    }

    if (!payload.quantity_per_room) {
      toast.error('Quantity per room is required')
      return
    }

    setSaving(true)
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      if (editing) {
        // Update existing complimentary item
        const updatedComplimentary: Complimentary = {
          ...editing,
          item_name: payload.item_name,
          item_type: payload.item_type,
          description: payload.description,
          item_code: payload.item_code,
          uom: payload.uom,
          hotel_id: parseInt(payload.hotel_id),
          quantity_per_room: parseInt(payload.quantity_per_room),
          availability_type: payload.availability_type,
          cost_price: payload.cost_price ? parseFloat(payload.cost_price) : undefined,
          status: payload.status,
          display_on_website: payload.display_on_website,
          display_on_ota: payload.display_on_ota,
          display_name: payload.display_name,
          updated_at: new Date().toISOString().split('T')[0],
        }
        
        setComplimentaryItems((prev) =>
          prev.map((item) => (item.complimentary_id === editing.complimentary_id ? updatedComplimentary : item)),
        )
        toast.success('Complimentary item updated successfully')
      } else {
        // Create new complimentary item
        const newComplimentary: Complimentary = {
          complimentary_id: Math.max(...complimentaryItems.map(c => c.complimentary_id), 0) + 1,
          item_name: payload.item_name,
          item_type: payload.item_type,
          description: payload.description,
          item_code: payload.item_code,
          uom: payload.uom,
          hotel_id: parseInt(payload.hotel_id),
          hotel_name: 'Hotel ' + payload.hotel_id,
          quantity_per_room: parseInt(payload.quantity_per_room),
          availability_type: payload.availability_type,
          cost_price: payload.cost_price ? parseFloat(payload.cost_price) : undefined,
          status: payload.status,
          display_on_website: payload.display_on_website,
          display_on_ota: payload.display_on_ota,
          display_name: payload.display_name,
          created_at: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString().split('T')[0],
        }
        
        setComplimentaryItems((prev) => [newComplimentary, ...prev])
        toast.success('Complimentary item created successfully')
      }

      setShowModal(false)
      setEditing(null)
      setForm(defaultForm)
    } catch (error) {
      console.error('Failed to save complimentary item:', error)
      toast.error('Failed to save complimentary item')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (complimentary: Complimentary) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `You will not be able to recover "${complimentary.item_name}"!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3E97FF',
      confirmButtonText: 'Yes, delete it!',
    })

    if (result.isConfirmed) {
      setDeletingId(complimentary.complimentary_id)
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500))
        
        setComplimentaryItems((prev) =>
          prev.filter((item) => item.complimentary_id !== complimentary.complimentary_id),
        )
        toast.success('Complimentary item deleted successfully')
      } catch (error) {
        console.error('Failed to delete complimentary item:', error)
        toast.error('Failed to delete complimentary item')
      } finally {
        setDeletingId(null)
      }
    }
  }

  const getItemTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      food: 'primary',
      beverage: 'success',
      service: 'info',
      amenity: 'warning',
      other: 'secondary',
    }
    return colors[type] || 'secondary'
  }

  return (
    <>
      <TitleHelmet title="Complimentary Master" />

      <Card className="mb-3">
        <Card.Body className="d-flex justify-content-between align-items-center">
          <div>
            <h4 className="mb-1">Complimentary Master</h4>
            <p className="text-muted mb-0">Manage complimentary items and services.</p>
          </div>
          <Button variant="danger" onClick={handleOpenAddModal}>
            <span className="me-1">+</span> Add Complimentary Item
          </Button>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Form.Control
              type="text"
              placeholder="Search complimentary items..."
              style={{ maxWidth: 320 }}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <Table hover responsive className="mb-0">
            <thead className="table-light">
              <tr>
                <th style={{ width: '60px' }}>#</th>
                <th>Item Name</th>
                <th>Type</th>
                <th>Item Code</th>
                <th>Hotel</th>
                <th>Qty/Room</th>
                <th>Cost</th>
                <th style={{ width: '120px' }}>Status</th>
                <th style={{ width: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center text-muted py-4">
                    Loading complimentary items...
                  </td>
                </tr>
              ) : filteredComplimentary.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center text-muted py-4">
                    No complimentary items found.
                  </td>
                </tr>
              ) : (
                paginatedComplimentary.map((item, index) => (
                  <tr key={item.complimentary_id}>
                    <td>{(currentPage - 1) * pageSize + index + 1}</td>
                    <td className="fw-semibold">{item.item_name}</td>
                    <td>
                      <Badge bg={getItemTypeBadge(item.item_type)}>
                        {item.item_type?.charAt(0).toUpperCase() + item.item_type?.slice(1)}
                      </Badge>
                    </td>
                    <td>{item.item_code || '-'}</td>
                    <td>{item.hotel_name || '-'}</td>
                    <td>{item.quantity_per_room}</td>
                    <td>{item.cost_price ? `$${item.cost_price.toFixed(2)}` : '-'}</td>
                    <td>
                      <Badge bg={item.status === 1 ? 'success' : 'secondary'}>
                        {item.status === 1 ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleOpenEditModal(item)}>
                          <i className="fi fi-rr-edit" />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(item)}
                          disabled={deletingId === item.complimentary_id}>
                          <i className="fi fi-rr-trash" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>

          {filteredComplimentary.length > 0 && (
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
        title={editing ? 'Edit Complimentary Item' : 'Add Complimentary Item'}
        onSave={handleSubmit}
        saving={saving}
        submitLabel={editing ? 'Update' : 'Save'}
        Component={ComplimentaryForm}
        selectedItem={form}
      />
    </>
  )
}

export default ComplimentaryMaster