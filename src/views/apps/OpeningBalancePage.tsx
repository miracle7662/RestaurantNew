import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import OpeningBalanceModal from '@/components/OpeningBalanceModal' // adjust path if needed

export default function OpeningBalancePage() {
  const navigate = useNavigate()
  const [show, setShow] = useState(true)

  const handleSubmit = async (data: any) => {
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
    />
  )
}
