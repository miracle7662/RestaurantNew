# Department-Wise Item Dropdown Enhancement in Billview.tsx
*(Approved Plan - User said "yes")*

## Completed: 0/8 ✅

### Breakdown of Approved Plan:

**1. [✅] Create states for search results**
   - `codeSearchResults`, `nameSearchResults`, `selectedCodeIndex`

**2. [✅] Update datalist="itemNos" (Code dropdown)**
   - Filter `menuItems` by dept-priced variants only (`departmentid === departmentIdFromState && item_rate > 0`)
   - Format: `name (variant) | short | code | ₹price`
   - value=`item_no|variant_id` (parseable)

**3. [✅] Update datalist="itemNames" (Name dropdown)**
   - Similar dept-aware filtering/display

**4. [ ] Enhance handleItemChange('itemCode')**
   - Filter `department_details` by `departmentIdFromState`
   - Only valid variants (`item_rate > 0`)
   - Parse typed `item_no|variant_id`, fallback to first dept variant

**5. [ ] Add/Enhance handleItemChange('itemName')**
   - Parse name for "(variant)", match dept variants
   - Dept-specific price validation

**6. [ ] Add useEffect for dynamic filtering**
   - `itemCodeFilter` → build `codeSearchResults`
   - Name input → build `nameSearchResults`

**7. [ ] Add keyboard navigation (ArrowUp/Down/Enter)**
   - Like OrderDetails.tsx dropdowns

**8. [ ] Test & Clean up**
   - Verify dropdowns show dept-valid variants/prices only
   - Test parsing, fallback logic
   - No new imports, preserve existing flow

## Next Action
Proceed to Step 1: Add required states to Billview.tsx

**Current File**: `src/views/apps/Billview.tsx`

