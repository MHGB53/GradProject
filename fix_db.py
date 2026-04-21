from sqlalchemy import text
from backend.database import engine

with engine.connect() as c:
    c.execute(text("IF OBJECT_ID('chat_messages', 'U') IS NOT NULL DROP TABLE chat_messages;"))
    c.execute(text("IF OBJECT_ID('chat_sessions', 'U') IS NOT NULL DROP TABLE chat_sessions;"))
    c.commit()
