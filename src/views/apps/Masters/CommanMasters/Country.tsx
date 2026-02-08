
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Swal from 'sweetalert2';
import { toast } from 'react-hot-toast';
import { Button, Card, Stack, Pagination, Table, Modal } from 'react-bootstrap';
import { Preloader } from '@/components/Misc/Preloader';
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
import { myFormValidationSchema } from '@/common/validators';
import FormikTextInput from '@/components/Common/FormikTextInput';
import FormikSelect from '@/components/Common/FormikSelect';
import CountryService from '@/common/api/countries';

// Interfaces
interface CountryItem {
  countryid: string;
  country_name: string;
  country_code: string;
  country_capital: string;
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

interface CountryModalProps {
  show: boolean;
  onHide: () => void;
  country?: CountryItem | null;
  onSuccess: () => void;
  onUpdateSelectedCountry?: (country: CountryItem) => void;
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
const Country: React.FC = () => {
  const [countryItems, setCountryItems] = useState<CountryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('alls');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredCountries, setFilteredCountries] = useState<CountryItem[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<CountryItem | null>(null);
  const [selectedCountryIndex, setSelectedCountryIndex] = useState<number>(-1);
  const [loading, setLoading] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [sidebarLeftToggle, setSidebarLeftToggle] = useState<boolean>(false);
  const [sidebarMiniToggle, setSidebarMiniToggle] = useState<boolean>(false);
  const [containerToggle, setContainerToggle] = useState<boolean>(false);

  // Fetch countries from API
  const fetchCountries = async () => {
    setLoading(true);
    try {
      const data = await CountryService.list() as unknown as CountryItem[];
      setCountryItems(data);
      setFilteredCountries(data);
    } catch {
      toast.error('Failed to fetch countries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCountries();
  }, []);

  // Table columns
  const columns = useMemo<ColumnDef<CountryItem>[]>(() => [
    {
      id: 'srNo',
      header: 'Sr No',
      size: 20,
      cell: (cell) => <span>{cell.row.index + 1}</span>,
    },
    {
      accessorKey: 'country_code',
      header: 'Code',
      size: 10,
      cell: (cell) => (
        <div className="avatar avatar-md rounded-circle bg-light text-muted">
          {cell.getValue<string>()}
        </div>
      ),
    },
    {
      accessorKey: 'country_name',
      header: 'Country',
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
              setSelectedCountry(cell.row.original);
              setShowEditModal(true);
            }}
            style={{ padding: '4px 8px' }}
          >
            <i className="fi fi-rr-edit" />
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleDeleteCountry(cell.row.original)}
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
    data: filteredCountries,
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
        name: 'Countries',
        value: 'alls',
        icon: 'fi-rr-globe',
        badge: countryItems.length,
        badgeClassName: 'bg-primary-subtle text-primary',
      },
    ],
    [countryItems.length]
  );

  const labels: Label[] = useMemo(
    () => [
      { name: 'North America', value: 'north_america', gradient: 'success' },
      { name: 'Europe', value: 'europe', gradient: 'warning' },
      { name: 'Asia', value: 'asia', gradient: 'danger' },
      { name: 'Africa', value: 'africa', gradient: 'info' },
    ],
    []
  );

  // Search handler
  const handleSearch = (value: string) => {
    setSearchTerm(value); // Update input immediately
    filterCountries(value); // Debounced filtering
  };

  const filterCountries = useCallback(
    debounce((value: string) => {
      const searchValue = value.toLowerCase();
      const filtered = countryItems.filter((item) => {
        return (
          item.country_name.toLowerCase().includes(searchValue) ||
          item.country_code.toLowerCase().includes(searchValue) ||
          item.country_capital.toLowerCase().includes(searchValue)
        );
      });
      setFilteredCountries(filtered);
    }, 500),
    [countryItems]
  );

  // Category change handler
  const handleCategoryChange = useCallback(
    (categoryValue: string) => {
      setSelectedCategory(categoryValue);
      setSearchTerm('');
      setFilteredCountries(countryItems);
    },
    [countryItems]
  );

  // Country selection handler
  const handleCountryItemClick = useCallback((country: CountryItem) => {
    setSelectedCountry(country);
    setContainerToggle(true);
  }, []);

