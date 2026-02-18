//import { ThemeSettings, useThemeContext } from '@/common'
import {
 
  DarkLight,
  Helpdesk,
  Languages,
  Notifications,
  Profile,
 
  // useThemeCustomizer,
} from '@/components'
//import Logo from '@/components/Common/Logo'
import { useState } from 'react'
//import { Link } from 'react-router-dom'
import { useAuthContext } from '@/common/context/useAuthContext'

type HeaderProps = {
  toggleMenu?: () => void
  navOpen?: boolean
}

const Header = ({ toggleMenu, navOpen }: HeaderProps) => {
 
  // const { sidenavType } = useThemeCustomizer()
  // const { updateSidebar } = useThemeContext()
  const [megaMenuOpen, setMegaMenuOpen] = useState(false)
  const { user } = useAuthContext()

  function handleMegaMenuClick() {
    setMegaMenuOpen(!megaMenuOpen)
    if (!megaMenuOpen) {
      document.body.classList.add('megamenu-open')
      showBackdrop()
    } else {
      document.body.classList.remove('megamenu-open')
      hideBackdrop()
    }
  }

  function showBackdrop() {
    const backdrop = document.createElement('div')
    backdrop.id = 'megaMenuBackdrop'
    backdrop.className = 'offcanvas-backdrop fade show z-1030'
    document.body.appendChild(backdrop)

    backdrop.addEventListener('click', handleBackdropClick)
  }

  function hideBackdrop() {
    const backdrop = document.getElementById('megaMenuBackdrop')
    if (backdrop) {
      backdrop.removeEventListener('click', handleBackdropClick)
      document.body.removeChild(backdrop)
    }
  }

  function handleBackdropClick() {
    setMegaMenuOpen(false)
    document.body.classList.remove('megamenu-open')
    hideBackdrop()
  }

  

  // function showLeftSideBarBackdrop() {
  //   const backdrop = document.createElement('div')
  //   backdrop.id = 'custom-backdrop'
  //   backdrop.className = 'offcanvas-backdrop fade show'
  //   document.body.appendChild(backdrop)

  //   backdrop.addEventListener('click', function () {
  //     document.getElementsByTagName('html')[0].classList.remove('sidebar-enable')
  //     hideLeftSideBarBackdrop()
  //   })
  // }

  // function hideLeftSideBarBackdrop() {
  //   const backdrop = document.getElementById('custom-backdrop')
  //   if (backdrop) {
  //     document.body.removeChild(backdrop)
  //     document.body.style.removeProperty('overflow')
  //   }
  // }

  return (
    <>
      <header className="header-navbar">
        <div className="header-inner px-2 px-md-3">
          {/* header-left */}
          <div className="header-left d-flex align-items-center">
          {user?.brand_name && (
              <div className="header-btn px-2 d-flex align-items-center gap-2">
                <span className="text-white fw-bold fs-4">{user.brand_name}</span>
              </div>
            )}
          </div>
          
          {/* header-center - for username */}
          <div className="header-center d-flex align-items-center justify-content-center flex-grow-1">
            {user?.username && (
              <span className="text-white fw-bold ">User ({user.username})</span>
            )}
          </div>
          
          {/* header-right */}
          <div className="header-right d-flex align-items-center justify-content-center">

             {user?.currDate && (
                  <span className="text-white fw-bold -start ps-2">Date: {user.currDate}</span>
                )}
            
            <DarkLight />
            <Languages />
            <span className="d-none d-sm-flex">
              
              <Helpdesk />
              
            </span>
            <Notifications />
            
            <Profile />
            <div className="header-btn pe-md-0 d-lg-none" onClick={handleMegaMenuClick}>
              <i className="fi fi-rr-menu-burger"></i>
            </div>
          </div>
        </div>
      </header>
    </>
  )
}
export default Header
