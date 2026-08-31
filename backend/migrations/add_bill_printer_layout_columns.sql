-- Per-outlet thermal bill layout (paper width + printable margins).
-- Safe to run more than once: ignore "Duplicate column" errors if columns already exist.

ALTER TABLE bill_printer_settings
  ADD COLUMN paper_width DECIMAL(6,2) NULL DEFAULT NULL;

ALTER TABLE bill_printer_settings
  ADD COLUMN left_margin DECIMAL(6,2) NULL DEFAULT 2;

ALTER TABLE bill_printer_settings
  ADD COLUMN right_margin DECIMAL(6,2) NULL DEFAULT 2;

UPDATE bill_printer_settings
SET paper_width = CASE
  WHEN size LIKE '%58%' THEN 58
  WHEN size LIKE '%80%' THEN 80
  ELSE 80
END
WHERE paper_width IS NULL;