  // Delete country handler
  const handleDeleteCountry = async (country: CountryItem) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to recover this country!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3E97FF',
      confirmButtonText: 'Yes, delete it!',
    });

    if (result.isConfirmed) {
      try {
        await CountryService.remove(Number(country.countryid));
        toast.success('Country deleted successfully');
        fetchCountries();
        setSelectedCountry(null);
        setContainerToggle(false);
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Failed to delete country');
      }
    }
  };

  // Update selected country index
  useEffect(() => {
    const index = filteredCountries.findIndex((country) => country.countryid === selectedCountry?.countryid);
    setSelectedCountryIndex(index);
  }, [filteredCountries, selectedCountry]);

  // Navigation handlers
  const handleNext = useCallback(() => {
    if (selectedCountryIndex < filteredCountries.length - 1) {
      setSelectedCountry(filteredCountries[selectedCountryIndex + 1]);
      setContainerToggle(true);
    }
  }, [selectedCountryIndex, filteredCountries]);

  const handlePrev = useCallback(() => {
    if (selectedCountryIndex > 0) {
      setSelectedCountry(filteredCountries[selectedCountryIndex - 1]);
      setContainerToggle(true);
    }
  }, [selectedCountryIndex, filteredCountries]);

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
      <TitleHelmet title="Countries" />
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
                      className={selectedCountry?.countryid === row.original.countryid ? 'active' : ''}
                      style={{ color: isActive ? 'black' : 'gray', fontWeight: isActive ? 'bold' : 'normal' }}
                      onClick={() => handleCountryItemClick(row.original)}
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
            ) : !selectedCountry ? (
              <Stack className="d-none d-lg-flex align-items-center justify-content-center flex-grow-1 h-100 mx-auto text-center" style={{ maxWidth: '420px' }}>
                <i className="fi fi-rr-globe fs-48 mb-6" />
                <h4 className="fw-bold">Select a country to view</h4>
                <p className="fs-15 fw-light text-muted mb-4">Select a country from the left sidebar to view its details.</p>
                <Button variant="neutral" onClick={() => setShowAddModal(true)}>
                  <i className="fi fi-br-plus fs-10" />
                  <span className="ms-2">Add New Country</span>
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
                          setSelectedCountry(null);
                          setContainerToggle(false);
                          setSidebarLeftToggle(false);
                        }}
                      >
                        <i className="fi fi-rr-arrow-left" />
                      </Button>
                      <h5 className="mb-1">Countries</h5>
                    </div>
                    <div className="d-flex gap-2">
                      <Button variant="light" className="btn-icon" onClick={handleMenuClick} style={{ padding: '8px', fontSize: '1.2rem' }}>
                        <i className="fi fi-rr-menu-burger" />
                      </Button>
                      <Button variant="light" className="btn-icon" onClick={handlePrev} disabled={selectedCountryIndex <= 0} style={{ padding: '8px', fontSize: '1.2rem' }}>
                        <i className="fi fi-rr-angle-left" />
                      </Button>
                      <Button variant="light" className="btn-icon" onClick={handleNext} disabled={selectedCountryIndex >= filteredCountries.length - 1} style={{ padding: '8px', fontSize: '1.2rem' }}>
                        <i className="fi fi-rr-angle-right" />
                      </Button>
                      <Button variant="light" className="btn-icon" onClick={() => handleDeleteCountry(selectedCountry)} style={{ padding: '8px', fontSize: '1.2rem' }}>
                        <i className="fi fi-rr-trash" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="apps-contact-details p-4">
                  <div className="mb-4">
                    <h5 className="mb-2">{selectedCountry.country_name}</h5>
                    <p className="text-muted mb-0">Country Code: {selectedCountry.country_code}</p>
                  </div>
                  <div className="mb-4">
                    <p className="text-muted mb-0">Capital: {selectedCountry.country_capital}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="custom-backdrop" onClick={() => setSidebarMiniToggle(false)} />
      </Card>
      <CountryModal show={showAddModal} onHide={() => setShowAddModal(false)} onSuccess={fetchCountries} />
      <CountryModal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        country={selectedCountry}
        onSuccess={fetchCountries}
        onUpdateSelectedCountry={setSelectedCountry}
      />
    </>
  );
};

// CountryModal Component
const CountryModal: React.FC<CountryModalProps> = ({ show, onHide, onSuccess, country, onUpdateSelectedCountry }) => {
  const [loading, setLoading] = useState(false);
  const formikRef = useRef<any>(null);

  const isEditMode = !!country;

  const initialValues = {
    country_name: country?.country_name || '',
    country_code: country?.country_code || '',
    country_capital: country?.country_capital || '',
    status: country ? (String(country.status) === '0' ? 'Active' : 'Inactive') : 'Active',
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const statusValue = values.status === 'Active' ? 0 : 1;
      const currentDate = new Date().toISOString();
      const payload: any = {
        country_name: values.country_name,
        country_code: values.country_code,
        country_capital: values.country_capital,
        status: statusValue,
        created_by_id: isEditMode ? Number(country!.created_by_id) : 1,
        created_date: isEditMode ? country!.created_date : currentDate,
        updated_by_id: 2,
        updated_date: currentDate,
        ...(isEditMode ? { countryid: parseInt(country!.countryid) } : {}),
      };

      try {
        if (isEditMode) {
          await CountryService.update(parseInt(country!.countryid), payload);
        } else {
          await CountryService.create(payload);
        }
        toast.success(`Country ${isEditMode ? 'updated' : 'added'} successfully`);
        if (isEditMode && country && onUpdateSelectedCountry) {
          onUpdateSelectedCountry({ ...country, country_name: values.country_name, country_code: values.country_code, country_capital: values.country_capital, status: statusValue });
        }
        onSuccess();
        onHide();
      } catch (error: unknown) {
        toast.error((error as string) || `Failed to ${isEditMode ? 'update' : 'add'} country`);
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>{isEditMode ? 'Edit Country' : 'Add New Country'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Formik
          innerRef={formikRef}
          initialValues={initialValues}
          validationSchema={myFormValidationSchema}
          onSubmit={handleSubmit}
          enableReinitialize={true}
        >
          {({ values, setFieldValue }) => (
            <Form>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <FormikTextInput
                    name="country_name"
                    label="Country Name"
                    placeholder="Enter country name"
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <FormikTextInput
                    name="country_code"
                    label="Country Code"
                    placeholder="Enter country code"
                    maxLength={3}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^[0-9]*$/.test(value)) {
                        setFieldValue('country_code', value);
                      }
                    }}
                  />
                </div>
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <FormikTextInput
                    name="country_capital"
                    label="Capital City"
                    placeholder="Enter capital city"
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
};

export default Country;
