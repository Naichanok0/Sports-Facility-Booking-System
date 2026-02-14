-- create_full_schema.sql
-- Full idempotent schema for bookingdriverlicense app
-- WARNING: Run in the correct database. Backup production before running.
SET NOCOUNT ON;

/* Ensure the target database exists and switch to it */
IF DB_ID(N'DB') IS NULL
BEGIN
    PRINT 'Database DB does not exist. Creating database DB...';
    EXEC('CREATE DATABASE [DB]');
END
GO
USE [DB];
GO

/* ======= TABLES ======= */
-- Users
IF OBJECT_ID('dbo.Users','U') IS NULL
BEGIN
    CREATE TABLE dbo.Users (
        UserID INT IDENTITY(1,1) PRIMARY KEY,
        Username NVARCHAR(100) NOT NULL UNIQUE,
        PasswordHash NVARCHAR(400) NOT NULL,
        FullName NVARCHAR(200) NULL,
        Phone NVARCHAR(50) NULL,
        Email NVARCHAR(200) NULL,
        Role NVARCHAR(50) DEFAULT N'user',
        IsActive BIT DEFAULT 1,
        CreatedAt DATETIME2 DEFAULT SYSDATETIME()
    );
END
GO

-- Centers
IF OBJECT_ID('dbo.Centers','U') IS NULL
BEGIN
    CREATE TABLE dbo.Centers (
        CenterID INT IDENTITY(1,1) PRIMARY KEY,
        CenterName NVARCHAR(200) NOT NULL,
        Address NVARCHAR(500) NULL,
        IsActive BIT DEFAULT 1
    );
END
GO

-- Services
IF OBJECT_ID('dbo.Services','U') IS NULL
BEGIN
    CREATE TABLE dbo.Services (
        ServiceID INT IDENTITY(1,1) PRIMARY KEY,
        ServiceName NVARCHAR(200) NOT NULL,
        CenterID INT NOT NULL,
        SlotCapacity INT NOT NULL DEFAULT 1,
        DurationMin INT NOT NULL DEFAULT 15,
        IsActive BIT DEFAULT 1,
        FOREIGN KEY (CenterID) REFERENCES dbo.Centers(CenterID)
    );
END
GO

-- Queues
IF OBJECT_ID('dbo.Queues','U') IS NULL
BEGIN
    CREATE TABLE dbo.Queues (
        QueueID INT IDENTITY(1,1) PRIMARY KEY,
        CenterID INT NOT NULL,
        ServiceID INT NOT NULL,
        UserID INT NULL,
        BookingDate DATE NOT NULL,
        SlotTime TIME NOT NULL,
        Status NVARCHAR(50) NOT NULL DEFAULT N'Booked',
        TicketNo NVARCHAR(50) NULL,
        RefCode NVARCHAR(100) NULL,
        CancelledAt DATETIME2 NULL,
        CreatedAt DATETIME2 DEFAULT SYSDATETIME(),
        CONSTRAINT FK_Queues_Centers FOREIGN KEY (CenterID) REFERENCES dbo.Centers(CenterID),
        CONSTRAINT FK_Queues_Services FOREIGN KEY (ServiceID) REFERENCES dbo.Services(ServiceID),
        CONSTRAINT FK_Queues_Users FOREIGN KEY (UserID) REFERENCES dbo.Users(UserID)
    );
    CREATE INDEX IX_Queues_ByDateSlot ON dbo.Queues(BookingDate, SlotTime);
END
GO

-- QueueStatusLog (if not present)
IF OBJECT_ID('dbo.QueueStatusLog','U') IS NULL
BEGIN
    CREATE TABLE dbo.QueueStatusLog(
        LogID INT IDENTITY(1,1) PRIMARY KEY,
        QueueID INT NOT NULL,
        OldStatus NVARCHAR(50),
        NewStatus NVARCHAR(50),
        ChangedAt DATETIME2 DEFAULT SYSDATETIME(),
        ChangedBy INT NULL
    );
END
GO

/* ======= TRIGGERS, FUNCTIONS, PROCEDURES, VIEWS ======= */

-- trg_Queues_Insert_SetTicketNo
IF OBJECT_ID('dbo.trg_Queues_Insert_SetTicketNo','TR') IS NOT NULL
    DROP TRIGGER dbo.trg_Queues_Insert_SetTicketNo;
GO
CREATE TRIGGER dbo.trg_Queues_Insert_SetTicketNo
ON dbo.Queues
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE q
    SET TicketNo = ISNULL(q.TicketNo, 'T' + RIGHT('00000' + CAST(q.QueueID AS VARCHAR(10)),5))
    FROM dbo.Queues q
    JOIN inserted i ON q.QueueID = i.QueueID;
END;
GO

-- trg_Queues_Update_StatusLog
IF OBJECT_ID('dbo.trg_Queues_Update_StatusLog','TR') IS NOT NULL
    DROP TRIGGER dbo.trg_Queues_Update_StatusLog;
GO
CREATE TRIGGER dbo.trg_Queues_Update_StatusLog
ON dbo.Queues
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF UPDATE(Status)
    BEGIN
        INSERT INTO dbo.QueueStatusLog(QueueID, OldStatus, NewStatus, ChangedAt)
        SELECT d.QueueID, d.Status, i.Status, SYSDATETIME()
        FROM deleted d
        JOIN inserted i ON d.QueueID = i.QueueID
        WHERE ISNULL(d.Status,'') <> ISNULL(i.Status,'');
    END
END;
GO

-- fn_GetRemainingCapacity
IF OBJECT_ID('dbo.fn_GetRemainingCapacity','FN') IS NOT NULL
    DROP FUNCTION dbo.fn_GetRemainingCapacity;
