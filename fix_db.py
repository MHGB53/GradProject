"""
Run this once to migrate existing VARCHAR columns to NVARCHAR so Arabic text is stored correctly.
Usage: python fix_db.py
"""
from sqlalchemy import text
from backend.database import engine

migrations = [
    # Community: post content
    "ALTER TABLE posts ALTER COLUMN content NVARCHAR(MAX);",
    # Community: comment content
    "ALTER TABLE post_comments ALTER COLUMN content NVARCHAR(MAX) NOT NULL;",
    # Chatbot: message content
    "ALTER TABLE chat_messages ALTER COLUMN content NVARCHAR(MAX) NOT NULL;",
    # Chatbot: session title (first 30 chars of user message, can be Arabic)
    "ALTER TABLE chat_sessions ALTER COLUMN title NVARCHAR(100) NOT NULL;",
    # Users: full name (Arabic names)
    "ALTER TABLE users ALTER COLUMN full_name NVARCHAR(100);",
]

with engine.connect() as conn:
    for sql in migrations:
        try:
            conn.execute(text(sql))
            print(f"OK: {sql}")
        except Exception as e:
            print(f"SKIP: {sql}\n      {e}")
    conn.commit()

print("\nDone. Restart the backend server.")
