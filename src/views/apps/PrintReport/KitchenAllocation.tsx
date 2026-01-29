import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Col, Row, Table, Button, FormGroup, Label, Input, Alert } from 'reactstrap';
import axios from 'axios';

interface KitchenAllocationData {
    TxnDate: string;
    HotelID: number;
    outletid: number;
    item_no: string;
    item_name: string;
    TotalQty: number;
    Amount: number;
    UserId: number;
    username: string;
    DeptID: number;
    department_name: string;
    kitchen_category: string;
    item_group: string;
}

interface FilterOption {
    id: number;
    name: string;
}

const KitchenAllocation: React.FC = () => {
    const [data, setData] = useState<KitchenAllocationData[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Filter states
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [hotelId, setHotelId] = useState('');
    const [outletId, setOutletId] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterId, setFilterId] = useState('');

    // Filter options
    const [kitchenCategories, setKitchenCategories] = useState<FilterOption[]>([]);
    const [itemGroups, setItemGroups] = useState<FilterOption[]>([]);
    const [departments, setDepartments] = useState<FilterOption[]>([]);
    const [users, setUsers] = useState<FilterOption[]>([]);

    // Fetch filter options on component mount
    useEffect(() => {
        fetchFilterOptions();
    }, []);

    const fetchFilterOptions = async () => {
        try {
            const [kitchenRes, itemGroupRes, deptRes, userRes] = await Promise.all([
                axios.get('/api/KitchenMainGroup'),
                axios.get('/api/ItemGroup'),
                axios.get('/api/table-department'),
                axios.get('/api/users')
            ]);

            setKitchenCategories(kitchenRes.data.data || []);
            setItemGroups(itemGroupRes.data.data || []);
            setDepartments(deptRes.data.data || []);
            setUsers(userRes.data.data || []);
        } catch (err) {
            console.error('Error fetching filter options:', err);
        }
    };

    const fetchData = async () => {
        if (!fromDate || !toDate || !hotelId || !outletId) {
            setError('Please fill in all required fields');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const params: any = {
                fromDate,
                toDate,
                hotelId,
                outletId
            };

            if (filterType && filterId) {
                params.filterType = filterType;
                params.filterId = filterId;
            }

            const response = await axios.get('/api/kitchen-allocation', { params });
            setData(response.data.data || []);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterTypeChange = (type: string) => {
        setFilterType(type);
        setFilterId(''); // Reset filter ID when type changes
    };

    const getCurrentFilterOptions = () => {
        switch (filterType) {
            case 'kitchen-category':
                return kitchenCategories;
            case 'item-group':
                return itemGroups;
            case 'department':
                return departments;
            case 'user':
                return users;
            default:
                return [];
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    };

    return (
        <div className="container-fluid">
            <Row>
                <Col lg={12}>
                    <Card>
                        <CardHeader>
                            <h4 className="card-title">Kitchen Allocation Report</h4>
                        </CardHeader>
                        <CardBody>
                            {/* Filters */}
                            <Row className="mb-4">
                                <Col md={3}>
                                    <FormGroup>
                                        <Label for="fromDate">From Date</Label>
                                        <Input
                                            type="date"
                                            id="fromDate"
                                            value={fromDate}
                                            onChange={(e) => setFromDate(e.target.value)}
                                        />
                                    </FormGroup>
                                </Col>
                                <Col md={3}>
                                    <FormGroup>
                                        <Label for="toDate">To Date</Label>
                                        <Input
                                            type="date"
                                            id="toDate"
                                            value={toDate}
                                            onChange={(e) => setToDate(e.target.value)}
                                        />
                                    </FormGroup>
                                </Col>
                                <Col md={3}>
                                    <FormGroup>
                                        <Label for="hotelId">Hotel ID</Label>
                                        <Input
                                            type="number"
                                            id="hotelId"
                                            value={hotelId}
                                            onChange={(e) => setHotelId(e.target.value)}
                                        />
                                    </FormGroup>
                                </Col>
                                <Col md={3}>
                                    <FormGroup>
                                        <Label for="outletId">Outlet ID</Label>
                                        <Input
                                            type="number"
                                            id="outletId"
                                            value={outletId}
                                            onChange={(e) => setOutletId(e.target.value)}
                                        />
                                    </FormGroup>
                                </Col>
                            </Row>

                            <Row className="mb-4">
                                <Col md={4}>
                                    <FormGroup>
                                        <Label for="filterType">Filter Type</Label>
                                        <Input
                                            type="select"
                                            id="filterType"
                                            value={filterType}
                                            onChange={(e) => handleFilterTypeChange(e.target.value)}
                                        >
                                            <option value="">Select Filter Type</option>
                                            <option value="kitchen-category">Kitchen Category</option>
                                            <option value="item-group">Item Group</option>
                                            <option value="department">Department</option>
                                            <option value="user">User</option>
                                        </Input>
                                    </FormGroup>
                                </Col>
                                <Col md={4}>
                                    <FormGroup>
                                        <Label for="filterId">Filter Value</Label>
                                        <Input
                                            type="select"
                                            id="filterId"
                                            value={filterId}
                                            onChange={(e) => setFilterId(e.target.value)}
                                            disabled={!filterType}
                                        >
                                            <option value="">Select {filterType.replace('-', ' ')}</option>
                                            {getCurrentFilterOptions().map(option => (
                                                <option key={option.id} value={option.id}>
                                                    {option.name}
                                                </option>
                                            ))}
                                        </Input>
                                    </FormGroup>
                                </Col>
                                <Col md={4} className="d-flex align-items-end">
                                    <Button
                                        color="primary"
                                        onClick={fetchData}
                                        disabled={loading}
                                    >
                                        {loading ? 'Loading...' : 'Generate Report'}
                                    </Button>
                                </Col>
                            </Row>

                            {error && (
                                <Alert color="danger" className="mb-4">
                                    {error}
                                </Alert>
                            )}

                            {/* Data Table */}
                            {data.length > 0 && (
                                <div className="table-responsive">
                                    <Table striped bordered hover>
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Item No</th>
                                                <th>Item Name</th>
                                                <th>Total Qty</th>
                                                <th>Amount</th>
                                                <th>User</th>
                                                <th>Department</th>
                                                <th>Kitchen Category</th>
                                                <th>Item Group</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.map((item, index) => (
                                                <tr key={index}>
                                                    <td>{item.TxnDate}</td>
                                                    <td>{item.item_no}</td>
                                                    <td>{item.item_name}</td>
                                                    <td>{item.TotalQty}</td>
                                                    <td>{formatCurrency(item.Amount)}</td>
                                                    <td>{item.username}</td>
                                                    <td>{item.department_name}</td>
                                                    <td>{item.kitchen_category}</td>
                                                    <td>{item.item_group}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </div>
                            )}

                            {data.length === 0 && !loading && !error && (
                                <div className="text-center mt-4">
                                    <p>No data available. Please select filters and generate report.</p>
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default KitchenAllocation;
