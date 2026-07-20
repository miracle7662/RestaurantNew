import axios from 'axios';

export interface UserPermission {
  permissionid:  number;
  userid:        number;
  moduleid:      number;      // ← INT FK
  module_key:    string;      // JOIN se
  module_name:   string;      // JOIN se
  menu_type:     string;
  display_order: number;
  can_view:      number;
  can_create:    number;
  can_edit:      number;
  can_delete:    number;
  created_by_id: number;
  created_date:  string;
}

export interface ModuleItem {
  moduleid:        number;
  module_key:      string;
  module_name:     string;
  route:           string | null;
  icon:            string | null;
  parent_moduleid: number | null;
  menu_type:       string;
  is_title:        number;
  display_order:   number;
}

export interface SavePermissionItem {
  moduleid:   number;    // ← module_name nahi, moduleid
  can_view:   number;
  can_create: number;
  can_edit:   number;
  can_delete: number;
}

class PermissionService {
  async getModulesByHotelType(hotelType: string): Promise<ModuleItem[]> {
    try {
      const res = await axios.get(`/user-permissions/hotel-type/${hotelType}`);
      return res.data.success ? res.data.data : [];
    } catch (err) {
      console.error('getModulesByHotelType failed:', err);
      return [];
    }
  }

  async getUserPermissions(userId: number): Promise<UserPermission[]> {
    try {
      const res = await axios.get(`/user-permissions/user/${userId}`);
      return res.data.success ? res.data.data : [];
    } catch (err) {
      console.error('getUserPermissions failed:', err);
      return [];
    }
  }

  async saveUserPermissions(
    userId:      number,
    permissions: SavePermissionItem[],
    createdById: number
  ): Promise<boolean> {
    try {
      const res = await axios.post(`/user-permissions/user/${userId}/save`, {
        permissions,
        created_by_id: createdById,
      });
      return res?.data?.success === true;
    } catch (err) {
      console.error('saveUserPermissions failed:', err);
      return false;
    }
  }
}

export default new PermissionService();