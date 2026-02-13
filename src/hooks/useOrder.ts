/**
 * useOrder - Custom hook for managing order-related API calls
 * Provides clean state management for loading, error, and data
 * Follows best practices for React hooks
 */

import { useState, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import OrderService, {
  CreateBillPayload,
  SettleBillRequest,
  CreateKOTPayload,
  BillDetailsResponse,
  UnbilledItemsResponse,
  PendingOrder,
  OutletSettings,
  PaymentMode,
  WaiterUser,
  Customer,
  TaxRates,
  ReverseKOTItem
} from '@/common/api/order'

/* ═══════════════════════════════════════════════════════════════════════════════
 * Types
 * ═══════════════════════════════════════════════════════════════════════════════ */

export interface UseOrderState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export interface UseOrderActions<T> {
  execute: () => Promise<T | undefined>
  reset: () => void
}

export type UseOrderReturn<T> = UseOrderState<T> & UseOrderActions<T>

/* ═══════════════════════════════════════════════════════════════════════════════
 * Generic Hook Factory
 * ═══════════════════════════════════════════════════════════════════════════════ */

function createUseOrderHook<T>(
  serviceCall: () => Promise<any>,
  defaultData: T | null = null,
  showSuccessToast: boolean = false,
  successMessage: string = 'Operation successful'
) {
  return (): UseOrderReturn<T> => {
    const [data, setData] = useState<T | null>(defaultData)
    const [loading, setLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)

    const execute = useCallback(async (): Promise<T | undefined> => {
      setLoading(true)
      setError(null)

      try {
        const response = await serviceCall()
        
        // Handle ApiResponse format
        if (response && typeof response === 'object' && 'success' in response) {
          if (response.success) {
            if (showSuccessToast) {
              toast.success(response.message || successMessage)
            }
            setData(response.data as T)
            return response.data as T
          } else {
            const errorMessage = response.message || 'Operation failed'
            setError(errorMessage)
            toast.error(errorMessage)
            return undefined
          }
        }
        
        // Handle direct data response
        setData(response as T)
        return response as T
      } catch (err: any) {
        const errorMessage = err.message || 'An unexpected error occurred'
        setError(errorMessage)
        toast.error(errorMessage)
        return undefined
      } finally {
        setLoading(false)
      }
    }, [])

    const reset = useCallback(() => {
      setData(defaultData)
      setError(null)
      setLoading(false)
    }, [defaultData])

    return {
      data,
      loading,
      error,
      execute,
      reset
    }
  }
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * Specific Order Hooks
 * ═══════════════════════════════════════════════════════════════════════════════ */

/**
 * Hook for fetching all bills
 */
export const useGetAllBills = createUseOrderHook<any[]>(
  () => OrderService.getAllBills().then(res => res.data)
)

/**
 * Hook for fetching bill by ID
 */
export const useGetBillById = (id: number | null) => {
  const [data, setData] = useState<BillDetailsResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(async (): Promise<BillDetailsResponse | undefined> => {
    if (!id) return undefined
    
    setLoading(true)
    setError(null)

    try {
      const response = await OrderService.getBillById(id)
      
      if (response.success) {
        setData(response.data)
        return response.data
      } else {
        setError(response.message)
        toast.error(response.message)
        return undefined
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch bill'
      setError(errorMessage)
      toast.error(errorMessage)
      return undefined
    } finally {
      setLoading(false)
    }
  }, [id])

  return { data, loading, error, execute }
}

/**
 * Hook for fetching unbilled items by table
 */
export const useGetUnbilledItemsByTable = (tableId: number | null) => {
  const [data, setData] = useState<UnbilledItemsResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(async (): Promise<UnbilledItemsResponse | undefined> => {
    if (!tableId) return undefined
    
    setLoading(true)
    setError(null)

    try {
      const response = await OrderService.getUnbilledItemsByTable(tableId)
      
      if (response.success) {
        setData(response.data)
        return response.data
      } else {
        setError(response.message)
        return undefined
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch unbilled items'
      setError(errorMessage)
      return undefined
    } finally {
      setLoading(false)
    }
  }, [tableId])

  return { data, loading, error, execute }
}

/**
 * Hook for creating a KOT
 */
export const useCreateKOT = () => {
  const [data, setData] = useState<any | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(async (payload: CreateKOTPayload): Promise<any | undefined> => {
    setLoading(true)
    setError(null)

    try {
      const response = await OrderService.createKOT(payload)
      
      if (response.success) {
        setData(response.data)
        toast.success(response.message || 'KOT saved successfully!')
        return response.data
      } else {
        setError(response.message)
        toast.error(response.message || 'Failed to save KOT')
        return undefined
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to save KOT'
      setError(errorMessage)
      toast.error(errorMessage)
      return undefined
    } finally {
      setLoading(false)
    }
  }, [])

  return { data, loading, error, execute }
}

/**
 * Hook for creating reverse KOT
 */
export const useCreateReverseKOT = () => {
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(async (payload: {
    txnId: number
    tableId: number
    kotType: string
    isReverseKot: number
    reversedItems: ReverseKOTItem[]
    userId: number
    reversalReason: string
  }): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      const response = await OrderService.createReverseKOT(payload)
      
      if (response.success) {
        toast.success('Reverse KOT processed successfully.')
        return true
      } else {
        setError(response.message)
        toast.error(response.message || 'Failed to process reverse KOT')
        return false
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to process reverse KOT'
      setError(errorMessage)
      toast.error(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, error, execute }
}

/**
 * Hook for fetching pending orders
 */
export const useGetPendingOrders = (type: 'pickup' | 'delivery' | null) => {
  const [data, setData] = useState<PendingOrder[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(async (): Promise<PendingOrder[] | undefined> => {
    if (!type) return undefined
    
    setLoading(true)
    setError(null)

    try {
      const response = await OrderService.getPendingOrders(type)
      
      if (response.success) {
        setData(response.data)
        return response.data
      } else {
        setError(response.message)
        return undefined
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch pending orders'
      setError(errorMessage)
      return undefined
    } finally {
      setLoading(false)
    }
  }, [type])

  return { data, loading, error, execute }
}

/**
 * Hook for fetching outlet settings
 */
export const useGetOutletSettings = (outletId: number | null) => {
  const [data, setData] = useState<OutletSettings | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(async (): Promise<OutletSettings | undefined> => {
    if (!outletId) return undefined
    
    setLoading(true)
    setError(null)

    try {
      const response = await OrderService.getOutletSettings(outletId)
      
      if (response.success) {
        setData(response.data)
        return response.data
      } else {
        setError(response.message)
        return undefined
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch outlet settings'
      setError(errorMessage)
      return undefined
    } finally {
      setLoading(false)
    }
  }, [outletId])

  return { data, loading, error, execute }
}

/**
 * Hook for fetching payment modes
 */
export const useGetPaymentModes = (outletId: number | null) => {
  const [data, setData] = useState<PaymentMode[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(async (): Promise<PaymentMode[] | undefined> => {
    if (!outletId) return undefined
    
    setLoading(true)
    setError(null)

    try {
      const response = await OrderService.getPaymentModesByOutlet(outletId)
      
      if (response.success) {
        setData(response.data)
        return response.data
      } else {
        setError(response.message)
        return []
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch payment modes'
      setError(errorMessage)
      return []
    } finally {
      setLoading(false)
    }
  }, [outletId])

  return { data, loading, error, execute }
}

/**
 * Hook for fetching waiter users
 */
export const useGetWaiterUsers = (outletId: number | null) => {
  const [data, setData] = useState<WaiterUser[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(async (): Promise<WaiterUser[] | undefined> => {
    if (!outletId) return undefined
    
    setLoading(true)
    setError(null)

    try {
      const response = await OrderService.getWaiterUsers(outletId)
      
      if (response.success) {
        setData(response.data)
        return response.data
      } else {
        setError(response.message)
        return []
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch waiter users'
      setError(errorMessage)
      return []
    } finally {
      setLoading(false)
    }
  }, [outletId])

  return { data, loading, error, execute }
}

/**
 * Hook for fetching customer by mobile
 */
export const useGetCustomerByMobile = () => {
  const [data, setData] = useState<Customer | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(async (mobile: string): Promise<Customer | undefined> => {
    if (!mobile || mobile.length < 10) return undefined
    
    setLoading(true)
    setError(null)

    try {
      const response = await OrderService.getCustomerByMobile(mobile)
      
      if (response.success) {
        setData(response.data)
        return response.data
      } else {
        setError(response.message)
        return undefined
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch customer'
      setError(errorMessage)
      return undefined
    } finally {
      setLoading(false)
    }
  }, [])

  return { data, loading, error, execute }
}

/**
 * Hook for fetching tax rates
 */
export const useGetTaxRates = () => {
  const [data, setData] = useState<TaxRates | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(async (outletId: number | null, departmentId: number | null): Promise<TaxRates | undefined> => {
    if (!outletId || !departmentId) return undefined
    
    setLoading(true)
    setError(null)

    try {
      const response = await OrderService.getTaxesByOutletAndDepartment({
        outletid: outletId,
        departmentid: departmentId
      })
      
      if (response.success && response.data?.taxes) {
        const taxes = response.data.taxes
        setData({
          cgst: Number(taxes.cgst) || 0,
          sgst: Number(taxes.sgst) || 0,
          igst: Number(taxes.igst) || 0,
          cess: Number(taxes.cess) || 0
        })
        return data!
      } else {
        setData({ cgst: 0, sgst: 0, igst: 0, cess: 0 })
        return { cgst: 0, sgst: 0, igst: 0, cess: 0 }
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch tax rates'
      setError(errorMessage)
      return { cgst: 0, sgst: 0, igst: 0, cess: 0 }
    } finally {
      setLoading(false)
    }
  }, [])

  return { data, loading, error, execute }
}

/**
 * Hook for settling a bill
 */
export const useSettleBill = () => {
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(async (txnId: number, payload: SettleBillRequest): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      const response = await OrderService.settleBill(txnId, payload)
      
      if (response.success) {
        toast.success('Settlement successful!')
        return true
      } else {
        setError(response.message)
        toast.error(response.message || 'Failed to settle bill')
        return false
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to settle bill'
      setError(errorMessage)
      toast.error(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, error, execute }
}

/**
 * Hook for marking bill as billed
 */
export const useMarkBillAsBilled = () => {
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(async (
    txnId: number,
    payload: {
      outletId: number
      customerName?: string | null
      mobileNo?: string | null
      customerid?: number | null
    }
  ): Promise<any | undefined> => {
    setLoading(true)
    setError(null)

    try {
      const response = await OrderService.markBillAsBilled(txnId, payload)
      
      if (response.success) {
        toast.success('Bill marked as printed!')
        return response.data
      } else {
        setError(response.message)
        toast.error(response.message || 'Failed to mark bill as printed')
        return undefined
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to mark bill as printed'
      setError(errorMessage)
      toast.error(errorMessage)
      return undefined
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, error, execute }
}

/**
 * Hook for applying discount
 */
export const useApplyDiscount = () => {
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(async (
    txnId: number,
    payload: {
      discount: number
      discPer: number
      discountType: number
      tableId: number
      items: any[]
    }
  ): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      const response = await OrderService.applyDiscount(txnId, payload)
      
      if (response.success) {
        toast.success('Discount applied successfully!')
        return true
      } else {
        setError(response.message)
        toast.error(response.message || 'Failed to apply discount')
        return false
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to apply discount'
      setError(errorMessage)
      toast.error(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, error, execute }
}

/**
 * Hook for updating table status
 */
export const useUpdateTableStatus = () => {
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(async (tableId: number, status: number): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      const response = await OrderService.updateTableStatus(tableId, { status })
      
      if (response.success) {
        return true
      } else {
        setError(response.message)
        return false
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update table status'
      setError(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, error, execute }
}

/**
 * Hook for fetching bill status
 */
export const useGetBillStatus = (tableId: number | null) => {
  const [data, setData] = useState<any | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(async (): Promise<any | undefined> => {
    if (!tableId) return undefined
    
    setLoading(true)
    setError(null)

    try {
      const response = await OrderService.getBillStatus(tableId)
      
      if (response.success) {
        setData(response.data)
        return response.data
      } else {
        setError(response.message)
        return undefined
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch bill status'
      setError(errorMessage)
      return undefined
    } finally {
      setLoading(false)
    }
  }, [tableId])

  return { data, loading, error, execute }
}

/**
 * Hook for reversing a bill
 */
export const useReverseBill = () => {
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(async (txnId: number, userId: number): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      const response = await OrderService.reverseBill(txnId, { userId })
      
      if (response.success) {
        toast.success('Bill reversed successfully!')
        return true
      } else {
        setError(response.message)
        toast.error(response.message || 'Failed to reverse bill')
        return false
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to reverse bill'
      setError(errorMessage)
      toast.error(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, error, execute }
}

/**
 * Hook for applying NCKOT
 */
export const useApplyNCKOT = () => {
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(async (
    txnId: number,
    payload: { NCName: string; NCPurpose: string; userId: number }
  ): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      const response = await OrderService.applyNCKOT(txnId, payload)
      
      if (response.success) {
        toast.success('NCKOT applied successfully!')
        return true
      } else {
        setError(response.message)
        toast.error(response.message || 'Failed to apply NCKOT')
        return false
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to apply NCKOT'
      setError(errorMessage)
      toast.error(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, error, execute }
}

/**
 * Hook for verifying creator password
 */
export const useVerifyCreatorPassword = () => {
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(async (password: string): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      const response = await OrderService.verifyCreatorPassword(password)
      
      if (response.success && response.data?.verified) {
        return true
      } else {
        setError('Invalid password')
        return false
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to verify password'
      setError(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, error, execute }
}

/**
 * Hook for verifying bill creator password
 */
export const useVerifyBillCreatorPassword = () => {
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(async (password: string, txnId: string): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      const response = await OrderService.verifyBillCreatorPassword(password, txnId)
      
      if (response.success && response.data?.verified) {
        return true
      } else {
        setError('Invalid password')
        return false
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to verify password'
      setError(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, error, execute }
}

/**
 * Hook for fetching saved KOTs
 */
export const useGetSavedKOTs = () => {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(async (filters?: { isBilled?: number; tableId?: number }): Promise<any[] | undefined> => {
    setLoading(true)
    setError(null)

    try {
      const response = await OrderService.getSavedKOTs(filters)
      
      if (response.success) {
        setData(response.data)
        return response.data
      } else {
        setError(response.message)
        return []
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch saved KOTs'
      setError(errorMessage)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  return { data, loading, error, execute }
}

/**
 * Hook for fetching quick bills
 */
export const useGetQuickBills = () => {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(async (): Promise<any[] | undefined> => {
    setLoading(true)
    setError(null)

    try {
      const response = await OrderService.getQuickBills()
      
      if (response.success) {
        setData(response.data)
        return response.data
      } else {
        setError(response.message)
        return []
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch quick bills'
      setError(errorMessage)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  return { data, loading, error, execute }
}

/**
 * Hook for fetching billed bill by table
 */
export const useGetBilledBillByTable = (tableId: number | null) => {
  const [data, setData] = useState<BillDetailsResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(async (): Promise<BillDetailsResponse | undefined> => {
    if (!tableId) return undefined
    
    setLoading(true)
    setError(null)

    try {
      const response = await OrderService.getBilledBillByTable(tableId)
      
      if (response.success) {
        setData(response.data)
        return response.data
      } else {
        setData(null)
        return undefined
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch billed bill'
      setError(errorMessage)
      setData(null)
      return undefined
    } finally {
      setLoading(false)
    }
  }, [tableId])

  return { data, loading, error, execute }
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * Menu Item Types (for useOrder hook)
 * ═══════════════════════════════════════════════════════════════════════════════ */

/** Menu item interface for order items */
export interface MenuItem {
  id: number
  name: string
  price: number
  qty: number
  isBilled: number
  isNCKOT: number
  NCName: string
  NCPurpose: string
  table_name?: string
  isNew?: boolean
  alternativeItem?: string
  modifier?: string[]
  item_no?: string
  originalQty?: number
  kotNo?: number
  txnDetailId?: number
  isReverse?: boolean
  revQty?: number
  order_tag?: string
}

/** Reversed menu item interface */
export interface ReversedMenuItem extends MenuItem {
  isReversed: true
  reversalLogId: number
  status: 'Reversed'
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * useOrder Hook - Main hook for order management with refreshItemsForTable
 * ═══════════════════════════════════════════════════════════════════════════════ */

/**
 * useOrder - Comprehensive hook for order management
 * Contains the refreshItemsForTable function with all mapping logic from Orders.tsx
 * Manages all order-related state including items, transactions, KOTs, discounts
 */
export const useOrder = () => {
  // ═══════════════════════════════════════════════════════════════════════════
  // State Management
  // ═══════════════════════════════════════════════════════════════════════════
  
  const [items, setItems] = useState<MenuItem[]>([])
  const [reversedItems, setReversedItems] = useState<ReversedMenuItem[]>([])
  const [currentTxnId, setCurrentTxnId] = useState<number | null>(null)
  const [orderNo, setOrderNo] = useState<string | null>(null)
  const [currentKOTNo, setCurrentKOTNo] = useState<number | null>(null)
  const [currentKOTNos, setCurrentKOTNos] = useState<number[]>([])
  const [billActionState, setBillActionState] = useState<'initial' | 'printOrSettle'>('initial')
  
  // Persistent IDs for reversal operations
  const [persistentTxnId, setPersistentTxnId] = useState<number | null>(null)
  const [persistentTableId, setPersistentTableId] = useState<number | null>(null)
  
  // Discount state
  const [discount, setDiscount] = useState<number>(0)
  const [discountInputValue, setDiscountInputValue] = useState<number>(0)
  const [discountType, setDiscountType] = useState<number>(1) // 1 for percentage, 0 for amount
  
  // Customer state
  const [customerName, setCustomerName] = useState<string>('')
  const [mobileNumber, setMobileNumber] = useState<string>('')
  const [customerId, setCustomerId] = useState<number | null>(null)
  
  // Bill printed info
  const [billPrintedTime, setBillPrintedTime] = useState<string | null>(null)
  const [netAmount, setNetAmount] = useState<number | null>(null)

  // Loading state
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // ═══════════════════════════════════════════════════════════════════════════
  // refreshItemsForTable - Core function with all mapping logic
  // ═══════════════════════════════════════════════════════════════════════════

  const refreshItemsForTable = useCallback(async (tableIdNum: number) => {
    setLoading(true)
    setError(null)

    try {
      // Step 1: Try to fetch the latest billed (but not settled) bill
      const billedBillRes = await OrderService.getBilledBillByTable(tableIdNum)

      if (billedBillRes && billedBillRes.success && billedBillRes.data) {
        const billedData = billedBillRes.data as any
        const details = billedData.details || []
        const reversedItemsData = billedData.reversedItems || []
        const header = billedData.header || {}
        
        // Map billed bill details to MenuItem[]
        const fetchedItems: MenuItem[] = (details).map((item: any) => {
          const originalQty = Number(item.Qty) || 0
          const revQty = Number(item.RevQty) || 0
          return {
            id: item.ItemID,
            txnDetailId: item.TXnDetailID,
            item_no: item.item_no,
            name: item.ItemName || item.itemName || 'Unknown Item',
            price: item.RuntimeRate,
            qty: originalQty - revQty,
            isBilled: item.isBilled,
            revQty: revQty,
            isNCKOT: item.isNCKOT || 0,
            NCName: item.NCName || '',
            NCPurpose: item.NCPurpose || '',
            isNew: false,
            originalQty: originalQty,
            kotNo: item.KOTNo,
          }
        })

        // Set all state for billed items
        setItems(fetchedItems)
        setPersistentTxnId(header.TxnID || null)
        setPersistentTableId(tableIdNum)
        setOrderNo(header.TxnNo || null)
        setCurrentTxnId(header.TxnID || null)
        setCurrentKOTNo(header.KOTNo || header.kotNo || null)
        
        // Aggregate unique KOT numbers
        const kotNumbers = fetchedItems
          .map(item => item.kotNo)
          .filter((v, i, a): v is number => v !== undefined && a.indexOf(v) === i)
          .sort((a, b) => a - b)
        setCurrentKOTNos(kotNumbers)

        // Set printed bill information
        if (header.BilledDate) {
          const date = new Date(header.BilledDate)
          const istDate = new Date(date.getTime() + (5.5 * 60 * 60 * 1000)) // Convert to IST
          setBillPrintedTime(istDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }))
        } else {
          setBillPrintedTime(null)
        }
        
        setNetAmount(header.Amount || null)
        setBillActionState('printOrSettle')

        // Restore applied discount for billed tables
        if (header.Discount || header.DiscPer) {
          setDiscount(header.Discount || 0)
          setDiscountInputValue(header.DiscountType === 1 ? header.DiscPer : header.Discount || 0)
          setDiscountType(header.DiscountType !== null ? header.DiscountType : 1)
        } else {
          setDiscount(0)
          setDiscountInputValue(0)
        }

        // Restore customer details from billed transaction
        setCustomerName(header.CustomerName || '')
        setMobileNumber(header.MobileNo || '')
        setCustomerId(header.customerid || null)

        // Map reversed items for billed transaction
        const fetchedReversedItems: ReversedMenuItem[] = (reversedItemsData || []).map((item: any) => ({
          ...item,
          name: item.ItemName || item.itemName || 'Unknown Item',
          id: item.ItemID || item.itemId,
          price: item.RuntimeRate || item.price || 0,
          qty: Math.abs(item.Qty) || 1,
          isReversed: true,
          reversalLogId: item.ReversalLogID || item.reversalLogId || 0,
          status: 'Reversed',
          kotNo: item.KOTNo,
        }))
        setReversedItems(fetchedReversedItems)

        setLoading(false)
        return // Exit after successfully loading billed items
      } else {
        setBillActionState('initial') // Reset if no billed bill is found
      }

      // Step 2: If no billed bill found, fetch unbilled items
      const unbilledItemsRes = await OrderService.getUnbilledItemsByTable(tableIdNum)
      
      if (unbilledItemsRes && unbilledItemsRes.success && unbilledItemsRes.data) {
        const unbilledData = unbilledItemsRes.data as any
        const unbilledItems = unbilledData.items || []
        
        // Map unbilled items to MenuItem[]
        const fetchedItems: MenuItem[] = unbilledItems.map((item: any) => {
          return {
            id: item.itemId,
            txnDetailId: item.txnDetailId,
            item_no: item.item_no,
            name: item.itemName,
            price: item.price,
            qty: item.netQty || item.qty,
            isBilled: 0,
            isNCKOT: 0,
            NCName: '',
            NCPurpose: '',
            isNew: false,
            originalQty: item.qty,
            revQty: item.revQty,
            kotNo: item.kotNo,
          }
        })

        setCurrentKOTNo(unbilledData.kotNo || null)
        
        const firstItem = unbilledItems.length > 0 ? unbilledItems[0] : null
        setPersistentTxnId(firstItem ? (firstItem.txnId || firstItem.TxnID || null) : null)
        setPersistentTableId(tableIdNum)

        // Map reversed items from unbilled response
        const fetchedReversedItems: ReversedMenuItem[] = (unbilledData.reversedItems || []).map((item: any) => ({
          id: item.ItemID || item.itemId,
          name: item.ItemName || item.itemName,
          price: item.price,
          qty: item.reversedQty || Math.abs(item.Qty) || 1,
          kotNo: item.KOTNo,
          isReversed: true,
          reversalLogId: item.reversalLogId || item.ReversalLogID || 0,
          status: 'Reversed',
        }))
        setReversedItems(fetchedReversedItems)
        
        setItems(fetchedItems)

        // Set TxnNo if it exists on the unbilled transaction
        if (firstItem) {
          setOrderNo(firstItem.TxnNo || firstItem.txnNo || null)
          setCurrentTxnId(firstItem.txnId || firstItem.TxnID || null)
        } else {
          setOrderNo(null)
          setCurrentTxnId(null)
        }

        // Aggregate KOT numbers
        const kotNumbersForTable = fetchedItems
          .map(item => item.kotNo)
          .filter((v, i, a): v is number => v !== undefined && a.indexOf(v) === i)
          .sort((a, b) => a - b)
        setCurrentKOTNos(kotNumbersForTable)

        // Restore discount from unbilled header
        const header = unbilledData.header
        if (header) {
          if (header.Discount || header.DiscPer) {
            setDiscount(header.Discount || 0)
            setDiscountInputValue(header.DiscountType === 1 ? header.DiscPer : header.Discount || 0)
            setDiscountType(header.DiscountType !== null ? header.DiscountType : 1)
          }
          // Restore customer details from unbilled transaction
          setCustomerName(header.CustomerName || '')
          setMobileNumber(header.MobileNo || '')
          setCustomerId(header.customerid || null)
        } else {
          setDiscount(0)
          setDiscountInputValue(0)
        }
      } else {
        // No billed or unbilled items found - reset state
        setItems([])
        setReversedItems([])
        setCurrentKOTNo(null)
        setCurrentKOTNos([])
        setOrderNo(null)
        setCurrentTxnId(null)
        setDiscount(0)
        setDiscountInputValue(0)
        setCustomerName('')
        setMobileNumber('')
        setCustomerId(null)
      }

    } catch (err: any) {
      console.error('Error fetching/refetching items for table:', err)
      setError(err.message || 'Failed to fetch items for table')
      
      // Reset state on error
      setItems([])
      setReversedItems([])
      setOrderNo(null)
      setCurrentKOTNo(null)
      setCurrentKOTNos([])
      setCurrentTxnId(null)
      setBillActionState('initial')
    } finally {
      setLoading(false)
    }
  }, []) // Empty deps - all state updates are functional

  // ═══════════════════════════════════════════════════════════════════════════
  // Reset function - Clear all order state
  // ═══════════════════════════════════════════════════════════════════════════

  const resetOrder = useCallback(() => {
    setItems([])
    setReversedItems([])
    setCurrentTxnId(null)
    setOrderNo(null)
    setCurrentKOTNo(null)
    setCurrentKOTNos([])
    setBillActionState('initial')
    setPersistentTxnId(null)
    setPersistentTableId(null)
    setDiscount(0)
    setDiscountInputValue(0)
    setDiscountType(1)
    setCustomerName('')
    setMobileNumber('')
    setCustomerId(null)
    setBillPrintedTime(null)
    setNetAmount(null)
    setError(null)
  }, [])

  // ═══════════════════════════════════════════════════════════════════════════
  // Return hook interface
  // ═══════════════════════════════════════════════════════════════════════════

  return {
    // State
    items,
    reversedItems,
    currentTxnId,
    orderNo,
    currentKOTNo,
    currentKOTNos,
    billActionState,
    persistentTxnId,
    persistentTableId,
    discount,
    discountInputValue,
    discountType,
    customerName,
    mobileNumber,
    customerId,
    billPrintedTime,
    netAmount,
    loading,
    error,

    // State setters (for external updates if needed)
    setItems,
    setReversedItems,
    setCurrentTxnId,
    setOrderNo,
    setCurrentKOTNo,
    setCurrentKOTNos,
    setBillActionState,
    setPersistentTxnId,
    setPersistentTableId,
    setDiscount,
    setDiscountInputValue,
    setDiscountType,
    setCustomerName,
    setMobileNumber,
    setCustomerId,

    // Actions
    refreshItemsForTable,
    resetOrder,
  }
}
