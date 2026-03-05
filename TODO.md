# Restaurant Menu System - Variant Product Support

## Task
Update the menu item API to support variant products (Variant Type + Variant Values) properly.

## Current Status
- **Create API**: ✅ Already supports variant products
- **Update API**: ✅ Updated to support variant products

## Implementation Plan

### Step 1: Update Backend Controller
- [x] Analyze existing createMenuItemWithDetails to understand variant logic
- [x] Update updateMenuItemWithDetails to:
  - [x] Accept variant_type_id and variant_values in request body
  - [x] Handle variant_rates in department_details
  - [x] Insert multiple rows in mstrestmenudetails (one per variant value per department)
  - [x] Return department_details in response with variant_value_name

### Step 2: Testing
- [ ] Test creating a variant product
- [ ] Test updating a variant product
- [ ] Verify multiple rows are inserted in mstrestmenudetails

## Expected Behavior
For each department × variant_value combination, a separate row should be inserted:
- Department: Dine In, Variant: Half → row with item_rate for Half
- Department: Dine In, Variant: Full → row with item_rate for Full
- Department: Dine In, Variant: Quarter → row with item_rate for Quarter
- (and so on for each department)

## How It Works

### Request Payload Structure
```json
{
  "variant_type_id": 1,
  "variant_values": [1, 2, 3],
  "department_details": [
    {
      "departmentid": 1,
      "variant_rates": {
        "1": 80,  // Half rate
        "2": 220, // Full rate
        "3": 120  // Quarter rate
      }
    }
  ]
}
```

### Database Insertion Logic
- For **Variant Products**: Inserts one row per department per variant value
- For **Simple Products**: Inserts one row per department (no variant_value_id)

