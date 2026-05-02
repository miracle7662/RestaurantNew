-- Add device_name column to TAxnTrnbill table
-- This stores the device name from which the KOT was created (useful for tracking multi-machine setups)

ALTER TABLE TAxnTrnbill ADD COLUMN device_name VARCHAR(100);

-- Optional: Add index for faster queries on device_name
-- ALTER TABLE TAxnTrnbill ADD INDEX idx_device_name (device_name);
