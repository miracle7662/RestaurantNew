# Menu Import/Export Field Sync Task

## Current Status
- [x] Analyzed frontend Menu.tsx → identified all 35+ fields saved via single insert
- [x] Analyzed backend mstrestmenuController.js → confirmed DB schema matches frontend
- [x] Identified root cause: Sample template & import logic missing new stock/raw material fields
- [x] Plan approved by user

## Implementation Steps
- [ ] 1. Update downloadSampleTemplate(): Add ALL DB fields as Excel columns with examples
- [ ] 2. Update importMenuItems(): Parse ALL fields from Excel, proper name→ID mapping, handle Yes/No→1/0
- [ ] 3. Test download template → verify all fields present
- [ ] 4. Test import with new template → verify no field mismatch
- [ ] 5. Complete task ✅

**Next step:** Update downloadSampleTemplate() in backend/controllers/mstrestmenuController.js
