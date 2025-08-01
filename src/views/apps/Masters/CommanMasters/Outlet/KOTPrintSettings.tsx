import React from 'react';
import { useNavigate } from 'react-router-dom';

const KOTPrintSettings: React.FC = () => {
  const navigate = useNavigate();

  // Handle tab navigation
  const handleTabClick = (tab: string) => {
    if (tab !== 'kot-print') {
      navigate('/add-outlet');
    }
  };

  // Handlers for Close and Update buttons
  const handleClose = () => {
    // Navigate back to a previous page (e.g., /add-outlet)
    navigate('/add-outlet');
  };

  const handleUpdate = () => {
    // Placeholder for update logic
    console.log('Settings updated');
    // Add your update logic here (e.g., API call to save settings)
    // Optionally navigate after update
    // navigate('/add-outlet');
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
                      id="dineIn"
                    />
                    <label className="form-check-label" htmlFor="dineIn">
                      Dine In
                    </label>
                  </div>
                </div>
                <div className="mb-2">
                  <div className="form-check">
                    <input
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
                    <input
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
                    <input
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
                <select
                  className="form-select"
                  aria-label="Name and Mobile Number"
                >
                  <option value="enabled">Name And Mobile Number</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>
            </div>
          </div>
          <hr className="my-2" /> {/* Horizontal line after the first row */}

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
                    id="groupKOTItems"
                  />
                </div>
              </div>
            </div>
          </div>
          <hr className="my-2" /> {/* Horizontal line after second row */}

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
                    id="hideTableName"
                  />
                </div>
              </div>
            </div>
          </div>
          <hr className="my-2" /> {/* Horizontal line after third row */}

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
                  <input
                    type="text"
                    className="form-control"
                    placeholder="New Order Tag Label"
                    defaultValue="New Order"
                  />
                </div>
                <div className="mb-3">
                  <div className="form-check form-switch">
                    <input
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
          <hr className="my-2" /> {/* Horizontal line after fourth row */}

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
                    placeholder="Dine In KOT No"
                  />
                </div>
                <div className="mb-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Pickup KOT No"
                  />
                </div>
                <div className="mb-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Delivery KOT No"
                  />
                </div>
                <div className="mb-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Quick Bill"
                  />
                </div>
              </div>
            </div>
          </div>
          <hr className="my-2" /> {/* Horizontal line after fifth row */}

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
                    id="modifierOption"
                  />
                </div>
              </div>
            </div>
          </div>
          <hr className="my-2" /> {/* Horizontal line after sixth row */}

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
                    id="showKOTNumber"
                  />
                </div>
              </div>
            </div>
          </div>
          <hr className="my-2" /> {/* Horizontal line after seventh row */}

          {/* Eighth Row: Show KOT Time */}
          <div className="row mb-2">
            <div className="col-md-6">
              <h6 className="fw-bold mb-3">8. Show KOT Time</h6>
            </div>
            <div className="col-md-6">
              <div className="ms-3">
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="showKOTTime"
                  />
                </div>
              </div>
            </div>
          </div>
          <hr className="my-2" /> {/* Horizontal line after eighth row */}

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
                    id="showWaiterName"
                  />
                </div>
              </div>
            </div>
          </div>
          <hr className="my-2" /> {/* Horizontal line after ninth row */}

          {/* Tenth Row: Show Item Code */}
          <div className="row mb-2">
            <div className="col-md-6">
              <h6 className="fw-bold mb-3">10. Show Item Code</h6>
            </div>
            <div className="col-md-6">
              <div className="ms-3">
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="showItemCode"
                  />
                </div>
              </div>
            </div>
          </div>
          <hr className="my-2" /> {/* Horizontal line after tenth row */}

          {/* Eleventh Row: Show Item Short Name */}
          <div className="row mb-2">
            <div className="col-md-6">
              <h6 className="fw-bold mb-3">11. Show Item Short Name</h6>
            </div>
            <div className="col-md-6">
              <div className="ms-3">
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="showItemShortName"
                  />
                </div>
              </div>
            </div>
          </div>
          <hr className="my-2" /> {/* Horizontal line after eleventh row */}

          {/* Twelfth Row: Show Item Serial Number */}
          <div className="row mb-2">
            <div className="col-md-6">
              <h6 className="fw-bold mb-3">12. Show Item Serial Number</h6>
            </div>
            <div className="col-md-6">
              <div className="ms-3">
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="showItemSerialNumber"
                  />
                </div>
              </div>
            </div>
          </div>
          <hr className="my-2" /> {/* Horizontal line after twelfth row */}

          {/* Thirteenth Row: Show KOT Serial Number */}
          <div className="row mb-2">
            <div className="col-md-6">
              <h6 className="fw-bold mb-3">13. Show KOT Serial Number</h6>
            </div>
            <div className="col-md-6">
              <div className="ms-3">
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="showKOTSerialNumber"
                  />
                </div>
              </div>
            </div>
          </div>
          <hr className="my-2" /> {/* Horizontal line after thirteenth row */}

          {/* Fourteenth Row: Show Table Name (Quick Bill) */}
          <div className="row mb-2">
            <div className="col-md-6">
              <h6 className="fw-bold mb-3">
                14. Show Table Name (Quick Bill)
              </h6>
            </div>
            <div className="col-md-6">
              <div className="ms-3">
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="showTableNameQuickBill"
                    defaultChecked
                  />
                </div>
              </div>
            </div>
          </div>
          <hr className="my-2" /> {/* Horizontal line after fourteenth row */}

          {/* Fifteenth Row: Show Customer Name (Quick Bill) */}
          <div className="row mb-2">
            <div className="col-md-6">
              <h6 className="fw-bold mb-3">
                15. Show Customer Name (Quick Bill)
              </h6>
            </div>
            <div className="col-md-6">
              <div className="ms-3">
                <div className="mb-2">
                  <div className="form-check">
                    <input
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
          <hr className="my-2" /> {/* Horizontal line after fifteenth row */}

          {/* Sixteenth Row: Show Customer Mobile Number (Quick Bill) */}
          <div className="row mb-2">
            <div className="col-md-6">
              <h6 className="fw-bold mb-3">
                16. Show Customer Mobile Number (Quick Bill)
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
          <hr className="my-2" /> {/* Horizontal line after sixteenth row */}

          {/* Seventeenth Row: Show Item Note */}
          <div className="row mb-2">
            <div className="col-md-6">
              <h6 className="fw-bold mb-3">17. Show Item Note</h6>
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
          <hr className="my-2" /> {/* Horizontal line after seventeenth row */}

          {/* Eighteenth Row: Show KOT Note */}
          <div className="row mb-2">
            <div className="col-md-6">
              <h6 className="fw-bold mb-3">18. Show KOT Note</h6>
            </div>
            <div className="col-md-6">
              <div className="ms-3">
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="showKOTNote"
                  />
                </div>
              </div>
            </div>
          </div>
          <hr className="my-2" /> {/* Horizontal line after eighteenth row */}

          {/* Nineteenth Row: Show Item Rate */}
          <div className="row mb-2">
            <div className="col-md-6">
              <h6 className="fw-bold mb-3">19. Show Item Rate</h6>
            </div>
            <div className="col-md-6">
              <div className="ms-3">
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="showItemRate"
                  />
                </div>
              </div>
            </div>
          </div>
          <hr className="my-2" /> {/* Horizontal line after nineteenth row */}

          {/* Twentieth Row: Show KOT Total */}
          <div className="row mb-2">
            <div className="col-md-6">
              <h6 className="fw-bold mb-3">20. Show KOT Total</h6>
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
          <hr className="my-2" /> {/* Horizontal line after twentieth row */}

          {/* Twenty-First Row: Show KOT Date */}
          <div className="row mb-2">
            <div className="col-md-6">
              <h6 className="fw-bold mb-3">21. Show KOT Date</h6>
            </div>
            <div className="col-md-6">
              <div className="ms-3">
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="showKOTDate"
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

export default KOTPrintSettings;