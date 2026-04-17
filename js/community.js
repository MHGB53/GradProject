// ============================================================
//  community.js  —  API-driven Community Page
//  All data comes from the FastAPI backend.
//  Requires a valid JWT in localStorage ('access_token').
// ============================================================

const API_BASE = 'http://localhost:8000';

// ──────────────────────────── Auth Helpers ────────────────────────────

function getToken() {
    return localStorage.getItem('access_token');
}

function getAuthHeaders() {
    const token = getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}

/** Redirect to login if no token present */
function requireAuth() {
    if (!getToken()) {
        window.location.href = 'Login.html';
        return false;
    }
    return true;
}

/** Get the logged-in user's ID from JWT payload (base64 decode) */
function getCurrentUserId() {
    try {
        const token = getToken();
        if (!token) return null;
        const payload = JSON.parse(atob(token.split('.')[1]));
        return parseInt(payload.sub);
    } catch { return null; }
}

// ──────────────────────────── Time Helper ────────────────────────────

function timeAgo(dateStr) {
    if (!dateStr) return '';
    const now = new Date();
    const d = new Date(dateStr);
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
    return d.toLocaleDateString();
}

function formatDateTime(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const optionsDate = { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'Africa/Cairo' };
    const optionsTime = { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Cairo' };
    return d.toLocaleDateString('en-EG', optionsDate) + ' at ' + d.toLocaleTimeString('en-EG', optionsTime);
}

// ──────────────────────────── Avatar Helper ────────────────────────────

function avatarInitials(author) {
    const name = author.full_name || author.username || '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function avatarHtml(author, size = 'w-10 h-10') {
    const photoUrl = author.profile_photo || '../assets/default photo.png';
    return `<div class="${size} rounded-full bg-cover bg-center border-2 border-primary flex-shrink-0 shadow-sm" style="background-image: url('${photoUrl}')"></div>`;
}

// ──────────────────────────── State ────────────────────────────

let currentPostId = null;
let uploadedFiles = [];
let currentPage = 1;
let hasMore = true;
let isLoading = false;

// ──────────────────────────── Render Attachments ────────────────────────────

function renderAttachments(attachments) {
    if (!attachments || attachments.length === 0) return '';

    const images = attachments.filter(a => a.file_type === 'image');
    const videos = attachments.filter(a => a.file_type === 'video');
    const docs   = attachments.filter(a => a.file_type === 'pdf' || a.file_type === 'doc');

    let html = '<div class="mt-3 space-y-2">';

    // Image grid
    if (images.length > 0) {
        const gridClass = images.length === 1
            ? 'grid grid-cols-1'
            : images.length === 2
            ? 'grid grid-cols-2 gap-2'
            : 'grid grid-cols-2 gap-2';
        html += `<div class="${gridClass} rounded-xl overflow-hidden">`;
        images.forEach((img, i) => {
            if (images.length > 4 && i === 3) {
                html += `<div class="relative cursor-pointer" onclick="window.open('${img.url}','_blank')">
                    <img src="${img.url}" class="w-full h-32 object-cover" />
                    <div class="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-xl">+${images.length - 4}</div>
                </div>`;
            } else if (i < 4) {
                html += `<img src="${img.url}" 
                     class="w-full h-32 object-cover cursor-pointer hover:opacity-90 transition-opacity" 
                     onclick="window.open('${img.url}','_blank')"
                     alt="${img.file_name}" />`;
            }
        });
        html += '</div>';
    }

    // Video players
    videos.forEach(vid => {
        html += `<video controls class="w-full rounded-xl max-h-64 bg-black">
                    <source src="${vid.url}" type="${vid.mime_type || 'video/mp4'}">
                 </video>`;
    });

    // Document links
    if (docs.length > 0) {
        html += '<div class="space-y-2">';
        docs.forEach(doc => {
            const isPdf = doc.file_type === 'pdf';
            const icon = isPdf ? 'picture_as_pdf' : 'description';
            const color = isPdf ? 'text-red-500' : 'text-blue-500';
            html += `<a href="${doc.url}" target="_blank"
                        class="flex items-center gap-3 p-3 rounded-xl bg-background dark:bg-dark-background border border-border-color dark:border-dark-border-color hover:border-primary transition-colors group">
                        <span class="material-symbols-outlined ${color}">${icon}</span>
                        <span class="text-sm text-text-primary dark:text-dark-text-primary font-medium group-hover:text-primary transition-colors flex-1 truncate">${doc.file_name}</span>
                        <span class="material-symbols-outlined text-text-secondary dark:text-dark-text-secondary text-sm">open_in_new</span>
                    </a>`;
        });
        html += '</div>';
    }

    html += '</div>';
    return html;
}

// ──────────────────────────── Render Post Card ────────────────────────────

function renderPostCard(post) {
    const myId = getCurrentUserId();
    const isOwner = post.author.id === myId;
    const likedClass = post.liked_by_me ? 'liked text-primary' : '';
    const fillStyle = post.liked_by_me ? "'FILL' 1" : "'FILL' 0";

    return `
    <div id="post-card-${post.id}" class="bg-card dark:bg-dark-card rounded-2xl shadow-subtle p-6 hover:shadow-lg transition-shadow duration-300 animate-fade-in">
        <div class="flex gap-4 items-start">
            ${avatarHtml(post.author, 'w-10 h-10')}
            <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between mb-2">
                    <div>
                        <p class="text-text-secondary dark:text-dark-text-secondary text-sm font-medium leading-normal">
                            <span class="font-semibold text-text-primary dark:text-dark-text-primary">
                                ${post.author.full_name || post.author.username}
                            </span>
                            <span class="mx-1 text-text-secondary dark:text-dark-text-secondary">·</span>
                            <span class="text-text-secondary dark:text-dark-text-secondary font-normal" title="${timeAgo(post.created_at)}">
                                ${formatDateTime(post.created_at)}
                            </span>
                        </p>
                    </div>
                    ${isOwner ? `
                    <button onclick="deletePost(${post.id})" 
                        class="text-text-secondary dark:text-dark-text-secondary hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Delete post">
                        <span class="material-symbols-outlined text-sm">delete</span>
                    </button>` : ''}
                </div>

                ${post.content ? `
                <p class="text-text-secondary dark:text-dark-text-secondary text-sm font-normal leading-relaxed mb-3">
                    ${post.content}
                </p>` : ''}

                ${renderAttachments(post.attachments)}

                <!-- Like and Comment Actions -->
                <div class="flex items-center gap-6 text-text-secondary dark:text-dark-text-secondary mt-4 mb-4">
                    <button id="like-btn-${post.id}" onclick="toggleLike(${post.id}, this)"
                        class="flex items-center gap-1.5 hover:text-primary transition-colors text-sm ${likedClass}">
                        <span class="material-symbols-outlined text-lg" style="font-variation-settings: ${fillStyle}">thumb_up</span>
                        <span class="like-count">${post.like_count}</span>
                    </button>
                    <button onclick="openCommentsModal(${post.id}, ${post.comment_count})"
                        class="flex items-center gap-1.5 hover:text-primary transition-colors text-sm">
                        <span class="material-symbols-outlined text-lg">chat_bubble</span>
                        <span class="comment-count">${post.comment_count}</span>
                    </button>
                    <button onclick="openLikesModal(${post.id})"
                        class="text-xs hover:text-primary transition-colors">
                        View Likes
                    </button>
                </div>

                <!-- Quick Comment Input -->
                <div class="border-t border-border-color dark:border-dark-border-color pt-3">
                    <div class="flex items-center gap-2">
                        ${avatarHtml(JSON.parse(localStorage.getItem('user') || '{"username": "Me"}'), 'w-8 h-8')}
                        <input id="quick-comment-${post.id}"
                            class="flex-1 border-none focus:ring-0 text-sm bg-background dark:bg-dark-background text-text-primary dark:text-dark-text-primary rounded-full px-4 py-2 placeholder:text-text-secondary dark:placeholder:text-dark-text-secondary"
                            placeholder="Write a comment..."
                            onkeydown="if(event.key==='Enter') quickComment(${post.id})"
                        />
                        <button onclick="quickComment(${post.id})"
                            class="flex items-center justify-center rounded-full bg-primary text-white w-9 h-9 hover:bg-primary-dark transition-all duration-300 hover:scale-110 shadow-md">
                            <span class="material-symbols-outlined text-lg">send</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
}

// ──────────────────────────── Load Posts ────────────────────────────

async function loadPosts(reset = false) {
    if (isLoading || (!hasMore && !reset)) return;
    isLoading = true;

    if (reset) {
        currentPage = 1;
        hasMore = true;
        const feed = document.getElementById('postsFeed');
        if (feed) feed.innerHTML = '<div class="text-center py-12 text-text-secondary dark:text-dark-text-secondary" id="loadingSpinner"><span class="material-symbols-outlined text-4xl animate-pulse-soft text-primary">refresh</span><p class="mt-2 text-sm">Loading posts...</p></div>';
    }

    try {
        const res = await fetch(`${API_BASE}/api/community/posts?page=${currentPage}&page_size=10`, {
            headers: getAuthHeaders()
        });

        if (res.status === 401) {
            window.location.href = 'Login.html';
            return;
        }

        if (!res.ok) throw new Error('Failed to load posts');

        const data = await res.json();
        const feed = document.getElementById('postsFeed');
        if (!feed) return;

        // Remove loading spinner on first page
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) spinner.remove();

        if (data.posts.length === 0 && currentPage === 1) {
            feed.innerHTML = `
                <div class="text-center py-16 text-text-secondary dark:text-dark-text-secondary">
                    <span class="material-symbols-outlined text-5xl text-primary/50">forum</span>
                    <p class="mt-3 text-lg font-semibold">No posts yet!</p>
                    <p class="text-sm mt-1">Be the first to share something with the community.</p>
                </div>`;
        } else {
            data.posts.forEach(post => {
                feed.insertAdjacentHTML('beforeend', renderPostCard(post));
            });
        }

        hasMore = data.has_more;
        currentPage++;

        // Update load-more button
        const loadMore = document.getElementById('loadMoreBtn');
        if (loadMore) loadMore.classList.toggle('hidden', !hasMore);

    } catch (err) {
        console.error('Failed to load posts:', err);
        const feed = document.getElementById('postsFeed');
        if (feed && currentPage === 1) {
            feed.innerHTML = `<div class="text-center py-12 text-red-500"><span class="material-symbols-outlined text-4xl">error</span><p class="mt-2 text-sm">Could not load posts. Make sure the server is running.</p></div>`;
        }
    } finally {
        isLoading = false;
    }
}

// ──────────────────────────── Submit Post ────────────────────────────

async function submitPost(e) {
    if (e) e.preventDefault();

    const textarea = document.getElementById('composer-textarea');
    const text = textarea ? textarea.value.trim() : '';

    if (!text && uploadedFiles.length === 0) {
        alert('Please write something or attach a file before posting.');
        return;
    }

    const submitBtn = document.querySelector('[data-post-submit]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="material-symbols-outlined text-base animate-spin">refresh</span> Posting...';
    }

    try {
        const formData = new FormData();
        if (text) formData.append('content', text);
        uploadedFiles.forEach(file => formData.append('files', file));

        const res = await fetch(`${API_BASE}/api/community/posts`, {
            method: 'POST',
            headers: getAuthHeaders(),   // NOTE: No Content-Type — browser sets multipart boundary
            body: formData
        });

        if (res.status === 401) { window.location.href = 'Login.html'; return; }
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || 'Failed to post');
        }

        const newPost = await res.json();

        // Clear composer
        if (textarea) textarea.value = '';
        uploadedFiles = [];
        updateFilePreview();

        // Prepend the new post
        const feed = document.getElementById('postsFeed');
        const emptyMsg = feed.querySelector('.text-center');
        if (emptyMsg) emptyMsg.remove();
        feed.insertAdjacentHTML('afterbegin', renderPostCard(newPost));

    } catch (err) {
        console.error('Submit post error:', err);
        alert('Failed to create post: ' + err.message);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span class="material-symbols-outlined text-base">send</span> Post';
        }
    }
}

// ──────────────────────────── Delete Post ────────────────────────────

async function deletePost(postId) {
    try {
        const res = await fetch(`${API_BASE}/api/community/posts/${postId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (res.status === 401) { window.location.href = 'Login.html'; return; }
        if (!res.ok) throw new Error('Failed to delete');

        const card = document.getElementById(`post-card-${postId}`);
        if (card) {
            card.style.opacity = '0';
            card.style.transform = 'scale(0.95)';
            card.style.transition = 'all 0.3s ease';
            setTimeout(() => card.remove(), 300);
        }
    } catch (err) {
        console.error('Could not delete post:', err);
    }
}

// ──────────────────────────── Toggle Like ────────────────────────────

async function toggleLike(postId, btn) {
    try {
        const res = await fetch(`${API_BASE}/api/community/posts/${postId}/like`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        if (res.status === 401) { window.location.href = 'Login.html'; return; }
        if (!res.ok) throw new Error('Failed to toggle like');

        const data = await res.json();
        const liked = data.message === 'liked';
        const countEl = btn.querySelector('.like-count');
        const iconEl = btn.querySelector('.material-symbols-outlined');
        const current = parseInt(countEl.textContent);

        if (liked) {
            btn.classList.add('liked', 'text-primary');
            countEl.textContent = current + 1;
            if (iconEl) iconEl.style.fontVariationSettings = "'FILL' 1";
        } else {
            btn.classList.remove('liked', 'text-primary');
            countEl.textContent = Math.max(0, current - 1);
            if (iconEl) iconEl.style.fontVariationSettings = "'FILL' 0";
        }
    } catch (err) {
        console.error('Toggle like error:', err);
    }
}

// ──────────────────────────── Likes Modal ────────────────────────────

async function openLikesModal(postId) {
    const modal = document.getElementById('likesModal');
    const content = document.getElementById('likesModalContent');
    if (!modal || !content) return;

    content.innerHTML = '<div class="text-center py-8"><span class="material-symbols-outlined animate-pulse-soft text-primary">refresh</span></div>';
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    try {
        const res = await fetch(`${API_BASE}/api/community/posts/${postId}/likes`, {
            headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error('Failed to load likes');
        const likers = await res.json();

        if (likers.length === 0) {
            content.innerHTML = '<p class="text-center text-text-secondary dark:text-dark-text-secondary text-sm py-8">No likes yet. Be the first!</p>';
        } else {
            content.innerHTML = likers.map(u => `
                <div class="flex items-center gap-3 p-3 rounded-xl hover:bg-background dark:bg-dark-background transition-colors">
                    ${avatarHtml(u)}
                    <div class="flex-1">
                        <p class="text-sm text-text-primary dark:text-dark-text-primary font-semibold">${u.full_name || u.username}</p>
                        <p class="text-xs text-text-secondary dark:text-dark-text-secondary">@${u.username}</p>
                    </div>
                    <div class="text-xs text-text-secondary dark:text-dark-text-secondary text-right">
                        ${formatDateTime(u.liked_at)}
                    </div>
                </div>`).join('');
        }
    } catch (err) {
        content.innerHTML = '<p class="text-center text-red-500 text-sm py-8">Could not load likes.</p>';
    }
}

function closeLikesModal() {
    const modal = document.getElementById('likesModal');
    if (modal) modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

// ──────────────────────────── Comments Modal ────────────────────────────

async function openCommentsModal(postId, count) {
    currentPostId = postId;
    const modal = document.getElementById('commentsModal');
    const content = document.getElementById('commentsModalContent');
    const countSpan = document.getElementById('commentsCount');
    if (!modal || !content) return;

    if (countSpan) countSpan.textContent = count > 0 ? `(${count})` : '';
    content.innerHTML = '<div class="text-center py-8"><span class="material-symbols-outlined animate-pulse-soft text-primary">refresh</span></div>';
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    await loadComments(postId);
}

async function loadComments(postId) {
    const content = document.getElementById('commentsModalContent');
    try {
        const res = await fetch(`${API_BASE}/api/community/posts/${postId}/comments`, {
            headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error('Failed to load');
        const comments = await res.json();

        const myId = getCurrentUserId();

        if (comments.length === 0) {
            content.innerHTML = '<p class="text-center text-text-secondary dark:text-dark-text-secondary text-sm py-8">No comments yet. Be the first to comment!</p>';
        } else {
            content.innerHTML = comments.map(c => {
                const isOwner = c.author.id === myId;
                return `
                <div id="comment-${c.id}" class="mb-4">
                    <div class="flex gap-3">
                        ${avatarHtml(c.author, 'w-8 h-8')}
                        <div class="flex-1">
                            <div class="bg-background dark:bg-dark-background rounded-xl p-3">
                                <p class="text-xs font-semibold text-text-primary dark:text-dark-text-primary mb-1">
                                    ${c.author.full_name || c.author.username}
                                    <span class="font-normal text-text-secondary dark:text-dark-text-secondary ml-1">@${c.author.username}</span>
                                </p>
                                <p class="text-xs text-text-secondary dark:text-dark-text-secondary">${c.content}</p>
                            </div>
                            <div class="flex items-center gap-4 mt-2 ml-3">
                                <span class="text-xs text-text-secondary dark:text-dark-text-secondary">${formatDateTime(c.created_at)}</span>
                                ${isOwner ? `<button onclick="deleteComment(${c.id}, ${postId})" class="text-xs text-red-500 hover:text-red-700 transition-colors">Delete</button>` : ''}
                            </div>
                        </div>
                    </div>
                </div>`;
            }).join('');
        }
    } catch (err) {
        content.innerHTML = '<p class="text-center text-red-500 py-8 text-sm">Could not load comments.</p>';
    }
}

function closeCommentsModal() {
    const modal = document.getElementById('commentsModal');
    if (modal) modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
    currentPostId = null;
}

// ──────────────────────────── Add Comment ────────────────────────────

async function addComment() {
    const input = document.getElementById('newCommentInput');
    if (!input) return;
    const text = input.value.trim();
    if (!text || !currentPostId) return;

    const btn = document.querySelector('#commentsModal button[onclick="addComment()"]');
    if (btn) btn.disabled = true;

    try {
        const formData = new FormData();
        formData.append('content', text);

        const res = await fetch(`${API_BASE}/api/community/posts/${currentPostId}/comments`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: formData
        });
        if (res.status === 401) { window.location.href = 'Login.html'; return; }
        if (!res.ok) throw new Error('Failed to add comment');

        input.value = '';
        await loadComments(currentPostId);

        // Update comment count badge on the post card
        const commentCountEl = document.querySelector(`#post-card-${currentPostId} .comment-count`);
        if (commentCountEl) {
            commentCountEl.textContent = parseInt(commentCountEl.textContent) + 1;
        }
        const countSpan = document.getElementById('commentsCount');
        if (countSpan) {
            const curr = parseInt((countSpan.textContent || '(0)').replace(/\D/g, '')) || 0;
            countSpan.textContent = `(${curr + 1})`;
        }
    } catch (err) {
        alert('Could not add comment: ' + err.message);
    } finally {
        if (btn) btn.disabled = false;
    }
}

// Quick comment from the inline input on the post card
async function quickComment(postId) {
    const input = document.getElementById(`quick-comment-${postId}`);
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    try {
        const formData = new FormData();
        formData.append('content', text);

        const res = await fetch(`${API_BASE}/api/community/posts/${postId}/comments`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: formData
        });
        if (res.status === 401) { window.location.href = 'Login.html'; return; }
        if (!res.ok) throw new Error('Failed');

        input.value = '';
        const countEl = document.querySelector(`#post-card-${postId} .comment-count`);
        if (countEl) countEl.textContent = parseInt(countEl.textContent) + 1;
    } catch (err) {
        console.error('Quick comment error:', err);
    }
}

// ──────────────────────────── Delete Comment ────────────────────────────

async function deleteComment(commentId, postId) {
    try {
        const res = await fetch(`${API_BASE}/api/community/comments/${commentId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error('Failed to delete');
        const el = document.getElementById(`comment-${commentId}`);
        if (el) el.remove();

        const countEl = document.querySelector(`#post-card-${postId} .comment-count`);
        if (countEl) countEl.textContent = Math.max(0, parseInt(countEl.textContent) - 1);
    } catch (err) {
        console.error('Could not delete comment:', err);
    }
}

// ──────────────────────────── File Upload ────────────────────────────

function updateFilePreview() {
    const filePreview = document.getElementById('filePreview');
    const fileList = document.getElementById('fileList');
    if (!filePreview || !fileList) return;

    if (uploadedFiles.length > 0) {
        filePreview.classList.remove('hidden');
        fileList.innerHTML = uploadedFiles.map((file, index) => {
            let icon = 'insert_drive_file';
            let color = 'text-gray-500';
            if (file.type.startsWith('image/'))      { icon = 'image';          color = 'text-green-500'; }
            else if (file.type.startsWith('video/')) { icon = 'videocam';       color = 'text-blue-500'; }
            else if (file.type === 'application/pdf') { icon = 'picture_as_pdf'; color = 'text-red-500'; }
            else if (file.type.includes('word'))     { icon = 'description';    color = 'text-blue-600'; }

            return `
            <div class="flex items-center justify-between p-2 rounded-lg bg-card dark:bg-dark-card">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-sm ${color}">${icon}</span>
                <span class="text-xs text-text-primary dark:text-dark-text-primary font-medium">${file.name}</span>
                <span class="text-xs text-text-secondary dark:text-dark-text-secondary">(${(file.size / 1024).toFixed(1)} KB)</span>
              </div>
              <button type="button" onclick="removeFile(${index})" class="text-red-500 hover:text-red-700">
                <span class="material-symbols-outlined text-sm">close</span>
              </button>
            </div>`;
        }).join('');
    } else {
        filePreview.classList.add('hidden');
    }
}

function removeFile(index) {
    uploadedFiles.splice(index, 1);
    updateFilePreview();
}

function handleFileUpload(input) {
    if (input.files.length > 0) {
        Array.from(input.files).forEach(file => uploadedFiles.push(file));
        updateFilePreview();
        input.value = '';
    }
}

// ──────────────────────────── Mobile Menu ────────────────────────────

function initializeMobileMenu() {
    const mobileMenuBtn   = document.getElementById('mobileMenuBtn');
    const mobileSidebar   = document.getElementById('mobileSidebar');
    const mobileSidebarPanel = document.getElementById('mobileSidebarPanel');
    const closeMobileMenu = document.getElementById('closeMobileMenu');

    if (mobileMenuBtn && mobileSidebar && mobileSidebarPanel) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileSidebar.classList.remove('hidden');
            setTimeout(() => mobileSidebarPanel.classList.remove('-translate-x-full'), 10);
        });
        const closeSidebar = () => {
            mobileSidebarPanel.classList.add('-translate-x-full');
            setTimeout(() => mobileSidebar.classList.add('hidden'), 300);
        };
        if (closeMobileMenu) closeMobileMenu.addEventListener('click', closeSidebar);
        mobileSidebar.addEventListener('click', e => { if (e.target === mobileSidebar) closeSidebar(); });
    }
}

// ──────────────────────────── Dark Mode ────────────────────────────

function initializeDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const darkModeIcon   = document.getElementById('darkModeIcon');
    const logoImage      = document.getElementById('logoImage');
    const htmlElement    = document.documentElement;
    const lightLogo = '../assets/Logo.png';
    const darkLogo  = '../assets/Logo0.png';
    const currentTheme = localStorage.getItem('theme') || 'light';

    if (currentTheme === 'dark') {
        htmlElement.classList.add('dark');
        if (darkModeIcon) darkModeIcon.textContent = 'dark_mode';
        if (logoImage) logoImage.src = darkLogo;
    } else {
        htmlElement.classList.remove('dark');
        if (darkModeIcon) darkModeIcon.textContent = 'light_mode';
        if (logoImage) logoImage.src = lightLogo;
    }

    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', function () {
            htmlElement.classList.toggle('dark');
            const isDark = htmlElement.classList.contains('dark');
            if (darkModeIcon) darkModeIcon.textContent = isDark ? 'dark_mode' : 'light_mode';
            if (logoImage) {
                logoImage.style.opacity = '0';
                setTimeout(() => { logoImage.src = isDark ? darkLogo : lightLogo; logoImage.style.opacity = '1'; }, 150);
            }
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        });
    }
}

