// pages/RoomMaster/index.tsx
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import Swal from 'sweetalert2';
import TitleHelmet from '@/components/Common/TitleHelmet';
import roomApi from '@/common/hotel/room';
import { Badge, Button, Card, Form, Table } from 'react-bootstrap';
import FormModal from '@/components/Common/models/FormModal';
import RoomForm from './RoomForm';
import { useAuthContext } from '@/common/context/useAuthContext';

type Room = {
    room_id: number;
    room_no: string;
    room_name: string;
    display_name?: string;
    room_category_id: number;
    category_name?: string;
    room_ext_no?: string;
    room_status_id: number;
    room_status?: string;
    status_color?: string;
    department_id?: number;
    department_name?: string;
    block_id?: number;
    block_name?: string;
    floor_id?: number;
    floor_name?: string;
    hotelid: number;
    created_date?: string;
    updated_date?: string;
    created_by_id?: number;
    updated_by_id?: number;
};

type RoomFormData = {
    room_id?: number;
    room_no: string;
    room_name: string;
    display_name: string;
    room_category_id: string;
    room_ext_no: string;
    room_status_id: string;
    department_id?: string;
    block_id?: string;
    floor_id?: string;
};

const defaultForm: RoomFormData = {
    room_no: '',
    room_name: '',
    display_name: '',
    room_category_id: '',
    room_ext_no: '',
    room_status_id: '',
    department_id: '',
    block_id: '',
    floor_id: '',
};

