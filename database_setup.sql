-- ============================================================
--  Dentor Database Setup
--  Run this script in SSMS before starting the FastAPI server.
--  Tested on SQL Server 2019 / 2022 / Azure SQL
-- ============================================================

-- 1. Create the database (run this as sa / sysadmin)
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'DentorDB')
BEGIN
    CREATE DATABASE DentorDB;
    PRINT 'DentorDB created.';
END
GO

USE DentorDB;
GO

-- 2. Create the users table
--    (SQLAlchemy will also create this automatically via metadata.create_all,
--     but having it here lets you inspect/customize it directly in SSMS.)
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_NAME = 'users'
)
BEGIN
    CREATE TABLE users (
        id            INT           IDENTITY(1,1) PRIMARY KEY,
        username      NVARCHAR(50)  NOT NULL UNIQUE,
        email         NVARCHAR(255) NOT NULL UNIQUE,
        full_name     NVARCHAR(100) NULL,
        hashed_password NVARCHAR(255) NOT NULL,
        is_active     BIT           NOT NULL DEFAULT 1,
        created_at    DATETIME2     NOT NULL DEFAULT GETUTCDATE(),
        updated_at    DATETIME2     NULL
    );
    PRINT 'users table created.';
END
GO

-- 3. Helpful indexes
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_users_username')
    CREATE INDEX ix_users_username ON users (username);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_users_email')
    CREATE INDEX ix_users_email ON users (email);
GO

PRINT 'Dentor database setup complete!';
GO
