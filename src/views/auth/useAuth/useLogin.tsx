import { useAuthContext } from '@/common'
import { loginUserWithEmail, loginUserWithUsername } from '@/common/api/auth'
import DayendService from '@/common/api/dayend'
import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'

export default function useLogin() {
  const [loading, setLoading] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const { isAuthenticated, saveSession } = useAuthContext()

  const redirectUrl = useMemo(
    () => (location.state && location.state.from ? location.state.from.pathname : '/'),
    [location.state],
  )

  const loginWithEmail = async (
    event: React.FormEvent<HTMLFormElement>,
    { email, password }: { email: string; password: string },
  ) => {
    event.preventDefault()
    setLoading(true)

    try {
      const res: any = await loginUserWithEmail(email, password)

      setLoading(false)
      toast.success('Login successful!')

      setTimeout(async () => {
       if (res.token) {
  try {
   const currDateData = await DayendService.getLatestCurrDate({
  brandId: res.outletid,
  hotelid: res.hotelid
})
    saveSession({ ...res, currDate: currDateData.data.curr_date })
  } catch (dateError) {
    // console.error('Failed to fetch business date:', dateError)
    saveSession(res)
  }

  // ✅ Check if opening balance is required
  try {
    const openingBalanceCheck = await DayendService.checkOpeningBalanceRequired({
      outlet_id: res.outletid ? Number(res.outletid) : undefined,
      hotel_id: Number(res.hotelid)
    });
    
    if (openingBalanceCheck.data?.required) {
      navigate('/apps/OpeningBalancePage');
    } else {
      navigate('/'); // Go directly to dashboard
    }
  } catch (error) {
    // If check fails, go to dashboard
    navigate('/');
  }
}

      }, 1500)
    } catch (error) {
      setLoading(false)
      toast.error('Invalid email or password!')
    }
  }

  const loginWithUsername = async (
    event: React.FormEvent<HTMLFormElement>,
    { username, password }: { username: string; password: string },
  ) => {
    event.preventDefault()
    setLoading(true)

    try {
      const res: any = await loginUserWithUsername(username, password)

      setLoading(false)
      toast.success('Login successful!')

      setTimeout(async () => {
        if (res.token) {
          try {
            // Fetch the business date after login
            const currDateData = await DayendService.getLatestCurrDate({
              brandId: res.outletid,
              hotelid: res.hotelid
            })
            if (currDateData.success) {
              const currDate = currDateData.data.curr_date
              console.log("Business Date:", currDate)
            }
            // Include currDate in the session
            saveSession({ ...res, currDate: currDateData.data.curr_date })
          } catch (dateError) {
            // If fetching currDate fails, still save the session without it
            // console.error('Failed to fetch business date:', dateError)
            saveSession(res)
          }

          // ✅ Check if opening balance is required
          try {
            const openingBalanceCheck = await DayendService.checkOpeningBalanceRequired({
              outlet_id: res.outletid ? Number(res.outletid) : undefined,
              hotel_id: Number(res.hotelid)
            });
            
            if (openingBalanceCheck.data?.required) {
              navigate('/apps/OpeningBalancePage');
            } else {
              navigate('/'); // Go directly to dashboard
            }
          } catch (error) {
            // If check fails, go to dashboard
            navigate('/');
          }

        }
      }, 1500)
    } catch (error) {
      setLoading(false)
      toast.error('Invalid username or password!')
    }
  }

  return { loading, loginWithEmail, loginWithUsername, redirectUrl, isAuthenticated }
}
