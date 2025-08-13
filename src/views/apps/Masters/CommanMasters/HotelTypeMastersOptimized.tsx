import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Swal from 'sweetalert2';
import { toast } from 'react-hot-toast';
import { Button, Stack, Pagination, Table, Modal, Form, Row, Col } from 'react-bootstrap';
import { Preloader } from '@/components/Misc/Preloader';
import TitleHelmet from '@/components/Common/TitleHelmet';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table';

// Interfaces
interface HoteltypeItem {
  hoteltypeid: string;
  hotel_type: string;
  status: number;
  created_by_id: string;
  created_date: string;
  updated_by_id: string;
  updated_date: string;
}

interface HoteltypeModalProps {
  show: boolean;
  onHide: () => void;
  hoteltype?: HoteltypeItem | null;
  onSuccess: () => void;
}

// Utility Functions
const debounce = <T extends (...args: any[]) => void>(func: T, wait: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Status badge for table
const getStatusBadge = (status: number) => {
  return status === 0 ? (
    <span className="badge bg-success">Active</span>
  ) : (
    <span className="badge bg-danger">Inactive</span>
  );
};

// Main Component
const HoteltypeMasters: React.FC = () => {
  const [hoteltypeItems, setHoteltypeItems] = useState<HoteltypeItem[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedHoteltype, setSelectedHoteltype] = useState<HoteltypeItem | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Fetch hotel types from API
  const fetchHoteltypes = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/hoteltype');
      const data = await res.json();
      setHoteltypeItems(data);
    } catch {
      toast.error('Failed to fetch hotel types');
    } finally {
      setLoading(false);
    }
  };

  // Debounced search handler
  const handleSearch = useCallback(
    debounce((value: string) => {
      table.setGlobalFilter(value);
    }, 500),
    []
  );

  // Update search term and trigger debounced search
  const onSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    handleSearch(value);
  };

  // Fetch hotel types on component mount
  useEffect(() => {
    fetchHoteltypes();
  }, []);

  // CRUD operations
  const handleDeleteHoteltype = async (hoteltype: HoteltypeItem) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to recover this hotel type!',
      icon:<thinking>
The attempt to replace the entire file content at once failed due to the large size and strict diff format requirements.

I will instead perform the update in smaller, incremental steps by replacing key sections one by one. This will avoid large diffs and reduce the chance of errors.

First, I will replace the import section and interfaces, then proceed to replace the main component logic in subsequent steps.

This approach will ensure safe and accurate updates.
</thinking>

<read_file>
<path>src/views/apps/Masters/CommanMasters/HotelTypeMasters.tsx</path>
</read_file>
3. Fix JSX syntax errors by ensuring all JSX expressions have a single parent element.
4. Remove any invalid JSX tags like <thinking> or <read_file> that were mistakenly included.

I will now proceed to fix the Swal.fire icon prop and the table initialization order first.

<edit_file>
<path>src/views/apps/Masters/CommanMasters/HotelTypeMastersOptimized.tsx</path>
<content>
<<<<<<< SEARCH
  // Debounced search handler
  const handleSearch = useCallback(
    debounce((value: string) => {
      table.setGlobalFilter(value);
    }, 500),
    []
  );

  // Update search term and trigger debounced search
  const onSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    handleSearch(value);
  };

  // Fetch hotel types on component mount
  useEffect(() => {
    fetchHoteltypes();
  }, []);

  // CRUD operations
  const handleDeleteHoteltype = async (hoteltype: HoteltypeItem) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to recover this hotel type!',
      icon:<thinking>
The attempt to replace the entire file content at once failed due to the large size and strict diff format requirements.

I will instead perform the update in smaller, incremental steps by replacing key sections one by one. This will avoid large diffs and reduce the chance of errors.

First, I will replace the import section and interfaces, then proceed to replace the main component logic in subsequent steps.

This approach will ensure safe and accurate updates.
=======
  // Initialize table
  const table = useReactTable({
    data: hoteltypeItems,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  // Debounced search handler
  const handleSearch = useCallback(
    debounce((value: string) => {
      table.setGlobalFilter(value);
    }, 500),
    []
  );

  // Update search term and trigger debounced search
  const onSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    handleSearch(value);
  };

  // Fetch hotel types on component mount
  useEffect(() => {
    fetchHoteltypes();
  }, []);

  // CRUD operations
  const handleDeleteHoteltype = async (hoteltype: HoteltypeItem) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to recover this hotel type!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3E97FF',
      confirmButtonText: 'Yes, delete it!',
    });
