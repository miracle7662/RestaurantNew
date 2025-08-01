import React, { useState, useEffect, useMemo, useCallback } from 'react'
import Swal from 'sweetalert2'
import { toast } from 'react-hot-toast'
import { Preloader } from '@/components/Misc/Preloader'
import { Button, Card, Stack, Pagination, Table, Modal, Form } from 'react-bootstrap'
import {
  ContactSearchBar,

} from '@/components/Apps/Contact'
import TitleHelmet from '@/components/Common/TitleHelmet'
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table'
import {
  fetchKitchenCategory,
  KitchenCategoryItem,

} from '../../../../utils/commonfunction';


// Define state data type
interface ItemGroupItem {
  item_groupid: string;
  itemgroupname: string;
  code: string;
  kitchencategoryid: string;
  status: string | number // Use string or number based on your backend response
  created_by_id: string
  created_date: string
  updated_by_id: string
  updated_date: string
  hotelid: string
  marketid: string
}



//1
// Debounce utility function
const debounce = (func: (...args: any[]) => void, wait: number) => {
  let timeout: NodeJS.Timeout
  return (...args: any[]) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

const ItemGroup: React.FC = () => {
  const [ItemGroupItem, setItemGroupItem] = useState<ItemGroupItem[]>([])
  const [selectedCategory, ] = useState<string>('alls')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [filteredItemGroup, setFilteredItemGroup] = useState<ItemGroupItem[]>([])
  const [selectedItemGroup, setSelectedItemGroup] = useState<ItemGroupItem | null>(null)
  const [selectedItemGroupIndex, setSelectedItemGroupIndex] = useState<number>(-1)
  const [loading] = useState<boolean>(false)
  const [showAddItemGroupModal, setShowAddItemGroupModal] = useState(false)
  const [ShowEditItemGroupModal, setShowEditItemGroupModal] = useState(false)
  const [sidebarLeftToggle, setSidebarLeftToggle] = useState<boolean>(false)
  const [sidebarMiniToggle, setSidebarMiniToggle] = useState<boolean>(false)
  const [containerToggle, setContainerToggle] = useState<boolean>(false)

  const fetchItemGroup = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/ItemGroup');
      const data = await res.json();
      setItemGroupItem(data);
      setFilteredItemGroup(data);
    } catch (err) {
      toast.error('Failed to fetch ItemGroup');
    }
  };

  useEffect(() => {
    fetchItemGroup();
  }, []);

  // Define columns for react-table with explicit widths
  const columns = React.useMemo<ColumnDef<ItemGroupItem>[]>(
    () => [
      {
        id: 'srNo',
        header: 'Sr No',
        size: 10,
        cell: ({ row }) => <span>{row.index + 1}</span>,
      },
      
      {
        accessorKey: 'itemgroupname',
        header: 'item groupname',
        size: 10,
        cell: (info) => <h6 className="mb-1">{info.getValue<string>()}</h6>,
      },

      {
        accessorKey: 'code',
        header: 'code',
        size: 10,
        cell: (info) => <h6 className="mb-1">{info.getValue<string>()}</h6>,
      },

      // {
      //   accessorKey: 'itemgroupname',
      //   header: 'itemgroupname',
      //   size: 10,
      //   cell: (info) => ( <div style={{ textAlign: 'center' }}> {info.getValue<string>()}</div>
      //   ),
      // },
      // {
      //   accessorKey: 'code',
      //   header: 'code',
      //   size: 10,
      //   cell: (info) => <h6 className="mb-1">{info.getValue<string>()}</h6>,
      // },

      {
        accessorKey: 'status',
        header: 'Status',
        size: 15,
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
              onClick={() => handleEditItemGroupClick(row.original)}
              style={{ padding: '4px 8px' }}
            >
              <i className="fi fi-rr-edit"></i>
            </button>
            <button
              className="btn btn-sm btn-danger"
              onClick={() => handleDeleteItemGroup(row.original)}
              style={{ padding: '4px 8px' }}
            >
              <i className="fi fi-rr-trash"></i>
            </button>
          </div>
        ),
      },
    ],
    [],
  )

  // Initialize react-table with pagination
  const table = useReactTable({
    data: filteredItemGroup,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })



  useEffect(() => {
    setFilteredItemGroup(ItemGroupItem.filter((item) => item))
  }, [ItemGroupItem])

  const handleSearch = useCallback(
    debounce((value: string) => {
      setSearchTerm(value)

      const filteredItemGroupsByCategory = ItemGroupItem.filter(
        (item) => item,
      )
      const filteredItemGroupBySearch = filteredItemGroupsByCategory.filter((item) =>
        item.itemgroupname.toLowerCase().includes(value.toLowerCase()),
      )
      setFilteredItemGroup(filteredItemGroupBySearch)
    }, 300),
    [ItemGroupItem, selectedCategory]
  )

  // const handleCategoryChange = useCallback((categoryValue: string) => {
  //   setSelectedCategory(categoryValue)
  //   setSearchTerm('')
  //   setFilteredItemGroup(ItemGroupItem.filter((item) => item))
  // }, [ItemGroupItem])

  const handleItemGroupItemClick = useCallback((mst_Item_Group: ItemGroupItem) => {
    setSelectedItemGroup(mst_Item_Group)
    setContainerToggle(true)
  }, [])

  const handleEditItemGroupClick = useCallback((mst_Item_Group: ItemGroupItem) => {
    setSelectedItemGroup(mst_Item_Group)
    setShowEditItemGroupModal(true)
  }, [])

  const handleDeleteItemGroup = useCallback(async (mst_Item_Group: ItemGroupItem) => {
    const res = await Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to recover this ItemGroup!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3E97FF',
      confirmButtonText: 'Yes, delete it!',
    });

    if (res.isConfirmed) {
      try {
        await fetch(`http://localhost:3001/api/ItemGroup/${mst_Item_Group.item_groupid}`, { method: 'DELETE' });
        setSelectedItemGroup(null);
        setContainerToggle(false);
        // Immediately update local ItemGroup to remove the deleted ItemGroup
        setItemGroupItem((prev) => prev.filter((s) => s.item_groupid !== mst_Item_Group.item_groupid));
        setFilteredItemGroup((prev) => prev.filter((s) => s.item_groupid !== mst_Item_Group.item_groupid));
        // Clear the right panel if the deleted ItemGroup was selected
        if (selectedItemGroup && selectedItemGroup.item_groupid === mst_Item_Group.item_groupid) {

          setSelectedItemGroupIndex(-1); // Reset the index to prevent navigation issues
        }
        toast.success('ItemGroup deleted successfully');
        // Refresh from backend to ensure consistency
        await fetchItemGroup();
      } catch (error) {
        toast.error('Failed to delete ItemGroup');
        console.error('Deletion error:', error);
      }
    }
  }, [selectedItemGroup, fetchItemGroup])

  useEffect(() => {
    const index = filteredItemGroup.findIndex(
      (mst_Item_Group) => mst_Item_Group.item_groupid === (selectedItemGroup?.item_groupid || ''),
    )
    setSelectedItemGroupIndex(index)
  }, [filteredItemGroup, selectedItemGroup])

  const handleNext = useCallback(() => {
    if (selectedItemGroupIndex < filteredItemGroup.length - 1) {
      const nextIndex = selectedItemGroupIndex + 1
      setSelectedItemGroup(filteredItemGroup[nextIndex])
      setContainerToggle(true)
    }
  }, [selectedItemGroupIndex, filteredItemGroup])

  const handlePrev = useCallback(() => {
    if (selectedItemGroupIndex > 0) {
      const prevIndex = selectedItemGroupIndex - 1
      setSelectedItemGroup(filteredItemGroup[prevIndex])
      setContainerToggle(true)
    }
  }, [selectedItemGroupIndex, filteredItemGroup])

  // Compute the card classes based on ItemGroup
  const cardClasses = useMemo(() => {
    let classes = 'apps-card'
    if (sidebarMiniToggle) classes += ' apps-sidebar-mini-toggle'
    if (containerToggle) classes += ' apps-container-toggle'
    if (sidebarLeftToggle) classes += ' apps-sidebar-left-toggle'
    return classes
  }, [sidebarMiniToggle, containerToggle, sidebarLeftToggle])

  // Handle resize for sidebarLeftToggle
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 991.98 && sidebarLeftToggle) {
        setSidebarLeftToggle(false)
      }
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [sidebarLeftToggle])

  const handleMenuClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    setSidebarLeftToggle((prev) => !prev)
  }, [])

  return (
    <>
      <TitleHelmet title="States" />
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


        <div className="apps-sidebar apps-sidebar-left apps-sidebar-md" style={{ minWidth: '580px' }}>
          <ContactSearchBar searchTerm={searchTerm} handleSearch={handleSearch} />
          <div
            className="apps-sidebar-content"
            style={{
              
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
                      className={selectedItemGroup?.item_groupid === row.original.item_groupid ? 'active' : ''}
                      onClick={() => handleItemGroupItemClick(row.original)}
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
                  table.setPageSize(Number(e.target.value))
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
            ) : !selectedItemGroup ? (
              <Stack
                className="d-none d-lg-flex align-items-center justify-content-center flex-grow-1 h-100 mx-auto text-center"
                style={{ maxWidth: '420px' }}
              >
                <i className="fi fi-rr-globe fs-48 mb-6"></i>
                <h4 className="fw-bold">Select a ItemGroup to view</h4>
                <p className="fs-15 fw-light text-muted mb-4">
                  Select a ItemGroup from the left sidebar to view its details.
                </p>
                <Button
                  variant=""
                  className="btn-neutral"
                  onClick={() => setShowAddItemGroupModal(true)}
                >
                  <i className="fi fi-br-plus fs-10"></i>
                  <span className="ms-2">Add New ItemGroup</span>
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
                          setSelectedItemGroup(null)
                          setContainerToggle(false)
                          setSidebarLeftToggle(false)
                        }}
                      >
                        <i className="fi fi-rr-arrow-left"></i>
                      </button>
                      <div className="flex-grow-1">
                        <h5 className="mb-1">ItemGroup</h5>
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
                        disabled={selectedItemGroupIndex <= 0}
                        style={{ padding: '8px', fontSize: '1.2rem' }}
                      >
                        <i className="fi fi-rr-angle-left"></i>
                      </button>
                      <button
                        className="btn btn-icon btn-light"
                        onClick={handleNext}
                        disabled={selectedItemGroupIndex >= filteredItemGroup.length - 1}
                        style={{ padding: '8px', fontSize: '1.2rem' }}
                      >
                        <i className="fi fi-rr-angle-right"></i>
                      </button>
                      <button
                        className="btn btn-icon btn-light"
                        onClick={() => handleDeleteItemGroup(selectedItemGroup)}
                        style={{ padding: '8px', fontSize: '1.2rem' }}
                      >
                        <i className="fi fi-rr-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="apps-contact-details p-4">
                  <div className="mb-4">
                    <h5 className="mb-2">{selectedItemGroup.itemgroupname}</h5>
                    <p className="text-muted mb-0"> Code: {selectedItemGroup.code}</p>
                  </div>
                  <div className="mb-4">
                    <p className="text-muted mb-0">kitchencategoryid: {selectedItemGroup.kitchencategoryid}</p>
                  </div>
                  <div className="mb-4">
                    <p className="text-muted mb-0">Status: {selectedItemGroup.status}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="custom-backdrop" onClick={() => setSidebarMiniToggle(false)}></div>
      </Card>
      <AddItemGroupModal
        show={showAddItemGroupModal}
        onHide={() => setShowAddItemGroupModal(false)}
        onSuccess={fetchItemGroup}
      />
      <EditItemGroupModal
        show={ShowEditItemGroupModal}
        onHide={() => setShowEditItemGroupModal(false)}
        mst_Item_Group={selectedItemGroup}
        onSuccess={fetchItemGroup}
        onUpdateSelectedItemGroup={(updatedItemGroup) => setSelectedItemGroup(updatedItemGroup)}
      />
    </>
  )
}