// ──────────────────────────── Navigation ────────────────────────────

function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            if (this.getAttribute('href') === '#') e.preventDefault();
        });
    });
}

function hideCurrentPageFromDropdown() {
    const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
    document.querySelectorAll('.absolute.left-0.mt-2 a[href]').forEach(link => {
        link.style.display = link.getAttribute('href') === currentPage ? 'none' : '';
    });
}

// ──────────────────────────── Dropdowns ────────────────────────────

function initializeDropdowns() {
    const notificationBtn      = document.getElementById('notificationBtn');
    const notificationDropdown = document.getElementById('notificationDropdown');
    const profileBtn           = document.getElementById('profileBtn');
    const profileDropdown      = document.getElementById('profileDropdown');

    if (notificationBtn && notificationDropdown) {
        notificationBtn.addEventListener('click', e => {
            e.preventDefault(); e.stopPropagation();
            notificationDropdown.classList.toggle('hidden');
            if (profileDropdown) profileDropdown.classList.add('hidden');
        });
    }
    if (profileBtn && profileDropdown) {
        profileBtn.addEventListener('click', e => {
            e.preventDefault(); e.stopPropagation();
            profileDropdown.classList.toggle('hidden');
            if (notificationDropdown) notificationDropdown.classList.add('hidden');
        });
    }
    document.addEventListener('click', e => {
        if (notificationBtn && notificationDropdown && !notificationBtn.contains(e.target) && !notificationDropdown.contains(e.target))
            notificationDropdown.classList.add('hidden');
        if (profileBtn && profileDropdown && !profileBtn.contains(e.target) && !profileDropdown.contains(e.target))
            profileDropdown.classList.add('hidden');
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            if (notificationDropdown) notificationDropdown.classList.add('hidden');
            if (profileDropdown) profileDropdown.classList.add('hidden');
        }
    });
}

