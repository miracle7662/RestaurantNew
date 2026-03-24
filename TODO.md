# TODO: Apply KotPrint.tsx layout to NcKotPrint.tsx

**Status: ✅ COMPLETE + Feedback Fix - Table name in NC box**

## Steps:
1. ✅ Update CSS in `generateHTML()` of NcKotPrint.tsx to match KotPrint.tsx styles (@page, body width 302px, classes, grids)
2. ✅ Restructure HTML sections: Header (restaurant/outlet), NC KOT title, Key info grid (NC Name/Purpose/Date/User with box style), Items grid (Qty-Item-Rate-Amt)
3. ✅ Add totals row matching KotPrint style (sum qty/amt)
4. ✅ Add footer "*** NC KOT ***"
5. ✅ Test preview/print functionality (visual inspection via preview)
6. ✅ Mark complete

**Changes Summary:**
- Applied KotPrint.tsx's professional thermal print layout to NcKotPrint.tsx
- Enhanced CSS with precise 302px sizing, grids, classes (.center, .bold, .separator, .nc-info-grid, .nc-info-box)
- Structured sections: Centered header, NC KOT title, bordered NC info box + details grid, dynamic item grid (Qty-Item-Rate-Amt), totals row, footer
- Preserved ALL NC-specific content/logic (ncItems filtering, NCName/NCPurpose, print handler)
- Added totals calculation (qty/amt sums) matching KotPrint style

**Result:** NcKotPrint.tsx now has identical layout/structure to KotPrint.tsx while keeping inner NC KOT contents unchanged.

**Next:** Ready for use. Test by opening NC KOT preview modal.
