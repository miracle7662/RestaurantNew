import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FaPlus,
  FaFileImport,
  FaFileExport,
  FaSearch,
  FaEdit,
  FaTrashAlt,
  FaEye,
  FaBoxes,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
} from 'react-icons/fa';
import ProductMasterModal from './ProductMasterModal';
import ProductService, { Product, ProductPayload, ProductCategory, ProductBrand } from '../../../../common/store/products';
import { useAuthContext } from '@/common/context/useAuthContext';
import { toast } from 'react-toastify';

// ---------- Main Component ----------
const ProductMaster: React.FC = () => {
  const { user } = useAuthContext();
  const hotelId = user?.hotelid ?? 1;
  const outletId = user?.outletid ?? 1;
  const userId = user?.id ?? 1;

  // Warn if using fallback
  useEffect(() => {
    if (!user) {
      console.warn('⚠️ User not loaded, using fallback hotel/outlet IDs = 1');
    }
  }, [user]);

  // ---------- State ----------
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [brands, setBrands] = useState<ProductBrand[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & pagination state...
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterItemType, setFilterItemType] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(5);
  const [sortColumn, setSortColumn] = useState<string>('itemid');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Modal & Drawer state...
  const [modalShow, setModalShow] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewDrawerOpen, setViewDrawerOpen] = useState<boolean>(false);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    destructive?: boolean;
  }>({ open: false, title: '', message: '', onConfirm: () => {} });

  // ---------- Data Fetching ----------
  const fetchData = useCallback(async () => {
    if (!hotelId || !outletId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);

      console.log('📡 Fetching data for hotel:', hotelId, 'outlet:', outletId);

      const [productRes, catRes, brandRes] = await Promise.all([
        ProductService.list({ hotelid: hotelId, outletid: outletId }),
        ProductService.getCategories({ hotelid: hotelId, outletid: outletId }),
        ProductService.getBrands({ hotelid: hotelId, outletid: outletId }),
      ]);

      console.log('📦 Products:', productRes);
      console.log('📦 Categories:', catRes);
      console.log('📦 Brands:', brandRes);

      // Products
      if (productRes.success) {
        setProducts(productRes.data || []);
      } else {
        setError(productRes.message || 'Failed to load products');
        toast.error(productRes.message || 'Failed to load products');
      }

      // Categories
      if (catRes.success) {
        setCategories(catRes.data || []);
        if (!catRes.data || catRes.data.length === 0) {
          console.warn('⚠️ No categories returned from API');
          toast.info('No categories found. Please add some categories first.');
        }
      } else {
        console.error('❌ Failed to load categories:', catRes.message);
        toast.error('Failed to load categories: ' + (catRes.message || ''));
      }

      // Brands
      if (brandRes.success) {
        setBrands(brandRes.data || []);
        if (!brandRes.data || brandRes.data.length === 0) {
          console.warn('⚠️ No brands returned from API');
        }
      } else {
        console.error('❌ Failed to load brands:', brandRes.message);
      }
    } catch (err: any) {
      console.error('🔥 fetchData error:', err);
      setError('An unexpected error occurred while fetching data.');
      toast.error('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [hotelId, outletId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ---------- Computed (filtering, sorting, pagination) ----------
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.item_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.barcode && p.barcode.includes(searchTerm));
      const matchesCategory = filterCategory === 'All' || p.category_name === filterCategory;
      const matchesType = filterItemType === 'All' || p.item_type === filterItemType;
      const matchesStatus =
        filterStatus === 'All' ||
        (filterStatus === 'Active' && p.status === 1) ||
        (filterStatus === 'Inactive' && p.status === 0);
      return matchesSearch && matchesCategory && matchesType && matchesStatus;
    });
  }, [products, searchTerm, filterCategory, filterItemType, filterStatus]);

  const totalPages = Math.ceil(filteredProducts.length / pageSize);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  const sortedProducts = useMemo(() => {
    const sorted = [...paginatedProducts];
    sorted.sort((a, b) => {
      const aVal = a[sortColumn as keyof Product] ?? '';
      const bVal = b[sortColumn as keyof Product] ?? '';
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [paginatedProducts, sortColumn, sortDirection]);

  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.status === 1).length;
  const inactiveProducts = products.filter((p) => p.status === 0).length;
  const lowStockProducts = products.filter(
    (p) => p.is_stock_item && p.minimum_stock > 0 && p.reorder_level > 0
  ).length;

  // ---------- Handlers ----------
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleReset = () => {
    setSearchTerm('');
    setFilterCategory('All');
    setFilterItemType('All');
    setFilterStatus('All');
    setCurrentPage(1);
  };

  const openAddModal = () => {
    setModalMode('add');
    setEditingProduct(null);
    setModalShow(true);
  };

  const openEditModal = (product: Product) => {
    setModalMode('edit');
    setEditingProduct(product);
    setModalShow(true);
  };

  const handleSaveProduct = async (payload: ProductPayload) => {
    console.log('📦 Sending payload:', JSON.stringify(payload, null, 2));
    try {
      if (modalMode === 'add') {
        const res = await ProductService.create(payload);
        if (res.success) {
          toast.success('Product added successfully');
          await fetchData();
          setModalShow(false);
        } else {
          toast.error(res.message || 'Failed to add product');
        }
      } else {
        if (!editingProduct) return;
        const res = await ProductService.update(editingProduct.itemid, payload);
        if (res.success) {
          toast.success('Product updated successfully');
          await fetchData();
          setModalShow(false);
        } else {
          toast.error(res.message || 'Failed to update product');
        }
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
    }
  };

  const handleDeactivate = (product: Product) => {
    setConfirmModal({
      open: true,
      title: 'Deactivate Product',
      message: `Are you sure you want to deactivate "${product.item_name}"?`,
      destructive: false,
      onConfirm: async () => {
        try {
          const res = await ProductService.remove(product.itemid, {
            hotelid: hotelId,
            outletid: outletId,
            updatedby: userId,
          });
          if (res.success) {
            toast.info('Product deactivated');
            await fetchData();
          } else {
            toast.error(res.message || 'Failed to deactivate product');
          }
        } catch (err) {
          toast.error('An unexpected error occurred');
        }
        setConfirmModal({ ...confirmModal, open: false });
      },
    });
  };

  const openViewDrawer = (product: Product) => {
    setViewProduct(product);
    setViewDrawerOpen(true);
  };
  const closeViewDrawer = () => {
    setViewDrawerOpen(false);
    setViewProduct(null);
  };

  // ---------- Render Helpers ----------
  const renderStatusBadge = (status: number) => (
    <span className={`badge ${status === 1 ? 'bg-success' : 'bg-danger'} text-white`}>
      {status === 1 ? 'Active' : 'Inactive'}
    </span>
  );

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    return (
      <div className="d-flex justify-content-end align-items-center gap-2 mt-3">
        <button
          className="btn btn-outline-secondary btn-sm"
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span className="text-muted">Page {currentPage} of {totalPages}</span>
        <button
          className="btn btn-outline-secondary btn-sm"
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    );
  };

  // ---------- JSX ----------
  return (
    <div className="container-fluid py-4">
      {/* Confirm Modal – unchanged */}
      {confirmModal.open && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{confirmModal.title}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setConfirmModal({ ...confirmModal, open: false })}
                />
              </div>
              <div className="modal-body">{confirmModal.message}</div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setConfirmModal({ ...confirmModal, open: false })}
                >
                  Cancel
                </button>
                <button
                  className={`btn ${confirmModal.destructive ? 'btn-danger' : 'btn-primary'}`}
                  onClick={confirmModal.onConfirm}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="d-flex flex-wrap align-items-start justify-content-between mb-4">
        <div>
          <h1 className="display-6 fw-bold">Product Master</h1>
          <p className="text-muted">Manage products, categories, units and purchasing information</p>
        </div>
        <div className="d-flex gap-2 mt-2 mt-sm-0">
          <button className="btn btn-primary d-flex align-items-center gap-1" onClick={openAddModal}>
            <FaPlus /> Add Product
          </button>
          <button className="btn btn-outline-secondary d-flex align-items-center gap-1">
            <FaFileImport /> Import
          </button>
          <button className="btn btn-outline-secondary d-flex align-items-center gap-1">
            <FaFileExport /> Export
          </button>
        </div>
      </div>

      {/* Summary Cards – unchanged */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-sm-3">
          <div className="card h-100 shadow-sm">
            <div className="card-body d-flex align-items-center gap-3">
              <div className="bg-primary bg-opacity-10 p-3 rounded-circle text-primary">
                <FaBoxes size={24} />
              </div>
              <div>
                <div className="display-6 fw-bold">{totalProducts}</div>
                <div className="text-muted small">Total Products</div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-6 col-sm-3">
          <div className="card h-100 shadow-sm">
            <div className="card-body d-flex align-items-center gap-3">
              <div className="bg-success bg-opacity-10 p-3 rounded-circle text-success">
                <FaCheckCircle size={24} />
              </div>
              <div>
                <div className="display-6 fw-bold">{activeProducts}</div>
                <div className="text-muted small">Active Products</div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-6 col-sm-3">
          <div className="card h-100 shadow-sm">
            <div className="card-body d-flex align-items-center gap-3">
              <div className="bg-danger bg-opacity-10 p-3 rounded-circle text-danger">
                <FaTimesCircle size={24} />
              </div>
              <div>
                <div className="display-6 fw-bold">{inactiveProducts}</div>
                <div className="text-muted small">Inactive Products</div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-6 col-sm-3">
          <div className="card h-100 shadow-sm">
            <div className="card-body d-flex align-items-center gap-3">
              <div className="bg-warning bg-opacity-10 p-3 rounded-circle text-warning">
                <FaExclamationTriangle size={24} />
              </div>
              <div>
                <div className="display-6 fw-bold">{lowStockProducts}</div>
                <div className="text-muted small">Low Stock</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar – categories dropdown now populated */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-2 align-items-end">
            <div className="col-12 col-sm-6 col-md-3">
              <label className="form-label mb-0 small fw-bold">Search</label>
              <div className="input-group">
                <span className="input-group-text bg-white"><FaSearch /></span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Code / Name / Barcode"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-6 col-sm-3 col-md-2">
              <label className="form-label mb-0 small fw-bold">Category</label>
              <select
                className="form-select form-select-sm"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option>All</option>
                {categories.map((cat) => (
                  <option key={cat.categoryid} value={cat.category_name}>
                    {cat.category_name}
                  </option>
                ))}
              </select>
              {categories.length === 0 && !loading && (
                <small className="text-muted">No categories available</small>
              )}
            </div>
            <div className="col-6 col-sm-3 col-md-2">
              <label className="form-label mb-0 small fw-bold">Item Type</label>
              <select
                className="form-select form-select-sm"
                value={filterItemType}
                onChange={(e) => setFilterItemType(e.target.value)}
              >
                <option>All</option>
                <option>RAW_MATERIAL</option>
                <option>FINISHED_GOOD</option>
                <option>CONSUMABLE</option>
                <option>AMENITY</option>
                <option>CLEANING_ITEM</option>
                <option>LINEN</option>
                <option>ASSET</option>
                <option>OTHER</option>
              </select>
            </div>
            <div className="col-6 col-sm-2 col-md-1">
              <label className="form-label mb-0 small fw-bold">Status</label>
              <select
                className="form-select form-select-sm"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option>All</option>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
            <div className="col-12 col-sm-6 col-md-2 d-flex gap-2">
              <button className="btn btn-primary btn-sm w-100" onClick={() => setCurrentPage(1)}>
                Search
              </button>
              <button className="btn btn-outline-secondary btn-sm w-100" onClick={handleReset}>
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table – unchanged */}
      <div className="card shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <div className="p-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="placeholder-glow mb-2">
                  <span className="placeholder col-12" style={{ height: '2rem' }}></span>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-5 text-danger">
              <FaExclamationTriangle size={40} />
              <p className="mt-2">{error}</p>
              <button className="btn btn-primary mt-2" onClick={fetchData}>
                Retry
              </button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-5">
              <FaSearch className="text-muted mb-3" size={40} />
              <p className="text-muted">No products found. Try adjusting your filters.</p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover table-striped mb-0">
                  <thead className="table-light">
                    <tr>
                      <th onClick={() => handleSort('itemid')} style={{ cursor: 'pointer' }}>
                        # {sortColumn === 'itemid' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th onClick={() => handleSort('item_code')} style={{ cursor: 'pointer' }}>
                        Item Code {sortColumn === 'item_code' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th onClick={() => handleSort('item_name')} style={{ cursor: 'pointer' }}>
                        Item Name {sortColumn === 'item_name' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th onClick={() => handleSort('category_name')} style={{ cursor: 'pointer' }}>
                        Category {sortColumn === 'category_name' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th onClick={() => handleSort('item_type')} style={{ cursor: 'pointer' }}>
                        Item Type {sortColumn === 'item_type' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th onClick={() => handleSort('unit_name')} style={{ cursor: 'pointer' }}>
                        Unit {sortColumn === 'unit_name' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th onClick={() => handleSort('purchase_rate')} style={{ cursor: 'pointer' }}>
                        Purchase Rate {sortColumn === 'purchase_rate' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th onClick={() => handleSort('gst_percent')} style={{ cursor: 'pointer' }}>
                        GST % {sortColumn === 'gst_percent' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>
                        Status {sortColumn === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedProducts.map((product) => (
                      <tr key={product.itemid}>
                        <td>{product.itemid}</td>
                        <td className="fw-bold">{product.item_code}</td>
                        <td>{product.item_name}</td>
                        <td>{product.category_name}</td>
                        <td>{product.item_type}</td>
                        <td>{product.unit_name}</td>
                        <td>₹{(Number(product.purchase_rate) || 0).toFixed(2)}</td>
                        <td>{Number(product.gst_percent) || 0}%</td>
                        <td>{renderStatusBadge(product.status)}</td>
                        <td>
                          <div className="d-flex gap-1 align-items-center">
                            <button
                              className="btn btn-sm btn-outline-info"
                              title="View"
                              onClick={() => openViewDrawer(product)}
                            >
                              <FaEye />
                            </button>
                            <button
                              className="btn btn-sm btn-outline-primary"
                              title="Edit"
                              onClick={() => openEditModal(product)}
                            >
                              <FaEdit />
                            </button>
                            {product.status === 1 && (
                              <button
                                className="btn btn-sm btn-outline-warning"
                                title="Deactivate"
                                onClick={() => handleDeactivate(product)}
                              >
                                <FaTimesCircle />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {renderPagination()}
            </>
          )}
        </div>
      </div>

      {/* ====== Modal ====== */}
      <ProductMasterModal
        show={modalShow}
        onHide={() => setModalShow(false)}
        onSave={handleSaveProduct}
        initialData={editingProduct}
        mode={modalMode}
        categories={categories}
        brands={brands}
        hotelid={hotelId}
        outletid={outletId}
        createdby={userId}
        updatedby={userId}
      />

      {/* ====== View Drawer ====== */}
      <div
        className={`offcanvas offcanvas-end ${viewDrawerOpen ? 'show' : ''}`}
        tabIndex={-1}
        style={{ visibility: viewDrawerOpen ? 'visible' : 'hidden', width: '40%' }}
      >
        <div className="offcanvas-header border-bottom">
          <h5 className="offcanvas-title">Product Details</h5>
          <button type="button" className="btn-close" onClick={closeViewDrawer}></button>
        </div>
        <div className="offcanvas-body">
          {viewProduct && (
            <>
              <div className="row g-2">
                <div className="col-6"><strong>Item Code:</strong> {viewProduct.item_code}</div>
                <div className="col-6"><strong>Item Name:</strong> {viewProduct.item_name}</div>
                <div className="col-6"><strong>Barcode:</strong> {viewProduct.barcode || 'N/A'}</div>
                <div className="col-6"><strong>Category:</strong> {viewProduct.category_name}</div>
                <div className="col-6"><strong>Item Type:</strong> {viewProduct.item_type}</div>
                <div className="col-6"><strong>Status:</strong> {renderStatusBadge(viewProduct.status)}</div>
                <div className="col-6"><strong>Unit:</strong> {viewProduct.unit_name}</div>
                <div className="col-6"><strong>Purchase Rate:</strong> ₹{(Number(viewProduct.purchase_rate) || 0).toFixed(2)}</div>
                <div className="col-6"><strong>Average Rate:</strong> ₹{(Number(viewProduct.average_rate) || 0).toFixed(2)}</div>
                <div className="col-6"><strong>MRP:</strong> ₹{(Number(viewProduct.mrp) || 0).toFixed(2)}</div>
                <div className="col-6"><strong>GST %:</strong> {Number(viewProduct.gst_percent) || 0}%</div>
                <div className="col-6"><strong>HSN/SAC:</strong> {viewProduct.hsn_sac_code || 'N/A'}</div>
                <div className="col-6"><strong>Reorder Level:</strong> {viewProduct.reorder_level}</div>
                <div className="col-6"><strong>Min Stock:</strong> {viewProduct.minimum_stock}</div>
                <div className="col-6"><strong>Max Stock:</strong> {viewProduct.maximum_stock}</div>
              </div>
              <hr />
              <h6 className="fw-bold">Flags</h6>
              <div className="row g-2">
                <div className="col-6">Stock Item: {viewProduct.is_stock_item ? 'Yes' : 'No'}</div>
                <div className="col-6">Purchase Item: {viewProduct.is_purchase_item ? 'Yes' : 'No'}</div>
                <div className="col-6">Sale Item: {viewProduct.is_sale_item ? 'Yes' : 'No'}</div>
                <div className="col-6">Housekeeping: {viewProduct.is_housekeeping_item ? 'Yes' : 'No'}</div>
                <div className="col-6">Restaurant: {viewProduct.is_restaurant_item ? 'Yes' : 'No'}</div>
                <div className="col-6">Bar: {viewProduct.is_bar_item ? 'Yes' : 'No'}</div>
                <div className="col-6">Recipe: {viewProduct.is_recipe_item ? 'Yes' : 'No'}</div>
                <div className="col-6">Allow Negative Stock: {viewProduct.allow_negative_stock ? 'Yes' : 'No'}</div>
              </div>
            </>
          )}
        </div>
      </div>
      {viewDrawerOpen && (
        <div
          className="offcanvas-backdrop show"
          style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9998 }}
          onClick={closeViewDrawer}
        />
      )}
    </div>
  );
};

export default ProductMaster;