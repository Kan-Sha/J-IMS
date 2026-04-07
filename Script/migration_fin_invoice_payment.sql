-- FIN invoice payment migration: make invoices first-class payment entity.
-- Run after taking a backup.

ALTER TABLE invoices
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'pending' AFTER total_sessions,
    ADD COLUMN IF NOT EXISTS student_id VARCHAR(20) NULL AFTER class_id,
    ADD COLUMN IF NOT EXISTS final_amount DECIMAL(12,2) NULL AFTER total_sessions,
    ADD COLUMN IF NOT EXISTS adjustment_reason VARCHAR(500) NULL AFTER final_amount,
    ADD COLUMN IF NOT EXISTS payment_method VARCHAR(30) NULL AFTER status,
    ADD COLUMN IF NOT EXISTS paid_at DATETIME NULL AFTER payment_method,
    ADD COLUMN IF NOT EXISTS payment_note VARCHAR(500) NULL AFTER paid_at,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

-- Normalize legacy statuses if any.
UPDATE invoices
SET status = CASE
    WHEN LOWER(TRIM(status)) IN ('paid', 'da thanh toan', 'đã thanh toán') THEN 'paid'
    ELSE 'pending'
END;

-- Keep invoice_details status aligned with invoice status for old data.
UPDATE invoice_details d
JOIN invoices i ON i.invoice_id = d.invoice_id
SET d.status = i.status;

-- Backfill student-level columns from invoice_details for legacy one-invoice-many-students data.
UPDATE invoices i
JOIN (
  SELECT d.invoice_id, MIN(d.student_id) AS student_id, SUM(d.final_fee) AS final_amount
  FROM invoice_details d
  GROUP BY d.invoice_id
) x ON x.invoice_id = i.invoice_id
SET i.student_id = COALESCE(i.student_id, x.student_id),
    i.final_amount = COALESCE(i.final_amount, x.final_amount);
