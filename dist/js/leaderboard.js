// Standalone Leaderboard Script
// Derived from dashboard.js logic

const LeaderboardData = {
    user: [
        { id: 'l1', name: 'Tanishq', views: 856, score: 2400, rank: 1, avatar: 'assets/avatars/1.png?v=6.0' },
        { id: 'l2', name: 'Ankit Sharma', views: 720, score: 2100, rank: 2, avatar: null },
        { id: 'l3', name: 'Riya Patel', views: 690, score: 1950, rank: 3, avatar: null },
        { id: 'l4', name: 'Sneha Gupta', views: 540, score: 1400, rank: 4, avatar: null },
        { id: 'l5', name: 'Rahul Verma', views: 430, score: 1100, rank: 5, avatar: null },
    ],
    contributor: [
        { id: 'c1', name: 'Ankit Sharma', uploads: 12, downloads: 8400, score: 5600, rank: 1, avatar: null },
        { id: 'c2', name: 'Prof. Mehta', uploads: 8, downloads: 6100, score: 4200, rank: 2, avatar: null },
        { id: 'c3', name: 'Rahul Verma', uploads: 5, downloads: 3200, score: 2800, rank: 3, avatar: null },
    ],
    college: [
        { id: 'u1', name: 'Medi-Caps University', views: 42000, students: 3400, score: 9800, rank: 1, logo: '🏛️' },
        { id: 'u2', name: 'SGSITS Indore', views: 31000, students: 2100, score: 8500, rank: 2, logo: '🎓' },
        { id: 'u3', name: 'IIPS DAVV', views: 18000, students: 1500, score: 6200, rank: 3, logo: '📚' },
    ]
};

document.addEventListener('DOMContentLoaded', () => {
    renderLeaderboard();
});

