# TODO

- [ ] Settlement Modal: Press Enter after selecting payment mode to auto-settle the bill (when balance is ready).
  - [ ] Update `src/views/apps/Transaction/SettelmentModel.tsx` keyboard handler:
    - Enter should call `handleSettle()` when selected modes exist and `balanceDue === 0` and not `loading`.
    - If nothing selected yet, keep current behavior (toggle highlighted payment mode).
  - [ ] Manual test: open settlement modal, select mode, press Enter -> should settle.

