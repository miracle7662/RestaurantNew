# Bill-Wise Checkout Support - TODO

## Step 1: Modify `sp_perform_checkout.sql` ✅ DONE
- [x] Add `IN p_bill_no INT` parameter (18th)
- [x] Add `IN p_is_last_bill TINYINT` parameter (19th)  
- [x] Add variable `v_pending_bills INT` for tracking remaining unsettled bills
- [x] Add variable `v_bill_invoice_no VARCHAR(50)` for separate invoice per bill
- [x] Add bill_no filter to all folio aggregation queries (advance, post_charges, allowances)
- [x] Add bill_no filter to Checkout_Folio_Master insert
- [x] Add bill_no filter to is_settle update on checkin_guest_folio_master
- [x] Condition room updates on p_bill_no = 0 or p_bill_no = 1 (lodging only)
- [x] Add final pending-bill check to determine check-in status (active vs checked_out vs partial_checkout)
- [x] Backward compatibility: p_bill_no=0 or NULL processes all bills (legacy behavior)

## Step 2: Testing ⏳ PENDING
- [ ] Test single-bill checkout (p_bill_no=0 or NULL) - legacy behavior preserved
- [ ] Test bill-wise checkout with multiple bills
- [ ] Verify room status only updates for bill_no=1 (lodging)
- [ ] Verify check-in remains active when pending bills exist
- [ ] Verify separate invoices for separate bills

