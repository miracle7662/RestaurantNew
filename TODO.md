# RestaurantNew - BLACKBOXAI Task Tracker

## Current Task: Display Billview items variant-name wise (half & full as separate items)

### Plan Steps:
- [x] **Step 1**: Analyzed files (Billview.tsx, TAxisTrnbillControllers.js, DuplicateBillPrint.tsx)
- [x] **Step 2**: Identified issue - default groupBy='group' merges variants by itemId
- [x] **Step 3**: Confirmed solution - change default to 'varianttype' grouping
- [x] **Step 4**: Edit src/views/apps/Billview.tsx (groupBy init to 'varianttype')\n- [ ] **Step 5**: Test variant display (half/full as 2 separate lines)\n- [ ] **Step 6**: attempt_completion

**Status**: Plan approved. Ready for edit → test → complete.

