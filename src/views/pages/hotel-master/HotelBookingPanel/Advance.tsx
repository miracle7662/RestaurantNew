// Advance.tsx - UPDATED: Advance Addition with saved entries table
import { useState, useEffect } from 'react'
import { Modal, Button, Form, Card } from 'react-bootstrap'
import { toast } from 'react-hot-toast'

// API Services
import PaymentMethodService from '@/common/hotel/paymentMethod'
import CheckInService from '@/common/hotel/checkIn'
import AdvanceTransactionService from '@/common/hotel/advanceTransaction'
import RoomService from '@/common/hotel/room'

interface AdvanceModalProps {
  show: boolean
  onHide: () => void
  roomNo: string
  guestName: string
  checkinId: number
  detailId?: number
  hotelId: number
  userId?: number
  onSuccess?: () => void
  roomId?: number
}

interface ReceiptItem {
  id: string
  payType: string
  payTypeId?: number
  ledger: string
  document: string
  date: string
  particulars: string
  amount: number
}

interface RefundTopItem {
  id: string
  docNo: string
  guestName: string
  companyName: string
  reason: string
  amtReceive: number
  balance: number
  select: boolean
  amt: number
  receipt_id?: number
  advance_id?: number
}

interface RefundBottomItem {
  id: string
  modeOfPay: string
  modeOfPayId?: number
  ledgerName: string
  recNo: string
  date: string
  narration: string
  amount: number
}

interface CancelItem {
  id: string
  receiptNo: string
  date: string
  description: string
  narration: string
  amount: number
  select: boolean
  cancelAmt: number
  advance_id?: number
  transaction_id?: number
}

interface PostingItem {
  id: string
  docNo: string
  guestName: string
  companyName: string
  reason: string
  amtReceive: number
  balance: number
  select: boolean
  amt: number
  room: string
  amount: number
  advance_id?: number
}

// Addition item — seqNo added for display ordering
interface AdditionItem {
  id: string
  seqNo?: number
  payType: string
  payTypeId?: number
  ledger: string
  document: string
  date: string
  particulars: string
  amount: number
}

interface PaymentMethod {
  id: number
  name: string
  payment_method_name: string
}