function renderLeaderboard() {
    const contentArea = document.getElementById('tab-content');
    if (!contentArea) return;

    contentArea.innerHTML = `
        <div class="tab-pane active fade-in leaderboard-pane">
            <!-- Header -->
            <div class="leaderboard-header-section">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <h1 class="font-heading lb-main-title" style="margin: 0; line-height: 1.1; letter-spacing: -1.5px;">
                        <span class="lb-title-emoji" style="font-size: 2.5rem; filter: drop-shadow(0 0 15px rgba(255, 215, 0, 0.4)); animation: float 3s ease-in-out infinite;">🏆</span>
                        <span class="lb-glow-text" style="font-size: 2.5rem; background: linear-gradient(135deg, #7B61FF 0%, #00F2FF 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 900; text-shadow: 0 10px 20px rgba(123, 97, 255, 0.2);">Leaderboard</span>
                    </h1>
                </div>
                <p style="color: rgba(255, 255, 255, 0.5); font-size: 1.1rem; max-width: 500px; margin-left: 5px;">Compete, contribute, and track your academic standing in real-time across the network.</p>
            </div>
                <!-- Controls -->
                <div class="lb-tabs-container">
                    <div class="lb-tabs">
                        <div class="lb-tab active lb-3d-tab" data-type="contributor">📤 Top Uploaders</div>
                        <div class="lb-tab lb-3d-tab" data-type="college">🏫 Power Colleges</div>
                        <div class="lb-tab lb-3d-tab" data-type="referral">🔗 Referrals</div>
                        <div class="lb-tab lb-3d-tab" data-type="coders">💻 Elite Coders</div>
                    </div>
                </div>
            </div>

            <div class="leaderboard-container">
                <!-- Main Leaderboard List -->
                <div class="leaderboard-main glass-card" style="padding: 2rem;">
                    
                    <div style="display: flex; justify-content: space-between; margin-bottom: 1.5rem;">
                        <div class="time-filters">
                            <div class="time-filter active" data-time="today">Today</div>
                            <div class="time-filter" data-time="week">Week</div>
                            <div class="time-filter" data-time="month">Month</div>
                            <div class="time-filter" data-time="all">All Time</div>
                        </div>
                        <div style="font-size: 0.8rem; color: var(--text-dim);">
                             Auto-updates every 10s
                        </div>
                    </div>

                    <div id="lb-list-container" class="leaderboard-list">
                        <!-- Populated via JS -->
                    </div>
                </div>

                <!-- Sidebar / Widget Area -->
                <div class="lb-sidebar">
                    
                    <!-- 1. Personal Rank Tracker -->
                    <div class="personal-rank-card" style="background: linear-gradient(135deg, rgba(123, 97, 255, 0.12), rgba(0, 242, 255, 0.05)); border: 1.5px solid rgba(123, 97, 255, 0.2); box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4); border-radius: 24px; padding: 1.8rem; position: relative; overflow: hidden;">
                        <div style="position: absolute; top: -50px; right: -50px; width: 120px; height: 120px; background: radial-gradient(circle, rgba(0, 242, 255, 0.15) 0%, transparent 70%); pointer-events: none;"></div>
                        <div style="position: relative; z-index: 2;">
                            <h4 style="margin-bottom: 1.25rem; color: white; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; font-size: 0.85rem; opacity: 0.8;">Your Standing</h4>
                            <div class="rank-stat">
                                <span class="label">Student Rank</span>
                                <div style="display:flex; align-items:center; gap: 8px;">
                                    <span class="value">#1</span>
                                    <span class="rank-change rank-up">↑ 2</span>
                                </div>
                            </div>
                            <div class="rank-stat">
                                <span class="label">Contributor Rank</span>
                                <div style="display:flex; align-items:center; gap: 8px;">
                                    <span class="value">#12</span>
                                    <span class="rank-change rank-down">↓ 1</span>
                                </div>
                            </div>
                            <div style="margin-top: 1rem; padding-top: 0.5rem; border-top: 1px solid rgba(255,255,255,0.1);">
                                <span class="label">Score</span>
                                <span class="value" style="float: right; color: var(--secondary);">2,450 XP</span>
                            </div>
                        </div>
                    </div>

                    <!-- 2. Live Activity Feed -->
                    <div class="glass-card" style="padding: 1.5rem;">
                        <h4 style="margin-bottom: 1rem; font-size: 1rem;">🔴 Live Activity</h4>
                        <div id="activity-feed" class="activity-feed">
                            <!-- Populated via JS -->
                        </div>
                    </div>

                    <!-- 3. Badges -->
                    <div class="glass-card" style="padding: 1.5rem;">
                        <h4 style="margin-bottom: 1rem; font-size: 1rem;">🎖️ Your Badges</h4>
                        <div style="display:flex; gap: 0.5rem; flex-wrap: wrap;">
                            <span title="Early Adopter" style="font-size: 1.5rem; cursor: help;">🚀</span>
                            <span title="Top Viewer" style="font-size: 1.5rem; cursor: help;">👁️</span>
                            <span title="First Upload" style="font-size: 1.5rem; cursor: help; opacity: 0.3;">📤</span>
                            <span title="Scholar" style="font-size: 1.5rem; cursor: help; opacity: 0.3;">🎓</span>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    `;

    initLeaderboardListeners();
}

