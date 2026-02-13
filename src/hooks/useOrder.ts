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
