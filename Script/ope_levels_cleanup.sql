-- OPE-01/OPE-02 levels sync (only 2 levels allowed)
-- Expected mapping:
--  1: Cơ bản   -> 130,000 VND
--  2: Nâng cao -> 150,000 VND

-- Rename/update canonical level rows (assuming legacy seeds: 1..3)
UPDATE levels
SET level_name = 'Cơ bản',
    price_per_session = 130000.00
WHERE level_id = 1;

UPDATE levels
SET level_name = 'Nâng cao',
    price_per_session = 150000.00
WHERE level_id = 2;

-- Re-map classes that point to removed levels to level_id=1
UPDATE classes
SET level_id = 1
WHERE level_id NOT IN (1,2);

-- Delete extra levels
DELETE FROM levels
WHERE level_id NOT IN (1,2);

