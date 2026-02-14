-- seed_fix_refcode.sql
-- Purpose: Add nullable RefCode column to dbo.Queues to avoid "Invalid column name 'RefCode'" errors
-- NOTES:
-- 1) This will ALTER the dbo.Queues table. It's safe because the column is created as NULLABLE and no data loss.
-- 2) Always take a DB backup before running schema changes in production.
-- 3) Replace [YourDatabase] with your actual database name if running outside of the current DB context.

-- Example (run in SSMS while connected to the correct DB):
--    USE [YourDatabase];
--    GO
--    :r .\seed_fix_refcode.sql

-- The ALTER statement:
IF COL_LENGTH('dbo.Queues', 'RefCode') IS NULL
BEGIN
    ALTER TABLE dbo.Queues
    ADD RefCode NVARCHAR(100) NULL;
END
ELSE
BEGIN
    PRINT 'Column RefCode already exists on dbo.Queues';
END
