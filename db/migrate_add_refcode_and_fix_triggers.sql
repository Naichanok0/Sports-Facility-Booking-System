-- migrate_add_refcode_and_fix_triggers.sql
-- Idempotent migration for adding RefCode column and helping fix triggers/procs
-- Safe steps:
-- 1) Check for column and add it nullable if missing
-- 2) Show objects (triggers/procs/views) that reference 'RefCode'
-- 3) Refresh sql modules (sp_refreshsqlmodule) for the trigger(s)
-- 4) Provide a template for safely recreating the trigger if needed
-- IMPORTANT: Run in the same database that the application uses. Backup first on production.

SET NOCOUNT ON;

/* Ensure we are using the intended database 'DB' before applying changes */
IF DB_ID(N'DB') IS NOT NULL
BEGIN
    USE [DB];
END
ELSE
BEGIN
    PRINT 'Warning: database DB not found in this server session. Please run against the correct database.';
END

BEGIN TRY
    PRINT '--- Begin migration: add RefCode if missing ---';

    IF COL_LENGTH('dbo.Queues', 'RefCode') IS NULL
    BEGIN
        -- Backup recommendation: uncomment if you want an on-the-spot quick backup table copy (may be large)
        -- DECLARE @backupName NVARCHAR(128) = N'Queues_backup_' + REPLACE(CONVERT(VARCHAR(19), GETDATE(), 120), ':', '-');
        -- DECLARE @sql NVARCHAR(MAX) = N'SELECT * INTO dbo.' + QUOTENAME(@backupName) + ' FROM dbo.Queues;';
        -- PRINT 'Creating quick backup: ' + @backupName;
        -- EXEC sp_executesql @sql;

        ALTER TABLE dbo.Queues
        ADD RefCode NVARCHAR(100) NULL;

        PRINT 'Added column RefCode to dbo.Queues';
    END
    ELSE
    BEGIN
        PRINT 'Column RefCode already exists on dbo.Queues';
    END

    PRINT '--- Searching for DB objects referencing "RefCode" ---';

    SELECT
        OBJECT_SCHEMA_NAME(m.object_id) AS SchemaName,
        OBJECT_NAME(m.object_id) AS ObjectName,
        o.type_desc AS ObjectType,
        LEFT(m.definition, 4000) AS DefinitionSnippet
    FROM sys.sql_modules m
    INNER JOIN sys.objects o ON m.object_id = o.object_id
    WHERE m.definition LIKE '%RefCode%'
    ORDER BY ObjectType, ObjectName;

    PRINT '--- Done listing objects. If any triggers/procs reference RefCode, consider refreshing them below ---';

    -- Refresh common trigger name (user should replace with actual trigger name if different)
    DECLARE @triggerName SYSNAME = N'dbo.trg_Queues_AU';

    IF OBJECT_ID(@triggerName, 'TR') IS NOT NULL
    BEGIN
        PRINT 'Trigger ' + @triggerName + ' exists. Attempting sp_refreshsqlmodule...';
        BEGIN TRY
            EXEC sp_refreshsqlmodule @triggerName;
            PRINT 'sp_refreshsqlmodule succeeded for ' + @triggerName;
        END TRY
        BEGIN CATCH
            PRINT 'sp_refreshsqlmodule failed for ' + @triggerName + '. Error: ' + ERROR_MESSAGE();
            PRINT 'You may need to ALTER/RECREATE the trigger manually.';
        END CATCH
    END
    ELSE
    BEGIN
        PRINT 'Trigger ' + @triggerName + ' not found. If you have a differently named trigger, inspect the list above.';
    END

    PRINT '--- Optional: Refresh ALL modules that reference RefCode (use with care) ---';
    -- The following will attempt to refresh every module that contains 'RefCode' in its definition.
    -- This is helpful when compiled modules have stale metadata. Comment out if you prefer manual changes.

    DECLARE @cur CURSOR;
    DECLARE @objName SYSNAME;

    SET @cur = CURSOR FOR
    SELECT QUOTENAME(OBJECT_SCHEMA_NAME(m.object_id)) + N'.' + QUOTENAME(OBJECT_NAME(m.object_id))
    FROM sys.sql_modules m
    WHERE m.definition LIKE '%RefCode%';

    OPEN @cur;
    FETCH NEXT FROM @cur INTO @objName;
    WHILE @@FETCH_STATUS = 0
    BEGIN
        BEGIN TRY
            PRINT 'Refreshing module: ' + @objName;
            EXEC sp_refreshsqlmodule @objName;
            PRINT 'Refreshed: ' + @objName;
        END TRY
        BEGIN CATCH
            PRINT 'Failed to refresh: ' + @objName + ' - ' + ERROR_MESSAGE();
        END CATCH

        FETCH NEXT FROM @cur INTO @objName;
    END
    CLOSE @cur;
    DEALLOCATE @cur;

    PRINT '--- Migration complete. Quick check: select top 1 RefCode from dbo.Queues ---';
    BEGIN TRY
        SELECT TOP 1 RefCode FROM dbo.Queues;
    END TRY
    BEGIN CATCH
        PRINT 'Selecting RefCode failed: ' + ERROR_MESSAGE();
    END CATCH

    PRINT '--- If you still see "Invalid column name ''RefCode''" errors when running the app, consider recreating the offending trigger/procedure using the template below. ---';

    PRINT '--- Trigger recreate template (replace body with your trigger logic) ---';
    PRINT '/*';
    PRINT 'IF OBJECT_ID(''dbo.trg_Queues_AU'', ''TR'') IS NOT NULL
    BEGIN
        DROP TRIGGER dbo.trg_Queues_AU;
    END

    GO

    CREATE TRIGGER dbo.trg_Queues_AU
    ON dbo.Queues
    AFTER INSERT, UPDATE
    AS
    BEGIN
        SET NOCOUNT ON;

        -- Example logic: (replace with your actual trigger code)
        -- INSERT INTO dbo.QueueHistory(QueueID, RefCode, ChangedAt)
        -- SELECT i.QueueID, i.RefCode, GETUTCDATE() FROM inserted i;

    END
    GO
    */';

    PRINT '--- End of migration script. Please backup and run in the correct DB/context. ---';

END TRY
BEGIN CATCH
    PRINT 'Migration failed: ' + ERROR_MESSAGE();
    THROW;
END CATCH;
