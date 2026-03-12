# TODO: Add Selected Waiter Name to BillPrint.tsx Preview

## Status: [✅] Complete - Ready for testing!

### Breakdown of Approved Plan (4 Steps)

1. **[ ] Create TODO.md** ✅ *Done - you're reading it!*
2. **[ ] Edit BillPrint.tsx**
   - Add `selectedWaiter?: string;` prop interface
   - Destructure from props
   - Update template to use `${selectedWaiter || user?.name || 'N/A'}`
3. **[ ] Edit Orders.tsx**
   - Pass `selectedWaiter={selectedWaiter}` to preview modal
   - Pass `selectedWaiter={selectedWaiter}` to print modal
4. **[ ] Test & Complete**
   - Verify preview/print shows selected waiter
   - Update this file (mark complete)
   - `attempt_completion`

**Next**: Reply "next" after each step completes successfully.

