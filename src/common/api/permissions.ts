// src/common/api/permissions.ts

import axios from 'axios';

export interface UserPermission {
  permissionid: number;
  userid: number;
  module_name: string;
  can_view: number;
  can_create: number;
  can_edit: number;
  can_delete: number;
  created_by_id: number;
  created_date: string;
  hotel_type: string;
}

class PermissionService {
  async getUserPermissions(userId: number): Promise<UserPermission[]> {
    try {
     const response = await axios.get(`/user-permissions/user/${userId}`)

      if (response.data.success) {
        return response.data.data;
      }

      return [];
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
      return [];
    }
  }
}

export default new PermissionService();