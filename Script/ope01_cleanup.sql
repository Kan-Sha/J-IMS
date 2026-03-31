-- OPE-01 strict sync cleanup + constraints (run on existing DB)
-- IMPORTANT: keeps admin@gmail.com and all other real accounts; only deletes specified demo accounts.

-- Data cleanup (required)
DELETE FROM class_schedule;
DELETE FROM classes;

-- Only delete demo accounts
DELETE FROM staff
WHERE email IN ('ta@gmail.com', 'giaovien@gmail.com');

-- Schema sync (required)
ALTER TABLE classes
  MODIFY class_name VARCHAR(50) NOT NULL;

-- capacity 3–18 (strict)
ALTER TABLE classes
  DROP CHECK chk_classes_capacity;

ALTER TABLE classes
  ADD CONSTRAINT chk_classes_capacity CHECK (capacity >= 3 AND capacity <= 18);

