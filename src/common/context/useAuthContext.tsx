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
  hotel_name?: string
  outlet_name?: string
  brand_name?: string
  currDate?: string
}

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
  const [user, setUser] = useState(
    localStorage.getItem(authSessionKey)
      ? JSON.parse(localStorage.getItem(authSessionKey) || '{}')
      : undefined,
  )

  const saveSession = useCallback(
    (user: User) => {
      localStorage.setItem(authSessionKey, JSON.stringify(user))
      // Also save the token separately for httpClient to access
      if (user.token) {
        localStorage.setItem("token", user.token)
      }
      setUser(user)
    },
    [setUser],
  )

  const removeSession = useCallback(() => {
    localStorage.removeItem(authSessionKey)
    setUser(undefined)
  }, [setUser])

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      const storedUser = localStorage.getItem(authSessionKey)
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser)
          if (parsedUser && parsedUser.token) {
            const currentUser = await getCurrentUser(parsedUser.token)
            const currDateData = await DayendService.getLatestCurrDate({
              brandId: currentUser.outletid,   // agar backend me brandId = outletid hai
              hotelid: currentUser.hotelid
            })  
             console.log('Current user data:', currentUser)
            console.log('Curr date data:', currDateData)
            saveSession({ ...currentUser, token: parsedUser.token, currDate: currDateData.data.curr_date })
            console.log('User session restored from localStorage.')
          } else {
            removeSession()
          }
        } catch (error) {
          removeSession()
        }
      }
      setLoading(false)
    }
    fetchUser()
  }, [saveSession, removeSession])

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