//2
// AddItemGroupModal component
interface AddItemGroupModalProps {
  show: boolean;
  onHide: () => void;
  onSuccess: () => void;
}

const AddItemGroupModal: React.FC<AddItemGroupModalProps> = ({ show, onHide, onSuccess }) => {
  const [itemgroupname, setitemgroupname] = useState('');
  const [code, setcode] = useState('');

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('Active'); // Default to 'Active'

  
 const [kitchencategoryid, setkitchencategoryid] = useState<number | null>(null);
const [kitchenCategory, setKitchenCategory] = useState<KitchenCategoryItem[]>([]);

  
  useEffect(() => {
      if (show) {
        fetchKitchenCategory(setKitchenCategory, setkitchencategoryid, kitchencategoryid ?? undefined);

      }
    }, [show]);


  const handleAdd = async () => {
    if (!itemgroupname || !code || !kitchencategoryid || !status) {
      toast.error('All fields are required');
      return;
    }

    setLoading(true);
    try {
      const statusValue = status === 'Active' ? 0 : 1;
      const currentDate = new Date().toISOString(); // Timestamp: e.g., 2025-07-01T04:00:00.000Z
      const payload = {
        itemgroupname,
        code,
        kitchencategoryid: kitchencategoryid, // Use the selected country ID
        status: statusValue,
        created_by_id: 1, // Default to null (or 0 if backend requires)
        created_date: currentDate,
      };
      console.log('Sending to backend:', payload); // Debug log
      const res = await fetch('http://localhost:3001/api/ItemGroup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success('ItemGroup added successfully');
        setitemgroupname('');
        setcode('');
        
        //setCountry('');
        setStatus('Active'); // Reset to 'Active' after successful add
        onSuccess();
        onHide();
      } else {
        toast.error('Failed to add ItemGroup');
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
        <Modal.Title>Add ItemGroup</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group className="mb-3">
          <Form.Label>ItemGroup Name</Form.Label>
          <Form.Control type="text" value={itemgroupname} onChange={(e) => setitemgroupname(e.target.value)} />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>ItemGroup Code</Form.Label>
          <Form.Control type="text" value={code} onChange={(e) => setcode(e.target.value)} />
        </Form.Group>
        
        <Form.Group className="mb-3">
          <Form.Label>Kitchen KitchenCategory</Form.Label>
           <select
              className="form-control"
              value={kitchencategoryid ?? ''}
              onChange={(e) => {
                const value = e.target.value;
                setkitchencategoryid(value === '' ? null : Number(value));
              }}
             
            >
              <option value=" ">Select a KitchenCategory</option>
              {kitchenCategory.filter((KitchenCategory) => String(KitchenCategory.status) === '0')  .map((KitchenCategory) => (
                <option key={KitchenCategory.kitchencategoryid} value={KitchenCategory.kitchencategoryid}>
                  {KitchenCategory.Kitchen_Category}
                </option>
              ))}
            </select>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Status</Form.Label>
          <Form.Select value={status} onChange={(e) => setStatus(e.target.value)} >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </Form.Select>
        </Form.Group>

      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleAdd} disabled={loading}>
          {loading ? 'Adding...' : 'Add ItemGroup'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

//3
// EditItemGroupModal component
interface EditItemGroupModalProps {
  show: boolean;
  onHide: () => void;
  mst_Item_Group: ItemGroupItem | null;
  onSuccess: () => void;
  onUpdateSelectedItemGroup: (mst_Item_Group: ItemGroupItem) => void;
}

// const EditItemGroupModal: React.FC<EditItemGroupModalProps> = ({ show, onHide, mst_Item_Group, onSuccess, onUpdateSelectedItemGroup }) => {
//   const [itemgroupname, setitemgroupname] = useState('');
//   const [code, setcode] = useState('');
//   const [kitchencategoryid, setkitchencategoryid] = useState<number | null>(null);
//   const [kitchenCategory, setKitchenCategory] = useState<KitchenCategoryItem[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [status, setStatus] = useState('');

 
//   // Fetch countries when modal opens
// useEffect(() => {
//     if (show) {
//       fetchKitchenCategory(setKitchenCategory, setkitchencategoryid, kitchencategoryid ?? undefined);
      
//     }
//   }, [show]);

//   useEffect(() => {
//     if (mst_Item_Group) {
//       setitemgroupname(mst_Item_Group.itemgroupname);
//       setitemgroupname(mst_Item_Group.code);
      
//       setkitchencategoryid(Number(mst_Item_Group.kitchencategoryid)); // ✅ FIXED LINE
//       setStatus(String(mst_Item_Group.status) === '0' ? 'Active' : 'Inactive');
//     }
//   }, [mst_Item_Group]);


//   const handleEdit = async () => {
//     if (!itemgroupname || !code  || !Status || !mst_Item_Group) {
//       toast.error('All fields are required');
//       return;
//     }

//     setLoading(true);
//     try {
//       const statusValue = status === 'Active' ? 0 : 1;
//       const currentDate = new Date().toISOString(); // Timestamp: e.g., 2025-07-01T04:51:00.000Z
//       const payload = {
//         itemgroupname,
//         code,
//         kitchencategoryid,
//         status: statusValue,
//         stateid: mst_Item_Group.item_groupid,
//         updated_by_id: '2', // Default to "0" (string)
//         updated_date: currentDate,

//       };
//       console.log('Sending to backend:', payload); // Debug log
//       const res = await fetch(`http://localhost:3001/api/ItemGroup/${mst_Item_Group.item_groupid}`, {
//         method: 'PUT',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(payload),
//       });
//       if (res.ok) {
//         toast.success('ItemGroup updated successfully');
//         onSuccess();
//         // Update the selected ItemGroup in the parent component
//         if (mst_Item_Group) {
//           const updatedItemGroup: ItemGroupItem = { ...mst_Item_Group, itemgroupname, code,  status: statusValue };
//           onUpdateSelectedItemGroup(updatedItemGroup);
//         }
//         onHide();
//       } else {
//         toast.error('Failed to update ItemGroup');
//       }
//     } catch (err) {
//       toast.error('Something went wrong');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <Modal show={show} onHide={onHide}>
//       <Modal.Header closeButton>
//         <Modal.Title>Edit ItemGroup New</Modal.Title>
//       </Modal.Header>
//       <Modal.Body>
        

//    <Form.Group className="mb-3">
//             <Form.Label>City Name</Form.Label>
//             <Form.Control type="text" value={itemgroupname} onChange={(e) => setitemgroupname(e.target.value)} />
//           </Form.Group>
        
//         <Form.Group className="mb-3">
//           <div className="col-md-12">
//             <label className="form-label">Status <span style={{ color: 'red' }}>*</span></label>
//             <select
//               className="form-control"
//               value={status}
//               onChange={(e) => setStatus(e.target.value)}
//             >
//               <option value="Active">Active</option>
//               <option value="Inactive">Inactive</option>
//             </select>
//           </div>
//         </Form.Group>
//       </Modal.Body>
//       <Modal.Footer>
//         <Button variant="secondary" onClick={onHide} disabled={loading}>
//           Cancel
//         </Button>
//         <Button variant="primary" onClick={handleEdit} disabled={loading}>
//           {loading ? 'Updating...' : 'Update ItemGroup'}
//         </Button>
//       </Modal.Footer>
//     </Modal>
//   );
// };

const EditItemGroupModal: React.FC<EditItemGroupModalProps> = ({ show, onHide, mst_Item_Group, onSuccess, onUpdateSelectedItemGroup }) => {
  const [itemgroupname, setName] = useState('');
  const [code, setCode] = useState('');
  const [kitchencategoryid, setCapital] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  
  

  useEffect(() => {
    if (mst_Item_Group) {
      setName(mst_Item_Group.itemgroupname);
      setCode(mst_Item_Group.code);
      setCapital(mst_Item_Group.kitchencategoryid);
      setStatus(String(mst_Item_Group.status) === '0' ? 'Active' : 'Inactive');
      console.log('Edit country status:', mst_Item_Group.status, typeof mst_Item_Group.status); // Debug log
    }
  }, [mst_Item_Group]);

  const handleEdit = async () => {
    if (!itemgroupname || !code  || !status || !mst_Item_Group) {
      toast.error('All fields are required');
      return;
    }

    setLoading(true);
    try {
       const statusValue = status === 'Active' ? 0 : 1;
      const currentDate = new Date().toISOString(); // Timestamp: e.g., 2025-07-01T04:51:00.000Z
      const payload = {
        itemgroupname,
        code,        
        status: statusValue,
        kitchencategoryid: mst_Item_Group.kitchencategoryid, // Ensure this is included
        updated_by_id: '2', // Default to "0" (string)
        updated_date: currentDate,
       
      };
      console.log('Sending to backend:', payload); // Debug log
      const res = await fetch(`http://localhost:3001/api/ItemGroup/${mst_Item_Group.item_groupid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success('Country updated successfully');
        onSuccess();
        onUpdateSelectedItemGroup({ ...mst_Item_Group, itemgroupname,code, kitchencategoryid });
        onHide();
      } else {
        toast.error('Failed to update country');
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
        <Modal.Title>Edit ItemGroup</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group className="mb-3">
          <Form.Label>Item Group</Form.Label>
          <Form.Control type="text" value={itemgroupname} onChange={(e) => setName(e.target.value)} style={{ borderColor: '#ccc' }} />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Code</Form.Label>
          <Form.Control type="text" value={code} onChange={(e) => setCode(e.target.value)} style={{ borderColor: '#ccc' }} />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Kitchen Category</Form.Label>
          <Form.Control type="text" value={kitchencategoryid} onChange={(e) => setCapital(e.target.value)} style={{ borderColor: '#ccc' }} />
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
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleEdit} disabled={loading}>
          {loading ? 'Updating...' : 'Update Item Group'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};


export default React.memo(ItemGroup)
