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
        <div class="tab-pane active fade-in" style="padding: 2rem;">
            <!-- Header -->
            <div style="margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: end;">
                <div>
                    <h1 class="font-heading">🏆 Advanced <span class="gradient-text">Leaderboard</span></h1>
                    <p style="color: var(--text-dim);">Compete, contribute, and track your academic standing in real-time.</p>
                </div>
                <!-- Controls -->
                <div class="leaderboard-controls glass-card">
                    <div class="lb-tabs">
                        <div class="lb-tab active" data-type="user">🧑🎓 Students</div>
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
                    <div class="personal-rank-card">
                        <div style="position: relative; z-index: 2;">
                            <h4 style="margin-bottom: 1rem; color: white;">Your Standing</h4>
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

    // Get Data
    let data = LeaderboardData[type] || [];

    // Simulate Score Variation based on time filter
    if (timeframe === 'today') data = data.map(d => ({ ...d, score: Math.round(d.score * 0.1) }));
    if (timeframe === 'week') data = data.map(d => ({ ...d, score: Math.round(d.score * 0.5) }));

    // Sort
    data.sort((a, b) => b.score - a.score);

    list.innerHTML = data.map((item, index) => {
        const rankClass = index < 3 ? `top-3 rank-${index + 1}` : '';
        const rankDisplay = `#${index + 1}`;
        const avatar = item.avatar ? `<img src="${item.avatar}">` : (item.name[0]);
        const logo = item.logo ? item.logo : (item.name[0]);

        // Different meta based on type
        let metaHtml = '';
        if (type === 'student') metaHtml = `<span class="score-val">${item.score} XP</span><span class="score-label">${item.views} views</span>`;
        if (type === 'contributor') metaHtml = `<span class="score-val">${item.score} pts</span><span class="score-label">${item.downloads} downloads</span>`;
        if (type === 'college') metaHtml = `<span class="score-val">${formatNumber(item.views)}</span><span class="score-label">total views</span>`;

        return `
            <div class="lb-entry ${rankClass}">
                <div class="lb-rank ${rankClass}">${index < 3 ? ['🥇', '🥈', '🥉'][index] : rankDisplay}</div>
                <div class="lb-user">
                    <div class="lb-avatar">${type === 'college' ? logo : avatar} 
                        ${index === 0 ? '<div class="badge-mini">👑</div>' : ''}
                    </div>
                    <div class="lb-info">
                        <h4>${item.name}</h4>
                        <p>${type === 'college' ? item.students + ' Students' : 'Medi-Caps University'}</p>
                    </div>
                </div>
                <div class="lb-score">
                    ${metaHtml}
                </div>
            </div>
        `;
    }).join('');
}

function startActivityFeed() {
    const feed = document.getElementById('activity-feed');
    if (!feed) return;

    const activities = [
        { icon: '👁️', text: '<strong>Riya</strong> viewed Digital Electronics', time: 'Just now' },
        { icon: '📤', text: '<strong>Ankit</strong> uploaded a new note', time: '2 mins ago' },
        { icon: '🏆', text: '<strong>Tanishq</strong> reached Rank #1', time: '5 mins ago' },
        { icon: '⬇️', text: '<strong>Rahul</strong> downloaded OS Unit 4', time: '12 mins ago' },
        { icon: '🔥', text: 'New streak started by <strong>Sneha</strong>', time: '15 mins ago' }
    ];

    // Initial fill
    feed.innerHTML = activities.map(act => createActivityHTML(act)).join('');

    // Add new activity every few seconds
    setInterval(() => {
        const randomAct = activities[Math.floor(Math.random() * activities.length)];
        const el = document.createElement('div');
        el.className = 'activity-item';
        el.innerHTML = `
            <div class="activity-icon">${randomAct.icon}</div>
            <div class="activity-text">
                ${randomAct.text}
                <span class="activity-meta">Just now</span>
            </div>
        `;
        feed.insertBefore(el, feed.firstChild);
        if (feed.children.length > 6) feed.lastChild.remove();
    }, 4000);
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
