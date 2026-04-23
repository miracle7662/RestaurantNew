# KOT PDF Preview Implementation Plan

## Status: ✅ In Progress

## Step 1: Create TODO.md [COMPLETED]

## Step 2: ✅ Backend Complete!

- ✅ `printController.js` - PDF base64 endpoint + exact KotPrint.tsx layout
- ✅ `printRoutes.js` - Full validation/logging for all modes (thermal/pdf/pdf-preview)
- API ready: `mode: "pdf-preview"` returns `{pdfBase64, filename}`

Mobile app integration:
```
POST /print-kot 
{
  "mode": "pdf-preview",
  "outletId": 1,
  "currentKOTNo": 123,
  "items": [...],
  "selectedTable": "T01"
}
```

## Step 3: Test PDF generation
- [ ] Backend restart: `cd backend && node server.js`
- [ ] Test endpoint: `curl -X POST http://localhost:3000/print-kot -H "Content-Type: application/json" -d '{"mode":"pdf-preview","items":[...],"outletId":1,"currentKOTNo":123}'`
- [ ] Verify base64 PDF decodes correctly
- [ ] Confirm layout matches KotPrint.tsx preview

## Step 4: Frontend integration (Mobile App)
- [ ] Mobile app calls `/print-kot` with `mode: "pdf-preview"`
- [ ] Use PDF viewer to show preview
- [ ] Add Download button (save base64 as PDF)

## Step 5: Complete & Test
- [ ] Pixel-perfect match with KotPrint.tsx
- [ ] Cross-platform: Mobile preview, Desktop compatibility
- [ ] attempt_completion

**Next Action:** Backend Complete ✅

## Test Backend:
1. `cd backend && node server.js`
2. Test PDF preview:
```
curl -X POST http://localhost:3000/print-kot \\
-H "Content-Type: application/json" \\
-d '{
  "mode": "pdf-preview",
  "outletId": 1,
  "currentKOTNo": 123,
  "selectedTable": "T01", 
  "activeTab": "Dine-in",
  "items": [{"name": "Butter Chicken", "qty": 2, "price": 350, "variantName": "Full"}]
}'
```
3. Save `pdfBase64` → decode → verify matches KotPrint.tsx layout
