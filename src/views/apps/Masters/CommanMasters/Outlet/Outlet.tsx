import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button, Modal, Form, Row, Col, Card, Stack, Pagination, Table } from 'react-bootstrap';
import { QRCodeCanvas } from 'qrcode.react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import AddOutlet from './AddOutlet';
import outletService, { OutletData } from '@/common/api/outlet';
import masterDataService, { Country, Timezone, TimeOption } from '@/common/api/masterData';
import { useAuthContext } from '@/common';
import { fetchBrands, fetchCountries } from '@/utils/commonfunction';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table';
import { Preloader } from '@/components/Misc/Preloader';
import Swal from 'sweetalert2';

// Debounce utility function
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

const OutletList: React.FC = () => {
  const { user } = useAuthContext();
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedOutlet, setSelectedOutlet] = useState<OutletData | null>(null);
  const [showAddOutlet, setShowAddOutlet] = useState(false);
  const navigate = useNavigate();

  const [outlets, setOutlets] = useState<OutletData[]>([]);
  const [loading, setLoading] = useState(true);
  const [brands, setBrands] = useState<Array<{ hotelid: number; hotel_name: string }>>([]);
  const [selectedBrand, setSelectedBrand] = useState<number | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<number | null>(null);
  const [timezones, setTimezones] = useState<Timezone[]>([]);
  const [selectedTimezone, setSelectedTimezone] = useState<number | null>(null);
  const [startTimes, setStartTimes] = useState<TimeOption[]>([]);
  const [selectedStartTime, setSelectedStartTime] = useState<string>('');
  const [closeTimes, setCloseTimes] = useState<TimeOption[]>([]);
  const [selectedCloseTime, setSelectedCloseTime] = useState<string>('');
  const [loadingTimezones, setLoadingTimezones] = useState<boolean>(false);
  const [countryId, setCountryId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Additional form fields state
  const [contactPhone, setContactPhone] = useState<string>('');
  const [notificationEmail, setNotificationEmail] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [zipCode, setZipCode] = useState<string>('');
  const [outletCode, setOutletCode] = useState<string>('');
  const [description, setDescription] = useState<string>('Miracle - ONLINE ORDERING PLATFORM');
  const [address, setAddress] = useState<string>('');
  const [gstNo, setGstNo] = useState<string>('');
  const [status, setStatus] = useState<boolean>(true);
  const [logoutPOS, setLogoutPOS] = useState<boolean>(true);
  const [passwordProtection, setPasswordProtection] = useState<boolean>(false);
  const [sendPaymentLink, setSendPaymentLink] = useState<boolean>(false);
  const [sendEbillWhatsApp, setSendEbillWhatsApp] = useState<boolean>(false);
  const [reduceInventory, setReduceInventory] = useState<boolean>(false);
  const [nextResetBillDays, setNextResetBillDays] = useState<string>('daily');
  const [nextResetKOTDays, setNextResetKOTDays] = useState<string>('daily');
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(6);

  // Fetch outlets from API
  useEffect(() => {
    console.log('Current user in OutletList:', user);
    fetchOutlets();
    fetchMasterData();

    if (user) {
      fetchBrands(user, setBrands);
    }
  }, [user]);

  const fetchMasterData = async () => {
    try {
      console.log('Fetching master data...');
      fetchCountries(setCountries, setCountryId, countryId || undefined);

      const startTimesResponse = await masterDataService.getStartTimes();
      if (startTimesResponse && startTimesResponse.data) {
        setStartTimes(startTimesResponse.data);
      }

      const closeTimesResponse = await masterDataService.getCloseTimes();
      if (closeTimesResponse && closeTimesResponse.data) {
        setCloseTimes(closeTimesResponse.data);
      }
    } catch (error) {
      console.error('Error fetching master data:', error);
      toast.error('Failed to fetch master data. Please check if the backend server is running.');
    }
  };

  const fetchTimezones = async (countryCode: string) => {
    try {
      setLoadingTimezones(true);
      console.log('Fetching timezones for country:', countryCode);
      const timezonesResponse = await masterDataService.getTimezones(countryCode);
      if (timezonesResponse && timezonesResponse.data) {
        console.log('Available timezones for', countryCode, ':', timezonesResponse.data);
        setTimezones(timezonesResponse.data);
        setSelectedTimezone(null);
      }
    } catch (error) {
      console.error('Error fetching timezones:', error);
      toast.error('Failed to fetch timezones for selected country.');
    } finally {
      setLoadingTimezones(false);
    }
  };

  const fetchOutlets = async () => {
    try {
      setLoading(true);
      console.log('Fetching outlets...');
      const params: any = {
        role_level: user?.role_level,
        hotelid: user?.hotelid,
      };

      if (user?.role_level === 'hotel_admin' && user?.userid != null) {
        params.created_by_id = user.userid;
      }

      console.log('Fetching outlets with params:', params);
      console.log('Current user details:', {
        userid: user?.userid,
        role_level: user?.role_level,
        hotelid: user?.hotelid,
      });

      const response = await outletService.getOutlets(params);
      console.log('Outlet response:', response);
      if (response && response.data) {
        const sortedOutlets = response.data.sort((a: OutletData, b: OutletData) => {
          return new Date(a.registered_at || '').getTime() - new Date(b.registered_at || '').getTime();
        });
        setOutlets(sortedOutlets);
      } else {
        console.error('Invalid response format:', response);
        toast.error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error fetching outlets:', error);
      toast.error('Failed to fetch outlets. Please check if the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const loadOutletDataIntoForm = (outlet: OutletData) => {
    setSelectedBrand(outlet.hotelid || null);
    setSelectedCountry(outlet.country ? Number(outlet.country) : null);
    setSelectedTimezone(null);
    setSelectedStartTime(outlet.start_day_time || '');
    setSelectedCloseTime(outlet.close_day_time || '');
    setContactPhone(outlet.contact_phone || '');
    setNotificationEmail(outlet.notification_email || '');
    setCity(outlet.city || '');
    setZipCode(outlet.zip_code || '');
    setOutletCode(outlet.outlet_code || '');
    setDescription(outlet.description || 'TMBILL - ONLINE ORDERING PLATFORM');
    setAddress(outlet.address || '');
    setGstNo(outlet.gst_no || '');
    setStatus(outlet.status === 0);
    setLogoutPOS(true);
    setPasswordProtection(false);
    setSendPaymentLink(false);
    setSendEbillWhatsApp(false);
    setReduceInventory(false);
    setNextResetBillDays(outlet.next_reset_bill_days || 'daily');
    setNextResetKOTDays(outlet.next_reset_kot_days || 'daily');
    setStartTime(0);
    setEndTime(6);

    if (outlet.country_code) {
      fetchTimezones(outlet.country_code).then(() => {
        const timezone = timezones.find(t => t.timezone_name === outlet.timezone);
        if (timezone) {
          setSelectedTimezone(timezone.timezone_id);
        }
      });
    }
  };

  const handleShowModal = (type: string, outlet?: OutletData) => {
    setModalType(type);
    setSelectedOutlet(outlet || null);

    if (outlet && type === 'Edit Item') {
      loadOutletDataIntoForm(outlet);
    } else {
      resetFormFields();
    }

    setShowModal(true);
  };

  const resetFormFields = () => {
    setSelectedBrand(null);
    setSelectedCountry(null);
    setSelectedTimezone(null);
    setSelectedStartTime('');
    setSelectedCloseTime('');
    setContactPhone('');
    setNotificationEmail('');
    setCity('');
    setZipCode('');
    setOutletCode('');
    setDescription('Miracle - ONLINE ORDERING PLATFORM');
    setAddress('');
    setGstNo('');
    setStatus(true);
    setLogoutPOS(true);
    setPasswordProtection(false);
    setSendPaymentLink(false);
    setSendEbillWhatsApp(false);
    setReduceInventory(false);
    setNextResetBillDays('daily');
    setNextResetKOTDays('daily');
    setStartTime(0);
    setEndTime(6);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalType('');
    setSelectedOutlet(null);
    resetFormFields();
  };

  const handleModifyClick = (outlet: OutletData) => {
    setSelectedOutlet(outlet);
    setShowAddOutlet(true);
  };

  const handleBackToOutletList = () => {
    setShowAddOutlet(false);
    setSelectedOutlet(null);
  };

  const handleDeleteOutlet = async (outletId: number) => {
    const res = await Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to recover this Outlet!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3E97FF',
      confirmButtonText: 'Yes, delete it!',
    });
    if (res.isConfirmed) {
      try {
        await outletService.deleteOutlet(outletId);
        toast.success('Outlet deleted successfully!');
        fetchOutlets();
      } catch (error) {
        console.error('Error deleting outlet:', error);
        toast.error('Failed to delete outlet');
      }
    }
  };

  const handleModalSubmit = async () => {
    if (!selectedBrand) {
      toast.error('Please select a brand');
      return;
    }
    if (!selectedCountry) {
      toast.error('Please select a country');
      return;
    }
    if (!selectedTimezone) {
      toast.error('Please select a timezone');
      return;
    }
    if (!selectedStartTime) {
      toast.error('Please select start day time');
      return;
    }
    if (!selectedCloseTime) {
      toast.error('Please select close day time');
      return;
    }

    const formData = new FormData(document.querySelector('form') as HTMLFormElement);
    const selectedCountryData = countries.find(c => c.countryid === selectedCountry);
    const selectedTimezoneData = timezones.find(t => t.timezone_id === selectedTimezone);

    const outletData: OutletData = {
      outlet_name: formData.get('outletName') as string,
      hotelid: selectedBrand,
      country: selectedCountry.toString(),
      country_code: selectedCountryData?.country_code || '',
      timezone: selectedTimezoneData?.timezone_name || '',
      timezone_offset: selectedTimezoneData?.timezone_offset || '',
      start_day_time: selectedStartTime,
      close_day_time: selectedCloseTime,
      contact_phone: contactPhone,
      notification_email: notificationEmail,
      city: city,
      zip_code: zipCode,
      outlet_code: outletCode,
      description: description,
      address: address,
      gst_no: gstNo,
      status: status ? 0 : 1,
      digital_order: 0,
      next_reset_bill_days: nextResetBillDays,
      next_reset_kot_days: nextResetKOTDays,
      phone: contactPhone,
      email: notificationEmail,
      website: '',
      logo: '',
      fssai_no: '',
      next_reset_bill_date: '',
      next_reset_kot_date: '',
      registered_at: new Date().toISOString(),
      created_by_id: user?.userid || 1,
    };

    try {
      if (modalType === 'Edit Item' && selectedOutlet) {
        await outletService.updateOutlet(selectedOutlet.outletid as number, outletData); toast.success('Outlet updated successfully!');
      } else if (modalType === 'Add Outlet') {
        await outletService.addOutlet(outletData);
        toast.success('Outlet added successfully!');
      } else if (modalType === 'Modify Outlet Setting' && selectedOutlet) {
        await outletService.updateOutlet(selectedOutlet.outletid as number, outletData); toast.success('Outlet settings updated successfully!');
      } else {
        toast.error('Invalid operation');
        return;
      }
      fetchOutlets();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving outlet:', error);
      toast.error(modalType === 'Edit Item' || modalType === 'Modify Outlet Setting' ? 'Failed to update outlet' : 'Failed to add outlet');
    }
  };

  // Define columns for react-table
  const columns = useMemo<ColumnDef<OutletData>[]>(() => [
    {
      id: 'srNo',
      header: 'Sr No',
      size: 50,
      cell: ({ row }) => <div style={{ textAlign: 'center' }}>{row.index + 1}</div>,
    },
    {
      accessorKey: 'logo',
      header: 'Logo',
      size: 100,
      cell: (info) => (
        <div style={{ textAlign: 'center' }}>
          <span className="badge bg-light text-dark">{info.getValue<string>() || 'N/A'}</span>
        </div>
      ),
    },
    {
      accessorKey: 'market_id',
      header: 'Market Id',
      size: 100,
      cell: (info) => <div style={{ textAlign: 'center' }}>{info.getValue<string>() || 'N/A'}</div>,
    },
    {
      accessorKey: 'outletid',
      header: 'Outlet Id',
      size: 100,
      cell: (info) => <div style={{ textAlign: 'center' }}>{info.getValue<number>()}</div>,
    },
    {
      accessorKey: 'outlet_name',
      header: 'Outlet Name',
      size: 150,
      cell: (info) => <div style={{ textAlign: 'center' }}>{info.getValue<string>()}</div>,
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      size: 120,
      cell: (info) => <div style={{ textAlign: 'center' }}>{info.getValue<string>() || 'N/A'}</div>,
    },
    {
      accessorKey: 'address',
      header: 'Location',
      size: 150,
      cell: (info) => <div style={{ textAlign: 'center' }}>{info.getValue<string>() || 'N/A'}</div>,
    },
    {
      accessorKey: 'brand_name',
      header: 'Brand Name',
      size: 150,
      cell: (info) => <div style={{ textAlign: 'center' }}>{info.getValue<string>() || 'N/A'}</div>,
    },
    {
      accessorKey: 'status',
      header: 'status',
      size: 100,
      cell: (info) => (
        <div style={{ textAlign: 'center' }}>
          {getStatusBadge(Number(info.getValue<number>()))}
        </div>
      ),
    },
    {
      accessorKey: 'digital_order',
      header: 'Digital Order',
      size: 100,
      cell: (info) => (
        <div style={{ textAlign: 'center' }}>{info.getValue<number>() ? 'Yes' : 'No'}</div>
      ),
    },
    {
      accessorKey: 'next_reset_bill_date',
      header: 'Next Reset Bill Date',
      size: 150,
      cell: (info) => <div style={{ textAlign: 'center' }}>{info.getValue<string>() || 'N/A'}</div>,
    },
    {
      accessorKey: 'registered_at',
      header: 'Registered At',
      size: 150,
      cell: (info) => <div style={{ textAlign: 'center' }}>{info.getValue<string>() || 'N/A'}</div>,
    },
    {
      id: 'actions',
      header: () => <div style={{ textAlign: 'center' }}>Action</div>,
      size: 200,
      cell: ({ row }) => (
        <div className="btn-group" role="group" style={{ justifyContent: 'center', display: 'flex' }}>
          <button
            className="btn btn-sm btn-success"
            title="Edit Item"
            onClick={() => handleShowModal('Edit Item', row.original)}
            style={{ marginRight: '5px' }}
          >
            <i className="fi fi-rr-edit"></i>
          </button>
          <button
            className="btn btn-sm btn-info"
            title="Modify Outlet Configuration"
            onClick={() => handleModifyClick(row.original)}
            style={{ marginRight: '5px' }}
          >
            <i className="fi fi-rr-document"></i>
          </button>
          <button
            className="btn btn-sm btn-success"
            title="Modify Outlet Setting"
            onClick={() => handleShowModal('Modify Outlet Setting', row.original)}
            style={{ marginRight: '5px' }}
          >
            <i className="fi fi-rr-settings"></i>
          </button>
          <button
            className="btn btn-sm btn-secondary"
            title="Download QR Code"
            onClick={() => handleShowModal('Download QR Code', row.original)}
            style={{ marginRight: '5px' }}
          >
            <i className="fi fi-rr-qrcode"></i>
          </button>
          <button
            className="btn btn-sm btn-danger"
            title="Delete Outlet"
            onClick={() => handleDeleteOutlet(row.original.outletid!)}
            style={{ marginRight: '5px' }}
          >
            <i className="fi fi-rr-trash"></i>
          </button>
        </div>
      ),
    },
  ], []);

  // Initialize react-table with pagination and filtering
  const table = useReactTable({
    data: outlets,
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

  return (
    <div className="m-1">
      <ToastContainer />
      {!showAddOutlet ? (
        <Card className="m-1">
          <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
            <h4 className="mb-0">Outlet List</h4>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div className="form-check form-check-inline">
                <input className="form-check-input" type="checkbox" id="showDeactivated" style={{ borderColor: '#333' }} />
                <label className="form-check-label" htmlFor="showDeactivated">
                  Show Deactivated
                </label>
              </div>
              <button
                className="btn btn-success"
                onClick={() => handleShowModal('Add Outlet')}
              >
                + Add Outlet
              </button>
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
                    <thead className="thead-light">
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
                        Showing {table.getRowModel().rows.length} of {outlets.length} entries
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
      ) : (
        <AddOutlet Outlet={selectedOutlet} onBack={handleBackToOutletList} />
      )}

      <Modal
        show={showModal}
        onHide={handleCloseModal}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>{modalType === 'Add Outlet' ? 'Add Outlet' : modalType === 'Edit Item' ? 'Edit Outlet' : modalType || 'Edit Outlet'}</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '590px', overflowY: 'auto' }}>
          {modalType === 'Download QR Code' && selectedOutlet ? (
            <div className="text-center mb-4">
              <h5>QR Code for {selectedOutlet.outlet_name}</h5>
              <QRCodeCanvas
                value={`https://ordertmbill.com/outlet/${selectedOutlet.outletid}`}
                size={150}
                level="H"
                includeMargin={true}
              />
              <p className="mt-2">Scan this QR code for outlet access.</p>
              <div className="mt-4">
                <div className="input-group mb-3">
                  <input
                    type="text"
                    className="form-control"
                    value={`https://ordertmbill.com/outlet/${selectedOutlet.outletid}`}
                    readOnly
                  />
                  <Button
                    variant="dark"
                  >
                    Copy Link
                  </Button>
                </div>
                <div className="d-flex justify-content-center gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      const canvas = document.querySelector('canvas');
                      if (canvas) {
                        const link = document.createElement('a');
                        link.download = 'qrcode-300x300.png';
                        link.href = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
                        link.click();
                      }
                    }}
                  >
                    <i className="bi bi-download me-2"></i>QR Code 300x300
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      const canvas = document.querySelector('canvas');
                      if (canvas) {
                        const link = document.createElement('a');
                        link.download = 'qrcode-1000x1000.png';
                        link.href = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
                        link.click();
                      }
                    }}
                  >
                    <i className="bi bi-download me-2"></i>QR Code 1000x1000
                  </Button>
                </div>
              </div>
            </div>
          ) : modalType === 'Modify Outlet Setting' && selectedOutlet ? (
            <div>
              <h6 className="mb-3">GENERAL SETTINGS :</h6>
              <Form>
                <Row className="mb-3">
                  <Col md={3}>
                    <Form.Group controlId="sendOrderNotification">
                      <Form.Label>Send Order Notification</Form.Label>
                      <Form.Select style={{ borderColor: '#ccc' }}>
                        <option>ALL</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="billNumberLength">
                      <Form.Label>Bill Number Length</Form.Label>
                      <div className="input-group">
                        <Button variant="outline-secondary">-</Button>
                        <Form.Control type="text" className="text-center" value="2" readOnly style={{ borderColor: '#ccc' }} />
                        <Button variant="outline-secondary">+</Button>
                      </div>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="nextResetOrderNumberDate">
                      <Form.Label>Next Reset Order Number Date</Form.Label>
                      <Form.Control type="text" value="26 MAY 2025 5:10 PM" readOnly style={{ borderColor: '#ccc' }} />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="nextResetOrderNumberDays">
                      <Form.Label>Next Reset Order Number (In Days)</Form.Label>
                      <Form.Select style={{ borderColor: '#ccc' }}>
                        <option>Reset Order Number Daily</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col md={3}>
                    <Form.Group controlId="decimalPoints">
                      <Form.Label>Select Decimal Points for Invoice Calculation and Menu Price Input</Form.Label>
                      <div className="input-group">
                        <Button variant="outline-secondary">-</Button>
                        <Form.Control style={{ borderColor: '#ccc' }} type="text" className="text-center" value="2" readOnly />
                        <Button variant="outline-secondary">+</Button>
                      </div>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="billRoundOff">
                      <Form.Label>Bill Round Off</Form.Label>
                      <Form.Check type="switch" defaultChecked />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="enableLoyalty">
                      <Form.Label>Enable Loyalty</Form.Label>
                      <Form.Check type="switch" />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="multiplePriceSetting">
                      <Form.Label>Multiple Price Setting</Form.Label>
                      <Form.Check type="switch" />
                    </Form.Group>
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col md={3}>
                    <Form.Group controlId="verifyPOS">
                      <Form.Label>Verify POS System Login with Date</Form.Label>
                      <Form.Check type="switch" />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="tableReservation">
                      <Form.Label>Table Reservation</Form.Label>
                      <Form.Check type="switch" />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="autoUpdatePOS">
                      <Form.Label>Auto Update POS</Form.Label>
                      <Form.Check type="switch" />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="sendReportVia">
                      <Form.Label>Do You Want To Send Report Via.</Form.Label>
                      <Form.Check type="checkbox" label="Email" />
                      <Form.Check type="checkbox" label="WhatsApp / Text" />
                    </Form.Group>
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col md={3}>
                    <Form.Group controlId="allowMultipleTax">
                      <Form.Label>Allow Multiple Tax</Form.Label>
                      <Form.Check type="switch" />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="enableCallCenter">
                      <Form.Label>Enable Call Center</Form.Label>
                      <Form.Check type="switch" />
                    </Form.Group>
                  </Col>
                </Row>
                <h6 className="mt-4 mb-3">Third Party Integration</h6>
                <Row className="mb-3">
                  <Col md={3}>
                    <Form.Group controlId="bharatpeIntegration">
                      <Form.Label>Bharatpe Integration</Form.Label>
                      <Form.Check type="switch" />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="phonepeIntegration">
                      <Form.Label>Phonepe Integration</Form.Label>
                      <Form.Check type="switch" />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="reelIntegration">
                      <Form.Label>Reelo Integration</Form.Label>
                      <Form.Check type="switch" />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="tallyIntegration">
                      <Form.Label>Tally Integration</Form.Label>
                      <Form.Check type="switch" />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="sunmiIntegration">
                      <Form.Label>Sunmi Integration</Form.Label>
                      <Form.Check type="switch" />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="zomatoPayIntegration">
                      <Form.Label>Zomato Pay Integration</Form.Label>
                      <Form.Check type="switch" />
                    </Form.Group>
                  </Col>
                </Row>
                <h6 className="mt-4 mb-3">Platform Channel Enable</h6>
                <Row className="mb-3">
                  <Col md={3}>
                    <Form.Group controlId="zomato">
                      <Form.Label>Zomato</Form.Label>
                      <Form.Check type="switch" />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="swiggy">
                      <Form.Label>Swiggy</Form.Label>
                      <Form.Check type="switch" />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="rafeeq">
                      <Form.Label>Rafeeq</Form.Label>
                      <Form.Check type="switch" />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="noonFood">
                      <Form.Label>Noon Food</Form.Label>
                      <Form.Check type="switch" />
                    </Form.Group>
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col md={3}>
                    <Form.Group controlId="magicpin">
                      <Form.Label>Magicpin</Form.Label>
                      <Form.Check type="switch" />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="dotpe">
                      <Form.Label>DotPe</Form.Label>
                      <Form.Check type="switch" />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="cultfit">
                      <Form.Label>cultfit</Form.Label>
                      <Form.Check type="switch" />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="ubereats">
                      <Form.Label>ubereats</Form.Label>
                      <Form.Check type="switch" />
                    </Form.Group>
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col md={3}>
                    <Form.Group controlId="scooty">
                      <Form.Label>scooty</Form.Label>
                      <Form.Check type="switch" />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="dunzo">
                      <Form.Label>Dunzo</Form.Label>
                      <Form.Check type="switch" />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="foodpanda">
                      <Form.Label>foodpanda</Form.Label>
                      <Form.Check type="switch" />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="amazon">
                      <Form.Label>amazon</Form.Label>
                      <Form.Check type="switch" />
                    </Form.Group>
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col md={3}>
                    <Form.Group controlId="talabat">
                      <Form.Label>Talabat</Form.Label>
                      <Form.Check type="switch" />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="deliveroo">
                      <Form.Label>Deliveroo</Form.Label>
                      <Form.Check type="switch" />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="careem">
                      <Form.Label>Careem</Form.Label>
                      <Form.Check type="switch" />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="jahez">
                      <Form.Label>Jahez</Form.Label>
                      <Form.Check type="switch" />
                    </Form.Group>
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col md={3}>
                    <Form.Group controlId="eazydiner">
                      <Form.Label>Eazydiner</Form.Label>
                      <Form.Check type="switch" />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="radyes">
                      <Form.Label>Radyes</Form.Label>
                      <Form.Check type="switch" />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="goshop">
                      <Form.Label>Goshop</Form.Label>
                      <Form.Check type="switch" />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="chatfood">
                      <Form.Label>chatfood</Form.Label>
                      <Form.Check type="switch" />
                    </Form.Group>
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col md={3}>
                    <Form.Group controlId="cutfit">
                      <Form.Label>cutfit</Form.Label>
                      <Form.Check type="switch" />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="jubeat">
                      <Form.Label>jubeat</Form.Label>
                      <Form.Check type="switch" />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="thrive">
                      <Form.Label>Thrive</Form.Label>
                      <Form.Check type="switch" />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="fidoo">
                      <Form.Label>fidoo</Form.Label>
                      <Form.Check type="switch" />
                    </Form.Group>
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col md={3}>
                    <Form.Group controlId="mrsool">
                      <Form.Label>mrsool</Form.Label>
                      <Form.Check type="switch" />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="swiggystore">
                      <Form.Label>swiggystore</Form.Label>
                      <Form.Check type="switch" />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="zomatormarket">
                      <Form.Label>zomatormarket</Form.Label>
                      <Form.Check type="switch" />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="hungerstation">
                      <Form.Label>Hungerstation</Form.Label>
                      <Form.Check type="switch" />
                    </Form.Group>
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col md={3}>
                    <Form.Group controlId="instashop">
                      <Form.Label>Instashop</Form.Label>
                      <Form.Check type="switch" />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="eteasy">
                      <Form.Label>Eteasy</Form.Label>
                      <Form.Check type="switch" />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="smiles">
                      <Form.Label>Smiles</Form.Label>
                      <Form.Check type="switch" />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="toyou">
                      <Form.Label>Toyou</Form.Label>
                      <Form.Check type="switch" />
                    </Form.Group>
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col md={3}>
                    <Form.Group controlId="dca">
                      <Form.Label>DCA</Form.Label>
                      <Form.Check type="switch" />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="ordable">
                      <Form.Label>Ordable</Form.Label>
                      <Form.Check type="switch" />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="beanz">
                      <Form.Label>BeanZ</Form.Label>
                      <Form.Check type="switch" />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="cari">
                      <Form.Label>Cari</Form.Label>
                      <Form.Check type="switch" />
                    </Form.Group>
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col md={3}>
                    <Form.Group controlId="theChefz">
                      <Form.Label>The Chefz</Form.Label>
                      <Form.Check type="switch" />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="keeta">
                      <Form.Label>Keeta</Form.Label>
                      <Form.Check type="switch" />
                    </Form.Group>
                  </Col>
                </Row>
                <h6 className="mt-4 mb-3">SMS/WhatsApp Setting :</h6>
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group controlId="notificationChannel">
                      <Form.Label>Notification Channel</Form.Label>
                      <Form.Select style={{ borderColor: '#ccc' }}>
                        <option>SMS</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
              </Form>
            </div>
          ) : (
            <Form>
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group controlId="selectBrand">
                    <Form.Label>
                      Select Brand <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Select
                      value={selectedBrand || ''}
                      onChange={(e) => setSelectedBrand(e.target.value ? Number(e.target.value) : null)}
                    >
                      <option value="">Select Brand</option>
                      {brands.map((brand) => (
                        <option key={brand.hotelid} value={brand.hotelid}>
                          {brand.hotel_name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="outletName">
                    <Form.Label>
                      Outlet Name <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="outletName"
                      placeholder="Enter Outlet Name"
                      defaultValue={modalType === 'Edit Item' ? selectedOutlet?.outlet_name || '' : ''}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group controlId="country">
                    <Form.Label>
                      Country <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Select
                      value={selectedCountry || ''}
                      onChange={(e) => {
                        const countryId = e.target.value ? Number(e.target.value) : null;
                        setSelectedCountry(countryId);
                        if (countryId) {
                          const selectedCountryData = countries.find(c => c.countryid === countryId);
                          if (selectedCountryData) {
                            fetchTimezones(selectedCountryData.country_code);
                          }
                        } else {
                          setTimezones([]);
                          setSelectedTimezone(null);
                        }
                      }}
                    >
                      <option value="">Select Country</option>
                      {countries.map((country) => (
                        <option key={country.countryid} value={country.countryid}>
                          {country.country_name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="timezone">
                    <Form.Label>
                      Timezone <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Select
                      value={selectedTimezone || ''}
                      onChange={(e) => setSelectedTimezone(e.target.value ? Number(e.target.value) : null)}
                      disabled={!selectedCountry || loadingTimezones}
                    >
                      <option value="">
                        {loadingTimezones ? 'Loading timezones...' :
                          selectedCountry ? 'Select timezone' : 'Please select a country first'}
                      </option>
                      {timezones.map((timezone) => (
                        <option key={timezone.timezone_id} value={timezone.timezone_id}>
                          {timezone.timezone_name} ({timezone.timezone_offset}) - {timezone.description}
                        </option>
                      ))}
                    </Form.Select>
                    {!selectedCountry && (
                      <small className="text-muted">
                        <i className="fi fi-rr-info me-1"></i>
                        Please select a country first to see available timezones
                      </small>
                    )}
                  </Form.Group>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group controlId="startDayTime">
                    <Form.Label>
                      Start Day Time <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Select
                      value={selectedStartTime}
                      onChange={(e) => setSelectedStartTime(e.target.value)}
                    >
                      <option value="">Select Time</option>
                      {startTimes.map((time) => (
                        <option key={time.time_id} value={time.time_value}>
                          {time.time_label}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="closeDayTime">
                    <Form.Label>
                      Close Day Time <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Select
                      value={selectedCloseTime}
                      onChange={(e) => setSelectedCloseTime(e.target.value)}
                    >
                      <option value="">Select Time</option>
                      {closeTimes.map((time) => (
                        <option key={time.time_id} value={time.time_value}>
                          {time.time_label}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group controlId="nextResetBillDate">
                    <Form.Label>Next Reset Bill Date</Form.Label>
                    <Form.Control type="text" value="26 MAY 2025 5:30 AM" readOnly />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="nextResetBillDays">
                    <Form.Label>Next Reset Bill (In Days)</Form.Label>
                    <Form.Select
                      value={nextResetBillDays}
                      onChange={(e) => setNextResetBillDays(e.target.value)}
                    >
                      <option value="daily">Reset Bill Number Daily</option>
                      <option value="weekly">Reset Bill Number Weekly</option>
                      <option value="monthly">Reset Bill Number Monthly</option>
                      <option value="yearly">Reset Bill Number Yearly</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group controlId="nextResetKOTDate">
                    <Form.Label>Next Reset KOT Date</Form.Label>
                    <Form.Control type="text" value="26 MAY 2025 5:30 AM" readOnly />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="nextResetKOTDays">
                    <Form.Label>Next Reset KOT (In Days)</Form.Label>
                    <Form.Select
                      value={nextResetKOTDays}
                      onChange={(e) => setNextResetKOTDays(e.target.value)}
                    >
                      <option value="daily">Reset KOT Number Daily</option>
                      <option value="weekly">Reset KOT Number Weekly</option>
                      <option value="monthly">Reset KOT Number Monthly</option>
                      <option value="yearly">Reset KOT Number Yearly</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group controlId="contactPhone">
                    <Form.Label>Contact Phone</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter Contact Phone"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="notificationEmail">
                    <Form.Label>Notification Email</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="Enter Notification Email"
                      value={notificationEmail}
                      onChange={(e) => setNotificationEmail(e.target.value)}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group controlId="city">
                    <Form.Label>City</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter City"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="zipCode">
                    <Form.Label>Zip Code</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter Zip Codes"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group controlId="outletCode">
                    <Form.Label>Outlet Code</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter Outlet Code"
                      value={outletCode}
                      onChange={(e) => setOutletCode(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="tenantId">
                    <Form.Label>Tenant Id</Form.Label>
                    <Form.Control type="text" value="0" readOnly />
                  </Form.Group>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={12}>
                  <Form.Group controlId="description">
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      placeholder="TMBILL - ONLINE ORDERING PLATFORM"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={12}>
                  <Form.Group controlId="address">
                    <Form.Label>Address</Form.Label>
                    <Form.Control
                      as="textarea"
                      placeholder="Enter Address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={12}>
                  <Form.Group controlId="logo">
                    <Form.Label>Logo</Form.Label>
                    <div className="border p-3 text-center position-relative">
                      <p>Choose a File or Drop It Here</p>
                      <Button variant="outline-secondary" className="mt-2">
                        Browse
                      </Button>
                    </div>
                  </Form.Group>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group controlId="logoutPOS">
                    <Form.Label>Do you want to logout POS when application is closed?</Form.Label>
                    <Form.Check
                      type="switch"
                      label="Enabled"
                      checked={logoutPOS}
                      onChange={(e) => setLogoutPOS(e.target.checked)}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="passwordProtection">
                    <Form.Label>Enabled Password Protection</Form.Label>
                    <Form.Check
                      type="switch"
                      checked={passwordProtection}
                      onChange={(e) => setPasswordProtection(e.target.checked)}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group controlId="sendPaymentLink">
                    <Form.Label>Send Payment Link In Ebill On SMS & WhatsApp Only</Form.Label>
                    <Form.Check
                      type="switch"
                      checked={sendPaymentLink}
                      onChange={(e) => setSendPaymentLink(e.target.checked)}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="sendEbillWhatsApp">
                    <Form.Label>Send Ebill And Payment Link On WhatsApp</Form.Label>
                    <Form.Check
                      type="switch"
                      checked={sendEbillWhatsApp}
                      onChange={(e) => setSendEbillWhatsApp(e.target.checked)}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group controlId="gstNo">
                    <Form.Label>TRN / GST No.</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter GST Number"
                      value={gstNo}
                      onChange={(e) => setGstNo(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="copyStoreSettings">
                    <Form.Label>Copy Store Settings</Form.Label>
                    <Form.Select>
                      <option>Search</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group controlId="status">
                    <Form.Label>Status</Form.Label>
                    <Form.Check
                      type="switch"
                      label={status ? 'Active' : 'Inactive'} // Display "Active" when checked, "Inactive" when unchecked
                      checked={status} // True for Active (status = 0), false for Inactive (status = 1)
                      onChange={(e) => setStatus(e.target.checked)} // Sets status to true (Active) or false (Inactive)
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="addCustomQRCode">
                    <Form.Label>Add Custom QR Code</Form.Label>
                    <Button variant="dark">Add QR Link</Button>
                  </Form.Group>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={12}>
                  <Form.Label>Set end time to count sales in previous day after midnight</Form.Label>
                  <Row>
                    <Col md={6}>
                      <Form.Group controlId="startTime">
                        <Form.Label>Start Time</Form.Label>
                        <div className="input-group">
                          <Button
                            variant="outline-secondary"
                            onClick={() => setStartTime(Math.max(0, startTime - 1))}
                          >
                            -
                          </Button>
                          <Form.Control
                            type="text"
                            className="text-center"
                            value={startTime}
                            readOnly
                          />
                          <Button
                            variant="outline-secondary"
                            onClick={() => setStartTime(Math.min(23, startTime + 1))}
                          >
                            +
                          </Button>
                        </div>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group controlId="endTime">
                        <Form.Label>End Time</Form.Label>
                        <div className="input-group">
                          <Button
                            variant="outline-secondary"
                            onClick={() => setEndTime(Math.max(0, endTime - 1))}
                          >
                            -
                          </Button>
                          <Form.Control
                            type="text"
                            className="text-center"
                            value={endTime}
                            readOnly
                          />
                          <Button
                            variant="outline-secondary"
                            onClick={() => setEndTime(Math.min(23, endTime + 1))}
                          >
                            +
                          </Button>
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group controlId="inventoryDetails">
                    <Form.Label>Back Office Inventory Details</Form.Label>
                    <Form.Select>
                      <option>Select Warehouse</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="reduceInventory">
                    <Form.Label>Do you want to reduce inventory for Atlantic POS?</Form.Label>
                    <Form.Check
                      type="switch"
                      checked={reduceInventory}
                      onChange={(e) => setReduceInventory(e.target.checked)}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="danger" onClick={handleCloseModal}>
            Close
          </Button>
          <Button variant="success" onClick={handleModalSubmit}>
            {modalType === 'Add Outlet' ? 'Create' : 'Update'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default OutletList;