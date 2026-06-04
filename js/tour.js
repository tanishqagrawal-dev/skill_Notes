/**
 * SKiL MATRiX - Auto-Playing Interactive Demo Tour
 * Premium 3D animated tutorial that loops infinitely until skipped.
 * v2.0 - Fixed: Watch Demo replay, infinite loop, sidebar auto-scroll
 */

class DemoTour {
    constructor() {
        this.steps = [
            {
                target: null,
                title: "Albus Dumbledore",
                characterImg: "https://raw.githubusercontent.com/fedeperin/harry-potter-api/main/imagenes/albus_dumbledore.png",
                content: "Welcome to the Hogwarts of Code! 🪄 Sit back and watch this magical demo on how to master your premium learning hub.",
                duration: 5500
            },
            {
                target: () => document.querySelector('.nav-item[data-tab="notes"]'),
                title: "Hermione Granger",
                characterImg: "https://hp-api.onrender.com/images/hermione.jpeg",
                content: "Click 'Notes Hub' to access our restricted section. Select your Year, Branch, and Subject to conjure the exact PDFs you need.",
                duration: 6000
            },
            {
                target: () => document.querySelector('.nav-item[data-tab="coding-arena"]'),
                title: "Sirius Black",
                characterImg: "https://hp-api.onrender.com/images/sirius.JPG",
                content: "Welcome to the Coding Arena! Sharpen your wand—I mean, keyboard—and battle through coding challenges to earn legendary certificates.",
                duration: 6000
            },
            {
                target: () => document.querySelector('.nav-item[data-tab="bookmarks"]'),
                title: "Ron Weasley",
                characterImg: "https://hp-api.onrender.com/images/ron.jpg",
                content: "Use the Bookmarks tab to save important notes. It's much easier than remembering them all... bloody brilliant if you ask me!",
                duration: 6000
            },
            {
                target: () => document.querySelector('.nav-item[data-tab="planner"]'),
                title: "Minerva McGonagall",
                characterImg: "https://hp-api.onrender.com/images/mcgonagall.jpg",
                content: "The Study Planner will organize your time efficiently. Transfigure your chaotic schedule into a perfect 10 CGPA masterplan.",
                duration: 6000
            },
            {
                target: () => document.querySelector('.nav-item[data-tab="focusflow"]'),
                title: "Draco Malfoy",
                characterImg: "https://hp-api.onrender.com/images/draco.jpg",
                content: "NeuroSprint Pro (FocusFlow). Keep your focus sharp and don't get distracted by mudbloods. Deep work timers for true Slytherins.",
                duration: 6000
            },
            {
                target: () => document.querySelector('.nav-item[data-tab="ai-tools"]'),
                title: "Harry Potter",
                characterImg: "https://hp-api.onrender.com/images/harry.jpg",
                content: "Facing a dark bug? Chat with our AI Coach to cast a Patronus charm and get instant summaries, solutions, and model papers.",
                duration: 6000
            },
            {
                target: () => document.querySelector('.nav-item[data-tab="attendance"]'),
                title: "Severus Snape",
                characterImg: "https://hp-api.onrender.com/images/snape.jpg",
                content: "Attendance Pro. Track your classes carefully... do not be late, or there will be severe deductions from your house points.",
                duration: 6000
            },
            {
                target: () => document.querySelector('.nav-item[data-tab="cgpa-analyzer"]'),
                title: "Luna Lovegood",
                characterImg: "https://hp-api.onrender.com/images/luna.jpg",
                content: "Look into the crystal ball! The CGPA Analyzer simulates your scores so you know exactly what you need to hit your target grades.",
                duration: 6000
            },
            {
                target: () => document.querySelector('.nav-item[data-tab="leaderboard"]'),
                title: "Neville Longbottom",
                characterImg: "https://hp-api.onrender.com/images/neville.jpg",
                content: "Check the Leaderboard to see who's earning the most house points! Upload notes and ace the Arena to claim the King Taj crown.",
                duration: 6000
            },
            {
                target: () => document.querySelector('.upload-btn'),
                title: "Rubeus Hagrid",
                characterImg: "https://hp-api.onrender.com/images/hagrid.png",
                content: "Click the Upload button to send off your own notes! Share your magical knowledge with the rest of the students, it's safe I promise!",
                duration: 6000
            },
            {
                target: () => document.querySelector('.user-profile-mini'),
                title: "Ginny Weasley",
                characterImg: "https://hp-api.onrender.com/images/ginny.jpg",
                content: "Click your profile avatar to update your student details. Track your stats, change your picture, and Mischief Managed!",
                duration: 6000
            }
        ];

        this.currentStep = 0;
        this.isActive = false;
        this.loopTimer = null;
        this.progressAnimationFrame = null;
        this.stepStartTime = 0;
        this.stepDuration = 0;

        // Init DOM immediately, attach button listener after DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this._init());
        } else {
            this._init();
        }
    }

    _init() {
        this._buildOverlay();
        this._bindWatchDemoButton();
        window.addEventListener('resize', () => {
            if (this.isActive) this._updatePositions(false);
        });
    }

    _buildOverlay() {
        // Spotlight
        this.spotlight = document.getElementById('tour-spotlight');
        if (!this.spotlight) {
            this.spotlight = document.createElement('div');
            this.spotlight.id = 'tour-spotlight';
            document.body.appendChild(this.spotlight);
        }

        // Card
        this.card = document.getElementById('tour-card');
        if (!this.card) {
            this.card = document.createElement('div');
            this.card.id = 'tour-card';
            document.body.appendChild(this.card);
        }
        this.card.innerHTML = `
            <div class="tour-card-inner">
                <!-- Left Side: Character Poster -->
                <div class="tour-poster">
                    <img id="tour-character-img" src="" class="tour-poster-img">
                    <div class="tour-poster-overlay"></div>
                    <!-- Magical Particles overlay -->
                    <div class="tour-magical-particles">
                        <span class="particle p1"></span>
                        <span class="particle p2"></span>
                        <span class="particle p3"></span>
                        <span class="particle p4"></span>
                        <span class="particle p5"></span>
                    </div>
                </div>
                
                <!-- Right Side: Content -->
                <div class="tour-content-area">
                    <div class="tour-header">
                        <h3 id="tour-title">Loading...</h3>
                        <span class="tour-step-counter"><span id="tour-step-num">1</span> / ${this.steps.length}</span>
                    </div>
                    <div class="tour-body">
                        <p id="tour-content"></p>
                    </div>
                    
                    <!-- Bottom section -->
                    <div class="tour-bottom-section">
                        <div class="tour-progress-bar">
                            <div class="tour-progress-fill" id="tour-progress"></div>
                        </div>
                        <div class="tour-footer">
                            <div class="tour-status"><div class="dot"></div> Auto-Playing</div>
                            <button class="btn-tour-skip" id="tour-skip-btn">✕ Close</button>
                        </div>
                    </div>
                </div>
            </div>
            <!-- 3D moving magical object floating outside the card -->
            <div class="tour-3d-object"></div>
        `;

        document.getElementById('tour-skip-btn').addEventListener('click', () => this.stop());
    }

    _bindWatchDemoButton() {
        // Use event delegation — works even if button is added to DOM later
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('#watch-demo-btn');
            if (btn) {
                e.preventDefault();
                this.restart(); // Always restart from step 1
            }
        });
    }

    /** Force-restarts the tour from step 1 — used by Watch Demo button */
    restart() {
        // If currently active, stop it cleanly first
        if (this.isActive) {
            this.isActive = false;
            clearTimeout(this.loopTimer);
            cancelAnimationFrame(this.progressAnimationFrame);
        }
        this.start();
    }

    start() {
        this.isActive = true;
        this.currentStep = 0;

        // Open sidebar on mobile so elements are visible
        const sidebar = document.querySelector('.sidebar');
        if (sidebar && window.innerWidth <= 768) {
            sidebar.classList.add('active');
        }

        this.spotlight.classList.add('active');
        this.card.classList.add('active');

        this._playStep();
    }

    stop() {
        this.isActive = false;

        clearTimeout(this.loopTimer);
        cancelAnimationFrame(this.progressAnimationFrame);

        this.spotlight.classList.remove('active');
        this.card.classList.remove('active');

        // Mark as watched so auto-start doesn't re-fire
        localStorage.setItem('skilmatrix_demo_watched', 'true');

        // Close sidebar on mobile if we opened it
        const sidebar = document.querySelector('.sidebar');
        if (sidebar && window.innerWidth <= 768) {
            sidebar.classList.remove('active');
        }
    }

    _playStep() {
        if (!this.isActive) return;

        const step = this.steps[this.currentStep];

        // Magical jadhu transition effect when changing steps
        this.card.classList.add('jadhu-transition');

        // Wait a tiny bit for the blur/hide effect, then swap content
        setTimeout(() => {
            if (!this.isActive) return;
            
            // Update Card content
            document.getElementById('tour-title').innerText = step.title;
            document.getElementById('tour-content').innerText = `"${step.content}"`;
            document.getElementById('tour-step-num').innerText = this.currentStep + 1;
            
            const avatarImg = document.getElementById('tour-character-img');
            if (avatarImg && step.characterImg) {
                avatarImg.src = step.characterImg;
            }

            // Remove transition to fade back in magically
            this.card.classList.remove('jadhu-transition');

            // Reset progress bar instantly
            const bar = document.getElementById('tour-progress');
            bar.style.transition = 'none';
            bar.style.width = '0%';

            // Scroll sidebar
            this._scrollSidebarToTarget(step);
            
            // Update position
            setTimeout(() => {
                if (!this.isActive) return;
                this._updatePositions(true);

                // Animate progress bar over step duration
                this.stepDuration = step.duration;
                this.stepStartTime = performance.now();
                this._animateProgress();

                // Schedule next step
                clearTimeout(this.loopTimer);
                this.loopTimer = setTimeout(() => {
                    if (!this.isActive) return;
                    this.currentStep++;
                    if (this.currentStep >= this.steps.length) {
                        this.currentStep = 0; // ♾️ Infinite loop back to start
                    }
                    this._playStep();
                }, step.duration);
            }, 350);
        }, 300); // 300ms for jadhu transition to hit peak opacity 0
    }

    /** Scrolls the sidebar nav to make the target nav item visible */
    _scrollSidebarToTarget(step) {
        if (typeof step.target !== 'function') return;

        const targetEl = step.target();
        if (!targetEl) return;

        const nav = document.querySelector('.sidebar-nav');
        if (nav && nav.contains(targetEl)) {
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    _animateProgress() {
        if (!this.isActive) return;

        const now = performance.now();
        const elapsed = now - this.stepStartTime;
        let percent = (elapsed / this.stepDuration) * 100;
        if (percent > 100) percent = 100;

        const bar = document.getElementById('tour-progress');
        if (bar) bar.style.width = percent + '%';

        if (percent < 100) {
            this.progressAnimationFrame = requestAnimationFrame(() => this._animateProgress());
        }
    }

    _updatePositions(smooth = true) {
        const step = this.steps[this.currentStep];
        let targetEl = null;

        if (typeof step.target === 'function') {
            targetEl = step.target();
        }

        const padding = 10;

        this.spotlight.style.transition = smooth
            ? 'all 0.6s cubic-bezier(0.25, 0.8, 0.25, 1)'
            : 'none';
        this.card.style.transition = smooth
            ? 'all 0.5s cubic-bezier(0.25, 0.8, 0.25, 1)'
            : 'none';

        if (targetEl) {
            const rect = targetEl.getBoundingClientRect();

            // Move spotlight to element
            this.spotlight.style.top    = Math.max(0, rect.top - padding) + 'px';
            this.spotlight.style.left   = Math.max(0, rect.left - padding) + 'px';
            this.spotlight.style.width  = (rect.width + padding * 2) + 'px';
            this.spotlight.style.height = (rect.height + padding * 2) + 'px';

            const cardWidth  = this.card.offsetWidth  || 600;
            const cardHeight = this.card.offsetHeight || 300;
            const vw = window.innerWidth;
            const vh = window.innerHeight;

            let cardLeft, cardTop;

            // Is the target element in the LEFT sidebar (x < 250px)?
            const isInSidebar = rect.left < 250;

            if (isInSidebar) {
                // Place card to the RIGHT of the sidebar, vertically centered on the target
                cardLeft = rect.right + padding + 20;
                cardTop  = rect.top + rect.height / 2 - cardHeight / 2;
            } else {
                // For top-bar / main content items: place card BELOW the target
                cardLeft = rect.left + rect.width / 2 - cardWidth / 2;
                cardTop  = rect.bottom + padding + 16;

                // If card goes off bottom — move it ABOVE the target
                if (cardTop + cardHeight > vh - 10) {
                    cardTop = rect.top - padding - cardHeight - 16;
                }
            }

            // Clamp within viewport
            if (cardLeft + cardWidth > vw - 10) cardLeft = vw - cardWidth - 10;
            if (cardLeft < 10) cardLeft = 10;
            if (cardTop + cardHeight > vh - 10) cardTop = vh - cardHeight - 10;
            if (cardTop < 10) cardTop = 10;

            this.card.style.left = cardLeft + 'px';
            this.card.style.top  = cardTop  + 'px';

        } else {
            // Welcome step — center screen with no spotlight
            this.spotlight.style.top    = '50%';
            this.spotlight.style.left   = '50%';
            this.spotlight.style.width  = '0px';
            this.spotlight.style.height = '0px';

            const cardWidth  = this.card.offsetWidth  || 600;
            const cardHeight = this.card.offsetHeight || 300;
            this.card.style.left = Math.max(10, (window.innerWidth  / 2 - cardWidth  / 2)) + 'px';
            this.card.style.top  = Math.max(10, (window.innerHeight / 2 - cardHeight / 2)) + 'px';
        }
    }
}

// ✅ Expose globally — defer-safe because _init() waits for DOMContentLoaded
window.SKiLMatrixTour = new DemoTour();