GO
CREATE FUNCTION dbo.fn_GetRemainingCapacity
(
    @CenterID INT,
    @ServiceID INT,
    @BookingDate DATE,
    @SlotTime TIME
)
RETURNS INT
AS
BEGIN
    DECLARE @capacity INT = (SELECT TOP 1 SlotCapacity FROM dbo.Services WHERE ServiceID=@ServiceID AND CenterID=@CenterID);
    IF @capacity IS NULL SET @capacity = 0;

    DECLARE @booked INT = (
        SELECT COUNT(*) FROM dbo.Queues
        WHERE CenterID=@CenterID AND ServiceID=@ServiceID
            AND BookingDate=@BookingDate
            AND SlotTime = @SlotTime
            AND Status IN (N'Booked',N'CheckedIn',N'Completed')
    );

    RETURN CASE WHEN @capacity - @booked < 0 THEN 0 ELSE @capacity - @booked END;
END;
GO

-- fn_IsUserBookedOnDate
IF OBJECT_ID('dbo.fn_IsUserBookedOnDate','FN') IS NOT NULL
    DROP FUNCTION dbo.fn_IsUserBookedOnDate;
GO
CREATE FUNCTION dbo.fn_IsUserBookedOnDate
(
    @UserID INT,
    @BookingDate DATE,
    @ServiceID INT
)
RETURNS BIT
AS
BEGIN
    DECLARE @cnt INT = (
        SELECT COUNT(*) FROM dbo.Queues
        WHERE UserID=@UserID AND BookingDate=@BookingDate AND ServiceID=@ServiceID
            AND Status IN (N'Booked',N'CheckedIn')
    );
    RETURN CASE WHEN @cnt > 0 THEN 1 ELSE 0 END;
END;
GO

-- sp_BookQueue
IF OBJECT_ID('dbo.sp_BookQueue','P') IS NOT NULL
    DROP PROCEDURE dbo.sp_BookQueue;
GO
CREATE PROCEDURE dbo.sp_BookQueue
    @CenterID INT,
    @ServiceID INT,
    @UserID INT,
    @BookingDate DATE,
    @SlotTime TIME,
    @OutQueueID INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRAN;

        DECLARE @remaining INT = dbo.fn_GetRemainingCapacity(@CenterID,@ServiceID,@BookingDate,@SlotTime);
        IF @remaining <= 0
        BEGIN
            RAISERROR('No capacity for this slot',16,1);
            ROLLBACK TRAN;
            RETURN;
        END

        IF dbo.fn_IsUserBookedOnDate(@UserID,@BookingDate,@ServiceID) = 1
        BEGIN
            RAISERROR('User already has a booking for this service on that date',16,1);
            ROLLBACK TRAN;
            RETURN;
        END

        INSERT dbo.Queues(CenterID,ServiceID,UserID,BookingDate,SlotTime,Status)
        VALUES(@CenterID,@ServiceID,@UserID,@BookingDate,@SlotTime,N'Booked');

        SET @OutQueueID = SCOPE_IDENTITY();

        UPDATE dbo.Queues
        SET TicketNo = 'T' + RIGHT('00000' + CAST(QueueID AS VARCHAR(10)),5)
        WHERE QueueID = @OutQueueID;

        COMMIT TRAN;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRAN;
        DECLARE @msg NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@msg,16,1);
        RETURN;
    END CATCH
END;
GO

-- sp_CancelQueueByUser
IF OBJECT_ID('dbo.sp_CancelQueueByUser','P') IS NOT NULL
    DROP PROCEDURE dbo.sp_CancelQueueByUser;
GO
CREATE PROCEDURE dbo.sp_CancelQueueByUser
    @QueueID INT,
    @UserID INT,
    @OutAffected INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.Queues
    SET Status = N'Cancelled', CancelledAt = SYSDATETIME()
    WHERE QueueID = @QueueID AND UserID = @UserID AND Status IN (N'Booked',N'CheckedIn');

    SET @OutAffected = @@ROWCOUNT;
END;
GO

-- Views
IF OBJECT_ID('dbo.vw_QueueDetails','V') IS NOT NULL
    DROP VIEW dbo.vw_QueueDetails;
GO
CREATE VIEW dbo.vw_QueueDetails AS
SELECT q.QueueID,
       q.BookingDate,
       CONVERT(varchar(5), q.SlotTime, 108) AS SlotTime,
       q.Status,
       q.TicketNo,
       q.CenterID,
       c.CenterName,
       q.ServiceID,
       s.ServiceName,
       q.UserID,
       u.Username,
       u.FullName
FROM dbo.Queues q
LEFT JOIN dbo.Centers c ON c.CenterID = q.CenterID
LEFT JOIN dbo.Services s ON s.ServiceID = q.ServiceID
LEFT JOIN dbo.Users u ON u.UserID = q.UserID;
GO

IF OBJECT_ID('dbo.vw_ServiceBookingCounts','V') IS NOT NULL
    DROP VIEW dbo.vw_ServiceBookingCounts;
GO
CREATE VIEW dbo.vw_ServiceBookingCounts AS
SELECT s.ServiceID,
       s.ServiceName,
       s.CenterID,
       c.CenterName,
       s.SlotCapacity,
       s.DurationMin,
       COUNT(q.QueueID) AS TotalBookings,
       SUM(CASE WHEN q.Status IN (N'Booked',N'CheckedIn',N'Completed') THEN 1 ELSE 0 END) AS ActiveBookings
FROM dbo.Services s
LEFT JOIN dbo.Centers c ON c.CenterID = s.CenterID
LEFT JOIN dbo.Queues q ON q.ServiceID = s.ServiceID
GROUP BY s.ServiceID, s.ServiceName, s.CenterID, c.CenterName, s.SlotCapacity, s.DurationMin;
GO

PRINT 'Full schema creation script completed.';
