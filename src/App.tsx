import  { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthProvider, ThemeProvider } from './common/context'
import { UIModeProvider } from './common/context'
import ThemeRoutes from './routes/Routes'
import ConfigScreen from '@/components/Pages/ConfigScreen'
import { loadConfig, getSystemIPv4, hasIPChanged } from './config'
import SocketKOTPrinter from '@/components/SocketKOTPrinter'

// Flaticons
import './../node_modules/@flaticon/flaticon-uicons/css/all/all.css'

// Theme.scss
import './assets/scss/theme.scss'

function App() {
  const navigate = useNavigate()
  const [configReady, setConfigReady] = useState(false)
  const [showConfigFirst, setShowConfigFirst] = useState(true)
  const [ipMismatchInfo, setIpMismatchInfo] = useState<{ savedIP: string; currentIP: string } | null>(null)

  useEffect(() => {
    const initApp = async () => {
      try {
        const config = await loadConfig()
        
        // Check if config file actually exists (first-run detection)
        const configExists = typeof window !== 'undefined' && 
          (window as any).electronAPI?.hasConfigFile?.() 
          ? await (window as any).electronAPI.hasConfigFile()
          : false;

        if (!configExists) {
          // First run — no config file at all
          setShowConfigFirst(true)
          setConfigReady(true)
          return
        }

        // Config file exists — detect current system IP and compare
        const currentIP = await getSystemIPv4()
        const savedIP = config?.serverIP
        const ipChanged = hasIPChanged(savedIP, currentIP)

        if (ipChanged) {
          console.warn(`⚠️ IP changed: saved=${savedIP}, current=${currentIP}. Showing config screen.`)
          setIpMismatchInfo({ savedIP: savedIP || 'unknown', currentIP })
          setShowConfigFirst(true)
        } else {
          setShowConfigFirst(false)
        }

        setConfigReady(true);
      } catch (error) {
        console.error('Config init failed:', error)
        setShowConfigFirst(true)
        setConfigReady(true)
      }
    }

    initApp()
  }, [navigate])

  if (!configReady) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading configuration...</span>
        </div>
      </div>
    )
  }

  if (showConfigFirst) {
    return <ConfigScreen ipMismatchInfo={ipMismatchInfo || undefined} />
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <UIModeProvider>
          <SocketKOTPrinter />
          <ThemeRoutes />
        </UIModeProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App

