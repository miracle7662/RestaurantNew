import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'
import Swal from 'sweetalert2'
import TitleHelmet from '@/components/Common/TitleHelmet'
import taxApi from '@/common/hotel/taxes'
import { Badge, Button, Card, Form, Table } from 'react-bootstrap'
import FormModal from '@/components/Common/models/FormModal'
import TaxForm from './TaxForm'

type Tax = {
  hotel_taxid: number
  hotel_tax_value: number | null
  hotel_cgst: number | null
  hotel_sgst: number | null
  hotel_igst: number | null
  hotel_cess: number | null
  status: number
}

type TaxFormData = {
  hotel_tax_value: string
  hotel_cgst: string
  hotel_sgst: string
  hotel_igst: string
  hotel_cess: string
  status: number
}

const defaultForm: TaxFormData = {
  hotel_tax_value: '',
  hotel_cgst: '',
  hotel_sgst: '',
  hotel_igst: '',
  hotel_cess: '',
  status: 1,
}

const TaxMaster = () => {
  const [taxes, setTaxes] = useState<Tax[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingTax, setEditingTax] = useState<Tax | null>(null)
  const [form, setForm] = useState<TaxFormData>(defaultForm)
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  const loadTaxes = async () => {
    setLoading(true)
    try {
      const data = (await taxApi.list()) as unknown as Tax[]
      setTaxes(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to load taxes:', error)
      toast.error(typeof error === 'string' ? error : 'Failed to load taxes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTaxes()
  }, [])

  const filteredTaxes = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return taxes
    return taxes.filter((tax) =>
      [
        tax.hotel_tax_value,
        tax.hotel_cgst,
        tax.hotel_sgst,
        tax.hotel_igst,
        tax.hotel_cess,
      ]
        .map((value) => (value === null ? '' : String(value)))
        .some((value) => value.toLowerCase().includes(query)),
    )
  }, [taxes, search])

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredTaxes.length / pageSize))
  }, [filteredTaxes.length, pageSize])

  const paginatedTaxes = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredTaxes.slice(startIndex, startIndex + pageSize)
  }, [filteredTaxes, currentPage, pageSize])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, pageSize])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const handleOpenAddModal = () => {
    setEditingTax(null)
    setForm(defaultForm)
    setShowModal(true)
  }

  const handleOpenEditModal = (tax: Tax) => {
    setEditingTax(tax)
    setForm({
      hotel_tax_value: tax.hotel_tax_value === null ? '' : String(tax.hotel_tax_value),
      hotel_cgst: tax.hotel_cgst === null ? '' : String(tax.hotel_cgst),
      hotel_sgst: tax.hotel_sgst === null ? '' : String(tax.hotel_sgst),
      hotel_igst: tax.hotel_igst === null ? '' : String(tax.hotel_igst),
      hotel_cess: tax.hotel_cess === null ? '' : String(tax.hotel_cess),
      status: tax.status ?? 1,
    })
    setShowModal(true)
  }

  const handleCloseModal = () => {
    if (saving) return
    setShowModal(false)
    setEditingTax(null)
  }

  const handleSubmit = async (payload: any) => {
    setSaving(true)
    try {
      if (editingTax) {
        const updated = (await taxApi.update(
          editingTax.hotel_taxid,
          payload,
        )) as unknown as Tax
        if (updated?.hotel_taxid) {
          setTaxes((prev) =>
            prev.map((item) => (item.hotel_taxid === updated.hotel_taxid ? updated : item)),
          )
        } else {
          await loadTaxes()
        }
        toast.success('Tax updated')
      } else {
        const created = (await taxApi.create(payload)) as unknown as Tax
        if (created?.hotel_taxid) {
          setTaxes((prev) => [created, ...prev])
        } else {
          await loadTaxes()
        }
        toast.success('Tax added')
      }

      setShowModal(false)
      setEditingTax(null)
      setForm(defaultForm)
    } catch (error) {
      console.error('Failed to save tax:', error)
      toast.error(typeof error === 'string' ? error : 'Failed to save tax')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (tax: Tax) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `You will not be able to recover this tax record!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3E97FF',
      confirmButtonText: 'Yes, delete it!',
    })

    if (result.isConfirmed) {
      setDeletingId(tax.hotel_taxid)
      try {
        await taxApi.remove(tax.hotel_taxid)
        setTaxes((prev) => prev.filter((item) => item.hotel_taxid !== tax.hotel_taxid))
        toast.success('Tax deleted successfully')
      } catch (error) {
        console.error('Failed to delete tax:', error)
        toast.error(typeof error === 'string' ? error : 'Failed to delete tax')
      } finally {
        setDeletingId(null)
      }
    }
  }

  return (
    <>
      <TitleHelmet title="Tax Master" />

      <Card className="mb-3">
        <Card.Body className="d-flex justify-content-between align-items-center">
          <div>
            <h4 className="mb-1">Tax Master</h4>
            <p className="text-muted mb-0">Manage taxes and their information.</p>
          </div>
          <Button variant="danger" onClick={handleOpenAddModal}>
            <span className="me-1">+</span> Add Tax
          </Button>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Form.Control
              type="text"
              placeholder="Search taxes..."
              style={{ maxWidth: 280 }}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <Table hover responsive className="mb-0">
            <thead className="table-light">
              <tr>
                <th style={{ width: '60px' }}>#</th>
                <th>Tax Value</th>
                <th>CGST</th>
                <th>SGST</th>
                <th>IGST</th>
                <th>CESS</th>
                <th style={{ width: '120px' }}>Status</th>
                <th style={{ width: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center text-muted py-4">
                    Loading taxes...
                  </td>
                </tr>
              ) : filteredTaxes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-muted py-4">
                    No taxes found.
                  </td>
                </tr>
              ) : (
                paginatedTaxes.map((tax, index) => (
                  <tr key={tax.hotel_taxid}>
                    <td>{(currentPage - 1) * pageSize + index + 1}</td>
                    <td>{tax.hotel_tax_value ?? '-'}</td>
                    <td>{tax.hotel_cgst ?? '-'}</td>
                    <td>{tax.hotel_sgst ?? '-'}</td>
                    <td>{tax.hotel_igst ?? '-'}</td>
                    <td>{tax.hotel_cess ?? '-'}</td>
                    <td>
                      <Badge bg={tax.status === 1 ? 'success' : 'secondary'}>
                        {tax.status === 1 ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleOpenEditModal(tax)}>
                          <i className="fi fi-rr-edit" />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(tax)}
                          disabled={deletingId === tax.hotel_taxid}>
                          <i className="fi fi-rr-trash" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>

          {filteredTaxes.length > 0 && (
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
        title={editingTax ? 'Edit Tax' : 'Add Tax'}
        onSave={(values) => {
          handleSubmit(values)
        }}
        saving={saving}
        submitLabel={editingTax ? 'Update' : 'Save'}
        Component={TaxForm}
        selectedItem={form}
      />
    </>
  )
}

export default TaxMaster