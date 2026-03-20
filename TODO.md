# Thermal Bill Print Fix - Progress Tracker

**Status**: In Progress

## Steps:

- [x] 1. Analyze files (BillPrint.tsx, KotPrint.tsx) - Issue confirmed: print HTML width:100% breaks thermal
- [ ] 2. Update BillPrint.tsx `generateBillHTML()` CSS for thermal (302px fixed width)
- [ ] 3. Replace flex/grid layouts with table/monospace for narrow paper
- [ ] 4. Optimize fonts (9pt base, match KOT)
- [ ] 5. Test thermal print output
- [ ] 6. Verify preview matches print
- [ ] 7. Update TODO.md complete

**Next**: Edit BillPrint.tsx CSS/layout
