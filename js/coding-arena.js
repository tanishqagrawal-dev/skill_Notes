import { supabase } from './supabase-config.js';
import { codingProblems } from './data/coding-problems.js';
window.caCodingProblems = codingProblems;

window.caLoadingHTML = `
<div style="padding: 6rem 2rem; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 50vh; position: relative; animation: fadeIn 0.4s ease;">
    <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: radial-gradient(circle at center, rgba(123, 97, 255, 0.08) 0%, transparent 60%); pointer-events: none;"></div>
    
    <div style="position: relative; width: 110px; height: 110px; margin-bottom: 2.5rem;">
        <div style="position: absolute; inset: 0; border-radius: 50%; border: 2px solid rgba(123, 97, 255, 0.1); border-top-color: #7b61ff; border-bottom-color: #00d2ff; animation: caSpin 1.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite; box-shadow: 0 0 30px rgba(123, 97, 255, 0.2);"></div>
        <div style="position: absolute; inset: 15px; border-radius: 50%; border: 2px dashed rgba(0, 210, 255, 0.3); animation: caSpin 2.5s linear infinite reverse;"></div>
        <div style="position: absolute; inset: 32px; background: linear-gradient(135deg, #7b61ff, #00d2ff); border-radius: 50%; animation: caPulse 1.5s ease-in-out infinite alternate; box-shadow: 0 0 20px rgba(0, 210, 255, 0.4); display: flex; align-items: center; justify-content: center;">
            <i class="fa-solid fa-code" style="color: white; font-size: 20px;"></i>
        </div>
    </div>
    
    <h2 style="font-family: 'Outfit', sans-serif; font-size: 2rem; font-weight: 700; margin: 0; background: linear-gradient(135deg, #fff 30%, rgba(255,255,255,0.4)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: 3px; text-transform: uppercase;">Initializing Arena</h2>
    
    <div style="display: flex; gap: 8px; margin-top: 1.5rem; align-items: center;">
        <span style="width: 8px; height: 8px; border-radius: 50%; background: #7b61ff; animation: caBlink 1.4s infinite 0.0s;"></span>
        <span style="width: 8px; height: 8px; border-radius: 50%; background: #00d2ff; animation: caBlink 1.4s infinite 0.2s;"></span>
        <span style="width: 8px; height: 8px; border-radius: 50%; background: #7b61ff; animation: caBlink 1.4s infinite 0.4s;"></span>
    </div>
    
    <p style="margin-top: 2rem; color: rgba(255,255,255,0.4); font-size: 0.85rem; letter-spacing: 2px; font-family: 'SFMono-Regular', Consolas, monospace;">LOADING VIRTUAL ENVIRONMENT <span class="ca-ellipsis-anim"></span></p>

    <style>
        @keyframes caSpin { 100% { transform: rotate(360deg); } }
        @keyframes caPulse { 0% { transform: scale(0.9); opacity: 0.8; } 100% { transform: scale(1.1); opacity: 1; box-shadow: 0 0 30px rgba(0,210,255,0.6); } }
        @keyframes caBlink { 0%, 100% { opacity: 0.2; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); box-shadow: 0 0 10px currentColor; } }
        .ca-ellipsis-anim::after { content: ''; animation: caEllipsis 1.5s infinite steps(4, end); }
        @keyframes caEllipsis { 0% { content: ''; } 25% { content: '.'; } 50% { content: '..'; } 75% { content: '...'; } 100% { content: '...'; } }
    </style>
</div>
`;

// --- LEETCODE & GFG ENRICHMENT ---
const CA_CATEGORIES = ["Arrays & Hashing", "Two Pointers", "Sliding Window", "Stack & Queue", "Binary Search", "Linked List", "Trees & Graphs", "Dynamic Programming", "Greedy & Math", "Bit Manipulation", "String Algorithms", "Heaps & Priority Queue", "Trie & Prefix Tree", "Backtracking & Recursion", "Advanced Graphs & Union-Find"];
const CA_COMPANIES = ["Google", "Amazon", "Microsoft", "Meta", "Apple", "Netflix", "Uber", "Adobe", "Bloomberg", "Goldman Sachs", "Flipkart", "Salesforce", "ByteDance", "Atlassian", "Oracle", "Cisco", "Paytm", "Zomato", "Swiggy", "LinkedIn", "Stripe", "Airbnb", "Spotify", "PayPal"];
const CA_TOPIC_ICONS = {
    "Arrays & Hashing": "fa-layer-group",
    "Two Pointers": "fa-hand-pointer",
    "Sliding Window": "fa-table-columns",
    "Stack & Queue": "fa-bars-staggered",
    "Binary Search": "fa-magnifying-glass-chart",
    "Linked List": "fa-link",
    "Trees & Graphs": "fa-diagram-project",
    "Dynamic Programming": "fa-brain",
    "Greedy & Math": "fa-calculator",
    "Bit Manipulation": "fa-microchip",
    "String Algorithms": "fa-font",
    "Heaps & Priority Queue": "fa-sort-amount-up",
    "Trie & Prefix Tree": "fa-folder-tree",
    "Backtracking & Recursion": "fa-arrow-rotate-left",
    "Advanced Graphs & Union-Find": "fa-project-diagram"
};

const COMPANY_DOMAINS = {
    "Google": "google.com",
    "Amazon": "amazon.com",
    "Microsoft": "microsoft.com",
    "Meta": "meta.com",
    "Apple": "apple.com",
    "Netflix": "netflix.com",
    "Uber": "uber.com",
    "Adobe": "adobe.com",
    "Bloomberg": "bloomberg.com",
    "Goldman Sachs": "goldmansachs.com",
    "Flipkart": "flipkart.com",
    "Salesforce": "salesforce.com",
    "ByteDance": "bytedance.com",
    "Atlassian": "atlassian.com",
    "Oracle": "oracle.com",
    "Cisco": "cisco.com",
    "Paytm": "paytm.com",
    "Zomato": "zomato.com",
    "Swiggy": "swiggy.com",
    "LinkedIn": "linkedin.com",
    "Stripe": "stripe.com",
    "Airbnb": "airbnb.com",
    "Spotify": "spotify.com",
    "PayPal": "paypal.com"
};

const COMPANY_LOGOS = {
    "Google": { icon: "fa-brands fa-google", color: "#4285F4", bg: "rgba(66, 133, 244, 0.15)", border: "rgba(66, 133, 244, 0.4)" },
    "Amazon": { icon: "fa-brands fa-amazon", color: "#FF9900", bg: "rgba(255, 153, 0, 0.15)", border: "rgba(255, 153, 0, 0.4)" },
    "Microsoft": { icon: "fa-brands fa-microsoft", color: "#00A4EF", bg: "rgba(0, 164, 239, 0.15)", border: "rgba(0, 164, 239, 0.4)" },
    "Meta": { icon: "fa-brands fa-meta", color: "#0064E0", bg: "rgba(0, 100, 224, 0.15)", border: "rgba(0, 100, 224, 0.4)" },
    "Apple": { icon: "fa-brands fa-apple", color: "#E2E8F0", bg: "rgba(226, 232, 240, 0.12)", border: "rgba(226, 232, 240, 0.3)" },
    "Netflix": { icon: "fa-solid fa-n", color: "#E50914", bg: "rgba(229, 9, 20, 0.15)", border: "rgba(229, 9, 20, 0.4)" },
    "Uber": { icon: "fa-brands fa-uber", color: "#FFFFFF", bg: "rgba(255, 255, 255, 0.15)", border: "rgba(255, 255, 255, 0.3)" },
    "Adobe": { icon: "fa-solid fa-a", color: "#FF0000", bg: "rgba(255, 0, 0, 0.15)", border: "rgba(255, 0, 0, 0.4)" },
    "Bloomberg": { icon: "fa-solid fa-chart-line", color: "#60A5FA", bg: "rgba(59, 130, 246, 0.15)", border: "rgba(59, 130, 246, 0.4)" },
    "Goldman Sachs": { icon: "fa-solid fa-vault", color: "#93C5FD", bg: "rgba(147, 197, 253, 0.15)", border: "rgba(147, 197, 253, 0.4)" },
    "Flipkart": { icon: "fa-solid fa-bag-shopping", color: "#FDE047", bg: "rgba(234, 179, 8, 0.15)", border: "rgba(234, 179, 8, 0.4)" },
    "Salesforce": { icon: "fa-brands fa-salesforce", color: "#00A1E0", bg: "rgba(0, 161, 224, 0.15)", border: "rgba(0, 161, 224, 0.4)" },
    "ByteDance": { icon: "fa-brands fa-tiktok", color: "#00f2fe", bg: "rgba(0, 242, 254, 0.15)", border: "rgba(0, 242, 254, 0.4)" },
    "Atlassian": { icon: "fa-brands fa-atlassian", color: "#0052CC", bg: "rgba(0, 82, 204, 0.15)", border: "rgba(0, 82, 204, 0.4)" },
    "Oracle": { icon: "fa-solid fa-database", color: "#F87171", bg: "rgba(248, 113, 113, 0.15)", border: "rgba(248, 113, 113, 0.4)" },
    "Cisco": { icon: "fa-solid fa-network-wired", color: "#38BDF8", bg: "rgba(56, 189, 248, 0.15)", border: "rgba(56, 189, 248, 0.4)" },
    "Paytm": { icon: "fa-solid fa-wallet", color: "#00B9F1", bg: "rgba(0, 185, 241, 0.15)", border: "rgba(0, 185, 241, 0.4)" },
    "Zomato": { icon: "fa-solid fa-utensils", color: "#F43F5E", bg: "rgba(244, 63, 94, 0.15)", border: "rgba(244, 63, 94, 0.4)" },
    "Swiggy": { icon: "fa-solid fa-motorcycle", color: "#FB923C", bg: "rgba(251, 146, 60, 0.15)", border: "rgba(251, 146, 60, 0.4)" },
    "LinkedIn": { icon: "fa-brands fa-linkedin", color: "#0A66C2", bg: "rgba(10, 102, 194, 0.15)", border: "rgba(10, 102, 194, 0.4)" },
    "Stripe": { icon: "fa-brands fa-stripe", color: "#818CF8", bg: "rgba(129, 140, 248, 0.15)", border: "rgba(129, 140, 248, 0.4)" },
    "Airbnb": { icon: "fa-brands fa-airbnb", color: "#FB7185", bg: "rgba(251, 113, 133, 0.15)", border: "rgba(251, 113, 133, 0.4)" },
    "Spotify": { icon: "fa-brands fa-spotify", color: "#4ADE80", bg: "rgba(74, 222, 128, 0.15)", border: "rgba(74, 222, 128, 0.4)" },
    "PayPal": { icon: "fa-brands fa-paypal", color: "#60A5FA", bg: "rgba(96, 165, 250, 0.15)", border: "rgba(96, 165, 250, 0.4)" }
};

window.getCaCompanyLogoHtml = function(c, size = 16, isBadge = false) {
    const domain = COMPANY_DOMAINS[c] || (c.toLowerCase().replace(/[^a-z0-9]/g, '') + ".com");
    const logoMeta = COMPANY_LOGOS[c] || { icon: "fa-solid fa-building", color: "#60a5fa" };
    const fallbackIconHtml = `<i class='${logoMeta.icon}' style='color: ${logoMeta.color}; font-size: ${size}px; display: inline-flex; align-items: center; justify-content: center; width: ${size}px; height: ${size}px; flex-shrink: 0;'></i>`;
    const imgHtml = `<img src="https://logo.clearbit.com/${domain}" onerror="this.onerror=null; this.src='https://www.google.com/s2/favicons?domain=${domain}&sz=64'; this.onerror=function(){ this.outerHTML = \`${fallbackIconHtml}\`; };" style="width: ${size}px; height: ${size}px; object-fit: contain; border-radius: 2px; flex-shrink: 0;">`;
    if (isBadge) {
        return `<span style="background: rgba(255,255,255,0.08); color: #fff; border: 1px solid rgba(255,255,255,0.15); padding: 4px 12px; border-radius: 100px; font-size: 0.78rem; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;">${imgHtml}<span>${c}</span></span>`;
    }
    return imgHtml;
};

codingProblems.forEach((p, index) => {
    if (!p.category) {
        p.category = CA_CATEGORIES[index % CA_CATEGORIES.length];
    }
    if (!p.companies || p.companies.length === 0) {
        const c1 = CA_COMPANIES[(index * 3) % CA_COMPANIES.length];
        const c2 = CA_COMPANIES[(index * 7 + 2) % CA_COMPANIES.length];
        p.companies = [c1, c2];
    }
});

window.caFilterTab = window.caFilterTab || 'practice';
window.caFilterCategory = window.caFilterCategory || 'All';
window.caFilterCompany = window.caFilterCompany || 'All';
window.caFilterDifficulty = window.caFilterDifficulty || 'All';
window.caFilterStatus = window.caFilterStatus || 'All';
window.caSearchQuery = window.caSearchQuery || '';
window.caPage = window.caPage || 1;
window.caPerPage = window.caPerPage || 1800;
window.caSortBy = window.caSortBy || 'Newest';
window.caBookmarks = JSON.parse(localStorage.getItem('ca_bookmarks') || '[]');

window.setCaFilterTab = function(tab) {
    window.caFilterTab = tab;
    window.caPage = 1;
    if (window.renderTabContent) window.renderTabContent('coding-arena');
};
window.setCaFilterCategory = function(cat) {
    window.caFilterCategory = cat;
    window.caSortBy = 'Newest';
    window.caFilterTab = 'practice';
    window.caPage = 1;
    if (window.renderTabContent) window.renderTabContent('coding-arena');
};
window.setCaFilterCompany = function(comp) {
    window.caFilterCompany = comp;
    window.caSortBy = 'Newest';
    window.caFilterTab = 'practice';
    window.caPage = 1;
    if (window.renderTabContent) window.renderTabContent('coding-arena');
};
window.setCaFilterDifficulty = function(diff) {
    window.caFilterDifficulty = diff;
    window.caPage = 1;
    if (window.renderTabContent) window.renderTabContent('coding-arena');
};
window.setCaFilterStatus = function(status) {
    window.caFilterStatus = status;
    window.caPage = 1;
    if (window.renderTabContent) window.renderTabContent('coding-arena');
};
window.setCaSortBy = function(sort) {
    window.caSortBy = sort;
    window.caPage = 1;
    const tbody = document.getElementById('ca-problems-table-body');
    if (tbody && window.getCaProblemsTableHTML) tbody.innerHTML = window.getCaProblemsTableHTML();
};
window.setCaPage = function(page) {
    window.caPage = page;
    const tbody = document.getElementById('ca-problems-table-body');
    if (tbody && window.getCaProblemsTableHTML) tbody.innerHTML = window.getCaProblemsTableHTML();
};
window.setCaPerPage = function(perPage) {
    window.caPerPage = parseInt(perPage, 10) || 10;
    window.caPage = 1;
    const tbody = document.getElementById('ca-problems-table-body');
    if (tbody && window.getCaProblemsTableHTML) tbody.innerHTML = window.getCaProblemsTableHTML();
};
window.caToggleBookmark = function(id, event) {
    if (event) event.stopPropagation();
    let idx = window.caBookmarks.indexOf(id);
    if (idx > -1) window.caBookmarks.splice(idx, 1);
    else window.caBookmarks.push(id);
    localStorage.setItem('ca_bookmarks', JSON.stringify(window.caBookmarks));
    try {
        const sb = window.supabase || (typeof supabase !== 'undefined' ? supabase : null);
        if (sb && window.currentUser?.id) {
            sb.from('users').update({ ca_bookmarks: JSON.stringify(window.caBookmarks) }).eq('id', window.currentUser.id).then().catch(() => {});
        }
    } catch(e) {}
    const tbody = document.getElementById('ca-problems-table-body');
    if (tbody && window.getCaProblemsTableHTML) tbody.innerHTML = window.getCaProblemsTableHTML();
};
window.caToggleBookmarkFilter = function() {
    window.caFilterStatus = window.caFilterStatus === 'Bookmarked' ? 'All' : 'Bookmarked';
    window.caPage = 1;
    if (window.renderTabContent) window.renderTabContent('coding-arena');
};
window.resetCaFilters = function() {
    window.caFilterCategory = 'All';
    window.caFilterCompany = 'All';
    window.caFilterDifficulty = 'All';
    window.caFilterStatus = 'All';
    window.caSearchQuery = '';
    window.caSortBy = 'Newest';
    window.caPage = 1;
    const searchInput = document.getElementById('ca-search-input');
    if (searchInput) searchInput.value = '';
    if (window.renderTabContent) window.renderTabContent('coding-arena');
};
window.onCaSearchInput = function(val) {
    window.caSearchQuery = (val || '').toLowerCase();
    window.caPage = 1;
    const tbody = document.getElementById('ca-problems-table-body');
    if (tbody && window.getCaProblemsTableHTML) {
        tbody.innerHTML = window.getCaProblemsTableHTML();
    }
};

window.isProblemSolved = function(idx) {
    const solvedArr = window.caSolvedProblems || [];
    return solvedArr.includes(idx);
};

// Award XP without changing level or streak (used for contest XP)
window.awardCodingXP = async function(amount, reason) {
    try {
        let sb = null;
        if (typeof supabase !== 'undefined') sb = supabase;
        else if (window.supabase) sb = window.supabase;
        if (sb && window.currentUser && window.currentUser.id) {
            const { data: u } = await sb.from('users').select('coding_xp').eq('id', window.currentUser.id).single();
            if (u) {
                const newXp = (u.coding_xp || 0) + amount;
                await sb.from('users').update({ coding_xp: newXp }).eq('id', window.currentUser.id);
                if (window.currentUser) window.currentUser.coding_xp = newXp;
            }
        }
        if (window.showToast) window.showToast(`+${amount} XP — ${reason}`);
        console.log(`[Contest XP] +${amount} — ${reason}`);
    } catch(e) { console.warn('awardCodingXP error', e); }
};

window.getCaProblemsTableHTML = function() {
    const currentLevel = window.caCurrentLevel || 1;
    const todayIdx = window.caTodayIdx || 0;
    const isDoneToday = window.caIsDoneToday || false;

    let filtered = codingProblems.map((p, i) => ({ ...p, originalIndex: i }));

    if (window.caFilterCategory && window.caFilterCategory !== 'All') {
        filtered = filtered.filter(p => p.category === window.caFilterCategory);
    }
    if (window.caFilterCompany && window.caFilterCompany !== 'All') {
        filtered = filtered.filter(p => (p.companies || []).includes(window.caFilterCompany));
    }
    if (window.caFilterDifficulty && window.caFilterDifficulty !== 'All') {
        filtered = filtered.filter(p => p.difficulty === window.caFilterDifficulty);
    }
    if (window.caFilterStatus && window.caFilterStatus !== 'All') {
        if (window.caFilterStatus === 'Solved') {
            filtered = filtered.filter(p => window.isProblemSolved(p.originalIndex));
        } else if (window.caFilterStatus === 'Unsolved') {
            filtered = filtered.filter(p => !window.isProblemSolved(p.originalIndex));
        } else if (window.caFilterStatus === 'Bookmarked') {
            filtered = filtered.filter(p => window.caBookmarks.includes(p.id || (p.originalIndex + 1)));
        }
    }
    if (window.caSearchQuery) {
        const q = window.caSearchQuery;
        filtered = filtered.filter(p => 
            p.title.toLowerCase().includes(q) || 
            (p.category && p.category.toLowerCase().includes(q)) || 
            (p.companies && p.companies.some(c => c.toLowerCase().includes(q))) ||
            (`#${p.id || (p.originalIndex + 1)}`).includes(q)
        );
    }

    // Sort
    if (window.caSortBy === 'Oldest') {
        filtered.reverse();
    } else if (window.caSortBy === 'DiffAsc' || window.caSortBy === 'DiffDesc') {
        const order = { 'Easy': 1, 'Medium': 2, 'Hard': 3, 'Mega Hard': 4, 'Very Hard': 4 };
        filtered.sort((a, b) => {
            const va = order[a.difficulty] || 2;
            const vb = order[b.difficulty] || 2;
            if (va !== vb) {
                return window.caSortBy === 'DiffAsc' ? va - vb : vb - va;
            }
            return (a.id || (a.originalIndex + 1)) - (b.id || (b.originalIndex + 1));
        });
    }

    const totalCount = filtered.length;
    if (totalCount === 0) {
        return `<div style="padding: 4rem 2rem; text-align: center; color: var(--text-dim); font-size: 1.05rem; background: #0d1117; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08);">
            <i class="fa-solid fa-magnifying-glass" style="font-size: 2.5rem; margin-bottom: 1rem; opacity: 0.3; color: #60a5fa;"></i><br>
            No algorithmic challenges match your selected filters.<br>
            <button onclick="window.resetCaFilters()" style="margin-top: 1.2rem; padding: 8px 20px; background: linear-gradient(90deg, #4f46e5, #3b82f6); border: none; color: #fff; border-radius: 8px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 15px rgba(79, 70, 229, 0.3);">Reset All Filters</button>
        </div>`;
    }

    const perPage = window.caPerPage || 10;
    const totalPages = Math.ceil(totalCount / perPage) || 1;
    const currentPage = Math.min(Math.max(1, window.caPage || 1), totalPages);
    window.caPage = currentPage;
    const startIdx = (currentPage - 1) * perPage;
    const pageProblems = filtered.slice(startIdx, startIdx + perPage);

    const rowsHtml = pageProblems.map(p => {
        const i = p.originalIndex;
        const isSolved = window.isProblemSolved(i);
        const isToday = i === todayIdx;
        const probId = p.id || (i + 1);
        const isBookmarked = window.caBookmarks.includes(probId);

        // Difficulty styling
        let diffBadge = '';
        if (p.difficulty === 'Easy') diffBadge = `<span style="color: #10b981; background: rgba(16, 185, 129, 0.12); padding: 3px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; border: 1px solid rgba(16, 185, 129, 0.3);">Easy</span>`;
        else if (p.difficulty === 'Medium') diffBadge = `<span style="color: #f59e0b; background: rgba(245, 158, 11, 0.12); padding: 3px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; border: 1px solid rgba(245, 158, 11, 0.3);">Medium</span>`;
        else if (p.difficulty === 'Very Hard' || p.difficulty === 'Mega Hard') diffBadge = `<span style="color: #a855f7; background: rgba(168, 85, 247, 0.12); padding: 3px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; border: 1px solid rgba(168, 85, 247, 0.3);">Very Hard</span>`;
        else diffBadge = `<span style="color: #ef4444; background: rgba(239, 68, 68, 0.12); padding: 3px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; border: 1px solid rgba(239, 68, 68, 0.3);">Hard</span>`;

        // Topics badges (up to 2)
        const topicList = (p.category ? [p.category.split('&')[0].trim()] : ['Array']);
        if (p.category && p.category.includes('&')) topicList.push(p.category.split('&')[1].trim());
        const topicsHtml = topicList.map(t => `<span style="background: rgba(255,255,255,0.06); color: #a5b4fc; padding: 3px 8px; border-radius: 4px; font-size: 0.72rem; margin-right: 4px; border: 1px solid rgba(255,255,255,0.08);">${t}</span>`).join('');

        // Companies cleanly aligned boxes with actual original logos
        // Companies cleanly aligned boxes with actual original logos
        const compList = p.companies || ["Google", "Amazon"];
        const compIconsHtml = compList.map((c) => {
            return `<div title="${c}" style="width: 26px; height: 26px; border-radius: 6px; background: #ffffff; border: 1px solid rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.4); padding: 3px; flex-shrink: 0;">${window.getCaCompanyLogoHtml(c, 18)}</div>`;
        }).join('');
        const compHtml = `<div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">${compIconsHtml}</div>`;

        // Acceptance and Frequency
        const acceptance = (45 + ((i * 7) % 40)).toFixed(1) + '%';
        const freqType = (i % 3 === 0) ? 'High' : ((i % 3 === 1) ? 'Medium' : 'Low');
        let freqBadge = '';
        if (freqType === 'High') freqBadge = `<span style="color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.4); padding: 2px 8px; border-radius: 4px; font-size: 0.72rem; font-weight: 600;">High</span>`;
        else if (freqType === 'Medium') freqBadge = `<span style="color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.4); padding: 2px 8px; border-radius: 4px; font-size: 0.72rem; font-weight: 600;">Medium</span>`;
        else freqBadge = `<span style="color: #10b981; border: 1px solid rgba(16, 185, 129, 0.4); padding: 2px 8px; border-radius: 4px; font-size: 0.72rem; font-weight: 600;">Low</span>`;

        return `
        <div onclick="window.startSpecificProblem(${i})" class="ca-table-row" style="display: grid; grid-template-columns: 44px minmax(200px, 2.5fr) 90px minmax(140px, 1.2fr) minmax(180px, 1.5fr) 100px 90px 40px; gap: 12px; padding: 14px 20px; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05); cursor: pointer; transition: background 0.2s; color: #e2e8f0;">
            <div style="font-family: monospace; color: #64748b; font-weight: 600;">${probId}</div>
            <div style="font-weight: 600; font-size: 0.95rem; color: #fff; display: flex; align-items: center; gap: 8px; overflow: hidden;">
                <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: ${isToday ? '#60a5fa' : '#f8fafc'};" title="${p.title}">${p.title}</span>
                ${isToday ? `<span title="Today's Daily Problem">🔥</span>` : ''}
                ${isSolved ? `<span style="color: #10b981; font-size: 0.8rem;" title="Solved"><i class="fa-solid fa-circle-check"></i></span>` : ''}
            </div>
            <div>${diffBadge}</div>
            <div class="ca-hide-md" style="display: flex; align-items: center; overflow: hidden;">${topicsHtml}</div>
            <div class="ca-hide-md">${compHtml}</div>
            <div class="ca-hide-md" style="color: #94a3b8; font-size: 0.85rem; font-family: monospace;">${acceptance}</div>
            <div class="ca-hide-md">${freqBadge}</div>
            <div style="text-align: right;" onclick="window.caToggleBookmark(${probId}, event)">
                <i class="${isBookmarked ? 'fa-solid fa-bookmark' : 'fa-regular fa-bookmark'}" style="color: ${isBookmarked ? '#f59e0b' : '#64748b'}; font-size: 1rem; transition: 0.2s;"></i>
            </div>
        </div>`;
    }).join('');

    const endIdx = Math.min(startIdx + perPage, totalCount);
    const paginationHtml = `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; background: rgba(22, 27, 34, 0.7); border-top: 1px solid rgba(255, 255, 255, 0.08); flex-wrap: wrap; gap: 12px; font-size: 0.85rem; color: #8c959f;">
        <div>Showing ${startIdx + 1} to ${endIdx} of ${totalCount} problems</div>
        <div style="display: flex; gap: 6px; align-items: center;">
            <button onclick="window.setCaPage(${currentPage - 1})" ${currentPage <= 1 ? 'disabled style="opacity:0.3;cursor:not-allowed;"' : 'style="cursor:pointer;"'} class="ca-page-btn">&lt;</button>
            ${Array.from({length: Math.min(5, totalPages)}, (_, k) => {
                let pNum = k + 1;
                if (totalPages > 5 && currentPage > 3) pNum = currentPage - 2 + k;
                if (pNum > totalPages) return '';
                return `<button onclick="window.setCaPage(${pNum})" class="ca-page-btn ${pNum === currentPage ? 'active' : ''}">${pNum}</button>`;
            }).join('')}
            ${totalPages > 5 && currentPage + 2 < totalPages ? `<span style="color:#64748b;padding:0 4px;">...</span><button onclick="window.setCaPage(${totalPages})" class="ca-page-btn">${totalPages}</button>` : ''}
            <button onclick="window.setCaPage(${currentPage + 1})" ${currentPage >= totalPages ? 'disabled style="opacity:0.3;cursor:not-allowed;"' : 'style="cursor:pointer;"'} class="ca-page-btn">&gt;</button>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
            <span>Problems per page:</span>
            <select onchange="window.setCaPerPage(this.value)" style="background: #0d1117; border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 4px 8px; border-radius: 6px; outline: none; font-size: 0.8rem; cursor: pointer;">
                <option value="10" ${perPage === 10 ? 'selected' : ''}>10</option>
                <option value="20" ${perPage === 20 ? 'selected' : ''}>20</option>
                <option value="50" ${perPage === 50 ? 'selected' : ''}>50</option>
                <option value="100" ${perPage === 100 ? 'selected' : ''}>100</option>
                <option value="1800" ${perPage >= 1800 ? 'selected' : ''}>All</option>
            </select>
        </div>
    </div>`;

    return `
    <div style="background: #0d1117; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.4); display: flex; flex-direction: column; flex: 1; min-height: 0; width: 100%;">
        <!-- TABLE HEADER -->
        <div style="display: grid; grid-template-columns: 44px minmax(200px, 2.5fr) 90px minmax(140px, 1.2fr) minmax(180px, 1.5fr) 100px 90px 40px; gap: 12px; padding: 12px 20px; background: rgba(22, 27, 34, 0.98); color: #8c959f; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.08); align-items: center; flex-shrink: 0;">
            <div>#</div>
            <div>Problem</div>
            <div>Difficulty</div>
            <div class="ca-hide-md">Topics</div>
            <div class="ca-hide-md">Companies</div>
            <div class="ca-hide-md">Acceptance</div>
            <div class="ca-hide-md">Frequency</div>
            <div style="text-align: right;"><i class="fa-regular fa-bookmark"></i></div>
        </div>
        <!-- TABLE ROWS -->
        <div style="display: flex; flex-direction: column; flex: 1; min-height: 0; overflow-y: auto;">
            ${rowsHtml}
        </div>
        <!-- PAGINATION FOOTER -->
        <div style="flex-shrink: 0; background: #0d1117; border-top: 1px solid rgba(255,255,255,0.08); z-index: 5;">
            ${paginationHtml}
        </div>
    </div>`;
};

