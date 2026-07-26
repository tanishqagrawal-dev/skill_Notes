import { supabase } from './supabase-config.js';
import { codingProblems } from './data/coding-problems.js';
window.caCodingProblems = codingProblems;

// --- LEETCODE & GFG ENRICHMENT ---
const CA_CATEGORIES = ["Arrays & Hashing", "Two Pointers", "Sliding Window", "Stack & Queue", "Binary Search", "Linked List", "Trees & Graphs", "Dynamic Programming", "Greedy & Math", "Bit Manipulation", "String Algorithms", "Heaps & Priority Queue"];
const CA_COMPANIES = ["Google", "Amazon", "Microsoft", "Meta", "Apple", "Netflix", "Uber", "Adobe", "Flipkart", "Goldman Sachs", "Bloomberg", "Salesforce", "ByteDance", "Atlassian", "Oracle", "Cisco", "Paytm", "Zomato", "Swiggy"];
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
    "Heaps & Priority Queue": "fa-sort-amount-up"
};

codingProblems.forEach((p, index) => {
    if (!p.category) {
        const title = p.title.toLowerCase();
        if (title.includes('array') || title.includes('sum') || title.includes('two') || title.includes('element') || title.includes('matrix')) p.category = "Arrays & Hashing";
        else if (title.includes('string') || title.includes('palindrom') || title.includes('char') || title.includes('word') || title.includes('anagram')) p.category = "String Algorithms";
        else if (title.includes('tree') || title.includes('binary') || title.includes('bst') || title.includes('node') || title.includes('leaf') || title.includes('graph') || title.includes('depth')) p.category = "Trees & Graphs";
        else if (title.includes('sort') || title.includes('search') || title.includes('find') || title.includes('bound')) p.category = "Binary Search";
        else if (title.includes('dp') || title.includes('dynamic') || title.includes('fibonacci') || title.includes('subsequence') || title.includes('max') || title.includes('min') || title.includes('path') || title.includes('climb')) p.category = "Dynamic Programming";
        else if (title.includes('list') || title.includes('reverse') || title.includes('cycle') || title.includes('merge')) p.category = "Linked List";
        else if (title.includes('stack') || title.includes('queue') || title.includes('parenth') || title.includes('bracket') || title.includes('valid')) p.category = "Stack & Queue";
        else if (title.includes('bit') || title.includes('xor') || title.includes('odd') || title.includes('even') || title.includes('power') || title.includes('number')) p.category = "Bit Manipulation";
        else if (title.includes('window') || title.includes('slide') || title.includes('consecutive') || title.includes('longest')) p.category = "Sliding Window";
        else if (title.includes('pointer') || title.includes('pair') || title.includes('target')) p.category = "Two Pointers";
        else if (title.includes('heap') || title.includes('kth') || title.includes('priority') || title.includes('top')) p.category = "Heaps & Priority Queue";
        else p.category = CA_CATEGORIES[index % CA_CATEGORIES.length];
    }
    if (!p.companies || p.companies.length === 0) {
        const c1 = CA_COMPANIES[(index * 3) % CA_COMPANIES.length];
        const c2 = CA_COMPANIES[(index * 7 + 2) % CA_COMPANIES.length];
        const c3 = CA_COMPANIES[(index * 11 + 5) % CA_COMPANIES.length];
        p.companies = (index % 3 === 0) ? [c1, c2, c3] : [c1, c2];
    }
});

window.caFilterTab = window.caFilterTab || 'practice';
window.caFilterCategory = window.caFilterCategory || 'All';
window.caFilterCompany = window.caFilterCompany || 'All';
window.caFilterDifficulty = window.caFilterDifficulty || 'All';
window.caFilterStatus = window.caFilterStatus || 'All';
window.caSearchQuery = window.caSearchQuery || '';

