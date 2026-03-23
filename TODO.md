# Reverse KOT Print Fix - TODO

## Status: ✅ PLAN APPROVED - IN PROGRESS

### Breakdown of Approved Plan:

**1. [x] Create this TODO.md** (Current step ✅)

**2. [ ] Add reverseSnapshot state**  
   - In `Orders.tsx`: `const [reverseSnapshot, setReverseSnapshot] = useState<MenuItem[]>([]);`
   - Add to reset functions: `setReverseSnapshot([])`

**3. [ ] Fix handleSaveReverse() timing**  
   ```
   // AFTER API success:
   setReverseSnapshot([...reverseQtyItems]);  // SNAPSHOT FIRST
   setShowReverseKotPrintModal(true);
   setReversePrintTrigger(prev => prev + 1);
   setReverseQtyItems([]);  // RESET AFTER SNAPSHOT
   ```

**4. [ ] Update ReverseKotPrint modal props**  
   ```
   items={reverseSnapshot.map(...)}  // Use SNAPSHOT
   onHide={() => {
     setShowReverseKotPrintModal(false);
     setReverseSnapshot([]);
   }}
   ```

**5. [ ] Add cleanup to resetBillingPanel() & table handlers**  
   ```
   setReverseSnapshot([]);
   ```

**6. [ ] Execute edits** (single edit_file call)

**7. [ ] Test**  
   ```
   npm run dev
   # F8 → Reverse items → Save → ✅ Modal shows items → Print ✅
   ```

**8. [ ] attempt_completion**  
   Expected: Modal displays reversed items (name,qty,amount) every time.

## Next Step
Proceed with **Step 2: Add reverseSnapshot state** to Orders.tsx?

