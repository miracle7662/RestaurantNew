import React, { useState, useEffect, useMemo, useCallback, forwardRef, useImperativeHandle, useRef } from 'react';
import Swal from 'sweetalert2';
import { toast } from 'react-hot-toast';
import { Preloader } from '@/components/Misc/Preloader';
import { Button, Card, Stack, Pagination, Table, Modal } from 'react-bootstrap';
import { ContactSearchBar } from '@/components/Apps/Contact';
import TitleHelmet from '@/components/Common/TitleHelmet';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  ColumnDef,
  flexRender,
  HeaderGroup,
  Row,
  Cell,
} from '@tanstack/react-table';
import { Formik, Form } from 'formik';
import { cityFormValidationSchema } from '@/common/validators';
import FormikTextInput from '@/components/Common/FormikTextInput';
import FormikSelect from '@/components/Common/FormikSelect';
import CityService from '@/common/api/cities';
import StateService from '@/common/api/states';

// Interfaces
interface CityItem {
  cityid: string;
  city_name: string;
  city_code: string;
  stateId: string;
  state_name?: string;
  countryid: string;
  country_name?: string;
  status: number;
  created_by_id: string;
  created_date: string;
  updated_by_id: string;
  updated_date: string;
}

interface StateItem {
  stateid: string;
  state_name: string;
  status: number;
}

interface CityModalProps {
  show: boolean;
  onHide: () => void;
  city?: CityItem | null;
  onSuccess: () => void;
  onUpdateSelectedCity?: (city: CityItem) => void;
}