function initLeaderboardListeners() {
    // Type Switching
    const typeTabs = document.querySelectorAll('.lb-tab');
    typeTabs.forEach(tab => {
        tab.onclick = () => {
            document.querySelectorAll('.lb-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            updateLeaderboardUI(tab.dataset.type, 'week'); // Default to week
        };
    });

    // Time Switching
    const timeFilters = document.querySelectorAll('.time-filter');
    timeFilters.forEach(filter => {
        filter.onclick = () => {
            document.querySelectorAll('.time-filter').forEach(t => t.classList.remove('active'));
            filter.classList.add('active');
            // In a real app, this would fetch filtered data. Here we simulated.
            const activeType = document.querySelector('.lb-tab.active').dataset.type;
            updateLeaderboardUI(activeType, filter.dataset.time);
        };
    });

    // Initial Render
    updateLeaderboardUI('contributor', 'today');
    startActivityFeed();
};

function updateLeaderboardUI(type, timeframe) {
    const list = document.getElementById('lb-list-container');
    if (!list) return;

    const { db, collection, query, orderBy, limit, onSnapshot } = window.firebaseServices || {};
    if (!db) {
        list.innerHTML = '<p style="text-align:center; padding: 2rem; color: var(--text-dim);">Syncing with Cloud Hub...</p>';
        return;
    }

    // Determine collection and ordering based on type
    let orderField = 'xp';

    const renderLeaderboardData = (data, type, orderField) => {
        if (data.length === 0) {
            list.innerHTML = '<p style="text-align:center; padding: 2rem; color: var(--text-dim);">No rankings found yet. Be the first!</p>';
            return;
        }

        // --- NEW: Update "Your Standing" Widget ---
        if (window.currentUser) {
            const myRank = data.findIndex(item => item.id === window.currentUser.id) + 1;
            const myScore = data.find(item => item.id === window.currentUser.id)?.[orderField] || 0;

            const valueEls = document.querySelectorAll('.personal-rank-card .value');
            if (valueEls && valueEls.length >= 3) {
                if (type === 'student') {
                    const rankEls = document.querySelectorAll('.personal-rank-card .rank-stat .value');
                    if (rankEls[0]) rankEls[0].innerText = myRank > 0 ? `#${myRank}` : 'N/A';
                } else if (type === 'contributor') {
                    const rankEls = document.querySelectorAll('.personal-rank-card .rank-stat .value');
                    if (rankEls[1]) rankEls[1].innerText = myRank > 0 ? `#${myRank}` : 'N/A';
                }
                valueEls[2].innerText = `${myScore.toLocaleString()} ${type === 'student' ? 'XP' : 'pts'}`;
            }
        }

        list.innerHTML = data.map((item, index) => {
            const rankClass = index < 3 ? `top-3 rank-${index + 1}` : '';
            const rankIcon = index < 3 ? ['🥇', '🥈', '🥉'][index] : `#${index + 1}`;
            
            // Premium Borders for standalone UI
            const borderColor = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? '#cd7f32' : 'transparent';
            const borderStyle = index < 3 ? `border: 2px solid ${borderColor}; box-shadow: 0 0 15px ${borderColor}40;` : '';

            // Systematic logo/avatar rendering
            const imgPath = item.logo || item.avatar; // Prefer logo for institutions
            let avatarHtml = '';

            if (imgPath) {
                let resolvedPath = imgPath;
                if (resolvedPath.startsWith('assets/')) {
                    resolvedPath = '../' + resolvedPath;
                }
                avatarHtml = `<img src="${resolvedPath}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
                              <span class="lb-avatar-letter" style="display:none">${item.name ? item.name[0] : '?'}</span>`;
            } else {
                avatarHtml = `<span class="lb-avatar-letter">${item.name ? item.name[0] : '?'}</span>`;
            }

            let metaHtml = '';
            if (type === 'student') {
                metaHtml = `<span class="score-val">${item.xp || 0} XP</span><span class="score-label">Points</span>`;
            } else if (type === 'contributor') {
                metaHtml = `<span class="score-val">${item.uploads || 0}</span><span class="score-label">Uploads</span>`;
            } else if (type === 'neurosprint') {
                metaHtml = `<span class="score-val">${window.formatFocusTime ? window.formatFocusTime(item.focusminutes || 0) : (item.focusminutes || 0) + 'm'}</span><span class="score-label">Total Time</span>`;
            } else if (type === 'college') {
                metaHtml = `<span class="score-val">${item.uploads || 0}</span><span class="score-label">Notes Uploaded</span>`;
            } else if (type === 'referral') {
                metaHtml = `<span class="score-val">${item.referral_count || 0}</span><span class="score-label">Referrals</span>`;
            } else if (type === 'coders') {
                metaHtml = `<div style="display:flex; flex-direction:column; align-items:flex-end; gap:2px;"><span class="score-val" style="color:#00d2ff">${item.coding_xp || 0} XP</span><span class="score-label" style="color:#ff4757; font-weight:bold; font-size:0.8rem; text-transform:uppercase;">🔥 ${(item.coding_streak || 0)} Streak</span></div>`;
            }

            return `
                <div class="lb-entry ${rankClass}" style="${borderStyle} border-radius: 12px; margin-bottom: 8px;">
                    <div class="lb-rank rank-${index + 1}">${rankIcon}</div>
                    
                    <div class="lb-user-content">
                        <div class="lb-avatar-container">
                            ${avatarHtml}
                            ${index === 0 ? '<div class="lb-badge">👑</div>' : ''}
                        </div>
                        <div class="lb-info">
                            <h4>${item.name || "Anonymous"}</h4>
                            <p>${type === 'college' ? (item.city || 'University') : (item.collegename || "Student")}</p>
                        </div>
                    </div>

                    <div class="lb-score">
                        ${metaHtml}
                    </div>
                </div>
            `;
        }).join('');
    };

    if (window.leaderboardUnsubscribe) { window.leaderboardUnsubscribe(); window.leaderboardUnsubscribe = null; }

    orderField = 'xp';
    if (type === 'student') orderField = 'xp';
    else if (type === 'contributor') orderField = 'uploads';
    else if (type === 'neurosprint') orderField = 'focusminutes';
    else if (type === 'referral') orderField = 'referral_count';
    else if (type === 'coders') orderField = 'coding_xp';
    else if (type === 'college') orderField = 'uploads'; // We will aggregate and sort by uploads

    import('./supabase-config.js?v=1.0').then(async ({ supabase }) => {
        const fetchAndRender = async () => {
            if (type === 'college') {
                const { data, error } = await supabase.from('users').select('collegename, uploads, xp');
                if (!error && data) {
                    const normalizeCollegeName = (name) => {
                        if (!name || name === 'Unknown') return 'Independent Scholars';
                        const lower = name.toLowerCase().replace(/[^a-z0-9]/g, '');
                        if (lower.includes('medicaps') || lower === 'mu') return 'Medicaps University';
                        if (lower.includes('svvv') || lower.includes('vaishnav')) return 'SVVV Indore';
                        if (lower.includes('ips')) return 'IPS Academy';
                        if (lower.includes('sgsits')) return 'SGSITS Indore';
                        if (lower.includes('davv') || lower.includes('devi') || lower.includes('ahilya')) return 'DAVV Indore';
                        if (lower.includes('vit') || lower.includes('vellore')) return 'VIT Vellore';
                        if (lower.includes('srm')) return 'SRM University';
                        if (lower.includes('iitd') || lower.includes('delhi')) return 'IIT Delhi';
                        if (lower.includes('lpu') || lower.includes('lovely')) return 'LPU Punjab';
                        if (lower.includes('manipal')) return 'Manipal University';
                        if (lower.includes('lnct')) return 'LNCT Bhopal';
                        if (lower.includes('cdgi') || lower.includes('chameli')) return 'CDGI Indore';
                        return name.trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
                    };
                    
                    const getCollegeLogo = (normalizedName) => {
                        const logos = {
                            'Medicaps University': 'assets/logos/medicaps.png',
                            'SVVV Indore': 'assets/logos/svvv.png', // Assuming we have it or it'll gracefully fallback
                            'IPS Academy': 'assets/logos/ips.png',
                            'SGSITS Indore': 'assets/logos/sgsits.png',
                            'DAVV Indore': 'assets/logos/davv.png',
                            'VIT Vellore': 'assets/logos/vit.png',
                            'SRM University': 'assets/logos/srm.png',
                            'IIT Delhi': 'assets/logos/iitd.png',
                            'LPU Punjab': 'assets/logos/lpu.png',
                            'Manipal University': 'assets/logos/manipal.png',
                            'LNCT Bhopal': 'assets/logos/lnct.jpg',
                            'CDGI Indore': 'assets/logos/cdgi.png'
                        };
                        return logos[normalizedName] || null;
                    };

                    const collMap = {};
                    data.forEach(u => {
                        const cname = normalizeCollegeName(u.collegename);
                        if (!collMap[cname]) collMap[cname] = { id: cname, name: cname, logo: getCollegeLogo(cname), uploads: 0, xp: 0, views: 0 };
                        collMap[cname].uploads += (u.uploads || 0);
                        collMap[cname].xp += (u.xp || 0);
                        collMap[cname].views = collMap[cname].uploads * 15 + collMap[cname].xp; // Faux views based on real activity
                    });
                    const aggregated = Object.values(collMap).sort((a, b) => b.uploads - a.uploads).slice(0, 20);
                    renderLeaderboardData(aggregated, type, 'uploads');
                }
            } else if (type === 'referral') {
                // Query profiles table for referral stats
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, name, email, avatar, college, referral_count, referral_points, xp')
                    .order('referral_count', { ascending: false })
                    .gt('referral_count', 0)
                    .limit(20);
                if (!error && data) {
                    // Adapt to leaderboard format
                    const adapted = data.map(p => ({
                        id: p.id,
                        name: p.name || p.email?.split('@')[0] || 'Scholar',
                        avatar: p.avatar || null,
                        collegename: p.college || 'Scholar',
                        referral_count: p.referral_count || 0,
                        referral_points: p.referral_points || 0,
                        xp: p.xp || 0
                    }));
                    if (adapted.length === 0) {
                        list.innerHTML = '<p style="text-align:center; padding: 2rem; color: var(--text-dim);">No referrals yet. Be the first to invite friends! 🔗</p>';
                    } else {
                        renderLeaderboardData(adapted, type, 'referral_count');
                    }
                }
            } else {
                const { data, error } = await supabase.from('users').select('*').order(orderField, { ascending: false }).limit(20);
                if (!error && data) renderLeaderboardData(data, type, orderField);
            }
        };
        fetchAndRender();

        if (window.leaderboardSubscription) supabase.removeChannel(window.leaderboardSubscription);
        window.leaderboardSubscription = supabase.channel('public:users')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, payload => {
                fetchAndRender();
            }).subscribe();
    });
}

