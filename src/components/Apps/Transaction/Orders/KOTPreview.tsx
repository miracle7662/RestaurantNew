// src/components/KOTPreview.tsx
import React from 'react';
import { OutletSettings } from './types'; // Adjust path as needed
import { MenuItem } from './Orders'; // Adjust path as needed

interface KOTPreviewProps {
  settings: OutletSettings;
  items: MenuItem[];
  isSimplified?: boolean;
}

const KOTPreview: React.FC<KOTPreviewProps> = ({ settings, items, isSimplified = false }) => {
  const {
    show_store_name,
    dine_in_kot_no,
    show_new_order_tag,
    new_order_tag_label,
    show_running_order_tag,
    running_order_tag_label,
    show_kot_no_quick_bill,
    hide_table_name_quick_bill,
    show_order_type_symbol,
    show_item_price,
    show_kot_note,
    customer_on_kot_dine_in,
    customer_on_kot_quick_bill,
    customer_kot_display_option,
    modifier_default_option,
    show_alternative_item,
    show_waiter,
    show_captain_username,
    show_username,
    show_terminal_username,
    show_covers_as_guest,
    show_online_order_otp,
    show_order_id_quick_bill,
    print_kot_both_languages,
  } = settings;

  return (
    <div className="card shadow-sm h-100">
      <div className="card-header bg-light">
        <h5 className="card-title mb-0 text-center fw-bold">KOT Preview</h5>
      </div>
      <div className="card-body" style={{ fontSize: '0.85rem', overflow: 'hidden' }} id="kot-preview">
        {/* Store Name and Details (Full Preview Only) */}
        {!isSimplified && show_store_name && (
          <>
            <div className="text-center mb-3">
              <h6 className="fw-bold mb-1">Restaurant Name</h6>
              <div className="small text-muted">Kolhapur Road Kolhapur 416416</div>
              <div className="small text-muted">sangli@gmail.com</div>
            </div>
            <div style={{ borderBottom: '1px dashed #ccc', margin: '10px 0' }}></div>
          </>
        )}

        {/* KOT Header */}
        <div className="text-center mb-3">
          <h6 className="fw-bold">
            {dine_in_kot_no || 'KITCHEN ORDER TICKET'}
            {show_new_order_tag && new_order_tag_label && (
              <span className="ms-2 badge bg-primary">{new_order_tag_label}</span>
            )}
            {show_running_order_tag && running_order_tag_label && (
              <span className="ms-2 badge bg-secondary">{running_order_tag_label}</span>
            )}
          </h6>
        </div>

        {/* KOT Details */}
        <div className="row mb-2">
          <div className="col-6">
            {(show_kot_no_quick_bill || !hide_table_name_quick_bill) && (
              <small>
                <strong>KOT No:</strong> KOT001
              </small>
            )}
            {show_order_id_quick_bill && (
              <small className="d-block">
                <strong>Order ID:</strong> ORD123
              </small>
            )}
            {!isSimplified && show_online_order_otp && (
              <small className="d-block">
                <strong>OTP:</strong> 9876
              </small>
            )}
          </div>
          <div className="col-6 text-end">
            {!hide_table_name_quick_bill && (
              <small>
                <strong>Table:</strong> T-05
              </small>
            )}
            {!isSimplified && show_covers_as_guest && (
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
              {show_order_type_symbol && <span>(🍽️)</span>}
            </small>
          </div>
          <div className="col-6 text-end">
            {!isSimplified && show_waiter && (
              <small>
                <strong>Waiter:</strong> John
              </small>
            )}
            {!isSimplified && show_captain_username && (
              <small className="d-block">
                <strong>Captain:</strong> CaptainJane
              </small>
            )}
            {!isSimplified && show_username && (
              <small className="d-block">
                <strong>Username:</strong> User123
              </small>
            )}
            {!isSimplified && show_terminal_username && (
              <small className="d-block">
                <strong>Terminal:</strong> Term01
              </small>
            )}
          </div>
        </div>

        {!isSimplified && (customer_on_kot_dine_in || customer_on_kot_quick_bill) && customer_kot_display_option !== 'DISABLED' && (
          <>
            <div style={{ borderBottom: '1px dashed #ccc', margin: '10px 0' }}></div>
            <div className="mb-2">
              <small>
                <strong>Customer:</strong> John Doe
              </small>
              {customer_kot_display_option === 'NAME_AND_MOBILE' && (
                <small className="d-block">
                  <strong>Mobile:</strong> +91 9876543210
                </small>
              )}
            </div>
          </>
        )}

        <div style={{ borderBottom: '1px dashed #ccc', margin: '10px 0' }}></div>

        {/* Items Header */}
        <div className="row fw-bold small pb-1 mb-2" style={{ borderBottom: '1px solid #dee2e6' }}>
          <div className="col-1">#</div>
          <div className="col-4">Item Name</div>
          <div className="col-2 text-center">Qty</div>
          <div className="col-2 text-end">Rate</div>
          {show_item_price && <div className="col-3 text-end">Amount</div>}
        </div>

        {/* Items */}
        {items.map((item, index) => (
          <div className="row small mb-1" key={item.id}>
            <div className="col-1">{index + 1}</div>
            <div className="col-4">
              {item.name}
              {!isSimplified && modifier_default_option && (
                <small className="d-block text-muted">Spicy</small>
              )}
              {!isSimplified && show_alternative_item && (
                <small className="d-block text-muted">Alt: Veg {item.name}</small>
              )}
            </div>
            <div className="col-2 text-center">{item.qty}</div>
            <div className="col-2 text-end">{item.price.toFixed(2)}</div>
            {show_item_price && (
              <div className="col-3 text-end">{(item.price * item.qty).toFixed(2)}</div>
            )}
          </div>
        ))}

        <div style={{ borderBottom: '1px dashed #ccc', margin: '10px 0' }}></div>

        {/* Total Section */}
        <div className="row fw-bold mb-2">
          <div className="col-8 text-end">
            <small>Total Items: {items.reduce((sum, item) => sum + item.qty, 0)}</small>
          </div>
          {show_item_price && (
            <div className="col-4 text-end">
              <small>₹ {items.reduce((sum, item) => sum + item.price * item.qty, 0).toFixed(2)}</small>
            </div>
          )}
        </div>

        {show_kot_note && (
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

        {/* Bilingual Support (Full Preview Only) */}
        {!isSimplified && print_kot_both_languages && (
          <>
            <div style={{ borderBottom: '1px dashed #ccc', margin: '10px 0' }}></div>
            <div className="text-center">
              <small className="fw-bold">रसोई आदेश टिकट</small>
              <br />
              {items.map((item, index) => (
                <small key={index}>
                  {item.name === 'Biryani' ? 'बिरयानी' : item.name === 'Chicken Curry' ? 'चिकन करी' : 'नान'}: {item.qty}
                  <br />
                </small>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default KOTPreview;