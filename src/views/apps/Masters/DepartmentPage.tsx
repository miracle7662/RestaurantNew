import React, { useState } from 'react';
import { Table, Button, Badge } from 'react-bootstrap';
import { FaEdit, FaTrash } from 'react-icons/fa';

interface Department {
  id: number;
  departmentName: string;
  outletName: string;
  active: boolean;
}

const mockDepartments: Department[] = [
  { id: 1, departmentName: 'Rooms', outletName: '!!Hotel Shubharambh!!', active: true },
  { id: 2, departmentName: 'Restaurant', outletName: '!!Hotel Shubharambh!!', active: true },
  { id: 3, departmentName: 'FamilyDine In', outletName: '!!Hotel Shubharambh!!', active: true },
];

const DepartmentPage: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>(mockDepartments);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const handleEdit = (id: number) => {
    alert('Edit department with id: ' + id);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      setDepartments((prev) => prev.filter((dept) => dept.id !== id));
      setSelectedIds((prev) => prev.filter((sid) => sid !== id));
    }
  };

  const handleAddNew = () => {
    alert('Add new department clicked');
  };

  return (
    <div className="container mt-3">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h5>Table Department</h5>
        <Button variant="dark" onClick={handleAddNew}>
          <span className="me-1">+</span> Add New
        </Button>
      </div>
      <Table bordered hover responsive>
        <thead>
          <tr>
            <th>Action</th>
            <th>
              <input
                type="checkbox"
                checked={selectedIds.length === departments.length && departments.length > 0}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedIds(departments.map((d) => d.id));
                  } else {
                    setSelectedIds([]);
                  }
                }}
              />
            </th>
            <th>#</th>
            <th>Department Name</th>
            <th>Outlet Name</th>
            <th>Active</th>
          </tr>
        </thead>
        <tbody>
          {departments.map((dept, index) => (
            <tr key={dept.id}>
              <td>
                <Button
                  variant="success"
                  size="sm"
                  className="me-1"
                  onClick={() => handleEdit(dept.id)}
                >
                  <FaEdit />
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(dept.id)}
                >
                  <FaTrash />
                </Button>
              </td>
              <td>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(dept.id)}
                  onChange={() => toggleSelect(dept.id)}
                />
              </td>
              <td>{index + 1}</td>
              <td>{dept.departmentName}</td>
              <td>{dept.outletName}</td>
              <td>
                {dept.active ? (
                  <Badge bg="success">Yes</Badge>
                ) : (
                  <Badge bg="secondary">No</Badge>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default DepartmentPage;
