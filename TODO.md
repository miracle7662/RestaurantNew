# TODO (Guest document images upload/fetch)

- [x] Inspect `GuestForm.tsx` and `guestController.js` image URL expectations.
- [x] Identify mismatch risk: multer writes using `process.execPath` while static serving also depends on it.
- [x] Make uploads path stable: update `backend/middleware/upload.js` to store under `backend/uploads`.
- [x] Make static serving match: update `backend/server.js` to serve `/uploads` from `backend/uploads`.
- [ ] Test: upload a guest document, verify file exists under `backend/uploads/guests/documents/front|back`.
- [ ] Test: open existing guest, verify UI loads `front_side_url/back_side_url` and browser requests return 200.

