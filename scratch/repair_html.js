const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');

const prefix = html.substring(0, html.indexOf('<!-- Features Section -->'));
const suffix = html.substring(html.indexOf('<!-- Pricing Section -->') !== -1 ? html.indexOf('<!-- Pricing Section -->') : html.indexOf('<!-- FAQ Section -->'));

const middle = `<!-- Features Section -->
    <section id="features" class="features container">
        <h2 class="section-title" data-aos="fade-up">Why <span class="gradient-text">SKiL MATRiX?</span></h2>
        <div class="features-grid">
            <div class="qa-card-wrapper stagger-box" data-aos="zoom-in" data-aos-delay="100" onclick="location.href='pages/dashboard.html#/notes'">
                <div class="hud-corner top-left"></div>
                <div class="qa-icon-box qa-icon-blue">📚</div>
                <div class="qa-info">
                    <div class="qa-title">Notes Hub</div>
                    <div class="qa-desc">Curated engineering notes</div>
                </div>
            </div>
            <div class="qa-card-wrapper stagger-box" data-aos="zoom-in" data-aos-delay="200" onclick="location.href='pages/dashboard.html?tab=ai-doubt'">
                <div class="hud-corner top-left"></div>
                <div class="qa-icon-box qa-icon-purple">🤖</div>
                <div class="qa-info">
                    <div class="qa-title">AI Coach</div>
                    <div class="qa-desc">Instant doubt solving</div>
                </div>
            </div>
            <div class="qa-card-wrapper stagger-box" data-aos="zoom-in" data-aos-delay="300" onclick="location.href='pages/dashboard.html?tab=cgpa'">
                <div class="hud-corner top-left"></div>
                <div class="qa-icon-box qa-icon-cyan">📈</div>
                <div class="qa-info">
                    <div class="qa-title">CGPA Analyzer</div>
                    <div class="qa-desc">Track & predict grades</div>
                </div>
            </div>
            <div class="qa-card-wrapper stagger-box" data-aos="zoom-in" data-aos-delay="400" onclick="location.href='pages/dashboard.html?tab=focus'">
                <div class="hud-corner top-left"></div>
                <div class="qa-icon-box qa-icon-green">🎯</div>
                <div class="qa-info">
                    <div class="qa-title">FocusFlow Pro</div>
                    <div class="qa-desc">Deep work timer</div>
                </div>
            </div>
            <div class="qa-card-wrapper stagger-box" data-aos="zoom-in" data-aos-delay="500" onclick="location.href='pages/dashboard.html?tab=attendance'">
                <div class="hud-corner top-left"></div>
                <div class="qa-icon-box qa-icon-pink">📅</div>
                <div class="qa-info">
                    <div class="qa-title">Attendance Pro</div>
                    <div class="qa-desc">Keep your 75% safely</div>
                </div>
            </div>
            <div class="qa-card-wrapper stagger-box" data-aos="zoom-in" data-aos-delay="600" onclick="location.href='pages/dashboard.html?tab=bookmarks'">
                <div class="hud-corner top-left"></div>
                <div class="qa-icon-box qa-icon-gold">🔖</div>
                <div class="qa-info">
                    <div class="qa-title">Bookmarks</div>
                    <div class="qa-desc">Your saved resources</div>
                </div>
            </div>
            <div class="qa-card-wrapper stagger-box" data-aos="zoom-in" data-aos-delay="700" onclick="location.href='pages/dashboard.html?tab=planner'">
                <div class="hud-corner top-left"></div>
                <div class="qa-icon-box qa-icon-orange">📅</div>
                <div class="qa-info">
                    <div class="qa-title">Study Planner</div>
                    <div class="qa-desc">Organize your study schedule</div>
                </div>
            </div>
            <div class="qa-card-wrapper stagger-box" data-aos="zoom-in" data-aos-delay="800" onclick="location.href='pages/dashboard.html?tab=ai-generator'">
                <div class="hud-corner top-left"></div>
                <div class="qa-icon-box qa-icon-indigo">📝</div>
                <div class="qa-info">
                    <div class="qa-title">Model Paper Generator</div>
                    <div class="qa-desc">Generate practice exams</div>
                </div>
            </div>
        </div>
    </section>

    <div class="gradient-separator"></div>

    <!-- How It Works Section -->
    <section id="how-it-works" class="section container">
        <h2 class="section-title" data-aos="fade-up">How <span class="gradient-text">It Works</span></h2>
        <p class="section-subtitle" data-aos="fade-up">Start learning smarter in three steps</p>
        <div class="steps-grid">
            <div class="step-card-premium" data-aos="fade-up" data-aos-delay="100">
                <div class="step-number-premium">01</div>
                <div class="step-icon-premium">🎯</div>
                <h3>Pick Your Branch</h3>
                <p>Tell us your stream and semester. SKiL MATRiX instantly filters everything to what's relevant for you.</p>
            </div>
            <div class="step-card-premium" data-aos="fade-up" data-aos-delay="200">
                <div class="step-number-premium">02</div>
                <div class="step-icon-premium">🚀</div>
                <h3>Access AI Tools</h3>
                <p>Browse curated notes, generate model papers, and fire questions at the AI Doubt Solver — all in one place.</p>
            </div>
            <div class="step-card-premium" data-aos="fade-up" data-aos-delay="300">
                <div class="step-number-premium">03</div>
                <div class="step-icon-premium">📈</div>
                <h3>Track Progress</h3>
                <p>Your dashboard logs every note read and query solved so you can see real improvement week over week.</p>
            </div>
        </div>
    </section>

    <div class="gradient-separator"></div>

    <!-- Student Testimonials Section -->
    <section id="testimonials" class="section container">
        <h2 class="section-title" data-aos="fade-up">Loved by <span class="gradient-text">Students</span></h2>
        <p class="section-subtitle" data-aos="fade-up">Real results from real learners</p>
        <div class="testimonials-grid">
            <div class="glass-card testimonial-card" data-aos="fade-up" data-aos-delay="100">
                <p class="testimonial-text">"The AI Doubt Solver explained pointers better than my professor did in 3 lectures. Cleared my concept in 10 minutes."</p>
                <div class="testimonial-author">
                    <div class="author-avatar">RS</div>
                    <div>
                        <strong>Rahul S.</strong>
                        <span>CSE, 3rd Year</span>
                    </div>
                </div>
            </div>
            <div class="glass-card testimonial-card" data-aos="fade-up" data-aos-delay="200">
                <p class="testimonial-text">"Generated a full model paper for OS one day before my exam. Got exactly the kind of questions that came. Lifesaver."</p>
                <div class="testimonial-author">
                    <div class="author-avatar">PK</div>
                    <div>
                        <strong>Priya K.</strong>
                        <span>IT, 2nd Year</span>
                    </div>
                </div>
            </div>
            <div class="glass-card testimonial-card" data-aos="fade-up" data-aos-delay="300">
                <p class="testimonial-text">"Finally a platform that actually understands engineering syllabus. Notes are clean, organized, and actually match what's in the exam."</p>
                <div class="testimonial-author">
                    <div class="author-avatar">AM</div>
                    <div>
                        <strong>Arjun M.</strong>
                        <span>ECE, 4th Year</span>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <div class="gradient-separator"></div>

    `;

fs.writeFileSync('index.html', prefix + middle + suffix);
console.log("Reconstructed index.html successfully");
