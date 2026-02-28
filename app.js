// ============================================
// QuickSave PWA — App Logic
// ============================================

(function () {
    'use strict';

    // ---- DOM References ----
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    const views = {
        save: $('#view-save'),
        browse: $('#view-browse'),
        dashboard: $('#view-dashboard')
    };

    const navBtns = $$('.nav-btn');
    const saveForm = $('#save-form');
    const inputUrl = $('#input-url');
    const inputTitle = $('#input-title');
    const inputNote = $('#input-note');
    const detectedType = $('#detected-type');
    const tagSelector = $('#tag-selector');
    const btnSave = $('#btn-save');
    const searchInput = $('#search-input');
    const filterBar = $('#filter-bar');
    const cardList = $('#card-list');
    const emptyState = $('#empty-state');
    const recentList = $('#recent-list');
    const dashboardEmpty = $('#dashboard-empty');
    const saveSuccess = $('#save-success');
    const toast = $('#toast');
    const modalDelete = $('#modal-delete');
    const btnCancelDelete = $('#btn-cancel-delete');
    const btnConfirmDelete = $('#btn-confirm-delete');

    // ---- State ----
    let selectedTags = [];
    let activeFilter = 'all';
    let deleteTargetId = null;

    // ---- Type Detection ----
    const TYPE_RULES = [
        { type: 'paper', label: '📄 Research Paper', patterns: ['arxiv.org', 'doi.org', 'scholar.google', 'semanticscholar', 'pubmed', 'researchgate', 'ieee.org', 'acm.org', 'springer.com', 'nature.com', 'science.org', 'biorxiv.org', 'medrxiv.org', 'ssrn.com', 'openreview.net'] },
        { type: 'github', label: '💻 GitHub Repo', patterns: ['github.com', 'gitlab.com', 'bitbucket.org', 'gist.github'] },
        { type: 'tweet', label: '🐦 Tweet / X Post', patterns: ['twitter.com', 'x.com', 't.co'] },
        { type: 'video', label: '🎥 Video', patterns: ['youtube.com', 'youtu.be', 'vimeo.com', 'twitch.tv', 'tiktok.com'] },
        { type: 'article', label: '📰 Article', patterns: ['medium.com', 'substack.com', 'dev.to', 'hackernews', 'news.ycombinator', 'techcrunch', 'theverge', 'wired.com', 'arstechnica'] }
    ];

    function detectType(url) {
        if (!url) return null;
        const lower = url.toLowerCase();
        for (const rule of TYPE_RULES) {
            if (rule.patterns.some((p) => lower.includes(p))) {
                return rule;
            }
        }
        return { type: 'other', label: '🔖 Link' };
    }

    // ---- Navigation ----
    function switchView(viewId) {
        // Hide all views
        Object.values(views).forEach((v) => v.classList.remove('active'));
        navBtns.forEach((btn) => btn.classList.remove('active'));

        // Show selected
        const targetView = $(`#${viewId}`);
        if (targetView) targetView.classList.add('active');

        const targetBtn = $(`.nav-btn[data-view="${viewId}"]`);
        if (targetBtn) targetBtn.classList.add('active');

        // Refresh data when switching views
        if (viewId === 'view-browse') {
            loadBrowseView();
        } else if (viewId === 'view-dashboard') {
            loadDashboard();
        }
    }

    navBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            switchView(btn.dataset.view);
        });
    });

    // ---- URL Input — Auto-detect Type ----
    let detectTimeout;
    inputUrl.addEventListener('input', () => {
        clearTimeout(detectTimeout);
        detectTimeout = setTimeout(() => {
            const result = detectType(inputUrl.value);
            if (result && inputUrl.value.trim()) {
                detectedType.innerHTML = `<span class="detected-type detected-type--${result.type}">${result.label}</span>`;

                // Auto-select matching tag
                autoSelectTag(result.type);
            } else {
                detectedType.innerHTML = '';
            }
        }, 300);
    });

    // ---- Tag Selector ----
    function autoSelectTag(type) {
        // Clear previous selection
        selectedTags = [];
        $$('.tag-chip').forEach((chip) => chip.classList.remove('selected'));

        // Select matching tag
        const matchingChip = $(`.tag-chip[data-tag="${type}"]`);
        if (matchingChip) {
            matchingChip.classList.add('selected');
            selectedTags = [type];
        }
    }

    tagSelector.addEventListener('click', (e) => {
        const chip = e.target.closest('.tag-chip');
        if (!chip) return;

        const tag = chip.dataset.tag;
        chip.classList.toggle('selected');

        if (chip.classList.contains('selected')) {
            if (!selectedTags.includes(tag)) selectedTags.push(tag);
        } else {
            selectedTags = selectedTags.filter((t) => t !== tag);
        }
    });

    // ---- Save Form ----
    saveForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const url = inputUrl.value.trim();
        if (!url) return;

        const detected = detectType(url);
        const type = detected ? detected.type : 'other';

        const item = {
            url,
            title: inputTitle.value.trim() || extractTitleFromUrl(url),
            note: inputNote.value.trim(),
            tags: selectedTags.length > 0 ? [...selectedTags] : [type],
            type
        };

        try {
            btnSave.disabled = true;
            btnSave.textContent = 'Saving...';

            await QuickSaveDB.add(item);

            // Show success animation
            showSaveSuccess();

            // Reset form
            saveForm.reset();
            detectedType.innerHTML = '';
            selectedTags = [];
            $$('.tag-chip').forEach((chip) => chip.classList.remove('selected'));
        } catch (err) {
            showToast('❌ Failed to save. Try again.');
            console.error('Save error:', err);
        } finally {
            btnSave.disabled = false;
            btnSave.innerHTML = '<span>💾</span> Save It';
        }
    });

    function extractTitleFromUrl(url) {
        try {
            const u = new URL(url);
            // Clean up hostname for a readable title
            let title = u.hostname.replace('www.', '');
            if (u.pathname && u.pathname !== '/') {
                title += u.pathname.substring(0, 60);
            }
            return title;
        } catch {
            return url.substring(0, 60);
        }
    }

    // ---- Save Success Animation ----
    function showSaveSuccess() {
        saveSuccess.classList.add('show');
        setTimeout(() => {
            saveSuccess.classList.remove('show');
        }, 1300);
    }

    // ---- Toast ----
    function showToast(message) {
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 2500);
    }

    // ---- Browse View ----
    async function loadBrowseView() {
        try {
            let items;
            const query = searchInput.value.trim();

            if (query) {
                items = await QuickSaveDB.search(query);
            } else if (activeFilter !== 'all') {
                items = await QuickSaveDB.getByType(activeFilter);
            } else {
                items = await QuickSaveDB.getAll();
            }

            renderCards(items, cardList);

            // Show/hide empty state
            if (items.length === 0) {
                emptyState.style.display = 'flex';
                cardList.style.display = 'none';
            } else {
                emptyState.style.display = 'none';
                cardList.style.display = 'flex';
            }
        } catch (err) {
            console.error('Load browse error:', err);
        }
    }

    // Search input
    let searchTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(loadBrowseView, 300);
    });

    // Filter chips
    filterBar.addEventListener('click', (e) => {
        const chip = e.target.closest('.filter-chip');
        if (!chip) return;

        $$('.filter-chip').forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        activeFilter = chip.dataset.filter;
        loadBrowseView();
    });

    // ---- Render Cards ----
    function renderCards(items, container) {
        container.innerHTML = items.map((item) => `
      <div class="card" data-id="${item.id}">
        <div class="card__header">
          <div class="card__title">
            <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">
              ${escapeHtml(item.title || item.url)}
            </a>
          </div>
          <button class="card__delete" data-id="${item.id}" aria-label="Delete save" title="Delete">
            🗑️
          </button>
        </div>
        <div class="card__url">${escapeHtml(truncate(item.url, 80))}</div>
        ${item.note ? `<div class="card__note">${escapeHtml(item.note)}</div>` : ''}
        <div class="card__footer">
          <div class="card__tags">
            ${item.tags.map((tag) => `<span class="card__tag card__tag--${tag}">${tagLabel(tag)}</span>`).join('')}
          </div>
          <div class="card__date">${formatDate(item.createdAt)}</div>
        </div>
      </div>
    `).join('');

        // Attach delete handlers
        container.querySelectorAll('.card__delete').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteTargetId = parseInt(btn.dataset.id);
                modalDelete.classList.add('show');
            });
        });
    }

    // ---- Delete Modal ----
    btnCancelDelete.addEventListener('click', () => {
        modalDelete.classList.remove('show');
        deleteTargetId = null;
    });

    btnConfirmDelete.addEventListener('click', async () => {
        if (deleteTargetId !== null) {
            try {
                await QuickSaveDB.remove(deleteTargetId);
                modalDelete.classList.remove('show');
                showToast('🗑️ Deleted!');
                deleteTargetId = null;

                // Refresh current view
                loadBrowseView();
                loadDashboard();
            } catch (err) {
                showToast('❌ Delete failed.');
                console.error('Delete error:', err);
            }
        }
    });

    // Close modal on overlay click
    modalDelete.addEventListener('click', (e) => {
        if (e.target === modalDelete) {
            modalDelete.classList.remove('show');
            deleteTargetId = null;
        }
    });

    // ---- Dashboard ----
    async function loadDashboard() {
        try {
            const stats = await QuickSaveDB.getStats();

            $('#stat-total').textContent = stats.total;
            $('#stat-papers').textContent = stats.paper;
            $('#stat-github').textContent = stats.github;
            $('#stat-tweets').textContent = stats.tweet;
            $('#stat-articles').textContent = stats.article;
            $('#stat-videos').textContent = stats.video;

            // Animate numbers
            animateStats();

            // Recent saves (last 5)
            const all = await QuickSaveDB.getAll();
            const recent = all.slice(0, 5);

            if (recent.length > 0) {
                dashboardEmpty.style.display = 'none';
                recentList.style.display = 'flex';
                renderCards(recent, recentList);
            } else {
                dashboardEmpty.style.display = 'flex';
                recentList.style.display = 'none';
            }
        } catch (err) {
            console.error('Dashboard error:', err);
        }
    }

    function animateStats() {
        $$('.stat-card__number').forEach((el) => {
            const target = parseInt(el.textContent) || 0;
            if (target === 0) return;

            let current = 0;
            const step = Math.max(1, Math.ceil(target / 20));
            const interval = setInterval(() => {
                current += step;
                if (current >= target) {
                    current = target;
                    clearInterval(interval);
                }
                el.textContent = current;
            }, 40);
        });
    }

    // ---- Helpers ----
    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function truncate(str, len) {
        if (!str) return '';
        return str.length > len ? str.substring(0, len) + '...' : str;
    }

    function tagLabel(tag) {
        const labels = {
            paper: '📄 Paper',
            github: '💻 GitHub',
            tweet: '🐦 Tweet',
            article: '📰 Article',
            video: '🎥 Video',
            other: '🔖 Other'
        };
        return labels[tag] || tag;
    }

    function formatDate(isoString) {
        if (!isoString) return '';
        const d = new Date(isoString);
        const now = new Date();
        const diffMs = now - d;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        return d.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    }

    // ---- Share Target API Handler ----
    function handleShareTarget() {
        const params = new URLSearchParams(window.location.search);
        const sharedUrl = params.get('url') || '';
        const sharedTitle = params.get('title') || '';
        const sharedText = params.get('text') || '';

        if (sharedUrl || sharedText) {
            // Try to extract URL from text (Twitter often puts the URL in text)
            let url = sharedUrl;
            if (!url && sharedText) {
                const urlMatch = sharedText.match(/https?:\/\/[^\s]+/);
                if (urlMatch) url = urlMatch[0];
            }

            if (url) {
                inputUrl.value = url;
                inputUrl.dispatchEvent(new Event('input')); // trigger type detection
            }

            if (sharedTitle) {
                inputTitle.value = sharedTitle;
            }

            // If text contains more than just the URL, put it in notes
            if (sharedText && sharedText !== url) {
                const noteText = sharedText.replace(url, '').trim();
                if (noteText) inputNote.value = noteText;
            }

            // Make sure we're on the Save view
            switchView('view-save');

            // Clean up the URL (remove query params)
            if (window.history.replaceState) {
                window.history.replaceState({}, '', window.location.pathname);
            }
        }
    }

    // ---- Register Service Worker ----
    function registerSW() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js').then(() => {
                console.log('✅ Service Worker registered');
            }).catch((err) => {
                console.warn('SW registration failed:', err);
            });
        }
    }

    // ---- Init ----
    function init() {
        registerSW();
        handleShareTarget();
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
