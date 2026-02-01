import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { fetchKotPrintSettings } from '@/services/outletSettings.service';
import { applyKotSettings } from '@/utils/applyOutletSettings';

interface KotPrintSettings {
  kot_printsetting_id?: number;
  outletid?: number;
  customer_on_kot_dine_in: boolean;
  customer_on_kot_pickup: boolean;
  customer_on_kot_delivery: boolean;
  customer_on_kot_quick_bill: boolean;
  customer_kot_display_option: string;
  group_kot_items_by_category: boolean;
  hide_table_name_quick_bill: boolean;
  show_new_order_tag: boolean;
  new_order_tag_label: string;
  show_running_order_tag: boolean;
  running_order_tag_label: string;
  dine_in_kot_no: string;
  pickup_kot_no: string;
  delivery_kot_no: string;
  quick_bill_kot_no: string;
  modifier_default_option: boolean;
  print_kot_both_languages: boolean;
  show_alternative_item: boolean;
  show_captain_username: boolean;
  show_covers_as_guest: boolean;
  show_item_price: boolean;
  show_kot_no_quick_bill: boolean;
  show_kot_note: boolean;
  show_online_order_otp: boolean;
  show_order_id_quick_bill: boolean;
  show_order_id_online_order: boolean;
  show_order_no_quick_bill_section: boolean;
  show_order_type_symbol: boolean;
  show_store_name: boolean;
  show_terminal_username: boolean;
  show_username: boolean;
  show_waiter: boolean;
}

