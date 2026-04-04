-- FIN-01 maintenance: capacity demo data, sĩ số sync, UTF-8 (run against your jims database after backup).
-- Adjust database name if not `jims`.

-- 1) Demo capacity 12 → 15 (schema seed uses 15 for new installs).
UPDATE classes SET capacity = 15 WHERE capacity = 12;

-- 2) Reconcile enrollment counts (fixes 0/N until OPE-03 was opened).
UPDATE classes c
SET c.current_size = (SELECT COUNT(*) FROM students s WHERE s.class_id = c.class_id);

-- 3) Optional: ensure database default charset (MySQL 8+).
-- ALTER DATABASE jims CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 4) Optional: convert core text tables to utf8mb4 if created under latin1 (check with SHOW CREATE TABLE first).
-- ALTER TABLE students CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- ALTER TABLE staff CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- ALTER TABLE classes CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- ALTER TABLE invoices CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- ALTER TABLE invoice_details CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 5) If invoices.billing_period still contains legacy long UI strings, fix or delete bad rows before tightening schema:
-- SELECT invoice_id, class_id, billing_period, CHAR_LENGTH(billing_period) AS len FROM invoices;
-- Example: map display → canonical in app only for new rows; old rows may need manual UPDATE to YYYY-MM.
