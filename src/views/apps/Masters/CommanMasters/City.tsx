import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Swal from 'sweetalert2';
import { toast } from 'react-hot-toast';
import { Preloader } from '@/components/Misc/Preloader';
import { Button, Card, Stack, Pagination, Table, Modal, Form } from 'react-bootstrap';
import { ContactSearchBar } from '@/components/Apps/Contact';
import TitleHelmet from '@/components/Common/TitleHelmet';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table';
import { Formik, Form as FormikForm, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { getCities, deleteCity, getStates, getCountries, updateCity, createCity, CityItem, StateItem, CountryItem } from '@/common/api/cities';




interface CityModalProps {
  show: boolean;
  onHide: () => void;
  city?: CityItem | null;
  onSuccess: () => void;
  onUpdateSelectedCity?: (city: CityItem) => void;
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

  // Fetch cities from API
  const fetchCities = async () => {
    setLoading(true);
    try {
      const data = await getCities();
      setCityItems(data);
      setFilteredCities(data);
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
      accessorKey: 'city_Code',
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
          item.city_Code.toLowerCase().includes(searchValue) ||
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
    await deleteCity(city.cityid);

    toast.success('City deleted successfully');
    fetchCities();
    setSelectedCity(null);
    setContainerToggle(false);
  } catch (error) {
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
                      className={selectedCity?.cityid === row.original.cityid ? 'active' : ''}
                      style={{ color: isActive ? 'black' : 'gray', fontWeight: isActive ? 'bold' : 'normal' }}
                      onClick={() => handleCityItemClick(row.original)}
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
                    <p className="text-muted mb-0">City Code: {selectedCity.city_Code}</p>
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
const CityModal: React.FC<CityModalProps> = ({ show, onHide, city, onSuccess, onUpdateSelectedCity }) => {
  const [states, setStates] = useState<StateItem[]>([]);
  const [countries, setCountries] = useState<CountryItem[]>([]);
  const [loading, setLoading] = useState(false);

  const isEditMode = !!city;

  // Validation schema
  const validationSchema = Yup.object({
    city_name: Yup.string().required('City Name is required'),
    city_code: Yup.string()
      .required('City Code is required')
      .max(4, 'City Code must be at most 4 characters')
      .matches(/^[A-Z]+$/, 'City Code must be uppercase letters only'),
    stateId: Yup.number().required('State is required'),
    countryid: Yup.number().required('Country is required'),
    status: Yup.boolean().required('Status is required'),
  });

  // Initial values
  const initialValues = {
    city_name: city?.city_name || '',
    city_code: city?.city_Code || '',
    stateId: city ? Number(city.stateId) : null,
    countryid: city ? Number(city.countryid) : null,
    status: city ? city.status === 0 : true,
  };

  // Fetch states and countries
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statesData, countriesData] = await Promise.all([getStates(), getCountries()]);
        setStates(statesData);
        setCountries(countriesData);
      } catch (error) {
        toast.error('Failed to load states and countries');
      }
    };
    if (show) {
      fetchData();
    }
  }, [show]);

  // Handle form submit
  const handleSubmit = async (values: typeof initialValues) => {
    setLoading(true);
    try {
      const currentDate = new Date().toISOString();
      const payload = {
        city_name: values.city_name,
        city_Code: values.city_code, // Backend expects city_Code
        stateId: values.stateId ? String(values.stateId) : undefined,
        countryid: values.countryid ? String(values.countryid) : undefined,
        iscoastal: 0, // Backend expects iscoastal
        status: values.status ? 0 : 1,
        ...(isEditMode
          ? {
              updated_by_id: '2',
              updated_date: currentDate,
            }
          : {
              created_by_id: '1',
              created_date: currentDate,
            }),
      };

      if (isEditMode && city) {
        await updateCity(city.cityid, payload);
        toast.success('City updated successfully');
        if (onUpdateSelectedCity) {
          onUpdateSelectedCity({
            ...city,
            city_name: values.city_name,
            city_Code: values.city_code,
            stateId: String(values.stateId),
            countryid: String(values.countryid),
            status: values.status ? 0 : 1,
          });
        }
      } else {
        await createCity(payload);
        toast.success('City added successfully');
      }

      onSuccess();
      onHide();
    } catch (error: any) {
      toast.error(error.message || `Failed to ${isEditMode ? 'update' : 'add'} city`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{isEditMode ? 'Edit City' : 'Add New City'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ values, setFieldValue, resetForm }) => {
            // Reset form on close
            useEffect(() => {
              if (!show) {
                resetForm();
              }
            }, [show, resetForm]);

            return (
              <FormikForm>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <Form.Group>
                      <Form.Label>City Name <span style={{ color: 'red' }}>*</span></Form.Label>
                      <Field
                        name="city_name"
                        as={Form.Control}
                        type="text"
                        placeholder="Enter city name"
                      />
                      <ErrorMessage name="city_name" component="div" className="text-danger" />
                    </Form.Group>
                  </div>
                  <div className="col-md-6 mb-3">
                    <Form.Group>
                      <Form.Label>City Code <span style={{ color: 'red' }}>*</span></Form.Label>
                      <Field
                        name="city_code"
                        as={Form.Control}
                        type="text"
                        placeholder="Enter city code"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setFieldValue('city_code', e.target.value.toUpperCase());
                        }}
                        maxLength={4}
                      />
                      <ErrorMessage name="city_code" component="div" className="text-danger" />
                    </Form.Group>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <Form.Group>
                      <Form.Label>State <span style={{ color: 'red' }}>*</span></Form.Label>
                      <Field
                        name="stateId"
                        as={Form.Select}
                        value={values.stateId || ''}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                          setFieldValue('stateId', Number(e.target.value));
                        }}
                      >
                        <option value="">Select a state</option>
                        {states
                          .filter((state) => state.status === 0)
                          .map((state) => (
                            <option key={state.stateid} value={state.stateid}>
                              {state.state_name}
                            </option>
                          ))}
                      </Field>
                      <ErrorMessage name="stateId" component="div" className="text-danger" />
                    </Form.Group>
                  </div>
                  <div className="col-md-6 mb-3">
                    <Form.Group>
                      <Form.Label>Country <span style={{ color: 'red' }}>*</span></Form.Label>
                      <Field
                        name="countryid"
                        as={Form.Select}
                        value={values.countryid || ''}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                          setFieldValue('countryid', Number(e.target.value));
                        }}
                      >
                        <option value="">Select a country</option>
                        {countries
                          .filter((country) => country.status === 0)
                          .map((country) => (
                            <option key={country.countryid} value={country.countryid}>
                              {country.country_name}
                            </option>
                          ))}
                      </Field>
                      <ErrorMessage name="countryid" component="div" className="text-danger" />
                    </Form.Group>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <Form.Group>
                      <Form.Label>Active</Form.Label>
                      <div className="form-check">
                        <Field
                          name="status"
                          type="checkbox"
                          className="form-check-input"
                          id="status"
                        />
                        <label className="form-check-label" htmlFor="status">
                          Active
                        </label>
                      </div>
                      <ErrorMessage name="status" component="div" className="text-danger" />
                    </Form.Group>
                  </div>
                </div>
                <Modal.Footer>
                  <Button variant="secondary" onClick={onHide} disabled={loading}>
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit" disabled={loading}>
                    {loading ? (isEditMode ? 'Updating...' : 'Adding...') : 'Save'}
                  </Button>
                </Modal.Footer>
              </FormikForm>
            );
          }}
        </Formik>
      </Modal.Body>
    </Modal>
  );
};

export default City;
