 import React, { useState, useEffect, useMemo, useCallback, forwardRef, useImperativeHandle, useRef } from 'react';
import Swal from 'sweetalert2';
import { toast } from 'react-hot-toast';
import { Button, Card, Stack, Pagination, Table, Modal, Form as BootstrapForm, Form } from 'react-bootstrap';
import { Preloader } from '@/components/Misc/Preloader';
import TitleHelmet from '@/components/Common/TitleHelmet';
import { useAuthContext } from '../../../../common/context/useAuthContext';
import { Formik,   } from 'formik';
import { hoteltypeFormValidationSchema } from '@/common/validators';
import FormikTextInput from '@/components/Common/FormikTextInput';
import FormikSelect from '@/components/Common/FormikSelect';
import HotelTypeService from '@/common/api/hoteltype';

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
  hotelid: string;
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
  hoteltype: HoteltypeItem | null;
  onSuccess: () => void;
  onUpdateSelectedHoteltype: (hoteltype: HoteltypeItem) => void;
}

interface HoteltypeModalRef {
  saveData: () => void;
}

// Utility Functions
const debounce = (func: (...args: any[]) => void, wait: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Main Component
const HoteltypeMasters: React.FC = () => {
  const [hoteltypeItems, setHoteltypeItems] = useState<HoteltypeItem[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedHoteltype, setSelectedHoteltype] = useState<HoteltypeItem | null>(null);
  const { user } = useAuthContext();

  // Fetch hotel types from API
  const fetchHoteltypes = async () => {
    try {
      setLoading(true);
      const data = await HotelTypeService.list() as unknown as HoteltypeItem[];
      console.log('Fetched hotel types:', data); // Debug log
      setHoteltypeItems(data);
    } catch (err) {
      toast.error('Failed to fetch hotel types');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHoteltypes();
  }, []);

  // Define columns for react-table with explicit widths
  const columns = useMemo<ColumnDef<HoteltypeItem>[]>(() => [
    {
      id: 'srNo',
      header: 'Sr No',
      size: 50,
      cell: ({ row }) => <div style={{ textAlign: 'center' }}>{row.index + 1}</div>,
    },
    {
      accessorKey: 'hotel_type',
      header: 'Hotel Type',
      size: 200,
      cell: (info) => <div style={{ textAlign: 'center' }}>{info.getValue<string>()}</div>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 150,
      cell: (info) => {
        const statusValue = info.getValue<number>();
        return <div style={{ textAlign: 'center' }}>{statusValue === 0 ? 'Active' : 'Inactive'}</div>;
      },
    },
    {
      id: 'actions',
      header: () => <div style={{ textAlign: 'center' }}>Action</div>,
      size: 150,
      cell: ({ row }) => (
        <div className="d-flex gap-2 justify-content-center">
          <Button
            size="sm"
            variant="success"
            onClick={() => {
              setSelectedHoteltype(row.original);
              setShowEditModal(true);
            }}
            title="Edit Hotel Type"
          >
            <i className="fi fi-rr-edit"></i>
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleDeleteHoteltype(row.original)}
            title="Delete Hotel Type"
          >
            <i className="fi fi-rr-trash"></i>
          </Button>
        </div>
      ),
    },
  ], []);

  // Initialize react-table with pagination
  const table = useReactTable({
    data: hoteltypeItems,
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

  const handleDeleteHoteltype = async (hoteltype: HoteltypeItem) => {
    const res = await Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to recover this hotel type!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3E97FF',
      confirmButtonText: 'Yes, delete it!',
    });
    if (res.isConfirmed) {
      try {
        await HotelTypeService.remove(parseInt(hoteltype.hoteltypeid));
        toast.success('Deleted successfully');
        fetchHoteltypes();
        setSelectedHoteltype(null);
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

  // Modal for Add/Edit
  const HoteltypeModal = forwardRef<HoteltypeModalRef, HoteltypeModalProps>(({ show, onHide, onSuccess, hoteltype, onUpdateSelectedHoteltype }, ref) => {
    const [loading, setLoading] = useState(false);
    const formikRef = useRef<any>(null);

    const isEditMode = !!hoteltype;

    const initialValues = {
      hotel_type: hoteltype?.hotel_type || '',
      status: hoteltype ? (hoteltype.status === 0 ? 'Active' : 'Inactive') : 'Active',
    };

    const handleSubmit = async (values: any) => {
      setLoading(true);
      try {
        const statusValue = values.status === 'Active' ? 0 : 1;
        const currentDate = new Date().toISOString();
        const hotelId = user?.hotelid || '1';
        const userId = user?.id || '1';
        const payload = {
          hotel_type: values.hotel_type,
          status: statusValue,
          ...(isEditMode
            ? {
                updated_by_id: userId,
                updated_date: currentDate,
                hotelid: hoteltype!.hotelid || hotelId,
              }
            : {
                created_by_id: userId,
                created_date: currentDate,
                hotelid: hotelId,
              }),
        };
        console.log('Sending to backend:', payload); // Debug log

        try {
          if (isEditMode) {
            await HotelTypeService.update(parseInt(hoteltype!.hoteltypeid), payload);
          } else {
            await HotelTypeService.create(payload);
          }
          toast.success(`Hotel type ${isEditMode ? 'updated' : 'added'} successfully`);

          if (isEditMode && hoteltype && onUpdateSelectedHoteltype) {
            onUpdateSelectedHoteltype({
              ...hoteltype,
              hotel_type: values.hotel_type,
              status: statusValue,
              updated_by_id: userId,
              updated_date: currentDate,
            });
          }

          onSuccess();
          onHide();
        } catch (error: unknown) {
          toast.error((error as string) || `Failed to ${isEditMode ? 'update' : 'add'} hotel type`);
        }
      } catch (error) {
        console.error('Error:', error);
        toast.error('Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    useImperativeHandle(ref, () => ({
      saveData: () => {
        if (formikRef.current) {
          formikRef.current.submitForm();
        }
      },
    }));

    return (
      <Modal show={show} onHide={onHide} size="sm">
        <Modal.Header closeButton>
          <Modal.Title>{isEditMode ? 'Edit Hotel Type' : 'Add Hotel Type'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Formik
            innerRef={formikRef}
            initialValues={initialValues}
            validationSchema={hoteltypeFormValidationSchema}
            onSubmit={handleSubmit}
            enableReinitialize={true}
          >
            {({ values, setFieldValue }) => (
              <Form>
                <div className="row">
                  <div className="col-md-12 mb-3">
                    <FormikTextInput
                      name="hotel_type"
                      label="Hotel Type"
                      placeholder="Enter hotel type name"
                    />
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-12 mb-3">
                    <FormikSelect
                      name="status"
                      label="Status"
                      options={[
                        { value: 'Active', label: 'Active' },
                        { value: 'Inactive', label: 'Inactive' },
                      ]}
                      onChange={(e: any) => {
                        setFieldValue('status', e.target.value);
                      }}
                    />
                  </div>
                </div>
              </Form>
            )}
          </Formik>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => formikRef.current?.submitForm()} disabled={loading}>
            {loading ? (isEditMode ? 'Updating...' : 'Adding...') : 'Save'}
          </Button>
        </Modal.Footer>
      </Modal>
    );
  });

 

  return (
    <>
      <TitleHelmet title="Hotel Type List" />
      <Card className="m-1">
        <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
          <h4 className="mb-0">Hotel Type List</h4>
          <div style={{ display: 'flex', gap: '4px' }}>
            <Button variant="success" onClick={() => setShowAddModal(true)}>
              <i className="bi bi-plus"></i> Add Hotel Type
            </Button>
          </div>
        </div>
        <div className="p-3">
          <div className="mb-3">
            <input
              type="text"
              className="form-control rounded-pill"
              placeholder="Search hotel types..."
              value={searchTerm}
              onChange={onSearchChange}
              style={{ width: '350px', borderColor: '#ccc', borderWidth: '2px' }}
            />
          </div>
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
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => table.setPageSize(Number(e.target.value))}
                    style={{ width: '100px', display: 'inline-block', marginRight: '10px' }}
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                  </Form.Select>
                  <span className="text-muted">
                    Showing {table.getRowModel().rows.length} of {hoteltypeItems.length} entries
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
      </Card>
      <HoteltypeModal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        hoteltype={null}
        onSuccess={fetchHoteltypes}
        onUpdateSelectedHoteltype={setSelectedHoteltype}
      />
      <HoteltypeModal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        hoteltype={selectedHoteltype}
        onSuccess={fetchHoteltypes}
        onUpdateSelectedHoteltype={setSelectedHoteltype}
      />
    </>
  );
};



export default HoteltypeMasters;