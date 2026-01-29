import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Form, Button, Table, Alert } from 'react-bootstrap';
import { useAuthContext } from '@/common';

interface KitchenAllocationData {
  item_no: string;
  item_name: string;
  TotalQty: number;
  Amount: number;
}

interface FilterOption {
  [key: string]: any;
}

const KitchenAllocation: React.FC = () => {
  const { user } = useAuthContext();
  const [data, setData] = useState<KitchenAllocationData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedItemGroup, setSelectedItemGroup] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedKitchenMainGroup, setSelectedKitchenMainGroup] = useState('');

  // Filter options
  const [users, setUsers] = useState<FilterOption[]>([]);
  const [itemGroups, setItemGroups] = useState<FilterOption[]>([]);
  const [departments, setDepartments] = useState<FilterOption[]>([]);
  const [kitchenMainGroups, setKitchenMainGroups] = useState<FilterOption[]>([]);

  // Fetch filter options
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        // Use correct API endpoints that match backend routes
        const userParams = new URLSearchParams({
          currentUserId: user?.id?.toString() || '',
          roleLevel: user?.role || '',
          brandId: user?.hotelid?.toString() || '',
          hotelid: user?.hotelid?.toString() || ''
        });

        const departmentParams = new URLSearchParams({
          hotelid: user?.hotelid?.toString() || ''
        });

        const [usersRes, itemGroupsRes, departmentsRes, kitchenMainGroupsRes] = await Promise.all([
          fetch(`http://localhost:3001/api/users?${userParams}`),
          fetch('http://localhost:3001/api/ItemGroup'),
          fetch(`http://localhost:3001/api/table-department?${departmentParams}`),
          fetch('http://localhost:3001/api/KitchenMainGroup')
        ]);

        if (!usersRes.ok) throw new Error(`Failed to fetch users: ${usersRes.status} ${usersRes.statusText}`);
        if (!itemGroupsRes.ok) throw new Error(`Failed to fetch item groups: ${itemGroupsRes.status} ${itemGroupsRes.statusText}`);
        if (!departmentsRes.ok) throw new Error(`Failed to fetch departments: ${departmentsRes.status} ${departmentsRes.statusText}`);
        if (!kitchenMainGroupsRes.ok) throw new Error(`Failed to fetch kitchen main groups: ${kitchenMainGroupsRes.status} ${kitchenMainGroupsRes.statusText}`);

        const usersData = await usersRes.json();
        const itemGroupsData = await itemGroupsRes.json();
        const departmentsData = await departmentsRes.json();
        const kitchenMainGroupsData = await kitchenMainGroupsRes.json();

        // Handle different response formats
        setUsers(Array.isArray(usersData) ? usersData : usersData.data || []);
        setItemGroups(Array.isArray(itemGroupsData) ? itemGroupsData : itemGroupsData.data || []);
        setDepartments(Array.isArray(departmentsData) ? departmentsData : departmentsData.data || []);
        setKitchenMainGroups(Array.isArray(kitchenMainGroupsData) ? kitchenMainGroupsData : kitchenMainGroupsData.data || []);
      } catch (err) {
        console.error('Error fetching filter options:', err);
        setError('Failed to load filter options. Please check your connection.');
      }
    };

    fetchFilterOptions();
  }, []);

  // Fetch data
  const fetchData = async () => {
    if (!fromDate || !toDate) {
      setError('Please select both From Date and To Date.');
      return;
    }
    if (!user?.hotelid) {
      setError('Hotel information is not available. Please log in again.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let filterType = '';
      let filterId = '';

      if (selectedUser) {
        filterType = 'user';
        filterId = selectedUser;
      } else if (selectedItemGroup) {
        filterType = 'item-group';
        filterId = selectedItemGroup;
      } else if (selectedDepartment) {
        filterType = 'department';
        filterId = selectedDepartment;
      } else if (selectedKitchenMainGroup) {
        filterType = 'kitchen-category';
        filterId = selectedKitchenMainGroup;
      }

      // Ensure fromDate is before toDate
      const startDate = fromDate < toDate ? fromDate : toDate;
      const endDate = fromDate < toDate ? toDate : fromDate;

      const params = new URLSearchParams({
        fromDate: startDate,
        toDate: endDate,
        hotelId: user.hotelid.toString(),
        ...(user.outletid && { outletId: user.outletid.toString() }),
        ...(filterType && { filterType, filterId })
      });

      const response = await fetch(`http://localhost:3001/api/kitchen-allocation?${params}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.message || 'Failed to fetch data');
      }
    } catch (err) {
      setError('Error fetching data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Card>
        <Card.Header>
          <h4>Kitchen Allocation Report</h4>
        </Card.Header>
        <Card.Body>
          <Form>
            <Row>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>From Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>To Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>User</Form.Label>
                  <Form.Select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
                    <option value="">All Users</option>
                    {users.map((user) => (
                      <option key={user.userid} value={user.userid}>{user.full_name || user.username}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Item Group</Form.Label>
                  <Form.Select value={selectedItemGroup} onChange={(e) => setSelectedItemGroup(e.target.value)}>
                    <option value="">All Item Groups</option>
                    {itemGroups.map((group) => (
                      <option key={group.item_groupid} value={group.item_groupid}>{group.itemgroupname}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row className="mt-3">
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Department</Form.Label>
                  <Form.Select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)}>
                    <option value="">All Departments</option>
                    {departments.map((dept) => (
                      <option key={dept.departmentid} value={dept.departmentid}>{dept.department_name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Kitchen Main Group</Form.Label>
                  <Form.Select value={selectedKitchenMainGroup} onChange={(e) => setSelectedKitchenMainGroup(e.target.value)}>
                    <option value="">All Kitchen Main Groups</option>
                    {kitchenMainGroups.map((group) => (
                      <option key={group.kitchenmaingroupid} value={group.kitchenmaingroupid}>{group.Kitchen_main_Group}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3} className="d-flex align-items-end">
                <Button onClick={fetchData} disabled={loading}>
                  {loading ? 'Loading...' : 'Generate Report'}
                </Button>
              </Col>
            </Row>
          </Form>

          {error && <Alert variant="danger" className="mt-3">{error}</Alert>}

          <Table striped bordered hover responsive className="mt-3">
            <thead>
              <tr>
                <th>Item No</th>
                <th>Item Name</th>
                <th>Total Qty</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={index}>
                  <td>{item.item_no}</td>
                  <td>{item.item_name}</td>
                  <td>{item.TotalQty}</td>
                  <td>{item.Amount}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
};

export default KitchenAllocation;
