import React, { createContext, useContext, useEffect, useState } from 'react';
import permissionService, { UserPermission } from '@/common/api/permissions';
import { useAuthContext } from '@/common';

interface PermissionContextType {
  permissions: UserPermission[];
  loading: boolean;
  canView: (moduleName: string) => boolean;
}

const PermissionContext = createContext<PermissionContextType>({
  permissions: [],
  loading: true,
  canView: () => true,
});

export const PermissionProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuthContext();
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
       console.log('🔵 PermissionContext useEffect chala')
  console.log('👤 user:', user)
  console.log('🔑 user.id:', user?.id)

      const userId = user?.id

   if (!userId) {
      setLoading(false)
      return
    }
  console.log('🔄 Fetching permissions for userid:', user.userid)
  permissionService.getUserPermissions(user.id).then((data) => {
    console.log('✅ Permissions loaded:', data)
    setPermissions(data)
    setLoading(false)
  }).catch((err) => {
    console.log('❌ Permission fetch failed:', err)
    setLoading(false)
  })
},  [user?.id])

  const canView = (moduleName: string): boolean => {
    
    const perm = permissions.find(
      (p) => p.module_name.toLowerCase() === moduleName.toLowerCase()
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