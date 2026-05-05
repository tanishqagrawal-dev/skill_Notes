// Standalone Leaderboard Script
// Derived from dashboard.js logic

const LeaderboardData = {
    user: [
        { id: 'l1', name: 'Tanishq', views: 856, score: 2400, rank: 1, avatar: 'assets/avatars/1.png' },
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
                        <div class="lb-tab active" data-type="student">🧑🎓 Students</div>
                        <div class="lb-tab" data-type="contributor">📤 Contributors</div>
                        <div class="lb-tab" data-type="college">🏫 Colleges</div>
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
    updateLeaderboardUI('student', 'today');
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
    let colRef;
    let orderField;

    if (type === 'college') {
        colRef = collection(db, "colleges");
        orderField = "views"; // Assume views for colleges
    } else {
        colRef = collection(db, "users");
        orderField = type === 'student' ? "xp" : "uploads";
    }

    const q = query(colRef, orderBy(orderField, "desc"), limit(20));

    onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

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

            // Systematic logo/avatar rendering
            const imgPath = item.logo || item.avatar; // Prefer logo for institutions
            let avatarHtml = '';

            if (imgPath) {
                // If path starts with .., adjust if needed (but currently in /pages/dashboard.html, so ../ is correct)
                avatarHtml = `<img src="${imgPath}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
                              <span class="lb-avatar-letter" style="display:none">${item.name ? item.name[0] : '?'}</span>`;
            } else {
                avatarHtml = `<span class="lb-avatar-letter">${item.name ? item.name[0] : '?'}</span>`;
            }

            let metaHtml = '';
            if (type === 'student') {
                metaHtml = `<span class="score-val">${item.xp || 0} XP</span><span class="score-label">Points</span>`;
            } else if (type === 'contributor') {
                metaHtml = `<span class="score-val">${item.uploads || 0}</span><span class="score-label">Uploads</span>`;
            } else if (type === 'college') {
                metaHtml = `<span class="score-val">${formatNumber(item.views || 0)}</span><span class="score-label">Total Views</span>`;
            }

            return `
                <div class="lb-entry ${rankClass}">
                    <div class="lb-rank rank-${index + 1}">${rankIcon}</div>
                    
                    <div class="lb-user-content">
                        <div class="lb-avatar-container">
                            ${avatarHtml}
                            ${index === 0 ? '<div class="lb-badge">👑</div>' : ''}
                        </div>
                        <div class="lb-info">
                            <h4>${item.name || "Anonymous"}</h4>
                            <p>${type === 'college' ? (item.city || 'University') : (item.collegeName || "Student")}</p>
                        </div>
                    </div>

                    <div class="lb-score">
                        ${metaHtml}
                    </div>
                </div>
            `;
        }).join('');
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
};
