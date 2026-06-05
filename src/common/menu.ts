import { HORIZONTAL_MENU_ITEMS, MENU_ITEMS, MenuItemTypes } from '@/constants/menu'
import { MENU_PERMISSION_MAP } from '@/constants/permissionKeyMap'

const getMenuItems = () => {
  return MENU_ITEMS
}

// uiMode filter — POS/Tableview toggle
export const getFilteredMenuItems = (items: MenuItemTypes[], uiMode: string): MenuItemTypes[] => {
  return items.map(item => {
    const filteredChildren = item.children
      ? getFilteredMenuItems(item.children, uiMode)
      : undefined

    if (item.parentKey === 'apps') {
      if (uiMode === 'Tableview' && item.key === '  Orders') {
        return null
      }
      if (uiMode !== 'Tableview' && item.key === 'Tableview') {
        return null
      }
    }

    return {
      ...item,
      children: filteredChildren?.length ? filteredChildren : undefined
    }
  }).filter(Boolean) as MenuItemTypes[]
}

const OUTLET_USER_END_INDEX = MENU_ITEMS.findIndex(item => item.key === 'HotelAdmin')

const outletUserMenu: MenuItemTypes[] = MENU_ITEMS.slice(0, OUTLET_USER_END_INDEX).filter(item =>
  item.key !== 'KotTransfer' && item.key !== 'Reports'
)

const hotelAdminMenu: MenuItemTypes[] = MENU_ITEMS.slice(OUTLET_USER_END_INDEX)

// Sab roles ko poora menu do — permission filter baad mein DB se lagega
export const getRoleBasedMenuItems = (role: string, uiMode: string): MenuItemTypes[] => {
  return getFilteredMenuItems(MENU_ITEMS, uiMode)
}

// DB permissions se menu filter karo
export const filterMenuByPermissions = (
  items: MenuItemTypes[],
  canView: (module: string) => boolean
): MenuItemTypes[] => {
  return items
    .map((item) => {
      // Section headers hamesha show karo
      if (item.isTitle) return item

      // Children pehle recursively filter karo
      const filteredChildren = item.children
        ? filterMenuByPermissions(item.children, canView)
        : undefined

      // Saare children hide ho gaye → parent bhi hide karo
      if (item.children && (!filteredChildren || filteredChildren.length === 0)) {
        return null
      }

      const moduleName = MENU_PERMISSION_MAP[item.key]

      // ✅ Map mein nahi → hide karo
      if (!moduleName) return null

      // ✅ Map mein hai but DB mein can_view: 0 → hide karo
      if (!canView(moduleName)) return null

      return {
        ...item,
        children: filteredChildren,
      }
    })
    .filter(Boolean) as MenuItemTypes[]
}

const getHorizontalMenuItems = () => {
  return HORIZONTAL_MENU_ITEMS
}

const findAllParent = (menuItems: MenuItemTypes[], menuItem: MenuItemTypes): string[] => {
  let parents: string[] = []
  const parent = findMenuItem(menuItems, menuItem.parentKey)

  if (parent) {
    parents.push(parent.key)
    if (parent.parentKey) {
      parents = [...parents, ...findAllParent(menuItems, parent)]
    }
  }
  return parents
}

const findMenuItem = (
  menuItems: MenuItemTypes[] | undefined,
  menuItemKey: MenuItemTypes['key'] | undefined,
): MenuItemTypes | null => {
  if (menuItems && menuItemKey) {
    for (let i = 0; i < menuItems.length; i++) {
      if (menuItems[i].key === menuItemKey) {
        return menuItems[i]
      }
      const found = findMenuItem(menuItems[i].children, menuItemKey)
      if (found) return found
    }
  }
  return null
}

export {
  findAllParent,
  findMenuItem,
  getMenuItems,
  getHorizontalMenuItems,
  outletUserMenu,
  hotelAdminMenu,
}