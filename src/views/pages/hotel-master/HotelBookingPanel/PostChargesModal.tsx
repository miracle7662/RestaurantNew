import { useState, useEffect, useMemo } from 'react'
import { Modal, Button, Form, Card, Table } from 'react-bootstrap'
import { toast } from 'react-hot-toast'
import CreatableSelect from 'react-select/creatable'

import { departmentApi } from '@/common/hotel'
import type { Department } from '@/common/hotel/departments'
import subDepartmentService from '@/common/hotel/subDepartments'
import type { SubDepartment } from '@/common/hotel/subDepartments'
import PostChargesService, { PostCharge, PostChargePayload } from '@/common/hotel/postCharges'

// ─── Types ───────────────────────────────────────────────────────────────────

interface PostChargesModalProps {
  show: boolean
  onHide: () => void
  roomNo: string
  guestName: string
  checkinId: number
  detailId?: number
  roomId?: number
  guestId?: number
  hotelId: number
  userId?: number
  onSuccess?: () => void
  mode?: 'charge' | 'allowance'
  existingCharges?: PostCharge[]
  onChargesUpdated?: () => void
}

interface PostChargeItem {
  id: string
  post_charge_id?: number
  room_id?: number
  billDate: string
  roomNo: string
  billNo: string
  description: string
  particulars: string
  amount: number
  discount: number
  total: number
  outletName: string
  outletOption: string
  outletOptionId?: number
  docNo: string
  date: string
  transaction_type: 'CHARGE' | 'ALLOWANCE'
}

type DepartmentWithOutlet = Department & {
  outlet_name?: string
  outlet_option?: string
}

