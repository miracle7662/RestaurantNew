import React, { createContext, useContext, useEffect, useState } from 'react';
import permissionService, { UserPermission } from '@/common/api/permissions';
import { useAuthContext } from '@/common';

interface PermissionContextType {
  permissions: UserPermission[];
  loading:     boolean;
  canView:     (moduleKey: string) => boolean;
}

const PermissionContext = createContext<PermissionContextType>({
  permissions: [],
  loading:     true,
  canView:     () => true,
});

export const PermissionProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuthContext();
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    const isBypass =
      user?.role?.toLowerCase()       === 'superadmin' ||
      user?.role_level?.toLowerCase() === 'superadmin' ||
      user?.role_level?.toLowerCase() === 'hotel_admin';

    if (!user?.id || isBypass) {
      setLoading(false);
      return;
    }

    permissionService.getUserPermissions(user.id)
      .then(data => { setPermissions(data); setLoading(false); })
      .catch(()  => setLoading(false));

  }, [user?.id, user?.role, user?.role_level]);

  const canView = (moduleKey: string): boolean => {
    // Logout hamesha visible
    if (moduleKey === 'Logout') return true;

    if (
      user?.role?.toLowerCase()       === 'superadmin' ||
      user?.role_level?.toLowerCase() === 'superadmin' ||
      user?.role_level?.toLowerCase() === 'hotel_admin'
    ) return true;

    // ✅ module_key se match (JOIN se aa raha hai DB se)
    const perm = permissions.find(
      p => p.module_key.toLowerCase() === moduleKey.toLowerCase().trim()
    );
    return perm ? perm.can_view === 1 : false;
  };

  return (
    <PermissionContext.Provider value={{ permissions, loading, canView }}>
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermissions = () => useContext(PermissionContext);