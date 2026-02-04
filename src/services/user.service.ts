import axios from 'axios';

// Interface for waiter user data
export interface WaiterUser {
  userId: number;
  username: string;
  employee_name: string;
  designation: string;
}

// Fetch waiter users (Waiter or Caption designation) for a specific outlet
export const fetchWaiterUsers = async (outletId: number): Promise<WaiterUser[]> => {
  try {
    console.log('Fetching waiter users for outletId:', outletId);
    const response = await axios.get(`/api/outlet-users/waiters/${outletId}`);
    console.log('API response:', response.data);
    if (response.data.success) {
      console.log('Returning waiter users:', response.data.data);
      return response.data.data;
    } else {
      throw new Error('Failed to fetch waiter users');
    }
  } catch (error) {
    throw error;
  }
};
