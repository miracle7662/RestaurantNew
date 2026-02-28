import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Swal from 'sweetalert2';
import { toast } from 'react-hot-toast';
import { Preloader } from '@/components/Misc/Preloader';
import { Button, Card, Stack, Pagination, Table, Form } from 'react-bootstrap';
import TitleHelmet from '@/components/Common/TitleHelmet';
import { useAuthContext } from '../../../../common/context/useAuthContext';
import KitchenMainGroupService, { type KitchenMainGroup as KitchenMainGroupApiType } from '@/common/api/kitchenmaingroup';

import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table';

interface KitchenMainGroupItem {
  kitchenmaingroupid: number;
  Kitchen_main_Group: string;
  status: string | number;
  created_by_id: string;
  created_date: string;
  updated_by_id: string;
  updated_date: string;
  hotelid: string;
  marketid: string;
}

interface KitchenMainGroupModalProps {
  show: boolean;
  onHide: () => void;
  onSuccess: () => void;
  KitchenMainGroup?: KitchenMainGroupItem | null;
  onUpdateSelectedKitchenMainGroup?: (KitchenMainGroup: KitchenMainGroupItem) => void;
}

const debounce = (func: (...args: any[]) => void, wait: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const getStatusBadge = (status: number) => {
  return status === 0 ? (
    <span className="badge bg-success">Active</span>
  ) : (
    <span className="badge bg-danger">Inactive</span>
  );
};

const KitchenMainGroup: React.FC = () => {
  const [KitchenMainGroupItem, setKitchenMainGroupItem] = useState<KitchenMainGroupItem[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedKitchenMainGroup, setSelectedKitchenMainGroup] = useState<KitchenMainGroupItem | null>(null);

const fetchKitchenMainGroup = async () => {
  try {
    setLoading(true);
    const response = await KitchenMainGroupService.list();
// Map API response to component's expected format
    const mappedData: KitchenMainGroupItem[] = response.data.map((item: KitchenMainGroupApiType) => ({
      kitchenmaingroupid: item.kitchen_maingroupid,
      Kitchen_main_Group: item.Kitchen_main_Group,
      status: item.status,
      created_by_id: item.created_by_id || '',
      created_date: item.created_date || '',
      updated_by_id: item.updated_by_id || '',
      updated_date: item.updated_date || '',
      hotelid: '',
      marketid: '',
    }));
    setKitchenMainGroupItem(mappedData);
  } catch (err) {
    toast.error('Failed to fetch KitchenMainGroup');
  } finally {
    setLoading(false);
  }
};
  useEffect(() => {
    fetchKitchenMainGroup();
  }, []);

  const columns = useMemo<ColumnDef<KitchenMainGroupItem>[]>(
    () => [
      {
        id: 'srNo',
        header: 'Sr No',
        size: 50,
        cell: ({ row }) => <div style={{ textAlign: 'center' }}>{row.index + 1}</div>,
      },
      {
        accessorKey: 'Kitchen_main_Group',
        header: 'Kitchen Main Group',
        size: 200,
        cell: (info) => <div style={{ textAlign: 'center' }}>{info.getValue<string>()}</div>,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 150,
        cell: (info) => {
          const statusValue = info.getValue<number>();
          // console.log('Status value:', statusValue, typeof statusValue);
          return <div style={{ textAlign: 'center' }}>{getStatusBadge(statusValue)}</div>;
        },
      },
      {
        id: 'actions',
        header: () => <div style={{ textAlign: 'center' }}>Action</div>,
        size: 150,
        cell: ({ row }) => (
          <div className="d-flex gap-2 justify-content-center">
            <button
              className="btn btn-sm btn-success"
              onClick={() => handleEditClick(row.original)}
              title="Edit KitchenMainGroup"
            >
              <i className="fi fi-rr-edit"></i>
            </button>
            <button
              className="btn btn-sm btn-danger"
              onClick={() => handleDeleteKitchenMainGroup(row.original)}
              title="Delete KitchenMainGroup"
            >
              <i className="fi fi-rr-trash"></i>
            </button>
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: KitchenMainGroupItem,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
    state: {
      globalFilter: searchTerm,
    },
  });

  const handleSearch = useCallback(
    debounce((value: string) => {
      table.setGlobalFilter(value);
    }, 300),
    [table]
  );

  const onSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    handleSearch(value);
  };

  const handleEditClick = (KitchenMainGroup: KitchenMainGroupItem) => {
    setSelectedKitchenMainGroup(KitchenMainGroup);
    setShowModal(true);
  };

  const handleDeleteKitchenMainGroup = async (KitchenMainGroup: KitchenMainGroupItem) => {
    const res = await Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to recover this KitchenMainGroup!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3E97FF',
      confirmButtonText: 'Yes, delete it!',
    });
    if (res.isConfirmed) {
      try {
        await KitchenMainGroupService.remove(KitchenMainGroup.kitchenmaingroupid);
        toast.success('Deleted successfully');
        fetchKitchenMainGroup();
        setSelectedKitchenMainGroup(null);
      } catch {
        toast.error('Failed to delete');
      }
    }
  };

  const getPaginationItems = () => {
    const items = [];
    const maxPagesToShow = 5;
    const pageIndex = table.getState().pagination.pageIndex;
    const totalPages = table.getPageCount();
    let startPage = Math.max(0, pageIndex - Math.floor(maxPagesToShow / 2));
    const endPage = Math.min(totalPages - 1, startPage + maxPagesToShow - 1);

    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(0, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <Pagination.Item
          key={i}
          active={i === pageIndex}
          onClick={() => table.setPageIndex(i)}
        >
          {i + 1}
        </Pagination.Item>
      );
    }
    return items;
  };

  const KitchenMainGroupModal: React.FC<KitchenMainGroupModalProps> = ({
    show,
    onHide,
    onSuccess,
    KitchenMainGroup,
    onUpdateSelectedKitchenMainGroup,
  }) => {
    const [kitchenMainGroupName, setKitchenMainGroupName] = useState('');
    const [status, setStatus] = useState('Active');
    const [loading, setLoading] = useState(false);
    const { user } = useAuthContext();
    const isEditMode = !!KitchenMainGroup;

    useEffect(() => {
      if (isEditMode && KitchenMainGroup) {
        setKitchenMainGroupName(KitchenMainGroup.Kitchen_main_Group);
        setStatus(String(KitchenMainGroup.status) === '0' ? 'Active' : 'Inactive');
        // console.log('Edit KitchenMainGroup status:', KitchenMainGroup.status, typeof KitchenMainGroup.status);
      } else {
        setKitchenMainGroupName('');
        setStatus('Active');
      }
    }, [KitchenMainGroup, isEditMode]);

const handleSubmit = async () => {
      if (!kitchenMainGroupName || !status) {
        toast.error('Kitchen Main Group Name and Status are required');
        return;
      }
       // Use authenticated user ID and context
      const userId = user.id;
      const hotelId = user.hotelid || '1';
      const marketId = user.marketid || '1';

      setLoading(true);
      try {
        const statusValue = status === 'Active' ? 0 : 1;
        const currentDate = new Date().toISOString();
        const payload = {
         Kitchen_main_Group: kitchenMainGroupName,
          code: isEditMode ? '' : '',
          status: statusValue,
          ...(isEditMode
            ? {
                kitchen_maingroupid: KitchenMainGroup!.kitchenmaingroupid,
                updated_by_id: userId,
                updated_date: currentDate,
              }
            : {
                created_by_id: userId,
                created_date: currentDate,
                hotelid: hotelId,
                marketid: marketId,
              }),
        };
        // console.log('Sending to backend:', payload);

        if (isEditMode) {
          await KitchenMainGroupService.update(KitchenMainGroup!.kitchenmaingroupid, payload);
        } else {
          await KitchenMainGroupService.create(payload);
        }

        toast.success(`Kitchen Main Group ${isEditMode ? 'updated' : 'added'} successfully`);
        if (isEditMode && KitchenMainGroup && onUpdateSelectedKitchenMainGroup) {
          const updatedKitchenMainGroup = {
            ...KitchenMainGroup,
            Kitchen_main_Group: kitchenMainGroupName,
            status: statusValue.toString(),
            updated_by_id: userId,
            updated_date: currentDate,
            kitchenmaingroupid: KitchenMainGroup.kitchenmaingroupid,
          };
          onUpdateSelectedKitchenMainGroup(updatedKitchenMainGroup);
        }
        setKitchenMainGroupName('');
        setStatus('Active');
        onSuccess();
        onHide();
      } catch (err) {
        // console.error(`${isEditMode ? 'Edit' : 'Add'} KitchenMainGroup error:`, err);
        toast.error('Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    if (!show) return null;

    return (
      <div className="modal" style={{ display: show ? 'block' : 'none', background: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
        <div className="modal-content" style={{ background: 'white', padding: '20px', maxWidth: '600px', margin: '100px auto', borderRadius: '8px' }}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">{isEditMode ? 'Edit Kitchen Main Group' : 'Add Kitchen Main Group'}</h5>
            <button className="btn-close" onClick={onHide}></button>
          </div>
          <div className="row mb-3">
            <div className="col-md-12">
              <label className="form-label">Kitchen Main Group Name <span style={{ color: 'red' }}>*</span></label>
              <input
                type="text"
                className="form-control"
                value={kitchenMainGroupName}
                onChange={(e) => setKitchenMainGroupName(e.target.value)}
                placeholder="Enter Kitchen Main Group Name"
              />
            </div>
          </div>
          <div className="row mb-3">
            <div className="col-md-12">
              <label className="form-label">Status <span style={{ color: 'red' }}>*</span></label>
              <select
                className="form-control"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="d-flex justify-content-end mt-4">
            <button className="btn btn-success me-2" onClick={handleSubmit} disabled={loading}>
              {loading ? (isEditMode ? 'Updating...' : 'Adding...') : (isEditMode ? 'Save' : 'Create')}
            </button>
            <button className="btn btn-danger" onClick={onHide} disabled={loading}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <TitleHelmet title="Kitchen Main Group List" />
      <Card className="m-1">
        <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
          <h4 className="mb-0">Kitchen Main Group List</h4>
          <div style={{ display: 'flex', gap: '4px' }}>
            <Button variant="success" onClick={() => { setSelectedKitchenMainGroup(null); setShowModal(true); }}>
              <i className="bi bi-plus"></i> Add Kitchen Main Group
            </Button>
          </div>
        </div>
        <div className="p-3">
          <div className="mb-3">
            <input
              type="text"
              className="form-control rounded-pill"
              placeholder="Search..."
              value={searchTerm}
              onChange={onSearchChange}
              style={{ width: '350px', borderColor: '#ccc', borderWidth: '2px' }}
            />
          </div>
          <div className="flex-grow-1" style={{ overflowY: 'auto' }}>
            {loading ? (
              <Stack className="align-items-center justify-content-center flex-grow-1 h-100">
                <Preloader />
              </Stack>
            ) : (
              <>
                <Table responsive hover className="mb-4">
                  <thead>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <th key={header.id} style={{ width: header.column.columnDef.size, textAlign: header.id === 'actions' ? 'left' : 'center' }}>
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {table.getRowModel().rows.map((row) => (
                      <tr key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} style={{ textAlign: cell.column.id === 'actions' ? 'left' : 'center' }}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </Table>
                <Stack direction="horizontal" className="justify-content-between align-items-center">
                  <div>
                    <Form.Select
                      value={table.getState().pagination.pageSize}
                      onChange={(e) => table.setPageSize(Number(e.target.value))}
                      style={{ width: '100px', display: 'inline-block', marginRight: '10px' }}
                    >
                      <option value="5">5</option>
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                    </Form.Select>
                    <span className="text-muted">
                      Showing {table.getRowModel().rows.length} of {KitchenMainGroupItem.length} entries
                    </span>
                  </div>
                  <Pagination>
                    <Pagination.Prev
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                    />
                    {getPaginationItems()}
                    <Pagination.Next
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                    />
                  </Pagination>
                </Stack>
              </>
            )}
          </div>
        </div>
      </Card>
      <KitchenMainGroupModal
        show={showModal}
        onHide={() => setShowModal(false)}
        onSuccess={fetchKitchenMainGroup}
        KitchenMainGroup={selectedKitchenMainGroup}
        onUpdateSelectedKitchenMainGroup={setSelectedKitchenMainGroup}
      />
    </>
  );
};

export default KitchenMainGroup;