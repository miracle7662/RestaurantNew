import React, { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import { toast } from 'react-hot-toast';
import { Preloader } from '@/components/Misc/Preloader';
import { Button, Card, Stack,  Table, Modal } from 'react-bootstrap';
import TitleHelmet from '@/components/Common/TitleHelmet';
import { QRCodeCanvas } from 'qrcode.react';
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

// Sample menu data (updated with current date and time: 01:20 PM IST on June 19, 2025)
const initialMenuItems: MenuItem[] = [
  {
    id: '1',
    menuName: 'XYZ',
    shortName: 'XYZ',
    outletName: '!!HOTEL XYZ!!',
    isPosDefaultMenu: false,
    defaultDigitalMenu: true,
    isDigitalMenu: true,
    publishedAt: '19 Jun 2025 01:20 PM',
  },
  {
    id: '2',
    menuName: 'ABC',
    shortName: '',
    outletName: '!!HOTEL ABC!!',
    isPosDefaultMenu: false,
    defaultDigitalMenu: false,
    isDigitalMenu: true,
    publishedAt: '19 Jun 2025 01:20 PM',
  },
];

// AddMenuModal component
const AddMenuModal: React.FC<{
  show: boolean;
  onHide: () => void;
  onAddMenu: (menuData: Omit<MenuItem, 'id' | 'publishedAt'>) => void;
}> = ({ show, onHide, onAddMenu }) => {
  const [menuName, setMenuName] = useState<string>('');
  const [shortName, setShortName] = useState<string>('');
  const [outletName, setOutletName] = useState<string>('!!HOTEL ABC!!');
  const [isPosDefaultMenu, setIsPosDefaultMenu] = useState<boolean>(false);
  const [defaultDigitalMenu, setDefaultDigitalMenu] = useState<boolean>(false);
  const [isDigitalMenu, setIsDigitalMenu] = useState<boolean>(false);

  if (!show) return null;

  const handleAdd = () => {
    onAddMenu({
      menuName,
      shortName,
      outletName,
      isPosDefaultMenu,
      defaultDigitalMenu,
      isDigitalMenu,
    });
    setMenuName('');
    setShortName('');
    setOutletName('!!HOTEL ABC!!');
    setIsPosDefaultMenu(false);
    setDefaultDigitalMenu(false);
    setIsDigitalMenu(false);
    onHide();
  };

  return (
    <div className="modal" style={{ display: 'block', background: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      <div className="modal-content" style={{ background: 'white', padding: '20px', maxWidth: '500px', margin: '100px auto', borderRadius: '8px' }}>
        <h3>Add New Menu</h3>
        <input
          type="text"
          className="form-control mb-3"
          value={menuName}
          onChange={(e) => setMenuName(e.target.value)}
          placeholder="Menu Name (e.g., XYZ)"
        />
        <input
          type="text"
          className="form-control mb-3"
          value={shortName}
          onChange={(e) => setShortName(e.target.value)}
          placeholder="Short Name (e.g., XYZ)"
        />
        <input
          type="text"
          className="form-control mb-3"
          value={outletName}
          onChange={(e) => setOutletName(e.target.value)}
          placeholder="Outlet Name (e.g., !!XYZ!!)"
        />
        <div className="form-check mb-3">
          <input
            type="checkbox"
            className="form-check-input"
            checked={isPosDefaultMenu}
            onChange={(e) => setIsPosDefaultMenu(e.target.checked)}
          />
          <label className="form-check-label">Is POS Default Menu</label>
        </div>
        <div className="form-check mb-3">
          <input
            type="checkbox"
            className="form-check-input"
            checked={defaultDigitalMenu}
            onChange={(e) => setDefaultDigitalMenu(e.target.checked)}
          />
          <label className="form-check-label">Default Digital Menu</label>
        </div>
        <div className="form-check mb-3">
          <input
            type="checkbox"
            className="form-check-input"
            checked={isDigitalMenu}
            onChange={(e) => setIsDigitalMenu(e.target.checked)}
          />
          <label className="form-check-label">Is Digital Menu</label>
        </div>
        <div className="d-flex justify-content-end">
          <button className="btn btn-outline-secondary me-2" onClick={onHide}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleAdd}>
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

// EditMenuModal component
const EditMenuModal: React.FC<{
  show: boolean;
  onHide: () => void;
  menu: MenuItem | null;
  onEditMenu: (id: string, updatedData: Omit<MenuItem, 'id' | 'publishedAt'>) => void;
}> = ({ show, onHide, menu, onEditMenu }) => {
  const [menuName, setMenuName] = useState<string>(menu?.menuName || '');
  const [shortName, setShortName] = useState<string>(menu?.shortName || '');
  const [outletName, setOutletName] = useState<string>(menu?.outletName || '');
  const [isPosDefaultMenu, setIsPosDefaultMenu] = useState<boolean>(menu?.isPosDefaultMenu || false);
  const [defaultDigitalMenu, setDefaultDigitalMenu] = useState<boolean>(menu?.defaultDigitalMenu || false);
  const [isDigitalMenu, setIsDigitalMenu] = useState<boolean>(menu?.isDigitalMenu || false);

  useEffect(() => {
    if (menu) {
      setMenuName(menu.menuName);
      setShortName(menu.shortName);
      setOutletName(menu.outletName);
      setIsPosDefaultMenu(menu.isPosDefaultMenu);
      setDefaultDigitalMenu(menu.defaultDigitalMenu);
      setIsDigitalMenu(menu.isDigitalMenu);
    }
  }, [menu]);

  if (!show || !menu) return null;

  const handleEdit = () => {
    onEditMenu(menu.id, {
      menuName,
      shortName,
      outletName,
      isPosDefaultMenu,
      defaultDigitalMenu,
      isDigitalMenu,
    });
    onHide();
  };

  return (
    <div className="modal" style={{ display: 'block', background: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      <div className="modal-content" style={{ background: 'white', padding: '20px', maxWidth: '500px', margin: '100px auto', borderRadius: '8px' }}>
        <h3>Edit Menu</h3>
        <input
          type="text"
          className="form-control mb-3"
          value={menuName}
          onChange={(e) => setMenuName(e.target.value)}
          placeholder="Menu Name"
        />
        <input
          type="text"
          className="form-control mb-3"
          value={shortName}
          onChange={(e) => setShortName(e.target.value)}
          placeholder="Short Name"
        />
        <input
          type="text"
          className="form-control mb-3"
          value={outletName}
          onChange={(e) => setOutletName(e.target.value)}
          placeholder="Outlet Name"
        />
        <div className="form-check mb-3">
          <input
            type="checkbox"
            className="form-check-input"
            checked={isPosDefaultMenu}
            onChange={(e) => setIsPosDefaultMenu(e.target.checked)}
          />
          <label className="form-check-label">Is POS Default Menu</label>
        </div>
        <div className="form-check mb-3">
          <input
            type="checkbox"
            className="form-check-input"
            checked={defaultDigitalMenu}
            onChange={(e) => setDefaultDigitalMenu(e.target.checked)}
          />
          <label className="form-check-label">Default Digital Menu</label>
        </div>
        <div className="form-check mb-3">
          <input
            type="checkbox"
            className="form-check-input"
            checked={isDigitalMenu}
            onChange={(e) => setIsDigitalMenu(e.target.checked)}
          />
          <label className="form-check-label">Is Digital Menu</label>
        </div>
        <div className="d-flex justify-content-end">
          <button className="btn btn-outline-secondary me-2" onClick={onHide}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleEdit}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

const Outlet: React.FC = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenuItems);
  const [filteredMenus, setFilteredMenus] = useState<MenuItem[]>(menuItems);
  const [selectedMenu, setSelectedMenu] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showAddMenuModal, setShowAddMenuModal] = useState(false);
  const [showEditMenuModal, setShowEditMenuModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedOutlet, setSelectedOutlet] = useState<MenuItem | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsMenu, setSettingsMenu] = useState<MenuItem | null>(null);

  // Function to handle settings button click
  const handleSettingsClick = useCallback((menu: MenuItem) => {
    setSettingsMenu(menu);
    setShowSettingsModal(true);
  }, []);

  // Function to close settings modal
  const handleCloseSettingsModal = () => {
    setShowSettingsModal(false);
    setSettingsMenu(null);
  };

  // Function to handle QR code button click
  const handleQRCodeClick = useCallback((menu: MenuItem) => {
    setSelectedOutlet(menu);
    setShowQRModal(true);
  }, []);

  // Function to close QR code modal
  const handleCloseQRModal = () => {
    setShowQRModal(false);
    setSelectedOutlet(null);
  };

  // Function to copy QR code link
  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link).then(() => {
      toast.success('Link copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy link.');
    });
  };

 

  // Function to handle update in settings modal
  const handleUpdateSettings = () => {
    if (settingsMenu) {
      const updatedData = {
        menuName,
        shortName,
        outletName,
        isPosDefaultMenu,
        defaultDigitalMenu,
        isDigitalMenu,
      };
      handleEditMenu(settingsMenu.id, updatedData);
      handleCloseSettingsModal();
    }
  };

 // State for settings modal fields
  const [menuName, setMenuName] = useState('');
  const [shortName, setShortName] = useState('');
  const [outletName, setOutletName] = useState('');
  const [isPosDefaultMenu, setIsPosDefaultMenu] = useState(false);
  const [defaultDigitalMenu, setDefaultDigitalMenu] = useState(false);
  const [isDigitalMenu, setIsDigitalMenu] = useState(false);
  const [useMobileOrdering, setUseMobileOrdering] = useState(false);
  const [isONDC, setIsONDC] = useState(false);

 useEffect(() => {
    if (settingsMenu) {
      setMenuName(settingsMenu.menuName);
      setShortName(settingsMenu.shortName || '');
      setOutletName(settingsMenu.outletName);
      setIsPosDefaultMenu(settingsMenu.isPosDefaultMenu);
      setDefaultDigitalMenu(settingsMenu.defaultDigitalMenu);
      setIsDigitalMenu(settingsMenu.isDigitalMenu);
      setUseMobileOrdering(false); // Default value, adjust if needed
      setIsONDC(false); // Default value, adjust if needed
    }
  }, [settingsMenu]);

  // Define columns for react-table
  const columns = React.useMemo<ColumnDef<MenuItem>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'Sr No',
        size: 50,
        cell: (info) => <span>{info.getValue<string>()}</span>,
      },
      {
        accessorKey: 'menuName',
        header: 'Menu Name',
        size: 100,
        cell: (info) => <h6 className="mb-1">{info.getValue<string>()}</h6>,
      },
      {
        accessorKey: 'shortName',
        header: 'Short Name',
        size: 80,
        cell: (info) => <span>{info.getValue<string>()}</span>,
      },
      {
        accessorKey: 'outletName',
        header: 'Outlet Name',
        size: 100,
        cell: (info) => <span>{info.getValue<string>()}</span>,
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
              setFilteredMenus(updatedMenuItems);
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
          <span
            className={`badge bg-${info.getValue<boolean>() ? 'success' : 'danger'}`}
          >
            {info.getValue<boolean>() ? 'Yes' : 'No'}
          </span>
        ),
      },
      {
        accessorKey: 'isDigitalMenu',
        header: 'Is Digital Menu',
        size: 100,
        cell: (info) => (
          <span
            className={`badge bg-${info.getValue<boolean>() ? 'success' : 'danger'}`}
          >
            {info.getValue<boolean>() ? 'Yes' : 'No'}
          </span>
        ),
      },
      {
        accessorKey: 'publishedAt',
        header: 'Published At',
        size: 100,
        cell: (info) => (
          <span className="bg-white">
            Published <br /> {info.getValue<string>()}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Action',
        size: 120,
        cell: ({ row }) => (
          <div className="d-flex gap-1" style={{ justifyContent: 'center' }}>
            <button
              className="btn btn-sm btn-success"
              onClick={() => handleEditMenuClick(row.original)}
              style={{ padding: '4px 8px' }}
            >
              <i className="fi fi-rr-edit"></i>
            </button>
            <button
              className="btn btn-sm btn-primary"
              onClick={() => handleSettingsClick(row.original)}
              style={{ padding: '4px 8px' }}
            >
              <i className="fi fi-rr-settings"></i>
            </button>
            <button
              className="btn btn-sm btn-info"
              onClick={() => alert('Download clicked for menu: ' + row.original.menuName)}
              style={{ padding: '4px 8px' }}
            >
              <i className="fi fi-rr-download"></i>
            </button>
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => handleQRCodeClick(row.original)}
              style={{ padding: '4px 8px' }}
            >
              <i className="fi fi-rr-qrcode"></i>
            </button>
            <button
              className="btn btn-sm btn-danger"
              onClick={() => handleDeleteMenu(row.original)}
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
    data: filteredMenus,
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

  const handleAddMenu = useCallback((menuData: Omit<MenuItem, 'id' | 'publishedAt'>) => {
    const newMenu: MenuItem = {
      id: (menuItems.length + 1).toString(),
      menuName: menuData.menuName,
      shortName: menuData.shortName,
      outletName: menuData.outletName,
      isPosDefaultMenu: menuData.isPosDefaultMenu,
      defaultDigitalMenu: menuData.defaultDigitalMenu,
      isDigitalMenu: menuData.isDigitalMenu,
      publishedAt: new Date().toLocaleString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
    };

    const updatedMenuItems = [...menuItems, newMenu];
    setMenuItems(updatedMenuItems);
    setFilteredMenus(updatedMenuItems);

    toast.success('Menu added successfully');
  }, [menuItems]);

  const handleEditMenu = useCallback((id: string, updatedData: Omit<MenuItem, 'id' | 'publishedAt'>) => {
    const updatedMenuItems = menuItems.map((item) =>
      item.id === id
        ? {
            ...item,
            menuName: updatedData.menuName,
            shortName: updatedData.shortName,
            outletName: updatedData.outletName,
            isPosDefaultMenu: updatedData.isPosDefaultMenu,
            defaultDigitalMenu: updatedData.defaultDigitalMenu,
            isDigitalMenu: updatedData.isDigitalMenu,
          }
        : item
    );
    setMenuItems(updatedMenuItems);
    setFilteredMenus(updatedMenuItems);

    if (selectedMenu?.id === id) {
      setSelectedMenu({
        ...selectedMenu,
        menuName: updatedData.menuName,
        shortName: updatedData.shortName,
        outletName: updatedData.outletName,
        isPosDefaultMenu: updatedData.isPosDefaultMenu,
        defaultDigitalMenu: updatedData.defaultDigitalMenu,
        isDigitalMenu: updatedData.isDigitalMenu,
      });
    }

    toast.success('Menu updated successfully');
  }, [menuItems, selectedMenu]);

  const handleEditMenuClick = useCallback((menu: MenuItem) => {
    setSelectedMenu(menu);
    setShowEditMenuModal(true);
  }, []);

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
          setFilteredMenus(updatedMenus);

          if (updatedMenus.length === 0) {
            setFilteredMenus([]);
          }
          if (selectedMenu?.id === menu.id) {
            setSelectedMenu(null);
          }
          setLoading(false);
          toast.success('Menu deleted successfully');
        }, 1500);
      }
    });
  }, [menuItems, selectedMenu]);

  return (
    <>
      <TitleHelmet title="Menus" />
      <Card className="m-1">
        <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
          <h4 className="mb-0">Outlet Menu</h4>
          <div style={{ display: 'flex', gap: '4px' }}>
            <Button
              variant="success"
              className="me-1"
              onClick={() => setShowAddMenuModal(true)}
            >
              <i className="bi bi-plus"></i> Add Menu
            </Button>
            <Button
              variant="warning"
              className="me-1 text-dark"
            >
              <i className="bi bi-copy"></i> Clone Menu
            </Button>
            <Button variant="primary">
              <i className="bi bi-download"></i> Menu Format
            </Button>
          </div>
        </div>
        <div className="p-3">
          {loading ? (
            <Stack className="align-items-center justify-content-center flex-grow-1 h-100">
              <Preloader />
            </Stack>
          ) : (
            <>
              <div style={{ width: '100%', overflowX: 'hidden' }}>
                <Table
                  responsive
                  className="mb-0"
                  style={{ tableLayout: 'auto', width: '100%' }}
                >
                  <thead>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <th
                            key={header.id}
                            colSpan={header.colSpan}
                            style={{
                              width: header.column.columnDef.size,
                              whiteSpace: 'normal',
                              padding: '8px',
                              textAlign: 'center',
                            }}
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
                      <tr key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <td
                            key={cell.id}
                            style={{
                              whiteSpace: 'normal',
                              padding: '8px',
                              textAlign: 'center',
                            }}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
             
            </>
          )}
        </div>
      </Card>
      <AddMenuModal
        show={showAddMenuModal}
        onHide={() => setShowAddMenuModal(false)}
        onAddMenu={handleAddMenu}
      />
      <EditMenuModal
        show={showEditMenuModal}
        onHide={() => setShowEditMenuModal(false)}
        menu={selectedMenu}
        onEditMenu={handleEditMenu}
      />
      <Modal
        show={showQRModal}
        onHide={handleCloseQRModal}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Download QR Code</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '590px', overflowY: 'auto' }}>
          {selectedOutlet ? (
            <div className="text-center mb-4">
              <h5>QR Code for {selectedOutlet.outletName}</h5>
              <QRCodeCanvas
                value={`https://ordertmbill.com/outlet/${selectedOutlet.id}`}
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
                    value={`https://ordertmbill.com/outlet/${selectedOutlet.id}`}
                    readOnly
                  />
                  <Button
                    variant="dark"
                    onClick={() => handleCopyLink(`https://ordertmbill.com/outlet/${selectedOutlet.id}`)}
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
          ) : (
            <p>No outlet selected.</p>
          )}
        </Modal.Body>
      </Modal>
      {/* Settings Modal */}
     <Modal
  show={showSettingsModal}
  onHide={handleCloseSettingsModal}
  centered
