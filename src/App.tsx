import configureBackend from './common/api/backend'
import { AuthProvider, ThemeProvider } from './common/context'
import ThemeRoutes from './routes/Routes'
import ConfigScreen from '@/components/Pages/ConfigScreen'


// Flaticons
import './../node_modules/@flaticon/flaticon-uicons/css/all/all.css'

// Theme.scss
import './assets/scss/theme.scss'

configureBackend()

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UIModeProvider } from './common/context'
import { loadConfig } from './config'

function App() {
  const navigate = useNavigate()
const [configReady, setConfigReady] = useState(false)
  const [showConfigFirst, setShowConfigFirst] = useState(true)

useEffect(() => {
    if (localStorage.getItem('configDone')) {
      setShowConfigFirst(false);
      loadConfig()
        .then(() => setConfigReady(true))
        .catch(() => {
          navigate('/config')
          setConfigReady(true)
        })
    }
  }, [navigate])

if (showConfigFirst) {
    return <ConfigScreen />;
  }

  if (!configReady) {
    return <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="spinner-border" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
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
