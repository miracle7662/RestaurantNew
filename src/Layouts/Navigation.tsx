import { getRoleBasedMenuItems, filterMenuByPermissions } from '@/common/menu'
import { useUIModeContext } from '@/common/context'
import { useAuthContext } from '@/common'
import Logo from '@/components/Common/Logo'
import { Link } from 'react-router-dom'
import SimpleBar from 'simplebar-react'
import AppMenu from './Menu'
import { usePermissions } from '@/common/context/PermissionContext'

const SideBarContent = () => {
  const { uiMode } = useUIModeContext()
  const { user } = useAuthContext()
  const { canView, loading } = usePermissions()

  const role = user?.role_level || 'outlet_user'

  // Step 1 — role ke hisaab se filter (superadmin/hotel_admin/outlet_user)
  const roleFiltered = getRoleBasedMenuItems(role, uiMode)

  // Step 2 — DB permissions ke hisaab se filter
  const finalItems = filterMenuByPermissions(roleFiltered, canView)

  console.log('🔍 canView Brand:', canView('Brand'))
  console.log('🔍 canView POS:', canView('POS'))
  console.log('📌 finalItems count:', finalItems.length)
  console.log('📌 roleFiltered count:', roleFiltered.length)

  if (loading) {
    return <div className="text-center p-3 text-muted">Loading...</div>
  }

  return (
    <>
      <AppMenu menuItems={finalItems} />
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