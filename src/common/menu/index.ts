import { HORIZONTAL_MENU_ITEMS, MENU_ITEMS, MenuItemTypes } from '@/constants/menu'
const getMenuItems = () => {
  return MENU_ITEMS
}

export const getFilteredMenuItems = (items: MenuItemTypes[], uiMode: string): MenuItemTypes[] => {
  return items.map(item => {
    // Recursively filter children
    const filteredChildren = item.children ? getFilteredMenuItems(item.children, uiMode) : undefined;
    
    // Filter POS/Tableview based on uiMode (parentKey: 'apps')
    if (item.parentKey === 'apps') {
      if (uiMode === 'Tableview' && item.key === '  Orders') {
        return null; // Hide POS
      }
      if (uiMode !== 'Tableview' && item.key === 'Tableview') {
        return null; // Hide Tableview
      }
    }
    
    // Keep item if not filtered, with filtered children
    return {
      ...item,
      children: filteredChildren?.length ? filteredChildren : undefined
    };
  }).filter(Boolean) as MenuItemTypes[]; // Remove nulls
};


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

export { findAllParent, findMenuItem, getMenuItems, getHorizontalMenuItems }
