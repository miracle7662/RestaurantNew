import React, { useState, useEffect, useMemo, useCallback, forwardRef, useImperativeHandle, useRef } from 'react';
import Swal from 'sweetalert2';
import { toast } from 'react-hot-toast';
import { Preloader } from '@/components/Misc/Preloader';
import { Button, Card, Stack, Pagination, Table, Modal } from 'react-bootstrap';
import { ContactSearchBar, ContactSidebar } from '@/components/Apps/Contact';
import TitleHelmet from '@/components/Common/TitleHelmet';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table';
import { Formik, Form } from 'formik';
import { stateFormValidationSchema } from '@/common/validators';
import FormikTextInput from '@/components/Common/FormikTextInput';
import FormikSelect from '@/components/Common/FormikSelect';
import StateService from '@/common/api/states';
import CountryService from '@/common/api/countries';

// Interfaces
interface CountryItem {
  countryid: string;
  country_name: string;
  status: number;
}
// Interfaces
interface StateItem {
  stateid: string;
  state_name: string;
  state_code: string;
  state_capital: string;
  countryid: string;
  country_name?: string;
  status: number;
  created_by_id: string;
  created_date: string;
  updated_by_id: string;
  updated_date: string;
}

interface Category {
  name: string;
  value: string;
  icon: string;
  badge?: number;
  badgeClassName?: string;
}

interface Label {
  name: string;
  value: string;
  gradient: string;
}

interface StateModalProps {
  show: boolean;
  onHide: () => void;
  state?: StateItem | null;
  onSuccess: () => void;
  onUpdateSelectedState?: (state: StateItem) => void;
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
const States: React.FC = () => {
  const [stateItems, setStateItems] = useState<StateItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('alls');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredStates, setFilteredStates] = useState<StateItem[]>([]);
  const [selectedState, setSelectedState] = useState<StateItem | null>(null);
  const [selectedStateIndex, setSelectedStateIndex] = useState<number>(-1);
  const [loading, setLoading] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [sidebarLeftToggle, setSidebarLeftToggle] = useState<boolean>(false);
  const [sidebarMiniToggle, setSidebarMiniToggle] = useState<boolean>(false);
  const [containerToggle, setContainerToggle] = useState<boolean>(false);

  // Fetch states from API
  const fetchStates = async () => {
    setLoading(true);
    try {
      const data = await StateService.list() as unknown as StateItem[];
      setStateItems(data);
      setFilteredStates(data);
    } catch {
      toast.error('Failed to fetch states');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStates();
  }, []);

  // Table columns
  const columns = useMemo<ColumnDef<StateItem>[]>(() => [
    {
      id: 'srNo',
      header: 'Sr No',
      size: 20,
      cell: (cell) => <span>{cell.row.index + 1}</span>,
    },
    {
      accessorKey: 'state_code',
      header: 'Code',
      size: 10,
      cell: (cell) => (
        <div className="avatar avatar-md rounded-circle bg-light text-muted">
          {cell.getValue<string>()}
        </div>
      ),
    },
    {
      accessorKey: 'state_name',
      header: 'State',
      size: 10,
      cell: (cell) => <h6 className="mb-1">{cell.getValue<string>()}</h6>,
    },

    {
      accessorKey: 'status',
      header: 'Status',
      size: 150,
      cell: (cell) => {
        const statusValue = cell.getValue<string | number>();
        return getStatusBadge(Number(statusValue));
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      size: 30,
      cell: (cell) => (
        <div className="d-flex gap-2">
          <Button
            size="sm"
            variant="success"
            onClick={() => {
              setSelectedState(cell.row.original);
              setShowEditModal(true);
            }}
            style={{ padding: '4px 8px' }}
          >
            <i className="fi fi-rr-edit" />
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleDeleteState(cell.row.original)}
            style={{ padding: '4px 8px' }}
          >
            <i className="fi fi-rr-trash" />
          </Button>
        </div>
      ),
    },
  ], []);

