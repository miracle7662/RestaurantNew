import axios from 'axios';
import config from '../../config';

const API_URL = `${config.API_URL}/api/outlet-users`;

export interface OutletUser {
  userid: number;
  username: string;
  email: string;
  full_name: string;
  phone: string;
  role_level: string;
  status: number;
  hotel_name: string;
  outlet_name: string;
  outletids: number[];
  designation: string;
  user_type: string;
  shift_time: string;
  mac_address: string;
  assign_warehouse: string;
  language_preference: string;
  address: string;
  city: string;
  sub_locality: string;
  web_access: boolean;
  self_order: boolean;
  captain_app: boolean;
  kds_app: boolean;
  captain_old_kot_access: boolean;
  verify_mac_ip: boolean;
  parent_user_id: number;
  created_by_id: number;
  hotelid: number;
  password?: string;
}

export interface Outlet {
  outletid: number;
  outlet_name: string;
  outlet_code: string;
  brand_name: string;
}

export interface HotelAdmin {
  userid: number;
  username: string;
  full_name: string;
  hotel_name: string;
}

// Get all outlet users
export const getOutletUsers = async (params?: any) => {
  try {
    const response = await axios.get(`${API_URL}`, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching outlet users:', error);
    throw error;
  }
};

// Create new outlet user
export const createOutletUser = async (userData: Partial<OutletUser>) => {
  try {
    const response = await axios.post(`${API_URL}`, userData);
    return response.data;
  } catch (error) {
    console.error('Error creating outlet user:', error);
    throw error;
  }
};

// Update outlet user
export const updateOutletUser = async (id: number, userData: Partial<OutletUser>) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, userData);
    return response.data;
  } catch (error) {
    console.error('Error updating outlet user:', error);
    throw error;
  }
};

// Delete outlet user
export const deleteOutletUser = async (id: number) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting outlet user:', error);
    throw error;
  }
};

// Get outlets for dropdown
export const getOutletsForDropdown = async (params?: any) => {
  try {
    const response = await axios.get(`${API_URL}/outlets-dropdown`, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching outlets for dropdown:', error);
    throw error;
  }
};

// Get hotel admins
export const getHotelAdmins = async (params?: any) => {
  try {
    const response = await axios.get(`${API_URL}/hotel-admins`, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching hotel admins:', error);
    throw error;
  }
};

// Get outlet user by ID
export const getOutletUserById = async (id: number) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching outlet user by ID:', error);
    throw error;
  }
};

// Get designations
export const getDesignations = async () => {
  try {
    const response = await axios.get(`${API_URL}/designations`);
    return response.data;
  } catch (error) {
    console.error('Error fetching designations:', error);
    throw error;
  }
};

// Get user types
export const getUserTypes = async () => {
  try {
    const response = await axios.get(`${API_URL}/user-types`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user types:', error);
    throw error;
  }
};
