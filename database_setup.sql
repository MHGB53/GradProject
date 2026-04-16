-- ============================================================
--  Dentor Database Setup
--  Run this script in SSMS before starting the FastAPI server.
--  Tested on SQL Server 2019 / 2022 / Azure SQL
--
--  NOTE: SQLAlchemy will also auto-create all tables at startup
--        via metadata.create_all(). This script is provided for
--        manual inspection or initial setup in SSMS.
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

-- ============================================================
--  2. Users table
-- ============================================================
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_NAME = 'users'
)
BEGIN
    CREATE TABLE users (
        id              INT           IDENTITY(1,1) PRIMARY KEY,
        username        NVARCHAR(50)  NOT NULL UNIQUE,
        email           NVARCHAR(255) NOT NULL UNIQUE,
        full_name       NVARCHAR(100) NULL,
        hashed_password NVARCHAR(255) NOT NULL,
        is_active       BIT           NOT NULL DEFAULT 1,
        created_at      DATETIME2     NOT NULL DEFAULT GETUTCDATE(),
        updated_at      DATETIME2     NULL
    );
    PRINT 'users table created.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_users_username')
    CREATE INDEX ix_users_username ON users (username);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_users_email')
    CREATE INDEX ix_users_email ON users (email);
GO

-- ============================================================
--  3. Posts table
-- ============================================================
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_NAME = 'posts'
)
BEGIN
    CREATE TABLE posts (
        id         INT       IDENTITY(1,1) PRIMARY KEY,
        user_id    INT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content    NVARCHAR(MAX) NULL,
        created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        updated_at DATETIME2 NULL
    );
    PRINT 'posts table created.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_posts_user_id')
    CREATE INDEX ix_posts_user_id ON posts (user_id);
GO

-- ============================================================
--  4. Post Attachments table
-- ============================================================
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_NAME = 'post_attachments'
)
BEGIN
    CREATE TABLE post_attachments (
        id         INT            IDENTITY(1,1) PRIMARY KEY,
        post_id    INT            NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        file_name  NVARCHAR(255)  NOT NULL,
        file_path  NVARCHAR(500)  NOT NULL,
        file_type  NVARCHAR(20)   NOT NULL,   -- image | video | pdf | doc
        mime_type  NVARCHAR(100)  NULL,
        created_at DATETIME2      NOT NULL DEFAULT GETUTCDATE()
    );
    PRINT 'post_attachments table created.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_post_attachments_post_id')
    CREATE INDEX ix_post_attachments_post_id ON post_attachments (post_id);
GO

-- ============================================================
--  5. Post Likes table
-- ============================================================
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_NAME = 'post_likes'
)
BEGIN
    CREATE TABLE post_likes (
        id         INT       IDENTITY(1,1) PRIMARY KEY,
        post_id    INT       NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        -- NO CASCADE on user_id to avoid multiple cascade paths (SQL Server error 1785)
        user_id    INT       NOT NULL REFERENCES users(id) ON DELETE NO ACTION,
        created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT uq_post_like UNIQUE (post_id, user_id)
    );
    PRINT 'post_likes table created.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_post_likes_post_id')
    CREATE INDEX ix_post_likes_post_id ON post_likes (post_id);
GO

-- ============================================================
--  6. Post Comments table
-- ============================================================
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_NAME = 'post_comments'
)
BEGIN
    CREATE TABLE post_comments (
        id         INT            IDENTITY(1,1) PRIMARY KEY,
        post_id    INT            NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        -- NO CASCADE on user_id to avoid multiple cascade paths (SQL Server error 1785)
        user_id    INT            NOT NULL REFERENCES users(id) ON DELETE NO ACTION,
        content    NVARCHAR(MAX)  NOT NULL,
        created_at DATETIME2      NOT NULL DEFAULT GETUTCDATE()
    );
    PRINT 'post_comments table created.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_post_comments_post_id')
    CREATE INDEX ix_post_comments_post_id ON post_comments (post_id);
GO

PRINT 'Dentor database setup complete!';
GO
