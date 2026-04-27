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
      const config = await loadConfig();

      const configExists =
        typeof window !== 'undefined' &&
        (window as any).electronAPI?.hasConfigFile?.()
          ? await (window as any).electronAPI.hasConfigFile()
          : false;

      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

      // 🚨 Case 1: First time → Config
      if (!configExists) {
        setShowConfigFirst(true);
        setConfigReady(true);
        return;
      }

      // 🚨 Case 2: IP change → Config
      const currentIP = await getSystemIPv4();
      const savedIP = config?.serverIP;

      if (hasIPChanged(savedIP, currentIP)) {
        console.warn(`⚠️ IP changed: saved=${savedIP}, current=${currentIP}`);
        setIpMismatchInfo({ savedIP: savedIP || 'unknown', currentIP });
        setShowConfigFirst(true);
        setConfigReady(true);
        return;
      }

      // ✅ Normal flow (NO config screen)
      setShowConfigFirst(false);

      if (isLoggedIn) {
        navigate('/dashboard');
      } else {
        navigate('/auth/minimal/login');
      }

      setConfigReady(true);

    } catch (error) {
      console.error('Config init failed:', error);
      setShowConfigFirst(true);
      setConfigReady(true);
    }
  };

  initApp();
}, []);

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
    return <ConfigScreen ipMismatchInfo={ipMismatchInfo || undefined} onConfigSaved={() => setShowConfigFirst(false)} />
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

