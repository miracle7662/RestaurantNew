import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  FaInfoCircle,
  FaStore,
  FaTruck,
  FaCog,
} from 'react-icons/fa';
import { Product, ProductPayload, ProductCategory, ProductBrand } from '../../../../common/store/products';
import { toast } from 'react-toastify';

interface ProductModalProps {
  show: boolean;
  onHide: () => void;
  onSave: (payload: ProductPayload) => void;
  initialData?: Product | null;
  mode: 'add' | 'edit';
  categories: ProductCategory[];
  brands: ProductBrand[];
  hotelid: number | undefined;
  outletid: number | undefined;
  createdby?: number;
  updatedby?: number;
}

const ProductMasterModal: React.FC<ProductModalProps> = ({
  show,
  onHide,
  onSave,
  initialData,
  mode,
  categories,
  brands,
  hotelid,
  outletid,
  createdby,
  updatedby,
}) => {
  const [formData, setFormData] = useState<Partial<ProductPayload>>({
    hotelid,
    outletid,
    item_type: 'RAW_MATERIAL',
    categoryid: undefined,
    unitid: undefined,
    brandid: null,
    is_stock_item: 1,
    is_purchase_item: 1,
    is_sale_item: 0,
    is_housekeeping_item: 0,
    is_restaurant_item: 0,
    is_bar_item: 0,
    is_recipe_item: 0,
    allow_negative_stock: 0,
    status: 1,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    document.body.style.overflow = show ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [show]);

  useEffect(() => {
    if (initialData && mode === 'edit') {
      setFormData({
        ...initialData,
        hotelid,
        outletid,
        createdby,
        updatedby,
        categoryid: initialData.categoryid,
        unitid: initialData.unitid,
        brandid: initialData.brandid,
      });
    } else {
      setFormData({
        hotelid,
        outletid,
        item_type: 'RAW_MATERIAL',
        categoryid: undefined,
        unitid: undefined,
        brandid: null,
        is_stock_item: 1,
        is_purchase_item: 1,
        is_sale_item: 0,
        is_housekeeping_item: 0,
        is_restaurant_item: 0,
        is_bar_item: 0,
        is_recipe_item: 0,
        allow_negative_stock: 0,
        status: 1,
      });
    }
    setFormErrors({});
    setSaving(false);
  }, [initialData, mode, show, hotelid, outletid, createdby, updatedby]);

  const handleChange = (field: keyof ProductPayload, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.item_code?.trim()) errors.item_code = 'Item Code is required';
    if (!formData.item_name?.trim()) errors.item_name = 'Item Name is required';
    if (!formData.categoryid || formData.categoryid <= 0) errors.categoryid = 'Category is required';
    if (!formData.item_type) errors.item_type = 'Item Type is required';
    if (!formData.unitid || formData.unitid <= 0) errors.unitid = 'Unit is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (!hotelid || hotelid <= 0) {
      toast.error('Hotel ID is missing');
      return;
    }
    if (!outletid || outletid <= 0) {
      toast.error('Outlet ID is missing');
      return;
    }
    if (!validate()) return;
    setSaving(true);

    const toNumber = (val: any): number => {
      if (val === undefined || val === null || val === '') return 0;
      const num = Number(val);
      return isNaN(num) ? 0 : num;
    };

    const payload: ProductPayload = {
      hotelid: hotelid,
      outletid: outletid,
      item_code: (formData.item_code || '').trim(),
      barcode: formData.barcode || null,
      item_name: (formData.item_name || '').trim(),
      short_name: formData.short_name || null,
      categoryid: toNumber(formData.categoryid),
      brandid: formData.brandid ? toNumber(formData.brandid) : null,
      item_type: formData.item_type || 'RAW_MATERIAL',
      unitid: toNumber(formData.unitid),
      purchase_rate: toNumber(formData.purchase_rate),
      average_rate: toNumber(formData.average_rate),
      mrp: toNumber(formData.mrp),
      is_stock_item: formData.is_stock_item ? 1 : 0,
      is_purchase_item: formData.is_purchase_item ? 1 : 0,
      is_sale_item: formData.is_sale_item ? 1 : 0,
      is_housekeeping_item: formData.is_housekeeping_item ? 1 : 0,
      is_restaurant_item: formData.is_restaurant_item ? 1 : 0,
      is_bar_item: formData.is_bar_item ? 1 : 0,
      is_recipe_item: formData.is_recipe_item ? 1 : 0,
      allow_negative_stock: formData.allow_negative_stock ? 1 : 0,
      gst_percent: toNumber(formData.gst_percent),
      hsn_sac_code: formData.hsn_sac_code || null,
      reorder_level: toNumber(formData.reorder_level),
      minimum_stock: toNumber(formData.minimum_stock),
      maximum_stock: toNumber(formData.maximum_stock),
      status: formData.status ? 1 : 0,
      createdby: createdby || 0,
      updatedby: updatedby || 0,
    };

    if (mode === 'edit' && initialData) {
      payload.itemid = initialData.itemid;
    }

    console.log('📤 Sending payload:', payload);
    onSave(payload);
  };

  if (!show) return null;

  return createPortal(
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(7px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onHide();
      }}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg" style={{ maxWidth: '900px', width: '95%', margin: '1.75rem auto', pointerEvents: 'none' }}>
        <div className="modal-content" style={{ pointerEvents: 'auto', borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', backgroundColor: '#fff', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <div className="modal-header" style={{ borderBottom: '1px solid #dee2e6', padding: '1rem 1.5rem', flexShrink: 0 }}>
            <h5 className="modal-title fw-bold">{mode === 'add' ? 'Add Product' : 'Edit Product'}</h5>
            <button type="button" className="btn-close" onClick={onHide} disabled={saving} />
          </div>

          {/* Body */}
          <div className="modal-body" style={{ padding: '1.5rem', overflowY: 'auto', flex: '1 1 auto' }}>
            {/* Basic Information */}
            <h6 className="fw-bold mt-0 mb-3"><FaInfoCircle className="me-2" /> Basic Information</h6>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label fw-semibold">Item Code <span className="text-danger">*</span></label>
                <input type="text" className={`form-control ${formErrors.item_code ? 'is-invalid' : ''}`} value={formData.item_code || ''} onChange={(e) => handleChange('item_code', e.target.value)} placeholder="e.g., PRD-001" disabled={saving} />
                {formErrors.item_code && <div className="invalid-feedback d-block">{formErrors.item_code}</div>}
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold">Item Name <span className="text-danger">*</span></label>
                <input type="text" className={`form-control ${formErrors.item_name ? 'is-invalid' : ''}`} value={formData.item_name || ''} onChange={(e) => handleChange('item_name', e.target.value)} placeholder="Product name" disabled={saving} />
                {formErrors.item_name && <div className="invalid-feedback d-block">{formErrors.item_name}</div>}
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold">Short Name</label>
                <input type="text" className="form-control" value={formData.short_name || ''} onChange={(e) => handleChange('short_name', e.target.value)} placeholder="Short name" disabled={saving} />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold">Barcode</label>
                <input type="text" className="form-control" value={formData.barcode || ''} onChange={(e) => handleChange('barcode', e.target.value)} placeholder="Barcode" disabled={saving} />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold">Category <span className="text-danger">*</span></label>
                <select className={`form-select ${formErrors.categoryid ? 'is-invalid' : ''}`} value={formData.categoryid || ''} onChange={(e) => handleChange('categoryid', Number(e.target.value))} disabled={saving}>
                  <option value="">Select</option>
                  {categories.map((cat) => (
                    <option key={cat.categoryid} value={cat.categoryid}>{cat.category_name}</option>
                  ))}
                </select>
                {formErrors.categoryid && <div className="invalid-feedback d-block">{formErrors.categoryid}</div>}
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold">Brand</label>
                <select className="form-select" value={formData.brandid || ''} onChange={(e) => handleChange('brandid', e.target.value ? Number(e.target.value) : null)} disabled={saving}>
                  <option value="">Select</option>
                  {brands.map((b) => (
                    <option key={b.brandid} value={b.brandid}>{b.brand_name}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold">Item Type <span className="text-danger">*</span></label>
                <select className={`form-select ${formErrors.item_type ? 'is-invalid' : ''}`} value={formData.item_type || 'RAW_MATERIAL'} onChange={(e) => handleChange('item_type', e.target.value)} disabled={saving}>
                  <option value="RAW_MATERIAL">Raw Material</option>
                  <option value="FINISHED_GOOD">Finished Good</option>
                  <option value="CONSUMABLE">Consumable</option>
                  <option value="AMENITY">Amenity</option>
                  <option value="CLEANING_ITEM">Cleaning Item</option>
                  <option value="LINEN">Linen</option>
                  <option value="ASSET">Asset</option>
                  <option value="OTHER">Other</option>
                </select>
                {formErrors.item_type && <div className="invalid-feedback d-block">{formErrors.item_type}</div>}
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold">Unit <span className="text-danger">*</span></label>
                <select className={`form-select ${formErrors.unitid ? 'is-invalid' : ''}`} value={formData.unitid || ''} onChange={(e) => handleChange('unitid', Number(e.target.value))} disabled={saving}>
                  <option value="">Select</option>
                  {/* No dummy units; we'll need a separate service or fallback – 
                      you can add a UnitService or provide a static list if needed */}
                </select>
                {formErrors.unitid && <div className="invalid-feedback d-block">{formErrors.unitid}</div>}
              </div>
            </div>

            {/* Purchase & Pricing */}
            <h6 className="fw-bold mt-4 mb-3"><FaTruck className="me-2" /> Purchase & Pricing</h6>
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label fw-semibold">Purchase Rate</label>
                <input type="number" className="form-control" value={formData.purchase_rate || ''} onChange={(e) => handleChange('purchase_rate', parseFloat(e.target.value) || 0)} placeholder="0.00" disabled={saving} />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold">Average Rate</label>
                <input type="number" className="form-control" value={formData.average_rate || ''} onChange={(e) => handleChange('average_rate', parseFloat(e.target.value) || 0)} placeholder="0.00" disabled={saving} />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold">MRP</label>
                <input type="number" className="form-control" value={formData.mrp || ''} onChange={(e) => handleChange('mrp', parseFloat(e.target.value) || 0)} placeholder="0.00" disabled={saving} />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold">GST (%)</label>
                <input type="number" className="form-control" value={formData.gst_percent || ''} onChange={(e) => handleChange('gst_percent', parseFloat(e.target.value) || 0)} placeholder="0.00" disabled={saving} />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold">HSN / SAC</label>
                <input type="text" className="form-control" value={formData.hsn_sac_code || ''} onChange={(e) => handleChange('hsn_sac_code', e.target.value)} placeholder="e.g., 1006" disabled={saving} />
              </div>
            </div>

            {/* Stock Levels */}
            <h6 className="fw-bold mt-4 mb-3"><FaStore className="me-2" /> Stock Levels</h6>
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label fw-semibold">Reorder Level</label>
                <input type="number" className="form-control" value={formData.reorder_level || ''} onChange={(e) => handleChange('reorder_level', parseFloat(e.target.value) || 0)} placeholder="0" disabled={saving} />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold">Minimum Stock</label>
                <input type="number" className="form-control" value={formData.minimum_stock || ''} onChange={(e) => handleChange('minimum_stock', parseFloat(e.target.value) || 0)} placeholder="0" disabled={saving} />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold">Maximum Stock</label>
                <input type="number" className="form-control" value={formData.maximum_stock || ''} onChange={(e) => handleChange('maximum_stock', parseFloat(e.target.value) || 0)} placeholder="0" disabled={saving} />
              </div>
            </div>

            {/* Flags & Settings */}
            <h6 className="fw-bold mt-4 mb-3"><FaCog className="me-2" /> Flags & Settings</h6>
            <div className="row g-2">
              <div className="col-md-4">
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" checked={!!formData.is_stock_item} onChange={(e) => handleChange('is_stock_item', e.target.checked ? 1 : 0)} disabled={saving} />
                  <label className="form-check-label">Stock Item</label>
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" checked={!!formData.is_purchase_item} onChange={(e) => handleChange('is_purchase_item', e.target.checked ? 1 : 0)} disabled={saving} />
                  <label className="form-check-label">Purchase Item</label>
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" checked={!!formData.is_sale_item} onChange={(e) => handleChange('is_sale_item', e.target.checked ? 1 : 0)} disabled={saving} />
                  <label className="form-check-label">Sale Item</label>
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" checked={!!formData.is_housekeeping_item} onChange={(e) => handleChange('is_housekeeping_item', e.target.checked ? 1 : 0)} disabled={saving} />
                  <label className="form-check-label">Housekeeping</label>
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" checked={!!formData.is_restaurant_item} onChange={(e) => handleChange('is_restaurant_item', e.target.checked ? 1 : 0)} disabled={saving} />
                  <label className="form-check-label">Restaurant</label>
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" checked={!!formData.is_bar_item} onChange={(e) => handleChange('is_bar_item', e.target.checked ? 1 : 0)} disabled={saving} />
                  <label className="form-check-label">Bar</label>
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" checked={!!formData.is_recipe_item} onChange={(e) => handleChange('is_recipe_item', e.target.checked ? 1 : 0)} disabled={saving} />
                  <label className="form-check-label">Recipe Item</label>
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" checked={!!formData.allow_negative_stock} onChange={(e) => handleChange('allow_negative_stock', e.target.checked ? 1 : 0)} disabled={saving} />
                  <label className="form-check-label">Allow Negative Stock</label>
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" checked={!!formData.status} onChange={(e) => handleChange('status', e.target.checked ? 1 : 0)} disabled={saving} />
                  <label className="form-check-label">Active</label>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer" style={{ borderTop: '1px solid #dee2e6', padding: '0.75rem 1.5rem', flexShrink: 0 }}>
            <button className="btn btn-secondary" onClick={onHide} disabled={saving}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving && <span className="spinner-border spinner-border-sm me-2" />}
              {mode === 'add' ? 'Add Product' : 'Update Product'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ProductMasterModal;