const RoomMaster = () => {
    const { user } = useAuthContext();
        console.log("Current User:", user);

    const hotelId = user?.hotelid;

    const [rooms, setRooms] = useState<Room[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [editingRoom, setEditingRoom] = useState<Room | null>(null);
    const [form, setForm] = useState<RoomFormData>(defaultForm);
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortField, setSortField] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    // Load rooms — use getRooms() to get statuses + full room fields
    const loadRooms = async () => {
        if (!hotelId) {
            toast.error('Hotel ID not found. Please login again.');
            return;
        }
        setLoading(true);
        try {
            const response = await roomApi.getRooms(hotelId);
            if (response.success) {
                // Build status lookup map: room_status_id → { name, color }
                const sMap = new Map<number, { name: string; color: string }>();
                (response.data.statuses || []).forEach((s: any) => {
                    sMap.set(s.room_status_id, {
                        name: s.status_name || 'Unknown',
                        color: s.status_color || '#6c757d',
                    });
                });

                // Enrich each room with status_name + status_color from the map
                const enriched: Room[] = (response.data.rooms || []).map((room: any) => {
                    const sid = room.room_status_id ?? room.room_status_id;
                    const statusInfo = sid ? sMap.get(Number(sid)) : undefined;
                    return {
                        ...room,
                        room_status: statusInfo?.name || room.status_name || room.room_status || 'Unknown',
                        status_color: statusInfo?.color || room.status_color || '#6c757d',
                    };
                });
                setRooms(enriched);
            } else {
                toast.error('Failed to load rooms');
                setRooms([]);
            }
        } catch (error: any) {
            console.error('Failed to load rooms:', error);
            toast.error(error.message || 'Failed to load rooms');
            setRooms([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (hotelId) loadRooms();
    }, [hotelId]);

    // Filtering & Sorting
    const filteredRooms = useMemo(() => {
        let result = rooms;

        const query = search.trim().toLowerCase();
        if (query) {
            result = result.filter((room) =>
                [
                    room.room_no,
                    room.room_name,
                    room.display_name,
                    room.category_name,
                    room.room_status,
                    room.department_name,
                    room.block_name,
                    room.floor_name,
                ].some((value) => value?.toLowerCase().includes(query))
            );
        }

        if (sortField) {
            result = [...result].sort((a, b) => {
                const aVal = a[sortField as keyof Room] ?? '';
                const bVal = b[sortField as keyof Room] ?? '';
                if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [rooms, search, sortField, sortDirection]);

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    // Pagination
    const totalPages = useMemo(
        () => Math.max(1, Math.ceil(filteredRooms.length / pageSize)),
        [filteredRooms.length, pageSize]
    );

    const paginatedRooms = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredRooms.slice(start, start + pageSize);
    }, [filteredRooms, currentPage, pageSize]);

    useEffect(() => {
        setCurrentPage(1);
    }, [search, pageSize]);

    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(totalPages);
    }, [currentPage, totalPages]);

    // Modal handlers
    const handleOpenAddModal = () => {
        setEditingRoom(null);
        setForm(defaultForm);
        setShowModal(true);
    };

    const handleOpenEditModal = (room: Room) => {
        setEditingRoom(room);
        setForm({
            room_id: room.room_id,
            room_no: room.room_no,
            room_name: room.room_name,
            display_name: room.display_name || '',
            room_category_id: room.room_category_id.toString(),
            room_ext_no: room.room_ext_no || '',
            room_status_id: room.room_status_id?.toString() || '',
            department_id: room.department_id?.toString() || '',
            block_id: room.block_id?.toString() || '',
            floor_id: room.floor_id?.toString() || '',
        });
        setShowModal(true);
    };

    const handleCloseModal = () => {
        if (saving) return;
        setShowModal(false);
        setEditingRoom(null);
    };

    // Submit handler
    const handleSubmit = async (payload: RoomFormData) => {
        if (!hotelId) {
            toast.error('Hotel ID not found. Please login again.');
            return;
        }

        setSaving(true);
        try {
            const apiPayload = {
                room_no: payload.room_no,
                room_name: payload.room_name,
                display_name: payload.display_name || undefined,
                room_category_id: parseInt(payload.room_category_id),
                room_ext_no: payload.room_ext_no || undefined,
                room_status_id: payload.room_status_id ? parseInt(payload.room_status_id) : undefined,
                department_id: payload.department_id ? parseInt(payload.department_id) : undefined,
                block_id: payload.block_id ? parseInt(payload.block_id) : undefined,
                floor_id: payload.floor_id ? parseInt(payload.floor_id) : undefined,
                hotelid: hotelId,
                outletid: user?.outletid, 
                created_by_id: user?.id,
                updated_by_id: user?.id,
            };

            if (editingRoom) {
                const updatePayload = { ...apiPayload };
                delete updatePayload.created_by_id;
                const response = await roomApi.update(editingRoom.room_id, updatePayload);
                if (response.success) {
                    toast.success('Room updated');
                } else {
                    toast.error(response.message || 'Update failed');
                }
            } else {
                const response = await roomApi.create(apiPayload);
                if (response.success) {
                    toast.success('Room added');
                } else {
                    toast.error(response.message || 'Create failed');
                }
            }

            setShowModal(false);
            setEditingRoom(null);
            loadRooms(); // refresh to pick up status_name + status_color
        } catch (error: any) {
            console.error('Failed to save room:', error);
            toast.error(error.message || 'Failed to save room');
        } finally {
            setSaving(false);
        }
    };

    // Delete handler
    const handleDelete = async (room: Room) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: `You will not be able to recover room "${room.room_name}"!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3E97FF',
            confirmButtonText: 'Yes, delete it!',
        });

        if (result.isConfirmed) {
            setDeletingId(room.room_id);
            try {
                await roomApi.remove(room.room_id);
                setRooms((prev) => prev.filter((item) => item.room_id !== room.room_id));
                toast.success('Room deleted successfully');
            } catch (error: any) {
                console.error('Failed to delete room:', error);
                toast.error(error.message || 'Failed to delete room');
            } finally {
                setDeletingId(null);
            }
        }
    };

    // Helper for status badge — uses hex color directly from backend
    const getStatusBadge = (room: Room) => {
        const status = room.room_status || 'Unknown';
        const hexColor = room.status_color || '#6c757d';
        // Determine text color: white for dark backgrounds, dark for light ones
        const isLight = /^#([0-9a-f]{3}){1,2}$/i.test(hexColor) && (() => {
            const hex = hexColor.replace('#', '');
            const full = hex.length === 3
                ? hex.split('').map(h => h + h).join('')
                : hex;
            const r = parseInt(full.slice(0, 2), 16);
            const g = parseInt(full.slice(2, 4), 16);
            const b = parseInt(full.slice(4, 6), 16);
            return (r * 299 + g * 587 + b * 114) / 1000 > 128;
        })();
        return (
            <Badge
                style={{
                    backgroundColor: hexColor,
                    color: isLight ? '#ffffff' : '#fff',
                    border: `1px solid ${hexColor}`,
                }}
            >
                {status}
            </Badge>
        );
    };

    return (
        <>
            <TitleHelmet title="Room Master" />

            <Card className="mb-3">
                <Card.Body className="d-flex justify-content-between align-items-center">
                    <div>
                        <h4 className="mb-1">Room Master</h4>
                        <p className="text-muted mb-0">Manage rooms and their details.</p>
                    </div>
                    <Button variant="danger" onClick={handleOpenAddModal}>
                        <span className="me-1">+</span> Add Room
                    </Button>
                </Card.Body>
            </Card>

            <Card>
                <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <Form.Control
                            type="text"
                            placeholder="Search rooms..."
                            style={{ maxWidth: 320 }}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <Table hover responsive className="mb-0">
                        <thead className="table-light">
                            <tr>
                                <th style={{ width: '60px' }}>#</th>
                                <th onClick={() => handleSort('room_no')} style={{ cursor: 'pointer' }}>
                                    Room No {sortField === 'room_no' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </th>
                                <th onClick={() => handleSort('room_name')} style={{ cursor: 'pointer' }}>
                                    Name {sortField === 'room_name' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </th>
                                <th>Display Name</th>
                                <th>Category</th>
                                <th>Extension</th>
                                <th>Status</th>
                                <th>Department</th>
                                <th>Block</th>
                                <th>Floor</th>
                                <th style={{ width: '120px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!hotelId ? (
                                <tr>
                                    <td colSpan={11} className="text-center text-muted py-4">
                                        Please login to view rooms.
                                    </td>
                                </tr>
                            ) : loading ? (
                                <tr>
                                    <td colSpan={11} className="text-center text-muted py-4">
                                        Loading rooms...
                                    </td>
                                </tr>
                            ) : filteredRooms.length === 0 ? (
                                <tr>
                                    <td colSpan={11} className="text-center text-muted py-4">
                                        {search ? 'No rooms match your search.' : 'No rooms found. Add your first room!'}
                                    </td>
                                </tr>
                            ) : (
                                paginatedRooms.map((room, index) => (
                                    <tr key={room.room_id}>
                                        <td>{(currentPage - 1) * pageSize + index + 1}</td>
                                        <td className="fw-semibold">{room.room_no}</td>
                                        <td>{room.room_name}</td>
                                        <td>{room.display_name || '-'}</td>
                                        <td>{room.category_name || '-'}</td>
                                        <td>{room.room_ext_no || '-'}</td>
                                        <td>{getStatusBadge(room)}</td>
                                        <td>{room.department_name || '-'}</td>
                                        <td>{room.block_name || '-'}</td>
                                        <td>{room.floor_name || '-'}</td>
                                        <td>
                                            <div className="d-flex gap-2">
                                                <Button
                                                    variant="outline-primary"
                                                    size="sm"
                                                    onClick={() => handleOpenEditModal(room)}
                                                >
                                                    <i className="fi fi-rr-edit" />
                                                </Button>
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    onClick={() => handleDelete(room)}
                                                    disabled={deletingId === room.room_id}
                                                >
                                                    <i className="fi fi-rr-trash" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </Table>

                    {filteredRooms.length > 0 && (
                        <div className="d-flex justify-content-between align-items-center mt-3">
                            <Form.Select
                                style={{ maxWidth: 80 }}
                                value={pageSize}
                                onChange={(e) => setPageSize(Number(e.target.value))}
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </Form.Select>
                            <div className="d-flex align-items-center gap-2">
                                <Button
                                    variant="outline-light"
                                    size="sm"
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                >
                                    {'<'}
                                </Button>
                                <Button variant="danger" size="sm">
                                    {currentPage}
                                </Button>
                                <Button
                                    variant="outline-light"
                                    size="sm"
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    {'>'}
                                </Button>
                            </div>
                        </div>
                    )}
                </Card.Body>
            </Card>

            <FormModal
                size="lg"
                show={showModal}
                onHide={handleCloseModal}
                title={editingRoom ? 'Edit Room' : 'Add Room'}
                onSave={handleSubmit}
                saving={saving}
                submitLabel={editingRoom ? 'Update' : 'Save'}
                Component={RoomForm}
                selectedItem={form}
            />
        </>
    );
};

export default RoomMaster;