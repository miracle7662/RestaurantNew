import { getMenuItems, getFilteredMenuItems } from '@/common'
import { useUIModeContext } from '@/common/context'
import Logo from '@/components/Common/Logo'

import { Link } from 'react-router-dom'
import SimpleBar from 'simplebar-react'
import AppMenu from './Menu'

const SideBarContent = () => {
  const { uiMode } = useUIModeContext();
  const filteredItems = getFilteredMenuItems(getMenuItems(), uiMode);
  return (
    <>
      <AppMenu menuItems={filteredItems} />
      <div className="clearfix" />
    </>
  )
}
const Navigation = () => {
  return (
    <>
      <aside className="leftside-menu position-fixed top-0 bottom-0 z-1040">
        <div className="">
          <Link to="/">
            <Logo />
          </Link>
        </div>
        <SimpleBar
          id="leftside-menu-container"
          data-simplebar=""
          style={{ height: 'calc(100%  - 4.5rem)' }}>
          {/* Sidemenu */}
          <SideBarContent />
          {/* Sidemenu Card */}
          
        </SimpleBar>
      </aside>
    </>
  )
}

export default Navigation
