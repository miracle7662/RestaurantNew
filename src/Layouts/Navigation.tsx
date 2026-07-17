import  { useEffect, useState } from 'react';
import { useUIModeContext } from '@/common/context';
import { useAuthContext } from '@/common';
import { usePermissions } from '@/common/context/PermissionContext';
import permissionService, { ModuleItem } from '@/common/api/permissions';
import { buildMenuTreeFromModules, filterDynamicMenuByUIMode } from '@/common/menu';
import { MenuItemTypes } from '@/constants/menu';
import Logo from '@/components/Common/Logo';
import { Link } from 'react-router-dom';
import SimpleBar from 'simplebar-react';
import AppMenu from './Menu';

const SideBarContent = () => {
  const { uiMode } = useUIModeContext();
  const { user } = useAuthContext();
  const { canView, loading: permLoading } = usePermissions();

  const [menuItems, setMenuItems] = useState<MenuItemTypes[]>([]);
  const [loading, setLoading] = useState(true);

  const role = user?.role_level || 'outlet_user';
  const isSuperAdmin =
    user?.role?.toLowerCase() === 'superadmin' ||
    user?.role_level?.toLowerCase() === 'superadmin' ||
    user?.role_level?.toLowerCase() === 'brand_admin';
  const isHotelAdmin = role === 'hotel_admin';
  const bypassPermissions = isSuperAdmin || isHotelAdmin;

 let hotelType = user?.hotel_type || 'restaurant';

if (isSuperAdmin) {
  hotelType = 'both';
} else {
  const normalized = hotelType.toLowerCase().trim();
  const hasRestaurant = normalized.includes('restaurant') || normalized.includes('reataurant');
  const hasLodging = normalized.includes('lodging');

  if (hasRestaurant && hasLodging) {
    hotelType = 'both';       // "Lodging + Restaurant", "Restaurant & Lodging", etc.
  } else if (hasRestaurant) {
    hotelType = 'restaurant';
  } else if (hasLodging) {
    hotelType = 'lodging';
  } else {
    hotelType = normalized;
  }
}

console.log('user.hotel_type:', user?.hotel_type);
console.log('Calculated hotelType:', hotelType);

  useEffect(() => {
    const fetchModules = async () => {
      setLoading(true);
      try {
        const modules: ModuleItem[] = await permissionService.getModulesByHotelType(hotelType);
        console.log('🔹 API modules count:', modules.length);
        console.log('🔹 API modules (first 5):', modules.slice(0, 5));
        console.log('🔹 Full API modules:', modules);

        let tree = buildMenuTreeFromModules(modules, canView, bypassPermissions);
        console.log('🔸 Built tree (roots):', tree.map(item => item.key));
        console.log('🔸 Built tree (full):', tree);

        tree = filterDynamicMenuByUIMode(tree, uiMode);
        console.log('🔸 After UI filter (roots):', tree.map(item => item.key));

        setMenuItems(tree);
      } catch (error) {
        console.error('Failed to fetch menu modules:', error);
        setMenuItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchModules();
  }, [hotelType, user?.id, bypassPermissions, uiMode, canView]);

  if (loading || (permLoading && !bypassPermissions)) {
    return <div className="text-center p-3 text-muted">Loading...</div>;
  }

  return (
    <>
      <AppMenu menuItems={menuItems} />
      <div className="clearfix" />
    </>
  );
};

const Navigation = () => (
  <aside className="leftside-menu position-fixed top-0 bottom-0 z-1040">
    <div className="">
      <Link to="/"><Logo /></Link>
    </div>
    <SimpleBar
      id="leftside-menu-container"
      data-simplebar=""
      style={{ height: 'calc(100% - 4.5rem)' }}>
      <SideBarContent />
    </SimpleBar>
  </aside>
);

export default Navigation;