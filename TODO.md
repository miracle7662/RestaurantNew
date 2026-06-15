# TODO (CheckInForm zoom/resize stability)

- [x] Inspect `CheckInForm.tsx` for fixed heights/min-width and absolute positioned elements that break on zoom.
- [x] Remove fixed-height regions causing blank gaps/cut-offs (scrollable table height and absolute bottom panel).
- [x] Replace absolute positioning (`room-charge-checkbox`, `Rate Information` bottom panel) with flex/normal flow while keeping visual placement.
- [x] Make the wide table wrapper responsive (avoid horizontal scrollbar and prevent overflow leaks).
- [ ] Ensure main container uses `min-height: 100vh` and `overflow-x: hidden` (already present) and add `min-width: 0` where flex items need it.
- [ ] Run build/typecheck (if scripts exist) and validate at zoom 90/100/110/125/150 on at least one narrow and one wide resolution.


