# TODO

- [ ] Fix null-unsafe `.toString()` usages in `src/views/apps/Settings.tsx` that crash with `Cannot read properties of null (reading 'toString')`.
  - [ ] Patch label printer state population effect to use `String(value ?? '')`
  - [ ] Patch edit handlers for label/bill/kot printers to use null-safe conversions for `copies` / `paper_width`
- [ ] Re-run/build and verify Settings page loads without runtime error.

