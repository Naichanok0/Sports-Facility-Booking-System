This folder contains a quick SQL fix for the "Invalid column name 'RefCode'" error seen when booking.

What this does
- Adds a nullable column `RefCode` (NVARCHAR(100)) to `dbo.Queues` if it doesn't already exist.

Why this is safe
- The column is nullable so existing inserts won't need a value and no data will be lost.

How to run
1) Open SQL Server Management Studio (SSMS) and connect to your database server.
2) Select the correct database in the dropdown (the one used by your app).
3) Open the file `db/seed_fix_refcode.sql` and run it (F5).

Alternative: run with sqlcmd (PowerShell):

# replace DBNAME and server/credentials as needed
sqlcmd -S localhost -d DBNAME -Q "SET NOCOUNT ON; IF COL_LENGTH('dbo.Queues','RefCode') IS NULL BEGIN ALTER TABLE dbo.Queues ADD RefCode NVARCHAR(100) NULL; END"

Notes & next steps
- This is a pragmatic fix. The long-term action is to inspect the stored procedures/triggers that reference `RefCode` to understand expected semantics and update schema or logic accordingly.
- If you want, I can prepare a query to search stored procedures/views/triggers that reference `RefCode` so we can update the code instead of adding the column.
