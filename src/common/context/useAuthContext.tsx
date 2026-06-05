import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  Suspense,
} from 'react'
import { Preloader, PreloaderFull } from '@/components/Misc/Preloader'
import { getCurrentUser } from '@/common/api/auth'
import DayendService from '@/common/api/dayend'
import BillPrintService from '@/common/api/billPrint'

type User = {
  id: number
  username: string
  email?: string
  password: string
  name: string
  role: string
  token: string
  outletid?: number
  hotelid?: number
  trn_gstno?: string
  hotel_name?: string
  outlet_name?: string
  brand_name?: string
  address?: string
  hotel_type?: string
  currDate?: string
}

export type BillRawSettings = {
  preview: Record<string, any>
  print: Record<string, any>
} | null



const AuthContext = createContext<any>({})

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}

const authSessionKey = 'WINDOW_AUTH_SESSION'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | undefined>(
    localStorage.getItem(authSessionKey)
      ? JSON.parse(localStorage.getItem(authSessionKey) || '{}')
      : undefined,
  )
  const [loading, setLoading] = useState(true)
  const [billSettings, setBillSettings] = useState<BillRawSettings>(null)
  const [billSettingsLoading, setBillSettingsLoading] = useState(false)

  const saveSession = useCallback((user: User) => {
    localStorage.setItem(authSessionKey, JSON.stringify(user))
    if (user.token) {
      localStorage.setItem('token', user.token)
    }
    console.log('User saved to context:', user)
    setUser(user)
  }, [])

  const removeSession = useCallback(() => {
    localStorage.removeItem(authSessionKey)
    setBillSettings(null)
    setUser(undefined)
  }, [])

  // Fetch bill preview + print settings for a given outlet.
  // Called once on login (or when outlet changes in BillPreviewPrint).
  const fetchBillSettings = useCallback(async (outletId: number) => {
    if (!outletId) return
    setBillSettingsLoading(true)
    try {
      const [previewRes, printRes] = await Promise.all([
        BillPrintService.getBillPreviewSettings(outletId),
        BillPrintService.getBillPrintSettings(outletId),
      ])
      setBillSettings({
        preview: previewRes?.data || previewRes || {},
        print: printRes?.data || printRes || {},
      })
    } catch (err) {
      console.error('Failed to fetch bill settings:', err)
      setBillSettings(null)
    } finally {
      setBillSettingsLoading(false)
    }
  }, [])

  useEffect(() => {
    const fetchUser = async () => {
      const storedUser = localStorage.getItem(authSessionKey)
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser)
          if (parsedUser && parsedUser.token) {
            const currentUser = await getCurrentUser(parsedUser.token)

            const currDateData = await DayendService.getLatestCurrDate({
              brandId: currentUser.outletid,
              hotelid: currentUser.hotelid,
            })

            if (currDateData.success) {
              console.log('Business Date:', currDateData.data.curr_date)
            }

            // Fetch bill settings for this outlet before saving session
            const outletId = Number(currentUser?.outletid) || 1
            await fetchBillSettings(outletId)

            saveSession({
              ...currentUser,
              token: parsedUser.token,
              currDate: currDateData.data.curr_date,
            })
          } else {
            removeSession()
          }
        } catch (error) {
          console.error('Error restoring session:', error)
          removeSession()
        }
      }
      setLoading(false)
    }

    fetchUser()
  }, [saveSession, removeSession, fetchBillSettings])

  return (
    <>
      {loading ? (
        <PreloaderFull />
      ) : (
        <Suspense fallback={<Preloader />}>
          <AuthContext.Provider
            value={{
              user,
              isAuthenticated: Boolean(user),
              saveSession,
              removeSession,
              billSettings,
              billSettingsLoading,
              fetchBillSettings,
            }}
          >
            {children}
          </AuthContext.Provider>
        </Suspense>
      )}
    </>
  )
}

export default AuthProvider