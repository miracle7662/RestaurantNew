import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button, Card, Stack, Pagination, Table, Modal, Form } from 'react-bootstrap';
import Swal from 'sweetalert2';
import { toast } from 'react-hot-toast';
import { Preloader } from '@/components/Misc/Preloader';
import {
  ContactSearchBar,
  ContactSidebar,
} from '@/components/Apps/Contact';
import TitleHelmet from '@/components/Common/TitleHelmet';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table';
import {
 
  fetchStates,
  StateItem,
} from '../../../../utils/commonfunction';

// Define types inline
interface CityItem {
  cityid : string;
  city_name: string;
  city_Code: string;
  stateId: string;
  isCoastal: boolean;
  status: string | number; // Use string or number based on your backend response
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
//1
// Debounce utility function
const debounce = (func: (...args: any[]) => void, wait: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const City: React.FC = () => {
  const [cityItems, setCityItems] = useState<CityItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('alls');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredCities, setFilteredCities] = useState<CityItem[]>([]);
  const [selectedCity, setSelectedCity] = useState<CityItem | null>(null);
  const [selectedCityIndex, setSelectedCityIndex] = useState<number>(-1);
  const [loading] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [containerToggle, setContainerToggle] = useState<boolean>(false);
  const [sidebarLeftToggle, setSidebarLeftToggle] = useState<boolean>(false);
  const [sidebarMiniToggle, setSidebarMiniToggle] = useState<boolean>(false);

  const fetchCities = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/cities');
      const data = await res.json();
      // Convert isCoastal from integer to boolean
      const citiesWithBoolean = data.map((mstcitymaster: any) => ({
        ...mstcitymaster,
        isCoastal: Boolean(mstcitymaster.isCoastal)
      }));
      setCityItems(citiesWithBoolean);
      setFilteredCities(citiesWithBoolean);
    } catch (err) {
      toast.error('Failed to fetch cities');
    }
  };

  useEffect(() => {
    fetchCities();
  }, []);

  // Define columns for react-table with explicit widths
  const columns = React.useMemo<ColumnDef<CityItem>[]>(
    () => [
      {
        id: 'srNo',
        header: 'Sr No',
        size: 20,
        cell: ({ row }) => <span>{row.index + 1}</span>,
      },
      {
        accessorKey: 'city_Code',
        header: 'Code',
        size: 10,
        cell: (info) => (
          <div className="avatar avatar-md rounded-circle bg-light text-muted">
            {info.getValue<string>()}
          </div>
        ),
      },
      {
        accessorKey: 'city_name',
        header: 'City',
        size: 10,
        cell: (info) => <h6 className="mb-1">{info.getValue<string>()}</h6>,
      },

      {
        accessorKey: 'status',
        header: 'Status',
        size: 50,
        cell: (info) => {
          const statusValue = info.getValue<string | number>();
          console.log('Status value:', statusValue, typeof statusValue); // Debug log
          return <div style={{ textAlign: 'center' }}>{statusValue == '0' || statusValue === 0 ? 'Active' : 'Inactive'}</div>;
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        size: 30,
        cell: ({ row }) => (
          <div className="d-flex gap-2">
            <button
              className="btn btn-sm btn-success"
              onClick={() => handleEditClick(row.original)}
              style={{ padding: '4px 8px' }}
            >
              <i className="fi fi-rr-edit"></i>
            </button>
            <button
              className="btn btn-sm btn-danger"
              onClick={() => handleDeleteCity(row.original)}
              style={{ padding: '4px 8px' }}
            >
              <i className="fi fi-rr-trash"></i>
            </button>
          </div>
        ),
      },
    ],
    []
  );

  // Initialize react-table with pagination
  const table = useReactTable({
    data: filteredCities,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const categories: Category[] = useMemo(() => [
    {
      name: 'Cities',
      value: 'alls',
      icon: 'fi-rr-building',
      badge: cityItems.length,
      badgeClassName: 'bg-primary-subtle text-primary',
    },
  ], [cityItems.length]);

  const labels: Label[] = useMemo(() => [
    { name: 'Coastal', value: 'coastal', gradient: 'success' },
    { name: 'Inland', value: 'inland', gradient: 'warning' },
  ], []);

  useEffect(() => {
    setFilteredCities(cityItems.filter((item) => item));
  }, [cityItems]);

  const handleSearch = useCallback(
    debounce((value: string) => {
      setSearchTerm(value);

      const filteredCitiesByCategory = cityItems.filter(
        (item) => item,
      );
      const filteredCitiesBySearch = filteredCitiesByCategory.filter((item) =>
        item.city_name.toLowerCase().includes(value.toLowerCase()),
      );
      setFilteredCities(filteredCitiesBySearch);
    }, 300),
    [cityItems, selectedCategory]
  );

  const handleCategoryChange = useCallback((categoryValue: string) => {
    setSelectedCategory(categoryValue);
    setSearchTerm('');
    setFilteredCities(cityItems.filter((item) => item));
  }, [cityItems]);

  const handleCityItemClick = useCallback((mstcitymaster: CityItem) => {
    setSelectedCity(mstcitymaster);
    setContainerToggle(true);
  }, []);

  const handleEditClick = (mstcitymaster: CityItem) => {
    setSelectedCity(mstcitymaster);
    setShowEditModal(true);
  };

  const handleDeleteCity = async (mstcitymaster: CityItem) => {
    const res = await Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to recover this city!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3E97FF',
      confirmButtonText: 'Yes, delete it!',
    });
    if (res.isConfirmed) {
      try {
        await fetch(`http://localhost:3001/api/cities/${mstcitymaster.cityid}`, { method: 'DELETE' });
        toast.success('Deleted successfully aBCD');
        fetchCities();

        setSelectedCity(null);
        setCityItems((prev) => prev.filter((c) => c.cityid !== mstcitymaster.cityid));
        setFilteredCities((prev) => prev.filter((c) => c.cityid !== mstcitymaster.cityid));
        // if (selectedCity && selectedCity.id === city.id) {

        //   //setContainerToggle(false);
        // }

      } catch (error) {
        toast.error('Failed to delete');
      }
    }
  };

  useEffect(() => {
    const index = filteredCities.findIndex(
      (city) => city.cityid === (selectedCity?.cityid || ''),
    );
    setSelectedCityIndex(index);
  }, [filteredCities, selectedCity]);

  const handleNext = useCallback(() => {
    if (selectedCityIndex < filteredCities.length - 1) {
      const nextIndex = selectedCityIndex + 1;
      setSelectedCity(filteredCities[nextIndex]);
      setContainerToggle(true);
    }
  }, [selectedCityIndex, filteredCities]);

  const handlePrev = useCallback(() => {
    if (selectedCityIndex > 0) {
      const prevIndex = selectedCityIndex - 1;
      setSelectedCity(filteredCities[prevIndex]);
      setContainerToggle(true);
    }
  }, [selectedCityIndex, filteredCities]);

  // Compute the card classes based on state
  const cardClasses = useMemo(() => {
    let classes = 'apps-card';
    if (sidebarMiniToggle) classes += ' apps-sidebar-mini-toggle';
    if (containerToggle) classes += ' apps-container-toggle';
    if (sidebarLeftToggle) classes += ' apps-sidebar-left-toggle';
    return classes;
  }, [sidebarMiniToggle, containerToggle, sidebarLeftToggle]);

  // Handle resize for sidebarLeftToggle
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 991.98 && sidebarLeftToggle) {
        setSidebarLeftToggle(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
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
          .apps-card {
            transition: all 0.3s ease-in-out;
          }
          .apps-sidebar-left,
          .apps-container {
            transition: width 0.3s ease-in-out;
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
          <div
            className="apps-sidebar-content"
            style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              minWidth: '250px'
            }}
          >
            <div className="d-flex justify-content-between align-items-center mb-0 px-1 ">
              <span className="text-muted fw-bold"></span>
              <span className="text-muted fw-bold"></span>
            </div>
            <div style={{ marginLeft: '10px' }}>
              <Table
                responsive
                size='sm'
                className="mb-0"
                style={{ minWidth: '300px' }}
              >
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          colSpan={header.colSpan}
                          style={{ width: header.column.columnDef.size }}
                        >
                          {header.isPlaceholder ? null : (
                            <div>{flexRender(header.column.columnDef.header, header.getContext())}</div>
                          )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className={selectedCity?.cityid === row.original.cityid ? 'active' : ''}
                      onClick={() => handleCityItemClick(row.original)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
            <Stack
              className="p-2 border-top d-flex flex-row align-items-center justify-content-between"
              style={{ gap: '6px', padding: '8px 12px' }}
            >
              <select
                value={table.getState().pagination.pageSize}
                onChange={(e) => {
                  table.setPageSize(Number(e.target.value));
                }}
                style={{
                  border: '1px solid #0d6efd',
                  borderRadius: '4px',
                  padding: '2px 4px',
                  fontSize: '12px',
                  backgroundColor: '#fff',
                  color: '#6c757d',
                  cursor: 'pointer',
                  width: '100px',
                  height: '30px',
                }}
              >
                {[10, 20, 30].map((pageSize) => (
                  <option key={pageSize} value={pageSize}>
                    {pageSize}
                  </option>
                ))}
              </select>
              <Pagination
                className="m-0"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  marginRight: '20px',
                }}
              >
                <Pagination.Prev
                  onClick={() => table.setPageIndex(table.getState().pagination.pageIndex - 1)}
                  disabled={table.getState().pagination.pageIndex === 0}
                  style={{
                    border: '1px solid #e5e7eb',
                    color: table.getState().pagination.pageIndex === 0 ? '#d3d3d3' : '#6c757d',
                    padding: '2px 4px',
                    borderRadius: '4px',
                    backgroundColor: 'transparent',
                    fontSize: '12px',
                    lineHeight: '1',
                  }}
                >
                  <i className="fi fi-rr-angle-left" style={{ fontSize: '12px' }} />
                </Pagination.Prev>
                <Pagination.Item
                  active
                  style={{
                    backgroundColor: '#0d6efd',
                    border: '1px solid #0d6efd',
                    color: '#fff',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    minWidth: '24px',
                    textAlign: 'center',
                    lineHeight: '1',
                  }}
                >
                  {table.getState().pagination.pageIndex + 1}
                </Pagination.Item>
                <Pagination.Next
                  onClick={() => table.setPageIndex(table.getState().pagination.pageIndex + 1)}
                  disabled={table.getState().pagination.pageIndex === table.getPageCount() - 1}
                  style={{
                    border: '1px solid #e5e7eb',
                    color: table.getState().pagination.pageIndex === table.getPageCount() - 1 ? '#d3d3d3' : '#6c757d',
                    padding: '2px 4px',
                    borderRadius: '4px',
                    backgroundColor: 'transparent',
                    fontSize: '12px',
                    lineHeight: '1',
                  }}
                >
                  <i className="fi fi-rr-angle-right" style={{ fontSize: '12px' }} />
                </Pagination.Next>
              </Pagination>
            </Stack>
          </div>
        </div>
        <div className={`apps-container ${containerToggle ? 'w-full' : ''}`}>
          <div className="apps-container-inner" style={{ minHeight: 'calc(100vh )' }}>
            {loading ? (
              <Stack className="align-items-center justify-content-center  h-100">
                <Preloader />
              </Stack>
            ) : !selectedCity ? (
              <Stack
                className="d-none d-lg-flex align-items-center justify-content-center flex-grow-1 h-100 mx-auto text-center"
                style={{ maxWidth: '420px' }}
              >
                <i className="fi fi-rr-building fs-48 mb-6"></i>
                <h4 className="fw-bold">Select a city to view</h4>
                <p className="fs-15 fw-light text-muted mb-4">
                  Select a city from the left sidebar to view its details.
                </p>
                <Button
                  variant=""
                  className="btn-neutral"
                  onClick={() => setShowAddModal(true)}
                >
                  <i className="fi fi-br-plus fs-10"></i>
                  <span className="ms-2">Add New City</span>
                </Button>
              </Stack>
            ) : (
              <div>
                <div className="apps-contact-details-header p-3 border-bottom">
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                      <button
                        className="btn btn-sm btn-icon btn-light me-3"
                        onClick={() => {
                          setSelectedCity(null);
                          setContainerToggle(false);
                          setSidebarLeftToggle(false);
                        }}
                      >
                        <i className="fi fi-rr-arrow-left"></i>
                      </button>
                      <div className="flex-grow-1">
                        <h5 className="mb-1">Cities</h5>
                      </div>
                    </div>
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-icon btn-light"
                        onClick={handleMenuClick}
                        style={{ padding: '8px', fontSize: '1.2rem' }}
                      >
                        <i className="fi fi-rr-menu-burger"></i>
                      </button>
                      <button
                        className="btn btn-icon btn-light"
                        onClick={handlePrev}
                        disabled={selectedCityIndex <= 0}
                        style={{ padding: '8px', fontSize: '1.2rem' }}
                      >
                        <i className="fi fi-rr-angle-left"></i>
                      </button>
                      <button
                        className="btn btn-icon btn-light"
                        onClick={handleNext}
                        disabled={selectedCityIndex >= filteredCities.length - 1}
                        style={{ padding: '8px', fontSize: '1.2rem' }}
                      >
                        <i className="fi fi-rr-angle-right"></i>
                      </button>
                      <button
                        className="btn btn-icon btn-light"
                        onClick={() => handleDeleteCity(selectedCity)}
                        style={{ padding: '8px', fontSize: '1.2rem' }}
                      >
                        <i className="fi fi-rr-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="apps-contact-details p-4">
                  <div className="mb-4">
                    <h5 className="mb-2">{selectedCity.city_name}</h5>
                    <p className="text-muted mb-0">City Code: {selectedCity.city_Code}</p>
                  </div>
                  <div className="mb-4">
                    <p className="text-muted mb-0">State ID: {selectedCity.stateId}</p>
                  </div>
                 
                  <div className="mb-4">
                    <p className="text-muted mb-0">Type: {selectedCity.isCoastal ? 'Coastal City' : 'Inland City'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="custom-backdrop" onClick={() => setSidebarMiniToggle(false)}></div>
      </Card>
      <AddCityModal show={showAddModal} onHide={() => setShowAddModal(false)} onSuccess={fetchCities} />
      <EditCityModal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        mstcitymaster={selectedCity}
        onSuccess={fetchCities}
        onUpdateSelectedCity={(updatedCity) => setSelectedCity(updatedCity)}
      />
    </>
  );
};
//2

// AddCityModal component
interface AddCityModalProps {
  show: boolean;
  onHide: () => void;
  onSuccess: () => void;
}

const AddCityModal: React.FC<AddCityModalProps> = ({ show, onHide, onSuccess }) => {
  const [city_name, setName] = useState('');
  const [city_Code, setCityCode] = useState('');
  const [stateId, setStateId] = useState<number | null>(null);
  const [isCoastal, setIsCoastal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('Active'); // Default to 'Active'
  const [states, setStates] = useState<StateItem[]>([]);
  

  // Fetch states when modal opens
  useEffect(() => {
    fetchStates(setStates, setStateId, undefined,);

  }, []);




  const handleAdd = async () => {
    if (!city_name || !city_Code || !stateId || !status) {
      toast.error('All fields are required');
      return;
    }

    setLoading(true);
    try {
      const statusValue = status === 'Active' ? 0 : 1;
      const currentDate = new Date().toISOString(); // Timestamp: e.g., 2025-07-01T04:00:00.000Z
      const payload = {
        city_name,
        city_Code,
        stateId,
        isCoastal,
        status: statusValue,       
        created_by_id: 1, // Default to null (or 0 if backend requires)
        created_date: currentDate,
      };
      console.log('Sending to backend:', payload); // Debug log
      const res = await fetch('http://localhost:3001/api/cities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success('City added successfully');
        setName('');
        setCityCode('');
        setStateId(null);
        setIsCoastal(false);
        setStatus('Active'); // Reset to 'Active' after successful add
        onSuccess();
        onHide();
      } else {
        toast.error('Failed to add city');
      }
    } catch (err) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Add City</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group className="mb-3">
          <Form.Label>City Name</Form.Label>
          <Form.Control type="text" value={city_name} onChange={(e) => setName(e.target.value)} />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>City Code</Form.Label>
          <Form.Control type="text" value={city_Code} onChange={(e) => setCityCode(e.target.value)} />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>State</Form.Label>
          <select
            className="form-control"
            value={stateId ?? ''}
            onChange={(e) => {
              const value = e.target.value;
              setStateId(value === '' ? null : Number(value));
            }}
            disabled={loading}
          >
            <option value="">Select a state</option>
            {states  .filter((states) => String(states.status) === '0')  .map((state) => (
              <option key={state.stateid} value={state.stateid}>
                {state.state_name}
              </option>
            ))}
          </select>
        </Form.Group>
       
        <Form.Group className="mb-3">
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
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Check
            type="checkbox"
            label="Is Coastal City"
            checked={isCoastal}
            onChange={(e) => setIsCoastal(e.target.checked)}
          />
        </Form.Group>
        
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleAdd} disabled={loading}>
          {loading ? 'Adding...' : 'Add City'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
//3
// EditCityModal component
interface EditCityModalProps {
  show: boolean;
  onHide: () => void;
  mstcitymaster: CityItem | null;
  onSuccess: () => void;
  onUpdateSelectedCity: (mstcitymaster: CityItem) => void;
}

const EditCityModal: React.FC<EditCityModalProps> = ({ show, onHide, mstcitymaster, onSuccess, onUpdateSelectedCity }) => {
  const [city_name, setName] = useState('');
  const [city_Code, setCityCode] = useState('');
  const [stateId, setStateId] = useState<number | null>(null);
  const [isCoastal, setIsCoastal] = useState(false);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [states, setStates] = useState<StateItem[]>([]);
 

  // Fetch states when modal opens
  useEffect(() => {
    fetchStates(setStates, setStateId, undefined,);

  }, []);




  useEffect(() => {
    if (mstcitymaster) {
      setName(mstcitymaster.city_name);
      setCityCode(mstcitymaster.city_Code);
      setStateId(mstcitymaster.stateId ? Number(mstcitymaster.stateId) : null);
      setIsCoastal(mstcitymaster.isCoastal);
      setStateId(Number(mstcitymaster.stateId)); // ✅ FIXED LINE
      setStatus(String(mstcitymaster.status) === '0' ? 'Active' : 'Inactive');
      
    }
  }, [mstcitymaster]);
 const handleEdit = async () => {
    if (!city_name || !city_Code || !status || !mstcitymaster) {
      toast.error('All fields are required');
      return;
    }

    setLoading(true);
    try {
     const statusValue = status === 'Active' ? 0 : 1;
      const currentDate = new Date().toISOString(); // Timestamp: e.g., 2025-07-01T04:51:00.000Z
      const payload = {
        city_name,
        city_Code,
        isCoastal,
        stateId,
        status: statusValue,
        cityid: mstcitymaster.cityid, // Ensure cityid is included
        updated_by_id: '2', // Default to "0" (string)
        updated_date: currentDate,
       
      };
      console.log('Sending to backend:', payload); // Debug log
      const res = await fetch(`http://localhost:3001/api/cities/${mstcitymaster.cityid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success('City updated successfully');
        onSuccess();
        // Update the selected city in the parent component
        const updatedCity = {
          ...mstcitymaster,
          city_name,
          city_Code,
          status: statusValue,

          stateId: stateId !== null ? stateId.toString() : '',
          
          isCoastal: isCoastal ?? false, // <-- default to false if undefined
          updated_by_id: '2', // Default to "0" (string)
          updated_date: currentDate, // Use the current date
        };
        onUpdateSelectedCity(updatedCity);
        onHide();
      } else {
        toast.error('Failed to update city');
      }
    } catch (err) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };



  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Edit City</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group className="mb-3">
          <Form.Label>City Name</Form.Label>
          <Form.Control type="text" value={city_name} onChange={(e) => setName(e.target.value)} />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>City Code</Form.Label>
          <Form.Control type="text" value={ city_Code} onChange={(e) => setCityCode(e.target.value)} />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>State</Form.Label>
          <select
            className="form-control"
            value={stateId ?? ''}
            onChange={(e) => {
              const value = e.target.value;
              setStateId(value === '' ? null : Number(value));
            }}
            disabled={loading}
          >
            <option value="">Select a state</option>
            {states  .filter((states) => String(states.status) === '0')  .map((state) => (
              <option key={state.stateid} value={state.stateid}>
                {state.state_name}
              </option>
            ))}
          </select>
        </Form.Group>
       
         <Form.Label>Status Name</Form.Label>
          <select
              className="form-control"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
        <Form.Group className="mb-3">
          <Form.Check
            type="checkbox"
            label="Is Coastal City"
            checked={isCoastal}
            onChange={(e) => setIsCoastal(e.target.checked)}
          />
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleEdit} disabled={loading}>
          {loading ? 'Updating...' : 'Update City'}
        </Button>

      </Modal.Footer>
    </Modal>
  );
};


export default City;