// Format date for MySQL
const formatDateTimeForMySQL = (dateTimeString: string): string => {
  if (!dateTimeString) {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const seconds = String(now.getSeconds()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  }
  const date = new Date(dateTimeString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

const formatDateDisplay = (dateString: string): string => {
  if (!dateString) return ''
  try {
    const d = new Date(dateString)
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = String(d.getFullYear()).slice(2)
    return `${day}-${month}-${year}`
  } catch {
    return dateString
  }
}

const generateReceiptNumber = (prefix: string): string => {
  const now = new Date()
  const year = now.getFullYear().toString().slice(-2)
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  const milliseconds = String(now.getMilliseconds()).padStart(3, '0')
  return `${prefix}/${year}${month}${day}/${hours}${minutes}${seconds}${milliseconds}`
}

const Advance = ({
  show,
  onHide,
  roomNo,
  guestName,
  checkinId,
  detailId,
  hotelId,
  userId,
  onSuccess,
  roomId: propRoomId,
}: AdvanceModalProps) => {
  const [activeTab, setActiveTab] = useState<
    'receipt' | 'refund' | 'cancel' | 'posting' | 'addition' | null
  >(null)
  const [saving, setSaving] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [pendingAdvance, setPendingAdvance] = useState<number>(0)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [companyName, setCompanyName] = useState('')
  const [roomId, setRoomId] = useState<number | undefined>(propRoomId)
  const [editingRowId, setEditingRowId] = useState<string | null>(null)
  const [currentDateTime, setCurrentDateTime] = useState('')
  const [billDate, setBillDate] = useState(new Date().toISOString().slice(0, 10))

  useEffect(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    setCurrentDateTime(`${year}-${month}-${day}T${hours}:${minutes}`)
  }, [])

  useEffect(() => {
    if (show && checkinId && hotelId) {
      fetchInitialData()
    }
  }, [show, checkinId, hotelId])

  useEffect(() => {
    if (!roomId && roomNo && hotelId) {
      fetchRoomId()
    }
  }, [roomId, roomNo, hotelId])

  const fetchRoomId = async () => {
    try {
      const response = await RoomService.list({ hotelid: hotelId })
      const rooms = response.data || []
      const foundRoom = rooms.find((r: any) => r.room_no === roomNo)
      if (foundRoom) setRoomId(foundRoom.room_id)
    } catch (error) {
      console.error('Failed to fetch room ID:', error)
    }
  }

  const fetchInitialData = async () => {
    setIsLoadingData(true)
    try {
      const pmRes = await PaymentMethodService.list({ status: 1 })
      const pmData = Array.isArray(pmRes) ? pmRes : pmRes?.data || []
      const mapped = pmData.map((pm: any) => ({
        id: pm.id || pm.payment_method_id,
        name: pm.name || pm.payment_method_name,
        payment_method_name: pm.payment_method_name || pm.name,
      }))
      setPaymentMethods(mapped)

      const checkinRes = await CheckInService.get(checkinId)
      const checkin = checkinRes.data || checkinRes
      setCompanyName(checkin?.company_name || 'SELF')

      const summaryRes = await AdvanceTransactionService.getSummary(checkinId)
      if (summaryRes.success && summaryRes.data) {
        setPendingAdvance(summaryRes.data.pending_advance)
      }
    } catch (error) {
      console.error('Failed to fetch initial data:', error)
      toast.error('Could not load required data')
    } finally {
      setIsLoadingData(false)
    }
  }

  // Refresh only the pending advance balance (called after every save)
  const refreshPendingAdvance = async () => {
    try {
      const summaryRes = await AdvanceTransactionService.getSummary(checkinId)
      if (summaryRes.success && summaryRes.data) {
        setPendingAdvance(summaryRes.data.pending_advance)
      }
    } catch (error) {
      console.error('Failed to refresh pending advance:', error)
    }
  }

  // ==================== Booking Receipt State ====================
  const [receiptDocNo, setReceiptDocNo] = useState('')
  const [receiptDate, setReceiptDate] = useState('')
  const [receiptGuestName, setReceiptGuestName] = useState('')
  const [receiptCompany, setReceiptCompany] = useState('')
  const [receiptAgainst, setReceiptAgainst] = useState('')
  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([])
  const [newReceiptItem, setNewReceiptItem] = useState<ReceiptItem>({
    id: '',
    payType: '',
    payTypeId: undefined,
    ledger: '',
    document: '',
    date: new Date().toISOString().slice(0, 10),
    particulars: '',
    amount: 0,
  })

  // ==================== Advance Refund State ====================
  const [refundDocNo, setRefundDocNo] = useState('')
  const [refundDate, setRefundDate] = useState('')
  const [refundTopItems, setRefundTopItems] = useState<RefundTopItem[]>([])
  const [refundBottomItems, setRefundBottomItems] = useState<RefundBottomItem[]>([])
  const [newRefundBottomItem, setNewRefundBottomItem] = useState<Partial<RefundBottomItem>>({
    modeOfPay: '',
    modeOfPayId: undefined,
    date: new Date().toISOString().slice(0, 10),
  })

  // ==================== Advance Cancel State ====================
  const [cancelRoomNo, setCancelRoomNo] = useState('')
  const [cancelGuestName, setCancelGuestName] = useState('')
  const [cancelDate, setCancelDate] = useState('')
  const [cancelItems, setCancelItems] = useState<CancelItem[]>([])

  // ==================== Advance Posting State ====================
  const [postingDocNo, setPostingDocNo] = useState('')
  const [postingGuestName, setPostingGuestName] = useState('')
  const [postingItems, setPostingItems] = useState<PostingItem[]>([])

  // ==================== Advance Addition State ====================
  const [additionDocNo, setAdditionDocNo] = useState('')
  const [additionDate, setAdditionDate] = useState('')
  const [additionRoomNo, setAdditionRoomNo] = useState('')
  const [additionGuestName, setAdditionGuestName] = useState('')
  const [additionCompany, setAdditionCompany] = useState('')
  const [additionReason, setAdditionReason] = useState('')
  const [savedAdditionItems, setSavedAdditionItems] = useState<AdditionItem[]>([])
  const [additionItems, setAdditionItems] = useState<AdditionItem[]>([])

  // Helper: build default newAdditionItem with first payment method pre-selected
  const buildDefaultAdditionItem = (methods: PaymentMethod[]): AdditionItem => {
    const firstPm = methods.length > 0 ? methods[0] : null
    return {
      id: '',
      payType: firstPm ? firstPm.payment_method_name || firstPm.name : '',
      payTypeId: firstPm ? firstPm.id : undefined,
      ledger: '',
      document: '',
      date: new Date().toISOString().slice(0, 10),
      particulars: '',
      amount: 0,
    }
  }

  const [newAdditionItem, setNewAdditionItem] = useState<AdditionItem>(() =>
    buildDefaultAdditionItem([]),
  )
  const [editingSavedAdditionId, setEditingSavedAdditionId] = useState<string | null>(null)
  const [editingSavedAdditionData, setEditingSavedAdditionData] = useState<AdditionItem | null>(
    null,
  )

  // ==================== Saved Addition Edit / Delete ====================

  const handleEditSavedAddition = (item: AdditionItem) => {
    setEditingSavedAdditionId(item.id)
    setEditingSavedAdditionData({ ...item })
  }

  const handleEditSavedAdditionChange = (field: keyof AdditionItem, value: string | number) => {
    setEditingSavedAdditionData((prev) => (prev ? { ...prev, [field]: value } : prev))
  }

  const handleUpdateSavedAddition = () => {
    if (!editingSavedAdditionData) return
    setSavedAdditionItems((prev) =>
      prev.map((item) =>
        item.id === editingSavedAdditionId ? { ...editingSavedAdditionData } : item,
      ),
    )
    setEditingSavedAdditionId(null)
    setEditingSavedAdditionData(null)
    toast.success('Row updated')
  }

  const handleCancelEditSavedAddition = () => {
    setEditingSavedAdditionId(null)
    setEditingSavedAdditionData(null)
  }

  const handleDeleteSavedAddition = (id: string) => {
    setSavedAdditionItems((prev) => {
      const filtered = prev.filter((item) => item.id !== id)
      // Re-sequence
      return filtered.map((item, idx) => ({ ...item, seqNo: idx + 1 }))
    })
    toast.success('Row deleted')
  }

  // ==================== Data Loaders ====================

  const loadAdvanceReceipts = async () => {
    try {
      const availRes = await AdvanceTransactionService.getAvailableAdvance(checkinId, roomId)
      if (availRes.success && availRes.data) {
        const items: RefundTopItem[] = availRes.data.transactions
          .filter((t) => t.available_balance > 0)
          .map((t, idx) => ({
            id: String(idx + 1),
            docNo: t.receipt_no,
            guestName: guestName,
            companyName: companyName,
            reason: 'Advance Refund',
            amtReceive: t.credit_amount,
            balance: t.available_balance,
            select: false,
            amt: 0,
            advance_id: t.advance_id,
          }))
        setRefundTopItems(items)
      }
    } catch (error) {
      console.error('Failed to load advance receipts:', error)
      toast.error('Could not load advance receipts')
    }
  }

  const loadAdvanceForPosting = async () => {
    try {
      const availRes = await AdvanceTransactionService.getAvailableAdvance(checkinId, roomId)
      if (availRes.success && availRes.data) {
        const items: PostingItem[] = availRes.data.transactions
          .filter((t) => t.available_balance > 0)
          .map((t, idx) => ({
            id: String(idx + 1),
            docNo: t.receipt_no,
            guestName: guestName,
            companyName: companyName,
            reason: 'Room Charge Adjustment',
            amtReceive: t.credit_amount,
            balance: t.available_balance,
            select: false,
            amt: 0,
            room: roomNo,
            amount: 0,
            advance_id: t.advance_id,
          }))
        setPostingItems(items)
      }
    } catch (error) {
      console.error('Failed to load advance for posting:', error)
      toast.error('Could not load advance data')
    }
  }

  const loadCancellableReceipts = async () => {
    try {
      const response = await AdvanceTransactionService.list({
        checkin_id: checkinId,
        room_id: roomId,
      })
      if (response.success && response.data) {
        const transactions = response.data
        const cancellableItems: CancelItem[] = []

        for (const t of transactions) {
          if (
            (t.transaction_type === 'Booking Receipt' ||
              t.transaction_type === 'Advance Addition') &&
            t.status === 'active' &&
            t.credit_amount > 0
          ) {
            try {
              const availRes = await AdvanceTransactionService.getAvailableAdvance(
                checkinId,
                roomId,
              )
              let availableBalance = t.credit_amount
              if (availRes.success && availRes.data) {
                const found = availRes.data.transactions.find(
                  (at: any) => at.advance_id === t.advance_id,
                )
                if (found) availableBalance = found.available_balance
              }
              if (availableBalance > 0) {
                cancellableItems.push({
                  id: String(t.advance_id || cancellableItems.length + 1),
                  receiptNo: t.receipt_no,
                  date: new Date(t.transaction_datetime)
                    .toLocaleDateString('en-GB')
                    .replace(/\//g, '-')
                    .replace(/(\d{2})-(\d{2})-(\d{4})/, (_, d, m, y) => `${d}-${m}-${y.slice(2)}`),
                  description: t.reason || 'Advance Payment',
                  narration: t.narration || '',
                  amount: availableBalance,
                  select: false,
                  cancelAmt: 0,
                  advance_id: t.advance_id,
                  transaction_id: (t as any).id,
                })
              }
            } catch {
              if (t.credit_amount > 0) {
                cancellableItems.push({
                  id: String(t.advance_id || cancellableItems.length + 1),
                  receiptNo: t.receipt_no,
                  date: new Date(t.transaction_datetime)
                    .toLocaleDateString('en-GB')
                    .replace(/\//g, '-')
                    .replace(/(\d{2})-(\d{2})-(\d{4})/, (_, d, m, y) => `${d}-${m}-${y.slice(2)}`),
                  description: t.reason || 'Advance Payment',
                  narration: t.narration || '',
                  amount: t.credit_amount,
                  select: false,
                  cancelAmt: 0,
                  advance_id: t.advance_id,
                  transaction_id: (t as any).id,
                })
              }
            }
          }
        }

        setCancelItems(cancellableItems)
        if (cancellableItems.length === 0) {
          toast('No receipts available for cancellation', { icon: 'ℹ️' })
        }
      }
    } catch (error) {
      console.error('Failed to load cancellable receipts:', error)
      toast.error('Could not load receipt data')
    }
  }

  // Loads existing saved additions from DB with sequential numbers
  const loadAdditionItems = async () => {
    try {
      const response = await AdvanceTransactionService.list({
        checkin_id: checkinId,
        room_id: roomId,
      })
      if (response.success && response.data) {
        const additionTransactions = response.data
          .filter((t: any) => t.transaction_type === 'Advance Addition' && t.status === 'active')
          .sort((a: any, b: any) => (a.advance_id || a.id || 0) - (b.advance_id || b.id || 0))
        const items: AdditionItem[] = additionTransactions.map((t: any, idx: number) => ({
          id: String(t.advance_id || t.id),
          seqNo: idx + 1,
          payType: t.payment_method_name || t.payment_method || '',
          payTypeId: t.payment_method_id,
          ledger: t.ledger || '',
          document: t.reference_no || t.receipt_no || '',
          date: t.transaction_datetime
            ? t.transaction_datetime.slice(0, 10)
            : new Date().toISOString().slice(0, 10),
          particulars: t.reason || t.narration || '',
          amount: Number(t.credit_amount) || 0,
        }))
        setSavedAdditionItems(items)
        setAdditionItems([])
      }
    } catch (error) {
      console.error('Failed to load addition items:', error)
    }
  }

  // ==================== Table Row Handlers ====================

  const handleAddReceiptRow = () => {
    if (newReceiptItem.payType && newReceiptItem.amount > 0) {
      const newId = String(Date.now())
      setReceiptItems([
        ...receiptItems,
        { ...newReceiptItem, id: newId, payTypeId: newReceiptItem.payTypeId },
      ])
      setNewReceiptItem({
        id: '',
        payType: '',
        payTypeId: undefined,
        ledger: '',
        document: '',
        date: new Date().toISOString().slice(0, 10),
        particulars: '',
        amount: 0,
      })
      setEditingRowId(null)
      toast.success('Item added to receipt')
    } else {
      toast.error('Please fill Pay Type and Amount')
    }
  }

  const handleEditReceiptRow = (item: ReceiptItem) => {
    setNewReceiptItem(item)
    setEditingRowId(item.id)
  }

  const handleUpdateReceiptRow = () => {
    if (editingRowId && newReceiptItem.payType) {
      setReceiptItems(
        receiptItems.map((item) =>
          item.id === editingRowId
            ? { ...newReceiptItem, id: editingRowId, payTypeId: newReceiptItem.payTypeId }
            : item,
        ),
      )
      setNewReceiptItem({
        id: '',
        payType: '',
        payTypeId: undefined,
        ledger: '',
        document: '',
        date: new Date().toISOString().slice(0, 10),
        particulars: '',
        amount: 0,
      })
      setEditingRowId(null)
      toast.success('Item updated')
    }
  }

  const handleDeleteReceiptRow = (id: string) => {
    setReceiptItems(receiptItems.filter((item) => item.id !== id))
    toast.success('Item removed')
  }

  const handleAddRefundBottomRow = () => {
    if (newRefundBottomItem.modeOfPay && newRefundBottomItem.amount) {
      const selectedPayMethod = paymentMethods.find(
        (pm) =>
          pm.payment_method_name === newRefundBottomItem.modeOfPay ||
          pm.name === newRefundBottomItem.modeOfPay,
      )
      const newId = String(Date.now())
      setRefundBottomItems([
        ...refundBottomItems,
        {
          id: newId,
          modeOfPay: newRefundBottomItem.modeOfPay || '',
          modeOfPayId: selectedPayMethod?.id,
          ledgerName: newRefundBottomItem.ledgerName || '',
          recNo: newRefundBottomItem.recNo || '',
          date: newRefundBottomItem.date || new Date().toISOString().slice(0, 10),
          narration: newRefundBottomItem.narration || '',
          amount: newRefundBottomItem.amount || 0,
        },
      ])
      // Reset bottom row — keep same modeOfPay as convenience, clear rest
      setNewRefundBottomItem({
        modeOfPay: newRefundBottomItem.modeOfPay,
        modeOfPayId: selectedPayMethod?.id,
        date: new Date().toISOString().slice(0, 10),
      })
      toast.success('Payment method added')
    } else {
      toast.error('Please fill Mode of Pay and Amount')
    }
  }

  const handleDeleteRefundBottomRow = (id: string) => {
    setRefundBottomItems(refundBottomItems.filter((item) => item.id !== id))
    toast.success('Payment method removed')
  }

  // Refund — checkbox click auto-fills amt from balance
  const handleRefundSelectChange = (id: string, checked: boolean) => {
    setRefundTopItems((prev) =>
      prev.map((r) => (r.id === id ? { ...r, select: checked, amt: checked ? r.balance : 0 } : r)),
    )
  }

  // Cancel — checkbox click auto-fills cancelAmt from amount
  const handleCancelSelectChange = (id: string, checked: boolean) => {
    setCancelItems((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, select: checked, cancelAmt: checked ? r.amount : 0 } : r,
      ),
    )
  }

  const handlePostingAmountChange = (id: string, amount: number) => {
    setPostingItems(
      postingItems.map((item) =>
        item.id === id ? { ...item, amt: amount, select: amount > 0 } : item,
      ),
    )
  }

  // ==================== Reset Functions ====================
  const resetReceipt = async () => {
    setReceiptDocNo(generateReceiptNumber('BR'))
    setReceiptDate(currentDateTime)
    setReceiptGuestName(guestName)
    setReceiptCompany(companyName)
    setReceiptAgainst('')
    setEditingRowId(null)
    setReceiptItems([])
  }

  const resetRefund = () => {
    setRefundDocNo(generateReceiptNumber('RF'))
    setRefundDate(currentDateTime)
    setRefundBottomItems([])
    // Reset bottom row with first pay method as default
    const firstPm = paymentMethods.length > 0 ? paymentMethods[0] : null
    setNewRefundBottomItem({
      modeOfPay: firstPm ? firstPm.payment_method_name || firstPm.name : '',
      modeOfPayId: firstPm ? firstPm.id : undefined,
      date: new Date().toISOString().slice(0, 10),
    })
    loadAdvanceReceipts()
  }

  const resetCancel = async () => {
    setCancelRoomNo(roomNo)
    setCancelGuestName(guestName)
    setCancelDate(currentDateTime)
    setBillDate(new Date().toISOString().slice(0, 10))
    await loadCancellableReceipts()
  }

  const resetPosting = () => {
    setPostingDocNo(generateReceiptNumber('PS'))
    setPostingGuestName(guestName)
    loadAdvanceForPosting()
  }

  const resetAddition = async () => {
    setAdditionDocNo(generateReceiptNumber('AD'))
    setAdditionDate(currentDateTime)
    setAdditionRoomNo(roomNo)
    setAdditionGuestName(guestName)
    setAdditionCompany(companyName)
    setAdditionReason('')
    setBillDate(new Date().toISOString().slice(0, 10))
    setAdditionItems([])
    setSavedAdditionItems([])
    setNewAdditionItem(buildDefaultAdditionItem(paymentMethods))
    setEditingRowId(null)
    setEditingSavedAdditionId(null)
    setEditingSavedAdditionData(null)
    await loadAdditionItems()
  }

  const resetTab = async (tab: 'receipt' | 'refund' | 'cancel' | 'posting' | 'addition') => {
    setActiveTab(tab)
    if (tab === 'receipt') await resetReceipt()
    else if (tab === 'refund') resetRefund()
    else if (tab === 'cancel') await resetCancel()
    else if (tab === 'posting') resetPosting()
    else if (tab === 'addition') await resetAddition()
  }

  // ==================== Save Functions ====================

  const handleSaveReceipt = async () => {
    let allReceiptItems = [...receiptItems]
    if (newReceiptItem.payType && newReceiptItem.amount > 0) {
      const pendingId = String(Date.now())
      allReceiptItems = [
        ...receiptItems,
        { ...newReceiptItem, id: pendingId, payTypeId: newReceiptItem.payTypeId },
      ]
      setReceiptItems(allReceiptItems)
      setNewReceiptItem({
        id: '',
        payType: '',
        payTypeId: undefined,
        ledger: '',
        document: '',
        date: new Date().toISOString().slice(0, 10),
        particulars: '',
        amount: 0,
      })
    }

    if (allReceiptItems.length === 0) {
      toast.error('Please fill in at least one receipt item')
      return
    }

    const totalAmount = allReceiptItems.reduce((sum, item) => sum + item.amount, 0)
    const uniquePayTypes = [...new Set(allReceiptItems.map((item) => item.payType))]
    const paymentMethod = uniquePayTypes.length === 1 ? uniquePayTypes[0] : 'Multiple'

    setSaving(true)
    try {
      const payload = {
        hotelid: hotelId,
        checkin_id: checkinId,
        detail_id: detailId || null,
        room_id: roomId || null,
        guest_name: receiptGuestName,
        room_no: roomNo,
        transaction_type: 'Booking Receipt',
        receipt_no: receiptDocNo,
        payment_method: paymentMethod,
        amount: totalAmount,
        debit_amount: 0,
        credit_amount: totalAmount,
        reason: receiptAgainst,
        narration: allReceiptItems.map((i) => `${i.payType}: ${i.particulars}`).join('; '),
        reference_no: receiptDocNo,
        transaction_datetime: receiptDate,
        created_by_id: userId,
        items: allReceiptItems.map((item) => ({
          id: item.id,
          payType: item.payType,
          payTypeId: item.payTypeId,
          ledger: item.ledger,
          document: item.document,
          date: item.date,
          particulars: item.particulars,
          amount: item.amount,
          payment_method_id: item.payTypeId,
          payment_method_name: item.payType,
        })),
        bill_date: billDate,
      }

      const response = await AdvanceTransactionService.create(payload)
      if (response.success) {
        toast.success(`Booking Receipt saved successfully for ₹${totalAmount.toFixed(2)}`)
        await refreshPendingAdvance()
        onSuccess?.()
        await resetReceipt()
      } else {
        toast.error(response.message || 'Failed to save receipt')
      }
    } catch (error: any) {
      console.error('Failed to save booking receipt:', error)
      toast.error(error?.response?.data?.message || 'Failed to save booking receipt')
    } finally {
      setSaving(false)
    }
  }

  // Refund — after save, remove selected rows; keep unselected ones
  const handleSaveRefund = async () => {
    // Auto-add pending bottom row if filled
    let finalRefundBottomItems = [...refundBottomItems]
    if (newRefundBottomItem.modeOfPay && newRefundBottomItem.amount) {
      const selectedPayMethod = paymentMethods.find(
        (pm) =>
          pm.payment_method_name === newRefundBottomItem.modeOfPay ||
          pm.name === newRefundBottomItem.modeOfPay,
      )
      const pendingId = String(Date.now())
      finalRefundBottomItems = [
        ...refundBottomItems,
        {
          id: pendingId,
          modeOfPay: newRefundBottomItem.modeOfPay || '',
          modeOfPayId: selectedPayMethod?.id,
          ledgerName: newRefundBottomItem.ledgerName || '',
          recNo: newRefundBottomItem.recNo || '',
          date: newRefundBottomItem.date || new Date().toISOString().slice(0, 10),
          narration: newRefundBottomItem.narration || '',
          amount: newRefundBottomItem.amount || 0,
        },
      ]
      setRefundBottomItems(finalRefundBottomItems)
      const firstPm = paymentMethods.length > 0 ? paymentMethods[0] : null
      setNewRefundBottomItem({
        modeOfPay: firstPm ? firstPm.payment_method_name || firstPm.name : '',
        modeOfPayId: firstPm ? firstPm.id : undefined,
        date: new Date().toISOString().slice(0, 10),
      })
    }

    const selectedItems = refundTopItems.filter((item) => item.select && item.amt > 0)
    if (selectedItems.length === 0) {
      toast.error('Please select at least one receipt to refund')
      return
    }

    const totalRefundAmount = selectedItems.reduce((sum, item) => sum + item.amt, 0)
    if (totalRefundAmount <= 0) {
      toast.error('Please enter valid refund amount')
      return
    }

    if (finalRefundBottomItems.length === 0) {
      toast.error('Please add at least one payment method for refund')
      return
    }

    setSaving(true)
    try {
      const payload = {
        hotelid: hotelId,
        checkin_id: checkinId,
        detail_id: detailId || null,
        room_id: roomId || null,
        guest_name: guestName,
        room_no: roomNo,
        transaction_type: 'Advance Refund',
        receipt_no: refundDocNo,
        payment_method: finalRefundBottomItems[0]?.modeOfPay || 'Cash',
        amount: totalRefundAmount,
        debit_amount: totalRefundAmount,
        credit_amount: 0,
        reason: 'Customer request',
        narration: `Advance refund for ${selectedItems.length} receipt(s)`,
        reference_no: selectedItems.map((i) => i.docNo).join(','),
        transaction_datetime: refundDate,
        created_by_id: userId,
        refund_items: finalRefundBottomItems.map((item) => ({
          ...item,
          payment_method_id: item.modeOfPayId,
          payment_method_name: item.modeOfPay,
        })),
        selected_refunds: selectedItems,
        bill_date: billDate,
      }

      const response = await AdvanceTransactionService.create(payload)
      if (response.success) {
        toast.success(`Advance Refund processed successfully for ₹${totalRefundAmount.toFixed(2)}`)
        // Remove refunded rows from top table, keep unselected ones
        const selectedIds = new Set(selectedItems.map((i) => i.id))
        setRefundTopItems((prev) => prev.filter((r) => !selectedIds.has(r.id)))
        setRefundBottomItems([])
        const firstPm = paymentMethods.length > 0 ? paymentMethods[0] : null
        setNewRefundBottomItem({
          modeOfPay: firstPm ? firstPm.payment_method_name || firstPm.name : '',
          modeOfPayId: firstPm ? firstPm.id : undefined,
          date: new Date().toISOString().slice(0, 10),
        })
        await refreshPendingAdvance()
        onSuccess?.()
      } else {
        toast.error(response.message || 'Failed to process refund')
      }
    } catch (error: any) {
      console.error('Failed to process advance refund:', error)
      toast.error(error?.response?.data?.message || 'Failed to process advance refund')
    } finally {
      setSaving(false)
    }
  }

  // Cancel — after save, reload from DB (removes cancelled rows)
  const handleSaveCancel = async () => {
    const selectedItems = cancelItems.filter((item) => item.select && item.cancelAmt > 0)
    if (selectedItems.length === 0) {
      toast.error('Please select at least one receipt to cancel')
      return
    }

    const totalCancelAmount = selectedItems.reduce((sum, item) => sum + item.cancelAmt, 0)
    if (totalCancelAmount <= 0) {
      toast.error('Please enter valid cancellation amount')
      return
    }

    setSaving(true)
    try {
      const payload = {
        hotelid: hotelId,
        checkin_id: checkinId,
        detail_id: detailId || null,
        room_id: roomId || null,
        guest_name: cancelGuestName,
        room_no: cancelRoomNo,
        transaction_type: 'Advance Cancel',
        receipt_no: generateReceiptNumber('CN'),
        payment_method: 'Cash',
        amount: totalCancelAmount,
        debit_amount: totalCancelAmount,
        credit_amount: 0,
        reason: 'Cancellation request',
        narration: `Advance cancellation for ${selectedItems.length} receipt(s)`,
        reference_no: selectedItems.map((i) => i.receiptNo).join(','),
        transaction_datetime: cancelDate,
        created_by_id: userId,
        cancel_items: selectedItems.map((item) => ({ ...item, original_amount: item.amount })),
        bill_date: billDate,
      }

      const response = await AdvanceTransactionService.create(payload)
      if (response.success) {
        toast.success(
          `Advance Cancellation processed successfully for ₹${totalCancelAmount.toFixed(2)}`,
        )
        // Reload from DB — removes cancelled rows, keeps remaining ones
        await loadCancellableReceipts()
        await refreshPendingAdvance()
        onSuccess?.()
      } else {
        toast.error(response.message || 'Failed to process cancellation')
      }
    } catch (error: any) {
      console.error('Failed to process advance cancellation:', error)
      toast.error(error?.response?.data?.message || 'Failed to process advance cancellation')
    } finally {
      setSaving(false)
    }
  }

  const handleSavePosting = async () => {
    const selectedItems = postingItems.filter((item) => item.select && item.amt > 0)
    if (selectedItems.length === 0) {
      toast.error('Please select at least one advance to post')
      return
    }

    const totalPostedAmount = selectedItems.reduce((sum, item) => sum + item.amt, 0)
    if (totalPostedAmount <= 0) {
      toast.error('Please enter valid posting amount')
      return
    }

    setSaving(true)
    try {
      const payload = {
        hotelid: hotelId,
        checkin_id: checkinId,
        detail_id: detailId || null,
        room_id: roomId || null,
        guest_name: postingGuestName,
        room_no: roomNo,
        transaction_type: 'Advance Posting',
        receipt_no: postingDocNo,
        payment_method: 'Advance',
        amount: totalPostedAmount,
        debit_amount: totalPostedAmount,
        credit_amount: 0,
        reason: 'Room charge adjustment',
        narration: `Advance posted to room charges`,
        reference_no: selectedItems.map((i) => i.docNo).join(','),
        transaction_datetime: formatDateTimeForMySQL(new Date().toISOString()),
        created_by_id: userId,
        posting_items: selectedItems,
        bill_date: billDate,
      }

      const response = await AdvanceTransactionService.create(payload)
      if (response.success) {
        toast.success(`Advance Posting processed successfully for ₹${totalPostedAmount.toFixed(2)}`)
        await refreshPendingAdvance()
        onSuccess?.()
        resetPosting()
      } else {
        toast.error(response.message || 'Failed to process posting')
      }
    } catch (error: any) {
      console.error('Failed to process advance posting:', error)
      toast.error(error?.response?.data?.message || 'Failed to process advance posting')
    } finally {
      setSaving(false)
    }
  }

  // Addition — after save, append rows to savedAdditionItems with correct sequence numbers
  const handleSaveAddition = async () => {
    let allAdditionItems = [...additionItems]

    if (newAdditionItem.payType) {
      const amountValue =
        typeof newAdditionItem.amount === 'number'
          ? newAdditionItem.amount
          : parseFloat(String(newAdditionItem.amount)) || 0
      if (amountValue > 0) {
        const pendingId = String(Date.now())
        allAdditionItems = [
          ...additionItems,
          {
            ...newAdditionItem,
            id: pendingId,
            payTypeId: newAdditionItem.payTypeId,
            amount: amountValue,
          },
        ]
        setAdditionItems(allAdditionItems)
        setNewAdditionItem(buildDefaultAdditionItem(paymentMethods))
      }
    }

    if (allAdditionItems.length === 0) {
      toast.error('Please fill in at least one new addition item')
      return
    }

    let totalAmount = 0
    for (const item of allAdditionItems) {
      const itemAmount =
        typeof item.amount === 'number' ? item.amount : parseFloat(String(item.amount)) || 0
      totalAmount += itemAmount
    }

    if (isNaN(totalAmount) || totalAmount <= 0) {
      toast.error('Please enter a valid amount greater than zero')
      return
    }

    const uniquePayTypes = [...new Set(allAdditionItems.map((item) => item.payType))]
    const paymentMethod = uniquePayTypes.length === 1 ? uniquePayTypes[0] : 'Multiple'

    setSaving(true)
    try {
      const freshReceiptNo = generateReceiptNumber('AD')
      const formattedItems = allAdditionItems.map((item) => ({
        id: item.id,
        payType: item.payType,
        payTypeId: item.payTypeId,
        ledger: item.ledger,
        document: item.document,
        date: item.date,
        particulars: item.particulars,
        amount:
          typeof item.amount === 'number' ? item.amount : parseFloat(String(item.amount)) || 0,
        payment_method_id: item.payTypeId,
        payment_method_name: item.payType,
      }))

      const payload = {
        hotelid: hotelId,
        checkin_id: checkinId,
        detail_id: detailId || null,
        room_id: roomId || null,
        guest_name: additionGuestName,
        room_no: additionRoomNo,
        transaction_type: 'Advance Addition',
        receipt_no: freshReceiptNo,
        payment_method: paymentMethod,
        amount: totalAmount,
        debit_amount: 0,
        credit_amount: totalAmount,
        reason: additionReason || 'Advance payment addition',
        narration: allAdditionItems.map((i) => `${i.payType}: ${i.particulars}`).join('; '),
        reference_no: freshReceiptNo,
        transaction_datetime: additionDate,
        created_by_id: userId,
        items: formattedItems,
        bill_date: billDate,
      }

      const response = await AdvanceTransactionService.create(payload)
      if (response.success) {
        toast.success(`Advance Addition saved successfully for ₹${totalAmount.toFixed(2)}`)

        // Append newly saved rows to savedAdditionItems with sequential numbers
        const nextSeq = savedAdditionItems.length + 1
        const newlySaved: AdditionItem[] = allAdditionItems.map((item, idx) => ({
          ...item,
          seqNo: nextSeq + idx,
        }))
        setSavedAdditionItems((prev) => [...prev, ...newlySaved])
        setAdditionItems([])
        setNewAdditionItem(buildDefaultAdditionItem(paymentMethods))
        setEditingRowId(null)
        setAdditionDocNo(generateReceiptNumber('AD'))

        await refreshPendingAdvance()
        onSuccess?.()
      } else {
        toast.error(response.message || 'Failed to save addition')
      }
    } catch (error: any) {
      console.error('Failed to save advance addition:', error)
      if (
        error?.response?.data?.message?.includes('Duplicate entry') ||
        error?.message?.includes('ER_DUP_ENTRY')
      ) {
        toast.error('Duplicate receipt number. Please try again.')
      } else {
        toast.error(error?.response?.data?.message || 'Failed to save advance addition')
      }
    } finally {
      setSaving(false)
    }
  }

  // ==================== Computed values ====================
  // Live balance for cancel tab: pendingAdvance minus what's already selected to cancel
  const cancelSelectedTotal = cancelItems
    .filter((i) => i.select)
    .reduce((s, i) => s + (i.cancelAmt || 0), 0)

  // Live balance for refund tab
  const refundSelectedTotal = refundTopItems
    .filter((i) => i.select)
    .reduce((s, i) => s + (i.amt || 0), 0)

  // ==================== Render Functions ====================

  const renderBookingReceipt = () => (
    <>
      <div className="form-fields-container mb-2">
        <div className="form-field-row">
          <div className="form-field-item">
            <span className="field-label">Doc No. :</span>
            <Form.Control
              type="text"
              size="sm"
              value={receiptDocNo}
              onChange={(e) => setReceiptDocNo(e.target.value)}
              className="field-input"
              readOnly
            />
          </div>
          <div className="form-field-item">
            <span className="field-label">Date :</span>
            <Form.Control
              type="datetime-local"
              size="sm"
              value={receiptDate}
              onChange={(e) => setReceiptDate(e.target.value)}
              className="field-input"
            />
          </div>
        </div>
        <div className="form-field-row">
          <div className="form-field-item">
            <span className="field-label">Guest Name :</span>
            <Form.Control
              type="text"
              size="sm"
              value={receiptGuestName}
              onChange={(e) => setReceiptGuestName(e.target.value)}
              className="field-input"
            />
          </div>
          <div className="form-field-item">
            <span className="field-label">Company :</span>
            <Form.Control
              type="text"
              size="sm"
              value={receiptCompany}
              onChange={(e) => setReceiptCompany(e.target.value)}
              className="field-input"
            />
          </div>
        </div>
        <div className="form-field-row">
          <div className="form-field-item full-width">
            <span className="field-label">Against :</span>
            <Form.Control
              type="text"
              size="sm"
              value={receiptAgainst}
              onChange={(e) => setReceiptAgainst(e.target.value)}
              placeholder="e.g., Room Booking"
              className="field-input"
            />
          </div>
        </div>
      </div>

      <div className="action-table-container mb-2">
        <table className="action-table table table-bordered text-center align-middle">
          <thead className="table-light">
            <tr>
              <th>Pay Type</th>
              <th>Ledger</th>
              <th>Document</th>
              <th>Date</th>
              <th>Particulars</th>
              <th>Amount</th>
              <th style={{ width: '60px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {receiptItems.map((item) => (
              <tr
                key={item.id}
                style={{ backgroundColor: editingRowId === item.id ? '#fff8e1' : undefined }}>
                <td>{item.payType}</td>
                <td>{item.ledger}</td>
                <td>{item.document}</td>
                <td>{formatDateDisplay(item.date)}</td>
                <td>{item.particulars}</td>
                <td className="text-end">₹{item.amount.toLocaleString()}</td>
                <td>
                  <button
                    className="btn btn-xs btn-outline-primary me-1 py-0 px-1"
                    style={{ fontSize: '0.65rem' }}
                    onClick={() => handleEditReceiptRow(item)}
                    title="Edit">
                    ✏️
                  </button>
                  <button
                    className="btn btn-xs btn-outline-danger py-0 px-1"
                    style={{ fontSize: '0.65rem' }}
                    onClick={() => handleDeleteReceiptRow(item.id)}
                    title="Delete">
                    🗑
                  </button>
                </td>
              </tr>
            ))}
            <tr className="table-active">
              <td>
                <Form.Select
                  size="sm"
                  value={newReceiptItem.payTypeId ?? ''}
                  onChange={(e) => {
                    const selected = paymentMethods.find((pm) => String(pm.id) === e.target.value)
                    setNewReceiptItem({
                      ...newReceiptItem,
                      payTypeId: selected ? selected.id : undefined,
                      payType: selected ? selected.payment_method_name || selected.name : '',
                    })
                  }}>
                  <option value="">Pay Type</option>
                  {paymentMethods.map((pm) => (
                    <option key={pm.id} value={pm.id}>
                      {pm.name}
                    </option>
                  ))}
                </Form.Select>
              </td>
              <td>
                <Form.Control
                  type="text"
                  size="sm"
                  placeholder="Ledger"
                  value={newReceiptItem.ledger}
                  onChange={(e) => setNewReceiptItem({ ...newReceiptItem, ledger: e.target.value })}
                />
              </td>
              <td>
                <Form.Control
                  type="text"
                  size="sm"
                  placeholder="Document"
                  value={newReceiptItem.document}
                  onChange={(e) =>
                    setNewReceiptItem({ ...newReceiptItem, document: e.target.value })
                  }
                />
              </td>
              <td>
                <Form.Control
                  type="date"
                  size="sm"
                  value={newReceiptItem.date}
                  onChange={(e) => setNewReceiptItem({ ...newReceiptItem, date: e.target.value })}
                />
              </td>
              <td>
                <Form.Control
                  type="text"
                  size="sm"
                  placeholder="Particulars"
                  value={newReceiptItem.particulars}
                  onChange={(e) =>
                    setNewReceiptItem({ ...newReceiptItem, particulars: e.target.value })
                  }
                />
              </td>
              <td>
                <Form.Control
                  type="number"
                  size="sm"
                  placeholder="Amount"
                  value={newReceiptItem.amount || ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 0 : parseFloat(e.target.value)
                    setNewReceiptItem({ ...newReceiptItem, amount: isNaN(value) ? 0 : value })
                  }}
                  className="text-center"
                />
              </td>
              <td>
                {editingRowId ? (
                  <button
                    className="btn btn-xs btn-success py-0 px-1"
                    style={{ fontSize: '0.65rem' }}
                    onClick={handleUpdateReceiptRow}>
                    ✔
                  </button>
                ) : (
                  <button
                    className="btn btn-xs btn-primary py-0 px-1"
                    style={{ fontSize: '0.65rem' }}
                    onClick={handleAddReceiptRow}>
                    + Add
                  </button>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="d-flex justify-content-end align-items-center">
        <strong className="me-2" style={{ fontSize: '0.75rem' }}>
          Total Amount:
        </strong>
        <Form.Control
          type="text"
          size="sm"
          value={`₹${receiptItems.reduce((s, i) => s + i.amount, 0).toLocaleString()}`}
          readOnly
          className="text-end bg-light"
          style={{ width: '130px', fontSize: '0.75rem', fontWeight: 600 }}
        />
      </div>
    </>
  )

  const renderAdvanceRefund = () => (
    <>
      <div className="form-fields-container mb-2">
        <div className="form-field-row">
          <div className="form-field-item">
            <span className="field-label">Doc No. :</span>
            <Form.Control
              type="text"
              size="sm"
              value={refundDocNo}
              readOnly
              className="field-input bg-light"
            />
          </div>
          <div className="form-field-item">
            <span className="field-label">Date & Time :</span>
            <Form.Control
              type="datetime-local"
              size="sm"
              value={refundDate}
              onChange={(e) => setRefundDate(e.target.value)}
              className="field-input"
            />
          </div>
        </div>
      </div>

      {/* TOP TABLE: receipts available for refund */}
      <div className="action-table-container mb-2">
        <table className="action-table table table-bordered text-center align-middle">
          <thead className="table-light">
            <tr>
              <th>Doc No.</th>
              <th>Guest Name</th>
              <th>Company Name</th>
              <th>Reason</th>
              <th>Amt Receive</th>
              <th>Balance</th>
              <th>Select</th>
              <th>Refund Amt</th>
            </tr>
          </thead>
          <tbody>
            {refundTopItems.length > 0 ? (
              refundTopItems.map((item) => (
                <tr key={item.id} style={{ backgroundColor: item.select ? '#e8f5e9' : undefined }}>
                  <td>{item.docNo}</td>
                  <td>{item.guestName}</td>
                  <td>{item.companyName}</td>
                  <td>{item.reason}</td>
                  <td className="text-end">₹{item.amtReceive.toLocaleString()}</td>
                  <td className="text-end">₹{item.balance.toLocaleString()}</td>
                  <td>
                    <Form.Check
                      type="checkbox"
                      checked={item.select}
                      onChange={(e) => handleRefundSelectChange(item.id, e.target.checked)}
                    />
                  </td>
                  <td>
                    <Form.Control
                      type="number"
                      size="sm"
                      value={item.amt || ''}
                      onChange={(e) =>
                        setRefundTopItems((prev) =>
                          prev.map((r) =>
                            r.id === item.id ? { ...r, amt: parseFloat(e.target.value) || 0 } : r,
                          ),
                        )
                      }
                      className="text-center"
                      style={{ width: '100px' }}
                      placeholder="0"
                      max={item.balance}
                      disabled={!item.select}
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="text-muted py-3">
                  No advance receipts available for refund
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Balance info bar */}
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div className="d-flex align-items-center">
          <strong className="me-2" style={{ fontSize: '0.75rem' }}>
            Total Refund Amount :
          </strong>
          <Form.Control
            type="text"
            size="sm"
            value={`₹${refundSelectedTotal.toFixed(2)}`}
            readOnly
            className="text-end bg-light"
            style={{ width: '130px', fontSize: '0.75rem', fontWeight: 600 }}
          />
        </div>
      </div>

      {/* BOTTOM TABLE: payment method for refund disbursement */}
      <div className="action-table-container">
        <table className="action-table table table-bordered text-center align-middle">
          <thead className="table-light">
            <tr>
              <th>Mode Of Pay</th>
              <th>Ledger Name</th>
              <th>Rec No</th>
              <th>Date</th>
              <th>Narration</th>
              <th>Amount</th>
              <th style={{ width: '50px' }}>Del</th>
            </tr>
          </thead>
          <tbody>
            {refundBottomItems.map((item) => (
              <tr key={item.id}>
                <td>{item.modeOfPay}</td>
                <td>{item.ledgerName}</td>
                <td>{item.recNo}</td>
                <td>{formatDateDisplay(item.date)}</td>
                <td>{item.narration}</td>
                <td className="text-end">₹{item.amount.toLocaleString()}</td>
                <td>
                  <button
                    className="btn btn-xs btn-outline-danger py-0 px-1"
                    style={{ fontSize: '0.65rem' }}
                    onClick={() => handleDeleteRefundBottomRow(item.id)}>
                    🗑
                  </button>
                </td>
              </tr>
            ))}
            <tr className="table-active">
              <td>
                <Form.Select
                  size="sm"
                  value={newRefundBottomItem.modeOfPayId ?? ''}
                  onChange={(e) => {
                    const selected = paymentMethods.find((pm) => String(pm.id) === e.target.value)
                    setNewRefundBottomItem({
                      ...newRefundBottomItem,
                      modeOfPayId: selected ? selected.id : undefined,
                      modeOfPay: selected ? selected.payment_method_name || selected.name : '',
                    })
                  }}>
                  <option value="">Select Mode</option>
                  {paymentMethods.map((pm) => (
                    <option key={pm.id} value={pm.id}>
                      {pm.name}
                    </option>
                  ))}
                </Form.Select>
              </td>
              <td>
                <Form.Control
                  type="text"
                  size="sm"
                  placeholder="Ledger Name"
                  value={newRefundBottomItem.ledgerName || ''}
                  onChange={(e) =>
                    setNewRefundBottomItem({ ...newRefundBottomItem, ledgerName: e.target.value })
                  }
                />
              </td>
              <td>
                <Form.Control
                  type="text"
                  size="sm"
                  placeholder="Rec No"
                  value={newRefundBottomItem.recNo || ''}
                  onChange={(e) =>
                    setNewRefundBottomItem({ ...newRefundBottomItem, recNo: e.target.value })
                  }
                />
              </td>
              <td>
                <Form.Control
                  type="date"
                  size="sm"
                  value={newRefundBottomItem.date || ''}
                  onChange={(e) =>
                    setNewRefundBottomItem({ ...newRefundBottomItem, date: e.target.value })
                  }
                />
              </td>
              <td>
                <Form.Control
                  type="text"
                  size="sm"
                  placeholder="Narration"
                  value={newRefundBottomItem.narration || ''}
                  onChange={(e) =>
                    setNewRefundBottomItem({ ...newRefundBottomItem, narration: e.target.value })
                  }
                />
              </td>
              <td>
                <Form.Control
                  type="number"
                  size="sm"
                  placeholder="Amount"
                  value={newRefundBottomItem.amount || ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 0 : parseFloat(e.target.value)
                    setNewRefundBottomItem({
                      ...newRefundBottomItem,
                      amount: isNaN(value) ? 0 : value,
                    })
                  }}
                  className="text-center"
                />
              </td>
              <td>
                <button
                  className="btn btn-xs btn-primary py-0 px-1"
                  style={{ fontSize: '0.65rem' }}
                  onClick={handleAddRefundBottomRow}>
                  + Add
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  )

  const renderAdvanceCancel = () => (
    <>
      <div className="action-table-container">
        <table className="action-table table table-bordered text-center align-middle">
          <thead className="table-light">
            <tr>
              <th>Receipt No</th>
              <th>Date</th>
              <th>Description</th>
              <th>Narration</th>
              <th>Amount</th>
              <th>Select</th>
              <th>Cancel Amt</th>
            </tr>
          </thead>
          <tbody>
            {cancelItems.length > 0 ? (
              cancelItems.map((item) => (
                <tr key={item.id} style={{ backgroundColor: item.select ? '#fce4e4' : undefined }}>
                  <td>{item.receiptNo}</td>
                  <td>{item.date}</td>
                  <td>{item.description}</td>
                  <td>{item.narration}</td>
                  <td className="text-center">₹{item.amount.toLocaleString()}</td>
                  <td>
                    {/* Checkbox auto-fills cancelAmt with full available amount */}
                    <Form.Check
                      type="checkbox"
                      checked={item.select}
                      onChange={(e) => handleCancelSelectChange(item.id, e.target.checked)}
                    />
                  </td>
                  <td>
                    <Form.Control
                      type="number"
                      size="sm"
                      value={item.cancelAmt || ''}
                      onChange={(e) =>
                        setCancelItems((prev) =>
                          prev.map((r) =>
                            r.id === item.id
                              ? { ...r, cancelAmt: parseFloat(e.target.value) || 0 }
                              : r,
                          ),
                        )
                      }
                      className="text-center"
                      style={{ width: '100px' }}
                      placeholder="0"
                      max={item.amount}
                      disabled={!item.select}
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="text-muted py-3">
                  No receipts available for cancellation
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Balance info bar */}
      <div className="d-flex justify-content-between align-items-center mt-2">
        <div className="d-flex align-items-center">
          <strong className="me-2" style={{ fontSize: '0.75rem' }}>
            Total Cancel Amount :
          </strong>
          <Form.Control
            type="text"
            size="sm"
            value={`₹${cancelSelectedTotal.toFixed(2)}`}
            readOnly
            className="text-end bg-light"
            style={{ width: '130px', fontSize: '0.75rem', fontWeight: 600 }}
          />
        </div>
      </div>
    </>
  )

  const renderAdvancePosting = () => (
    <>
      <div className="action-table-container">
        <table className="action-table table table-bordered text-center align-middle">
          <thead className="table-light">
            <tr>
              <th>Doc No.</th>
              <th>Guest Name</th>
              <th>Company Name</th>
              <th>Reason</th>
              <th>Amt Receive</th>
              <th>Balance</th>
              <th>Select</th>
              <th>Amt</th>
              <th>Room</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {postingItems.length > 0 ? (
              postingItems.map((item) => (
                <tr key={item.id}>
                  <td>{item.docNo}</td>
                  <td>{item.guestName}</td>
                  <td>{item.companyName}</td>
                  <td>{item.reason}</td>
                  <td className="text-end">₹{item.amtReceive.toLocaleString()}</td>
                  <td className="text-end">₹{item.balance.toLocaleString()}</td>
                  <td>
                    <Form.Check
                      type="checkbox"
                      checked={item.select}
                      onChange={(e) =>
                        setPostingItems((prev) =>
                          prev.map((r) =>
                            r.id === item.id ? { ...r, select: e.target.checked } : r,
                          ),
                        )
                      }
                    />
                  </td>
                  <td>
                    <Form.Control
                      type="number"
                      size="sm"
                      value={item.amt || ''}
                      onChange={(e) =>
                        handlePostingAmountChange(item.id, parseFloat(e.target.value) || 0)
                      }
                      className="text-center"
                      style={{ width: '70px' }}
                      placeholder="0"
                      max={item.balance}
                    />
                  </td>
                  <td>{item.room}</td>
                  <td>
                    <Form.Control
                      type="number"
                      size="sm"
                      value={item.amt || ''}
                      onChange={(e) =>
                        handlePostingAmountChange(item.id, parseFloat(e.target.value) || 0)
                      }
                      className="text-center"
                      style={{ width: '70px' }}
                      placeholder="0"
                      max={item.balance}
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={10} className="text-muted py-3">
                  No advance available for posting
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="d-flex justify-content-end align-items-center mt-2">
        <strong className="me-2" style={{ fontSize: '0.75rem' }}>
          Total Posting Amount :
        </strong>
        <Form.Control
          type="text"
          size="sm"
          value={`₹${postingItems
            .filter((i) => i.select)
            .reduce((sum, i) => sum + (i.amt || 0), 0)
            .toFixed(2)}`}
          readOnly
          className="text-end bg-light"
          style={{ width: '130px', fontSize: '0.75rem', fontWeight: 600 }}
        />
      </div>
    </>
  )

  const renderAdvanceAddition = () => (
    <>
      <div className="form-fields-container mb-2">
        <div className="form-field-row">
          <div className="form-field-item">
            <span className="field-label">Doc No. :</span>
            <Form.Control
              type="text"
              size="sm"
              value={additionDocNo}
              onChange={(e) => setAdditionDocNo(e.target.value)}
              className="field-input"
              readOnly
            />
          </div>
          <div className="form-field-item">
            <span className="field-label">Date & Time :</span>
            <Form.Control
              type="datetime-local"
              size="sm"
              value={additionDate}
              onChange={(e) => setAdditionDate(e.target.value)}
              className="field-input"
            />
          </div>
        </div>
        <div className="form-field-row">
          <div className="form-field-item">
            <span className="field-label">Room No:</span>
            <Form.Control
              type="text"
              size="sm"
              value={additionRoomNo}
              readOnly
              className="field-input bg-light"
            />
          </div>
          <div className="form-field-item">
            <span className="field-label">Guest Name :</span>
            <Form.Control
              type="text"
              size="sm"
              value={additionGuestName}
              readOnly
              className="field-input bg-light"
            />
          </div>
        </div>
        <div className="form-field-row">
          <div className="form-field-item">
            <span className="field-label">Company :</span>
            <Form.Control
              type="text"
              size="sm"
              value={additionCompany}
              readOnly
              className="field-input bg-light"
            />
          </div>
        </div>
      </div>

      {/* Input table for new addition entries - No Action column, no Add button */}
      <div className="action-table-container mb-2">
        <table className="action-table table table-bordered text-center align-middle">
          <thead className="table-light">
            <tr>
              <th style={{ width: '60px' }}>Sr.no</th>
              <th>Pay Type</th>
              <th>Ledger</th>
              <th>Document</th>
              <th>Date</th>
              <th>Particulars</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {/* New unsaved rows — for data entry before save */}
            {additionItems.map((item, idx) => (
              <tr key={item.id} style={{ backgroundColor: '#fffde7' }}>
                <td style={{ fontWeight: 700, color: '#f57c00' }}>{idx + 1}</td>
                <td>{item.payType}</td>
                <td>{item.ledger}</td>
                <td>{item.document}</td>
                <td>{formatDateDisplay(item.date)}</td>
                <td>{item.particulars}</td>
                <td className="text-end">₹{Number(item.amount).toLocaleString()}</td>
              </tr>
            ))}

            {/* Input row for new entry — no Add button in table */}
            <tr className="table-active">
              <td style={{ fontSize: '0.65rem', color: '#000000', fontWeight: 500 }}>New</td>
              <td>
                <Form.Select
                  size="sm"
                  value={newAdditionItem.payTypeId ?? ''}
                  onChange={(e) => {
                    const selected = paymentMethods.find((pm) => String(pm.id) === e.target.value)
                    setNewAdditionItem({
                      ...newAdditionItem,
                      payTypeId: selected ? selected.id : undefined,
                      payType: selected ? selected.payment_method_name || selected.name : '',
                    })
                  }}>
                  {paymentMethods.map((pm) => (
                    <option key={pm.id} value={pm.id}>
                      {pm.name}
                    </option>
                  ))}
                </Form.Select>
              </td>
              <td>
                <Form.Control
                  type="text"
                  size="sm"
                  placeholder="Ledger"
                  value={newAdditionItem.ledger}
                  onChange={(e) =>
                    setNewAdditionItem({ ...newAdditionItem, ledger: e.target.value })
                  }
                />
              </td>
              <td>
                <Form.Control
                  type="text"
                  size="sm"
                  placeholder="Document"
                  value={newAdditionItem.document}
                  onChange={(e) =>
                    setNewAdditionItem({ ...newAdditionItem, document: e.target.value })
                  }
                />
              </td>
              <td>
                <Form.Control
                  type="date"
                  size="sm"
                  value={newAdditionItem.date || billDate}
                  onChange={(e) => setNewAdditionItem({ ...newAdditionItem, date: e.target.value })}
                />
              </td>
              <td>
                <Form.Control
                  type="text"
                  size="sm"
                  placeholder="Particulars"
                  value={newAdditionItem.particulars}
                  onChange={(e) =>
                    setNewAdditionItem({ ...newAdditionItem, particulars: e.target.value })
                  }
                />
              </td>
              <td>
                <Form.Control
                  type="number"
                  size="sm"
                  placeholder="Amount"
                  value={newAdditionItem.amount || ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 0 : parseFloat(e.target.value)
                    setNewAdditionItem({ ...newAdditionItem, amount: isNaN(value) ? 0 : value })
                  }}
                  className="text-center"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      {/* SAVED ENTRIES TABLE - shows after Save button click */}
      {savedAdditionItems.length > 0 && (
        <>
          <div
            className="action-table-container"
            style={{ maxHeight: '250px', border: '1px solid #dee2e6', borderRadius: '4px' }}>
            <table
              className="action-table table table-bordered text-center align-middle"
              style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead className="table-light">
                <tr>
                  <th
                    style={{
                      width: '60px',
                      border: '1px solid #dee2e6',
                      padding: '0.3rem 0.5rem',
                      backgroundColor: '#f8f9fa',
                      color: '#000000',
                      fontWeight: 600,
                    }}>
                    Sr.no
                  </th>
                  <th
                    style={{
                      border: '1px solid #dee2e6',
                      padding: '0.3rem 0.5rem',
                      backgroundColor: '#f8f9fa',
                      color: '#000000',
                      fontWeight: 600,
                    }}>
                    Pay Type
                  </th>
                  <th
                    style={{
                      border: '1px solid #dee2e6',
                      padding: '0.3rem 0.5rem',
                      backgroundColor: '#f8f9fa',
                      color: '#000000',
                      fontWeight: 600,
                    }}>
                    Ledger
                  </th>
                  <th
                    style={{
                      border: '1px solid #dee2e6',
                      padding: '0.3rem 0.5rem',
                      backgroundColor: '#f8f9fa',
                      color: '#000000',
                      fontWeight: 600,
                    }}>
                    Document
                  </th>
                  <th
                    style={{
                      border: '1px solid #dee2e6',
                      padding: '0.3rem 0.5rem',
                      backgroundColor: '#f8f9fa',
                      color: '#000000',
                      fontWeight: 600,
                    }}>
                    Date
                  </th>
                  <th
                    style={{
                      border: '1px solid #dee2e6',
                      padding: '0.3rem 0.5rem',
                      backgroundColor: '#f8f9fa',
                      color: '#000000',
                      fontWeight: 600,
                    }}>
                    Particulars
                  </th>
                  <th
                    style={{
                      border: '1px solid #dee2e6',
                      padding: '0.3rem 0.5rem',
                      backgroundColor: '#f8f9fa',
                      color: '#000000',
                      fontWeight: 600,
                    }}>
                    Amount
                  </th>
                  <th
                    style={{
                      width: '70px',
                      border: '1px solid #dee2e6',
                      padding: '0.3rem 0.5rem',
                      backgroundColor: '#f8f9fa',
                      color: '#000000',
                      fontWeight: 600,
                    }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {savedAdditionItems.map((item) => {
                  const isEditing = editingSavedAdditionId === item.id
                  return isEditing && editingSavedAdditionData ? (
                    <tr key={`saved-edit-${item.id}`} style={{ backgroundColor: '#fff8e1' }}>
                      <td
                        style={{
                          border: '1px solid #dee2e6',
                          padding: '0.2rem 0.3rem',
                          fontWeight: 700,
                          color: '#f57c00',
                        }}>
                        {item.seqNo}
                      </td>
                      <td style={{ border: '1px solid #dee2e6', padding: '0.2rem 0.3rem' }}>
                        <Form.Select
                          size="sm"
                          value={editingSavedAdditionData.payTypeId ?? ''}
                          onChange={(e) => {
                            const selected = paymentMethods.find(
                              (pm) => String(pm.id) === e.target.value,
                            )
                            handleEditSavedAdditionChange(
                              'payType',
                              selected ? selected.payment_method_name || selected.name : '',
                            )
                            handleEditSavedAdditionChange('payTypeId', selected ? selected.id : '')
                          }}>
                          {paymentMethods.map((pm) => (
                            <option key={pm.id} value={pm.id}>
                              {pm.name}
                            </option>
                          ))}
                        </Form.Select>
                      </td>
                      <td style={{ border: '1px solid #dee2e6', padding: '0.2rem 0.3rem' }}>
                        <Form.Control
                          size="sm"
                          type="text"
                          value={editingSavedAdditionData.ledger}
                          onChange={(e) => handleEditSavedAdditionChange('ledger', e.target.value)}
                        />
                      </td>
                      <td style={{ border: '1px solid #dee2e6', padding: '0.2rem 0.3rem' }}>
                        <Form.Control
                          size="sm"
                          type="text"
                          value={editingSavedAdditionData.document}
                          onChange={(e) =>
                            handleEditSavedAdditionChange('document', e.target.value)
                          }
                        />
                      </td>
                      <td style={{ border: '1px solid #dee2e6', padding: '0.2rem 0.3rem' }}>
                        <Form.Control
                          size="sm"
                          type="date"
                          value={editingSavedAdditionData.date?.slice(0, 10) || ''}
                          onChange={(e) => handleEditSavedAdditionChange('date', e.target.value)}
                        />
                      </td>
                      <td style={{ border: '1px solid #dee2e6', padding: '0.2rem 0.3rem' }}>
                        <Form.Control
                          size="sm"
                          type="text"
                          value={editingSavedAdditionData.particulars}
                          onChange={(e) =>
                            handleEditSavedAdditionChange('particulars', e.target.value)
                          }
                        />
                      </td>
                      <td style={{ border: '1px solid #dee2e6', padding: '0.2rem 0.3rem' }}>
                        <Form.Control
                          size="sm"
                          type="number"
                          value={editingSavedAdditionData.amount || ''}
                          onChange={(e) =>
                            handleEditSavedAdditionChange('amount', parseFloat(e.target.value) || 0)
                          }
                          className="text-end"
                        />
                      </td>
                      <td
                        style={{
                          border: '1px solid #dee2e6',
                          padding: '0.2rem 0.3rem',
                          whiteSpace: 'nowrap',
                        }}>
                        <button
                          className="btn btn-xs btn-success py-0 px-1 me-1"
                          style={{ fontSize: '0.6rem' }}
                          onClick={handleUpdateSavedAddition}
                          title="Save">
                          ✔
                        </button>
                        <button
                          className="btn btn-xs btn-secondary py-0 px-1"
                          style={{ fontSize: '0.6rem' }}
                          onClick={handleCancelEditSavedAddition}
                          title="Cancel">
                          ✖
                        </button>
                      </td>
                    </tr>
                  ) : (
                    <tr key={`saved-${item.id}`} style={{ backgroundColor: '#f0f7ff' }}>
                      <td
                        style={{
                          border: '1px solid #dee2e6',
                          padding: '0.4rem 0.4rem',
                          fontWeight: 700,
                          color: '#1787ff',
                        }}>
                        {item.seqNo}
                      </td>
                      <td style={{ border: '1px solid #dee2e6', padding: '0.4rem 0.4rem' }}>
                        {item.payType}
                      </td>
                      <td style={{ border: '1px solid #dee2e6', padding: '0.4rem 0.4rem' }}>
                        {item.ledger}
                      </td>
                      <td style={{ border: '1px solid #dee2e6', padding: '0.4rem 0.4rem' }}>
                        {item.document}
                      </td>
                      <td style={{ border: '1px solid #dee2e6', padding: '0.4rem 0.4rem' }}>
                        {formatDateDisplay(item.date)}
                      </td>
                      <td style={{ border: '1px solid #dee2e6', padding: '0.4rem 0.4rem' }}>
                        {item.particulars}
                      </td>
                      <td
                        style={{
                          border: '1px solid #dee2e6',
                          padding: '0.4rem 0.4rem',
                          textAlign: 'center',
                          color: '#0d6efd',
                          fontWeight: 600,
                        }}>
                        ₹{Number(item.amount).toLocaleString()}
                      </td>
                      <td
                        style={{
                          border: '1px solid #dee2e6',
                          padding: '0.4rem 0.3rem',
                          whiteSpace: 'nowrap',
                          textAlign: 'center',
                          verticalAlign: 'middle',
                        }}>
                        <div className="d-flex align-items-center justify-content-center gap-1">
                          {/* Edit Button */}
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary d-flex align-items-center justify-content-center"
                            style={{
                              width: '22px',
                              height: '22px',
                              padding: '0',
                              borderRadius: '4px',
                            }}
                            onClick={() => handleEditSavedAddition(item)}
                            title="Edit">
                            <i className="fi fi-rr-edit" style={{ fontSize: '0.75rem' }} />
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger d-flex align-items-center justify-content-center"
                            style={{
                              width: '22px',
                              height: '22px',
                              padding: '0',
                              borderRadius: '4px',
                            }}
                            onClick={() => handleDeleteSavedAddition(item.id)}
                            title="Delete">
                            <i className="fi fi-rr-trash" style={{ fontSize: '0.75rem' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  )

  const handleExit = () => {
    setActiveTab(null)
    onHide()
  }

  const renderFooter = () => {
    const saveBtn = (
      <Button
        variant="success"
        size="sm"
        onClick={
          activeTab === 'receipt'
            ? handleSaveReceipt
            : activeTab === 'refund'
              ? handleSaveRefund
              : activeTab === 'cancel'
                ? handleSaveCancel
                : activeTab === 'posting'
                  ? handleSavePosting
                  : activeTab === 'addition'
                    ? handleSaveAddition
                    : () => {}
        }
        disabled={saving}
        className="footer-btn">
        {saving ? (
          <>
            <span className="spinner-border spinner-border-sm me-1"></span>Saving...
          </>
        ) : (
          'Save'
        )}
      </Button>
    )

    const exitBtn = (
      <Button variant="danger" size="sm" onClick={handleExit} className="footer-btn">
        Exit
      </Button>
    )

    if (activeTab === 'receipt') {
      return (
        <div className="d-flex justify-content-end gap-2 w-100">
          <Button variant="primary" size="sm" onClick={() => resetReceipt()} className="footer-btn">
            New
          </Button>
          {saveBtn}
          {exitBtn}
        </div>
      )
    }

    return (
      <div className="d-flex justify-content-end gap-2 w-100">
        {saveBtn}
        {exitBtn}
      </div>
    )
  }

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      size="xl"
      backdrop="static"
      className="advance-modal">
      <Modal.Header closeButton className="py-2">
        <Modal.Title className="fs-6">
          ADVANCE MANAGEMENT {roomId && `- Room ${roomNo}`}
          {pendingAdvance > 0 && (
            <span
              className="ms-3"
              style={{ fontSize: '0.75rem', fontWeight: 400, color: '#d4edff', opacity: 0.9 }}>
              Pending Advance:{' '}
              <strong style={{ color: '#fff' }}>₹{pendingAdvance.toFixed(2)}</strong>
            </span>
          )}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="pb-2">
        {isLoadingData && (
          <div className="text-center py-3">
            <div className="spinner-border spinner-border-sm text-primary me-2"></div>
            <span className="small">Loading data...</span>
          </div>
        )}
        <Card>
          <Card.Body className="p-2">
            <div className="d-flex gap-2">
              <div className="left-side-buttons" style={{ width: '140px', flexShrink: 0 }}>
                <div className="d-flex flex-column gap-1">
                  <Button
                    variant={activeTab === 'receipt' ? 'success' : 'outline-success'}
                    className="w-100 py-1 rounded-0 fw-semibold"
                    size="sm"
                    onClick={() => resetTab('receipt')}>
                    Booking Receipt
                  </Button>
                  <Button
                    variant={activeTab === 'refund' ? 'danger' : 'outline-danger'}
                    className="w-100 py-1 rounded-0 fw-small"
                    size="sm"
                    onClick={() => resetTab('refund')}>
                    Advance Refund
                  </Button>
                  <Button
                    variant={activeTab === 'cancel' ? 'secondary' : 'outline-secondary'}
                    className="w-100 py-1 rounded-0 fw-small"
                    size="sm"
                    onClick={() => resetTab('cancel')}>
                    Advance Cancel
                  </Button>
                  <Button
                    variant={activeTab === 'posting' ? 'warning' : 'outline-warning'}
                    className="w-100 py-1 rounded-0 fw-small"
                    size="sm"
                    onClick={() => resetTab('posting')}>
                    Advance Posting
                  </Button>
                  <Button
                    variant={activeTab === 'addition' ? 'info' : 'outline-info'}
                    className="w-100 py-1 rounded-0 fw-small"
                    size="sm"
                    onClick={() => resetTab('addition')}>
                    Advance Addition
                  </Button>
                </div>
              </div>
              <div className="flex-grow-1" style={{ minHeight: '400px' }}>
                {!activeTab && (
                  <div className="text-center text-muted py-5">
                    <i className="fi fi-rr-money-bill fs-1 mb-3 d-block"></i>
                    <p className="mb-0">Click any button on the left to start a transaction</p>
                    <p className="small mt-2">Pending Advance: ₹{pendingAdvance.toFixed(2)}</p>
                  </div>
                )}
                {activeTab === 'receipt' && renderBookingReceipt()}
                {activeTab === 'refund' && renderAdvanceRefund()}
                {activeTab === 'cancel' && renderAdvanceCancel()}
                {activeTab === 'posting' && renderAdvancePosting()}
                {activeTab === 'addition' && renderAdvanceAddition()}
              </div>
            </div>
          </Card.Body>
        </Card>
      </Modal.Body>
      {activeTab && <Modal.Footer className="py-1">{renderFooter()}</Modal.Footer>}
      <style>{`
        .advance-modal .modal-dialog { max-width: 1100px; width: 90%; }
        .advance-modal .modal-header { background: #1787ff; border-bottom: none; padding: 0.5rem; }
        .advance-modal .modal-header .modal-title { color: white; font-size: 0.875rem; font-weight: 650; }
        .advance-modal .modal-header .btn-close { filter: brightness(0) invert(1); }
        .advance-modal .modal-footer { border-top: 1px solid #dee2e6; background-color: #f8f9fa; }
        .advance-modal .bg-light { background-color: #f0f0f0 !important; }
        .advance-modal .form-control.bg-light, .advance-modal .form-select.bg-light { background-color: #f5f5f5 !important; border-color: #e0e0e0; }
        .advance-modal input[type="number"] { text-align: right; }
        .advance-modal .card { border-radius: 8px; }
        .advance-modal .action-table thead th {color: #000000 !important;background-color: #f8f9fa !important;font-weight: 600 !important;}
        .left-side-buttons { border-right: 1px solid #bdbdbd; padding-right: 0.5rem; }
        .form-fields-container { display: flex; flex-direction: column; gap: 4px; }
        .form-field-row { display: flex; gap: 0px; flex-wrap: wrap; }
        .form-field-item { flex: 1; min-width: calc(50% - 4px); display: flex; align-items: center; gap: 4px; }
        .form-field-item.full-width { min-width: 100%; }
        .field-label { font-weight: 600; font-size: 0.7rem; white-space: nowrap; width: 70px; min-width: 70px; flex-shrink: 0; text-align: left; color: #333; }
        .field-input { flex: 1; max-width: 160px; font-size: 0.7rem; padding: 0.2rem 0.4rem; height: auto; }
        .field-input.form-control-sm { font-size: 0.7rem; padding: 0.2rem 0.4rem; }

        .action-table-container { overflow-y: auto; margin-bottom: 0.5rem; border: 1px solid #dee2e6; border-radius: 4px; max-height: 280px; }
        .action-table { width: 100%; margin-bottom: 0; font-size: 0.7rem; }
        .action-table thead th { position: sticky; top: 0; background-color: #ffffff; z-index: 1; border-bottom: 2px solid #dee2e6; padding: 0.3rem 0.5rem; white-space: nowrap; }
        .action-table tbody td { padding: 0.4rem 0.4rem; white-space: nowrap; }
        .action-table tbody tr:hover { background-color: #f5f5f5; cursor: pointer; }
        .advance-modal .modal-footer .footer-btn { min-width: 70px; font-size: 0.7rem; padding: 0.2rem 0.6rem; font-weight: 600; letter-spacing: 0.02em; }
        .btn-xs { font-size: 0.65rem; padding: 0.1rem 0.35rem; line-height: 1.4; }
      `}</style>
    </Modal>
  )
}

export default Advance