interface SelectOption {
  label: string
  value: string
  subDepartmentId?: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const getCurrentDateTimeLocal = (): string => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

const getCurrentDate = (): string => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// ─── Component ───────────────────────────────────────────────────────────────

const PostChargesModal = ({
  show,
  onHide,
  roomNo,
  guestName,
  checkinId,
  detailId,
  roomId,
  guestId,
  hotelId,
  userId,
  onSuccess,
  mode = 'charge',
  existingCharges = [],
  onChargesUpdated,
}: PostChargesModalProps) => {

  // ── Form state ────────────────────────────────────────────────────────────
  const [postType, setPostType] = useState<'charge' | 'allowance'>(mode)
  const [outletName, setOutletName] = useState('')
  const [outletOption, setOutletOption] = useState<SelectOption | null>(null)
  const [docNo, setDocNo] = useState('')
  const [date, setDate] = useState(getCurrentDateTimeLocal())
  const [amount, setAmount] = useState('')
  const [particulars, setParticulars] = useState('')
  const [billDate, setBillDate] = useState(getCurrentDate())

  // ── Table / data state ────────────────────────────────────────────────────
  const [billItems, setBillItems] = useState<PostChargeItem[]>([])
  const [editingItem, setEditingItem] = useState<PostChargeItem | null>(null)

  // ── Loading state ─────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [loadingOutlets, setLoadingOutlets] = useState(false)
  const [loadingSubOutlets, setLoadingSubOutlets] = useState(false)
  const [isCreatingSubDept, setIsCreatingSubDept] = useState(false)
  const [loadingCharges, setLoadingCharges] = useState(false)

  // ── Master data ───────────────────────────────────────────────────────────
  const [departments, setDepartments] = useState<DepartmentWithOutlet[]>([])
  const [subDepartments, setSubDepartments] = useState<SubDepartment[]>([])

  // ── Sync postType when modal opens ───────────────────────────────────────
  useEffect(() => {
    if (show) setPostType(mode)
  }, [show, mode])

  // ── Reset form fields ────────────────────────────────────────────────────
  const resetForm = () => {
    setOutletName('')
    setOutletOption(null)
    setDocNo('')
    setDate(getCurrentDateTimeLocal())
    setAmount('')
    setParticulars('')
    setBillDate(getCurrentDate())
    setEditingItem(null)
  }

  // ── Populate form for editing ────────────────────────────────────────────
  const handleEdit = (item: PostChargeItem) => {
    setEditingItem(item)
    setPostType(item.transaction_type === 'ALLOWANCE' ? 'allowance' : 'charge')
    setOutletName(item.outletName)
    setOutletOption(item.outletOption ? {
      label: item.outletOption,
      value: item.outletOption,
      subDepartmentId: item.outletOptionId
    } : null)
    setDocNo(item.docNo)
    // Set the date from the stored item
    if (item.date) {
      const editDate = new Date(item.date)
      const year = editDate.getFullYear()
      const month = String(editDate.getMonth() + 1).padStart(2, '0')
      const day = String(editDate.getDate()).padStart(2, '0')
      const hours = String(editDate.getHours()).padStart(2, '0')
      const minutes = String(editDate.getMinutes()).padStart(2, '0')
      setDate(`${year}-${month}-${day}T${hours}:${minutes}`)
    }
    setAmount(Math.abs(item.amount).toString())
    setParticulars(item.particulars)
    setBillDate(item.billDate)

    const modalBody = document.querySelector('.post-charges-modal .modal-body')
    if (modalBody) {
      modalBody.scrollTop = 0
    }
  }

  // ── Cancel edit ──────────────────────────────────────────────────────────
  const cancelEdit = () => {
    setEditingItem(null)
    resetForm()
  }

  // ── Fetch Post Charges from API ──────────────────────────────────────────
  const fetchPostChargesFromApi = async (): Promise<PostCharge[]> => {
    if (!checkinId || !hotelId) return []
    try {
      const res = await PostChargesService.list({
        checkin_id: checkinId,
        hotelid: hotelId,
        ...(roomId ? { room_id: roomId } : {}),
      })

      if (res.success && res.data) {
        return res.data
      }
      return []
    } catch (err) {
      console.warn('Failed to fetch charges from API:', err)
      return []
    }
  }

  // ── Convert Post Charges to Bill Items ───────────────────────────────────
  const mapChargesToBillItems = (charges: PostCharge[]): PostChargeItem[] =>
    charges.map((c, index) => {
      const isAllowance = c.transaction_type === 'ALLOWANCE'
      // Use the stored post_datetime from API
      const postDate = c.post_datetime || new Date().toISOString()
      // Use the stored bill_date from API
      const displayBillDate = (c as any).bill_date?.split('T')[0] || c.post_datetime?.split('T')[0] || getCurrentDate()
      return {
        id: `existing-${c.post_charge_id}-${index}`,
        post_charge_id: c.post_charge_id,
        billDate: displayBillDate,
        roomNo: c.room_no ?? roomNo,
        billNo: c.bill_no,
        description: c.description ?? c.particulars ?? (isAllowance ? 'Allowance' : 'Charge'),
        particulars: c.particulars ?? '',
        amount: Math.abs(c.amount),
        discount: c.discount,
        total: c.total_amount,
        outletName: c.outlet_name ?? 'General',
        outletOption: c.outlet_option ?? '',
        outletOptionId: c.outlet_option_id ?? undefined,
        docNo: c.doc_no ?? '',
        date: postDate,
        transaction_type: c.transaction_type,
      }
    })

  // ── On modal open: reset form, fetch charges, load departments ───────────
  useEffect(() => {
    if (!show) return

    resetForm()
    setLoadingCharges(true)
    setLoadingOutlets(true)
    setDepartments([])

    const initializeModal = async () => {
      try {
        let charges: PostCharge[] = []

        if (existingCharges.length > 0) {
          charges = existingCharges
        } else {
          charges = await fetchPostChargesFromApi()
        }

        const seen = new Set<number>()
        const uniqueCharges = charges.filter((c: PostCharge) => {
          if (!c.post_charge_id) return true
          if (seen.has(c.post_charge_id)) return false
          seen.add(c.post_charge_id)
          return true
        })

        const items = mapChargesToBillItems(uniqueCharges)
        setBillItems(items)
      } catch (err) {
        console.error('Failed to initialize post charges modal:', err)
        setBillItems([])
      } finally {
        setLoadingCharges(false)
      }

      try {
        const res = await departmentApi.list({ hotelid: hotelId })
        const payload = res as any
        setDepartments(Array.isArray(payload) ? payload : (payload?.data ?? []))
      } catch {
        toast.error('Failed to load Outlet data')
      } finally {
        setLoadingOutlets(false)
      }
    }

    initializeModal()
  }, [show, hotelId, checkinId, roomId])

  // ── Outlet name options (deduplicated) ───────────────────────────────────
  const outletNameOptions = useMemo(() => {
    const unique = new Map<string, { label: string; value: string; departmentId: number }>()
    for (const d of departments) {
      const name = String(d.department_name ?? '').trim()
      if (name) unique.set(name, { label: name, value: name, departmentId: d.department_id })
    }
    return Array.from(unique.values()).sort((a, b) => a.label.localeCompare(b.label))
  }, [departments])

  const selectedDepartmentId = useMemo(
    () => outletNameOptions.find((o) => o.value === outletName)?.departmentId,
    [outletName, outletNameOptions],
  )

  // ── Load sub-departments when outlet changes ──────────────────────────────
  useEffect(() => {
    if (!selectedDepartmentId || !hotelId || !show) {
      setSubDepartments([])
      setOutletOption(null)
      return
    }

    setLoadingSubOutlets(true)
    subDepartmentService
      .getByDepartment(selectedDepartmentId, { hotelid: hotelId })
      .then((res) => {
        const payload = res as any
        setSubDepartments(Array.isArray(payload) ? payload : (payload?.data ?? []))
      })
      .catch(() => console.error('Failed to load sub-departments'))
      .finally(() => setLoadingSubOutlets(false))
  }, [selectedDepartmentId, hotelId, show])

  const outletOptionOptions = useMemo(
    () =>
      subDepartments.map((sd) => ({
        label: sd.sub_department_name,
        value: sd.sub_department_name,
        subDepartmentId: sd.sub_department_id,
      })),
    [subDepartments],
  )

  // ── Create new sub-department on-the-fly ──────────────────────────────────
  const handleCreateSubDepartment = async (inputValue: string) => {
    const trimmed = inputValue.trim()
    if (!trimmed) {
      toast.error('Please enter a valid outlet option name')
      return
    }
    if (!selectedDepartmentId) {
      toast.error('Please select Outlet first')
      return
    }

    setIsCreatingSubDept(true)
    try {
      const response = await subDepartmentService.create({
        department_id: selectedDepartmentId,
        sub_department_name: trimmed,
        description: trimmed,
        hotelid: hotelId,
        status: 1,
        created_by_id: userId,
      })

      const newSubDept = (response as any)?.data
      if (newSubDept) {
        setSubDepartments((prev) => [...prev, newSubDept])
        setOutletOption({
          label: newSubDept.sub_department_name,
          value: newSubDept.sub_department_name,
          subDepartmentId: newSubDept.sub_department_id,
        })
        toast.success('New outlet option added')
      } else {
        setOutletOption({ label: trimmed, value: trimmed })
        toast.success('Outlet option added')
      }
    } catch {
      toast.error('Failed to create new outlet option')
      setOutletOption({ label: trimmed, value: trimmed })
    } finally {
      setIsCreatingSubDept(false)
    }
  }

  // ── Refresh table data from API ──────────────────────────────────────────
  const refreshTableData = async () => {
    try {
      const charges = await fetchPostChargesFromApi()
      if (charges.length > 0) {
        const seen = new Set<number>()
        const uniqueCharges = charges.filter((c: PostCharge) => {
          if (!c.post_charge_id) return true
          if (seen.has(c.post_charge_id)) return false
          seen.add(c.post_charge_id)
          return true
        })
        const items = mapChargesToBillItems(uniqueCharges)
        setBillItems(items)
      } else {
        setBillItems([])
      }
    } catch (err) {
      console.error('Failed to refresh table data:', err)
    }
  }

  // ── UPDATE CHARGE/ALLOWANCE ──────────────────────────────────────────────
  const handleUpdate = async () => {
    if (!editingItem) {
      toast.error('No item selected for update')
      return
    }

    if (!outletName) {
      toast.error('Please select Outlet Name')
      return
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid Amount')
      return
    }

    if (!checkinId) {
      toast.error('Check-in ID not found')
      return
    }

    const effectiveRoomId = roomId ?? editingItem?.room_id

    if (!effectiveRoomId) {
      toast.error('Room ID not found')
      return
    }

    if (!guestId) {
      toast.error('Guest ID not found')
      return
    }

    if (!editingItem.post_charge_id) {
      toast.error('Charge ID not found for update')
      return
    }

    setUpdating(true)
    try {
      const description = outletOption ? `${outletName} - ${outletOption.label}` : outletName
      const amountValue = parseFloat(amount)
      const discountValue = 0
      const isAllowance = postType === 'allowance'

      // Convert the selected datetime to ISO string properly
      let postDateTime: string
      if (date) {
        const selectedDate = new Date(date)
        postDateTime = selectedDate.toISOString()
      } else {
        postDateTime = new Date().toISOString()
      }

      const payload: Partial<PostChargePayload> = {
        checkin_id: checkinId,
        detail_id: detailId ?? null,
        room_id: effectiveRoomId,
        guest_id: guestId,
        transaction_type: isAllowance ? 'ALLOWANCE' : 'CHARGE',
        post_datetime: postDateTime,
        bill_no: editingItem.billNo,
        doc_no: docNo || editingItem.docNo,
        outlet_name: outletName,
        outlet_option: outletOption?.label ?? null,
        outlet_option_id: outletOption?.subDepartmentId ?? null,
        description: description,
        particulars: particulars || `${outletName}${outletOption ? ` - ${outletOption.label}` : ''} charges`,
        amount: amountValue,
        discount: discountValue,
        hotelid: hotelId,
        updated_by_id: userId,
        bill_date: billDate
      }

      console.log('Updating charge ID:', editingItem.post_charge_id)
      console.log('Update payload:', payload)

      const response = await PostChargesService.update(editingItem.post_charge_id, payload)

      console.log('Update response:', response)

      if (response && response.success) {
        const updatedItem: PostChargeItem = {
          ...editingItem,
          billDate: billDate,
          description: description,
          particulars: payload.particulars || '',
          amount: amountValue,
          discount: discountValue,
          total: isAllowance ? -amountValue : amountValue,
          outletName: outletName,
          outletOption: outletOption?.label ?? '',
          outletOptionId: outletOption?.subDepartmentId,
          docNo: docNo || editingItem.docNo,
          date: postDateTime,
          transaction_type: isAllowance ? 'ALLOWANCE' : 'CHARGE',
        }

        setBillItems((prev) =>
          prev.map((item) =>
            item.id === editingItem.id ? updatedItem : item
          )
        )

        toast.success(isAllowance ? 'Allowance updated successfully' : 'Charge updated successfully')
        resetForm()
        setEditingItem(null)
        onChargesUpdated?.()
        onSuccess?.()

        setTimeout(() => {
          refreshTableData()
        }, 500)
      } else {
        throw new Error(response?.message || 'Failed to update charge')
      }
    } catch (error: any) {
      console.error('Update error:', error)
      toast.error(
        error?.response?.data?.message ??
        error?.message ??
        (postType === 'charge' ? 'Failed to update charge' : 'Failed to update allowance'),
      )
    } finally {
      setUpdating(false)
    }
  }

  // ── SAVE (CREATE) ────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!outletName) {
      toast.error('Please select Outlet Name')
      return
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid Amount')
      return
    }