window.setCaFilterTab = function(tab) {
    window.caFilterTab = tab;
    if (window.renderTabContent) window.renderTabContent('coding-arena');
};
window.setCaFilterCategory = function(cat) {
    window.caFilterCategory = cat;
    window.caFilterTab = 'practice';
    if (window.renderTabContent) window.renderTabContent('coding-arena');
};
window.setCaFilterCompany = function(comp) {
    window.caFilterCompany = comp;
    window.caFilterTab = 'practice';
    if (window.renderTabContent) window.renderTabContent('coding-arena');
};
window.setCaFilterDifficulty = function(diff) {
    window.caFilterDifficulty = diff;
    if (window.renderTabContent) window.renderTabContent('coding-arena');
};
window.setCaFilterStatus = function(status) {
    window.caFilterStatus = status;
    if (window.renderTabContent) window.renderTabContent('coding-arena');
};
window.resetCaFilters = function() {
    window.caFilterCategory = 'All';
    window.caFilterCompany = 'All';
    window.caFilterDifficulty = 'All';
    window.caFilterStatus = 'All';
    window.caSearchQuery = '';
    const searchInput = document.getElementById('ca-search-input');
    if (searchInput) searchInput.value = '';
    if (window.renderTabContent) window.renderTabContent('coding-arena');
};
window.onCaSearchInput = function(val) {
    window.caSearchQuery = (val || '').toLowerCase();
    const tbody = document.getElementById('ca-problems-table-body');
    if (tbody && window.getCaProblemsTableHTML) {
        tbody.innerHTML = window.getCaProblemsTableHTML();
    }
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
            filtered = filtered.filter(p => p.originalIndex < currentLevel - 1);
        } else if (window.caFilterStatus === 'Unsolved') {
            filtered = filtered.filter(p => p.originalIndex >= currentLevel - 1);
        }
    }
    if (window.caSearchQuery) {
        const q = window.caSearchQuery;
        filtered = filtered.filter(p => 
            p.title.toLowerCase().includes(q) || 
            (p.category && p.category.toLowerCase().includes(q)) || 
            (p.companies && p.companies.some(c => c.toLowerCase().includes(q))) ||
            (`day ${p.originalIndex + 1}`).includes(q)
        );
    }

    if (filtered.length === 0) {
        return `<div style="padding: 3rem; text-align: center; color: var(--text-dim); font-size: 1.05rem; grid-column: 1/-1;">
            <i class="fa-solid fa-magnifying-glass" style="font-size: 2.5rem; margin-bottom: 1rem; opacity: 0.4; color: #00d2ff;"></i><br>
            No algorithmic challenges match your selected filters.<br>
            <button onclick="window.resetCaFilters()" style="margin-top: 1rem; padding: 6px 18px; background: linear-gradient(90deg, #00d2ff, #3a7bd5); border: none; color: #fff; border-radius: 6px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 15px rgba(0,210,255,0.3);">Reset All Filters</button>
        </div>`;
    }

    return filtered.map(p => {
        const i = p.originalIndex;
        const isSolved = i < (currentLevel - 1);
        const isToday = i === todayIdx;

        let statusIcon = '';
        let rowStyle = '';
        let actionBtn = '';

        if (isSolved) {
            statusIcon = '<span style="color: #2ed573; font-size: 1.2rem;" title="Solved">✓</span>';
            actionBtn = `<button class="ca-btn-replay" onclick="window.startSpecificProblem(${i})" style="padding: 5px 14px; font-size: 0.85rem; border-radius: 6px; background: rgba(46, 213, 115, 0.15); color: #2ed573; border: 1px solid rgba(46, 213, 115, 0.4); cursor: pointer; font-weight: 600; transition: all 0.2s;"><i class="fa-solid fa-code"></i> Practice</button>`;
        } else if (isToday && !isDoneToday) {
            statusIcon = '<span style="color: #00d2ff; font-size: 1.2rem;" title="Today\'s Daily Challenge">🔥</span>';
            rowStyle = 'border-color: rgba(0, 210, 255, 0.6); box-shadow: 0 0 15px rgba(0, 210, 255, 0.15); background: linear-gradient(135deg, rgba(0, 210, 255, 0.1), rgba(109, 93, 242, 0.15));';
            actionBtn = `<button class="ca-btn-solve glow-pulse" onclick="window.startSpecificProblem(${i})" style="padding: 5px 16px; font-size: 0.85rem; border-radius: 6px; background: linear-gradient(90deg, #00d2ff, #3a7bd5); color: #fff; border: none; cursor: pointer; font-weight: bold; box-shadow: 0 4px 12px rgba(0, 210, 255, 0.4);">Solve Today</button>`;
        } else {
            statusIcon = '<span style="color: rgba(255,255,255,0.25); font-size: 1.1rem;" title="Unsolved">⭕</span>';
            actionBtn = `<button class="ca-btn-solve" onclick="window.startSpecificProblem(${i})" style="padding: 5px 14px; font-size: 0.85rem; border-radius: 6px; background: rgba(0, 210, 255, 0.15); color: #00d2ff; border: 1px solid rgba(0, 210, 255, 0.4); cursor: pointer; font-weight: 600; transition: all 0.2s;">Solve Now</button>`;
        }

        let diffBadge = '';
        if (p.difficulty === 'Easy') diffBadge = `<span style="color: #00b8a3; background: rgba(0, 184, 163, 0.12); padding: 3px 10px; border-radius: 100px; font-size: 0.75rem; font-weight: 600; border: 1px solid rgba(0, 184, 163, 0.3);">Easy</span>`;
        else if (p.difficulty === 'Medium') diffBadge = `<span style="color: #ffc01e; background: rgba(255, 192, 30, 0.12); padding: 3px 10px; border-radius: 100px; font-size: 0.75rem; font-weight: 600; border: 1px solid rgba(255, 192, 30, 0.3);">Medium</span>`;
        else if (p.difficulty === 'Hard') diffBadge = `<span style="color: #ff375f; background: rgba(255, 55, 95, 0.12); padding: 3px 10px; border-radius: 100px; font-size: 0.75rem; font-weight: 600; border: 1px solid rgba(255, 55, 95, 0.3);">Hard</span>`;
        else diffBadge = `<span style="color: #a855f7; background: rgba(168, 85, 247, 0.15); padding: 3px 10px; border-radius: 100px; font-size: 0.75rem; font-weight: 600; border: 1px solid rgba(168, 85, 247, 0.4); text-shadow: 0 0 8px rgba(168,85,247,0.5);">Mega Hard</span>`;

        const companyBadges = (p.companies || []).slice(0, 2).map(c => 
            `<span style="background: rgba(255,255,255,0.06); color: #cbd5e1; font-size: 0.7rem; padding: 2px 8px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.1);"><i class="fa-solid fa-building" style="font-size:0.6rem; margin-right:3px; color:#a855f7;"></i>${c}</span>`
        ).join(' ');

        return `
        <div class="ca-compact-row" style="${rowStyle}">
            <div style="text-align: center;">${statusIcon}</div>
            <div style="font-weight: 600; font-size: 0.95rem; color: #fff; display: flex; align-items: center; overflow: hidden;">
                <span style="color: var(--text-dim); margin-right: 12px; font-size: 0.85rem; font-family: monospace; width: 60px; display: inline-block; flex-shrink: 0;">Day ${i + 1}</span>
                <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: ${isToday && !isDoneToday ? '#00d2ff' : '#f8fafc'};" title="${p.title}">${p.title}</span>
            </div>
            <div class="ca-hide-md" style="display: flex; flex-wrap: wrap; gap: 6px; align-items: center; overflow: hidden;">
                <span style="font-size: 0.75rem; padding: 2px 8px; background: rgba(0, 210, 255, 0.1); color: #00d2ff; border-radius: 100px; border: 1px solid rgba(0, 210, 255, 0.2);"><i class="fa-solid fa-tag" style="font-size:0.65rem; margin-right:3px;"></i>${p.category}</span>
                ${companyBadges}
            </div>
            <div>${diffBadge}</div>
            <div class="ca-hide-md" style="color: #00d2ff; font-weight: bold; font-size: 0.9rem; font-family: monospace;">+${p.xp} XP</div>
            <div style="text-align: center;">${actionBtn}</div>
        </div>`;
    }).join('');
};


let editorInstance = null;
window.caActiveProblemIndex = null; // null means Explorer mode