interface CityModalRef {
  saveData: () => void;
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
const City: React.FC = () => {
  const [cityItems, setCityItems] = useState<CityItem[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredCities, setFilteredCities] = useState<CityItem[]>([]);
  const [selectedCity, setSelectedCity] = useState<CityItem | null>(null);
  const [selectedCityIndex, setSelectedCityIndex] = useState<number>(-1);
  const [loading, setLoading] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [sidebarLeftToggle, setSidebarLeftToggle] = useState<boolean>(false);
  const [sidebarMiniToggle, setSidebarMiniToggle] = useState<boolean>(false);
  const [containerToggle, setContainerToggle] = useState<boolean>(false);
  const addModalRef = useRef<CityModalRef>(null);
  const editModalRef = useRef<CityModalRef>(null);

  // Fetch cities from API
  const fetchCities = async () => {
    setLoading(true);
    try {
      const data = await CityService.list() as unknown as CityItem[];
      // Map city_Code to city_code for frontend consistency
      const mappedData = data.map((item: any) => ({
        ...item,
        city_code: item.city_Code,
      }));
      setCityItems(mappedData);
      setFilteredCities(mappedData);
    } catch {
      toast.error('Failed to fetch cities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCities();
  }, []);

  // Table columns
  const columns = useMemo<ColumnDef<CityItem>[]>(() => [
    {
      id: 'srNo',
      header: 'Sr No',
      size: 20,
      cell: (cell) => <span>{cell.row.index + 1}</span>,
    },
    {
      accessorKey: 'city_code',
      header: 'Code',
      size: 10,
      cell: (cell) => (
        <div className="avatar avatar-md rounded-circle bg-light text-muted">
          {cell.getValue<string>()}
        </div>
      ),
    },
    {
      accessorKey: 'city_name',
      header: 'City',
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
              setSelectedCity(cell.row.original);
              setShowEditModal(true);
            }}
            style={{ padding: '4px 8px' }}
          >
            <i className="fi fi-rr-edit" />
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleDeleteCity(cell.row.original)}
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
    data: filteredCities,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });
  // Search handler
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    filterCities(value);
  };

  const filterCities = useCallback(
    debounce((value: string) => {
      const searchValue = value.toLowerCase();
      const filtered = cityItems.filter((item) => {
        return (
          item.city_name.toLowerCase().includes(searchValue) ||
          item.city_code.toLowerCase().includes(searchValue) ||
          (item.state_name && item.state_name.toLowerCase().includes(searchValue)) ||
          (item.country_name && item.country_name.toLowerCase().includes(searchValue))
        );
      });
      setFilteredCities(filtered);
    }, 500),
    [cityItems]
  );

  // City selection handler
  const handleCityItemClick = useCallback((city: CityItem) => {
    setSelectedCity(city);
    setContainerToggle(true);
  }, []);

  // Delete city handler
  const handleDeleteCity = async (city: CityItem) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to recover this city!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3E97FF',
      confirmButtonText: 'Yes, delete it!',
    });

    if (result.isConfirmed) {
      try {
        await CityService.remove(parseInt(city.cityid));
        toast.success('City deleted successfully');
        fetchCities();
        setSelectedCity(null);
        setContainerToggle(false);
      } catch {
        toast.error('Failed to delete city');
      }
    }
  };
  // Update selected city index
  useEffect(() => {
    const index = filteredCities.findIndex((city) => city.cityid === selectedCity?.cityid);
    setSelectedCityIndex(index);
  }, [filteredCities, selectedCity]);

  // Navigation handlers
  const handleNext = useCallback(() => {
    if (selectedCityIndex < filteredCities.length - 1) {
      setSelectedCity(filteredCities[selectedCityIndex + 1]);
      setContainerToggle(true);
    }
  }, [selectedCityIndex, filteredCities]);

  const handlePrev = useCallback(() => {
    if (selectedCityIndex > 0) {
      setSelectedCity(filteredCities[selectedCityIndex - 1]);
      setContainerToggle(true);
    }
  }, [selectedCityIndex, filteredCities]);

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
      <TitleHelmet title="Cities" />
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
         
        </div>
        <div className="apps-sidebar apps-sidebar-left apps-sidebar-md" style={{ minWidth: '530px' }}>
          <ContactSearchBar searchTerm={searchTerm} handleSearch={handleSearch} />
          <div className="apps-sidebar-content" style={{ display: 'flex', flexDirection: 'column', height: '100%', minWidth: '250px' }}>
            <Table responsive size="sm" className="mb-0" style={{ minWidth: '300px' }}>
              <thead>
                {table.getHeaderGroups().map((headerGroup: HeaderGroup<CityItem>) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} style={{ width: header.column.columnDef.size }}>
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row: Row<CityItem>) => {
                  const isActive = row.original.status === 0;
                  return (
                    <tr
                      key={row.id}
                      className={selectedCity?.cityid === row.original.cityid ? 'active' : ''}
                      style={{ color: isActive ? 'black' : 'gray', fontWeight: isActive ? 'bold' : 'normal' }}
                      onClick={() => handleCityItemClick(row.original)}
                    >
                      {row.getVisibleCells().map((cell: Cell<CityItem, unknown>) => (
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
            ) : !selectedCity ? (
              <Stack className="d-none d-lg-flex align-items-center justify-content-center flex-grow-1 h-100 mx-auto text-center" style={{ maxWidth: '420px' }}>
                <i className="fi fi-rr-map fs-48 mb-6" />
                <h4 className="fw-bold">Select a city to view</h4>
                <p className="fs-15 fw-light text-muted mb-4">Select a city from the left sidebar to view its details.</p>
                <Button variant="neutral" onClick={() => setShowAddModal(true)}>
                  <i className="fi fi-br-plus fs-10" />
                  <span className="ms-2">Add New City</span>
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
                          setSelectedCity(null);
                          setContainerToggle(false);
                          setSidebarLeftToggle(false);
                        }}
                      >
                        <i className="fi fi-rr-arrow-left" />
                      </Button>
                      <h5 className="mb-1">Cities</h5>
                    </div>
                    <div className="d-flex gap-2">
                      <Button variant="light" className="btn-icon" onClick={handleMenuClick} style={{ padding: '8px', fontSize: '1.2rem' }}>
                        <i className="fi fi-rr-menu-burger" />
                      </Button>
                      <Button variant="light" className="btn-icon" onClick={handlePrev} disabled={selectedCityIndex <= 0} style={{ padding: '8px', fontSize: '1.2rem' }}>
                        <i className="fi fi-rr-angle-left" />
                      </Button>
                      <Button variant="light" className="btn-icon" onClick={handleNext} disabled={selectedCityIndex >= filteredCities.length - 1} style={{ padding: '8px', fontSize: '1.2rem' }}>
                        <i className="fi fi-rr-angle-right" />
                      </Button>
                      <Button variant="light" className="btn-icon" onClick={() => handleDeleteCity(selectedCity)} style={{ padding: '8px', fontSize: '1.2rem' }}>
                        <i className="fi fi-rr-trash" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="apps-contact-details p-4">
                  <div className="mb-4">
                    <h5 className="mb-2">{selectedCity.city_name}</h5>
                    <p className="text-muted mb-0">City Code: {selectedCity.city_code}</p>
                  </div>
                  <div className="mb-4">
                    <p className="text-muted mb-0">State: {selectedCity.state_name || 'N/A'}</p>
                  </div>
                  <div className="mb-4">
                    <p className="text-muted mb-0">Country: {selectedCity.country_name || 'N/A'}</p>
                  </div>
                  <div className="mb-4">
                    <p className="text-muted mb-0">Status: {selectedCity.status === 0 ? 'Active' : 'Inactive'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="custom-backdrop" onClick={() => setSidebarMiniToggle(false)} />
      </Card>
      <CityModal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        onSuccess={fetchCities}
      />
      <CityModal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        city={selectedCity}
        onSuccess={fetchCities}
        onUpdateSelectedCity={setSelectedCity}
      />
    </>
  );
};

// Add City Modal
const CityModal = forwardRef<CityModalRef, CityModalProps>(({ show, onHide, onSuccess, city, onUpdateSelectedCity }, ref) => {
  const [loading, setLoading] = useState(false);
  const [stateItems, setStateItems] = useState<StateItem[]>([]);
  const formikRef = useRef<any>(null);

  const isEditMode = !!city;

  useEffect(() => {
    const fetchStates = async () => {
      try {
        const data = await StateService.list() as unknown as StateItem[];
        setStateItems(data);
      } catch {
        toast.error('Failed to fetch states');
      }
    };
    fetchStates();
  }, []);

  const initialValues = {
    city_name: city?.city_name || '',
    city_code: city?.city_code || '',
    stateId: city ? Number(city.stateId) : null,
    status: city ? (city.status === 0 ? 'Active' : 'Inactive') : 'Active',
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const statusValue = values.status === 'Active' ? 0 : 1;
      const currentDate = new Date().toISOString();

      // Map frontend fields to backend expected fields
      const payload = {
        city_name: values.city_name,
        city_Code: values.city_code, // Fix: backend expects city_Code (capital C)
        stateId: values.stateId,     // Fix: backend expects stateId (capital I)
        iscoastal: 0,         // Add: backend expects iscoastal field
        status: statusValue,
        ...(isEditMode
          ? {
              updated_by_id: '2',
              updated_date: currentDate
            }
          : {
              created_by_id: '1',
              created_date: currentDate
            }
        ),
      };

      try {
        if (isEditMode) {
          await CityService.update(parseInt(city!.cityid), payload);
        } else {
          await CityService.create(payload);
        }
        toast.success(`City ${isEditMode ? 'updated' : 'added'} successfully`);

        if (isEditMode && city && onUpdateSelectedCity) {
          onUpdateSelectedCity({
            ...city,
            city_name: values.city_name,
            city_code: values.city_code,
            stateId: String(values.stateId),
            status: statusValue,
            updated_by_id: '2',
            updated_date: currentDate
          });
        }

        onSuccess();
        onHide();
      } catch (error: unknown) {
        toast.error((error as string) || `Failed to ${isEditMode ? 'update' : 'add'} city`);
      }
    } catch (error) {
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
        <Modal.Title>{isEditMode ? 'Edit City' : 'Add New City'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Formik
          innerRef={formikRef}
          initialValues={initialValues}
          validationSchema={cityFormValidationSchema}
          onSubmit={handleSubmit}
          enableReinitialize={true}
        >
          {({ values, setFieldValue }) => (
            <Form>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <FormikTextInput
                    name="city_name"
                    label="City Name"
                    placeholder="Enter city name"
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <FormikTextInput
                    name="city_code"
                    label="City Code"
                    placeholder="Enter city code"
                    maxLength={4}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase();
                      setFieldValue('city_code', value);
                    }}
                  />
                </div>
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <FormikSelect
                    name="stateId"
                    label="State"
                    options={stateItems
                      .filter((state) => String(state.status) === '0')
                      .map((state) => ({
                        value: String(state.stateid),
                        label: state.state_name,
                      }))}
                    onChange={(e) => {
                      setFieldValue('stateId', Number(e.target.value));
                    }}
                  />
                </div>
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

CityModal.displayName = 'CityModal';

export default City;
