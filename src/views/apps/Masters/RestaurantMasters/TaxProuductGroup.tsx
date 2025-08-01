import React, { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import { toast } from 'react-hot-toast';
import { Preloader } from '@/components/Misc/Preloader';
import { Button, Card, Stack, Table } from 'react-bootstrap';
import TitleHelmet from '@/components/Common/TitleHelmet';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table';

// Define tax product group data type
interface TaxProductGroup {
  id: string;
  name: string;
}

// Sample tax product group data
const initialTaxProductGroups: TaxProductGroup[] = [
  {
    id: '1',
    name: 'Food',
  },
];

// AddTaxProductGroupModal component
const AddTaxProductGroupModal: React.FC<{
  show: boolean;
  onHide: () => void;
  onAddTaxProductGroup: (taxProductGroupData: Omit<TaxProductGroup, 'id'>) => void;
}> = ({ show, onHide, onAddTaxProductGroup }) => {
  const [name, setName] = useState<string>('');

  if (!show) return null;

  const handleAdd = () => {
    onAddTaxProductGroup({ name });
    setName('');
    onHide();
  };

  return (
    <div className="modal" style={{ display: 'block', background: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      <div className="modal-content" style={{ background: 'white', padding: '20px', maxWidth: '500px', margin: '100px auto', borderRadius: '8px' }}>
        <h3>Add New Tax Product Group</h3>
        <input
          type="text"
          className="form-control mb-3"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tax Product Group Name (e.g., Food)"
        />
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

// EditTaxProductGroupModal component
const EditTaxProductGroupModal: React.FC<{
  show: boolean;
  onHide: () => void;
  taxProductGroup: TaxProductGroup | null;
  onEditTaxProductGroup: (id: string, updatedData: Omit<TaxProductGroup, 'id'>) => void;
}> = ({ show, onHide, taxProductGroup, onEditTaxProductGroup }) => {
  const [name, setName] = useState<string>(taxProductGroup?.name || '');

  useEffect(() => {
    if (taxProductGroup) {
      setName(taxProductGroup.name);
    }
  }, [taxProductGroup]);

  if (!show || !taxProductGroup) return null;

  const handleEdit = () => {
    onEditTaxProductGroup(taxProductGroup.id, { name });
    onHide();
  };

  return (
    <div className="modal" style={{ display: 'block', background: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      <div className="modal-content" style={{ background: 'white', padding: '20px', maxWidth: '500px', margin: '100px auto', borderRadius: '8px' }}>
        <h3>Edit Tax Product Group</h3>
        <input
          type="text"
          className="form-control mb-3"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tax Product Group Name"
        />
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

const TaxProductGroupPage: React.FC = () => {
  const [taxProductGroups, setTaxProductGroups] = useState<TaxProductGroup[]>(initialTaxProductGroups);
  const [filteredTaxProductGroups, setFilteredTaxProductGroups] = useState<TaxProductGroup[]>(taxProductGroups);
  const [selectedTaxProductGroup, setSelectedTaxProductGroup] = useState<TaxProductGroup | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showAddTaxProductGroupModal, setShowAddTaxProductGroupModal] = useState(false);
  const [showEditTaxProductGroupModal, setShowEditTaxProductGroupModal] = useState(false);

  // Define columns for react-table
  const columns = React.useMemo<ColumnDef<TaxProductGroup>[]>(
    () => [
      
      {
        accessorKey: 'id',
        header: 'Sr. No.',
        size: 50,
        cell: (info) => <span>{info.getValue<string>()}</span>,
      },
      {
        accessorKey: 'name',
        header: 'Tax Product Group Name',
        size: 200,
        cell: (info) => <span>{info.getValue<string>()}</span>,
      },
      {
        id: 'actions',
        header: 'Action',
        size: 100,
        cell: ({ row }) => (
          <div className="d-flex gap-2">
            <button
              className="btn btn-sm"
              style={{ backgroundColor: '#2E8B57', borderColor: '#2E8B57', padding: '4px 8px' }}
              onClick={() => handleEditTaxProductGroupClick(row.original)}
            >
              <i className="fi fi-rr-edit" style={{ color: 'white' }}></i>
            </button>
            <button
              className="btn btn-sm btn-danger"
              style={{ padding: '4px 8px' }}
              onClick={() => handleDeleteTaxProductGroup(row.original)}
            >
              <i className="fi fi-rr-trash"></i>
            </button>
          </div>
        ),
      },
    ],
    []
  );

  // Initialize react-table
  const table = useReactTable({
    data: filteredTaxProductGroups,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const handleAddTaxProductGroup = useCallback((taxProductGroupData: Omit<TaxProductGroup, 'id'>) => {
    const newTaxProductGroup: TaxProductGroup = {
      id: (taxProductGroups.length + 1).toString(),
      name: taxProductGroupData.name,
    };

    const updatedTaxProductGroups = [...taxProductGroups, newTaxProductGroup];
    setTaxProductGroups(updatedTaxProductGroups);
    setFilteredTaxProductGroups(updatedTaxProductGroups);

    toast.success('Tax Product Group added successfully');
  }, [taxProductGroups, filteredTaxProductGroups]);

  const handleEditTaxProductGroup = useCallback((id: string, updatedData: Omit<TaxProductGroup, 'id'>) => {
    const updatedTaxProductGroups = taxProductGroups.map((item) =>
      item.id === id ? { ...item, name: updatedData.name } : item
    );
    setTaxProductGroups(updatedTaxProductGroups);
    setFilteredTaxProductGroups(updatedTaxProductGroups);

    if (selectedTaxProductGroup?.id === id) {
      setSelectedTaxProductGroup({ ...selectedTaxProductGroup, name: updatedData.name });
    }

    toast.success('Tax Product Group updated successfully');
  }, [taxProductGroups, selectedTaxProductGroup]);

  const handleEditTaxProductGroupClick = useCallback((taxProductGroup: TaxProductGroup) => {
    setSelectedTaxProductGroup(taxProductGroup);
    setShowEditTaxProductGroupModal(true);
  }, []);

  const handleDeleteTaxProductGroup = useCallback((taxProductGroup: TaxProductGroup) => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to recover this tax product group!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3E97FF',
      confirmButtonText: 'Yes, delete it!',
    }).then((result) => {
      if (result.isConfirmed) {
        setLoading(true);

        setTimeout(() => {
          const updatedTaxProductGroups = taxProductGroups.filter((item) => item.id !== taxProductGroup.id);
          setTaxProductGroups(updatedTaxProductGroups);
          setFilteredTaxProductGroups(updatedTaxProductGroups);

          if (updatedTaxProductGroups.length === 0) {
            setFilteredTaxProductGroups([]);
          }
          if (selectedTaxProductGroup?.id === taxProductGroup.id) {
            setSelectedTaxProductGroup(null);
          }
          setLoading(false);
          toast.success('Tax Product Group deleted successfully');
        }, 1500);
      }
    });
    
  }, [taxProductGroups, selectedTaxProductGroup]);

  return (
    <>
      <TitleHelmet title="Tax Product Groups" />
      <Card className="m-1">
        <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
          <h4 className="mb-0">
            <i className="bi bi-grid-fill me-2"></i>Tax Product Group
          </h4>
          <Button
            style={{ backgroundColor: '#4682B4', borderColor: '#4682B4' }}
            onClick={() => setShowAddTaxProductGroupModal(true)}
          >
            <i className="bi bi-plus"></i> Add New Tax Product Group
          </Button>
        </div>
        <div className="p-3">
          {loading ? (
            <Stack className="align-items-center justify-content-center flex-grow-1 h-100">
              <Preloader />
            </Stack>
          ) : (
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
                            textAlign: 'left',
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
                            textAlign: 'left',
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
          )}
        </div>
      </Card>
      <AddTaxProductGroupModal
        show={showAddTaxProductGroupModal}
        onHide={() => setShowAddTaxProductGroupModal(false)}
        onAddTaxProductGroup={handleAddTaxProductGroup}
      />
      <EditTaxProductGroupModal
        show={showEditTaxProductGroupModal}
        onHide={() => setShowEditTaxProductGroupModal(false)}
        taxProductGroup={selectedTaxProductGroup}
        onEditTaxProductGroup={handleEditTaxProductGroup}
      />
    </>
  );
};

export default TaxProductGroupPage;