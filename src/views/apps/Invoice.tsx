    <div
      className={`tab-pane fade ${activeTab === 'kot-print' ? 'show active' : ''}`}
      id="kot-print"
      role="tabpanel"
      aria-labelledby="kot-print-tab"
    >
      <div className="container-fluid">
        <div className="row">
          {/* Left Column - KOT Settings Form (Scrollable) */}
          <div className="col-lg-8">
            <div className="card shadow-sm h-100">
              <div className="card-body" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
                <h2 className="card-title h5 fw-bold mb-4">KOT Print Settings</h2>
                <div className="row mb-2">
                  <div className="col-md-6">
                    <div className="d-flex align-items-center mb-3">
                      <span className="me-2">#</span>
                      <input
                        style={{ borderColor: '#ccc' }}
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
                          <input
                            style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="customer_on_kot_dine_in"
                            checked={formData.customer_on_kot_dine_in}
                            onChange={handleInputChange}
                          />
                          <label
                            className="form-check-label"
                            htmlFor="customer_on_kot_dine_in"
                          >
                            Dine In
                          </label>
                        </div>
                      </div>
                      <div className="mb-2">
                        <div className="form-check">
                          <input
                            style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="customer_on_kot_pickup"
                            checked={formData.customer_on_kot_pickup}
                            onChange={handleInputChange}
                          />
                          <label
                            className="form-check-label"
                            htmlFor="customer_on_kot_pickup"
                          >
                            Pickup
                          </label>
                        </div>
                      </div>
                      <div className="mb-2">
                        <div className="form-check">
                          <input
                            style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="customer_on_kot_delivery"
                            checked={formData.customer_on_kot_delivery}
                            onChange={handleInputChange}
                          />
                          <label
                            className="form-check-label"
                            htmlFor="customer_on_kot_delivery"
                          >
                            Delivery
                          </label>
                        </div>
                      </div>
                      <div className="mb-3">
                        <div className="form-check">
                          <input
                            style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="customer_on_kot_quick_bill"
                            checked={formData.customer_on_kot_quick_bill}
                            onChange={handleInputChange}
                          />
                          <label
                            className="form-check-label"
                            htmlFor="customer_on_kot_quick_bill"
                          >
                            Quick Bill
                          </label>
                        </div>
                      </div>
                      <select
                        style={{ borderColor: '#ccc' }}
                        className="form-select"
                        id="customer_kot_display_option"
                        value={formData.customer_kot_display_option}
                        onChange={handleInputChange}
                      >
                        <option value="NAME_ONLY">Name Only</option>
                        <option value="NAME_AND_MOBILE">Name and Mobile Number</option>
                        <option value="DISABLED">Disabled</option>
                      </select>
                    </div>
                  </div>
                </div>
                <hr className="my-2" style={{ borderColor: '#ccc' }} />
                <div className="row mb-2">
                  <div className="col-md-6">
                    <h6 className="fw-bold mb-3">2. Group KOT Items by Category on KOT</h6>
                  </div>
                  <div className="col-md-6">
                    <div className="ms-3">
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="group_kot_items_by_category"
                          checked={formData.group_kot_items_by_category}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <hr className="my-2" style={{ borderColor: '#ccc' }} />
                <div className="row mb-2">
                  <div className="col-md-6">
                    <h6 className="fw-bold mb-3">3. Hide Table Name on KOT (Quick Bill)</h6>
                  </div>
                  <div className="col-md-6">
                    <div className="ms-3">
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="hide_table_name_quick_bill"
                          checked={formData.hide_table_name_quick_bill}
                          onChange={handleInputChange}
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
                          <input
                            style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="show_new_order_tag"
                            checked={formData.show_new_order_tag}
                            onChange={handleInputChange}
                          />
                          <label
                            className="form-check-label"
                            htmlFor="show_new_order_tag"
                          >
                            Show New Order Tag
                          </label>
                        </div>
                      </div>
                      <div className="mb-3">
                        <input
                          style={{ borderColor: '#ccc' }}
                          type="text"
                          className="form-control"
                          id="new_order_tag_label"
                          placeholder="New Order Tag Label"
                          value={formData.new_order_tag_label}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="mb-3">
                        <div className="form-check form-switch">
                          <input
                            style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="show_running_order_tag"
                            checked={formData.show_running_order_tag}
                            onChange={handleInputChange}
                          />
                          <label
                            className="form-check-label"
                            htmlFor="show_running_order_tag"
                          >
                            Show Running Order Tag
                          </label>
                        </div>
                      </div>
                      <div className="mb-3">
                        <input
                          style={{ borderColor: '#ccc' }}
                          type="text"
                          className="form-control"
                          id="running_order_tag_label"
                          placeholder="Running Order Tag Label"
                          value={formData.running_order_tag_label}
                          onChange={handleInputChange}
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
                        <input
                          style={{ borderColor: '#ccc' }}
                          type="text"
                          className="form-control"
                          id="dine_in_kot_no"
                          placeholder="Dine In KOT No"
                          value={formData.dine_in_kot_no}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="mb-3">
                        <input
                          style={{ borderColor: '#ccc' }}
                          type="text"
                          className="form-control"
                          id="pickup_kot_no"
                          placeholder="Pickup KOT No"
                          value={formData.pickup_kot_no}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="mb-3">
                        <input
                          style={{ borderColor: '#ccc' }}
                          type="text"
                          className="form-control"
                          id="delivery_kot_no"
                          placeholder="Delivery KOT No"
                          value={formData.delivery_kot_no}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="mb-3">
                        <input
                          style={{ borderColor: '#ccc' }}
                          type="text"
                          className="form-control"
                          id="quick_bill_kot_no"
                          placeholder="Quick Bill"
                          value={formData.quick_bill_kot_no}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <hr className="my-2" style={{ borderColor: '#ccc' }} />
                <div className="row mb-2">
                  <div className="col-md-6">
                    <h6 className="fw-bold mb-3">6. Modifier default Option on KOT Print</h6>
                  </div>
                  <div className="col-md-6">
                    <div className="ms-3">
                      <div className="form-check form-switch">
                        <input
                          style={{ borderColor: '#ccc' }}
                          className="form-check-input"
                          type="checkbox"
                          id="modifier_default_option"
                          checked={formData.modifier_default_option}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <hr className="my-2" style={{ borderColor: '#ccc' }} />
                <div className="row mb-2">
                  <div className="col-md-6">
                    <h6 className="fw-bold mb-3">
                      7. Print KOT In Both Languages (English and Hindi)
                    </h6>
                  </div>
                  <div className="col-md-6">
                    <div className="ms-3">
                      <div className="form-check form-switch">
                        <input
                          style={{ borderColor: '#ccc' }}
                          className="form-check-input"
                          type="checkbox"
                          id="print_kot_both_languages"
                          checked={formData.print_kot_both_languages}
                          onChange={handleInputChange}
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
                        <input
                          style={{ borderColor: '#ccc' }}
                          className="form-check-input"
                          type="checkbox"
                          id="show_alternative_item"
                          checked={formData.show_alternative_item}
                          onChange={handleInputChange}
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
                        <input
                          style={{ borderColor: '#ccc' }}
                          className="form-check-input"
                          type="checkbox"
                          id="show_captain_username"
                          checked={formData.show_captain_username}
                          onChange={handleInputChange}
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
                        <input
                          style={{ borderColor: '#ccc' }}
                          className="form-check-input"
                          type="checkbox"
                          id="show_covers_as_guest"
                          checked={formData.show_covers_as_guest}
                          onChange={handleInputChange}
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
                        <input
                          style={{ borderColor: '#ccc' }}
                          className="form-check-input"
                          type="checkbox"
                          id="show_item_price"
                          checked={formData.show_item_price}
                          onChange={handleInputChange}
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
                        <input
                          style={{ borderColor: '#ccc' }}
                          className="form-check-input"
                          type="checkbox"
                          id="show_kot_no_quick_bill"
                          checked={formData.show_kot_no_quick_bill}
                          onChange={handleInputChange}
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
                        <input
                          style={{ borderColor: '#ccc' }}
                          className="form-check-input"
                          type="checkbox"
                          id="show_kot_note"
                          checked={formData.show_kot_note}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <hr className="my-2" style={{ borderColor: '#ccc' }} />
                <div className="row mb-2">
                  <div className="col-md-6">
                    <h6 className="fw-bold mb-3">14. Show Online Order OTP on KOT</h6>
                  </div>
                  <div className="col-md-6">
                    <div className="ms-3">
                      <div className="form-check form-switch">
                        <input
                          style={{ borderColor: '#ccc' }}
                          className="form-check-input"
                          type="checkbox"
                          id="show_online_order_otp"
                          checked={formData.show_online_order_otp}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <hr className="my-2" style={{ borderColor: '#ccc' }} />
                <div className="row mb-2">
                  <div className="col-md-6">
                    <h6 className="fw-bold mb-3">15. Show Order ID On KOT</h6>
                  </div>
                  <div className="col-md-6">
                    <div className="ms-3">
                      <div className="mb-2">
                        <div className="form-check">
                          <input
                            style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="show_order_id_quick_bill"
                            checked={formData.show_order_id_quick_bill}
                            onChange={handleInputChange}
                          />
                          <label
                            className="form-check-label"
                            htmlFor="show_order_id_quick_bill"
                          >
                            Quick Bill
                          </label>
                        </div>
                      </div>
                      <div className="mb-2">
                        <div className="form-check">
                          <input
                            style={{ borderColor: '#ccc' }}
                            className="form-check-input"
                            type="checkbox"
                            id="show_order_id_online_order"
                            checked={formData.show_order_id_online_order}
                            onChange={handleInputChange}
                          />
                          <label
                            className="form-check-label"
                            htmlFor="show_order_id_online_order"
                          >
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
                    <h6 className="fw-bold mb-3">16. Show Order No on Quick Bill Section KOT</h6>
                  </div>
                  <div className="col-md-6">
                    <div className="ms-3">
                      <div className="form-check form-switch">
                        <input
                          style={{ borderColor: '#ccc' }}
                          className="form-check-input"
                          type="checkbox"
                          id="show_order_no_quick_bill_section"
                          checked={formData.show_order_no_quick_bill_section}
                          onChange={handleInputChange}
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
                          style={{ borderColor: '#ccc' }}
                          className="form-check-input"
                          type="checkbox"
                          id="show_order_type_symbol"
                          checked={formData.show_order_type_symbol}
                          onChange={handleInputChange}
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
                        <input
                          style={{ borderColor: '#ccc' }}
                          className="form-check-input"
                          type="checkbox"
                          id="show_store_name"
                          checked={formData.show_store_name}
                          onChange={handleInputChange}
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
                        <input
                          style={{ borderColor: '#ccc' }}
                          className="form-check-input"
                          type="checkbox"
                          id="show_terminal_username"
                          checked={formData.show_terminal_username}
                          onChange={handleInputChange}
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
                          style={{ borderColor: '#ccc' }}
                          className="form-check-input"
                          type="checkbox"
                          id="show_username"
                          checked={formData.show_username}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <hr className="my-2" style={{ borderColor: '#ccc' }} />
                <div className="row mb-2">
                  <div className="col-md-6">
                    <h6 className="fw-bold mb-3">21. Show Waiter On KOT</h6>
                  </div>
                  <div className="col-md-6">
                    <div className="ms-3">
                      <div className="form-check form-switch">
                        <input
                          style={{ borderColor: '#ccc' }}
                          className="form-check-input"
                          type="checkbox"
                          id="show_waiter"
                          checked={formData.show_waiter}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  className="d-flex justify-content-end gap-3 mt-4"
                  style={{ padding: '10px' }}
                >
                  <Button className="btn btn-danger" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button className="btn btn-success" onClick={handleUpdate}>
                    Update
                  </Button>
                </div>
              </div>
            </div>
          </div>
          {/* Right Column - KOT Preview (Non-Scrollable) */}
          <div className="col-lg-4">
            <div className="card shadow-sm h-100">
              <div className="card-header bg-light">
                <h5 className="card-title mb-0 text-center fw-bold">KOT Preview</h5>
              </div>
              <div className="card-body" style={{ fontSize: '0.85rem', overflow: 'hidden' }}>
                {/* Store Name and Details */}
                {formData.show_store_name && (
                  <div className="text-center mb-3">
                    <h6 className="fw-bold mb-1">Restaurant Name</h6>
                    <div className="small text-muted">Kolhapur Road Kolhapur 416416</div>
                    <div className="small text-muted">sangli@gmail.com</div>
                  </div>
                )}
                {formData.show_store_name && (
                  <div style={{ borderBottom: '1px dashed #ccc', margin: '10px 0' }}></div>
                )}

                {/* KOT Header */}
                <div className="text-center mb-3">
                  <h6 className="fw-bold">
                    {formData.dine_in_kot_no || 'KITCHEN ORDER TICKET'}
                    {formData.show_new_order_tag && formData.new_order_tag_label && (
                      <span className="ms-2 badge bg-primary">{formData.new_order_tag_label}</span>
                    )}
                    {formData.show_running_order_tag && formData.running_order_tag_label && (
                      <span className="ms-2 badge bg-secondary">{formData.running_order_tag_label}</span>
                    )}
                  </h6>
                </div>

                {/* KOT Details */}
                <div className="row mb-2">
                  <div className="col-6">
                    {(formData.show_kot_no_quick_bill || !formData.hide_table_name_quick_bill) && (
                      <small>
                        <strong>KOT No:</strong> KOT001
                      </small>
                    )}
                    {formData.show_order_id_quick_bill && (
                      <small className="d-block">
                        <strong>Order ID:</strong> ORD123
                      </small>
                    )}
                    {formData.show_online_order_otp && (
                      <small className="d-block">
                        <strong>OTP:</strong> 9876
                      </small>
                    )}
                  </div>
                  <div className="col-6 text-end">
                    {!formData.hide_table_name_quick_bill && (
                      <small>
                        <strong>Table:</strong> T-05
                      </small>
                    )}
                    {formData.show_covers_as_guest && (
                      <small className="d-block">
                        <strong>Guests:</strong> 4
                      </small>
                    )}
                  </div>
                </div>

                <div className="row mb-2">
                  <div className="col-6">
                    <small>
                      <strong>Date:</strong> 26/05/2025
                    </small>
                  </div>
                  <div className="col-6 text-end">
                    <small>
                      <strong>Time:</strong> 9:10 PM
                    </small>
                  </div>
                </div>

                <div className="row mb-2">
                  <div className="col-6">
                    <small>
                      <strong>Order Type:</strong> Dine In{' '}
                      {formData.show_order_type_symbol && <span>(🍽️)</span>}
                    </small>
                  </div>
                  <div className="col-6 text-end">
                    {formData.show_waiter && (
                      <small>
                        <strong>Waiter:</strong> John
                      </small>
                    )}
                    {formData.show_captain_username && (
                      <small className="d-block">
                        <strong>Captain:</strong> CaptainJane
                      </small>
                    )}
                    {formData.show_username && (
                      <small className="d-block">
                        <strong>Username:</strong> User123
                      </small>
                    )}
                    {formData.show_terminal_username && (
                      <small className="d-block">
                        <strong>Terminal:</strong> Term01
                      </small>
                    )}
                  </div>
                </div>

                {(formData.customer_on_kot_dine_in || formData.customer_on_kot_quick_bill) &&
                  formData.customer_kot_display_option !== 'DISABLED' && (
                    <>
                      <div style={{ borderBottom: '1px dashed #ccc', margin: '10px 0' }}></div>
                      <div className="mb-2">
                        <small>
                          <strong>Customer:</strong> John Doe
                        </small>
                        {formData.customer_kot_display_option === 'NAME_AND_MOBILE' && (
                          <small className="d-block">
                            <strong>Mobile:</strong> +91 9876543210
                          </small>
                        )}
                      </div>
                    </>
                  )}

                <div style={{ borderBottom: '1px dashed #ccc', margin: '10px 0' }}></div>

                {/* Items Header */}
                <div
                  className="row fw-bold small pb-1 mb-2"
                  style={{ borderBottom: '1px solid #dee2e6' }}
                >
                  <div className="col-1">#</div>
                  <div className="col-5">Item Name</div>
                  <div className="col-2 text-center">Qty</div>
                  <div className="col-2 text-end">Rate</div>
                  {formData.show_item_price && (
                    <div className="col-2 text-end">Amount</div>
                  )}
                </div>

                {/* Items List */}
                {formData.group_kot_items_by_category ? (
                  <>
                    <div className="fw-bold small mb-2">Main Course</div>
                    <div className="row small mb-1">
                      <div className="col-1">1</div>
                      <div className="col-5">
                        Biryani
                        {formData.modifier_default_option && (
                          <small className="d-block text-muted">Spicy</small>
                        )}
                        {formData.show_alternative_item && (
                          <small className="d-block text-muted">Alt: Veg Biryani</small>
                        )}
                      </div>
                      <div className="col-2 text-center">1</div>
                      <div className="col-2 text-end">100.00</div>
                      {formData.show_item_price && (
                        <div className="col-2 text-end">100.00</div>
                      )}
                    </div>
                    <div className="row small mb-1">
                      <div className="col-1">2</div>
                      <div className="col-5">Chicken Curry</div>
                      <div className="col-2 text-center">2</div>
                      <div className="col-2 text-end">150.00</div>
                      {formData.show_item_price && (
                        <div className="col-2 text-end">300.00</div>
                      )}
                    </div>
                    <div className="fw-bold small mb-2 mt-2">Breads</div>
                    <div className="row small mb-1">
                      <div className="col-1">3</div>
                      <div className="col-5">Naan</div>
                      <div className="col-2 text-center">3</div>
                      <div className="col-2 text-end">25.00</div>
                      {formData.show_item_price && (
                        <div className="col-2 text-end">75.00</div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="row small mb-1">
                      <div className="col-1">1</div>
                      <div className="col-5">
                        Biryani
                        {formData.modifier_default_option && (
                          <small className="d-block text-muted">Spicy</small>
                        )}
                        {formData.show_alternative_item && (
                          <small className="d-block text-muted">Alt: Veg Biryani</small>
                        )}
                      </div>
                      <div className="col-2 text-center">1</div>
                      <div className="col-2 text-end">100.00</div>
                      {formData.show_item_price && (
                        <div className="col-2 text-end">100.00</div>
                      )}
                    </div>
                    <div className="row small mb-1">
                      <div className="col-1">2</div>
                      <div className="col-5">Chicken Curry</div>
                      <div className="col-2 text-center">2</div>
                      <div className="col-2 text-end">150.00</div>
                      {formData.show_item_price && (
                        <div className="col-2 text-end">300.00</div>
                      )}
                    </div>
                    <div className="row small mb-1">
                      <div className="col-1">3</div>
                      <div className="col-5">Naan</div>
                      <div className="col-2 text-center">3</div>
                      <div className="col-2 text-end">25.00</div>
                      {formData.show_item_price && (
                        <div className="col-2 text-end">75.00</div>
                      )}
                    </div>
                  </>
                )}

                <div style={{ borderBottom: '1px dashed #ccc', margin: '10px 0' }}></div>

                {/* Total Section */}
                <div className="row fw-bold mb-2">
                  <div className="col-8 text-end">
                    <small>Total Items: 6</small>
                  </div>
                  {formData.show_item_price && (
                    <div className="col-4 text-end">
                      <small>₹ 475.00</small>
                    </div>
                  )}
                </div>

                {formData.show_kot_note && (
                  <>
                    <div style={{ borderBottom: '1px dashed #ccc', margin: '10px 0' }}></div>
                    <div className="mb-2">
                      <small>
                        <strong>KOT Note:</strong>
                      </small>
                      <br />
                      <small className="text-muted fst-italic">Extra spicy, no onions</small>
                    </div>
                  </>
                )}

                <div style={{ borderBottom: '1px dashed #ccc', margin: '10px 0' }}></div>

                {/* Footer */}
                <div className="text-center mt-3">
                  <small className="text-muted">Thank You!</small>
                  <br />
                  <small className="text-muted">Please prepare the order</small>
                </div>

                {/* Bilingual Support (English and Hindi) */}
                {formData.print_kot_both_languages && (
                  <>
                    <div style={{ borderBottom: '1px dashed #ccc', margin: '10px 0' }}></div>
                    <div className="text-center">
                      <small className="fw-bold">रसोई आदेश टिकट</small>
                      <br />
                      <small>बिरयानी: १</small>
                      <br />
                      <small>चिकन करी: २</small>
                      <br />
                      <small>नान: ३</small>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>