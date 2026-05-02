const SITE_VERSION = "5.0";
const DATA_VERSION = "notes_v5";

(function checkVersion() {
    const storedVersion = localStorage.getItem("site_version");
    if (storedVersion !== SITE_VERSION) {
        localStorage.clear();
        if ('caches' in window) {
            caches.keys().then(names => {
                names.forEach(name => caches.delete(name));
            });
        }
        localStorage.setItem("site_version", SITE_VERSION);
        // Force reload from server
        window.location.reload(true);
    }
})();

// Sample Data
const notesData = [
    {
        id: "N101",
        title: "Unit 2 – Digital Electronics Short Notes",
        college: "medicaps",
        branch: "cse",
        sem: "4",
        subject: "Digital Electronics",
        likes: 1200,
        views: 8500,
        downloads: 640,
        pages: 12,
        readTime: "20 min",
        tag: "High Exam Priority",
        fileUrl: "#"
    },
    {
        id: "N102",
        title: "Database Management Systems - Full Course",
        college: "medicaps",
        branch: "cse",
        sem: "4",
        subject: "DBMS",
        likes: 950,
        views: 7200,
        downloads: 580,
        pages: 45,
        readTime: "90 min",
        tag: "Detailed Notes",
        fileUrl: "#"
    },
    {
        id: "N103",
        title: "Operating Systems - Unit 1 & 2",
        college: "svvv",
        branch: "it",
        sem: "3",
        subject: "OS",
        likes: 800,
        views: 5400,
        downloads: 320,
        pages: 18,
        readTime: "30 min",
        tag: "Quick Revision",
        fileUrl: "#"
    },
    {
        id: "N104",
        title: "Data Structures & Algorithms - Cheat Sheet",
        college: "all",
        branch: "cse",
        sem: "3",
        subject: "DSA",
        likes: 2500,
        views: 15400,
        downloads: 1200,
        pages: 5,
        readTime: "10 min",
        tag: "Must Read",
        fileUrl: "#"
    }
];

// Initialize UI
document.addEventListener('DOMContentLoaded', () => {
    initFilters();
    renderNotes(notesData);
    animateCounters();
    initFAQ();

    // Initialize Animations
    if (window.AOS) {
        AOS.init({
            duration: 800,
            once: true
        });
    }
});

// Animate Stats Counters (Disabled as stats are now handled by stats.js real-time listener)
function animateCounters() {
    // Left empty: stats.js handles real-time updates now.
}


// FAQ Logic
function initFAQ() {
  document.querySelectorAll('.faq-header').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item   = btn.closest('.faq-item');
      const answer = item.querySelector('.faq-body');
      const icon   = btn.querySelector('.faq-toggle');
      const isOpen = item.classList.contains('active');

      // Close all open items first
      document.querySelectorAll('.faq-item.active').forEach((el) => {
        el.classList.remove('active');
        el.querySelector('.faq-body').style.maxHeight = null;
        const i = el.querySelector('.faq-toggle');
        if (i) i.style.transform = 'rotate(0deg)';
      });

      // Open clicked item if it was closed
      if (!isOpen) {
        item.classList.add('active');
        answer.style.maxHeight = answer.scrollHeight + "px";
        if (icon) icon.style.transform = 'rotate(45deg)';
      }
    });
  });
}

// Filter Logic
function initFilters() {
    const collegeSelect = document.getElementById('college-select');
    const branchSelect = document.getElementById('branch-select');
    const semSelect = document.getElementById('sem-select');
    const searchInput = document.getElementById('notes-search');

    if (!collegeSelect || !searchInput) return;

    const updateFilters = () => {
        const searchTerm = searchInput.value.toLowerCase();
        const filtered = notesData.filter(note => {
            const matchesSearch = note.title.toLowerCase().includes(searchTerm) ||
                note.subject.toLowerCase().includes(searchTerm);
            const matchesCollege = collegeSelect.value === 'all' || note.college === collegeSelect.value;
            const matchesBranch = branchSelect.value === 'all' || note.branch === branchSelect.value;
            const matchesSem = semSelect.value === 'all' || note.sem === semSelect.value;

            return matchesSearch && matchesCollege && matchesBranch && matchesSem;
        });

        // Sort by "Best for Exam" algorithm
        const sorted = filtered.sort((a, b) => calculateExamScore(b) - calculateExamScore(a));
        renderNotes(sorted);
    };

    [collegeSelect, branchSelect, semSelect].forEach(select => {
        if (select) select.addEventListener('change', updateFilters);
    });

    searchInput.addEventListener('input', updateFilters);
}

// Algorithm: ExamScore = (views * 0.3) + (downloads * 0.5) + (likes * 0.2)
function calculateExamScore(note) {
    return (note.views * 0.3) + (note.downloads * 0.5) + (note.likes * 0.2);
}

