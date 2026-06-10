-- Fix: add hotel_id column to advance_transactions
-- Run this on the same MySQL database where the error occurs.

START TRANSACTION;

-- 1) Add column if missing
ALTER TABLE advance_transactions
  ADD COLUMN hotel_id INT NULL
  AFTER checkin_id;

-- 2) Optional: index for faster filtering (safe even if column exists)
-- CREATE INDEX idx_advance_transactions_hotel_id ON advance_transactions(hotel_id);

COMMIT;

