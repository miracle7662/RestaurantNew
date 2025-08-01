import React from 'react';
import { useNavigate } from 'react-router-dom';

const BillPrintSettings: React.FC = () => {
  const navigate = useNavigate();

  // Handle tab navigation
  const handleTabClick = (tab: string) => {
    if (tab === 'kot-print') {
      navigate('/kot-print-settings');
    } else if (tab === 'bill-preview') {
      navigate('/bill-preview-settings');
    } else if (tab === 'general') {
      navigate('/general-settings');
    } else if (tab === 'online-orders') {
      navigate('/online-orders-settings');
    }
    // 'bill-print' tab is the current page, no navigation needed
  };

  // Handlers for Close and Update buttons
  const handleClose = () => {
    navigate('/add-outlet');
  };

  const handleUpdate = () => {
    console.log('Bill print settings updated');
    // Add your update logic here (e.g., API call to save settings)
  };

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
          <button
            className="nav-link"
            onClick={() => handleTabClick('kot-print')}
            type="button"
          >
            KOT PRINT SETTINGS
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className="nav-link active"
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

      {/* Bill Print Settings Content */}
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
        </div>

        {/* Footer with Close and Update Buttons */}
        <div className="card-footer d-flex justify-content-end gap-2">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleClose}
          >
            Close
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleUpdate}
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
};

export default BillPrintSettings;