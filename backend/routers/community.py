"""
Community router: /api/community endpoints.

All endpoints require a valid JWT (Authorization: Bearer <token>).

Endpoints:
  GET    /api/community/posts                        - List all posts (paginated)
  POST   /api/community/posts                        - Create a post (text + optional files)
  DELETE /api/community/posts/{post_id}              - Delete own post
  POST   /api/community/posts/{post_id}/like         - Toggle like
  GET    /api/community/posts/{post_id}/likes        - Who liked this post
  GET    /api/community/posts/{post_id}/comments     - List comments
  POST   /api/community/posts/{post_id}/comments     - Add a comment
  DELETE /api/community/comments/{comment_id}        - Delete own comment
"""

import os
import uuid
import shutil
from typing import List, Optional

from fastapi import (
    APIRouter, Depends, HTTPException, status,
    UploadFile, File, Form, Query
)
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, Post, PostAttachment, PostLike, PostComment
from ..schemas import (
    PostOut, AttachmentOut, AuthorOut,
    CommentOut, LikerOut, PaginatedPostsOut, MessageResponse
)
from ..routers.auth import get_current_user

router = APIRouter(prefix="/api/community", tags=["Community"])

# ──────────────────────────── Config ────────────────────────────

UPLOAD_ROOT = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    "uploads", "community"
)
os.makedirs(UPLOAD_ROOT, exist_ok=True)

ALLOWED_MIME = {
    "image/jpeg", "image/png", "image/gif", "image/webp",
    "video/mp4", "video/webm", "video/quicktime",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB per file


# ──────────────────────────── Helpers ────────────────────────────

def _classify_file(mime: str) -> str:
    if mime.startswith("image/"):
        return "image"
    if mime.startswith("video/"):
        return "video"
    if mime == "application/pdf":
        return "pdf"
    return "doc"


def _make_attachment_url(request_base: str, file_path: str) -> str:
    return f"{request_base}/uploads/community/{os.path.basename(file_path)}"


def _build_post_out(post: Post, current_user_id: int, base_url: str) -> PostOut:
    liked = any(l.user_id == current_user_id for l in post.likes)
    attachments = [
        AttachmentOut(
            id=a.id,
            file_name=a.file_name,
            file_type=a.file_type,
            mime_type=a.mime_type,
            url=f"{base_url}/uploads/community/{os.path.basename(a.file_path)}",
        )
        for a in post.attachments
    ]
    return PostOut(
        id=post.id,
        content=post.content,
        author=AuthorOut(
            id=post.author.id,
            username=post.author.username,
            full_name=post.author.full_name,
        ),
        like_count=len(post.likes),
        comment_count=len(post.comments),
        liked_by_me=liked,
        attachments=attachments,
        created_at=post.created_at,
    )


# ──────────────────────────── Endpoints ────────────────────────────

@router.get("/posts", response_model=PaginatedPostsOut, summary="List all posts")
def list_posts(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Return paginated community posts, newest first.
    Includes like count, comment count, attachment URLs, and whether the caller liked each post.
    """
    base_url = "http://localhost:8000"
    offset = (page - 1) * page_size

    total = db.query(Post).count()
    posts = (
        db.query(Post)
        .order_by(Post.created_at.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )

    return PaginatedPostsOut(
        posts=[_build_post_out(p, current_user.id, base_url) for p in posts],
        total=total,
        page=page,
        page_size=page_size,
        has_more=(offset + page_size) < total,
    )


@router.post("/posts", response_model=PostOut, status_code=status.HTTP_201_CREATED, summary="Create a post")
async def create_post(
    content: Optional[str] = Form(None),
    files: Optional[List[UploadFile]] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create a new community post.
    - **content**: text body (optional if files are provided)
    - **files**: one or more files (images, videos, PDFs, Word docs) — max 50 MB each
    """
    base_url = "http://localhost:8000"

    if not content and not files:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="A post must have either text content or at least one file.",
        )

    # Create post record
    post = Post(user_id=current_user.id, content=content)
    db.add(post)
    db.flush()  # get post.id before adding attachments

    # Handle file uploads
    if files:
        for upload in files:
            if not upload.filename:
                continue

            # Validate MIME type
            mime = upload.content_type or "application/octet-stream"
            if mime not in ALLOWED_MIME:
                raise HTTPException(
                    status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                    detail=f"File type '{mime}' is not allowed. Allowed: images, videos, PDFs, Word docs.",
                )

            # Read & size-check
            data = await upload.read()
            if len(data) > MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"File '{upload.filename}' exceeds the 50 MB limit.",
                )

            # Save to disk with a unique name
            ext = os.path.splitext(upload.filename)[1]
            unique_name = f"{uuid.uuid4().hex}{ext}"
            disk_path = os.path.join(UPLOAD_ROOT, unique_name)
            with open(disk_path, "wb") as f:
                f.write(data)

            attachment = PostAttachment(
                post_id=post.id,
                file_name=upload.filename,
                file_path=disk_path,
                file_type=_classify_file(mime),
                mime_type=mime,
            )
            db.add(attachment)

    db.commit()
    db.refresh(post)
    return _build_post_out(post, current_user.id, base_url)