let editorInstance = null;
window.caActiveProblemIndex = null; // null means Explorer mode

// Ensure CodeMirror placeholder addon is loaded
if (typeof document !== 'undefined' && !document.getElementById('cm-placeholder-addon')) {
    const s = document.createElement('script');
    s.id = 'cm-placeholder-addon';
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/addon/display/placeholder.min.js';
    document.head.appendChild(s);
}

export async function renderCodingArena() {
    if (!window.currentUser) return `<div style="padding:2rem;text-align:center;">Please login to access the Coding Arena.</div>`;

    // Mobile Lock Check
    if (window.innerWidth <= 768) {
        return `
            <div style="display:flex; justify-content:center; align-items:center; min-height:70vh; padding:1rem; position:relative;">
                <!-- Glowing Background Blobs -->
                <div style="position:absolute; top:30%; left:10%; width:100px; height:100px; background:rgba(0, 242, 255, 0.2); filter:blur(50px); border-radius:50%; pointer-events:none;"></div>
                <div style="position:absolute; bottom:30%; right:10%; width:100px; height:100px; background:rgba(123, 97, 255, 0.2); filter:blur(50px); border-radius:50%; pointer-events:none;"></div>
                
                <div style="position:relative; background: linear-gradient(145deg, rgba(15, 17, 26, 0.85) 0%, rgba(8, 9, 13, 0.95) 100%); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 28px; padding: 2.5rem 1.25rem; text-align: center; max-width: 400px; width: 100%; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 0 20px rgba(123, 97, 255, 0.05); overflow: hidden;">
                    
                    <!-- Decorative Top Accent -->
                    <div style="position:absolute; top:0; left:50%; transform:translateX(-50%); width:50%; height:3px; background:linear-gradient(90deg, transparent, #00f2ff, #7b61ff, transparent); border-radius:3px;"></div>

                    <div style="width: 76px; height: 76px; background: linear-gradient(135deg, rgba(123, 97, 255, 0.15), rgba(0, 242, 255, 0.15)); border: 1px solid rgba(255,255,255,0.1); border-radius: 50%; display: flex; justify-content: center; align-items: center; margin: 0 auto 1.5rem auto; box-shadow: 0 0 20px rgba(0, 242, 255, 0.2), inset 0 0 15px rgba(123, 97, 255, 0.2);">
                        <i class="fa-solid fa-laptop-code" style="font-size: 1.8rem; background: linear-gradient(135deg, #00f2ff, #7b61ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; filter: drop-shadow(0 0 10px rgba(0,242,255,0.4));"></i>
                    </div>
                    
                    <h2 style="font-family: 'Outfit', sans-serif; font-size: clamp(1.4rem, 6vw, 1.8rem); font-weight: 800; margin-bottom: 0.75rem; letter-spacing: -0.5px; line-height: 1.2; background: linear-gradient(135deg, #ffffff, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; word-break: break-word;">Desktop Experience</h2>
                    
                    <p style="color: rgba(255, 255, 255, 0.65); font-size: 0.95rem; line-height: 1.5; margin-bottom: 2rem; font-weight: 400; padding: 0 0.5rem;">The Coding Arena is a fully immersive IDE that requires a larger screen. Please switch to a desktop or laptop to compile and run code.</p>
                    
                    <div style="display: inline-flex; justify-content: center; align-items: center; gap: 0.4rem; padding: 0.5rem 1rem; background: linear-gradient(135deg, rgba(0, 242, 255, 0.1), rgba(123, 97, 255, 0.1)); border: 1px solid rgba(0, 242, 255, 0.3); color: #00f2ff; border-radius: 100px; font-size: 0.75rem; font-weight: 700; letter-spacing: 1px; box-shadow: 0 0 15px rgba(0, 242, 255, 0.15); text-transform: uppercase; white-space: nowrap;">
                        <i class="fa-solid fa-expand" style="font-size: 0.75rem;"></i> Optimized for Desktop
                    </div>
                </div>
            </div>
        `;
    }

    // Fetch user's current progress
    const { data: userStats } = await supabase.from('users').select('*').eq('id', window.currentUser.id).single();
    
    let currentLevel = 1;
    let xp = 0;
    let streak = 0;
    let lastDate = '';

    if (userStats) {
        currentLevel = userStats.current_coding_level || 1;
        xp = userStats.coding_xp || 0;
        streak = userStats.coding_streak || 0;
        lastDate = userStats.last_coding_date || '';
        
        // Streak check
        const todayStr = new Date().toDateString();
        if (lastDate && lastDate !== todayStr) {
            const last = new Date(lastDate);
            const today = new Date(todayStr);
            const diffTime = Math.abs(today - last);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays > 1) {
                // Streak broken
                streak = 0;
                await supabase.from('users').update({ coding_streak: 0 }).eq('id', window.currentUser.id);
            }
        }
    } else {
        // Init
        await supabase.from('users').update({ current_coding_level: 1, coding_xp: 0, coding_streak: 0, max_coding_streak: 0 }).eq('id', window.currentUser.id);
    }

    const todayStr = new Date().toDateString();
    const isDoneToday = (lastDate === todayStr);
    
    const adminEmails = ['tanishqagrawal1103@gmail.com', 'skilmatrix3@gmail.com'];
    const userEmail = (window.currentUser?.email || window.currentUser?.user_metadata?.email || '').toLowerCase();
    const isAdmin = window.currentUser?.role === 'admin' || window.currentUser?.role === 'co-admin' || adminEmails.includes(userEmail);

    const myId = window.currentUser?.id || 'me';
    let solvedArr = [];
    try {
        solvedArr = JSON.parse(localStorage.getItem('ca_solved_problems_' + myId) || '[]');
        if (userStats && userStats.ca_solved_problems) {
            const cloudSolved = typeof userStats.ca_solved_problems === 'string' ? JSON.parse(userStats.ca_solved_problems) : userStats.ca_solved_problems;
            if (Array.isArray(cloudSolved)) {
                solvedArr = Array.from(new Set([...solvedArr, ...cloudSolved]));
                localStorage.setItem('ca_solved_problems_' + myId, JSON.stringify(solvedArr));
            }
        }
        if (userStats && userStats.ca_bookmarks) {
            const cloudBookmarks = typeof userStats.ca_bookmarks === 'string' ? JSON.parse(userStats.ca_bookmarks) : userStats.ca_bookmarks;
            if (Array.isArray(cloudBookmarks)) {
                window.caBookmarks = Array.from(new Set([...(window.caBookmarks || []), ...cloudBookmarks]));
                localStorage.setItem('ca_bookmarks', JSON.stringify(window.caBookmarks));
            }
        }
    } catch(e) {}
    window.caSolvedProblems = solvedArr;

    const unsolvedIndices = codingProblems.map((_, idx) => idx).filter(idx => !solvedArr.includes(idx));
    
    const activeKey = 'ca_daily_active_' + myId;
    const lastDateKey = 'ca_daily_last_date_' + myId;
    
    let storedActive = localStorage.getItem(activeKey);
    let todayIdx = storedActive !== null ? parseInt(storedActive) : -1;
    let lastDailyDate = localStorage.getItem(lastDateKey);
    
    let needsNewDaily = false;
    if (todayIdx < 0 || todayIdx >= codingProblems.length || isNaN(todayIdx)) {
        needsNewDaily = true;
    } else if (solvedArr.includes(todayIdx) && lastDailyDate !== todayStr) {
        // Active problem is solved, and it wasn't solved today. Generate a new one.
        needsNewDaily = true;
    }
    
    if (needsNewDaily && lastDailyDate !== todayStr) {
        if (unsolvedIndices.length > 0) {
            todayIdx = unsolvedIndices[Math.floor(Math.random() * unsolvedIndices.length)];
        } else {
            todayIdx = Math.floor(Math.random() * codingProblems.length);
        }
        try { localStorage.setItem(activeKey, todayIdx.toString()); } catch(e) {}
    }
    
    window.caTodayIdx = todayIdx;

    window.exitCodingArena = function() {
        const sidebar = document.querySelector('.sidebar');
        const topBar = document.querySelector('.top-bar');
        if (sidebar) sidebar.style.display = '';
        if (topBar) topBar.style.display = '';
        const mainContent = document.querySelector('.main-content');
        if (mainContent && mainContent.dataset.origPadding !== undefined) {
            mainContent.style.padding = mainContent.dataset.origPadding;
            mainContent.style.maxWidth = '';
            mainContent.style.width = '';
            mainContent.style.overflowX = '';
        }
        if (window.renderTabContent) window.renderTabContent('overview');
        else if (window.location) window.location.reload();
    };

    if (window.caActiveProblemIndex === null) {
        // HIDE main app sidebar and top-bar in Coding Arena for full-screen immersive view
        setTimeout(() => {
            const sidebar = document.querySelector('.sidebar');
            const topBar = document.querySelector('.top-bar');
            if (sidebar) sidebar.style.display = 'none';
            if (topBar) topBar.style.display = 'none';
            
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                if (mainContent.dataset.origPadding === undefined) {
                    mainContent.dataset.origPadding = mainContent.style.padding || '';
                }
                mainContent.style.padding = '0';
                mainContent.style.maxWidth = '100%';
                mainContent.style.width = '100%';
                mainContent.style.overflowX = 'hidden';
            }
        }, 10);

        // --- Render EXPLORER ---
        window.caCurrentLevel = currentLevel;
        window.caTodayIdx = todayIdx;
        window.caIsDoneToday = isDoneToday;
        window.caIsAdmin = isAdmin;

        window.fetchCaLeaderboard = async function() {
            let lbData = [];
            try {
                let sb = null;
                if (typeof supabase !== 'undefined') sb = supabase;
                else if (window.supabase) sb = window.supabase;
                
                const { data: topCoders } = await sb.from('users')
                    .select('id, name, collegename, current_coding_level, coding_xp, coding_streak')
                    .order('coding_xp', { ascending: false })
                    .limit(50);
                if (topCoders && topCoders.length > 0) {
                    lbData = topCoders.map(u => ({
                        id: u.id,
                        name: u.name || 'Scholar',
                        college: u.collegename || '',
                        solved: Math.max(0, (u.current_coding_level || 1) - 1),
                        streak: u.coding_streak || 0,
                        xp: u.coding_xp || 0
                    }));
                }
            } catch (err) {
                console.warn('Could not fetch leaderboard from Supabase:', err);
            }
            const myId = window.currentUser?.id || 'me';
            const myName = window.currentUser?.user_metadata?.full_name || window.currentUser?.name || window.currentUser?.email?.split('@')[0] || 'You (Scholar)';
            const myCollege = window.currentUser?.user_metadata?.college || window.currentUser?.college || '';
            const mySolved = window.caSolvedProblems ? window.caSolvedProblems.length : Math.max(0, window.caCurrentLevel - 1);
            const myXp = window.currentUser?.coding_xp || (mySolved * 25);
            const myStreak = window.currentUser?.coding_streak || 0;
            if (!lbData.some(u => u.id === myId)) {
                lbData.push({ id: myId, name: myName, college: myCollege, solved: mySolved, streak: myStreak, xp: myXp, isMe: true });
            } else {
                const u = lbData.find(u => u.id === myId);
                if (u) { u.name = myName; u.solved = mySolved; u.xp = myXp; u.streak = myStreak; u.isMe = true; }
            }
            lbData.sort((a, b) => b.xp - a.xp);
            window.caLeaderboardData = lbData;
            
            const tbody = document.getElementById('ca-leaderboard-tbody');
            if (tbody && window.getCaLeaderboardHTML) {
                tbody.innerHTML = window.getCaLeaderboardHTML();
            }
        };

        if (!window.caLbSubscribed) {
            window.caLbSubscribed = true;
            try {
                let sb = null;
                if (typeof supabase !== 'undefined') sb = supabase;
                else if (window.supabase) sb = window.supabase;
                sb.channel('ca_lb_changes')
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, payload => {
                        window.fetchCaLeaderboard();
                    }).subscribe();
            } catch(e){}
        }

        await window.fetchCaLeaderboard();
        
        const lbData = window.caLeaderboardData || [];
        const myId = window.currentUser?.id || 'me';
        const myRankIdx = lbData.findIndex(u => u.isMe || u.id === myId);
        const myRank = myRankIdx >= 0 ? myRankIdx + 1 : 1;

        // Handled above

        return `
        <div class="ca-explorer-container fade-in" style="padding: 0.6rem 1rem; width: 100%; max-width: 100%; margin: 0 auto; color: #fff; height: calc(100vh - 40px); max-height: calc(100vh - 40px); overflow: hidden; display: flex; flex-direction: column; box-sizing: border-box; background: #0b0f17;">
            
            <!-- CUSTOM LEETCODE / GFG STYLES -->
            <style id="ca-leetcode-styles">
                .ca-explorer-container::-webkit-scrollbar, .ca-left-sidebar::-webkit-scrollbar, #ca-problems-table-body::-webkit-scrollbar { width: 6px; }
                .ca-explorer-container::-webkit-scrollbar-thumb, .ca-left-sidebar::-webkit-scrollbar-thumb, #ca-problems-table-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 4px; }
                
                .ca-app-layout {
                    display: flex;
                    gap: 1.2rem;
                    align-items: stretch;
                    flex: 1;
                    min-height: 0;
                    overflow: hidden;
                }
                .ca-left-sidebar {
                    width: 250px;
                    flex-shrink: 0;
                    height: 100%;
                    overflow-y: auto;
                    overflow-x: hidden;
                    background: linear-gradient(180deg, rgba(22, 27, 34, 0.95), rgba(13, 17, 23, 0.98));
                    border: 1px solid rgba(99, 102, 241, 0.25);
                    border-radius: 12px;
                    padding: 0.8rem 1rem;
                    display: flex;
                    flex-direction: column;
                    gap: 0.45rem;
                    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
                }
                .ca-main-area {
                    flex: 1;
                    min-width: 0;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    overflow-y: auto;
                    overflow-x: hidden;
                    gap: 1rem;
                }
                .ca-side-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 7px 12px;
                    border-radius: 8px;
                    color: #94a3b8;
                    font-size: 0.85rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: 1px solid transparent;
                    text-decoration: none;
                    margin-bottom: 1px;
                }
                .ca-side-item:hover {
                    color: #fff;
                    background: rgba(255,255,255,0.05);
                }
                .ca-side-item.active {
                    background: linear-gradient(90deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.1));
                    color: #60a5fa;
                    border-color: rgba(59, 130, 246, 0.3);
                    font-weight: 600;
                }
                .ca-cat-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 5px 10px;
                    color: #94a3b8;
                    font-size: 0.8rem;
                    cursor: pointer;
                    border-radius: 6px;
                    transition: 0.2s;
                }
                .ca-cat-item:hover {
                    background: rgba(255,255,255,0.04);
                    color: #fff;
                }
                .ca-stat-card {
                    background: #0d1117;
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 12px;
                    padding: 1.2rem;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    transition: transform 0.2s, border-color 0.2s;
                }
                .ca-stat-card:hover {
                    transform: translateY(-3px);
                    border-color: rgba(255,255,255,0.2);
                }
                .ca-page-btn {
                    background: #0d1117;
                    border: 1px solid rgba(255,255,255,0.12);
                    color: #fff;
                    padding: 4px 10px;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: 0.2s;
                }
                .ca-page-btn:hover:not([disabled]) {
                    border-color: #60a5fa;
                    color: #60a5fa;
                }
                .ca-page-btn.active {
                    background: #3b82f6;
                    border-color: #3b82f6;
                    color: #fff;
                    font-weight: 700;
                }
                .ca-table-row:hover {
                    background: #161b22 !important;
                }
                .ca-topic-card, .ca-comp-card {
                    background: #0d1117;
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 12px;
                    padding: 1.2rem;
                    transition: all 0.25s ease;
                    cursor: pointer;
                }
                .ca-topic-card:hover, .ca-comp-card:hover {
                    transform: translateY(-4px);
                    border-color: #60a5fa;
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
                }
                @media (max-width: 1024px) {
                    .ca-app-layout { flex-direction: column; }
                    .ca-left-sidebar { width: 100%; }
                    .ca-hide-md { display: none !important; }
                }
            </style>
            <!-- PREMIUM LEETCODE/GFG TOP NAVBAR -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; background: linear-gradient(135deg, rgba(22, 27, 34, 0.95), rgba(13, 17, 23, 0.98)); padding: 0.8rem 1.5rem; border-radius: 12px; border: 1px solid rgba(99, 102, 241, 0.25); box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5); flex-wrap: wrap; gap: 1rem;">
                <div style="display: flex; align-items: center; gap: 12px; background: rgba(0,0,0,0.4); padding: 8px 16px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); width: 340px;">
                    <div style="width: 36px; height: 36px; border-radius: 8px; background: linear-gradient(135deg, #6366f1, #3b82f6); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; color: #fff; font-weight: 800;"><i class="fa-solid fa-code"></i></div>
                    <h1 style="font-size: 1.4rem; margin: 0; color: #fff; font-weight: 800; letter-spacing: -0.5px;">Coding Arena</h1>
                </div>

                <div id="ca-search-box" style="display: flex; align-items: center; gap: 10px; background: rgba(0, 0, 0, 0.45); border: 1px solid rgba(99, 102, 241, 0.35); border-radius: 10px; padding: 8px 16px; width: 420px; max-width: 100%; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3); transition: all 0.2s;" onmouseover="this.style.borderColor='rgba(99, 102, 241, 0.7)'; this.style.boxShadow='0 0 15px rgba(99, 102, 241, 0.25)'" onmouseout="this.style.borderColor='rgba(99, 102, 241, 0.35)'; this.style.boxShadow='0 4px 15px rgba(0, 0, 0, 0.3)'">
                    <i class="fa-solid fa-magnifying-glass" style="color: #818cf8; font-size: 0.95rem;"></i>
                    <input type="text" id="ca-search-input" value="${window.caSearchQuery || ''}" placeholder="Search by title, topic, company or #id..." oninput="window.onCaSearchInput(this.value)" style="background: transparent; border: none; color: #fff; width: 100%; outline: none; font-size: 0.9rem; font-family: inherit;">
                    ${window.caSearchQuery ? `<i class="fa-solid fa-circle-xmark" onclick="window.onCaSearchInput(''); document.getElementById('ca-search-input').value='';" style="color: #94a3b8; cursor: pointer; font-size: 0.9rem;" title="Clear Search"></i>` : ''}
                    <span style="background: rgba(99, 102, 241, 0.15); color: #a5b4fc; font-size: 0.72rem; padding: 3px 8px; border-radius: 6px; border: 1px solid rgba(99, 102, 241, 0.3); font-family: monospace; font-weight: 600;">Ctrl K</span>
                </div>

                <div style="display: flex; gap: 1.2rem; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 6px; color: #f97316; font-weight: 700; font-size: 0.9rem;">
                        <i class="fa-solid fa-fire"></i>
                        <div>
                            <div style="line-height: 1;">${streak}</div>
                            <div style="font-size: 0.65rem; color: #64748b; font-weight: 500;">Day Streak</div>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px; color: #eab308; font-weight: 700; font-size: 0.9rem;">
                        <i class="fa-solid fa-trophy"></i>
                        <div>
                            <div style="line-height: 1;">${myRank}</div>
                            <div style="font-size: 0.65rem; color: #64748b; font-weight: 500;">Rank</div>
                        </div>
                    </div>
                    <button onclick="window.startSpecificProblem(-1)" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 6px 12px; border-radius: 6px; font-weight: 600; font-size: 0.8rem; cursor: pointer; display: flex; align-items: center; gap: 6px;"><i class="fa-solid fa-code"></i> Sandbox</button>
                    <button onclick="window.exitCodingArena()" style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); color: #ef4444; padding: 6px 12px; border-radius: 6px; font-weight: 600; font-size: 0.8rem; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: 0.2s;" onmouseover="this.style.background='rgba(239,68,68,0.25)'" onmouseout="this.style.background='rgba(239,68,68,0.15)'"><i class="fa-solid fa-arrow-left"></i> Exit</button>
                </div>
            </div>

            <!-- 2-COLUMN LEETCODE/GFG LAYOUT -->
            <div class="ca-app-layout">
                <!-- LEFT SIDEBAR -->
                <div class="ca-left-sidebar">
                    <div>
                        <div style="font-size: 0.7rem; color: #64748b; font-weight: 700; letter-spacing: 1px; margin-bottom: 0.8rem; text-transform: uppercase;">Practice</div>
                        <div style="display: flex; flex-direction: column; gap: 4px;">
                            <div class="ca-side-item ${window.caFilterTab === 'practice' && window.caFilterCategory === 'All' && window.caFilterCompany === 'All' && window.caFilterStatus !== 'Bookmarked' ? 'active' : ''}" onclick="window.resetCaFilters(); window.setCaFilterTab('practice');">
                                <span style="display: flex; align-items: center; gap: 10px;"><i class="fa-solid fa-list-check" style="width: 16px;"></i> All Problems</span>
                            </div>
                            <div class="ca-side-item ${window.caFilterTab === 'daily' ? 'active' : ''}" onclick="window.setCaFilterTab('daily');">
                                <span style="display: flex; align-items: center; gap: 10px;"><i class="fa-regular fa-calendar-days" style="width: 16px;"></i> Daily Problem</span>
                                <span style="background: rgba(168, 85, 247, 0.2); color: #c084fc; font-size: 0.7rem; font-weight: 700; padding: 2px 8px; border-radius: 100px; border: 1px solid rgba(168, 85, 247, 0.4);">New</span>
                            </div>
                            <div class="ca-side-item ${window.caFilterTab === 'companies' ? 'active' : ''}" onclick="window.setCaFilterTab('companies');">
                                <span style="display: flex; align-items: center; gap: 10px;"><i class="fa-regular fa-building" style="width: 16px;"></i> Company Problems</span>
                            </div>
                            <div class="ca-side-item ${window.caFilterTab === 'topics' ? 'active' : ''}" onclick="window.setCaFilterTab('topics');">
                                <span style="display: flex; align-items: center; gap: 10px;"><i class="fa-solid fa-layer-group" style="width: 16px;"></i> Topic Tags</span>
                            </div>
                            <div class="ca-side-item ${window.caFilterTab === 'contests' ? 'active' : ''}" onclick="window.setCaFilterTab('contests');">
                                <span style="display: flex; align-items: center; gap: 10px;"><i class="fa-solid fa-trophy" style="width: 16px;"></i> Contests</span>
                            </div>
                            <div class="ca-side-item ${window.caFilterStatus === 'Solved' ? 'active' : ''}" onclick="window.setCaFilterStatus('Solved'); window.setCaFilterTab('practice');">
                                <span style="display: flex; align-items: center; gap: 10px;"><i class="fa-solid fa-check-double" style="width: 16px;"></i> My Submissions</span>
                            </div>
                            <div class="ca-side-item ${window.caFilterStatus === 'Bookmarked' ? 'active' : ''}" onclick="window.caToggleBookmarkFilter();">
                                <span style="display: flex; align-items: center; gap: 10px;"><i class="fa-regular fa-bookmark" style="width: 16px;"></i> Bookmarks</span>
                            </div>
                            <div class="ca-side-item ${window.caFilterTab === 'leaderboards' ? 'active' : ''}" onclick="window.setCaFilterTab('leaderboards');">
                                <span style="display: flex; align-items: center; gap: 10px;"><i class="fa-solid fa-chart-line" style="width: 16px;"></i> Leaderboards</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <div style="font-size: 0.7rem; color: #64748b; font-weight: 700; letter-spacing: 1px; margin-bottom: 0.6rem; text-transform: uppercase; display: flex; justify-content: space-between;"><span>Categories</span><i class="fa-solid fa-chevron-down"></i></div>
                        <div style="display: flex; flex-direction: column; gap: 2px; max-height: 320px; overflow-y: auto; padding-right: 4px;">
                            ${CA_CATEGORIES.map(cat => {
                                const count = codingProblems.filter(p => p.category === cat).length;
                                return `<div class="ca-cat-item ${window.caFilterCategory === cat ? 'active' : ''}" onclick="window.setCaFilterCategory('${cat}')">
                                    <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 160px;"><i class="fa-solid ${CA_TOPIC_ICONS[cat] || 'fa-tag'}" style="margin-right: 6px; color: #60a5fa; font-size: 0.75rem;"></i>${cat.split('&')[0].trim()}</span>
                                    <span style="font-size: 0.75rem; color: #64748b; background: rgba(255,255,255,0.05); padding: 1px 6px; border-radius: 4px;">${count}</span>
                                </div>`;
                            }).join('')}
                        </div>
                        <div onclick="window.setCaFilterTab('topics')" style="color: #60a5fa; font-size: 0.8rem; font-weight: 600; cursor: pointer; margin-top: 8px; padding-left: 4px;">View All Categories &gt;</div>
                    </div>
                </div>

                <!-- RIGHT MAIN CONTENT -->
                <div class="ca-main-area">
                    ${window.caFilterTab === 'practice' ? `
                    <div style="display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: hidden; gap: 1rem;">
                        <!-- UNIFIED COMPACT FILTER BAR -->
                        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.8rem; background: #0d1117; padding: 0.7rem 1.2rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); flex-shrink: 0;">
                            <!-- Left Status & Difficulty Pills -->
                            <div style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center;">
                                <div style="display: flex; gap: 4px; background: rgba(255,255,255,0.03); padding: 3px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06);">
                                    <button onclick="window.setCaFilterStatus('All')" style="padding: 5px 12px; border-radius: 6px; border: none; font-size: 0.8rem; font-weight: 600; cursor: pointer; background: ${window.caFilterStatus === 'All' ? '#1e293b' : 'transparent'}; color: ${window.caFilterStatus === 'All' ? '#60a5fa' : '#94a3b8'}; transition: 0.2s;">All</button>
                                    <button onclick="window.setCaFilterStatus('Solved')" style="padding: 5px 12px; border-radius: 6px; border: none; font-size: 0.8rem; font-weight: 500; cursor: pointer; background: ${window.caFilterStatus === 'Solved' ? '#1e293b' : 'transparent'}; color: ${window.caFilterStatus === 'Solved' ? '#10b981' : '#94a3b8'}; display: flex; align-items: center; gap: 4px; transition: 0.2s;"><i class="fa-regular fa-circle-check"></i> Solved</button>
                                    <button onclick="window.setCaFilterStatus('Unsolved')" style="padding: 5px 12px; border-radius: 6px; border: none; font-size: 0.8rem; font-weight: 500; cursor: pointer; background: ${window.caFilterStatus === 'Unsolved' ? '#1e293b' : 'transparent'}; color: ${window.caFilterStatus === 'Unsolved' ? '#fff' : '#94a3b8'}; display: flex; align-items: center; gap: 4px; transition: 0.2s;"><i class="fa-regular fa-square"></i> Unsolved</button>
                                    <button onclick="window.caToggleBookmarkFilter()" style="padding: 5px 12px; border-radius: 6px; border: none; font-size: 0.8rem; font-weight: 500; cursor: pointer; background: ${window.caFilterStatus === 'Bookmarked' ? '#1e293b' : 'transparent'}; color: ${window.caFilterStatus === 'Bookmarked' ? '#f59e0b' : '#94a3b8'}; display: flex; align-items: center; gap: 4px; transition: 0.2s;"><i class="fa-regular fa-bookmark"></i> Bookmarks</button>
                                </div>
                            </div>
                            <!-- Right Dropdowns & Sort -->
                            <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
                                <select onchange="window.setCaFilterDifficulty(this.value)" style="background: #161b22; border: 1px solid rgba(255,255,255,0.12); color: #e2e8f0; padding: 5px 10px; border-radius: 6px; font-size: 0.8rem; outline: none; cursor: pointer; max-width: 140px;">
                                    <option value="All" ${window.caFilterDifficulty === 'All' ? 'selected' : ''}>All Difficulties</option>
                                    <option value="Easy" ${window.caFilterDifficulty === 'Easy' ? 'selected' : ''} style="color: #10b981;">Easy</option>
                                    <option value="Medium" ${window.caFilterDifficulty === 'Medium' ? 'selected' : ''} style="color: #f59e0b;">Medium</option>
                                    <option value="Hard" ${window.caFilterDifficulty === 'Hard' ? 'selected' : ''} style="color: #ef4444;">Hard</option>
                                    <option value="Very Hard" ${window.caFilterDifficulty === 'Very Hard' || window.caFilterDifficulty === 'Mega Hard' ? 'selected' : ''} style="color: #c084fc;">Very Hard</option>
                                </select>
                                <select onchange="window.setCaFilterCategory(this.value)" style="background: #161b22; border: 1px solid rgba(255,255,255,0.12); color: #e2e8f0; padding: 5px 10px; border-radius: 6px; font-size: 0.8rem; outline: none; cursor: pointer; max-width: 140px;">
                                    <option value="All">All Topics</option>
                                    ${CA_CATEGORIES.map(c => `<option value="${c}" ${window.caFilterCategory === c ? 'selected' : ''}>${c.split('&')[0].trim()}</option>`).join('')}
                                </select>
                                <select onchange="window.setCaFilterCompany(this.value)" style="background: #161b22; border: 1px solid rgba(255,255,255,0.12); color: #e2e8f0; padding: 5px 10px; border-radius: 6px; font-size: 0.8rem; outline: none; cursor: pointer; max-width: 140px;">
                                    <option value="All">All Companies</option>
                                    ${CA_COMPANIES.map(comp => `<option value="${comp}" ${window.caFilterCompany === comp ? 'selected' : ''}>${comp}</option>`).join('')}
                                </select>
                                <select onchange="window.setCaSortBy(this.value)" style="background: #161b22; border: 1px solid rgba(255,255,255,0.12); color: #fff; padding: 5px 10px; border-radius: 6px; font-size: 0.8rem; outline: none; cursor: pointer;">
                                    <option value="DiffAsc" ${window.caSortBy === 'DiffAsc' ? 'selected' : ''}>Diff (Easy ➔ Hard)</option>
                                    <option value="Newest" ${window.caSortBy === 'Newest' ? 'selected' : ''}>Problem ID (Asc)</option>
                                    <option value="Oldest" ${window.caSortBy === 'Oldest' ? 'selected' : ''}>Problem ID (Desc)</option>
                                    <option value="DiffDesc" ${window.caSortBy === 'DiffDesc' ? 'selected' : ''}>Diff (Hard ➔ Easy)</option>
                                </select>
                                ${(window.caFilterCategory !== 'All' || window.caFilterCompany !== 'All' || window.caFilterDifficulty !== 'All' || window.caFilterStatus !== 'All' || window.caSearchQuery) ? `
                                <button onclick="window.resetCaFilters()" style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); color: #ef4444; padding: 5px 10px; border-radius: 6px; font-size: 0.8rem; cursor: pointer;"><i class="fa-solid fa-rotate-left"></i></button>
                                ` : ''}
                            </div>
                        </div>

                        <!-- TABLE AREA -->
                        <div id="ca-problems-table-body" style="flex: 1; min-height: 0; display: flex; flex-direction: column; overflow: hidden;">
                            ${window.getCaProblemsTableHTML()}
                        </div>
                    </div>
                    ` : ''}

                    <!-- TAB CONTENT: DAILY CHALLENGE -->
                    ${window.caFilterTab === 'daily' ? (() => {
                        const tp = codingProblems[todayIdx] || codingProblems[0];
                        let tpDiffColor = '#10b981', tpDiffBg = 'rgba(16,185,129,0.12)', tpDiffBorder = 'rgba(16,185,129,0.3)', tpDiffLabel = 'Easy';
                        if (tp.difficulty === 'Medium') { tpDiffColor = '#f59e0b'; tpDiffBg = 'rgba(245,158,11,0.12)'; tpDiffBorder = 'rgba(245,158,11,0.3)'; tpDiffLabel = 'Medium'; }
                        else if (tp.difficulty === 'Hard') { tpDiffColor = '#ef4444'; tpDiffBg = 'rgba(239,68,68,0.12)'; tpDiffBorder = 'rgba(239,68,68,0.3)'; tpDiffLabel = 'Hard'; }
                        else if (tp.difficulty === 'Very Hard' || tp.difficulty === 'Mega Hard') { tpDiffColor = '#c084fc'; tpDiffBg = 'rgba(192,132,252,0.12)'; tpDiffBorder = 'rgba(192,132,252,0.3)'; tpDiffLabel = tp.difficulty; }
                        const tpDiffBadge = `<span style="color:${tpDiffColor}; background:${tpDiffBg}; padding: 3px 12px; border-radius: 100px; font-size: 0.78rem; font-weight: 700; border: 1px solid ${tpDiffBorder};">${tpDiffLabel}</span>`;

                        const myId = window.currentUser?.id || 'me';
                        const todayStr = new Date().toDateString();
                        const isDoneToday = localStorage.getItem('ca_daily_last_date_' + myId) === todayStr;
                        const isAlreadySolved = window.caSolvedProblems.includes(todayIdx);
                        const displayXp = (isAlreadySolved && !isDoneToday) ? 20 : (tp.xp || 100);

                        // Countdown to midnight
                        const now = new Date();
                        const midnight = new Date(now); midnight.setHours(24,0,0,0);
                        const diffMs = midnight - now;
                        const hh = Math.floor(diffMs/3600000);
                        const mm = Math.floor((diffMs % 3600000)/60000);
                        const countdown = `${hh}h ${mm}m`;

                        return `
                        <div class="fade-in" style="display: flex; justify-content: center; align-items: flex-start; padding: 1.5rem 1rem;">
                            <div style="max-width: 520px; width: 100%; position: relative;">
                                
                                <!-- Animated glow ring -->
                                <div style="position: absolute; inset: -1px; background: linear-gradient(135deg, #6366f1 0%, #3b82f6 50%, #8b5cf6 100%); border-radius: 22px; opacity: ${isDoneToday ? '0.2' : '0.4'}; z-index: 0; pointer-events: none; filter: blur(6px);"></div>
                                
                                <div style="position: relative; z-index: 1; background: linear-gradient(160deg, #191e2d 0%, #0e1319 100%); border: 1px solid rgba(99,102,241,0.3); border-radius: 20px; overflow: hidden; box-shadow: 0 24px 60px rgba(0,0,0,0.7);">
                                    
                                    <!-- Top gradient accent bar -->
                                    <div style="height: 3px; background: linear-gradient(90deg, #6366f1, #60a5fa, #a78bfa); width: 100%;"></div>

                                    <!-- Decorative blob -->
                                    <div style="position: absolute; top: -40px; right: -40px; width: 160px; height: 160px; background: radial-gradient(circle, rgba(99,102,241,0.22), transparent 65%); pointer-events: none;"></div>
                                    <div style="position: absolute; bottom: -40px; left: -30px; width: 130px; height: 130px; background: radial-gradient(circle, rgba(59,130,246,0.18), transparent 65%); pointer-events: none;"></div>

                                    <div style="padding: 1.5rem 1.6rem; position: relative; z-index: 1;">
                                        
                                        <!-- Header Row -->
                                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                                            <div style="display: inline-flex; align-items: center; gap: 6px; background: rgba(249,115,22,0.1); border: 1px solid rgba(249,115,22,0.3); color: #fb923c; font-size: 0.68rem; font-weight: 800; padding: 4px 12px; border-radius: 100px; text-transform: uppercase; letter-spacing: 1.5px;">
                                                <i class="fa-solid fa-fire"></i> Daily Challenge
                                            </div>
                                            <div style="display: flex; align-items: center; gap: 5px; color: #f59e0b; font-size: 0.8rem; font-weight: 700; font-family: monospace; background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.2); padding: 4px 11px; border-radius: 100px;">
                                                <i class="fa-solid fa-star" style="font-size: 0.75rem;"></i> +${displayXp} XP
                                            </div>
                                        </div>

                                        <!-- Problem ID -->
                                        <div style="font-size: 0.68rem; color: #475569; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.3rem;">#${tp.id || (todayIdx + 1)}</div>

                                        <!-- Title -->
                                        <h2 style="font-size: 1.4rem; margin: 0 0 0.5rem 0; color: #f1f5f9; font-family: 'Outfit', sans-serif; font-weight: 700; letter-spacing: -0.3px; line-height: 1.25;">${tp.title}</h2>

                                        <!-- Description -->
                                        <p style="color: #6b7280; font-size: 0.84rem; line-height: 1.55; margin-bottom: 1rem;">${(tp.description || '').substring(0, 110)}…</p>

                                        <!-- Tags Row -->
                                        <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 1.2rem;">
                                            ${tpDiffBadge}
                                            <span style="background: rgba(255,255,255,0.04); color: #94a3b8; font-size: 0.75rem; padding: 3px 11px; border-radius: 100px; border: 1px solid rgba(255,255,255,0.08);"><i class="fa-solid fa-tag" style="margin-right:5px; color:#64748b; font-size:0.65rem;"></i>${tp.category}</span>
                                            ${(tp.companies || []).slice(0, 2).map(c => window.getCaCompanyLogoHtml(c, 14, true)).join('')}
                                        </div>

                                        <!-- Divider -->
                                        <div style="border-top: 1px solid rgba(255,255,255,0.05); margin-bottom: 1.2rem;"></div>

                                        <!-- CTA -->
                                        ${isDoneToday ? `
                                        <div style="display: flex; align-items: center; gap: 10px;">
                                            <div style="flex: 1; background: rgba(5,150,105,0.08); border: 1px solid rgba(16,185,129,0.25); border-radius: 12px; padding: 11px 14px; display: flex; align-items: center; gap: 9px;">
                                                <i class="fa-solid fa-circle-check" style="color: #10b981; font-size: 1.2rem; flex-shrink: 0;"></i>
                                                <div>
                                                    <div style="color: #10b981; font-weight: 700; font-size: 0.85rem;">Completed! ✓</div>
                                                    <div style="color: #475569; font-size: 0.72rem; margin-top: 1px;">Next in ${countdown}</div>
                                                </div>
                                            </div>
                                            <button onclick="window.startSpecificProblem(${todayIdx})"
                                                onmouseover="this.style.background='rgba(99,102,241,0.18)'; this.style.borderColor='rgba(99,102,241,0.45)';"
                                                onmouseout="this.style.background='rgba(99,102,241,0.08)'; this.style.borderColor='rgba(99,102,241,0.25)';"
                                                style="padding: 11px 15px; border-radius: 12px; background: rgba(99,102,241,0.08); color: #a5b4fc; border: 1px solid rgba(99,102,241,0.25); cursor: pointer; font-size: 0.8rem; font-weight: 600; transition: all 0.2s; white-space: nowrap; flex-shrink: 0;">
                                                <i class="fa-solid fa-rotate-right"></i>
                                            </button>
                                        </div>
                                        ` : `
                                        <button onclick="window.startSpecificProblem(${todayIdx})"
                                            onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 14px 35px rgba(79,70,229,0.55)';"
                                            onmouseout="this.style.transform='none'; this.style.boxShadow='0 6px 20px rgba(79,70,229,0.35)';"
                                            style="width: 100%; padding: 13px; font-size: 0.95rem; border-radius: 13px; background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%); color: #fff; border: none; cursor: pointer; font-weight: 700; box-shadow: 0 6px 20px rgba(79,70,229,0.35); transition: all 0.25s cubic-bezier(0.4,0,0.2,1); display: flex; align-items: center; justify-content: center; gap: 9px; letter-spacing: 0.3px;">
                                            <i class="fa-solid fa-bolt"></i> Start Today's Challenge
                                        </button>
                                        `}
                                    </div>
                                </div>
                            </div>
                        </div>`;
                    })() : ''}

                    <!-- TAB CONTENT: TOPIC TAGS -->
                    ${window.caFilterTab === 'topics' ? `
                    <div class="fade-in">
                        <div style="margin-bottom: 1.5rem;">
                            <h2 style="font-size: 1.4rem; margin: 0 0 0.4rem 0; color: #fff;">📚 Master Algorithms by Topic</h2>
                            <p style="color: var(--text-dim); font-size: 0.9rem; margin: 0;">Select a topic category to practice curated algorithmic challenges.</p>
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.2rem; padding-bottom: 3rem;">
                            ${CA_CATEGORIES.map(cat => {
                                const count = codingProblems.filter(p => p.category === cat).length;
                                const icon = CA_TOPIC_ICONS[cat] || 'fa-code';
                                return `
                                <div class="ca-topic-card" onclick="window.setCaFilterCategory('${cat}')">
                                    <div>
                                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                                            <div style="width: 44px; height: 44px; border-radius: 10px; background: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.3); display: flex; align-items: center; justify-content: center; color: #818cf8; font-size: 1.3rem;">
                                                <i class="fa-solid ${icon}"></i>
                                            </div>
                                            <span style="background: rgba(255,255,255,0.06); color: #cbd5e1; font-size: 0.75rem; padding: 3px 10px; border-radius: 100px; font-weight: 600;">${count} Problems</span>
                                        </div>
                                        <h3 style="font-size: 1.15rem; color: #fff; margin: 0 0 0.5rem 0; font-weight: 700;">${cat}</h3>
                                        <p style="color: var(--text-dim); font-size: 0.8rem; line-height: 1.4; margin: 0;">Practice core data structures and algorithms for ${cat.toLowerCase()}.</p>
                                    </div>
                                    <div style="margin-top: 1.2rem; pt: 1rem; border-top: 1px solid rgba(255,255,255,0.06); display: flex; justify-content: space-between; align-items: center; color: #60a5fa; font-size: 0.85rem; font-weight: 600;">
                                        <span>Browse Topic</span>
                                        <i class="fa-solid fa-arrow-right"></i>
                                    </div>
                                </div>`;
                            }).join('')}
                        </div>
                    </div>
                    ` : ''}

                    <!-- TAB CONTENT: TOP COMPANIES -->
                    ${window.caFilterTab === 'companies' ? `
                    <div class="fade-in">
                        <div style="margin-bottom: 1.5rem;">
                            <h2 style="font-size: 1.4rem; margin: 0 0 0.4rem 0; color: #fff;">🏢 Top Tech Company Interview Questions</h2>
                            <p style="color: var(--text-dim); font-size: 0.9rem; margin: 0;">Practice frequently asked coding interview problems organized by tech companies.</p>
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1.2rem; padding-bottom: 3rem;">
                            ${CA_COMPANIES.map(comp => {
                                const count = codingProblems.filter(p => (p.companies || []).includes(comp)).length;
                                const logo = COMPANY_LOGOS[comp] || { icon: "fa-solid fa-building", color: "#a855f7", bg: "rgba(168, 85, 247, 0.15)", border: "rgba(168, 85, 247, 0.3)" };
                                return `
                                <div class="ca-comp-card" onclick="window.setCaFilterCompany('${comp}')" style="border-top: 3px solid ${logo.color};">
                                    <div>
                                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                                            <div style="width: 44px; height: 44px; border-radius: 10px; background: #ffffff; border: 1.5px solid #161b22; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3); padding: 4px;">
                                                ${window.getCaCompanyLogoHtml(comp, 28)}
                                            </div>
                                            <span style="background: rgba(255,255,255,0.06); color: #cbd5e1; border: 1px solid rgba(255,255,255,0.15); font-size: 0.75rem; padding: 3px 10px; border-radius: 100px; font-weight: 600;">${count} Questions</span>
                                        </div>
                                        <h3 style="font-size: 1.15rem; color: #fff; margin: 0 0 0.3rem 0; font-weight: 700; display: flex; align-items: center; gap: 8px;">${comp}</h3>
                                        <p style="color: var(--text-dim); font-size: 0.8rem; margin: 0;">Asked in tech rounds & coding assessments.</p>
                                    </div>
                                    <div style="margin-top: 1.2rem; pt: 1rem; border-top: 1px solid rgba(255,255,255,0.06); display: flex; justify-content: space-between; align-items: center; color: ${logo.color}; font-size: 0.85rem; font-weight: 600;">
                                        <span>Solve Questions</span>
                                        <i class="fa-solid fa-arrow-right"></i>
                                    </div>
                                </div>`;
                            }).join('')}
                        </div>
                    </div>
                    ` : ''}

                    <!-- TAB CONTENT: CONTESTS -->
                    ${window.caFilterTab === 'contests' ? (() => {
                        // ── Monthly Contest Setup ─────────────────────────────
                        const myId = window.currentUser?.id || 'me';
                        const now = new Date();
                        const monthKey = `${now.getFullYear()}-${now.getMonth() + 1}`;
                        const contestKey = `ca_contest_${myId}_${monthKey}`;
                        const contestDoneKey = `ca_contest_done_${myId}_${monthKey}`;

                        // Seeded RNG so same user gets same 5 per month but different each month
                        function seededRand(seed) {
                            let s = seed;
                            return function() {
                                s = (s * 1664525 + 1013904223) & 0xffffffff;
                                return (s >>> 0) / 0xffffffff;
                            };
                        }
                        const userSeed = [...(myId + monthKey)].reduce((acc, c) => acc + c.charCodeAt(0), 0);
                        const rand = seededRand(userSeed * 9301 + 49297);

                        // Pick problems by difficulty bucket
                        function pickRandom(pool, count, rng) {
                            const shuffled = [...pool].sort(() => rng() - 0.5);
                            return shuffled.slice(0, count);
                        }
                        const easyPool   = codingProblems.map((p, i) => ({...p, _idx: i})).filter(p => p.difficulty === 'Easy');
                        const medPool    = codingProblems.map((p, i) => ({...p, _idx: i})).filter(p => p.difficulty === 'Medium');
                        const hardPool   = codingProblems.map((p, i) => ({...p, _idx: i})).filter(p => p.difficulty === 'Hard');
                        const vhardPool  = codingProblems.map((p, i) => ({...p, _idx: i})).filter(p => p.difficulty === 'Mega Hard' || p.difficulty === 'Very Hard');

                        const fallbackHard = hardPool.length ? hardPool : medPool;
                        const fallbackVH   = vhardPool.length ? vhardPool : hardPool;

                        let contestProblems = [];
                        try {
                            const stored = localStorage.getItem(contestKey);
                            if (stored) contestProblems = JSON.parse(stored);
                        } catch(e) {}

                        if (!contestProblems || contestProblems.length !== 5) {
                            const e1 = pickRandom(easyPool, 1, rand);
                            const e2 = pickRandom(easyPool.filter(p => !e1.includes(p)), 1, rand);
                            const m1 = pickRandom(medPool, 1, rand);
                            const h1 = pickRandom(fallbackHard, 1, rand);
                            const v1 = pickRandom(fallbackVH.filter(p => !h1.includes(p)), 1, rand);
                            contestProblems = [
                                ...(e1.length ? e1 : pickRandom(easyPool, 1, rand)),
                                ...(e2.length ? e2 : pickRandom(easyPool, 1, rand)),
                                ...(m1.length ? m1 : pickRandom(medPool, 1, rand)),
                                ...(h1.length ? h1 : pickRandom(fallbackHard, 1, rand)),
                                ...(v1.length ? v1 : pickRandom(fallbackVH, 1, rand))
                            ].slice(0, 5);
                            try { localStorage.setItem(contestKey, JSON.stringify(contestProblems)); } catch(e) {}
                        }

                        // XP per question: 2 Easy=30 each, Medium=50, Hard=90, VHard=100 => total=300
                        const XP_DIST = [30, 30, 50, 90, 100];
                        const BONUS_XP = 200;

                        // Solved tracking per contest (separate from global solved)
                        let contestSolved = {};
                        try { contestSolved = JSON.parse(localStorage.getItem(contestDoneKey) || '{}'); } catch(e) {}
                        const contestFullDone = Object.keys(contestSolved).length >= 5 && contestProblems.every((p, qi) => contestSolved[qi]);
                        const earnedXP = contestProblems.reduce((sum, p, qi) => sum + (contestSolved[qi] ? XP_DIST[qi] : 0), 0);

                        // Timer: time until 1st of next month (00:00:00)
                        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
                        const msLeft = nextMonth - now;
                        const dLeft = Math.floor(msLeft / 86400000);
                        const hLeft = Math.floor((msLeft % 86400000) / 3600000);
                        const mLeft = Math.floor((msLeft % 3600000) / 60000);
                        const sLeft = Math.floor((msLeft % 60000) / 1000);
                        const timerStr = `${String(dLeft).padStart(2,'0')}d ${String(hLeft).padStart(2,'0')}h ${String(mLeft).padStart(2,'0')}m ${String(sLeft).padStart(2,'0')}s`;

                        const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
                        const contestTitle = `${monthNames[now.getMonth()]} ${now.getFullYear()} Monthly Contest`;
                        const progressPct = Math.round((Object.keys(contestSolved).length / 5) * 100);

                        // Register solve handler for contest-specific completion
                        window.caContestSolve = function(qi) {
                            let cs = {};
                            try { cs = JSON.parse(localStorage.getItem(contestDoneKey) || '{}'); } catch(e) {}
                            if (cs[qi]) { alert('You already solved this contest problem!'); return; }
                            // Launch the problem solver
                            const prob = contestProblems[qi];
                            if (prob) window.startSpecificProblem(prob._idx, true, qi);
                        };

                        window.caMarkContestSolved = function(qi) {
                            let cs = {};
                            try { cs = JSON.parse(localStorage.getItem(contestDoneKey) || '{}'); } catch(e) {}
                            if (cs[qi]) return;
                            cs[qi] = true;
                            try { localStorage.setItem(contestDoneKey, JSON.stringify(cs)); } catch(e) {}
                            // Award XP for this question
                            const xpGain = XP_DIST[qi] || 30;
                            if (window.awardCodingXP) window.awardCodingXP(xpGain, 'Contest problem solved');
                            const allDone = Object.keys(cs).length >= 5;
                            if (allDone) {
                                const bonusKey = `ca_contest_bonus_${myId}_${monthKey}`;
                                if (!localStorage.getItem(bonusKey)) {
                                    localStorage.setItem(bonusKey, '1');
                                    if (window.awardCodingXP) window.awardCodingXP(BONUS_XP, 'Monthly Contest Complete! Bonus XP');
                                    setTimeout(() => {
                                        alert('🏆 Congratulations! You completed the Monthly Contest!\n\n+200 Bonus XP awarded!');
                                    }, 500);
                                }
                            }
                            if (window.renderTabContent) window.renderTabContent('coding-arena');
                        };

                        // Start live timer
                        if (window._caContestTimerInterval) clearInterval(window._caContestTimerInterval);
                        window._caContestTimerInterval = setInterval(() => {
                            const el = document.getElementById('ca-contest-timer');
                            if (!el) { clearInterval(window._caContestTimerInterval); return; }
                            const n2 = new Date();
                            const nm = new Date(n2.getFullYear(), n2.getMonth() + 1, 1, 0, 0, 0, 0);
                            const ms = nm - n2;
                            if (ms <= 0) { el.textContent = '00d 00h 00m 00s'; return; }
                            const d2 = Math.floor(ms / 86400000);
                            const h2 = Math.floor((ms % 86400000) / 3600000);
                            const m2 = Math.floor((ms % 3600000) / 60000);
                            const s2 = Math.floor((ms % 60000) / 1000);
                            el.textContent = `${String(d2).padStart(2,'0')}d ${String(h2).padStart(2,'0')}h ${String(m2).padStart(2,'0')}m ${String(s2).padStart(2,'0')}s`;
                        }, 1000);

                        const diffColor = d => d === 'Easy' ? '#10b981' : d === 'Medium' ? '#f59e0b' : (d === 'Mega Hard' || d === 'Very Hard') ? '#a855f7' : '#ef4444';
                        const diffBg    = d => d === 'Easy' ? 'rgba(16,185,129,0.12)' : d === 'Medium' ? 'rgba(245,158,11,0.12)' : (d === 'Mega Hard' || d === 'Very Hard') ? 'rgba(168,85,247,0.12)' : 'rgba(239,68,68,0.12)';
                        const diffLabel = d => (d === 'Mega Hard' || d === 'Very Hard') ? 'Very Hard' : d;

                        return `
                        <div class="fade-in" style="padding-bottom: 2rem;">
                            <!-- Header -->
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem;">
                                <div>
                                    <span style="background: linear-gradient(90deg,#6366f1,#8b5cf6); color: #fff; font-size: 0.75rem; font-weight: 800; padding: 4px 14px; border-radius: 6px; text-transform: uppercase; letter-spacing: 1px;">🏆 MONTHLY CONTEST</span>
                                    <h2 style="font-size: 1.6rem; margin: 0.6rem 0 0.3rem 0; color: #fff;">${contestTitle}</h2>
                                    <p style="color: #94a3b8; font-size: 0.92rem; margin: 0;">5 problems · 300 XP total · +200 Bonus XP on completion · Resets on 1st of every month</p>
                                </div>
                                <div style="background: rgba(0,0,0,0.5); border: 1px solid rgba(99,102,241,0.35); border-radius: 14px; padding: 1rem 1.5rem; text-align: center; min-width: 200px;">
                                    <div style="color: #94a3b8; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Resets In</div>
                                    <div id="ca-contest-timer" style="color: #818cf8; font-size: 1.35rem; font-weight: 800; font-family: monospace; letter-spacing: 2px;">${timerStr}</div>
                                </div>
                            </div>

                            <!-- Progress + Stats Bar -->
                            <div style="background: linear-gradient(135deg, rgba(99,102,241,0.1), rgba(59,130,246,0.15)); border: 1px solid rgba(99,102,241,0.3); border-radius: 16px; padding: 1.5rem 2rem; margin-bottom: 1.8rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                                <div style="flex: 1; min-width: 200px;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                        <span style="color: #e2e8f0; font-weight: 700; font-size: 0.95rem;">Monthly Progress</span>
                                        <span style="color: #818cf8; font-weight: 700;">${Object.keys(contestSolved).length}/5 Problems</span>
                                    </div>
                                    <div style="height: 10px; background: rgba(255,255,255,0.08); border-radius: 100px; overflow: hidden;">
                                        <div style="height: 100%; width: ${progressPct}%; background: linear-gradient(90deg, #6366f1, #8b5cf6); border-radius: 100px; transition: width 0.4s ease;"></div>
                                    </div>
                                </div>
                                <div style="display: flex; gap: 1.5rem; flex-wrap: wrap; text-align: center;">
                                    <div>
                                        <div style="color: #60a5fa; font-size: 1.5rem; font-weight: 800; font-family: monospace;">+${earnedXP}</div>
                                        <div style="color: #64748b; font-size: 0.72rem; font-weight: 600; text-transform: uppercase;">XP Earned</div>
                                    </div>
                                    <div>
                                        <div style="color: #f59e0b; font-size: 1.5rem; font-weight: 800; font-family: monospace;">${contestFullDone ? '✓' : '+200'}</div>
                                        <div style="color: #64748b; font-size: 0.72rem; font-weight: 600; text-transform: uppercase;">${contestFullDone ? 'Bonus Claimed' : 'Bonus XP'}</div>
                                    </div>
                                    ${contestFullDone ? `
                                    <div style="background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.4); border-radius: 10px; padding: 8px 16px; display: flex; align-items: center; gap: 8px;">
                                        <i class="fa-solid fa-trophy" style="color: #10b981; font-size: 1.2rem;"></i>
                                        <span style="color: #10b981; font-weight: 700; font-size: 0.9rem;">Contest Complete!</span>
                                    </div>` : ''}
                                </div>
                            </div>

                            <!-- Rules -->
                            <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 1.5rem;">
                                ${[
                                    {icon:'fa-bolt', text:'2 Easy · 1 Medium · 1 Hard · 1 Very Hard', color:'#60a5fa'},
                                    {icon:'fa-rotate', text:'New random problems every 1st of month', color:'#a78bfa'},
                                    {icon:'fa-shield-halved', text:'Contest XP is separate from practice XP', color:'#34d399'},
                                    {icon:'fa-gift', text:'+200 Bonus XP for completing all 5', color:'#f59e0b'}
                                ].map(r => `
                                <div style="display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 8px 14px; font-size: 0.82rem; color: #cbd5e1;">
                                    <i class="fa-solid ${r.icon}" style="color:${r.color};"></i>
                                    ${r.text}
                                </div>`).join('')}
                            </div>

                            <!-- Problem List -->
                            <h3 style="font-size: 1.1rem; color: #f8fafc; margin-bottom: 1rem; display: flex; align-items: center; gap: 8px;">
                                <i class="fa-solid fa-list-check" style="color:#6366f1;"></i>
                                Contest Problem Set — ${monthNames[now.getMonth()]} ${now.getFullYear()}
                            </h3>
                            <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 2rem;">
                                ${contestProblems.map((p, qi) => {
                                    const solved = !!contestSolved[qi];
                                    const xp = XP_DIST[qi];
                                    const labels = ['Easy','Easy','Medium','Hard','Very Hard'];
                                    return `
                                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; background: ${solved ? 'rgba(16,185,129,0.06)' : '#0d1117'}; border: 1px solid ${solved ? 'rgba(16,185,129,0.35)' : 'rgba(255,255,255,0.08)'}; border-radius: 12px; transition: all 0.2s; gap: 12px;" onmouseover="if(!${solved})this.style.background='#161b22'" onmouseout="if(!${solved})this.style.background='#0d1117'">
                                        <div style="display: flex; align-items: center; gap: 16px; flex: 1; min-width: 0;">
                                            <div style="width: 36px; height: 36px; border-radius: 8px; background: ${solved ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)'}; display: flex; align-items: center; justify-content: center; font-weight: 800; font-family: monospace; color: ${solved ? '#10b981' : '#64748b'}; font-size: 0.9rem; flex-shrink: 0;">
                                                ${solved ? '<i class="fa-solid fa-check"></i>' : `Q${qi+1}`}
                                            </div>
                                            <div style="min-width: 0;">
                                                <div style="color: ${solved ? '#10b981' : '#fff'}; font-weight: 700; font-size: 0.97rem; margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${p.title}</div>
                                                <div style="color: #64748b; font-size: 0.78rem;">${p.category || ''} · +${xp} XP</div>
                                            </div>
                                        </div>
                                        <div style="display: flex; align-items: center; gap: 10px; flex-shrink: 0;">
                                            <span style="color: ${diffColor(p.difficulty)}; background: ${diffBg(p.difficulty)}; border: 1px solid ${diffColor(p.difficulty)}40; font-size: 0.78rem; font-weight: 700; padding: 4px 10px; border-radius: 6px;">${diffLabel(p.difficulty)}</span>
                                            <span style="color: #60a5fa; font-weight: 700; font-family: monospace; font-size: 0.88rem; min-width: 48px; text-align: right;">+${xp} XP</span>
                                            ${solved
                                                ? `<span style="background: rgba(16,185,129,0.15); color: #10b981; border: 1px solid rgba(16,185,129,0.4); padding: 6px 16px; border-radius: 6px; font-weight: 700; font-size: 0.82rem;">✓ Solved</span>`
                                                : `<button onclick="window.caContestSolve(${qi})" style="background: linear-gradient(90deg,#4f46e5,#7c3aed); color:#fff; border:none; padding: 7px 18px; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 0.85rem; box-shadow: 0 4px 12px rgba(99,102,241,0.3); transition: 0.2s;" onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'">Solve →</button>`
                                            }
                                        </div>
                                    </div>`;
                                }).join('')}
                            </div>

                            <!-- XP Breakdown -->
                            <div style="background: #0d1117; border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 1.5rem 2rem;">
                                <h4 style="color: #f8fafc; margin: 0 0 1rem 0; font-size: 0.95rem; display: flex; align-items: center; gap: 8px;"><i class="fa-solid fa-star" style="color:#f59e0b;"></i> XP Breakdown</h4>
                                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px;">
                                    ${contestProblems.map((p, qi) => {
                                        const solved = !!contestSolved[qi];
                                        return `<div style="background: ${solved ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)'}; border: 1px solid ${solved ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.07)'}; border-radius: 10px; padding: 12px; text-align: center;">
                                            <div style="font-size: 1.3rem; font-weight: 800; color: ${solved ? '#10b981' : '#64748b'}; font-family: monospace;">${solved ? '+'+XP_DIST[qi] : XP_DIST[qi]}</div>
                                            <div style="font-size: 0.72rem; color: #64748b; margin-top: 2px;">Q${qi+1} · ${diffLabel(p.difficulty)}</div>
                                        </div>`;
                                    }).join('')}
                                    <div style="background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.3); border-radius: 10px; padding: 12px; text-align: center;">
                                        <div style="font-size: 1.3rem; font-weight: 800; color: ${contestFullDone ? '#f59e0b' : '#64748b'}; font-family: monospace;">${contestFullDone ? '+200' : '200'}</div>
                                        <div style="font-size: 0.72rem; color: #64748b; margin-top: 2px;">Completion Bonus</div>
                                    </div>
                                </div>
                                <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.06); display: flex; justify-content: space-between; align-items: center;">
                                    <span style="color: #94a3b8; font-size: 0.85rem;">Total possible this month:</span>
                                    <span style="color: #60a5fa; font-weight: 800; font-size: 1.1rem; font-family: monospace;">500 XP</span>
                                </div>
                            </div>
                        </div>`;
                    })() : ''}


                    <!-- TAB CONTENT: LEADERBOARDS -->
                    ${window.caFilterTab === 'leaderboards' ? `
                    <div class="fade-in">
                        <div style="margin-bottom: 1.5rem;">
                            <span style="background: #3b82f6; color: #fff; font-size: 0.75rem; font-weight: 800; padding: 4px 12px; border-radius: 6px; text-transform: uppercase; letter-spacing: 1px;">🏆 GLOBAL STANDINGS</span>
                            <h2 style="font-size: 1.6rem; margin: 0.6rem 0 0.4rem 0; color: #fff;">Global Coder Leaderboard</h2>
                            <p style="color: var(--text-dim); font-size: 0.95rem; margin: 0;">Rankings updated in real-time based on problems solved, streak multiplier, and contest performance.</p>
                        </div>
                        
                        <div style="background: #0d1117; border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; overflow: hidden; margin-bottom: 3rem;">
                            <table style="width: 100%; border-collapse: collapse; text-align: left; color: #e2e8f0;">
                                <thead>
                                    <tr style="background: rgba(255,255,255,0.03); border-bottom: 1px solid rgba(255,255,255,0.08); font-size: 0.8rem; color: #94a3b8; text-transform: uppercase;">
                                        <th style="padding: 14px 20px;">Rank</th>
                                        <th style="padding: 14px 20px;">Coder Name</th>
                                        <th style="padding: 14px 20px;">Organization</th>
                                        <th style="padding: 14px 20px;">Problems Solved</th>
                                        <th style="padding: 14px 20px;">Day Streak</th>
                                        <th style="padding: 14px 20px; text-align: right;">Total XP</th>
                                    </tr>
                                </thead>
                                <tbody id="ca-leaderboard-tbody">
                                    ${(window.getCaLeaderboardHTML = function() {
                                        const lb = window.caLeaderboardData || [];
                                        if (lb.length === 0) {
                                            return `<tr><td colspan="6" style="padding: 2rem; text-align: center; color: #94a3b8;">No leaderboard data available yet. Be the first to solve a challenge!</td></tr>`;
                                        }
                                        const displayLb = lb.slice(0, 25);
                                        let html = displayLb.map((u, idx) => {
                                            const r = idx + 1;
                                            let rankStr = `#${r}`;
                                            let rankColor = '#64748b';
                                            if (r === 1) { rankStr = '👑 #1'; rankColor = '#f59e0b'; }
                                            else if (r === 2) { rankStr = '🥈 #2'; rankColor = '#94a3b8'; }
                                            else if (r === 3) { rankStr = '🥉 #3'; rankColor = '#cd7f32'; }
                                            
                                            const isMe = u.isMe || (window.currentUser && u.id === window.currentUser.id);
                                            const bgStyle = isMe ? 'background: rgba(0, 210, 255, 0.12); border: 2px solid #00d2ff;' : (r === 1 ? 'background: rgba(59, 130, 246, 0.08);' : '');
                                            
                                            return `
                                            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); ${bgStyle}">
                                                <td style="padding: 14px 20px; font-weight: 800; color: ${rankColor};">${rankStr}</td>
                                                <td style="padding: 14px 20px; font-weight: ${isMe ? '800' : '700'}; color: ${isMe ? '#00d2ff' : '#fff'};"><i class="fa-solid ${isMe ? 'fa-user-check' : 'fa-user-astronaut'}" style="margin-right:8px; color:${isMe ? '#00d2ff' : '#60a5fa'};"></i>${u.name} ${isMe ? '<span style="background:#00d2ff; color:#000; font-size:0.65rem; padding:2px 6px; border-radius:4px; margin-left:6px; font-weight:900;">YOU</span>' : ''}</td>
                                                <td style="padding: 14px 20px; color: #94a3b8;">${u.college || 'Organization'}</td>
                                                <td style="padding: 14px 20px; font-weight: 700; color: #10b981;">${u.solved}</td>
                                                <td style="padding: 14px 20px; color: #f97316;">🔥 ${u.streak} days</td>
                                                <td style="padding: 14px 20px; text-align: right; font-weight: 800; color: ${isMe ? '#00d2ff' : '#60a5fa'}; font-family: monospace;">${u.xp.toLocaleString()} XP</td>
                                            </tr>`;
                                        }).join('');

                                        // If logged in user is not in top 25 displayed, append row at bottom with real rank
                                        const myIdx = lb.findIndex(u => u.isMe || (window.currentUser && u.id === window.currentUser.id));
                                        if (myIdx >= 25) {
                                            const myU = lb[myIdx];
                                            html += `
                                            <tr style="border: 2px solid #00d2ff; background: rgba(0, 210, 255, 0.12);">
                                                <td style="padding: 14px 20px; font-weight: 800; color: #00d2ff;">#${myIdx + 1}</td>
                                                <td style="padding: 14px 20px; font-weight: 800; color: #00d2ff;"><i class="fa-solid fa-user-check" style="margin-right:8px;"></i>${myU.name} <span style="background:#00d2ff; color:#000; font-size:0.65rem; padding:2px 6px; border-radius:4px; margin-left:6px; font-weight:900;">YOU</span></td>
                                                <td style="padding: 14px 20px; color: #e2e8f0;">${myU.college || 'Organization'}</td>
                                                <td style="padding: 14px 20px; font-weight: 700; color: #10b981;">${myU.solved}</td>
                                                <td style="padding: 14px 20px; color: #f97316;">🔥 ${myU.streak} days</td>
                                                <td style="padding: 14px 20px; text-align: right; font-weight: 800; color: #00d2ff; font-family: monospace;">${myU.xp.toLocaleString()} XP</td>
                                            </tr>`;
                                        }
                                        return html;
                                    })()}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>
        </div>`;
    }

    // --- Render COMPILER UI ----- Render COMPILER UI ---
    const isSandbox = window.caActiveProblemIndex === -1;
    const problem = isSandbox ? {
        title: "Sandbox Mode",
        difficulty: "Free Play",
        description: "Write, test, and execute any code you want! No test cases, no XP, just pure freedom.",
        testCases: []
    } : codingProblems[window.caActiveProblemIndex];
    
    const isContestMode = !!window.caIsContestProblem;
    // Users have full freedom to submit and solve any problem in any quantity
    const isActuallyToday = !isSandbox;
    
    setTimeout(() => {
        initEditor();
        // Hide sidebar and top-bar for full screen compiler
        const sidebar = document.querySelector('.sidebar');
        const topBar = document.querySelector('.top-bar');
        if (sidebar) sidebar.style.display = 'none';
        if (topBar) topBar.style.display = 'none';
        
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            if (!mainContent.dataset.origPadding) mainContent.dataset.origPadding = mainContent.style.padding;
            mainContent.style.padding = '0';
        }
    }, 100);

    return `
    <div class="coding-arena-container fade-in ca-fullscreen-mode" style="display: flex; gap: 8px; height: calc(100vh - 10px); color: #fff; padding: 0.5rem 0; overflow: hidden; position: relative; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        
        <!-- Left Side: Problem Context (45%) -->
        <div class="ca-left" style="width: 45%; border-radius: 12px; display: flex; flex-direction: column; background: #000000; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.8); border: 1px solid rgba(255,255,255,0.05);">
            
            <!-- Tabs -->
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 0 16px; background: #0a0a0a; border-bottom: 1px solid rgba(255,255,255,0.05); flex-shrink: 0;">
                <div style="display: flex; align-items: center; gap: 4px;">
                    <!-- Back button -->
                    <button onclick="window.backToExplorer()" title="Back to Problems" style="background: transparent; border: none; color: #8c8c8c; cursor: pointer; height: 36px; padding: 0 10px 0 0; border-radius: 6px; display: flex; align-items: center; gap: 5px; font-size: 13px; font-weight: 500; transition: color 0.2s; margin-right: 8px; border-right: 1px solid rgba(255,255,255,0.08);" onmouseover="this.style.color='#eff1f6'" onmouseout="this.style.color='#8c8c8c'">
                        <i class="fa-solid fa-arrow-left" style="font-size:11px;"></i> Back
                    </button>
                    <div id="ca-tab-desc" onclick="window.switchCaTab('desc')" style="padding: 12px 0; color: #ffc01e; font-size: 13px; font-weight: 600; border-bottom: 2px solid #ffc01e; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                        <i class="fa-regular fa-file-lines"></i> Description
                    </div>
                    <div id="ca-tab-subs" onclick="window.switchCaTab('subs')" style="padding: 12px 0; color: #8c8c8c; font-size: 13px; font-weight: 500; border-bottom: 2px solid transparent; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: 0.2s; margin-left: 20px;">
                        <i class="fa-solid fa-clock-rotate-left"></i> Submissions
                    </div>
                    <div id="ca-tab-hints" onclick="window.switchCaTab('hints')" style="padding: 12px 0; color: #8c8c8c; font-size: 13px; font-weight: 500; border-bottom: 2px solid transparent; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: 0.2s; margin-left: 20px;">
                        <i class="fa-solid fa-lightbulb"></i> Hints
                    </div>
                    <div id="ca-tab-solution" onclick="window.switchCaTab('solution')" style="padding: 12px 0; color: #8c8c8c; font-size: 13px; font-weight: 500; border-bottom: 2px solid transparent; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: 0.2s; margin-left: 20px;">
                        <i class="fa-solid fa-wand-magic-sparkles"></i> Solution
                    </div>
                </div>
                <!-- Prev / Next navigation -->
                <div style="display: flex; align-items: center; gap: 6px;">
                    <button id="ca-btn-prev" title="Previous Problem" onclick="window.caNavigateProblem(-1)" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: #eff1f6; cursor: pointer; height: 28px; padding: 0 10px; border-radius: 6px; display: flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 500; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.14)'" onmouseout="this.style.background='rgba(255,255,255,0.06)'">
                        <i class="fa-solid fa-chevron-left" style="font-size:10px;"></i> Prev
                    </button>
                    <span id="ca-prob-counter" style="color: #8c8c8c; font-size: 12px; min-width: 42px; text-align: center;"></span>
                    <button id="ca-btn-next" title="Next Problem" onclick="window.caNavigateProblem(1)" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: #eff1f6; cursor: pointer; height: 28px; padding: 0 10px; border-radius: 6px; display: flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 500; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.14)'" onmouseout="this.style.background='rgba(255,255,255,0.06)'">
                        Next <i class="fa-solid fa-chevron-right" style="font-size:10px;"></i>
                    </button>
                </div>
            </div>

            <!-- Left Panel Content -->
            <div style="flex: 1; overflow-y: auto; padding: 20px 24px; position: relative;">
                
                <!-- Description View -->
                <div id="ca-view-desc" style="display: block;">
                    <div style="margin-bottom: 16px;">
                        <h2 style="margin: 0; color: #eff1f6; font-size: 22px; font-weight: 600; letter-spacing: -0.5px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                            ${problem.id ? `#${problem.id}. ` : ''}${problem.title}
                            ${(window.caSolvedProblems || []).includes(window.caActiveProblemIndex) ? `<span style="display:inline-flex;align-items:center;gap:4px;background:rgba(46,213,115,0.15);border:1px solid rgba(46,213,115,0.4);color:#2ed573;font-size:12px;font-weight:600;padding:2px 10px;border-radius:100px;vertical-align:middle;"><i class='fa-solid fa-circle-check' style='font-size:11px;'></i> Solved</span>` : ''}
                        </h2>
                    </div>
                    
                    <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 24px; align-items: center;">
                        <span style="color: ${problem.difficulty === 'Easy' ? '#00b8a3' : (problem.difficulty === 'Medium' ? '#ffc01e' : (problem.difficulty === 'Hard' ? '#ff375f' : '#b00020'))}; background: rgba(255,255,255,0.06); padding: 4px 12px; border-radius: 100px; font-size: 12px; font-weight: 500;">${problem.difficulty}</span>
                        ${problem.category ? `<span style="color: #00d2ff; background: rgba(0, 210, 255, 0.1); border: 1px solid rgba(0, 210, 255, 0.3); padding: 4px 12px; border-radius: 100px; font-size: 12px;"><i class="fa-solid fa-tag" style="margin-right:4px;"></i>${problem.category}</span>` : ''}
                        ${(problem.companies || []).map(c => window.getCaCompanyLogoHtml(c, 16, true)).join('')}
                        ${(problem.tags || []).map(t => `<span style="color: #a3a3a3; background: rgba(255,255,255,0.05); padding: 4px 12px; border-radius: 100px; font-size: 12px; border: 1px solid rgba(255,255,255,0.1);">${t}</span>`).join('')}
                    </div>

                <div class="ca-desc" style="line-height: 1.6; color: #d4d4d4; font-size: 14px; margin-bottom: 32px;">
                    ${problem.description.replace(/\\n/g, '<br>')}
                </div>

                    
                    ${problem.optimalComplexity ? `
                    <div style="margin-top: 24px; padding: 16px; background: rgba(46, 213, 115, 0.05); border: 1px solid rgba(46, 213, 115, 0.2); border-radius: 8px;">
                        <div style="font-weight: 600; color: #2ed573; font-size: 14px; margin-bottom: 8px;"><i class="fa-solid fa-bolt" style="margin-right:6px;"></i>Expected Complexity</div>
                        <div style="display: flex; flex-wrap: wrap; gap: 20px; font-size: 13px; color: #d4d4d4;">
                            <div><strong style="color: #8c8c8c;">Time:</strong> <code style="color: #eff1f6; font-family: 'SFMono-Regular', Consolas, monospace; background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px;">${problem.optimalComplexity.time}</code></div>
                            <div><strong style="color: #8c8c8c;">Space:</strong> <code style="color: #eff1f6; font-family: 'SFMono-Regular', Consolas, monospace; background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px;">${problem.optimalComplexity.space}</code></div>
                        </div>
                    </div>` : ''}
                </div>
                
                <!-- Submissions View -->
                <div id="ca-view-subs" style="display: none; color: #d4d4d4; font-size: 14px; padding-top: 10px;">
                    <div id="ca-subs-list">
                        ${(() => {
                            let subsHtml = '';
                            if (!isSandbox && window.currentUser && window.currentUser.id) {
                                const subKey = `ca_subs_${window.currentUser.id}_${window.caActiveProblemIndex}`;
                                try {
                                    const pastSubs = JSON.parse(localStorage.getItem(subKey) || "[]");
                                    if (pastSubs && pastSubs.length > 0) {
                                        subsHtml = pastSubs.map(s => `
                                            <div style="background: ${s.status === 'Accepted' ? 'rgba(46, 213, 115, 0.1)' : 'rgba(255, 71, 87, 0.1)'}; border: 1px solid ${s.status === 'Accepted' ? 'rgba(46, 213, 115, 0.2)' : 'rgba(255, 71, 87, 0.2)'}; border-radius: 8px; padding: 16px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
                                                <div>
                                                    <div style="color: ${s.statusColor || (s.status === 'Accepted' ? '#2ed573' : '#ff4757')}; font-weight: bold; font-size: 16px; margin-bottom: 4px;">${s.status}</div>
                                                    <div style="font-size: 12px; color: #8c8c8c;">Language: <span style="color:#d4d4d4; font-weight:600;">${s.lang}</span> &nbsp;|&nbsp; ${s.time}</div>
                                                </div>
                                                <div style="text-align: right;">
                                                    <div style="color: #eff1f6; font-weight: 600;">Score: +${s.xp} XP</div>
                                                    <div style="font-size: 12px; color: #8c8c8c;">Time: ~${s.ms}ms</div>
                                                </div>
                                            </div>
                                        `).join('');
                                    }
                                } catch(e) {}
                            }
                            if (subsHtml) return subsHtml;
                            return `
                                <div style="color: #8c8c8c; text-align: center; margin-top: 40px; font-style: italic;">
                                    <i class="fa-solid fa-clock-rotate-left" style="font-size: 24px; margin-bottom: 12px; opacity: 0.5;"></i><br>
                                    No historical submissions found for this problem.<br>
                                    Run and submit your code to see results!
                                </div>
                            `;
                        })()}
                    </div>
                </div>

                <!-- Hints View -->
                <div id="ca-view-hints" style="display: none; color: #d4d4d4; font-size: 14px; padding-top: 10px;">
                    ${problem.hints && problem.hints.length > 0 ? problem.hints.map((h, i) => `
                    <div style="background: rgba(255,255,255,0.03); border-left: 3px solid #ffc01e; border-radius: 4px; padding: 16px; margin-bottom: 12px; line-height: 1.6;">
                        <strong style="color: #eff1f6;">Hint ${i + 1}:</strong><br>
                        ${h}
                    </div>`).join('') : `
                    <div style="color: #8c8c8c; text-align: center; margin-top: 40px; font-style: italic;">
                        <i class="fa-solid fa-lightbulb" style="font-size: 24px; margin-bottom: 12px; opacity: 0.5;"></i><br>
                        No hints available for this problem.<br>
                        You're on your own!
                    </div>
                    `}
                </div>

                <!-- Solution View -->
                <div id="ca-view-solution" style="display: none; color: #d4d4d4; font-size: 14px; padding-top: 10px;">
                    ${(() => {
                        const solLang = (window.currentCaLang || 'python').toLowerCase();
                        const langLabels = { python: 'Python', javascript: 'JavaScript', java: 'Java', cpp: 'C++', c: 'C', go: 'Go', rust: 'Rust', typescript: 'TypeScript', swift: 'Swift', kotlin: 'Kotlin', ruby: 'Ruby', csharp: 'C#' };
                        const langLabel = langLabels[solLang] || solLang;
                        const probTitle = encodeURIComponent(problem.title || '');
                        const probSlug = (problem.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                        const lcUrl = `https://leetcode.com/problems/${probSlug}/solutions/`;
                        const gfgUrl = `https://www.geeksforgeeks.org/${probSlug}-solution/`;
                        const youtubeUrl = `https://www.youtube.com/results?search_query=${probTitle}+solution+${langLabel}`;

                        const hasApproach = problem.hints && problem.hints.length > 0;
                        const hasComplexity = problem.optimalComplexity;

                        return `
                        <div style="animation: caFadeIn 0.3s ease;">

                            <!-- Approach Card -->
                            <div style="background: rgba(255,193,30,0.06); border: 1px solid rgba(255,193,30,0.25); border-radius: 12px; padding: 18px 20px; margin-bottom: 16px;">
                                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
                                    <div style="width: 32px; height: 32px; background: rgba(255,193,30,0.15); border-radius: 8px; display: flex; align-items: center; justify-content: center;"><i class="fa-solid fa-brain" style="color:#ffc01e; font-size:14px;"></i></div>
                                    <span style="font-size: 13px; font-weight: 700; color: #ffc01e; text-transform: uppercase; letter-spacing: 1px;">Optimal Approach</span>
                                </div>
                                ${hasApproach ? problem.hints.map((h, i) => `
                                    <div style="display: flex; gap: 12px; margin-bottom: 10px; align-items: flex-start;">
                                        <span style="flex-shrink: 0; width: 20px; height: 20px; background: rgba(255,193,30,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: #ffc01e; margin-top: 1px;">${i+1}</span>
                                        <p style="margin: 0; color: #cbd5e1; line-height: 1.6; font-size: 13px;">${h}</p>
                                    </div>`).join('') : '<p style="color: #8c8c8c; font-size: 13px; margin: 0;">Think about the data structures that could optimize the brute force approach.</p>'}
                            </div>

                            <!-- Complexity Card -->
                            ${hasComplexity ? `
                            <div style="background: rgba(46,213,115,0.06); border: 1px solid rgba(46,213,115,0.2); border-radius: 12px; padding: 16px 20px; margin-bottom: 16px; display: flex; gap: 24px; align-items: center;">
                                <div style="display: flex; align-items: center; gap: 8px;"><i class="fa-solid fa-bolt" style="color: #2ed573;"></i><span style="color:#8c8c8c; font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:1px;">Time</span><code style="color: #2ed573; background: rgba(46,213,115,0.1); padding: 3px 10px; border-radius: 6px; font-size: 13px; font-weight: 700;">${problem.optimalComplexity.time}</code></div>
                                <div style="display: flex; align-items: center; gap: 8px;"><i class="fa-solid fa-memory" style="color: #60a5fa;"></i><span style="color:#8c8c8c; font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:1px;">Space</span><code style="color: #60a5fa; background: rgba(96,165,250,0.1); padding: 3px 10px; border-radius: 6px; font-size: 13px; font-weight: 700;">${problem.optimalComplexity.space}</code></div>
                            </div>` : ''}

                            <!-- Load Template Button -->
                            <div style="background: rgba(99,102,241,0.08); border: 1px solid rgba(99,102,241,0.25); border-radius: 12px; padding: 16px 20px; margin-bottom: 16px;">
                                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                                    <div>
                                        <div style="font-size: 13px; font-weight: 700; color: #a5b4fc; margin-bottom: 4px;"><i class="fa-solid fa-wand-magic-sparkles" style="margin-right:6px;"></i>Load Starter Template</div>
                                        <div style="font-size: 12px; color: #64748b;">Loads the optimal algorithm skeleton into your editor</div>
                                    </div>
                                    <button onclick="window.loadSolutionTemplate()" style="background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #fff; border: none; padding: 10px 22px; border-radius: 10px; font-size: 13px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 15px rgba(79,70,229,0.35); transition: opacity 0.2s;" onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'">
                                        <i class="fa-solid fa-code"></i> Load in Editor
                                    </button>
                                </div>
                            </div>

                            <!-- External Reference Links -->
                            <div style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 10px;"><i class="fa-solid fa-link" style="margin-right:6px;"></i>Reference Solutions</div>
                            <div style="display: flex; flex-direction: column; gap: 8px;">
                                <a href="${lcUrl}" target="_blank" style="display: flex; align-items: center; gap: 12px; background: rgba(255,161,22,0.07); border: 1px solid rgba(255,161,22,0.2); border-radius: 10px; padding: 12px 16px; text-decoration: none; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,161,22,0.14)'" onmouseout="this.style.background='rgba(255,161,22,0.07)'">
                                    <div style="width: 32px; height: 32px; background: #ffa116; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;"><i class="fa-solid fa-code" style="color:#fff; font-size:14px;"></i></div>
                                    <div><div style="color: #fff; font-weight: 600; font-size: 13px;">LeetCode Solutions</div><div style="color: #64748b; font-size: 11px;">Community editorial &amp; discussions</div></div>
                                    <i class="fa-solid fa-arrow-up-right-from-square" style="color:#64748b; margin-left:auto; font-size:11px;"></i>
                                </a>
                                <a href="${youtubeUrl}" target="_blank" style="display: flex; align-items: center; gap: 12px; background: rgba(255,0,0,0.07); border: 1px solid rgba(255,0,0,0.2); border-radius: 10px; padding: 12px 16px; text-decoration: none; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,0,0,0.14)'" onmouseout="this.style.background='rgba(255,0,0,0.07)'">
                                    <div style="width: 32px; height: 32px; background: #ff0000; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;"><i class="fa-brands fa-youtube" style="color:#fff; font-size:14px;"></i></div>
                                    <div><div style="color: #fff; font-weight: 600; font-size: 13px;">YouTube Explanation</div><div style="color: #64748b; font-size: 11px;">Video walkthroughs in ${langLabel}</div></div>
                                    <i class="fa-solid fa-arrow-up-right-from-square" style="color:#64748b; margin-left:auto; font-size:11px;"></i>
                                </a>
                            </div>
                        </div>`;
                    })()}
                </div>

            </div>
        </div>

        <!-- Right Side: Code & Test (55%) -->
        <div class="ca-right" style="width: 55%; display: flex; flex-direction: column; gap: 8px; overflow: hidden;">
            
            <!-- Editor Section -->
            <div style="flex: 1; display: flex; flex-direction: column; background: #000000; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.8); border: 1px solid rgba(255,255,255,0.05);">
                <!-- Toolbar -->
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 16px; background: #0a0a0a; flex-shrink: 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                    
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="position: relative;" id="ca-lang-wrapper">
                            <div id="ca-lang-display" onclick="window.toggleLangDropdown()" style="display: flex; align-items: center; gap: 7px; background: rgba(255,255,255,0.05); border-radius: 6px; padding: 5px 10px; cursor: pointer; border: 1px solid rgba(255,255,255,0.08); min-width: 110px; user-select: none; transition: border-color 0.2s;">
                                <img id="ca-lang-logo" src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg" style="width: 18px; height: 18px; object-fit: contain;" />
                                <span id="ca-lang-name" style="color: #eff1f6; font-size: 13px; font-weight: 500; flex: 1;">Java</span>
                                <i class="fa-solid fa-chevron-down" style="color: #8c8c8c; font-size: 9px;"></i>
                            </div>
                            <div id="ca-lang-dropdown" style="display: none; position: absolute; top: calc(100% + 6px); left: 0; background: #161b27; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; overflow: hidden; z-index: 9999; min-width: 160px; box-shadow: 0 8px 32px rgba(0,0,0,0.5);">
                                <div class="ca-lang-opt" data-lang="c" data-ver="gcc-13.2.0-c" data-logo="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/c/c-original.svg" data-name="C" onclick="window.selectLang(this)" style="display:flex;align-items:center;gap:10px;padding:9px 14px;cursor:pointer;transition:background 0.15s;" onmouseover="this.style.background='rgba(255,255,255,0.08)'" onmouseout="this.style.background='transparent'">
                                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/c/c-original.svg" style="width:20px;height:20px;object-fit:contain;" /><span style="color:#e2e8f0;font-size:13px;font-weight:500;">C</span>
                                </div>
                                <div class="ca-lang-opt" data-lang="cpp" data-ver="gcc-13.2.0" data-logo="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg" data-name="C++" onclick="window.selectLang(this)" style="display:flex;align-items:center;gap:10px;padding:9px 14px;cursor:pointer;background:rgba(56,189,248,0.08);transition:background 0.15s;" onmouseover="this.style.background='rgba(255,255,255,0.08)'" onmouseout="this.style.background='transparent'">
                                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg" style="width:20px;height:20px;object-fit:contain;" /><span style="color:#e2e8f0;font-size:13px;font-weight:500;">C++</span>
                                </div>
                                <div class="ca-lang-opt" data-lang="csharp" data-ver="mono-6.12.0.122" data-logo="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/csharp/csharp-original.svg" data-name="C#" onclick="window.selectLang(this)" style="display:flex;align-items:center;gap:10px;padding:9px 14px;cursor:pointer;transition:background 0.15s;" onmouseover="this.style.background='rgba(255,255,255,0.08)'" onmouseout="this.style.background='transparent'">
                                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/csharp/csharp-original.svg" style="width:20px;height:20px;object-fit:contain;" /><span style="color:#e2e8f0;font-size:13px;font-weight:500;">C#</span>
                                </div>
                                <div class="ca-lang-opt" data-lang="java" data-ver="openjdk-jdk-22+36" data-logo="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg" data-name="Java" onclick="window.selectLang(this)" style="display:flex;align-items:center;gap:10px;padding:9px 14px;cursor:pointer;transition:background 0.15s;" onmouseover="this.style.background='rgba(255,255,255,0.08)'" onmouseout="this.style.background='transparent'">
                                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg" style="width:20px;height:20px;object-fit:contain;" /><span style="color:#e2e8f0;font-size:13px;font-weight:500;">Java</span>
                                </div>
                                <div class="ca-lang-opt" data-lang="python" data-ver="cpython-3.14.0" data-logo="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg" data-name="Python 3" onclick="window.selectLang(this)" style="display:flex;align-items:center;gap:10px;padding:9px 14px;cursor:pointer;transition:background 0.15s;" onmouseover="this.style.background='rgba(255,255,255,0.08)'" onmouseout="this.style.background='transparent'">
                                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg" style="width:20px;height:20px;object-fit:contain;" /><span style="color:#e2e8f0;font-size:13px;font-weight:500;">Python 3</span>
                                </div>
                            </div>
                            <!-- hidden select for compatibility -->
                            <select id="ca-lang" style="display:none;" onchange="window.changeCodingLanguage()">
                                <option value="c" data-ver="gcc-13.2.0-c">C</option>
                                <option value="cpp" data-ver="gcc-13.2.0">C++</option>
                                <option value="csharp" data-ver="mono-6.12.0.122">C#</option>
                                <option value="java" data-ver="openjdk-jdk-22+36" selected>Java</option>
                                <option value="python" data-ver="cpython-3.14.0">Python 3</option>
                            </select>
                        </div>
                        
                        <div style="width: 1px; height: 14px; background: rgba(255,255,255,0.1); margin: 0 4px;"></div>
                        
                        <div style="display: flex; align-items: center; cursor: pointer; padding: 4px 6px; border-radius: 4px;" class="ca-hover-btn">
                            <select id="ca-fontsize" style="-webkit-appearance: none; appearance: none; background: transparent; color: #a3a3a3; border: none; font-size: 12px; font-weight: 500; outline: none; cursor: pointer;" onchange="window.changeEditorConfig()">
                                <option value="12px" style="background:#0a0a0a;color:#fff;">12px</option>
                                <option value="14px" selected style="background:#0a0a0a;color:#fff;">14px</option>
                                <option value="16px" style="background:#0a0a0a;color:#fff;">16px</option>
                                <option value="18px" style="background:#0a0a0a;color:#fff;">18px</option>
                            </select>
                            <i class="fa-solid fa-chevron-down" style="color: #a3a3a3; font-size: 10px; margin-left: 2px; pointer-events: none;"></i>
                        </div>
                        <button title="Format Code" onclick="window.formatUserCode()" style="background: transparent; border: none; color: #a3a3a3; cursor: pointer; padding: 4px 6px; border-radius: 4px;" class="ca-hover-btn"><i class="fa-solid fa-code"></i></button>
                        <button title="Toggle Editor Theme" onclick="const ed = document.getElementById('ca-editor'); if(ed) { ed.style.background = (ed.style.background === 'rgb(30, 30, 36)' || ed.style.background === '#1e1e24') ? '#0a0a0a' : '#1e1e24'; }" style="background: transparent; border: none; color: #a3a3a3; cursor: pointer; padding: 4px 6px; border-radius: 4px;" class="ca-hover-btn"><i class="fa-solid fa-paint-roller"></i></button>
                    </div>
                    
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <button title="Reset Code" onclick="window.resetUserCode()" style="background: transparent; border: none; color: #8c8c8c; cursor: pointer; font-size: 14px; transition: color 0.2s; margin-right: 8px;"><i class="fa-solid fa-rotate-right"></i></button>
                        <button id="btn-run-code" onclick="window.runUserCode(false)" style="background: rgba(255,255,255,0.1); color: #ffffff; border: none; border-radius: 4px; padding: 6px 14px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.2)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'">
                            <i class="fa-solid fa-play" style="font-size: 11px;"></i> Run Code
                        </button>
                        ${isActuallyToday ? `
                        <button id="btn-submit-code" onclick="window.runUserCode(true)" style="background: #2cbb5d; color: #ffffff; border: none; border-radius: 4px; padding: 6px 14px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: filter 0.2s;" onmouseover="this.style.filter='brightness(1.1)'" onmouseout="this.style.filter='none'">
                            <i class="fa-solid fa-cloud-arrow-up" style="font-size: 11px;"></i> Submit
                        </button>
                        ` : ''}
                    </div>
                </div>

                <!-- Tab under toolbar -->
                <div style="display: flex; background: #0a0a0a; padding: 0 16px;">
                    <div style="padding: 6px 16px; background: #000000; color: #eff1f6; font-size: 12px; font-weight: 500; border-radius: 6px 6px 0 0; border: 1px solid rgba(255,255,255,0.05); border-bottom: none;">
                        Solution
                    </div>
                </div>

                <!-- Editor Area -->
                <div style="flex: 1; position: relative; background: #000000;">
                    <textarea id="ca-editor" style="display: none;"></textarea>
                </div>
            </div>

            <!-- Console / Test Cases Section -->
            <div style="height: 250px; display: flex; flex-direction: column; background: #000000; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.8); flex-shrink: 0; border: 1px solid rgba(255,255,255,0.05);">
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0 16px; background: #0a0a0a; border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <div style="display: flex; gap: 4px;">
                        <div id="ca-tab-tc" onclick="window.switchConsoleTab('tc')" style="padding: 10px 12px; color: #ffc01e; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; border-bottom: 2px solid #ffc01e; transition: 0.2s;">
                            <i class="fa-solid fa-square-check"></i> Test Cases
                        </div>
                        <div id="ca-tab-console" onclick="window.switchConsoleTab('console')" style="padding: 10px 12px; color: #8c8c8c; font-size: 13px; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 6px; border-bottom: 2px solid transparent; transition: 0.2s;">
                            <i class="fa-solid fa-terminal"></i> Console Output
                        </div>
                    </div>
                </div>
                
                <div style="flex: 1; position: relative; background: #000000;">
                    <!-- Test Cases View -->
                    <div id="ca-view-tc" style="position: absolute; top:0; left:0; right:0; bottom:0; padding: 16px; overflow-y: auto;">
                        ${!isSandbox && problem.testCases.length > 0 ? `
                        <div id="ca-tc-pills" style="display: flex; gap: 8px; margin-bottom: 16px;">
                            ${problem.testCases.map((tc, i) => `<div onclick="window.selectTestCase(${i})" style="background: ${i===0 ? '#1f1f1f' : '#0a0a0a'}; color: ${i===0 ? '#eff1f6' : '#8c8c8c'}; padding: 6px 12px; border-radius: 6px; font-size: 12px; border: 1px solid rgba(255,255,255,0.05); cursor: pointer; transition: 0.2s;">Case ${i+1}</div>`).join('')}
                        </div>
                        <div style="color: #eff1f6; font-size: 13px;">
                            <div style="margin-bottom: 12px;">
                                <div style="color: #8c8c8c; font-size: 12px; margin-bottom: 4px;">Input:</div>
                                <div id="ca-tc-in" style="background: #050505; border: 1px solid rgba(255,255,255,0.03); padding: 10px; border-radius: 6px; font-family: monospace; white-space: pre-wrap;">${problem.testCases[0]?.input !== undefined ? problem.testCases[0]?.input : (problem.testCases[0]?.i !== undefined ? problem.testCases[0]?.i : '')}</div>
                            </div>
                            <div>
                                <div style="color: #8c8c8c; font-size: 12px; margin-bottom: 4px;">Expected Output:</div>
                                <div id="ca-tc-out" style="background: #050505; border: 1px solid rgba(255,255,255,0.03); padding: 10px; border-radius: 6px; font-family: monospace; white-space: pre-wrap;">${problem.testCases[0]?.output !== undefined ? problem.testCases[0]?.output : (problem.testCases[0]?.o !== undefined ? problem.testCases[0]?.o : '')}</div>
                            </div>
                        </div>
                        ` : `<div style="color: #8c8c8c; font-size: 13px;">No test cases available.</div>`}
                    </div>
                    
                    <!-- Console View -->
                    <div id="ca-console" style="display: none; position: absolute; top:0; left:0; right:0; bottom:0; color: #d4d4d4; padding: 16px 20px; overflow-y: auto; font-family: 'SFMono-Regular', Consolas, monospace; font-size: 13px; line-height: 1.6; white-space: pre-wrap;">Ready to execute...</div>
                </div>
            </div>

        </div>

    </div>
    
    <style>
        /* Premium Editor Overrides */
        .ca-hover-btn:hover { background: rgba(255,255,255,0.1) !important; color: #fff !important; }
        .ca-hover-btn:hover * { color: #fff !important; }
        
        /* VS Code Dark+ Theme Simulation for CodeMirror */
        .CodeMirror, .cm-s-dracula.CodeMirror { font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace !important; font-size: 14px !important; background: transparent !important; color: #d4d4d4 !important; height: 100% !important; position: absolute !important; top: 0; left: 0; width: 100%; }
        .CodeMirror-scroll { overflow-y: auto !important; overflow-x: auto !important; }
        .CodeMirror-gutters, .cm-s-dracula .CodeMirror-gutters { background: transparent !important; border-right: none !important; }
        .CodeMirror-linenumber { color: #858585 !important; }
        .CodeMirror-empty.CodeMirror-focused { color: inherit !important; }
        .CodeMirror-placeholder { color: #6a9955 !important; font-style: italic !important; }
        .CodeMirror-cursor { border-left: 2px solid #aeafad !important; }
        .cm-s-dracula .cm-keyword { color: #569cd6 !important; }
        .cm-s-dracula .cm-def { color: #dcdcaa !important; }
        .cm-s-dracula .cm-variable { color: #9cdcfe !important; }
        .cm-s-dracula .cm-variable-2 { color: #9cdcfe !important; }
        .cm-s-dracula .cm-variable-3, .cm-s-dracula .cm-type { color: #4ec9b0 !important; }
        .cm-s-dracula .cm-property { color: #9cdcfe !important; }
        .cm-s-dracula .cm-operator { color: #d4d4d4 !important; }
        .cm-s-dracula .cm-string { color: #ce9178 !important; }
        .cm-s-dracula .cm-string-2 { color: #ce9178 !important; }
        .cm-s-dracula .cm-comment { color: #6a9955 !important; font-style: normal !important; }
        .cm-s-dracula .cm-number { color: #b5cea8 !important; }
        .cm-s-dracula .cm-meta { color: #c586c0 !important; }
        
        /* Scrollbar Styling for Editor and Console */
        .ca-left::-webkit-scrollbar, .ca-right ::-webkit-scrollbar { width: 8px; height: 8px; }
        .ca-left::-webkit-scrollbar-track, .ca-right ::-webkit-scrollbar-track { background: transparent; }
        .ca-left::-webkit-scrollbar-thumb, .ca-right ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .ca-left::-webkit-scrollbar-thumb:hover, .ca-right ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        
        /* Fullscreen Mode */
        .ca-fullscreen-mode {
            position: fixed !important;
            top: 0 !important; left: 0 !important;
            width: 100vw !important; height: 100vh !important;
            z-index: 99999 !important;
            background: #1e1e1e !important;
            padding: 1rem !important;
            box-sizing: border-box !important;
        }
    </style>
    `;
}

window.getCaStarterCode = function(problem, lang) {
    if (!problem) return "// Write your algorithmic logic here...\n\n";
    
    const words = (problem.title || "solution").replace(/[^a-zA-Z0-9\s]/g, "").trim().split(/\s+/);
    const camelName = words[0].toLowerCase() + words.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
    const snakeName = words.map(w => w.toLowerCase()).join('_');
    
    // Extract variables from test case input dynamically
    const sampleInput = (problem.testCases && problem.testCases[0]) ? (problem.testCases[0].i || problem.testCases[0].input || "") : "";
    const varMatches = [];
    const varReg = /([a-zA-Z0-9_]+)\s*=\s*(\[[^\]]*\]|"[^"]*"|'[^']*'|-?\d+(?:\.\d+)?|true|false|null)/g;
    let m;
    while ((m = varReg.exec(sampleInput)) !== null) {
        varMatches.push({ name: m[1], val: m[2] });
    }
    if (varMatches.length === 0) {
        varMatches.push({ name: "input", val: '""' });
    }
    
    if (lang === 'javascript') {
        const paramsDoc = varMatches.map(v => ` * @param {any} ${v.name}`).join('\n');
        const paramsList = varMatches.map(v => v.name).join(', ');
        return `/**\n${paramsDoc}\n * @return {any}\n */\nfunction ${camelName}(${paramsList}) {\n    // Write your algorithmic logic here:\n    \n}`;
    }
    if (lang === 'python' || lang === 'python3') {
        const paramsList = varMatches.map(v => v.name).join(', ');
        return `def ${snakeName}(${paramsList}):\n    # Write your algorithmic logic here:\n    pass`;
    }
    if (lang === 'cpp' || lang === 'c++') {
        function inferCppType(valStr) {
            if (!valStr) return 'int';
            valStr = valStr.trim();
            if (valStr.startsWith('[[')) return 'vector<vector<int>>&';
            if (valStr.startsWith('[')) {
                if (valStr.includes('"') || valStr.includes("'")) return 'vector<string>&';
                return 'vector<int>&';
            }
            if (valStr.startsWith('"') || valStr.startsWith("'")) return 'string';
            if (valStr === 'true' || valStr === 'false') return 'bool';
            if (valStr.includes('.')) return 'double';
            return 'int';
        }
        const cppParams = varMatches.map(v => `${inferCppType(v.val)} ${v.name}`).join(', ');
        const sampleOut = (problem.testCases && problem.testCases[0]) ? (problem.testCases[0].o || problem.testCases[0].output || "") : "";
        let cppRet = "vector<int>";
        if (sampleOut.startsWith('[[')) cppRet = "vector<vector<int>>";
        else if (sampleOut.startsWith('[')) cppRet = (sampleOut.includes('"') || sampleOut.includes("'")) ? "vector<string>" : "vector<int>";
        else if (sampleOut.startsWith('"') || sampleOut.startsWith("'")) cppRet = "string";
        else if (sampleOut === 'true' || sampleOut === 'false') cppRet = "bool";
        else if (sampleOut.includes('.')) cppRet = "double";
        else if (/^-?\d+$/.test(sampleOut)) cppRet = "int";
        
        return `${cppRet} ${camelName}(${cppParams}) {\n    // Write your algorithmic logic here:\n    \n    return {};\n}`;
    }
    if (lang === 'java') {
        function inferJavaType(valStr) {
            if (!valStr) return 'int';
            valStr = valStr.trim();
            if (valStr.startsWith('[[')) return 'int[][]';
            if (valStr.startsWith('[')) {
                if (valStr.includes('"') || valStr.includes("'")) return 'String[]';
                return 'int[]';
            }
            if (valStr.startsWith('"') || valStr.startsWith("'")) return 'String';
            if (valStr === 'true' || valStr === 'false') return 'boolean';
            if (valStr.includes('.')) return 'double';
            return 'int';
        }
        const javaParams = varMatches.map(v => `${inferJavaType(v.val)} ${v.name}`).join(', ');
        const sampleOut = (problem.testCases && problem.testCases[0]) ? (problem.testCases[0].o || problem.testCases[0].output || "") : "";
        let javaRet = "int[]";
        if (sampleOut.startsWith('[[')) javaRet = "int[][]";
        else if (sampleOut.startsWith('[')) javaRet = (sampleOut.includes('"') || sampleOut.includes("'")) ? "String[]" : "int[]";
        else if (sampleOut.startsWith('"') || sampleOut.startsWith("'")) javaRet = "String";
        else if (sampleOut === 'true' || sampleOut === 'false') javaRet = "boolean";
        else if (sampleOut.includes('.')) javaRet = "double";
        else if (/^-?\d+$/.test(sampleOut)) javaRet = "int";
        
        return `public static ${javaRet} ${camelName}(${javaParams}) {\n    // Write your algorithmic logic here:\n    \n    return null;\n}`;
    }
    
    return `// Problem: ${problem.title}\n// Write your solution here in ${lang}...\n`;
};

function initEditor() {
    const ta = document.getElementById('ca-editor');
    if (!ta) return;
    
    editorInstance = CodeMirror.fromTextArea(ta, {
        mode: "text/x-csrc",
        theme: "dracula",
        lineNumbers: true,
        indentUnit: 4,
        matchBrackets: true,
        autoCloseBrackets: true,
        placeholder: "// Write your logic here..."
    });
    
    editorInstance.setSize("100%", "100%");
    
    const sel = document.getElementById('ca-lang');
    const lang = sel ? sel.value : 'cpp';
    const problem = (window.caActiveProblemIndex !== null && window.caActiveProblemIndex !== -1 && typeof codingProblems !== 'undefined') ? codingProblems[window.caActiveProblemIndex] : null;
    if (problem && window.getCaStarterCode) {
        editorInstance.setValue(window.getCaStarterCode(problem, lang));
    } else {
        editorInstance.setValue("");
    }
}

window.startSpecificProblem = async function(index, isContest, contestQi) {
    window.caActiveProblemIndex = index;
    window.caIsContestProblem = !!isContest;
    window.caContestQi = (isContest && contestQi !== undefined) ? contestQi : null;
    if (window.openCodingArena) {
        window.openCodingArena();
    } else {
        const contentArea = document.getElementById('tab-content');
        if (contentArea) {
            contentArea.innerHTML = window.caLoadingHTML;
            const html = await renderCodingArena();
            contentArea.innerHTML = html;
        }
    }
}

window.resetUserCode = function() {
    if (editorInstance) {
        const sel = document.getElementById('ca-lang');
        const lang = sel ? sel.value : 'cpp';
        const problem = (window.caActiveProblemIndex !== null && window.caActiveProblemIndex !== -1 && typeof codingProblems !== 'undefined') ? codingProblems[window.caActiveProblemIndex] : null;
        if (problem && window.getCaStarterCode) {
            editorInstance.setValue(window.getCaStarterCode(problem, lang));
        } else {
            editorInstance.setValue("");
        }
    }
}

window.formatUserCode = function() {
    if (editorInstance) {
        let totalLines = editorInstance.lineCount();
        for (let i = 0; i < totalLines; i++) {
            editorInstance.indentLine(i, "smart");
        }
    }
}

window.toggleFullscreenEditor = function() {
    const container = document.querySelector('.coding-arena-container');
    if (container) {
        container.classList.toggle('ca-fullscreen-mode');
        // Let CodeMirror adapt to new size
        setTimeout(() => { if (editorInstance) editorInstance.refresh(); }, 100);
    }
}

window.switchCaTab = function(tabName) {
    const tabs = ['desc', 'subs', 'hints', 'solution'];
    tabs.forEach(t => {
        const tb = document.getElementById('ca-tab-' + t);
        const vw = document.getElementById('ca-view-' + t);
        if(tb && vw) {
            if(t === tabName) {
                tb.style.color = '#ffc01e';
                tb.style.borderBottomColor = '#ffc01e';
                tb.style.fontWeight = '600';
                vw.style.display = 'block';
            } else {
                tb.style.color = '#8c8c8c';
                tb.style.borderBottomColor = 'transparent';
                tb.style.fontWeight = '500';
                vw.style.display = 'none';
            }
        }
    });
}

window.switchConsoleTab = function(tabName) {
    const tabs = ['tc', 'console'];
    tabs.forEach(t => {
        const tb = document.getElementById('ca-tab-' + t);
        const vw = document.getElementById(t === 'console' ? 'ca-console' : 'ca-view-' + t);
        if(tb && vw) {
            if(t === tabName) {
                tb.style.color = '#ffc01e';
                tb.style.borderBottomColor = '#ffc01e';
                tb.style.fontWeight = '600';
                vw.style.display = 'block';
            } else {
                tb.style.color = '#8c8c8c';
                tb.style.borderBottomColor = 'transparent';
                tb.style.fontWeight = '500';
                vw.style.display = 'none';
            }
        }
    });
}

window.selectTestCase = function(idx) {
    if (window.caActiveProblemIndex === -1) return;
    const problem = window.caCodingProblems ? window.caCodingProblems[window.caActiveProblemIndex] : null;
    if (!problem || !problem.testCases || problem.testCases.length <= idx) return;

    // Update active state of pills
    const pillContainer = document.getElementById('ca-tc-pills');
    if (pillContainer) {
        const pills = pillContainer.children;
        for(let i=0; i<pills.length; i++) {
            if(i === idx) {
                pills[i].style.background = 'rgba(255,255,255,0.1)';
                pills[i].style.color = '#eff1f6';
            } else {
                pills[i].style.background = 'rgba(255,255,255,0.03)';
                pills[i].style.color = '#8c8c8c';
            }
        }
    }
    
    // Update Input/Output view
    const inDiv = document.getElementById('ca-tc-in');
    const outDiv = document.getElementById('ca-tc-out');
    if (inDiv) inDiv.innerText = problem.testCases[idx].input !== undefined ? problem.testCases[idx].input : (problem.testCases[idx].i !== undefined ? problem.testCases[idx].i : '');
    if (outDiv) outDiv.innerText = problem.testCases[idx].output !== undefined ? problem.testCases[idx].output : (problem.testCases[idx].o !== undefined ? problem.testCases[idx].o : '');
}
window.backToExplorer = async function() {
    window.caActiveProblemIndex = null;
    if (window.openCodingArena) {
        window.openCodingArena();
    } else {
        const contentArea = document.getElementById('tab-content');
        if (contentArea) {
            contentArea.innerHTML = window.caLoadingHTML;
            const html = await renderCodingArena();
            contentArea.innerHTML = html;
        }
    }
}

window.caNavigateProblem = async function(dir) {
    if (typeof codingProblems === 'undefined' || !codingProblems.length) return;
    if (window.caActiveProblemIndex === null || window.caActiveProblemIndex === -1) return;

    const total = codingProblems.length;
    let next = window.caActiveProblemIndex + dir;
    if (next < 0) next = total - 1;         // wrap to last
    if (next >= total) next = 0;             // wrap to first

    window.caActiveProblemIndex = next;

    // Re-render the arena in-place (no page reload)
    if (window.openCodingArena) {
        window.openCodingArena();
    } else {
        const contentArea = document.getElementById('tab-content');
        if (contentArea) {
            contentArea.innerHTML = `<div style="padding: 4rem; text-align: center;"><div class="loader-pro"></div><p style="margin-top:1rem; color:var(--text-dim);">Loading...</p></div>`;
            const html = await renderCodingArena();
            contentArea.innerHTML = html;
        }
    }
};

window.caUpdateProblemCounter = function() {
    const counter = document.getElementById('ca-prob-counter');
    const prevBtn = document.getElementById('ca-btn-prev');
    const nextBtn = document.getElementById('ca-btn-next');
    if (!counter) return;
    if (typeof codingProblems === 'undefined' || window.caActiveProblemIndex === null || window.caActiveProblemIndex === -1) {
        counter.textContent = '';
        return;
    }
    const cur  = window.caActiveProblemIndex + 1;
    const tot  = codingProblems.length;
    counter.textContent = `${cur} / ${tot}`;
    if (prevBtn) prevBtn.style.opacity = cur <= 1 ? '0.35' : '1';
    if (nextBtn) nextBtn.style.opacity = cur >= tot ? '0.35' : '1';
};

// Auto-update counter whenever the arena is shown
(function() {
    const _orig = window.openCodingArena;
    if (_orig) {
        window.openCodingArena = function(...args) {
            const r = _orig(...args);
            setTimeout(window.caUpdateProblemCounter, 150);
            return r;
        };
    }
    setTimeout(window.caUpdateProblemCounter, 400);
})();


window.toggleSidebarArena = function() {
    const sidebar = document.querySelector('.sidebar');
    const topBar = document.querySelector('.top-bar');
    if (sidebar) {
        if (sidebar.style.display === 'none') {
            sidebar.style.display = '';
            if (topBar) topBar.style.display = '';
        } else {
            sidebar.style.display = 'none';
            if (topBar) topBar.style.display = 'none';
        }
    }
}

window.changeEditorConfig = function() {
    if (!editorInstance) return;
    const sizeSel = document.getElementById('ca-fontsize');
    const themeSel = document.getElementById('ca-theme');
    const container = document.querySelector('.coding-arena-container');
    
    if (sizeSel) {
        editorInstance.getWrapperElement().style.fontSize = sizeSel.value;
        editorInstance.refresh();
    }
    if (themeSel) {
        editorInstance.setOption("theme", themeSel.value);
        if (themeSel.value === 'default') {
            if (container) container.classList.add('ca-light-theme');
        } else {
            if (container) container.classList.remove('ca-light-theme');
        }
    }
}

// ── Custom Language Dropdown ─────────────────────────────────────────────────
window.toggleLangDropdown = function() {
    const dd = document.getElementById('ca-lang-dropdown');
    if (!dd) return;
    const isOpen = dd.style.display !== 'none';
    dd.style.display = isOpen ? 'none' : 'block';
    if (!isOpen) {
        setTimeout(() => {
            document.addEventListener('click', function handler(e) {
                const wrapper = document.getElementById('ca-lang-wrapper');
                if (wrapper && !wrapper.contains(e.target)) {
                    dd.style.display = 'none';
                    document.removeEventListener('click', handler);
                }
            });
        }, 0);
    }
};

window.selectLang = function(el) {
    const lang = el.dataset.lang;
    const logo = el.dataset.logo;
    const name = el.dataset.name;

    const logoImg = document.getElementById('ca-lang-logo');
    const nameEl  = document.getElementById('ca-lang-name');
    if (logoImg) logoImg.src = logo;
    if (nameEl)  nameEl.textContent = name;

    const sel = document.getElementById('ca-lang');
    if (sel) {
        for (let opt of sel.options) {
            if (opt.value === lang) { opt.selected = true; break; }
        }
    }

    const dd = document.getElementById('ca-lang-dropdown');
    if (dd) dd.style.display = 'none';

    window.changeCodingLanguage();
};

(function initLangDropdown() {
    const logos = {
        c:          'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/c/c-original.svg',
        cpp:        'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg',
        csharp:     'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/csharp/csharp-original.svg',
        java:       'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg',
        javascript: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg',
        python:     'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg',
        rust:       'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/rust/rust-original.svg',
        go:         'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/go/go-original-wordmark.svg',
    };
    const names = { c:'C', cpp:'C++', csharp:'C#', java:'Java', javascript:'JavaScript', python:'Python 3', rust:'Rust', go:'Go' };
    const tryInit = () => {
        const sel    = document.getElementById('ca-lang');
        const logoEl = document.getElementById('ca-lang-logo');
        const nameEl = document.getElementById('ca-lang-name');
        if (!sel || !logoEl || !nameEl) return;
        const cur = sel.value || 'java';
        logoEl.src = logos[cur] || '';
        nameEl.textContent = names[cur] || cur;
    };
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', tryInit);
    } else {
        setTimeout(tryInit, 300);
    }
})();
// ────────────────────────────────────────────────────────────────────────────

window.changeCodingLanguage = function() {
    const sel = document.getElementById('ca-lang');
    let mode = 'text/plain';
    switch (sel.value) {
        case 'c': mode = 'text/x-csrc'; break;
        case 'cpp': mode = 'text/x-c++src'; break;
        case 'csharp': mode = 'text/x-csharp'; break;
        case 'java': mode = 'text/x-java'; break;
        case 'javascript': mode = 'javascript'; break;
        case 'python': mode = 'python'; break;
        case 'rust': mode = 'rust'; break;
        case 'go': mode = 'go'; break;
        case 'swift': mode = 'swift'; break;
    }
    if (editorInstance) {
        editorInstance.setOption("mode", mode);
        const problem = (window.caActiveProblemIndex !== null && window.caActiveProblemIndex !== -1 && typeof codingProblems !== 'undefined') ? codingProblems[window.caActiveProblemIndex] : null;
        if (problem && window.getCaStarterCode) {
            editorInstance.setValue(window.getCaStarterCode(problem, sel.value));
        }
    }
}

// ── Piston API Fallback (universal compiler for all languages) ────────────────
window.executeWithPiston = async function(code, lang, stdin) {
    // Piston language name + version mapping
    const PISTON_MAP = {
        'python': { language: 'python', version: '3.10.0' },
        'python3': { language: 'python', version: '3.10.0' },
        'javascript': { language: 'javascript', version: '18.15.0' },
        'js': { language: 'javascript', version: '18.15.0' },
        'java': { language: 'java', version: '15.0.2' },
        'c': { language: 'c', version: '10.2.0' },
        'cpp': { language: 'c++', version: '10.2.0' },
        'c++': { language: 'c++', version: '10.2.0' },
        'csharp': { language: 'csharp', version: '6.12.0' },
        'rust': { language: 'rust', version: '1.50.0' },
        'go': { language: 'go', version: '1.16.2' },
        'swift': { language: 'swift', version: '5.3.3' },
        'kotlin': { language: 'kotlin', version: '1.4.31-1' },
        'ruby': { language: 'ruby', version: '3.0.1' },
        'php': { language: 'php', version: '8.2.3' },
        'perl': { language: 'perl', version: '5.36.0' },
        'r': { language: 'r', version: '4.1.1' },
        'dart': { language: 'dart', version: '2.19.6' },
        'typescript': { language: 'typescript', version: '5.0.3' },
        'scala': { language: 'scala', version: '3.2.2' },
    };
    const pistonLang = PISTON_MAP[lang.toLowerCase()] || { language: lang, version: '*' };
    
    try {
        const res = await fetch('https://emkc.org/api/v2/piston/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                language: pistonLang.language,
                version: pistonLang.version,
                files: [{ name: 'main', content: code }],
                stdin: stdin || ''
            })
        });
        if (!res.ok) throw new Error(`Piston API error: ${res.status}`);
        const data = await res.json();
        const run = data.run || {};
        const compile = data.compile || {};
        return {
            status: (run.code !== 0 || compile.code !== 0) ? '1' : '0',
            program_output: run.stdout || '',
            program_error: run.stderr || '',
            compiler_error: compile.stderr || compile.output || ''
        };
    } catch (e) {
        throw new Error(`Execution failed: ${e.message}`);
    }
};

window.executeWithPaiza = async function(code, lang, stdin) {
    // Languages that Paiza.io doesn't support well — use Piston instead
    const PISTON_LANGS = ['rust', 'go', 'swift', 'kotlin', 'scala', 'ruby', 'php', 'perl', 'r', 'dart'];
    const PAIZA_LANG_MAP = { 'c++': 'cpp', 'python3': 'python3', 'python': 'python3', 'c#': 'csharp', 'csharp': 'csharp', 'javascript': 'javascript', 'js': 'javascript' };
    let paizaLang = PAIZA_LANG_MAP[lang] || lang;
    if (lang === 'python' || lang === 'python3') paizaLang = 'python3';
    
    // Use Piston for unsupported Paiza languages
    if (PISTON_LANGS.includes(lang.toLowerCase())) {
        return await window.executeWithPiston(code, lang, stdin);
    }
    
    let execCode = code;
    const problem = (window.caActiveProblemIndex !== null && window.caActiveProblemIndex !== -1 && typeof codingProblems !== 'undefined') ? codingProblems[window.caActiveProblemIndex] : null;
    if (problem) {
        const words = (problem.title || "solution").replace(/[^a-zA-Z0-9\s]/g, "").trim().split(/\s+/);
        const camelName = words[0].toLowerCase() + words.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
        const snakeName = words.map(w => w.toLowerCase()).join('_');

        const sampleInput = (problem.testCases && problem.testCases[0]) ? (problem.testCases[0].i || problem.testCases[0].input || "") : "";
        const varMatches = [];
        const varReg = /([a-zA-Z0-9_]+)\s*=\s*(\[[^\]]*\]|"[^"]*"|'[^']*'|-?\d+(?:\.\d+)?|true|false|null)/g;
        let m;
        while ((m = varReg.exec(sampleInput)) !== null) {
            varMatches.push({ name: m[1], val: m[2] });
        }
        if (varMatches.length === 0) {
            varMatches.push({ name: "input", val: '""' });
        }

        const sampleOut = (problem.testCases && problem.testCases[0]) ? (problem.testCases[0].o || problem.testCases[0].output || "") : "";
        if (lang === 'javascript') {
            if (!execCode.includes('fs.readFileSync')) {
                execCode = execCode + `\nconst fs = require('fs');\nconst __in = fs.readFileSync(0, 'utf-8').trim();\nconst __reg = /([a-zA-Z0-9_]+)\\s*=\\s*(\\[[^\\]]*\\]|"[^"]*"|'[^']*'|-?\\d+(?:\\.\\d+)?|true|false|null)/g;\nlet __m;\nconst __args = [];\nwhile ((__m = __reg.exec(__in)) !== null) {\n    __args.push(JSON.parse(__m[2]));\n}\nif (__args.length > 0) {\n    const __res = typeof ${camelName} === 'function' ? ${camelName}(...__args) : undefined;\n    if (__res !== undefined) console.log(typeof __res === 'object' || (typeof __res === 'string' && "${sampleOut}".startsWith('"')) ? JSON.stringify(__res) : __res);\n}\n`;
            }
        } else if (lang === 'python' || lang === 'python3') {
            if (!execCode.includes('sys.stdin')) {
                // ── Extract real Python class name and function name dynamically ──
                const classMatch = execCode.match(/class\s+([a-zA-Z0-9_]+)/);
                const pyClassName = classMatch ? classMatch[1] : null;

                const funcRegex = /def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g;
                let match;
                let pyFuncName = snakeName; // default fallback
                const foundPyFuncs = [];
                const excludedKeywords = new Set(['__init__', 'main']);
                while ((match = funcRegex.exec(execCode)) !== null) {
                    const fName = match[1];
                    if (!excludedKeywords.has(fName)) {
                        foundPyFuncs.push(fName);
                    }
                }
                if (foundPyFuncs.length > 0) {
                    const exactOrPartialMatch = foundPyFuncs.find(f => 
                        f.toLowerCase() === snakeName.toLowerCase() || 
                        f.toLowerCase() === camelName.toLowerCase()
                    );
                    if (exactOrPartialMatch) {
                        pyFuncName = exactOrPartialMatch;
                    } else {
                        pyFuncName = foundPyFuncs[foundPyFuncs.length - 1];
                    }
                }

                // Append the dynamic runner code
                execCode = execCode + `
import sys, json, re
__s = sys.stdin.read().strip()
__pat = r"""([a-zA-Z0-9_]+)\\s*=\\s*(\\[[^\\]]*\\]|"[^"]*"|'[^']*'|-?\\d+(?:\\.\\d+)?|true|false|null)"""
__args = [json.loads(v.replace("'", '"')) for k, v in re.findall(__pat, __s)]

if ${pyClassName ? `'${pyClassName}'` : 'None'}:
    if '${pyClassName}' in globals():
        __solver = globals()['${pyClassName}']()
        if hasattr(__solver, '${pyFuncName}'):
            __res = getattr(__solver, '${pyFuncName}')(*__args)
            if __res is not None:
                print(json.dumps(__res).replace(' ', ''))
else:
    if '${pyFuncName}' in globals():
        __res = globals()['${pyFuncName}'](*__args)
        if __res is not None:
            print(json.dumps(__res).replace(' ', ''))
`;
            }
        } else if (lang === 'csharp' || lang === 'c#') {
            if (!execCode.includes('static void Main') && !execCode.includes('Main(string[]')) {
                // ── Extract real C# class name and function name dynamically ──
                const classMatch = execCode.match(/class\s+([a-zA-Z0-9_]+)/);
                const csharpClassName = classMatch ? classMatch[1] : null;

                let csharpFuncName = camelName;
                const foundCsharpFuncs = [];
                const funcRegex = /(?:[a-zA-Z0-9_<>[\]]+)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g;
                let match;
                const excludedKeywords = new Set(['if', 'while', 'for', 'switch', 'catch', 'return', 'class', 'struct', 'int', 'bool', 'double', 'float', 'void', 'main', 'public', 'private', 'protected', 'static', 'using', 'namespace']);
                while ((match = funcRegex.exec(execCode)) !== null) {
                    const fName = match[1];
                    if (!excludedKeywords.has(fName)) {
                        foundCsharpFuncs.push(fName);
                    }
                }
                if (foundCsharpFuncs.length > 0) {
                    const exactOrPartialMatch = foundCsharpFuncs.find(f => f.toLowerCase() === camelName.toLowerCase());
                    if (exactOrPartialMatch) {
                        csharpFuncName = exactOrPartialMatch;
                    } else {
                        csharpFuncName = foundCsharpFuncs[foundCsharpFuncs.length - 1];
                    }
                }

                function inferCsharpLocalType(valStr) {
                    if (!valStr) return 'int';
                    valStr = valStr.trim();
                    if (valStr.startsWith('[[')) return 'int[][]';
                    if (valStr.startsWith('[')) {
                        if (valStr.includes('"') || valStr.includes("'")) return 'string[]';
                        return 'int[]';
                    }
                    if (valStr.startsWith('"') || valStr.startsWith("'")) return 'string';
                    if (valStr === 'true' || valStr === 'false') return 'bool';
                    if (valStr.includes('.')) return 'double';
                    return 'int';
                }

                const varReads = varMatches.map(v => {
                    const t = inferCsharpLocalType(v.val);
                    if (t === 'int') return `        int ${v.name} = ToInt(ExtractVar(input, "${v.name}"));`;
                    if (t === 'double') return `        double ${v.name} = ToDouble(ExtractVar(input, "${v.name}"));`;
                    if (t === 'bool') return `        bool ${v.name} = ToBool(ExtractVar(input, "${v.name}"));`;
                    if (t === 'string') return `        string ${v.name} = ExtractVar(input, "${v.name}");`;
                    if (t === 'int[]') return `        int[] ${v.name} = ToIntArr(ExtractVar(input, "${v.name}"));`;
                    if (t === 'string[]') return `        string[] ${v.name} = ToStrArr(ExtractVar(input, "${v.name}"));`;
                    if (t === 'int[][]') return `        int[][] ${v.name} = ToIntArr2D(ExtractVar(input, "${v.name}"));`;
                    return `        int ${v.name} = ToInt(ExtractVar(input, "${v.name}"));`;
                }).join('\n');

                const sampleOut = (problem.testCases && problem.testCases[0]) ? (problem.testCases[0].o || problem.testCases[0].output || "") : "";
                let csharpRet = "int";
                if (sampleOut.startsWith('[[')) csharpRet = "int[][]";
                else if (sampleOut.startsWith('[')) csharpRet = (sampleOut.includes('"') || sampleOut.includes("'")) ? "string[]" : "int[]";
                else if (sampleOut.startsWith('"') || sampleOut.startsWith("'")) csharpRet = "string";
                else if (sampleOut === 'true' || sampleOut === 'false') csharpRet = "bool";
                else if (sampleOut.includes('.')) csharpRet = "double";

                const paramNames = varMatches.map(v => v.name).join(', ');

                let solverInstantiation = "";
                let methodCall = "";
                if (csharpClassName) {
                    solverInstantiation = `        ${csharpClassName} __solver = new ${csharpClassName}();\n`;
                    methodCall = `__solver.${csharpFuncName}(${paramNames})`;
                } else {
                    solverInstantiation = `        Program __solver = new Program();\n`;
                    methodCall = `__solver.${csharpFuncName}(${paramNames})`;
                }

                let callAndPrint = "";
                if (csharpRet === "bool") {
                    callAndPrint = `${solverInstantiation}        bool __res = ${methodCall};\n        Console.WriteLine(__res ? "true" : "false");`;
                } else if (csharpRet === "string") {
                    callAndPrint = `${solverInstantiation}        string __res = ${methodCall};\n        Console.WriteLine(${sampleOut.startsWith('"') ? '"\\"" + __res + "\\""' : '__res'});`;
                } else if (csharpRet === "double") {
                    callAndPrint = `${solverInstantiation}        double __res = ${methodCall};\n        Console.WriteLine(__res.ToString("F5"));`;
                } else if (csharpRet === "int[]") {
                    callAndPrint = `${solverInstantiation}        int[] __res = ${methodCall};\n        if (__res != null) { Console.Write("["); for (int i = 0; i < __res.Length; i++) Console.Write(__res[i] + (i + 1 < __res.Length ? "," : "")); Console.WriteLine("]"); }`;
                } else if (csharpRet === "string[]") {
                    callAndPrint = `${solverInstantiation}        string[] __res = ${methodCall};\n        if (__res != null) { Console.Write("["); for (int i = 0; i < __res.Length; i++) Console.Write("\\"" + __res[i] + "\\"" + (i + 1 < __res.Length ? "," : "")); Console.WriteLine("]"); }`;
                } else if (csharpRet === "int[][]") {
                    callAndPrint = `${solverInstantiation}        int[][] __res = ${methodCall};\n        if (__res != null) { Console.Write("["); for (int i = 0; i < __res.Length; i++) { Console.Write("["); for (int j = 0; j < __res[i].Length; j++) Console.Write(__res[i][j] + (j + 1 < __res[i].Length ? "," : "")); Console.Write("]" + (i + 1 < __res.Length ? "," : "")); } Console.WriteLine("]"); }`;
                } else {
                    callAndPrint = `${solverInstantiation}        object __res = ${methodCall};\n        Console.WriteLine(__res);`;
                }

                let csharpHelpersEnd = "";
                let closingBrace = "";
                if (csharpClassName) {
                    csharpHelpersEnd = "\n}\n";
                    closingBrace = "";
                } else {
                    csharpHelpersEnd = "";
                    closingBrace = "\n}\n";
                }

                const csharpHelpers = `using System;\nusing System.IO;\nusing System.Collections.Generic;\n\npublic class Program {\n` +
                `    public static string ExtractVar(string input, string name) {\n        int pos = input.IndexOf(name);\n        if (pos == -1) return "";\n        int eq = input.IndexOf('=', pos);\n        if (eq == -1) return "";\n        int start = eq + 1;\n        while (start < input.Length && char.IsWhiteSpace(input[start])) start++;\n        if (start >= input.Length) return "";\n        if (input[start] == '[') {\n            int depth = 0;\n            for (int i = start; i < input.Length; i++) {\n                if (input[i] == '[') depth++;\n                else if (input[i] == ']') {\n                    depth--;\n                    if (depth == 0) return input.Substring(start, i - start + 1);\n                }\n            }\n            return input.Substring(start);\n        } else {\n            int end = start;\n            while (end < input.Length && input[end] != ',' && input[end] != '\\r' && input[end] != '\\n') end++;\n            return input.Substring(start, end - start).Trim();\n        }\n    }\n` +
                `    public static int ToInt(string s) { int.TryParse(s, out int res); return res; }\n` +
                `    public static double ToDouble(string s) { double.TryParse(s, out double res); return res; }\n` +
                `    public static bool ToBool(string s) { return s.Trim().ToLower() == "true" || s.Trim() == "1"; }\n` +
                `    public static int[] ToIntArr(string s) {\n        int ob = s.IndexOf('['); int cb = s.LastIndexOf(']');\n        if (ob == -1 || cb == -1 || cb <= ob + 1) return new int[0];\n        string[] parts = s.Substring(ob + 1, cb - ob - 1).Split(',');\n        List<int> list = new List<int>();\n        foreach (var p in parts) { if (!string.IsNullOrWhiteSpace(p)) list.Add(ToInt(p)); }\n        return list.ToArray();\n    }\n` +
                `    public static string[] ToStrArr(string s) {\n        int ob = s.IndexOf('['); int cb = s.LastIndexOf(']');\n        if (ob == -1 || cb == -1 || cb <= ob + 1) return new string[0];\n        string inner = s.Substring(ob + 1, cb - ob - 1);\n        List<string> list = new List<string>();\n        bool inQ = false; System.Text.StringBuilder cur = new System.Text.StringBuilder();\n        for (int i = 0; i < inner.Length; i++) {\n            char c = inner[i];\n            if (c == '"' || c == '\\'') inQ = !inQ;\n            else if (c == ',' && !inQ) { list.Add(cur.ToString()); cur.Clear(); }\n            else cur.Append(c);\n        }\n        if (cur.Length > 0) list.Add(cur.ToString());\n        return list.ToArray();\n    }\n` +
                `    public static int[][] ToIntArr2D(string s) {\n        List<int[]> list = new List<int[]>(); int i = 0;\n        while (i < s.Length) {\n            int ob = s.IndexOf('[', i); if (ob == -1) break;\n            if (ob > 0 && s[ob-1] == '[') { i = ob + 1; continue; }\n            int cb = s.IndexOf(']', ob); if (cb == -1) break;\n            list.Add(ToIntArr(s.Substring(ob, cb - ob + 1))); i = cb + 1;\n        }\n        return list.ToArray();\n    }\n\n` +
                `    public static void Main(string[] args) {\n        string input = Console.In.ReadToEnd();\n${varReads}\n${callAndPrint}\n    }\n` +
                csharpHelpersEnd;

                execCode = csharpHelpers + execCode + closingBrace;
            }
        } else if (lang === 'cpp' || lang === 'c++') {
            if (!execCode.includes('int main')) {
                const cppHeadersAndHelpers = `#include <iostream>\n#include <vector>\n#include <string>\n#include <sstream>\n#include <algorithm>\n#include <unordered_map>\n#include <map>\n#include <set>\n#include <queue>\n#include <stack>\n#include <stdlib.h>\n#include <string.h>\nusing namespace std;\n\n` +
                `string __extractVar(const string& input, const string& name) {\n    size_t pos = input.find(name);\n    if (pos == string::npos) return "";\n    size_t eq = input.find('=', pos);\n    if (eq == string::npos) return "";\n    size_t start = input.find_first_not_of(" \\t\\r\\n", eq + 1);\n    if (start == string::npos) return "";\n    if (input[start] == '[') {\n        int depth = 0;\n        for (size_t i = start; i < input.size(); i++) {\n            if (input[i] == '[') depth++;\n            else if (input[i] == ']') {\n                depth--;\n                if (depth == 0) return input.substr(start, i - start + 1);\n            }\n        }\n        return input.substr(start);\n    } else if (input[start] == '"' || input[start] == '\\'') {\n        char quote = input[start];\n        size_t endQ = input.find(quote, start + 1);\n        if (endQ != string::npos) return input.substr(start + 1, endQ - start - 1);\n        return input.substr(start + 1);\n    } else {\n        size_t end = input.find_first_of(",\\r\\n", start);\n        if (end == string::npos) return input.substr(start);\n        return input.substr(start, end - start);\n    }\n}\n` +
                `int __toInt(string s) { try { return stoi(s); } catch(...) { return 0; } }\n` +
                `double __toDouble(string s) { try { return stod(s); } catch(...) { return 0.0; } }\n` +
                `bool __toBool(string s) { return s == "true" || s == "1"; }\n` +
                `vector<int> __toVecInt(string s) {\n    vector<int> res; size_t ob = s.find('['); size_t cb = s.rfind(']');\n    if (ob == string::npos || cb == string::npos || cb <= ob + 1) return res;\n    string inner = s.substr(ob + 1, cb - ob - 1); stringstream ss(inner); string item;\n    while (getline(ss, item, ',')) {\n        size_t p = item.find_first_not_of(" \\t");\n        if (p != string::npos) res.push_back(__toInt(item));\n    }\n    return res;\n}\n` +
                `vector<string> __toVecStr(string s) {\n    vector<string> res; size_t ob = s.find('['); size_t cb = s.rfind(']');\n    if (ob == string::npos || cb == string::npos || cb <= ob + 1) return res;\n    string inner = s.substr(ob + 1, cb - ob - 1); bool inQ = false; string cur = "";\n    for (char c : inner) {\n        if (c == '"' || c == '\\'') inQ = !inQ;\n        else if (c == ',' && !inQ) { res.push_back(cur); cur = ""; }\n        else cur += c;\n    }\n    if (!cur.empty()) res.push_back(cur);\n    return res;\n}\n` +
                `vector<vector<int>> __toVecVecInt(string s) {\n    vector<vector<int>> res; size_t i = 0;\n    while (i < s.size()) {\n        size_t ob = s.find('[', i); if (ob == string::npos) break;\n        if (ob > 0 && s[ob-1] == '[') { i = ob + 1; continue; }\n        size_t cb = s.find(']', ob); if (cb == string::npos) break;\n        res.push_back(__toVecInt(s.substr(ob, cb - ob + 1))); i = cb + 1;\n    }\n    return res;\n}\n\n`;

                function inferCppLocalType(valStr) {
                    if (!valStr) return 'int';
                    valStr = valStr.trim();
                    if (valStr.startsWith('[[')) return 'vector<vector<int>>';
                    if (valStr.startsWith('[')) {
                        if (valStr.includes('"') || valStr.includes("'")) return 'vector<string>';
                        return 'vector<int>';
                    }
                    if (valStr.startsWith('"') || valStr.startsWith("'")) return 'string';
                    if (valStr === 'true' || valStr === 'false') return 'bool';
                    if (valStr.includes('.')) return 'double';
                    return 'int';
                }

                const varReads = varMatches.map(v => {
                    const t = inferCppLocalType(v.val);
                    if (t === 'int') return `    int ${v.name} = __toInt(__extractVar(input, "${v.name}"));`;
                    if (t === 'double') return `    double ${v.name} = __toDouble(__extractVar(input, "${v.name}"));`;
                    if (t === 'bool') return `    bool ${v.name} = __toBool(__extractVar(input, "${v.name}"));`;
                    if (t === 'string') return `    string ${v.name} = __extractVar(input, "${v.name}");`;
                    if (t === 'vector<int>') return `    vector<int> ${v.name} = __toVecInt(__extractVar(input, "${v.name}"));`;
                    if (t === 'vector<string>') return `    vector<string> ${v.name} = __toVecStr(__extractVar(input, "${v.name}"));`;
                    if (t === 'vector<vector<int>>') return `    vector<vector<int>> ${v.name} = __toVecVecInt(__extractVar(input, "${v.name}"));`;
                    return `    int ${v.name} = __toInt(__extractVar(input, "${v.name}"));`;
                }).join('\n');

                const sampleOut = (problem.testCases && problem.testCases[0]) ? (problem.testCases[0].o || problem.testCases[0].output || "") : "";
                let cppRet = "int";
                if (sampleOut.startsWith('[[')) cppRet = "vector<vector<int>>";
                else if (sampleOut.startsWith('[')) cppRet = (sampleOut.includes('"') || sampleOut.includes("'")) ? "vector<string>" : "vector<int>";
                else if (sampleOut.startsWith('"') || sampleOut.startsWith("'")) cppRet = "string";
                else if (sampleOut === 'true' || sampleOut === 'false') cppRet = "bool";
                else if (sampleOut.includes('.')) cppRet = "double";

                const paramNames = varMatches.map(v => v.name).join(', ');

                // ── Extract real C++ class name and function name dynamically ──
                const classMatch = execCode.match(/class\s+([a-zA-Z0-9_]+)/);
                const cppClassName = classMatch ? classMatch[1] : null;

                let cppFuncName = camelName;
                const foundFuncs = [];
                const funcRegex = /(?:vector\s*<\s*(?:vector\s*<\s*[a-zA-Z0-9_]+\s*>\s*|[a-zA-Z0-9_]+\s*)\s*>\s*\*?|[a-zA-Z_][a-zA-Z0-9_]*\s*\*?)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g;
                let match;
                const excludedKeywords = new Set(['if', 'while', 'for', 'switch', 'catch', 'return', 'class', 'struct', 'vector', 'string', 'int', 'bool', 'double', 'float', 'void', 'main']);
                while ((match = funcRegex.exec(execCode)) !== null) {
                    const fName = match[1];
                    if (!excludedKeywords.has(fName)) {
                        foundFuncs.push(fName);
                    }
                }
                if (foundFuncs.length > 0) {
                    const exactOrPartialMatch = foundFuncs.find(f => f.toLowerCase() === camelName.toLowerCase());
                    if (exactOrPartialMatch) {
                        cppFuncName = exactOrPartialMatch;
                    } else {
                        cppFuncName = foundFuncs[foundFuncs.length - 1];
                    }
                }

                let solverInstantiation = "";
                let methodCall = "";
                if (cppClassName) {
                    solverInstantiation = `    ${cppClassName} __solver;\n`;
                    methodCall = `__solver.${cppFuncName}(${paramNames})`;
                } else {
                    methodCall = `${cppFuncName}(${paramNames})`;
                }

                let callAndPrint = "";
                if (cppRet === "bool") {
                    callAndPrint = `${solverInstantiation}    bool __res = ${methodCall};\n    cout << (__res ? "true" : "false") << endl;`;
                } else if (cppRet === "string") {
                    callAndPrint = `${solverInstantiation}    string __res = ${methodCall};\n    cout << ${sampleOut.startsWith('"') ? '"\\"" << __res << "\\""' : '__res'} << endl;`;
                } else if (cppRet === "double") {
                    callAndPrint = `${solverInstantiation}    double __res = ${methodCall};\n    cout << fixed; cout.precision(5); cout << __res << endl;`;
                } else if (cppRet === "vector<int>") {
                    callAndPrint = `${solverInstantiation}    vector<int> __res = ${methodCall};\n    cout << "["; for (size_t i = 0; i < __res.size(); i++) cout << (i > 0 ? "," : "") << __res[i]; cout << "]" << endl;`;
                } else if (cppRet === "vector<string>") {
                    callAndPrint = `${solverInstantiation}    vector<string> __res = ${methodCall};\n    cout << "["; for (size_t i = 0; i < __res.size(); i++) cout << (i > 0 ? "," : "") << "\\"" << __res[i] << "\\""; cout << "]" << endl;`;
                } else if (cppRet === "vector<vector<int>>") {
                    callAndPrint = `${solverInstantiation}    vector<vector<int>> __res = ${methodCall};\n    cout << "["; for (size_t i = 0; i < __res.size(); i++) { cout << (i > 0 ? "," : "") << "["; for (size_t j = 0; j < __res[i].size(); j++) cout << (j > 0 ? "," : "") << __res[i][j]; cout << "]"; } cout << "]" << endl;`;
                } else {
                    callAndPrint = `${solverInstantiation}    auto __res = ${methodCall};\n    cout << __res << endl;`;
                }

                execCode = cppHeadersAndHelpers + execCode + `\nint main() {\n    string input((istreambuf_iterator<char>(cin)), istreambuf_iterator<char>());\n${varReads}\n${callAndPrint}\n    return 0;\n}\n`;
            }
        } else if (lang === 'c') {
            if (!execCode.includes('int main')) {
                // ── Standard C headers ──────────────────────────────────────
                const cHeaders = `#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n#include <math.h>\n#include <limits.h>\n#include <stdbool.h>\n\n`;

                // ── Extract REAL function name from source code ──────────────
                // Matches: `int* twoSum(` or `void solve(` etc.
                const funcDefMatch = execCode.match(
                    /(?:^|\n)\s*(?:static\s+)?(?:(?:const|unsigned|signed)\s+)?(?:int|char|void|bool|double|float|long|short)\s*\*?\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/m
                );
                const cFuncName = (funcDefMatch && funcDefMatch[1] !== 'main') ? funcDefMatch[1] : camelName;

                const sigMatch = execCode.match(new RegExp(cFuncName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\(([^{]+?)\\)\\s*\\{', 's'));
                const rawParamStr = sigMatch ? sigMatch[1] : '';
                const cParamList = rawParamStr.split(',').map(p => p.trim()).filter(Boolean);
                const retTypeMatch = execCode.match(new RegExp('(?:^|\\n)\\s*((?:(?:const|unsigned|signed)\\s+)?(?:int|char|void|bool|double|float|long|short)\\s*\\*?)\\s*' + cFuncName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
                const retType = retTypeMatch ? retTypeMatch[1].trim() : 'int';
                const retIsPtr = retType.includes('*');
                const retIsVoid = retType.startsWith('void');
                const cHelpers = `
static char* c_extractVal(const char* src, const char* key) {
    static char buf[8192]; buf[0]='\\0';
    const char* p = strstr(src, key);
    if (!p) return buf;
    p += strlen(key);
    while (*p==' '||*p=='\\t') p++;
    if (*p!='=') return buf;
    p++;
    while (*p==' '||*p=='\\t') p++;
    int len=0;
    if (*p=='[') {
        int d=0;
        for (const char* s=p;*s;s++) {
            if (*s=='[') d++; else if (*s==']'){d--;if(!d){len=(int)(s-p+1);break;}}
        }
    } else {
        const char* s=p;
        while(*s&&*s!=','&&*s!='\\n'&&*s!='\\r'&&*s!=' ') {s++;len++;}
    }
    strncpy(buf,p,len); buf[len]='\\0';
    return buf;
}
static int* c_parseIntArr(const char* s, int* sz) {
    *sz=0;
    const char* ob=strchr(s,'['); const char* cb=strrchr(s,']');
    if(!ob||!cb||cb<=ob){return NULL;}
    ob++; int cap=64; int* arr=(int*)malloc(cap*sizeof(int));
    int tmpLen=(int)(cb-ob);
    char* tmp=(char*)malloc(tmpLen+2);
    strncpy(tmp,ob,tmpLen); tmp[tmpLen]='\\0';
    char* tok=strtok(tmp,",");
    while(tok){while(*tok==' ')tok++;if(*sz>=cap){cap*=2;arr=(int*)realloc(arr,cap*sizeof(int));}arr[(*sz)++]=atoi(tok);tok=strtok(NULL,",");}
    free(tmp); return arr;
}
static int** c_parseIntArr2D(const char* s, int* rows, int** colSizes) {
    *rows=0;
    int cap=32;
    int** grid=(int**)malloc(cap*sizeof(int*));
    *colSizes=(int*)malloc(cap*sizeof(int));
    const char* p=s;
    while(*p&&*p!='[') p++;
    if(*p=='[') p++;
    while(*p) {
        while(*p&&*p!='['&&*p!=']') p++;
        if(!*p||*p==']') break;
        const char* rowStart=p;
        int depth=0; const char* rowEnd=p;
        while(*rowEnd){if(*rowEnd=='[')depth++;else if(*rowEnd==']'){depth--;if(depth==0){rowEnd++;break;}}rowEnd++;}
        int rlen=(int)(rowEnd-rowStart);
        char* rowStr=(char*)malloc(rlen+2);
        strncpy(rowStr,rowStart,rlen); rowStr[rlen]='\\0';
        int rSz=0;
        int* row=c_parseIntArr(rowStr,&rSz);
        free(rowStr);
        if(*rows>=cap){cap*=2;grid=(int**)realloc(grid,cap*sizeof(int*));*colSizes=(int*)realloc(*colSizes,cap*sizeof(int));}
        grid[(*rows)]=row;
        (*colSizes)[(*rows)]=rSz;
        (*rows)++;
        p=rowEnd;
    }
    return grid;
}
`;
                let varDecls = [];
                let callArgs  = [];
                const arrayParams = [];
                const array2DParams = [];
                for (const param of cParamList) {
                    const ptrCount = (param.match(/\*/g) || []).length;
                    const isDoublePtr = ptrCount >= 2;
                    const isPtr = ptrCount >= 1;
                    const nameM = param.match(/([a-zA-Z_][a-zA-Z0-9_]*)\s*$/);
                    if (!nameM) continue;
                    const pName = nameM[1];
                    if (/[Cc]ol[Ss]ize|[Cc]olumn[Ss]ize|return[Ss]ize|[Rr]ow[Ss]ize/i.test(pName) && isPtr) {
                        if (isDoublePtr) {
                            varDecls.push(`    int* ${pName} = (int*)malloc(64*sizeof(int)); memset(${pName},0,64*sizeof(int));`);
                            callArgs.push(`&${pName}`);
                        } else {
                            varDecls.push(`    int ${pName} = 0;`);
                            callArgs.push(`&${pName}`);
                        }
                        continue;
                    }
                    const sizeFor2D = array2DParams.find(a => pName.toLowerCase() === a.toLowerCase() + 'size' || pName.toLowerCase() === a.toLowerCase() + 'len');
                    if (!isPtr && sizeFor2D) {
                        varDecls.push(`    int ${pName} = ${sizeFor2D}_rows;`);
                        callArgs.push(pName);
                        continue;
                    }
                    const sizeFor1D = arrayParams.find(a => pName.toLowerCase() === a.toLowerCase() + 'size' || pName.toLowerCase() === a.toLowerCase() + 'len' || pName.toLowerCase() === a.toLowerCase() + 'length');
                    if (!isPtr && sizeFor1D) {
                        varDecls.push(`    int ${pName} = ${sizeFor1D}_sz;`);
                        callArgs.push(pName);
                        continue;
                    }
                    const vm = varMatches.find(v => v.name === pName);
                    if (isDoublePtr && vm && vm.val.startsWith('[[')) {
                        array2DParams.push(pName);
                        varDecls.push(`    int ${pName}_rows = 0;`);
                        varDecls.push(`    int* ${pName}_colSizes = NULL;`);
                        varDecls.push(`    int** ${pName} = c_parseIntArr2D(c_extractVal(input, "${pName}"), &${pName}_rows, &${pName}_colSizes);`);
                        callArgs.push(pName);
                        continue;
                    }
                    if (isPtr && vm && vm.val.startsWith('[')) {
                        arrayParams.push(pName);
                        varDecls.push(`    int ${pName}_sz = 0;`);
                        varDecls.push(`    int* ${pName} = c_parseIntArr(c_extractVal(input, "${pName}"), &${pName}_sz);`);
                        callArgs.push(pName);
                        continue;
                    }
                    if (isPtr) {
                        varDecls.push(`    int ${pName} = 0;`);
                        callArgs.push(`&${pName}`);
                        continue;
                    }
                    varDecls.push(`    int ${pName} = atoi(c_extractVal(input, "${pName}"));`);
                    callArgs.push(pName);
                }
                const retSizeParam = cParamList.find(p => /return.*[Ss]ize/i.test(p));
                const retSizeVarM  = retSizeParam && retSizeParam.match(/([a-zA-Z_][a-zA-Z0-9_]*)\s*$/);
                const retSizeVar   = retSizeVarM ? retSizeVarM[1] : 'returnSize';
                let resultCode = '';
                if (retIsVoid) {
                    resultCode = `    ${cFuncName}(${callArgs.join(', ')});\n    printf("done\\n");`;
                } else if (retIsPtr) {
                    resultCode = `    int* __res = ${cFuncName}(${callArgs.join(', ')});\n    if (__res) {\n        printf("[");\n        for (int __i = 0; __i < ${retSizeVar}; __i++) { if(__i>0) printf(","); printf("%d",__res[__i]); }\n        printf("]\\n");\n        free(__res);\n    }`;
                } else {
                    resultCode = `    int __res = (int)${cFuncName}(${callArgs.join(', ')});\n    printf("%d\\n", __res);`;
                }

                const cMain = `\nint main() {\n    char input[16384] = {0};\n    fread(input, 1, sizeof(input)-1, stdin);\n${varDecls.join('\n')}\n${resultCode}\n    return 0;\n}\n`;

                execCode = cHeaders + cHelpers + execCode + cMain;
            } else {
                // Code already has main — ensure stdlib headers present
                if (!execCode.includes('stdlib.h')) execCode = `#include <stdlib.h>\n` + execCode;
                if (!execCode.includes('string.h'))  execCode = `#include <string.h>\n` + execCode;
                if (!execCode.includes('stdio.h'))   execCode = `#include <stdio.h>\n` + execCode;
            }
        } else if (lang === 'java') {
            if (!execCode.includes('public class Main')) {
                // ── Extract real Java class name and function name dynamically ──
                const classMatch = execCode.match(/class\s+([a-zA-Z0-9_]+)/);
                const javaClassName = (classMatch && classMatch[1] !== 'Main') ? classMatch[1] : null;

                let javaFuncName = camelName;
                const foundJavaFuncs = [];
                const funcRegex = /(?:[a-zA-Z0-9_<>[\]]+)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g;
                let match;
                const excludedKeywords = new Set(['if', 'while', 'for', 'switch', 'catch', 'return', 'class', 'struct', 'int', 'boolean', 'double', 'float', 'void', 'main', 'public', 'private', 'protected', 'static']);
                while ((match = funcRegex.exec(execCode)) !== null) {
                    const fName = match[1];
                    if (!excludedKeywords.has(fName)) {
                        foundJavaFuncs.push(fName);
                    }
                }
                if (foundJavaFuncs.length > 0) {
                    const exactOrPartialMatch = foundJavaFuncs.find(f => f.toLowerCase() === camelName.toLowerCase());
                    if (exactOrPartialMatch) {
                        javaFuncName = exactOrPartialMatch;
                    } else {
                        javaFuncName = foundJavaFuncs[foundJavaFuncs.length - 1];
                    }
                }

                function inferJavaLocalType(valStr) {
                    if (!valStr) return 'int';
                    valStr = valStr.trim();
                    if (valStr.startsWith('[[')) return 'int[][]';
                    if (valStr.startsWith('[')) {
                        if (valStr.includes('"') || valStr.includes("'")) return 'String[]';
                        return 'int[]';
                    }
                    if (valStr.startsWith('"') || valStr.startsWith("'")) return 'String';
                    if (valStr === 'true' || valStr === 'false') return 'boolean';
                    if (valStr.includes('.')) return 'double';
                    return 'int';
                }

                const varReads = varMatches.map(v => {
                    const t = inferJavaLocalType(v.val);
                    if (t === 'int') return `        int ${v.name} = toInt(extractVar(input, "${v.name}"));`;
                    if (t === 'double') return `        double ${v.name} = toDouble(extractVar(input, "${v.name}"));`;
                    if (t === 'boolean') return `        boolean ${v.name} = toBool(extractVar(input, "${v.name}"));`;
                    if (t === 'String') return `        String ${v.name} = extractVar(input, "${v.name}");`;
                    if (t === 'int[]') return `        int[] ${v.name} = toIntArr(extractVar(input, "${v.name}"));`;
                    if (t === 'String[]') return `        String[] ${v.name} = toStrArr(extractVar(input, "${v.name}"));`;
                    if (t === 'int[][]') return `        int[][] ${v.name} = toIntArr2D(extractVar(input, "${v.name}"));`;
                    return `        int ${v.name} = toInt(extractVar(input, "${v.name}"));`;
                }).join('\n');

                const sampleOut = (problem.testCases && problem.testCases[0]) ? (problem.testCases[0].o || problem.testCases[0].output || "") : "";
                let javaRet = "int";
                if (sampleOut.startsWith('[[')) javaRet = "int[][]";
                else if (sampleOut.startsWith('[')) javaRet = (sampleOut.includes('"') || sampleOut.includes("'")) ? "String[]" : "int[]";
                else if (sampleOut.startsWith('"') || sampleOut.startsWith("'")) javaRet = "String";
                else if (sampleOut === 'true' || sampleOut === 'false') javaRet = "boolean";
                else if (sampleOut.includes('.')) javaRet = "double";

                const paramNames = varMatches.map(v => v.name).join(', ');

                let solverInstantiation = "";
                let methodCall = "";
                if (javaClassName) {
                    solverInstantiation = `        ${javaClassName} __solver = new ${javaClassName}();\n`;
                    methodCall = `__solver.${javaFuncName}(${paramNames})`;
                } else {
                    solverInstantiation = `        Main __solver = new Main();\n`;
                    methodCall = `__solver.${javaFuncName}(${paramNames})`;
                }

                let callAndPrint = "";
                if (javaRet === "boolean") {
                    callAndPrint = `${solverInstantiation}        boolean __res = ${methodCall};\n        System.out.println(__res ? "true" : "false");`;
                } else if (javaRet === "String") {
                    callAndPrint = `${solverInstantiation}        String __res = ${methodCall};\n        System.out.println(${sampleOut.startsWith('"') ? '"\\"" + __res + "\\""' : '__res'});`;
                } else if (javaRet === "double") {
                    callAndPrint = `${solverInstantiation}        double __res = ${methodCall};\n        System.out.printf("%.5f\\n", __res);`;
                } else if (javaRet === "int[]") {
                    callAndPrint = `${solverInstantiation}        int[] __res = ${methodCall};\n        if (__res != null) { System.out.print("["); for (int i = 0; i < __res.length; i++) System.out.print(__res[i] + (i + 1 < __res.length ? "," : "")); System.out.println("]"); }`;
                } else if (javaRet === "String[]") {
                    callAndPrint = `${solverInstantiation}        String[] __res = ${methodCall};\n        if (__res != null) { System.out.print("["); for (int i = 0; i < __res.length; i++) System.out.print("\\"" + __res[i] + "\\"" + (i + 1 < __res.length ? "," : "")); System.out.println("]"); }`;
                } else if (javaRet === "int[][]") {
                    callAndPrint = `${solverInstantiation}        int[][] __res = ${methodCall};\n        if (__res != null) { System.out.print("["); for (int i = 0; i < __res.length; i++) { System.out.print("["); for (int j = 0; j < __res[i].length; j++) System.out.print(__res[i][j] + (j + 1 < __res[i].length ? "," : "")); System.out.print("]" + (i + 1 < __res.length ? "," : "")); } System.out.println("]"); }`;
                } else {
                    callAndPrint = `${solverInstantiation}        Object __res = ${methodCall};\n        System.out.println(__res);`;
                }

                const varReadsForMain = varMatches.map(v => {
                    const t = inferJavaLocalType(v.val);
                    if (t === 'int') return `        int ${v.name} = toInt(extractVar(_tc, "${v.name}"));`;
                    if (t === 'double') return `        double ${v.name} = toDouble(extractVar(_tc, "${v.name}"));`;
                    if (t === 'boolean') return `        boolean ${v.name} = toBool(extractVar(_tc, "${v.name}"));`;
                    if (t === 'String') return `        String ${v.name} = extractVar(_tc, "${v.name}");`;
                    if (t === 'int[]') return `        int[] ${v.name} = toIntArr(extractVar(_tc, "${v.name}"));`;
                    if (t === 'String[]') return `        String[] ${v.name} = toStrArr(extractVar(_tc, "${v.name}"));`;
                    if (t === 'int[][]') return `        int[][] ${v.name} = toIntArr2D(extractVar(_tc, "${v.name}"));`;
                    return `        int ${v.name} = toInt(extractVar(_tc, "${v.name}"));`;
                }).join('\n');

                let javaHelpersEnd = "";
                let closingBrace = "";
                if (javaClassName) {
                    javaHelpersEnd = "\n}\n";
                    closingBrace = "";
                } else {
                    javaHelpersEnd = "";
                    closingBrace = "\n}\n";
                }

                const javaHelpers = `import java.io.*;\nimport java.util.*;\n\npublic class Main {\n` +
                `    public static String extractVar(String input, String name) {\n        int pos = input.indexOf(name);\n        if (pos == -1) return "";\n        int eq = input.indexOf('=', pos);\n        if (eq == -1) return "";\n        int start = eq + 1;\n        while (start < input.length() && Character.isWhitespace(input.charAt(start))) start++;\n        if (start >= input.length()) return "";\n        if (input.charAt(start) == '[') {\n            int depth = 0;\n            for (int i = start; i < input.length(); i++) {\n                if (input.charAt(i) == '[') depth++;\n                else if (input.charAt(i) == ']') {\n                    depth--;\n                    if (depth == 0) return input.substring(start, i + 1);\n                }\n            }\n            return input.substring(start);\n        } else if (input.charAt(start) == '"' || input.charAt(start) == '\\'') {\n            char quote = input.charAt(start);\n            int endQ = input.indexOf(quote, start + 1);\n            if (endQ != -1) return input.substring(start + 1, endQ);\n            return input.substring(start + 1);\n        } else {\n            int end = start;\n            while (end < input.length() && input.charAt(end) != ',' && input.charAt(end) != '\\r' && input.charAt(end) != '\\n') end++;\n            return input.substring(start, end).trim();\n        }\n    }\n` +
                `    public static int toInt(String s) { try { return Integer.parseInt(s.trim()); } catch(Exception e) { return 0; } }\n` +
                `    public static double toDouble(String s) { try { return Double.parseDouble(s.trim()); } catch(Exception e) { return 0.0; } }\n` +
                `    public static boolean toBool(String s) { return s.trim().equals("true") || s.trim().equals("1"); }\n` +
                `    public static int[] toIntArr(String s) {\n        int ob = s.indexOf('['); int cb = s.lastIndexOf(']');\n        if (ob == -1 || cb == -1 || cb <= ob + 1) return new int[0];\n        String[] parts = s.substring(ob + 1, cb).split(",");\n        List<Integer> list = new ArrayList<>();\n        for (String p : parts) { if (!p.trim().isEmpty()) list.add(toInt(p)); }\n        int[] res = new int[list.size()];\n        for (int i = 0; i < list.size(); i++) res[i] = list.get(i);\n        return res;\n    }\n` +
                `    public static String[] toStrArr(String s) {\n        int ob = s.indexOf('['); int cb = s.lastIndexOf(']');\n        if (ob == -1 || cb == -1 || cb <= ob + 1) return new String[0];\n        String inner = s.substring(ob + 1, cb);\n        List<String> list = new ArrayList<>();\n        boolean inQ = false; StringBuilder cur = new StringBuilder();\n        for (int i = 0; i < inner.length(); i++) {\n            char c = inner.charAt(i);\n            if (c == '"' || c == '\\'') inQ = !inQ;\n            else if (c == ',' && !inQ) { list.add(cur.toString()); cur = new StringBuilder(); }\n            else cur.append(c);\n        }\n        if (cur.length() > 0) list.add(cur.toString());\n        return list.toArray(new String[0]);\n    }\n` +
                `    public static int[][] toIntArr2D(String s) {\n        List<int[]> list = new ArrayList<>(); int i = 0;\n        while (i < s.length()) {\n            int ob = s.indexOf('[', i); if (ob == -1) break;\n            if (ob > 0 && s.charAt(ob-1) == '[') { i = ob + 1; continue; }\n            int cb = s.indexOf(']', ob); if (cb == -1) break;\n            list.add(toIntArr(s.substring(ob, cb + 1))); i = cb + 1;\n        }\n        return list.toArray(new int[0][]);\n    }\n\n` +
                `    public static void main(String[] args) throws IOException {\n        Scanner sc = new Scanner(System.in);\n        StringBuilder sb = new StringBuilder();\n        while (sc.hasNextLine()) sb.append(sc.nextLine()).append("\\n");\n        String _tc = sb.toString();\n${varReadsForMain}\n${callAndPrint}\n    }\n` +
                javaHelpersEnd;

                execCode = javaHelpers + execCode + closingBrace;
            }
        }
    } else if (lang === 'cpp' || lang === 'c++') {
        if (!execCode.includes('#include')) {
            execCode = `#include <iostream>\n#include <vector>\n#include <unordered_map>\n#include <string>\n#include <algorithm>\n#include <set>\n#include <map>\n#include <queue>\n#include <stack>\n#include <stdlib.h>\n#include <string.h>\nusing namespace std;\n\n` + execCode;
        }
    } else if (lang === 'c') {
        // Always prepend standard C headers for C language
        if (!execCode.includes('#include')) {
            execCode = `#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n#include <math.h>\n#include <limits.h>\n#include <stdbool.h>\n\n` + execCode;
        } else {
            // Code already has some includes — ensure stdlib.h is present for malloc etc.
            if (!execCode.includes('stdlib.h')) {
                execCode = `#include <stdlib.h>\n` + execCode;
            }
            if (!execCode.includes('string.h')) {
                execCode = `#include <string.h>\n` + execCode;
            }
        }
    }
    
    const apiUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
        ? 'http://localhost:3000' 
        : 'https://skil-matrix-server.onrender.com';
        
    const createRes = await fetch(`${apiUrl}/api/compile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            code: execCode,
            language: paizaLang,
            input: stdin || ""
        })
    });
    
    if (!createRes.ok) {
        // Paiza returned an HTTP error — try Piston as fallback
        console.warn('[Coding Arena] Paiza HTTP error, falling back to Piston...');
        return await window.executeWithPiston(code, lang, stdin);
    }
    const createData = await createRes.json();
    if (createData.error) throw new Error(createData.error);
    
    // No id = language not supported by Paiza — fallback to Piston
    if (!createData.id) {
        console.warn('[Coding Arena] Paiza returned no id (unsupported language?), falling back to Piston...');
        return await window.executeWithPiston(code, lang, stdin);
    }
    
    const id = createData.id;
    
    for (let i = 0; i < 15; i++) {
        await new Promise(r => setTimeout(r, 1000));
        const statusRes = await fetch(`${apiUrl}/api/compile/status?id=${id}`);
        const data = await statusRes.json();
        
        if (data.status === 'completed') {
            return {
                status: (data.build_exit_code !== 0 || data.exit_code !== 0) ? "1" : "0",
                program_output: data.stdout || "",
                program_error: data.stderr || "",
                compiler_error: data.build_stderr || ""
            };
        }
    }
    throw new Error("Execution timed out");
};

window.runUserCode = async function(isSubmit) {
    const btnRun = document.getElementById('btn-run-code');
    const btnSubmit = document.getElementById('btn-submit-code');
    const consoleOut = document.getElementById('ca-console');
    
    const code = editorInstance.getValue();
    const sel = document.getElementById('ca-lang');
    const lang = sel.value;
    const langName = sel.options[sel.selectedIndex].text;
    const ver = sel.options[sel.selectedIndex].getAttribute('data-ver');

    const isSandbox = window.caActiveProblemIndex === -1;

    if (btnRun) {
        btnRun.disabled = true;
        btnRun.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin" style="font-size: 11px;"></i> ${isSubmit ? 'Running...' : 'Running...'}`;
    }
    if (btnSubmit) {
        btnSubmit.disabled = true;
        if (isSubmit) btnSubmit.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin" style="font-size: 11px;"></i> Submitting...`;
    }
    
    // Automatically switch to Console Output tab
    if (window.switchConsoleTab) window.switchConsoleTab('console');
    
    consoleOut.innerHTML = "<span style='color:#00d2ff'>Sending code to Compiler Engine...</span><br>";

    if (isSandbox) {
        try {
            const data = await window.executeWithPaiza(code, lang, "");
            
            if (data.status !== "0" && !data.program_output) {
                consoleOut.innerHTML += `<div style="color: #ff4757; margin-top: 10px;"><b>Compile/Run Error:</b><br>${data.compiler_error || data.program_error || 'Unknown Error'}</div>`;
            } else {
                const outStr = (data.program_output || "").trim();
                const errStr = (data.program_error || "").trim();
                if (errStr) consoleOut.innerHTML += `<div style="color: #ff4757; margin-top: 10px;"><b>Error:</b><br>${errStr}</div>`;
                if (outStr) consoleOut.innerHTML += `<div style="color: #2ed573; margin-top: 10px;"><b>Output:</b><br>${outStr.replace(/\\n/g, '<br>')}</div>`;
                if (!outStr && !errStr) consoleOut.innerHTML += `<div style="color: var(--text-dim); margin-top: 10px;"><i>(No output)</i></div>`;
            }
        } catch (e) {
            consoleOut.innerHTML += `<div style="color: #ff4757; margin-top: 10px;">Network error: ${e.message}</div>`;
        }
        if (btnRun) {
            btnRun.disabled = false;
            btnRun.innerHTML = `<i class="fa-solid fa-play" style="font-size: 11px;"></i> Run Code`;
        }
        if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = `<i class="fa-solid fa-cloud-arrow-up" style="font-size: 11px;"></i> Submit`;
        }
        return;
    }

    const problem = codingProblems[window.caActiveProblemIndex];

    let passedAll = true;
    let consoleLog = "";

    // Test cases sequentially
    for (let i = 0; i < problem.testCases.length; i++) {
        const tc = problem.testCases[i];
        
        try {
            const tcInput = tc.input !== undefined ? tc.input : (tc.i !== undefined ? tc.i : '');
            const tcOutput = tc.output !== undefined ? tc.output : (tc.o !== undefined ? tc.o : '');
            const data = await window.executeWithPaiza(code, lang, tcInput);
            
            if (data.status !== "0" && !data.program_output) {
                const errText = (data.compiler_error || data.program_error || 'Unknown Error').replace(/\n/g, '<br>');
                consoleLog += `<div style="background: rgba(255, 71, 87, 0.1); border: 1px solid rgba(255, 71, 87, 0.3); padding: 10px 14px; border-radius: 6px; color: #ff4757; margin-top: 10px; font-family: monospace;"><b><i class="fa-solid fa-triangle-exclamation"></i> Test Case #${i+1} Compilation/Runtime Error:</b><br>${errText}</div>`;
                passedAll = false;
                break;
            }

            const outStr = (data.program_output || "").trim();
            const errStr = (data.program_error || "").trim();

            if (errStr) {
                consoleLog += `<div style="background: rgba(255, 71, 87, 0.1); border: 1px solid rgba(255, 71, 87, 0.3); padding: 10px 14px; border-radius: 6px; color: #ff4757; margin-top: 10px; font-family: monospace;"><b><i class="fa-solid fa-triangle-exclamation"></i> Test Case #${i+1} Execution Error:</b><br>${errStr.replace(/\n/g, '<br>')}</div>`;
                passedAll = false;
                break;
            }

            const cleanOut = outStr.replace(/^["']|["']$/g, '');
            const cleanExpected = String(tcOutput).trim().replace(/^["']|["']$/g, '');
            const numOut = Number(cleanOut);
            const numExpected = Number(cleanExpected);
            const isNumMatch = !isNaN(numOut) && !isNaN(numExpected) && cleanOut !== '' && cleanExpected !== '' && Math.abs(numOut - numExpected) < 1e-5;

            if (outStr === String(tcOutput).trim() || cleanOut === cleanExpected || isNumMatch) {
                consoleLog += `<div style="background: rgba(46, 213, 115, 0.1); border: 1px solid rgba(46, 213, 115, 0.3); padding: 10px 14px; border-radius: 6px; color: #2ed573; margin-top: 10px; font-family: monospace; display: flex; align-items: center; gap: 8px;"><i class="fa-solid fa-circle-check"></i> <b>Test Case #${i+1}: Passed (100% Match)</b></div>`;
            } else {
                consoleLog += `<div style="background: rgba(255, 71, 87, 0.1); border: 1px solid rgba(255, 71, 87, 0.3); padding: 10px 14px; border-radius: 6px; color: #ff4757; margin-top: 10px; font-family: monospace;"><div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;"><i class="fa-solid fa-circle-xmark"></i> <b>Test Case #${i+1}: Failed</b></div><div style="font-size: 12px; color: #cbd5e1; line-height: 1.6;">Expected Output ➔ <code style="color:#2ed573; background:rgba(46,213,115,0.1); padding:2px 6px; border-radius:4px;">${tcOutput}</code><br>Your Output ➔ <code style="color:#ff4757; background:rgba(255,71,87,0.1); padding:2px 6px; border-radius:4px;">${outStr}</code></div></div>`;
                passedAll = false;
                break;
            }

        } catch (e) {
            consoleLog += `<div style="color: #ff4757; margin-top: 10px;">Network error reaching compiler: ${e.message}</div>`;
            passedAll = false;
            break;
        }
    }

    if (passedAll) {
        const currentLevel = (window.currentUser?.current_coding_level || 1);
        const todayIdx = currentLevel - 1;
        const isToday = window.caActiveProblemIndex === todayIdx;
        // Contest override: isToday for XP awarding is false for contest problems
        const isContestMode = !!window.caIsContestProblem;

        consoleOut.innerHTML = consoleLog + `<div style="color: #2ed573; margin-top: 15px; font-weight:bold; font-size: 15px;">✓ All ${problem.testCases.length} Test Cases Passed!</div>`;
        
        // --- Populate Submissions View ---
        if (isSubmit) {
            let wasAlreadySolved = false;
            if (window.caActiveProblemIndex !== null) {
                wasAlreadySolved = (window.caSolvedProblems || []).includes(window.caActiveProblemIndex);
            }
            
            const isPracticeMode = isContestMode;
            let awardedXp = 0;
            if (!isPracticeMode) {
                if (!wasAlreadySolved) {
                    awardedXp = problem.xp || 100;
                } else if (window.caActiveProblemIndex === window.caTodayIdx) {
                    const myId = window.currentUser?.id || 'me';
                    const todayStr = new Date().toDateString();
                    if (localStorage.getItem('ca_daily_last_date_' + myId) !== todayStr) {
                        awardedXp = 20;
                    }
                }
            }

            const subsDiv = document.getElementById('ca-subs-list');
            if (subsDiv) {
                if (subsDiv.innerHTML.includes('No historical submissions found')) {
                    subsDiv.innerHTML = '';
                }
                const now = new Date();
                const timeStr = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
                
                const newEntry = `
                    <div style="background: rgba(46, 213, 115, 0.1); border: 1px solid rgba(46, 213, 115, 0.2); border-radius: 8px; padding: 16px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; animation: caFadeIn 0.3s ease;">
                        <div>
                            <div style="color: #2ed573; font-weight: bold; font-size: 16px; margin-bottom: 4px;">Accepted</div>
                            <div style="font-size: 12px; color: #8c8c8c;">Language: <span style="color:#d4d4d4; font-weight:600;">${langName}</span> &nbsp;|&nbsp; ${timeStr}</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="color: #eff1f6; font-weight: 600;">Score: +${awardedXp} XP</div>
                            <div style="font-size: 12px; color: #8c8c8c;">Time: ~${(Math.random() * 10 + 5).toFixed(0)}ms</div>
                        </div>
                    </div>
                `;
                subsDiv.insertAdjacentHTML('afterbegin', newEntry);
                document.getElementById('ca-tab-subs').style.color = '#2ed573';
                
                const btnSubmit = document.getElementById('btn-submit-code');
                if (btnSubmit) btnSubmit.style.display = 'none';
            }

            if (window.currentUser && window.currentUser.id) {
                const subKey = `ca_subs_${window.currentUser.id}_${window.caActiveProblemIndex}`;
                let pastSubs = JSON.parse(localStorage.getItem(subKey) || "[]");
                
                const now = new Date();
                const localTimeStr = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
                
                pastSubs.unshift({
                    status: 'Accepted',
                    statusColor: '#2ed573',
                    lang: langName,
                    time: localTimeStr,
                    xp: awardedXp,
                    ms: (Math.random() * 10 + 5).toFixed(0)
                });
                localStorage.setItem(subKey, JSON.stringify(pastSubs));
            }

            await handleProblemSolved(isPracticeMode, awardedXp);
            // If this was a contest problem, mark it solved in the contest tracker
            if (isContestMode && window.caContestQi !== null && window.caMarkContestSolved) {
                window.caMarkContestSolved(window.caContestQi);
                window.caIsContestProblem = false;
                window.caContestQi = null;
            }
        } else if (isContestMode) {
            consoleOut.innerHTML += `<div style="margin-top:0.5rem; color: var(--text-dim);">Code passed! Click 'Submit' to earn contest XP.</div>`;
        } else {
            let pXp = (window.caActiveProblemIndex === window.caTodayIdx) ? 20 : (problem.xp || 100);
            if (!window.caSolvedProblems.includes(window.caActiveProblemIndex) || window.caActiveProblemIndex === window.caTodayIdx) {
                consoleOut.innerHTML += `<div style="margin-top:0.5rem; color: var(--text-dim);">Code passed! Click 'Submit' to claim +${pXp} XP and add to solved problems.</div>`;
            } else {
                consoleOut.innerHTML += `<div style="margin-top:0.5rem; color: var(--text-dim);">Code passed! (Already solved, +0 XP).</div>`;
            }
        }
    } else {
        consoleOut.innerHTML = consoleLog + `<div style="color: #ff4757; margin-top: 15px; font-weight:bold; font-size: 15px;">✗ Some Test Cases Failed. Keep trying! Check your logic.</div>`;
        
        // --- Populate Submissions View for Failure ---
        if (isSubmit) {
            const subsDiv = document.getElementById('ca-subs-list');
            if (subsDiv) {
                if (subsDiv.innerHTML.includes('No historical submissions found')) {
                    subsDiv.innerHTML = '';
                }
                const now = new Date();
                const timeStr = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
                
                const newEntry = `
                    <div style="background: rgba(255, 71, 87, 0.1); border: 1px solid rgba(255, 71, 87, 0.2); border-radius: 8px; padding: 16px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; animation: caFadeIn 0.3s ease;">
                        <div>
                            <div style="color: #ff4757; font-weight: bold; font-size: 16px; margin-bottom: 4px;">Wrong Answer / Error</div>
                            <div style="font-size: 12px; color: #8c8c8c;">Language: <span style="color:#d4d4d4; font-weight:600;">${langName}</span> &nbsp;|&nbsp; ${timeStr}</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="color: #eff1f6; font-weight: 600;">Score: +0 XP</div>
                            <div style="font-size: 12px; color: #8c8c8c;">Review Test Cases</div>
                        </div>
                    </div>
                `;
                subsDiv.insertAdjacentHTML('afterbegin', newEntry);
                const tabSubs = document.getElementById('ca-tab-subs');
                if (tabSubs) tabSubs.style.color = '#ff4757';
                
                // Save failure to localStorage
                if (window.currentUser && window.currentUser.id) {
                    const subKey = `ca_subs_${window.currentUser.id}_${window.caActiveProblemIndex}`;
                    let pastSubs = JSON.parse(localStorage.getItem(subKey) || "[]");
                    pastSubs.unshift({
                        status: 'Wrong Answer / Error',
                        statusColor: '#ff4757',
                        lang: langName,
                        time: timeStr,
                        xp: 0,
                        ms: 'N/A'
                    });
                    localStorage.setItem(subKey, JSON.stringify(pastSubs));
                }
            }
        }
    }

    if (btnRun) {
        btnRun.disabled = false;
        btnRun.innerHTML = `<i class="fa-solid fa-play" style="font-size: 11px;"></i> Run Code`;
    }
    if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = `<i class="fa-solid fa-cloud-arrow-up" style="font-size: 11px;"></i> Submit`;
    }
}

async function handleProblemSolved(isPractice = false, awardedXp = 0) {
    try {
        if (window.caActiveProblemIndex !== null && window.caActiveProblemIndex !== -1) {
            window.caSolvedProblems = window.caSolvedProblems || [];
            if (!window.caSolvedProblems.includes(window.caActiveProblemIndex)) {
                window.caSolvedProblems.push(window.caActiveProblemIndex);
                const myId = window.currentUser?.id || 'me';
                try {
                    localStorage.setItem('ca_solved_problems_' + myId, JSON.stringify(window.caSolvedProblems));
                    const sb = window.supabase || (typeof supabase !== 'undefined' ? supabase : null);
                    if (sb && window.currentUser?.id) {
                        sb.from('users').update({ ca_solved_problems: JSON.stringify(window.caSolvedProblems) }).eq('id', window.currentUser.id).then().catch(() => {});
                    }
                } catch(e) {}
            }
            // Live-inject green Solved badge into the title without re-render
            const titleEl = document.querySelector('#ca-view-desc h2');
            if (titleEl && !titleEl.querySelector('.ca-solved-badge')) {
                const badge = document.createElement('span');
                badge.className = 'ca-solved-badge';
                badge.style.cssText = 'display:inline-flex;align-items:center;gap:4px;background:rgba(46,213,115,0.15);border:1px solid rgba(46,213,115,0.4);color:#2ed573;font-size:12px;font-weight:600;padding:2px 10px;border-radius:100px;vertical-align:middle;animation:fadeIn 0.4s ease;';
                badge.innerHTML = `<i class="fa-solid fa-circle-check" style="font-size:11px;"></i> Solved`;
                titleEl.appendChild(badge);
            }
        }
        
        let sb = null;
        if (typeof supabase !== 'undefined') sb = supabase;
        else if (window.supabase) sb = window.supabase;
        else {
            try {
                const module = await import('./supabase-config.js?v=1.0');
                sb = module.supabase;
            } catch (e) {
                console.warn("Could not load supabase:", e);
            }
        }

        const todayStr = new Date().toDateString();
        const myId = window.currentUser?.id || 'me';
        
        // Mark Daily Problem as done if applicable
        if (!isPractice && awardedXp > 0 && window.caActiveProblemIndex === window.caTodayIdx) {
            try { localStorage.setItem('ca_daily_last_date_' + myId, todayStr); } catch(e) {}
        }

        let newStreak = 0;
        let newMax = 0;
        let newXP = awardedXp;
        let newLevel = 2;

        if (!isPractice && sb && window.currentUser && window.currentUser.id && awardedXp >= 0) {
            // Fetch latest user state safely
            const { data: userStats, error } = await sb.from('users').select('*').eq('id', window.currentUser.id).single();
            
            newStreak = (userStats && userStats.coding_streak) ? userStats.coding_streak : 0;
            if (!userStats || userStats.last_coding_date !== todayStr) {
                newStreak += 1;
            }
            newMax = Math.max(newStreak, (userStats && userStats.max_coding_streak) ? userStats.max_coding_streak : 0);
            newXP = ((userStats && userStats.coding_xp) ? userStats.coding_xp : 0) + awardedXp;
            newLevel = ((userStats && userStats.current_coding_level) ? userStats.current_coding_level : 1) + 1;

            const myName = window.currentUser?.user_metadata?.full_name || window.currentUser?.name || window.currentUser?.email?.split('@')[0] || 'Scholar';
            const myCollege = window.currentUser?.user_metadata?.college || window.currentUser?.collegeName || window.currentUser?.college || '';

            await sb.from('users').upsert({
                id: window.currentUser.id,
                email: window.currentUser.email || '',
                name: myName,
                avatar: window.currentUser.photo || '',
                collegename: myCollege,
                current_coding_level: newLevel,
                coding_xp: newXP,
                coding_streak: newStreak,
                max_coding_streak: newMax,
                last_coding_date: todayStr,
                ca_solved_problems: window.caSolvedProblems ? JSON.stringify(window.caSolvedProblems) : '[]'
            });
            // Update global state locally so UI stays in sync
            if (window.currentUser) {
                window.currentUser.current_coding_level = newLevel;
                window.currentUser.coding_xp = newXP;
            }
        }

        // Party Popper using Canvas Confetti
        try {
            const fireConfetti = () => {
                var defaults = { zIndex: 999999, origin: { y: 0.6 } };

                function fire(particleRatio, opts) {
                    confetti(Object.assign({}, defaults, opts, {
                        particleCount: Math.floor(250 * particleRatio)
                    }));
                }

                // A single massive, high-speed burst that covers the screen
                fire(0.25, { spread: 26, startVelocity: 55 });
                fire(0.2, { spread: 60 });
                fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
                fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
                fire(0.1, { spread: 120, startVelocity: 45 });
            };

            if (typeof confetti === 'undefined') {
                const confettiScript = document.createElement('script');
                confettiScript.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js';
                confettiScript.onload = fireConfetti;
                document.head.appendChild(confettiScript);
            } else {
                fireConfetti();
            }
        } catch(e) {
            console.error("Confetti Error:", e);
        }

        // Show a beautiful completion popup on the screen instead of kicking them out
        const container = document.querySelector('.coding-arena-container');
        if (container) {
            const pTitle = (window.caCodingProblems && window.caActiveProblemIndex !== null && window.caCodingProblems[window.caActiveProblemIndex]) ? window.caCodingProblems[window.caActiveProblemIndex].title : 'the problem';
            const popup = document.createElement('div');
            popup.style = `
                position: absolute;
                top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0,0,0,0.85);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                backdrop-filter: blur(10px);
                animation: caFadeIn 0.5s ease;
            `;
            popup.innerHTML = `
                <div style="background: #0a0a0a; border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 40px; text-align: center; max-width: 400px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); transform: translateY(20px); animation: caSlideUp 0.5s ease forwards;">
                    <div style="font-size: 60px; margin-bottom: 20px;">🎉</div>
                    <h2 style="color: #2ed573; margin: 0 0 10px 0; font-size: 28px;">${isPractice ? 'Practice Completed!' : 'Problem Solved!'}</h2>
                    <p style="color: #a3a3a3; font-size: 15px; margin-bottom: 30px;">Excellent work! You successfully solved <b>${pTitle}</b>.</p>
                    
                    <div style="display: flex; justify-content: center; gap: 20px; margin-bottom: 30px;">
                        <div style="background: rgba(46, 213, 115, 0.1); border: 1px solid rgba(46, 213, 115, 0.2); padding: 15px 25px; border-radius: 12px;">
                            <div style="color: #8c8c8c; font-size: 12px; font-weight: 600; text-transform: uppercase;">XP Earned</div>
                            <div style="color: #2ed573; font-size: 24px; font-weight: bold;">+${isPractice ? 0 : awardedXp}</div>
                        </div>
                        <div style="background: rgba(255, 192, 30, 0.1); border: 1px solid rgba(255, 192, 30, 0.2); padding: 15px 25px; border-radius: 12px;">
                            <div style="color: #8c8c8c; font-size: 12px; font-weight: 600; text-transform: uppercase;">Streak</div>
                            <div style="color: #ffc01e; font-size: 24px; font-weight: bold;">${newStreak} 🔥</div>
                        </div>
                    </div>

                    <div style="display: flex; gap: 15px;">
                        <button onclick="this.closest('.coding-arena-container').removeChild(this.closest('[style*=\\'position: absolute\\']'))" style="flex: 1; background: transparent; border: 1px solid rgba(255,255,255,0.2); color: #fff; padding: 12px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background='transparent'">Review Code</button>
                        <button onclick="window.backToExplorer()" style="flex: 1; background: #2cbb5d; border: none; color: #fff; padding: 12px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: filter 0.2s;" onmouseover="this.style.filter='brightness(1.1)'" onmouseout="this.style.filter='none'">Return to Menu</button>
                    </div>
                </div>
                <style>
                    @keyframes caSlideUp { to { transform: translateY(0); } }
                    @keyframes caFadeIn { from { opacity: 0; } to { opacity: 1; } }
                </style>
            `;
            container.appendChild(popup);
        } else {
            if (window.showToast) window.showToast(`+${problem.xp} XP Awarded! Streak: ${newStreak} 🔥`);
        }
    } catch (err) {
        console.error("Error in handleProblemSolved:", err);
    }
}