  // Initialize table
  const table = useReactTable({
    data: filteredStates,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  // Sidebar categories and labels
  const categories: Category[] = useMemo(
    () => [
      {
        name: 'States',
        value: 'alls',
        icon: 'fi-rr-map',
        badge: stateItems.length,
        badgeClassName: 'bg-primary-subtle text-primary',
      },
    ],
    [stateItems.length]
  );

  const labels: Label[] = useMemo(
    () => [
      { name: 'North Region', value: 'north', gradient: 'success' },
      { name: 'South Region', value: 'south', gradient: 'warning' },
      { name: 'East Region', value: 'east', gradient: 'danger' },
      { name: 'West Region', value: 'west', gradient: 'info' },
    ],
    []
  );

  // Search handler
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    filterStates(value);
  };

  const filterStates = useCallback(
    debounce((value: string) => {
      const searchValue = value.toLowerCase();
      const filtered = stateItems.filter((item) => {
        return (
          item.state_name.toLowerCase().includes(searchValue) ||
          item.state_code.toLowerCase().includes(searchValue) ||
          item.state_capital.toLowerCase().includes(searchValue) ||
          (item.country_name && item.country_name.toLowerCase().includes(searchValue))
        );
      });
      setFilteredStates(filtered);
    }, 500),
    [stateItems]
  );

  // Category change handler
  const handleCategoryChange = useCallback(
    (categoryValue: string) => {
      setSelectedCategory(categoryValue);
      setSearchTerm('');
      setFilteredStates(stateItems);
    },
    [stateItems]
  );

  // State selection handler
  const handleStateItemClick = useCallback((state: StateItem) => {
    setSelectedState(state);
    setContainerToggle(true);
  }, []);

  // Delete state handler
  const handleDeleteState = async (state: StateItem) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to recover this state!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3E97FF',
      confirmButtonText: 'Yes, delete it!',
    });

    if (result.isConfirmed) {
      try {
       await StateService.remove(Number(state.stateid));
    toast.success('State deleted successfully');
    fetchStates();           // Refresh the list
    setSelectedState(null);  // Clear selected
    setContainerToggle(false);
  } catch (err: any) {
    console.error(err);
    toast.error(err?.response?.data?.message || 'Failed to delete state');
  }
    }
  };

  // Update selected state index
  useEffect(() => {
    const index = filteredStates.findIndex((state) => state.stateid === selectedState?.stateid);
    setSelectedStateIndex(index);
  }, [filteredStates, selectedState]);

  // Navigation handlers
  const handleNext = useCallback(() => {
    if (selectedStateIndex < filteredStates.length - 1) {
      setSelectedState(filteredStates[selectedStateIndex + 1]);
      setContainerToggle(true);
    }
  }, [selectedStateIndex, filteredStates]);

  const handlePrev = useCallback(() => {
    if (selectedStateIndex > 0) {
      setSelectedState(filteredStates[selectedStateIndex - 1]);
      setContainerToggle(true);
    }
  }, [selectedStateIndex, filteredStates]);

  // Card classes
  const cardClasses = useMemo(() => {
    const classes = ['apps-card'];
    if (sidebarMiniToggle) classes.push('apps-sidebar-mini-toggle');
    if (containerToggle) classes.push('apps-container-toggle');
    if (sidebarLeftToggle) classes.push('apps-sidebar-left-toggle');
    return classes.join(' ');
  }, [sidebarMiniToggle, containerToggle, sidebarLeftToggle]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 991.98 && sidebarLeftToggle) {
        setSidebarLeftToggle(false);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarLeftToggle]);

  const handleMenuClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setSidebarLeftToggle((prev) => !prev);
  }, []);

  return (
    <>
      <TitleHelmet title="States" />
      <style>
        {`
          .apps-card,
          .apps-sidebar-left,
          .apps-container {
            transition: all 0.3s ease-in-out;
          }
        `}
      </style>
      <Card className={cardClasses}>
        <div className="apps-sidebar-mini w-70">
          <ContactSidebar
            categories={categories}
            labels={labels}
            selectedCategory={selectedCategory}
            handleCategoryChange={handleCategoryChange}
            setSidebarMiniToggle={setSidebarMiniToggle}
          />
        </div>
        <div className="apps-sidebar apps-sidebar-left apps-sidebar-md" style={{ minWidth: '530px' }}>
          <ContactSearchBar searchTerm={searchTerm} handleSearch={handleSearch} />
          <div className="apps-sidebar-content" style={{ display: 'flex', flexDirection: 'column', height: '100%', minWidth: '250px' }}>
            <Table responsive size="sm" className="mb-0" style={{ minWidth: '300px' }}>
              <thead>
                {table.getHeaderGroups().map((headerGroup: any) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header: any) => (
                      <th key={header.id} style={{ width: header.column.columnDef.size }}>
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row: any) => {
                  const isActive = row.original.status === 0 || row.original.status === '0';
                  return (
                    <tr
                      key={row.id}
                      className={selectedState?.stateid === row.original.stateid ? 'active' : ''}
                      style={{ color: isActive ? 'black' : 'gray', fontWeight: isActive ? 'bold' : 'normal' }}
                      onClick={() => handleStateItemClick(row.original)}
                    >
                      {row.getVisibleCells().map((cell: any) => (
                        <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </Table>
            <Stack className="p-2 border-top d-flex flex-row align-items-center justify-content-between" style={{ gap: '6px', padding: '8px 12px' }}>
              <select
                value={table.getState().pagination.pageSize}
                onChange={(e) => table.setPageSize(Number(e.target.value))}
                style={{ border: '1px solid #0d6efd', borderRadius: '4px', padding: '2px 4px', fontSize: '12px', backgroundColor: '#fff', color: '#6c757d', cursor: 'pointer', width: '100px', height: '30px' }}
              >
                {[10, 20, 30].map((pageSize) => (
                  <option key={pageSize} value={pageSize}>
                    {pageSize}
                  </option>
                ))}
              </select>
              <Pagination className="m-0" style={{ display: 'flex', alignItems: 'center', gap: '3px', marginRight: '20px' }}>
                <Pagination.Prev
                  onClick={() => table.setPageIndex(table.getState().pagination.pageIndex - 1)}
                  disabled={table.getState().pagination.pageIndex === 0}
                  style={{ border: '1px solid #e5e7eb', color: table.getState().pagination.pageIndex === 0 ? '#d3d3d3' : '#6c757d', padding: '2px 4px', borderRadius: '4px', backgroundColor: 'transparent', fontSize: '12px', lineHeight: '1' }}
                >
                  <i className="fi fi-rr-angle-left" style={{ fontSize: '12px' }} />
                </Pagination.Prev>
                <Pagination.Item
                  active
                  style={{ backgroundColor: '#0d6efd', border: '1px solid #0d6efd', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', lineHeight: '1', minWidth: '24px', textAlign: 'center' }}
                >
                  {table.getState().pagination.pageIndex + 1}
                </Pagination.Item>
                <Pagination.Next
                  onClick={() => table.setPageIndex(table.getState().pagination.pageIndex + 1)}
                  disabled={table.getState().pagination.pageIndex === table.getPageCount() - 1}
                  style={{ border: '1px solid #e5e7eb', color: table.getState().pagination.pageIndex === table.getPageCount() - 1 ? '#d3d3d3' : '#6c757d', padding: '2px 4px', borderRadius: '4px', backgroundColor: 'transparent', fontSize: '12px', lineHeight: '1' }}
                >
                  <i className="fi fi-rr-angle-right" style={{ fontSize: '12px' }} />
                </Pagination.Next>
              </Pagination>
            </Stack>
          </div>
        </div>
        <div className={`apps-container ${containerToggle ? 'w-full' : ''}`}>
          <div className="apps-container-inner" style={{ minHeight: '100vh' }}>
            {loading ? (
              <Stack className="align-items-center justify-content-center h-100">
                <Preloader />
              </Stack>
            ) : !selectedState ? (
              <Stack className="d-none d-lg-flex align-items-center justify-content-center flex-grow-1 h-100 mx-auto text-center" style={{ maxWidth: '420px' }}>
                <i className="fi fi-rr-map fs-48 mb-6" />
                <h4 className="fw-bold">Select a state to view</h4>
                <p className="fs-15 fw-light text-muted mb-4">Select a state from the left sidebar to view its details.</p>
                <Button variant="neutral" onClick={() => setShowAddModal(true)}>
                  <i className="fi fi-br-plus fs-10" />
                  <span className="ms-2">Add New State</span>
                </Button>
              </Stack>
            ) : (
              <div>
                <div className="apps-contact-details-header p-3 border-bottom">
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                      <Button
                        variant="light"
                        size="sm"
                        className="btn-icon me-3"
                        onClick={() => {
                          setSelectedState(null);
                          setContainerToggle(false);
                          setSidebarLeftToggle(false);
                        }}
                      >
                        <i className="fi fi-rr-arrow-left" />
                      </Button>
                      <h5 className="mb-1">States</h5>
                    </div>
                    <div className="d-flex gap-2">
                      <Button variant="light" className="btn-icon" onClick={handleMenuClick} style={{ padding: '8px', fontSize: '1.2rem' }}>
                        <i className="fi fi-rr-menu-burger" />
                      </Button>
                      <Button variant="light" className="btn-icon" onClick={handlePrev} disabled={selectedStateIndex <= 0} style={{ padding: '8px', fontSize: '1.2rem' }}>
                        <i className="fi fi-rr-angle-left" />
                      </Button>
                      <Button variant="light" className="btn-icon" onClick={handleNext} disabled={selectedStateIndex >= filteredStates.length - 1} style={{ padding: '8px', fontSize: '1.2rem' }}>
                        <i className="fi fi-rr-angle-right" />
                      </Button>
                      <Button variant="light" className="btn-icon" onClick={() => handleDeleteState(selectedState)} style={{ padding: '8px', fontSize: '1.2rem' }}>
                        <i className="fi fi-rr-trash" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="apps-contact-details p-4">
                  <div className="mb-4">
                    <h5 className="mb-2">{selectedState.state_name}</h5>
                    <p className="text-muted mb-0">State Code: {selectedState.state_code}</p>
                  </div>
                  <div className="mb-4">
                    <p className="text-muted mb-0">Country: {selectedState.country_name || 'N/A'}</p>
                  </div>
                  <div className="mb-4">
                    <p className="text-muted mb-0">Capital: {selectedState.state_capital}</p>
                  </div>
                  <div className="mb-4">
                    <p className="text-muted mb-0">Status: {selectedState.status === 0 ? 'Active' : 'Inactive'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="custom-backdrop" onClick={() => setSidebarMiniToggle(false)} />
      </Card>
      <StateModal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        onSuccess={fetchStates}
      />
      <StateModal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        state={selectedState}
        onSuccess={fetchStates}
        onUpdateSelectedState={setSelectedState}
      />
    </>
  );
};

// Add State Modal
interface StateModalRef {
  saveData: () => void;
}

const StateModal = forwardRef<StateModalRef, StateModalProps>(({ show, onHide, onSuccess, state, onUpdateSelectedState }, ref) => {
  const [loading, setLoading] = useState(false);
  const [countryItems, setCountryItems] = useState<CountryItem[]>([]);
  const formikRef = useRef<any>(null);

  const isEditMode = !!state;

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const data = await CountryService.list() as unknown as CountryItem[];
        setCountryItems(data);
      } catch {
        toast.error('Failed to fetch countries');
      }
    };
    fetchCountries();
  }, []);

  const initialValues = {
    state_name: state?.state_name || '',
    state_code: state?.state_code || '',
    state_capital: state?.state_capital || '',
    countryId: state ? Number(state.countryid) : null,
    status: state ? (state.status === 0 ? 'Active' : 'Inactive') : 'Active',
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const statusValue = values.status === 'Active' ? 0 : 1;
      const currentDate = new Date().toISOString();

      const payload: any = {
        state_name: values.state_name,
        state_code: values.state_code,
        state_capital: values.state_capital,
        countryid: values.countryId.toString(),
        status: statusValue,
        created_by_id: isEditMode ? state!.created_by_id : '1',
        created_date: isEditMode ? state!.created_date : currentDate,
        updated_by_id: '2',
        updated_date: currentDate,
      };

      try {
        if (isEditMode) {
          await StateService.update(parseInt(state!.stateid), payload);
        } else {
          await StateService.create(payload);
        }
        toast.success(`State ${isEditMode ? 'updated' : 'added'} successfully`);

        if (isEditMode && state && onUpdateSelectedState) {
          onUpdateSelectedState({
            ...state,
            state_name: values.state_name,
            state_code: values.state_code,
            state_capital: values.state_capital,
            countryid: String(values.countryId),
            status: statusValue,
            updated_by_id: '2',
            updated_date: currentDate
          });
        }

        onSuccess();
        onHide();
      } catch (error: unknown) {
        toast.error((error as string) || `Failed to ${isEditMode ? 'update' : 'add'} state`);
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
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>{isEditMode ? 'Edit State' : 'Add New State'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Formik
          innerRef={formikRef}
          initialValues={initialValues}
          validationSchema={stateFormValidationSchema}
          onSubmit={handleSubmit}
          enableReinitialize={true}
        >
          {({ values, setFieldValue }) => (
            <Form>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <FormikTextInput
                    name="state_name"
                    label="State Name"
                    placeholder="Enter state name"
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <FormikTextInput
                    name="state_code"
                    label="State Code"
                    placeholder="Enter state code"
                    maxLength={4}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase();
                      setFieldValue('state_code', value);
                    }}
                  />
                </div>
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <FormikTextInput
                    name="state_capital"
                    label="Capital City"
                    placeholder="Enter capital city"
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <FormikSelect
                    name="countryId"
                    label="Country"
                    options={countryItems
                      .filter((country) => String(country.status) === '0')
                      .map((country) => ({
                        value: String(country.countryid),
                        label: country.country_name,
                      }))}
                    onChange={(e) => {
                      setFieldValue('countryId', Number(e.target.value));
                    }}
                  />
                </div>
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <FormikSelect
                    name="status"
                    label="Status"
                    options={[
                      { value: 'Active', label: 'Active' },
                      { value: 'Inactive', label: 'Inactive' },
                    ]}
                    onChange={(e) => {
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

StateModal.displayName = 'StateModal';

export default States;