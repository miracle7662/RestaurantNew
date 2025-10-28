# TODO: Fix saveDayEnd Function

## Tasks
- [ ] Modify the `saveDayEnd` function in `backend/controllers/Dayendcontroller.js` to build the INSERT query as a raw SQL string.
- [ ] Add console.log("🧩 Final SQL:", sql); before executing the query
- [ ] Replace `db.prepare().run()` with `db.exec(sql)` to bypass date coercion.
- [ ] **Remove `lock_datetime`** from the `INSERT` query and logic.
- [ ] Verify the updated column order in `INSERT`: `(dayend_date, current_date, system_datetime, outlet_id, hotel_id, dayend_total_amt, created_by_id)`.
- [ ] Keep all other logic unchanged (date calculation, last record check, verification).