function startActivityFeed() {
    const feed = document.getElementById('activity-feed');
    if (!feed) return;

    const { db, collection, query, orderBy, limit, onSnapshot } = window.firebaseServices || {};
    if (!db) return;

    // Fetch latest notes (approved or not, just for activity feed)
    const q = query(collection(db, "notes"), orderBy("createdAt", "desc"), limit(5));
    onSnapshot(q, (snapshot) => {
        feed.innerHTML = snapshot.docs.map(doc => {
            const n = doc.data();
            return `
                <div class="activity-item">
                    <div class="activity-icon">📤</div>
                    <div class="activity-text">
                        <strong>${n.uploaderName || 'Scholar'}</strong> uploaded ${n.title}
                        <span class="activity-meta">Just now</span>
                    </div>
                </div>
            `;
        }).join('');
    });
}

function createActivityHTML(act) {
    return `
        <div class="activity-item">
            <div class="activity-icon">${act.icon}</div>
            <div class="activity-text">
                ${act.text}
                <span class="activity-meta">${act.time}</span>
            </div>
        </div>
    `;
}

function formatNumber(num) {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num;
}

if (!window.formatFocusTime) {
    window.formatFocusTime = (mins) => {
        if (!mins) return "0m";
        if (mins < 60) return `${mins}m`;
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return m > 0 ? `${h}h ${m}m` : `${h}h`;
    };
}
