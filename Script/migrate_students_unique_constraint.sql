-- Migration: Fix students duplicate constraint to include parent phone
--
-- Problem:
--   Existing DBs may have UNIQUE(first_name, last_name, date_of_birth)
--   which blocks inserts even when phone differs.
--
-- Target business rule:
--   Duplicate only when (first_name, last_name, date_of_birth, phone) are all the same.
--
-- Notes:
--   In MySQL, when the UNIQUE constraint was declared as:
--     UNIQUE(first_name, last_name, date_of_birth)
--   the auto-generated index name is often `first_name`
--   (matches error: key 'students.first_name').
--
-- Run this against your existing database (DO NOT run if you plan to re-run schema.sql which drops tables).

ALTER TABLE students
  DROP INDEX first_name;

ALTER TABLE students
  ADD UNIQUE KEY uq_students_name_dob_phone (first_name, last_name, date_of_birth, phone);