>
  <Modal.Header closeButton>
    <Modal.Title>Update Menu: {settingsMenu?.menuName} [!!{settingsMenu?.outletName}!!]</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    {settingsMenu && (
      <div>
        <div className="mb-3">
          <label className="form-label">Menu Name: *</label>
          <input
            type="text"
            className="form-control"
            value={menuName}
            onChange={(e) => setMenuName(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Short Name:</label>
          <input
            type="text"
            className="form-control"
            value={shortName}
            onChange={(e) => setShortName(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Outlet Name: *</label>
          <select
            className="form-select"
            value={outletName}
            onChange={(e) => setOutletName(e.target.value)}
          >
            <option value="!!HOTEL XYZ!!">!!HOTEL XYZ!!</option>
            <option value="!!HOTEL ABC!!">!!HOTEL ABC!!</option>
            <option value="!!Hotel Shubharambh!!">!!Hotel Shubharambh!!</option>
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label" style={{ marginRight: '10px' }}>Is POS Default Menu:</label>
          <input
            type="checkbox"
            className="form-check-input"
            checked={isPosDefaultMenu}
            onChange={(e) => setIsPosDefaultMenu(e.target.checked)}
          />
        </div>
        <div className="mb-3">
          <label className="form-label" style={{ marginRight: '10px' }}>Default Digital Menu:</label>
          <input
            type="checkbox"
            className="form-check-input"
            checked={defaultDigitalMenu}
            onChange={(e) => setDefaultDigitalMenu(e.target.checked)}
          />
        </div>
        <div className="mb-3">
          <label className="form-label" style={{ marginRight: '10px' }}>Is Digital Menu:</label>
          <input
            type="checkbox"
            className="form-check-input"
            checked={isDigitalMenu}
            onChange={(e) => setIsDigitalMenu(e.target.checked)}
          />
        </div>
        <div className="mb-3">
          <label className="form-label" style={{ marginRight: '10px' }}>Use Same For Mobile Ordering Application:</label>
          <input
            type="checkbox"
            className="form-check-input"
            checked={useMobileOrdering}
            onChange={(e) => setUseMobileOrdering(e.target.checked)}
          />
        </div>
        <div className="mb-3">
          <label className="form-label" style={{ marginRight: '10px' }}>Is ONDC Menu:</label>
          <input
            type="checkbox"
            className="form-check-input"
            checked={isONDC}
            onChange={(e) => setIsONDC(e.target.checked)}
          />
        </div>
      </div>
    )}
  </Modal.Body>
  <Modal.Footer>
    <Button variant="success" onClick={handleUpdateSettings}>
      Update
    </Button>
    <Button variant="danger" onClick={handleCloseSettingsModal}>
      Close
    </Button>
  </Modal.Footer>
</Modal>
    </>
  );
};

export default Outlet;