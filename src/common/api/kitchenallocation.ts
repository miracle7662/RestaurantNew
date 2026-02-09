import { HttpClient } from '../helpers'

type KitchenAllocationParams = {
  fromDate: string
  toDate: string
  hotelId: string
  outletId?: string
  filterType?: string
  filterId?: string
}

type ItemDetailsParams = {
  fromDate: string
  toDate: string
  hotelId: string
  outletId?: string
}

function KitchenAllocationService() {
  return {
    getAllocationData: (params: KitchenAllocationParams) => {
      return HttpClient.get('kitchen-allocation', { params })
    },
    getItemDetails: (itemNo: string, params: ItemDetailsParams) => {
      return HttpClient.get(`kitchen-allocation/item-details/${itemNo}`, { params })
    },
  }
}

export default KitchenAllocationService()
