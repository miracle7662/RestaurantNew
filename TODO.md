# Task: Add item price column to ReverseKotPrint.tsx table

## Status
- [x] Plan approved by user
- [ ] Create TODO.md ✅
- [x] Update ReverseKotPrint.tsx interface + table ✅
- [ ] Test preview/print
- [ ] Complete

## Details
**File:** src/views/apps/PrintReport/ReverseKotPrint.tsx
- Add `price?: number;` to MenuItem
- Table header: Item | Qty | **Rate** | **Amount** (optional)
- Use `i.price?.toFixed(2)` for safety
- Total amount at bottom optional

**Next:** Edit file → Test
