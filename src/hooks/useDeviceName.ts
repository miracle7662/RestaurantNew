import { useState, useEffect } from 'react'
import { Device } from '@capacitor/device'
import type { DeviceInfo } from '@capacitor/device'

export const useDeviceName = () => {
  const [deviceName, setDeviceName] = useState<string>('Loading...')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const detectDevice = async () => {
      try {
        console.log('🚀 Starting device name detection...')
        let name = 'Unknown Device'

        // ✅ Check if Capacitor exists (Mobile)
        if ((window as any).Capacitor?.isNativePlatform?.()) {
          const deviceInfo: DeviceInfo = await Device.getInfo()

          name =
            deviceInfo.name ||
            deviceInfo.model ||
            deviceInfo.platform ||
            'Mobile Device'
        } else {
          console.log('🔍 Device detection started. UserAgent:', navigator.userAgent)
          console.log('🔍 window.require exists:', !!((window as any).require))
          
          // ✅ Desktop (Electron / Web)
          
          // Try IPC first (recommended for contextIsolation)
          if ((window as any).electronAPI?.getDeviceName) {
            console.log('🚀 Using electronAPI.getDeviceName() IPC')
            try {
              name = await (window as any).electronAPI.getDeviceName()
              console.log('✅ IPC device name:', name)
            } catch (ipcError) {
              console.error('❌ IPC getDeviceName error:', ipcError)
              name = 'Electron-IPC-Error'
            }
          } else if ((window as any).require) {
            console.log('✅ Using Electron require("os")')
            try {
              // Electron
              const os = (window as any).require('os')
              console.log('✅ os object loaded:', !!os)
              const hostname = os.hostname()
              console.log('✅ OS hostname:', hostname)
              name = hostname || 'Electron-Fallback'
            } catch (osError) {
              console.error('❌ os.hostname() error:', osError)
              name = 'Electron-Error'
            }
          } else if (navigator.userAgent.includes('Electron')) {
          console.log('⚠️ Electron detected but no window.require (contextIsolation?)')
          name = 'Electron Desktop'
        } else {
          console.log('🌐 Web platform detected')
          name = `Web-${navigator.platform}`
        }
        console.log('📱 Final device name set to:', name)
        }

        setDeviceName(name)
      } catch (error) {
        console.warn('Device detection failed:', error)
        setDeviceName('Unknown Device')
      } finally {
        setLoading(false)
      }
    }

    detectDevice()
  }, [])

  return { deviceName, loading }
}

export default useDeviceName