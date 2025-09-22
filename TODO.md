# Print Bill Backend Integration

## Overview
Integrate the frontend handlePrintBill function with the existing backend printBill API to mark items as billed when printing.

## Steps to Complete

### 1. Create Bill in Backend Before Printing
- [ ] Modify handlePrintBill function to call backend API first
- [ ] Send current order data (items, taxes, customer info) to create bill
- [ ] Handle API response and show success/error messages

### 2. Update Print Flow
- [ ] After successful bill creation, proceed with printing
- [ ] Handle error cases where bill creation fails
- [ ] Maintain existing print preview functionality

### 3. Data Mapping
- [ ] Map frontend order data to backend bill format
- [ ] Include customer information, items, taxes, and discounts
- [ ] Generate proper bill structure for backend

### 4. Testing
- [ ] Test successful bill creation and printing
- [ ] Test error handling when API fails
- [ ] Verify items are marked as billed in database