const KOTPrintSettings: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<KotPrintSettings>({
    customer_on_kot_dine_in: false,
    customer_on_kot_pickup: true,
    customer_on_kot_delivery: true,
    customer_on_kot_quick_bill: true,
    customer_kot_display_option: 'NAME_ONLY',
    group_kot_items_by_category: false,
    hide_table_name_quick_bill: false,
    show_new_order_tag: true,
    new_order_tag_label: 'New',
    show_running_order_tag: true,
    running_order_tag_label: 'Running',
    dine_in_kot_no: 'DIN-',
    pickup_kot_no: 'PUP-',
    delivery_kot_no: 'DEL-',
    quick_bill_kot_no: 'QBL-',
    modifier_default_option: false,
    print_kot_both_languages: false,
    show_alternative_item: false,
    show_captain_username: false,
    show_covers_as_guest: false,
    show_item_price: true,
    show_kot_no_quick_bill: false,
    show_kot_note: true,
    show_online_order_otp: false,
    show_order_id_quick_bill: false,
    show_order_id_online_order: false,
    show_order_no_quick_bill_section: false,
    show_order_type_symbol: true,
    show_store_name: true,
    show_terminal_username: false,
    show_username: false,
    show_waiter: true,
  });

  // Get outlet ID from URL or user context
  const getOutletId = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('outletid') || localStorage.getItem('selectedOutletId');
  };

  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      const outletId = getOutletId();
      if (!outletId) {
        toast.error('No outlet selected');
        return;
      }

      setLoading(true);
      try {
        const data = await fetchKotPrintSettings(Number(outletId));
        if (data) {
          setSettings(data);
        }
      } catch (error) {
        console.error('Failed to load KOT print settings:', error);
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Handle tab navigation
  const handleTabClick = (tab: string) => {
    if (tab !== 'kot-print') {
      navigate('/add-outlet');
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof KotPrintSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  // Handlers for Close and Update buttons
  const handleClose = () => {
    navigate('/add-outlet');
  };

  const handleUpdate = async () => {
    const outletId = getOutletId();
    if (!outletId) {
      toast.error('No outlet selected');
      return;
    }

    setSaving(true);
    try {
      await applyKotSettings(Number(outletId), settings);
      toast.success('KOT print settings updated successfully');
    } catch (error) {
      console.error('Failed to update settings:', error);
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="m-0">
      {/* Header */}
      <h1 className="display-6 fw-bold mb-4">Outlet Level Settings</h1>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4" id="settingsTabs" role="tablist">
        <li className="nav-item" role="presentation">
          <button
            className="nav-link"
            onClick={() => handleTabClick('bill-preview')}
            type="button"
          >
            BILL PREVIEW SETTINGS
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button className="nav-link active" type="button">
            KOT PRINT SETTINGS
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className="nav-link"
            onClick={() => handleTabClick('bill-print')}
            type="button"
          >
            BILL PRINT SETTINGS
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className="nav-link"
            onClick={() => handleTabClick('general')}
            type="button"
          >
            GENERAL SETTINGS
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className="nav-link"
            onClick={() => handleTabClick('online-orders')}
            type="button"
          >
            ONLINE ORDERS SETTINGS
          </button>
        </li>
      </ul>

      {/* KOT Print Settings Content */}
      <div className="card shadow-sm h-100">
        <div className="card-body">
          <h2 className="card-title h5 fw-bold mb-4">KOT Print Settings</h2>

          {/* Header: Search Bar and Status */}
          <div className="row mb-2">
            <div className="col-md-6">
              <div className="d-flex align-items-center mb-3">
                <span className="me-2">#</span>
                <input
                  type="text"
                  className="form-control w-50"
                  placeholder="Search"
                />
              </div>
            </div>
            <div className="col-md-6">
              <div className="ms-3">
                <h6 className="fw-bold mb-3">Status</h6>
              </div>
            </div>
          </div>

          {/* First Row: Customer KOT */}
          <div className="row mb-2">
            <div className="col-md-6">
              <h6 className="fw-bold mb-3">1. Customer KOT</h6>
            </div>
            <div className="col-md-6">
              <div className="ms-3">
                <div className="mb-2">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={settings.customer_on_kot_dine_in}
                      onChange={(e) => handleInputChange('customer_on_kot_dine_in', e.target.checked)}
                    />
                    <label className="form-check-label">
                      Dine In
                    </label>
                  </div>
                </div>
                <div className="mb-2">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={settings.customer_on_kot_pickup}
                      onChange={(e) => handleInputChange('customer_on_kot_pickup', e.target.checked)}
                    />
                    <label className="form-check-label">
                      Pickup
                    </label>
                  </div>
                </div>
                <div className="mb-2">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={settings.customer_on_kot_delivery}
                      onChange={(e) => handleInputChange('customer_on_kot_delivery', e.target.checked)}
                    />
                    <label className="form-check-label">
                      Delivery
                    </label>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={settings.customer_on_kot_quick_bill}
                      onChange={(e) => handleInputChange('customer_on_kot_quick_bill', e.target.checked)}
                    />
                    <label className="form-check-label">
                      Quick Bill
                    </label>
                  </div>
                </div>
                <select
                  className="form-select"
                  value={settings.customer_kot_display_option}
                  onChange={(e) => handleInputChange('customer_kot_display_option', e.target.value)}
                >
                  <option value="NAME_ONLY">Name Only</option>
                  <option value="NAME_AND_MOBILE">Name And Mobile Number</option>
                </select>
              </div>
            </div>
          </div>
          <hr className="my-2" />

          {/* Second Row: Group KOT Items */}
          <div className="row mb-2">
            <div className="col-md-6">
              <h6 className="fw-bold mb-3">
                2. Group KOT Items by Category on KOT
              </h6>
            </div>
            <div className="col-md-6">
              <div className="ms-3">
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={settings.group_kot_items_by_category}
                    onChange={(e) => handleInputChange('group_kot_items_by_category', e.target.checked)}
                  />
                </div>
              </div>
            </div>
          </div>
          <hr className="my-2" />

          {/* Third Row: Hide Table Name */}
          <div className="row mb-2">
            <div className="col-md-6">
              <h6 className="fw-bold mb-3">
                3. Hide Table Name on KOT (Quick Bill)
              </h6>
            </div>
            <div className="col-md-6">
              <div className="ms-3">
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={settings.hide_table_name_quick_bill}
                    onChange={(e) => handleInputChange('hide_table_name_quick_bill', e.target.checked)}
                  />
                </div>
              </div>
            </div>
          </div>
          <hr className="my-2" />

          {/* Fourth Row: KOT Tag */}
          <div className="row mb-2">
            <div className="col-md-6">
              <h6 className="fw-bold mb-3">4. KOT Tag</h6>
            </div>
            <div className="col-md-6">
              <div className="ms-3">
                <div className="mb-3">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={settings.show_new_order_tag}
                      onChange={(e) => handleInputChange('show_new_order_tag', e.target.checked)}
                    />
                    <label className="form-check-label">
                      Show New Order Tag
                    </label>
                  </div>
                </div>
                <div className="mb-3">
                  <input
                    type="text"
                    className="form-control"
                    value={settings.new_order_tag_label}
                    onChange={(e) => handleInputChange('new_order_tag_label', e.target.value)}
                    placeholder="New Order Tag Label"
                  />
                </div>
                <div className="mb-3">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={settings.show_running_order_tag}
                      onChange={(e) => handleInputChange('show_running_order_tag', e.target.checked)}
                    />
                    <label className="form-check-label">
                      Show Running Order Tag
                    </label>
                  </div>
                </div>
                <div className="mb-3">
                  <input
                    type="text"
                    className="form-control"
                    value={settings.running_order_tag_label}
                    onChange={(e) => handleInputChange('running_order_tag_label', e.target.value)}
                    placeholder="Running Order Tag Label"
                  />
                </div>
              </div>
            </div>
          </div>
          <hr className="my-2" />

          {/* Fifth Row: KOT Title */}
          <div className="row mb-2">
            <div className="col-md-6">
              <h6 className="fw-bold mb-3">5. KOT Title</h6>
            </div>
            <div className="col-md-6">
              <div className="ms-3">
                <div className="mb-3">
                  <input
                    type="text"
                    className="form-control"
                    value={settings.dine_in_kot_no}
                    onChange={(e) => handleInputChange('dine_in_kot_no', e.target.value)}
                    placeholder="Dine In KOT No"
                  />
                </div>
                <div className="mb-3">
                  <input
                    type="text"
                    className="form-control"
                    value={settings.pickup_kot_no}
                    onChange={(e) => handleInputChange('pickup_kot_no', e.target.value)}
                    placeholder="Pickup KOT No"
                  />
                </div>
                <div className="mb-3">
                  <input
                    type="text"
                    className="form-control"
                    value={settings.delivery_kot_no}
                    onChange={(e) => handleInputChange('delivery_kot_no', e.target.value)}
                    placeholder="Delivery KOT No"
                  />
                </div>
                <div className="mb-3">
                  <input
                    type="text"
                    className="form-control"
                    value={settings.quick_bill_kot_no}
                    onChange={(e) => handleInputChange('quick_bill_kot_no', e.target.value)}
                    placeholder="Quick Bill KOT No"
                  />
                </div>
              </div>
            </div>
          </div>
          <hr className="my-2" />

          {/* Sixth Row: Modifier Option on KOT Print */}
          <div className="row mb-2">
            <div className="col-md-6">
              <h6 className="fw-bold mb-3">
                6. Modifier Option on KOT Print
              </h6>
            </div>
            <div className="col-md-6">
              <div className="ms-3">
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={settings.modifier_default_option}
                    onChange={(e) => handleInputChange('modifier_default_option', e.target.checked)}
                  />
                </div>
              </div>
            </div>
          </div>
          <hr className="my-2" />

          {/* Seventh Row: Show KOT Number */}
          <div className="row mb-2">
            <div className="col-md-6">
              <h6 className="fw-bold mb-3">7. Show KOT Number</h6>
            </div>
            <div className="col-md-6">
              <div className="ms-3">
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={settings.show_kot_no_quick_bill}
                    onChange={(e) => handleInputChange('show_kot_no_quick_bill', e.target.checked)}
                  />
                </div>
              </div>
            </div>
          </div>
          <hr className="my-2" />

          {/* Eighth Row: Show KOT Note */}
          <div className="row mb-2">
            <div className="col-md-6">
              <h6 className="fw-bold mb-3">8. Show KOT Note</h6>
            </div>
            <div className="col-md-6">
              <div className="ms-3">
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={settings.show_kot_note}
                    onChange={(e) => handleInputChange('show_kot_note', e.target.checked)}
                  />
                </div>
              </div>
            </div>
          </div>
          <hr className="my-2" />

          {/* Ninth Row: Show Waiter Name */}
          <div className="row mb-2">
            <div className="col-md-6">
              <h6 className="fw-bold mb-3">9. Show Waiter Name</h6>
            </div>
            <div className="col-md-6">
              <div className="ms-3">
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={settings.show_waiter}
                    onChange={(e) => handleInputChange('show_waiter', e.target.checked)}
                  />
                </div>
              </div>
            </div>
          </div>
          <hr className="my-2" />

          {/* Tenth Row: Show Item Price */}
          <div className="row mb-2">
            <div className="col-md-6">
              <h6 className="fw-bold mb-3">10. Show Item Price</h6>
            </div>
            <div className="col-md-6">
              <div className="ms-3">
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={settings.show_item_price}
                    onChange={(e) => handleInputChange('show_item_price', e.target.checked)}
                  />
                </div>
              </div>
            </div>
          </div>
          <hr className="my-2" />

          {/* Eleventh Row: Show Store Name */}
          <div className="row mb-2">
            <div className="col-md-6">
              <h6 className="fw-bold mb-3">11. Show Store Name</h6>
            </div>
            <div className="col-md-6">
              <div className="ms-3">
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={settings.show_store_name}
                    onChange={(e) => handleInputChange('show_store_name', e.target.checked)}
                  />
                </div>
              </div>
            </div>
          </div>
          <hr className="my-2" />

          {/* Twelfth Row: Show Order Type Symbol */}
          <div className="row mb-2">
            <div className="col-md-6">
              <h6 className="fw-bold mb-3">12. Show Order Type Symbol</h6>
            </div>
            <div className="col-md-6">
              <div className="ms-3">
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={settings.show_order_type_symbol}
                    onChange={(e) => handleInputChange('show_order_type_symbol', e.target.checked)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer with Close and Update Buttons */}
        <div className="card-footer d-flex justify-content-end gap-2">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleClose}
            disabled={saving}
          >
            Close
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleUpdate}
            disabled={saving}
          >
            {saving ? 'Updating...' : 'Update'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default KOTPrintSettings;
