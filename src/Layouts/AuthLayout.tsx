import { useEffect, Suspense, ReactNode } from 'react'
import {  useThemeContext } from '../common/context'
import { changeHTMLAttribute } from '../utils'
import { PreloaderFull } from '@/components/Misc/Preloader'
import ThemeCustomizerPublic from './Customizer/CustomizerPublic'

interface AuthLayoutProps {
  children?: ReactNode
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  const { settings, } = useThemeContext()

 

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


    </Suspense>
  )
}

export default AuthLayout