export async function renderCodingArena() {
    if (!window.currentUser) return `<div style="padding:2rem;text-align:center;">Please login to access the Coding Arena.</div>`;

    // Fetch user's current progress
    const { data: userStats } = await supabase.from('users').select('current_coding_level, coding_xp, coding_streak, max_coding_streak, last_coding_date').eq('id', window.currentUser.id).single();
    
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
    
    // Robust Admin Check
    const adminEmails = ['tanishqagrawal1103@gmail.com', 'skilmatrix3@gmail.com'];
    const userEmail = (window.currentUser?.email || window.currentUser?.user_metadata?.email || '').toLowerCase();
    const isAdmin = window.currentUser?.role === 'admin' || window.currentUser?.role === 'co-admin' || adminEmails.includes(userEmail) || (window.currentUser?.displayName || '').toLowerCase().includes('tanishq');

    if (window.caActiveProblemIndex === null) {
        // Ensure sidebar and top-bar are visible in Explorer
        setTimeout(() => {
            const sidebar = document.querySelector('.sidebar');
            const topBar = document.querySelector('.top-bar');
            if (sidebar) sidebar.style.display = '';
            if (topBar) topBar.style.display = '';
            
            const mainContent = document.querySelector('.main-content');
            if (mainContent && mainContent.dataset.origPadding !== undefined) {
                mainContent.style.padding = mainContent.dataset.origPadding;
            }
        }, 10);
        
        window.caCurrentLevel = currentLevel;
        window.caTodayIdx = currentLevel - 1;
        window.caIsDoneToday = isDoneToday;
        window.caIsAdmin = isAdmin;

        return `
        <div class="ca-explorer-container fade-in" style="padding: 1rem 2rem; max-width: 1400px; margin: 0 auto; color: #fff; height: calc(100vh - 110px); overflow-y: auto;">
            
            <!-- CUSTOM LEETCODE / GFG STYLES -->
            <style id="ca-leetcode-styles">
                .ca-nav-tab {
                    padding: 8px 18px;
                    border-radius: 8px;
                    font-size: 0.9rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.25s ease;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.08);
                    color: #94a3b8;
                }
                .ca-nav-tab:hover {
                    background: rgba(255,255,255,0.08);
                    color: #fff;
                }
                .ca-nav-tab.active {
                    background: linear-gradient(135deg, rgba(0, 210, 255, 0.2), rgba(58, 123, 213, 0.3));
                    border-color: #00d2ff;
                    color: #00d2ff;
                    box-shadow: 0 0 20px rgba(0, 210, 255, 0.2);
                }
                .ca-filter-select {
                    background: rgba(15, 17, 26, 0.9);
                    border: 1px solid rgba(255,255,255,0.15);
                    color: #fff;
                    padding: 6px 12px;
                    border-radius: 6px;
                    font-size: 0.85rem;
                    outline: none;
                    cursor: pointer;
                    transition: border-color 0.2s;
                }
                .ca-filter-select:focus {
                    border-color: #00d2ff;
                }
                .ca-topic-card, .ca-comp-card {
                    background: linear-gradient(145deg, rgba(23, 26, 35, 0.7), rgba(15, 17, 26, 0.9));
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 12px;
                    padding: 1.2rem;
                    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    cursor: pointer;
                }
                .ca-topic-card:hover, .ca-comp-card:hover {
                    transform: translateY(-4px);
                    border-color: #00d2ff;
                    box-shadow: 0 10px 25px rgba(0, 210, 255, 0.15);
                }
                .ca-compact-row {
                    display: grid;
                    grid-template-columns: 60px 1fr 260px 110px 90px 120px;
                    align-items: center;
                    padding: 0.75rem 1.2rem;
                    background: rgba(23, 26, 35, 0.6);
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 10px;
                    transition: all 0.2s ease;
                    gap: 10px;
                }
                .ca-compact-row:hover {
                    background: rgba(35, 40, 55, 0.85);
                    border-color: rgba(0, 210, 255, 0.4);
                    transform: translateX(4px);
                }
                @media (max-width: 1024px) {
                    .ca-compact-row {
                        grid-template-columns: 50px 1fr 100px 100px;
                    }
                    .ca-hide-md {
                        display: none !important;
                    }
                }
            </style>

            <!-- PREMIUM COMPACT HEADER -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.2rem; background: rgba(15, 17, 26, 0.5); padding: 0.8rem 1.2rem; border-radius: 14px; border: 1px solid rgba(255,255,255,0.06); box-shadow: 0 8px 30px rgba(0,0,0,0.3); backdrop-filter: blur(10px); flex-wrap: wrap; gap: 1rem;">
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <div>
                        <h1 class="font-heading" style="font-size: 1.6rem; margin: 0; background: linear-gradient(90deg, #00f2ff, #6D5DF2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 800;">⚡ Coding Arena</h1>
                        <p style="color: var(--text-dim); font-size: 0.8rem; margin: 0;">LeetCode & GeeksforGeeks Style Practice • Category & Company Wise • Open Solving</p>
                    </div>
                    <button onclick="window.startSpecificProblem(-1)" class="premium-sandbox-btn" style="padding: 5px 12px; font-size: 0.8rem; border-radius: 6px;">
                        <i class="fa-solid fa-code"></i> Free Play Sandbox
                    </button>
                </div>

                <div style="display: flex; gap: 0.8rem; align-items: center;">
                    <!-- Streak Card -->
                    <div style="background: rgba(35, 30, 45, 0.8); padding: 0.5rem 1rem; border-radius: 10px; border: 1px solid rgba(255,71,87,0.3); text-align: center; min-width: 90px;">
                        <div style="font-size: 0.65rem; color: #ff9eaa; font-weight: 700;">🔥 STREAK</div>
                        <div style="font-size: 1.1rem; font-weight: bold; color: #ff4757;">${streak} Days</div>
                    </div>
                    <!-- Progress Card -->
                    <div style="background: rgba(30, 40, 50, 0.8); padding: 0.5rem 1rem; border-radius: 10px; border: 1px solid rgba(0,210,255,0.3); text-align: center; min-width: 130px;">
                        <div style="font-size: 0.65rem; color: #a1e8ff; font-weight: 700;">🎯 SOLVED</div>
                        <div style="font-size: 1.1rem; font-weight: bold; color: #00d2ff;">${isAdmin ? 365 : Math.min(currentLevel - 1, 365)} <span style="font-size:0.8rem; color:rgba(255,255,255,0.5);">/ 365</span></div>
                    </div>
                </div>
            </div>

            <!-- LEETCODE / GFG TOP NAVIGATION TABS -->
            <div style="display: flex; gap: 12px; margin-bottom: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 12px; overflow-x: auto;">
                <div class="ca-nav-tab ${window.caFilterTab === 'practice' ? 'active' : ''}" onclick="window.setCaFilterTab('practice')">
                    <i class="fa-solid fa-list-check"></i> Practice Problems (365)
                </div>
                <div class="ca-nav-tab ${window.caFilterTab === 'daily' ? 'active' : ''}" onclick="window.setCaFilterTab('daily')">
                    <i class="fa-solid fa-fire"></i> Daily Challenge & Archives
                </div>
                <div class="ca-nav-tab ${window.caFilterTab === 'topics' ? 'active' : ''}" onclick="window.setCaFilterTab('topics')">
                    <i class="fa-solid fa-layer-group"></i> Topic Tags (${CA_CATEGORIES.length})
                </div>
                <div class="ca-nav-tab ${window.caFilterTab === 'companies' ? 'active' : ''}" onclick="window.setCaFilterTab('companies')">
                    <i class="fa-solid fa-building"></i> Top Companies (${CA_COMPANIES.length})
                </div>
            </div>

            <!-- TAB CONTENT: PRACTICE PROBLEMS -->
            ${window.caFilterTab === 'practice' ? `
            <div>
                <!-- COMPACT FILTER BAR -->
                <div style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center; justify-content: space-between; background: rgba(23, 26, 35, 0.5); padding: 0.8rem 1.2rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.06); margin-bottom: 1.2rem;">
                    
                    <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 240px; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 4px 12px;">
                        <i class="fa-solid fa-magnifying-glass" style="color: #64748b; font-size: 0.85rem;"></i>
                        <input type="text" id="ca-search-input" value="${window.caSearchQuery || ''}" placeholder="Search problem title, topic, or company..." oninput="window.onCaSearchInput(this.value)" style="background: transparent; border: none; color: #fff; width: 100%; outline: none; font-size: 0.85rem; padding: 6px 0;">
                        ${window.caSearchQuery ? `<i class="fa-solid fa-xmark" style="color: #94a3b8; cursor: pointer;" onclick="document.getElementById('ca-search-input').value=''; window.onCaSearchInput('');"></i>` : ''}
                    </div>

                    <div style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center;">
                        <!-- Category Filter -->
                        <select id="ca-filter-category" class="ca-filter-select" onchange="window.setCaFilterCategory(this.value)">
                            <option value="All">🏷️ All Topics</option>
                            ${CA_CATEGORIES.map(cat => `<option value="${cat}" ${window.caFilterCategory === cat ? 'selected' : ''}>${cat}</option>`).join('')}
                        </select>

                        <!-- Company Filter -->
                        <select id="ca-filter-company" class="ca-filter-select" onchange="window.setCaFilterCompany(this.value)">
                            <option value="All">🏢 All Companies</option>
                            ${CA_COMPANIES.map(comp => `<option value="${comp}" ${window.caFilterCompany === comp ? 'selected' : ''}>${comp}</option>`).join('')}
                        </select>

                        <!-- Difficulty Filter -->
                        <select id="ca-filter-diff" class="ca-filter-select" onchange="window.setCaFilterDifficulty(this.value)">
                            <option value="All">📊 All Difficulties</option>
                            <option value="Easy" ${window.caFilterDifficulty === 'Easy' ? 'selected' : ''}>Easy</option>
                            <option value="Medium" ${window.caFilterDifficulty === 'Medium' ? 'selected' : ''}>Medium</option>
                            <option value="Hard" ${window.caFilterDifficulty === 'Hard' ? 'selected' : ''}>Hard</option>
                            <option value="Mega Hard" ${window.caFilterDifficulty === 'Mega Hard' ? 'selected' : ''}>Mega Hard</option>
                        </select>

                        <!-- Status Filter -->
                        <select id="ca-filter-status" class="ca-filter-select" onchange="window.setCaFilterStatus(this.value)">
                            <option value="All">⚡ All Status</option>
                            <option value="Solved" ${window.caFilterStatus === 'Solved' ? 'selected' : ''}>Solved (✓)</option>
                            <option value="Unsolved" ${window.caFilterStatus === 'Unsolved' ? 'selected' : ''}>Unsolved (⭕)</option>
                        </select>

                        <!-- Reset Button -->
                        ${(window.caFilterCategory !== 'All' || window.caFilterCompany !== 'All' || window.caFilterDifficulty !== 'All' || window.caFilterStatus !== 'All' || window.caSearchQuery) ? `
                        <button onclick="window.resetCaFilters()" style="background: rgba(255, 71, 87, 0.15); border: 1px solid rgba(255, 71, 87, 0.4); color: #ff4757; padding: 6px 12px; border-radius: 6px; font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: all 0.2s;"><i class="fa-solid fa-rotate-left"></i> Reset</button>
                        ` : ''}
                    </div>
                </div>

                <!-- TABLE HEADER -->
                <div style="display: grid; grid-template-columns: 60px 1fr 260px 110px 90px 120px; padding: 0.6rem 1.2rem; color: #64748b; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid rgba(255,255,255,0.08); margin-bottom: 0.6rem; gap: 10px;">
                    <div style="text-align: center;">Status</div>
                    <div>Problem Title</div>
                    <div class="ca-hide-md">Topics & Companies</div>
                    <div>Difficulty</div>
                    <div class="ca-hide-md">Reward</div>
                    <div style="text-align: center;">Action</div>
                </div>

                <!-- TABLE BODY -->
                <div id="ca-problems-table-body" style="display: flex; flex-direction: column; gap: 6px; padding-bottom: 4rem;">
                    ${window.getCaProblemsTableHTML()}
                </div>
            </div>
            ` : ''}

            <!-- TAB CONTENT: DAILY CHALLENGE & ARCHIVES -->
            ${window.caFilterTab === 'daily' ? (() => {
                const todayIdx = currentLevel - 1;
                const tp = codingProblems[todayIdx] || codingProblems[0];
                let tpDiffBadge = '';
                if (tp.difficulty === 'Easy') tpDiffBadge = `<span style="color: #00b8a3; background: rgba(0, 184, 163, 0.15); padding: 4px 12px; border-radius: 100px; font-size: 0.8rem; font-weight: 600; border: 1px solid rgba(0, 184, 163, 0.3);">Easy</span>`;
                else if (tp.difficulty === 'Medium') tpDiffBadge = `<span style="color: #ffc01e; background: rgba(255, 192, 30, 0.15); padding: 4px 12px; border-radius: 100px; font-size: 0.8rem; font-weight: 600; border: 1px solid rgba(255, 192, 30, 0.3);">Medium</span>`;
                else if (tp.difficulty === 'Hard') tpDiffBadge = `<span style="color: #ff375f; background: rgba(255, 55, 95, 0.15); padding: 4px 12px; border-radius: 100px; font-size: 0.8rem; font-weight: 600; border: 1px solid rgba(255, 55, 95, 0.3);">Hard</span>`;
                else tpDiffBadge = `<span style="color: #a855f7; background: rgba(168, 85, 247, 0.2); padding: 4px 12px; border-radius: 100px; font-size: 0.8rem; font-weight: 600; border: 1px solid rgba(168, 85, 247, 0.4);">Mega Hard</span>`;

                const archives = [];
                for (let d = Math.max(0, todayIdx - 14); d <= todayIdx; d++) {
                    if (codingProblems[d]) archives.push({ p: codingProblems[d], idx: d });
                }
                archives.reverse();

                return `
                <div class="fade-in">
                    <!-- HERO: TODAY'S CHALLENGE -->
                    <div style="background: linear-gradient(135deg, rgba(0, 210, 255, 0.15), rgba(109, 93, 242, 0.25)); border: 1px solid rgba(0, 210, 255, 0.5); border-radius: 16px; padding: 2rem; margin-bottom: 2.5rem; position: relative; box-shadow: 0 10px 30px rgba(0, 210, 255, 0.15);">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1.5rem;">
                            <div>
                                <span style="background: #00d2ff; color: #000; font-size: 0.75rem; font-weight: 800; padding: 4px 12px; border-radius: 6px; text-transform: uppercase; letter-spacing: 1px;">🔥 TODAY'S DAILY CHALLENGE</span>
                                <h2 style="font-size: 1.8rem; margin: 0.8rem 0 0.5rem 0; color: #fff;">Day ${todayIdx + 1}: ${tp.title}</h2>
                                <p style="color: #cbd5e1; font-size: 0.95rem; max-width: 700px; line-height: 1.5; margin-bottom: 1rem;">${(tp.description || '').substring(0, 160)}...</p>
                                <div style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center;">
                                    ${tpDiffBadge}
                                    <span style="background: rgba(255,255,255,0.1); color: #00d2ff; font-size: 0.8rem; padding: 4px 12px; border-radius: 100px; border: 1px solid rgba(0,210,255,0.3);"><i class="fa-solid fa-tag" style="margin-right:5px;"></i>${tp.category}</span>
                                    ${(tp.companies || []).map(c => `<span style="background: rgba(168, 85, 247, 0.15); color: #d8b4fe; font-size: 0.8rem; padding: 4px 12px; border-radius: 100px; border: 1px solid rgba(168,85,247,0.3);"><i class="fa-solid fa-building" style="margin-right:5px;"></i>${c}</span>`).join('')}
                                </div>
                            </div>
                            <div style="display: flex; flex-direction: column; align-items: center; gap: 12px; background: rgba(0,0,0,0.4); padding: 1.5rem 2rem; border-radius: 14px; border: 1px solid rgba(255,255,255,0.1);">
                                <div style="color: #00d2ff; font-size: 1.5rem; font-weight: 800; font-family: monospace;">+${tp.xp} XP</div>
                                <button class="ca-btn-solve glow-pulse" onclick="window.startSpecificProblem(${todayIdx})" style="padding: 12px 28px; font-size: 1.05rem; border-radius: 8px; background: linear-gradient(90deg, #00d2ff, #3a7bd5); color: #fff; border: none; cursor: pointer; font-weight: bold; box-shadow: 0 6px 20px rgba(0, 210, 255, 0.4);">
                                    ${!isDoneToday ? '🚀 Solve Challenge Now' : '✓ Practice Again'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- RECENT ARCHIVES -->
                    <h3 style="font-size: 1.2rem; color: #f8fafc; margin-bottom: 1rem; display: flex; align-items: center; gap: 8px;"><i class="fa-solid fa-calendar-days" style="color: #00d2ff;"></i> Recent Daily Challenges Archive (Open Solving)</h3>
                    <div style="display: flex; flex-direction: column; gap: 8px; padding-bottom: 4rem;">
                        ${archives.map(item => {
                            const p = item.p;
                            const idx = item.idx;
                            const isSolved = idx < (currentLevel - 1);
                            return `
                            <div class="ca-compact-row" style="grid-template-columns: 60px 1fr 220px 110px 120px;">
                                <div style="text-align: center;">${isSolved ? '<span style="color:#2ed573; font-size:1.2rem;">✓</span>' : '<span style="color:#00d2ff; font-size:1.2rem;">🔥</span>'}</div>
                                <div style="font-weight: 600; font-size: 0.95rem; color: #fff;">
                                    <span style="color: var(--text-dim); margin-right: 12px; font-family: monospace;">Day ${idx + 1}</span>
                                    <span>${p.title}</span>
                                </div>
                                <div><span style="font-size:0.75rem; padding: 2px 8px; background: rgba(0,210,255,0.1); color: #00d2ff; border-radius: 100px;">${p.category}</span></div>
                                <div><span style="color: ${p.difficulty==='Easy'?'#00b8a3':p.difficulty==='Medium'?'#ffc01e':'#ff375f'}; font-size: 0.8rem; font-weight: 600;">${p.difficulty}</span></div>
                                <div style="text-align: center;">
                                    <button onclick="window.startSpecificProblem(${idx})" style="padding: 5px 14px; font-size: 0.85rem; border-radius: 6px; background: rgba(0,210,255,0.15); color: #00d2ff; border: 1px solid rgba(0,210,255,0.3); cursor: pointer; font-weight: 600;">Solve Archive</button>
                                </div>
                            </div>`;
                        }).join('')}
                    </div>
                </div>`;
            })() : ''}

            <!-- TAB CONTENT: TOPIC TAGS -->
            ${window.caFilterTab === 'topics' ? `
            <div class="fade-in">
                <div style="margin-bottom: 1.5rem;">
                    <h2 style="font-size: 1.4rem; margin: 0 0 0.4rem 0; color: #fff;">📚 Master Algorithms by Topic</h2>
                    <p style="color: var(--text-dim); font-size: 0.9rem; margin: 0;">Select a LeetCode / GFG category to filter and practice curated algorithmic problems.</p>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(270px, 1fr)); gap: 1.2rem; padding-bottom: 4rem;">
                    ${CA_CATEGORIES.map(cat => {
                        const count = codingProblems.filter(p => p.category === cat).length;
                        const icon = CA_TOPIC_ICONS[cat] || 'fa-code';
                        return `
                        <div class="ca-topic-card" onclick="window.setCaFilterCategory('${cat}')">
                            <div>
                                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                                    <div style="width: 44px; height: 44px; border-radius: 10px; background: rgba(0, 210, 255, 0.15); border: 1px solid rgba(0, 210, 255, 0.3); display: flex; align-items: center; justify-content: center; color: #00d2ff; font-size: 1.3rem;">
                                        <i class="fa-solid ${icon}"></i>
                                    </div>
                                    <span style="background: rgba(255,255,255,0.06); color: #cbd5e1; font-size: 0.75rem; padding: 3px 10px; border-radius: 100px; font-weight: 600;">${count} Problems</span>
                                </div>
                                <h3 style="font-size: 1.15rem; color: #fff; margin: 0 0 0.5rem 0; font-weight: 700;">${cat}</h3>
                                <p style="color: var(--text-dim); font-size: 0.8rem; line-height: 1.4; margin: 0;">Practice core data structures and techniques for ${cat.toLowerCase()}.</p>
                            </div>
                            <div style="margin-top: 1.2rem; pt: 1rem; border-top: 1px solid rgba(255,255,255,0.06); display: flex; justify-content: space-between; align-items: center; color: #00d2ff; font-size: 0.85rem; font-weight: 600;">
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
                    <p style="color: var(--text-dim); font-size: 0.9rem; margin: 0;">Practice frequently asked coding interview problems organized by major tech companies.</p>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1.2rem; padding-bottom: 4rem;">
                    ${CA_COMPANIES.map(comp => {
                        const count = codingProblems.filter(p => (p.companies || []).includes(comp)).length;
                        return `
                        <div class="ca-comp-card" onclick="window.setCaFilterCompany('${comp}')">
                            <div>
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                                    <div style="width: 42px; height: 42px; border-radius: 10px; background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.15); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; font-weight: 800; color: #fff;">
                                        <i class="fa-solid fa-building" style="color: #a855f7;"></i>
                                    </div>
                                    <span style="background: rgba(168, 85, 247, 0.15); color: #d8b4fe; border: 1px solid rgba(168, 85, 247, 0.3); font-size: 0.75rem; padding: 3px 10px; border-radius: 100px; font-weight: 600;">${count} Questions</span>
                                </div>
                                <h3 style="font-size: 1.15rem; color: #fff; margin: 0 0 0.3rem 0; font-weight: 700;">${comp}</h3>
                                <p style="color: var(--text-dim); font-size: 0.8rem; margin: 0;">Asked in tech rounds & online assessments.</p>
                            </div>
                            <div style="margin-top: 1.2rem; pt: 1rem; border-top: 1px solid rgba(255,255,255,0.06); display: flex; justify-content: space-between; align-items: center; color: #d8b4fe; font-size: 0.85rem; font-weight: 600;">
                                <span>Solve Questions</span>
                                <i class="fa-solid fa-arrow-right"></i>
                            </div>
                        </div>`;
                    }).join('')}
                </div>
            </div>
            ` : ''}
        </div>`;
    }

    // --- Render COMPILER UI ---
    const isSandbox = window.caActiveProblemIndex === -1;
    const problem = isSandbox ? {
        title: "Sandbox Mode",
        difficulty: "Free Play",
        description: "Write, test, and execute any code you want! No test cases, no XP, just pure freedom.",
        testCases: []
    } : codingProblems[window.caActiveProblemIndex];
    
    const isActuallyToday = !isSandbox && (window.caActiveProblemIndex === (currentLevel - 1) && !isDoneToday);
    
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
    <div class="coding-arena-container fade-in" style="display: flex; gap: 1rem; height: calc(100vh - 10px); color: #fff; padding: 0.5rem 0; overflow: hidden; position: relative;">
        <!-- Left Side: Problem Description (25%) -->
        <div class="ca-left glass-card" style="width: 28%; border-radius: 12px; padding: 1.5rem; display: flex; flex-direction: column; overflow-y: auto; background: var(--ca-panel-bg, linear-gradient(145deg, rgba(30, 32, 42, 0.5) 0%, rgba(15, 17, 26, 0.6) 100%)); border: 1px solid var(--ca-border, rgba(255,255,255,0.05)); box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
            
            <div style="display: flex; align-items: center; margin-bottom: 1.5rem; gap: 12px;">
                <button onclick="window.toggleSidebarArena()" title="Toggle Sidebar" style="background: var(--ca-btn-bg, rgba(255,255,255,0.05)); border: 1px solid var(--ca-btn-border, rgba(255,255,255,0.1)); padding: 8px 12px; border-radius: 8px; color: inherit; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center;">
                    <i class="fa-solid fa-bars"></i>
                </button>
                <button onclick="window.backToExplorer()" style="background: var(--ca-btn-bg, rgba(255,255,255,0.05)); border: 1px solid var(--ca-btn-border, rgba(255,255,255,0.1)); padding: 8px 16px; border-radius: 8px; color: inherit; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 8px; font-weight: 600;">
                    <i class="fa-solid fa-arrow-left"></i> Back
                </button>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem;">
                <div>
                    <div style="color: var(--text-dim); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.4rem; font-weight: 600;">${isSandbox ? 'Free Play' : `Day ${window.caActiveProblemIndex + 1} of 365`}</div>
                    <h2 class="font-heading" style="margin: 0; color: #fff; font-size: 1.6rem; line-height: 1.2; text-shadow: 0 2px 10px rgba(255,255,255,0.1);">${problem.title}</h2>
                </div>
                <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 6px;">
                    <span class="ca-badge ca-diff-${problem.difficulty.toLowerCase().replace(' ', '-')}" style="padding: 4px 12px; border-radius: 20px; font-size: 0.7rem; font-weight: 800; letter-spacing: 1px; box-shadow: 0 2px 8px rgba(0,0,0,0.2); text-transform: uppercase; color: #fff;">
                        ${problem.difficulty}
                    </span>
                    ${problem.category ? `<span style="color: #00d2ff; background: rgba(0, 210, 255, 0.1); border: 1px solid rgba(0, 210, 255, 0.3); padding: 3px 10px; border-radius: 100px; font-size: 0.75rem;"><i class="fa-solid fa-tag" style="margin-right:4px;"></i>${problem.category}</span>` : ''}
                    <div style="display: flex; flex-wrap: wrap; gap: 4px; justify-content: flex-end;">
                        ${(problem.companies || []).map(c => `<span style="color: #d8b4fe; background: rgba(168, 85, 247, 0.15); border: 1px solid rgba(168, 85, 247, 0.3); padding: 2px 8px; border-radius: 100px; font-size: 0.7rem;"><i class="fa-solid fa-building" style="margin-right:3px;"></i>${c}</span>`).join('')}
                    </div>
                </div>
            </div>

            <div class="ca-desc" style="line-height: 1.7; color: rgba(255,255,255,0.85); font-size: 0.95rem; flex: 1; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 1.5rem;">
                ${problem.description.replace(/\\n/g, '<br>')}
                
                ${!isSandbox ? `
                <h3 class="font-heading" style="margin-top: 2rem; color: inherit; font-size: 1.1rem; border-bottom: 1px solid var(--ca-border, rgba(255,255,255,0.05)); padding-bottom: 0.5rem;">Test Cases</h3>
                <div style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem;">
                    ${problem.testCases.map((tc, i) => `
                    <div style="background: var(--ca-tc-bg, rgba(0,0,0,0.3)); padding: 12px 18px; border-radius: 8px; border-left: 3px solid var(--primary); font-family: 'Fira Code', monospace; font-size: 0.85rem;">
                        <div style="margin-bottom: 8px;"><span style="color: var(--text-dim); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px;">Input:</span><br><span style="color: var(--ca-text-sec, #a0aec0);">${tc.input}</span></div>
                        <div><span style="color: var(--text-dim); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px;">Output:</span><br><span style="color: #2ed573;">${tc.output}</span></div>
                    </div>`).join('')}
                </div>` : ''}
            </div>
        </div>

        <!-- Middle Side: Editor (47%) -->
        <div class="ca-mid" style="width: 47%; display: flex; flex-direction: column; gap: 1rem;">
            
            <!-- Editor Top Bar -->
            <div class="glass-card" style="display: flex; justify-content: space-between; padding: 10px 15px; border-radius: 12px; align-items: center; background: var(--ca-panel-bg, linear-gradient(90deg, rgba(30, 32, 42, 0.6) 0%, rgba(20, 22, 32, 0.7) 100%)); flex-shrink: 0; border: 1px solid var(--ca-border, rgba(255,255,255,0.05));">
                <div style="display: flex; align-items: center; gap: 0.8rem; flex-wrap: wrap;">
                    <div style="display: flex; align-items: center; background: var(--ca-tc-bg, rgba(0,0,0,0.4)); padding: 4px; border-radius: 8px; border: 1px solid var(--ca-border, rgba(255,255,255,0.08));">
                        <i class="fa-solid fa-code" style="color: var(--text-dim); margin-left: 8px; margin-right: 4px; font-size: 0.8rem;"></i>
                        <select id="ca-lang" style="background: transparent; color: inherit; border: none; padding: 4px 8px; outline: none; font-family: inherit; font-size: 0.8rem; cursor: pointer;" onchange="window.changeCodingLanguage()">
                            <option value="c" data-ver="gcc-13.2.0-c" class="ca-opt" style="background: #1a202c; color: #fff;">C (GCC)</option>
                            <option value="cpp" data-ver="gcc-13.2.0" class="ca-opt" style="background: #1a202c; color: #fff;">C++ (GCC)</option>
                            <option value="csharp" data-ver="mono-6.12.0.122" class="ca-opt" style="background: #1a202c; color: #fff;">C# (Mono)</option>
                            <option value="java" data-ver="openjdk-jdk-22+36" class="ca-opt" style="background: #1a202c; color: #fff;">Java</option>
                            <option value="javascript" data-ver="nodejs-20.17.0" class="ca-opt" style="background: #1a202c; color: #fff;">JavaScript (Node)</option>
                            <option value="python" data-ver="cpython-3.14.0" class="ca-opt" style="background: #1a202c; color: #fff;">Python 3</option>
                            <option value="rust" data-ver="rust-1.78.0" class="ca-opt" style="background: #1a202c; color: #fff;">Rust</option>
                            <option value="go" data-ver="go-1.22.3" class="ca-opt" style="background: #1a202c; color: #fff;">Go</option>
                            <option value="swift" data-ver="swift-5.10" class="ca-opt" style="background: #1a202c; color: #fff;">Swift</option>
                        </select>
                    </div>

                    <div style="display: flex; align-items: center; background: var(--ca-tc-bg, rgba(0,0,0,0.4)); padding: 4px; border-radius: 8px; border: 1px solid var(--ca-border, rgba(255,255,255,0.08));">
                        <i class="fa-solid fa-font" style="color: var(--text-dim); margin-left: 8px; margin-right: 4px; font-size: 0.8rem;"></i>
                        <select id="ca-fontsize" style="background: transparent; color: inherit; border: none; padding: 4px 8px; outline: none; font-family: inherit; font-size: 0.8rem; cursor: pointer;" onchange="window.changeEditorConfig()">
                            <option value="12px" class="ca-opt" style="background: #1a202c; color: #fff;">12px</option>
                            <option value="14px" selected class="ca-opt" style="background: #1a202c; color: #fff;">14px</option>
                            <option value="16px" class="ca-opt" style="background: #1a202c; color: #fff;">16px</option>
                            <option value="18px" class="ca-opt" style="background: #1a202c; color: #fff;">18px</option>
                        </select>
                    </div>

                    <div style="display: flex; align-items: center; background: var(--ca-tc-bg, rgba(0,0,0,0.4)); padding: 4px; border-radius: 8px; border: 1px solid var(--ca-border, rgba(255,255,255,0.08));">
                        <i class="fa-solid fa-palette" style="color: var(--text-dim); margin-left: 8px; margin-right: 4px; font-size: 0.8rem;"></i>
                        <select id="ca-theme" style="background: transparent; color: inherit; border: none; padding: 4px 8px; outline: none; font-family: inherit; font-size: 0.8rem; cursor: pointer;" onchange="window.changeEditorConfig()">
                            <option value="dracula" class="ca-opt" style="background: #1a202c; color: #fff;">Dark (Dracula)</option>
                            <option value="default" class="ca-opt" style="background: #1a202c; color: #fff;">Light (Default)</option>
                        </select>
                    </div>
                </div>

                <button id="btn-run-code" onclick="window.runUserCode(${isActuallyToday})" class="btn btn-primary" style="padding: 8px 20px; border-radius: 20px; font-weight: 600; letter-spacing: 0.5px; font-size: 0.85rem; box-shadow: 0 2px 10px rgba(108, 99, 255, 0.3); display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
                    <i class="fa-solid fa-play"></i> Run Code ${isActuallyToday ? '& Submit' : ''}
                </button>
            </div>

            <!-- CodeMirror Wrapper -->
            <div class="glass-card" style="flex: 1; border-radius: 12px; overflow: hidden; position: relative; border: 1px solid var(--ca-border, rgba(255,255,255,0.05)); box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
                <textarea id="ca-editor" style="display: none;"></textarea>
            </div>
        </div>

        <!-- Right Side: Terminal Output (25%) -->
        <div class="ca-right" style="width: 25%; background: var(--ca-term-bg, #0a0e17); border-radius: 12px; padding: 0; border: 1px solid var(--ca-border, rgba(255,255,255,0.05)); display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
            <div style="background: var(--ca-term-head, rgba(255,255,255,0.02)); padding: 12px 15px; border-bottom: 1px solid var(--ca-border, rgba(255,255,255,0.03)); display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;">
                <span style="color: var(--text-dim); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;"><i class="fa-solid fa-terminal" style="margin-right: 5px;"></i> Terminal</span>
            </div>
            <div id="ca-console" style="color: var(--ca-text-sec, #a0aec0); padding: 15px; overflow-y: auto; font-family: 'Fira Code', Consolas, monospace; font-size: 0.85rem; line-height: 1.6; white-space: pre-wrap; flex: 1;">Ready to execute...</div>
        </div>

    </div>
    `;
}

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
        fontSize: "14px"
    });
    
    editorInstance.setSize("100%", "100%");
    editorInstance.setValue("// Write your logic here\\n// Read from STDIN and print to STDOUT\\n");
}

