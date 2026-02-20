import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import OpeningBalanceModal from '@/components/OpeningBalanceModal'
import { useAuthContext } from '@/common'
import DayendService from '@/common/api/dayend'

export default function OpeningBalancePage() {
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const [show, setShow] = useState(true)

  const handleSubmit = async (data: { opening_balance: number }) => {
    try {
      console.log('Opening Balance Data:', data)
      console.log('User object:', user)
      
      // Call the save opening balance API
      const response = await DayendService.saveOpeningBalance({
        opening_balance: data.opening_balance,
        outlet_id: user.outletid ? Number(user.outletid) : undefined,
        hotel_id: Number(user.hotelid),
        user_id: Number(user.id)
        
      })
      console.log("hotelid:", user?.hotelid)
console.log("userid:", user?.id)
console.log("outletid:", user?.outletid)
      
      console.log('Save Opening Balance Response:', response)

      setShow(false)

      // ✅ After submit go to dashboard
      navigate('/')
    } catch (error) {
      console.error(error)
    }
  }

  return (
  <OpeningBalanceModal
  show={show}
  onSubmit={handleSubmit}
  onClose={() => {}}
  outlet_id={user.outletid ? Number(user.outletid) : 0}
  hotel_id={Number(user.hotelid)}
/>
  )
}
