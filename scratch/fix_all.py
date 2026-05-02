import os
import re

# 1. Update main.css
with open('css/main.css', 'a', encoding='utf-8') as f:
    f.write('''
/* --- Premium How It Works Cards --- */
.step-card-premium {
    position: relative;
    background: rgba(15, 20, 28, 0.7);
    border-radius: 20px;
    padding: 2.5rem 1.5rem;
    text-align: center;
    overflow: hidden;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    transition: transform 0.3s ease;
}

.step-card-premium:hover {
    transform: translateY(-5px);
}

/* The running border effect */
.step-card-premium::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: conic-gradient(
        transparent, 
        transparent, 
        transparent, 
        #ffffff, 
        #00f2ff, 
        transparent
    );
    animation: rotate-border 4s linear infinite;
    z-index: -2;
}

.step-card-premium::after {
    content: '';
    position: absolute;
    inset: 2px;
    background: #0f141c;
    border-radius: 18px;
    z-index: -1;
}

@keyframes rotate-border {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.step-number-premium {
    font-size: 3.5rem;
    font-weight: 900;
    background: linear-gradient(135deg, #a27cf6, #f355a2, #00f2ff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    opacity: 0.9;
    margin-bottom: 0.5rem;
    text-shadow: 0 0 20px rgba(162, 124, 246, 0.4);
}

.step-icon-premium {
    font-size: 3rem;
    margin-bottom: 1.5rem;
    filter: drop-shadow(0 0 15px rgba(255, 255, 255, 0.2));
}

.step-card-premium h3 {
    font-size: 1.5rem;
    color: #ffffff;
    margin-bottom: 1rem;
    font-weight: 800;
}

.step-card-premium p {
    color: var(--text-muted);
    line-height: 1.6;
    font-size: 0.95rem;
}
''')

# 2. Update index.html
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Update How It Works section
old_how_it_works = '''        <div class="steps-grid">
            <div class="glass-card step-card" data-aos="fade-up" data-aos-delay="100">
                <div class="step-number">01</div>
                <div class="feature-icon"><i class="fas fa-code-branch"></i></div>
                <h3>Pick Your Branch & Year</h3>
                <p>Tell us your stream and semester. SKiL MATRiX instantly filters everything to what's relevant for you.</p>
            </div>
            <div class="glass-card step-card" data-aos="fade-up" data-aos-delay="200">
                <div class="step-number">02</div>
                <div class="feature-icon"><i class="fas fa-book-open"></i></div>
                <h3>Access Notes & AI Tools</h3>
                <p>Browse curated notes, generate model papers, and fire questions at the AI Doubt Solver - all in one place.</p>
            </div>
            <div class="glass-card step-card" data-aos="fade-up" data-aos-delay="300">
                <div class="step-number">03</div>
                <div class="feature-icon"><i class="fas fa-chart-line"></i></div>
                <h3>Track Your Progress</h3>
                <p>Your dashboard logs every note read and query solved so you can see real improvement week over week.</p>
            </div>
        </div>'''

new_how_it_works = '''        <div class="steps-grid">
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
        </div>'''

if old_how_it_works in html:
    html = html.replace(old_how_it_works, new_how_it_works)
else:
    print("Warning: Could not find old How It Works section.")

# Update FAQs
old_faq = '''        <div class="glass-card faq-container" data-aos="fade-up" data-aos-delay="100">

            <div class="faq-item">
                <div class="faq-header">
                    <h3>What is SKiL MATRiX Notes?</h3>
                    <span class="faq-toggle">+</span>
                </div>
                <div class="faq-body">
                    <p>SKiL MATRiX Notes is an advanced academic platform designed for students. We provide curated
                        notes, AI-assisted learning tools, and comprehensive performance tracking to help you excel in
                        your exams.</p>
                </div>
            </div>

            <div class="faq-item">
                <div class="faq-header">
                    <h3>Is the platform free to use?</h3>
                    <span class="faq-toggle">+</span>
                </div>
                <div class="faq-body">
                    <p>Yes! Our "Admit Card" plan is completely free and gives you access to unlimited note viewing,
                        basic dashboard features, and limited AI queries. We also offer a "Scholar PRO" plan for
                        advanced features.</p>
                </div>
            </div>

            <div class="faq-item">
                <div class="faq-header">
                    <h3>How does the AI Doubt Solver work?</h3>
                    <span class="faq-toggle">+</span>
                </div>
                <div class="faq-body">
                    <p>Our AI Doubt Solver is built on a fine-tuned model specifically trained on academic engineering
                        curricula. You can ask questions related to your subjects, and it provides instant, accurate
                        explanations and examples.</p>
                </div>
            </div>

            <div class="faq-item">
                <div class="faq-header">
                    <h3>Can I upload my own notes?</h3>
                    <span class="faq-toggle">+</span>
                </div>
                <div class="faq-body">
                    <p>Currently, note uploads are by invitation or selection only to ensure quality. However, we are
                        launching a "Contributor" program soon where top students can share their notes and earn
                        rewards.</p>
                </div>
            </div>

            <div class="faq-item">
                <div class="faq-header">
                    <h3>What is included in the Scholar PRO plan?</h3>
                    <span class="faq-toggle">+</span>
                </div>
                <div class="faq-body">
                    <p>Scholar PRO includes unlimited AI Model Paper generation, deep performance analytics, a verified
                        badge, priority support, and a completely ad-free experience for just ₹99/month.</p>
                </div>
            </div>

            <div class="faq-item">
                <div class="faq-header">
                    <h3>How do I track my progress?</h3>
                    <span class="faq-toggle">+</span>
                </div>
                <div class="faq-body">
                    <p>Your Dashboard provides a visual representation of your study habits, including notes read, time
                        spent, and subject-wise completion rates, helping you stay on top of your semester goals.</p>
                </div>
            </div>

            <div class="faq-item">
                <div class="faq-header">
                    <h3>Is my data secure?</h3>
                    <span class="faq-toggle">+</span>
                </div>
                <div class="faq-body">
                    <p>Absolutely. We use industry-standard encryption to protect your personal information. Your
                        learning data is used solely to personalize your experience and improve our recommendations.</p>
                </div>
            </div>

        </div>'''

