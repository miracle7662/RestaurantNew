import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Swal from 'sweetalert2';
import { toast } from 'react-hot-toast';
import { Preloader } from '@/components/Misc/Preloader';
import { Button, Card, Table } from 'react-bootstrap';
import TitleHelmet from '@/components/Common/TitleHelmet';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table';

// Interface for tax configuration data
interface TaxConfiguration {
  id: string;
  taxName: string;
  type: string;
  taxProductGroup: string;
  brandName: string;
  taxPercentage: number;
  isActive: boolean;
}

// Modal props interface
interface ModalProps {
  show: boolean;
  onHide: () => void;
  onSubmit: (data: Omit<TaxConfiguration, 'id'>) => void;
  initialData?: TaxConfiguration | null;
}

// Add Tax Configuration Modal (modified to remove Display Name and add CGST, SGST, IGST labels)
const AddTaxConfigurationModal: React.FC<ModalProps> = ({ show, onHide, onSubmit }) => {
  const [formData, setFormData] = useState({
    taxName: '',
    type: '',
    taxProductGroup: '',
    brandName: '',
    taxPercentage: 0,
    includeInRate: false,
    taxDividable: false,
    isActive: true,
    applicableAllOutlets: false,
    cgst: 0, // Added for CGST
    sgst: 0, // Added for SGST
    igst: 0, // Added for IGST
  });

  if (!show) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value,
    }));
  };

  const handleAdd = () => {
    const submitData = {
      taxName: formData.taxName,
      type: formData.type,
      taxProductGroup: formData.taxProductGroup,
      brandName: formData.brandName,
      taxPercentage: formData.taxPercentage,
      isActive: formData.isActive,
    };
    onSubmit(submitData);
    setFormData({
      taxName: '',
      type: '',
      taxProductGroup: '',
      brandName: '',
      taxPercentage: 0,
      includeInRate: false,
      taxDividable: false,
      isActive: true,
      applicableAllOutlets: false,
      cgst: 0,
      sgst: 0,
      igst: 0,
    });
    onHide();
  };

  return (
    <div className="modal" style={{ display: 'block', background: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      <div className="modal-content" style={{ background: 'white', padding: '20px', maxWidth: '700px', margin: '100px auto', borderRadius: '8px' }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3 className="mb-0">Add Tax</h3>
          <button className="btn-close" onClick={onHide} style={{ background: 'none', border: 'none', fontSize: '1.2rem' }}>
            ×
          </button>
        </div>

        <div className="row mb-3">
          <div className="col-md-6">
            <label className="form-label">Brand List</label>
            <select
              name="brandName"
              className="form-select"
              value={formData.brandName}
              onChange={handleChange}
            >
              <option value="">Select Brand</option>
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label">Search Outlet</label>
            <select
              name="outlet"
              className="form-select"
              value=""
              onChange={() => { }}
              disabled
            >
              <option value="">Search Outlet</option>
            </select>
          </div>
        </div>

        <div className="row mb-3">
          <div className="col-md-12">
            <div className="form-check">
              <input
                type="checkbox"
                name="applicableAllOutlets"
                className="form-check-input"
                checked={formData.applicableAllOutlets}
                onChange={handleChange}
              />
              <label className="form-check-label">Applicable ALL Outlets <span className="text-danger">*</span></label>
            </div>
          </div>
        </div>

        <div className="row mb-3">
          <div className="col-md-6">
            <label className="form-label">Tax Name: <span className="text-danger">*</span></label>
            <input
              type="text"
              name="taxName"
              className="form-control"
              value={formData.taxName}
              onChange={handleChange}
              placeholder="Enter Tax Name"
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Tax Value: <span className="text-danger">*</span></label>
            <input
              type="number"
              name="taxPercentage"
              className="form-control"
              value={formData.taxPercentage}
              onChange={handleChange}
              placeholder="Enter Tax Value"
            />
          </div>
        </div>



        <div className="row mb-3">
          <div className="col-md-4">
            <label className="form-label">CGST:</label>
            <input
              type="number"
              name="cgst"
              className="form-control"
              value={formData.cgst}
              onChange={handleChange}
              placeholder="Enter CGST"
            />
          </div>
          <div className="col-md-4">
            <label className="form-label">SGST:</label>
            <input
              type="number"
              name="sgst"
              className="form-control"
              value={formData.sgst}
              onChange={handleChange}
              placeholder="Enter SGST"
            />
          </div>
          <div className="col-md-4">
            <label className="form-label">IGST:</label>
            <input
              type="number"
              name="igst"
              className="form-control"
              value={formData.igst}
              onChange={handleChange}
              placeholder="Enter IGST"
            />
          </div>
        </div>

        <div className="row mb-3">
          <div className="col-md-6">
            <label className="form-label">Tax Product Group: <span className="text-danger">*</span></label>
            <select
              name="taxProductGroup"
              className="form-select"
              value={formData.taxProductGroup}
              onChange={handleChange}
            >
              <option value="">Tax Product Group</option>
            </select>
          </div>
        </div>

        <div className="row mb-3">
          <div className="col-md-6">
            <div className="form-check">
              <input
                type="checkbox"
                name="includeInRate"
                className="form-check-input"
                checked={formData.includeInRate}
                onChange={handleChange}
              />
              <label className="form-check-label">Include In Rate:</label>
            </div>
          </div>
          <div className="col-md-6">
            <div className="form-check">
              <input
                type="checkbox"
                name="isActive"
                className="form-check-input"
                checked={formData.isActive}
                onChange={handleChange}
              />
              <label className="form-check-label">Active:</label>
            </div>
          </div>
        </div>



        <div className="d-flex justify-content-end">
          <button
            className="btn me-2"
            style={{ backgroundColor: '#28a745', borderColor: '#28a745', color: 'white' }}
            onClick={handleAdd}
          >
            Create
          </button>
          <button
            className="btn"
            style={{ backgroundColor: '#dc3545', borderColor: '#dc3545', color: 'white' }}
            onClick={onHide}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Edit Tax Configuration Modal
const EditTaxConfigurationModal: React.FC<ModalProps> = ({ show, onHide, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    taxName: initialData?.taxName || '',
    type: initialData?.type || '',
    taxProductGroup: initialData?.taxProductGroup || '',
    brandName: initialData?.brandName || '',
    taxPercentage: initialData?.taxPercentage || 0,
    isActive: initialData?.isActive || false,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        taxName: initialData.taxName,
        type: initialData.type,
        taxProductGroup: initialData.taxProductGroup,
        brandName: initialData.brandName,
        taxPercentage: initialData.taxPercentage,
        isActive: initialData.isActive,
      });
    }
  }, [initialData]);

  if (!show || !initialData) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value,
    }));
  };

  const handleEdit = () => {
    onSubmit(formData);
    onHide();
  };

  return (
    <div className="modal" style={{ display: 'block', background: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      <div className="modal-content" style={{ background: 'white', padding: '20px', maxWidth: '500px', margin: '100px auto', borderRadius: '8px' }}>
        <h3>Edit Tax Configuration</h3>
        <input
          type="text"
          name="taxName"
          className="form-control mb-3"
          value={formData.taxName}
          onChange={handleChange}
          placeholder="Tax Name"
        />
        <input
          type="text"
          name="type"
          className="form-control mb-3"
          value={formData.type}
          onChange={handleChange}
          placeholder="Type"
        />
        <input
          type="text"
          name="taxProductGroup"
          className="form-control mb-3"
          value={formData.taxProductGroup}
          onChange={handleChange}
          placeholder="Tax Product Group"
        />
        <input
          type="text"
          name="brandName"
          className="form-control mb-3"
          value={formData.brandName}
          onChange={handleChange}
          placeholder="Brand Name"
        />
        <input
          type="number"
          name="taxPercentage"
          className="form-control mb-3"
          value={formData.taxPercentage}
          onChange={handleChange}
          placeholder="Tax Percentage"
        />
        <div className="form-check mb-3">
          <input
            type="checkbox"
            name="isActive"
            className="form-check-input"
            checked={formData.isActive}
            onChange={handleChange}
          />
          <label className="form-check-label">Active</label>
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

const TaxConfigurationPage: React.FC = () => {
  const [taxConfigurations, setTaxConfigurations] = useState<TaxConfiguration[]>([]);
  const [filteredTaxConfigurations, setFilteredTaxConfigurations] = useState<TaxConfiguration[]>([]);
  const [selectedTaxConfig, setSelectedTaxConfig] = useState<TaxConfiguration | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const columns = useMemo<ColumnDef<TaxConfiguration>[]>(
    () => {
      const columnWidth = 120;
      return [
        {
          id: 'actions',
          header: 'Action',
          size: columnWidth,
          cell: ({ row }) => (
            <div className="d-flex gap-2">
              <button
                className="btn btn-sm"
                style={{ backgroundColor: '#2E8B57', borderColor: '#2E8B57', padding: '4px 8px' }}
                onClick={() => {
                  setSelectedTaxConfig(row.original);
                  setShowEditModal(true);
                }}
              >
                <i className="fi fi-rr-edit" style={{ color: 'white' }}></i>
              </button>
              <button
                className="btn btn-sm btn-danger"
                style={{ padding: '4px 8px' }}
                onClick={() => handleDelete(row.original)}
              >
                <i className="fi fi-rr-trash"></i>
              </button>
            </div>
          ),
        },
        {
          accessorKey: 'id',
          header: 'Sr. No.',
          size: columnWidth,
          cell: ({ getValue }) => <span>{getValue<string>()}</span>,
        },
        {
          accessorKey: 'taxName',
          header: 'Tax Name',
          size: columnWidth,
          cell: ({ getValue }) => <span>{getValue<string>()}</span>,
        },
        {
          accessorKey: 'type',
          header: 'Type',
          size: columnWidth,
          cell: ({ getValue }) => <span>{getValue<string>()}</span>,
        },
        {
          accessorKey: 'taxProductGroup',
          header: 'Tax Product Group',
          size: columnWidth,
          cell: ({ getValue }) => <span>{getValue<string>()}</span>,
        },
        {
          accessorKey: 'brandName',
          header: 'Brand Name',
          size: columnWidth,
          cell: ({ getValue }) => <span>{getValue<string>()}</span>,
        },
        {
          accessorKey: 'taxPercentage',
          header: 'Tax Percentage',
          size: columnWidth,
          cell: ({ getValue }) => <span>{getValue<number>()}%</span>,
        },
        {
          accessorKey: 'isActive',
          header: 'Active',
          size: columnWidth,
          cell: ({ getValue }) => (
            <span className={`badge bg-${getValue<boolean>() ? 'success' : 'danger'}`}>
              {getValue<boolean>() ? 'Yes' : 'No'}
            </span>
          ),
        },
      ];
    },
    []
  );

  const table = useReactTable({
    data: filteredTaxConfigurations,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const handleAdd = useCallback((data: Omit<TaxConfiguration, 'id'>) => {
    const newTaxConfig: TaxConfiguration = {
      id: (taxConfigurations.length + 1).toString(),
      ...data,
    };
    const updatedTaxConfigs = [...taxConfigurations, newTaxConfig];
    setTaxConfigurations(updatedTaxConfigs);
    setFilteredTaxConfigurations(updatedTaxConfigs);
    toast.success('Tax Configuration added successfully');
  }, [taxConfigurations]);

  const handleEdit = useCallback((data: Omit<TaxConfiguration, 'id'>) => {
    if (!selectedTaxConfig) return;
    const updatedTaxConfigs = taxConfigurations.map((item) =>
      item.id === selectedTaxConfig.id ? { ...item, ...data } : item
    );
    setTaxConfigurations(updatedTaxConfigs);
    setFilteredTaxConfigurations(updatedTaxConfigs);
    setSelectedTaxConfig({ ...selectedTaxConfig, ...data });
    toast.success('Tax Configuration updated successfully');
  }, [taxConfigurations, selectedTaxConfig]);

  const handleDelete = useCallback((taxConfig: TaxConfiguration) => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to recover this tax configuration!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3E97FF',
      confirmButtonText: 'Yes, delete it!',
    }).then((result) => {
      if (result.isConfirmed) {
        setIsLoading(true);
        setTimeout(() => {
          const updatedTaxConfigs = taxConfigurations.filter((item) => item.id !== taxConfig.id);
          setTaxConfigurations(updatedTaxConfigs);
          setFilteredTaxConfigurations(updatedTaxConfigs);
          if (selectedTaxConfig?.id === taxConfig.id) {
            setSelectedTaxConfig(null);
          }
          setIsLoading(false);
          toast.success('Tax Configuration deleted successfully');
        }, 1500);
      }
    });
  }, [taxConfigurations, selectedTaxConfig]);

  return (
    <>
      <TitleHelmet title="Tax Configurations" />
      <Card className="m-1">
        <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
          <h4 className="mb-0">
            <i className="bi bi-grid-fill me-2" />Tax Configuration
          </h4>
          <Button
            style={{ backgroundColor: '#4682B4', borderColor: '#4682B4' }}
            onClick={() => setShowAddModal(true)}
          >
            <i className="bi bi-plus" /> Add New
          </Button>
        </div>
        <div className="p-3">
          {isLoading ? (
            <div className="d-flex align-items-center justify-content-center h-100">
              <Preloader />
            </div>
          ) : (
            <div style={{ width: '100%', overflowX: 'auto' }}>
              <Table responsive className="mb-0" style={{ tableLayout: 'fixed', width: '100%' }}>
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          style={{
                            width: `${header.column.columnDef.size}px`,
                            whiteSpace: 'nowrap',
                            padding: '8px 12px',
                            textAlign: 'left',
                            boxSizing: 'border-box',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} style={{ textAlign: 'left', padding: '8px' }}>
                        No Data Found
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <tr key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <td
                            key={cell.id}
                            style={{
                              whiteSpace: 'normal',
                              padding: '8px 12px',
                              textAlign: 'left',
                            }}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          )}
        </div>
      </Card>
      <AddTaxConfigurationModal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        onSubmit={handleAdd}
      />
      <EditTaxConfigurationModal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        onSubmit={handleEdit}
        initialData={selectedTaxConfig}
      />
    </>
  );
};

export default TaxConfigurationPage;