# Restaurant Waiter Button Fix - Progress Tracker

## ✅ PLAN APPROVED
**Goal**: Show waiter button/modal for Pickup/Delivery/Quick Bill tabs before KOT save (like Dine-in).

**Files**: `src/views/apps/Transaction/Orders.tsx` (main changes)

## 📋 TODO Steps (8/8 remaining)

### [ ] Step 1: Update waiter button condition
- File: `Orders.tsx`
- Change: `selectedTable && hasNewItems` → `hasNewItems || ['Pickup','Delivery','Quick Bill'].includes(activeTab)`

### [ ] Step 2: Add auto-modal trigger for non-dine tabs
- In `handleTabClick()`: Auto-open `showWaiterPaxModal` when switching to Pickup/Delivery/Quick Bill with items

### [ ] Step 3: Test button visibility
- Manual: Click Pickup tab → Add item → Verify waiter button appears

### [ ] Step 4: Test KOT save with waiter
- Save KOT → Check backend `Steward` field populated

### [ ] Step 5: Visual polish (optional)
- Show waiter name in KOT header for all tabs

### [ ] Step 6: Cross-browser test
- Chrome/Firefox → Verify modal + default waiter works

### [ ] Step 7: Edge cases
- Default waiter auto-select
- Empty waiter field → KOT saves empty?

### [ ] Step 8: Complete & cleanup
- Update TODO.md ✅
- attempt_completion

**Next**: Step 1 - Edit Orders.tsx button condition

**Status**: 🚀 Starting implementation...

