import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Swal from 'sweetalert2';
import { toast } from 'react-hot-toast';
import { Preloader } from '@/components/Misc/Preloader';
import { Button, Card, Stack, Pagination, Table, Form } from 'react-bootstrap';
import TitleHelmet from '@/components/Common/TitleHelmet';
import { useAuthContext } from '../../../../common/context/useAuthContext';
import {
    useReactTable,
    getCoreRowModel,
    getPaginationRowModel,
    getFilteredRowModel,
    ColumnDef,
    flexRender,
} from '@tanstack/react-table';

interface warehouseItem {
    warehouse_name: string;
    warehouseid: string;
    location: string;
    total_items: number;
    status: string;
    created_by_id: string;
    created_date: string;
    updated_by_id: string;
    updated_date: string;
    hotelid: string;
    client_code: string;
    marketid: string;
}

interface WarehouseModalProps {
    show: boolean;
    onHide: () => void;
    onSuccess: () => void;
    warehouse: warehouseItem | null;
    onUpdateSelectedWarehouse?: (warehouse: warehouseItem) => void;
}

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

// Main Warehouse Component
const Warehouse: React.FC = () => {
    const [warehouseItem, setWarehouseItem] = useState<warehouseItem[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [showModal, setShowModal] = useState(false);
    const [selectedWarehouse, setSelectedWarehouse] = useState<warehouseItem | null>(null);
    const [showDetails, setShowDetails] = useState(false);

    const fetchWarehouse = async () => {
        try {
            setLoading(true);
            const res = await fetch('http://localhost:3001/api/warehouse');
            const data = await res.json();
            console.log('Fetched warehouse:', data);
            setWarehouseItem(data);
        } catch (err) {
            toast.error('Failed to fetch Warehouse');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWarehouse();
    }, []);

    // Define columns for react-table with explicit widths
    const columns = useMemo<ColumnDef<warehouseItem>[]>(() => [
        {
            id: 'srNo',
            header: 'Sr No',
            size: 50,
            cell: ({ row }) => <div style={{ textAlign: 'center' }}>{row.index + 1}</div>,
        },
        {
            accessorKey: 'warehouse_name',
            header: 'Warehouse Name',
            size: 200,
            cell: (info) => <div style={{ textAlign: 'center' }}>{info.getValue<string>()}</div>,
        },
        {
            accessorKey: 'location',
            header: 'Location',
            size: 200,
            cell: (info) => <div style={{ textAlign: 'center' }}>{info.getValue<string>()}</div>,
        },
        {
            accessorKey: 'status',
            header: 'Status',
            size: 150,
            cell: (info) => {
                const statusValue = info.getValue<string | number>();
                return (
                    <div style={{ textAlign: 'center' }}>
                        {getStatusBadge(Number(statusValue))}
                    </div>
                );
            },
        },
        {
            id: 'actions',
            header: () => <div style={{ textAlign: 'center' }}>Action</div>,
            size: 200,
            cell: ({ row }) => (
                <div className="d-flex gap-2 justify-content-center">
                    <button
                        className="btn btn-sm btn-info"
                        onClick={() => handleViewClick(row.original)}
                        title="View Warehouse Details"
                    >
                        <i className="fi fi-rr-eye"></i>
                    </button>
                    <button
                        className="btn btn-sm btn-success"
                        onClick={() => handleEditClick(row.original)}
                        title="Edit Warehouse"
                    >
                        <i className="fi fi-rr-edit"></i>
                    </button>
                    <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeleteWarehouse(row.original)}
                        title="Delete Warehouse"
                    >
                        <i className="fi fi-rr-trash"></i>
                    </button>
                </div>
            ),
        },
    ], []);

    // Initialize react-table with pagination and filtering
    const table = useReactTable({
        data: warehouseItem,
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

    const handleViewClick = (warehouse: warehouseItem) => {
        setSelectedWarehouse(warehouse);
        setShowDetails(true);
    };

    const handleEditClick = (warehouse: warehouseItem) => {
        setSelectedWarehouse(warehouse);
        setShowModal(true);
    };

    const handleDeleteWarehouse = async (warehouse: warehouseItem) => {
        const res = await Swal.fire({
            title: 'Are you sure?',
            text: 'You will not be able to recover this Warehouse!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3E97FF',
            confirmButtonText: 'Yes, delete it!',
        });
        if (res.isConfirmed) {
            try {
                await fetch(`http://localhost:3001/api/warehouse/${warehouse.warehouseid}`, { method: 'DELETE' });
                toast.success('Deleted successfully');
                fetchWarehouse();
                setSelectedWarehouse(null);
                setShowDetails(false);
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

    // Combined WarehouseModal Component
    const WarehouseModal: React.FC<WarehouseModalProps> = ({ show, onHide, onSuccess, warehouse, onUpdateSelectedWarehouse }) => {
        const [warehouse_name, setWarehouse_name] = useState('');
        const [location, setLocation] = useState('');
        const [status, setStatus] = useState('Active');
        const [loading, setLoading] = useState(false);
        const { user } = useAuthContext(); // Assuming useAuthContext provides user info

        const isEditMode = !!warehouse;

        useEffect(() => {
            if (warehouse && isEditMode) {
                setWarehouse_name(warehouse.warehouse_name);
                setLocation(warehouse.location);
                setStatus(String(warehouse.status) === '0' ? 'Active' : 'Inactive');
                console.log('Edit warehouse status:', warehouse.status, typeof warehouse.status);
            } else {
                setWarehouse_name('');
                setLocation('');
                setStatus('Active');
            }
        }, [warehouse]);

        const handleSubmit = async () => {
            if (!warehouse_name || !location || !status) {
                toast.error('Warehouse Name, Location and Status are required');
                return;
            }

            // Use authenticated user ID and context
            const userId = user.id;
            const hotelId = user.hotelid || '1';
            const marketId = user.marketid || '1';

            setLoading(true);
            try {
                const statusValue = status === 'Active' ? 0 : 1;
                const currentDate = new Date().toISOString();

                const payload = {
                    warehouse_name,
                    location,
                    status: statusValue,
                    ...(isEditMode
                        ? {
                            warehouseid: warehouse!.warehouseid,
                            updated_by_id: userId,
                            updated_date: currentDate,
                            hotelid: warehouse!.hotelid || hotelId,
                            marketid: warehouse!.marketid || marketId
                        }
                        : {
                            created_by_id: userId,
                            created_date: currentDate,
                            hotelid: hotelId,
                            marketid: marketId,
                        }),
                };
                console.log('Sending to backend:', payload);

                const url = isEditMode
                    ? `http://localhost:3001/api/warehouse/${warehouse!.warehouseid}`
                    : 'http://localhost:3001/api/warehouse';
                const method = isEditMode ? 'PUT' : 'POST';

                const res = await fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });

                if (res.ok) {
                    toast.success(`Warehouse ${isEditMode ? 'updated' : 'added'} successfully`);
                    if (isEditMode && warehouse && onUpdateSelectedWarehouse) {
                        const updatedWarehouse = {
                            ...warehouse,
                            warehouse_name,
                            location,
                            status: statusValue.toString(),
                            updated_by_id: userId,
                            updated_date: currentDate,
                            warehouseid: warehouse.warehouseid,
                        };
                        onUpdateSelectedWarehouse(updatedWarehouse);
                    }
                    setWarehouse_name('');
                    setLocation('');
                    setStatus('Active');
                    onSuccess();
                    onHide();
                } else {
                    const errorData = await res.json();
                    console.log('Backend error:', errorData);
                    toast.error(`Failed to ${isEditMode ? 'update' : 'add'} Warehouse`);
                }
            } catch (err) {
                console.error(`${isEditMode ? 'Edit' : 'Add'} Warehouse error:`, err);
                toast.error('Something went wrong');
            } finally {
                setLoading(false);
            }
        };
        

        if (!show) return null;

        return (
            <div className="modal" style={{ display: show ? 'block' : 'none', background: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
                <div className="modal-content" style={{ background: 'white', padding: '20px', maxWidth: '600px', margin: '100px auto', borderRadius: '8px' }}>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="mb-0">{isEditMode ? 'Edit Warehouse' : 'Add Warehouse'}</h5>
                        <button className="btn-close" onClick={onHide}></button>
                    </div>
                    <div className="row mb-3">
                        <div className="col-md-12">
                            <label className="form-label">Warehouse Name <span style={{ color: 'red' }}>*</span></label>
                            <input
                                type="text"
                                className="form-control"
                                value={warehouse_name}
                                onChange={(e) => setWarehouse_name(e.target.value)}
                                placeholder="Enter Warehouse Name"
                            />
                        </div>
                    </div>
                    <div className="row mb-3">
                        <div className="col-md-12">
                            <label className="form-label">Location <span style={{ color: 'red' }}>*</span></label>
                            <input
                                type="text"
                                className="form-control"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="Enter Location"
                            />
                        </div>
                    </div>
                    <div className="row mb-3">
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
                    </div>
                    <div className="d-flex justify-content-end mt-4">
                        <button
                            className="btn btn-danger me-2"
                            onClick={onHide}
                            disabled={loading}
                        >
                            Close
                        </button>
                        <button
                            className="btn btn-success"
                            onClick={handleSubmit}
                            disabled={loading}
                        >
                            {loading
                                ? (isEditMode ? 'Updating...' : 'Adding...')
                                : (isEditMode ? 'Save' : 'Create')}
                        </button>
                    </div>

                </div>
            </div>
        );
    };

    // Warehouse Details Card
    const WarehouseDetailsCard = () => {
        if (!selectedWarehouse) return null;

        return (
            <Card className="mt-3">
                <Card.Header className="d-flex justify-content-between align-items-center">
                    <h5>Warehouse Details</h5>
                    <Button variant="secondary" size="sm" onClick={() => { setSelectedWarehouse(null); setShowDetails(false); }}>
                        Close
                    </Button>
                </Card.Header>
                <Card.Body>
                    <p><strong>Warehouse Name:</strong> {selectedWarehouse.warehouse_name}</p>
                    <p><strong>Location:</strong> {selectedWarehouse.location}</p>
                    <p><strong>Total Items:</strong> {selectedWarehouse.total_items}</p>
                    <p><strong>Last Updated:</strong> {selectedWarehouse.updated_date}</p>
                </Card.Body>
            </Card>
        );
    };

    return (
        <>
            <TitleHelmet title="Warehouse List" />
            <Card className="m-1">
                <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
                    <h4 className="mb-0">Warehouse List</h4>
                    <div style={{ display: 'flex', gap: '4px' }}>
                        <Button variant="success" onClick={() => setShowModal(true)}>
                            <i className="bi bi-plus"></i> Add Warehouse
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
                    <div className="flex-grow-1" style={{ overflowY: 'auto' }}>
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
                                            onChange={(e) => table.setPageSize(Number(e.target.value))}
                                            style={{ width: '100px', display: 'inline-block', marginRight: '10px' }}
                                        >
                                            <option value="5">5</option>
                                            <option value="10">10</option>
                                            <option value="20">20</option>
                                            <option value="50">50</option>
                                        </Form.Select>
                                        <span className="text-muted">
                                            Showing {table.getRowModel().rows.length} of {warehouseItem.length} entries
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
                                {showDetails && <WarehouseDetailsCard />}
                            </>
                        )}
                    </div>
                </div>
            </Card>
            <WarehouseModal
                show={showModal}
                onHide={() => {
                    setShowModal(false);
                    setSelectedWarehouse(null);
                }}
                warehouse={selectedWarehouse}
                onSuccess={fetchWarehouse}
                onUpdateSelectedWarehouse={setSelectedWarehouse}
            />
        </>
    );
};

export default Warehouse;