// Render Notes to grid
function renderNotes(notes) {
    const grid = document.getElementById('notes-grid');
    if (!grid) return;
    grid.innerHTML = '';

    if (notes.length === 0) {
        grid.innerHTML = `<div class="no-results">No notes found for these filters. Try another combination!</div>`;
        return;
    }

    notes.forEach(note => {
        const card = document.createElement('div');
        card.className = 'glass-card note-card';
        card.setAttribute('data-aos', 'fade-up');
        card.setAttribute('data-tilt', '');

        card.innerHTML = `
            <div class="note-tag">${note.tag}</div>
            <div class="note-subject-icon">📘</div>
            <h3>${note.title}</h3>
            <div class="note-meta">
                <span>📄 ${note.pages} Pages</span>
                <span>⏱️ ${note.readTime} read</span>
            </div>
            <div class="note-stats">
                <div class="stat">
                    <span class="stat-icon-label">👍</span>
                    <span class="stat-value">${formatNumber(note.likes)}</span>
                </div>
                <div class="stat">
                    <span class="stat-icon-label">👁️</span>
                    <span class="stat-value">${formatNumber(note.views)}</span>
                </div>
                <div class="stat">
                    <span class="stat-icon-label">⬇️</span>
                    <span class="stat-value">${formatNumber(note.downloads)}</span>
                </div>
            </div>
            <div class="note-actions">
                <button class="btn btn-primary" onclick="handleView('${note.id}')">View PDF</button>
                <button class="btn btn-ghost" onclick="handleDownload('${note.id}')">Download</button>
            </div>
        `;
        grid.appendChild(card);
    });

    // Re-initialize VanillaTilt for new elements
    if (window.VanillaTilt) {
        VanillaTilt.init(document.querySelectorAll("[data-tilt]"), {
            max: 15,
            speed: 400,
            glare: true,
            "max-glare": 0.2
        });
    }
}

// Helper: Format Numbers (e.g. 1200 -> 1.2k)
function formatNumber(num) {
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'k';
    }
    return num;
}

// Analytics Handlers
async function handleView(id) {
    console.log(`Viewing note: ${id}`);
    const note = notesData.find(n => n.id === id);
    if (note) {
        // Real-time tracking
        if (typeof window.incrementNoteView === 'function') {
            window.incrementNoteView(id);
        }

        // Local update for UI feedback
        note.views++;
        renderNotes(notesData);

        if (window.statServices && window.statServices.trackNoteView) {
            window.statServices.trackNoteView(note.id, note.college, note.subject);
        }
    }
}

async function handleDownload(id) {
    console.log(`Downloading note: ${id}`);
    const note = notesData.find(n => n.id === id);
    if (note) {
        // Real-time tracking
        if (typeof window.updateNoteStat === 'function') {
            window.updateNoteStat(id, 'download');
        }

        // Local update for UI feedback
        note.downloads++;
        renderNotes(notesData);

        if (window.statServices && window.statServices.trackNoteDownload) {
            window.statServices.trackNoteDownload(note.id);
        }
    }
}

// --- PAYMENT LOGIC ---
window.handlePayment = function () {
    alert("🚀 Redirecting to SKiL MATRiX Premium Gateway...\n\n(This makes a placeholder request as no Payment API Key was provided.)");
};

// Redundant advanced footer removed. Handled by footer.js.

/* ============================================================
   SKiL MATRiX — Enhancement Additions
   Append to bottom of js/main.js
   ============================================================ */

// --- Custom Cursor (mouse/trackpad devices only) ---
const initCustomCursor = () => {
  if (!window.matchMedia('(pointer: fine)').matches) return;
  
  const cursor = document.querySelector('.custom-cursor');
  const aura   = document.querySelector('.cursor-aura');
  if (!cursor || !aura) return;

  // Add class to hide native cursor
  document.body.classList.add('has-custom-cursor');

  // Make visible on first move
  let hasMoved = false;

  document.addEventListener('mousemove', (e) => {
    if (!hasMoved) {
      cursor.style.opacity = '1';
      aura.style.opacity = '0.4';
      hasMoved = true;
    }
    
    cursor.style.left = e.clientX + 'px';
    cursor.style.top  = e.clientY + 'px';
    
    // Slight delay on aura for trailing effect
    requestAnimationFrame(() => {
      aura.style.left = e.clientX + 'px';
      aura.style.top  = e.clientY + 'px';
    });
  });

  // Hover effects using event delegation (works for dynamic elements)
  document.addEventListener('mouseover', (e) => {
    const target = e.target.closest('a, button, .glass-card, .faq-header, .stat-item, input, select');
    if (target) {
      cursor.classList.add('hover');
      aura.classList.add('hover');
    }
  });

  document.addEventListener('mouseout', (e) => {
    const target = e.target.closest('a, button, .glass-card, .faq-header, .stat-item, input, select');
    if (target) {
      cursor.classList.remove('hover');
      aura.classList.remove('hover');
    }
  });
};

initCustomCursor();

// --- Scroll: Parallax Blobs + Back-to-Top Visibility ---
window.addEventListener('scroll', () => {
  const y = window.scrollY;

  // Parallax — only on wider screens for performance
  if (window.innerWidth > 768) {
    const blob1 = document.querySelector('.blob-1');
    const blob2 = document.querySelector('.blob-2');
    if (blob1) blob1.style.transform = `translateY(${y * 0.15}px)`;
    if (blob2) blob2.style.transform = `translateY(${y * -0.1}px)`;
  }

  // Back to top
  const btn = document.getElementById('back-to-top');
  if (btn) btn.classList.toggle('visible', y > 300);
});

// --- Back to Top: Smooth Scroll ---
const backBtn = document.getElementById('back-to-top');
if (backBtn) {
  backBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}
