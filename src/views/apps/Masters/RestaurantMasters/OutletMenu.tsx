import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Swal from 'sweetalert2';
import { toast } from 'react-hot-toast';
import { Preloader } from '@/components/Misc/Preloader';
import { Button, Card, Stack, Pagination, Form } from 'react-bootstrap';
import { QRCodeCanvas } from 'qrcode.react';
import TitleHelmet from '@/components/Common/TitleHelmet';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table';

// Define menu data type
interface MenuItem {
  id: string;
  menuName: string;
  shortName: string;
  outletName: string;
  isPosDefaultMenu: boolean;
  defaultDigitalMenu: boolean;
  isDigitalMenu: boolean;
  publishedAt: string;
}

// Sample menu data (updated with current date and time: 05:01 PM IST on August 15, 2025)
const initialMenuItems: MenuItem[] = [
  {
    id: '1',
    menuName: 'XYZ',
    shortName: 'XYZ',
    outletName: '!!HOTEL XYZ!!',
    isPosDefaultMenu: false,
    defaultDigitalMenu: true,
    isDigitalMenu: true,
    publishedAt: '15 Aug 2025 05:01 PM',
  },
  {
    id: '2',
    menuName: 'ABC',
    shortName: '',
    outletName: '!!HOTEL ABC!!',
    isPosDefaultMenu: false,
    defaultDigitalMenu: false,
    isDigitalMenu: true,
    publishedAt: '15 Aug 2025 05:01 PM',
  },
];

