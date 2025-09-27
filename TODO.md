# TODO: Fix createKOT function in TAxnTrnbillControllers.js

## Steps to Complete
- [x] Modify SELECT query to include both KOT and order reset fields with aliases
- [x] Update resetRule and lastResetDate to prefer KOT fields, fallback to order fields, default to 'DAILY'
- [x] Add console.log for reset decision (needsReset), resetRule, and generated kotNo
- [ ] Verify kotNo computation and assignment logic
- [ ] Test the changes (followup)

## Progress
- Started: [Current Date/Time]
- Modified SELECT query and resetRule/lastResetDate logic