window.startSpecificProblem = function(index) {
    window.caActiveProblemIndex = index;
    if (window.renderTabContent) window.renderTabContent('coding-arena');
}

window.backToExplorer = function() {
    window.caActiveProblemIndex = null;
    if (window.renderTabContent) window.renderTabContent('coding-arena');
}



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
    }
}

window.runUserCode = async function(isActuallyToday) {
    const btn = document.getElementById('btn-run-code');
    const consoleOut = document.getElementById('ca-console');
    
    const code = editorInstance.getValue();
    const sel = document.getElementById('ca-lang');
    const lang = sel.value;
    const ver = sel.options[sel.selectedIndex].getAttribute('data-ver');

    const isSandbox = window.caActiveProblemIndex === -1;

    btn.disabled = true;
    btn.innerText = "Running...";
    consoleOut.innerHTML = "<span style='color:#00d2ff'>Sending code to Compiler Engine...</span><br>";

    if (isSandbox) {
        try {
            const res = await fetch('https://wandbox.org/api/compile.json', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    compiler: ver,
                    code: code,
                    stdin: ""
                })
            });
            const data = await res.json();
            
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
        btn.disabled = false;
        btn.innerHTML = `<i class="fa-solid fa-play"></i> Run Code`;
        return;
    }

    const problem = codingProblems[window.caActiveProblemIndex];

    let passedAll = true;
    let consoleLog = "";

    // Test cases sequentially
    for (let i = 0; i < problem.testCases.length; i++) {
        const tc = problem.testCases[i];
        
        try {
            const res = await fetch('https://wandbox.org/api/compile.json', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    compiler: ver,
                    code: code,
                    stdin: tc.input
                })
            });

            const data = await res.json();
            
            if (data.status !== "0" && !data.program_output) {
                consoleLog += `<div style="color: #ff4757; margin-top: 10px;"><b>Test Case ${i+1} Compile/Run Error:</b>\\n${data.compiler_error || data.program_error || 'Unknown Error'}</div>`;
                passedAll = false;
                break;
            }

            const outStr = (data.program_output || "").trim();
            const errStr = (data.program_error || "").trim();

            if (errStr) {
                consoleLog += `<div style="color: #ff4757; margin-top: 10px;"><b>Test Case ${i+1} Error:</b>\\n${errStr}</div>`;
                passedAll = false;
                break;
            }

            if (outStr === tc.output.trim()) {
                consoleLog += `<div style="color: #2ed573; margin-top: 10px;"><b>Test Case ${i+1} Passed!</b></div>`;
            } else {
                consoleLog += `<div style="color: #ff4757; margin-top: 10px;"><b>Test Case ${i+1} Failed.</b><br>Expected:<br><span style="color:#a0aec0">${tc.output}</span><br>Got:<br><span style="color:#a0aec0">${outStr}</span></div>`;
                passedAll = false;
                break;
            }

        } catch (e) {
            consoleLog += `<div style="color: #ff4757; margin-top: 10px;">Network error reaching compiler: ${e.message}</div>`;
            passedAll = false;
            break;
        }
    }

    consoleOut.innerHTML = consoleLog;

    if (passedAll) {
        consoleOut.innerHTML += `<div style="margin-top:1.5rem; color: #00d2ff; font-weight:bold; font-size:1.1rem;">🎉 SUCCESS! All test cases passed!</div>`;
        if (isActuallyToday) {
            await handleProblemSolved();
        } else {
            consoleOut.innerHTML += `<div style="margin-top:0.5rem; color: var(--text-dim);">Practice mode: No XP or streak awarded since this isn't today's target challenge.</div>`;
        }
    } else {
        consoleOut.innerHTML += `<div style="margin-top:1.5rem; color: #ff4757; font-weight:bold;">Keep trying! Check your logic.</div>`;
    }

    btn.disabled = false;
    btn.innerHTML = `<i class="fa-solid fa-play"></i> Run Code ${isActuallyToday ? '& Submit' : ''}`;
}

async function handleProblemSolved() {
    const problem = codingProblems[window.caActiveProblemIndex];
    
    // Fetch latest user state
    const { data: userStats } = await supabase.from('users').select('*').eq('id', window.currentUser.id).single();
    
    const todayStr = new Date().toDateString();
    let newStreak = userStats.coding_streak || 0;
    
    if (userStats.last_coding_date !== todayStr) {
        newStreak += 1;
    }

    const newMax = Math.max(newStreak, userStats.max_coding_streak || 0);
    const newXP = (userStats.coding_xp || 0) + problem.xp;
    const newLevel = (userStats.current_coding_level || 1) + 1;

    await supabase.from('users').update({
        current_coding_level: newLevel,
        coding_xp: newXP,
        coding_streak: newStreak,
        max_coding_streak: newMax,
        last_coding_date: todayStr
    }).eq('id', window.currentUser.id);

    if (window.showToast) window.showToast(`+${problem.xp} XP Awarded! Streak: ${newStreak} 🔥`);
    
    setTimeout(() => {
        window.backToExplorer(); // Return to explorer automatically
    }, 3000);
}