@router.delete("/posts/{post_id}", response_model=MessageResponse, summary="Delete a post")
def delete_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a post you own. Also removes all attached files from disk."""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")
    if post.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own posts.")

    # Delete attachment files from disk
    for att in post.attachments:
        if os.path.exists(att.file_path):
            os.remove(att.file_path)

    db.delete(post)
    db.commit()
    return MessageResponse(message="Post deleted successfully.")


@router.post("/posts/{post_id}/like", response_model=MessageResponse, summary="Toggle like on a post")
def toggle_like(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Like or unlike a post. Returns message indicating current state."""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")

    existing = db.query(PostLike).filter(
        PostLike.post_id == post_id,
        PostLike.user_id == current_user.id,
    ).first()

    if existing:
        db.delete(existing)
        db.commit()
        return MessageResponse(message="unliked")
    else:
        db.add(PostLike(post_id=post_id, user_id=current_user.id))
        db.commit()
        return MessageResponse(message="liked")


@router.get("/posts/{post_id}/likes", response_model=List[LikerOut], summary="Who liked this post")
def get_likes(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return the list of users who liked a post."""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")

    return [
        LikerOut(id=like.user.id, username=like.user.username, full_name=like.user.full_name, liked_at=like.created_at)
        for like in post.likes
    ]


@router.get("/posts/{post_id}/comments", response_model=List[CommentOut], summary="List comments")
def get_comments(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return all comments on a post, oldest first."""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")

    return [
        CommentOut(
            id=c.id,
            content=c.content,
            author=AuthorOut(id=c.author.id, username=c.author.username, full_name=c.author.full_name),
            created_at=c.created_at,
        )
        for c in sorted(post.comments, key=lambda x: x.created_at or 0)
    ]


@router.post(
    "/posts/{post_id}/comments",
    response_model=CommentOut,
    status_code=status.HTTP_201_CREATED,
    summary="Add a comment",
)
def add_comment(
    post_id: int,
    content: str = Form(..., min_length=1),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add a comment to a post."""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")

    comment = PostComment(post_id=post_id, user_id=current_user.id, content=content)
    db.add(comment)
    db.commit()
    db.refresh(comment)

    return CommentOut(
        id=comment.id,
        content=comment.content,
        author=AuthorOut(
            id=current_user.id,
            username=current_user.username,
            full_name=current_user.full_name,
        ),
        created_at=comment.created_at,
    )


@router.delete("/comments/{comment_id}", response_model=MessageResponse, summary="Delete a comment")
def delete_comment(
    comment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a comment you own."""
    comment = db.query(PostComment).filter(PostComment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found.")
    if comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own comments.")

    db.delete(comment)
    db.commit()
    return MessageResponse(message="Comment deleted successfully.")
