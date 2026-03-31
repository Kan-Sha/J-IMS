-- Normalize class_schedule.day_of_week to STRING format and remove Sunday
-- Required canonical values:
-- "Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"

-- 1) Delete any Sunday entries (string or numeric 1/8 variants)
DELETE FROM class_schedule
WHERE LOWER(TRIM(day_of_week)) IN ('sunday', 'sun', 'cn', 'chunhat', 'chủ nhật', 'chu nhat')
   OR TRIM(day_of_week) IN ('1', '8', '0');

-- 2) Convert numeric (2..7) to English string
UPDATE class_schedule SET day_of_week = 'Monday'    WHERE TRIM(day_of_week) = '2';
UPDATE class_schedule SET day_of_week = 'Tuesday'   WHERE TRIM(day_of_week) = '3';
UPDATE class_schedule SET day_of_week = 'Wednesday' WHERE TRIM(day_of_week) = '4';
UPDATE class_schedule SET day_of_week = 'Thursday'  WHERE TRIM(day_of_week) = '5';
UPDATE class_schedule SET day_of_week = 'Friday'    WHERE TRIM(day_of_week) = '6';
UPDATE class_schedule SET day_of_week = 'Saturday'  WHERE TRIM(day_of_week) = '7';

-- 3) Normalize common variants/case/whitespace to canonical
UPDATE class_schedule SET day_of_week = 'Monday'    WHERE LOWER(TRIM(day_of_week)) IN ('monday','mon');
UPDATE class_schedule SET day_of_week = 'Tuesday'   WHERE LOWER(TRIM(day_of_week)) IN ('tuesday','tue','tues');
UPDATE class_schedule SET day_of_week = 'Wednesday' WHERE LOWER(TRIM(day_of_week)) IN ('wednesday','wed');
UPDATE class_schedule SET day_of_week = 'Thursday'  WHERE LOWER(TRIM(day_of_week)) IN ('thursday','thu','thur','thurs');
UPDATE class_schedule SET day_of_week = 'Friday'    WHERE LOWER(TRIM(day_of_week)) IN ('friday','fri');
UPDATE class_schedule SET day_of_week = 'Saturday'  WHERE LOWER(TRIM(day_of_week)) IN ('saturday','sat');

-- 4) (Optional) Safety check queries
-- SELECT DISTINCT day_of_week FROM class_schedule ORDER BY day_of_week;
-- SELECT * FROM class_schedule WHERE day_of_week REGEXP '^[0-9]+$' OR LOWER(day_of_week)='sunday';