    if (!checkinId) {
      toast.error('Check-in ID not found')
      return
    }

    if (!roomId) {
      toast.error('Room ID not found')
      return
    }

    if (!guestId) {
      toast.error('Guest ID not found')
      return
    }

    setSaving(true)
    try {
      const description = outletOption ? `${outletName} - ${outletOption.label}` : outletName
      const billNumber = `BILL-${Date.now()}-${Math.floor(Math.random() * 1000)}`
      const docNumber = docNo || `DOC-${Date.now()}`
      const amountValue = parseFloat(amount)
      const discountValue = 0
      const isAllowance = postType === 'allowance'

      // Convert the selected datetime to ISO string properly
      let postDateTime: string
      if (date) {
        const selectedDate = new Date(date)
        postDateTime = selectedDate.toISOString()
      } else {
        postDateTime = new Date().toISOString()
      }

      const payload: PostChargePayload = {
        checkin_id: checkinId,
        detail_id: detailId ?? null,
        room_id: roomId,
        guest_id: guestId,
        transaction_type: isAllowance ? 'ALLOWANCE' : 'CHARGE',
        post_datetime: postDateTime,
        bill_no: billNumber,
        doc_no: docNumber,
        outlet_name: outletName,
        outlet_option: outletOption?.label ?? null,
        outlet_option_id: outletOption?.subDepartmentId ?? null,
        description: description,
        particulars: particulars || `${outletName}${outletOption ? ` - ${outletOption.label}` : ''} charges`,
        amount: amountValue,
        discount: discountValue,
        hotelid: hotelId,
        created_by_id: userId,
        bill_date: billDate
      }

      console.log('Save payload:', payload)
      const response = await PostChargesService.create(payload)
      console.log('Save response:', response)

      if (response && response.success) {
        const savedData = response.data
        const savedChargeId = savedData?.post_charge_id ?? null

        const newItem: PostChargeItem = {
          id: savedChargeId ? `saved-${savedChargeId}-${Date.now()}` : generateId(),
          post_charge_id: savedChargeId,
          billDate: billDate,
          roomNo: roomNo,
          billNo: billNumber,
          description: description,
          particulars: payload.particulars || '',
          amount: amountValue,
          discount: discountValue,
          total: isAllowance ? -amountValue : amountValue,
          outletName: outletName,
          outletOption: outletOption?.label ?? '',
          outletOptionId: outletOption?.subDepartmentId,
          docNo: docNumber,
          date: postDateTime,
          transaction_type: isAllowance ? 'ALLOWANCE' : 'CHARGE',
        }

        setBillItems((prev) => {
          const exists = prev.some(item =>
            item.post_charge_id && item.post_charge_id === savedChargeId
          )
          if (exists) return prev
          return [...prev, newItem]
        })

        toast.success(isAllowance ? 'Allowance posted successfully' : 'Charge posted successfully')
        resetForm()
        onChargesUpdated?.()
        onSuccess?.()

        setTimeout(() => {
          refreshTableData()
        }, 500)
      } else {
        throw new Error(response?.message || 'Failed to post charge')
      }
    } catch (error: any) {
      console.error('Save error:', error)
      toast.error(
        error?.response?.data?.message ??
        error?.message ??
        (postType === 'charge' ? 'Failed to post charge' : 'Failed to post allowance'),
      )
    } finally {
      setSaving(false)
    }
  }

  // ── DELETE ────────────────────────────────────────────────────────────────
  const handleDelete = async (item: PostChargeItem) => {
    if (!item.post_charge_id) {
      setBillItems((prev) => prev.filter((i) => i.id !== item.id))
      toast.success('Item removed')
      return
    }

    setDeletingId(item.id)
    try {
      const response = await PostChargesService.delete(item.post_charge_id)
      if (response && response.success) {
        setBillItems((prev) => prev.filter((i) => i.id !== item.id))
        toast.success('Charge deleted successfully')
        onChargesUpdated?.()
        onSuccess?.()

        setTimeout(() => {
          refreshTableData()
        }, 500)
      } else {
        toast.error(response?.message ?? 'Failed to delete charge')
      }
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error(error?.response?.data?.message ?? 'Failed to delete charge')
    } finally {
      setDeletingId(null)
    }
  }

  // ── Exit ──────────────────────────────────────────────────────────────────
  const handleExit = () => {
    resetForm()
    onHide()
  }

  // ── Totals ────────────────────────────────────────────────────────────────
  const totalAmount = billItems.reduce((s, i) => s + i.amount, 0)
  const grandTotal = billItems.reduce((s, i) => s + i.total, 0)

  // ─────────────────────────────────────────────────────────────────────────
  // JSX
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <Modal
      show={show}
      onHide={handleExit}
      centered
      size="lg"
      backdrop="static"
      className="post-charges-modal"
      dialogClassName="post-charges-modal-dialog">

      <Modal.Header closeButton className="py-2" style={{ background: '#1787ff', borderBottom: 'none' }}>
        <Modal.Title className="fs-6 text-white fw-bold">
          {editingItem
            ? (postType === 'charge' ? 'EDIT CHARGE' : 'EDIT ALLOWANCE')
            : (postType === 'charge' ? 'POST CHARGES' : 'POST ALLOWANCES')
          }
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="pb-2">
        <Card>
          <Card.Body className="p-3">

            {/* ── Post Type Toggle ──────────────────────────────────────── */}
            <div className="row align-items-center g-2 mb-3">
              <div className="col-md-2">
                <Form.Label className="fw-semibold small mb-0">Post Type :</Form.Label>
              </div>
              <div className="col-md-5">
                <Button
                  variant={postType === 'charge' ? 'danger' : 'outline-danger'}
                  className="w-100 rounded-0 fw-semibold"
                  size="sm"
                  onClick={() => setPostType('charge')}
                  disabled={!!editingItem}>
                  Post Charges ( + )
                </Button>
              </div>
              <div className="col-md-5">
                <Button
                  variant={postType === 'allowance' ? 'secondary' : 'outline-secondary'}
                  className="w-100 rounded-0 fw-semibold"
                  size="sm"
                  onClick={() => setPostType('allowance')}
                  disabled={!!editingItem}>
                  Allowances ( - )
                </Button>
              </div>
            </div>

            {/* ── Room Info ─────────────────────────────────────────────── */}
            <div className="row align-items-center g-3 mb-2">
              <div className="col-md-2">
                <Form.Label className="fw-small mb-0 small">Room No :</Form.Label>
              </div>
              <div className="col-md-4">
                <Form.Control type="text" size="sm" value={roomNo} readOnly disabled className="bg-light" />
              </div>
              <div className="col-md-2">
                <Form.Label className="fw-small mb-0 small">Guest :</Form.Label>
              </div>
              <div className="col-md-4">
                <Form.Control type="text" size="sm" value={guestName} readOnly disabled className="bg-light" />
              </div>
            </div>

            {/* ── Bill Date & Date-Time ─────────────────────────────────── */}
            <div className="row align-items-center g-3 mb-2">
              <div className="col-md-2">
                <Form.Label className="fw-small mb-0 small">Bill Date :</Form.Label>
              </div>
              <div className="col-md-4">
                <Form.Control
                  type="date"
                  size="sm"
                  value={billDate}
                  onChange={(e) => setBillDate(e.target.value)}
                  className="bg-light"
                />
              </div>
              <div className="col-md-2">
                <Form.Label className="fw-small mb-0 small">Date &amp; Time :</Form.Label>
              </div>
              <div className="col-md-4">
                <Form.Control
                  type="datetime-local"
                  size="sm"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-light"
                />
              </div>
            </div>

            {/* ── Outlet Name & Option ──────────────────────────────────── */}
            <div className="row align-items-center g-3 mb-2">
              <div className="col-md-2">
                <Form.Label className="fw-small mb-0 small">Outlet Name :</Form.Label>
              </div>
              <div className="col-md-4">
                <Form.Select
                  size="sm"
                  value={outletName}
                  onChange={(e) => { setOutletName(e.target.value); setOutletOption(null) }}
                  className="bg-light w-100"
                  disabled={loadingOutlets || !!editingItem}>
                  <option value="">{loadingOutlets ? 'Loading…' : 'Select Outlet'}</option>
                  {outletNameOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </Form.Select>
              </div>
              <div className="col-md-2">
                <Form.Label className="fw-small mb-0 small">Outlet Option :</Form.Label>
              </div>
              <div className="col-md-4">
                <CreatableSelect
                  options={outletOptionOptions}
                  isLoading={loadingSubOutlets || isCreatingSubDept}
                  value={outletOption}
                  onChange={(opt) => setOutletOption(opt as SelectOption | null)}
                  onCreateOption={handleCreateSubDepartment}
                  placeholder={!selectedDepartmentId ? 'Select Outlet first' : 'Select or create'}
                  isClearable
                  isSearchable
                  isDisabled={!selectedDepartmentId || !!editingItem}
                  menuPlacement="auto"
                  formatCreateLabel={(input) => `Create "${input}"`}
                  styles={{
                    control: (base) => ({
                      ...base, minHeight: '31px', height: '31px',
                      fontSize: '0.8rem', borderRadius: '0.25rem', width: '100%',
                    }),
                    menu: (base) => ({ ...base, fontSize: '0.875rem', width: '100%', minWidth: '100%' }),
                    input: (base) => ({ ...base, fontSize: '0.875rem', margin: '0', padding: '0' }),
                    placeholder: (base) => ({ ...base, fontSize: '0.75rem', lineHeight: '1.5' }),
                    valueContainer: (base) => ({ ...base, padding: '0 8px', height: '31px' }),
                    indicatorsContainer: (base) => ({ ...base, height: '29px' }),
                    clearIndicator: (base) => ({ ...base, padding: '4px' }),
                    dropdownIndicator: (base) => ({ ...base, padding: '4px' }),
                    container: (base) => ({ ...base, width: '100%' }),
                  }}
                />
              </div>
            </div>

            {/* ── Doc No & Amount ───────────────────────────────────────── */}
            <div className="row align-items-center g-3 mb-2">
              <div className="col-md-2">
                <Form.Label className="fw-small mb-0 small">Doc. No :</Form.Label>
              </div>
              <div className="col-md-4">
                <Form.Control
                  type="text"
                  size="sm"
                  value={docNo}
                  onChange={(e) => setDocNo(e.target.value)}
                  placeholder="Auto generated"
                  className="bg-light"
                />
              </div>
              <div className="col-md-2">
                <Form.Label className="fw-small mb-0 small">Amount (₹) :</Form.Label>
              </div>
              <div className="col-md-4">
                <Form.Control
                  type="number"
                  size="sm"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  step="0.01"
                  min="0"
                  className="bg-light"
                />
              </div>
            </div>

            {/* ── Particulars ───────────────────────────────────────────── */}
            <div className="row align-items-center g-2 mb-2">
              <div className="col-md-2">
                <Form.Label className="fw-small mb-0 small">Particulars :</Form.Label>
              </div>
              <div className="col-md-10">
                <Form.Control
                  as="textarea"
                  rows={2}
                  size="sm"
                  value={particulars}
                  onChange={(e) => setParticulars(e.target.value)}
                  placeholder="Enter particulars"
                  className="bg-light"
                />
              </div>
            </div>

            {/* ── Save/Update Buttons ───────────────────────────────────── */}
            <div className="d-flex justify-content-end gap-2 mb-3">
              {editingItem ? (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={cancelEdit}
                    disabled={updating}
                    className="py-1 px-4">
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleUpdate}
                    disabled={updating}
                    className="py-1 px-4">
                    {updating ? (
                      <><span className="spinner-border spinner-border-sm me-2" />Updating…</>
                    ) : (
                      'Update'
                    )}
                  </Button>
                </>
              ) : (
                <Button
                  variant="success"
                  size="sm"
                  onClick={handleSave}
                  disabled={saving}
                  className="py-1 px-4">
                  {saving ? (
                    <><span className="spinner-border spinner-border-sm me-2" />Saving…</>
                  ) : (
                    'Save'
                  )}
                </Button>
              )}
            </div>

            {/* ── Datatable ────────────────────────────────────────────── */}
            <div className="table-responsive mb-3" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {loadingCharges ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading charges...</span>
                  </div>
                  <p className="mt-2 text-muted small">Loading post charges...</p>
                </div>
              ) : (
                <Table className="table-sm table-bordered mb-0 small" striped hover>
                  <thead className="table-light position-sticky top-0">
                    <tr>
                      <th style={{ width: '5%' }} className="py-1">#</th>
                      <th style={{ width: '10%' }} className="py-1">Actions</th>
                      <th style={{ width: '8%' }} className="py-1">Bill Date</th>
                      <th style={{ width: '8%' }} className="py-1">Room No</th>
                      <th style={{ width: '8%' }} className="py-1">Bill No</th>
                      <th style={{ width: '16%' }} className="py-1">Description</th>
                      <th style={{ width: '14%' }} className="py-1">Particulars</th>
                      <th style={{ width: '8%' }} className="py-1 text-end">Amount</th>
                      <th style={{ width: '8%' }} className="py-1 text-end">Disc.</th>
                      <th style={{ width: '10%' }} className="py-1 text-end">Total</th>
                    </tr>
                  </thead>

                  <tbody>
                    {billItems.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="text-center text-muted py-3">
                          No post charges or allowances yet. Fill the form above and click "Save".
                        </td>
                      </tr>
                    ) : (
                      billItems.map((item, index) => (
                        <tr
                          key={item.id}
                          className={
                            item.transaction_type === 'ALLOWANCE'
                              ? 'table-warning'
                              : ''
                          }>
                          <td className="py-1 text-center">{index + 1}</td>
                          <td className="py-1 text-center">
                            <Button
                              variant="link"
                              size="sm"
                              onClick={() => handleEdit(item)}
                              className="text-primary p-0 me-2"
                              title="Edit">
                              <i className="fi fi-rr-edit" />
                            </Button>
                            <Button
                              variant="link"
                              size="sm"
                              onClick={() => handleDelete(item)}
                              disabled={deletingId === item.id}
                              className="text-danger p-0"
                              title="Delete">
                              {deletingId === item.id
                                ? <span className="spinner-border spinner-border-sm" />
                                : <i className="fi fi-rr-trash" />}
                            </Button>
                          </td>
                          <td className="py-1">{formatDate(item.billDate)}</td>
                          <td className="py-1">{item.roomNo}</td>
                          <td className="py-1 small">{item.billNo}</td>
                          <td className="py-1">{item.description}</td>
                          <td className="py-1">{item.particulars}</td>
                          <td className="py-1 text-end">₹{Number(item.amount ?? 0).toFixed(2)}</td>
                          <td className="py-1 text-end">₹{Number(item.discount ?? 0).toFixed(2)}</td>
                          <td className="py-1 text-end fw-bold">
                            <span className={(Number(item.total ?? 0) as number) < 0 ? 'text-danger' : 'text-success'}>
                              ₹{Math.abs(Number(item.total ?? 0) as number).toFixed(2)}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>

                  {billItems.length > 0 && (
                    <tfoot className="table-light">
                      <tr>
                        <td colSpan={7} className="py-1 text-end fw-semibold">Totals:</td>
                        <td className="py-1 text-end fw-semibold">₹{totalAmount.toFixed(2)}</td>
                        <td className="py-1 text-end fw-semibold">₹0.00</td>
                        <td className="py-1 text-end fw-bold">
                          <span className={grandTotal < 0 ? 'text-danger' : 'text-success'}>
                            ₹{Math.abs(grandTotal).toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </Table>
              )}
            </div>
          </Card.Body>
        </Card>
      </Modal.Body>

      <Modal.Footer className="py-1">
        <Button variant="secondary" size="sm" onClick={handleExit} className="px-4">
          Exit
        </Button>
      </Modal.Footer>

      <style>{`
        .post-charges-modal-dialog { max-width: 950px; width: 100%; }
        .post-charges-modal .table th,
        .post-charges-modal .table td {
          vertical-align: middle;
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
        }
        .post-charges-modal .bg-light { background-color: #f0f0f0 !important; }
        .post-charges-modal .table tfoot { font-weight: 600; }
        .post-charges-modal .table tfoot tr { border-bottom: 1px solid #dee2e6; }
      `}</style>
    </Modal>
  )
}

export default PostChargesModal