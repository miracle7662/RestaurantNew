import { useEffect, Suspense, ReactNode } from 'react'
import { ThemeSettings, useThemeContext } from '../common/context'
import { changeHTMLAttribute } from '../utils'
import { Button, Stack } from 'react-bootstrap'
import { PreloaderFull } from '@/components/Misc/Preloader'
import ThemeCustomizerPublic from './Customizer/CustomizerPublic'

interface AuthLayoutProps {
  children?: ReactNode
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  const { settings, updateSettings } = useThemeContext()

  const handleCustomizer = () => {
    updateSettings({ customizer: ThemeSettings.customizer.show })
  }

  useEffect(() => {
    changeHTMLAttribute('data-color-scheme', settings.color)
    changeHTMLAttribute('data-bs-theme', settings.theme)
    changeHTMLAttribute('data-theme-font', settings.font)
    changeHTMLAttribute('data-content-skin', settings.layout.contentSkin)
  }, [settings])

  return (
    <Suspense fallback={<PreloaderFull />}>
      <div className="wrapper">{children}</div>

      <Suspense fallback={<div />}>
        <ThemeCustomizerPublic />
      </Suspense>

      <Stack className="position-fixed z-1" style={{ right: '0', bottom: '50%' }}>
        <Button
          onClick={handleCustomizer}
          variant="primary"
          className="btn-lg btn-icon rounded-0 rounded-start-3"
        >
          <i className="fi fi-rr-settings fs-18" />
        </Button>
      </Stack>
    </Suspense>
  )
}

export default AuthLayout
