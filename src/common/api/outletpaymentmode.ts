import { HttpClient } from '../helpers'

type OutletPaymentModePayload = {
  id?: number
  outletid: number
  hotelid?: number
  paymenttypeid: number
  mode_name: string
  is_active: number
}

type PaymentType = {
  paymenttypeid: number
  mode_name: string
}

function OutletPaymentModeService() {
  return {
    list: (params?: { outletid?: string }) => {
      return HttpClient.get('/payment-modes', { params })
    },
    create: (payload: OutletPaymentModePayload) => {
      return HttpClient.post('/payment-modes', payload)
    },
    remove: (id: number) => {
      return HttpClient.delete(`/payment-modes/${id}`)
    },
    types: () => {
      return HttpClient.get('/payment-modes/types')
    },
  }
}

export default OutletPaymentModeService()
