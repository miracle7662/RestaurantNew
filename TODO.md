# SettlementModal Customer Fields - Implementation TODO

**Status**: ✅ PLAN APPROVED  
**Target**: `src/views/apps/Transaction/SettelmentModel.tsx`  
**Goal**: Show customer fields (mobile+country, name, add btn) **ONLY** when Credit selected, in RIGHT section.

## Step-by-Step Implementation Plan

### ✅ STEP 1: Create TODO.md [COMPLETED]

### ✅ STEP 2: Add Credit Detection Logic
```
✅ Added hasCreditMode computed value
✅ Added useEffect to reset customer data when !show || !hasCreditMode
```

### ✅ STEP 3: Read Current File Content
```
✅ File read successfully (3423 lines)
```

### ✅ STEP 4: Move Customer Fields to RIGHT Section (Col md=8)
```
✅ Added conditional customer section in RIGHT Col md=8 (after Selected Payments)
✅ Customer card with "Credit Required" badge (bg-info-subtle)
✅ Simplified +91 mobile input (digits only, maxLength=10)
✅ Auto-fetch preserved (useEffect unchanged)
✅ Visual validation: red/green borders + messages
✅ Responsive Row xs={4,5,3} layout
✅ Add button placeholder
```

### ⏳ STEP 5: Add Visual Validation
```
[X] Red border/shake if Credit selected && !customerId
[X] Green checkmark if customer found
[X] Responsive: Row→Col layout
```

### ⏳ STEP 6: Test & Update TODO
```
[X] Test: Cash→hide, Credit→show, mixed→show, deselect→hide+clear
[X] Mark steps ✅
[X] attempt_completion
```

## Current Progress
```
STEP 1: ✅ TODO.md created
STEP 2: ⏳ Pending
...
```

**Next**: Execute Steps 2-6 sequentially. Reply with each step completion for verification.

