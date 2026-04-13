/*
  Add DB-level uniqueness for queue option name per department.
  This complements application-level validation and prevents duplicates at storage level.

  NOTE:
  If historical duplicates exist for (departmentId, name), run the queue-option
  repair flow first, then re-run this migration.
*/

SET @idx_exists := (
  SELECT COUNT(1)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'priority_category'
    AND INDEX_NAME = 'priority_category_departmentId_name_key'
);

SET @sql := IF(
  @idx_exists = 0,
  'CREATE UNIQUE INDEX `priority_category_departmentId_name_key` ON `priority_category`(`departmentId`, `name`)',
  'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