// ──────────────────────────── Textarea Auto-resize ────────────────────────────

function initTextarea() {
    const ta = document.getElementById('composer-textarea');
    if (!ta) return;
    const min = '2.5rem';
    ta.style.height = min;
    ta.addEventListener('input', function () {
        this.style.height = min;
        this.style.height = this.value.trim() === '' ? min : (this.scrollHeight + 'px');
    });
}

// ──────────────────────────── Modal backdrop close ────────────────────────────

function initModalBackdrops() {
    const likesModal = document.getElementById('likesModal');
    if (likesModal) likesModal.addEventListener('click', e => { if (e.target === likesModal) closeLikesModal(); });

    const commentsModal = document.getElementById('commentsModal');
    if (commentsModal) commentsModal.addEventListener('click', e => { if (e.target === commentsModal) closeCommentsModal(); });
}

// ──────────────────────────── Post Composer Setup ────────────────────────────

function initComposer() {
    // File inputs
    ['photo-upload', 'video-upload', 'pdf-upload', 'doc-upload'].forEach(id => {
        const input = document.getElementById(id);
        if (input) input.addEventListener('change', function () { handleFileUpload(this); });
    });

    // Clear files button
    const clearBtn = document.getElementById('clearFiles');
    if (clearBtn) clearBtn.addEventListener('click', () => { uploadedFiles = []; updateFilePreview(); });

    // Form submit — attach to the composer form
    const form = document.querySelector('#postComposer');
    if (form) {
        form.addEventListener('submit', submitPost);
    }

    // Mark submit button
    const submitBtn = document.querySelector('#postComposer button[type="submit"]');
    if (submitBtn) submitBtn.setAttribute('data-post-submit', '');
}

// ──────────────────────────── Load More Button ────────────────────────────

function initLoadMore() {
    const btn = document.getElementById('loadMoreBtn');
    if (btn) {
        btn.addEventListener('click', () => loadPosts());
    }
}

// ──────────────────────────── Main Init ────────────────────────────

function initCommunity() {
    try {
        console.log('Community JS Initializing...');

        // Verify authentication
        if (!requireAuth()) return;

        initializeMobileMenu();
        initializeDarkMode();
        initializeNavigation();
        hideCurrentPageFromDropdown();
        initializeDropdowns();
        initTextarea();
        initModalBackdrops();
        initComposer();
        initLoadMore();

        // Load first page of posts
        loadPosts(true);

    } catch (error) {
        console.error('Error in community.js initialization:', error);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCommunity);
} else {
    initCommunity();
}