// Debounce utility function
const debounce = (func: (...args: any[]) => void, wait: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// MenuModal component
interface MenuModalProps {
  show: boolean;
  onHide: () => void;
  menu: MenuItem | null;
  onSuccess: (menuData: MenuItem) => void;
  isEditMode: boolean;
  isQRMode: boolean;
}

const MenuModal: React.FC<MenuModalProps> = ({ show, onHide, menu, onSuccess, isEditMode, isQRMode }) => {
  const [menuName, setMenuName] = useState('');
  const [shortName, setShortName] = useState('');
  const [outletName, setOutletName] = useState('!!HOTEL ABC!!');
  const [isPosDefaultMenu, setIsPosDefaultMenu] = useState(false);
  const [defaultDigitalMenu, setDefaultDigitalMenu] = useState(false);
  const [isDigitalMenu, setIsDigitalMenu] = useState(false);
  const [useMobileOrdering, setUseMobileOrdering] = useState(false);
  const [isONDC, setIsONDC] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (menu && (isEditMode || isQRMode)) {
      setMenuName(menu.menuName);
      setShortName(menu.shortName || '');
      setOutletName(menu.outletName);
      setIsPosDefaultMenu(menu.isPosDefaultMenu);
      setDefaultDigitalMenu(menu.defaultDigitalMenu);
      setIsDigitalMenu(menu.isDigitalMenu);
      setUseMobileOrdering(false);
      setIsONDC(false);
    } else {
      setMenuName('');
      setShortName('');
      setOutletName('!!HOTEL ABC!!');
      setIsPosDefaultMenu(false);
      setDefaultDigitalMenu(false);
      setIsDigitalMenu(false);
      setUseMobileOrdering(false);
      setIsONDC(false);
    }
  }, [menu, isEditMode, isQRMode]);

  const handleSubmit = async () => {
    if (!menuName) {
      toast.error('Please enter menu name');
      return;
    }
    if (!outletName) {
      toast.error('Please select outlet name');
      return;
    }

    setLoading(true);
    try {
      const menuData: MenuItem = {
        id: isEditMode ? menu!.id : (Math.max(...initialMenuItems.map(m => parseInt(m.id))) + 1).toString(),
        menuName,
        shortName,
        outletName,
        isPosDefaultMenu,
        defaultDigitalMenu,
        isDigitalMenu,
        publishedAt: isEditMode ? menu!.publishedAt : new Date().toLocaleString('en-US', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }),
      };

      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
      onSuccess(menuData);
      toast.success(`Menu ${isEditMode ? 'updated' : 'added'} successfully`);
      onHide();
    } catch {
      toast.error(`Failed to ${isEditMode ? 'update' : 'add'} menu`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link).then(() => {
      toast.success('Link copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy link.');
    });
  };

  if (!show) return null;

  if (isQRMode && menu) {
    const qrValue = `https://ordertmbill.com/outlet/${menu.id}`;
    return (
      <div className="modal" style={{ display: 'block', background: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
        <div className="modal-content" style={{ background: 'white', padding: '20px', maxWidth: '500px', margin: '100px auto', borderRadius: '8px' }}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">QR Code for {menu.outletName}</h5>
            <button className="btn-close" onClick={onHide}></button>
          </div>
          <div className="text-center mb-4">
            <QRCodeCanvas value={qrValue} size={150} level="H" includeMargin={true} />
            <p className="mt-2">Scan this QR code for outlet access.</p>
            <div className="input-group mb-3">
              <input type="text" className="form-control" value={qrValue} readOnly />
              <button className="btn btn-dark" onClick={() => handleCopyLink(qrValue)}>
                Copy Link
              </button>
            </div>
            <div className="d-flex justify-content-center gap-3">
              <button
                className="btn btn-secondary"
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
              </button>
              <button
                className="btn btn-secondary"
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
              </button>
            </div>
          </div>
          <div className="d-flex justify-content-end">
            <button className="btn btn-danger" onClick={onHide}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal" style={{ display: 'block', background: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      <div className="modal-content" style={{ background: 'white', padding: '20px', maxWidth: '600px', margin: '100px auto', borderRadius: '8px', maxHeight: '80vh', overflowY: 'auto' }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">{isEditMode ? 'Edit Menu' : 'Add Menu'}</h5>
          <button className="btn-close" onClick={onHide}></button>
        </div>
        <div className="row mb-3">
          <div className="col-md-6">
            <label className="form-label">Menu Name <span style={{ color: 'red' }}>*</span></label>
            <input
              type="text"
              className="form-control"
              value={menuName}
              onChange={(e) => setMenuName(e.target.value)}
              placeholder="Enter Menu Name (e.g., XYZ)"
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Short Name</label>
            <input
              type="text"
              className="form-control"
              value={shortName}
              onChange={(e) => setShortName(e.target.value)}
              placeholder="Enter Short Name (e.g., XYZ)"
            />
          </div>
        </div>
        <div className="row mb-3">
          <div className="col-md-12">
            <label className="form-label">Outlet Name <span style={{ color: 'red' }}>*</span></label>
            <select
              className="form-control"
              value={outletName}
              onChange={(e) => setOutletName(e.target.value)}
            >
              <option value="">Select Outlet</option>
              <option value="!!HOTEL XYZ!!">!!HOTEL XYZ!!</option>
              <option value="!!HOTEL ABC!!">!!HOTEL ABC!!</option>
              <option value="!!Hotel Shubharambh!!">!!Hotel Shubharambh!!</option>
            </select>
          </div>
        </div>
        <div className="row mb-3">
          <div className="col-md-6">
            <label className="form-label">Is POS Default Menu</label>
            <input
              type="checkbox"
              className="form-check-input"
              checked={isPosDefaultMenu}
              onChange={(e) => setIsPosDefaultMenu(e.target.checked)}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Default Digital Menu</label>
            <input
              type="checkbox"
              className="form-check-input"
              checked={defaultDigitalMenu}
              onChange={(e) => setDefaultDigitalMenu(e.target.checked)}
            />
          </div>
        </div>
        <div className="row mb-3">
          <div className="col-md-6">
            <label className="form-label">Is Digital Menu</label>
            <input
              type="checkbox"
              className="form-check-input"
              checked={isDigitalMenu}
              onChange={(e) => setIsDigitalMenu(e.target.checked)}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Use Same For Mobile Ordering</label>
            <input
              type="checkbox"
              className="form-check-input"
              checked={useMobileOrdering}
              onChange={(e) => setUseMobileOrdering(e.target.checked)}
            />
          </div>
        </div>
        <div className="row mb-3">
          <div className="col-md-6">
            <label className="form-label">Is ONDC Menu</label>
            <input
              type="checkbox"
              className="form-check-input"
              checked={isONDC}
              onChange={(e) => setIsONDC(e.target.checked)}
            />
          </div>
        </div>
        <div className="d-flex justify-content-end mt-4">
          <button className="btn btn-success me-2" onClick={handleSubmit} disabled={loading}>
            {loading ? (isEditMode ? 'Updating...' : 'Adding...') : (isEditMode ? 'Save' : 'Add')}
          </button>
          <button className="btn btn-danger" onClick={onHide} disabled={loading}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Outlet Component
const Outlet: React.FC = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenuItems);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'Add' | 'Edit' | 'QR'>('Add');
  const [selectedMenu, setSelectedMenu] = useState<MenuItem | null>(null);

  // Define columns for react-table
  const columns = useMemo<ColumnDef<MenuItem>[]>(
    () => [
      {
        id: 'srNo',
        header: 'Sr No',
        size: 50,
        cell: ({ row }) => <div style={{ textAlign: 'center' }}>{row.index + 1}</div>,
      },
      {
        accessorKey: 'menuName',
        header: 'Menu Name',
        size: 150,
        cell: (info) => <h6 className="mb-1" style={{ textAlign: 'center' }}>{info.getValue<string>()}</h6>,
      },
      {
        accessorKey: 'shortName',
        header: 'Short Name',
        size: 100,
        cell: (info) => <div style={{ textAlign: 'center' }}>{info.getValue<string>() || 'N/A'}</div>,
      },
      {
        accessorKey: 'outletName',
        header: 'Outlet Name',
        size: 150,
        cell: (info) => <div style={{ textAlign: 'center' }}>{info.getValue<string>()}</div>,
      },
      {
        accessorKey: 'isPosDefaultMenu',
        header: 'Is POS Default Menu',
        size: 130,
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.original.isPosDefaultMenu}
            onChange={() => {
              const updatedMenuItems = menuItems.map((item) =>
                item.id === row.original.id
                  ? { ...item, isPosDefaultMenu: !item.isPosDefaultMenu }
                  : item
              );
              setMenuItems(updatedMenuItems);
            }}
            style={{
              appearance: 'none',
              width: '20px',
              height: '20px',
              border: '2px solid #ccc',
              borderRadius: '4px',
              backgroundColor: row.original.isPosDefaultMenu ? '#28a745' : '#fff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.backgroundColor = row.original.isPosDefaultMenu ? '#fff' : '#28a745';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.backgroundColor = !row.original.isPosDefaultMenu ? '#28a745' : '#fff';
            }}
          />
        ),
      },
      {
        accessorKey: 'defaultDigitalMenu',
        header: 'Default Digital Menu',
        size: 130,
        cell: (info) => (
          <div style={{ textAlign: 'center' }}>
            <span className={`badge bg-${info.getValue<boolean>() ? 'success' : 'danger'}`}>
              {info.getValue<boolean>() ? 'Yes' : 'No'}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'isDigitalMenu',
        header: 'Is Digital Menu',
        size: 100,
        cell: (info) => (
          <div style={{ textAlign: 'center' }}>
            <span className={`badge bg-${info.getValue<boolean>() ? 'success' : 'danger'}`}>
              {info.getValue<boolean>() ? 'Yes' : 'No'}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'publishedAt',
        header: 'Published At',
        size: 150,
        cell: (info) => (
          <div style={{ textAlign: 'center' }}>
            <span className="bg-white">Published <br /> {info.getValue<string>()}</span>
          </div>
        ),
      },
      {
        id: 'actions',
        header: () => <div style={{ textAlign: 'center' }}>Action</div>,
        size: 200,
        cell: ({ row }) => (
          <div className="d-flex gap-2 justify-content-center">
            <button
              className="btn btn-sm btn-success"
              onClick={() => handleEditClick(row.original, 'Edit')}
              title="Edit Menu"
            >
              <i className="fi fi-rr-edit"></i>
            </button>
            <button
              className="btn btn-sm btn-primary"
              onClick={() => handleEditClick(row.original, 'Edit')}
              title="Settings"
            >
              <i className="fi fi-rr-settings"></i>
            </button>
            <button
              className="btn btn-sm btn-info"
              onClick={() => alert('Download clicked for menu: ' + row.original.menuName)}
              title="Download"
            >
              <i className="fi fi-rr-download"></i>
            </button>
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => handleEditClick(row.original, 'QR')}
              title="QR Code"
            >
              <i className="fi fi-rr-qrcode"></i>
            </button>
            <button
              className="btn btn-sm btn-danger"
              onClick={() => handleDeleteMenu(row.original)}
              title="Delete Menu"
            >
              <i className="fi fi-rr-trash"></i>
            </button>
          </div>
        ),
      },
    ],
    []
  );

  // Initialize react-table with pagination and filtering
  const table = useReactTable({
    data: menuItems,
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

  const handleAddMenu = (menuData: MenuItem) => {
    setMenuItems(prev => [...prev, menuData]);
  };

  const handleEditMenu = (menuData: MenuItem) => {
    setMenuItems(prev =>
      prev.map(item => (item.id === menuData.id ? menuData : item))
    );
    if (selectedMenu?.id === menuData.id) {
      setSelectedMenu(menuData);
    }
  };

  const handleEditClick = (menu: MenuItem, type: 'Add' | 'Edit' | 'QR') => {
    setSelectedMenu(menu);
    setModalType(type);
    setShowModal(true);
  };

  const handleDeleteMenu = useCallback((menu: MenuItem) => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to recover this menu!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3E97FF',
      confirmButtonText: 'Yes, delete it!',
    }).then((result) => {
      if (result.isConfirmed) {
        setLoading(true);
        setTimeout(() => {
          const updatedMenus = menuItems.filter((item) => item.id !== menu.id);
          setMenuItems(updatedMenus);
          if (selectedMenu?.id === menu.id) {
            setSelectedMenu(null);
          }
          setLoading(false);
          toast.success('Menu deleted successfully');
        }, 1500);
      }
    });
  }, [menuItems, selectedMenu]);

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
    <>
      <TitleHelmet title="Menus" />
      <style>
        {`
          .apps-card,
          .apps-sidebar-left,
          .apps-container {
            transition: all 0.3s ease-in-out;
          }
          .table-container {
            max-height: calc(100vh - 200px); /* Adjusted for header and search bar */
            overflow-y: auto;
          }
        `}
      </style>
      <Card className="m-1">
        <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
          <h4 className="mb-0">Outlet Menu</h4>
          <div style={{ display: 'flex', gap: '4px' }}>
            <Button
              variant="success"
              onClick={() => {
                setModalType('Add');
                setSelectedMenu(null);
                setShowModal(true);
              }}
            >
              <i className="bi bi-plus"></i> Add Menu
            </Button>
            <Button
              variant="warning"
              className="text-dark"
              onClick={() => alert('Clone Menu clicked')}
            >
              <i className="bi bi-copy"></i> Clone Menu
            </Button>
            <Button
              variant="primary"
              onClick={() => alert('Download Menu Format clicked')}
            >
              <i className="bi bi-download"></i> Menu Format
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
          <div className="table-container" style={{ overflowY: 'auto' }}>
            {loading ? (
              <Stack className="align-items-center justify-content-center flex-grow-1 h-100">
                <Preloader />
              </Stack>
            ) : (
              <>
                <table className="table table-responsive table-hover mb-4">
                  <thead>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <th key={header.id} style={{ width: header.column.columnDef.size, textAlign: 'center' }}>
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
                          <td key={cell.id} style={{ textAlign: 'center' }}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                      Showing {table.getRowModel().rows.length} of {menuItems.length} entries
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
      <MenuModal
        show={showModal}
        onHide={() => {
          setShowModal(false);
          setSelectedMenu(null);
          setModalType('Add');
        }}
        menu={selectedMenu}
        onSuccess={(menuData) => {
          if (modalType === 'Add') {
            handleAddMenu(menuData);
          } else if (modalType === 'Edit') {
            handleEditMenu(menuData);
          }
        }}
        isEditMode={modalType === 'Edit'}
        isQRMode={modalType === 'QR'}
      />
    </>
  );
};

export default Outlet;