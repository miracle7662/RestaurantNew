# KOT Print Order Tag Conditional Display - Implementation Plan

Current Working Directory: d:/Github/RestaurantNew

## Approved Plan Summary
- **Target**: src/views/apps/PrintReport/KotPrint.tsx
- **Change**: Condition orderTag display on `show_new_order_tag` and `show_running_order_tag` settings
- **Status**: ✅ Plan approved by user

## Implementation Steps
- ✅ **Step 1**: Edit KotPrint.tsx - Update orderTag logic in generateKOTContent useMemo
  - Add conditions: `show_new_order_tag` for tableStatus=0, `show_running_order_tag` for tableStatus=1/2
- [ ] **Step 2**: Test KOT preview with settings ON/OFF
- [ ] **Step 3**: Verify no regressions in printing/items display
- [ ] **Step 4**: Complete task ✅

## COMPLETED ✅


