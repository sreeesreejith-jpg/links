/**
 * Sreejith Link Portal - Business Logic
 * Premium, Elegant, and Efficient.
 */

// --- Storage Service ---
const Storage = {
    KEY: 'sreejith_links_v2',
    async save(links) {
        if (window.Capacitor && window.Capacitor.Plugins.Preferences) {
            await window.Capacitor.Plugins.Preferences.set({
                key: this.KEY,
                value: JSON.stringify(links)
            });
        } else {
            localStorage.setItem(this.KEY, JSON.stringify(links));
        }
    },
    async load() {
        let data;
        if (window.Capacitor && window.Capacitor.Plugins.Preferences) {
            const { value } = await window.Capacitor.Plugins.Preferences.get({ key: this.KEY });
            data = value;
        } else {
            data = localStorage.getItem(this.KEY);
        }
        return data ? JSON.parse(data) : null;
    }
};

// --- State Management ---
let state = {
    links: [
        {
            id: 'initial-1',
            title: "NIFTY 50",
            url: "https://www.nseindia.com/market-data/live-equity-market?symbol=NIFTY%2050",
            category: "finance",
            icon: "trending-up"
        }
    ],
    filteredLinks: [],
    activeCategory: 'all',
    searchTerm: ''
};

// --- UI Elements ---
const linksGrid = document.getElementById('linksGrid');
const searchInput = document.getElementById('linkSearch');
const categoryBtns = document.querySelectorAll('.filter-btn');
const linkForm = document.getElementById('linkForm');
const toastEl = document.getElementById('toast');

// --- Core Functions ---

function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.add('show');
    setTimeout(() => toastEl.classList.remove('show'), 3000);
}

function showPage(pageId) {
    const pages = document.querySelectorAll('.page');
    const navBtns = document.querySelectorAll('.nav-btn');

    pages.forEach(p => p.classList.remove('active'));
    navBtns.forEach(b => b.classList.remove('active'));

    if (pageId === 'home') {
        document.getElementById('homePage').classList.add('active');
        document.getElementById('navHome').classList.add('active');
        resetForm();
    } else {
        document.getElementById('addPage').classList.add('active');
        document.getElementById('navAdd').classList.add('active');
    }
}

function resetForm() {
    linkForm.reset();
    document.getElementById('editId').value = '';
    document.getElementById('formTitle').textContent = 'Add New Resource';
    document.getElementById('formIcon').setAttribute('data-lucide', 'plus-circle');
    if (window.lucide) lucide.createIcons();
}

/**
 * Renders the links to the grid
 */
function renderLinks() {
    const term = state.searchTerm.toLowerCase();
    const category = state.activeCategory;

    state.filteredLinks = state.links.filter(link => {
        const matchesSearch = link.title.toLowerCase().includes(term) || link.url.toLowerCase().includes(term);
        const matchesCategory = category === 'all' || link.category === category;
        return matchesSearch && matchesCategory;
    });

    linksGrid.innerHTML = '';

    if (state.filteredLinks.length === 0) {
        linksGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 4rem 2rem;">
                <i data-lucide="ghost" style="width: 64px; height: 64px; color: var(--text-secondary); margin-bottom: 1rem;"></i>
                <h3 style="color: var(--text-secondary);">No links found</h3>
                <p style="color: var(--text-secondary); opacity: 0.7;">Try a different search or category.</p>
            </div>
        `;
    } else {
        state.filteredLinks.forEach((link, index) => {
            const card = document.createElement('div');
            card.className = 'link-card-wrapper';
            card.style.animation = `slideUp 0.4s ease forwards ${index * 0.05}s`;

            // Map category to icon
            const iconMap = {
                finance: 'trending-up',
                utilities: 'tool',
                work: 'briefcase',
                personal: 'user',
                social: 'share-2'
            };
            const displayIcon = link.icon || iconMap[link.category] || 'link';

            card.innerHTML = `
                <a href="${link.url}" target="_blank" class="link-card">
                    <div class="icon-box">
                        <i data-lucide="${displayIcon}"></i>
                    </div>
                    <div class="link-info">
                        <h3>${link.title}</h3>
                        <p>${link.url.replace('https://', '').replace('http://', '')}</p>
                        <span class="link-tag">${link.category}</span>
                    </div>
                </a>
                <div class="card-actions">
                    <button class="action-btn edit-btn" onclick="editLink('${link.id}')" title="Edit">
                        <i data-lucide="edit-3"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteLink('${link.id}')" title="Delete">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            `;
            linksGrid.appendChild(card);
        });
    }

    if (window.lucide) lucide.createIcons();
}

// --- Event Handlers ---

async function handleFormSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('editId').value;
    const title = document.getElementById('linkTitle').value;
    const url = document.getElementById('linkUrl').value;
    const category = document.getElementById('linkCategory').value;

    if (id) {
        // Edit existing
        const index = state.links.findIndex(l => l.id === id);
        if (index !== -1) {
            state.links[index] = { ...state.links[index], title, url, category };
            showToast('Link updated successfully');
        }
    } else {
        // Add new
        const newLink = {
            id: Date.now().toString(),
            title,
            url,
            category,
            icon: null // Will be derived from category
        };
        state.links.unshift(newLink);
        showToast('New link added to portal');
    }

    await Storage.save(state.links);
    renderLinks();
    showPage('home');
}

function editLink(id) {
    const link = state.links.find(l => l.id === id);
    if (!link) return;

    showPage('add');
    document.getElementById('editId').value = link.id;
    document.getElementById('linkTitle').value = link.title;
    document.getElementById('linkUrl').value = link.url;
    document.getElementById('linkCategory').value = link.category;

    document.getElementById('formTitle').textContent = 'Update Resource';
    document.getElementById('formIcon').setAttribute('data-lucide', 'edit');
    if (window.lucide) lucide.createIcons();
}

async function deleteLink(id) {
    if (confirm('Move this resource to trash?')) {
        state.links = state.links.filter(l => l.id !== id);
        await Storage.save(state.links);
        renderLinks();
        showToast('Resource deleted');
    }
}

// --- Search & Filter listeners ---

searchInput.addEventListener('input', (e) => {
    state.searchTerm = e.target.value;
    renderLinks();
});

categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        categoryBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.activeCategory = btn.dataset.category;
        renderLinks();
    });
});

linkForm.addEventListener('submit', handleFormSubmit);

// --- Initialization ---

document.addEventListener('DOMContentLoaded', async () => {
    const saved = await Storage.load();
    if (saved && Array.isArray(saved)) {
        state.links = saved;
    }
    renderLinks();

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            searchInput.focus();
        }
    });

    // Close app when back button pressed on Home (Capacitor)
    if (window.Capacitor) {
        window.Capacitor.Plugins.App?.addListener('backButton', () => {
            const isHomePage = document.getElementById('homePage').classList.contains('active');
            if (isHomePage) {
                window.Capacitor.Plugins.App.exitApp();
            } else {
                showPage('home');
            }
        });
    }
});
