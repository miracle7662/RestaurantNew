import { useAuthContext } from '@/common';
import { OutletData } from '@/common/api/outlet';

// Enhanced interface matching controller structure
export interface TableItem {
  tablemanagementid: string;
  table_name: string;
  hotel_name: string;
  hotelid: number;
  outletid: number;
  outletname?: string;
  hotelname?: string;
  marketname?: string;
  marketid: number;
  status: number;
  created_by_id: string;
  created_date: string;
  updated_by_id?: string;
  updated_date?: string;
}

// Status configuration matching controller
export const STATUS_CONFIG = {
  0: { label: 'Active', color: 'success', icon: '✓' },
  1: { label: 'Inactive', color: 'danger', icon: '✗' }
};

// API Service for Table Management
export class TableManagementService {
  private baseUrl = 'http://localhost:3001/api/tablemanagement';

  // Get all tables with pagination and filters
  async getTables(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    hotel?: string;
    outlet?: string;
  } = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        query.append(key, value.toString());
      }
    });

    const response = await fetch(`${this.baseUrl}?${query.toString()}`);
    if (!response.ok) {
      throw new Error('Failed to fetch tables');
    }
    return response.json();
  }

  // Create new table
  async createTable(data: Partial<TableItem>) {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        created_date: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create table');
    }
    return response.json();
  }

  // Update table
  async updateTable(id: string, data: Partial<TableItem>) {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        updated_date: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error('Failed to update table');
    }
    return response.json();
  }

  // Delete table
  async deleteTable(id: string) {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete table');
    }
    return response.json();
  }

  // Get single table by ID
  async getTableById(id: string) {
    const response = await fetch(`${this.baseUrl}/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch table');
    }
    return response.json();
  }

  // Get tables by hotel
  async getTablesByHotel(hotelid: string, status?: number) {
    const query = new URLSearchParams();
    if (status !== undefined) {
      query.append('status', status.toString());
    }

    const response = await fetch(`${this.baseUrl}/hotel/${hotelid}?${query.toString()}`);
    if (!response.ok) {
      throw new Error('Failed to fetch tables by hotel');
    }
    return response.json();
  }

  // Get tables by outlet
  async getTablesByOutlet(outletid: string, status?: number) {
    const query = new URLSearchParams();
    if (status !== undefined) {
      query.append('status', status.toString());
    }

    const response = await fetch(`${this.baseUrl}/outlet/${outletid}?${query.toString()}`);
    if (!response.ok) {
      throw new Error('Failed to fetch tables by outlet');
    }
    return response.json();
  }

  // Bulk update table status
  async updateTableStatus(ids: string[], status: number, updated_by_id: string) {
    const response = await fetch(`${this.baseUrl}/bulk-status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ids,
        status,
        updated_by_id
      })
    });

    if (!response.ok) {
      throw new Error('Failed to update table status');
    }
    return response.json();
  }
}

// Export singleton instance
export const tableManagementService = new TableManagementService();
