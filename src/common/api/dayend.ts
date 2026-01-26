import axios from 'axios'

const API_BASE_URL = 'http://localhost:3001/api'

// Get latest curr_date
export const getLatestCurrDate = async (token: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/dayend/latest-currdate`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to get latest curr_date')
  }
}
