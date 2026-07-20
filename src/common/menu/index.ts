import { HORIZONTAL_MENU_ITEMS, MENU_ITEMS, MenuItemTypes } from '@/constants/menu'

const getMenuItems = () => MENU_ITEMS

// UI Mode filter (POS / Table View)
export const getFilteredMenuItems = (
  items: MenuItemTypes[],
  uiMode: string
): MenuItemTypes[] => {
  return items
    .map((item) => {
      const filteredChildren = item.children
        ? getFilteredMenuItems(item.children, uiMode)
        : undefined

      if (item.parentKey === 'apps') {
        if (uiMode === 'Tableview' && item.key === 'Orders') {
          return null
        }

        if (uiMode !== 'Tableview' && item.key === 'Tableview') {
          return null
        }
      }

      return {
        ...item,
        children: filteredChildren?.length ? filteredChildren : undefined,
      }
    })
    .filter(Boolean) as MenuItemTypes[]
}

// Sabhi roles ke liye same menu.
// Actual filtering DB permissions se hoga.
export const getRoleBasedMenuItems = (
  role: string,
  uiMode: string
): MenuItemTypes[] => {
  return getFilteredMenuItems(MENU_ITEMS, uiMode)
}

// DB Permission Filter
export const filterMenuByPermissions = (
  items: MenuItemTypes[],
  canView: (moduleKey: string) => boolean
): MenuItemTypes[] => {
  return items
    .map((item) => {
      const filteredChildren = item.children
        ? filterMenuByPermissions(item.children, canView)
        : undefined

      // Parent menu
      if (item.children) {
        if (!filteredChildren || filteredChildren.length === 0) {
          return null
        }

        return {
          ...item,
          children: filteredChildren,
        }
      }

      // Leaf page
      if (!canView(item.key)) {
        return null
      }

      return item
    })
    .filter(Boolean) as MenuItemTypes[]
}

const getHorizontalMenuItems = () => HORIZONTAL_MENU_ITEMS

const findAllParent = (
  menuItems: MenuItemTypes[],
  menuItem: MenuItemTypes
): string[] => {
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
  menuItemKey: MenuItemTypes['key'] | undefined
): MenuItemTypes | null => {
  if (!menuItems || !menuItemKey) return null

  for (const item of menuItems) {
    if (item.key === menuItemKey) {
      return item
    }

    const found = findMenuItem(item.children, menuItemKey)

    if (found) return found
  }

  return null
}

export {
  findAllParent,
  findMenuItem,
  getMenuItems,
  getHorizontalMenuItems,
}