import axios from 'axios'

const API_BASE_URL = 'http://localhost:3001/api'

// Get latest curr_date
export const getLatestCurrDate = async (token: string, outletid?: number, hotelid?: number) => {
  try {
    const params = new URLSearchParams()
    if (outletid) params.append('brandId', outletid.toString())
    if (hotelid) params.append('hotelid', hotelid.toString())

    const response = await axios.get(`${API_BASE_URL}/dayend/latest-currdate?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to get latest curr_date')
  }
}
