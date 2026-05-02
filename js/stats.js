// Production-Ready Stats Script (LocalStorage Growth Simulation)

const START_STATS = {
    views: 10000,
    downloads: 3500,
    students: 250
};

const DAILY_GROWTH = {
    views: 85,
    downloads: 25,
    students: 5
};

function formatNumber(num) {
    if (num >= 1000) {
        const val = num / 1000;
        return (val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)) + "k+";
    }
    return num + "+";
}

const REFERENCE_DATE = new Date("2026-03-01T00:00:00Z");

export function getStats() {
    const now = new Date();
    // Calculate elapsed time in days (with fractional precision for "live" growth)
    const msPerDay = 24 * 60 * 60 * 1000;
    const elapsedDays = (now - REFERENCE_DATE) / msPerDay;

    // We only calculate if the date is after the reference date
    const multiplier = Math.max(0, elapsedDays);

    return {
        views: Math.floor(START_STATS.views + multiplier * DAILY_GROWTH.views),
        downloads: Math.floor(START_STATS.downloads + multiplier * DAILY_GROWTH.downloads),
        students: Math.floor(START_STATS.students + multiplier * DAILY_GROWTH.students)
    };
}

export function getFormattedStats(realCounts = {}) {
    const stats = getStats();
    return {
        views: formatNumber(stats.views),
        downloads: formatNumber(stats.downloads + (realCounts.downloads || 0)),
        students: formatNumber(stats.students + (realCounts.students || 0)),
        notes: formatNumber((stats.students + 120) + (realCounts.notes || 0))
    };
}

function countUp(id, target, instant = false) {
    let el = document.getElementById(id);
    if (!el) return;

    if (instant) {
        el.innerText = formatNumber(target);
        return;
    }

    let current = 0;
    let step = Math.ceil(target / 80);

    const timer = setInterval(() => {
        current += step;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        el.innerText = formatNumber(current);
    }, 20);
}

// --- MAIN INIT FUNCTION ---
export async function initRealtimeStats(realCounts = {}, instant = false) {
    console.log("🚀 Initializing Production Stats (Organic Growth)...");
    
    const stats = getStats();

    // Map the stats to all possible UI element IDs used across the site
    // Logic: Base Organic Growth + Real-time database counts
    const idMap = {
        'stat-views': stats.views,
        'stat-downloads': stats.downloads + (realCounts.downloads || 0),
        'stat-active': stats.students + (realCounts.students || 0),
        'stat-notes': (stats.students + 120) + (realCounts.notes || 0), 
        'liveStudents': stats.students + (realCounts.students || 0),
        'globalDownloads': stats.downloads + (realCounts.downloads || 0),
        'trendingNow': 12,
        'views': stats.views,
        'downloads': stats.downloads + (realCounts.downloads || 0),
        'students': stats.students + (realCounts.students || 0)
    };

    if (window.statServices) {
        window.statServices.currentStats = idMap;
        window.statServices.ready = true;
    }

    for (const [id, value] of Object.entries(idMap)) {
        countUp(id, value, instant);
    }
}

// --- BACKWARD COMPATIBILITY STUBS ---
// These ensure that existing calls in main.js and other files don't break.

export function trackPageView() {
    // Simulated: Logic could increment localStorage views if desired, 
    // but the user wants linear growth based on daily visits.
}

export function trackDownload() {
    // Optional: Increment local counter per-session
}

export function trackGlobalLike(amount = 1) {
    // No-op or handle via separate local storage key if persistent likes are needed
}

export function trackNoteDownload(noteId) {
    if (typeof gtag === 'function') {
        gtag('event', 'notes_download', { note_id: noteId });
    }
}

export function trackNoteView(noteId) {
    if (typeof gtag === 'function') {
        gtag('event', 'notes_view', { note_id: noteId });
    }
}

window.statServices = {
    initRealtimeStats,
    getStats,
    getFormattedStats,
    trackPageView,
    trackDownload,
    trackGlobalLike,
    trackNoteDownload,
    trackNoteView,
    updateUI: () => { }
};

/* ============================================================
   SKiL MATRiX — Live Counter Tick
   Append after existing stats initialization in js/stats.js
   ============================================================ */

function startLiveTick() {
  setInterval(() => {
    // Skip updates when user is on a different tab
    if (document.hidden) return;

    const viewsEl     = document.querySelector('[data-stat="views"]');
    const downloadsEl = document.querySelector('[data-stat="downloads"]');

    if (viewsEl) {
      const currentText = viewsEl.textContent.trim();
      // Handle the "k+" format if present
      let currentVal = 0;
      if (currentText.includes('k')) {
          currentVal = parseFloat(currentText.replace('k+', '')) * 1000;
      } else {
          currentVal = parseInt(currentText.replace(/,/g, '')) || 0;
      }
      
      const bump    = Math.floor(Math.random() * 3) + 1; // +1 to +3
      const newVal = currentVal + bump;
      
      // Update with original formatting logic if needed, or just standard localestring
      if (newVal >= 1000) {
          const val = newVal / 1000;
          viewsEl.textContent = (val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)) + "k+";
      } else {
          viewsEl.textContent = newVal.toLocaleString() + "+";
      }
    }

    if (downloadsEl) {
      // Downloads tick less frequently (~40% of intervals)
      if (Math.random() > 0.6) {
        const currentText = downloadsEl.textContent.trim();
        let currentVal = 0;
        if (currentText.includes('k')) {
            currentVal = parseFloat(currentText.replace('k+', '')) * 1000;
        } else {
            currentVal = parseInt(currentText.replace(/,/g, '')) || 0;
        }
        
        const newVal = currentVal + 1;
        
        if (newVal >= 1000) {
            const val = newVal / 1000;
            downloadsEl.textContent = (val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)) + "k+";
        } else {
            downloadsEl.textContent = newVal.toLocaleString() + "+";
        }
      }
    }

  }, 4000 + Math.random() * 3000); // Random interval: 4–7 seconds
}

startLiveTick();
