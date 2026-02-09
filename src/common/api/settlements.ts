import { HttpClient } from '../helpers'

type SettlementListParams = {
  orderNo?: string
  hotelId?: string
  outletId?: number
  from?: string
  to?: string
  paymentType?: string
  page?: number
  limit?: number
}

type ReplaceSettlementPayload = {
  OrderNo: string
  newSettlements: Array<{
    PaymentType: string
    Amount: number
  }>
  HotelID: string
  EditedBy: any
}

function SettlementService() {
  return {
    list: (params?: SettlementListParams) => {
      return HttpClient.get('/settlements', { params })
    },
    replace: (payload: ReplaceSettlementPayload) => {
      return HttpClient.post('/settlements/replace', payload)
    },
    remove: (id: number) => {
      return HttpClient.delete(`/settlements/${id}`)
    },
  }
}

export default SettlementService()
