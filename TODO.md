# KotPrint.tsx Fixes

- [x] Remove the useEffect that overwrites localFormData with formData prop
- [x] Add console.log for activeTab and tabKey mapping in generateKOTContent
- [x] Verify generateKOTContent uses only localFormData
- [x] Fix key mapping in applyKotSettings for hide_item_rate_column and hide_item_total_column to use !data.show_item_price
