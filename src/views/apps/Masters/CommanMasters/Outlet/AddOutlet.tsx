import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
//import 'bootstrap/dist/css/bootstrap.min.css';

interface AddOutletProps {
  Outlet: OutletData | null;
  onBack: () => void;
}

const AddOutlet: React.FC<AddOutletProps> = ({ Outlet, onBack }) => {
  const [formData, setFormData] = useState({
    outletName: '',
    email: '',
    website: '',
    upiId: '',
    billPrefix: '',
    secondaryBillPrefix: '',
    barBillPrefix: '',
    showUpiQr: false,
    enabledBarSection: false,
    showPhoneOnBill: '',
    note: '',
    footerNote: '',
    field1: '',
    field2: '',
    field3: '',
    field4: '',
    fssaiNo: '',
    customizeUrlLinks: [],
    allowChargesAfterBillPrint: false,
    allowDiscountAfterBillPrint: false,
    allowDiscountBeforeSave: false,
    allowPreOrderTAHD: false,
    askCovers: { dineIn: false, pickup: false, delivery: false, quickBill: false },
    askCoversCaptain: false,
    askCustomOrderIdQuickBill: false,
    askCustomOrderTypeQuickBill: false,
    askPaymentModeOnSaveBill: false,
    askWaiter: { dineIn: false, pickup: false, delivery: false, quickBill: false },
    askOtpChangeOrderStatusOrderWindow: false,
    askOtpChangeOrderStatusReceiptSection: false,
    autoAcceptRemoteKOT: false,
    autoOutOfStock: false,
    autoSync: false,
    categoryTimeForPOS: '',
    countSalesAfterMidnight: false,
    customerDisplay: { media: [] },
    customerMandatory: { dineIn: false, pickup: false, delivery: false, quickBill: false },
    defaultEBillCheck: false,
    defaultSendDeliveryBoyCheck: false,
    editCustomizeOrderNumber: '',
    enableBackupNotificationService: false,
    enableCustomerDisplayAccess: false,
    filterItemsByOrderType: false,
    generateReportsStartCloseDates: false,
    hideClearDataCheckLogout: false,
    hideItemPriceOptions: false,
    hideLoadMenuButton: false,
    makeCancelDeleteReasonCompulsory: false,
    makeDiscountReasonMandatory: false,
    makeFreeCancelBillReasonMandatory: false,
    makePaymentRefNumberMandatory: false,
    mandatoryDeliveryBoySelection: false,
    markOrderAsTransferOrder: false,
    onlinePaymentAutoSettle: false,
    orderSyncSettings: { autoSyncInterval: '5', syncBatchPacketSize: '10' },
    separateBillingBySection: false,
    setEnteredAmountAsOpening: false,
    showAlternativeItemReportPrint: false,
    showClearSalesReportLogout: false,
    showOrderNoLabelPos: false,
    showPaymentHistoryButton: false,
    showRemoteKOTOption: false,
    showSendPaymentLink: false,
    stockAvailabilityDisplay: false,
    todaysReport: {
      salesSummary: false,
      orderTypeSummary: false,
      paymentTypeSummary: false,
      discountSummary: false,
      expenseSummary: false,
      billSummary: false,
      deliveryBoySummary: false,
      waiterSummary: false,
      kitchenDepartmentSummary: false,
      categorySummary: false,
      soldItemsSummary: false,
      cancelItemsSummary: false,
      walletSummary: false,
      duePaymentReceivedSummary: false,
      duePaymentReceivableSummary: false,
      paymentVarianceSummary: false,
      currencyDenominationsSummary: false,
    },
    upiPaymentSoundNotification: false,
    useSeparateBillNumbersOnline: false,
    whenSendTodaysReport: '',
    enableCurrencyConversion: false,
    enableUserLoginValidation: false,
    allowClosingShiftDespiteBills: false,
    showRealTimeKOTBillNotifications: false,
  });

  const handleNestedChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    category: string,
    key: string
  ) => {
    const { checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [category]: {
       
        [key]: checked,
      },
    }));
  };

  const [activeTab, setActiveTab] = useState('bill-preview');
  const navigate = useNavigate();

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value, type, checked } = e.target as HTMLInputElement;
    setFormData((prev) => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  const handleUpdate = () => {
    console.log('Form Data Updated:', formData);
    alert('Form data updated successfully! Check console for details.');
  };

  // Handlers for time delay increment and decrement
  const [timeDelay, setTimeDelay] = useState(5); // Default value for Online Orders Time Delay
  const handleIncrement = () => {
    setTimeDelay((prev) => prev + 1);
  };

  const handleDecrement = () => {
    setTimeDelay((prev) => (prev > 0 ? prev - 1 : 0)); // Prevent negative values
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

            {/* General Settings Tab */}
            <div
              className={`tab-pane fade ${activeTab === 'general' ? 'show active' : ''}`}
              id="general"
              role="tabpanel"
              aria-labelledby="general-tab"
            >
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <h2 className="card-title h5 fw-bold mb-4">General Settings</h2>

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

                  {/* Row 1: Add Customize URL Link For Atlantic POS */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">1. Add Customize URL Link For Atlantic POS</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <table className="table table-bordered mb-3">
                          <thead>
                            <tr style={{ borderColor: '#ccc' }}>
                              <th scope="col">Title</th>
                              <th scope="col">URL</th>
                              <th scope="col">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr style={{ borderColor: '#ccc' }}>
                              <td colSpan={3} className="text-center">No Data Found</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 2: Allow Charges Apply After Bill Print */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">2. Allow Charges Apply After Bill Print</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="allowChargesAfterBillPrint"
                            checked={formData.allowChargesAfterBillPrint}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 3: Allow Discount Apply After Bill Print */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">3. Allow Discount Apply After Bill Print</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="allowDiscountAfterBillPrint"
                            checked={formData.allowDiscountAfterBillPrint}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 4: Allow Discount Apply Before Save */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">4. Allow Discount Apply Before Save</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="allowDiscountBeforeSave"
                            checked={formData.allowDiscountBeforeSave}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 5: Allow Pre-Order in TA/HD */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">5. Allow Pre-Order in TA/HD</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="allowPreOrderTAHD"
                            checked={formData.allowPreOrderTAHD}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 6: Ask for Covers */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">6. Ask for Covers</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="mb-2">
                          <div className="form-check">
                            <input style={{ borderColor: '#ccc' }}
                              className="form-check-input"
                              type="checkbox"
                              id="askCoversDineIn"
                              checked={formData.askCovers.dineIn}
                              onChange={(e) => handleNestedChange(e, 'askCovers', 'dineIn')}
                            />
                            <label className="form-check-label" htmlFor="askCoversDineIn">
                              Dine In
                            </label>
                          </div>
                        </div>
                        <div className="mb-2">
                          <div className="form-check">
                            <input style={{ borderColor: '#ccc' }}
                              className="form-check-input"
                              type="checkbox"
                              id="askCoversPickup"
                              checked={formData.askCovers.pickup}
                              onChange={(e) => handleNestedChange(e, 'askCovers', 'pickup')}
                            />
                            <label className="form-check-label" htmlFor="askCoversPickup">
                              Pickup
                            </label>
                          </div>
                        </div>
                        <div className="mb-2">
                          <div className="form-check">
                            <input style={{ borderColor: '#ccc' }}
                              className="form-check-input"
                              type="checkbox"
                              id="askCoversDelivery"
                              checked={formData.askCovers.delivery}
                              onChange={(e) => handleNestedChange(e, 'askCovers', 'delivery')}
                            />
                            <label className="form-check-label" htmlFor="askCoversDelivery">
                              Delivery
                            </label>
                          </div>
                        </div>
                        <div className="mb-3">
                          <div className="form-check">
                            <input style={{ borderColor: '#ccc' }}
                              className="form-check-input"
                              type="checkbox"
                              id="askCoversQuickBill"
                              checked={formData.askCovers.quickBill}
                              onChange={(e) => handleNestedChange(e, 'askCovers', 'quickBill')}
                            />
                            <label className="form-check-label" htmlFor="askCoversQuickBill">
                              Quick Bill
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 7: Ask for Covers in Captain */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">7. Ask for Covers in Captain</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="askCoversCaptain"
                            checked={formData.askCoversCaptain}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 8: Ask for Custom Order ID (Quick Bill) */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">8. Ask for Custom Order ID (Quick Bill)</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="askCustomOrderIdQuickBill"
                            checked={formData.askCustomOrderIdQuickBill}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 9: Ask for Custom Order Type (Quick Bill) */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">9. Ask for Custom Order Type (Quick Bill)</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="askCustomOrderTypeQuickBill"
                            checked={formData.askCustomOrderTypeQuickBill}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 10: Ask for Payment Mode On Save Bill */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">10. Ask for Payment Mode On Save Bill</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="askPaymentModeOnSaveBill"
                            checked={formData.askPaymentModeOnSaveBill}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 11: Ask for Waiter */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">11. Ask for Waiter</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="mb-2">
                          <div className="form-check">
                            <input style={{ borderColor: '#ccc' }}
                              className="form-check-input"
                              type="checkbox"
                              id="askWaiterDineIn"
                              checked={formData.askWaiter.dineIn}
                              onChange={(e) => handleNestedChange(e, 'askWaiter', 'dineIn')}
                            />
                            <label className="form-check-label" htmlFor="askWaiterDineIn">
                              Dine In
                            </label>
                          </div>
                        </div>
                        <div className="mb-2">
                          <div className="form-check">
                            <input style={{ borderColor: '#ccc' }}
                              className="form-check-input"
                              type="checkbox"
                              id="askWaiterPickup"
                              checked={formData.askWaiter.pickup}
                              onChange={(e) => handleNestedChange(e, 'askWaiter', 'pickup')}
                            />
                            <label className="form-check-label" htmlFor="askWaiterPickup">
                              Pickup
                            </label>
                          </div>
                        </div>
                        <div className="mb-2">
                          <div className="form-check">
                            <input style={{ borderColor: '#ccc' }}
                              className="form-check-input"
                              type="checkbox"
                              id="askWaiterDelivery"
                              checked={formData.askWaiter.delivery}
                              onChange={(e) => handleNestedChange(e, 'askWaiter', 'delivery')}
                            />
                            <label className="form-check-label" htmlFor="askWaiterDelivery">
                              Delivery
                            </label>
                          </div>
                        </div>
                        <div className="mb-3">
                          <div className="form-check">
                            <input style={{ borderColor: '#ccc' }}
                              className="form-check-input"
                              type="checkbox"
                              id="askWaiterQuickBill"
                              checked={formData.askWaiter.quickBill}
                              onChange={(e) => handleNestedChange(e, 'askWaiter', 'quickBill')}
                            />
                            <label className="form-check-label" htmlFor="askWaiterQuickBill">
                              Quick Bill
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 12: Ask OTP to change order status from order window */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">12. Ask OTP to change order status from order window</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="askOtpChangeOrderStatusOrderWindow"
                            checked={formData.askOtpChangeOrderStatusOrderWindow}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 13: Ask OTP to change order status from receipt section */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">13. Ask OTP to change order status from receipt section</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="askOtpChangeOrderStatusReceiptSection"
                            checked={formData.askOtpChangeOrderStatusReceiptSection}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 14: Auto Accept Remote KOT */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">14. Auto Accept Remote KOT</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="autoAcceptRemoteKOT"
                            checked={formData.autoAcceptRemoteKOT}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 15: Auto Out-of-Stock */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">15. Auto Out-of-Stock</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="autoOutOfStock"
                            checked={formData.autoOutOfStock}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 16: Auto Sync */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">16. Auto Sync</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="autoSync"
                            checked={formData.autoSync}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 17: Category Time For POS */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">17. Category Time For POS</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <input style={{ borderColor: '#ccc' }}
                          type="text"
                          className="form-control"
                          id="categoryTimeForPOS"
                          placeholder="Enter time"
                          value={formData.categoryTimeForPOS}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 18: Count Sales after Midnight in Previous Day */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">18. Count Sales after Midnight in Previous Day</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="countSalesAfterMidnight"
                            checked={formData.countSalesAfterMidnight}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 19: Customer Display */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">19. Customer Display</h6>
                      <p>Customer Display</p>
                      <p>Order Prompt</p>
                      <p>Order prompt</p>
                      <p>Media Fit With Bill View</p>
                      <p>Media Fit Without Bill View</p>
                      <p>File Upload Guidelines: Video (.mp4, max 50MB), Image (any format, max 5MB)</p>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <table className="table table-bordered mb-3">
                          <thead>
                            <tr style={{ borderColor: '#ccc' }}>
                              <th scope="col">Image</th>
                              <th scope="col">Rank</th>
                              <th scope="col">Name</th>
                              <th scope="col">Media</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr style={{ borderColor: '#ccc' }}>
                              <td colSpan={4} className="text-center">No Data</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 20: Customer Mandatory */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">20. Customer Mandatory</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="mb-2">
                          <div className="form-check">
                            <input style={{ borderColor: '#ccc' }}
                              className="form-check-input"
                              type="checkbox"
                              id="customerMandatoryDineIn"
                              checked={formData.customerMandatory.dineIn}
                              onChange={(e) => handleNestedChange(e, 'customerMandatory', 'dineIn')}
                            />
                            <label className="form-check-label" htmlFor="customerMandatoryDineIn">
                              Dine In
                            </label>
                          </div>
                        </div>
                        <div className="mb-2">
                          <div className="form-check">
                            <input style={{ borderColor: '#ccc' }}
                              className="form-check-input"
                              type="checkbox"
                              id="customerMandatoryPickup"
                              checked={formData.customerMandatory.pickup}
                              onChange={(e) => handleNestedChange(e, 'customerMandatory', 'pickup')}
                            />
                            <label className="form-check-label" htmlFor="customerMandatoryPickup">
                              Pickup
                            </label>
                          </div>
                        </div>
                        <div className="mb-2">
                          <div className="form-check">
                            <input style={{ borderColor: '#ccc' }}
                              className="form-check-input"
                              type="checkbox"
                              id="customerMandatoryDelivery"
                              checked={formData.customerMandatory.delivery}
                              onChange={(e) => handleNestedChange(e, 'customerMandatory', 'delivery')}
                            />
                            <label className="form-check-label" htmlFor="customerMandatoryDelivery">
                              Delivery
                            </label>
                          </div>
                        </div>
                        <div className="mb-3">
                          <div className="form-check">
                            <input style={{ borderColor: '#ccc' }}
                              className="form-check-input"
                              type="checkbox"
                              id="customerMandatoryQuickBill"
                              checked={formData.customerMandatory.quickBill}
                              onChange={(e) => handleNestedChange(e, 'customerMandatory', 'quickBill')}
                            />
                            <label className="form-check-label" htmlFor="customerMandatoryQuickBill">
                              Quick Bill
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 21: Default E-Bill Check */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">21. Default E-Bill Check</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="defaultEBillCheck"
                            checked={formData.defaultEBillCheck}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 22: Default Send Delivery Boy to Customer Check */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">22. Default Send Delivery Boy to Customer Check</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="defaultSendDeliveryBoyCheck"
                            checked={formData.defaultSendDeliveryBoyCheck}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 23: Edit Customize Order Number */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">23. Edit Customize Order Number</h6>
                      <p>Order No</p>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <input style={{ borderColor: '#ccc' }}
                          type="text"
                          className="form-control"
                          id="editCustomizeOrderNumber"
                          placeholder="Enter order number"
                          value={formData.editCustomizeOrderNumber}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 24: Enable Backup Notification Service */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">24. Enable Backup Notification Service</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="enableBackupNotificationService"
                            checked={formData.enableBackupNotificationService}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 25: Enable Customer Display Access */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">25. Enable Customer Display Access</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="enableCustomerDisplayAccess"
                            checked={formData.enableCustomerDisplayAccess}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 26: Filter items by order type */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">26. Filter items by order type</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="filterItemsByOrderType"
                            checked={formData.filterItemsByOrderType}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 27: Generate all reports based on the start and close dates */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">27. Generate all reports based on the start and close dates</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="generateReportsStartCloseDates"
                            checked={formData.generateReportsStartCloseDates}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 28: Hide Clear Data Check on Logout */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">28. Hide Clear Data Check on Logout</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="hideClearDataCheckLogout"
                            checked={formData.hideClearDataCheckLogout}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 29: Hide Item Price for Options */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">29. Hide Item Price for Options</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="hideItemPriceOptions"
                            checked={formData.hideItemPriceOptions}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 30: Hide Load Menu Button */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">30. Hide Load Menu Button</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="hideLoadMenuButton"
                            checked={formData.hideLoadMenuButton}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 31: Make Cancel & Delete Item Reason Compulsory */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">31. Make Cancel & Delete Item Reason Compulsory</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="makeCancelDeleteReasonCompulsory"
                            checked={formData.makeCancelDeleteReasonCompulsory}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 32: Make Discount Reason Mandatory */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">32. Make Discount Reason Mandatory</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="makeDiscountReasonMandatory"
                            checked={formData.makeDiscountReasonMandatory}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 33: Make Free Bill / Cancel Bill Reason Mandatory */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">33. Make Free Bill / Cancel Bill Reason Mandatory</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="makeFreeCancelBillReasonMandatory"
                            checked={formData.makeFreeCancelBillReasonMandatory}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 34: Make Payment Reference Number Mandatory */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">34. Make Payment Reference Number Mandatory</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="makePaymentRefNumberMandatory"
                            checked={formData.makePaymentRefNumberMandatory}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 35: Mandatory Delivery Boy Selection for Delivery Orders */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">35. Mandatory Delivery Boy Selection for Delivery Orders (Digital/Offline)</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="mandatoryDeliveryBoySelection"
                            checked={formData.mandatoryDeliveryBoySelection}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 36: Mark Order As Transfer Order */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">36. Mark Order As Transfer Order</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="markOrderAsTransferOrder"
                            checked={formData.markOrderAsTransferOrder}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 37: Online Payment Auto Settle */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">37. Online Payment Auto Settle</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="onlinePaymentAutoSettle"
                            checked={formData.onlinePaymentAutoSettle}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 38: Order Sync Settings */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">38. Order Sync Settings</h6>
                      <p>Auto-Sync Settings for Real-Time Cloud Updates</p>
                      <p>Available intervals for syncing order data to the cloud</p>
                      <p>Sets the number of orders to be synced in a single batch</p>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="mb-3">
                          <label className="form-label">Sync Interval</label>
                          <select style={{ borderColor: '#ccc' }}
                            className="form-select"
                            id="orderSyncSettingsAutoSyncInterval"
                            value={formData.orderSyncSettings.autoSyncInterval}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                orderSyncSettings: {
                                  ...prev.orderSyncSettings,
                                  autoSyncInterval: e.target.value,
                                },
                              }))
                            }
                          >
                            <option value="5">5 Minutes (Default)</option>
                            <option value="10">10 Minutes</option>
                            <option value="15">15 Minutes</option>
                          </select>
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Sync Batch Packet Size</label>
                          <input style={{ borderColor: '#ccc' }}
                            type="number"
                            className="form-control"
                            id="orderSyncSettingsSyncBatchPacketSize"
                            value={formData.orderSyncSettings.syncBatchPacketSize}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                orderSyncSettings: {
                                  ...prev.orderSyncSettings,
                                  syncBatchPacketSize: e.target.value,
                                },
                              }))
                            }
                            placeholder="10 (Default)"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 39: Separate Billing by Section */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">39. Separate Billing by Section</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="separateBillingBySection"
                            checked={formData.separateBillingBySection}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 40: Set entered amount while closing day as a opening amount of next day */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">40. Set entered amount while closing day as a opening amount of next day</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="setEnteredAmountAsOpening"
                            checked={formData.setEnteredAmountAsOpening}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 41: Show Alternative Item On Report Print */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">41. Show Alternative Item On Report Print</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="showAlternativeItemReportPrint"
                            checked={formData.showAlternativeItemReportPrint}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 42: Show Clear Sales Report on Logout */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">42. Show Clear Sales Report on Logout</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="showClearSalesReportLogout"
                            checked={formData.showClearSalesReportLogout}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 43: Show Order No (Label) on Pos */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">43. Show Order No (Label) on Pos</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="showOrderNoLabelPos"
                            checked={formData.showOrderNoLabelPos}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 44: Show Payment History Button */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">44. Show Payment History Button</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="showPaymentHistoryButton"
                            checked={formData.showPaymentHistoryButton}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 45: Show Remote KOT Option in KOT */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">45. Show Remote KOT Option in KOT</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="showRemoteKOTOption"
                            checked={formData.showRemoteKOTOption}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 46: Show Send Payment Link */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">46. Show Send Payment Link</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="showSendPaymentLink"
                            checked={formData.showSendPaymentLink}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 47: Stock Availability Display */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">47. Stock Availability Display</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="stockAvailabilityDisplay"
                            checked={formData.stockAvailabilityDisplay}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 48: Todays Report */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">48. Todays Report</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="mb-2">
                          <div className="form-check">
                            <input style={{ borderColor: '#ccc' }}
                              className="form-check-input"
                              type="checkbox"
                              id="todaysReportSalesSummary"
                              checked={formData.todaysReport.salesSummary}
                              onChange={(e) => handleNestedChange(e, 'todaysReport', 'salesSummary')}
                            />
                            <label className="form-check-label" htmlFor="todaysReportSalesSummary">
                              Sales Summary / Z Report Summary
                            </label>
                          </div>
                        </div>
                        <div className="mb-2">
                          <div className="form-check">
                            <input style={{ borderColor: '#ccc' }}
                              className="form-check-input"
                              type="checkbox"
                              id="todaysReportOrderTypeSummary"
                              checked={formData.todaysReport.orderTypeSummary}
                              onChange={(e) => handleNestedChange(e, 'todaysReport', 'orderTypeSummary')}
                            />
                            <label className="form-check-label" htmlFor="todaysReportOrderTypeSummary">
                              Order Type Summary
                            </label>
                          </div>
                        </div>
                        <div className="mb-2">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="todaysReportPaymentTypeSummary"
                              checked={formData.todaysReport.paymentTypeSummary}
                              onChange={(e) => handleNestedChange(e, 'todaysReport', 'paymentTypeSummary')}
                            />
                            <label className="form-check-label" htmlFor="todaysReportPaymentTypeSummary">
                              Payment Type Summary
                            </label>
                          </div>
                        </div>
                        <div className="mb-2">
                          <div className="form-check">
                            <input style={{ borderColor: '#ccc' }}
                              className="form-check-input"
                              type="checkbox"
                              id="todaysReportDiscountSummary"
                              checked={formData.todaysReport.discountSummary}
                              onChange={(e) => handleNestedChange(e, 'todaysReport', 'discountSummary')}
                            />
                            <label className="form-check-label" htmlFor="todaysReportDiscountSummary">
                              Discount Summary
                            </label>
                          </div>
                        </div>
                        <div className="mb-2">
                          <div className="form-check">
                            <input style={{ borderColor: '#ccc' }}
                              className="form-check-input"
                              type="checkbox"
                              id="todaysReportExpenseSummary"
                              checked={formData.todaysReport.expenseSummary}
                              onChange={(e) => handleNestedChange(e, 'todaysReport', 'expenseSummary')}
                            />
                            <label className="form-check-label" htmlFor="todaysReportExpenseSummary">
                              Expense Summary
                            </label>
                          </div>
                        </div>
                        <div className="mb-2">
                          <div className="form-check">
                            <input style={{ borderColor: '#ccc' }}
                              className="form-check-input"
                              type="checkbox"
                              id="todaysReportBillSummary"
                              checked={formData.todaysReport.billSummary}
                              onChange={(e) => handleNestedChange(e, 'todaysReport', 'billSummary')}
                            />
                            <label className="form-check-label" htmlFor="todaysReportBillSummary">
                              Bill Summary
                            </label>
                          </div>
                        </div>
                        <div className="mb-2">
                          <div className="form-check">
                            <input style={{ borderColor: '#ccc' }}
                              className="form-check-input"
                              type="checkbox"
                              id="todaysReportDeliveryBoySummary"
                              checked={formData.todaysReport.deliveryBoySummary}
                              onChange={(e) => handleNestedChange(e, 'todaysReport', 'deliveryBoySummary')}
                            />
                            <label className="form-check-label" htmlFor="todaysReportDeliveryBoySummary">
                              Delivery Boy Summary
                            </label>
                          </div>
                        </div>
                        <div className="mb-2">
                          <div className="form-check">
                            <input style={{ borderColor: '#ccc' }}
                              className="form-check-input"
                              type="checkbox"
                              id="todaysReportWaiterSummary"
                              checked={formData.todaysReport.waiterSummary}
                              onChange={(e) => handleNestedChange(e, 'todaysReport', 'waiterSummary')}
                            />
                            <label className="form-check-label" htmlFor="todaysReportWaiterSummary">
                              Waiter Summary
                            </label>
                          </div>
                        </div>
                        <div className="mb-2">
                          <div className="form-check">
                            <input style={{ borderColor: '#ccc' }}
                              className="form-check-input"
                              type="checkbox"
                              id="todaysReportKitchenDepartmentSummary"
                              checked={formData.todaysReport.kitchenDepartmentSummary}
                              onChange={(e) => handleNestedChange(e, 'todaysReport', 'kitchenDepartmentSummary')}
                            />
                            <label className="form-check-label" htmlFor="todaysReportKitchenDepartmentSummary">
                              Kitchen Department Summary
                            </label>
                          </div>
                        </div>
                        <div className="mb-2">
                          <div className="form-check">
                            <input style={{ borderColor: '#ccc' }}
                              className="form-check-input"
                              type="checkbox"
                              id="todaysReportCategorySummary"
                              checked={formData.todaysReport.categorySummary}
                              onChange={(e) => handleNestedChange(e, 'todaysReport', 'categorySummary')}
                            />
                            <label className="form-check-label" htmlFor="todaysReportCategorySummary">
                              Category Summary
                            </label>
                          </div>
                        </div>
                        <div className="mb-2">
                          <div className="form-check">
                            <input style={{ borderColor: '#ccc' }}
                              className="form-check-input"
                              type="checkbox"
                              id="todaysReportSoldItemsSummary"
                              checked={formData.todaysReport.soldItemsSummary}
                              onChange={(e) => handleNestedChange(e, 'todaysReport', 'soldItemsSummary')}
                            />
                            <label className="form-check-label" htmlFor="todaysReportSoldItemsSummary">
                              Sold Items Summary
                            </label>
                          </div>
                        </div>
                        <div className="mb-2">
                          <div className="form-check">
                            <input style={{ borderColor: '#ccc' }}
                              className="form-check-input"
                              type="checkbox"
                              id="todaysReportCancelItemsSummary"
                              checked={formData.todaysReport.cancelItemsSummary}
                              onChange={(e) => handleNestedChange(e, 'todaysReport', 'cancelItemsSummary')}
                            />
                            <label className="form-check-label" htmlFor="todaysReportCancelItemsSummary">
                              Cancel Items Summary
                            </label>
                          </div>
                        </div>
                        <div className="mb-2">
                          <div className="form-check">
                            <input style={{ borderColor: '#ccc' }}
                              className="form-check-input"
                              type="checkbox"
                              id="todaysReportWalletSummary"
                              checked={formData.todaysReport.walletSummary}
                              onChange={(e) => handleNestedChange(e, 'todaysReport', 'walletSummary')}
                            />
                            <label className="form-check-label" htmlFor="todaysReportWalletSummary">
                              Wallet Summary
                            </label>
                          </div>
                        </div>
                        <div className="mb-2">
                          <div className="form-check">
                            <input style={{ borderColor: '#ccc' }}
                              className="form-check-input"
                              type="checkbox"
                              id="todaysReportDuePaymentReceivedSummary"
                              checked={formData.todaysReport.duePaymentReceivedSummary}
                              onChange={(e) => handleNestedChange(e, 'todaysReport', 'duePaymentReceivedSummary')}
                            />
                            <label className="form-check-label" htmlFor="todaysReportDuePaymentReceivedSummary">
                              Due Payment Received Summary
                            </label>
                          </div>
                        </div>
                        <div className="mb-2">
                          <div className="form-check">
                            <input style={{ borderColor: '#ccc' }}
                              className="form-check-input"
                              type="checkbox"
                              id="todaysReportDuePaymentReceivableSummary"
                              checked={formData.todaysReport.duePaymentReceivableSummary}
                              onChange={(e) => handleNestedChange(e, 'todaysReport', 'duePaymentReceivableSummary')}
                            />
                            <label className="form-check-label" htmlFor="todaysReportDuePaymentReceivableSummary">
                              Due Payment Receivable Summary
                            </label>
                          </div>
                        </div>
                        <div className="mb-2">
                          <div className="form-check">
                            <input style={{ borderColor: '#ccc' }}
                              className="form-check-input"
                              type="checkbox"
                              id="todaysReportPaymentVarianceSummary"
                              checked={formData.todaysReport.paymentVarianceSummary}
                              onChange={(e) => handleNestedChange(e, 'todaysReport', 'paymentVarianceSummary')}
                            />
                            <label className="form-check-label" htmlFor="todaysReportPaymentVarianceSummary">
                              Payment Variance Summary
                            </label>
                          </div>
                        </div>
                        <div className="mb-3">
                          <div className="form-check">
                            <input style={{ borderColor: '#ccc' }}
                              className="form-check-input"
                              type="checkbox"
                              id="todaysReportCurrencyDenominationsSummary"
                              checked={formData.todaysReport.currencyDenominationsSummary}
                              onChange={(e) => handleNestedChange(e, 'todaysReport', 'currencyDenominationsSummary')}
                            />
                            <label className="form-check-label" htmlFor="todaysReportCurrencyDenominationsSummary">
                              Currency Denominations Summary
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 49: UPI Payment Sound Notification On Desktop POS */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">49. UPI Payment Sound Notification On Desktop POS</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="upiPaymentSoundNotification"
                            checked={formData.upiPaymentSoundNotification}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 50: Use Separate Bill Numbers for Online Orders */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">50. Use Separate Bill Numbers for Online Orders</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="useSeparateBillNumbersOnline"
                            checked={formData.useSeparateBillNumbersOnline}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 51: When do you want to send todays report */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">51. When do you want to send todays report</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <select style={{ borderColor: '#ccc' }}
                          className="form-select"
                          id="whenSendTodaysReport"
                          value={formData.whenSendTodaysReport}
                      
                        >
                          <option value="">Select an option</option>
                          <option value="receiptSection">Print Todays Report From Receipt Section</option>
                          <option value="reportSection">Print Todays Report From Report Section</option>
                          <option value="closeDay">Print Report When We Close The Day</option>
                          <option value="closeDayReportSection">Print Close Day Report From Report Section</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 52: Enable Currency Conversion */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">52. Enable Currency Conversion</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="enableCurrencyConversion"
                            checked={formData.enableCurrencyConversion}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 53: Enable user login validation */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">53. Enable user login validation</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="enableUserLoginValidation"
                            checked={formData.enableUserLoginValidation}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 54: Allow Closing Shift Despite Saved or Printed Bills */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">54. Allow Closing Shift Despite Saved or Printed Bills</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="allowClosingShiftDespiteBills"
                            checked={formData.allowClosingShiftDespiteBills}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <hr className="my-2" style={{ borderColor: '#ccc' }} />

                  {/* Row 55: Show Real-Time KOT/Bill Notifications/Updates */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3">55. Show Real-Time KOT/Bill Notifications/Updates from CSK App & Terminal POS on Master POS</h6>
                    </div>
                    <div className="col-md-6">
                      <div className="ms-3">
                        <div className="form-check form-switch">
                          <input style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="showRealTimeKOTBillNotifications"
                            checked={formData.showRealTimeKOTBillNotifications}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>                  <div
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