// Capacitor Preferences for persistent storage
// We'll use a dynamic import or fallback to localStorage if Capacitor isn't ready
const dynamicStorage = {
    async set(key, value) {
        if (window.Capacitor && window.Capacitor.Plugins.Preferences) {
            await window.Capacitor.Plugins.Preferences.set({ key, value: JSON.stringify(value) });
        } else {
            localStorage.setItem(key, JSON.stringify(value));
        }
    },
    async get(key) {
        if (window.Capacitor && window.Capacitor.Plugins.Preferences) {
            const { value } = await window.Capacitor.Plugins.Preferences.get({ key });
            return value ? JSON.parse(value) : null;
        } else {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : null;
        }
    }
};

let userLinks = [
    {
        title: "NIFTY 50",
        description: "Live NSE Nifty 50 Index - Real-time market data.",
        url: "https://www.nseindia.com/market-data/live-equity-market?symbol=NIFTY%2050",
        category: "finance",
        icon: "trending-up"
    }
];

// Elements
const linksGrid = document.getElementById('linksGrid');
const searchInput = document.getElementById('linkSearch');
const filterBtns = document.querySelectorAll('.filter-btn');
const navHome = document.getElementById('navHome');
const navAdd = document.getElementById('navAdd');
const homePage = document.getElementById('homePage');
const addPage = document.getElementById('addPage');
const saveBtn = document.getElementById('saveBtn');

// Navigation Logic
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

    if (pageId === 'home') {
        homePage.classList.add('active');
        navHome.classList.add('active');
        renderLinks(userLinks);
    } else {
        addPage.classList.add('active');
        navAdd.classList.add('active');
    }
}

navHome.addEventListener('click', () => showPage('home'));
navAdd.addEventListener('click', () => showPage('add'));

// Render Logic
function renderLinks(filteredLinks) {
    linksGrid.innerHTML = '';

    if (filteredLinks.length === 0) {
        linksGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-secondary);">
                <i data-lucide="search-x" style="width: 48px; height: 48px; margin-bottom: 1rem;"></i>
                <p>No links found matching your criteria.</p>
            </div>
        `;
        if (window.lucide) lucide.createIcons();
        return;
    }

    filteredLinks.forEach((link, index) => {
        const card = document.createElement('a');
        card.href = link.url;
        card.target = "_blank";
        card.className = 'link-card';
        card.style.animationDelay = `${index * 0.05}s`;

        card.innerHTML = `
            <div class="icon-wrapper">
                <i data-lucide="${link.icon || 'link'}"></i>
            </div>
            <h3>${link.title}</h3>
            <p>${link.description || link.url}</p>
            <div class="link-meta">
                <span>${link.category.toUpperCase()}</span>
                <i data-lucide="external-link" style="width: 14px;"></i>
            </div>
        `;
        linksGrid.appendChild(card);
    });

    if (window.lucide) lucide.createIcons();
}

// Data Handling
async function saveNewLink() {
    const title = document.getElementById('linkTitle').value;
    const url = document.getElementById('linkUrl').value;
    const category = document.getElementById('linkCategory').value;

    if (!title || !url) {
        alert("Please enter both title and URL");
        return;
    }

    const newLink = {
        title,
        url,
        category,
        description: url,
        icon: category === 'finance' ? 'trending-up' : 'link'
    };

    userLinks.push(newLink);
    await dynamicStorage.set('nexus_links', userLinks);

    // Clear form and go home
    document.getElementById('linkTitle').value = '';
    document.getElementById('linkUrl').value = '';

    showPage('home');
}

saveBtn.addEventListener('click', saveNewLink);

// Search & Filter
function handleSearchAndFilter() {
    const searchTerm = searchInput.value.toLowerCase();
    const activeCategory = document.querySelector('.filter-btn.active').dataset.category;

    const filtered = userLinks.filter(link => {
        const matchesSearch = link.title.toLowerCase().includes(searchTerm) ||
            link.url.toLowerCase().includes(searchTerm);
        const matchesCategory = activeCategory === 'all' || link.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    renderLinks(filtered);
}

searchInput.addEventListener('input', handleSearchAndFilter);
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        handleSearchAndFilter();
    });
});

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
    const saved = await dynamicStorage.get('nexus_links');
    if (saved && saved.length > 0) {
        userLinks = saved;
    }
    renderLinks(userLinks);
});
