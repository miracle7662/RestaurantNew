import  { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthProvider, ThemeProvider } from './common/context'
import { UIModeProvider } from './common/context'
import ThemeRoutes from './routes/Routes'
import ConfigScreen from '@/components/Pages/ConfigScreen'
import { loadConfig } from './config'

// Flaticons
import './../node_modules/@flaticon/flaticon-uicons/css/all/all.css'

// Theme.scss
import './assets/scss/theme.scss'

function App() {
  const navigate = useNavigate()
  const [configReady, setConfigReady] = useState(false)
  const [showConfigFirst, setShowConfigFirst] = useState(true)

  useEffect(() => {
    const initApp = async () => {
      const configDone = localStorage.getItem('configDone')
      
      if (!configDone) {
        // Show config screen first
        setShowConfigFirst(true)
        setConfigReady(true)
        return
      }

      try {
        // Load and configure
        await loadConfig()
        setShowConfigFirst(false)
        setConfigReady(true)
      } catch (error) {
        console.error('Config init failed:', error)
        // Show config screen if load fails
        localStorage.removeItem('configDone')
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
    return <ConfigScreen />
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <UIModeProvider>
          <ThemeRoutes />
        </UIModeProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App

