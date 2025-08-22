import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { OutletData } from '@/common/api/outlet'; // Adjust the import path as necessary

interface AddOutletProps {
  Outlet: OutletData | null;
  onBack: () => void;
}

const snakeToCamel = (str: string): string => {
  return str.replace(/(_\w)/g, (match) => match[1].toUpperCase());
};

const AddOutlet: React.FC<AddOutletProps> = ({ Outlet, onBack }) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState('bill-preview');
  const [timeDelay, setTimeDelay] = useState(0);
  const navigate = useNavigate();
  const outletid = Outlet?.outletid;
  const hotelId = Outlet?.hotelid;
  const baseUrl = 'http://localhost:3001';

  useEffect(() => {
    const fetchSettings = async () => {
      if (!outletid || !hotelId) {
        console.error('Missing outletid or hotelId:', { outletid, hotelId });
        alert('Outlet ID and Hotel ID are required. Please provide valid values.');
        return;
      }

      try {
        const response = await fetch(`${baseUrl}/api/settings/outlet-settings/${outletid}?hotelid=${hotelId}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Failed to fetch settings: ${errorData.message || response.statusText}`);
        }
        const data = await response.json();
        console.log('Fetched settings:', data);

        const allFormData: Record<string, any> = {};
        const sections = [
          'bill_preview_settings',
          'kot_print_settings',
          'bill_print_settings',
          'general_settings',
          'online_orders_settings',
        ];

        sections.forEach((section) => {
          if (data[section]) {
            Object.entries(data[section]).forEach(([key, value]) => {
              const camelKey = snakeToCamel(key);
              allFormData[camelKey] = value;
            });
          }
        });

        setFormData(allFormData);
        setTimeDelay(parseInt(allFormData.onlineOrdersTimeDelay || '0', 10));
      } catch (error) {
        console.error('Error fetching settings:', error);
        alert(`Failed to fetch settings for outlet ${outletid} and hotel ${hotelId}. Error: ${error.message}`);
      }
    };
    fetchSettings();
  }, [outletid, hotelId]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { id, value, type, checked } = e.target as HTMLInputElement;
    setFormData((prev) => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleNestedChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    category: string,
    key: string
  ) => {
    const { checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: checked,
      },
    }));
  };

  const handleIncrement = () => {
    setTimeDelay((prev) => prev + 1);
    setFormData((prev) => ({
      ...prev,
      onlineOrdersTimeDelay: (timeDelay + 1).toString(),
    }));
  };

  const handleDecrement = () => {
    setTimeDelay((prev) => (prev > 0 ? prev - 1 : 0));
    setFormData((prev) => ({
      ...prev,
      onlineOrdersTimeDelay: (timeDelay > 0 ? timeDelay - 1 : 0).toString(),
    }));
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  const handleUpdate = async () => {
    try {
      // Update Bill Preview Settings
      const billPreviewResponse = await fetch(`${baseUrl}/api/settings/bill-preview-settings/${outletid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outlet_name: formData.outletName,
          email: formData.email,
          website: formData.website,
          upi_id: formData.upiId,
          bill_prefix: formData.billPrefix,
          secondary_bill_prefix: formData.secondaryBillPrefix,
          bar_bill_prefix: formData.barBillPrefix,
          show_upi_qr: formData.showUpiQr ?? false,
          enabled_bar_section: formData.enabledBarSection ?? false,
          show_phone_on_bill: formData.showPhoneOnBill,
          note: formData.note,
          footer_note: formData.footerNote,
          field1: formData.field1,
          field2: formData.field2,
          field3: formData.field3,
          field4: formData.field4,
          fssai_no: formData.fssaiNo,
        }),
      });

      if (!billPreviewResponse.ok) {
        const errorData = await billPreviewResponse.json();
        throw new Error(`Failed to update bill preview settings: ${errorData.message || billPreviewResponse.statusText}`);
      }

      // Update KOT Print Settings
      const kotPrintResponse = await fetch(`${baseUrl}/api/settings/kot-print-settings/${outletid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_on_kot_dine_in: formData.customerOnKotDineIn ?? false,
          customer_on_kot_pickup: formData.customerOnKotPickup ?? false,
          customer_on_kot_delivery: formData.customerOnKotDelivery ?? false,
          customer_on_kot_quick_bill: formData.customerOnKotQuickBill ?? false,
          customer_kot_display_option: formData.customerKotDisplayOption || 'NAME_ONLY',
          group_kot_items_by_category: formData.groupKotItemsByCategory ?? false,
          hide_table_name_quick_bill: formData.hideTableNameQuickBill ?? false,
          show_new_order_tag: formData.showNewOrderTag ?? true,
          new_order_tag_label: formData.newOrderTagLabel || 'New',
          show_running_order_tag: formData.showRunningOrderTag ?? true,
          running_order_tag_label: formData.runningOrderTagLabel || 'Running',
          dine_in_kot_no: formData.dineInKotNo || 'DIN-',
          pickup_kot_no: formData.pickupKotNo || 'PUP-',
          delivery_kot_no: formData.deliveryKotNo || 'DEL-',
          quick_bill_kot_no: formData.quickBillKotNo || 'QBL-',
          modifier_default_option: formData.modifierDefaultOption ?? false,
          print_kot_both_languages: formData.printKotBothLanguages ?? false,
          show_alternative_item: formData.showAlternativeItem ?? false,
          show_captain_username: formData.showCaptainUsername ?? false,
          show_covers_as_guest: formData.showCoversAsGuest ?? false,
          show_item_price: formData.showItemPrice ?? true,
          show_kot_no_quick_bill: formData.showKotNoQuickBill ?? false,
          show_kot_note: formData.showKotNote ?? true,
          show_online_order_otp: formData.showOnlineOrderOtp ?? false,
          show_order_id_quick_bill: formData.showOrderIdQuickBill ?? false,
          show_order_id_online_order: formData.showOrderIdOnlineOrder ?? false,
          show_order_no_quick_bill_section: formData.showOrderNoQuickBillSection ?? false,
          show_order_type_symbol: formData.showOrderTypeSymbol ?? true,
          show_store_name: formData.showStoreName ?? true,
          show_terminal_username: formData.showTerminalUsername ?? false,
          show_username: formData.showUsername ?? false,
          show_waiter: formData.showWaiter ?? true,
        }),
      });

      if (!kotPrintResponse.ok) {
        const errorData = await kotPrintResponse.json();
        throw new Error(`Failed to update KOT print settings: ${errorData.message || kotPrintResponse.statusText}`);
      }

      // Update Bill Print Settings
      const billPrintResponse = await fetch(`${baseUrl}/api/settings/bill-print-settings/${outletid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bill_title_dine_in: formData.billTitleDineIn ?? true,
          bill_title_pickup: formData.billTitlePickup ?? true,
          bill_title_delivery: formData.billTitleDelivery ?? true,
          bill_title_quick_bill: formData.billTitleQuickBill ?? true,
          mask_order_id: formData.maskOrderId ?? false,
          modifier_default_option_bill: formData.modifierDefaultOptionBill ?? false,
          print_bill_both_languages: formData.printBillBothLanguages ?? false,
          show_alt_item_title_bill: formData.showAltItemTitleBill ?? false,
          show_alt_name_bill: formData.showAltNameBill ?? false,
          show_bill_amount_words: formData.showBillAmountWords ?? false,
          show_bill_no_bill: formData.showBillNoBill ?? true,
          show_bill_number_prefix_bill: formData.showBillNumberPrefixBill ?? true,
          show_bill_print_count: formData.showBillPrintCount ?? false,
          show_brand_name_bill: formData.showBrandNameBill ?? true,
          show_captain_bill: formData.showCaptainBill ?? false,
          show_covers_bill: formData.showCoversBill ?? true,
          show_custom_qr_codes_bill: formData.showCustomQrCodesBill ?? false,
          show_customer_gst_bill: formData.showCustomerGstBill ?? false,
          show_customer_bill: formData.showCustomerBill ?? true,
          show_customer_paid_amount: formData.showCustomerPaidAmount ?? true,
          show_date_bill: formData.showDateBill ?? true,
          show_default_payment: formData.showDefaultPayment ?? true,
          show_discount_reason_bill: formData.showDiscountReasonBill ?? false,
          show_due_amount_bill: formData.showDueAmountBill ?? true,
          show_ebill_invoice_qrcode: formData.showEbillInvoiceQrcode ?? false,
          show_item_hsn_code_bill: formData.showItemHsnCodeBill ?? false,
          show_item_level_charges_separately: formData.showItemLevelChargesSeparately ?? false,
          show_item_note_bill: formData.showItemNoteBill ?? true,
          show_items_sequence_bill: formData.showItemsSequenceBill ?? true,
          show_kot_number_bill: formData.showKotNumberBill ?? false,
          show_logo_bill: formData.showLogoBill ?? true,
          show_order_id_bill: formData.showOrderIdBill ?? false,
          show_order_no_bill: formData.showOrderNoBill ?? true,
          show_order_note_bill: formData.showOrderNoteBill ?? true,
          order_type_dine_in: formData.orderTypeDineIn ?? true,
          order_type_pickup: formData.orderTypePickup ?? true,
          order_type_delivery: formData.orderTypeDelivery ?? true,
          order_type_quick_bill: formData.orderTypeQuickBill ?? true,
          show_outlet_name_bill: formData.showOutletNameBill ?? true,
          payment_mode_dine_in: formData.paymentModeDineIn ?? true,
          payment_mode_pickup: formData.paymentModePickup ?? true,
          payment_mode_delivery: formData.paymentModeDelivery ?? true,
          payment_mode_quick_bill: formData.paymentModeQuickBill ?? true,
          table_name_dine_in: formData.tableNameDineIn ?? true,
          table_name_pickup: formData.tableNamePickup ?? false,
          table_name_delivery: formData.tableNameDelivery ?? false,
          table_name_quick_bill: formData.tableNameQuickBill ?? false,
          show_tax_charge_bill: formData.showTaxChargeBill ?? true,
          show_username_bill: formData.showUsernameBill ?? false,
          show_waiter_bill: formData.showWaiterBill ?? true,
          show_zatca_invoice_qr: formData.showZatcaInvoiceQr ?? false,
          show_customer_address_pickup_bill: formData.showCustomerAddressPickupBill ?? false,
          show_order_placed_time: formData.showOrderPlacedTime ?? true,
          hide_item_quantity_column: formData.hideItemQuantityColumn ?? false,
          hide_item_rate_column: formData.hideItemRateColumn ?? false,
          hide_item_total_column: formData.hideItemTotalColumn ?? false,
          hide_total_without_tax: formData.hideTotalWithoutTax ?? false,
        }),
      });

      if (!billPrintResponse.ok) {
        const errorData = await billPrintResponse.json();
        throw new Error(`Failed to update bill print settings: ${errorData.message || billPrintResponse.statusText}`);
      }

      // Update Online Orders Settings
      const onlineOrdersResponse = await fetch(`${baseUrl}/api/settings/online-order-settings/${outletid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          show_in_preparation_kds: formData.showInPreparationKds ?? false,
          auto_accept_online_order: formData.autoAcceptOnlineOrder ?? false,
          customize_order_preparation_time: formData.customizeOrderPreparationTime ?? false,
          online_orders_time_delay: formData.onlineOrdersTimeDelay || '0',
          pull_order_on_accept: formData.pullOrderOnAccept ?? false,
          show_addons_separately: formData.showAddonsSeparately ?? false,
          show_complete_online_order_id: formData.showCompleteOnlineOrderId ?? true,
          show_online_order_preparation_time: formData.showOnlineOrderPreparationTime ?? true,
          update_food_ready_status_kds: formData.updateFoodReadyStatusKds ?? true,
        }),
      });

      if (!onlineOrdersResponse.ok) {
        const errorData = await onlineOrdersResponse.json();
        throw new Error(`Failed to update online order settings: ${errorData.message || onlineOrdersResponse.statusText}`);
      }

      alert('Settings updated successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error updating settings:', error);
      alert(`Failed to update settings. Error: ${error.message}`);
    }
  };

    return (
    <div className="m-0">


      <h1 className="display-6 fw-bold mb-4">Outlet Level Settings</h1>

      <ul className="nav nav-tabs mb-4" id="settingsTabs" role="tablist">
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'bill-preview' ? 'active' : ''}`}
            id="bill-preview-tab"
            type="button"
            role="tab"
            aria-controls="bill-preview"
            aria-selected={activeTab === 'bill-preview'}
            onClick={() => setActiveTab('bill-preview')}
          >
            BILL PREVIEW SETTINGS
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'kot-print' ? 'active' : ''}`}
            id="kot-print-tab"
            type="button"
            role="tab"
            aria-controls="kot-print"
            aria-selected={activeTab === 'kot-print'}
            onClick={() => setActiveTab('kot-print')}
          >
            KOT PRINT SETTINGS
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'bill-print' ? 'active' : ''}`}
            id="bill-print-tab"
            type="button"
            role="tab"
            aria-controls="bill-print"
            aria-selected={activeTab === 'bill-print'}
            onClick={() => setActiveTab('bill-print')}
          >
            BILL PRINT SETTINGS
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'general' ? 'active' : ''}`}
            id="general-tab"
            type="button"
            role="tab"
            aria-controls="general"
            aria-selected={activeTab === 'general'}
            onClick={() => setActiveTab('general')}
          >
            GENERAL SETTINGS
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'online-orders' ? 'active' : ''}`}
            id="online-orders-tab"
            type="button"
            role="tab"
            aria-controls="online-orders"
            aria-selected={activeTab === 'online-orders'}
            onClick={() => setActiveTab('online-orders')}
          >
            ONLINE ORDERS SETTINGS
          </button>
        </li>
      </ul>

      <div className="d-flex gap-2 align-items-stretch">
        <div className="flex-grow-1">
          <div className="tab-content" id="settingsTabsContent">
            {/* Bill Preview Settings Tab */}
            <div
              className={`tab-pane fade ${activeTab === 'bill-preview' ? 'show active' : ''}`}
              id="bill-preview"
              role="tabpanel"
              aria-labelledby="bill-preview-tab"
            >
              <div className="card shadow-lg h-100 " style={{ minHeight: '800px', }}>
                <div className="card-body">
                  <h2 className="card-title h5 fw-bold mb-4">Bill Preview Settings</h2>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label htmlFor="outletName" className="form-label">
                        Alternative Name of Outlet
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="outletName"
                        placeholder="Enter Outlet Name"
                        style={{ borderColor: '#ccc' }}
                        value={formData.outletName}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="email" className="form-label">
                        Email
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="email"
                        placeholder="Enter Email"
                        style={{ borderColor: '#ccc' }}
                        value={formData.email}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="website" className="form-label">
                        Website
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="website"
                        placeholder="Enter Website URL"
                        style={{ borderColor: '#ccc' }}
                        value={formData.website}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="upiId" className="form-label">
                        UPI ID
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="upiId"
                        placeholder="Enter UPI ID"
                        style={{ borderColor: '#ccc' }}
                        value={formData.upiId}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="billPrefix" className="form-label">
                        Bill Number Prefix
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="billPrefix"
                        placeholder="Enter Bill Number Prefix"
                        style={{ borderColor: '#ccc' }}
                        value={formData.billPrefix}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="secondaryBillPrefix" className="form-label">
                        Secondary Bill Number Prefix
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="secondaryBillPrefix"
                        placeholder="Enter Secondary Bill Number Prefix"
                        style={{ borderColor: '#ccc' }}
                        value={formData.secondaryBillPrefix}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-12">
                      <div className="row align-items-center">
                        <div className="col-md-6">
                          <label htmlFor="barBillPrefix" className="form-label">
                            Bar Bill Number Prefix
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            id="barBillPrefix"
                            placeholder="Enter Bar Bill Number Prefix"
                            style={{ borderColor: '#ccc' }}
                            value={formData.barBillPrefix}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="col-md-6">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="showUpiQr"
                              style={{ borderColor: '#ccc' }}
                              checked={formData.showUpiQr}
                              onChange={handleInputChange}
                            />
                            <label className="form-check-label" htmlFor="showUpiQr">
                              Show UPI QR Code On Bill
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="row align-items-center">
                        <div className="col-md-6">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="enabledBarSection"
                              style={{ borderColor: '#ccc' }}
                              checked={formData.enabledBarSection}
                              onChange={handleInputChange}
                            />
                            <label
                              className="form-check-label"
                              htmlFor="enabledBarSection"
                            >
                              Enabled Bar Section Billing
                            </label>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <label htmlFor="showPhoneOnBill" className="form-label">
                            Show Phone On Bill
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            id="showPhoneOnBill"
                            placeholder="Enter Phone Number"
                            style={{ borderColor: '#ccc' }}
                            value={formData.showPhoneOnBill}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="row">
                        <div className="col-md-6">
                          <label htmlFor="note" className="form-label text-center">
                            Note
                          </label>
                          <textarea
                            className="form-control"
                            id="note"
                            rows={3}
                            placeholder="Enter Note"
                            style={{ borderColor: '#ccc' }}
                            value={formData.note}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="col-md-6">
                          <label htmlFor="footerNote" className="form-label text-center">
                            Footer Note
                          </label>
                          <textarea
                            className="form-control"
                            id="footerNote"
                            rows={3}
                            placeholder="Enter Footer Note"
                            style={{ borderColor: '#ccc' }}
                            value={formData.footerNote}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="field1" className="form-label">
                        Field 1 (GST/VAT)
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="field1"
                        placeholder="Enter GST/VAT"
                        style={{ borderColor: '#ccc' }}
                        value={formData.note}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="field2" className="form-label">
                        Field 2
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="field2"
                        placeholder="Enter Field 2"
                        style={{ borderColor: '#ccc' }}
                        value={formData.field2}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="field3" className="form-label">
                        Field 3
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="field3"
                        placeholder="Enter Field 3"
                        style={{ borderColor: '#ccc' }}
                        value={formData.field3}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="field4" className="form-label">
                        Field 4
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="field4"
                        placeholder="Enter Field 4"
                        style={{ borderColor: '#ccc' }}
                        value={formData.field4}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-12">
                      <label htmlFor="fssaiNo" className="form-label">
                        FSSAI No
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="fssaiNo"
                        placeholder="Enter FSSAI License Number"
                        style={{ borderColor: '#ccc' }}
                        value={formData.fssaiNo}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div
                    className="d-flex justify-content-end gap-3 mt-4"
                    style={{ padding: '10px' }}
                  >
                    <button className="btn btn-danger" onClick={handleCancel}>
                      Cancel
                    </button>
                    <button className="btn btn-success" onClick={handleUpdate}>
                      Update
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* KOT Print Settings Tab */}
            <div
              className={`tab-pane fade ${activeTab === 'kot-print' ? 'show active' : ''}`}
              id="kot-print"
              role="tabpanel"
              aria-labelledby="kot-print-tab"
            >
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <h2 className="card-title h5 fw-bold mb-4">KOT Print Settings</h2>
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <div className="d-flex align-items-center mb-3">
                        <span className="me-2">#</span>
                        <input style={{ borderColor: '#ccc' }}
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
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">1. Customer on KOT</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="mb-2">
                          <div className="form-check">
                            <input style={{ borderColor: '#ccc' }}
                              className="form-check-input"
                              type="checkbox"
                              id="dineIn"
                            />
                            <label className="form-check-label" htmlFor="dineIn">
                              Dine In
                            </label>
                          </div>
                        </div>
                        <div className="mb-2">
                          <div className="form-check">
                            <input style={{ borderColor: '#ccc' }}
                              className="form-check-input"
                              type="checkbox"
                              id="pickup"
                              defaultChecked
                            />
                            <label className="form-check-label" htmlFor="pickup">
                              Pickup
                            </label>
                          </div>
                        </div>
                        <div className="mb-2">
                          <div className="form-check">
                            <input style={{ borderColor: '#ccc' }}
                              className="form-check-input"
                              type="checkbox"
                              id="delivery"
                              defaultChecked
                            />
                            <label className="form-check-label" htmlFor="delivery">
                              Delivery
                            </label>
                          </div>
                        </div>
                        <div className="mb-3">
                          <div className="form-check">
                            <input style={{ borderColor: '#ccc' }}
                              className="form-check-input"
                              type="checkbox"
                              id="quickBill"
                              defaultChecked
                            />
                            <label className="form-check-label" htmlFor="quickBill">
                              Quick Bill
                            </label>
                          </div>
                        </div>
                        <select style={{ borderColor: '#ccc' }}
                          className="form-select"
                          aria-label="Name and Mobile Number"
                        >
                          <option value="enabled">Name And Mobile Number</option>
                          <option value="disabled">Disabled</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />
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
                            id="groupKOTItems"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />
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
                            id="hideTableName"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">4. KOT Tag</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="mb-3">
                          <div className="form-check form-switch">
                            <input style={{ borderColor: '#ccc' }}
                              className="form-check-input"
                              type="checkbox"
                              id="showNewOrderTag"
                            />
                            <label
                              className="form-check-label"
                              htmlFor="showNewOrderTag"
                            >
                              Show New Order Tag
                            </label>
                          </div>
                        </div>
                        <div className="mb-3">
                          <input style={{ borderColor: '#ccc' }}
                            type="text"
                            className="form-control"
                            placeholder="New Order Tag Label"
                            defaultValue="New Order"
                          />
                        </div>
                        <div className="mb-3">
                          <div className="form-check form-switch">
                            <input style={{ borderColor: '#ccc' }}
                              className="form-check-input"
                              type="checkbox"
                              id="showRunningOrderTag"
                            />
                            <label
                              className="form-check-label"
                              htmlFor="showRunningOrderTag"
                            >
                              Show Running Order Tag
                            </label>
                          </div>
                        </div>
                        <div className="mb-3">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Running Order Tag Label"
                            defaultValue="Running Order"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">5. KOT Title</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="mb-3">
                          <input style={{ borderColor: '#ccc' }}
                            type="text"
                            className="form-control"
                            placeholder="Dine In KOT No"
                          />
                        </div>
                        <div className="mb-3">
                          <input style={{ borderColor: '#ccc' }}
                            type="text"
                            className="form-control"
                            placeholder="Pickup KOT No"
                          />
                        </div>
                        <div className="mb-3">
                          <input style={{ borderColor: '#ccc' }}
                            type="text"
                            className="form-control"
                            placeholder="Delivery KOT No"
                          />
                        </div>
                        <div className="mb-3">
                          <input style={{ borderColor: '#ccc' }}
                            type="text"
                            className="form-control"
                            placeholder="Quick Bill"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">
                        6. Modifier default Option on KOT Print
                      </h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="modifierOption"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">7. Print KOT In Both Languages (English and Arabic)</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="showKOTNumber"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">8. Show Alternative Item On KOT Print</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="showKOTTime"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">9. Show Captain Username on KOT</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="showWaiterName"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">10. Show Covers As Guest On KOT</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="showItemCode"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">11. Show Item Price on KOT</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="showItemShortName"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">12. Show KOT No on Quick Bill</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="showItemSerialNumber"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">13. Show KOT Note</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="showKOTSerialNumber"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">
                        14. Show Online Order OTP on KOT
                      </h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="showTableNameQuickBill"
                            defaultChecked
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">
                        15. Show Order ID On KOT
                      </h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="mb-2">
                          <div className="form-check">
                            <input style={{ borderColor: '#ccc' }}
                              className="form-check-input"
                              type="checkbox"
                              id="pickup"
                              defaultChecked
                            />
                            <label className="form-check-label" htmlFor="pickup">
                              Quick Bill
                            </label>
                          </div>
                        </div>
                        <div className="mb-2">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="delivery"
                              defaultChecked
                            />
                            <label className="form-check-label" htmlFor="delivery">
                              Online Order
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">
                        16. Show Order No on Quick Bill Section KOT
                      </h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="showCustomerMobileNumberQuickBill"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">17. Show Order Type Symbol on KOT</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="showItemNote"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">18. Show Store Name On KOT</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="showKOTNote"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">19. Show Terminal Username on KOT</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="showItemRate"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">20. Show Username on KOT</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="showKOTTotal"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">21.Show Waiter On KOT</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="showKOTDate"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    className="d-flex justify-content-end gap-3 mt-4"
                    style={{ padding: '10px' }}
                  >
                    <button className="btn btn-danger" onClick={handleCancel}>
                      Cancel
                    </button>
                    <button className="btn btn-success" onClick={handleUpdate}>
                      Update
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Bill Print Settings Tab */}
            <div
              className={`tab-pane fade ${activeTab === 'bill-print' ? 'show active' : ''}`}
              id="bill-print"
              role="tabpanel"
              aria-labelledby="bill-print-tab"
            >
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <h2 className="card-title h5 fw-bold mb-4">Bill Print Settings</h2>
                  {/* Header: Search Bar and Status */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <div className="d-flex align-items-center mb-3">
                        <span className="me-2">#</span>
                        <input
                          type="text"
                          className="form-control w-50"
                          placeholder="Search"
                          style={{ borderColor: '#ccc' }}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <h6 className="fw-bold mb-3">Status</h6>
                      </div>
                    </div>
                  </div>

                  {/* Row 1: Bill Title */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">1. Bill Title</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="mb-2">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="billTitleDineIn"
                              style={{ borderColor: '#ccc' }}
                            />
                            <label className="form-check-label" htmlFor="billTitleDineIn">
                              Dine In
                            </label>
                          </div>
                        </div>

                        <div className="mb-2">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="billTitlePickup"
                              style={{ borderColor: '#ccc' }}
                            />
                            <label className="form-check-label" htmlFor="billTitlePickup">
                              Pickup
                            </label>
                          </div>
                        </div>

                        <div className="mb-2">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="billTitleDelivery"
                              style={{ borderColor: '#ccc' }}
                            />
                            <label className="form-check-label" htmlFor="billTitleDelivery">
                              Delivery
                            </label>
                          </div>
                        </div>

                        <div className="mb-2">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="billTitleQuickBill"
                              style={{ borderColor: '#ccc' }}
                            />
                            <label className="form-check-label" htmlFor="billTitleQuickBill">
                              Quick Bill
                            </label>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 2: Mask Order ID */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">2. Mask Order ID</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="maskOrderId"
                            style={{ borderColor: '#ccc' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 3: Modifier default option on Bill print */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">3. Modifier default option on Bill print</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="modifierDefaultOptionBill"
                            style={{ borderColor: '#ccc' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 4: Print Bill In Both Language (English, Arabic) */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">4. Print Bill In Both Language (English, Arabic)</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="printBillBothLanguages"
                            style={{ borderColor: '#ccc' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 5: Show Alternative Item Title On Bill Print */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">5. Show Alternative Item Title On Bill Print</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="showAltItemTitleBill"
                            style={{ borderColor: '#ccc' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 6: Show alternative name on Bill */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">6. Show alternative name on Bill</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="showAltNameBill"
                            style={{ borderColor: '#ccc' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 7: Show Bill Amount in Words */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">7. Show Bill Amount in Words</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="showBillAmountWords"
                            style={{ borderColor: '#ccc' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 8: Show Bill No on Bill */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">8. Show Bill No on Bill</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="showBillNoBill"
                            style={{ borderColor: '#ccc' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 9: Show Bill Number With Prefix On Bill */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">9. Show Bill Number With Prefix On Bill</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="showBillNumberPrefixBill"
                            style={{ borderColor: '#ccc' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 10: Show Bill Print Count */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">10. Show Bill Print Count</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="showBillPrintCount"
                            style={{ borderColor: '#ccc' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 11: Show Brand Name on Bill */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">11. Show Brand Name on Bill</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="showBrandNameBill"
                            style={{ borderColor: '#ccc' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 12: Show Captain On Bill */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">12. Show Captain On Bill</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="showCaptainBill"
                            style={{ borderColor: '#ccc' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 13: Show Covers on Bill */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">13. Show Covers on Bill</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="showCoversBill"
                            style={{ borderColor: '#ccc' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 14: Show Custom QR Codes on Bill */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">14. Show Custom QR Codes on Bill</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="showCustomQRCodesBill"
                            style={{ borderColor: '#ccc' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 15: Show Customer GST on Bill */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">15. Show Customer GST on Bill</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="showCustomerGSTBill"
                            style={{ borderColor: '#ccc' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 16: Show Customer on Bill */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">16. Show Customer on Bill</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="showCustomerBill"
                            style={{ borderColor: '#ccc' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 17: Show Customer Paid Amount */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">17. Show Customer Paid Amount</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="showCustomerPaidAmount"
                            style={{ borderColor: '#ccc' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 18: Show Date on Bill */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">18. Show Date on Bill</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="showDateBill"
                            style={{ borderColor: '#ccc' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 19: Show Default Payment */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">19. Show Default Payment</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="showDefaultPayment"
                            style={{ borderColor: '#ccc' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 20: Show Discount Reason on Bill */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">20. Show Discount Reason on Bill</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="showDiscountReasonBill"
                            style={{ borderColor: '#ccc' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 21: Show Due Amount on Bill */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">21. Show Due Amount on Bill</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="showDueAmountBill"
                            style={{ borderColor: '#ccc' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 22: Show E-Bill invoice Link QRcode */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">22. Show E-Bill invoice Link QRcode</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="showEBillInvoiceQRcode"
                            style={{ borderColor: '#ccc' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 23: Show Item HSN Code on Bill */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">23. Show Item HSN Code on Bill</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="showItemHSNCodeBill"
                            style={{ borderColor: '#ccc' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 24: Show Item Level Charges Separately */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">24. Show Item Level Charges Separately</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="showItemLevelChargesSeparately"
                            style={{ borderColor: '#ccc' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 25: Show Item Note on Bill */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">25. Show Item Note on Bill</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="showItemNoteBill"
                            style={{ borderColor: '#ccc' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 26: Show Items Sequence on Bill */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">26. Show Items Sequence on Bill</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="showItemsSequenceBill"
                            style={{ borderColor: '#ccc' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 27: Show KOT Number on Bill */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">27. Show KOT Number on Bill</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          詳細
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="showKOTNumberBill"
                            style={{ borderColor: '#ccc' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 28: Show Logo on Bill */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">28. Show Logo on Bill</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="showLogoBill"
                            style={{ borderColor: '#ccc' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 29: Show Order ID on Bill */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">29. Show Order ID on Bill</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="showOrderIdBill"
                            style={{ borderColor: '#ccc' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 30: Show Order No on Bill */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">30. Show Order No on Bill</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="showOrderNoBill"
                            style={{ borderColor: '#ccc' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 31: Show order note on the bill */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">31. Show order note on the bill</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="showOrderNoteBill"
                            style={{ borderColor: '#ccc' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 32: Show Order Type on Bill */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">32. Show Order Type on Bill</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="mb-2">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="orderTypeDineIn"
                              style={{ borderColor: '#ccc' }}
                            />
                            <label className="form-check-label" htmlFor="orderTypeDineIn">
                              Dine In
                            </label>
                          </div>
                        </div>
                        <div className="mb-2">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="orderTypePickup"
                              style={{ borderColor: '#ccc' }}
                            />
                            <label className="form-check-label" htmlFor="orderTypePickup">
                              Pickup
                            </label>
                          </div>
                        </div>
                        <div className="mb-2">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="orderTypeDelivery"
                              style={{ borderColor: '#ccc' }}
                            />
                            <label className="form-check-label" htmlFor="orderTypeDelivery">
                              Delivery
                            </label>
                          </div>
                        </div>
                        <div className="mb-3">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="orderTypeQuickBill"
                              style={{ borderColor: '#ccc' }}
                            />
                            <label className="form-check-label" htmlFor="orderTypeQuickBill">
                              Quick Bill
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 33: Show outlet name on Bill */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">33. Show outlet name on Bill</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="showOutletNameBill"
                            style={{ borderColor: '#ccc' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 34: Show Payment Mode on Bill */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">34. Show Payment Mode on Bill</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="mb-2">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="paymentModeDineIn"
                              style={{ borderColor: '#ccc' }}
                            />
                            <label className="form-check-label" htmlFor="paymentModeDineIn">
                              Dine In
                            </label>
                          </div>
                        </div>
                        <div className="mb-2">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="paymentModePickup"
                              style={{ borderColor: '#ccc' }}
                            />
                            <label className="form-check-label" htmlFor="paymentModePickup">
                              Pickup
                            </label>
                          </div>
                        </div>
                        <div className="mb-2">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="paymentModeDelivery"
                              style={{ borderColor: '#ccc' }}
                            />
                            <label className="form-check-label" htmlFor="paymentModeDelivery">
                              Delivery
                            </label>
                          </div>
                        </div>
                        <div className="mb-3">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="paymentModeQuickBill"
                              style={{ borderColor: '#ccc' }}
                            />
                            <label className="form-check-label" htmlFor="paymentModeQuickBill">
                              Quick Bill
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 35: Show Table Name on Bill */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">35. Show Table Name on Bill</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="mb-2">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="tableNameDineIn"
                              style={{ borderColor: '#ccc' }}
                            />
                            <label className="form-check-label" htmlFor="tableNameDineIn">
                              Dine In
                            </label>
                          </div>
                        </div>
                        <div className="mb-2">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="tableNamePickup"
                              style={{ borderColor: '#ccc' }}
                            />
                            <label className="form-check-label" htmlFor="tableNamePickup">
                              Pickup
                            </label>
                          </div>
                        </div>
                        <div className="mb-2">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="tableNameDelivery"
                              style={{ borderColor: '#ccc' }}
                            />
                            <label className="form-check-label" htmlFor="tableNameDelivery">
                              Delivery
                            </label>
                          </div>
                        </div>
                        <div className="mb-3">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="tableNameQuickBill"
                              style={{ borderColor: '#ccc' }}
                            />
                            <label className="form-check-label" htmlFor="tableNameQuickBill">
                              Quick Bill
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 36: Show Tax on Charge on Bill */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">36. Show Tax on Charge on Bill</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="showTaxChargeBill"
                            style={{ borderColor: '#ccc' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 37: Show Username on Bill */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">37. Show Username on Bill</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="showUsernameBill"
                            style={{ borderColor: '#ccc' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 38: Show Waiter on Bill */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">38. Show Waiter on Bill</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="showWaiterBill"
                            style={{ borderColor: '#ccc' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 39: Show ZATCA E-Invoice QR */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">39. Show ZATCA E-Invoice QR</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="showZATCAInvoiceQR"
                            style={{ borderColor: '#ccc' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 40: Show customer address on pickup bill */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">40. Show customer address on pickup bill</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="showCustomerAddressPickupBill"
                            style={{ borderColor: '#ccc' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 41: Show Order Placed Time */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">41. Show Order Placed Time</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="showOrderPlacedTime"
                            style={{ borderColor: '#ccc' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 42: Bill Print Item Details Columns */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">42. Bill Print Item Details Columns</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="mb-2">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="hideItemQuantityColumn"
                              style={{ borderColor: '#ccc' }}
                            />
                            <label className="form-check-label" htmlFor="hideItemQuantityColumn">
                              Hide Item Quantity Column
                            </label>
                          </div>
                        </div>
                        <div className="mb-2">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="hideItemRateColumn"
                              style={{ borderColor: '#ccc' }}
                            />
                            <label className="form-check-label" htmlFor="hideItemRateColumn">
                              Hide Item Rate Column
                            </label>
                          </div>
                        </div>
                        <div className="mb-3">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="hideItemTotalColumn"
                              style={{ borderColor: '#ccc' }}
                            />
                            <label className="form-check-label" htmlFor="hideItemTotalColumn">
                              Hide Item Total Column
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 43: Hide Total Without Tax */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">43. Hide Total Without Tax</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="hideTotalWithoutTax"
                            style={{ borderColor: '#ccc' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>


                  <div
                    className="d-flex justify-content-end gap-3 mt-4"
                    style={{ padding: '10px' }}
                  >
                    <button className="btn btn-danger" onClick={handleCancel}>
                      Cancel
                    </button>
                    <button className="btn btn-success" onClick={handleUpdate}>
                      Update
                    </button>
                  </div>
                </div>
              </div>
            </div>


            {/* Online Orders Settings Tab */}
            <div
              className={`tab-pane fade ${activeTab === 'online-orders' ? 'show active' : ''}`}
              id="online-orders"
              role="tabpanel"
              aria-labelledby="online-orders-tab"
            >
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <h2 className="card-title h5 fw-bold mb-4">Online Orders Settings</h2>
                  {/* Header: Search Bar and Status */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <div className="d-flex align-items-center mb-3">
                        <span className="me-2">#</span>
                        <input style={{ borderColor: '#ccc' }}
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

                  {/* Row 1: After accepting an online order, it should be shown as In Preparation on the KDS */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">1. After accepting an online order, it should be shown as In Preparation on the KDS</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="showInPreparationKDS"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 2: Auto Accept online order */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">2. Auto Accept online order</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="autoAcceptOnlineOrder"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 3: Customize Order Preparation Time */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">3. Customize Order Preparation Time</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="customizeOrderPreparationTime"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 4: Online Orders Time Delay */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">4. Online Orders Time Delay</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3 d-flex align-items-center">
                        <button
                          className="btn btn-outline-secondary me-2"
                          onClick={handleDecrement}
                        >
                          -
                        </button>
                        <span className="mx-2">{timeDelay}</span>
                        <button
                          className="btn btn-outline-secondary ms-2"
                          onClick={handleIncrement}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 5: Pull Order on Accept (Online Orders) */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">5. Pull Order on Accept (Online Orders)</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="pullOrderOnAccept"
                            defaultChecked
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 6: Show Addons Separately */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">6. Show Addons Separately</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="showAddonsSeparately"
                            defaultChecked
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 7: Show complete online order id */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">7. Show complete online order id</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="showCompleteOnlineOrderId"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 8: Show Online Order Preparation Time */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">8. Show Online Order Preparation Time</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="showOnlineOrderPreparationTime"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 9: Update the food-ready status of an online order when the ready status changes from the KDS */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">9. Update the food-ready status of an online order when the ready status changes from the KDS</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="updateFoodReadyStatusKDS"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  className="d-flex justify-content-end gap-3 mt-4"
                  style={{ padding: '10px' }}
                >
                  <button className="btn btn-danger" onClick={handleCancel}>
                    Cancel
                  </button>
                  <button className="btn btn-success" onClick={handleUpdate}>
                    Update
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Bill Preview Section (Right Side) */}
        {activeTab === 'bill-preview' && (
          <div className="w-50 mx-auto">
            <div className="card shadow-sm h-100"  >
              <div className="card-body">
                <h2 className="card-title h5 fw-bold mb-4 text-center">
                  Bill Preview
                </h2>
                <div className="text-center mb-3">
                  <p className="fw-bold">{formData.outletName || '!!!Hotel Miracle!!!'}</p>
                  <p>Kolhapur Road Kolhapur 416416</p>
                  {formData.showPhoneOnBill && <p>{formData.showPhoneOnBill}</p>}
                  {formData.email && <p>{formData.email}</p>}
                  {formData.website && <p>{formData.website}</p>}
                </div>
                <div className="text-center mb-3" style={{ fontSize: '0.9rem' }}>
                  <p className="mb-0">Note: {formData.note || 'Order ID: 1234567890'}</p>
                  <p className="mb-0">26/05/2025 @ 9:10 PM</p>
                </div>
                <div className="d-flex justify-content-between mb-3">
                  <p>Pay Mode: Cash</p>
                  <p>User: TMPOS</p>
                </div>
                <table className="table table-bordered mb-3">
                  <thead>
                    <tr>
                      <th scope="col">Item Name</th>
                      <th scope="col" className="text-end">
                        Quantity
                      </th>
                      <th scope="col" className="text-end">
                        Price
                      </th>
                      <th scope="col" className="text-end">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>1. Biryani</td>
                      <td className="text-end">1</td>
                      <td className="text-end">100.00</td>
                      <td className="text-end">100.00</td>
                    </tr>
                  </tbody>
                </table>
                <div className="text-end">
                  <p>Total Value: Rs. 100.00</p>
                  <p className="mt-2">GST:</p>
                  {formData.field1 && <p>{formData.field1}</p>}
                  {formData.field2 && <p>{formData.field2}</p>}
                  {formData.field3 && <p>{formData.field3}</p>}
                  {formData.field4 && <p>{formData.field4}</p>}
                  <p className="mt-2">Total Tax (excl.): Rs. 5.00</p>
                  <p className="mt-2 fw-bold">Grand Total: Rs. 105.00</p>
                  {formData.footerNote && (
                    <p className="mt-2 text-center">{formData.footerNote}</p>
                  )}
                  {formData.fssaiNo && (
                    <p className="mt-2 text-center">FSSAI No: {formData.fssaiNo}</p>
                  )}
                </div>
              </div>
            </div>
          </div>


        )}
      </div>
    </div >
  );
};

export default AddOutlet;