new_faq = '''        <div class="glass-card faq-container" data-aos="fade-up" data-aos-delay="100">

            <div class="faq-item">
                <div class="faq-header">
                    <h3>What is SKiL MATRiX Notes?</h3>
                    <span class="faq-toggle">+</span>
                </div>
                <div class="faq-body">
                    <p>SKiL MATRiX Notes is an advanced academic platform designed for students. We provide curated notes, AI-assisted learning tools, and comprehensive performance tracking to help you excel in your exams.</p>
                </div>
            </div>

            <div class="faq-item">
                <div class="faq-header">
                    <h3>What tools are included in SKiL MATRiX Notes?</h3>
                    <span class="faq-toggle">+</span>
                </div>
                <div class="faq-body">
                    <p>SKiL MATRiX Notes is an all-in-one academic command center. It features an extensive <b>Notes Hub</b>, <b>Attendance Pro</b> for tracking classes, a <b>CGPA Analyzer</b>, and a comprehensive <b>Study Planner</b> to help you organize your entire semester.</p>
                </div>
            </div>

            <div class="faq-item">
                <div class="faq-header">
                    <h3>How can the AI features help me prepare for exams?</h3>
                    <span class="faq-toggle">+</span>
                </div>
                <div class="faq-body">
                    <p>We provide two powerful AI tools: The <b>AI Coach</b> acts as your personal tutor to clarify doubts and build personalized study guides. Additionally, our <b>Model Paper Generator</b> creates custom, AI-powered practice exams tailored exactly to your university's syllabus.</p>
                </div>
            </div>

            <div class="faq-item">
                <div class="faq-header">
                    <h3>Does the platform help me stay focused while studying?</h3>
                    <span class="faq-toggle">+</span>
                </div>
                <div class="faq-body">
                    <p>Yes! We designed <b>FocusFlow Pro</b> specifically for deep work. It combines a customizable Pomodoro timer with curated lo-fi beats, ensuring you stay in the zone without distractions.</p>
                </div>
            </div>

            <div class="faq-item">
                <div class="faq-header">
                    <h3>Can I upload my own notes?</h3>
                    <span class="faq-toggle">+</span>
                </div>
                <div class="faq-body">
                    <p>Currently, note uploads are by invitation or selection only to ensure quality. However, we are launching a "Contributor" program soon where top students can share their notes and earn rewards.</p>
                </div>
            </div>

            <div class="faq-item">
                <div class="faq-header">
                    <h3>Is the platform free to use?</h3>
                    <span class="faq-toggle">+</span>
                </div>
                <div class="faq-body">
                    <p>The core features—including the Notes Hub, Bookmarks, and basic productivity tracking—are completely free. For unlimited AI generation, deep CGPA analytics, and an ad-free experience, you can upgrade to the <b>Scholar PRO</b> plan.</p>
                </div>
            </div>

            <div class="faq-item">
                <div class="faq-header">
                    <h3>How do I track my overall academic performance?</h3>
                    <span class="faq-toggle">+</span>
                </div>
                <div class="faq-body">
                    <p>Your personalized dashboard acts as your central hub. It provides a visual representation of your study streaks, attendance metrics, and grade predictions via the CGPA Analyzer, helping you stay ahead of your academic goals.</p>
                </div>
            </div>

            <div class="faq-item">
                <div class="faq-header">
                    <h3>Is my data secure?</h3>
                    <span class="faq-toggle">+</span>
                </div>
                <div class="faq-body">
                    <p>Absolutely. We use industry-standard encryption to protect your personal information. Your learning data is used solely to personalize your experience and improve our recommendations.</p>
                </div>
            </div>

        </div>'''

if old_faq in html:
    html = html.replace(old_faq, new_faq)
else:
    print("Warning: Could not find old FAQ section.")


# Update Features block (Adding the 2 new ones)
old_features = '''            <div class="qa-card-wrapper stagger-box" data-aos="zoom-in" data-aos-delay="500" onclick="location.href='pages/dashboard.html?tab=attendance'">
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
        </div>'''

new_features = '''            <div class="qa-card-wrapper stagger-box" data-aos="zoom-in" data-aos-delay="500" onclick="location.href='pages/dashboard.html?tab=attendance'">
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
                    <div class="qa-desc">Generate AI-powered practice papers</div>
                </div>
            </div>
        </div>'''

if old_features in html:
    html = html.replace(old_features, new_features)
else:
    print("Warning: Could not find old Features section.")

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("index.html fully rebuilt!")
