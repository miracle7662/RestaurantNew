import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import OpeningBalanceModal from '@/components/OpeningBalanceModal'
import { useAuthContext } from '@/common'

export default function OpeningBalancePage() {
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const [show, setShow] = useState(true)

  const handleSubmit = async (data: { opening_balance: number }) => {
    try {
      // 🔥 CALL YOUR SAVE OPENING BALANCE API HERE
      console.log('Opening Balance Data:', data)

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
      outlet_id={user?.outletid ? Number(user.outletid) : undefined}
      hotel_id={user?.hotelid ? Number(user.hotelid) : 0}
    />
  )
}
