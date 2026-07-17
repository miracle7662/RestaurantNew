import { HORIZONTAL_MENU_ITEMS, MENU_ITEMS, MenuItemTypes } from '@/constants/menu'
import { ModuleItem } from '@/common/api/permissions'

const getMenuItems = () => MENU_ITEMS

// ─────────────────────────────────────────────────────────────
// UI Mode Filter (POS / Table View) – for hardcoded menu
// ─────────────────────────────────────────────────────────────
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
        if (uiMode === 'Tableview' && item.key === 'Orders') return null
        if (uiMode !== 'Tableview' && item.key === 'Tableview') return null
      }

      return {
        ...item,
        children: filteredChildren?.length ? filteredChildren : undefined,
      }
    })
    .filter(Boolean) as MenuItemTypes[]
}

// ─────────────────────────────────────────────────────────────
// Hotel Type Filter (hardcoded) – used with MENU_ITEMS
// ─────────────────────────────────────────────────────────────
const LODGING_ONLY_KEYS = [
  'master-setting',
  'hotel-master',
  'registration',
]

export const filterMenuByHotelType = (
  items: MenuItemTypes[],
  hotelType?: string
): MenuItemTypes[] => {
  if (!hotelType) return items

  const type = hotelType.toLowerCase().trim()

  if (type === 'both') return items

  return items.filter((item) => {
    const isLodgingItem =
      LODGING_ONLY_KEYS.includes(item.key) ||
      (item.parentKey && LODGING_ONLY_KEYS.includes(item.parentKey))

    if (type === 'restaurant' || type === 'reataurant') {
      return !isLodgingItem
    }

    if (type === 'lodging') {
      if (item.isTitle && item.key === '') return false
      if (item.isTitle && item.key === 'HotelAdmin') return true
      return isLodgingItem
    }

    return true
  })
}

// ─────────────────────────────────────────────────────────────
// Role Based Menu (hardcoded)
// ─────────────────────────────────────────────────────────────
export const getRoleBasedMenuItems = (
  role: string,
  uiMode: string,
  hotelType?: string
): MenuItemTypes[] => {
  const uiFiltered = getFilteredMenuItems(MENU_ITEMS, uiMode)

  if (role === 'hotel_admin') {
    return filterMenuByHotelType(uiFiltered, hotelType)
  }

  return uiFiltered
}

// ─────────────────────────────────────────────────────────────
// Permission Filter (hardcoded menu)
// ─────────────────────────────────────────────────────────────
export const filterMenuByPermissions = (
  items: MenuItemTypes[],
  canView: (moduleKey: string) => boolean
): MenuItemTypes[] => {
  return items
    .map((item) => {
      const filteredChildren = item.children
        ? filterMenuByPermissions(item.children, canView)
        : undefined

      if (item.isTitle) {
        return filteredChildren?.length
          ? { ...item, children: filteredChildren }
          : null
      }

      if (item.children) {
        return filteredChildren?.length
          ? { ...item, children: filteredChildren }
          : null
      }

      if (!canView(item.key)) return null

      return item
    })
    .filter(Boolean) as MenuItemTypes[]
}

// ─────────────────────────────────────────────────────────────
// 🆕 NEW: Build dynamic menu from DB modules (flat → tree)
// ─────────────────────────────────────────────────────────────
export const buildMenuTreeFromModules = (
  modules: ModuleItem[],
  canView: (moduleKey: string) => boolean,
  bypassPermissions: boolean = false
): MenuItemTypes[] => {
  // Permission filter (if not bypass)
  let filtered = bypassPermissions
    ? modules
    : modules.filter(m => canView(m.module_key))

  // Build parent-child map
  const childrenMap = new Map<number, ModuleItem[]>()
  const roots: ModuleItem[] = []

  filtered.forEach(m => {
    if (!m.parent_moduleid || m.parent_moduleid === 0) {
      roots.push(m)
    } else {
      if (!childrenMap.has(m.parent_moduleid)) {
        childrenMap.set(m.parent_moduleid, [])
      }
      childrenMap.get(m.parent_moduleid)!.push(m)
    }
  })

  // Recursive builder
  const buildItems = (parentId: number | null): MenuItemTypes[] => {
    const children = parentId === null ? roots : (childrenMap.get(parentId) || [])
    children.sort((a, b) => a.display_order - b.display_order)

    return children.map(child => {
      const subChildren = buildItems(child.moduleid)
      return {
        key: child.module_key,
        label: child.module_name,
        icon: child.icon || undefined,
        url: child.route || undefined,
        isTitle: child.is_title === 1,
        children: subChildren.length > 0 ? subChildren : undefined,
      }
    })
  }

  return buildItems(null)
}

// ─────────────────────────────────────────────────────────────
// 🆕 UI Mode filter for dynamic menu (built from DB)
// ─────────────────────────────────────────────────────────────
export const filterDynamicMenuByUIMode = (
  items: MenuItemTypes[],
  uiMode: string
): MenuItemTypes[] => {
  return items
    .map(item => {
      const filteredChildren = item.children
        ? filterDynamicMenuByUIMode(item.children, uiMode)
        : undefined

      if (uiMode === 'Tableview' && item.key === 'Orders') return null
      if (uiMode !== 'Tableview' && item.key === 'Tableview') return null

      return {
        ...item,
        children: filteredChildren?.length ? filteredChildren : undefined,
      }
    })
    .filter(Boolean) as MenuItemTypes[]
}

// ─────────────────────────────────────────────────────────────
// Existing helpers (unchanged)
// ─────────────────────────────────────────────────────────────
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
}