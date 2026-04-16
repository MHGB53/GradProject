"""
SQLAlchemy ORM models for Dentor.

Tables:
  users           - registered accounts
  posts           - community posts (text + optional attachments)
  post_attachments- files attached to posts (images, videos, PDFs)
  post_likes      - who liked which post  (unique per user/post pair)
  post_comments   - comments on posts
"""

from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime,
    ForeignKey, UniqueConstraint, Text
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .database import Base


# ──────────────────────────── Users ────────────────────────────

class User(Base):
    __tablename__ = "users"

    id              = Column(Integer, primary_key=True, index=True)
    username        = Column(String(50),  unique=True, nullable=False, index=True)
    email           = Column(String(255), unique=True, nullable=False, index=True)
    full_name       = Column(String(100), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    is_active       = Column(Boolean, default=True)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())
    updated_at      = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    posts    = relationship("Post",        back_populates="author", cascade="all, delete-orphan")
    likes    = relationship("PostLike",    back_populates="user",   cascade="all, delete-orphan")
    comments = relationship("PostComment", back_populates="author", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User id={self.id} username={self.username}>"


# ──────────────────────────── Community ────────────────────────────

class Post(Base):
    __tablename__ = "posts"

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    content    = Column(Text, nullable=True)   # Text is optional if files are attached
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    author      = relationship("User",            back_populates="posts")
    attachments = relationship("PostAttachment",  back_populates="post", cascade="all, delete-orphan")
    likes       = relationship("PostLike",        back_populates="post", cascade="all, delete-orphan")
    comments    = relationship("PostComment",     back_populates="post", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Post id={self.id} user_id={self.user_id}>"


class PostAttachment(Base):
    """
    A file attached to a post.  The actual binary is stored on disk;
    only the relative path is kept here.
    """
    __tablename__ = "post_attachments"

    id         = Column(Integer, primary_key=True, index=True)
    post_id    = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True)
    file_name  = Column(String(255), nullable=False)          # original filename
    file_path  = Column(String(500), nullable=False)          # relative path on disk  e.g. "community/abc.jpg"
    file_type  = Column(String(20),  nullable=False)          # image | video | pdf | doc
    mime_type  = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    post = relationship("Post", back_populates="attachments")


class PostLike(Base):
    __tablename__ = "post_likes"
    __table_args__ = (
        UniqueConstraint("post_id", "user_id", name="uq_post_like"),
    )

    id         = Column(Integer, primary_key=True, index=True)
    post_id    = Column(Integer, ForeignKey("posts.id",  ondelete="CASCADE"),    nullable=False, index=True)
    # No CASCADE on user_id — SQL Server does not allow multiple cascade paths to users
    user_id    = Column(Integer, ForeignKey("users.id",  ondelete="NO ACTION"),  nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    post = relationship("Post", back_populates="likes")
    user = relationship("User", back_populates="likes")


class PostComment(Base):
    __tablename__ = "post_comments"

    id         = Column(Integer, primary_key=True, index=True)
    post_id    = Column(Integer, ForeignKey("posts.id",  ondelete="CASCADE"),   nullable=False, index=True)
    # No CASCADE on user_id — SQL Server does not allow multiple cascade paths to users
    user_id    = Column(Integer, ForeignKey("users.id",  ondelete="NO ACTION"), nullable=False, index=True)
    content    = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    post   = relationship("Post", back_populates="comments")
    author = relationship("User", back_populates="comments")
