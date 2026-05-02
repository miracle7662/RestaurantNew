import { useState, useEffect } from 'react'
import { Device } from '@capacitor/device'
import type { DeviceInfo } from '@capacitor/device'

export const useDeviceName = () => {
  const [deviceName, setDeviceName] = useState<string>('Loading...')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const detectDevice = async () => {
      try {
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
          // ✅ Desktop (Electron / Web)

          if ((window as any).require) {
            // Electron
            const os = (window as any).require('os')
            name = os.hostname()
          } else if (navigator.userAgent.includes('Electron')) {
            name = 'Electron Desktop'
          } else {
            name = `Web-${navigator.platform}`
          }
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